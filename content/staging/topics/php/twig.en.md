---
title: Twig Template Engine
description: Complete guide to Twig template engine for PHP, covering syntax, filters, functions, inheritance, and advanced features
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Twig
  - Templates
  - Symfony
  - Frontend
status: imported
origin: old/src/content/docs/php/twig.en.md
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

Twig is a modern, flexible, and secure template engine for PHP. It compiles templates to optimized PHP code, provides automatic output escaping, and offers a clean syntax that separates logic from presentation.

## Concept Explanation

Twig templates are text files that can generate any text-based format (HTML, XML, CSV, etc.). Templates contain variables, expressions, and tags that control the template's logic.

```twig
{# This is a comment #}

<!DOCTYPE html>
<html>
<head>
    <title>{{ title }}</title>
</head>
<body>
    <h1>Hello, {{ user.name }}!</h1>

    {% if products %}
        <ul>
        {% for product in products %}
            <li>{{ product.name }} - ${{ product.price }}</li>
        {% endfor %}
        </ul>
    {% else %}
        <p>No products available.</p>
    {% endif %}
</body>
</html>
```

Twig has three types of delimiters:
- `{{ ... }}` - Output expressions (variables, function calls)
- `{% ... %}` - Execute statements (control structures)
- `{# ... #}` - Comments (not included in output)

## Core Principles

### Variables and Expressions

```twig
{# Simple variables #}
{{ name }}
{{ user.email }}
{{ user['email'] }}

{# Array access #}
{{ items[0] }}
{{ items['key'] }}

{# Method calls #}
{{ user.getFullName() }}
{{ date.format('Y-m-d') }}

{# Ternary operator #}
{{ user.isAdmin ? 'Admin' : 'User' }}

{# Null coalescing #}
{{ user.nickname ?? user.name ?? 'Anonymous' }}

{# String interpolation #}
{{ "Hello #{user.name}!" }}

{# Arithmetic operations #}
{{ price * quantity }}
{{ total + tax }}
{{ count / 2 }}
{{ 10 % 3 }}
{{ 2 ** 10 }}

{# Comparisons #}
{{ a == b }}
{{ a != b }}
{{ a < b }}
{{ a > b }}
{{ a >= b }}
{{ a <= b }}
{{ a <=> b }}  {# Spaceship operator #}

{# Logical operators #}
{{ a and b }}
{{ a or b }}
{{ not a }}

{# String concatenation #}
{{ 'Hello ' ~ name ~ '!' }}

{# Range #}
{% for i in 0..10 %}
    {{ i }}
{% endfor %}

{# Test operators #}
{{ name is defined }}
{{ list is empty }}
{{ number is even }}
{{ number is odd }}
{{ value is null }}
{{ email is same as(user.email) }}
```

### Control Structures

```twig
{# If/else #}
{% if user.isAdmin %}
    <p>Welcome, Administrator!</p>
{% elseif user.isModerator %}
    <p>Welcome, Moderator!</p>
{% else %}
    <p>Welcome, User!</p>
{% endif %}

{# For loop #}
{% for product in products %}
    <div>{{ product.name }}</div>
{% else %}
    <p>No products found.</p>
{% endfor %}

{# Loop variables #}
{% for item in items %}
    {{ loop.index }}      {# 1-indexed iteration #}
    {{ loop.index0 }}     {# 0-indexed iteration #}
    {{ loop.revindex }}   {# Reverse iteration count #}
    {{ loop.first }}      {# True if first iteration #}
    {{ loop.last }}       {# True if last iteration #}
    {{ loop.length }}     {# Total number of items #}
    {{ loop.parent }}     {# Parent loop context #}
{% endfor %}

{# Iterating with keys #}
{% for key, value in items %}
    {{ key }}: {{ value }}
{% endfor %}

{# Conditional loop #}
{% for user in users if user.active %}
    {{ user.name }}
{% endfor %}

{# Set variables #}
{% set greeting = 'Hello' %}
{% set fullName = firstName ~ ' ' ~ lastName %}
{% set numbers = [1, 2, 3] %}
{% set user = {name: 'John', email: 'john@example.com'} %}

{# Multiple assignments #}
{% set a, b = 1, 2 %}
```

## Key Concepts

### Filters

```twig
{# String filters #}
{{ name|upper }}
{{ name|lower }}
{{ name|capitalize }}
{{ name|title }}
{{ text|trim }}
{{ text|trim('/') }}
{{ text|nl2br }}
{{ text|striptags }}
{{ html|raw }}  {# Disable escaping #}

{# Limiting and truncating #}
{{ text|slice(0, 100) }}
{{ text|truncate(100, '...') }}

{# Array filters #}
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

{# Number filters #}
{{ price|number_format(2, '.', ',') }}
{{ ratio|round(2) }}
{{ number|abs }}

{# Date filters #}
{{ date|date('Y-m-d H:i:s') }}
{{ date|date_modify('+1 day') }}
{{ date|date('F j, Y') }}

{# Encoding filters #}
{{ data|json_encode }}
{{ url|url_encode }}
{{ text|escape }}
{{ text|e }}  {# Shortcut for escape #}
{{ text|e('html') }}
{{ text|e('js') }}
{{ text|e('css') }}
{{ text|e('url') }}

{# Default values #}
{{ name|default('Anonymous') }}
{{ items|default([]) }}

{# Format filter #}
{{ 'Hello %s!'|format(name) }}

{# Batch for grids #}
{% for row in items|batch(3, 'empty') %}
    <div class="row">
        {% for item in row %}
            <div class="col">{{ item }}</div>
        {% endfor %}
    </div>
{% endfor %}
```

### Functions

```twig
{# Range function #}
{% for i in range(0, 10, 2) %}
    {{ i }}  {# 0, 2, 4, 6, 8, 10 #}
{% endfor %}

{# Date function #}
{{ date('now') }}
{{ date('tomorrow') }}
{{ date('+1 week') }}

{# Random function #}
{{ random() }}  {# Random integer #}
{{ random(5) }}  {# Random 0-5 #}
{{ random('ABC') }}  {# Random character #}
{{ random(['a', 'b', 'c']) }}  {# Random element #}

{# Cycle function #}
{% for item in items %}
    <div class="{{ cycle(['odd', 'even'], loop.index0) }}">
        {{ item }}
    </div>
{% endfor %}

{# Max/Min #}
{{ max(1, 3, 2) }}
{{ min(items) }}

{# Include function #}
{{ include('partials/header.html.twig') }}
{{ include('partials/card.html.twig', {title: 'Hello'}) }}

{# Dump for debugging #}
{{ dump(variable) }}
{{ dump() }}  {# Dumps all variables #}

{# Block function #}
{{ block('title') }}

{# Parent function #}
{% block content %}
    {{ parent() }}
    <p>Additional content</p>
{% endblock %}

{# Constant function #}
{{ constant('App\\Entity\\Status::ACTIVE') }}

{# Source function - includes raw file content #}
{{ source('data/example.json') }}
```

### Template Inheritance

```twig
{# base.html.twig - Parent template #}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}Default Title{% endblock %}</title>
    {% block stylesheets %}
        <link rel="stylesheet" href="/css/main.css">
    {% endblock %}
</head>
<body>
    <header>
        {% block header %}
            <nav><!-- Navigation --></nav>
        {% endblock %}
    </header>

    <main>
        {% block content %}{% endblock %}
    </main>

    <footer>
        {% block footer %}
            <p>&copy; {{ 'now'|date('Y') }} My Company</p>
        {% endblock %}
    </footer>

    {% block javascripts %}
        <script src="/js/main.js"></script>
    {% endblock %}
</body>
</html>

{# page.html.twig - Child template #}
{% extends 'base.html.twig' %}

{% block title %}My Page - {{ parent() }}{% endblock %}

{% block stylesheets %}
    {{ parent() }}
    <link rel="stylesheet" href="/css/page.css">
{% endblock %}

{% block content %}
    <h1>Welcome to My Page</h1>
    <p>This is the content.</p>
{% endblock %}
```

### Include, Embed, and Use

```twig
{# Include - simple inclusion #}
{% include 'partials/navbar.html.twig' %}
{% include 'partials/card.html.twig' with {title: 'Hello', content: 'World'} %}
{% include 'partials/card.html.twig' with {title: title} only %}
{% include 'partials/optional.html.twig' ignore missing %}

{# Embed - inclusion with block overrides #}
{% embed 'partials/card.html.twig' %}
    {% block card_title %}Custom Title{% endblock %}
    {% block card_body %}
        <p>Custom body content</p>
    {% endblock %}
{% endembed %}

{# card.html.twig for embed #}
<div class="card">
    <div class="card-header">
        {% block card_title %}Default Title{% endblock %}
    </div>
    <div class="card-body">
        {% block card_body %}{% endblock %}
    </div>
</div>

{# Use - horizontal reuse (traits) #}
{% use 'blocks/forms.html.twig' %}
{% use 'blocks/tables.html.twig' with table_header as parent_table_header %}

{# Now you can use blocks from forms.html.twig #}
{% block form_input %}
    {# Override if needed #}
{% endblock %}
```

## Code Examples

### Macros (Reusable Templates)

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

{# Using macros #}
{% import 'macros/forms.html.twig' as forms %}

<form method="post">
    {{ forms.input('username', '', 'text', {class: 'form-control', required: 'required'}) }}
    {{ forms.input('email', user.email, 'email', {class: 'form-control'}) }}
    {{ forms.select('country', countries, user.country, {class: 'form-select'}) }}
    {{ forms.textarea('bio', user.bio, {class: 'form-control', rows: 5}) }}
</form>

{# Import specific macros #}
{% from 'macros/forms.html.twig' import input, select %}
{{ input('name', 'John') }}
```

### Custom Extensions (PHP)

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

    public function formatPrice(float $price, string $currency = 'USD'): string
    {
        $symbols = ['USD' => '$', 'EUR' => '€', 'GBP' => '£'];
        $symbol = $symbols[$currency] ?? $currency;
        return $symbol . number_format($price, 2);
    }

    public function createExcerpt(string $text, int $length = 100): string
    {
        if (strlen($text) <= $length) {
            return $text;
        }
        return substr($text, 0, $length) . '...';
    }

    public function getAssetUrl(string $path): string
    {
        return '/assets/' . ltrim($path, '/') . '?v=' . filemtime('assets/' . $path);
    }

    public function isGranted(string $role): bool
    {
        // Check user permissions
        return true;
    }

    public function getSetting(string $key, mixed $default = null): mixed
    {
        // Fetch from settings
        return $default;
    }

    public function isAdmin($user): bool
    {
        return $user && in_array('ROLE_ADMIN', $user->getRoles());
    }
}

// Usage in templates:
// {{ product.price|price('EUR') }}
// {{ text|excerpt(150) }}
// {{ asset_url('images/logo.png') }}
// {% if user is admin %}...{% endif %}
```

### Practical Example: Dashboard

```twig
{# templates/dashboard/index.html.twig #}
{% extends 'base.html.twig' %}

{% block title %}Dashboard{% endblock %}

{% block content %}
<div class="dashboard">
    {# Stats Cards #}
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

    {# Recent Activity #}
    <div class="card">
        <div class="card-header">
            <h3>Recent Activity</h3>
        </div>
        <div class="card-body">
            <table class="table">
                <thead>
                    <tr>
                        <th>User</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>Status</th>
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
                                {{ activity.createdAt|date('M j, Y g:i A') }}
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
                            No recent activity
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>

    {# Charts Section #}
    <div class="charts-grid">
        <div class="card">
            <div class="card-header">Sales Overview</div>
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

## Best Practices

### 1. Escape Output Properly

```twig
{# Auto-escaping is on by default - safe for HTML #}
{{ user_input }}

{# Explicitly escape for different contexts #}
<script>
    var name = "{{ name|e('js') }}";
</script>

<style>
    .user-bg { background: {{ color|e('css') }}; }
</style>

<a href="?q={{ query|e('url') }}">Search</a>

{# Only use raw for trusted content #}
{{ trusted_html|raw }}
```

### 2. Use Inheritance Wisely

```twig
{# Define sensible defaults in base template #}
{% block sidebar %}
    {% include 'partials/default-sidebar.html.twig' %}
{% endblock %}

{# Child can completely override #}
{% block sidebar %}
    <aside>Custom sidebar</aside>
{% endblock %}

{# Or extend it #}
{% block sidebar %}
    {{ parent() }}
    <aside>Additional content</aside>
{% endblock %}
```

### 3. Keep Templates Simple

```twig
{# BAD: Complex logic in template #}
{% set total = 0 %}
{% for item in items %}
    {% if item.status == 'active' and item.price > 0 %}
        {% set total = total + (item.price * item.quantity * (1 - item.discount / 100)) %}
    {% endif %}
{% endfor %}

{# GOOD: Calculate in PHP, pass to template #}
Total: {{ order.calculatedTotal|price }}
```

## Common Pitfalls

### 1. Forgetting to Escape

```twig
{# WRONG: XSS vulnerability #}
{{ content|raw }}

{# RIGHT: Only use raw when content is trusted and needs HTML #}
{{ trusted_editor_content|raw }}

{# BETTER: Sanitize in PHP first #}
{{ sanitized_content|raw }}
```

### 2. Inefficient Loops

```twig
{# BAD: Calling method in every iteration #}
{% for i in 1..items|length %}
    Item {{ i }} of {{ items|length }}
{% endfor %}

{# GOOD: Use loop variables #}
{% for item in items %}
    Item {{ loop.index }} of {{ loop.length }}
{% endfor %}
```

### 3. Not Using Includes

```twig
{# BAD: Repeating code #}
<div class="card">
    <h3>{{ product1.name }}</h3>
    <p>{{ product1.description }}</p>
</div>
<div class="card">
    <h3>{{ product2.name }}</h3>
    <p>{{ product2.description }}</p>
</div>

{# GOOD: Use includes #}
{% for product in products %}
    {% include 'partials/product-card.html.twig' %}
{% endfor %}
```

## Performance Considerations

```php
<?php

// Enable caching in production
$twig = new \Twig\Environment($loader, [
    'cache' => '/path/to/cache',
    'auto_reload' => false,  // Disable in production
    'debug' => false,
]);

// Precompile templates
// bin/console cache:warmup (Symfony)
```

## Interview Key Points

1. **Delimiters**: `{{ }}` output, `{% %}` logic, `{# #}` comments

2. **Template inheritance**: `extends`, `block`, `parent()`

3. **Reusability**:
   - `include` for simple partials
   - `embed` for partials with overridable blocks
   - `macro` for reusable functions

4. **Security**: Auto-escaping, context-aware escaping

5. **Filters vs Functions**: Filters transform values, functions generate output

## Further Reading

- [Twig Documentation](https://twig.symfony.com/doc/3.x/)
- [Twig for Template Designers](https://twig.symfony.com/doc/3.x/templates.html)
- [Twig for Developers](https://twig.symfony.com/doc/3.x/api.html)
