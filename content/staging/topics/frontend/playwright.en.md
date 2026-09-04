---
title: Playwright E2E测试
description: 使用Playwright进行端到端测试
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Playwright
  - E2E测试
  - 自动化测试
  - 跨浏览器
status: imported
origin: old/src/content/docs/frontend/playwright.en.md
divergence: 0.234
issues:
  - title-lang-en
  - title-language
legacy:
  category: Frontend
  subcategory: Testing
  order: 46
  lastUpdated: 2026-01-07
---

Playwright is a modern end-to-end testing framework developed by Microsoft that supports three major browser engines: Chromium, Firefox, and WebKit. It provides powerful auto-waiting mechanisms, network interception, multi-page testing, and more, making it an ideal choice for web application automation testing.

## Why Choose Playwright

### Core Advantages

1. **Cross-browser Support**: One codebase, three browser engines (Chromium, Firefox, WebKit)
2. **Auto-waiting**: Intelligently waits for elements to be actionable, no need for manual wait logic
3. **Network Interception**: Powerful network request interception and mocking capabilities
4. **Multiple Contexts**: Supports multiple browser contexts for true parallel testing
5. **Tracing and Debugging**: Built-in trace viewer for debugging failed tests
6. **Code Generation**: Supports recording user actions to auto-generate test code

### Comparison with Other Frameworks

| Feature | Playwright | Cypress | Selenium |
|---------|------------|---------|----------|
| Cross-browser | Chromium/Firefox/WebKit | Primarily Chromium | All major browsers |
| Execution Speed | Fast | Fast | Slower |
| Auto-waiting | Built-in | Built-in | Manual handling required |
| Network Interception | Powerful | Powerful | Limited |
| Multi-tab | Native support | Limited | Supported |
| Mobile Emulation | Supported | Limited | Limited |

## Installation and Configuration

### Basic Installation

```bash
# Install using npm
npm init playwright@latest

# Or manual installation
npm install -D @playwright/test
npx playwright install
```

The installation wizard will ask about the following configurations:
- Whether to use TypeScript
- Test file directory
- Whether to add GitHub Actions workflow
- Whether to install browsers

### Configuration File

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test file directory
  testDir: './tests',

  // Run tests in fully parallel mode
  fullyParallel: true,

  // Forbid test.only in CI environment
  forbidOnly: !!process.env.CI,

  // Retry count on failure in CI
  retries: process.env.CI ? 2 : 0,

  // Number of parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: 'html',

  // Global test configuration
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Record video
    video: 'retain-on-failure',
  },

  // Browser project configuration
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

  // Start local dev server
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### Extended Configuration Options

```typescript
// playwright.config.ts - Advanced configuration
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Test timeout (milliseconds)
  timeout: 30000,

  // Assertion timeout
  expect: {
    timeout: 10000,
    // Visual comparison configuration
    toHaveScreenshot: {
      maxDiffPixels: 10,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },

  // Global setup and teardown
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // Output directory
  outputDir: 'test-results/',

  use: {
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',

    // Geolocation emulation
    geolocation: { longitude: 116.4074, latitude: 39.9042 },
    permissions: ['geolocation'],

    // HTTP authentication
    httpCredentials: {
      username: 'user',
      password: 'pass',
    },

    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN',
    },
  },
});
```

## Locators

Playwright provides multiple ways to locate elements. Semantic locators are recommended for better test maintainability and readability.

### Recommended Locators

#### getByRole - Locate by Role

```typescript
import { test, expect } from '@playwright/test';

test('using role locators', async ({ page }) => {
  await page.goto('/');

  // Locate heading
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();

  // Locate button
  await page.getByRole('button', { name: 'Submit' }).click();

  // Locate link
  await page.getByRole('link', { name: 'Learn more' }).click();

  // Locate checkbox
  await page.getByRole('checkbox', { name: 'Agree to terms' }).check();

  // Locate textbox
  await page.getByRole('textbox', { name: 'Username' }).fill('John');

  // Locate dropdown
  await page.getByRole('combobox', { name: 'City' }).selectOption('Beijing');

  // Locate navigation
  const nav = page.getByRole('navigation');
  await expect(nav).toBeVisible();
});
```

#### getByLabel - Locate by Label

```typescript
test('using label to locate form elements', async ({ page }) => {
  await page.goto('/login');

  // Locate input through associated label
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('secret123');

  // Also works with aria-label
  await page.getByLabel('Search').fill('Playwright');
});
```

#### getByPlaceholder - Locate by Placeholder

```typescript
test('using placeholder to locate', async ({ page }) => {
  await page.goto('/search');

  await page.getByPlaceholder('Enter search keywords').fill('test');
  await page.getByPlaceholder('Enter email address').fill('test@example.com');
});
```

#### getByText - Locate by Text Content

```typescript
test('using text content to locate', async ({ page }) => {
  await page.goto('/');

  // Contains text
  await page.getByText('Welcome').click();

  // Exact match
  await page.getByText('Login', { exact: true }).click();

  // Using regular expression
  await page.getByText(/Price: \d+ USD/).click();
});
```

#### getByTestId - Locate by Test ID

```typescript
test('using test ID to locate', async ({ page }) => {
  await page.goto('/dashboard');

  // Locate elements with data-testid attribute
  await page.getByTestId('user-menu').click();
  await page.getByTestId('logout-button').click();

  // Suitable for precise location of complex components
  const card = page.getByTestId('product-card-123');
  await card.getByRole('button', { name: 'Add to cart' }).click();
});
```

### Chaining Locators

```typescript
test('chaining locators', async ({ page }) => {
  await page.goto('/products');

  // Locate within specific container
  const productCard = page.getByTestId('product-card').first();

  // Locate elements within the card
  await productCard.getByRole('button', { name: 'Buy' }).click();
  await expect(productCard.getByText('Added')).toBeVisible();

  // Multi-level nested locating
  const header = page.getByRole('banner');
  const nav = header.getByRole('navigation');
  await nav.getByRole('link', { name: 'Home' }).click();
});
```

### Filtering Locators

```typescript
test('filtering locators', async ({ page }) => {
  await page.goto('/products');

  // Filter by text
  const button = page.getByRole('button').filter({ hasText: 'Confirm' });
  await button.click();

  // Filter by child element
  const card = page.getByTestId('product-card').filter({
    has: page.getByText('Hot sale'),
  });
  await card.click();

  // Filter by exclusion condition
  const availableProduct = page.getByTestId('product-card').filter({
    hasNot: page.getByText('Sold out'),
  });
  await availableProduct.first().click();
});
```

### CSS and XPath Locators

```typescript
test('CSS and XPath locators', async ({ page }) => {
  await page.goto('/');

  // CSS selector (not recommended as first choice)
  await page.locator('.btn-primary').click();
  await page.locator('#submit-button').click();
  await page.locator('[data-custom="value"]').click();

  // XPath (not recommended as first choice)
  await page.locator('//button[text()="Submit"]').click();

  // Combined selectors
  await page.locator('article:has-text("Playwright")').click();
  await page.locator('div.card >> text=Buy').click();
});
```

## Assertions

Playwright provides rich assertion methods with support for auto-waiting and retries.

### Page Assertions

```typescript
import { test, expect } from '@playwright/test';

test('page assertions', async ({ page }) => {
  await page.goto('/');

  // URL assertions
  await expect(page).toHaveURL('/');
  await expect(page).toHaveURL(/.*dashboard/);

  // Title assertions
  await expect(page).toHaveTitle('Home - My App');
  await expect(page).toHaveTitle(/Home/);
});
```

### Element Assertions

```typescript
test('element assertions', async ({ page }) => {
  await page.goto('/dashboard');

  const button = page.getByRole('button', { name: 'Submit' });
  const input = page.getByLabel('Username');
  const checkbox = page.getByRole('checkbox');

  // Visibility assertions
  await expect(button).toBeVisible();
  await expect(page.getByTestId('loading')).not.toBeVisible();
  await expect(page.getByTestId('hidden')).toBeHidden();

  // State assertions
  await expect(button).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  await expect(checkbox).toBeChecked();
  await expect(input).toBeEditable();

  // Text assertions
  await expect(page.getByTestId('message')).toHaveText('Operation successful');
  await expect(page.getByTestId('message')).toContainText('successful');

  // Attribute assertions
  await expect(input).toHaveAttribute('placeholder', 'Enter username');
  await expect(button).toHaveClass(/btn-primary/);
  await expect(input).toHaveValue('John');

  // Count assertions
  await expect(page.getByRole('listitem')).toHaveCount(5);

  // Focus assertions
  await expect(input).toBeFocused();
});
```

### Soft Assertions

```typescript
test('soft assertions - do not terminate test immediately', async ({ page }) => {
  await page.goto('/');

  // Soft assertions don't terminate the test immediately on failure
  await expect.soft(page.getByTestId('status')).toHaveText('Online');
  await expect.soft(page.getByTestId('count')).toHaveText('10');

  // Continue with other checks
  await page.getByRole('button').click();

  // At the end of the test, all soft assertion failures will be reported
});
```

### Custom Timeout

```typescript
test('custom assertion timeout', async ({ page }) => {
  await page.goto('/slow-page');

  // Set timeout for specific assertion
  await expect(page.getByTestId('data')).toHaveText('Loaded', {
    timeout: 30000,
  });

  // Polling assertion
  await expect(async () => {
    const response = await page.request.get('/api/status');
    expect(response.status()).toBe(200);
  }).toPass({
    timeout: 60000,
    intervals: [1000, 2000, 5000],
  });
});
```

## Fixtures

Fixtures are a core concept in Playwright, used to provide reusable context and resources for tests.

### Built-in Fixtures

```typescript
import { test, expect } from '@playwright/test';

test('using built-in fixtures', async ({
  page,      // Browser page
  context,   // Browser context
  browser,   // Browser instance
  request,   // API request context
}) => {
  // page fixture - independent page for each test
  await page.goto('/');

  // context fixture - can be used for multi-page testing
  const newPage = await context.newPage();
  await newPage.goto('/other');

  // request fixture - for API testing
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
});
```

### Custom Fixtures

```typescript
// fixtures.ts
import { test as base, expect } from '@playwright/test';

// Define user type
interface User {
  username: string;
  password: string;
}

// Define fixtures type
type MyFixtures = {
  user: User;
  authenticatedPage: typeof base.page;
};

// Extend base test
export const test = base.extend<MyFixtures>({
  // Simple data fixture
  user: async ({}, use) => {
    const user: User = {
      username: 'testuser',
      password: 'password123',
    };
    await use(user);
  },

  // Fixture with setup and teardown
  authenticatedPage: async ({ page, user }, use) => {
    // Setup: login
    await page.goto('/login');
    await page.getByLabel('Username').fill(user.username);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');

    // Provide to test
    await use(page);

    // Teardown: logout
    await page.getByTestId('logout').click();
  },
});

export { expect };

// Using custom fixtures
// tests/dashboard.spec.ts
import { test, expect } from './fixtures';

test('dashboard displays user info', async ({ authenticatedPage, user }) => {
  await expect(
    authenticatedPage.getByText(`Welcome, ${user.username}`)
  ).toBeVisible();
});
```

### Parameterized Fixtures

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

type Environment = 'development' | 'staging' | 'production';

type EnvFixtures = {
  environment: Environment;
  baseURL: string;
};

type EnvOptions = {
  environment: Environment;
};

export const test = base.extend<EnvFixtures, EnvOptions>({
  // Worker-level option
  environment: ['development', { option: true, scope: 'worker' }],

  // Environment-based URL
  baseURL: async ({ environment }, use) => {
    const urls: Record<Environment, string> = {
      development: 'http://localhost:3000',
      staging: 'https://staging.example.com',
      production: 'https://example.com',
    };
    await use(urls[environment]);
  },
});

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'development',
      use: { environment: 'development' },
    },
    {
      name: 'staging',
      use: { environment: 'staging' },
    },
  ],
});
```

### Database Fixture Example

```typescript
// fixtures/database.ts
import { test as base } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

type DatabaseFixtures = {
  db: PrismaClient;
  testUser: { id: string; email: string };
};

export const test = base.extend<DatabaseFixtures>({
  db: async ({}, use) => {
    const prisma = new PrismaClient();
    await use(prisma);
    await prisma.$disconnect();
  },

  testUser: async ({ db }, use) => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    });

    await use(user);

    // Clean up test data
    await db.user.delete({ where: { id: user.id } });
  },
});
```

## Page Object Pattern

The Page Object pattern is a design pattern that encapsulates page element locators and operations into classes, improving test maintainability.

### Basic Page Object

```typescript
// pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorMessage).toHaveText(message);
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
  readonly userMenu: Locator;
  readonly logoutButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('welcome-message');
    this.userMenu = page.getByTestId('user-menu');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.sidebar = page.getByRole('navigation', { name: 'Sidebar' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async expectWelcome(username: string) {
    await expect(this.welcomeMessage).toContainText(`Welcome, ${username}`);
  }

  async navigateTo(menuItem: string) {
    await this.sidebar.getByRole('link', { name: menuItem }).click();
  }
}
```

### Tests Using Page Objects

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('User Authentication', () => {
  test('successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');

    await loginPage.expectLoginSuccess();
    await dashboardPage.expectWelcome('user');
  });

  test('login failure - wrong credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'wrongpassword');

    await loginPage.expectError('Invalid email or password');
  });

  test('logout', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await loginPage.expectLoginSuccess();

    // Then logout
    await dashboardPage.logout();

    // Verify redirect to login page
    await expect(page).toHaveURL('/login');
  });
});
```

### Page Objects Combined with Fixtures

```typescript
// fixtures/pages.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProductPage } from '../pages/ProductPage';

type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  productPage: ProductPage;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
});

export { expect } from '@playwright/test';

// tests/shopping.spec.ts
import { test, expect } from '../fixtures/pages';

test('purchase product flow', async ({ loginPage, dashboardPage, productPage }) => {
  // Login
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  // Navigate to product page
  await dashboardPage.navigateTo('Product List');

  // Select product
  await productPage.selectProduct('iPhone 15');
  await productPage.addToCart();

  // Verify cart
  await expect(productPage.cartBadge).toHaveText('1');
});
```

### Component-level Page Objects

```typescript
// components/HeaderComponent.ts
import { Page, Locator } from '@playwright/test';

export class HeaderComponent {
  readonly container: Locator;
  readonly logo: Locator;
  readonly searchInput: Locator;
  readonly cartIcon: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.container = page.getByRole('banner');
    this.logo = this.container.getByRole('link', { name: 'Home' });
    this.searchInput = this.container.getByPlaceholder('Search products');
    this.cartIcon = this.container.getByTestId('cart-icon');
    this.userMenu = this.container.getByTestId('user-menu');
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
  }

  async goToCart() {
    await this.cartIcon.click();
  }

  async openUserMenu() {
    await this.userMenu.click();
  }
}

// pages/BasePage.ts - Contains shared components
import { Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';
import { FooterComponent } from '../components/FooterComponent';

export abstract class BasePage {
  readonly page: Page;
  readonly header: HeaderComponent;
  readonly footer: FooterComponent;

  constructor(page: Page) {
    this.page = page;
    this.header = new HeaderComponent(page);
    this.footer = new FooterComponent(page);
  }

  abstract goto(): Promise<void>;
}
```

## Network Mocking

Playwright provides powerful network request interception and mocking capabilities for simulating API responses and testing error scenarios.

### Basic Route Interception

```typescript
import { test, expect } from '@playwright/test';

test('mock API response', async ({ page }) => {
  // Intercept API request and return mock data
  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ]),
    });
  });

  await page.goto('/users');

  // Verify mock data is rendered
  await expect(page.getByText('John')).toBeVisible();
  await expect(page.getByText('Jane')).toBeVisible();
});
```

### Mocking Error Responses

```typescript
test('mock server error', async ({ page }) => {
  await page.route('**/api/data', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' }),
    });
  });

  await page.goto('/data');

  // Verify error handling
  await expect(page.getByText('Loading failed, please retry')).toBeVisible();
});

test('mock network timeout', async ({ page }) => {
  await page.route('**/api/slow', async (route) => {
    // Delay response
    await new Promise((resolve) => setTimeout(resolve, 30000));
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.goto('/slow-page');

  // Verify timeout handling
  await expect(page.getByText('Request timeout')).toBeVisible();
});

test('mock network failure', async ({ page }) => {
  await page.route('**/api/data', async (route) => {
    await route.abort('failed');
  });

  await page.goto('/data');

  await expect(page.getByText('Network error')).toBeVisible();
});
```

### Conditional Routing

```typescript
test('conditional route interception', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request();

    // Handle by request method
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();

      if (postData?.email === 'invalid@test.com') {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: 'Invalid email address' }),
        });
        return;
      }
    }

    // Handle by URL
    if (request.url().includes('/users/')) {
      const userId = request.url().split('/users/')[1];
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ id: userId, name: `User${userId}` }),
      });
      return;
    }

    // Continue with other requests normally
    await route.continue();
  });
});
```

### Modifying Requests and Responses

```typescript
test('modify request headers', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const headers = {
      ...route.request().headers(),
      'Authorization': 'Bearer test-token',
      'X-Custom-Header': 'custom-value',
    };

    await route.continue({ headers });
  });

  await page.goto('/protected');
});

test('modify response content', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    // Get real response
    const response = await route.fetch();
    const json = await response.json();

    // Modify response data
    const modifiedProducts = json.map((product: any) => ({
      ...product,
      price: product.price * 0.8, // 20% off price
      discounted: true,
    }));

    await route.fulfill({
      response,
      body: JSON.stringify(modifiedProducts),
    });
  });

  await page.goto('/products');
});
```

### Using HAR Files

```typescript
// Record HAR file
test('record network requests', async ({ page }) => {
  // Start recording
  await page.routeFromHAR('recordings/api.har', {
    update: true, // Update mode, will record new requests
  });

  await page.goto('/');
  // Perform operations...

  // HAR file will save all network requests
});

// Replay using recorded HAR file
test('replay using HAR', async ({ page }) => {
  await page.routeFromHAR('recordings/api.har', {
    update: false, // Replay mode
  });

  await page.goto('/');
  // Network requests will use recorded responses
});
```

### Waiting for Network Requests

```typescript
test('wait for specific request', async ({ page }) => {
  // Start waiting for request (before triggering action)
  const requestPromise = page.waitForRequest('**/api/submit');

  await page.goto('/form');
  await page.getByLabel('Name').fill('Test');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Wait for request to complete and verify
  const request = await requestPromise;
  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toMatchObject({ name: 'Test' });
});

test('wait for response', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/data') && response.status() === 200
  );

  await page.goto('/data');

  const response = await responsePromise;
  const data = await response.json();
  expect(data).toHaveProperty('items');
});
```

## Visual Comparison Testing

Playwright supports screenshot comparison for detecting visual changes in the UI.

### Basic Screenshot Comparison

```typescript
import { test, expect } from '@playwright/test';

test('page visual comparison', async ({ page }) => {
  await page.goto('/');

  // Full page screenshot comparison
  await expect(page).toHaveScreenshot('homepage.png');
});

test('element visual comparison', async ({ page }) => {
  await page.goto('/');

  // Specific element screenshot comparison
  const header = page.getByRole('banner');
  await expect(header).toHaveScreenshot('header.png');

  const button = page.getByRole('button', { name: 'Submit' });
  await expect(button).toHaveScreenshot('submit-button.png');
});
```

### Screenshot Comparison Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // Allowed number of different pixels
      maxDiffPixels: 100,

      // Allowed pixel difference ratio
      maxDiffPixelRatio: 0.02,

      // Screenshot comparison threshold
      threshold: 0.2,

      // Animation handling
      animations: 'disabled',

      // Scale factor
      scale: 'device',
    },
  },
});

// Override configuration in test
test('custom screenshot comparison', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot('page.png', {
    maxDiffPixels: 50,
    threshold: 0.3,
    fullPage: true,
    mask: [page.getByTestId('dynamic-content')], // Mask dynamic content
  });
});
```

### Handling Dynamic Content

```typescript
test('handling dynamic content', async ({ page }) => {
  await page.goto('/dashboard');

  // Wait for dynamic content to load
  await page.waitForLoadState('networkidle');

  // Mask dynamic areas
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [
      page.getByTestId('current-time'),
      page.getByTestId('random-ad'),
      page.locator('.dynamic-chart'),
    ],
  });
});

test('using CSS to hide dynamic elements', async ({ page }) => {
  await page.goto('/');

  // Hide specific elements before screenshot
  await page.addStyleTag({
    content: `
      .dynamic-content,
      .loading-spinner,
      [data-testid="timestamp"] {
        visibility: hidden !important;
      }
    `,
  });

  await expect(page).toHaveScreenshot('static-page.png');
});
```

### Multi-theme and Responsive Testing

```typescript
test.describe('visual regression testing', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} view`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/');
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
    });
  }
});

test.describe('theme testing', () => {
  test('light theme', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page).toHaveScreenshot('homepage-light.png');
  });

  test('dark theme', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

### Updating Baseline Screenshots

```bash
# Update all screenshots
npx playwright test --update-snapshots

# Update screenshots for specific tests
npx playwright test visual.spec.ts --update-snapshots
```

## CI Integration

### GitHub Actions

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
    runs-on: ubuntu-latest
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

      - name: Upload test artifacts
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-artifacts
          path: |
            test-results/
            playwright-report/
          retention-days: 7
```

### Sharded Parallel Testing

```yaml
# .github/workflows/playwright-sharded.yml
name: Playwright Tests (Sharded)

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}

      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1

  merge-reports:
    needs: test
    runs-on: ubuntu-latest
    if: always()

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Download blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge reports
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: html-report
          path: playwright-report/
          retention-days: 14
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test

variables:
  npm_config_cache: '$CI_PROJECT_DIR/.npm'

playwright:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - .npm/
      - node_modules/
  script:
    - npm ci
    - npm run build
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
      - test-results/
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

### Docker Configuration

```dockerfile
# Dockerfile.playwright
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["npx", "playwright", "test"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000']
      interval: 10s
      timeout: 5s
      retries: 5

  playwright:
    build:
      context: .
      dockerfile: Dockerfile.playwright
    depends_on:
      app:
        condition: service_healthy
    environment:
      - BASE_URL=http://app:3000
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results
```

## Debugging Tips

### UI Mode

```bash
# Launch UI mode
npx playwright test --ui

# Open in specific browser
npx playwright test --ui --project=chromium
```

### Debug Mode

```bash
# Enable debugger
npx playwright test --debug

# Debug specific test
npx playwright test -g "login" --debug

# Using PWDEBUG environment variable
PWDEBUG=1 npx playwright test
```

### Trace Viewer

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Record trace information
    trace: 'on-first-retry', // 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
  },
});

// View trace
// npx playwright show-trace trace.zip
```

### Test Generator

```bash
# Launch code generator
npx playwright codegen localhost:3000

# Specify browser and device
npx playwright codegen --device="iPhone 12" localhost:3000

# Save to file
npx playwright codegen -o tests/generated.spec.ts localhost:3000
```

### Debugging in Tests

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');

  // Pause execution, open debugger
  await page.pause();

  // Slow motion execution
  await page.click('button', { delay: 1000 });

  // Console output
  console.log('Current URL:', page.url());

  // Screenshot for debugging
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

## Best Practices

### Test Organization

```typescript
// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('valid credentials', () => {
    test('should login successfully', async ({ page }) => {
      // Test code
    });

    test('should remember login state', async ({ page }) => {
      // Test code
    });
  });

  test.describe('invalid credentials', () => {
    test('should show error message', async ({ page }) => {
      // Test code
    });
  });
});
```

### Test Isolation

```typescript
// Using storage state for login reuse
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });

  await browser.close();
}

export default globalSetup;

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  projects: [
    // Tests requiring authentication
    {
      name: 'authenticated',
      use: {
        storageState: 'playwright/.auth/admin.json',
      },
    },
    // Tests not requiring authentication
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
    },
  ],
});
```

### Retry Strategy

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Global retry configuration
  retries: process.env.CI ? 2 : 0,

  // Use test.describe.configure for specific test retries
});

// Retry configuration in tests
test.describe('flaky tests', () => {
  test.describe.configure({ retries: 3 });

  test('test that may fail', async ({ page }) => {
    // Test code
  });
});
```

### Timeout Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Global timeout
  timeout: 30000,

  // Assertion timeout
  expect: {
    timeout: 5000,
  },

  use: {
    // Action timeout
    actionTimeout: 10000,
    // Navigation timeout
    navigationTimeout: 30000,
  },
});

// Setting timeout in tests
test('long running test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes

  // Timeout for specific action
  await page.click('button', { timeout: 10000 });
});
```

## Summary

Playwright is a powerful end-to-end testing framework that provides:

- **Cross-browser Support**: One codebase covering all major browsers
- **Powerful Locators**: Semantic element location methods
- **Auto-waiting**: Smart waiting mechanisms to reduce test flakiness
- **Network Interception**: Flexible API mocking capabilities
- **Visual Testing**: Built-in screenshot comparison functionality
- **Debugging Tools**: UI mode, trace viewer, and other rich debugging capabilities

Key takeaways:

1. **Use Semantic Locators**: Prefer `getByRole`, `getByLabel`, and similar locators
2. **Adopt Page Object Pattern**: Improve test maintainability
3. **Use Fixtures Wisely**: Achieve test setup reusability
4. **Network Mocking**: Isolate external dependencies for test stability
5. **CI Integration**: Incorporate tests into continuous integration pipelines

With Playwright, you can build reliable and efficient end-to-end test suites to ensure application quality.
