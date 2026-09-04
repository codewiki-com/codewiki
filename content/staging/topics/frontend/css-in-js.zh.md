---
title: CSS-in-JS 完全指南
description: 深入了解 CSS-in-JS 解决方案，包括 Styled Components、Emotion、Panda CSS 等
track: frontend
section: html-css
difficulty: intermediate
tags:
  - CSS-in-JS
  - Styled Components
  - Emotion
  - 样式方案
status: imported
origin: old/src/content/docs/frontend/css-in-js.zh.md
divergence: 0.201
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 26
  lastUpdated: 2026-01-07
---

CSS-in-JS 是一种将 CSS 样式直接写在 JavaScript 中的技术方案。它通过 JavaScript 的强大能力来管理样式，解决了传统 CSS 在大型应用中面临的诸多挑战。本文将深入探讨 CSS-in-JS 的核心概念、主流库的使用方法、运行时与零运行时方案的对比，以及如何在项目中做出正确的技术选型。

## 什么是 CSS-in-JS

CSS-in-JS 并不是一个具体的库或框架，而是一种编程范式。它的核心思想是将样式定义与组件逻辑紧密结合，通过 JavaScript 来动态生成和管理 CSS。

### 传统 CSS 的痛点

在理解 CSS-in-JS 之前，我们需要先了解传统 CSS 在大型应用中面临的挑战：

```css
/* 全局样式冲突 */
.button {
  background: blue;
}

/* 另一个开发者在不知情的情况下定义了同名类 */
.button {
  background: red; /* 覆盖了之前的样式 */
}
```

主要问题包括：

1. **全局命名空间**：CSS 选择器是全局的，容易产生命名冲突
2. **样式隔离困难**：组件样式可能意外影响其他组件
3. **死代码难以清理**：删除组件时，相关 CSS 可能被遗忘
4. **动态样式复杂**：基于状态的样式需要额外的类名管理
5. **依赖关系不明确**：CSS 和 JavaScript 之间的关系不清晰

### CSS-in-JS 的解决方案

CSS-in-JS 通过以下方式解决这些问题：

```jsx
// 样式与组件紧密绑定
const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  color: white;
  padding: 10px 20px;

  &:hover {
    opacity: 0.8;
  }
`;

// 使用时样式自动应用，不会影响其他组件
<Button primary>主要按钮</Button>
<Button>次要按钮</Button>
```

## CSS-in-JS 的优势与劣势

### 优势

#### 自动作用域隔离

```jsx
// styled-components 会自动生成唯一的类名
const Title = styled.h1`
  color: #333;
  font-size: 24px;
`;

// 渲染结果：<h1 class="sc-bdVaJa fNHPVX">标题</h1>
// 类名是唯一的，不会与其他样式冲突
```

#### 动态样式

```jsx
const Box = styled.div`
  width: ${props => props.width || '100px'};
  height: ${props => props.height || '100px'};
  background: ${props => props.theme.colors.primary};
  transform: rotate(${props => props.rotation || 0}deg);
  transition: all 0.3s ease;
`;

function AnimatedBox({ isActive }) {
  return (
    <Box
      width={isActive ? '200px' : '100px'}
      rotation={isActive ? 45 : 0}
    />
  );
}
```

#### 主题支持

```jsx
import { ThemeProvider } from 'styled-components';

const lightTheme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#212529'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  }
};

const darkTheme = {
  colors: {
    primary: '#0d6efd',
    secondary: '#adb5bd',
    background: '#212529',
    text: '#f8f9fa'
  },
  spacing: lightTheme.spacing
};

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <AppContainer>
        <ThemeToggle onClick={() => setIsDark(!isDark)} />
        <Content />
      </AppContainer>
    </ThemeProvider>
  );
}
```

#### 死代码消除

```jsx
// 当组件被删除时，其样式也会一起被删除
// 不会留下孤立的 CSS 代码

// 删除这个组件
const UnusedComponent = styled.div`
  /* 这些样式也会被删除 */
  background: red;
  padding: 20px;
`;
```

#### 类型安全（配合 TypeScript）

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const Button = styled.button<ButtonProps>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return '#007bff';
      case 'secondary': return '#6c757d';
      case 'danger': return '#dc3545';
    }
  }};

  padding: ${props => {
    switch (props.size) {
      case 'small': return '4px 8px';
      case 'medium': return '8px 16px';
      case 'large': return '12px 24px';
    }
  }};

  opacity: ${props => props.disabled ? 0.5 : 1};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
`;

// TypeScript 会检查 props 类型
<Button variant="primary" size="medium">确定</Button>
<Button variant="invalid" size="medium">错误</Button> // 类型错误
```

### 劣势

#### 运行时开销

```jsx
// 每次渲染都需要解析模板字符串并生成样式
const DynamicComponent = styled.div`
  color: ${props => props.color};
  /* 这个计算在每次渲染时都会执行 */
`;

// 对于频繁更新的组件，可能影响性能
function AnimatedElement() {
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(p => p + 1);
    }, 16); // 60fps
    return () => clearInterval(interval);
  }, []);

  // 每帧都会重新计算样式
  return <DynamicComponent style={{ transform: `translateX(${position}px)` }} />;
}
```

#### 包体积增加

```javascript
// styled-components 压缩后约 12KB
// emotion 压缩后约 11KB
// 相比之下，CSS 文件不需要额外的运行时代码
```

#### 服务端渲染复杂性

```jsx
// 需要额外配置来提取关键 CSS
import { ServerStyleSheet } from 'styled-components';

export async function getServerSideProps(ctx) {
  const sheet = new ServerStyleSheet();

  try {
    // 收集渲染过程中生成的样式
    const html = renderToString(
      sheet.collectStyles(<App />)
    );

    // 获取样式标签
    const styleTags = sheet.getStyleTags();

    return { props: { html, styleTags } };
  } finally {
    sheet.seal();
  }
}
```

## Styled Components 详解

Styled Components 是最流行的 CSS-in-JS 库之一，采用标签模板字面量语法，拥有庞大的社区生态。

### 安装与配置

```bash
# 安装
npm install styled-components

# TypeScript 类型支持
npm install -D @types/styled-components

# Babel 插件（推荐）
npm install -D babel-plugin-styled-components
```

```javascript
// babel.config.js
module.exports = {
  plugins: [
    [
      'babel-plugin-styled-components',
      {
        displayName: process.env.NODE_ENV !== 'production',
        fileName: false,
        pure: true,
        minify: true,
        transpileTemplateLiterals: true
      }
    ]
  ]
};
```

### 基础用法

```jsx
import styled from 'styled-components';

// 创建带样式的组件
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 1rem;
`;

const Paragraph = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
`;

function Article() {
  return (
    <Container>
      <Title>文章标题</Title>
      <Paragraph>这是文章的内容...</Paragraph>
    </Container>
  );
}
```

### 样式继承与扩展

```jsx
const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
`;

// 继承 Button 的所有样式并扩展
const PrimaryButton = styled(Button)`
  background: #007bff;
  color: white;

  &:hover {
    background: #0056b3;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;

  &:hover {
    background: #007bff;
    color: white;
  }
`;

const DangerButton = styled(Button)`
  background: #dc3545;
  color: white;

  &:hover {
    background: #c82333;
  }
`;
```

### 传递 Props

```jsx
const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid ${props => props.hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.hasError ? '#dc3545' : '#007bff'};
    box-shadow: 0 0 0 3px ${props =>
      props.hasError ? 'rgba(220, 53, 69, 0.25)' : 'rgba(0, 123, 255, 0.25)'
    };
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const ErrorMessage = styled.span`
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  display: block;
`;

function FormField({ label, error, ...inputProps }) {
  return (
    <div>
      <label>{label}</label>
      <Input hasError={!!error} {...inputProps} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
```

### 使用 attrs 设置默认属性

```jsx
const SubmitButton = styled.button.attrs(props => ({
  type: 'submit',
  disabled: props.isLoading
}))`
  background: ${props => props.isLoading ? '#6c757d' : '#007bff'};
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.isLoading ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    background: #0056b3;
  }
`;

// 使用时 type 和 disabled 会自动设置
<SubmitButton isLoading={isSubmitting}>
  {isSubmitting ? '提交中...' : '提交'}
</SubmitButton>
```

### 全局样式

```jsx
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    line-height: 1.5;
  }

  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContent />
    </ThemeProvider>
  );
}
```

### CSS 辅助函数与动画

```jsx
import styled, { css, keyframes } from 'styled-components';

// 可复用的样式片段
const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ellipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// 动画
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

// 使用辅助函数
const CenteredBox = styled.div`
  ${flexCenter}
  height: 100vh;
`;

const TruncatedText = styled.p`
  ${ellipsis}
  max-width: 200px;
`;

const FadeInDiv = styled.div`
  animation: ${fadeIn} 0.3s ease-out;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;
```

## Emotion 详解

Emotion 是另一个流行的 CSS-in-JS 库，提供了更灵活的 API 选择，包括对象样式语法和 css prop。

### 安装与配置

```bash
# 核心包
npm install @emotion/react

# styled API（可选）
npm install @emotion/styled

# Babel 插件（推荐）
npm install -D @emotion/babel-plugin
```

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-react', { runtime: 'automatic', importSource: '@emotion/react' }]
  ],
  plugins: ['@emotion/babel-plugin']
};
```

### 对象样式语法

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import styled from '@emotion/styled';

// 对象语法 - 更接近 JavaScript
const buttonStyles = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
  backgroundColor: '#007bff',
  color: 'white',
  '&:hover': {
    backgroundColor: '#0056b3'
  }
};

function Button({ children }) {
  return <button css={buttonStyles}>{children}</button>;
}

// 也支持字符串语法
const stringStyles = css`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background-color: #007bff;
  color: white;

  &:hover {
    background-color: #0056b3;
  }
`;
```

### css prop

```jsx
/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';

function Card({ title, content, variant }) {
  return (
    <div
      css={css`
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        background: ${variant === 'dark' ? '#333' : '#fff'};
        color: ${variant === 'dark' ? '#fff' : '#333'};
      `}
    >
      <h2
        css={{
          marginBottom: '12px',
          fontSize: '1.5rem',
          fontWeight: 600
        }}
      >
        {title}
      </h2>
      <p css={{ lineHeight: 1.6 }}>{content}</p>
    </div>
  );
}
```

### 样式组合

```jsx
import { css } from '@emotion/react';

const baseButton = css`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
`;

const primaryButton = css`
  ${baseButton}
  background: #007bff;
  color: white;

  &:hover {
    background: #0056b3;
  }
`;

const largeButton = css`
  padding: 14px 28px;
  font-size: 16px;
`;

// 组合多个样式
function Button({ primary, large, children }) {
  return (
    <button css={[baseButton, primary && primaryButton, large && largeButton]}>
      {children}
    </button>
  );
}
```

### Emotion 的 styled API

```jsx
import styled from '@emotion/styled';

// 与 styled-components 语法相似
const Card = styled.div`
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

// 也支持对象语法
const Badge = styled.span(props => ({
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500,
  backgroundColor: props.variant === 'success' ? '#28a745' :
                   props.variant === 'warning' ? '#ffc107' :
                   props.variant === 'danger' ? '#dc3545' : '#6c757d',
  color: props.variant === 'warning' ? '#212529' : 'white'
}));
```

### Emotion vs Styled Components

| 特性 | Emotion | Styled Components |
|------|---------|-------------------|
| API 风格 | 多种选择（css prop、对象、模板） | 主要是模板字符串 |
| 包体积 | ~11KB | ~12KB |
| 框架支持 | React、其他框架 | 主要是 React |
| 对象样式 | 原生支持 | 需要额外配置 |
| SSR | 需要配置 | 需要配置 |
| TypeScript | 良好支持 | 良好支持 |

## Panda CSS：下一代 CSS-in-JS

Panda CSS 是由 Chakra UI 团队开发的零运行时 CSS-in-JS 方案，结合了类型安全、设计令牌和原子化 CSS 的优点。

### 安装与初始化

```bash
# 安装
npm install -D @pandacss/dev

# 初始化配置
npx panda init
```

```typescript
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  // 预设
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],

  // 是否使用 CSS 重置
  preflight: true,

  // 需要扫描的文件
  include: ['./src/**/*.{js,jsx,ts,tsx}'],

  // 排除的文件
  exclude: [],

  // 输出目录
  outdir: 'styled-system',

  // 主题配置
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#007bff' },
          secondary: { value: '#6c757d' },
          success: { value: '#28a745' },
          danger: { value: '#dc3545' }
        },
        spacing: {
          xs: { value: '4px' },
          sm: { value: '8px' },
          md: { value: '16px' },
          lg: { value: '24px' },
          xl: { value: '32px' }
        }
      },
      semanticTokens: {
        colors: {
          text: {
            value: { base: '{colors.gray.900}', _dark: '{colors.gray.100}' }
          },
          bg: {
            value: { base: '{colors.white}', _dark: '{colors.gray.900}' }
          }
        }
      }
    }
  }
});
```

### 基础用法：css 函数

```tsx
import { css } from '../styled-system/css';

function Button({ children }) {
  return (
    <button
      className={css({
        padding: 'md',
        borderRadius: 'sm',
        backgroundColor: 'primary',
        color: 'white',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        _hover: {
          backgroundColor: 'blue.600'
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed'
        }
      })}
    >
      {children}
    </button>
  );
}
```

### Recipes：组件变体

```typescript
// button.recipe.ts
import { cva } from '../styled-system/css';

export const button = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'md',
    fontWeight: 'medium',
    transition: 'all 0.2s',
    cursor: 'pointer',
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: 'primary',
        color: 'white',
        _hover: { backgroundColor: 'blue.600' }
      },
      outline: {
        backgroundColor: 'transparent',
        border: '1px solid',
        borderColor: 'primary',
        color: 'primary',
        _hover: { backgroundColor: 'blue.50' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'primary',
        _hover: { backgroundColor: 'blue.50' }
      }
    },
    size: {
      sm: { padding: '6px 12px', fontSize: '12px' },
      md: { padding: '10px 20px', fontSize: '14px' },
      lg: { padding: '14px 28px', fontSize: '16px' }
    }
  },
  compoundVariants: [
    {
      visual: 'solid',
      size: 'lg',
      css: { boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)' }
    }
  ],
  defaultVariants: {
    visual: 'solid',
    size: 'md'
  }
});
```

```tsx
// Button.tsx
import { button } from './button.recipe';

interface ButtonProps {
  visual?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

function Button({ visual, size, children }: ButtonProps) {
  return (
    <button className={button({ visual, size })}>
      {children}
    </button>
  );
}

// 使用
<Button visual="solid" size="lg">大型按钮</Button>
<Button visual="outline">轮廓按钮</Button>
```

### Patterns：布局模式

```tsx
import { flex, stack, grid, center } from '../styled-system/patterns';

// Flex 布局
function FlexExample() {
  return (
    <div className={flex({ gap: 'md', align: 'center', justify: 'space-between' })}>
      <span>左侧</span>
      <span>右侧</span>
    </div>
  );
}

// Stack 布局
function StackExample() {
  return (
    <div className={stack({ gap: 'md', direction: 'column' })}>
      <div>项目 1</div>
      <div>项目 2</div>
      <div>项目 3</div>
    </div>
  );
}

// Grid 布局
function GridExample() {
  return (
    <div className={grid({ columns: 3, gap: 'lg' })}>
      <div>1</div>
      <div>2</div>
      <div>3</div>
    </div>
  );
}

// 居中
function CenterExample() {
  return (
    <div className={center({ height: '100vh' })}>
      <span>居中内容</span>
    </div>
  );
}
```

### JSX 样式属性

```tsx
// 需要在 panda.config.ts 中启用
// jsxFramework: 'react'

import { styled } from '../styled-system/jsx';

const Button = styled('button', {
  base: {
    padding: 'md',
    borderRadius: 'sm',
    cursor: 'pointer'
  },
  variants: {
    visual: {
      solid: { bg: 'primary', color: 'white' },
      outline: { border: '1px solid', borderColor: 'primary' }
    }
  }
});

// 使用
<Button visual="solid">按钮</Button>

// 或者使用 Box 组件
import { Box, Flex, Stack } from '../styled-system/jsx';

function Card() {
  return (
    <Box p="lg" bg="white" borderRadius="md" shadow="md">
      <Stack gap="md">
        <h2>标题</h2>
        <p>内容</p>
      </Stack>
    </Box>
  );
}
```

### Panda CSS 的优势

1. **零运行时**：在构建时生成静态 CSS
2. **类型安全**：完整的 TypeScript 支持
3. **设计令牌**：内置令牌系统，支持语义化令牌
4. **原子化 CSS**：生成最小化的样式输出
5. **条件样式**：支持响应式、暗色模式等条件
6. **框架无关**：支持 React、Vue、Solid 等框架

## vanilla-extract：类型安全的零运行时方案

vanilla-extract 是一种零运行时的 CSS-in-JS 方案，在构建时生成静态 CSS，同时提供完整的 TypeScript 类型支持。

### 安装与配置

```bash
# 核心包
npm install @vanilla-extract/css

# 构建工具集成
npm install -D @vanilla-extract/vite-plugin  # Vite
npm install -D @vanilla-extract/webpack-plugin  # Webpack
npm install -D @vanilla-extract/next-plugin  # Next.js
```

```typescript
// vite.config.ts
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default {
  plugins: [vanillaExtractPlugin()]
};
```

### 基本用法

```typescript
// styles.css.ts
import { style, styleVariants, createTheme } from '@vanilla-extract/css';

// 定义主题变量
export const [themeClass, vars] = createTheme({
  color: {
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
    text: '#212529'
  },
  space: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  }
});

// 基础样式
export const button = style({
  padding: vars.space.medium,
  border: 'none',
  borderRadius: vars.borderRadius.small,
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  ':hover': {
    opacity: 0.9
  },
  ':disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
});

// 变体样式
export const buttonVariants = styleVariants({
  primary: {
    backgroundColor: vars.color.primary,
    color: 'white'
  },
  secondary: {
    backgroundColor: 'transparent',
    border: `1px solid ${vars.color.primary}`,
    color: vars.color.primary
  },
  danger: {
    backgroundColor: '#dc3545',
    color: 'white'
  }
});
```

```tsx
// Button.tsx
import { button, buttonVariants } from './styles.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant = 'primary', disabled, children }: ButtonProps) {
  return (
    <button
      className={`${button} ${buttonVariants[variant]}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Sprinkles：原子化 CSS

```typescript
// sprinkles.css.ts
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

const space = {
  none: '0',
  small: '4px',
  medium: '8px',
  large: '16px',
  xlarge: '32px'
};

const colors = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  white: '#ffffff',
  black: '#000000',
  gray100: '#f8f9fa',
  gray900: '#212529'
};

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' }
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'inline-block', 'grid'],
    flexDirection: ['row', 'column'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
    alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
    gap: space,
    padding: space,
    paddingTop: space,
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    margin: space,
    marginTop: space,
    marginBottom: space,
    marginLeft: space,
    marginRight: space
  },
  shorthands: {
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom']
  }
});

const colorProperties = defineProperties({
  properties: {
    color: colors,
    backgroundColor: colors
  }
});

export const sprinkles = createSprinkles(
  responsiveProperties,
  colorProperties
);

export type Sprinkles = Parameters<typeof sprinkles>[0];
```

```tsx
// 使用 sprinkles
import { sprinkles } from './sprinkles.css';

function Card() {
  return (
    <div
      className={sprinkles({
        padding: { mobile: 'medium', tablet: 'large' },
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 'medium'
      })}
    >
      <h2 className={sprinkles({ color: 'gray900', marginBottom: 'small' })}>
        标题
      </h2>
      <p className={sprinkles({ color: 'secondary' })}>
        内容
      </p>
    </div>
  );
}
```

### Recipes：组件变体

```typescript
// button.css.ts
import { recipe } from '@vanilla-extract/recipes';
import { vars } from './theme.css';

export const button = recipe({
  base: {
    border: 'none',
    borderRadius: vars.borderRadius.small,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed'
    }
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: vars.color.primary,
        color: 'white',
        ':hover': {
          backgroundColor: '#0056b3'
        }
      },
      secondary: {
        backgroundColor: 'transparent',
        color: vars.color.primary,
        border: `1px solid ${vars.color.primary}`,
        ':hover': {
          backgroundColor: vars.color.primary,
          color: 'white'
        }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.color.text,
        ':hover': {
          backgroundColor: vars.color.gray100
        }
      }
    },
    size: {
      small: {
        padding: '6px 12px',
        fontSize: '12px'
      },
      medium: {
        padding: '10px 20px',
        fontSize: '14px'
      },
      large: {
        padding: '14px 28px',
        fontSize: '16px'
      }
    }
  },

  compoundVariants: [
    {
      variants: { variant: 'primary', size: 'large' },
      style: {
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
      }
    }
  ],

  defaultVariants: {
    variant: 'primary',
    size: 'medium'
  }
});

export type ButtonVariants = Parameters<typeof button>[0];
```

```tsx
// Button.tsx
import { button, ButtonVariants } from './button.css';

interface ButtonProps extends ButtonVariants {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}

function Button({ variant, size, children, ...props }: ButtonProps) {
  return (
    <button className={button({ variant, size })} {...props}>
      {children}
    </button>
  );
}

// 使用
<Button variant="primary" size="large">大型主要按钮</Button>
<Button variant="secondary" size="small">小型次要按钮</Button>
```

## 运行时 vs 零运行时对比

### 运行时方案（Styled Components / Emotion）

```jsx
// 优点：
// 1. 完全动态的样式
const DynamicBox = styled.div`
  transform: translateX(${props => props.x}px) translateY(${props => props.y}px);
  background: ${props => `hsl(${props.hue}, 70%, 50%)`};
`;

// 2. 更简单的 API
// 3. 更好的开发体验
// 4. 更灵活的动态计算

// 缺点：
// 1. 运行时开销
// 2. 包体积增加
// 3. 服务端渲染需要额外配置
```

### 零运行时方案（vanilla-extract / Panda CSS）

```typescript
// 优点：
// 1. 零运行时开销
// 2. 更小的包体积
// 3. 更好的性能
// 4. 原生 SSR 支持

// 缺点：
// 1. 动态样式有限制
// 2. 需要构建工具支持
// 3. 学习曲线较高

// 处理动态样式的方式
import { style, createVar } from '@vanilla-extract/css';
import { assignInlineVars } from '@vanilla-extract/dynamic';

const xVar = createVar();
const yVar = createVar();

const box = style({
  transform: `translateX(${xVar}) translateY(${yVar})`
});

// 在组件中使用 CSS 变量
function DynamicBox({ x, y }) {
  return (
    <div
      className={box}
      style={assignInlineVars({
        [xVar]: `${x}px`,
        [yVar]: `${y}px`
      })}
    />
  );
}
```

### 性能基准对比

| 方案 | 首次渲染 | 重渲染 | 运行时大小 | SSR 支持 |
|------|----------|--------|------------|----------|
| styled-components | 中等 | 中等 | ~12KB | 需配置 |
| Emotion | 中等 | 中等 | ~11KB | 需配置 |
| vanilla-extract | 快 | 快 | ~0KB | 原生 |
| Panda CSS | 快 | 快 | ~0KB | 原生 |
| CSS Modules | 快 | 快 | ~0KB | 原生 |

### 选择依据

**选择运行时方案（styled-components / Emotion）如果：**
- 需要高度动态的样式（基于用户输入实时计算）
- 团队更熟悉模板字符串语法
- 项目规模较小，性能不是首要考虑
- 需要快速开发和原型设计

**选择零运行时方案（vanilla-extract / Panda CSS）如果：**
- 性能是首要考虑
- 项目是 SSR/SSG 优先
- 需要最小化客户端 JavaScript
- 团队熟悉 TypeScript

## 性能优化策略

### 避免在渲染函数中创建样式

```jsx
// 不推荐：每次渲染都会创建新的样式组件
function BadComponent() {
  const StyledDiv = styled.div`
    color: red;
  `;

  return <StyledDiv>内容</StyledDiv>;
}

// 推荐：在组件外部定义样式
const StyledDiv = styled.div`
  color: red;
`;

function GoodComponent() {
  return <StyledDiv>内容</StyledDiv>;
}
```

### 使用 shouldForwardProp 过滤 props

```jsx
import styled from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';

// 避免将自定义 props 传递给 DOM
const Button = styled.button.withConfig({
  shouldForwardProp: (prop) =>
    isPropValid(prop) && !['isLoading', 'variant'].includes(prop)
})`
  background: ${props => props.variant === 'primary' ? '#007bff' : '#6c757d'};
  opacity: ${props => props.isLoading ? 0.7 : 1};
`;

// 这些 props 不会出现在 DOM 元素上
<Button variant="primary" isLoading={true}>提交</Button>
```

### 合理使用 CSS 变量处理动态样式

```jsx
// 对于频繁变化的样式，使用 CSS 变量
const Slider = styled.div`
  --slider-value: 0;
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: calc(var(--slider-value) * 1%);
    background: #007bff;
    border-radius: 4px;
    transition: width 0.1s;
  }
`;

function ProgressSlider({ value }) {
  return (
    <Slider style={{ '--slider-value': value }} />
  );
}

// 这样避免了每次值变化都重新生成 CSS
```

### 批量更新与防抖

```jsx
import { useState, useMemo, useDeferredValue } from 'react';

function ColorPicker() {
  const [color, setColor] = useState('#007bff');

  // 延迟非关键更新
  const deferredColor = useDeferredValue(color);

  // 缓存样式计算
  const boxStyle = useMemo(() => ({
    backgroundColor: deferredColor,
    padding: '20px',
    borderRadius: '8px'
  }), [deferredColor]);

  return (
    <>
      <input
        type="color"
        value={color}
        onChange={e => setColor(e.target.value)}
      />
      <div css={boxStyle}>预览</div>
    </>
  );
}
```

### 按需加载样式组件

```jsx
import { lazy, Suspense } from 'react';

// 懒加载包含大量样式的组件
const HeavyStyledComponent = lazy(() => import('./HeavyStyledComponent'));

function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <HeavyStyledComponent />
    </Suspense>
  );
}
```

## 服务端渲染（SSR）配置

### styled-components SSR

```jsx
// pages/_document.js (Next.js)
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />)
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </>
        )
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

### Emotion SSR

```jsx
// pages/_app.js (Next.js with Emotion)
import { CacheProvider } from '@emotion/react';
import createEmotionCache from '../lib/createEmotionCache';

const clientSideEmotionCache = createEmotionCache();

export default function App({ Component, emotionCache = clientSideEmotionCache, pageProps }) {
  return (
    <CacheProvider value={emotionCache}>
      <Component {...pageProps} />
    </CacheProvider>
  );
}
```

```javascript
// lib/createEmotionCache.js
import createCache from '@emotion/cache';

export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
```

### 零运行时方案的 SSR

```jsx
// vanilla-extract 和 Panda CSS 不需要特殊的 SSR 配置
// 因为它们在构建时就生成了静态 CSS 文件

// 只需要确保 CSS 文件被正确引入
import './styles.css'; // vanilla-extract 生成的 CSS
import '../styled-system/styles.css'; // Panda CSS 生成的 CSS
```

## 技术选型指南

### 选择 Styled Components 如果

- 团队熟悉模板字符串语法
- 需要完整的主题系统
- 项目以 React 为主
- 看重社区生态和文档
- 需要大量动态样式

### 选择 Emotion 如果

- 需要对象样式语法
- 想要更灵活的 API 选择
- 需要与非 React 框架集成
- 包体积敏感
- 喜欢 css prop 的使用方式

### 选择 Panda CSS 如果

- 想要零运行时的类型安全方案
- 需要设计令牌系统
- 喜欢原子化 CSS 的方式
- 项目是 SSR/SSG 优先
- 使用 Chakra UI 团队的其他产品

### 选择 vanilla-extract 如果

- 性能是首要考虑
- 团队熟悉 TypeScript
- 需要与现有 CSS 工作流集成
- 想要类似 CSS Modules 但更强大的方案

### 选择 CSS Modules 如果

- 团队更熟悉传统 CSS
- 项目已有大量 CSS 代码
- 需要最小化运行时开销
- 构建配置已经支持
- 不需要复杂的动态样式

### 综合对比表

| 特性 | Styled Components | Emotion | Panda CSS | vanilla-extract |
|------|-------------------|---------|-----------|-----------------|
| 运行时 | 有 | 有 | 无 | 无 |
| 类型安全 | 良好 | 良好 | 优秀 | 优秀 |
| 动态样式 | 优秀 | 优秀 | 良好 | 良好 |
| 学习曲线 | 低 | 低 | 中 | 中 |
| 包体积 | ~12KB | ~11KB | ~0KB | ~0KB |
| SSR 配置 | 需要 | 需要 | 不需要 | 不需要 |
| 原子化 | 否 | 否 | 是 | 可选 |
| 设计令牌 | 主题系统 | 主题系统 | 内置 | 需配置 |

## 最佳实践总结

### 组织样式代码

```typescript
// styles/theme.ts - 主题定义
export const theme = {
  colors: { /* ... */ },
  spacing: { /* ... */ },
  typography: { /* ... */ }
};

// styles/mixins.ts - 可复用样式
export const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

// components/Button/styles.ts - 组件样式
export const StyledButton = styled.button`/* ... */`;

// components/Button/index.tsx - 组件
import { StyledButton } from './styles';
```

### 保持一致性

```jsx
// 在项目中使用统一的样式方案
// 不要混合使用多种 CSS-in-JS 库

// 定义设计令牌
const tokens = {
  colors: {
    primary: '#007bff',
    // ...
  },
  // 始终使用这些令牌
};
```

### 性能意识

```jsx
// 对于性能关键的组件
// 考虑使用 CSS 变量或零运行时方案

// 避免过度嵌套
// 避免在渲染时创建样式
// 使用适当的缓存策略
```

### 可维护性优先

```jsx
// 使用有意义的组件名称
const PageHeader = styled.header`/* ... */`;
const NavigationMenu = styled.nav`/* ... */`;

// 而不是
const StyledHeader = styled.header`/* ... */`;
const StyledNav = styled.nav`/* ... */`;
```

### 测试策略

```jsx
// 使用 data-testid 而不是类名选择器
const Button = styled.button`/* ... */`;

function MyButton({ testId, children }) {
  return <Button data-testid={testId}>{children}</Button>;
}

// 测试
screen.getByTestId('submit-button');
```

## 总结

CSS-in-JS 为现代前端开发提供了强大的样式管理能力。通过将样式与组件逻辑紧密结合，它解决了传统 CSS 在大型应用中面临的诸多挑战。

关键要点：

1. **理解权衡**：运行时方案提供更好的动态能力，零运行时方案提供更好的性能
2. **选择合适方案**：根据项目需求、团队技能和性能要求做出选择
3. **关注性能**：遵循最佳实践，避免常见的性能陷阱
4. **保持一致**：在项目中统一使用一种样式方案
5. **持续学习**：CSS-in-JS 生态在不断发展，Panda CSS 和 vanilla-extract 代表了零运行时的新趋势

无论选择哪种方案，理解其原理和适用场景是最重要的。随着 React Server Components 和 SSR/SSG 的普及，零运行时方案正变得越来越流行。希望本文能帮助你在项目中做出正确的技术决策。
