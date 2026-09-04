---
title: Laravel Blade模板引擎
description: 深入掌握Laravel Blade模板引擎：语法、指令、布局、组件、插槽与缓存机制
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - Blade
  - 模板引擎
  - 前端
status: imported
origin: old/src/content/docs/php/blade.zh.md
divergence: 0.203
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: Web框架
  order: 4
  lastUpdated: 2026-01-07
---

## 概念解释

Blade是Laravel框架内置的强大模板引擎，它提供了一种简洁、优雅的语法来处理PHP视图。与原生PHP模板不同，Blade不会限制你在视图中使用纯PHP代码，同时提供了模板继承、组件系统等高级功能。

### 什么是Blade

Blade模板引擎的核心特点包括：

- **零开销编译**：Blade视图会被编译成纯PHP代码并缓存，因此不会增加运行时开销
- **模板继承**：支持布局定义和区块继承，实现代码复用
- **组件系统**：提供类组件和匿名组件，支持属性传递和插槽
- **简洁语法**：使用`{{ }}`和`@`指令，代码可读性强
- **自动转义**：默认对输出内容进行HTML转义，防止XSS攻击

### 为什么使用Blade

```php
// 原生PHP模板
<h1><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h1>
<?php if ($user): ?>
    <p>欢迎，<?php echo htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>

// Blade模板 - 更简洁、更安全
<h1>{{ $title }}</h1>
@if ($user)
    <p>欢迎，{{ $user->name }}</p>
@endif
```

### Blade的历史演进

| 版本 | 特性 |
|------|------|
| Laravel 5.1 | 引入基础组件支持 |
| Laravel 5.4 | 增强组件别名功能 |
| Laravel 7.x | 引入类组件和匿名组件 |
| Laravel 8.x | 动态组件、匿名索引组件 |
| Laravel 9.x | 增强插槽功能 |
| Laravel 10.x | 改进组件属性处理 |
| Laravel 11.x | 组件性能优化 |

## 核心原理

### 编译机制

Blade模板的工作流程如下：

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  .blade.php     │────>│   Blade编译器   │────>│   缓存的PHP文件  │
│  模板文件        │     │   解析指令语法   │     │   storage/views │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         v
                                                ┌─────────────────┐
                                                │   PHP执行引擎   │
                                                │   渲染HTML输出  │
                                                └─────────────────┘
```

### 编译过程详解

```php
// 原始Blade模板
@extends('layouts.app')

@section('content')
    <h1>{{ $title }}</h1>
    @foreach ($items as $item)
        <p>{{ $item->name }}</p>
    @endforeach
@endsection

// 编译后的PHP代码（存储在storage/framework/views/）
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?>

<?php $__env->startSection('content'); ?>
    <h1><?php echo e($title); ?></h1>
    <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <p><?php echo e($item->name); ?></p>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(); ?>
```

### 缓存策略

Blade使用文件修改时间来判断是否需要重新编译：

```php
// Illuminate\View\Compilers\BladeCompiler

public function isExpired($path)
{
    $compiled = $this->getCompiledPath($path);

    // 如果编译文件不存在，需要编译
    if (!$this->files->exists($compiled)) {
        return true;
    }

    // 比较源文件和编译文件的修改时间
    return $this->files->lastModified($path) >=
           $this->files->lastModified($compiled);
}
```

### 自定义指令原理

```php
// 在AppServiceProvider中注册自定义指令
use Illuminate\Support\Facades\Blade;

public function boot()
{
    // 简单指令
    Blade::directive('datetime', function ($expression) {
        return "<?php echo ($expression)->format('Y-m-d H:i:s'); ?>";
    });

    // 带条件的自定义指令
    Blade::if('env', function ($environment) {
        return app()->environment($environment);
    });
}

// 使用自定义指令
@datetime($user->created_at)

@env('local')
    <p>本地开发环境</p>
@endenv
```

## 核心要点

### 基础语法要点

1. **输出语法**
   - `{{ $var }}`：转义输出，防止XSS
   - `{!! $var !!}`：原始输出，不转义
   - `@{{ $var }}`：显示原始Blade语法（用于前端框架）

2. **控制结构指令**
   - 条件：`@if`、`@elseif`、`@else`、`@endif`
   - 循环：`@for`、`@foreach`、`@forelse`、`@while`
   - 切换：`@switch`、`@case`、`@default`

3. **布局指令**
   - `@extends`：继承布局
   - `@section`/`@endsection`：定义区块
   - `@yield`：输出区块内容
   - `@parent`：追加父模板内容

4. **组件指令**
   - `@component`：渲染组件
   - `@slot`：定义插槽
   - `<x-component>`：组件标签语法

### 指令速查表

| 指令 | 说明 | 示例 |
|------|------|------|
| `@if` | 条件判断 | `@if($user) ... @endif` |
| `@unless` | 反向条件 | `@unless($guest) ... @endunless` |
| `@isset` | 变量存在检查 | `@isset($var) ... @endisset` |
| `@empty` | 空值检查 | `@empty($arr) ... @endempty` |
| `@auth` | 已认证用户 | `@auth ... @endauth` |
| `@guest` | 访客用户 | `@guest ... @endguest` |
| `@env` | 环境检查 | `@env('local') ... @endenv` |
| `@production` | 生产环境 | `@production ... @endproduction` |
| `@once` | 只渲染一次 | `@once ... @endonce` |
| `@push` | 压入堆栈 | `@push('scripts') ... @endpush` |
| `@stack` | 渲染堆栈 | `@stack('scripts')` |

## 代码示例

### 数据输出与转义

```php
{{-- resources/views/examples/output.blade.php --}}

{{-- 基本输出（自动HTML转义） --}}
<p>用户名：{{ $user->name }}</p>
<p>邮箱：{{ $user->email }}</p>

{{-- 原始HTML输出（不转义，慎用） --}}
<div class="content">
    {!! $article->content !!}
</div>

{{-- 默认值处理 --}}
<p>昵称：{{ $user->nickname ?? '未设置' }}</p>
<p>签名：{{ $user->bio ?: '这个人很懒，什么都没写' }}</p>

{{-- 在JavaScript中输出 --}}
<script>
    // JSON编码输出
    var user = @json($user);
    var config = @json($config, JSON_PRETTY_PRINT);

    // Js指令（Laravel 9+）
    var settings = @js($settings);
</script>

{{-- 保留Blade语法（用于Vue/Angular等前端框架） --}}
<div id="app">
    @{{ message }}
    @verbatim
        <p>{{ user.name }}</p>
        <p>{{ user.email }}</p>
    @endverbatim
</div>
```

### 条件语句

```php
{{-- resources/views/examples/conditions.blade.php --}}

{{-- 基本条件判断 --}}
@if ($user->isAdmin())
    <span class="badge badge-admin">管理员</span>
@elseif ($user->isModerator())
    <span class="badge badge-mod">版主</span>
@else
    <span class="badge badge-user">普通用户</span>
@endif

{{-- unless - 反向条件 --}}
@unless ($user->hasVerifiedEmail())
    <div class="alert alert-warning">
        请验证您的邮箱地址
    </div>
@endunless

{{-- isset - 检查变量是否存在且不为null --}}
@isset($notification)
    <div class="notification">{{ $notification }}</div>
@endisset

{{-- empty - 检查是否为空 --}}
@empty($posts)
    <p>暂无文章</p>
@endempty

{{-- 认证相关条件 --}}
@auth
    <p>欢迎回来，{{ auth()->user()->name }}！</p>
    <a href="{{ route('logout') }}">退出登录</a>
@endauth

@guest
    <a href="{{ route('login') }}">登录</a>
    <a href="{{ route('register') }}">注册</a>
@endguest

{{-- 指定认证守卫 --}}
@auth('admin')
    <p>管理后台已登录</p>
@endauth

{{-- 环境条件 --}}
@production
    <script src="{{ asset('js/analytics.js') }}"></script>
@endproduction

@env('local')
    <div class="debug-bar">调试信息</div>
@endenv

@env(['staging', 'production'])
    <script src="https://cdn.example.com/app.js"></script>
@endenv

{{-- Switch语句 --}}
@switch($status)
    @case('pending')
        <span class="text-warning">待处理</span>
        @break
    @case('approved')
        <span class="text-success">已通过</span>
        @break
    @case('rejected')
        <span class="text-danger">已拒绝</span>
        @break
    @default
        <span class="text-muted">未知状态</span>
@endswitch

{{-- 检查Session --}}
@session('status')
    <div class="alert alert-success">
        {{ $value }}
    </div>
@endsession
```

### 循环结构

```php
{{-- resources/views/examples/loops.blade.php --}}

{{-- 基本foreach循环 --}}
<ul>
    @foreach ($users as $user)
        <li>{{ $user->name }}</li>
    @endforeach
</ul>

{{-- forelse - 处理空集合 --}}
<div class="posts">
    @forelse ($posts as $post)
        <article>
            <h2>{{ $post->title }}</h2>
            <p>{{ $post->excerpt }}</p>
        </article>
    @empty
        <p class="no-posts">暂无文章，快来发布第一篇吧！</p>
    @endforelse
</div>

{{-- $loop变量 - 循环信息 --}}
<table>
    @foreach ($items as $item)
        <tr class="{{ $loop->even ? 'bg-gray-100' : '' }}">
            <td>{{ $loop->iteration }}</td>  {{-- 当前迭代（从1开始） --}}
            <td>{{ $item->name }}</td>
            <td>
                @if ($loop->first)
                    <span class="badge">首项</span>
                @endif
                @if ($loop->last)
                    <span class="badge">末项</span>
                @endif
            </td>
        </tr>
    @endforeach
</table>

{{-- $loop变量的所有属性 --}}
@foreach ($items as $item)
    {{-- $loop->index      // 当前索引（从0开始） --}}
    {{-- $loop->iteration  // 当前迭代（从1开始） --}}
    {{-- $loop->remaining  // 剩余迭代次数 --}}
    {{-- $loop->count      // 总数 --}}
    {{-- $loop->first      // 是否是第一次迭代 --}}
    {{-- $loop->last       // 是否是最后一次迭代 --}}
    {{-- $loop->even       // 是否是偶数次迭代 --}}
    {{-- $loop->odd        // 是否是奇数次迭代 --}}
    {{-- $loop->depth      // 嵌套层级 --}}
    {{-- $loop->parent     // 父循环的$loop变量 --}}
@endforeach

{{-- 嵌套循环 --}}
<div class="categories">
    @foreach ($categories as $category)
        <div class="category">
            <h3>{{ $category->name }} (深度: {{ $loop->depth }})</h3>
            <ul>
                @foreach ($category->products as $product)
                    <li>
                        {{ $product->name }}
                        (父级索引: {{ $loop->parent->index }})
                    </li>
                @endforeach
            </ul>
        </div>
    @endforeach
</div>

{{-- for循环 --}}
<select name="quantity">
    @for ($i = 1; $i <= 10; $i++)
        <option value="{{ $i }}">{{ $i }}</option>
    @endfor
</select>

{{-- while循环 --}}
@php
    $count = 0;
@endphp

@while ($count < 5)
    <p>计数: {{ $count }}</p>
    @php $count++; @endphp
@endwhile

{{-- 跳过和终止 --}}
@foreach ($users as $user)
    @if ($user->isBanned())
        @continue
    @endif

    <p>{{ $user->name }}</p>

    @if ($user->isAdmin())
        @break
    @endif
@endforeach

{{-- 带条件的continue和break --}}
@foreach ($users as $user)
    @continue($user->status === 'inactive')

    <p>{{ $user->name }}</p>

    @break($loop->iteration > 10)
@endforeach
```

### 模板继承与布局

```php
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', config('app.name'))</title>

    {{-- 基础样式 --}}
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    {{-- 页面特定样式 --}}
    @stack('styles')
</head>
<body class="@yield('body-class')">
    {{-- 导航栏 --}}
    @include('partials.navigation')

    {{-- 页面头部（可选） --}}
    @hasSection('header')
        <header class="page-header">
            @yield('header')
        </header>
    @endif

    {{-- 主要内容 --}}
    <main class="container">
        {{-- Flash消息 --}}
        @include('partials.flash-messages')

        {{-- 面包屑导航（可选） --}}
        @hasSection('breadcrumbs')
            <nav aria-label="breadcrumb">
                @yield('breadcrumbs')
            </nav>
        @endif

        {{-- 页面内容 --}}
        @yield('content')
    </main>

    {{-- 页脚 --}}
    @include('partials.footer')

    {{-- 基础脚本 --}}
    <script src="{{ asset('js/app.js') }}"></script>

    {{-- 页面特定脚本 --}}
    @stack('scripts')
</body>
</html>
```

```php
{{-- resources/views/posts/show.blade.php --}}
@extends('layouts.app')

@section('title', $post->title . ' - ' . config('app.name'))

@section('body-class', 'post-page')

@section('header')
    <h1>{{ $post->title }}</h1>
    <p class="meta">
        发布于 {{ $post->created_at->format('Y年m月d日') }}
        | 作者: {{ $post->author->name }}
    </p>
@endsection

@section('breadcrumbs')
    <ol class="breadcrumb">
        <li><a href="{{ route('home') }}">首页</a></li>
        <li><a href="{{ route('posts.index') }}">文章</a></li>
        <li class="active">{{ $post->title }}</li>
    </ol>
@endsection

@section('content')
    <article class="post">
        <div class="post-content">
            {!! $post->content !!}
        </div>

        <div class="post-tags">
            @foreach ($post->tags as $tag)
                <a href="{{ route('tags.show', $tag) }}" class="tag">
                    {{ $tag->name }}
                </a>
            @endforeach
        </div>

        {{-- 评论区域 --}}
        @include('posts.comments', ['comments' => $post->comments])
    </article>

    {{-- 相关文章 --}}
    @include('posts.related', ['posts' => $relatedPosts])
@endsection

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/post.css') }}">
    <link rel="stylesheet" href="{{ asset('css/prism.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/prism.js') }}"></script>
    <script>
        // 代码高亮初始化
        Prism.highlightAll();
    </script>
@endpush
```

```php
{{-- resources/views/layouts/sidebar.blade.php - 带侧边栏的布局 --}}
@extends('layouts.app')

@section('content')
    <div class="row">
        <div class="col-md-8">
            @yield('main-content')
        </div>
        <div class="col-md-4">
            @section('sidebar')
                {{-- 默认侧边栏内容 --}}
                @include('partials.sidebar-default')
            @show
        </div>
    </div>
@endsection
```

```php
{{-- 子模板可以追加到父模板的section --}}
@extends('layouts.sidebar')

@section('main-content')
    <h1>文章列表</h1>
    {{-- 主要内容 --}}
@endsection

@section('sidebar')
    @parent  {{-- 保留父模板的内容 --}}

    {{-- 追加自定义内容 --}}
    <div class="widget">
        <h3>热门标签</h3>
        @include('partials.tag-cloud')
    </div>
@endsection
```

### 包含子视图

```php
{{-- 基本包含 --}}
@include('partials.header')

{{-- 带数据包含 --}}
@include('partials.user-card', ['user' => $currentUser])

{{-- 条件包含 --}}
@includeWhen($user->isAdmin(), 'admin.dashboard-widget')
@includeUnless($user->isBanned(), 'partials.comment-form')

{{-- 存在则包含 --}}
@includeIf('custom.optional-partial')

{{-- 包含第一个存在的视图 --}}
@includeFirst(['custom.header', 'partials.header'])

{{-- 循环包含 --}}
@each('partials.comment', $comments, 'comment')

{{-- 循环包含（带空状态） --}}
@each('partials.comment', $comments, 'comment', 'partials.no-comments')
```

```php
{{-- resources/views/partials/comment.blade.php --}}
<div class="comment" id="comment-{{ $comment->id }}">
    <img src="{{ $comment->user->avatar }}" alt="{{ $comment->user->name }}">
    <div class="comment-content">
        <strong>{{ $comment->user->name }}</strong>
        <span class="time">{{ $comment->created_at->diffForHumans() }}</span>
        <p>{{ $comment->content }}</p>
    </div>
</div>
```

### 组件系统

#### 类组件

```php
// app/View/Components/Alert.php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public string $type;
    public string $message;
    public bool $dismissible;

    public function __construct(
        string $type = 'info',
        string $message = '',
        bool $dismissible = false
    ) {
        $this->type = $type;
        $this->message = $message;
        $this->dismissible = $dismissible;
    }

    /**
     * 获取警告框的CSS类
     */
    public function alertClass(): string
    {
        return match($this->type) {
            'success' => 'alert-success',
            'warning' => 'alert-warning',
            'danger', 'error' => 'alert-danger',
            default => 'alert-info',
        };
    }

    /**
     * 获取图标
     */
    public function icon(): string
    {
        return match($this->type) {
            'success' => 'check-circle',
            'warning' => 'exclamation-triangle',
            'danger', 'error' => 'times-circle',
            default => 'info-circle',
        };
    }

    /**
     * 判断是否应该渲染组件
     */
    public function shouldRender(): bool
    {
        return !empty($this->message);
    }

    public function render()
    {
        return view('components.alert');
    }
}
```

```php
{{-- resources/views/components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'alert ' . $alertClass()]) }}
     role="alert">
    <i class="fa fa-{{ $icon() }}"></i>

    @if ($message)
        <span>{{ $message }}</span>
    @else
        {{ $slot }}
    @endif

    @if ($dismissible)
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    @endif
</div>
```

```php
{{-- 使用类组件 --}}

{{-- 基本使用 --}}
<x-alert type="success" message="操作成功！" />

{{-- 使用插槽 --}}
<x-alert type="warning" dismissible>
    <strong>警告！</strong> 您的账户即将过期。
</x-alert>

{{-- 传递额外属性 --}}
<x-alert type="error"
         message="发生错误"
         class="mb-4"
         id="error-alert"
         data-timeout="5000" />
```

#### 匿名组件

```php
{{-- resources/views/components/card.blade.php --}}
@props([
    'title' => '',
    'footer' => null,
    'headerClass' => '',
])

<div {{ $attributes->merge(['class' => 'card']) }}>
    @if ($title)
        <div class="card-header {{ $headerClass }}">
            {{ $title }}
        </div>
    @endif

    <div class="card-body">
        {{ $slot }}
    </div>

    @if ($footer)
        <div class="card-footer">
            {{ $footer }}
        </div>
    @endif
</div>
```

```php
{{-- 使用匿名组件 --}}
<x-card title="用户信息" class="shadow-lg">
    <p>姓名：{{ $user->name }}</p>
    <p>邮箱：{{ $user->email }}</p>

    <x-slot:footer>
        <a href="{{ route('users.edit', $user) }}">编辑</a>
    </x-slot:footer>
</x-card>
```

#### 组件属性处理

```php
{{-- resources/views/components/input.blade.php --}}
@props([
    'type' => 'text',
    'name',
    'label' => null,
    'value' => '',
    'required' => false,
    'disabled' => false,
])

<div class="form-group">
    @if ($label)
        <label for="{{ $name }}" class="{{ $required ? 'required' : '' }}">
            {{ $label }}
        </label>
    @endif

    <input type="{{ $type }}"
           name="{{ $name }}"
           id="{{ $name }}"
           value="{{ old($name, $value) }}"
           {{ $required ? 'required' : '' }}
           {{ $disabled ? 'disabled' : '' }}
           {{ $attributes->merge(['class' => 'form-control']) }}>

    @error($name)
        <span class="error-message">{{ $message }}</span>
    @enderror
</div>
```

```php
{{-- 使用input组件 --}}
<form method="POST" action="{{ route('users.store') }}">
    @csrf

    <x-input
        name="email"
        type="email"
        label="邮箱地址"
        :value="$user->email ?? ''"
        required
        placeholder="请输入邮箱"
        class="custom-input" />

    <x-input
        name="password"
        type="password"
        label="密码"
        required />

    <button type="submit">提交</button>
</form>
```

#### 插槽系统

```php
{{-- resources/views/components/modal.blade.php --}}
@props([
    'name',
    'show' => false,
    'maxWidth' => 'md',
])

@php
$maxWidthClass = [
    'sm' => 'max-w-sm',
    'md' => 'max-w-md',
    'lg' => 'max-w-lg',
    'xl' => 'max-w-xl',
    '2xl' => 'max-w-2xl',
][$maxWidth];
@endphp

<div x-data="{ show: @js($show) }"
     x-show="show"
     class="modal"
     {{ $attributes }}>

    <div class="modal-backdrop" @click="show = false"></div>

    <div class="modal-content {{ $maxWidthClass }}">
        {{-- 标题插槽 --}}
        @if (isset($title))
            <div class="modal-header">
                {{ $title }}
                <button @click="show = false">&times;</button>
            </div>
        @endif

        {{-- 默认内容插槽 --}}
        <div class="modal-body">
            {{ $slot }}
        </div>

        {{-- 底部插槽 --}}
        @if (isset($footer))
            <div class="modal-footer">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
```

```php
{{-- 使用modal组件 --}}
<x-modal name="confirm-delete" max-width="sm">
    <x-slot:title>
        <h3>确认删除</h3>
    </x-slot:title>

    <p>您确定要删除此项目吗？此操作不可撤销。</p>

    <x-slot:footer>
        <button @click="show = false" class="btn btn-secondary">
            取消
        </button>
        <button @click="deleteItem()" class="btn btn-danger">
            确认删除
        </button>
    </x-slot:footer>
</x-modal>
```

#### 动态组件

```php
{{-- 动态组件渲染 --}}
@php
    $componentName = 'alert';  // 可以是 'alert', 'card', 'modal' 等
@endphp

<x-dynamic-component :component="$componentName" type="success" message="动态加载的组件" />

{{-- 根据条件渲染不同组件 --}}
@foreach ($widgets as $widget)
    <x-dynamic-component
        :component="$widget->type"
        :data="$widget->data" />
@endforeach
```

### 表单处理

```php
{{-- resources/views/users/create.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>创建用户</h1>

    <form method="POST" action="{{ route('users.store') }}" enctype="multipart/form-data">
        @csrf

        {{-- 文本输入 --}}
        <div class="form-group">
            <label for="name">姓名</label>
            <input type="text"
                   name="name"
                   id="name"
                   value="{{ old('name') }}"
                   class="form-control @error('name') is-invalid @enderror">
            @error('name')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        {{-- 下拉选择 --}}
        <div class="form-group">
            <label for="role">角色</label>
            <select name="role" id="role" class="form-control">
                <option value="">请选择</option>
                @foreach ($roles as $role)
                    <option value="{{ $role->id }}"
                            @selected(old('role') == $role->id)>
                        {{ $role->name }}
                    </option>
                @endforeach
            </select>
        </div>

        {{-- 复选框 --}}
        <div class="form-check">
            <input type="checkbox"
                   name="active"
                   id="active"
                   value="1"
                   @checked(old('active', true))
                   class="form-check-input">
            <label for="active" class="form-check-label">激活账户</label>
        </div>

        {{-- 单选按钮 --}}
        <div class="form-group">
            <label>性别</label>
            @foreach (['male' => '男', 'female' => '女', 'other' => '其他'] as $value => $label)
                <div class="form-check">
                    <input type="radio"
                           name="gender"
                           id="gender-{{ $value }}"
                           value="{{ $value }}"
                           @checked(old('gender') == $value)
                           class="form-check-input">
                    <label for="gender-{{ $value }}" class="form-check-label">
                        {{ $label }}
                    </label>
                </div>
            @endforeach
        </div>

        {{-- 文件上传 --}}
        <div class="form-group">
            <label for="avatar">头像</label>
            <input type="file" name="avatar" id="avatar" class="form-control-file">
        </div>

        {{-- 隐藏字段 --}}
        <input type="hidden" name="source" value="web">

        <button type="submit" class="btn btn-primary">创建</button>
    </form>
@endsection
```

```php
{{-- 编辑表单（使用@method） --}}
<form method="POST" action="{{ route('users.update', $user) }}">
    @csrf
    @method('PUT')

    {{-- 表单字段 --}}
</form>

{{-- 删除表单 --}}
<form method="POST" action="{{ route('users.destroy', $user) }}"
      onsubmit="return confirm('确定删除？')">
    @csrf
    @method('DELETE')

    <button type="submit" class="btn btn-danger">删除</button>
</form>
```

### 栈与资源注入

```php
{{-- 布局文件 --}}
<head>
    {{-- 基础样式 --}}
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    {{-- 样式栈 --}}
    @stack('styles')
</head>
<body>
    @yield('content')

    {{-- 基础脚本 --}}
    <script src="{{ asset('js/app.js') }}"></script>

    {{-- 脚本栈 --}}
    @stack('scripts')
</body>
```

```php
{{-- 子视图推送内容到栈 --}}
@push('styles')
    <link rel="stylesheet" href="{{ asset('css/datepicker.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/datepicker.js') }}"></script>
    <script>
        // 初始化日期选择器
        $('.datepicker').datepicker();
    </script>
@endpush

{{-- 使用@prepend在栈顶添加 --}}
@prepend('scripts')
    <script src="{{ asset('js/jquery.js') }}"></script>
@endprepend

{{-- 条件推送 --}}
@pushIf($needsChart, 'scripts')
    <script src="{{ asset('js/chart.js') }}"></script>
@endPushIf

{{-- 只推送一次（避免重复） --}}
@once
    @push('scripts')
        <script src="{{ asset('js/shared-lib.js') }}"></script>
    @endpush
@endonce
```

### 自定义指令

```php
// app/Providers/AppServiceProvider.php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        // 简单指令
        Blade::directive('datetime', function ($expression) {
            return "<?php echo ($expression)->format('Y年m月d日 H:i'); ?>";
        });

        // 金额格式化
        Blade::directive('money', function ($expression) {
            return "<?php echo '¥' . number_format($expression, 2); ?>";
        });

        // 截断文本
        Blade::directive('truncate', function ($expression) {
            list($string, $length) = explode(',', $expression);
            return "<?php echo Str::limit($string, $length); ?>";
        });

        // 条件指令
        Blade::if('role', function ($role) {
            return auth()->check() && auth()->user()->hasRole($role);
        });

        // 多角色检查
        Blade::if('anyrole', function (...$roles) {
            return auth()->check() && auth()->user()->hasAnyRole($roles);
        });

        // 权限检查
        Blade::if('permission', function ($permission) {
            return auth()->check() && auth()->user()->can($permission);
        });

        // 功能开关
        Blade::if('feature', function ($feature) {
            return config("features.{$feature}", false);
        });
    }
}
```

```php
{{-- 使用自定义指令 --}}

{{-- 日期格式化 --}}
<p>注册时间：@datetime($user->created_at)</p>

{{-- 金额显示 --}}
<p>总价：@money($order->total)</p>

{{-- 文本截断 --}}
<p>@truncate($article->content, 100)</p>

{{-- 角色条件 --}}
@role('admin')
    <a href="{{ route('admin.dashboard') }}">管理后台</a>
@endrole

@anyrole('admin', 'editor')
    <a href="{{ route('content.manage') }}">内容管理</a>
@endanyrole

{{-- 权限条件 --}}
@permission('users.create')
    <button>创建用户</button>
@endpermission

{{-- 功能开关 --}}
@feature('new-dashboard')
    <div class="new-dashboard">新版仪表板</div>
@else
    <div class="old-dashboard">旧版仪表板</div>
@endfeature
```

## 最佳实践

### 目录结构组织

```
resources/views/
├── components/              # 组件
│   ├── forms/              # 表单组件
│   │   ├── input.blade.php
│   │   ├── select.blade.php
│   │   └── textarea.blade.php
│   ├── ui/                 # UI组件
│   │   ├── alert.blade.php
│   │   ├── modal.blade.php
│   │   └── card.blade.php
│   └── layouts/            # 布局组件
│       ├── header.blade.php
│       └── footer.blade.php
├── layouts/                # 布局模板
│   ├── app.blade.php       # 主布局
│   ├── admin.blade.php     # 管理后台布局
│   └── auth.blade.php      # 认证页面布局
├── partials/               # 可复用片段
│   ├── navigation.blade.php
│   ├── sidebar.blade.php
│   └── flash-messages.blade.php
├── emails/                 # 邮件模板
├── errors/                 # 错误页面
│   ├── 404.blade.php
│   ├── 500.blade.php
│   └── 503.blade.php
└── [feature]/              # 功能模块视图
    ├── users/
    │   ├── index.blade.php
    │   ├── show.blade.php
    │   ├── create.blade.php
    │   └── edit.blade.php
    └── posts/
        ├── index.blade.php
        └── show.blade.php
```

### 组件设计原则

```php
// 1. 单一职责 - 每个组件只做一件事
// 好的示例
<x-button>提交</x-button>
<x-input name="email" />

// 不好的示例 - 组件做太多事
<x-user-form-with-validation-and-submission />


// 2. 合理的默认值
@props([
    'type' => 'button',           // 默认类型
    'variant' => 'primary',       // 默认样式
    'size' => 'md',               // 默认大小
    'disabled' => false,          // 默认启用
])


// 3. 属性转发 - 允许传递额外属性
<button {{ $attributes->merge([
    'type' => $type,
    'class' => "btn btn-{$variant} btn-{$size}",
    'disabled' => $disabled,
]) }}>
    {{ $slot }}
</button>


// 4. 样式隔离 - 使用类组件封装复杂逻辑
class Button extends Component
{
    public function variantClasses(): string
    {
        return match($this->variant) {
            'primary' => 'bg-blue-500 text-white hover:bg-blue-600',
            'secondary' => 'bg-gray-500 text-white hover:bg-gray-600',
            'danger' => 'bg-red-500 text-white hover:bg-red-600',
            'outline' => 'border border-gray-300 hover:bg-gray-100',
            default => '',
        };
    }
}
```

### 性能优化建议

```php
// 1. 使用@once避免重复渲染
@foreach ($items as $item)
    @once
        <style>
            .item-card { /* 样式定义 */ }
        </style>
    @endonce

    <div class="item-card">{{ $item->name }}</div>
@endforeach


// 2. 条件性加载组件
@if ($user->hasNotifications())
    <x-notification-dropdown :notifications="$user->notifications" />
@endif


// 3. 懒加载大型内容
{{-- 使用Livewire或Alpine.js实现懒加载 --}}
<div x-data="{ loaded: false }" x-intersect="loaded = true">
    <template x-if="loaded">
        @include('partials.heavy-content')
    </template>
</div>


// 4. 缓存频繁使用的视图片段
@cache('sidebar-' . $user->id, 3600)
    @include('partials.sidebar')
@endcache


// 5. 减少数据库查询 - 在控制器中预加载
// Controller
$posts = Post::with(['author', 'tags', 'comments.user'])->get();
return view('posts.index', compact('posts'));
```

### 安全实践

```php
// 1. 始终转义用户输入
{{ $userInput }}  // 正确 - 自动转义

// 只在确保安全时使用原始输出
{!! $trustedHtml !!}  // 谨慎使用


// 2. 使用CSRF保护
<form method="POST">
    @csrf
    {{-- 表单字段 --}}
</form>


// 3. 验证路由方法
<form method="POST" action="{{ route('posts.update', $post) }}">
    @csrf
    @method('PUT')
    {{-- 表单字段 --}}
</form>


// 4. 转义JavaScript数据
<script>
    // 使用@json进行安全的JSON编码
    var userData = @json($user);

    // 不要这样做
    // var userData = {{ $user }}; // 危险！
</script>


// 5. 内容安全策略
@once
    @push('scripts')
        <meta http-equiv="Content-Security-Policy"
              content="script-src 'self' 'nonce-{{ csp_nonce() }}'">
    @endpush
@endonce

<script nonce="{{ csp_nonce() }}">
    // 内联脚本
</script>
```

## 常见陷阱

### 陷阱1：变量未定义错误

```php
{{-- 错误示例 - 可能导致未定义变量错误 --}}
<p>{{ $user->name }}</p>

{{-- 正确做法1 - 使用null安全操作符 --}}
<p>{{ $user?->name }}</p>

{{-- 正确做法2 - 使用默认值 --}}
<p>{{ $user->name ?? '匿名用户' }}</p>

{{-- 正确做法3 - 条件检查 --}}
@isset($user)
    <p>{{ $user->name }}</p>
@endisset

{{-- 正确做法4 - 在控制器中确保变量存在 --}}
// Controller
return view('profile', [
    'user' => $user ?? new User(['name' => '访客'])
]);
```

### 陷阱2：循环中的N+1查询

```php
{{-- 错误示例 - 每次循环都会查询数据库 --}}
@foreach ($posts as $post)
    <p>作者：{{ $post->author->name }}</p>  {{-- N+1查询问题 --}}
@endforeach

{{-- 正确做法 - 在控制器中预加载关联 --}}
// Controller
$posts = Post::with('author')->get();

{{-- 或者使用延迟加载（如果必须在视图中处理） --}}
@php
    $posts->load('author');
@endphp
```

### 陷阱3：组件属性混淆

```php
{{-- 陷阱：字符串与表达式的区别 --}}

{{-- 传递字符串 --}}
<x-alert type="success" />

{{-- 传递变量/表达式（使用:前缀） --}}
<x-alert :type="$alertType" />
<x-alert :count="$items->count()" />
<x-alert :show="true" />

{{-- 常见错误 --}}
<x-alert type="$alertType" />  {{-- 错误：传递的是字符串"$alertType" --}}
<x-alert :type="success" />   {{-- 错误：success被当作常量 --}}
```

### 陷阱4：缓存与实时数据

```php
{{-- 陷阱：视图缓存导致显示过期数据 --}}

{{-- 错误示例 --}}
@cache('user-stats', 3600)
    <p>在线用户：{{ User::online()->count() }}</p>  {{-- 可能显示过期数据 --}}
@endcache

{{-- 正确做法：区分静态和动态内容 --}}
<div class="stats">
    @cache('static-stats', 3600)
        <p>总用户数：{{ User::count() }}</p>  {{-- 不常变化的数据可以缓存 --}}
    @endcache

    {{-- 实时数据不缓存 --}}
    <p>当前在线：{{ User::online()->count() }}</p>
</div>
```

### 陷阱5：@verbatim与前端框架冲突

```php
{{-- 陷阱：Blade语法与Vue/Angular冲突 --}}

{{-- Vue模板中使用Blade --}}
<div id="app">
    {{-- 错误：Blade会尝试解析这个 --}}
    {{ message }}

    {{-- 正确做法1：使用@语法转义 --}}
    @{{ message }}

    {{-- 正确做法2：使用verbatim块 --}}
    @verbatim
        <p>{{ user.name }}</p>
        <p>{{ user.email }}</p>
    @endverbatim
</div>
```

### 陷阱6：@section与@yield的误用

```php
{{-- 陷阱：混淆@show和@endsection --}}

{{-- 父布局 --}}
@section('sidebar')
    <p>默认侧边栏</p>
@show  {{-- @show会立即输出内容，并允许子模板扩展 --}}

{{-- 子模板 --}}
@section('sidebar')
    @parent  {{-- 包含父内容 --}}
    <p>额外内容</p>
@endsection  {{-- @endsection只定义内容，不输出 --}}


{{-- 常见错误：在布局中使用@endsection --}}
{{-- 布局 --}}
@section('sidebar')
    <p>默认内容</p>
@endsection  {{-- 错误：这只是定义，不会输出 --}}

{{-- 应该使用@show或配合@yield使用 --}}
```

## 性能考量

### 视图编译与缓存

```bash
# 预编译所有Blade视图（部署时使用）
php artisan view:cache

# 清除视图缓存
php artisan view:clear

# 优化配置（包含视图缓存）
php artisan optimize
```

```php
// config/view.php
return [
    // 编译后的视图存储路径
    'compiled' => env(
        'VIEW_COMPILED_PATH',
        realpath(storage_path('framework/views'))
    ),
];

// 生产环境中确保启用OPcache
// php.ini
// opcache.enable=1
// opcache.validate_timestamps=0  // 生产环境禁用时间戳验证
```

### 性能基准测试

```php
// 测试视图渲染性能
Route::get('/benchmark', function () {
    $iterations = 1000;
    $data = ['items' => range(1, 100)];

    // 测试组件渲染
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        view('benchmark.components', $data)->render();
    }
    $componentTime = microtime(true) - $start;

    // 测试include渲染
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        view('benchmark.includes', $data)->render();
    }
    $includeTime = microtime(true) - $start;

    return [
        'component_time' => $componentTime,
        'include_time' => $includeTime,
        'iterations' => $iterations,
    ];
});
```

### 减少视图复杂度

```php
{{-- 优化前：复杂的嵌套条件 --}}
@if ($user)
    @if ($user->isAdmin())
        @if ($user->hasPermission('manage-users'))
            <button>管理用户</button>
        @endif
    @endif
@endif

{{-- 优化后：使用视图Composer或方法封装 --}}
// 在ViewComposer中
View::composer('*', function ($view) {
    $view->with('canManageUsers',
        auth()->check() &&
        auth()->user()->isAdmin() &&
        auth()->user()->hasPermission('manage-users')
    );
});

{{-- 视图中 --}}
@if ($canManageUsers)
    <button>管理用户</button>
@endif
```

### 内存优化

```php
{{-- 处理大数据集时使用chunk --}}
// Controller
public function export()
{
    return response()->stream(function () {
        User::chunk(1000, function ($users) {
            foreach ($users as $user) {
                echo $user->name . "\n";
            }
        });
    }, 200, ['Content-Type' => 'text/plain']);
}

{{-- 或使用游标减少内存使用 --}}
@foreach (User::cursor() as $user)
    <p>{{ $user->name }}</p>
@endforeach
```

## 实战场景

### 场景1：多语言支持

```php
{{-- resources/views/layouts/app.blade.php --}}
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <title>@yield('title') - {{ __('app.name') }}</title>
</head>
<body>
    {{-- 语言切换器 --}}
    <nav>
        @foreach (config('app.available_locales') as $locale => $name)
            <a href="{{ route('locale.switch', $locale) }}"
               class="{{ app()->getLocale() === $locale ? 'active' : '' }}">
                {{ $name }}
            </a>
        @endforeach
    </nav>

    {{-- 使用翻译 --}}
    <h1>{{ __('messages.welcome') }}</h1>
    <p>{{ trans_choice('messages.items', $count) }}</p>

    {{-- 带参数的翻译 --}}
    <p>{{ __('messages.greeting', ['name' => $user->name]) }}</p>
</body>
</html>
```

```php
// resources/lang/zh-CN/messages.php
return [
    'welcome' => '欢迎访问',
    'greeting' => '你好，:name！',
    'items' => '{0} 没有项目|{1} 一个项目|[2,*] :count 个项目',
];
```

### 场景2：权限控制UI

```php
{{-- resources/views/components/permission-button.blade.php --}}
@props([
    'permission',
    'action' => null,
])

@can($permission)
    <button {{ $attributes->merge(['type' => 'button']) }}
            @if($action) wire:click="{{ $action }}" @endif>
        {{ $slot }}
    </button>
@else
    <button {{ $attributes->merge([
        'type' => 'button',
        'class' => 'opacity-50 cursor-not-allowed',
        'disabled' => true,
        'title' => '您没有权限执行此操作',
    ]) }}>
        {{ $slot }}
    </button>
@endcan
```

```php
{{-- 使用 --}}
<x-permission-button permission="posts.create" action="createPost">
    创建文章
</x-permission-button>

<x-permission-button permission="posts.delete" action="deletePost" class="btn-danger">
    删除
</x-permission-button>
```

### 场景3：动态表格组件

```php
{{-- resources/views/components/data-table.blade.php --}}
@props([
    'columns' => [],
    'data' => [],
    'sortable' => true,
    'searchable' => true,
])

<div class="data-table-wrapper" {{ $attributes }}>
    @if ($searchable)
        <div class="table-search">
            <input type="text"
                   placeholder="搜索..."
                   wire:model.debounce.300ms="search">
        </div>
    @endif

    <table class="data-table">
        <thead>
            <tr>
                @foreach ($columns as $column)
                    <th @if($sortable && ($column['sortable'] ?? true))
                            wire:click="sortBy('{{ $column['key'] }}')"
                            class="cursor-pointer"
                        @endif>
                        {{ $column['label'] }}
                        @if ($sortable && ($column['sortable'] ?? true))
                            <span class="sort-indicator">
                                @if ($sortField === $column['key'])
                                    {{ $sortDirection === 'asc' ? '↑' : '↓' }}
                                @endif
                            </span>
                        @endif
                    </th>
                @endforeach
                @if (isset($actions))
                    <th>操作</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @forelse ($data as $row)
                <tr>
                    @foreach ($columns as $column)
                        <td>
                            @if (isset($column['component']))
                                <x-dynamic-component
                                    :component="$column['component']"
                                    :value="data_get($row, $column['key'])"
                                    :row="$row" />
                            @elseif (isset($column['format']))
                                {{ $column['format']($row) }}
                            @else
                                {{ data_get($row, $column['key']) }}
                            @endif
                        </td>
                    @endforeach
                    @if (isset($actions))
                        <td>{{ $actions($row) }}</td>
                    @endif
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($columns) + (isset($actions) ? 1 : 0) }}">
                        {{ $empty ?? '暂无数据' }}
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if ($data instanceof \Illuminate\Pagination\LengthAwarePaginator)
        <div class="table-pagination">
            {{ $data->links() }}
        </div>
    @endif
</div>
```

```php
{{-- 使用数据表格组件 --}}
<x-data-table
    :columns="[
        ['key' => 'id', 'label' => 'ID', 'sortable' => true],
        ['key' => 'name', 'label' => '姓名'],
        ['key' => 'email', 'label' => '邮箱'],
        ['key' => 'created_at', 'label' => '注册时间', 'format' => fn($row) => $row->created_at->format('Y-m-d')],
        ['key' => 'status', 'label' => '状态', 'component' => 'status-badge'],
    ]"
    :data="$users">

    <x-slot:actions>
        @scope($row)
            <a href="{{ route('users.edit', $row) }}">编辑</a>
            <button wire:click="delete({{ $row->id }})">删除</button>
        @endscope
    </x-slot:actions>

    <x-slot:empty>
        <p>还没有用户，<a href="{{ route('users.create') }}">创建第一个用户</a></p>
    </x-slot:empty>
</x-data-table>
```

### 场景4：表单构建器

```php
{{-- resources/views/components/form-builder.blade.php --}}
@props([
    'fields' => [],
    'action' => '',
    'method' => 'POST',
    'model' => null,
])

<form method="POST"
      action="{{ $action }}"
      {{ $attributes->merge(['class' => 'form']) }}
      enctype="multipart/form-data">
    @csrf
    @if (!in_array(strtoupper($method), ['GET', 'POST']))
        @method($method)
    @endif

    @foreach ($fields as $field)
        @php
            $value = old($field['name'], $model?->{$field['name']} ?? $field['default'] ?? '');
            $error = $errors->first($field['name']);
        @endphp

        <div class="form-group {{ $error ? 'has-error' : '' }}">
            @if (isset($field['label']))
                <label for="{{ $field['name'] }}"
                       class="{{ ($field['required'] ?? false) ? 'required' : '' }}">
                    {{ $field['label'] }}
                </label>
            @endif

            @switch($field['type'] ?? 'text')
                @case('textarea')
                    <textarea name="{{ $field['name'] }}"
                              id="{{ $field['name'] }}"
                              class="form-control"
                              rows="{{ $field['rows'] ?? 3 }}"
                              {{ ($field['required'] ?? false) ? 'required' : '' }}>{{ $value }}</textarea>
                    @break

                @case('select')
                    <select name="{{ $field['name'] }}"
                            id="{{ $field['name'] }}"
                            class="form-control"
                            {{ ($field['required'] ?? false) ? 'required' : '' }}>
                        <option value="">{{ $field['placeholder'] ?? '请选择' }}</option>
                        @foreach ($field['options'] as $optValue => $optLabel)
                            <option value="{{ $optValue }}" @selected($value == $optValue)>
                                {{ $optLabel }}
                            </option>
                        @endforeach
                    </select>
                    @break

                @case('checkbox')
                    <input type="checkbox"
                           name="{{ $field['name'] }}"
                           id="{{ $field['name'] }}"
                           value="1"
                           @checked($value)>
                    @break

                @case('file')
                    <input type="file"
                           name="{{ $field['name'] }}"
                           id="{{ $field['name'] }}"
                           class="form-control-file"
                           {{ ($field['multiple'] ?? false) ? 'multiple' : '' }}
                           accept="{{ $field['accept'] ?? '' }}">
                    @break

                @default
                    <input type="{{ $field['type'] ?? 'text' }}"
                           name="{{ $field['name'] }}"
                           id="{{ $field['name'] }}"
                           value="{{ $value }}"
                           class="form-control"
                           placeholder="{{ $field['placeholder'] ?? '' }}"
                           {{ ($field['required'] ?? false) ? 'required' : '' }}>
            @endswitch

            @if ($error)
                <span class="error-message">{{ $error }}</span>
            @endif

            @if (isset($field['help']))
                <small class="help-text">{{ $field['help'] }}</small>
            @endif
        </div>
    @endforeach

    <div class="form-actions">
        {{ $slot }}
    </div>
</form>
```

```php
{{-- 使用表单构建器 --}}
<x-form-builder
    :action="route('posts.store')"
    :fields="[
        [
            'name' => 'title',
            'label' => '标题',
            'type' => 'text',
            'required' => true,
            'placeholder' => '请输入文章标题',
        ],
        [
            'name' => 'category_id',
            'label' => '分类',
            'type' => 'select',
            'options' => $categories->pluck('name', 'id'),
            'required' => true,
        ],
        [
            'name' => 'content',
            'label' => '内容',
            'type' => 'textarea',
            'rows' => 10,
            'required' => true,
        ],
        [
            'name' => 'thumbnail',
            'label' => '缩略图',
            'type' => 'file',
            'accept' => 'image/*',
            'help' => '支持JPG、PNG格式，最大2MB',
        ],
        [
            'name' => 'is_published',
            'label' => '立即发布',
            'type' => 'checkbox',
            'default' => true,
        ],
    ]">
    <button type="submit" class="btn btn-primary">发布文章</button>
    <a href="{{ route('posts.index') }}" class="btn btn-secondary">取消</a>
</x-form-builder>
```

## 面试要点

### 基础概念题

**Q1: Blade模板引擎的工作原理是什么？**

Blade模板被编译成原生PHP代码并缓存在`storage/framework/views`目录中。编译过程包括：
1. 解析Blade语法（如`{{ }}`、`@if`等）
2. 将其转换为对应的PHP代码
3. 将编译结果缓存起来
4. 下次请求时直接使用缓存的PHP文件

**Q2: `{{ }}`和`{!! !!}`有什么区别？**

- `{{ $var }}`：自动调用`htmlspecialchars()`函数对输出进行HTML实体转义，防止XSS攻击
- `{!! $var !!}`：原样输出内容，不进行转义，适用于已确认安全的HTML内容

**Q3: @section和@yield的区别？**

- `@section`：定义内容区块，可以被子模板覆盖或扩展
- `@yield`：输出指定区块的内容，用于布局模板中标记可替换区域
- `@section...@show`：定义并立即输出，同时允许子模板扩展

### 实践题

**Q4: 如何实现Blade组件的复用？**

```php
// 1. 类组件 - 适合复杂逻辑
php artisan make:component Alert

// 2. 匿名组件 - 适合简单展示
// 创建 resources/views/components/button.blade.php
@props(['type' => 'button', 'variant' => 'primary'])
<button type="{{ $type }}" class="btn btn-{{ $variant }}" {{ $attributes }}>
    {{ $slot }}
</button>

// 3. 组件命名空间 - 组织大量组件
// resources/views/components/forms/input.blade.php
// 使用: <x-forms.input />
```

**Q5: 如何优化Blade视图性能？**

1. 生产环境运行`php artisan view:cache`预编译视图
2. 避免在视图中进行复杂计算，移到Controller或ViewComposer
3. 使用`@once`避免重复渲染
4. 预加载关联关系避免N+1查询
5. 合理使用片段缓存
6. 启用OPcache

**Q6: 如何自定义Blade指令？**

```php
// AppServiceProvider::boot()
Blade::directive('money', function ($expression) {
    return "<?php echo '¥' . number_format($expression, 2); ?>";
});

Blade::if('admin', function () {
    return auth()->check() && auth()->user()->isAdmin();
});

// 使用
@money($price)

@admin
    <a href="/admin">管理后台</a>
@endadmin
```

### 高级题

**Q7: 解释Blade组件的属性包和属性合并？**

```php
// $attributes 包含所有未在@props中声明的属性
@props(['type' => 'info'])

// 合并class属性
<div {{ $attributes->merge(['class' => 'alert alert-' . $type]) }}>

// 条件添加class
<div {{ $attributes->class(['active' => $isActive, 'disabled' => $isDisabled]) }}>

// 过滤和获取特定属性
{{ $attributes->get('id') }}
{{ $attributes->only(['id', 'class']) }}
{{ $attributes->except(['class']) }}
```

**Q8: 如何实现视图作用域插槽？**

```php
{{-- 组件定义 --}}
<ul>
    @foreach ($items as $item)
        {{ $slot($item) }}
    @endforeach
</ul>

{{-- 使用 --}}
<x-list :items="$users">
    @scope($user)
        <li>{{ $user->name }} - {{ $user->email }}</li>
    @endscope
</x-list>
```

## 延伸阅读

### 官方资源

- [Laravel Blade 官方文档](https://laravel.com/docs/blade)
- [Laravel 组件文档](https://laravel.com/docs/blade#components)
- [Laravel 官方博客](https://blog.laravel.com/)

### 推荐工具

- **Laravel Blade Snippets** - VS Code扩展，提供Blade语法高亮和代码片段
- **Blade Formatter** - Blade模板格式化工具
- **Laravel Idea** - PhpStorm插件，增强Laravel开发体验

### 进阶主题

- **Livewire** - Laravel全栈框架，使用Blade构建动态界面
- **Inertia.js** - 让你使用Vue/React构建单页应用，同时保持Laravel路由
- **Alpine.js** - 轻量级JavaScript框架，与Blade完美配合

### 相关文章

- [Blade组件最佳实践](https://laravel-news.com/blade-components)
- [构建可复用的Blade组件库](https://spatie.be/docs/laravel-blade-components)
- [Blade模板性能优化指南](https://laravel-news.com/blade-performance)

---

> Blade模板引擎是Laravel框架的核心组成部分，掌握其语法和最佳实践对于构建高质量的Laravel应用至关重要。通过合理使用组件系统、布局继承和自定义指令，可以显著提升开发效率和代码可维护性。
