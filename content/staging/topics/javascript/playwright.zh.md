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
origin: old/src/content/docs/javascript/playwright.zh.md
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

## 概念解释

Playwright 是由 Microsoft 开发的现代端到端（E2E）测试框架，支持 Chromium、Firefox 和 WebKit 浏览器的自动化测试。它提供了强大的 API 来模拟用户在浏览器中的真实行为，帮助开发者验证 Web 应用程序的功能和用户体验。

### 为什么选择 Playwright

1. **跨浏览器支持**：一套代码测试 Chrome、Firefox、Safari
2. **自动等待**：内置智能等待机制，无需手动添加 sleep
3. **可靠性**：基于浏览器协议直接通信，稳定性高
4. **并行执行**：开箱即用的并行测试支持
5. **丰富的工具链**：代码生成器、调试器、追踪查看器
6. **网络拦截**：支持 Mock API 和网络请求拦截

### 历史背景

Playwright 于 2020 年由 Microsoft 发布，其核心团队成员来自 Google 的 Puppeteer 项目。Playwright 在 Puppeteer 的基础上进行了重大改进，增加了跨浏览器支持和更强大的测试功能。

## 核心原理

### 架构设计

Playwright 采用客户端-服务器架构：

```
┌─────────────────┐     ┌──────────────────┐
│   测试代码       │ ──► │  Playwright      │
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

### 浏览器上下文隔离

Playwright 的 BrowserContext 提供了完全隔离的浏览器会话：

```javascript
// 每个 Context 拥有独立的 cookies、localStorage、缓存等
const context1 = await browser.newContext();
const context2 = await browser.newContext();

// context1 和 context2 完全隔离
const page1 = await context1.newPage();
const page2 = await context2.newPage();
```

### 自动等待机制

Playwright 在执行操作前会自动等待元素满足特定条件：

1. **Attached**：元素已挂载到 DOM
2. **Visible**：元素可见
3. **Stable**：元素位置稳定（无动画）
4. **Enabled**：元素可交互
5. **Editable**：输入框可编辑（针对输入操作）

```javascript
// Playwright 会自动等待按钮可点击
await page.click('button#submit');

// 无需手动添加等待
// 错误做法：
// await page.waitForTimeout(1000);
// await page.click('button#submit');
```

## 核心要点

### 项目初始化

```bash
# 创建新的 Playwright 项目
npm init playwright@latest

# 目录结构
my-project/
├── tests/
│   └── example.spec.ts
├── playwright.config.ts
├── package.json
└── tests-examples/
    └── demo-todo-app.spec.ts
```

### 配置文件

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 测试目录
  testDir: './tests',

  // 每个测试的超时时间
  timeout: 30 * 1000,

  // 期望断言的超时时间
  expect: {
    timeout: 5000
  },

  // 完全并行运行测试
  fullyParallel: true,

  // CI 环境下失败时不重试
  forbidOnly: !!process.env.CI,

  // 重试次数
  retries: process.env.CI ? 2 : 0,

  // 并行 worker 数量
  workers: process.env.CI ? 1 : undefined,

  // 报告器配置
  reporter: 'html',

  // 所有项目共享的配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 失败时收集追踪信息
    trace: 'on-first-retry',

    // 截图策略
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'retain-on-failure',
  },

  // 多浏览器配置
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

  // 本地开发服务器配置
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 基本测试结构

```typescript
import { test, expect } from '@playwright/test';

test.describe('登录功能', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('成功登录', async ({ page }) => {
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('.welcome-message')).toContainText('欢迎');
  });

  test('登录失败显示错误信息', async ({ page }) => {
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('用户名或密码错误');
  });
});
```

## 代码示例

### 选择器（Selectors）

Playwright 提供多种选择器策略，推荐使用语义化选择器：

```typescript
import { test, expect } from '@playwright/test';

test('选择器示例', async ({ page }) => {
  await page.goto('/form');

  // ============ 推荐的选择器 ============

  // 1. getByRole - 基于 ARIA 角色（最推荐）
  await page.getByRole('button', { name: '提交' }).click();
  await page.getByRole('textbox', { name: '用户名' }).fill('admin');
  await page.getByRole('checkbox', { name: '记住我' }).check();
  await page.getByRole('link', { name: '忘记密码' }).click();

  // 2. getByLabel - 基于 label 关联
  await page.getByLabel('邮箱地址').fill('user@example.com');
  await page.getByLabel('密码').fill('secret123');

  // 3. getByPlaceholder - 基于 placeholder
  await page.getByPlaceholder('请输入搜索关键词').fill('Playwright');

  // 4. getByText - 基于文本内容
  await page.getByText('立即注册').click();
  await page.getByText(/欢迎.*登录/).isVisible();

  // 5. getByAltText - 基于 alt 属性
  await page.getByAltText('公司Logo').click();

  // 6. getByTitle - 基于 title 属性
  await page.getByTitle('设置选项').click();

  // 7. getByTestId - 基于 data-testid（需要配置）
  await page.getByTestId('submit-button').click();

  // ============ CSS 选择器 ============

  await page.locator('.login-form').isVisible();
  await page.locator('#username').fill('admin');
  await page.locator('[data-cy="password"]').fill('secret');
  await page.locator('button.primary:not([disabled])').click();

  // ============ XPath 选择器 ============

  await page.locator('//button[contains(text(), "提交")]').click();
  await page.locator('//div[@class="container"]//input').fill('value');

  // ============ 链式选择器 ============

  // 在特定容器内查找
  const form = page.locator('.login-form');
  await form.locator('input[name="username"]').fill('admin');
  await form.locator('button[type="submit"]').click();

  // 组合过滤
  await page
    .getByRole('listitem')
    .filter({ hasText: '待办事项' })
    .getByRole('button', { name: '删除' })
    .click();

  // ============ 索引选择器 ============

  // 获取第一个/最后一个/第N个元素
  await page.locator('.item').first().click();
  await page.locator('.item').last().click();
  await page.locator('.item').nth(2).click(); // 第三个（从0开始）
});
```

### 断言（Assertions）

```typescript
import { test, expect } from '@playwright/test';

test('断言示例', async ({ page }) => {
  await page.goto('/products');

  // ============ 页面级断言 ============

  // URL 断言
  await expect(page).toHaveURL('/products');
  await expect(page).toHaveURL(/.*products.*/);

  // 标题断言
  await expect(page).toHaveTitle('产品列表');
  await expect(page).toHaveTitle(/产品/);

  // ============ 元素可见性断言 ============

  const header = page.locator('h1');
  await expect(header).toBeVisible();
  await expect(header).toBeHidden();
  await expect(header).toBeAttached();
  await expect(header).toBeDetached();

  // ============ 元素状态断言 ============

  const button = page.getByRole('button', { name: '提交' });
  await expect(button).toBeEnabled();
  await expect(button).toBeDisabled();

  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).toBeChecked();
  await expect(checkbox).not.toBeChecked();

  const input = page.getByLabel('用户名');
  await expect(input).toBeEditable();
  await expect(input).toBeFocused();
  await expect(input).toBeEmpty();

  // ============ 文本内容断言 ============

  const message = page.locator('.message');
  await expect(message).toHaveText('操作成功');
  await expect(message).toHaveText(/成功/);
  await expect(message).toContainText('成功');

  // 多元素文本断言
  const items = page.locator('.list-item');
  await expect(items).toHaveText(['苹果', '香蕉', '橙子']);
  await expect(items).toContainText(['苹果', '橙子']);

  // ============ 属性断言 ============

  const link = page.getByRole('link', { name: '首页' });
  await expect(link).toHaveAttribute('href', '/');
  await expect(link).toHaveAttribute('target', '_blank');

  const element = page.locator('.card');
  await expect(element).toHaveClass('card active');
  await expect(element).toHaveClass(/active/);
  await expect(element).toHaveId('main-card');

  const inputField = page.getByLabel('数量');
  await expect(inputField).toHaveValue('10');

  // CSS 属性断言
  await expect(element).toHaveCSS('display', 'flex');
  await expect(element).toHaveCSS('color', 'rgb(0, 0, 0)');

  // ============ 数量断言 ============

  const products = page.locator('.product-card');
  await expect(products).toHaveCount(12);

  // ============ 截图断言（视觉对比） ============

  await expect(page).toHaveScreenshot('products-page.png');
  await expect(element).toHaveScreenshot('product-card.png');

  // ============ 软断言（不立即失败） ============

  await expect.soft(header).toBeVisible();
  await expect.soft(button).toBeEnabled();
  // 即使前面的断言失败，后面的代码也会继续执行

  // ============ 自定义超时 ============

  await expect(element).toBeVisible({ timeout: 10000 });

  // ============ 轮询断言 ============

  // 等待某个条件为真（用于复杂场景）
  await expect.poll(async () => {
    const count = await page.locator('.item').count();
    return count;
  }).toBe(5);

  // ============ 通用值断言 ============

  const text = await page.textContent('.message');
  expect(text).toBe('Hello');
  expect(text).toContain('ello');
  expect(text).toMatch(/^Hello/);

  const count = await page.locator('.item').count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(10);
});
```

### 页面对象模式（Page Object Model）

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
    this.usernameInput = page.getByLabel('用户名');
    this.passwordInput = page.getByLabel('密码');
    this.submitButton = page.getByRole('button', { name: '登录' });
    this.errorMessage = page.locator('.error-message');
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: '记住我' });
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
    this.logoutButton = page.getByRole('button', { name: '退出' });
    this.userMenu = page.getByRole('button', { name: '用户菜单' });
    this.sidebarItems = page.locator('.sidebar-item');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectWelcomeMessage(username: string) {
    await expect(this.welcomeMessage).toContainText(`欢迎，${username}`);
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

// pages/index.ts - 页面对象导出
export { LoginPage } from './LoginPage';
export { DashboardPage } from './DashboardPage';

// tests/login.spec.ts - 使用页面对象
import { test } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

test.describe('用户登录', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test('成功登录并查看仪表板', async () => {
    await loginPage.login('admin', 'password123');
    await loginPage.expectLoginSuccess();
    await dashboardPage.expectWelcomeMessage('admin');
  });

  test('登录失败显示错误信息', async () => {
    await loginPage.login('wrong', 'wrong');
    await loginPage.expectErrorMessage('用户名或密码错误');
  });

  test('记住我功能', async () => {
    await loginPage.login('admin', 'password123', true);
    await loginPage.expectLoginSuccess();
  });
});
```

### Fixtures（测试夹具）

```typescript
// fixtures/auth.fixture.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';

// 定义 fixture 类型
type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: DashboardPage;
};

// 扩展基础 test
export const test = base.extend<AuthFixtures>({
  // 基础页面对象 fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // 已认证的页面 fixture
  authenticatedPage: async ({ page }, use) => {
    // 设置认证状态
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'password123');

    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);

    // 清理：退出登录
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
  // 创建测试用户
  testUser: async ({}, use) => {
    // 在数据库中创建用户
    const user = await createTestUser({
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
    });

    await use(user);

    // 测试后删除用户
    await deleteTestUser(user.id);
  },

  // 数据库清理 fixture
  cleanupDatabase: [async ({}, use) => {
    await use();
    // 测试后清理数据库
    await resetTestDatabase();
  }, { auto: true }], // auto: true 表示自动应用
});

// fixtures/combined.fixture.ts - 组合多个 fixtures
import { mergeTests } from '@playwright/test';
import { test as authTest } from './auth.fixture';
import { test as databaseTest } from './database.fixture';

export const test = mergeTests(authTest, databaseTest);
export { expect } from '@playwright/test';

// tests/user-profile.spec.ts - 使用 fixtures
import { test, expect } from '../fixtures/combined.fixture';

test.describe('用户资料', () => {
  test('查看个人资料', async ({ authenticatedPage }) => {
    await authenticatedPage.navigateTo('个人资料');
    // authenticatedPage 已经是登录状态
  });

  test('更新用户信息', async ({ authenticatedPage, testUser }) => {
    // testUser 是自动创建的测试用户
    console.log(`Testing with user: ${testUser.username}`);
    await authenticatedPage.navigateTo('设置');
  });
});

// 全局 fixtures（在 playwright.config.ts 中使用）
// fixtures/global.fixture.ts
import { test as base, expect } from '@playwright/test';

export const test = base.extend<{}, { workerStorageState: string }>({
  // Worker 级别的 fixture（在所有测试共享）
  workerStorageState: [async ({ browser }, use) => {
    // 创建新的 context 进行登录
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.getByLabel('用户名').fill('admin');
    await page.getByLabel('密码').fill('password123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/dashboard');

    // 保存存储状态
    const storageState = await context.storageState();
    const path = `./playwright/.auth/user.json`;
    await context.storageState({ path });

    await context.close();
    await use(path);
  }, { scope: 'worker' }],
});
```

### 并行测试

```typescript
// playwright.config.ts - 并行配置
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // 完全并行模式：不同文件并行，同一文件内的测试也并行
  fullyParallel: true,

  // Worker 数量
  workers: process.env.CI ? 4 : undefined, // CI 中使用 4 个 worker

  // 或者使用百分比
  // workers: '50%', // 使用 CPU 核心数的 50%
});

// tests/parallel.spec.ts - 测试级别的并行控制
import { test, expect } from '@playwright/test';

// 默认情况下，同一文件内的测试顺序执行
test.describe('有序测试组', () => {
  test('测试 1', async ({ page }) => {
    // ...
  });

  test('测试 2', async ({ page }) => {
    // ...
  });
});

// 配置并行执行
test.describe.configure({ mode: 'parallel' });
test.describe('并行测试组', () => {
  test('并行测试 1', async ({ page }) => {
    await page.goto('/page1');
    await expect(page).toHaveTitle(/Page 1/);
  });

  test('并行测试 2', async ({ page }) => {
    await page.goto('/page2');
    await expect(page).toHaveTitle(/Page 2/);
  });

  test('并行测试 3', async ({ page }) => {
    await page.goto('/page3');
    await expect(page).toHaveTitle(/Page 3/);
  });
});

// 串行模式（有依赖关系的测试）
test.describe.configure({ mode: 'serial' });
test.describe('串行测试组', () => {
  test('创建订单', async ({ page }) => {
    await page.goto('/orders/new');
    await page.fill('#product', 'Widget');
    await page.click('#submit');
    await expect(page).toHaveURL(/orders\/\d+/);
  });

  test('查看订单（依赖上一个测试）', async ({ page }) => {
    // 这个测试必须在上一个测试之后运行
    await page.goto('/orders');
    await expect(page.locator('.order-item')).toHaveCount(1);
  });
});

// 使用 test.step 组织测试步骤
test('完整的购物流程', async ({ page }) => {
  await test.step('添加商品到购物车', async () => {
    await page.goto('/products');
    await page.click('.add-to-cart');
    await expect(page.locator('.cart-count')).toHaveText('1');
  });

  await test.step('进入购物车', async () => {
    await page.click('.cart-icon');
    await expect(page).toHaveURL('/cart');
  });

  await test.step('结算', async () => {
    await page.click('#checkout');
    await page.fill('#card-number', '4111111111111111');
    await page.click('#pay');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});

// 使用 sharding 分片在多个机器上运行
// 命令行：npx playwright test --shard=1/3
// 这会只运行第 1 部分（共 3 部分）
```

### 视觉对比测试

```typescript
// playwright.config.ts - 视觉对比配置
import { defineConfig } from '@playwright/test';

export default defineConfig({
  // 视觉对比配置
  expect: {
    toHaveScreenshot: {
      // 允许的像素差异数量
      maxDiffPixels: 100,

      // 或者使用百分比
      // maxDiffPixelRatio: 0.02,

      // 阈值（0-1，值越小越严格）
      threshold: 0.2,

      // 动画处理
      animations: 'disabled',

      // 比较时使用的滤镜
      // caret: 'hide', // 隐藏光标
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  // 更新基准截图
  // updateSnapshots: 'all', // 或 'none', 'missing'
});

// tests/visual.spec.ts - 视觉对比测试
import { test, expect } from '@playwright/test';

test.describe('视觉对比测试', () => {
  test('首页视觉一致性', async ({ page }) => {
    await page.goto('/');

    // 整页截图对比
    await expect(page).toHaveScreenshot('homepage.png');

    // 带配置的截图对比
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixels: 50,
    });
  });

  test('组件视觉对比', async ({ page }) => {
    await page.goto('/components');

    // 单个元素截图
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('header.png');

    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toHaveScreenshot('sidebar.png');

    const card = page.locator('.product-card').first();
    await expect(card).toHaveScreenshot('product-card.png');
  });

  test('响应式设计对比', async ({ page }) => {
    await page.goto('/');

    // 桌面视图
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page).toHaveScreenshot('desktop.png');

    // 平板视图
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot('tablet.png');

    // 手机视图
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot('mobile.png');
  });

  test('处理动态内容', async ({ page }) => {
    await page.goto('/dashboard');

    // 掩码遮盖动态内容
    await expect(page).toHaveScreenshot('dashboard.png', {
      mask: [
        page.locator('.timestamp'),
        page.locator('.random-number'),
        page.locator('.user-avatar'),
      ],
    });

    // 等待字体加载完成
    await page.waitForFunction(() => document.fonts.ready);

    // 禁用动画后截图
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

  test('对比不同状态', async ({ page }) => {
    await page.goto('/form');

    // 空表单状态
    await expect(page.locator('form')).toHaveScreenshot('form-empty.png');

    // 填写表单
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await expect(page.locator('form')).toHaveScreenshot('form-filled.png');

    // 错误状态
    await page.fill('#email', 'invalid');
    await page.click('#submit');
    await expect(page.locator('form')).toHaveScreenshot('form-error.png');

    // 成功状态
    await page.fill('#email', 'john@example.com');
    await page.click('#submit');
    await expect(page.locator('.success-message')).toHaveScreenshot('success.png');
  });
});

// 更新基准截图命令：
// npx playwright test --update-snapshots
// 或在单个测试中：
// npx playwright test visual.spec.ts --update-snapshots
```

### 网络拦截与 Mock

```typescript
import { test, expect } from '@playwright/test';

test.describe('API Mock 测试', () => {
  test('Mock API 响应', async ({ page }) => {
    // 拦截 API 请求并返回 mock 数据
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: '张三', email: 'zhang@example.com' },
          { id: 2, name: '李四', email: 'li@example.com' },
        ]),
      });
    });

    await page.goto('/users');
    await expect(page.locator('.user-item')).toHaveCount(2);
    await expect(page.getByText('张三')).toBeVisible();
  });

  test('Mock 网络错误', async ({ page }) => {
    await page.route('**/api/users', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: '服务器内部错误' }),
      });
    });

    await page.goto('/users');
    await expect(page.locator('.error-message')).toContainText('加载失败');
  });

  test('延迟响应', async ({ page }) => {
    await page.route('**/api/data', async (route) => {
      // 延迟 2 秒
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: 'delayed' }),
      });
    });

    await page.goto('/slow-page');
    // 验证加载状态
    await expect(page.locator('.loading-spinner')).toBeVisible();
    // 等待数据加载完成
    await expect(page.locator('.data-content')).toBeVisible({ timeout: 5000 });
  });

  test('修改响应', async ({ page }) => {
    await page.route('**/api/products', async (route) => {
      // 获取原始响应
      const response = await route.fetch();
      const json = await response.json();

      // 修改响应数据
      json.products = json.products.map((p: any) => ({
        ...p,
        price: p.price * 0.9, // 打九折
      }));

      await route.fulfill({
        response,
        body: JSON.stringify(json),
      });
    });

    await page.goto('/products');
    // 验证折扣价格
  });

  test('拦截并继续请求', async ({ page }) => {
    await page.route('**/api/**', async (route) => {
      // 添加认证头
      const headers = {
        ...route.request().headers(),
        'Authorization': 'Bearer test-token',
      };
      await route.continue({ headers });
    });

    await page.goto('/protected-page');
  });

  test('等待特定网络请求', async ({ page }) => {
    await page.goto('/dashboard');

    // 等待 API 请求完成
    const responsePromise = page.waitForResponse('**/api/stats');
    await page.click('#refresh-stats');
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('totalUsers');
  });

  test('网络请求断言', async ({ page }) => {
    // 监听所有请求
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });

    await page.goto('/');
    await page.click('#load-more');

    // 验证发送了正确的请求
    expect(requests.some(r => r.includes('/api/more-data'))).toBeTruthy();
  });
});
```

## 最佳实践

### 选择器策略优先级

```typescript
// 推荐顺序：
// 1. getByRole - 语义化，对无障碍友好
await page.getByRole('button', { name: '提交' });

// 2. getByLabel - 表单元素
await page.getByLabel('用户名');

// 3. getByPlaceholder
await page.getByPlaceholder('搜索...');

// 4. getByText - 链接或按钮文本
await page.getByText('了解更多');

// 5. getByTestId - 没有语义化选项时
await page.getByTestId('submit-btn');

// 避免：
// - 脆弱的 CSS 选择器：.btn-primary.mt-4
// - XPath（除非必要）
// - 索引选择器：nth(0)
```

### 测试隔离

```typescript
// 每个测试应该独立运行
test.describe('产品管理', () => {
  // 使用 beforeEach 设置初始状态
  test.beforeEach(async ({ page }) => {
    await page.goto('/products');
    // 清理测试数据
    await page.evaluate(() => localStorage.clear());
  });

  test('创建产品', async ({ page }) => {
    // 测试创建功能
  });

  test('删除产品', async ({ page }) => {
    // 不依赖上一个测试创建的产品
    // 先创建测试数据
    await setupTestProduct(page);
    // 然后测试删除
  });
});
```

### 避免硬编码等待

```typescript
// 错误做法
await page.click('#submit');
await page.waitForTimeout(3000); // 不要使用固定等待
await expect(page.locator('.success')).toBeVisible();

// 正确做法
await page.click('#submit');
await expect(page.locator('.success')).toBeVisible(); // 自动等待
```

### 使用 Web-First 断言

```typescript
// 错误做法
const text = await page.textContent('.message');
expect(text).toBe('Success'); // 同步断言，可能不稳定

// 正确做法
await expect(page.locator('.message')).toHaveText('Success');
// Web-First 断言会自动重试
```

### 组织测试文件

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

### CI/CD 集成

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

## 常见陷阱

### 选择器不稳定

```typescript
// 问题：使用脆弱的选择器
await page.click('.mt-4 > div:nth-child(2) > button');

// 解决：使用稳定的选择器
await page.getByRole('button', { name: '添加到购物车' });

// 或添加 data-testid
await page.getByTestId('add-to-cart-btn');
```

### 忽略等待

```typescript
// 问题：操作后立即断言
await page.click('#async-button');
const text = await page.textContent('#result'); // 可能获取到旧值

// 解决：使用 Web-First 断言
await page.click('#async-button');
await expect(page.locator('#result')).toHaveText('完成');
```

### 测试间相互依赖

```typescript
// 问题：测试 B 依赖测试 A 创建的数据
test('A: 创建用户', async ({ page }) => {
  await createUser(page, 'testuser');
});

test('B: 删除用户', async ({ page }) => {
  await deleteUser(page, 'testuser'); // 如果 A 失败，B 也会失败
});

// 解决：每个测试独立设置数据
test('删除用户', async ({ page }) => {
  // 先创建测试所需的用户
  await createUser(page, 'testuser');
  // 然后删除
  await deleteUser(page, 'testuser');
});
```

### 硬编码测试数据

```typescript
// 问题：硬编码数据导致测试脆弱
await page.fill('#email', 'test@example.com'); // 可能已存在

// 解决：使用动态测试数据
const email = `test_${Date.now()}@example.com`;
await page.fill('#email', email);
```

### 忽略清理

```typescript
// 问题：测试后不清理
test('创建订单', async ({ page }) => {
  await page.click('#create-order');
  // 测试完成但订单仍然存在
});

// 解决：使用 afterEach 或 fixture 清理
test.afterEach(async ({ page }) => {
  await cleanupTestOrders();
});
```

### 并行测试冲突

```typescript
// 问题：并行测试操作同一资源
test('更新用户 A', async ({ page }) => {
  await updateUser(page, 'shared-user', { name: 'A' });
});

test('更新用户 B', async ({ page }) => {
  await updateUser(page, 'shared-user', { name: 'B' }); // 冲突！
});

// 解决：每个测试使用独立资源
test('更新用户', async ({ page }) => {
  const userId = await createUniqueUser(page);
  await updateUser(page, userId, { name: 'New Name' });
});
```

## 性能考量

### 优化测试执行时间

```typescript
// 使用 beforeAll 进行一次性设置
test.describe('产品测试', () => {
  test.beforeAll(async ({ browser }) => {
    // 只执行一次的设置
    await seedDatabase();
  });

  test.afterAll(async () => {
    await cleanDatabase();
  });
});

// 复用认证状态
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

### 并行化策略

```typescript
// playwright.config.ts
export default defineConfig({
  // 使用所有可用的 CPU 核心
  workers: '100%',

  // CI 环境优化
  workers: process.env.CI ? 4 : undefined,

  // 完全并行
  fullyParallel: true,
});
```

### 资源管理

```typescript
// 避免不必要的截图和视频
export default defineConfig({
  use: {
    // 仅失败时截图
    screenshot: 'only-on-failure',
    // 仅失败时保留视频
    video: 'retain-on-failure',
    // 仅首次重试时追踪
    trace: 'on-first-retry',
  },
});
```

### 网络优化

```typescript
// 跳过不必要的资源
test('快速页面加载', async ({ page }) => {
  await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());
  await page.route('**/analytics/**', route => route.abort());
  await page.goto('/');
});
```

### 合理使用等待

```typescript
// 使用 waitForLoadState 控制页面加载
await page.goto('/');
await page.waitForLoadState('networkidle'); // 等待网络空闲

// 或使用更快的选项
await page.waitForLoadState('domcontentloaded');
```

## 实战场景

### 场景一：电商购物流程测试

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { ProductPage, CartPage, CheckoutPage } from '../pages';

test.describe('购物流程', () => {
  test('完整购买流程', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await test.step('浏览商品', async () => {
      await productPage.goto();
      await productPage.searchProduct('iPhone');
      await expect(productPage.productList).toHaveCount(5);
    });

    await test.step('添加到购物车', async () => {
      await productPage.addToCart('iPhone 15 Pro');
      await expect(page.locator('.cart-badge')).toHaveText('1');
    });

    await test.step('查看购物车', async () => {
      await cartPage.goto();
      await expect(cartPage.cartItems).toHaveCount(1);
      await expect(cartPage.totalPrice).toContainText('¥7999');
    });

    await test.step('填写收货信息', async () => {
      await cartPage.proceedToCheckout();
      await checkoutPage.fillShippingInfo({
        name: '张三',
        phone: '13800138000',
        address: '北京市朝阳区xxx街道',
      });
    });

    await test.step('支付', async () => {
      await checkoutPage.selectPaymentMethod('alipay');
      await checkoutPage.placeOrder();
      await expect(page.locator('.order-success')).toBeVisible();
      await expect(page.locator('.order-number')).toBeVisible();
    });
  });
});
```

### 场景二：表单验证测试

```typescript
// tests/e2e/form-validation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('注册表单验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  const testCases = [
    {
      name: '空用户名',
      field: 'username',
      value: '',
      error: '用户名不能为空',
    },
    {
      name: '用户名太短',
      field: 'username',
      value: 'ab',
      error: '用户名至少需要3个字符',
    },
    {
      name: '无效邮箱',
      field: 'email',
      value: 'invalid-email',
      error: '请输入有效的邮箱地址',
    },
    {
      name: '密码太弱',
      field: 'password',
      value: '123',
      error: '密码至少需要8个字符',
    },
  ];

  for (const { name, field, value, error } of testCases) {
    test(`验证: ${name}`, async ({ page }) => {
      await page.getByLabel(field === 'username' ? '用户名' :
                            field === 'email' ? '邮箱' : '密码')
               .fill(value);
      await page.getByRole('button', { name: '注册' }).click();
      await expect(page.locator(`[data-error="${field}"]`)).toHaveText(error);
    });
  }

  test('密码确认不匹配', async ({ page }) => {
    await page.getByLabel('密码').fill('Password123!');
    await page.getByLabel('确认密码').fill('DifferentPassword');
    await page.getByRole('button', { name: '注册' }).click();

    await expect(page.locator('[data-error="confirmPassword"]'))
      .toHaveText('两次输入的密码不一致');
  });

  test('成功注册', async ({ page }) => {
    const timestamp = Date.now();

    await page.getByLabel('用户名').fill(`user_${timestamp}`);
    await page.getByLabel('邮箱').fill(`test_${timestamp}@example.com`);
    await page.getByLabel('密码').fill('SecurePassword123!');
    await page.getByLabel('确认密码').fill('SecurePassword123!');
    await page.getByRole('checkbox', { name: '同意服务条款' }).check();
    await page.getByRole('button', { name: '注册' }).click();

    await expect(page).toHaveURL('/welcome');
    await expect(page.locator('.welcome-message')).toContainText('注册成功');
  });
});
```

### 场景三：多角色权限测试

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
      await page.getByLabel('用户名').fill(credentials[role].username);
      await page.getByLabel('密码').fill(credentials[role].password);
      await page.getByRole('button', { name: '登录' }).click();
      await page.waitForURL('/dashboard');
    };

    await use(loginAs);
  },
});

export { expect } from '@playwright/test';

// tests/e2e/permissions.spec.ts
import { test, expect } from '../fixtures/roles.fixture';

test.describe('权限测试', () => {
  test('管理员可以访问所有功能', async ({ page, loginAs }) => {
    await loginAs('admin');

    // 可以访问用户管理
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/admin/users');

    // 可以创建内容
    await page.goto('/content/new');
    await expect(page.getByRole('button', { name: '发布' })).toBeEnabled();

    // 可以删除内容
    await page.goto('/content');
    await expect(page.getByRole('button', { name: '删除' })).toBeVisible();
  });

  test('编辑者可以编辑但不能删除', async ({ page, loginAs }) => {
    await loginAs('editor');

    // 不能访问用户管理
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/403'); // 无权限页面

    // 可以创建内容
    await page.goto('/content/new');
    await expect(page.getByRole('button', { name: '发布' })).toBeEnabled();

    // 不能删除内容
    await page.goto('/content');
    await expect(page.getByRole('button', { name: '删除' })).not.toBeVisible();
  });

  test('查看者只能查看', async ({ page, loginAs }) => {
    await loginAs('viewer');

    // 不能访问用户管理
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/403');

    // 不能创建内容
    await page.goto('/content/new');
    await expect(page).toHaveURL('/403');

    // 可以查看内容
    await page.goto('/content');
    await expect(page.locator('.content-list')).toBeVisible();
  });
});
```

## 面试要点

### 常见面试问题

**Q1: Playwright 与 Cypress、Selenium 有什么区别？**

| 特性 | Playwright | Cypress | Selenium |
|------|------------|---------|----------|
| 跨浏览器 | Chrome, Firefox, Safari | Chrome, Firefox, Edge | 所有主流浏览器 |
| 多标签页 | 原生支持 | 有限支持 | 支持 |
| 并行测试 | 内置支持 | 需付费版 | 需配置 Grid |
| 自动等待 | 智能等待 | 智能等待 | 需手动处理 |
| 网络拦截 | 强大的 API | 内置支持 | 需额外工具 |
| 学习曲线 | 中等 | 较低 | 较高 |
| 执行速度 | 快 | 中等 | 较慢 |

**Q2: 如何处理 Playwright 中的动态内容？**

```typescript
// 1. 使用 Web-First 断言（自动重试）
await expect(page.locator('.dynamic-content')).toBeVisible();

// 2. 等待特定条件
await page.waitForSelector('.loaded');
await page.waitForLoadState('networkidle');

// 3. 等待特定响应
await page.waitForResponse('**/api/data');

// 4. 使用 poll 进行自定义等待
await expect.poll(async () => {
  return await page.locator('.items').count();
}).toBeGreaterThan(0);
```

**Q3: 如何优化 Playwright 测试的执行速度？**

```typescript
// 1. 并行执行
fullyParallel: true,
workers: process.env.CI ? 4 : '50%',

// 2. 复用认证状态
storageState: 'playwright/.auth/user.json',

// 3. 跳过不必要的资源
await page.route('**/*.{png,jpg,gif}', route => route.abort());

// 4. 使用 API 设置数据
await page.request.post('/api/setup-test-data');

// 5. 合理使用 beforeAll
test.beforeAll(async () => {
  await seedDatabase();
});
```

**Q4: Page Object Model 的优势是什么？**

1. **代码复用**：页面操作逻辑集中管理
2. **维护性**：UI 变更只需修改一处
3. **可读性**：测试代码更清晰
4. **封装性**：隐藏页面实现细节
5. **可扩展性**：便于添加新功能

**Q5: 如何调试 Playwright 测试？**

```bash
# 使用 UI 模式
npx playwright test --ui

# 使用 debug 模式
npx playwright test --debug

# 头部模式运行
npx playwright test --headed

# 使用 trace viewer
npx playwright show-trace trace.zip
```

```typescript
// 代码中使用
await page.pause(); // 暂停执行
console.log(await page.content()); // 打印页面内容
```

**Q6: 如何处理 iframe 和新窗口？**

```typescript
// iframe
const frame = page.frameLocator('#my-iframe');
await frame.locator('button').click();

// 新窗口/标签页
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('a[target="_blank"]'),
]);
await newPage.waitForLoadState();
await expect(newPage).toHaveURL('/new-page');
```

## 延伸阅读

### 官方资源

- [Playwright 官方文档](https://playwright.dev/)
- [Playwright GitHub 仓库](https://github.com/microsoft/playwright)
- [Playwright API 参考](https://playwright.dev/docs/api/class-playwright)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)

### 学习资源

- [Playwright 测试入门教程](https://playwright.dev/docs/intro)
- [Page Object Model 指南](https://playwright.dev/docs/pom)
- [Playwright 与 CI/CD 集成](https://playwright.dev/docs/ci)
- [视觉对比测试指南](https://playwright.dev/docs/test-snapshots)

### 社区资源

- [Awesome Playwright](https://github.com/mxschmitt/awesome-playwright) - 精选 Playwright 资源集合
- [Playwright Community Discord](https://aka.ms/playwright/discord) - 官方社区
- [Testing Library for Playwright](https://github.com/testing-library/playwright-testing-library) - 与 Testing Library 集成

### 相关工具

- [Playwright Test Generator](https://playwright.dev/docs/codegen) - 自动生成测试代码
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer) - 追踪分析工具
- [Playwright Inspector](https://playwright.dev/docs/debug#playwright-inspector) - 调试工具
- [Allure Reporter](https://github.com/allure-framework/allure-js/tree/main/packages/allure-playwright) - 高级测试报告
