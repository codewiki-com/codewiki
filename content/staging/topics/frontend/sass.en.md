---
title: Sass/SCSS Complete Guide
description: Master CSS preprocessor Sass for maintainable stylesheets
track: frontend
section: html-css
difficulty: intermediate
tags:
  - Sass
  - SCSS
  - CSS Preprocessor
  - Styling
status: imported
origin: old/src/content/docs/frontend/sass.en.md
divergence: 0.213
issues: []
legacy:
  category: Frontend
  subcategory: CSS
  order: 6
  lastUpdated: 2026-01-07
---

Sass (Syntactically Awesome Style Sheets) is the world's most mature, stable, and powerful CSS preprocessor. It extends CSS functionality by introducing programming features like variables, nesting, mixins, and functions, making stylesheet development more efficient and maintainable. This comprehensive guide explores Sass's core concepts and best practices to help you master this powerful styling tool.

## Understanding CSS Preprocessors

### What is a CSS Preprocessor?

A CSS preprocessor is a scripting language that extends CSS capabilities and compiles to standard CSS. Preprocessors solve many pain points of vanilla CSS:

1. **Lack of Variables**: While CSS has custom properties (CSS Variables), their functionality is limited
2. **Code Repetition**: Identical style fragments must be written multiple times
3. **Poor Modularity**: Difficult to split styles into reusable modules
4. **Maintenance Challenges**: CSS files in large projects become hard to organize and maintain

Sass solves these problems perfectly by introducing programming language features. It enables developers to write styles in a more structured, modular way, ultimately generating standard CSS that browsers understand.

### History and Evolution of Sass

Sass was created by Hampton Catlin in 2006 and is one of the earliest CSS preprocessors. Originally written in Ruby, it used indented syntax (.sass files). In 2010, Sass 3.0 introduced SCSS syntax (.scss files), a CSS-like syntax that lowered the learning curve. In 2019, Dart Sass became the officially recommended implementation, replacing Ruby Sass and LibSass.

## Sass vs SCSS Syntax Comparison

Sass provides two syntax formats: indented syntax (Sass) and SCSS syntax. Understanding the differences is crucial for choosing the right approach.

### Indented Syntax (.sass)

The indented syntax is Sass's original format, using indentation to represent nesting relationships, omitting braces and semicolons:

```sass
// Variable definitions
$primary-color: #3498db
$font-stack: 'Helvetica Neue', Arial, sans-serif
$base-spacing: 16px

// Mixin definition
=flex-center
  display: flex
  justify-content: center
  align-items: center

// Nesting rules
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

### SCSS Syntax (.scss)

SCSS syntax was introduced in Sass 3.0, fully compatible with CSS syntax, using braces and semicolons:

```scss
// Variable definitions
$primary-color: #3498db;
$font-stack: 'Helvetica Neue', Arial, sans-serif;
$base-spacing: 16px;

// Mixin definition
@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

// Nesting rules
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

### Syntax Selection Guidelines

| Feature | Sass (Indented) | SCSS |
|---------|-----------------|------|
| Learning Curve | Steeper (new syntax) | Gentle (CSS-compatible) |
| Code Conciseness | More concise | Slightly verbose |
| CSS Compatibility | Requires conversion | Fully compatible |
| Team Collaboration | Requires standardization | Easier adoption |
| Tool Support | Good | More extensive |
| Community Resources | Fewer | More abundant |

**SCSS syntax is recommended** for these reasons:
- Any valid CSS is valid SCSS, minimizing migration costs
- Syntax is closer to CSS, making team onboarding easier
- Most frameworks and libraries use SCSS syntax
- More code snippets and examples available

## Variables and Data Types

Sass supports seven data types, and understanding them is fundamental to mastering Sass.

### Data Types Explained

```scss
// 1. Numbers - with or without units
$font-size: 16px;
$line-height: 1.5;
$width-percentage: 50%;
$animation-duration: 0.3s;

// 2. Strings - with or without quotes
$font-family: 'Helvetica Neue';
$content-text: "Hello World";
$selector-name: navbar;  // Unquoted

// 3. Colors - multiple representations
$color-hex: #3498db;
$color-rgb: rgb(52, 152, 219);
$color-rgba: rgba(52, 152, 219, 0.8);
$color-hsl: hsl(204, 70%, 53%);
$color-named: blue;

// 4. Booleans
$is-dark-mode: true;
$has-sidebar: false;

// 5. Null
$optional-value: null;

// 6. Lists - separated by spaces or commas
$font-stack: 'Helvetica', 'Arial', sans-serif;
$margin-values: 10px 20px 30px 40px;
$breakpoints: (sm: 576px, md: 768px, lg: 992px, xl: 1200px);

// 7. Maps - key-value pairs
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

### Variable Scope

Sass variables have scope, and understanding scope is crucial for avoiding naming conflicts:

```scss
// Global variable
$global-color: #333;

.container {
  // Local variable, valid only within this block
  $local-padding: 20px;
  padding: $local-padding;
  color: $global-color;

  .inner {
    // Can access parent's local variable
    padding: $local-padding / 2;
  }
}

// Use !global flag to promote local variable to global
.button {
  $button-color: blue !global;
  background: $button-color;
}

.link {
  // Now can access $button-color
  color: $button-color;
}

// Use !default to set a default value (uses this if undefined)
$primary-color: red !default; // If $primary-color exists, keeps original value
```

### Variable Interpolation

Use `#{}` syntax to insert variable values in selectors, property names, and strings:

```scss
$property: 'margin';
$side: 'top';
$component: 'button';

// Use in property names
.box {
  #{$property}-#{$side}: 10px;
  // Compiles to: margin-top: 10px;
}

// Use in selectors
.#{$component} {
  display: inline-block;
}

.#{$component}-primary {
  background: blue;
}

// Use in calc()
$sidebar-width: 250px;
.main-content {
  width: calc(100% - #{$sidebar-width});
}

// Use in @media queries
$breakpoint-md: 768px;
@media (min-width: #{$breakpoint-md}) {
  .container {
    max-width: 720px;
  }
}
```

## Nesting Rules

Nesting is one of Sass's most intuitive features, making style structures clearer and reducing repetitive selector writing.

### Basic Nesting

```scss
// Sass nesting syntax
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

### Parent Selector Reference (&)

The `&` symbol represents the parent selector and is the most powerful feature in Sass nesting:

```scss
.button {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;

  // Pseudo-classes
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

  // Modifier classes (BEM style)
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

  // Combined states
  &--primary:hover {
    background: darken(#3498db, 10%);
  }

  // Adjacent sibling selector
  & + & {
    margin-left: 10px;
  }

  // Parent element influence
  .dark-theme & {
    background: #2c3e50;
  }
}
```

### Property Nesting

For properties with the same prefix, you can use property nesting:

```scss
.element {
  // Traditional syntax
  font-family: 'Arial', sans-serif;
  font-size: 16px;
  font-weight: 600;
  font-style: italic;

  // Property nesting syntax
  font: {
    family: 'Arial', sans-serif;
    size: 16px;
    weight: 600;
    style: italic;
  }

  // Other common uses
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

### Nesting Best Practices

```scss
// Not recommended: Nesting too deep
.page {
  .header {
    .nav {
      .nav-list {
        .nav-item {
          .nav-link {
            color: blue; // Selector too long, specificity too high
          }
        }
      }
    }
  }
}

// Recommended: Keep nesting to 3-4 levels
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

## Mixins and Functions

Mixins and functions are two core features for code reuse in Sass.

### Basic Mixin Usage

```scss
// Define mixin without parameters
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

// Use mixin
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

### Mixins with Parameters

```scss
// Required parameters
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

// Use mixin with parameters
.btn-primary {
  @include button-variant(#3498db, white);
}

.btn-success {
  @include button-variant(#2ecc71, white);
}

// Default parameters
@mixin box-shadow($x: 0, $y: 2px, $blur: 4px, $color: rgba(0, 0, 0, 0.1)) {
  box-shadow: $x $y $blur $color;
}

.card {
  @include box-shadow; // Uses default values
}

.dropdown {
  @include box-shadow(0, 4px, 8px, rgba(0, 0, 0, 0.15));
}

// Named parameters (improves readability)
.tooltip {
  @include box-shadow($blur: 6px, $color: rgba(0, 0, 0, 0.2));
}
```

### Variable Arguments

```scss
// Use ... to accept any number of arguments
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

// Expand list as arguments
$standard-transition: background-color 0.3s, color 0.3s;

.link {
  @include transition($standard-transition...);
}

// Practical multi-value mixin
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

### The @content Directive

`@content` allows passing content blocks to mixins, perfect for creating media queries and conditional styles:

```scss
// Responsive breakpoint mixin
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
    @warn "Unknown breakpoint: #{$breakpoint}";
  }
}

// Using the responsive mixin
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

// Dark mode mixin
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

### Custom Functions

Functions differ from mixins in that functions return a value, while mixins output style rules:

```scss
// Unit conversion function
@function px-to-rem($px, $base: 16px) {
  @return ($px / $base) * 1rem;
}

// Using the function
.heading {
  font-size: px-to-rem(24px); // 1.5rem
  margin-bottom: px-to-rem(16px); // 1rem
}

// Color manipulation functions
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

// Contrast color function
@function contrast-color($bg-color) {
  $luminance: (
    red($bg-color) * 0.299 +
    green($bg-color) * 0.587 +
    blue($bg-color) * 0.114
  ) / 255;

  @return if($luminance > 0.5, #000, #fff);
}

// Dynamic text color
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

## Extend and Placeholder Selectors

Extend allows one selector to share another selector's styles, reducing code repetition.

### Basic @extend Usage

```scss
// Base styles
.message {
  padding: 15px;
  border: 1px solid transparent;
  border-radius: 4px;
  margin-bottom: 20px;
}

// Extend and modify
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

// Compiled result:
// .message, .message-success, .message-warning, .message-error {
//   padding: 15px;
//   border: 1px solid transparent;
//   border-radius: 4px;
//   margin-bottom: 20px;
// }
```

### Placeholder Selectors (%)

Placeholder selectors only compile when used with `@extend`, perfect for defining styles purely for inheritance:

```scss
// Define placeholders (not output directly to CSS)
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

// Use placeholders
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

### @extend vs @mixin Comparison

```scss
// Using @extend - merges selectors, smaller CSS
%clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

.container { @extend %clearfix; }
.row { @extend %clearfix; }
// Output: .container::after, .row::after { ... }

// Using @mixin - copies code, more flexible
@mixin clearfix {
  &::after {
    content: '';
    display: table;
    clear: both;
  }
}

.container { @include clearfix; }
.row { @include clearfix; }
// Output: .container::after { ... } .row::after { ... }
```

**Selection guidelines:**
- Use `@extend`: When styles are identical and no parameters are needed
- Use `@mixin`: When parameters or dynamic content is needed
- Prefer placeholder selectors (`%`) over regular classes for inheritance

## Modules (@use, @forward)

Modern Sass recommends using `@use` and `@forward` for modular management, replacing the deprecated `@import`.

### The @use Rule

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
  // Access with namespace
  background: variables.$primary-color;
  font-size: variables.px-to-rem(14px);

  @include mixins.button-variant(variables.$secondary-color);
}
```

### Custom Namespaces

```scss
// Use 'as' keyword for custom namespaces
@use 'variables' as vars;
@use 'mixins' as m;
@use 'functions' as *; // * means no namespace

.element {
  color: vars.$primary-color;
  @include m.flex-center;
  font-size: px-to-rem(18px); // Use function directly
}

// Avoid naming conflicts
@use 'theme-a/colors' as theme-a;
@use 'theme-b/colors' as theme-b;

.light-theme {
  background: theme-a.$background;
}

.dark-theme {
  background: theme-b.$background;
}
```

### Configuring Modules

```scss
// _config.scss
$primary-color: #3498db !default;
$border-radius: 4px !default;
$enable-shadows: true !default;

// main.scss - Configure variables when using @use
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

### The @forward Rule

`@forward` exposes a module's members to other modules, perfect for creating entry files:

```scss
// abstracts/_variables.scss
$primary-color: #3498db;
$secondary-color: #2ecc71;

// abstracts/_mixins.scss
@mixin flex-center { /* ... */ }
@mixin button-variant($bg) { /* ... */ }

// abstracts/_functions.scss
@function px-to-rem($px) { /* ... */ }

// abstracts/_index.scss - Aggregate modules
@forward 'variables';
@forward 'mixins';
@forward 'functions';

// main.scss - Only reference one file
@use 'abstracts';

.element {
  color: abstracts.$primary-color;
  @include abstracts.flex-center;
}
```

### Advanced @forward Usage

```scss
// Selective forwarding
@forward 'variables' show $primary-color, $secondary-color;
@forward 'mixins' hide button-variant;

// Add prefix to avoid conflicts
@forward 'buttons' as btn-*;
// $color becomes $btn-color
// @mixin variant becomes @mixin btn-variant

// Configure and forward
@forward 'config' with (
  $primary-color: #e74c3c !default
);
```

## Control Directives

Sass provides complete control flow directives for writing conditional logic and loops.

### @if Conditional Statements

```scss
// Basic @if usage
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

// Use in mixins
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

// Conditional style inclusion
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

### @for Loops

```scss
// @for ... through (includes end value)
@for $i from 1 through 5 {
  .mt-#{$i} {
    margin-top: $i * 4px;
  }
}

// @for ... to (excludes end value)
@for $i from 0 to 4 {
  .opacity-#{$i * 25} {
    opacity: $i * 0.25;
  }
}

// Generate grid system
$columns: 12;

@for $i from 1 through $columns {
  .col-#{$i} {
    width: percentage($i / $columns);
  }
}

// Generate spacing utilities
$spacer: 4px;

@for $i from 0 through 10 {
  .p-#{$i} { padding: $i * $spacer; }
  .m-#{$i} { margin: $i * $spacer; }
  .px-#{$i} { padding-left: $i * $spacer; padding-right: $i * $spacer; }
  .py-#{$i} { padding-top: $i * $spacer; padding-bottom: $i * $spacer; }
}
```

### @each Iteration

```scss
// Iterate over list
$sizes: sm, md, lg, xl;

@each $size in $sizes {
  .text-#{$size} {
    @if $size == sm { font-size: 12px; }
    @else if $size == md { font-size: 14px; }
    @else if $size == lg { font-size: 18px; }
    @else if $size == xl { font-size: 24px; }
  }
}

// Iterate over map
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

// Iterate over multi-value list
$social-colors: (
  ('facebook', #3b5998, #fff),
  ('twitter', #1da1f2, #fff),
  ('instagram', #e4405f, #fff),
  ('linkedin', #0077b5, #fff)
);

@each $name, $bg, $color in $social-colors {
  .btn-#{$name} {
    background: $bg;
    color: $color;
  }
}

// Combine with responsive breakpoints
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

### @while Loops

```scss
// Using @while (less common)
$i: 1;

@while $i <= 6 {
  h#{$i} {
    font-size: 2.5rem - ($i * 0.25rem);
    margin-bottom: 0.5em;
  }
  $i: $i + 1;
}

// Generate z-index layers
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

## Build Tool Integration

### Vite Integration

```bash
# Install dependencies
npm install -D sass
```

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        // Globally inject variables and mixins
        additionalData: `
          @use "@/styles/variables" as *;
          @use "@/styles/mixins" as *;
        `,
        // Configure Sass API
        api: 'modern-compiler', // Use modern compiler API
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

### Webpack Integration

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader',  // Inject CSS into DOM
          'css-loader',    // Resolve @import and url()
          {
            loader: 'sass-loader',
            options: {
              // Use Dart Sass
              implementation: require('sass'),
              sassOptions: {
                // Sass configuration options
                outputStyle: 'compressed',
                includePaths: ['./src/styles']
              },
              // Global injection
              additionalData: `@use "variables" as *;`
            }
          }
        ]
      }
    ]
  }
};
```

### Vue CLI / Vue Projects

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

### Next.js Integration

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

## Best Practices and Project Structure

### Recommended Directory Structure (7-1 Pattern)

```
styles/
├── abstracts/           # Utilities and helpers
│   ├── _variables.scss  # Variables
│   ├── _functions.scss  # Functions
│   ├── _mixins.scss     # Mixins
│   └── _index.scss      # Aggregated exports
├── base/                # Base styles
│   ├── _reset.scss      # Reset styles
│   ├── _typography.scss # Typography
│   ├── _animations.scss # Animations
│   └── _index.scss
├── components/          # Component styles
│   ├── _button.scss
│   ├── _card.scss
│   ├── _modal.scss
│   └── _index.scss
├── layout/              # Layout styles
│   ├── _header.scss
│   ├── _footer.scss
│   ├── _sidebar.scss
│   ├── _grid.scss
│   └── _index.scss
├── pages/               # Page-specific styles
│   ├── _home.scss
│   ├── _about.scss
│   └── _index.scss
├── themes/              # Themes
│   ├── _light.scss
│   ├── _dark.scss
│   └── _index.scss
├── vendors/             # Third-party styles
│   ├── _normalize.scss
│   └── _index.scss
└── main.scss            # Main entry file
```

### Main Entry File Organization

```scss
// main.scss
// 1. Abstracts (no CSS output)
@use 'abstracts';

// 2. Vendors/Third-party
@use 'vendors/normalize';

// 3. Base styles
@use 'base/reset';
@use 'base/typography';
@use 'base/animations';

// 4. Layout
@use 'layout/grid';
@use 'layout/header';
@use 'layout/footer';
@use 'layout/sidebar';

// 5. Components (alphabetical order)
@use 'components/button';
@use 'components/card';
@use 'components/form';
@use 'components/modal';

// 6. Page-specific styles
@use 'pages/home';
@use 'pages/about';

// 7. Utilities (last to allow overrides)
@use 'utilities';
```

### Naming Conventions

```scss
// Variable naming: Use semantic names
// Bad naming
$red: #e74c3c;
$blue: #3498db;

// Good naming
$color-danger: #e74c3c;
$color-primary: #3498db;

// Component variables use prefixes
$btn-padding: 10px 20px;
$btn-border-radius: 4px;
$btn-font-size: 14px;

$card-padding: 20px;
$card-border-radius: 8px;
$card-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

// Mixin naming: Use verbs or descriptive names
@mixin make-container() { /* ... */ }
@mixin generate-columns($count) { /* ... */ }
@mixin apply-theme($theme) { /* ... */ }

// Function naming: Use verbs or return value descriptions
@function get-color($name) { /* ... */ }
@function calculate-rem($px) { /* ... */ }
@function strip-unit($value) { /* ... */ }
```

### Code Style Guide

```scss
// 1. Property ordering (recommend grouping by type)
.element {
  // Positioning
  position: absolute;
  top: 0;
  right: 0;
  z-index: 100;

  // Box model
  display: flex;
  width: 100px;
  height: 100px;
  padding: 10px;
  margin: 0;

  // Typography
  font-family: sans-serif;
  font-size: 16px;
  line-height: 1.5;
  text-align: center;

  // Visual
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;

  // Animation
  transition: all 0.3s ease;
  animation: fadeIn 1s;
}

// 2. Blank line between rule blocks
.button {
  padding: 10px 20px;
}

.button-primary {
  background: blue;
}

// 3. Blank line before nested selectors
.card {
  padding: 20px;

  .card-header {
    border-bottom: 1px solid #ddd;
  }

  .card-body {
    padding: 15px 0;
  }
}

// 4. Mixin calls after property declarations, before nested rules
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

## Interview Key Points

### What is the difference between Sass variables and CSS variables?

**Sass Variables:**
- Compiled at build time, generating static CSS
- Support all data types (numbers, colors, lists, maps, etc.)
- Can be used anywhere (selectors, property names, media queries, etc.)
- Do not exist in compiled CSS

**CSS Variables (Custom Properties):**
- Parsed at runtime, can be changed dynamically
- Only support string values
- Subject to cascade and inheritance rules
- Can be modified via JavaScript
- Can have different values in different contexts

```scss
// Sass variable
$primary: #3498db;

.button {
  background: $primary;
}
// Compiles to: .button { background: #3498db; }

// CSS variable
:root {
  --primary: #3498db;
}

.button {
  background: var(--primary);
}
// Can modify --primary at runtime via JS
```

### What is the difference between @mixin and @extend, and when to use each?

```scss
// @mixin - copies code to each call site
@mixin button-base {
  padding: 10px 20px;
  border-radius: 4px;
}

.btn-a { @include button-base; }
.btn-b { @include button-base; }
// Outputs two copies of the same code

// @extend - merges selectors
%button-base {
  padding: 10px 20px;
  border-radius: 4px;
}

.btn-a { @extend %button-base; }
.btn-b { @extend %button-base; }
// Output: .btn-a, .btn-b { padding: 10px 20px; border-radius: 4px; }
```

**Use cases:**
- **@mixin**: When parameters are needed, dynamic content, or use within media queries
- **@extend**: For purely static style sharing, to reduce CSS file size

### Why is @import deprecated? What are the advantages of @use?

**Problems with @import:**
- Global namespace, easy conflicts
- Cannot determine member origin
- Multiple imports cause repeated compilation
- No private member concept

**Advantages of @use:**
- Modular namespaces
- Clear member origins
- Only compiles once
- Supports private members (`$_private-var`)
- Supports configuration (`with`)

```scss
// @import (deprecated)
@import 'variables'; // Global pollution
@import 'mixins';

// @use (recommended)
@use 'variables' as vars;
@use 'mixins' as m;

.element {
  color: vars.$primary; // Clear origin
  @include m.flex-center;
}
```

### How do you optimize Sass compilation performance?

```scss
// 1. Avoid deep nesting (max 3-4 levels)
// Bad
.a { .b { .c { .d { .e { } } } } }

// Good
.a-b-c { }

// 2. Reduce @extend chains
// @extend can create unexpected selector combinations

// 3. Use @use instead of @import
// Avoids repeated compilation

// 4. Split large files
// Leverage incremental compilation

// 5. Avoid complex loops and calculations
// Cache calculation results in variables
$columns: 12;
$column-widths: ();

@for $i from 1 through $columns {
  $column-widths: map-merge(
    $column-widths,
    ($i: percentage($i / $columns))
  );
}
```

### How do you implement theme switching?

```scss
// Approach 1: CSS Variables + Sass
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

// Usage
.card {
  background: var(--bg-primary);
  color: var(--text-primary);
}

// Approach 2: Mixin approach
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

### How do you handle responsive design in Sass?

```scss
// Breakpoint map
$breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px
);

// Responsive mixin
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

// Usage example
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

## Summary

Sass/SCSS is a powerful CSS preprocessor that dramatically improves style development efficiency and maintainability through features like variables, nesting, mixins, functions, and modules. Mastering Sass's core concepts and best practices helps you write more elegant, reusable style code.

**Key Takeaways:**
1. Prefer SCSS syntax for better compatibility
2. Use variables wisely to organize design tokens
3. Keep nesting to 3-4 levels maximum
4. Choose @mixin or @extend based on the scenario
5. Use @use and @forward for modular management
6. Follow project structure conventions like the 7-1 pattern
7. Integrate seamlessly with modern build tools

As native CSS functionality expands (CSS variables, nesting proposal, etc.), some Sass features may be replaced by native solutions. However, Sass's advanced features like modularity, mixins, and functions remain indispensable tools for large projects. We recommend combining Sass with native CSS to leverage the strengths of both according to your project's actual needs.
