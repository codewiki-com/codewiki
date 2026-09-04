---
title: Storybook 组件开发
description: 使用Storybook进行UI组件开发和文档化
track: frontend
section: build-tools
difficulty: intermediate
tags:
  - Storybook
  - 组件开发
  - UI文档
  - 测试
status: imported
origin: old/src/content/docs/frontend/storybook.zh.md
divergence: 0.193
issues: []
legacy:
  category: Frontend
  subcategory: Tools
  order: 42
  lastUpdated: 2026-01-07
---

Storybook 是一个用于独立构建 UI 组件和页面的前端工作坊。它被成千上万的团队用于 UI 开发、测试和文档化。通过 Storybook，你可以在隔离环境中开发组件，无需启动整个应用程序，大大提高开发效率和组件质量。

## 为什么使用 Storybook

### 核心优势

1. **隔离开发**：在独立环境中开发组件，无需依赖整个应用
2. **可视化文档**：自动生成组件文档和使用示例
3. **交互式测试**：通过 Controls 实时调整组件属性
4. **团队协作**：为设计师、开发者和 QA 提供统一的组件库
5. **视觉回归测试**：配合 Chromatic 等工具进行视觉测试

### 适用场景

```
组件库开发 ──────► Storybook 非常适合
设计系统构建 ────► Storybook 是首选工具
多团队协作 ──────► 提供统一的组件参考
UI 自动化测试 ──► 支持视觉回归和交互测试
```

## 安装和设置

### 初始化 Storybook

在现有项目中添加 Storybook：

```bash
# 使用 npx 初始化（推荐）
npx storybook@latest init

# 或使用 pnpm
pnpm dlx storybook@latest init

# 或使用 yarn
yarn dlx storybook@latest init
```

Storybook 会自动检测你的项目框架（React、Vue、Angular 等）并进行相应配置。

### 项目结构

初始化后，项目中会生成以下文件：

```
.storybook/
├── main.ts          # Storybook 主配置文件
├── preview.ts       # 全局装饰器和参数配置
└── preview-head.html # 自定义 HTML head（可选）

src/
└── stories/         # 示例 stories（可删除）
    ├── Button.stories.ts
    ├── Header.stories.ts
    └── Page.stories.ts
```

### 主配置文件

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories 文件的匹配模式
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],

  // 使用的插件
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],

  // 使用的框架
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // 文档配置
  docs: {
    autodocs: 'tag',
  },

  // 静态资源目录
  staticDirs: ['../public'],

  // TypeScript 配置
  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;
```

### 预览配置文件

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';

// 导入全局样式
import '../src/index.css';

const preview: Preview = {
  // 全局参数
  parameters: {
    // 控制 actions 的参数匹配
    actions: { argTypesRegex: '^on[A-Z].*' },

    // Controls 插件配置
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // 背景色选项
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#333333' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },

    // 视口配置
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1440px', height: '900px' } },
      },
    },
  },

  // 全局装饰器
  decorators: [],

  // 全局类型（用于工具栏）
  globalTypes: {
    locale: {
      description: '国际化语言',
      defaultValue: 'zh',
      toolbar: {
        title: '语言',
        icon: 'globe',
        items: ['zh', 'en', 'ja'],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

### 启动 Storybook

```bash
# 开发模式
npm run storybook

# 构建静态版本
npm run build-storybook
```

## 编写 Stories

### Component Story Format (CSF)

Storybook 使用 CSF（Component Story Format）来定义 stories。CSF 是基于 ES6 模块的开放标准，易于编写且可移植。

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

// Meta 对象定义组件元数据
const meta = {
  // 组件标题（决定在侧边栏的位置）
  title: 'Components/Button',

  // 要展示的组件
  component: Button,

  // 标签（autodocs 会自动生成文档）
  tags: ['autodocs'],

  // 参数类型定义
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: '按钮变体样式',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: '按钮大小',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    onClick: {
      action: 'clicked',
      description: '点击事件处理函数',
    },
  },

  // 默认参数
  args: {
    children: '按钮',
    variant: 'primary',
    size: 'medium',
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 定义各种 Story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '危险按钮',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: '小按钮',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: '大按钮',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '禁用按钮',
  },
};
```

### Vue 组件的 Stories

```typescript
// src/components/Button/Button.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3';
import Button from './Button.vue';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
    },
    onClick: {
      action: 'click',
    },
  },
  args: {
    label: '按钮',
    variant: 'primary',
    size: 'medium',
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    label: '主要按钮',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    label: '次要按钮',
  },
};

// 使用 render 函数自定义渲染
export const WithSlot: Story = {
  render: (args) => ({
    components: { Button },
    setup() {
      return { args };
    },
    template: `
      <Button v-bind="args">
        <template #icon>
          <span>图标</span>
        </template>
        按钮文字
      </Button>
    `,
  }),
};
```

### 自定义渲染函数

对于复杂的组件场景，可以使用 `render` 函数：

```typescript
// React 示例
export const WithCustomRender: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button {...args} variant="primary">主要</Button>
      <Button {...args} variant="secondary">次要</Button>
      <Button {...args} variant="danger">危险</Button>
    </div>
  ),
};

// 展示多个状态
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3>Primary</h3>
        <Button variant="primary">Primary Button</Button>
      </div>
      <div>
        <h3>Secondary</h3>
        <Button variant="secondary">Secondary Button</Button>
      </div>
      <div>
        <h3>Danger</h3>
        <Button variant="danger">Danger Button</Button>
      </div>
    </div>
  ),
};
```

## Args 和 Controls

### Args 基础

Args 是 Storybook 中定义组件输入的方式，它们会自动映射到 Controls 面板：

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  component: Card,
  // 组件级别的默认 args
  args: {
    title: '卡片标题',
    description: '这是卡片描述内容',
    bordered: true,
    shadow: 'medium',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Story 级别的 args 会覆盖默认值
export const Default: Story = {};

export const WithImage: Story = {
  args: {
    imageUrl: 'https://example.com/image.jpg',
    title: '带图片的卡片',
  },
};

export const NoBorder: Story = {
  args: {
    bordered: false,
    title: '无边框卡片',
  },
};
```

### ArgTypes 配置

ArgTypes 用于配置 Controls 的行为和文档：

```typescript
const meta: Meta<typeof Input> = {
  component: Input,
  argTypes: {
    // 文本输入控件
    placeholder: {
      control: 'text',
      description: '占位符文本',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },

    // 选择控件
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number'],
      description: '输入框类型',
    },

    // 单选控件
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: '输入框大小',
    },

    // 布尔控件
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },

    // 数字控件
    maxLength: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: '最大输入长度',
    },

    // 范围滑块
    width: {
      control: { type: 'range', min: 100, max: 500, step: 10 },
      description: '输入框宽度',
    },

    // 颜色选择器
    borderColor: {
      control: 'color',
      description: '边框颜色',
    },

    // 日期选择器
    minDate: {
      control: 'date',
      description: '最小日期',
    },

    // 对象控件
    style: {
      control: 'object',
      description: '自定义样式对象',
    },

    // 文件上传
    icon: {
      control: { type: 'file', accept: '.svg,.png' },
      description: '图标文件',
    },

    // 禁用某个控件
    className: {
      control: false,
      description: '自定义类名（不显示控件）',
    },

    // 事件处理
    onChange: {
      action: 'changed',
      description: '值变化时的回调',
    },
  },
};
```

### 控件类型速查

| 控件类型 | control 配置 | 适用场景 |
|---------|-------------|---------|
| boolean | `'boolean'` | 开关、复选框 |
| number | `{ type: 'number', min, max, step }` | 数值输入 |
| range | `{ type: 'range', min, max, step }` | 滑块选择 |
| text | `'text'` | 文本输入 |
| color | `'color'` | 颜色选择 |
| date | `'date'` | 日期选择 |
| object | `'object'` | JSON 对象编辑 |
| file | `{ type: 'file', accept }` | 文件上传 |
| radio | `'radio'` + `options` | 单选按钮 |
| select | `'select'` + `options` | 下拉选择 |
| check | `'check'` + `options` | 多选复选框 |

## Decorators（装饰器）

装饰器用于为 stories 添加额外的包装组件或上下文。

### Story 级别装饰器

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  component: Modal,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ margin: '3em', padding: '2em', border: '1px solid #ccc' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    title: '模态框标题',
    content: '模态框内容',
  },
};
```

### 组件级别装饰器

```typescript
const meta: Meta<typeof Modal> = {
  component: Modal,
  decorators: [
    (Story) => (
      <div className="modal-container">
        <Story />
      </div>
    ),
  ],
};
```

### 全局装饰器

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { ThemeProvider } from '../src/contexts/ThemeContext';

const preview: Preview = {
  decorators: [
    // 主题提供者
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),

    // 布局容器
    (Story) => (
      <div style={{ padding: '20px' }}>
        <Story />
      </div>
    ),

    // 国际化支持
    (Story, context) => {
      const locale = context.globals.locale;
      return (
        <IntlProvider locale={locale}>
          <Story />
        </IntlProvider>
      );
    },
  ],
};

export default preview;
```

### Vue 装饰器示例

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/vue3';
import { setup } from '@storybook/vue3';
import { createPinia } from 'pinia';

// 设置 Vue 插件
setup((app) => {
  const pinia = createPinia();
  app.use(pinia);
});

const preview: Preview = {
  decorators: [
    // 使用 Vue 模板语法
    (story, context) => ({
      components: { story },
      template: `
        <div class="story-wrapper" :class="context.globals.theme">
          <story />
        </div>
      `,
    }),
  ],
};

export default preview;
```

### 常用装饰器模式

```typescript
// 路由装饰器
import { MemoryRouter } from 'react-router-dom';

const withRouter = (Story: React.ComponentType) => (
  <MemoryRouter initialEntries={['/']}>
    <Story />
  </MemoryRouter>
);

// Redux 装饰器
import { Provider } from 'react-redux';
import { store } from '../src/store';

const withRedux = (Story: React.ComponentType) => (
  <Provider store={store}>
    <Story />
  </Provider>
);

// 组合多个装饰器
const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  decorators: [withRouter, withRedux],
};
```

## Addons（插件）

### 核心插件（Essentials）

`@storybook/addon-essentials` 包含以下核心插件：

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials', // 包含以下插件：
    // - @storybook/addon-actions      事件记录
    // - @storybook/addon-backgrounds  背景切换
    // - @storybook/addon-controls     参数控制
    // - @storybook/addon-docs         文档生成
    // - @storybook/addon-viewport     视口切换
    // - @storybook/addon-toolbars     工具栏
    // - @storybook/addon-measure      尺寸测量
    // - @storybook/addon-outline      轮廓显示
  ],
};
```

### 交互测试插件

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
};

// Button.stories.tsx
import { within, userEvent, expect } from '@storybook/test';

export const WithInteraction: Story = {
  args: {
    children: '点击我',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 查找按钮
    const button = canvas.getByRole('button', { name: /点击我/i });

    // 模拟点击
    await userEvent.click(button);

    // 断言
    await expect(button).toHaveClass('clicked');
  },
};
```

### 无障碍测试插件

```bash
npm install @storybook/addon-a11y --save-dev
```

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
};

// 在 story 中配置无障碍规则
export const Default: Story = {
  parameters: {
    a11y: {
      // 配置 axe 规则
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
      // 禁用特定规则
      disable: ['landmark-one-main'],
    },
  },
};
```

### 主题切换插件

```bash
npm install @storybook/addon-themes --save-dev
```

```typescript
// .storybook/preview.ts
import { withThemeByClassName } from '@storybook/addon-themes';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light-theme',
        dark: 'dark-theme',
      },
      defaultTheme: 'light',
    }),
  ],
};

// 或使用 data 属性
import { withThemeByDataAttribute } from '@storybook/addon-themes';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};
```

### 常用第三方插件

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    'storybook-dark-mode',           // 深色模式
    '@storybook/addon-designs',      // Figma 设计稿集成
    '@storybook/addon-storysource',  // 源码展示
    'storybook-addon-pseudo-states', // 伪状态展示
  ],
};
```

## 视觉测试

### 使用 Chromatic

Chromatic 是 Storybook 官方推荐的视觉测试平台：

```bash
# 安装 Chromatic CLI
npm install chromatic --save-dev
```

```json
// package.json
{
  "scripts": {
    "chromatic": "chromatic --project-token=<your-token>"
  }
}
```

```bash
# 运行视觉测试
npm run chromatic
```

### 配置 Chromatic

```typescript
// Button.stories.tsx
export const Primary: Story = {
  args: {
    variant: 'primary',
  },
  parameters: {
    // Chromatic 特定配置
    chromatic: {
      // 视口设置
      viewports: [320, 768, 1200],

      // 延迟截图（等待动画完成）
      delay: 300,

      // 禁用此 story 的视觉测试
      disableSnapshot: false,

      // 差异阈值
      diffThreshold: 0.2,
    },
  },
};

// 禁用某个 story 的视觉测试
export const Animated: Story = {
  parameters: {
    chromatic: { disableSnapshot: true },
  },
};
```

### 使用 Storybook Test Runner

```bash
# 安装 test runner
npm install @storybook/test-runner --save-dev

# 安装 Playwright
npx playwright install
```

```json
// package.json
{
  "scripts": {
    "test-storybook": "test-storybook"
  }
}
```

```typescript
// .storybook/test-runner.ts
import type { TestRunnerConfig } from '@storybook/test-runner';

const config: TestRunnerConfig = {
  // 测试钩子
  async preVisit(page) {
    // 访问 story 之前的操作
  },

  async postVisit(page) {
    // 访问 story 之后的操作
    // 可以在这里添加视觉快照
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  },
};

export default config;
```

### 集成 Jest 快照测试

```typescript
// Button.test.tsx
import { composeStories } from '@storybook/react';
import { render } from '@testing-library/react';
import * as stories from './Button.stories';

const { Primary, Secondary, Disabled } = composeStories(stories);

describe('Button 组件', () => {
  it('Primary 渲染正确', () => {
    const { container } = render(<Primary />);
    expect(container).toMatchSnapshot();
  });

  it('Secondary 渲染正确', () => {
    const { container } = render(<Secondary />);
    expect(container).toMatchSnapshot();
  });

  it('Disabled 状态正确', () => {
    const { container } = render(<Disabled />);
    expect(container).toMatchSnapshot();
  });
});
```

## 组件文档

### 自动文档生成

使用 `autodocs` 标签自动生成文档：

```typescript
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'], // 启用自动文档
  parameters: {
    docs: {
      description: {
        component: '按钮组件用于触发操作或事件，如提交表单、打开对话框等。',
      },
    },
  },
};
```

### MDX 文档

创建自定义 MDX 文档页面：

```mdx
{/* Button.mdx */}
import { Meta, Story, Canvas, Controls, Source } from '@storybook/blocks';
import * as ButtonStories from './Button.stories';

<Meta of={ButtonStories} />

# Button 按钮

按钮用于触发一个操作或事件，如提交表单、打开对话框、取消操作等。

## 基础用法

最基础的按钮用法。

<Canvas of={ButtonStories.Primary} />

## 按钮变体

按钮有三种变体：primary、secondary 和 danger。

<Canvas>
  <Story of={ButtonStories.Primary} />
  <Story of={ButtonStories.Secondary} />
  <Story of={ButtonStories.Danger} />
</Canvas>

## 按钮尺寸

按钮有三种尺寸：small、medium 和 large。

<Canvas>
  <Story of={ButtonStories.Small} />
  <Story of={ButtonStories.Medium} />
  <Story of={ButtonStories.Large} />
</Canvas>

## 属性说明

<Controls />

## 使用示例

```tsx
import { Button } from '@/components/Button';

function App() {
  return (
    <Button variant="primary" size="medium" onClick={() => console.log('clicked')}>
      点击我
    </Button>
  );
}
```

## 设计指南

### 何时使用

- 用于触发即时操作
- 用于表单提交
- 用于确认对话框的操作

### 何时不使用

- 用于页面导航（应使用 Link 组件）
- 用于纯装饰目的
```

### 文档参数配置

```typescript
const meta: Meta<typeof Button> = {
  component: Button,
  parameters: {
    docs: {
      // 组件描述
      description: {
        component: '这是按钮组件的描述',
      },

      // 自定义 Canvas 背景
      canvas: {
        sourceState: 'shown', // 默认显示源码
      },

      // 源码配置
      source: {
        language: 'tsx',
        type: 'code',
      },

      // 控件位置
      controls: {
        sort: 'requiredFirst', // 必填属性优先
      },
    },
  },
  argTypes: {
    variant: {
      description: '按钮的视觉变体',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
        category: '外观',
      },
    },
    size: {
      description: '按钮的尺寸',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'medium' },
        category: '外观',
      },
    },
    disabled: {
      description: '是否禁用按钮',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
        category: '状态',
      },
    },
    onClick: {
      description: '点击时的回调函数',
      table: {
        type: { summary: '() => void' },
        category: '事件',
      },
    },
  },
};
```

## 测试集成

### 使用 Vitest 测试 Stories

```typescript
// Button.test.tsx
import { test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { composeStory } from '@storybook/react';

import meta, { Primary as PrimaryStory } from './Button.stories';

// 组合 story（包含所有注解）
const Primary = composeStory(PrimaryStory, meta);

test('渲染默认参数的主要按钮', async () => {
  await Primary.run();

  const buttonElement = screen.getByRole('button');
  expect(buttonElement).not.toBeNull();
});

test('渲染覆盖属性的按钮', async () => {
  await Primary.run({ args: { ...Primary.args, children: 'Hello world' } });

  const buttonElement = screen.getByText(/Hello world/i);
  expect(buttonElement).not.toBeNull();
});
```

### 批量测试所有 Stories

```typescript
// stories.test.tsx
import { test, expect, describe } from 'vitest';
import { render } from '@testing-library/react';
import { composeStories } from '@storybook/react';

import * as ButtonStories from './Button.stories';
import * as InputStories from './Input.stories';
import * as CardStories from './Card.stories';

const testStories = (stories: Record<string, any>, name: string) => {
  const composedStories = composeStories(stories);

  describe(name, () => {
    Object.entries(composedStories).forEach(([storyName, Story]) => {
      test(`${storyName} 渲染正确`, () => {
        const { container } = render(<Story />);
        expect(container).toBeTruthy();
      });
    });
  });
};

testStories(ButtonStories, 'Button');
testStories(InputStories, 'Input');
testStories(CardStories, 'Card');
```

### Play 函数交互测试

```typescript
import { within, userEvent, expect, fn } from '@storybook/test';

export const FormSubmission: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('填写表单', async () => {
      await userEvent.type(
        canvas.getByLabelText('用户名'),
        'testuser'
      );

      await userEvent.type(
        canvas.getByLabelText('密码'),
        'password123'
      );
    });

    await step('提交表单', async () => {
      await userEvent.click(
        canvas.getByRole('button', { name: '提交' })
      );
    });

    await step('验证提交', async () => {
      await expect(args.onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
    });
  },
};
```

## 最佳实践

### Story 组织结构

```
src/
└── components/
    └── Button/
        ├── Button.tsx           # 组件实现
        ├── Button.stories.tsx   # Stories 文件
        ├── Button.test.tsx      # 单元测试
        ├── Button.mdx           # MDX 文档（可选）
        └── index.ts             # 导出文件
```

### 命名约定

```typescript
// Story 标题使用层级结构
const meta: Meta<typeof Button> = {
  title: 'Design System/Atoms/Button', // 原子级组件
  // 或
  title: 'Components/Forms/Input',     // 功能分类
  // 或
  title: 'Pages/Login',                // 页面级 stories
};

// Story 名称使用描述性命名
export const Default: Story = {};           // 默认状态
export const WithIcon: Story = {};          // 带图标
export const Disabled: Story = {};          // 禁用状态
export const Loading: Story = {};           // 加载状态
export const WithLongText: Story = {};      // 长文本
export const InDarkMode: Story = {};        // 深色模式
```

### 可复用的 Story 模式

```typescript
// 创建可复用的 story 模板
const Template: Story = {
  render: (args) => <Button {...args} />,
};

export const Primary: Story = {
  ...Template,
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
};

export const Secondary: Story = {
  ...Template,
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
};
```

### 处理复杂状态

```typescript
// 使用 loaders 加载异步数据
export const WithAsyncData: Story = {
  loaders: [
    async () => ({
      user: await fetch('/api/user').then(res => res.json()),
    }),
  ],
  render: (args, { loaded: { user } }) => (
    <UserProfile {...args} user={user} />
  ),
};

// 模拟各种状态
export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorState: Story = {
  args: {
    error: new Error('加载失败'),
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
  },
};
```

## 面试要点

### 常见面试问题

**Q1: Storybook 的核心概念是什么？**

```
Stories: 组件的各种状态和变体的展示
Args: 传递给组件的参数，映射到 Controls
Decorators: 包装 stories 的高阶组件
Addons: 扩展 Storybook 功能的插件
CSF: Component Story Format，标准的 story 编写格式
```

**Q2: 如何在 Storybook 中处理全局状态（如 Redux、Context）？**

```typescript
// 使用装饰器提供全局上下文
// .storybook/preview.ts
import { Provider } from 'react-redux';
import { store } from '../src/store';

const preview: Preview = {
  decorators: [
    (Story) => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
};
```

**Q3: Storybook 如何与设计系统配合使用？**

```
1. 使用 Storybook 作为组件开发环境
2. 通过 autodocs 自动生成文档
3. 使用 Chromatic 进行视觉回归测试
4. 集成 Figma 插件同步设计稿
5. 发布 Storybook 作为设计系统文档网站
```

**Q4: 如何优化 Storybook 构建性能？**

```typescript
// .storybook/main.ts
const config: StorybookConfig = {
  // 使用更快的构建工具
  framework: '@storybook/react-vite',

  // 按需加载文档
  docs: {
    autodocs: 'tag', // 只为有 'autodocs' 标签的组件生成
  },

  // 优化 stories 匹配
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    // 排除不需要的目录
  ],
};
```

### 最佳实践总结

1. **组件优先**：先开发 stories，再实现组件（Story-Driven Development）
2. **完整覆盖**：为每个组件状态创建对应的 story
3. **文档完善**：使用 argTypes 和 JSDoc 完善组件文档
4. **测试集成**：利用 stories 进行视觉和交互测试
5. **持续集成**：在 CI 中运行 Storybook 测试

## 总结

Storybook 是现代前端开发中不可或缺的工具，它不仅提供了组件隔离开发的能力，还整合了文档、测试和团队协作等多个方面。

关键要点：

- **CSF 格式**：使用标准的 Component Story Format 编写 stories
- **Args 和 Controls**：通过 args 定义组件参数，自动生成交互控件
- **装饰器**：使用 decorators 提供全局上下文和样式
- **插件生态**：利用丰富的插件扩展功能
- **视觉测试**：配合 Chromatic 进行视觉回归测试
- **文档生成**：使用 autodocs 和 MDX 创建完善的组件文档

掌握 Storybook 将帮助你构建更高质量、更易维护的组件库和设计系统。
