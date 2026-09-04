---
title: Laravel框架
description: Laravel完全指南，路由、控制器、Eloquent ORM与中间件
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - MVC
  - Eloquent
status: imported
origin: old/src/content/docs/php/laravel.zh.md
divergence: 0.231
issues: []
legacy:
  category: PHP
  subcategory: Web框架
  order: 3
  lastUpdated: 2026-01-07
---

Laravel是目前最流行的PHP Web应用框架之一，以其优雅的语法、丰富的功能和出色的开发体验而闻名。本文将全面介绍Laravel的核心概念和实际应用。

## Laravel简介

Laravel由Taylor Otwell于2011年创建，旨在提供一个更优雅、更具表现力的PHP框架替代方案。它遵循MVC（Model-View-Controller）架构模式，并提供了许多开箱即用的功能。

### 安装Laravel

使用Composer创建新的Laravel项目：

```bash
# 通过Composer安装Laravel安装器
composer global require laravel/installer

# 创建新项目
laravel new my-project

# 或者直接使用Composer
composer create-project laravel/laravel my-project

# 进入项目目录
cd my-project

# 启动开发服务器
php artisan serve
```

### 目录结构

Laravel项目的主要目录结构：

```
my-project/
├── app/                    # 应用程序核心代码
│   ├── Console/           # Artisan命令
│   ├── Exceptions/        # 异常处理
│   ├── Http/              # 控制器、中间件、请求
│   │   ├── Controllers/   # 控制器类
│   │   ├── Middleware/    # 中间件类
│   │   └── Requests/      # 表单请求验证
│   ├── Models/            # Eloquent模型
│   └── Providers/         # 服务提供者
├── bootstrap/             # 框架启动文件
├── config/                # 配置文件
├── database/              # 数据库迁移和种子
│   ├── migrations/        # 数据库迁移文件
│   ├── factories/         # 模型工厂
│   └── seeders/           # 数据填充
├── public/                # Web入口和静态资源
├── resources/             # 视图和未编译资源
│   ├── views/             # Blade模板
│   ├── css/               # CSS文件
│   └── js/                # JavaScript文件
├── routes/                # 路由定义
│   ├── web.php            # Web路由
│   ├── api.php            # API路由
│   └── console.php        # 控制台路由
├── storage/               # 日志、缓存、上传文件
├── tests/                 # 测试文件
└── vendor/                # Composer依赖
```

## 路由系统

Laravel的路由系统提供了一种简洁、富有表现力的方式来定义应用程序的URL结构。

### 基本路由

```php
<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

// 基本GET路由
Route::get('/', function () {
    return view('welcome');
});

// 带参数的路由
Route::get('/user/{id}', function (string $id) {
    return "用户ID: " . $id;
});

// 可选参数
Route::get('/user/{name?}', function (?string $name = '访客') {
    return "你好, " . $name;
});

// 正则约束
Route::get('/user/{id}', function (string $id) {
    return "用户ID: " . $id;
})->where('id', '[0-9]+');

// 多种HTTP方法
Route::match(['get', 'post'], '/form', function () {
    return '处理GET或POST请求';
});

// 任意HTTP方法
Route::any('/universal', function () {
    return '处理任意HTTP方法';
});
```

### 路由命名与分组

```php
<?php
// routes/web.php

use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\DashboardController;

// 命名路由
Route::get('/user/profile', [UserController::class, 'profile'])->name('user.profile');

// 生成URL：route('user.profile')
// 重定向：return redirect()->route('user.profile');

// 路由分组 - 共享前缀
Route::prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/users', [DashboardController::class, 'users']);
});
// 结果：/admin/dashboard, /admin/users

// 路由分组 - 共享中间件
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [UserController::class, 'profile']);
    Route::get('/settings', [UserController::class, 'settings']);
});

// 路由分组 - 命名空间前缀
Route::name('admin.')->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard'); // 完整名称：admin.dashboard
});

// 子域名路由
Route::domain('{account}.example.com')->group(function () {
    Route::get('/user/{id}', function (string $account, string $id) {
        return "账户: {$account}, 用户: {$id}";
    });
});
```

### API路由

```php
<?php
// routes/api.php

use App\Http\Controllers\Api\ArticleController;

// API资源路由
Route::apiResource('articles', ArticleController::class);

// 等同于：
// Route::get('/articles', [ArticleController::class, 'index']);
// Route::post('/articles', [ArticleController::class, 'store']);
// Route::get('/articles/{article}', [ArticleController::class, 'show']);
// Route::put('/articles/{article}', [ArticleController::class, 'update']);
// Route::delete('/articles/{article}', [ArticleController::class, 'destroy']);

// API版本控制
Route::prefix('v1')->group(function () {
    Route::apiResource('users', Api\V1\UserController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('users', Api\V2\UserController::class);
});
```

## 控制器

控制器用于将请求处理逻辑组织到单独的类中，使代码更加清晰和可维护。

### 创建控制器

```bash
# 创建基本控制器
php artisan make:controller UserController

# 创建资源控制器
php artisan make:controller ArticleController --resource

# 创建API资源控制器
php artisan make:controller Api/ArticleController --api

# 创建带模型绑定的资源控制器
php artisan make:controller ArticleController --resource --model=Article
```

### 基本控制器

```php
<?php
// app/Http/Controllers/UserController.php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    /**
     * 显示用户列表
     */
    public function index(): View
    {
        $users = User::paginate(15);

        return view('users.index', compact('users'));
    }

    /**
     * 显示单个用户
     */
    public function show(User $user): View
    {
        // 路由模型绑定自动注入User实例
        return view('users.show', compact('user'));
    }

    /**
     * 显示创建表单
     */
    public function create(): View
    {
        return view('users.create');
    }

    /**
     * 存储新用户
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        return redirect()
            ->route('users.show', $user)
            ->with('success', '用户创建成功！');
    }

    /**
     * 显示编辑表单
     */
    public function edit(User $user): View
    {
        return view('users.edit', compact('user'));
    }

    /**
     * 更新用户
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return redirect()
            ->route('users.show', $user)
            ->with('success', '用户更新成功！');
    }

    /**
     * 删除用户
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', '用户已删除！');
    }
}
```

### 依赖注入

```php
<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * 构造函数依赖注入
     */
    public function __construct(
        protected UserService $userService,
        protected UserRepository $userRepository
    ) {}

    public function index()
    {
        $users = $this->userRepository->getActiveUsers();

        return view('users.index', compact('users'));
    }

    /**
     * 方法依赖注入
     */
    public function store(Request $request, UserService $userService)
    {
        $user = $userService->createUser($request->all());

        return redirect()->route('users.show', $user);
    }
}
```

### 单行为控制器

```php
<?php
// app/Http/Controllers/ShowDashboardController.php

namespace App\Http\Controllers;

use Illuminate\View\View;

class ShowDashboardController extends Controller
{
    /**
     * 单行为控制器使用__invoke方法
     */
    public function __invoke(): View
    {
        $stats = [
            'users' => \App\Models\User::count(),
            'articles' => \App\Models\Article::count(),
            'comments' => \App\Models\Comment::count(),
        ];

        return view('dashboard', compact('stats'));
    }
}

// 路由定义
// Route::get('/dashboard', ShowDashboardController::class);
```

## 中间件

中间件提供了一种便捷的机制来过滤进入应用程序的HTTP请求。

### 创建中间件

```bash
php artisan make:middleware CheckAge
php artisan make:middleware EnsureTokenIsValid
```

### 中间件实现

```php
<?php
// app/Http/Middleware/CheckAge.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAge
{
    /**
     * 处理传入请求
     */
    public function handle(Request $request, Closure $next, int $minAge = 18): Response
    {
        if ($request->user()->age < $minAge) {
            return redirect()->route('home')
                ->with('error', "您必须年满{$minAge}岁才能访问此页面");
        }

        return $next($request);
    }
}
```

```php
<?php
// app/Http/Middleware/LogRequests.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequests
{
    /**
     * 前置和后置中间件
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 前置操作：请求处理之前
        $startTime = microtime(true);

        Log::info('请求开始', [
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
        ]);

        // 执行请求
        $response = $next($request);

        // 后置操作：请求处理之后
        $duration = microtime(true) - $startTime;

        Log::info('请求结束', [
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration' => round($duration * 1000, 2) . 'ms',
        ]);

        return $response;
    }
}
```

### 注册中间件

```php
<?php
// bootstrap/app.php (Laravel 11+)

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // 全局中间件
        $middleware->append(\App\Http\Middleware\LogRequests::class);

        // 路由中间件别名
        $middleware->alias([
            'check.age' => \App\Http\Middleware\CheckAge::class,
            'ensure.token' => \App\Http\Middleware\EnsureTokenIsValid::class,
        ]);

        // 中间件组
        $middleware->appendToGroup('admin', [
            'auth',
            'check.age:21',
        ]);
    })
    ->create();
```

### 使用中间件

```php
<?php
// routes/web.php

// 单个中间件
Route::get('/admin', function () {
    // ...
})->middleware('auth');

// 多个中间件
Route::get('/admin/dashboard', function () {
    // ...
})->middleware(['auth', 'check.age:21']);

// 中间件组
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::get('/settings', [SettingsController::class, 'show']);
});

// 排除中间件
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/public-page', [PageController::class, 'show'])
        ->withoutMiddleware('auth');
});
```

## Eloquent ORM

Eloquent是Laravel的ActiveRecord实现，提供了优雅的数据库操作方式。

### 定义模型

```bash
# 创建模型
php artisan make:model Article

# 创建模型并生成迁移、工厂、种子
php artisan make:model Article -mfs

# 创建带全部资源的模型
php artisan make:model Article --all
```

```php
<?php
// app/Models/Article.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Str;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * 与模型关联的表名
     */
    protected $table = 'articles';

    /**
     * 主键
     */
    protected $primaryKey = 'id';

    /**
     * 可批量赋值的属性
     */
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'user_id',
        'category_id',
        'published_at',
        'is_featured',
    ];

    /**
     * 不可批量赋值的属性
     */
    protected $guarded = ['id'];

    /**
     * 隐藏的属性（序列化时）
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * 属性类型转换
     */
    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * 默认属性值
     */
    protected $attributes = [
        'is_featured' => false,
    ];

    // ============ 关联关系 ============

    /**
     * 文章属于一个用户
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 文章属于一个分类
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * 文章有多个评论
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * 文章属于多个标签（多对多）
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)
            ->withTimestamps()
            ->withPivot('order');
    }

    // ============ 访问器和修改器 ============

    /**
     * 访问器：获取格式化的发布日期
     */
    protected function formattedDate(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->published_at?->format('Y年m月d日')
        );
    }

    /**
     * 修改器：自动生成slug
     */
    protected function title(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'title' => $value,
                'slug' => Str::slug($value),
            ]
        );
    }

    // ============ 查询作用域 ============

    /**
     * 本地作用域：已发布的文章
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * 本地作用域：精选文章
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * 本地作用域：按分类筛选
     */
    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }
}
```

### 数据库迁移

```php
<?php
// database/migrations/2024_01_01_000000_create_articles_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('content');
            $table->json('metadata')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // 索引
            $table->index(['published_at', 'is_featured']);
            $table->fullText(['title', 'content']);
        });

        // 创建多对多关联表
        Schema::create('article_tag', function (Blueprint $table) {
            $table->foreignId('article_id')->constrained()->onDelete('cascade');
            $table->foreignId('tag_id')->constrained()->onDelete('cascade');
            $table->integer('order')->default(0);
            $table->timestamps();

            $table->primary(['article_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('article_tag');
        Schema::dropIfExists('articles');
    }
};
```

### CRUD操作

```php
<?php

use App\Models\Article;
use App\Models\User;

// ============ 创建 ============

// 方式1：create（需要在$fillable中定义）
$article = Article::create([
    'title' => 'Laravel入门指南',
    'content' => '文章内容...',
    'user_id' => 1,
]);

// 方式2：new + save
$article = new Article();
$article->title = 'Laravel入门指南';
$article->content = '文章内容...';
$article->user_id = 1;
$article->save();

// 方式3：firstOrCreate / firstOrNew
$article = Article::firstOrCreate(
    ['slug' => 'laravel-guide'],
    ['title' => 'Laravel指南', 'content' => '...', 'user_id' => 1]
);

// 方式4：updateOrCreate
$article = Article::updateOrCreate(
    ['slug' => 'laravel-guide'],
    ['title' => 'Laravel指南（更新版）', 'content' => '...']
);

// ============ 查询 ============

// 获取所有记录
$articles = Article::all();

// 根据主键查找
$article = Article::find(1);
$article = Article::findOrFail(1); // 找不到抛出404

// 条件查询
$articles = Article::where('is_featured', true)
    ->where('published_at', '<=', now())
    ->orderBy('published_at', 'desc')
    ->get();

// 使用作用域
$articles = Article::published()->featured()->get();

// 获取单条记录
$article = Article::where('slug', 'laravel-guide')->first();
$article = Article::where('slug', 'laravel-guide')->firstOrFail();

// 聚合函数
$count = Article::count();
$maxViews = Article::max('views');
$avgRating = Article::avg('rating');

// 分块处理大数据
Article::chunk(100, function ($articles) {
    foreach ($articles as $article) {
        // 处理每篇文章
    }
});

// 懒加载集合
foreach (Article::lazy() as $article) {
    // 逐条处理
}

// ============ 更新 ============

// 方式1：找到后更新
$article = Article::find(1);
$article->title = '新标题';
$article->save();

// 方式2：update方法
$article = Article::find(1);
$article->update(['title' => '新标题']);

// 方式3：批量更新
Article::where('is_featured', false)
    ->update(['is_featured' => true]);

// ============ 删除 ============

// 删除单条记录
$article = Article::find(1);
$article->delete();

// 根据主键删除
Article::destroy(1);
Article::destroy([1, 2, 3]);

// 条件删除
Article::where('published_at', '<', now()->subYear())->delete();

// 软删除相关
$article->delete();           // 软删除
$article->forceDelete();      // 永久删除
$article->restore();          // 恢复

// 包含软删除的记录
Article::withTrashed()->get();
Article::onlyTrashed()->get();
```

### 关联查询

```php
<?php

use App\Models\Article;
use App\Models\User;

// ============ 预加载（解决N+1问题） ============

// 预加载关联
$articles = Article::with('user', 'category')->get();

// 嵌套预加载
$articles = Article::with('user.profile', 'comments.user')->get();

// 条件预加载
$articles = Article::with(['comments' => function ($query) {
    $query->where('approved', true)->orderBy('created_at', 'desc');
}])->get();

// 懒预加载
$articles = Article::all();
$articles->load('user', 'tags');

// 预加载计数
$articles = Article::withCount('comments')->get();
// 访问：$article->comments_count

// 条件计数
$articles = Article::withCount([
    'comments',
    'comments as approved_comments_count' => function ($query) {
        $query->where('approved', true);
    }
])->get();

// ============ 关联操作 ============

// 创建关联记录
$article = Article::find(1);
$article->comments()->create([
    'content' => '很棒的文章！',
    'user_id' => auth()->id(),
]);

// 关联多条记录
$article->comments()->createMany([
    ['content' => '评论1', 'user_id' => 1],
    ['content' => '评论2', 'user_id' => 2],
]);

// 多对多关联操作
$article = Article::find(1);

// 附加标签
$article->tags()->attach([1, 2, 3]);
$article->tags()->attach([1 => ['order' => 1], 2 => ['order' => 2]]);

// 分离标签
$article->tags()->detach([1, 2]);
$article->tags()->detach(); // 分离所有

// 同步（只保留指定的）
$article->tags()->sync([1, 2, 3]);
$article->tags()->syncWithoutDetaching([4, 5]); // 不分离现有的

// 切换
$article->tags()->toggle([1, 2, 3]);

// ============ 查询关联 ============

// 查询有评论的文章
$articles = Article::has('comments')->get();

// 查询评论数大于5的文章
$articles = Article::has('comments', '>=', 5)->get();

// 条件关联查询
$articles = Article::whereHas('comments', function ($query) {
    $query->where('approved', true);
})->get();

// 查询没有评论的文章
$articles = Article::doesntHave('comments')->get();

// 多态关联查询
$articles = Article::whereHasMorph('taggable', [Post::class, Video::class], function ($query) {
    $query->where('title', 'like', '%Laravel%');
})->get();
```

## Blade模板引擎

Blade是Laravel提供的简洁而强大的模板引擎。

### 基本语法

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', '默认标题') - 我的网站</title>

    {{-- 样式栈 --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
</head>
<body>
    {{-- 导航组件 --}}
    <x-navigation />

    {{-- 主要内容 --}}
    <main class="container">
        {{-- Flash消息 --}}
        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @yield('content')
    </main>

    {{-- 页脚 --}}
    <x-footer />

    {{-- 脚本栈 --}}
    @stack('scripts')
</body>
</html>
```

```blade
{{-- resources/views/articles/index.blade.php --}}
@extends('layouts.app')

@section('title', '文章列表')

@section('content')
    <h1>文章列表</h1>

    {{-- 条件渲染 --}}
    @if($articles->isEmpty())
        <p>暂无文章</p>
    @else
        <div class="articles">
            {{-- 循环 --}}
            @foreach($articles as $article)
                <article class="article-card">
                    <h2>
                        <a href="{{ route('articles.show', $article) }}">
                            {{ $article->title }}
                        </a>
                    </h2>

                    {{-- 未转义输出（信任的HTML） --}}
                    <div class="excerpt">{!! $article->excerpt !!}</div>

                    <footer>
                        <span>作者：{{ $article->user->name }}</span>
                        <span>发布于：{{ $article->published_at->diffForHumans() }}</span>

                        {{-- 条件类 --}}
                        @if($article->is_featured)
                            <span class="badge">精选</span>
                        @endif
                    </footer>
                </article>

                {{-- 循环变量 --}}
                @if(!$loop->last)
                    <hr>
                @endif
            @endforeach
        </div>

        {{-- 分页链接 --}}
        {{ $articles->links() }}
    @endif

    {{-- 认证指令 --}}
    @auth
        <a href="{{ route('articles.create') }}" class="btn">发布文章</a>
    @endauth

    @guest
        <p>请<a href="{{ route('login') }}">登录</a>后发布文章</p>
    @endguest
@endsection

@push('styles')
    <style>
        .article-card { margin-bottom: 2rem; }
    </style>
@endpush
```

### 组件

```blade
{{-- resources/views/components/alert.blade.php --}}
@props([
    'type' => 'info',
    'dismissible' => false
])

<div {{ $attributes->merge(['class' => "alert alert-{$type}"]) }}>
    {{ $slot }}

    @if($dismissible)
        <button type="button" class="close" onclick="this.parentElement.remove()">
            &times;
        </button>
    @endif
</div>

{{-- 使用组件 --}}
<x-alert type="success" dismissible>
    操作成功！
</x-alert>

<x-alert type="error" class="mt-4">
    发生错误，请重试。
</x-alert>
```

```php
<?php
// app/View/Components/Card.php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Card extends Component
{
    public function __construct(
        public string $title,
        public ?string $subtitle = null,
        public bool $shadow = true
    ) {}

    public function render(): View
    {
        return view('components.card');
    }
}
```

```blade
{{-- resources/views/components/card.blade.php --}}
<div {{ $attributes->class(['card', 'shadow' => $shadow]) }}>
    <div class="card-header">
        <h3>{{ $title }}</h3>
        @if($subtitle)
            <p class="subtitle">{{ $subtitle }}</p>
        @endif
    </div>

    <div class="card-body">
        {{ $slot }}
    </div>

    @isset($footer)
        <div class="card-footer">
            {{ $footer }}
        </div>
    @endisset
</div>

{{-- 使用 --}}
<x-card title="用户信息" subtitle="基本资料" :shadow="true">
    <p>姓名：{{ $user->name }}</p>
    <p>邮箱：{{ $user->email }}</p>

    <x-slot:footer>
        <button>编辑</button>
    </x-slot:footer>
</x-card>
```

### 表单组件

```blade
{{-- resources/views/articles/create.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>发布文章</h1>

    <form action="{{ route('articles.store') }}" method="POST" enctype="multipart/form-data">
        @csrf

        {{-- 文本输入 --}}
        <div class="form-group">
            <label for="title">标题</label>
            <input
                type="text"
                id="title"
                name="title"
                value="{{ old('title') }}"
                class="form-control @error('title') is-invalid @enderror"
                required
            >
            @error('title')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        {{-- 下拉选择 --}}
        <div class="form-group">
            <label for="category_id">分类</label>
            <select name="category_id" id="category_id" class="form-control">
                <option value="">请选择分类</option>
                @foreach($categories as $category)
                    <option
                        value="{{ $category->id }}"
                        @selected(old('category_id') == $category->id)
                    >
                        {{ $category->name }}
                    </option>
                @endforeach
            </select>
        </div>

        {{-- 多选标签 --}}
        <div class="form-group">
            <label>标签</label>
            @foreach($tags as $tag)
                <label class="checkbox-inline">
                    <input
                        type="checkbox"
                        name="tags[]"
                        value="{{ $tag->id }}"
                        @checked(in_array($tag->id, old('tags', [])))
                    >
                    {{ $tag->name }}
                </label>
            @endforeach
        </div>

        {{-- 富文本编辑器 --}}
        <div class="form-group">
            <label for="content">内容</label>
            <textarea
                id="content"
                name="content"
                rows="10"
                class="form-control @error('content') is-invalid @enderror"
            >{{ old('content') }}</textarea>
            @error('content')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        {{-- 文件上传 --}}
        <div class="form-group">
            <label for="cover_image">封面图片</label>
            <input type="file" name="cover_image" id="cover_image" accept="image/*">
            @error('cover_image')
                <span class="error">{{ $message }}</span>
            @enderror
        </div>

        {{-- 复选框 --}}
        <div class="form-group">
            <label>
                <input
                    type="checkbox"
                    name="is_featured"
                    value="1"
                    @checked(old('is_featured'))
                >
                设为精选
            </label>
        </div>

        <button type="submit" class="btn btn-primary">发布</button>
    </form>
@endsection
```

## 表单验证

Laravel提供了多种验证数据的方式。

### 控制器验证

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ArticleController extends Controller
{
    public function store(Request $request)
    {
        // 基本验证
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|unique:articles,slug',
            'content' => 'required|string|min:100',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
            'cover_image' => 'nullable|image|max:2048',
            'published_at' => 'nullable|date|after:today',
        ]);

        // 验证通过，继续处理...
    }

    public function update(Request $request, Article $article)
    {
        // 使用Rule类进行复杂验证
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                Rule::unique('articles')->ignore($article->id),
            ],
            'status' => [
                'required',
                Rule::in(['draft', 'published', 'archived']),
            ],
            'email' => [
                'required',
                'email',
                Rule::unique('users')->where(function ($query) {
                    return $query->where('account_type', 'premium');
                }),
            ],
        ]);
    }

    public function register(Request $request)
    {
        // 密码验证规则
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
        ]);
    }
}
```

### 表单请求验证

```php
<?php
// app/Http/Requests/StoreArticleRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArticleRequest extends FormRequest
{
    /**
     * 确定用户是否有权限发出此请求
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Article::class);
    }

    /**
     * 获取适用于请求的验证规则
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'unique:articles,slug'],
            'content' => ['required', 'string', 'min:100'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'category_id' => ['required', 'exists:categories,id'],
            'tags' => ['array', 'max:5'],
            'tags.*' => ['exists:tags,id'],
            'cover_image' => ['nullable', 'image', 'dimensions:min_width=800,min_height=400', 'max:2048'],
            'is_featured' => ['boolean'],
            'published_at' => ['nullable', 'date', 'after_or_equal:today'],
            'metadata' => ['nullable', 'array'],
            'metadata.seo_title' => ['nullable', 'string', 'max:60'],
            'metadata.seo_description' => ['nullable', 'string', 'max:160'],
        ];
    }

    /**
     * 获取验证错误的自定义消息
     */
    public function messages(): array
    {
        return [
            'title.required' => '文章标题不能为空',
            'title.max' => '文章标题不能超过255个字符',
            'content.required' => '文章内容不能为空',
            'content.min' => '文章内容至少需要100个字符',
            'category_id.required' => '请选择文章分类',
            'category_id.exists' => '所选分类不存在',
            'tags.max' => '最多只能选择5个标签',
            'cover_image.dimensions' => '封面图片尺寸至少为800x400像素',
        ];
    }

    /**
     * 获取验证属性的自定义名称
     */
    public function attributes(): array
    {
        return [
            'title' => '标题',
            'content' => '内容',
            'category_id' => '分类',
            'cover_image' => '封面图片',
            'published_at' => '发布时间',
        ];
    }

    /**
     * 准备验证数据
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => $this->slug ?? Str::slug($this->title),
            'is_featured' => $this->boolean('is_featured'),
        ]);
    }

    /**
     * 配置验证器实例
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->hasProfanity($this->content)) {
                $validator->errors()->add('content', '内容包含不当用语');
            }
        });
    }
}
```

```php
<?php
// 在控制器中使用

namespace App\Http\Controllers;

use App\Http\Requests\StoreArticleRequest;

class ArticleController extends Controller
{
    public function store(StoreArticleRequest $request)
    {
        // 验证已自动完成，直接获取验证后的数据
        $validated = $request->validated();

        // 或获取部分数据
        $data = $request->safe()->only(['title', 'content']);
        $data = $request->safe()->except(['is_featured']);

        $article = Article::create($validated);

        return redirect()->route('articles.show', $article);
    }
}
```

### 自定义验证规则

```php
<?php
// app/Rules/Profanity.php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Profanity implements ValidationRule
{
    protected array $badWords = ['不当词1', '不当词2'];

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        foreach ($this->badWords as $word) {
            if (str_contains(strtolower($value), strtolower($word))) {
                $fail('该:attribute包含不当用语。');
                return;
            }
        }
    }
}

// 使用
$request->validate([
    'content' => ['required', new Profanity()],
]);
```

## 用户认证

Laravel提供了完整的用户认证系统。

### 安装认证脚手架

```bash
# 使用Laravel Breeze（简单）
composer require laravel/breeze --dev
php artisan breeze:install

# 或使用Laravel Jetstream（功能更丰富）
composer require laravel/jetstream
php artisan jetstream:install livewire

# 运行迁移
php artisan migrate
npm install && npm run build
```

### 手动认证

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * 显示登录表单
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * 处理登录请求
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 尝试登录
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'email' => '提供的凭据与我们的记录不匹配。',
        ])->onlyInput('email');
    }

    /**
     * 处理注册请求
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|confirmed|min:8',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    /**
     * 登出
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
```

### 使用认证

```php
<?php

// 获取当前用户
$user = Auth::user();
$user = auth()->user();
$user = request()->user();

// 获取用户ID
$id = Auth::id();

// 检查是否已登录
if (Auth::check()) {
    // 用户已登录
}

// 在中间件中保护路由
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// 验证特定守卫
if (Auth::guard('admin')->check()) {
    // 管理员已登录
}
```

### 授权策略

```php
<?php
// app/Policies/ArticlePolicy.php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    /**
     * 在其他方法之前执行
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isAdmin()) {
            return true; // 管理员可以执行所有操作
        }

        return null; // 继续检查具体策略
    }

    /**
     * 确定用户是否可以查看所有文章
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * 确定用户是否可以查看该文章
     */
    public function view(User $user, Article $article): bool
    {
        return $article->published_at !== null || $user->id === $article->user_id;
    }

    /**
     * 确定用户是否可以创建文章
     */
    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    /**
     * 确定用户是否可以更新该文章
     */
    public function update(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }

    /**
     * 确定用户是否可以删除该文章
     */
    public function delete(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }

    /**
     * 确定用户是否可以恢复该文章
     */
    public function restore(User $user, Article $article): bool
    {
        return $user->id === $article->user_id;
    }
}
```

```php
<?php
// 注册策略
// app/Providers/AppServiceProvider.php

use App\Models\Article;
use App\Policies\ArticlePolicy;
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::policy(Article::class, ArticlePolicy::class);

    // 或定义Gate
    Gate::define('publish-article', function (User $user, Article $article) {
        return $user->id === $article->user_id && $user->isPremium();
    });
}
```

```php
<?php
// 在控制器中使用授权

class ArticleController extends Controller
{
    public function update(Request $request, Article $article)
    {
        // 方式1：authorize方法
        $this->authorize('update', $article);

        // 方式2：Gate facade
        if (Gate::allows('update', $article)) {
            // 允许
        }

        if (Gate::denies('update', $article)) {
            abort(403);
        }

        // 方式3：用户模型方法
        if ($request->user()->can('update', $article)) {
            // 允许
        }

        if ($request->user()->cannot('update', $article)) {
            abort(403);
        }
    }
}
```

```blade
{{-- 在Blade模板中使用授权 --}}

@can('update', $article)
    <a href="{{ route('articles.edit', $article) }}">编辑</a>
@endcan

@cannot('delete', $article)
    <p>您没有权限删除此文章</p>
@endcannot

@canany(['update', 'delete'], $article)
    <div class="actions">
        {{-- 显示操作按钮 --}}
    </div>
@endcanany
```

## 实战示例：博客系统

让我们整合上述知识，构建一个简单的博客系统。

### 模型和迁移

```php
<?php
// database/migrations/create_posts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->unsignedInteger('views')->default(0);
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

```php
<?php
// app/Models/Post.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'body',
        'featured_image',
        'status',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    // 关联
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    // 访问器
    protected function readTime(): Attribute
    {
        return Attribute::make(
            get: function () {
                $words = str_word_count(strip_tags($this->body));
                $minutes = ceil($words / 200);
                return $minutes . ' 分钟阅读';
            }
        );
    }

    // 修改器
    protected function title(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'title' => $value,
                'slug' => Str::slug($value),
            ]
        );
    }

    // 作用域
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopePopular(Builder $query): Builder
    {
        return $query->orderBy('views', 'desc');
    }

    // 方法
    public function incrementViews(): void
    {
        $this->increment('views');
    }

    public function isPublished(): bool
    {
        return $this->status === 'published' && $this->published_at <= now();
    }
}
```

### 控制器

```php
<?php
// app/Http/Controllers/PostController.php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth')->except(['index', 'show']);
    }

    public function index(Request $request)
    {
        $posts = Post::published()
            ->with('user:id,name')
            ->withCount('comments')
            ->when($request->search, function ($query, $search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('body', 'like', "%{$search}%");
            })
            ->latest('published_at')
            ->paginate(12);

        return view('posts.index', compact('posts'));
    }

    public function show(Post $post)
    {
        // 确保只能查看已发布的文章（除非是作者）
        if (!$post->isPublished() && $post->user_id !== auth()->id()) {
            abort(404);
        }

        $post->incrementViews();
        $post->load(['user', 'comments.user']);

        $relatedPosts = Post::published()
            ->where('id', '!=', $post->id)
            ->where('user_id', $post->user_id)
            ->limit(3)
            ->get();

        return view('posts.show', compact('post', 'relatedPosts'));
    }

    public function create()
    {
        return view('posts.create');
    }

    public function store(StorePostRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')
                ->store('posts', 'public');
        }

        $post = $request->user()->posts()->create($data);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', '文章创建成功！');
    }

    public function edit(Post $post)
    {
        $this->authorize('update', $post);

        return view('posts.edit', compact('post'));
    }

    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $data = $request->validated();

        if ($request->hasFile('featured_image')) {
            // 删除旧图片
            if ($post->featured_image) {
                Storage::disk('public')->delete($post->featured_image);
            }

            $data['featured_image'] = $request->file('featured_image')
                ->store('posts', 'public');
        }

        $post->update($data);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', '文章更新成功！');
    }

    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        if ($post->featured_image) {
            Storage::disk('public')->delete($post->featured_image);
        }

        $post->delete();

        return redirect()
            ->route('posts.index')
            ->with('success', '文章已删除！');
    }
}
```

### 视图

```blade
{{-- resources/views/posts/show.blade.php --}}
@extends('layouts.app')

@section('title', $post->title)

@section('content')
<article class="post">
    @if($post->featured_image)
        <img
            src="{{ Storage::url($post->featured_image) }}"
            alt="{{ $post->title }}"
            class="featured-image"
        >
    @endif

    <header class="post-header">
        <h1>{{ $post->title }}</h1>

        <div class="post-meta">
            <span class="author">
                <img src="{{ $post->user->avatar_url }}" alt="{{ $post->user->name }}">
                {{ $post->user->name }}
            </span>
            <time datetime="{{ $post->published_at->toISOString() }}">
                {{ $post->published_at->format('Y年m月d日') }}
            </time>
            <span class="read-time">{{ $post->read_time }}</span>
            <span class="views">{{ number_format($post->views) }} 次阅读</span>
        </div>
    </header>

    <div class="post-content prose">
        {!! $post->body !!}
    </div>

    <footer class="post-footer">
        @can('update', $post)
            <a href="{{ route('posts.edit', $post) }}" class="btn">编辑</a>
        @endcan

        @can('delete', $post)
            <form action="{{ route('posts.destroy', $post) }}" method="POST" class="inline">
                @csrf
                @method('DELETE')
                <button type="submit" class="btn btn-danger"
                    onclick="return confirm('确定要删除这篇文章吗？')">
                    删除
                </button>
            </form>
        @endcan
    </footer>
</article>

{{-- 评论区 --}}
<section class="comments">
    <h2>评论 ({{ $post->comments->count() }})</h2>

    @auth
        <form action="{{ route('posts.comments.store', $post) }}" method="POST">
            @csrf
            <textarea
                name="body"
                rows="3"
                placeholder="写下你的评论..."
                required
            >{{ old('body') }}</textarea>
            @error('body')
                <span class="error">{{ $message }}</span>
            @enderror
            <button type="submit" class="btn">发表评论</button>
        </form>
    @else
        <p>请<a href="{{ route('login') }}">登录</a>后发表评论</p>
    @endauth

    <div class="comments-list">
        @forelse($post->comments as $comment)
            <div class="comment">
                <div class="comment-author">
                    <img src="{{ $comment->user->avatar_url }}" alt="{{ $comment->user->name }}">
                    <strong>{{ $comment->user->name }}</strong>
                    <time>{{ $comment->created_at->diffForHumans() }}</time>
                </div>
                <div class="comment-body">
                    {{ $comment->body }}
                </div>
            </div>
        @empty
            <p class="no-comments">暂无评论，成为第一个评论者吧！</p>
        @endforelse
    </div>
</section>

{{-- 相关文章 --}}
@if($relatedPosts->isNotEmpty())
    <section class="related-posts">
        <h2>相关文章</h2>
        <div class="posts-grid">
            @foreach($relatedPosts as $relatedPost)
                <x-post-card :post="$relatedPost" />
            @endforeach
        </div>
    </section>
@endif
@endsection
```

## 最佳实践

### 使用服务类封装业务逻辑

```php
<?php
// app/Services/PostService.php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PostService
{
    public function createPost(User $user, array $data): Post
    {
        return DB::transaction(function () use ($user, $data) {
            $post = $user->posts()->create([
                'title' => $data['title'],
                'body' => $data['body'],
                'excerpt' => $data['excerpt'] ?? $this->generateExcerpt($data['body']),
                'status' => $data['status'] ?? 'draft',
                'published_at' => $data['status'] === 'published' ? now() : null,
            ]);

            if (isset($data['featured_image'])) {
                $path = $data['featured_image']->store('posts', 'public');
                $post->update(['featured_image' => $path]);
            }

            if (isset($data['tags'])) {
                $post->tags()->sync($data['tags']);
            }

            return $post;
        });
    }

    protected function generateExcerpt(string $body): string
    {
        return Str::limit(strip_tags($body), 200);
    }
}
```

### 使用资源类格式化API响应

```php
<?php
// app/Http/Resources/PostResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when($request->routeIs('posts.show'), $this->body),
            'featured_image' => $this->featured_image
                ? Storage::url($this->featured_image)
                : null,
            'status' => $this->status,
            'views' => $this->views,
            'read_time' => $this->read_time,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'author' => new UserResource($this->whenLoaded('user')),
            'comments_count' => $this->whenCounted('comments'),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
        ];
    }
}
```

### 使用事件和监听器

```php
<?php
// app/Events/PostPublished.php

namespace App\Events;

use App\Models\Post;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostPublished
{
    use Dispatchable, SerializesModels;

    public function __construct(public Post $post) {}
}

// app/Listeners/SendPostPublishedNotification.php

namespace App\Listeners;

use App\Events\PostPublished;
use App\Notifications\NewPostNotification;

class SendPostPublishedNotification
{
    public function handle(PostPublished $event): void
    {
        $subscribers = $event->post->user->subscribers;

        foreach ($subscribers as $subscriber) {
            $subscriber->notify(new NewPostNotification($event->post));
        }
    }
}

// 触发事件
PostPublished::dispatch($post);
```

## 总结

Laravel是一个功能强大且优雅的PHP框架，本文涵盖了以下核心内容：

1. **路由系统**：定义清晰的URL结构，支持参数、命名、分组和中间件
2. **控制器**：组织请求处理逻辑，支持资源控制器和依赖注入
3. **中间件**：过滤HTTP请求，实现认证、日志等横切关注点
4. **Eloquent ORM**：优雅的数据库操作，支持关联、查询作用域和软删除
5. **Blade模板**：简洁强大的视图引擎，支持组件和布局继承
6. **表单验证**：多种验证方式，支持自定义规则和错误消息
7. **用户认证**：完整的认证系统，支持策略和Gate授权

掌握这些核心概念后，您可以进一步探索Laravel的其他高级特性：

- **队列和任务调度**：处理耗时任务和定时任务
- **事件和广播**：实现实时通信
- **缓存和优化**：提升应用性能
- **测试**：编写单元测试和功能测试
- **部署**：将应用部署到生产环境

Laravel生态系统还提供了许多官方扩展包，如Laravel Sanctum（API认证）、Laravel Horizon（队列监控）、Laravel Scout（全文搜索）等，可以帮助您快速构建复杂的Web应用。
