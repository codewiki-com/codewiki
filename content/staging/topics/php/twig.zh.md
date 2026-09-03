---
title: Twig 模板引擎
description: PHP Twig 模板引擎完整指南，涵盖语法、过滤器、函数、继承和高级特性
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Twig
  - 模板
  - Symfony
  - 前端
status: imported
origin: old/src/content/docs/php/twig.zh.md
divergence: 0.226
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: PHP
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-21
---

Twig 是一个现代、灵活且安全的 PHP 模板引擎。它将模板编译为优化的 PHP 代码，提供自动输出转义，并提供将逻辑与表示分离的简洁语法。

## 概念解释

Twig 模板是可以生成任何基于文本格式（HTML、XML、CSV 等）的文本文件。模板包含控制模板逻辑的变量、表达式和标签。

```twig
{# 这是注释 #}

<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
</head>
<body>
    <h1>你好，{{ user.name }}！</h1>

    {% if products %}
        <ul>
        {% for product in products %}
            <li>{{ product.name }} - ¥{{ product.price }}</li>
        {% endfor %}
        </ul>
    {% else %}
        <p>暂无商品。</p>
    {% endif %}
</body>
</html>
```

Twig 有三种分隔符：
- `{{ ... }}` - 输出表达式（变量、函数调用）
- `{% ... %}` - 执行语句（控制结构）
- `{# ... #}` - 注释（不包含在输出中）

## 核心原理

### 变量和表达式

```twig
{# 简单变量 #}
{{ name }}
{{ user.email }}
{{ user['email'] }}

{# 数组访问 #}
{{ items[0] }}
{{ items['key'] }}

{# 方法调用 #}
{{ user.getFullName() }}
{{ date.format('Y-m-d') }}

{# 三元运算符 #}
{{ user.isAdmin ? '管理员' : '用户' }}

{# 空合并 #}
{{ user.nickname ?? user.name ?? '匿名' }}

{# 字符串插值 #}
{{ "你好 #{user.name}！" }}

{# 算术运算 #}
{{ price * quantity }}
{{ total + tax }}
{{ count / 2 }}
{{ 10 % 3 }}
{{ 2 ** 10 }}

{# 比较运算 #}
{{ a == b }}
{{ a != b }}
{{ a < b }}
{{ a > b }}
{{ a >= b }}
{{ a <= b }}
{{ a <=> b }}  {# 太空船运算符 #}

{# 逻辑运算符 #}
{{ a and b }}
{{ a or b }}
{{ not a }}

{# 字符串连接 #}
{{ '你好 ' ~ name ~ '！' }}

{# 范围 #}
{% for i in 0..10 %}
    {{ i }}
{% endfor %}

{# 测试运算符 #}
{{ name is defined }}
{{ list is empty }}
{{ number is even }}
{{ number is odd }}
{{ value is null }}
{{ email is same as(user.email) }}
```

### 控制结构

```twig
{# If/else #}
{% if user.isAdmin %}
    <p>欢迎，管理员！</p>
{% elseif user.isModerator %}
    <p>欢迎，版主！</p>
{% else %}
    <p>欢迎，用户！</p>
{% endif %}

{# For 循环 #}
{% for product in products %}
    <div>{{ product.name }}</div>
{% else %}
    <p>未找到商品。</p>
{% endfor %}

{# 循环变量 #}
{% for item in items %}
    {{ loop.index }}      {# 从 1 开始的迭代 #}
    {{ loop.index0 }}     {# 从 0 开始的迭代 #}
    {{ loop.revindex }}   {# 反向迭代计数 #}
    {{ loop.first }}      {# 如果是第一次迭代则为 True #}
    {{ loop.last }}       {# 如果是最后一次迭代则为 True #}
    {{ loop.length }}     {# 项目总数 #}
    {{ loop.parent }}     {# 父循环上下文 #}
{% endfor %}

{# 带键迭代 #}
{% for key, value in items %}
    {{ key }}: {{ value }}
{% endfor %}

{# 条件循环 #}
{% for user in users if user.active %}
    {{ user.name }}
{% endfor %}

{# 设置变量 #}
{% set greeting = '你好' %}
{% set fullName = firstName ~ ' ' ~ lastName %}
{% set numbers = [1, 2, 3] %}
{% set user = {name: 'John', email: 'john@example.com'} %}

{# 多重赋值 #}
{% set a, b = 1, 2 %}
```

## 核心要点

### 过滤器

```twig
{# 字符串过滤器 #}
{{ name|upper }}
{{ name|lower }}
{{ name|capitalize }}
{{ name|title }}
{{ text|trim }}
{{ text|trim('/') }}
{{ text|nl2br }}
{{ text|striptags }}
{{ html|raw }}  {# 禁用转义 #}

{# 限制和截断 #}
{{ text|slice(0, 100) }}
{{ text|truncate(100, '...') }}

{# 数组过滤器 #}
{{ items|length }}
{{ items|first }}
{{ items|last }}
{{ items|join(', ') }}
{{ items|sort }}
{{ items|reverse }}
{{ items|keys }}
{{ items|merge(otherItems) }}
{{ items|filter(item => item.active) }}
{{ items|map(item => item.name) }}
{{ items|reduce((carry, item) => carry + item, 0) }}
{{ items|column('name') }}

{# 数字过滤器 #}
{{ price|number_format(2, '.', ',') }}
{{ ratio|round(2) }}
{{ number|abs }}

{# 日期过滤器 #}
{{ date|date('Y-m-d H:i:s') }}
{{ date|date_modify('+1 day') }}
{{ date|date('Y年m月d日') }}

{# 编码过滤器 #}
{{ data|json_encode }}
{{ url|url_encode }}
{{ text|escape }}
{{ text|e }}  {# escape 的快捷方式 #}
{{ text|e('html') }}
{{ text|e('js') }}
{{ text|e('css') }}
{{ text|e('url') }}

{# 默认值 #}
{{ name|default('匿名') }}
{{ items|default([]) }}

{# 格式化过滤器 #}
{{ '你好 %s！'|format(name) }}

{# 批处理用于网格 #}
{% for row in items|batch(3, 'empty') %}
    <div class="row">
        {% for item in row %}
            <div class="col">{{ item }}</div>
        {% endfor %}
    </div>
{% endfor %}
```

### 函数

```twig
{# Range 函数 #}
{% for i in range(0, 10, 2) %}
    {{ i }}  {# 0, 2, 4, 6, 8, 10 #}
{% endfor %}

{# Date 函数 #}
{{ date('now') }}
{{ date('tomorrow') }}
{{ date('+1 week') }}

{# Random 函数 #}
{{ random() }}  {# 随机整数 #}
{{ random(5) }}  {# 随机 0-5 #}
{{ random('ABC') }}  {# 随机字符 #}
{{ random(['a', 'b', 'c']) }}  {# 随机元素 #}

{# Cycle 函数 #}
{% for item in items %}
    <div class="{{ cycle(['odd', 'even'], loop.index0) }}">
        {{ item }}
    </div>
{% endfor %}

{# Max/Min #}
{{ max(1, 3, 2) }}
{{ min(items) }}

{# Include 函数 #}
{{ include('partials/header.html.twig') }}
{{ include('partials/card.html.twig', {title: '你好'}) }}

{# Dump 用于调试 #}
{{ dump(variable) }}
{{ dump() }}  {# 转储所有变量 #}

{# Block 函数 #}
{{ block('title') }}

{# Parent 函数 #}
{% block content %}
    {{ parent() }}
    <p>额外内容</p>
{% endblock %}

{# Constant 函数 #}
{{ constant('App\\Entity\\Status::ACTIVE') }}

{# Source 函数 - 包含原始文件内容 #}
{{ source('data/example.json') }}
```

### 模板继承

```twig
{# base.html.twig - 父模板 #}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}默认标题{% endblock %}</title>
    {% block stylesheets %}
        <link rel="stylesheet" href="/css/main.css">
    {% endblock %}
</head>
<body>
    <header>
        {% block header %}
            <nav><!-- 导航 --></nav>
        {% endblock %}
    </header>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        {% block footer %}
            <p>&copy; {{ 'now'|date('Y') }} 我的公司</p>
        {% endblock %}
    </footer>

    {% block javascripts %}
        <script src="/js/main.js"></script>
    {% endblock %}
</body>
</html>

{# page.html.twig - 子模板 #}
{% extends 'base.html.twig' %}

{% block title %}我的页面 - {{ parent() }}{% endblock %}

{% block stylesheets %}
    {{ parent() }}
    <link rel="stylesheet" href="/css/page.css">
{% endblock %}

{% block content %}
    <h1>欢迎来到我的页面</h1>
    <p>这是内容。</p>
{% endblock %}
```

### Include、Embed 和 Use

```twig
{# Include - 简单包含 #}
{% include 'partials/navbar.html.twig' %}
{% include 'partials/card.html.twig' with {title: '你好', content: '世界'} %}
{% include 'partials/card.html.twig' with {title: title} only %}
{% include 'partials/optional.html.twig' ignore missing %}

{# Embed - 带块覆盖的包含 #}
{% embed 'partials/card.html.twig' %}
    {% block card_title %}自定义标题{% endblock %}
    {% block card_body %}
        <p>自定义内容</p>
    {% endblock %}
{% endembed %}

{# 用于 embed 的 card.html.twig #}
<div class="card">
    <div class="card-header">
        {% block card_title %}默认标题{% endblock %}
    </div>
    <div class="card-body">
        {% block card_body %}{% endblock %}
    </div>
</div>

{# Use - 水平复用（特征） #}
{% use 'blocks/forms.html.twig' %}
{% use 'blocks/tables.html.twig' with table_header as parent_table_header %}

{# 现在可以使用 forms.html.twig 中的块 #}
{% block form_input %}
    {# 需要时覆盖 #}
{% endblock %}
```

## 代码示例

### 宏（可复用模板）

```twig
{# macros/forms.html.twig #}
{% macro input(name, value = '', type = 'text', attributes = {}) %}
    <input
        type="{{ type }}"
        name="{{ name }}"
        value="{{ value }}"
        {% for attr, val in attributes %}
            {{ attr }}="{{ val }}"
        {% endfor %}
    >
{% endmacro %}

{% macro select(name, options, selected = null, attributes = {}) %}
    <select name="{{ name }}" {% for attr, val in attributes %}{{ attr }}="{{ val }}"{% endfor %}>
        {% for value, label in options %}
            <option value="{{ value }}" {{ value == selected ? 'selected' }}>
                {{ label }}
            </option>
        {% endfor %}
    </select>
{% endmacro %}

{% macro textarea(name, value = '', attributes = {}) %}
    <textarea
        name="{{ name }}"
        {% for attr, val in attributes %}{{ attr }}="{{ val }}"{% endfor %}
    >{{ value }}</textarea>
{% endmacro %}

{# 使用宏 #}
{% import 'macros/forms.html.twig' as forms %}

<form method="post">
    {{ forms.input('username', '', 'text', {class: 'form-control', required: 'required'}) }}
    {{ forms.input('email', user.email, 'email', {class: 'form-control'}) }}
    {{ forms.select('country', countries, user.country, {class: 'form-select'}) }}
    {{ forms.textarea('bio', user.bio, {class: 'form-control', rows: 5}) }}
</form>

{# 导入特定宏 #}
{% from 'macros/forms.html.twig' import input, select %}
{{ input('name', 'John') }}
```

### 自定义扩展（PHP）

```php
<?php

namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;
use Twig\TwigFunction;
use Twig\TwigTest;

class AppExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('price', [$this, 'formatPrice']),
            new TwigFilter('md5', 'md5'),
            new TwigFilter('excerpt', [$this, 'createExcerpt']),
        ];
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('asset_url', [$this, 'getAssetUrl']),
            new TwigFunction('is_granted', [$this, 'isGranted']),
            new TwigFunction('setting', [$this, 'getSetting']),
        ];
    }

    public function getTests(): array
    {
        return [
            new TwigTest('admin', [$this, 'isAdmin']),
        ];
    }

    public function formatPrice(float $price, string $currency = 'CNY'): string
    {
        $symbols = ['CNY' => '¥', 'USD' => '$', 'EUR' => '€'];
        $symbol = $symbols[$currency] ?? $currency;
        return $symbol . number_format($price, 2);
    }

    public function createExcerpt(string $text, int $length = 100): string
    {
        if (mb_strlen($text) <= $length) {
            return $text;
        }
        return mb_substr($text, 0, $length) . '...';
    }

    public function getAssetUrl(string $path): string
    {
        return '/assets/' . ltrim($path, '/') . '?v=' . filemtime('assets/' . $path);
    }

    public function isGranted(string $role): bool
    {
        // 检查用户权限
        return true;
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        // 从设置中获取
        return $default;
    }

    public function isAdmin($user): bool
    {
        return $user && in_array('ROLE_ADMIN', $user->getRoles());
    }
}

// 在模板中使用：
// {{ product.price|price('CNY') }}
// {{ text|excerpt(150) }}
// {{ asset_url('images/logo.png') }}
// {% if user is admin %}...{% endif %}
```

### 实际示例：仪表板

```twig
{# templates/dashboard/index.html.twig #}
{% extends 'base.html.twig' %}

{% block title %}仪表板{% endblock %}

{% block content %}
<div class="dashboard">
    {# 统计卡片 #}
    <div class="stats-grid">
        {% for stat in stats %}
            {% include 'dashboard/partials/stat-card.html.twig' with {
                title: stat.title,
                value: stat.value,
                change: stat.change,
                icon: stat.icon
            } %}
        {% endfor %}
    </div>

    {# 最近活动 #}
    <div class="card">
        <div class="card-header">
            <h3>最近活动</h3>
        </div>
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>用户</th>
                        <th>操作</th>
                        <th>日期</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    {% for activity in activities %}
                    <tr>
                        <td>
                            <div class="user-info">
                                <img src="{{ activity.user.avatar ?? '/images/default-avatar.png' }}"
                                     alt="{{ activity.user.name }}">
                                <span>{{ activity.user.name }}</span>
                            </div>
                        </td>
                        <td>{{ activity.action }}</td>
                        <td>
                            <time datetime="{{ activity.createdAt|date('c') }}">
                                {{ activity.createdAt|date('Y年m月d日 H:i') }}
                            </time>
                        </td>
                        <td>
                            <span class="badge badge-{{ activity.status }}">
                                {{ activity.status|capitalize }}
                            </span>
                        </td>
                    </tr>
                    {% else %}
                    <tr>
                        <td colspan="4" class="text-center">
                            暂无活动记录
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>

    {# 图表区域 #}
    <div class="charts-grid">
        <div class="card">
            <div class="card-header">销售概览</div>
            <div class="card-body">
                <canvas id="salesChart"
                        data-labels="{{ chartData.labels|json_encode }}"
                        data-values="{{ chartData.values|json_encode }}">
                </canvas>
            </div>
        </div>
    </div>
</div>
{% endblock %}

{% block javascripts %}
    {{ parent() }}
    <script src="{{ asset_url('js/charts.js') }}"></script>
{% endblock %}
```

## 最佳实践

### 1. 正确转义输出

```twig
{# 自动转义默认开启 - 对 HTML 安全 #}
{{ user_input }}

{# 为不同上下文显式转义 #}
<script>
    var name = "{{ name|e('js') }}";
</script>

<style>
    .user-bg { background: {{ color|e('css') }}; }
</style>

<a href="?q={{ query|e('url') }}">搜索</a>

{# 只对可信内容使用 raw #}
{{ trusted_html|raw }}
```

### 2. 明智地使用继承

```twig
{# 在基础模板中定义合理的默认值 #}
{% block sidebar %}
    {% include 'partials/default-sidebar.html.twig' %}
{% endblock %}

{# 子模板可以完全覆盖 #}
{% block sidebar %}
    <aside>自定义侧边栏</aside>
{% endblock %}

{# 或者扩展它 #}
{% block sidebar %}
    {{ parent() }}
    <aside>额外内容</aside>
{% endblock %}
```

### 3. 保持模板简单

```twig
{# 错误：模板中有复杂逻辑 #}
{% set total = 0 %}
{% for item in items %}
    {% if item.status == 'active' and item.price > 0 %}
        {% set total = total + (item.price * item.quantity * (1 - item.discount / 100)) %}
    {% endif %}
{% endfor %}

{# 正确：在 PHP 中计算，传递给模板 #}
总计：{{ order.calculatedTotal|price }}
```

## 常见陷阱

### 1. 忘记转义

```twig
{# 错误：XSS 漏洞 #}
{{ content|raw }}

{# 正确：只在内容可信且需要 HTML 时使用 raw #}
{{ trusted_editor_content|raw }}

{# 更好：先在 PHP 中清理 #}
{{ sanitized_content|raw }}
```

### 2. 低效循环

```twig
{# 错误：每次迭代都调用方法 #}
{% for i in 1..items|length %}
    项目 {{ i }}，共 {{ items|length }}
{% endfor %}

{# 正确：使用循环变量 #}
{% for item in items %}
    项目 {{ loop.index }}，共 {{ loop.length }}
{% endfor %}
```

### 3. 不使用包含

```twig
{# 错误：重复代码 #}
<div class="card">
    <h3>{{ product1.name }}</h3>
    <p>{{ product1.description }}</p>
</div>
<div class="card">
    <h3>{{ product2.name }}</h3>
    <p>{{ product2.description }}</p>
</div>

{# 正确：使用包含 #}
{% for product in products %}
    {% include 'partials/product-card.html.twig' %}
{% endfor %}
```

## 性能考量

```php
<?php

// 生产环境启用缓存
$twig = new \Twig\Environment($loader, [
    'cache' => '/path/to/cache',
    'auto_reload' => false,  // 生产环境禁用
    'debug' => false,
]);

// 预编译模板
// bin/console cache:warmup (Symfony)
```

## 面试要点

1. **分隔符**：`{{ }}` 输出，`{% %}` 逻辑，`{# #}` 注释

2. **模板继承**：`extends`、`block`、`parent()`

3. **可复用性**：
   - `include` 用于简单部分
   - `embed` 用于带可覆盖块的部分
   - `macro` 用于可复用函数

4. **安全性**：自动转义、上下文感知转义

5. **过滤器 vs 函数**：过滤器转换值，函数生成输出

## 延伸阅读

- [Twig 文档](https://twig.symfony.com/doc/3.x/)
- [模板设计师的 Twig](https://twig.symfony.com/doc/3.x/templates.html)
- [开发者的 Twig](https://twig.symfony.com/doc/3.x/api.html)
