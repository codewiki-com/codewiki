---
title: Laravel PHP框架
description: 使用Laravel构建优雅的PHP应用
track: backend
section: http-apis
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - Eloquent
  - Web开发
status: imported
origin: old/src/content/docs/backend/php-laravel.zh.md
divergence: 0.26
issues: []
legacy:
  category: Backend
  subcategory: Frameworks
  order: 26
  lastUpdated: 2026-01-07
---

## 概念解释

Laravel 是一个优雅、表达力强的 PHP Web 应用框架，由 Taylor Otwell 于 2011 年创建。它遵循 MVC（Model-View-Controller）架构模式，提供了一套完整的工具和功能，帮助开发者快速构建现代化的 Web 应用程序。

### 为什么选择 Laravel？

Laravel 的设计理念是让 PHP 开发变得愉悦且高效。它通过简洁优雅的语法、强大的功能特性和完善的生态系统，成为了 PHP 开发领域最受欢迎的框架。

Laravel 的核心优势包括：

- **优雅的语法**：清晰易读的代码风格，降低学习成本
- **强大的 ORM**：Eloquent ORM 提供直观的数据库操作体验
- **内置认证**：开箱即用的用户认证和授权系统
- **队列系统**：支持多种队列驱动，轻松处理异步任务
- **任务调度**：强大的定时任务调度功能
- **完善的测试**：内置测试工具，支持单元测试和功能测试
- **丰富的生态**：庞大的扩展包生态系统

## Laravel 架构与核心概念

### 项目结构

Laravel 项目采用清晰的目录结构组织代码：

```
laravel-project/
├── app/                    # 应用核心代码
│   ├── Console/           # Artisan 命令
│   ├── Exceptions/        # 异常处理
│   ├── Http/              # HTTP层（控制器、中间件、请求）
│   │   ├── Controllers/   # 控制器
│   │   ├── Middleware/    # 中间件
│   │   └── Requests/      # 表单请求验证
│   ├── Models/            # Eloquent 模型
│   ├── Providers/         # 服务提供者
│   └── Services/          # 业务服务层（自定义）
├── bootstrap/             # 框架启动文件
├── config/                # 配置文件
├── database/              # 数据库相关
│   ├── factories/         # 模型工厂
│   ├── migrations/        # 数据库迁移
│   └── seeders/           # 数据填充
├── public/                # 公开访问目录（入口文件）
├── resources/             # 资源文件
│   ├── css/              # CSS文件
│   ├── js/               # JavaScript文件
│   └── views/            # Blade模板
├── routes/                # 路由定义
│   ├── api.php           # API路由
│   ├── web.php           # Web路由
│   └── console.php       # 控制台路由
├── storage/               # 存储目录
├── tests/                 # 测试文件
├── vendor/                # Composer依赖
├── .env                   # 环境配置
├── artisan                # CLI工具
└── composer.json          # 依赖配置
```

### 服务容器与依赖注入

服务容器是 Laravel 的核心，负责管理类的依赖和依赖注入：

```php
<?php

namespace App\Services;

use App\Repositories\UserRepositoryInterface;

class UserService
{
    protected $userRepository;

    // 构造函数依赖注入
    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function getAllUsers()
    {
        return $this->userRepository->all();
    }

    public function createUser(array $data)
    {
        return $this->userRepository->create($data);
    }
}
```

在服务提供者中绑定接口与实现：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\UserRepositoryInterface;
use App\Repositories\EloquentUserRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register()
    {
        // 绑定接口到具体实现
        $this->app->bind(
            UserRepositoryInterface::class,
            EloquentUserRepository::class
        );

        // 单例绑定
        $this->app->singleton(PaymentService::class, function ($app) {
            return new PaymentService(
                config('services.payment.key'),
                config('services.payment.secret')
            );
        });
    }

    public function boot()
    {
        //
    }
}
```

### 服务提供者

服务提供者是 Laravel 应用启动的核心，用于注册服务、绑定接口、配置应用：

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册服务
     */
    public function register()
    {
        // 根据环境加载不同配置
        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        }
    }

    /**
     * 启动服务
     */
    public function boot()
    {
        // 共享视图数据
        View::share('appName', config('app.name'));

        // 自定义 Blade 指令
        Blade::directive('datetime', function ($expression) {
            return "<?php echo ($expression)->format('Y-m-d H:i:s'); ?>";
        });

        // 自定义验证规则
        Validator::extend('phone', function ($attribute, $value, $parameters, $validator) {
            return preg_match('/^1[3-9]\d{9}$/', $value);
        });
    }
}
```

### Facades 门面

Facades 提供了一种简洁的方式来访问服务容器中的服务：

```php
<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

// 使用 Cache Facade
$value = Cache::get('key');
Cache::put('key', 'value', $seconds = 3600);

// 使用 DB Facade
$users = DB::table('users')->where('active', true)->get();

// 使用 Log Facade
Log::info('用户登录', ['user_id' => $user->id]);

// 使用 Mail Facade
Mail::to($user->email)->send(new WelcomeMail($user));
```

创建自定义 Facade：

```php
<?php

namespace App\Facades;

use Illuminate\Support\Facades\Facade;

class Payment extends Facade
{
    protected static function getFacadeAccessor()
    {
        return 'payment'; // 服务容器中的绑定名称
    }
}

// 使用
Payment::charge($amount);
```

## 路由系统

### 基础路由

Laravel 路由定义在 routes 目录下：

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostController;

// 基础路由
Route::get('/', function () {
    return view('welcome');
});

// 带参数的路由
Route::get('/users/{id}', function ($id) {
    return "用户ID: {$id}";
});

// 可选参数
Route::get('/posts/{slug?}', function ($slug = null) {
    return $slug ? "文章: {$slug}" : "文章列表";
});

// 正则约束
Route::get('/user/{id}', function ($id) {
    return "用户: {$id}";
})->where('id', '[0-9]+');

// 命名路由
Route::get('/profile', [UserController::class, 'profile'])->name('user.profile');

// 路由重定向
Route::redirect('/old-page', '/new-page', 301);

// 视图路由
Route::view('/about', 'pages.about', ['title' => '关于我们']);
```

### 控制器路由

```php
<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\DashboardController;

// 控制器方法路由
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{user}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
Route::put('/users/{user}', [UserController::class, 'update']);
Route::delete('/users/{user}', [UserController::class, 'destroy']);

// 资源路由 - 自动生成 CRUD 路由
Route::resource('posts', PostController::class);

// API 资源路由（不包含 create 和 edit）
Route::apiResource('products', ProductController::class);

// 嵌套资源路由
Route::resource('posts.comments', CommentController::class);

// 仅生成指定方法
Route::resource('photos', PhotoController::class)->only([
    'index', 'show'
]);

// 排除指定方法
Route::resource('photos', PhotoController::class)->except([
    'create', 'store', 'update', 'destroy'
]);
```

### 路由分组

```php
<?php

// 路由前缀分组
Route::prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/users', [AdminUserController::class, 'index']);
});

// 中间件分组
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'index']);
});

// 命名空间分组
Route::namespace('Admin')->prefix('admin')->group(function () {
    Route::get('/dashboard', 'DashboardController@index');
});

// 名称前缀分组
Route::name('admin.')->prefix('admin')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard'); // 完整名称：admin.dashboard
});

// 组合分组
Route::prefix('api/v1')
    ->middleware('api')
    ->name('api.v1.')
    ->group(function () {
        Route::get('/users', [ApiUserController::class, 'index'])->name('users.index');
        Route::get('/posts', [ApiPostController::class, 'index'])->name('posts.index');
    });

// 子域名路由
Route::domain('{account}.myapp.com')->group(function () {
    Route::get('/user/{id}', function ($account, $id) {
        return "账户: {$account}, 用户: {$id}";
    });
});
```

### 路由模型绑定

```php
<?php

use App\Models\User;
use App\Models\Post;

// 隐式绑定 - 自动通过主键查找
Route::get('/users/{user}', function (User $user) {
    return $user;
});

// 自定义键名
Route::get('/posts/{post:slug}', function (Post $post) {
    return $post;
});

// 在模型中自定义路由键
class Post extends Model
{
    public function getRouteKeyName()
    {
        return 'slug';
    }
}

// 显式绑定（在 RouteServiceProvider 中）
public function boot()
{
    Route::bind('user', function ($value) {
        return User::where('username', $value)->firstOrFail();
    });
}

// 作用域绑定
Route::get('/users/{user}/posts/{post:slug}', function (User $user, Post $post) {
    return $post; // post 必须属于该 user
})->scopeBindings();
```

## 中间件

### 创建中间件

```bash
php artisan make:middleware CheckAge
```

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAge
{
    /**
     * 处理传入请求
     */
    public function handle(Request $request, Closure $next, $minAge = 18)
    {
        if ($request->age < $minAge) {
            return redirect('home')->with('error', '年龄不符合要求');
        }

        return $next($request);
    }
}
```

### 注册中间件

在 app/Http/Kernel.php 中注册：

```php
<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * 全局中间件
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * 中间件组
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * 路由中间件别名
     */
    protected $middlewareAliases = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
        'age' => \App\Http\Middleware\CheckAge::class,
    ];
}
```

### 常用中间件示例

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

// 请求日志中间件
class LogRequests
{
    public function handle(Request $request, Closure $next)
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = microtime(true) - $startTime;

        Log::info('HTTP请求', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_id' => $request->user()?->id,
            'duration' => round($duration * 1000, 2) . 'ms',
            'status' => $response->getStatusCode(),
        ]);

        return $response;
    }
}

// API 签名验证中间件
class VerifyApiSignature
{
    public function handle(Request $request, Closure $next)
    {
        $signature = $request->header('X-Signature');
        $timestamp = $request->header('X-Timestamp');

        if (!$signature || !$timestamp) {
            return response()->json(['error' => '缺少签名信息'], 401);
        }

        // 检查时间戳是否过期（5分钟内）
        if (abs(time() - $timestamp) > 300) {
            return response()->json(['error' => '请求已过期'], 401);
        }

        // 验证签名
        $expectedSignature = hash_hmac('sha256', $timestamp . $request->getContent(), config('app.api_secret'));

        if (!hash_equals($expectedSignature, $signature)) {
            return response()->json(['error' => '签名验证失败'], 401);
        }

        return $next($request);
    }
}

// 角色验证中间件
class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user() || !in_array($request->user()->role, $roles)) {
            abort(403, '无权访问');
        }

        return $next($request);
    }
}
```

使用中间件：

```php
// 在路由中使用
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(['auth', 'role:admin,super_admin']);

// 传递参数
Route::get('/adult-content', [ContentController::class, 'adult'])
    ->middleware('age:21');

// 中间件组
Route::middleware(['auth', 'verified', 'log'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});
```

## Eloquent ORM

### 模型定义

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    // 表名（默认为类名的复数形式）
    protected $table = 'posts';

    // 主键
    protected $primaryKey = 'id';

    // 是否自增
    public $incrementing = true;

    // 主键类型
    protected $keyType = 'int';

    // 是否维护时间戳
    public $timestamps = true;

    // 时间戳字段格式
    protected $dateFormat = 'Y-m-d H:i:s';

    // 数据库连接
    protected $connection = 'mysql';

    // 可批量赋值的字段
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'author_id',
        'category_id',
        'status',
        'published_at',
    ];

    // 不可批量赋值的字段
    protected $guarded = ['id'];

    // 隐藏字段（序列化时）
    protected $hidden = ['password', 'remember_token'];

    // 追加自定义属性
    protected $appends = ['full_url', 'reading_time'];

    // 类型转换
    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
        'metadata' => 'array',
        'views' => 'integer',
        'status' => PostStatus::class, // 枚举类型
    ];

    // 默认值
    protected $attributes = [
        'status' => 'draft',
        'views' => 0,
    ];

    // 访问器：获取完整URL
    public function getFullUrlAttribute()
    {
        return url("/posts/{$this->slug}");
    }

    // 访问器：计算阅读时间
    public function getReadingTimeAttribute()
    {
        $wordCount = str_word_count(strip_tags($this->content));
        return ceil($wordCount / 200); // 假设每分钟阅读200字
    }

    // 修改器：自动生成slug
    public function setTitleAttribute($value)
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }

    // 作用域：已发布的文章
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where('published_at', '<=', now());
    }

    // 作用域：按分类筛选
    public function scopeOfCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    // 作用域：搜索
    public function scopeSearch($query, $keyword)
    {
        return $query->where(function ($q) use ($keyword) {
            $q->where('title', 'like', "%{$keyword}%")
              ->orWhere('content', 'like', "%{$keyword}%");
        });
    }
}
```

### 模型关联

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class User extends Model
{
    // 一对一关系
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    // 一对多关系
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    // 多对多关系
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
                    ->withPivot('assigned_at', 'assigned_by')
                    ->withTimestamps();
    }

    // 远程一对多
    public function postComments()
    {
        return $this->hasManyThrough(
            Comment::class,  // 目标模型
            Post::class,     // 中间模型
            'author_id',     // 中间模型的外键
            'post_id',       // 目标模型的外键
            'id',            // 本模型的主键
            'id'             // 中间模型的主键
        );
    }

    // 多态关系
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Post extends Model
{
    // 反向一对多
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    // 一对多
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    // 多对多（标签）
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)
                    ->withTimestamps();
    }

    // 多态关系
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

// 多态关系表结构
// comments: id, body, commentable_type, commentable_id
class Comment extends Model
{
    public function commentable()
    {
        return $this->morphTo();
    }
}
```

### 查询构建器

```php
<?php

use App\Models\User;
use App\Models\Post;
use Illuminate\Support\Facades\DB;

// 基础查询
$users = User::all();
$user = User::find(1);
$user = User::findOrFail(1);
$user = User::where('email', 'test@example.com')->first();
$user = User::firstWhere('email', 'test@example.com');

// 条件查询
$posts = Post::where('status', 'published')
    ->where('views', '>', 100)
    ->orWhere('is_featured', true)
    ->orderBy('published_at', 'desc')
    ->take(10)
    ->get();

// 高级条件
$posts = Post::where(function ($query) {
    $query->where('status', 'published')
          ->orWhere('status', 'scheduled');
})
->where('author_id', auth()->id())
->get();

// 使用作用域
$posts = Post::published()
    ->ofCategory($categoryId)
    ->search($keyword)
    ->paginate(15);

// 关联查询
$posts = Post::with(['author', 'tags', 'comments.user'])
    ->withCount('comments')
    ->get();

// 懒加载与预加载
$posts = Post::all();
$posts->load('author'); // 懒加载

$posts = Post::with('author')->get(); // 预加载（推荐）

// 条件预加载
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest();
}])->get();

// 聚合查询
$count = User::where('active', true)->count();
$avgViews = Post::avg('views');
$maxViews = Post::max('views');
$totalViews = Post::sum('views');

// 分组查询
$stats = Post::select('category_id', DB::raw('COUNT(*) as count'))
    ->groupBy('category_id')
    ->having('count', '>', 5)
    ->get();

// 原始表达式
$users = User::select(
    'name',
    DB::raw('DATE(created_at) as registered_date'),
    DB::raw('COUNT(*) as post_count')
)
->join('posts', 'users.id', '=', 'posts.author_id')
->groupBy('users.id', 'users.name', 'registered_date')
->get();

// 存在性查询
$usersWithPosts = User::whereHas('posts', function ($query) {
    $query->where('status', 'published');
})->get();

$usersWithManyPosts = User::has('posts', '>=', 5)->get();

// 分块查询（处理大量数据）
Post::chunk(100, function ($posts) {
    foreach ($posts as $post) {
        // 处理每个帖子
    }
});

// 游标查询（内存效率更高）
foreach (Post::cursor() as $post) {
    // 处理每个帖子
}
```

### 数据操作

```php
<?php

use App\Models\Post;
use App\Models\User;

// 创建
$post = Post::create([
    'title' => 'Laravel入门',
    'content' => '文章内容...',
    'author_id' => auth()->id(),
]);

// 或者
$post = new Post();
$post->title = 'Laravel入门';
$post->content = '文章内容...';
$post->author_id = auth()->id();
$post->save();

// 更新
$post = Post::find(1);
$post->title = '新标题';
$post->save();

// 批量更新
Post::where('author_id', 1)->update(['status' => 'archived']);

// updateOrCreate - 更新或创建
$user = User::updateOrCreate(
    ['email' => 'test@example.com'],
    ['name' => '测试用户', 'password' => bcrypt('password')]
);

// firstOrCreate - 查找或创建
$tag = Tag::firstOrCreate(
    ['slug' => 'laravel'],
    ['name' => 'Laravel']
);

// 删除
$post = Post::find(1);
$post->delete();

// 批量删除
Post::where('status', 'draft')->delete();

// 软删除
Post::destroy([1, 2, 3]);

// 恢复软删除
$post = Post::withTrashed()->find(1);
$post->restore();

// 永久删除
$post->forceDelete();

// 关联操作
$user->posts()->create([
    'title' => '新文章',
    'content' => '内容...',
]);

// 多对多关联
$post->tags()->attach([1, 2, 3]);
$post->tags()->detach([1]);
$post->tags()->sync([1, 2, 3]); // 同步，删除其他
$post->tags()->toggle([1, 2]); // 切换

// 带中间表数据
$post->tags()->attach([
    1 => ['created_by' => auth()->id()],
    2 => ['created_by' => auth()->id()],
]);
```

## Blade 模板引擎

### 基础语法

```blade
{{-- 这是注释 --}}

{{-- 输出变量（自动转义） --}}
<p>{{ $user->name }}</p>

{{-- 原始输出（不转义，谨慎使用） --}}
<p>{!! $user->bio !!}</p>

{{-- 默认值 --}}
<p>{{ $user->nickname ?? '匿名用户' }}</p>

{{-- 条件语句 --}}
@if($user->isAdmin())
    <span class="badge">管理员</span>
@elseif($user->isModerator())
    <span class="badge">版主</span>
@else
    <span class="badge">普通用户</span>
@endif

{{-- unless（if 的反向） --}}
@unless(auth()->check())
    <a href="/login">请登录</a>
@endunless

{{-- isset 和 empty --}}
@isset($records)
    <p>有记录</p>
@endisset

@empty($records)
    <p>没有记录</p>
@endempty

{{-- 循环 --}}
@foreach($users as $user)
    <p>{{ $loop->iteration }}. {{ $user->name }}</p>
@endforeach

@forelse($posts as $post)
    <article>{{ $post->title }}</article>
@empty
    <p>暂无文章</p>
@endforelse

{{-- 循环变量 $loop --}}
@foreach($items as $item)
    @if($loop->first)
        <p>这是第一项</p>
    @endif

    <p>索引: {{ $loop->index }}</p>
    <p>计数: {{ $loop->iteration }}</p>
    <p>剩余: {{ $loop->remaining }}</p>
    <p>总数: {{ $loop->count }}</p>

    @if($loop->last)
        <p>这是最后一项</p>
    @endif
@endforeach

{{-- switch 语句 --}}
@switch($role)
    @case('admin')
        <p>管理员面板</p>
        @break
    @case('user')
        <p>用户面板</p>
        @break
    @default
        <p>访客面板</p>
@endswitch
```

### 模板继承与组件

布局模板 resources/views/layouts/app.blade.php：

```blade
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', config('app.name'))</title>

    @stack('meta')

    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @stack('styles')
</head>
<body class="@yield('body-class')">
    <header>
        @include('partials.navigation')
    </header>

    <main>
        @hasSection('sidebar')
            <div class="with-sidebar">
                <aside>@yield('sidebar')</aside>
                <div class="content">@yield('content')</div>
            </div>
        @else
            @yield('content')
        @endif
    </main>

    <footer>
        @include('partials.footer')
    </footer>

    <script src="{{ asset('js/app.js') }}"></script>
    @stack('scripts')
</body>
</html>
```

子模板 resources/views/posts/show.blade.php：

```blade
@extends('layouts.app')

@section('title', $post->title . ' - ' . config('app.name'))

@push('meta')
    <meta name="description" content="{{ $post->excerpt }}">
    <meta property="og:title" content="{{ $post->title }}">
@endpush

@section('body-class', 'post-page')

@section('sidebar')
    <div class="author-info">
        <img src="{{ $post->author->avatar }}" alt="{{ $post->author->name }}">
        <h4>{{ $post->author->name }}</h4>
    </div>
@endsection

@section('content')
    <article class="post">
        <h1>{{ $post->title }}</h1>

        <div class="meta">
            <time datetime="{{ $post->published_at->toISOString() }}">
                {{ $post->published_at->format('Y年m月d日') }}
            </time>
            <span>阅读量: {{ $post->views }}</span>
        </div>

        <div class="content">
            {!! $post->content !!}
        </div>

        <div class="tags">
            @foreach($post->tags as $tag)
                <a href="{{ route('tags.show', $tag) }}" class="tag">{{ $tag->name }}</a>
            @endforeach
        </div>
    </article>

    @include('posts.partials.comments', ['comments' => $post->comments])
@endsection

@push('scripts')
    <script src="{{ asset('js/highlight.js') }}"></script>
    <script>hljs.highlightAll();</script>
@endpush
```

### Blade 组件

创建组件：

```bash
php artisan make:component Alert
php artisan make:component Forms/Input
```

组件类 app/View/Components/Alert.php：

```php
<?php

namespace App\View\Components;

use Illuminate\View\Component;

class Alert extends Component
{
    public $type;
    public $message;
    public $dismissible;

    public function __construct($type = 'info', $message = '', $dismissible = false)
    {
        $this->type = $type;
        $this->message = $message;
        $this->dismissible = $dismissible;
    }

    public function alertClass()
    {
        return [
            'info' => 'bg-blue-100 text-blue-800',
            'success' => 'bg-green-100 text-green-800',
            'warning' => 'bg-yellow-100 text-yellow-800',
            'error' => 'bg-red-100 text-red-800',
        ][$this->type] ?? 'bg-gray-100 text-gray-800';
    }

    public function render()
    {
        return view('components.alert');
    }
}
```

组件视图 resources/views/components/alert.blade.php：

```blade
<div {{ $attributes->merge(['class' => 'p-4 rounded-lg ' . $alertClass()]) }}
     role="alert"
     @if($dismissible) x-data="{ show: true }" x-show="show" @endif>

    <div class="flex items-center">
        <div class="flex-grow">
            @if($message)
                {{ $message }}
            @else
                {{ $slot }}
            @endif
        </div>

        @if($dismissible)
            <button @click="show = false" class="ml-4">
                &times;
            </button>
        @endif
    </div>
</div>
```

使用组件：

```blade
{{-- 基础使用 --}}
<x-alert type="success" message="操作成功！" />

{{-- 使用插槽 --}}
<x-alert type="warning" dismissible>
    <strong>警告！</strong> 这是一条警告信息。
</x-alert>

{{-- 传递属性 --}}
<x-alert type="error" class="mb-4" id="main-alert">
    发生错误，请重试。
</x-alert>

{{-- 命名插槽 --}}
<x-card>
    <x-slot:header>
        <h3>卡片标题</h3>
    </x-slot>

    <p>卡片内容...</p>

    <x-slot:footer>
        <button>确定</button>
    </x-slot>
</x-card>
```

## 认证与授权

### 内置认证系统

Laravel 提供了开箱即用的认证系统：

```bash
# 安装 Laravel Breeze（简单认证）
composer require laravel/breeze --dev
php artisan breeze:install

# 或安装 Laravel Jetstream（完整功能）
composer require laravel/jetstream
php artisan jetstream:install livewire
```

手动认证：

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
     * 用户登录
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended('dashboard');
        }

        return back()->withErrors([
            'email' => '提供的凭据与我们的记录不匹配。',
        ])->onlyInput('email');
    }

    /**
     * 用户注册
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        Auth::login($user);

        return redirect('dashboard');
    }

    /**
     * 用户登出
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

### API 认证（Sanctum）

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

配置 Sanctum：

```php
<?php

// app/Models/User.php
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;
    // ...
}

// API 控制器
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * 用户登录获取 Token
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['提供的凭据不正确。'],
            ]);
        }

        $token = $user->createToken($request->device_name, ['*'])->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * 获取当前用户
     */
    public function user(Request $request)
    {
        return $request->user();
    }

    /**
     * 登出（撤销当前 Token）
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => '已登出']);
    }

    /**
     * 登出所有设备
     */
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => '已从所有设备登出']);
    }
}
```

### 授权（Policy 和 Gate）

定义 Gate：

```php
<?php

// app/Providers/AuthServiceProvider.php
namespace App\Providers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Post::class => PostPolicy::class,
    ];

    public function boot()
    {
        // 定义 Gate
        Gate::define('access-admin', function (User $user) {
            return $user->role === 'admin';
        });

        Gate::define('update-post', function (User $user, Post $post) {
            return $user->id === $post->author_id;
        });

        // 超级管理员绕过所有检查
        Gate::before(function (User $user, $ability) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });
    }
}
```

创建 Policy：

```bash
php artisan make:policy PostPolicy --model=Post
```

```php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * 查看任意文章
     */
    public function viewAny(User $user)
    {
        return true;
    }

    /**
     * 查看单篇文章
     */
    public function view(User $user, Post $post)
    {
        if ($post->status === 'published') {
            return true;
        }

        return $user->id === $post->author_id;
    }

    /**
     * 创建文章
     */
    public function create(User $user)
    {
        return $user->hasVerifiedEmail();
    }

    /**
     * 更新文章
     */
    public function update(User $user, Post $post)
    {
        return $user->id === $post->author_id;
    }

    /**
     * 删除文章
     */
    public function delete(User $user, Post $post)
    {
        return $user->id === $post->author_id || $user->role === 'admin';
    }

    /**
     * 恢复软删除的文章
     */
    public function restore(User $user, Post $post)
    {
        return $user->id === $post->author_id;
    }

    /**
     * 永久删除文章
     */
    public function forceDelete(User $user, Post $post)
    {
        return $user->role === 'admin';
    }
}
```

使用授权：

```php
<?php

// 在控制器中
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);
    // 或
    Gate::authorize('update-post', $post);

    // 更新逻辑...
}

// 使用 Gate
if (Gate::allows('update-post', $post)) {
    // 可以更新
}

if (Gate::denies('update-post', $post)) {
    // 不可以更新
}

// 通过用户模型
if ($request->user()->can('update', $post)) {
    // 可以更新
}
```

在 Blade 中使用授权：

```blade
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">编辑</a>
@endcan

@cannot('delete', $post)
    <p>你没有权限删除此文章</p>
@endcannot

@canany(['update', 'delete'], $post)
    <div class="actions">
        {{-- 显示操作按钮 --}}
    </div>
@endcanany
```

## 队列系统

### 配置队列

```php
<?php

// config/queue.php
return [
    'default' => env('QUEUE_CONNECTION', 'sync'),

    'connections' => [
        'sync' => [
            'driver' => 'sync',
        ],

        'database' => [
            'driver' => 'database',
            'table' => 'jobs',
            'queue' => 'default',
            'retry_after' => 90,
        ],

        'redis' => [
            'driver' => 'redis',
            'connection' => 'default',
            'queue' => env('REDIS_QUEUE', 'default'),
            'retry_after' => 90,
            'block_for' => null,
        ],
    ],

    'failed' => [
        'driver' => env('QUEUE_FAILED_DRIVER', 'database-uuids'),
        'database' => env('DB_CONNECTION', 'mysql'),
        'table' => 'failed_jobs',
    ],
];
```

### 创建任务

```bash
php artisan make:job ProcessPodcast
```

```php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessPodcast implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;           // 最大尝试次数
    public $maxExceptions = 3;   // 最大异常次数
    public $timeout = 120;       // 超时时间（秒）
    public $backoff = [10, 30, 60]; // 重试间隔

    protected $podcast;

    public function __construct(Podcast $podcast)
    {
        $this->podcast = $podcast;
    }

    /**
     * 唯一任务标识符
     */
    public function uniqueId()
    {
        return $this->podcast->id;
    }

    /**
     * 执行任务
     */
    public function handle(AudioProcessor $processor)
    {
        Log::info("开始处理播客: {$this->podcast->id}");

        try {
            // 处理音频
            $result = $processor->process($this->podcast->audio_path);

            // 更新播客状态
            $this->podcast->update([
                'status' => 'processed',
                'duration' => $result['duration'],
                'processed_at' => now(),
            ]);

            Log::info("播客处理完成: {$this->podcast->id}");

        } catch (\Exception $e) {
            Log::error("播客处理失败: {$this->podcast->id}", [
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * 任务失败处理
     */
    public function failed(\Throwable $exception)
    {
        Log::error("播客处理最终失败: {$this->podcast->id}", [
            'error' => $exception->getMessage()
        ]);

        $this->podcast->update(['status' => 'failed']);

        // 发送通知
        $this->podcast->author->notify(new PodcastProcessingFailed($this->podcast));
    }

    /**
     * 任务中间件
     */
    public function middleware()
    {
        return [
            new \Illuminate\Queue\Middleware\RateLimited('podcasts'),
            new \Illuminate\Queue\Middleware\WithoutOverlapping($this->podcast->id),
        ];
    }
}
```

### 分发任务

```php
<?php

use App\Jobs\ProcessPodcast;
use App\Jobs\SendEmail;

// 基础分发
ProcessPodcast::dispatch($podcast);

// 延迟分发
ProcessPodcast::dispatch($podcast)->delay(now()->addMinutes(10));

// 指定队列
ProcessPodcast::dispatch($podcast)->onQueue('podcasts');

// 指定连接
ProcessPodcast::dispatch($podcast)->onConnection('redis');

// 条件分发
ProcessPodcast::dispatchIf($shouldProcess, $podcast);
ProcessPodcast::dispatchUnless($isDisabled, $podcast);

// 同步分发（不入队，立即执行）
ProcessPodcast::dispatchSync($podcast);

// 任务链
Bus::chain([
    new ProcessPodcast($podcast),
    new OptimizeAudio($podcast),
    new PublishPodcast($podcast),
])->onQueue('podcasts')->dispatch();

// 任务批处理
$batch = Bus::batch([
    new ProcessImage($image1),
    new ProcessImage($image2),
    new ProcessImage($image3),
])->then(function (Batch $batch) {
    // 所有任务成功完成
})->catch(function (Batch $batch, \Throwable $e) {
    // 首次任务失败时调用
})->finally(function (Batch $batch) {
    // 批处理完成时调用
})->dispatch();

// 闭包任务
dispatch(function () use ($user) {
    Mail::to($user)->send(new WelcomeMail());
});
```

### 运行队列

```bash
# 运行队列工作进程
php artisan queue:work

# 指定连接和队列
php artisan queue:work redis --queue=high,default,low

# 限制内存和超时
php artisan queue:work --memory=128 --timeout=60

# 处理单个任务
php artisan queue:work --once

# 失败任务管理
php artisan queue:failed
php artisan queue:retry all
php artisan queue:retry 5
php artisan queue:forget 5
php artisan queue:flush
```

Supervisor 配置：

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=8
redirect_stderr=true
stdout_logfile=/var/www/app/storage/logs/worker.log
stopwaitsecs=3600
```

## 任务调度

### 定义调度任务

```php
<?php

// app/Console/Kernel.php
namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\ProcessDailyReport;
use App\Console\Commands\CleanupOldRecords;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule)
    {
        // 调度 Artisan 命令
        $schedule->command('emails:send --force')
            ->daily()
            ->at('08:00')
            ->emailOutputTo('admin@example.com');

        // 调度闭包
        $schedule->call(function () {
            DB::table('recent_users')->delete();
        })->weekly()->sundays()->at('00:00');

        // 调度任务类
        $schedule->job(new ProcessDailyReport)->dailyAt('01:00');
        $schedule->job(new ProcessDailyReport, 'reports', 'redis')->dailyAt('01:00');

        // 调度频率选项
        $schedule->command('report:generate')
            ->everyMinute()
            ->everyFiveMinutes()
            ->everyTenMinutes()
            ->everyFifteenMinutes()
            ->everyThirtyMinutes()
            ->hourly()
            ->hourlyAt(17)
            ->daily()
            ->dailyAt('13:00')
            ->twiceDaily(1, 13)
            ->weekly()
            ->weeklyOn(1, '8:00')
            ->monthly()
            ->monthlyOn(4, '15:00')
            ->quarterly()
            ->yearly()
            ->yearlyOn(6, 1, '17:00');

        // 限制条件
        $schedule->command('emails:send')
            ->daily()
            ->when(function () {
                return true; // 条件为真时执行
            })
            ->skip(function () {
                return false; // 条件为真时跳过
            })
            ->environments(['production', 'staging']);

        // 避免任务重叠
        $schedule->command('emails:send')
            ->withoutOverlapping()
            ->runInBackground();

        // 单服务器执行（需要缓存驱动）
        $schedule->command('report:generate')
            ->onOneServer()
            ->daily();

        // 维护模式下执行
        $schedule->command('emails:send')
            ->evenInMaintenanceMode();

        // 任务钩子
        $schedule->command('emails:send')
            ->daily()
            ->before(function () {
                Log::info('任务即将开始');
            })
            ->after(function () {
                Log::info('任务已完成');
            })
            ->onSuccess(function () {
                Log::info('任务成功');
            })
            ->onFailure(function () {
                Log::error('任务失败');
            });
    }

    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}
```

### 创建 Artisan 命令

```bash
php artisan make:command SendDailyReport
```

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Mail\DailyReportMail;
use Illuminate\Support\Facades\Mail;

class SendDailyReport extends Command
{
    /**
     * 命令签名
     */
    protected $signature = 'report:daily
                            {--users=* : 指定用户ID}
                            {--force : 强制发送}
                            {--dry-run : 模拟运行}';

    /**
     * 命令描述
     */
    protected $description = '发送每日报告邮件给所有用户';

    /**
     * 执行命令
     */
    public function handle()
    {
        $this->info('开始发送每日报告...');

        $userIds = $this->option('users');
        $query = User::query();

        if (!empty($userIds)) {
            $query->whereIn('id', $userIds);
        }

        $users = $query->where('subscribed', true)->get();

        if ($users->isEmpty()) {
            $this->warn('没有找到订阅用户');
            return Command::SUCCESS;
        }

        $this->output->progressStart($users->count());

        foreach ($users as $user) {
            if ($this->option('dry-run')) {
                $this->line("将发送报告给: {$user->email}");
            } else {
                Mail::to($user)->send(new DailyReportMail($user));
            }

            $this->output->progressAdvance();
        }

        $this->output->progressFinish();

        $this->newLine();
        $this->info("成功发送 {$users->count()} 封报告邮件");

        return Command::SUCCESS;
    }
}
```

运行调度器：

```bash
# 本地测试
php artisan schedule:run

# Cron 配置（生产环境）
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## 部署与优化

### 部署清单

```bash
# 克隆代码
git clone https://github.com/your-repo.git
cd your-repo

# 安装依赖
composer install --optimize-autoloader --no-dev

# 配置环境
cp .env.example .env
php artisan key:generate

# 配置文件缓存
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 数据库迁移
php artisan migrate --force

# 设置权限
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# 重启队列工作进程
php artisan queue:restart

# 清除旧缓存
php artisan cache:clear
php artisan optimize:clear
```

### 性能优化

```php
<?php

// 1. 使用 Eager Loading 避免 N+1 问题
// 错误方式
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name; // 每次循环都查询
}

// 正确方式
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name; // 不会额外查询
}

// 2. 数据库查询优化
// 只选择需要的字段
$users = User::select('id', 'name', 'email')->get();

// 使用 chunk 处理大量数据
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // 处理用户
    }
});

// 3. 缓存查询结果
$posts = Cache::remember('popular_posts', 3600, function () {
    return Post::where('views', '>', 1000)
               ->orderBy('views', 'desc')
               ->take(10)
               ->get();
});

// 4. 使用数据库索引
Schema::table('posts', function (Blueprint $table) {
    $table->index('author_id');
    $table->index(['status', 'published_at']);
    $table->fullText('title');
});

// 5. 队列优化
// 使用 Redis 或 SQS 替代数据库队列
// 配置合适的重试策略和超时时间
```

### Nginx 配置

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.com;
    root /var/www/example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2?)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Gzip 压缩
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_vary on;
    gzip_types
        application/javascript
        application/json
        application/xml
        text/css
        text/plain
        text/xml;
}
```

### Docker 部署

Dockerfile:

```dockerfile
FROM php:8.2-fpm-alpine

# 安装依赖
RUN apk add --no-cache \
    nginx \
    supervisor \
    libpng-dev \
    libzip-dev \
    && docker-php-ext-install pdo_mysql gd zip opcache

# 安装 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 复制应用代码
COPY . .

# 安装 PHP 依赖
RUN composer install --optimize-autoloader --no-dev

# 设置权限
RUN chown -R www-data:www-data storage bootstrap/cache

# 配置文件
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/php.ini

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
```

docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - DB_HOST=db
      - REDIS_HOST=redis
      - QUEUE_CONNECTION=redis
    depends_on:
      - db
      - redis
    volumes:
      - ./storage:/var/www/html/storage

  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: laravel
      MYSQL_ROOT_PASSWORD: secret
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  queue:
    build: .
    command: php artisan queue:work --tries=3
    depends_on:
      - db
      - redis
    environment:
      - APP_ENV=production
      - DB_HOST=db
      - REDIS_HOST=redis

  scheduler:
    build: .
    command: sh -c "while true; do php artisan schedule:run; sleep 60; done"
    depends_on:
      - db
      - redis

volumes:
  mysql_data:
  redis_data:
```

## 面试要点

### 基础概念题

**Q1: 解释 Laravel 的服务容器和依赖注入**

A: 服务容器是 Laravel 的核心，负责管理类的依赖关系：
- 服务容器是一个IoC（控制反转）容器
- 支持自动解析依赖（通过类型提示）
- 可以通过 bind、singleton 等方法绑定接口与实现
- 支持上下文绑定，为不同类提供不同实现

**Q2: Eloquent ORM 中如何避免 N+1 查询问题？**

A: 使用 Eager Loading（预加载）：
```php
// 使用 with 预加载
$posts = Post::with(['author', 'comments'])->get();

// 嵌套预加载
$posts = Post::with('author.profile')->get();

// 条件预加载
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true);
}])->get();
```

**Q3: Laravel 中间件的执行顺序是怎样的？**

A: 中间件形成"洋葱模型"：
1. 请求首先经过全局中间件
2. 然后经过路由中间件组
3. 最后经过路由特定中间件
4. 到达控制器后，响应按相反顺序返回

### 进阶实践题

**Q4: 如何实现 Laravel 中的事件监听？**

```php
// 定义事件
class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(public Order $order) {}
}

// 定义监听器
class SendOrderConfirmation implements ShouldQueue
{
    public function handle(OrderPlaced $event)
    {
        Mail::to($event->order->user)->send(new OrderConfirmationMail($event->order));
    }
}

// 注册事件监听（EventServiceProvider）
protected $listen = [
    OrderPlaced::class => [
        SendOrderConfirmation::class,
        UpdateInventory::class,
    ],
];

// 触发事件
event(new OrderPlaced($order));
// 或
OrderPlaced::dispatch($order);
```

**Q5: 如何实现 API 速率限制？**

```php
// 在 RouteServiceProvider 中定义限流器
protected function configureRateLimiting()
{
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
    });

    RateLimiter::for('uploads', function (Request $request) {
        return $request->user()->isPremium()
            ? Limit::none()
            : Limit::perMinute(10)->response(function () {
                return response('上传频率过高', 429);
            });
    });
}

// 应用到路由
Route::middleware('throttle:api')->group(function () {
    Route::get('/posts', [PostController::class, 'index']);
});
```

**Q6: 如何优化 Laravel 应用的性能？**

A: 关键优化策略：
1. **配置缓存**：php artisan config:cache
2. **路由缓存**：php artisan route:cache
3. **视图缓存**：php artisan view:cache
4. **Composer 优化**：composer install --optimize-autoloader --no-dev
5. **数据库优化**：添加索引、使用 Eager Loading、查询缓存
6. **队列处理**：将耗时任务放入队列
7. **使用 Redis**：缓存、会话、队列
8. **OPcache**：启用 PHP OPcache

## 总结

Laravel 作为 PHP 领域最流行的框架，提供了完整的 Web 开发解决方案。通过本文的学习，你应该掌握了：

1. Laravel 的架构设计和核心概念
2. 路由系统和中间件的使用
3. Eloquent ORM 的高级用法
4. Blade 模板引擎和组件开发
5. 认证和授权的实现方式
6. 队列系统和任务调度
7. 部署和性能优化技巧

建议在实际项目中多加练习，结合官方文档深入理解各个特性，逐步成为 Laravel 开发专家。

## 参考资源

- [Laravel 官方文档](https://laravel.com/docs)
- [Laravel News](https://laravel-news.com/)
- [Laracasts](https://laracasts.com/)
- [Laravel Daily](https://laraveldaily.com/)
- [Laravel GitHub 仓库](https://github.com/laravel/laravel)
