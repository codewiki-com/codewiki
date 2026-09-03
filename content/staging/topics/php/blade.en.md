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
origin: old/src/content/docs/php/blade.en.md
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

## Concept Explanation

Blade is a powerful template engine built into the Laravel framework, providing a clean and elegant syntax for handling PHP views. Unlike native PHP templates, Blade doesn't restrict you from using pure PHP code in your views, while also offering advanced features like template inheritance and a component system.

### What is Blade

The core features of the Blade template engine include:

- **Zero-overhead Compilation**: Blade views are compiled into pure PHP code and cached, so there's no runtime overhead
- **Template Inheritance**: Supports layout definitions and section inheritance for code reuse
- **Component System**: Provides class components and anonymous components with attribute passing and slots
- **Clean Syntax**: Uses `{{ }}` and `@` directives for highly readable code
- **Auto-escaping**: HTML-escapes output content by default to prevent XSS attacks

### Why Use Blade

```php
// Native PHP template
<h1><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h1>
<?php if ($user): ?>
    <p>Welcome, <?php echo htmlspecialchars($user->name, ENT_QUOTES, 'UTF-8'); ?></p>
<?php endif; ?>

// Blade template - cleaner and safer
<h1>{{ $title }}</h1>
@if ($user)
    <p>Welcome, {{ $user->name }}</p>
@endif
```

### Blade's Evolution

| Version | Features |
|---------|----------|
| Laravel 5.1 | Introduced basic component support |
| Laravel 5.4 | Enhanced component alias functionality |
| Laravel 7.x | Introduced class components and anonymous components |
| Laravel 8.x | Dynamic components, anonymous index components |
| Laravel 9.x | Enhanced slot functionality |
| Laravel 10.x | Improved component attribute handling |
| Laravel 11.x | Component performance optimization |

## Core Principles

### Compilation Mechanism

The workflow of Blade templates is as follows:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  .blade.php     │────>│  Blade Compiler │────>│  Cached PHP File│
│  Template File  │     │  Parse Directives│    │  storage/views  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         v
                                                ┌─────────────────┐
                                                │  PHP Execution  │
                                                │  Render HTML    │
                                                └─────────────────┘
```

### Compilation Process in Detail

```php
// Original Blade template
@extends('layouts.app')

@section('content')
    <h1>{{ $title }}</h1>
    @foreach ($items as $item)
        <p>{{ $item->name }}</p>
    @endforeach
@endsection

// Compiled PHP code (stored in storage/framework/views/)
<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?>

<?php $__env->startSection('content'); ?>
    <h1><?php echo e($title); ?></h1>
    <?php $__currentLoopData = $items; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $item): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
        <p><?php echo e($item->name); ?></p>
    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
<?php $__env->stopSection(); ?>
```

### Caching Strategy

Blade uses file modification time to determine if recompilation is needed:

```php
// Illuminate\View\Compilers\BladeCompiler

public function isExpired($path)
{
    $compiled = $this->getCompiledPath($path);

    // If compiled file doesn't exist, compilation is needed
    if (!$this->files->exists($compiled)) {
        return true;
    }

    // Compare modification times of source and compiled files
    return $this->files->lastModified($path) >=
           $this->files->lastModified($compiled);
}
```

### Custom Directive Principles

```php
// Register custom directives in AppServiceProvider
use Illuminate\Support\Facades\Blade;

public function boot()
{
    // Simple directive
    Blade::directive('datetime', function ($expression) {
        return "<?php echo ($expression)->format('Y-m-d H:i:s'); ?>";
    });

    // Custom conditional directive
    Blade::if('env', function ($environment) {
        return app()->environment($environment);
    });
}

// Using custom directives
@datetime($user->created_at)

@env('local')
    <p>Local development environment</p>
@endenv
```

## Key Points

### Basic Syntax Points

1. **Output Syntax**
   - `{{ $var }}`: Escaped output, prevents XSS
   - `{!! $var !!}`: Raw output, no escaping
   - `@{{ $var }}`: Display raw Blade syntax (for frontend frameworks)

2. **Control Structure Directives**
   - Conditionals: `@if`, `@elseif`, `@else`, `@endif`
   - Loops: `@for`, `@foreach`, `@forelse`, `@while`
   - Switch: `@switch`, `@case`, `@default`

3. **Layout Directives**
   - `@extends`: Inherit layout
   - `@section`/`@endsection`: Define sections
   - `@yield`: Output section content
   - `@parent`: Append parent template content

4. **Component Directives**
   - `@component`: Render component
   - `@slot`: Define slot
   - `<x-component>`: Component tag syntax

### Directive Quick Reference

| Directive | Description | Example |
|-----------|-------------|---------|
| `@if` | Conditional | `@if($user) ... @endif` |
| `@unless` | Inverse conditional | `@unless($guest) ... @endunless` |
| `@isset` | Variable existence check | `@isset($var) ... @endisset` |
| `@empty` | Empty value check | `@empty($arr) ... @endempty` |
| `@auth` | Authenticated user | `@auth ... @endauth` |
| `@guest` | Guest user | `@guest ... @endguest` |
| `@env` | Environment check | `@env('local') ... @endenv` |
| `@production` | Production environment | `@production ... @endproduction` |
| `@once` | Render only once | `@once ... @endonce` |
| `@push` | Push to stack | `@push('scripts') ... @endpush` |
| `@stack` | Render stack | `@stack('scripts')` |

## Code Examples

### Data Output and Escaping

```php
{{-- resources/views/examples/output.blade.php --}}

{{-- Basic output (auto HTML escaping) --}}
<p>Username: {{ $user->name }}</p>
<p>Email: {{ $user->email }}</p>

{{-- Raw HTML output (no escaping, use with caution) --}}
<div class="content">
    {!! $article->content !!}
</div>

{{-- Default value handling --}}
<p>Nickname: {{ $user->nickname ?? 'Not set' }}</p>
<p>Bio: {{ $user->bio ?: 'This person is lazy and wrote nothing' }}</p>

{{-- Output in JavaScript --}}
<script>
    // JSON encoded output
    var user = @json($user);
    var config = @json($config, JSON_PRETTY_PRINT);

    // Js directive (Laravel 9+)
    var settings = @js($settings);
</script>

{{-- Preserve Blade syntax (for Vue/Angular and other frontend frameworks) --}}
<div id="app">
    @{{ message }}
    @verbatim
        <p>{{ user.name }}</p>
        <p>{{ user.email }}</p>
    @endverbatim
</div>
```

### Conditional Statements

```php
{{-- resources/views/examples/conditions.blade.php --}}

{{-- Basic conditional --}}
@if ($user->isAdmin())
    <span class="badge badge-admin">Administrator</span>
@elseif ($user->isModerator())
    <span class="badge badge-mod">Moderator</span>
@else
    <span class="badge badge-user">Regular User</span>
@endif

{{-- unless - inverse conditional --}}
@unless ($user->hasVerifiedEmail())
    <div class="alert alert-warning">
        Please verify your email address
    </div>
@endunless

{{-- isset - check if variable exists and is not null --}}
@isset($notification)
    <div class="notification">{{ $notification }}</div>
@endisset

{{-- empty - check if empty --}}
@empty($posts)
    <p>No posts yet</p>
@endempty

{{-- Authentication related conditionals --}}
@auth
    <p>Welcome back, {{ auth()->user()->name }}!</p>
    <a href="{{ route('logout') }}">Logout</a>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
    <a href="{{ route('register') }}">Register</a>
@endguest

{{-- Specify authentication guard --}}
@auth('admin')
    <p>Admin dashboard logged in</p>
@endauth

{{-- Environment conditionals --}}
@production
    <script src="{{ asset('js/analytics.js') }}"></script>
@endproduction

@env('local')
    <div class="debug-bar">Debug Info</div>
@endenv

@env(['staging', 'production'])
    <script src="https://cdn.example.com/app.js"></script>
@endenv

{{-- Switch statement --}}
@switch($status)
    @case('pending')
        <span class="text-warning">Pending</span>
        @break
    @case('approved')
        <span class="text-success">Approved</span>
        @break
    @case('rejected')
        <span class="text-danger">Rejected</span>
        @break
    @default
        <span class="text-muted">Unknown Status</span>
@endswitch

{{-- Check Session --}}
@session('status')
    <div class="alert alert-success">
        {{ $value }}
    </div>
@endsession
```

### Loop Structures

```php
{{-- resources/views/examples/loops.blade.php --}}

{{-- Basic foreach loop --}}
<ul>
    @foreach ($users as $user)
        <li>{{ $user->name }}</li>
    @endforeach
</ul>

{{-- forelse - handle empty collections --}}
<div class="posts">
    @forelse ($posts as $post)
        <article>
            <h2>{{ $post->title }}</h2>
            <p>{{ $post->excerpt }}</p>
        </article>
    @empty
        <p class="no-posts">No posts yet, be the first to publish one!</p>
    @endforelse
</div>

{{-- $loop variable - loop information --}}
<table>
    @foreach ($items as $item)
        <tr class="{{ $loop->even ? 'bg-gray-100' : '' }}">
            <td>{{ $loop->iteration }}</td>  {{-- Current iteration (starts at 1) --}}
            <td>{{ $item->name }}</td>
            <td>
                @if ($loop->first)
                    <span class="badge">First</span>
                @endif
                @if ($loop->last)
                    <span class="badge">Last</span>
                @endif
            </td>
        </tr>
    @endforeach
</table>

{{-- All properties of $loop variable --}}
@foreach ($items as $item)
    {{-- $loop->index      // Current index (starts at 0) --}}
    {{-- $loop->iteration  // Current iteration (starts at 1) --}}
    {{-- $loop->remaining  // Remaining iterations --}}
    {{-- $loop->count      // Total count --}}
    {{-- $loop->first      // Is first iteration --}}
    {{-- $loop->last       // Is last iteration --}}
    {{-- $loop->even       // Is even iteration --}}
    {{-- $loop->odd        // Is odd iteration --}}
    {{-- $loop->depth      // Nesting level --}}
    {{-- $loop->parent     // Parent loop's $loop variable --}}
@endforeach

{{-- Nested loops --}}
<div class="categories">
    @foreach ($categories as $category)
        <div class="category">
            <h3>{{ $category->name }} (Depth: {{ $loop->depth }})</h3>
            <ul>
                @foreach ($category->products as $product)
                    <li>
                        {{ $product->name }}
                        (Parent index: {{ $loop->parent->index }})
                    </li>
                @endforeach
            </ul>
        </div>
    @endforeach
</div>

{{-- for loop --}}
<select name="quantity">
    @for ($i = 1; $i <= 10; $i++)
        <option value="{{ $i }}">{{ $i }}</option>
    @endfor
</select>

{{-- while loop --}}
@php
    $count = 0;
@endphp

@while ($count < 5)
    <p>Count: {{ $count }}</p>
    @php $count++; @endphp
@endwhile

{{-- Skip and break --}}
@foreach ($users as $user)
    @if ($user->isBanned())
        @continue
    @endif

    <p>{{ $user->name }}</p>

    @if ($user->isAdmin())
        @break
    @endif
@endforeach

{{-- Conditional continue and break --}}
@foreach ($users as $user)
    @continue($user->status === 'inactive')

    <p>{{ $user->name }}</p>

    @break($loop->iteration > 10)
@endforeach
```

### Template Inheritance and Layouts

```php
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', config('app.name'))</title>

    {{-- Base styles --}}
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    {{-- Page specific styles --}}
    @stack('styles')
</head>
<body class="@yield('body-class')">
    {{-- Navigation bar --}}
    @include('partials.navigation')

    {{-- Page header (optional) --}}
    @hasSection('header')
        <header class="page-header">
            @yield('header')
        </header>
    @endif

    {{-- Main content --}}
    <main class="container">
        {{-- Flash messages --}}
        @include('partials.flash-messages')

        {{-- Breadcrumb navigation (optional) --}}
        @hasSection('breadcrumbs')
            <nav aria-label="breadcrumb">
                @yield('breadcrumbs')
            </nav>
        @endif

        {{-- Page content --}}
        @yield('content')
    </main>

    {{-- Footer --}}
    @include('partials.footer')

    {{-- Base scripts --}}
    <script src="{{ asset('js/app.js') }}"></script>

    {{-- Page specific scripts --}}
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
        Published on {{ $post->created_at->format('F j, Y') }}
        | Author: {{ $post->author->name }}
    </p>
@endsection

@section('breadcrumbs')
    <ol class="breadcrumb">
        <li><a href="{{ route('home') }}">Home</a></li>
        <li><a href="{{ route('posts.index') }}">Posts</a></li>
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

        {{-- Comments section --}}
        @include('posts.comments', ['comments' => $post->comments])
    </article>

    {{-- Related posts --}}
    @include('posts.related', ['posts' => $relatedPosts])
@endsection

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/post.css') }}">
    <link rel="stylesheet" href="{{ asset('css/prism.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/prism.js') }}"></script>
    <script>
        // Initialize code highlighting
        Prism.highlightAll();
    </script>
@endpush
```

```php
{{-- resources/views/layouts/sidebar.blade.php - Layout with sidebar --}}
@extends('layouts.app')

@section('content')
    <div class="row">
        <div class="col-md-8">
            @yield('main-content')
        </div>
        <div class="col-md-4">
            @section('sidebar')
                {{-- Default sidebar content --}}
                @include('partials.sidebar-default')
            @show
        </div>
    </div>
@endsection
```

```php
{{-- Child template can append to parent template's section --}}
@extends('layouts.sidebar')

@section('main-content')
    <h1>Post List</h1>
    {{-- Main content --}}
@endsection

@section('sidebar')
    @parent  {{-- Keep parent template content --}}

    {{-- Append custom content --}}
    <div class="widget">
        <h3>Popular Tags</h3>
        @include('partials.tag-cloud')
    </div>
@endsection
```

### Including Sub-views

```php
{{-- Basic include --}}
@include('partials.header')

{{-- Include with data --}}
@include('partials.user-card', ['user' => $currentUser])

{{-- Conditional include --}}
@includeWhen($user->isAdmin(), 'admin.dashboard-widget')
@includeUnless($user->isBanned(), 'partials.comment-form')

{{-- Include if exists --}}
@includeIf('custom.optional-partial')

{{-- Include first existing view --}}
@includeFirst(['custom.header', 'partials.header'])

{{-- Loop include --}}
@each('partials.comment', $comments, 'comment')

{{-- Loop include (with empty state) --}}
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

### Component System

#### Class Components

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
     * Get the alert box CSS class
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
     * Get the icon
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
     * Determine if the component should render
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
{{-- Using class components --}}

{{-- Basic usage --}}
<x-alert type="success" message="Operation successful!" />

{{-- Using slots --}}
<x-alert type="warning" dismissible>
    <strong>Warning!</strong> Your account is about to expire.
</x-alert>

{{-- Passing extra attributes --}}
<x-alert type="error"
         message="An error occurred"
         class="mb-4"
         id="error-alert"
         data-timeout="5000" />
```

#### Anonymous Components

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
{{-- Using anonymous components --}}
<x-card title="User Information" class="shadow-lg">
    <p>Name: {{ $user->name }}</p>
    <p>Email: {{ $user->email }}</p>

    <x-slot:footer>
        <a href="{{ route('users.edit', $user) }}">Edit</a>
    </x-slot:footer>
</x-card>
```

#### Component Attribute Handling

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
{{-- Using input component --}}
<form method="POST" action="{{ route('users.store') }}">
    @csrf

    <x-input
        name="email"
        type="email"
        label="Email Address"
        :value="$user->email ?? ''"
        required
        placeholder="Enter your email"
        class="custom-input" />

    <x-input
        name="password"
        type="password"
        label="Password"
        required />

    <button type="submit">Submit</button>
</form>
```

#### Slot System

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
        {{-- Title slot --}}
        @if (isset($title))
            <div class="modal-header">
                {{ $title }}
                <button @click="show = false">&times;</button>
            </div>
        @endif

        {{-- Default content slot --}}
        <div class="modal-body">
            {{ $slot }}
        </div>

        {{-- Footer slot --}}
        @if (isset($footer))
            <div class="modal-footer">
                {{ $footer }}
            </div>
        @endif
    </div>
</div>
```

```php
{{-- Using modal component --}}
<x-modal name="confirm-delete" max-width="sm">
    <x-slot:title>
        <h3>Confirm Deletion</h3>
    </x-slot:title>

    <p>Are you sure you want to delete this item? This action cannot be undone.</p>

    <x-slot:footer>
        <button @click="show = false" class="btn btn-secondary">
            Cancel
        </button>
        <button @click="deleteItem()" class="btn btn-danger">
            Confirm Delete
        </button>
    </x-slot:footer>
</x-modal>
```

#### Dynamic Components

```php
{{-- Dynamic component rendering --}}
@php
    $componentName = 'alert';  // Can be 'alert', 'card', 'modal', etc.
@endphp

<x-dynamic-component :component="$componentName" type="success" message="Dynamically loaded component" />

{{-- Render different components based on conditions --}}
@foreach ($widgets as $widget)
    <x-dynamic-component
        :component="$widget->type"
        :data="$widget->data" />
@endforeach
```

### Form Handling

```php
{{-- resources/views/users/create.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Create User</h1>

    <form method="POST" action="{{ route('users.store') }}" enctype="multipart/form-data">
        @csrf

        {{-- Text input --}}
        <div class="form-group">
            <label for="name">Name</label>
            <input type="text"
                   name="name"
                   id="name"
                   value="{{ old('name') }}"
                   class="form-control @error('name') is-invalid @enderror">
            @error('name')
                <div class="invalid-feedback">{{ $message }}</div>
            @enderror
        </div>

        {{-- Dropdown select --}}
        <div class="form-group">
            <label for="role">Role</label>
            <select name="role" id="role" class="form-control">
                <option value="">Please select</option>
                @foreach ($roles as $role)
                    <option value="{{ $role->id }}"
                            @selected(old('role') == $role->id)>
                        {{ $role->name }}
                    </option>
                @endforeach
            </select>
        </div>

        {{-- Checkbox --}}
        <div class="form-check">
            <input type="checkbox"
                   name="active"
                   id="active"
                   value="1"
                   @checked(old('active', true))
                   class="form-check-input">
            <label for="active" class="form-check-label">Activate Account</label>
        </div>

        {{-- Radio buttons --}}
        <div class="form-group">
            <label>Gender</label>
            @foreach (['male' => 'Male', 'female' => 'Female', 'other' => 'Other'] as $value => $label)
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

        {{-- File upload --}}
        <div class="form-group">
            <label for="avatar">Avatar</label>
            <input type="file" name="avatar" id="avatar" class="form-control-file">
        </div>

        {{-- Hidden field --}}
        <input type="hidden" name="source" value="web">

        <button type="submit" class="btn btn-primary">Create</button>
    </form>
@endsection
```

```php
{{-- Edit form (using @method) --}}
<form method="POST" action="{{ route('users.update', $user) }}">
    @csrf
    @method('PUT')

    {{-- Form fields --}}
</form>

{{-- Delete form --}}
<form method="POST" action="{{ route('users.destroy', $user) }}"
      onsubmit="return confirm('Are you sure you want to delete?')">
    @csrf
    @method('DELETE')

    <button type="submit" class="btn btn-danger">Delete</button>
</form>
```

### Stacks and Resource Injection

```php
{{-- Layout file --}}
<head>
    {{-- Base styles --}}
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">

    {{-- Style stack --}}
    @stack('styles')
</head>
<body>
    @yield('content')

    {{-- Base scripts --}}
    <script src="{{ asset('js/app.js') }}"></script>

    {{-- Script stack --}}
    @stack('scripts')
</body>
```

```php
{{-- Child view pushes content to stack --}}
@push('styles')
    <link rel="stylesheet" href="{{ asset('css/datepicker.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/datepicker.js') }}"></script>
    <script>
        // Initialize date picker
        $('.datepicker').datepicker();
    </script>
@endpush

{{-- Use @prepend to add at top of stack --}}
@prepend('scripts')
    <script src="{{ asset('js/jquery.js') }}"></script>
@endprepend

{{-- Conditional push --}}
@pushIf($needsChart, 'scripts')
    <script src="{{ asset('js/chart.js') }}"></script>
@endPushIf

{{-- Push only once (avoid duplicates) --}}
@once
    @push('scripts')
        <script src="{{ asset('js/shared-lib.js') }}"></script>
    @endpush
@endonce
```

### Custom Directives

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
        // Simple directive
        Blade::directive('datetime', function ($expression) {
            return "<?php echo ($expression)->format('F j, Y H:i'); ?>";
        });

        // Currency formatting
        Blade::directive('money', function ($expression) {
            return "<?php echo '$' . number_format($expression, 2); ?>";
        });

        // Truncate text
        Blade::directive('truncate', function ($expression) {
            list($string, $length) = explode(',', $expression);
            return "<?php echo Str::limit($string, $length); ?>";
        });

        // Conditional directive
        Blade::if('role', function ($role) {
            return auth()->check() && auth()->user()->hasRole($role);
        });

        // Multiple role check
        Blade::if('anyrole', function (...$roles) {
            return auth()->check() && auth()->user()->hasAnyRole($roles);
        });

        // Permission check
        Blade::if('permission', function ($permission) {
            return auth()->check() && auth()->user()->can($permission);
        });

        // Feature flags
        Blade::if('feature', function ($feature) {
            return config("features.{$feature}", false);
        });
    }
}
```

```php
{{-- Using custom directives --}}

{{-- Date formatting --}}
<p>Registration date: @datetime($user->created_at)</p>

{{-- Currency display --}}
<p>Total: @money($order->total)</p>

{{-- Text truncation --}}
<p>@truncate($article->content, 100)</p>

{{-- Role conditional --}}
@role('admin')
    <a href="{{ route('admin.dashboard') }}">Admin Dashboard</a>
@endrole

@anyrole('admin', 'editor')
    <a href="{{ route('content.manage') }}">Content Management</a>
@endanyrole

{{-- Permission conditional --}}
@permission('users.create')
    <button>Create User</button>
@endpermission

{{-- Feature flags --}}
@feature('new-dashboard')
    <div class="new-dashboard">New Dashboard</div>
@else
    <div class="old-dashboard">Old Dashboard</div>
@endfeature
```

## Best Practices

### Directory Structure Organization

```
resources/views/
├── components/              # Components
│   ├── forms/              # Form components
│   │   ├── input.blade.php
│   │   ├── select.blade.php
│   │   └── textarea.blade.php
│   ├── ui/                 # UI components
│   │   ├── alert.blade.php
│   │   ├── modal.blade.php
│   │   └── card.blade.php
│   └── layouts/            # Layout components
│       ├── header.blade.php
│       └── footer.blade.php
├── layouts/                # Layout templates
│   ├── app.blade.php       # Main layout
│   ├── admin.blade.php     # Admin dashboard layout
│   └── auth.blade.php      # Authentication pages layout
├── partials/               # Reusable partials
│   ├── navigation.blade.php
│   ├── sidebar.blade.php
│   └── flash-messages.blade.php
├── emails/                 # Email templates
├── errors/                 # Error pages
│   ├── 404.blade.php
│   ├── 500.blade.php
│   └── 503.blade.php
└── [feature]/              # Feature module views
    ├── users/
    │   ├── index.blade.php
    │   ├── show.blade.php
    │   ├── create.blade.php
    │   └── edit.blade.php
    └── posts/
        ├── index.blade.php
        └── show.blade.php
```

### Component Design Principles

```php
// 1. Single Responsibility - Each component should do one thing
// Good example
<x-button>Submit</x-button>
<x-input name="email" />

// Bad example - Component does too much
<x-user-form-with-validation-and-submission />


// 2. Sensible defaults
@props([
    'type' => 'button',           // Default type
    'variant' => 'primary',       // Default style
    'size' => 'md',               // Default size
    'disabled' => false,          // Default enabled
])


// 3. Attribute forwarding - Allow passing extra attributes
<button {{ $attributes->merge([
    'type' => $type,
    'class' => "btn btn-{$variant} btn-{$size}",
    'disabled' => $disabled,
]) }}>
    {{ $slot }}
</button>


// 4. Style isolation - Use class components to encapsulate complex logic
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

### Performance Optimization Tips

```php
// 1. Use @once to avoid duplicate rendering
@foreach ($items as $item)
    @once
        <style>
            .item-card { /* style definitions */ }
        </style>
    @endonce

    <div class="item-card">{{ $item->name }}</div>
@endforeach


// 2. Conditionally load components
@if ($user->hasNotifications())
    <x-notification-dropdown :notifications="$user->notifications" />
@endif


// 3. Lazy load heavy content
{{-- Use Livewire or Alpine.js for lazy loading --}}
<div x-data="{ loaded: false }" x-intersect="loaded = true">
    <template x-if="loaded">
        @include('partials.heavy-content')
    </template>
</div>


// 4. Cache frequently used view fragments
@cache('sidebar-' . $user->id, 3600)
    @include('partials.sidebar')
@endcache


// 5. Reduce database queries - Eager load in controller
// Controller
$posts = Post::with(['author', 'tags', 'comments.user'])->get();
return view('posts.index', compact('posts'));
```

### Security Practices

```php
// 1. Always escape user input
{{ $userInput }}  // Correct - auto escaped

// Only use raw output when confirmed safe
{!! $trustedHtml !!}  // Use with caution


// 2. Use CSRF protection
<form method="POST">
    @csrf
    {{-- Form fields --}}
</form>


// 3. Validate route methods
<form method="POST" action="{{ route('posts.update', $post) }}">
    @csrf
    @method('PUT')
    {{-- Form fields --}}
</form>


// 4. Escape JavaScript data
<script>
    // Use @json for safe JSON encoding
    var userData = @json($user);

    // Don't do this
    // var userData = {{ $user }}; // Dangerous!
</script>


// 5. Content Security Policy
@once
    @push('scripts')
        <meta http-equiv="Content-Security-Policy"
              content="script-src 'self' 'nonce-{{ csp_nonce() }}'">
    @endpush
@endonce

<script nonce="{{ csp_nonce() }}">
    // Inline script
</script>
```

## Common Pitfalls

### Pitfall 1: Undefined Variable Errors

```php
{{-- Bad example - May cause undefined variable error --}}
<p>{{ $user->name }}</p>

{{-- Correct approach 1 - Use null safe operator --}}
<p>{{ $user?->name }}</p>

{{-- Correct approach 2 - Use default value --}}
<p>{{ $user->name ?? 'Anonymous User' }}</p>

{{-- Correct approach 3 - Conditional check --}}
@isset($user)
    <p>{{ $user->name }}</p>
@endisset

{{-- Correct approach 4 - Ensure variable exists in controller --}}
// Controller
return view('profile', [
    'user' => $user ?? new User(['name' => 'Guest'])
]);
```

### Pitfall 2: N+1 Queries in Loops

```php
{{-- Bad example - Database query on each loop iteration --}}
@foreach ($posts as $post)
    <p>Author: {{ $post->author->name }}</p>  {{-- N+1 query problem --}}
@endforeach

{{-- Correct approach - Eager load relationships in controller --}}
// Controller
$posts = Post::with('author')->get();

{{-- Or use lazy loading (if must handle in view) --}}
@php
    $posts->load('author');
@endphp
```

### Pitfall 3: Component Attribute Confusion

```php
{{-- Pitfall: Difference between strings and expressions --}}

{{-- Passing a string --}}
<x-alert type="success" />

{{-- Passing a variable/expression (use : prefix) --}}
<x-alert :type="$alertType" />
<x-alert :count="$items->count()" />
<x-alert :show="true" />

{{-- Common mistakes --}}
<x-alert type="$alertType" />  {{-- Wrong: Passes string "$alertType" --}}
<x-alert :type="success" />   {{-- Wrong: success treated as constant --}}
```

### Pitfall 4: Caching and Real-time Data

```php
{{-- Pitfall: View caching causes stale data display --}}

{{-- Bad example --}}
@cache('user-stats', 3600)
    <p>Online users: {{ User::online()->count() }}</p>  {{-- May show stale data --}}
@endcache

{{-- Correct approach: Separate static and dynamic content --}}
<div class="stats">
    @cache('static-stats', 3600)
        <p>Total users: {{ User::count() }}</p>  {{-- Rarely changing data can be cached --}}
    @endcache

    {{-- Real-time data not cached --}}
    <p>Currently online: {{ User::online()->count() }}</p>
</div>
```

### Pitfall 5: @verbatim and Frontend Framework Conflicts

```php
{{-- Pitfall: Blade syntax conflicts with Vue/Angular --}}

{{-- Vue template using Blade --}}
<div id="app">
    {{-- Wrong: Blade will try to parse this --}}
    {{ message }}

    {{-- Correct approach 1: Use @ syntax to escape --}}
    @{{ message }}

    {{-- Correct approach 2: Use verbatim block --}}
    @verbatim
        <p>{{ user.name }}</p>
        <p>{{ user.email }}</p>
    @endverbatim
</div>
```

### Pitfall 6: Misuse of @section and @yield

```php
{{-- Pitfall: Confusing @show and @endsection --}}

{{-- Parent layout --}}
@section('sidebar')
    <p>Default sidebar</p>
@show  {{-- @show outputs content immediately and allows child templates to extend --}}

{{-- Child template --}}
@section('sidebar')
    @parent  {{-- Include parent content --}}
    <p>Extra content</p>
@endsection  {{-- @endsection only defines content, doesn't output --}}


{{-- Common mistake: Using @endsection in layout --}}
{{-- Layout --}}
@section('sidebar')
    <p>Default content</p>
@endsection  {{-- Wrong: This only defines, won't output --}}

{{-- Should use @show or pair with @yield --}}
```

## Performance Considerations

### View Compilation and Caching

```bash
# Precompile all Blade views (use during deployment)
php artisan view:cache

# Clear view cache
php artisan view:clear

# Optimize configuration (includes view caching)
php artisan optimize
```

```php
// config/view.php
return [
    // Compiled view storage path
    'compiled' => env(
        'VIEW_COMPILED_PATH',
        realpath(storage_path('framework/views'))
    ),
];

// Ensure OPcache is enabled in production
// php.ini
// opcache.enable=1
// opcache.validate_timestamps=0  // Disable timestamp validation in production
```

### Performance Benchmarking

```php
// Test view rendering performance
Route::get('/benchmark', function () {
    $iterations = 1000;
    $data = ['items' => range(1, 100)];

    // Test component rendering
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        view('benchmark.components', $data)->render();
    }
    $componentTime = microtime(true) - $start;

    // Test include rendering
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

### Reducing View Complexity

```php
{{-- Before optimization: Complex nested conditionals --}}
@if ($user)
    @if ($user->isAdmin())
        @if ($user->hasPermission('manage-users'))
            <button>Manage Users</button>
        @endif
    @endif
@endif

{{-- After optimization: Use ViewComposer or method encapsulation --}}
// In ViewComposer
View::composer('*', function ($view) {
    $view->with('canManageUsers',
        auth()->check() &&
        auth()->user()->isAdmin() &&
        auth()->user()->hasPermission('manage-users')
    );
});

{{-- In view --}}
@if ($canManageUsers)
    <button>Manage Users</button>
@endif
```

### Memory Optimization

```php
{{-- Use chunk when processing large datasets --}}
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

{{-- Or use cursor to reduce memory usage --}}
@foreach (User::cursor() as $user)
    <p>{{ $user->name }}</p>
@endforeach
```

## Real-world Scenarios

### Scenario 1: Multi-language Support

```php
{{-- resources/views/layouts/app.blade.php --}}
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <title>@yield('title') - {{ __('app.name') }}</title>
</head>
<body>
    {{-- Language switcher --}}
    <nav>
        @foreach (config('app.available_locales') as $locale => $name)
            <a href="{{ route('locale.switch', $locale) }}"
               class="{{ app()->getLocale() === $locale ? 'active' : '' }}">
                {{ $name }}
            </a>
        @endforeach
    </nav>

    {{-- Using translations --}}
    <h1>{{ __('messages.welcome') }}</h1>
    <p>{{ trans_choice('messages.items', $count) }}</p>

    {{-- Translation with parameters --}}
    <p>{{ __('messages.greeting', ['name' => $user->name]) }}</p>
</body>
</html>
```

```php
// resources/lang/en/messages.php
return [
    'welcome' => 'Welcome',
    'greeting' => 'Hello, :name!',
    'items' => '{0} No items|{1} One item|[2,*] :count items',
];
```

### Scenario 2: Permission-controlled UI

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
        'title' => 'You do not have permission to perform this action',
    ]) }}>
        {{ $slot }}
    </button>
@endcan
```

```php
{{-- Usage --}}
<x-permission-button permission="posts.create" action="createPost">
    Create Post
</x-permission-button>

<x-permission-button permission="posts.delete" action="deletePost" class="btn-danger">
    Delete
</x-permission-button>
```

### Scenario 3: Dynamic Table Component

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
                   placeholder="Search..."
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
                    <th>Actions</th>
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
                        {{ $empty ?? 'No data available' }}
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
{{-- Using data table component --}}
<x-data-table
    :columns="[
        ['key' => 'id', 'label' => 'ID', 'sortable' => true],
        ['key' => 'name', 'label' => 'Name'],
        ['key' => 'email', 'label' => 'Email'],
        ['key' => 'created_at', 'label' => 'Registration Date', 'format' => fn($row) => $row->created_at->format('Y-m-d')],
        ['key' => 'status', 'label' => 'Status', 'component' => 'status-badge'],
    ]"
    :data="$users">

    <x-slot:actions>
        @scope($row)
            <a href="{{ route('users.edit', $row) }}">Edit</a>
            <button wire:click="delete({{ $row->id }})">Delete</button>
        @endscope
    </x-slot:actions>

    <x-slot:empty>
        <p>No users yet, <a href="{{ route('users.create') }}">create the first user</a></p>
    </x-slot:empty>
</x-data-table>
```

### Scenario 4: Form Builder

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
                        <option value="">{{ $field['placeholder'] ?? 'Please select' }}</option>
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
{{-- Using form builder --}}
<x-form-builder
    :action="route('posts.store')"
    :fields="[
        [
            'name' => 'title',
            'label' => 'Title',
            'type' => 'text',
            'required' => true,
            'placeholder' => 'Enter post title',
        ],
        [
            'name' => 'category_id',
            'label' => 'Category',
            'type' => 'select',
            'options' => $categories->pluck('name', 'id'),
            'required' => true,
        ],
        [
            'name' => 'content',
            'label' => 'Content',
            'type' => 'textarea',
            'rows' => 10,
            'required' => true,
        ],
        [
            'name' => 'thumbnail',
            'label' => 'Thumbnail',
            'type' => 'file',
            'accept' => 'image/*',
            'help' => 'Supports JPG, PNG formats, max 2MB',
        ],
        [
            'name' => 'is_published',
            'label' => 'Publish immediately',
            'type' => 'checkbox',
            'default' => true,
        ],
    ]">
    <button type="submit" class="btn btn-primary">Publish Post</button>
    <a href="{{ route('posts.index') }}" class="btn btn-secondary">Cancel</a>
</x-form-builder>
```

## Interview Key Points

### Basic Concept Questions

**Q1: What is the working principle of the Blade template engine?**

Blade templates are compiled into native PHP code and cached in the `storage/framework/views` directory. The compilation process includes:
1. Parsing Blade syntax (like `{{ }}`, `@if`, etc.)
2. Converting it to corresponding PHP code
3. Caching the compiled result
4. Using the cached PHP file directly on subsequent requests

**Q2: What's the difference between `{{ }}` and `{!! !!}`?**

- `{{ $var }}`: Automatically calls `htmlspecialchars()` function to HTML entity escape the output, preventing XSS attacks
- `{!! $var !!}`: Outputs content as-is without escaping, suitable for confirmed safe HTML content

**Q3: What's the difference between @section and @yield?**

- `@section`: Defines a content section that can be overridden or extended by child templates
- `@yield`: Outputs the content of a specified section, used in layout templates to mark replaceable areas
- `@section...@show`: Defines and immediately outputs, while allowing child templates to extend

### Practical Questions

**Q4: How to implement Blade component reuse?**

```php
// 1. Class components - For complex logic
php artisan make:component Alert

// 2. Anonymous components - For simple display
// Create resources/views/components/button.blade.php
@props(['type' => 'button', 'variant' => 'primary'])
<button type="{{ $type }}" class="btn btn-{{ $variant }}" {{ $attributes }}>
    {{ $slot }}
</button>

// 3. Component namespaces - Organize large numbers of components
// resources/views/components/forms/input.blade.php
// Usage: <x-forms.input />
```

**Q5: How to optimize Blade view performance?**

1. Run `php artisan view:cache` in production to precompile views
2. Avoid complex calculations in views, move to Controller or ViewComposer
3. Use `@once` to avoid duplicate rendering
4. Eager load relationships to avoid N+1 queries
5. Use fragment caching appropriately
6. Enable OPcache

**Q6: How to create custom Blade directives?**

```php
// AppServiceProvider::boot()
Blade::directive('money', function ($expression) {
    return "<?php echo '$' . number_format($expression, 2); ?>";
});

Blade::if('admin', function () {
    return auth()->check() && auth()->user()->isAdmin();
});

// Usage
@money($price)

@admin
    <a href="/admin">Admin Dashboard</a>
@endadmin
```

### Advanced Questions

**Q7: Explain Blade component attribute bags and attribute merging?**

```php
// $attributes contains all attributes not declared in @props
@props(['type' => 'info'])

// Merge class attributes
<div {{ $attributes->merge(['class' => 'alert alert-' . $type]) }}>

// Conditionally add classes
<div {{ $attributes->class(['active' => $isActive, 'disabled' => $isDisabled]) }}>

// Filter and get specific attributes
{{ $attributes->get('id') }}
{{ $attributes->only(['id', 'class']) }}
{{ $attributes->except(['class']) }}
```

**Q8: How to implement scoped slots in views?**

```php
{{-- Component definition --}}
<ul>
    @foreach ($items as $item)
        {{ $slot($item) }}
    @endforeach
</ul>

{{-- Usage --}}
<x-list :items="$users">
    @scope($user)
        <li>{{ $user->name }} - {{ $user->email }}</li>
    @endscope
</x-list>
```

## Further Reading

### Official Resources

- [Laravel Blade Official Documentation](https://laravel.com/docs/blade)
- [Laravel Components Documentation](https://laravel.com/docs/blade#components)
- [Laravel Official Blog](https://blog.laravel.com/)

### Recommended Tools

- **Laravel Blade Snippets** - VS Code extension providing Blade syntax highlighting and code snippets
- **Blade Formatter** - Blade template formatting tool
- **Laravel Idea** - PhpStorm plugin enhancing Laravel development experience

### Advanced Topics

- **Livewire** - Laravel full-stack framework for building dynamic interfaces with Blade
- **Inertia.js** - Build single-page applications with Vue/React while keeping Laravel routing
- **Alpine.js** - Lightweight JavaScript framework that pairs perfectly with Blade

### Related Articles

- [Blade Component Best Practices](https://laravel-news.com/blade-components)
- [Building Reusable Blade Component Libraries](https://spatie.be/docs/laravel-blade-components)
- [Blade Template Performance Optimization Guide](https://laravel-news.com/blade-performance)

---

> The Blade template engine is a core component of the Laravel framework. Mastering its syntax and best practices is crucial for building high-quality Laravel applications. Through proper use of the component system, layout inheritance, and custom directives, you can significantly boost developer productivity and code maintainability.
