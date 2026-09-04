---
title: Playwright E2E 测试详解
description: 深入理解 Playwright：页面对象模式、选择器、断言、Fixtures、并行测试与视觉对比
track: javascript
section: patterns-tooling
difficulty: intermediate
tags:
  - JavaScript
  - Playwright
  - E2E测试
  - 自动化测试
  - 测试框架
status: imported
origin: old/src/content/docs/javascript/playwright.en.md
divergence: 0.215
issues:
  - title-lang-en
  - title-language
legacy:
  category: JavaScript
  subcategory: 测试
  order: 50
  lastUpdated: 2026-01-07
---

## Concept Explanation

Playwright is a modern end-to-end (E2E) testing framework developed by Microsoft that supports automated testing across Chromium, Firefox, and WebKit browsers. It provides a powerful API to simulate real user behavior in browsers, helping developers verify the functionality and user experience of web applications.

### Why Choose Playwright

1. **Cross-browser Support**: One codebase to test Chrome, Firefox, Safari
2. **Auto-waiting**: Built-in intelligent waiting mechanism, no need for manual sleeps
3. **Reliability**: Direct communication via browser protocols for high stability
4. **Parallel Execution**: Out-of-the-box parallel testing support
5. **Rich Toolchain**: Code generator, debugger, trace viewer
6. **Network Interception**: Supports API mocking and network request interception

### Historical Background

Playwright was released by Microsoft in 2020, with its core team members coming from Google's Puppeteer project. Playwright made significant improvements over Puppeteer, adding cross-browser support and more powerful testing capabilities.

## Core Principles

### Architecture Design

Playwright uses a client-server architecture:

```
┌─────────────────┐     ┌──────────────────┐
│   Test Code     │ ──► │  Playwright      │
│   (Node.js)     │     │  Server          │
└─────────────────┘     └──────────────────┘
                                │
                    ┌───────────┼───────────┐
                    │           │           │
                    ▼           ▼           ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ Chromium │ │ Firefox  │ │ WebKit   │
              └──────────┘ └──────────┘ └──────────┘
```

### Browser Context Isolation

Playwright's BrowserContext provides completely isolated browser sessions:

```javascript
// Each Context has its own cookies, localStorage, cache, etc.
const context1 = await browser.newContext();
const context2 = await browser.newContext();

// context1 and context2 are completely isolated
const page1 = await context1.newPage();
const page2 = await context2.newPage();
```

### Auto-waiting Mechanism

Playwright automatically waits for elements to meet specific conditions before performing actions:

1. **Attached**: Element is attached to the DOM
2. **Visible**: Element is visible
3. **Stable**: Element position is stable (no animation)
4. **Enabled**: Element is interactable
5. **Editable**: Input field is editable (for input operations)

```javascript
// Playwright automatically waits for the button to be clickable
await page.click('button#submit');

// No need to add manual waits
// Wrong approach:
// await page.waitForTimeout(1000);
// await page.click('button#submit');
```

## Core Essentials

### Project Initialization

```bash
# Create a new Playwright project
npm init playwright@latest

# Directory structure
my-project/
├── tests/
│   └── example.spec.ts
├── playwright.config.ts
├── package.json
└── tests-examples/
    └── demo-todo-app.spec.ts
```

### Configuration File

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests',

  // Timeout for each test
  timeout: 30 * 1000,

  // Timeout for expect assertions
  expect: {
    timeout: 5000
  },

  // Run tests in parallel
  fullyParallel: true,

  // Fail on CI if test.only is used
  forbidOnly: !!process.env.CI,

  // Retry count
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: 'html',

  // Shared configuration for all projects
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot strategy
    screenshot: 'only-on-failure',

    // Video recording
    video: 'retain-on-failure',
  },

  // Multi-browser configuration
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Local development server configuration
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('successful login', async ({ page }) => {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('Welcome');
  });

  test('failed login shows error message', async ({ page }) => {
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Invalid username or password');
  });
});
```

## Code Examples

### Selectors

Playwright provides multiple selector strategies, with semantic selectors being recommended:

```typescript
import { test, expect } from '@playwright/test';

test('selector examples', async ({ page }) => {
  await page.goto('/form');

  // ============ Recommended Selectors ============

  // 1. getByRole - Based on ARIA roles (most recommended)
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill('admin');
  await page.getByRole('checkbox', { name: 'Remember me' }).check();
  await page.getByRole('link', { name: 'Forgot password' }).click();

  // 2. getByLabel - Based on label association
  await page.getByLabel('Email address').fill('user@example.com');
  await page.getByLabel('Password').fill('secret123');

  // 3. getByPlaceholder - Based on placeholder
  await page.getByPlaceholder('Enter search keywords').fill('Playwright');

  // 4. getByText - Based on text content
  await page.getByText('Register now').click();
  await page.getByText(/Welcome.*login/).isVisible();

  // 5. getByAltText - Based on alt attribute
  await page.getByAltText('Company Logo').click();

  // 6. getByTitle - Based on title attribute
  await page.getByTitle('Settings').click();

  // 7. getByTestId - Based on data-testid (requires configuration)
  await page.getByTestId('submit-button').click();

  // ============ CSS Selectors ============

  await page.locator('.login-form').isVisible();
  await page.locator('#username').fill('admin');
  await page.locator('[data-cy="password"]').fill('secret');
  await page.locator('button.primary:not([disabled])').click();

  // ============ XPath Selectors ============

  await page.locator('//button[contains(text(), "Submit")]').click();
  await page.locator('//div[@class="container"]//input').fill('value');

  // ============ Chained Selectors ============

  // Find within a specific container
  const form = page.locator('.login-form');
  await form.locator('input[name="username"]').fill('admin');
  await form.locator('button[type="submit"]').click();

  // Combined filtering
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Todo item' })
    .getByRole('button', { name: 'Delete' })
    .click();

  // ============ Index Selectors ============

  // Get first/last/nth element
  await page.locator('.item').first().click();
  await page.locator('.item').last().click();
  await page.locator('.item').nth(2).click(); // Third element (0-indexed)
});
```

### Assertions

```typescript
import { test, expect } from '@playwright/test';

test('assertion examples', async ({ page }) => {
  await page.goto('/products');

  // ============ Page-level Assertions ============

  // URL assertions
  await expect(page).toHaveURL('/products');
  await expect(page).toHaveURL(/.*products.*/);

  // Title assertions
  await expect(page).toHaveTitle('Product List');
  await expect(page).toHaveTitle(/Product/);

  // ============ Element Visibility Assertions ============

  const header = page.locator('h1');
  await expect(header).toBeVisible();
  await expect(header).toBeHidden();
  await expect(header).toBeAttached();
  await expect(header).toBeDetached();

  // ============ Element State Assertions ============

  const button = page.getByRole('button', { name: 'Submit' });
  await expect(button).toBeEnabled();
  await expect(button).toBeDisabled();

  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).not.toBeChecked();

  const input = page.getByLabel('Username');
  await expect(input).toBeEditable();
  await expect(input).toBeFocused();
  await expect(input).toBeEmpty();

  // ============ Text Content Assertions ============

  const message = page.locator('.message');
  await expect(message).toHaveText('Operation successful');
  await expect(message).toHaveText(/successful/);
  await expect(message).toContainText('successful');

  // Multiple element text assertions
  const items = page.locator('.list-item');
  await expect(items).toHaveText(['Apple', 'Banana', 'Orange']);
  await expect(items).toContainText(['Apple', 'Orange']);

  // ============ Attribute Assertions ============

  const link = page.getByRole('link', { name: 'Home' });
  await expect(link).toHaveAttribute('href', '/');
  await expect(link).toHaveAttribute('target', '_blank');

  const element = page.locator('.card');
  await expect(element).toHaveClass('card active');
  await expect(element).toHaveClass(/active/);
  await expect(element).toHaveId('main-card');

  const inputField = page.getByLabel('Quantity');
  await expect(inputField).toHaveValue('10');

  // CSS property assertions
  await expect(element).toHaveCSS('display', 'flex');
  await expect(element).toHaveCSS('color', 'rgb(0, 0, 0)');

  // ============ Count Assertions ============

  const products = page.locator('.product-card');
  await expect(products).toHaveCount(12);

  // ============ Screenshot Assertions (Visual Comparison) ============

  await expect(page).toHaveScreenshot('products-page.png');
  await expect(element).toHaveScreenshot('product-card.png');

  // ============ Soft Assertions (Don't Fail Immediately) ============

  await expect.soft(header).toBeVisible();
  await expect.soft(button).toBeEnabled();
  // Even if previous assertions fail, the following code will continue to execute

  // ============ Custom Timeout ============

  await expect(element).toBeVisible({ timeout: 10000 });

  // ============ Polling Assertions ============

  // Wait for a condition to be true (for complex scenarios)
  await expect.poll(async () => {
    const count = await page.locator('.item').count();
    return count;
  }).toBe(5);

  // ============ Generic Value Assertions ============

  const text = await page.textContent('.message');
  expect(text).toBe('Hello');
  expect(text).toContain('ello');
  expect(text).toMatch(/^Hello/);

  const count = await page.locator('.item').count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(10);
});
```

### Page Object Model

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.locator('.error-message');
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: 'Remember me' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string, rememberMe = false) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}

// pages/DashboardPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;
  readonly userMenu: Locator;
  readonly sidebarItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('.welcome-message');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.userMenu = page.getByRole('button', { name: 'User Menu' });
    this.sidebarItems = page.locator('.sidebar-item');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectWelcomeMessage(username: string) {
    await expect(this.welcomeMessage).toContainText(`Welcome, ${username}`);
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
    await expect(this.page).toHaveURL('/login');
  }

  async navigateTo(menuItem: string) {
    await this.sidebarItems.filter({ hasText: menuItem }).click();
  }
}

// pages/index.ts - Page object exports
export { LoginPage } from './LoginPage';
export { DashboardPage } from './DashboardPage';

// tests/login.spec.ts - Using page objects
import { test } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

test.describe('User Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('successful login and view dashboard', async () => {
    await loginPage.login('admin', 'password123');
    await loginPage.expectLoginSuccess();
    await dashboardPage.expectWelcomeMessage('admin');
  });

  test('failed login shows error message', async () => {
    await loginPage.login('wrong', 'wrong');
    await loginPage.expectErrorMessage('Invalid username or password');
  });

  test('remember me functionality', async () => {
    await loginPage.login('admin', 'password123', true);
    await loginPage.expectLoginSuccess();
  });
});
```

### Fixtures

```typescript
// fixtures/auth.fixture.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

// Define fixture types
type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: DashboardPage;
};

// Extend base test
export const test = base.extend<AuthFixtures>({
  // Basic page object fixtures
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Set up authentication state
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'password123');

    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);

    // Cleanup: logout
    await dashboardPage.logout();
  },
});

export { expect } from '@playwright/test';

// fixtures/database.fixture.ts
import { test as base } from '@playwright/test';

type DatabaseFixtures = {
  testUser: { id: string; username: string; email: string };
  cleanupDatabase: void;
};

export const test = base.extend<DatabaseFixtures>({
  // Create test user
  testUser: async ({}, use) => {
    // Create user in database
    const user = await createTestUser({
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
    });

    await use(user);

    // Delete user after test
    await deleteTestUser(user.id);
  },

  // Database cleanup fixture
  cleanupDatabase: [async ({}, use) => {
    await use();
    // Clean up database after test
    await resetTestDatabase();
  }, { auto: true }], // auto: true means automatically applied
});

// fixtures/combined.fixture.ts - Combining multiple fixtures
import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as databaseTest } from './database.fixture';

export const test = mergeTests(authTest, databaseTest);
export { expect } from '@playwright/test';

// tests/user-profile.spec.ts - Using fixtures
import { test, expect } from '../fixtures/combined.fixture';

test.describe('User Profile', () => {
  test('view profile', async ({ authenticatedPage }) => {
    await authenticatedPage.navigateTo('Profile');
    // authenticatedPage is already in logged-in state
  });

  test('update user info', async ({ authenticatedPage, testUser }) => {
    // testUser is an automatically created test user
    console.log(`Testing with user: ${testUser.username}`);
    await authenticatedPage.navigateTo('Settings');
  });
});

// Global fixtures (used in playwright.config.ts)
// fixtures/global.fixture.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{}, { workerStorageState: string }>({
  // Worker-level fixture (shared across all tests)
  workerStorageState: [async ({ browser }, use) => {
    // Create a new context for login
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    // Save storage state
    const storageState = await context.storageState();
    const path = `./playwright/.auth/user.json`;
    await context.storageState({ path });

    await context.close();
    await use(path);
  }, { scope: 'worker' }],
});
```

### Parallel Testing

```typescript
// playwright.config.ts - Parallel configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Fully parallel mode: different files run in parallel, tests within the same file also run in parallel
  fullyParallel: true,

  // Number of workers
  workers: process.env.CI ? 4 : undefined, // Use 4 workers in CI

  // Or use percentage
  // workers: '50%', // Use 50% of CPU cores
});

// tests/parallel.spec.ts - Test-level parallel control
import { test, expect } from '@playwright/test';

// By default, tests within the same file run sequentially
test.describe('Sequential test group', () => {
  test('test 1', async ({ page }) => {
    // ...
  });

  test('test 2', async ({ page }) => {
    // ...
  });
});

// Configure parallel execution
test.describe.configure({ mode: 'parallel' });
test.describe('Parallel test group', () => {
  test('parallel test 1', async ({ page }) => {
    await page.goto('/page1');
    await expect(page).toHaveTitle(/Page 1/);
  });

  test('parallel test 2', async ({ page }) => {
    await page.goto('/page2');
    await expect(page).toHaveTitle(/Page 2/);
  });

  test('parallel test 3', async ({ page }) => {
    await page.goto('/page3');
    await expect(page).toHaveTitle(/Page 3/);
  });
});

// Serial mode (for tests with dependencies)
test.describe.configure({ mode: 'serial' });
test.describe('Serial test group', () => {
  test('create order', async ({ page }) => {
    await page.goto('/orders/new');
    await page.fill('#product', 'Widget');
    await page.click('#submit');
    await expect(page).toHaveURL(/orders\/\d+/);
  });

  test('view order (depends on previous test)', async ({ page }) => {
    // This test must run after the previous one
    await page.goto('/orders');
    await expect(page.locator('.order-item')).toHaveCount(1);
  });
});

// Using test.step to organize test steps
test('complete shopping flow', async ({ page }) => {
  await test.step('add product to cart', async () => {
    await page.goto('/products');
    await page.click('.add-to-cart');
    await expect(page.locator('.cart-count')).toHaveText('1');
  });

  await test.step('go to cart', async () => {
    await page.click('.cart-icon');
    await expect(page).toHaveURL('/cart');
  });

  await test.step('checkout', async () => {
    await page.click('#checkout');
    await page.fill('#card-number', '4111111111111111');
    await page.click('#pay');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});

// Using sharding to run tests across multiple machines
// Command line: npx playwright test --shard=1/3
// This will only run part 1 (of 3 total parts)
```

### Visual Comparison Testing

```typescript
// playwright.config.ts - Visual comparison configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Visual comparison configuration
  expect: {
    toHaveScreenshot: {
      // Allowed number of different pixels
      maxDiffPixels: 100,

      // Or use percentage
      // maxDiffPixelRatio: 0.02,

      // Threshold (0-1, lower is stricter)
      threshold: 0.2,

      // Animation handling
      animations: 'disabled',

      // Filter used for comparison
      // caret: 'hide', // Hide cursor
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  // Update baseline screenshots
  // updateSnapshots: 'all', // or 'none', 'missing'
});

// tests/visual.spec.ts - Visual comparison tests
import { test, expect } from '@playwright/test';

test.describe('Visual Comparison Tests', () => {
  test('homepage visual consistency', async ({ page }) => {
    await page.goto('/');

    // Full page screenshot comparison
    await expect(page).toHaveScreenshot('homepage.png');

    // Screenshot comparison with configuration
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixels: 50,
    });
  });

  test('component visual comparison', async ({ page }) => {
    await page.goto('/components');

    // Single element screenshot
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header.png');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveScreenshot('sidebar.png');

    const card = page.locator('.product-card').first();
    await expect(card).toHaveScreenshot('product-card.png');
  });

  test('responsive design comparison', async ({ page }) => {
    await page.goto('/');

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('desktop.png');

    // Tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('tablet.png');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('mobile.png');
  });

  test('handling dynamic content', async ({ page }) => {
    await page.goto('/dashboard');

    // Mask dynamic content
    await expect(page).toHaveScreenshot('dashboard.png', {
      mask: [
        page.locator('.timestamp'),
        page.locator('.random-number'),
        page.locator('.user-avatar'),
      ],
    });

    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);

    // Screenshot with animations disabled
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `,
    });
    await expect(page).toHaveScreenshot('no-animations.png');
  });

  test('comparing different states', async ({ page }) => {
    await page.goto('/form');

    // Empty form state
    await expect(page.locator('form')).toHaveScreenshot('form-empty.png');

    // Fill form
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await expect(page.locator('form')).toHaveScreenshot('form-filled.png');

    // Error state
    await page.fill('#email', 'invalid');
    await page.click('#submit');
    await expect(page.locator('form')).toHaveScreenshot('form-error.png');

    // Success state
    await page.fill('#email', 'john@example.com');
    await page.click('#submit');
    await expect(page.locator('.success-message')).toHaveScreenshot('success.png');
  });
});

// Update baseline screenshots command:
// npx playwright test --update-snapshots
// Or for a single test:
// npx playwright test visual.spec.ts --update-snapshots
```

### Network Interception and Mocking

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Mock Tests', () => {
  test('mock API response', async ({ page }) => {
    // Intercept API request and return mock data
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ]),
      });
    });

    await page.goto('/users');
    await expect(page.locator('.user-item')).toHaveCount(2);
    await expect(page.getByText('John Doe')).toBeVisible();
  });

  test('mock network error', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/users');
    await expect(page.locator('.error-message')).toContainText('Failed to load');
  });

  test('delayed response', async ({ page }) => {
    await page.route('**/api/data', async (route) => {
      // Delay 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: 'delayed' }),
      });
    });

    await page.goto('/slow-page');
    // Verify loading state
    await expect(page.locator('.loading-spinner')).toBeVisible();
    // Wait for data to load
    await expect(page.locator('.data-content')).toBeVisible({ timeout: 5000 });
  });

  test('modify response', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
      // Get original response
      const response = await route.fetch();
      const json = await response.json();

      // Modify response data
      json.products = json.products.map((p: any) => ({
        ...p,
        price: p.price * 0.9, // 10% discount
      }));

      await route.fulfill({
        response,
        body: JSON.stringify(json),
      });
    });

    await page.goto('/products');
    // Verify discounted prices
  });

  test('intercept and continue request', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // Add authentication header
      const headers = {
        ...route.request().headers(),
        'Authorization': 'Bearer test-token',
      };
      await route.continue({ headers });
    });

    await page.goto('/protected-page');
  });

  test('wait for specific network request', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for API request to complete
    const responsePromise = page.waitForResponse('**/api/stats');
    await page.click('#refresh-stats');
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalUsers');
  });

  test('network request assertions', async ({ page }) => {
    // Listen to all requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    await page.goto('/');
    await page.click('#load-more');

    // Verify the correct request was sent
    expect(requests.some(r => r.includes('/api/more-data'))).toBeTruthy();
  });
});
```

## Best Practices

### Selector Strategy Priority

```typescript
// Recommended order:
// 1. getByRole - Semantic, accessibility-friendly
await page.getByRole('button', { name: 'Submit' });

// 2. getByLabel - Form elements
await page.getByLabel('Username');

// 3. getByPlaceholder
await page.getByPlaceholder('Search...');

// 4. getByText - Link or button text
await page.getByText('Learn more');

// 5. getByTestId - When no semantic option available
await page.getByTestId('submit-btn');

// Avoid:
// - Fragile CSS selectors: .btn-primary.mt-4
// - XPath (unless necessary)
// - Index selectors: nth(0)
```

### Test Isolation

```typescript
// Each test should run independently
test.describe('Product Management', () => {
  // Use beforeEach to set up initial state
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    // Clear test data
    await page.evaluate(() => localStorage.clear());
  });

  test('create product', async ({ page }) => {
    // Test creation functionality
  });

  test('delete product', async ({ page }) => {
    // Don't depend on the product created by the previous test
    // First create test data
    await setupTestProduct(page);
    // Then test deletion
  });
});
```

### Avoid Hardcoded Waits

```typescript
// Wrong approach
await page.click('#submit');
await page.waitForTimeout(3000); // Don't use fixed waits
await expect(page.locator('.success')).toBeVisible();

// Correct approach
await page.click('#submit');
await expect(page.locator('.success')).toBeVisible(); // Auto-wait
```

### Use Web-First Assertions

```typescript
// Wrong approach
const text = await page.textContent('.message');
expect(text).toBe('Success'); // Synchronous assertion, may be unstable

// Correct approach
await expect(page.locator('.message')).toHaveText('Success');
// Web-First assertions automatically retry
```

### Organize Test Files

```
tests/
├── e2e/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   └── logout.spec.ts
│   ├── products/
│   │   ├── list.spec.ts
│   │   ├── create.spec.ts
│   │   └── delete.spec.ts
│   └── checkout/
│       └── checkout.spec.ts
├── pages/
│   ├── LoginPage.ts
│   ├── ProductPage.ts
│   └── index.ts
├── fixtures/
│   ├── auth.fixture.ts
│   └── database.fixture.ts
└── utils/
    ├── test-data.ts
    └── helpers.ts
```

### CI/CD Integration

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Common Pitfalls

### Unstable Selectors

```typescript
// Problem: Using fragile selectors
await page.click('.mt-4 > div:nth-child(2) > button');

// Solution: Use stable selectors
await page.getByRole('button', { name: 'Add to cart' });

// Or add data-testid
await page.getByTestId('add-to-cart-btn');
```

### Ignoring Waits

```typescript
// Problem: Asserting immediately after action
await page.click('#async-button');
const text = await page.textContent('#result'); // May get old value

// Solution: Use Web-First assertions
await page.click('#async-button');
await expect(page.locator('#result')).toHaveText('Done');
```

### Test Interdependencies

```typescript
// Problem: Test B depends on data created by Test A
test('A: create user', async ({ page }) => {
  await createUser(page, 'testuser');
});

test('B: delete user', async ({ page }) => {
  await deleteUser(page, 'testuser'); // If A fails, B will also fail
});

// Solution: Each test sets up its own data
test('delete user', async ({ page }) => {
  // First create the user needed for this test
  await createUser(page, 'testuser');
  // Then delete
  await deleteUser(page, 'testuser');
});
```

### Hardcoded Test Data

```typescript
// Problem: Hardcoded data makes tests fragile
await page.fill('#email', 'test@example.com'); // May already exist

// Solution: Use dynamic test data
const email = `test_${Date.now()}@example.com`;
await page.fill('#email', email);
```

### Ignoring Cleanup

```typescript
// Problem: Not cleaning up after test
test('create order', async ({ page }) => {
  await page.click('#create-order');
  // Test completes but order still exists
});

// Solution: Use afterEach or fixtures for cleanup
test.afterEach(async ({ page }) => {
  await cleanupTestOrders();
});
```

### Parallel Test Conflicts

```typescript
// Problem: Parallel tests operating on the same resource
test('update user A', async ({ page }) => {
  await updateUser(page, 'shared-user', { name: 'A' });
});

test('update user B', async ({ page }) => {
  await updateUser(page, 'shared-user', { name: 'B' }); // Conflict!
});

// Solution: Each test uses independent resources
test('update user', async ({ page }) => {
  const userId = await createUniqueUser(page);
  await updateUser(page, userId, { name: 'New Name' });
});
```

## Performance Considerations

### Optimize Test Execution Time

```typescript
// Use beforeAll for one-time setup
test.describe('Product Tests', () => {
  test.beforeAll(async ({ browser }) => {
    // Setup that runs only once
    await seedDatabase();
  });

  test.afterAll(async () => {
    await cleanDatabase();
  });
});

// Reuse authentication state
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'logged in tests',
      dependencies: ['setup'],
      use: {
        storageState: 'playwright/.auth/user.json',
      },
    },
  ],
});
```

### Parallelization Strategy

```typescript
// playwright.config.ts
export default defineConfig({
  // Use all available CPU cores
  workers: '100%',

  // CI environment optimization
  workers: process.env.CI ? 4 : undefined,

  // Fully parallel
  fullyParallel: true,
});
```

### Resource Management

```typescript
// Avoid unnecessary screenshots and videos
export default defineConfig({
  use: {
    // Screenshot only on failure
    screenshot: 'only-on-failure',
    // Retain video only on failure
    video: 'retain-on-failure',
    // Trace only on first retry
    trace: 'on-first-retry',
  },
});
```

### Network Optimization

```typescript
// Skip unnecessary resources
test('fast page load', async ({ page }) => {
  await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());
  await page.route('**/analytics/**', route => route.abort());
  await page.goto('/');
});
```

### Use Waits Wisely

```typescript
// Use waitForLoadState to control page loading
await page.goto('/');
await page.waitForLoadState('networkidle'); // Wait for network to be idle

// Or use a faster option
await page.waitForLoadState('domcontentloaded');
```

## Real-World Scenarios

### Scenario 1: E-commerce Shopping Flow Test

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { ProductPage, CartPage, CheckoutPage } from '../pages';

test.describe('Shopping Flow', () => {
  test('complete purchase flow', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('browse products', async () => {
      await productPage.goto();
      await productPage.searchProduct('iPhone');
      await expect(productPage.productList).toHaveCount(5);
    });

    await test.step('add to cart', async () => {
      await productPage.addToCart('iPhone 15 Pro');
      await expect(page.locator('.cart-badge')).toHaveText('1');
    });

    await test.step('view cart', async () => {
      await cartPage.goto();
      await expect(cartPage.cartItems).toHaveCount(1);
      await expect(cartPage.totalPrice).toContainText('$999');
    });

    await test.step('fill shipping info', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.fillShippingInfo({
        name: 'John Doe',
        phone: '555-0123',
        address: '123 Main St, New York, NY',
      });
    });

    await test.step('payment', async () => {
      await checkoutPage.selectPaymentMethod('card');
      await checkoutPage.placeOrder();
      await expect(page.locator('.order-success')).toBeVisible();
      await expect(page.locator('.order-number')).toBeVisible();
    });
  });
});
```

### Scenario 2: Form Validation Test

```typescript
// tests/e2e/form-validation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Registration Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  const testCases = [
    {
      name: 'empty username',
      field: 'username',
      value: '',
      error: 'Username is required',
    },
    {
      name: 'username too short',
      field: 'username',
      value: 'ab',
      error: 'Username must be at least 3 characters',
    },
    {
      name: 'invalid email',
      field: 'email',
      value: 'invalid-email',
      error: 'Please enter a valid email address',
    },
    {
      name: 'weak password',
      field: 'password',
      value: '123',
      error: 'Password must be at least 8 characters',
    },
  ];

  for (const { name, field, value, error } of testCases) {
    test(`validation: ${name}`, async ({ page }) => {
      await page.getByLabel(field === 'username' ? 'Username' :
                            field === 'email' ? 'Email' : 'Password')
               .fill(value);
      await page.getByRole('button', { name: 'Register' }).click();
      await expect(page.locator(`[data-error="${field}"]`)).toHaveText(error);
    });
  }

  test('password confirmation mismatch', async ({ page }) => {
    await page.getByLabel('Password').fill('Password123!');
    await page.getByLabel('Confirm Password').fill('DifferentPassword');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.locator('[data-error="confirmPassword"]'))
      .toHaveText('Passwords do not match');
  });

  test('successful registration', async ({ page }) => {
    const timestamp = Date.now();

    await page.getByLabel('Username').fill(`user_${timestamp}`);
    await page.getByLabel('Email').fill(`test_${timestamp}@example.com`);
    await page.getByLabel('Password').fill('SecurePassword123!');
    await page.getByLabel('Confirm Password').fill('SecurePassword123!');
    await page.getByRole('checkbox', { name: 'Agree to Terms of Service' }).check();
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL('/welcome');
    await expect(page.locator('.welcome-message')).toContainText('Registration successful');
  });
});
```

### Scenario 3: Multi-Role Permission Testing

```typescript
// fixtures/roles.fixture.ts
import { test as base } from '@playwright/test';

type Role = 'admin' | 'editor' | 'viewer';

type RoleFixtures = {
  loginAs: (role: Role) => Promise<void>;
};

export const test = base.extend<RoleFixtures>({
  loginAs: async ({ page }, use) => {
    const loginAs = async (role: Role) => {
      const credentials: Record<Role, { username: string; password: string }> = {
        admin: { username: 'admin', password: 'admin123' },
        editor: { username: 'editor', password: 'editor123' },
        viewer: { username: 'viewer', password: 'viewer123' },
      };

      await page.goto('/login');
      await page.getByLabel('Username').fill(credentials[role].username);
      await page.getByLabel('Password').fill(credentials[role].password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('/dashboard');
    };

    await use(loginAs);
  },
});

export { expect } from '@playwright/test';

// tests/e2e/permissions.spec.ts
import { test, expect } from '../fixtures/roles.fixture';

test.describe('Permission Tests', () => {
  test('admin can access all features', async ({ page, loginAs }) => {
    await loginAs('admin');

    // Can access user management
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');

    // Can create content
    await page.goto('/content/new');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    // Can delete content
    await page.goto('/content');
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });

  test('editor can edit but not delete', async ({ page, loginAs }) => {
    await loginAs('editor');

    // Cannot access user management
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/403'); // No permission page

    // Can create content
    await page.goto('/content/new');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    // Cannot delete content
    await page.goto('/content');
    await expect(page.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });

  test('viewer can only view', async ({ page, loginAs }) => {
    await loginAs('viewer');

    // Cannot access user management
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/403');

    // Cannot create content
    await page.goto('/content/new');
    await expect(page).toHaveURL('/403');

    // Can view content
    await page.goto('/content');
    await expect(page.locator('.content-list')).toBeVisible();
  });
});
```

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between Playwright, Cypress, and Selenium?**

| Feature | Playwright | Cypress | Selenium |
|---------|------------|---------|----------|
| Cross-browser | Chrome, Firefox, Safari | Chrome, Firefox, Edge | All major browsers |
| Multi-tab | Native support | Limited support | Supported |
| Parallel testing | Built-in support | Requires paid version | Requires Grid setup |
| Auto-waiting | Smart waiting | Smart waiting | Manual handling |
| Network interception | Powerful API | Built-in support | Requires additional tools |
| Learning curve | Medium | Lower | Higher |
| Execution speed | Fast | Medium | Slower |

**Q2: How do you handle dynamic content in Playwright?**

```typescript
// 1. Use Web-First assertions (auto-retry)
await expect(page.locator('.dynamic-content')).toBeVisible();

// 2. Wait for specific conditions
await page.waitForSelector('.loaded');
await page.waitForLoadState('networkidle');

// 3. Wait for specific response
await page.waitForResponse('**/api/data');

// 4. Use poll for custom waiting
await expect.poll(async () => {
  return await page.locator('.items').count();
}).toBeGreaterThan(0);
```

**Q3: How do you optimize Playwright test execution speed?**

```typescript
// 1. Parallel execution
fullyParallel: true,
workers: process.env.CI ? 4 : '50%',

// 2. Reuse authentication state
storageState: 'playwright/.auth/user.json',

// 3. Skip unnecessary resources
await page.route('**/*.{png,jpg,gif}', route => route.abort());

// 4. Use API to set up data
await page.request.post('/api/setup-test-data');

// 5. Use beforeAll wisely
test.beforeAll(async () => {
  await seedDatabase();
});
```

**Q4: What are the advantages of the Page Object Model?**

1. **Code Reuse**: Page operation logic is centrally managed
2. **Maintainability**: UI changes only need to be modified in one place
3. **Readability**: Test code is clearer
4. **Encapsulation**: Hides page implementation details
5. **Extensibility**: Easy to add new functionality

**Q5: How do you debug Playwright tests?**

```bash
# Use UI mode
npx playwright test --ui

# Use debug mode
npx playwright test --debug

# Run in headed mode
npx playwright test --headed

# Use trace viewer
npx playwright show-trace trace.zip
```

```typescript
// In code
await page.pause(); // Pause execution
console.log(await page.content()); // Print page content
```

**Q6: How do you handle iframes and new windows?**

```typescript
// iframe
const frame = page.frameLocator('#my-iframe');
await frame.locator('button').click();

// New window/tab
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('a[target="_blank"]'),
]);
await newPage.waitForLoadState();
await expect(newPage).toHaveURL('/new-page');
```

## Further Reading

### Official Resources

- [Playwright Official Documentation](https://playwright.dev/)
- [Playwright GitHub Repository](https://github.com/microsoft/playwright)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Learning Resources

- [Playwright Getting Started Tutorial](https://playwright.dev/docs/intro)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Playwright CI/CD Integration](https://playwright.dev/docs/ci)
- [Visual Comparison Testing Guide](https://playwright.dev/docs/test-snapshots)

### Community Resources

- [Awesome Playwright](https://github.com/mxschmitt/awesome-playwright) - Curated Playwright resource collection
- [Playwright Community Discord](https://aka.ms/playwright/discord) - Official community
- [Testing Library for Playwright](https://github.com/testing-library/playwright-testing-library) - Testing Library integration

### Related Tools

- [Playwright Test Generator](https://playwright.dev/docs/codegen) - Auto-generate test code
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) - Trace analysis tool
- [Playwright Inspector](https://playwright.dev/docs/debug#playwright-inspector) - Debugging tool
- [Allure Reporter](https://github.com/allure-framework/allure-js/tree/main/packages/allure-playwright) - Advanced test reports
