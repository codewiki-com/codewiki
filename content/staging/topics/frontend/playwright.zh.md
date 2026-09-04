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
origin: old/src/content/docs/frontend/playwright.zh.md
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

Playwright 是由微软开发的现代化端到端测试框架，支持 Chromium、Firefox 和 WebKit 三大浏览器引擎。它提供了强大的自动等待机制、网络拦截、多页面测试等功能，是进行 Web 应用自动化测试的理想选择。

## 为什么选择 Playwright

### 核心优势

1. **跨浏览器支持**：一套代码，三大浏览器引擎（Chromium、Firefox、WebKit）
2. **自动等待**：智能等待元素可操作，无需手动添加等待逻辑
3. **网络拦截**：强大的网络请求拦截和模拟能力
4. **多上下文**：支持多个浏览器上下文，实现真正的并行测试
5. **追踪与调试**：内置追踪查看器，方便调试失败的测试
6. **代码生成**：支持录制用户操作自动生成测试代码

### 与其他框架对比

| 特性 | Playwright | Cypress | Selenium |
|------|------------|---------|----------|
| 跨浏览器 | Chromium/Firefox/WebKit | 主要 Chromium | 所有主流浏览器 |
| 执行速度 | 快 | 快 | 较慢 |
| 自动等待 | 内置 | 内置 | 需手动处理 |
| 网络拦截 | 强大 | 强大 | 有限 |
| 多标签页 | 原生支持 | 有限 | 支持 |
| 移动端模拟 | 支持 | 有限 | 有限 |

## 安装与配置

### 基础安装

```bash
# 使用 npm 安装
npm init playwright@latest

# 或手动安装
npm install -D @playwright/test
npx playwright install
```

安装向导会询问以下配置：
- 是否使用 TypeScript
- 测试文件存放目录
- 是否添加 GitHub Actions 工作流
- 是否安装浏览器

### 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试文件目录
  testDir: './tests',

  // 完全并行执行测试
  fullyParallel: true,

  // CI 环境下禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 环境下失败重试次数
  retries: process.env.CI ? 2 : 0,

  // 并行工作进程数
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: 'html',

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 失败时收集追踪信息
    trace: 'on-first-retry',

    // 失败时截图
    screenshot: 'only-on-failure',

    // 录制视频
    video: 'retain-on-failure',
  },

  // 浏览器项目配置
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
    // 移动端测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 启动本地开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### 扩展配置选项

```typescript
// playwright.config.ts - 高级配置
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // 测试超时时间（毫秒）
  timeout: 30000,

  // 断言超时时间
  expect: {
    timeout: 10000,
    // 视觉对比配置
    toHaveScreenshot: {
      maxDiffPixels: 10,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },

  // 全局设置和清理
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  // 输出目录
  outputDir: 'test-results/',

  use: {
    // 浏览器上下文选项
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',

    // 地理位置模拟
    geolocation: { longitude: 116.4074, latitude: 39.9042 },
    permissions: ['geolocation'],

    // HTTP 认证
    httpCredentials: {
      username: 'user',
      password: 'pass',
    },

    // 额外 HTTP 头
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN',
    },
  },
});
```

## 定位器（Locators）

Playwright 提供了多种定位元素的方式，推荐使用语义化的定位器以提高测试的可维护性和可读性。

### 推荐的定位器

#### getByRole - 按角色定位

```typescript
import { test, expect } from '@playwright/test';

test('使用角色定位器', async ({ page }) => {
  await page.goto('/');

  // 定位标题
  await expect(page.getByRole('heading', { name: '欢迎' })).toBeVisible();

  // 定位按钮
  await page.getByRole('button', { name: '提交' }).click();

  // 定位链接
  await page.getByRole('link', { name: '了解更多' }).click();

  // 定位复选框
  await page.getByRole('checkbox', { name: '同意条款' }).check();

  // 定位文本框
  await page.getByRole('textbox', { name: '用户名' }).fill('张三');

  // 定位下拉菜单
  await page.getByRole('combobox', { name: '城市' }).selectOption('北京');

  // 定位导航
  const nav = page.getByRole('navigation');
  await expect(nav).toBeVisible();
});
```

#### getByLabel - 按标签定位

```typescript
test('使用标签定位表单元素', async ({ page }) => {
  await page.goto('/login');

  // 通过关联的 label 定位输入框
  await page.getByLabel('邮箱').fill('user@example.com');
  await page.getByLabel('密码').fill('secret123');

  // 也适用于 aria-label
  await page.getByLabel('搜索').fill('Playwright');
});
```

#### getByPlaceholder - 按占位符定位

```typescript
test('使用占位符定位', async ({ page }) => {
  await page.goto('/search');

  await page.getByPlaceholder('请输入搜索关键词').fill('测试');
  await page.getByPlaceholder('请输入邮箱地址').fill('test@example.com');
});
```

#### getByText - 按文本内容定位

```typescript
test('使用文本内容定位', async ({ page }) => {
  await page.goto('/');

  // 包含文本
  await page.getByText('欢迎访问').click();

  // 精确匹配
  await page.getByText('登录', { exact: true }).click();

  // 使用正则表达式
  await page.getByText(/价格：\d+元/).click();
});
```

#### getByTestId - 按测试 ID 定位

```typescript
test('使用测试 ID 定位', async ({ page }) => {
  await page.goto('/dashboard');

  // 定位带有 data-testid 属性的元素
  await page.getByTestId('user-menu').click();
  await page.getByTestId('logout-button').click();

  // 适合复杂组件的精确定位
  const card = page.getByTestId('product-card-123');
  await card.getByRole('button', { name: '加入购物车' }).click();
});
```

### 定位器链式调用

```typescript
test('链式定位', async ({ page }) => {
  await page.goto('/products');

  // 在特定容器内定位
  const productCard = page.getByTestId('product-card').first();

  // 在卡片内定位元素
  await productCard.getByRole('button', { name: '购买' }).click();
  await expect(productCard.getByText('已添加')).toBeVisible();

  // 多层嵌套定位
  const header = page.getByRole('banner');
  const nav = header.getByRole('navigation');
  await nav.getByRole('link', { name: '首页' }).click();
});
```

### 定位器过滤

```typescript
test('过滤定位器', async ({ page }) => {
  await page.goto('/products');

  // 按文本过滤
  const button = page.getByRole('button').filter({ hasText: '确认' });
  await button.click();

  // 按子元素过滤
  const card = page.getByTestId('product-card').filter({
    has: page.getByText('热销'),
  });
  await card.click();

  // 按不包含条件过滤
  const availableProduct = page.getByTestId('product-card').filter({
    hasNot: page.getByText('售罄'),
  });
  await availableProduct.first().click();
});
```

### CSS 和 XPath 定位器

```typescript
test('CSS 和 XPath 定位', async ({ page }) => {
  await page.goto('/');

  // CSS 选择器（不推荐作为首选）
  await page.locator('.btn-primary').click();
  await page.locator('#submit-button').click();
  await page.locator('[data-custom="value"]').click();

  // XPath（不推荐作为首选）
  await page.locator('//button[text()="提交"]').click();

  // 组合选择器
  await page.locator('article:has-text("Playwright")').click();
  await page.locator('div.card >> text=购买').click();
});
```

## 断言（Assertions）

Playwright 提供了丰富的断言方法，支持自动等待和重试。

### 页面断言

```typescript
import { test, expect } from '@playwright/test';

test('页面断言', async ({ page }) => {
  await page.goto('/');

  // URL 断言
  await expect(page).toHaveURL('/');
  await expect(page).toHaveURL(/.*dashboard/);

  // 标题断言
  await expect(page).toHaveTitle('首页 - 我的应用');
  await expect(page).toHaveTitle(/首页/);
});
```

### 元素断言

```typescript
test('元素断言', async ({ page }) => {
  await page.goto('/dashboard');

  const button = page.getByRole('button', { name: '提交' });
  const input = page.getByLabel('用户名');
  const checkbox = page.getByRole('checkbox');

  // 可见性断言
  await expect(button).toBeVisible();
  await expect(page.getByTestId('loading')).not.toBeVisible();
  await expect(page.getByTestId('hidden')).toBeHidden();

  // 状态断言
  await expect(button).toBeEnabled();
  await expect(page.getByRole('button', { name: '禁用' })).toBeDisabled();
  await expect(checkbox).toBeChecked();
  await expect(input).toBeEditable();

  // 文本断言
  await expect(page.getByTestId('message')).toHaveText('操作成功');
  await expect(page.getByTestId('message')).toContainText('成功');

  // 属性断言
  await expect(input).toHaveAttribute('placeholder', '请输入用户名');
  await expect(button).toHaveClass(/btn-primary/);
  await expect(input).toHaveValue('张三');

  // 计数断言
  await expect(page.getByRole('listitem')).toHaveCount(5);

  // 聚焦断言
  await expect(input).toBeFocused();
});
```

### 软断言

```typescript
test('软断言 - 不会立即终止测试', async ({ page }) => {
  await page.goto('/');

  // 软断言不会在失败时立即终止测试
  await expect.soft(page.getByTestId('status')).toHaveText('在线');
  await expect.soft(page.getByTestId('count')).toHaveText('10');

  // 继续执行其他检查
  await page.getByRole('button').click();

  // 在测试结束时，所有软断言的失败都会被报告
});
```

### 自定义超时

```typescript
test('自定义断言超时', async ({ page }) => {
  await page.goto('/slow-page');

  // 为特定断言设置超时
  await expect(page.getByTestId('data')).toHaveText('已加载', {
    timeout: 30000,
  });

  // 轮询断言
  await expect(async () => {
    const response = await page.request.get('/api/status');
    expect(response.status()).toBe(200);
  }).toPass({
    timeout: 60000,
    intervals: [1000, 2000, 5000],
  });
});
```

## Fixtures（测试夹具）

Fixtures 是 Playwright 的核心概念，用于为测试提供可重用的上下文和资源。

### 内置 Fixtures

```typescript
import { test, expect } from '@playwright/test';

test('使用内置 fixtures', async ({
  page,      // 浏览器页面
  context,   // 浏览器上下文
  browser,   // 浏览器实例
  request,   // API 请求上下文
}) => {
  // page fixture - 每个测试独立的页面
  await page.goto('/');

  // context fixture - 可用于多页面测试
  const newPage = await context.newPage();
  await newPage.goto('/other');

  // request fixture - 用于 API 测试
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
});
```

### 自定义 Fixtures

```typescript
// fixtures.ts
import { test as base, expect } from '@playwright/test';

// 定义用户类型
interface User {
  username: string;
  password: string;
}

// 定义 fixtures 类型
type MyFixtures = {
  user: User;
  authenticatedPage: typeof base.page;
};

// 扩展基础测试
export const test = base.extend<MyFixtures>({
  // 简单数据 fixture
  user: async ({}, use) => {
    const user: User = {
      username: 'testuser',
      password: 'password123',
    };
    await use(user);
  },

  // 带设置和清理的 fixture
  authenticatedPage: async ({ page, user }, use) => {
    // 设置：登录
    await page.goto('/login');
    await page.getByLabel('用户名').fill(user.username);
    await page.getByLabel('密码').fill(user.password);
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL('/dashboard');

    // 提供给测试使用
    await use(page);

    // 清理：登出
    await page.getByTestId('logout').click();
  },
});

export { expect };

// 使用自定义 fixtures
// tests/dashboard.spec.ts
import { test, expect } from './fixtures';

test('仪表盘显示用户信息', async ({ authenticatedPage, user }) => {
  await expect(
    authenticatedPage.getByText(`欢迎, ${user.username}`)
  ).toBeVisible();
});
```

### 参数化 Fixtures

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
  // Worker 级别的选项
  environment: ['development', { option: true, scope: 'worker' }],

  // 基于环境的 URL
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

### 数据库 Fixture 示例

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
    // 创建测试用户
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: '测试用户',
      },
    });

    await use(user);

    // 清理测试数据
    await db.user.delete({ where: { id: user.id } });
  },
});
```

## Page Object 模式

Page Object 模式是一种设计模式，将页面的元素定位和操作封装到类中，提高测试的可维护性。

### 基础 Page Object

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
    this.emailInput = page.getByLabel('邮箱');
    this.passwordInput = page.getByLabel('密码');
    this.loginButton = page.getByRole('button', { name: '登录' });
    this.errorMessage = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: '忘记密码' });
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
    this.logoutButton = page.getByRole('button', { name: '退出登录' });
    this.sidebar = page.getByRole('navigation', { name: '侧边栏' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutButton.click();
  }

  async expectWelcome(username: string) {
    await expect(this.welcomeMessage).toContainText(`欢迎, ${username}`);
  }

  async navigateTo(menuItem: string) {
    await this.sidebar.getByRole('link', { name: menuItem }).click();
  }
}
```

### 使用 Page Object 的测试

```typescript
// tests/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('用户认证', () => {
  test('成功登录', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');

    await loginPage.expectLoginSuccess();
    await dashboardPage.expectWelcome('user');
  });

  test('登录失败 - 错误凭证', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'wrongpassword');

    await loginPage.expectError('邮箱或密码错误');
  });

  test('登出', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 先登录
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');
    await loginPage.expectLoginSuccess();

    // 然后登出
    await dashboardPage.logout();

    // 验证返回登录页
    await expect(page).toHaveURL('/login');
  });
});
```

### Page Object 与 Fixtures 结合

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

test('购买商品流程', async ({ loginPage, dashboardPage, productPage }) => {
  // 登录
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  // 导航到商品页
  await dashboardPage.navigateTo('商品列表');

  // 选择商品
  await productPage.selectProduct('iPhone 15');
  await productPage.addToCart();

  // 验证购物车
  await expect(productPage.cartBadge).toHaveText('1');
});
```

### 组件级 Page Object

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
    this.logo = this.container.getByRole('link', { name: '首页' });
    this.searchInput = this.container.getByPlaceholder('搜索商品');
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

// pages/BasePage.ts - 包含共享组件
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

## 网络模拟（Network Mocking）

Playwright 提供了强大的网络请求拦截和模拟能力，可以模拟 API 响应、测试错误场景等。

### 基础路由拦截

```typescript
import { test, expect } from '@playwright/test';

test('模拟 API 响应', async ({ page }) => {
  // 拦截 API 请求并返回模拟数据
  await page.route('**/api/users', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: '张三', email: 'zhangsan@example.com' },
        { id: 2, name: '李四', email: 'lisi@example.com' },
      ]),
    });
  });

  await page.goto('/users');

  // 验证模拟数据已渲染
  await expect(page.getByText('张三')).toBeVisible();
  await expect(page.getByText('李四')).toBeVisible();
});
```

### 模拟错误响应

```typescript
test('模拟服务器错误', async ({ page }) => {
  await page.route('**/api/data', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: '服务器内部错误' }),
    });
  });

  await page.goto('/data');

  // 验证错误处理
  await expect(page.getByText('加载失败，请重试')).toBeVisible();
});

test('模拟网络超时', async ({ page }) => {
  await page.route('**/api/slow', async (route) => {
    // 延迟响应
    await new Promise((resolve) => setTimeout(resolve, 30000));
    await route.fulfill({ status: 200, body: 'OK' });
  });

  await page.goto('/slow-page');

  // 验证超时处理
  await expect(page.getByText('请求超时')).toBeVisible();
});

test('模拟网络中断', async ({ page }) => {
  await page.route('**/api/data', async (route) => {
    await route.abort('failed');
  });

  await page.goto('/data');

  await expect(page.getByText('网络错误')).toBeVisible();
});
```

### 条件路由

```typescript
test('条件路由拦截', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const request = route.request();

    // 根据请求方法处理
    if (request.method() === 'POST') {
      const postData = request.postDataJSON();

      if (postData?.email === 'invalid@test.com') {
        await route.fulfill({
          status: 400,
          body: JSON.stringify({ error: '无效的邮箱地址' }),
        });
        return;
      }
    }

    // 根据 URL 处理
    if (request.url().includes('/users/')) {
      const userId = request.url().split('/users/')[1];
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ id: userId, name: `用户${userId}` }),
      });
      return;
    }

    // 其他请求继续正常处理
    await route.continue();
  });
});
```

### 修改请求和响应

```typescript
test('修改请求头', async ({ page }) => {
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

test('修改响应内容', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    // 获取真实响应
    const response = await route.fetch();
    const json = await response.json();

    // 修改响应数据
    const modifiedProducts = json.map((product: any) => ({
      ...product,
      price: product.price * 0.8, // 8折价格
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

### 使用 HAR 文件

```typescript
// 录制 HAR 文件
test('录制网络请求', async ({ page }) => {
  // 开始录制
  await page.routeFromHAR('recordings/api.har', {
    update: true, // 更新模式，会录制新请求
  });

  await page.goto('/');
  // 进行操作...

  // HAR 文件会保存所有网络请求
});

// 使用录制的 HAR 文件回放
test('使用 HAR 回放', async ({ page }) => {
  await page.routeFromHAR('recordings/api.har', {
    update: false, // 回放模式
  });

  await page.goto('/');
  // 网络请求会使用录制的响应
});
```

### 等待网络请求

```typescript
test('等待特定请求', async ({ page }) => {
  // 开始等待请求（在触发操作之前）
  const requestPromise = page.waitForRequest('**/api/submit');

  await page.goto('/form');
  await page.getByLabel('名称').fill('测试');
  await page.getByRole('button', { name: '提交' }).click();

  // 等待请求完成并验证
  const request = await requestPromise;
  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toMatchObject({ name: '测试' });
});

test('等待响应', async ({ page }) => {
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

## 视觉对比测试

Playwright 支持截图对比，用于检测 UI 的视觉变化。

### 基础截图对比

```typescript
import { test, expect } from '@playwright/test';

test('页面视觉对比', async ({ page }) => {
  await page.goto('/');

  // 整页截图对比
  await expect(page).toHaveScreenshot('homepage.png');
});

test('元素视觉对比', async ({ page }) => {
  await page.goto('/');

  // 特定元素截图对比
  const header = page.getByRole('banner');
  await expect(header).toHaveScreenshot('header.png');

  const button = page.getByRole('button', { name: '提交' });
  await expect(button).toHaveScreenshot('submit-button.png');
});
```

### 截图对比配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // 允许的像素差异数量
      maxDiffPixels: 100,

      // 允许的像素差异比例
      maxDiffPixelRatio: 0.02,

      // 截图对比阈值
      threshold: 0.2,

      // 动画处理
      animations: 'disabled',

      // 缩放因子
      scale: 'device',
    },
  },
});

// 测试中覆盖配置
test('自定义截图对比', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveScreenshot('page.png', {
    maxDiffPixels: 50,
    threshold: 0.3,
    fullPage: true,
    mask: [page.getByTestId('dynamic-content')], // 遮罩动态内容
  });
});
```

### 处理动态内容

```typescript
test('处理动态内容', async ({ page }) => {
  await page.goto('/dashboard');

  // 等待动态内容加载完成
  await page.waitForLoadState('networkidle');

  // 遮罩动态区域
  await expect(page).toHaveScreenshot('dashboard.png', {
    mask: [
      page.getByTestId('current-time'),
      page.getByTestId('random-ad'),
      page.locator('.dynamic-chart'),
    ],
  });
});

test('使用 CSS 隐藏动态元素', async ({ page }) => {
  await page.goto('/');

  // 隐藏特定元素后截图
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

### 多主题和响应式测试

```typescript
test.describe('视觉回归测试', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} 视图`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/');
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);
    });
  }
});

test.describe('主题测试', () => {
  test('浅色主题', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page).toHaveScreenshot('homepage-light.png');
  });

  test('深色主题', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

### 更新基准截图

```bash
# 更新所有截图
npx playwright test --update-snapshots

# 更新特定测试的截图
npx playwright test visual.spec.ts --update-snapshots
```

## CI 集成

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

### 分片并行测试

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

### Docker 配置

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

## 调试技巧

### UI 模式

```bash
# 启动 UI 模式
npx playwright test --ui

# 在特定浏览器中打开
npx playwright test --ui --project=chromium
```

### 调试模式

```bash
# 启用调试器
npx playwright test --debug

# 调试特定测试
npx playwright test -g "登录" --debug

# 使用 PWDEBUG 环境变量
PWDEBUG=1 npx playwright test
```

### 追踪查看器

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // 记录追踪信息
    trace: 'on-first-retry', // 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
  },
});

// 查看追踪
// npx playwright show-trace trace.zip
```

### 测试生成器

```bash
# 启动代码生成器
npx playwright codegen localhost:3000

# 指定浏览器和设备
npx playwright codegen --device="iPhone 12" localhost:3000

# 保存到文件
npx playwright codegen -o tests/generated.spec.ts localhost:3000
```

### 测试中的调试

```typescript
test('调试测试', async ({ page }) => {
  await page.goto('/');

  // 暂停执行，打开调试器
  await page.pause();

  // 慢动作执行
  await page.click('button', { delay: 1000 });

  // 控制台输出
  console.log('当前 URL:', page.url());

  // 截图调试
  await page.screenshot({ path: 'debug-screenshot.png' });
});
```

## 最佳实践

### 测试组织

```typescript
// tests/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test.describe('有效凭证', () => {
    test('应该成功登录', async ({ page }) => {
      // 测试代码
    });

    test('应该记住登录状态', async ({ page }) => {
      // 测试代码
    });
  });

  test.describe('无效凭证', () => {
    test('应该显示错误信息', async ({ page }) => {
      // 测试代码
    });
  });
});
```

### 测试隔离

```typescript
// 使用存储状态实现登录复用
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.getByLabel('邮箱').fill('admin@example.com');
  await page.getByLabel('密码').fill('admin123');
  await page.getByRole('button', { name: '登录' }).click();

  // 保存认证状态
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });

  await browser.close();
}

export default globalSetup;

// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  projects: [
    // 需要认证的测试
    {
      name: 'authenticated',
      use: {
        storageState: 'playwright/.auth/admin.json',
      },
    },
    // 不需要认证的测试
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
    },
  ],
});
```

### 重试策略

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // 全局重试配置
  retries: process.env.CI ? 2 : 0,

  // 使用 test.describe.configure 设置特定测试的重试
});

// 测试中的重试配置
test.describe('不稳定的测试', () => {
  test.describe.configure({ retries: 3 });

  test('可能失败的测试', async ({ page }) => {
    // 测试代码
  });
});
```

### 超时配置

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // 全局超时
  timeout: 30000,

  // 断言超时
  expect: {
    timeout: 5000,
  },

  use: {
    // 操作超时
    actionTimeout: 10000,
    // 导航超时
    navigationTimeout: 30000,
  },
});

// 测试中设置超时
test('长时间运行的测试', async ({ page }) => {
  test.setTimeout(120000); // 2分钟

  // 特定操作的超时
  await page.click('button', { timeout: 10000 });
});
```

## 总结

Playwright 是一个功能强大的端到端测试框架，提供了：

- **跨浏览器支持**：一套代码覆盖所有主流浏览器
- **强大的定位器**：语义化的元素定位方式
- **自动等待**：智能等待机制，减少测试 flakiness
- **网络拦截**：灵活的 API 模拟能力
- **视觉测试**：内置截图对比功能
- **调试工具**：UI 模式、追踪查看器等丰富的调试手段

关键要点：

1. **使用语义化定位器**：优先使用 `getByRole`、`getByLabel` 等定位器
2. **采用 Page Object 模式**：提高测试的可维护性
3. **合理使用 Fixtures**：实现测试设置的复用
4. **网络模拟**：隔离外部依赖，提高测试稳定性
5. **CI 集成**：将测试纳入持续集成流程

掌握 Playwright，将帮助你构建可靠、高效的端到端测试套件，保障应用质量。
