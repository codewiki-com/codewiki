---
title: Sass/SCSS 完全指南
description: 掌握CSS预处理器Sass，提升样式开发效率和可维护性
track: frontend
section: html-css
difficulty: intermediate
tags:
  - Sass
  - SCSS
  - CSS预处理器
  - 样式
status: imported
origin: old/src/content/docs/frontend/sass.zh.md
divergence: 0.213
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 6
  lastUpdated: 2026-01-07
---

Sass（Syntactically Awesome Style Sheets）是世界上最成熟、最稳定、最强大的 CSS 预处理器。它扩展了 CSS 的功能，引入了变量、嵌套、混入、函数等编程特性，让样式表的编写更加高效、可维护。本文将深入探讨 Sass 的核心概念和最佳实践，帮助你掌握这一强大的样式开发工具。

## 概念解释：CSS 预处理器的价值

### 什么是 CSS 预处理器

CSS 预处理器是一种脚本语言，它扩展了 CSS 的功能，并将其编译为标准的 CSS。预处理器解决了原生 CSS 的诸多痛点：

1. **缺乏变量**：原生 CSS 虽然有自定义属性（CSS Variables），但功能有限
2. **代码重复**：相同的样式片段需要多次书写
3. **缺乏模块化**：难以将样式拆分为可复用的模块
4. **维护困难**：大型项目中的 CSS 文件难以组织和维护

Sass 通过引入编程语言的特性，完美解决了这些问题。它让开发者能够以更加结构化、模块化的方式编写样式，最终生成浏览器可识别的标准 CSS。

### Sass 的历史与发展

Sass 由 Hampton Catlin 于 2006 年创建，是最早的 CSS 预处理器之一。最初使用 Ruby 编写，采用缩进语法（.sass 文件）。2010 年，Sass 3.0 引入了 SCSS 语法（.scss 文件），这是一种更接近 CSS 的语法，降低了学习成本。2019 年，Dart Sass 成为官方推荐的实现，取代了 Ruby Sass 和 LibSass。

## Sass vs SCSS 语法对比

Sass 提供两种语法格式：缩进语法（Sass）和 SCSS 语法。理解两者的区别对于选择适合自己的方式至关重要。

### 缩进语法（.sass）

缩进语法是 Sass 的原始语法，使用缩进来表示嵌套关系，省略花括号和分号：

```sass
// 变量定义
$primary-color: #3498db
$font-stack: 'Helvetica Neue', Arial, sans-serif
$base-spacing: 16px

// 混入定义
=flex-center
  display: flex
  justify-content: center
  align-items: center

// 嵌套规则
.navbar
  background-color: $primary-color
  padding: $base-spacing

  .nav-item
    color: white
    margin-right: $base-spacing / 2

    &:hover
      text-decoration: underline

  .nav-logo
    +flex-center
    height: 50px
```

### SCSS 语法（.scss）

SCSS 语法是 Sass 3.0 引入的新语法，完全兼容 CSS 语法，使用花括号和分号：

```scss
// 变量定义
$primary-color: #3498db;
$font-stack: 'Helvetica Neue', Arial, sans-serif;
$base-spacing: 16px;

// 混入定义
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 嵌套规则
.navbar {
  background-color: $primary-color;
  padding: $base-spacing;

  .nav-item {
    color: white;
    margin-right: $base-spacing / 2;

    &:hover {
      text-decoration: underline;
    }
  }

  .nav-logo {
    @include flex-center;
    height: 50px;
  }
}
```

### 语法选择建议

| 特性 | Sass（缩进语法） | SCSS |
|------|------------------|------|
| 学习曲线 | 较陡（新语法） | 平缓（兼容 CSS） |
| 代码简洁度 | 更简洁 | 略冗长 |
| CSS 兼容性 | 需要转换 | 完全兼容 |
| 团队协作 | 需要统一规范 | 更容易接受 |
| 工具支持 | 良好 | 更广泛 |
| 社区资源 | 较少 | 更丰富 |

**推荐使用 SCSS 语法**，原因如下：
- 任何有效的 CSS 都是有效的 SCSS，迁移成本低
- 语法更接近 CSS，团队成员更容易上手
- 大多数框架和库使用 SCSS 语法
- 代码片段和示例资源更丰富

## 变量与数据类型

Sass 支持七种数据类型，理解它们是掌握 Sass 的基础。

### 数据类型详解

```scss
// 1. 数字（Numbers）- 可带单位或不带单位
$font-size: 16px;
$line-height: 1.5;
$width-percentage: 50%;
$animation-duration: 0.3s;

// 2. 字符串（Strings）- 可带引号或不带引号
$font-family: 'Helvetica Neue';
$content-text: "Hello World";
$selector-name: navbar;  // 不带引号

// 3. 颜色（Colors）- 多种表示方式
$color-hex: #3498db;
$color-rgb: rgb(52, 152, 219);
$color-rgba: rgba(52, 152, 219, 0.8);
$color-hsl: hsl(204, 70%, 53%);
$color-named: blue;

// 4. 布尔值（Booleans）
$is-dark-mode: true;
$has-sidebar: false;

// 5. 空值（Null）
$optional-value: null;

// 6. 列表（Lists）- 用空格或逗号分隔
$font-stack: 'Helvetica', 'Arial', sans-serif;
$margin-values: 10px 20px 30px 40px;
$breakpoints: (sm: 576px, md: 768px, lg: 992px, xl: 1200px);

// 7. 映射（Maps）- 键值对
$theme-colors: (
  'primary': #3498db,
  'secondary': #2ecc71,
  'danger': #e74c3c,
  'warning': #f39c12,
  'info': #17a2b8
);

$z-layers: (
  'modal': 1000,
  'dropdown': 500,
  'header': 100,
  'default': 1
);
```

### 变量作用域

Sass 变量具有作用域概念，理解作用域对于避免命名冲突至关重要：

```scss
// 全局变量
$global-color: #333;

.container {
  // 局部变量，仅在此块中有效
  $local-padding: 20px;
  padding: $local-padding;
  color: $global-color;

  .inner {
    // 可以访问父级的局部变量
    padding: $local-padding / 2;
  }
}

// 使用 !global 标志将局部变量提升为全局变量
.button {
  $button-color: blue !global;
  background: $button-color;
}

.link {
  // 现在可以访问 $button-color
  color: $button-color;
}

// 使用 !default 设置默认值（如果变量未定义则使用该值）
$primary-color: red !default; // 如果 $primary-color 已存在，保持原值
```

### 变量插值

使用 `#{}` 语法可以在选择器、属性名和字符串中插入变量值：

```scss
$property: 'margin';
$side: 'top';
$component: 'button';

// 在属性名中使用
.box {
  #{$property}-#{$side}: 10px;
  // 编译为：margin-top: 10px;
}

// 在选择器中使用
.#{$component} {
  display: inline-block;
}

.#{$component}-primary {
  background: blue;
}

// 在 calc() 中使用
$sidebar-width: 250px;
.main-content {
  width: calc(100% - #{$sidebar-width});
}

// 在 @media 查询中使用
$breakpoint-md: 768px;
@media (min-width: #{$breakpoint-md}) {
  .container {
    max-width: 720px;
  }
}
```

## 嵌套规则

嵌套是 Sass 最直观的特性之一，它让样式结构更加清晰，减少重复书写选择器。

### 基础嵌套

```scss
// Sass 嵌套写法
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;

  .card-header {
    padding: 16px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;

    h3 {
      margin: 0;
      font-size: 18px;
    }
  }

  .card-body {
    padding: 16px;

    p {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .card-footer {
    padding: 12px 16px;
    background: #fafafa;
    text-align: right;
  }
}
```

### 父选择器引用（&）

`&` 符号代表父选择器，是 Sass 嵌套中最强大的特性：

```scss
.button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  // 伪类
  &:hover {
    background: darken(#3498db, 10%);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  // 修饰符类（BEM 风格）
  &--primary {
    background: #3498db;
  }

  &--secondary {
    background: #95a5a6;
  }

  &--large {
    padding: 15px 30px;
    font-size: 18px;
  }

  &--small {
    padding: 5px 10px;
    font-size: 12px;
  }

  // 组合状态
  &--primary:hover {
    background: darken(#3498db, 10%);
  }

  // 相邻兄弟选择器
  & + & {
    margin-left: 10px;
  }

  // 父元素影响
  .dark-theme & {
    background: #2c3e50;
  }
}
```

### 属性嵌套

对于具有相同前缀的属性，可以使用属性嵌套：

```scss
.element {
  // 传统写法
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 600;
  font-style: italic;

  // 属性嵌套写法
  font: {
    family: 'Arial', sans-serif;
    size: 16px;
    weight: 600;
    style: italic;
  }

  // 其他常见用法
  margin: {
    top: 10px;
    right: 20px;
    bottom: 10px;
    left: 20px;
  }

  background: {
    color: #f5f5f5;
    image: url('pattern.png');
    repeat: no-repeat;
    position: center;
    size: cover;
  }

  border: 1px solid #ddd {
    radius: 8px;
    top: {
      left-radius: 0;
      right-radius: 0;
    }
  }
}
```

### 嵌套最佳实践

```scss
// 不推荐：嵌套层级过深
.page {
  .header {
    .nav {
      .nav-list {
        .nav-item {
          .nav-link {
            color: blue; // 选择器过长，特异性过高
          }
        }
      }
    }
  }
}

// 推荐：控制嵌套在 3-4 层以内
.nav {
  &-list {
    display: flex;
    list-style: none;
  }

  &-item {
    margin-right: 20px;
  }

  &-link {
    color: blue;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
```

## Mixins 与函数

Mixins 和函数是 Sass 中实现代码复用的两大核心特性。

### Mixin 基础用法

```scss
// 定义无参数的 mixin
@mixin reset-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// 使用 mixin
.nav-list {
  @include reset-list;
}

.modal-overlay {
  @include flex-center;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
}
```

### 带参数的 Mixin

```scss
// 必需参数
@mixin button-variant($bg-color, $text-color) {
  background-color: $bg-color;
  color: $text-color;
  border: 1px solid darken($bg-color, 10%);

  &:hover {
    background-color: darken($bg-color, 8%);
  }

  &:active {
    background-color: darken($bg-color, 12%);
  }
}

// 使用带参数的 mixin
.btn-primary {
  @include button-variant(#3498db, white);
}

.btn-success {
  @include button-variant(#2ecc71, white);
}

// 默认参数
@mixin box-shadow($x: 0, $y: 2px, $blur: 4px, $color: rgba(0, 0, 0, 0.1)) {
  box-shadow: $x $y $blur $color;
}

.card {
  @include box-shadow; // 使用默认值
}

.dropdown {
  @include box-shadow(0, 4px, 8px, rgba(0, 0, 0, 0.15));
}

// 命名参数（提高可读性）
.tooltip {
  @include box-shadow($blur: 6px, $color: rgba(0, 0, 0, 0.2));
}
```

### 可变参数

```scss
// 使用 ... 接收任意数量的参数
@mixin transition($properties...) {
  transition: $properties;
}

.animated-button {
  @include transition(
    background-color 0.3s ease,
    transform 0.2s ease,
    box-shadow 0.3s ease
  );
}

// 展开列表作为参数
$standard-transition: background-color 0.3s, color 0.3s;

.link {
  @include transition($standard-transition...);
}

// 实用的多值 mixin
@mixin position($position, $args...) {
  position: $position;

  @each $prop, $value in keywords($args) {
    #{$prop}: $value;
  }
}

.fixed-header {
  @include position(fixed, $top: 0, $left: 0, $right: 0);
}

.modal {
  @include position(absolute, $top: 50%, $left: 50%);
  transform: translate(-50%, -50%);
}
```

### @content 指令

`@content` 允许向 mixin 传递内容块，非常适合创建媒体查询和条件样式：

```scss
// 响应式断点 mixin
$breakpoints: (
  'sm': 576px,
  'md': 768px,
  'lg': 992px,
  'xl': 1200px,
  'xxl': 1400px
);

@mixin respond-to($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);

  @if $value {
    @media (min-width: $value) {
      @content;
    }
  } @else {
    @warn "未知的断点: #{$breakpoint}";
  }
}

// 使用响应式 mixin
.container {
  width: 100%;
  padding: 0 15px;

  @include respond-to('sm') {
    max-width: 540px;
  }

  @include respond-to('md') {
    max-width: 720px;
  }

  @include respond-to('lg') {
    max-width: 960px;
  }

  @include respond-to('xl') {
    max-width: 1140px;
  }
}

// 暗色主题 mixin
@mixin dark-mode {
  @media (prefers-color-scheme: dark) {
    @content;
  }

  .dark-theme & {
    @content;
  }
}

.card {
  background: white;
  color: #333;

  @include dark-mode {
    background: #2c3e50;
    color: #ecf0f1;
  }
}
```

### 自定义函数

函数与 mixin 的区别在于函数返回一个值，而 mixin 输出样式规则：

```scss
// 单位转换函数
@function px-to-rem($px, $base: 16px) {
  @return ($px / $base) * 1rem;
}

// 使用函数
.heading {
  font-size: px-to-rem(24px); // 1.5rem
  margin-bottom: px-to-rem(16px); // 1rem
}

// 颜色处理函数
@function tint($color, $percentage) {
  @return mix(white, $color, $percentage);
}

@function shade($color, $percentage) {
  @return mix(black, $color, $percentage);
}

$primary: #3498db;

.button {
  background: $primary;

  &:hover {
    background: shade($primary, 15%);
  }

  &.light {
    background: tint($primary, 30%);
  }
}

// 获取对比色函数
@function contrast-color($bg-color) {
  $luminance: (
    red($bg-color) * 0.299 +
    green($bg-color) * 0.587 +
    blue($bg-color) * 0.114
  ) / 255;

  @return if($luminance > 0.5, #000, #fff);
}

// 动态文字颜色
@each $name, $color in (
  'primary': #3498db,
  'success': #2ecc71,
  'warning': #f39c12,
  'danger': #e74c3c
) {
  .badge-#{$name} {
    background: $color;
    color: contrast-color($color);
  }
}
```

## 继承与占位符选择器

继承可以让一个选择器共享另一个选择器的样式，减少代码重复。

### @extend 基础用法

```scss
// 基础样式
.message {
  padding: 15px;
  border: 1px solid transparent;
  border-radius: 4px;
  margin-bottom: 20px;
}

// 继承并扩展
.message-success {
  @extend .message;
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.message-warning {
  @extend .message;
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeeba;
}

.message-error {
  @extend .message;
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

// 编译结果
// .message, .message-success, .message-warning, .message-error {
//   padding: 15px;
//   border: 1px solid transparent;
//   border-radius: 4px;
//   margin-bottom: 20px;
// }
```

### 占位符选择器（%）

占位符选择器只有在被 `@extend` 使用时才会编译输出，非常适合定义纯粹用于继承的样式：

```scss
// 定义占位符（不会直接输出到 CSS）
%button-base {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

%flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

%visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// 使用占位符
.btn {
  @extend %button-base;
}

.btn-primary {
  @extend %button-base;
  background: #3498db;
  color: white;

  &:hover {
    background: darken(#3498db, 10%);
  }
}

.btn-outline {
  @extend %button-base;
  background: transparent;
  border: 2px solid #3498db;
  color: #3498db;

  &:hover {
    background: #3498db;
    color: white;
  }
}

.modal-overlay {
  @extend %flex-center;
  position: fixed;
  inset: 0;
}

.sr-only {
  @extend %visually-hidden;
}
```

### @extend vs @mixin 对比

```scss
// 使用 @extend - 合并选择器，CSS 更小
%clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

.container { @extend %clearfix; }
.row { @extend %clearfix; }
// 输出：.container::after, .row::after { ... }

// 使用 @mixin - 复制代码，但更灵活
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

.container { @include clearfix; }
.row { @include clearfix; }
// 输出：.container::after { ... } .row::after { ... }
```

**选择建议**：
- 使用 `@extend`：当样式完全相同，不需要参数时
- 使用 `@mixin`：当需要参数或动态内容时
- 优先使用占位符选择器（`%`）而不是普通类来继承

## 模块化（@use, @forward）

现代 Sass 推荐使用 `@use` 和 `@forward` 进行模块化管理，替代已废弃的 `@import`。

### @use 规则

```scss
// _variables.scss
$primary-color: #3498db;
$secondary-color: #2ecc71;
$font-size-base: 16px;

@function px-to-rem($px) {
  @return ($px / $font-size-base) * 1rem;
}

// _mixins.scss
@mixin button-variant($bg, $color: white) {
  background: $bg;
  color: $color;
}

// main.scss
@use 'variables';
@use 'mixins';

.button {
  // 使用命名空间访问
  background: variables.$primary-color;
  font-size: variables.px-to-rem(14px);

  @include mixins.button-variant(variables.$secondary-color);
}
```

### 自定义命名空间

```scss
// 使用 as 关键字自定义命名空间
@use 'variables' as vars;
@use 'mixins' as m;
@use 'functions' as *; // * 表示不使用命名空间

.element {
  color: vars.$primary-color;
  @include m.flex-center;
  font-size: px-to-rem(18px); // 直接使用函数
}

// 避免命名冲突
@use 'theme-a/colors' as theme-a;
@use 'theme-b/colors' as theme-b;

.light-theme {
  background: theme-a.$background;
}

.dark-theme {
  background: theme-b.$background;
}
```

### 配置模块

```scss
// _config.scss
$primary-color: #3498db !default;
$border-radius: 4px !default;
$enable-shadows: true !default;

// main.scss - 在 @use 时配置变量
@use 'config' with (
  $primary-color: #e74c3c,
  $border-radius: 8px,
  $enable-shadows: false
);

.button {
  background: config.$primary-color; // #e74c3c
  border-radius: config.$border-radius; // 8px
}
```

### @forward 规则

`@forward` 用于将一个模块的成员暴露给其他模块，非常适合创建入口文件：

```scss
// abstracts/_variables.scss
$primary-color: #3498db;
$secondary-color: #2ecc71;

// abstracts/_mixins.scss
@mixin flex-center { /* ... */ }
@mixin button-variant($bg) { /* ... */ }

// abstracts/_functions.scss
@function px-to-rem($px) { /* ... */ }

// abstracts/_index.scss - 聚合模块
@forward 'variables';
@forward 'mixins';
@forward 'functions';

// main.scss - 只需引用一个文件
@use 'abstracts';

.element {
  color: abstracts.$primary-color;
  @include abstracts.flex-center;
}
```

### @forward 高级用法

```scss
// 选择性转发
@forward 'variables' show $primary-color, $secondary-color;
@forward 'mixins' hide button-variant;

// 添加前缀避免冲突
@forward 'buttons' as btn-*;
// $color 变成 $btn-color
// @mixin variant 变成 @mixin btn-variant

// 配置并转发
@forward 'config' with (
  $primary-color: #e74c3c !default
);
```

## 控制指令

Sass 提供了完整的控制流指令，让你能够编写条件逻辑和循环。

### @if 条件判断

```scss
// 基础 @if 用法
$theme: 'dark';

.container {
  @if $theme == 'dark' {
    background: #2c3e50;
    color: #ecf0f1;
  } @else if $theme == 'light' {
    background: #ecf0f1;
    color: #2c3e50;
  } @else {
    background: white;
    color: black;
  }
}

// 在 mixin 中使用
@mixin button($style: 'solid') {
  padding: 10px 20px;
  border-radius: 4px;

  @if $style == 'solid' {
    background: #3498db;
    color: white;
    border: none;
  } @else if $style == 'outline' {
    background: transparent;
    color: #3498db;
    border: 2px solid #3498db;
  } @else if $style == 'ghost' {
    background: transparent;
    color: #3498db;
    border: none;
  }
}

.btn-solid { @include button('solid'); }
.btn-outline { @include button('outline'); }
.btn-ghost { @include button('ghost'); }

// 条件包含样式
$enable-rounded: true;
$enable-shadows: true;

.card {
  padding: 20px;

  @if $enable-rounded {
    border-radius: 8px;
  }

  @if $enable-shadows {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
}
```

### @for 循环

```scss
// @for ... through（包含结束值）
@for $i from 1 through 5 {
  .mt-#{$i} {
    margin-top: $i * 4px;
  }
}

// @for ... to（不包含结束值）
@for $i from 0 to 4 {
  .opacity-#{$i * 25} {
    opacity: $i * 0.25;
  }
}

// 生成栅格系统
$columns: 12;

@for $i from 1 through $columns {
  .col-#{$i} {
    width: percentage($i / $columns);
  }
}

// 生成间距工具类
$spacer: 4px;

@for $i from 0 through 10 {
  .p-#{$i} { padding: $i * $spacer; }
  .m-#{$i} { margin: $i * $spacer; }
  .px-#{$i} { padding-left: $i * $spacer; padding-right: $i * $spacer; }
  .py-#{$i} { padding-top: $i * $spacer; padding-bottom: $i * $spacer; }
}
```

### @each 遍历

```scss
// 遍历列表
$sizes: sm, md, lg, xl;

@each $size in $sizes {
  .text-#{$size} {
    @if $size == sm { font-size: 12px; }
    @else if $size == md { font-size: 14px; }
    @else if $size == lg { font-size: 18px; }
    @else if $size == xl { font-size: 24px; }
  }
}

// 遍历映射
$theme-colors: (
  'primary': #3498db,
  'secondary': #95a5a6,
  'success': #2ecc71,
  'danger': #e74c3c,
  'warning': #f39c12
);

@each $name, $color in $theme-colors {
  .bg-#{$name} {
    background-color: $color;
  }

  .text-#{$name} {
    color: $color;
  }

  .border-#{$name} {
    border-color: $color;
  }

  .btn-#{$name} {
    background-color: $color;
    color: white;
    border: none;

    &:hover {
      background-color: darken($color, 10%);
    }
  }
}

// 遍历多值列表
$social-colors: (
  ('facebook', #3b5998, #fff'),
  ('twitter', #1da1f2, #fff'),
  ('instagram', #e4405f, #fff'),
  ('linkedin', #0077b5, '#fff')
);

@each $name, $bg, $color in $social-colors {
  .btn-#{$name} {
    background: $bg;
    color: $color;
  }
}

// 结合响应式断点
$breakpoints: (
  'sm': 576px,
  'md': 768px,
  'lg': 992px
);

@each $name, $width in $breakpoints {
  @media (min-width: $width) {
    .d-#{$name}-none { display: none; }
    .d-#{$name}-block { display: block; }
    .d-#{$name}-flex { display: flex; }
  }
}
```

### @while 循环

```scss
// 使用 @while（较少使用）
$i: 1;

@while $i <= 6 {
  h#{$i} {
    font-size: 2.5rem - ($i * 0.25rem);
    margin-bottom: 0.5em;
  }
  $i: $i + 1;
}

// 生成 z-index 层级
$z-index: 100;
$layers: header, dropdown, modal, tooltip;

@while $z-index <= 400 {
  $layer: nth($layers, ($z-index / 100));
  .z-#{$layer} {
    z-index: $z-index;
  }
  $z-index: $z-index + 100;
}
```

## 与构建工具集成

### Vite 集成

```bash
# 安装依赖
npm install -D sass
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入变量和 mixin
        additionalData: `
          @use "@/styles/variables" as *;
          @use "@/styles/mixins" as *;
        `,
        // 配置 Sass API
        api: 'modern-compiler', // 使用现代编译器 API
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
```

### Webpack 集成

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',  // 将 CSS 注入 DOM
          'css-loader',    // 解析 @import 和 url()
          {
            loader: 'sass-loader',
            options: {
              // 使用 Dart Sass
              implementation: require('sass'),
              sassOptions: {
                // Sass 配置选项
                outputStyle: 'compressed',
                includePaths: ['./src/styles']
              },
              // 全局注入
              additionalData: `@use "variables" as *;`
            }
          }
        ]
      }
    ]
  }
};
```

### Vue CLI / Vue 项目

```javascript
// vue.config.js
module.exports = {
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
          @use "@/styles/variables" as *;
          @use "@/styles/mixins" as *;
        `
      }
    }
  }
};
```

### Next.js 集成

```javascript
// next.config.js
const path = require('path');

module.exports = {
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
    prependData: `@use "variables" as *;`
  }
};
```

## 最佳实践与项目结构

### 推荐目录结构（7-1 模式）

```
styles/
├── abstracts/           # 工具和辅助
│   ├── _variables.scss  # 变量
│   ├── _functions.scss  # 函数
│   ├── _mixins.scss     # Mixins
│   └── _index.scss      # 聚合导出
├── base/                # 基础样式
│   ├── _reset.scss      # 重置样式
│   ├── _typography.scss # 排版
│   ├── _animations.scss # 动画
│   └── _index.scss
├── components/          # 组件样式
│   ├── _button.scss
│   ├── _card.scss
│   ├── _modal.scss
│   └── _index.scss
├── layout/              # 布局样式
│   ├── _header.scss
│   ├── _footer.scss
│   ├── _sidebar.scss
│   ├── _grid.scss
│   └── _index.scss
├── pages/               # 页面特定样式
│   ├── _home.scss
│   ├── _about.scss
│   └── _index.scss
├── themes/              # 主题
│   ├── _light.scss
│   ├── _dark.scss
│   └── _index.scss
├── vendors/             # 第三方样式
│   ├── _normalize.scss
│   └── _index.scss
└── main.scss            # 主入口文件
```

### 主入口文件组织

```scss
// main.scss
// 1. 抽象层（不产生 CSS 输出）
@use 'abstracts';

// 2. 供应商/第三方
@use 'vendors/normalize';

// 3. 基础样式
@use 'base/reset';
@use 'base/typography';
@use 'base/animations';

// 4. 布局
@use 'layout/grid';
@use 'layout/header';
@use 'layout/footer';
@use 'layout/sidebar';

// 5. 组件（按字母顺序）
@use 'components/button';
@use 'components/card';
@use 'components/form';
@use 'components/modal';

// 6. 页面特定样式
@use 'pages/home';
@use 'pages/about';

// 7. 工具类（放最后以便覆盖）
@use 'utilities';
```

### 命名规范

```scss
// 变量命名：使用语义化名称
// 不好的命名
$red: #e74c3c;
$blue: #3498db;

// 好的命名
$color-danger: #e74c3c;
$color-primary: #3498db;

// 组件变量使用前缀
$btn-padding: 10px 20px;
$btn-border-radius: 4px;
$btn-font-size: 14px;

$card-padding: 20px;
$card-border-radius: 8px;
$card-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

// Mixin 命名：使用动词或描述性名称
@mixin make-container() { /* ... */ }
@mixin generate-columns($count) { /* ... */ }
@mixin apply-theme($theme) { /* ... */ }

// 函数命名：使用动词或返回值描述
@function get-color($name) { /* ... */ }
@function calculate-rem($px) { /* ... */ }
@function strip-unit($value) { /* ... */ }
```

### 代码风格指南

```scss
// 1. 属性排序（推荐按类型分组）
.element {
  // 定位
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;

  // 盒模型
  display: flex;
  width: 100px;
  height: 100px;
  padding: 10px;
  margin: 0;

  // 排版
  font-family: sans-serif;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;

  // 视觉
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;

  // 动画
  transition: all 0.3s ease;
  animation: fadeIn 1s;
}

// 2. 每个规则块之间空一行
.button {
  padding: 10px 20px;
}

.button-primary {
  background: blue;
}

// 3. 嵌套选择器前空一行
.card {
  padding: 20px;

  .card-header {
    border-bottom: 1px solid #ddd;
  }

  .card-body {
    padding: 15px 0;
  }
}

// 4. Mixin 调用放在属性声明之后，嵌套规则之前
.element {
  display: block;
  padding: 20px;

  @include flex-center;
  @include respond-to('md') {
    padding: 40px;
  }

  &:hover {
    background: #f5f5f5;
  }
}
```

## 面试要点

### Sass 与 CSS 变量的区别是什么？

**Sass 变量**：
- 编译时处理，生成静态 CSS
- 支持所有数据类型（数字、颜色、列表、映射等）
- 可以在任何地方使用（选择器、属性名、媒体查询等）
- 编译后不存在于 CSS 中

**CSS 变量（Custom Properties）**：
- 运行时解析，可以动态更改
- 只支持字符串值
- 受层叠和继承规则影响
- 可以通过 JavaScript 修改
- 可以在不同上下文中有不同值

```scss
// Sass 变量
$primary: #3498db;

.button {
  background: $primary;
}
// 编译后：.button { background: #3498db; }

// CSS 变量
:root {
  --primary: #3498db;
}

.button {
  background: var(--primary);
}
// 运行时可以通过 JS 修改 --primary
```

### @mixin 和 @extend 的区别及使用场景？

```scss
// @mixin - 复制代码到每个调用处
@mixin button-base {
  padding: 10px 20px;
  border-radius: 4px;
}

.btn-a { @include button-base; }
.btn-b { @include button-base; }
// 输出两份相同的代码

// @extend - 合并选择器
%button-base {
  padding: 10px 20px;
  border-radius: 4px;
}

.btn-a { @extend %button-base; }
.btn-b { @extend %button-base; }
// 输出：.btn-a, .btn-b { padding: 10px 20px; border-radius: 4px; }
```

**使用场景**：
- **@mixin**：需要参数、需要动态内容、媒体查询中使用
- **@extend**：纯静态样式共享、减少 CSS 体积

### 为什么 @import 被废弃？@use 有什么优势？

**@import 的问题**：
- 全局命名空间，容易冲突
- 无法判断成员来源
- 多次导入会重复编译
- 没有私有成员概念

**@use 的优势**：
- 模块化命名空间
- 明确的成员来源
- 只编译一次
- 支持私有成员（`$_private-var`）
- 支持配置 (`with`)

```scss
// @import（废弃）
@import 'variables'; // 全局污染
@import 'mixins';

// @use（推荐）
@use 'variables' as vars;
@use 'mixins' as m;

.element {
  color: vars.$primary; // 明确来源
  @include m.flex-center;
}
```

### 如何优化 Sass 编译性能？

```scss
// 1. 避免过深嵌套（最多 3-4 层）
// 不好
.a { .b { .c { .d { .e { } } } } }

// 好
.a-b-c { }

// 2. 减少 @extend 链
// @extend 可能产生意外的选择器组合

// 3. 使用 @use 替代 @import
// 避免重复编译

// 4. 拆分大文件
// 利用增量编译

// 5. 避免复杂的循环和计算
// 将计算结果缓存到变量
$columns: 12;
$column-widths: ();

@for $i from 1 through $columns {
  $column-widths: map-merge(
    $column-widths,
    ($i: percentage($i / $columns))
  );
}
```

### 如何实现主题切换？

```scss
// 方案一：CSS 变量 + Sass
$themes: (
  light: (
    bg-primary: #ffffff,
    text-primary: #333333,
    accent: #3498db
  ),
  dark: (
    bg-primary: #1a1a2e,
    text-primary: #eaeaea,
    accent: #00d9ff
  )
);

@each $theme-name, $theme-values in $themes {
  [data-theme="#{$theme-name}"] {
    @each $key, $value in $theme-values {
      --#{$key}: #{$value};
    }
  }
}

// 使用
.card {
  background: var(--bg-primary);
  color: var(--text-primary);
}

// 方案二：Mixin 方案
@mixin themed($property, $light-value, $dark-value) {
  #{$property}: $light-value;

  .dark-theme & {
    #{$property}: $dark-value;
  }
}

.card {
  @include themed(background, #fff, #2c3e50);
  @include themed(color, #333, #ecf0f1);
}
```

### Sass 中如何处理响应式设计？

```scss
// 断点映射
$breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px
);

// 响应式 mixin
@mixin media($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @if $value {
    @media (min-width: $value) {
      @content;
    }
  }
}

@mixin media-down($breakpoint) {
  $value: map-get($breakpoints, $breakpoint);
  @if $value {
    @media (max-width: $value - 1px) {
      @content;
    }
  }
}

@mixin media-between($lower, $upper) {
  $min: map-get($breakpoints, $lower);
  $max: map-get($breakpoints, $upper);
  @media (min-width: $min) and (max-width: $max - 1px) {
    @content;
  }
}

// 使用示例
.container {
  padding: 15px;

  @include media(md) {
    padding: 30px;
    max-width: 720px;
  }

  @include media(lg) {
    max-width: 960px;
  }
}
```

## 总结

Sass/SCSS 是一个强大的 CSS 预处理器，它通过变量、嵌套、Mixins、函数、模块化等特性，极大地提升了样式开发的效率和可维护性。掌握 Sass 的核心概念和最佳实践，能够帮助你编写更加优雅、可复用的样式代码。

**核心要点回顾**：
1. 优先使用 SCSS 语法，兼容性更好
2. 合理使用变量组织设计令牌
3. 控制嵌套层级在 3-4 层以内
4. 根据场景选择 @mixin 或 @extend
5. 使用 @use 和 @forward 进行模块化管理
6. 遵循项目结构规范，如 7-1 模式
7. 与现代构建工具无缝集成

随着 CSS 原生功能的增强（如 CSS 变量、嵌套提案等），Sass 的部分特性可能会被原生替代，但其模块化、Mixins、函数等高级特性仍然是大型项目不可或缺的工具。建议结合项目实际需求，灵活运用 Sass 与原生 CSS 的各自优势。
