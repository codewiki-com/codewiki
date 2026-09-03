---
title: Laravel中间件
description: 深入理解Laravel中间件机制，掌握中间件的创建、注册、分组和参数传递
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - Middleware
  - HTTP
status: imported
origin: old/src/content/docs/php/middleware.zh.md
divergence: 0.22
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: Web框架
  order: 4
  lastUpdated: 2026-01-07
---

中间件（Middleware）是Laravel框架中最强大的特性之一，它提供了一种便捷的机制来过滤进入应用程序的HTTP请求。通过中间件，你可以在请求到达控制器之前或响应返回客户端之前执行各种操作。

## 概念解释

### 什么是中间件？

中间件是一种"洋葱模型"的请求处理机制，每个HTTP请求都必须经过一系列中间件的层层过滤，才能最终到达应用程序的核心处理逻辑。同样，响应也需要反向穿过这些中间件层才能返回给客户端。

中间件的典型应用场景包括：

- **认证（Authentication）**：验证用户是否已登录
- **授权（Authorization）**：检查用户是否有权限访问资源
- **日志记录（Logging）**：记录请求和响应信息
- **CORS处理**：添加跨域资源共享响应头
- **请求修改**：转换或验证请求数据
- **响应修改**：压缩响应、添加响应头
- **限流（Rate Limiting）**：限制API请求频率
- **维护模式**：在应用维护期间返回统一响应

### 中间件的历史演进

中间件的概念最早来源于软件工程中的"管道和过滤器"架构模式。在Web开发领域，中间件模式被广泛采用，如Node.js的Express框架、Python的Django等。Laravel从2.0版本开始引入中间件机制，在Laravel 5.0中进行了重大重构，形成了现在成熟的中间件系统。

## 核心原理

### 请求生命周期中的中间件

Laravel应用的请求生命周期如下：

```
客户端请求
    ↓
public/index.php
    ↓
Bootstrap（引导程序）
    ↓
HTTP Kernel
    ↓
全局中间件（依次执行）
    ↓
路由匹配
    ↓
路由/控制器中间件
    ↓
控制器方法
    ↓
响应生成
    ↓
中间件（逆序执行后置逻辑）
    ↓
返回响应给客户端
```

### 中间件的执行机制

Laravel使用管道（Pipeline）模式来实现中间件的链式调用。核心实现在`Illuminate\Pipeline\Pipeline`类中：

```php
<?php
// 简化的管道实现原理
class Pipeline
{
    protected $passable;
    protected $pipes = [];

    public function send($passable)
    {
        $this->passable = $passable;
        return $this;
    }

    public function through($pipes)
    {
        $this->pipes = is_array($pipes) ? $pipes : func_get_args();
        return $this;
    }

    public function then(Closure $destination)
    {
        $pipeline = array_reduce(
            array_reverse($this->pipes),
            $this->carry(),
            $this->prepareDestination($destination)
        );

        return $pipeline($this->passable);
    }

    protected function carry()
    {
        return function ($stack, $pipe) {
            return function ($passable) use ($stack, $pipe) {
                // 调用中间件的handle方法
                return $pipe->handle($passable, $stack);
            };
        };
    }
}
```

### 洋葱模型详解

中间件采用"洋葱模型"执行，这意味着：

1. 请求从外层中间件向内层传递（前置逻辑）
2. 到达核心处理后，响应从内层向外层返回（后置逻辑）

```
请求 → [Middleware A] → [Middleware B] → [Middleware C] → 控制器
响应 ← [Middleware A] ← [Middleware B] ← [Middleware C] ← 控制器
```

```php
<?php
// 中间件执行顺序示例
class LogMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. 前置逻辑：请求到达时执行
        Log::info('请求开始: ' . $request->path());

        // 2. 调用下一个中间件
        $response = $next($request);

        // 3. 后置逻辑：响应返回时执行
        Log::info('请求结束，状态码: ' . $response->getStatusCode());

        return $response;
    }
}
```

## 核心要点

### 中间件的基本结构

每个中间件必须实现`handle`方法：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExampleMiddleware
{
    /**
     * 处理传入的请求
     *
     * @param  Request  $request  当前HTTP请求
     * @param  Closure  $next     下一个中间件的闭包
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 前置逻辑

        $response = $next($request);

        // 后置逻辑

        return $response;
    }
}
```

### 中间件的三种类型

1. **全局中间件**：对所有请求生效
2. **路由中间件**：只对特定路由生效
3. **中间件组**：一组相关中间件的集合

### 中间件的注册位置

在Laravel 11+中，中间件在`bootstrap/app.php`中注册：

```php
<?php
// bootstrap/app.php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // 注册全局中间件
        $middleware->append(\App\Http\Middleware\LogRequests::class);

        // 注册路由中间件别名
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);

        // 注册中间件组
        $middleware->group('api', [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        ]);
    })
    ->create();
```

在Laravel 10及之前版本中，中间件在`app/Http/Kernel.php`中注册：

```php
<?php
// app/Http/Kernel.php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * 全局HTTP中间件栈
     * 这些中间件会在每个请求时执行
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
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
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'signed' => \Illuminate\Routing\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
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
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];
}
```

## 代码示例

### 创建中间件

使用Artisan命令创建中间件：

```bash
# 创建基本中间件
php artisan make:middleware CheckAge

# 创建中间件到指定目录
php artisan make:middleware Admin/EnsureUserIsAdmin
```

生成的中间件文件：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAge
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->age <= 18) {
            return redirect('home')->with('error', '您必须年满18岁');
        }

        return $next($request);
    }
}
```

### 前置中间件与后置中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// 前置中间件：在请求处理之前执行逻辑
class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 在请求到达控制器之前执行
        $this->validateRequest($request);

        return $next($request);
    }

    private function validateRequest(Request $request): void
    {
        // 验证逻辑
    }
}

// 后置中间件：在响应返回之后执行逻辑
class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 在响应返回给客户端之前执行
        $response->headers->set('X-Response-Time', microtime(true));

        return $response;
    }
}

// 混合中间件：前后都有逻辑
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 前置：记录开始时间
        $startTime = microtime(true);

        $response = $next($request);

        // 后置：计算并添加响应时间
        $duration = microtime(true) - $startTime;
        $response->headers->set('X-Response-Time', round($duration * 1000, 2) . 'ms');

        return $response;
    }
}
```

### 注册全局中间件

```php
<?php
// bootstrap/app.php (Laravel 11+)

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // 在全局中间件栈末尾添加
        $middleware->append([
            \App\Http\Middleware\LogRequests::class,
            \App\Http\Middleware\MeasureResponseTime::class,
        ]);

        // 在全局中间件栈开头添加
        $middleware->prepend([
            \App\Http\Middleware\TrustProxies::class,
        ]);

        // 移除特定的全局中间件
        $middleware->remove([
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
        ]);
    })
    ->create();
```

### 路由中间件

```php
<?php
// routes/web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;

// 单个中间件
Route::get('/profile', [ProfileController::class, 'show'])
    ->middleware('auth');

// 多个中间件
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin']);

// 排除中间件
Route::middleware(['auth'])->group(function () {
    Route::get('/account', [AccountController::class, 'show']);

    // 这个路由不使用auth中间件
    Route::get('/public-info', [InfoController::class, 'show'])
        ->withoutMiddleware(['auth']);
});

// 路由组使用中间件
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/settings', [AdminController::class, 'settings']);
    Route::get('/logs', [AdminController::class, 'logs']);
});

// 控制器中定义中间件
Route::get('/posts', [PostController::class, 'index']);
```

### 控制器中间件

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PostController extends Controller implements HasMiddleware
{
    /**
     * 获取控制器的中间件
     */
    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('admin', only: ['create', 'store', 'destroy']),
            new Middleware('throttle:60,1', except: ['index', 'show']),
        ];
    }

    public function index()
    {
        // 公开访问，需要auth
    }

    public function show($id)
    {
        // 公开访问，需要auth
    }

    public function create()
    {
        // 需要auth + admin
    }

    public function store()
    {
        // 需要auth + admin + throttle
    }

    public function destroy($id)
    {
        // 需要auth + admin + throttle
    }
}
```

Laravel 10及之前版本的控制器中间件写法：

```php
<?php

namespace App\Http\Controllers;

class PostController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->only(['create', 'store', 'destroy']);
        $this->middleware('throttle:60,1')->except(['index', 'show']);
    }
}
```

### 中间件组

```php
<?php
// bootstrap/app.php (Laravel 11+)

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // 自定义中间件组
        $middleware->group('admin', [
            'auth',
            \App\Http\Middleware\EnsureUserIsAdmin::class,
            \App\Http\Middleware\LogAdminActions::class,
        ]);

        // 向现有组添加中间件
        $middleware->appendToGroup('web', [
            \App\Http\Middleware\LocaleMiddleware::class,
        ]);

        $middleware->prependToGroup('api', [
            \App\Http\Middleware\ApiVersion::class,
        ]);
    })
    ->create();
```

使用中间件组：

```php
<?php
// routes/web.php

// 使用自定义中间件组
Route::middleware('admin')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::resource('users', AdminUserController::class);
});
```

### 中间件参数

中间件可以接收额外的参数：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * 处理请求
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string   ...$roles  可变参数，接收多个角色
     * @return Response
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        abort(403, '您没有权限访问此资源');
    }
}
```

注册并使用带参数的中间件：

```php
<?php
// bootstrap/app.php
$middleware->alias([
    'role' => \App\Http\Middleware\EnsureUserHasRole::class,
]);

// routes/web.php
// 单个参数
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('role:admin');

// 多个参数（逗号分隔）
Route::get('/editor', [EditorController::class, 'index'])
    ->middleware('role:admin,editor');

// 多个参数的另一种写法
Route::get('/manager', [ManagerController::class, 'index'])
    ->middleware('role:admin,manager,supervisor');
```

### 高级参数示例：缓存中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CacheResponse
{
    /**
     * @param  Request  $request
     * @param  Closure  $next
     * @param  int      $minutes  缓存时间（分钟）
     * @param  string   $prefix   缓存键前缀
     * @return Response
     */
    public function handle(
        Request $request,
        Closure $next,
        int $minutes = 60,
        string $prefix = 'response'
    ): Response {
        // 只缓存GET请求
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        $cacheKey = $prefix . ':' . sha1($request->fullUrl());

        // 尝试从缓存获取
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response($cachedResponse['content'])
                ->withHeaders($cachedResponse['headers'])
                ->header('X-Cache', 'HIT');
        }

        // 执行请求
        $response = $next($request);

        // 只缓存成功的响应
        if ($response->isSuccessful()) {
            Cache::put($cacheKey, [
                'content' => $response->getContent(),
                'headers' => $response->headers->all(),
            ], now()->addMinutes($minutes));

            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }
}

// 使用示例
Route::get('/api/articles', [ArticleController::class, 'index'])
    ->middleware('cache:30,articles');  // 缓存30分钟，前缀为articles
```

### 可终止中间件

可终止中间件在响应发送到浏览器之后执行，适合进行日志记录、统计等不影响响应的操作：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogRequestAndResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        // 给请求添加唯一标识
        $request->attributes->set('request_id', uniqid('req_'));

        return $next($request);
    }

    /**
     * 在响应发送到浏览器之后执行
     * 这不会影响响应时间
     */
    public function terminate(Request $request, Response $response): void
    {
        $requestId = $request->attributes->get('request_id');

        Log::channel('requests')->info('Request completed', [
            'request_id' => $requestId,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'user_id' => $request->user()?->id,
            'status' => $response->getStatusCode(),
            'duration' => microtime(true) - LARAVEL_START,
        ]);
    }
}
```

### 完整的认证中间件示例

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    /**
     * 认证中间件
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string   ...$guards  认证守卫
     * @return Response
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        // 如果没有指定守卫，使用默认守卫
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // 设置当前使用的守卫
                Auth::shouldUse($guard);
                return $next($request);
            }
        }

        // 未认证
        return $this->unauthenticated($request, $guards);
    }

    /**
     * 处理未认证的请求
     */
    protected function unauthenticated(Request $request, array $guards): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => '未经授权的访问',
                'error' => 'Unauthenticated',
            ], 401);
        }

        return redirect()->guest(route('login'));
    }
}
```

### API版本控制中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiVersion
{
    /**
     * 处理API版本
     */
    public function handle(Request $request, Closure $next, string $defaultVersion = 'v1'): Response
    {
        // 从请求头获取API版本
        $version = $request->header('X-API-Version')
            ?? $request->header('Accept-Version')
            ?? $request->query('api_version')
            ?? $defaultVersion;

        // 验证版本格式
        if (!preg_match('/^v\d+$/', $version)) {
            return response()->json([
                'error' => 'Invalid API version format',
                'message' => 'API version should be in format: v1, v2, etc.',
            ], 400);
        }

        // 检查版本是否支持
        $supportedVersions = config('api.supported_versions', ['v1', 'v2']);
        if (!in_array($version, $supportedVersions)) {
            return response()->json([
                'error' => 'Unsupported API version',
                'message' => "Supported versions: " . implode(', ', $supportedVersions),
            ], 400);
        }

        // 将版本信息添加到请求
        $request->attributes->set('api_version', $version);

        $response = $next($request);

        // 在响应头中返回使用的版本
        $response->headers->set('X-API-Version', $version);

        return $response;
    }
}
```

### CORS中间件

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Cors
{
    /**
     * 允许的源
     */
    protected array $allowedOrigins = [
        'http://localhost:3000',
        'https://example.com',
    ];

    /**
     * 允许的方法
     */
    protected array $allowedMethods = [
        'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'
    ];

    /**
     * 允许的请求头
     */
    protected array $allowedHeaders = [
        'Content-Type',
        'X-Requested-With',
        'Authorization',
        'Accept',
        'Origin',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // 处理预检请求
        if ($request->isMethod('OPTIONS')) {
            return $this->handlePreflightRequest($request);
        }

        $response = $next($request);

        return $this->addCorsHeaders($request, $response);
    }

    /**
     * 处理预检请求
     */
    protected function handlePreflightRequest(Request $request): Response
    {
        $response = response('', 204);
        return $this->addCorsHeaders($request, $response);
    }

    /**
     * 添加CORS响应头
     */
    protected function addCorsHeaders(Request $request, Response $response): Response
    {
        $origin = $request->header('Origin');

        // 检查源是否被允许
        if ($origin && in_array($origin, $this->allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        $response->headers->set(
            'Access-Control-Allow-Methods',
            implode(', ', $this->allowedMethods)
        );

        $response->headers->set(
            'Access-Control-Allow-Headers',
            implode(', ', $this->allowedHeaders)
        );

        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');

        return $response;
    }
}
```

## 最佳实践

### 单一职责原则

每个中间件应该只负责一个功能：

```php
<?php
// 好的做法：分离关注点

// 认证中间件 - 只负责认证
class Authenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return redirect()->route('login');
        }
        return $next($request);
    }
}

// 授权中间件 - 只负责授权
class EnsureUserIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()->isAdmin()) {
            abort(403);
        }
        return $next($request);
    }
}

// 日志中间件 - 只负责日志
class LogRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('Request: ' . $request->path());
        return $next($request);
    }
}

// 不好的做法：一个中间件做太多事情
class DoEverything
{
    public function handle(Request $request, Closure $next): Response
    {
        // 认证
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // 授权
        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        // 日志
        Log::info('Request: ' . $request->path());

        // 限流
        // ...

        return $next($request);
    }
}
```

### 合理使用中间件组

将相关的中间件组织成组，便于管理：

```php
<?php
// bootstrap/app.php

$middleware->group('api.public', [
    'throttle:60,1',
    \App\Http\Middleware\SetLocale::class,
]);

$middleware->group('api.authenticated', [
    'auth:sanctum',
    'throttle:120,1',
    \App\Http\Middleware\SetLocale::class,
    \App\Http\Middleware\LogApiRequest::class,
]);

$middleware->group('api.admin', [
    'auth:sanctum',
    \App\Http\Middleware\EnsureUserIsAdmin::class,
    'throttle:30,1',
    \App\Http\Middleware\LogAdminActions::class,
]);
```

### 中间件的执行顺序

注意中间件的注册顺序，某些中间件必须在其他中间件之前执行：

```php
<?php
// 正确的顺序
$middleware->web(prepend: [
    \App\Http\Middleware\TrustProxies::class,      // 1. 信任代理（最先）
]);

$middleware->web(append: [
    \App\Http\Middleware\EncryptCookies::class,    // 2. 加密Cookie
    \App\Http\Middleware\StartSession::class,      // 3. 启动Session（需要Cookie）
    \App\Http\Middleware\Authenticate::class,      // 4. 认证（需要Session）
]);
```

### 避免在中间件中进行复杂的业务逻辑

```php
<?php
// 好的做法：中间件只做过滤和转换
class EnsureUserHasSubscription
{
    public function __construct(
        private SubscriptionService $subscriptionService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->subscriptionService->isActive($request->user())) {
            return redirect()->route('subscription.expired');
        }

        return $next($request);
    }
}

// 不好的做法：在中间件中处理业务逻辑
class ProcessSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // 不应该在这里处理订阅续费逻辑
        if ($user->subscription->isExpiring()) {
            $user->subscription->renew();
            $user->notify(new SubscriptionRenewed());
        }

        return $next($request);
    }
}
```

### 使用依赖注入

通过构造函数注入依赖，而不是直接使用Facade：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Response;

class Authenticate
{
    public function __construct(
        protected AuthFactory $auth,
        protected LoggerInterface $logger
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        if (!$this->auth->check()) {
            $this->logger->warning('Unauthenticated access attempt', [
                'ip' => $request->ip(),
                'path' => $request->path(),
            ]);

            return redirect()->route('login');
        }

        return $next($request);
    }
}
```

## 常见陷阱

### 忘记调用 $next()

```php
<?php
// 错误：忘记调用 $next()
class BrokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->isAdmin()) {
            // 错误：没有返回 $next($request)
            // 请求会被阻塞在这里
        }

        return response('Forbidden', 403);
    }
}

// 正确的做法
class CorrectMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()->isAdmin()) {
            return response('Forbidden', 403);
        }

        return $next($request);  // 始终调用 $next()
    }
}
```

### 错误的中间件顺序

```php
<?php
// 问题：Session中间件在认证中间件之后
// 认证中间件无法访问session数据
$middlewareGroups = [
    'web' => [
        \App\Http\Middleware\Authenticate::class,  // 需要session
        \Illuminate\Session\Middleware\StartSession::class,  // 太晚了！
    ],
];

// 正确的顺序
$middlewareGroups = [
    'web' => [
        \Illuminate\Session\Middleware\StartSession::class,  // 先启动session
        \App\Http\Middleware\Authenticate::class,  // 然后认证
    ],
];
```

### 在中间件中抛出未处理的异常

```php
<?php
// 问题：未处理的异常会导致应用崩溃
class UnsafeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $data = json_decode($request->getContent(), true);
        // 如果JSON无效，会抛出异常
        $this->processData($data);

        return $next($request);
    }
}

// 正确的做法：优雅地处理异常
class SafeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
            $this->processData($data);
        } catch (\JsonException $e) {
            return response()->json([
                'error' => 'Invalid JSON format',
            ], 400);
        }

        return $next($request);
    }
}
```

### 修改响应但忘记返回

```php
<?php
// 错误：修改了响应但返回了原始响应
class BrokenAfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 错误：这里创建了新响应但没有返回
        $response->headers->set('X-Custom-Header', 'value');

        return $next($request);  // 返回了新的响应，之前的修改丢失
    }
}

// 正确的做法
class CorrectAfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Custom-Header', 'value');

        return $response;  // 返回修改后的响应
    }
}
```

### 在terminate方法中依赖请求数据

```php
<?php
// 问题：terminate时某些请求数据可能不可用
class ProblematicMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // 问题：在某些情况下，$request->user() 可能为null
        Log::info('User: ' . $request->user()->id);
    }
}

// 正确的做法：在handle中保存需要的数据
class SafeTerminatingMiddleware
{
    protected ?int $userId = null;

    public function handle(Request $request, Closure $next): Response
    {
        // 在handle中保存需要的数据
        $this->userId = $request->user()?->id;

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        Log::info('User ID: ' . ($this->userId ?? 'guest'));
    }
}
```

### 中间件中的内存泄漏

```php
<?php
// 问题：在单例中间件中存储请求特定的数据
class MemoryLeakMiddleware
{
    // 这个数组会在所有请求中累积
    protected array $logs = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->logs[] = [
            'time' => now(),
            'path' => $request->path(),
        ];

        return $next($request);
    }
}

// 正确的做法：不要在中间件中存储请求特定的状态
// 或者在terminate中清理
class CleanMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 使用请求属性存储临时数据
        $request->attributes->set('start_time', microtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $startTime = $request->attributes->get('start_time');
        Log::info('Duration: ' . (microtime(true) - $startTime));
    }
}
```

## 性能考量

### 减少全局中间件数量

全局中间件对每个请求都会执行，应该谨慎添加：

```php
<?php
// 不推荐：将所有中间件都设为全局
$middleware->append([
    \App\Http\Middleware\LogRequests::class,
    \App\Http\Middleware\TrackAnalytics::class,
    \App\Http\Middleware\CompressResponse::class,
    \App\Http\Middleware\AddSecurityHeaders::class,
]);

// 推荐：只将必要的中间件设为全局，其他的按需使用
$middleware->append([
    \App\Http\Middleware\TrustProxies::class,  // 必须全局
]);

// 其他中间件作为路由中间件
$middleware->alias([
    'log' => \App\Http\Middleware\LogRequests::class,
    'analytics' => \App\Http\Middleware\TrackAnalytics::class,
]);
```

### 使用可终止中间件进行耗时操作

```php
<?php
// 不推荐：在handle中进行耗时操作
class SlowMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // 这会增加响应时间
        $this->sendToAnalytics($request, $response);
        $this->updateStatistics($request);

        return $response;
    }
}

// 推荐：使用terminate进行耗时操作
class FastMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    // 在响应发送后执行，不影响用户体验
    public function terminate(Request $request, Response $response): void
    {
        $this->sendToAnalytics($request, $response);
        $this->updateStatistics($request);
    }
}
```

### 缓存中间件的计算结果

```php
<?php

class PermissionMiddleware
{
    public function __construct(
        private PermissionCache $cache
    ) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        $cacheKey = "user:{$user->id}:permission:{$permission}";

        // 使用缓存避免重复的数据库查询
        $hasPermission = $this->cache->remember($cacheKey, 300, function () use ($user, $permission) {
            return $user->hasPermission($permission);
        });

        if (!$hasPermission) {
            abort(403);
        }

        return $next($request);
    }
}
```

### 避免在中间件中进行数据库查询（除非必要）

```php
<?php
// 不推荐：每个请求都查询数据库
class ExpensiveMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 每个请求都会执行这个查询
        $settings = Settings::all();
        config(['app.settings' => $settings]);

        return $next($request);
    }
}

// 推荐：使用缓存
class CachedMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = Cache::remember('app.settings', 3600, function () {
            return Settings::all()->keyBy('key');
        });

        config(['app.settings' => $settings]);

        return $next($request);
    }
}
```

### 使用中间件优先级

Laravel允许设置中间件的优先级，确保关键中间件优先执行：

```php
<?php
// bootstrap/app.php

$middleware->priority([
    \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class,
    \Illuminate\Routing\Middleware\ThrottleRequests::class,
    \Illuminate\Routing\Middleware\ThrottleRequestsWithRedis::class,
    \App\Http\Middleware\Authenticate::class,
    \Illuminate\Session\Middleware\AuthenticateSession::class,
]);
```

## 实战场景

### 场景1：多租户系统

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use App\Services\TenantManager;

class IdentifyTenant
{
    public function __construct(
        private TenantManager $tenantManager
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        // 从子域名识别租户
        $subdomain = $this->extractSubdomain($request);

        if (!$subdomain) {
            abort(404, 'Tenant not found');
        }

        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant || !$tenant->is_active) {
            abort(404, 'Tenant not found or inactive');
        }

        // 设置当前租户
        $this->tenantManager->setTenant($tenant);

        // 切换数据库连接
        config(['database.default' => 'tenant']);
        config(['database.connections.tenant.database' => $tenant->database_name]);

        // 将租户信息添加到请求
        $request->attributes->set('tenant', $tenant);

        $response = $next($request);

        // 添加租户标识到响应头
        $response->headers->set('X-Tenant-ID', $tenant->id);

        return $response;
    }

    private function extractSubdomain(Request $request): ?string
    {
        $host = $request->getHost();
        $parts = explode('.', $host);

        if (count($parts) >= 3) {
            return $parts[0];
        }

        return null;
    }
}
```

### 场景2：API请求限流

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * @param  int  $maxAttempts  最大尝试次数
     * @param  int  $decayMinutes  时间窗口（分钟）
     */
    public function handle(
        Request $request,
        Closure $next,
        int $maxAttempts = 60,
        int $decayMinutes = 1
    ): Response {
        $key = $this->resolveRequestSignature($request);

        if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
            return $this->buildRateLimitResponse($key, $maxAttempts);
        }

        RateLimiter::hit($key, $decayMinutes * 60);

        $response = $next($request);

        return $this->addRateLimitHeaders(
            $response,
            $key,
            $maxAttempts
        );
    }

    /**
     * 生成请求签名
     */
    protected function resolveRequestSignature(Request $request): string
    {
        // 已认证用户使用用户ID
        if ($user = $request->user()) {
            return 'rate_limit:user:' . $user->id;
        }

        // 未认证用户使用IP + User-Agent
        return 'rate_limit:ip:' . sha1(
            $request->ip() . '|' . $request->userAgent()
        );
    }

    /**
     * 构建限流响应
     */
    protected function buildRateLimitResponse(string $key, int $maxAttempts): Response
    {
        $retryAfter = RateLimiter::availableIn($key);

        return response()->json([
            'message' => 'Too Many Attempts.',
            'retry_after' => $retryAfter,
        ], 429)->withHeaders([
            'Retry-After' => $retryAfter,
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => 0,
        ]);
    }

    /**
     * 添加限流响应头
     */
    protected function addRateLimitHeaders(
        Response $response,
        string $key,
        int $maxAttempts
    ): Response {
        $remaining = RateLimiter::remaining($key, $maxAttempts);

        $response->headers->add([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => max(0, $remaining - 1),
        ]);

        return $response;
    }
}
```

### 场景3：请求日志与审计

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\AuditLog;
use Symfony\Component\HttpFoundation\Response;

class AuditLogger
{
    protected array $sensitiveFields = [
        'password',
        'password_confirmation',
        'credit_card',
        'cvv',
        'token',
    ];

    protected ?string $requestId = null;
    protected ?float $startTime = null;
    protected ?array $requestData = null;

    public function handle(Request $request, Closure $next): Response
    {
        $this->requestId = (string) Str::uuid();
        $this->startTime = microtime(true);
        $this->requestData = $this->captureRequestData($request);

        // 添加请求ID到请求和日志上下文
        $request->attributes->set('request_id', $this->requestId);

        $response = $next($request);

        $response->headers->set('X-Request-ID', $this->requestId);

        return $response;
    }

    public function terminate(Request $request, Response $response): void
    {
        $duration = microtime(true) - $this->startTime;

        AuditLog::create([
            'request_id' => $this->requestId,
            'user_id' => $request->user()?->id,
            'method' => $request->method(),
            'path' => $request->path(),
            'query_params' => $request->query(),
            'request_body' => $this->requestData,
            'response_status' => $response->getStatusCode(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'duration_ms' => round($duration * 1000, 2),
            'created_at' => now(),
        ]);
    }

    /**
     * 捕获请求数据，过滤敏感字段
     */
    protected function captureRequestData(Request $request): array
    {
        $data = $request->all();

        return $this->filterSensitiveData($data);
    }

    /**
     * 过滤敏感数据
     */
    protected function filterSensitiveData(array $data): array
    {
        foreach ($data as $key => $value) {
            if (in_array(strtolower($key), $this->sensitiveFields)) {
                $data[$key] = '[FILTERED]';
            } elseif (is_array($value)) {
                $data[$key] = $this->filterSensitiveData($value);
            }
        }

        return $data;
    }
}
```

### 场景4：多语言支持

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    protected array $supportedLocales = ['en', 'zh', 'ja', 'ko', 'fr', 'de'];
    protected string $defaultLocale = 'en';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->determineLocale($request);

        App::setLocale($locale);

        // 将语言设置添加到请求属性
        $request->attributes->set('locale', $locale);

        $response = $next($request);

        // 在响应头中返回使用的语言
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    /**
     * 确定使用的语言
     */
    protected function determineLocale(Request $request): string
    {
        // 1. 检查URL参数
        if ($locale = $request->query('lang')) {
            if ($this->isSupported($locale)) {
                return $locale;
            }
        }

        // 2. 检查请求头
        if ($locale = $request->header('Accept-Language')) {
            $locale = $this->parseAcceptLanguage($locale);
            if ($locale && $this->isSupported($locale)) {
                return $locale;
            }
        }

        // 3. 检查用户偏好（已登录用户）
        if ($user = $request->user()) {
            if ($this->isSupported($user->preferred_locale)) {
                return $user->preferred_locale;
            }
        }

        // 4. 检查Cookie
        if ($locale = $request->cookie('locale')) {
            if ($this->isSupported($locale)) {
                return $locale;
            }
        }

        return $this->defaultLocale;
    }

    protected function isSupported(string $locale): bool
    {
        return in_array($locale, $this->supportedLocales);
    }

    protected function parseAcceptLanguage(string $header): ?string
    {
        $parts = explode(',', $header);
        if (!empty($parts)) {
            $locale = trim(explode(';', $parts[0])[0]);
            return substr($locale, 0, 2);  // 取前两个字符
        }
        return null;
    }
}
```

### 场景5：请求签名验证（Webhook安全）

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    /**
     * @param  string  $provider  webhook提供商（stripe, github等）
     */
    public function handle(Request $request, Closure $next, string $provider): Response
    {
        $isValid = match ($provider) {
            'stripe' => $this->verifyStripeSignature($request),
            'github' => $this->verifyGithubSignature($request),
            'shopify' => $this->verifyShopifySignature($request),
            default => false,
        };

        if (!$isValid) {
            return response()->json([
                'error' => 'Invalid webhook signature',
            ], 401);
        }

        return $next($request);
    }

    protected function verifyStripeSignature(Request $request): bool
    {
        $signature = $request->header('Stripe-Signature');
        $payload = $request->getContent();
        $secret = config('services.stripe.webhook_secret');

        if (!$signature || !$secret) {
            return false;
        }

        try {
            \Stripe\Webhook::constructEvent($payload, $signature, $secret);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    protected function verifyGithubSignature(Request $request): bool
    {
        $signature = $request->header('X-Hub-Signature-256');
        $payload = $request->getContent();
        $secret = config('services.github.webhook_secret');

        if (!$signature || !$secret) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);

        return hash_equals($expected, $signature);
    }

    protected function verifyShopifySignature(Request $request): bool
    {
        $signature = $request->header('X-Shopify-Hmac-SHA256');
        $payload = $request->getContent();
        $secret = config('services.shopify.webhook_secret');

        if (!$signature || !$secret) {
            return false;
        }

        $expected = base64_encode(hash_hmac('sha256', $payload, $secret, true));

        return hash_equals($expected, $signature);
    }
}

// 使用示例
// routes/api.php
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe'])
    ->middleware('verify.webhook:stripe');

Route::post('/webhooks/github', [WebhookController::class, 'handleGithub'])
    ->middleware('verify.webhook:github');
```

## 面试要点

### 常见面试问题

**1. 什么是中间件？它在Laravel中的作用是什么？**

中间件是一种过滤HTTP请求的机制。它允许你在请求到达应用程序之前或响应返回客户端之前执行代码。常见用途包括：认证、日志记录、CORS处理、请求修改等。

**2. 解释中间件的执行顺序和洋葱模型**

```php
<?php
// 中间件A
public function handle($request, $next)
{
    echo "A: 进入\n";     // 1. 首先执行
    $response = $next($request);
    echo "A: 离开\n";     // 6. 最后执行
    return $response;
}

// 中间件B
public function handle($request, $next)
{
    echo "B: 进入\n";     // 2. 其次执行
    $response = $next($request);
    echo "B: 离开\n";     // 5. 倒数第二执行
    return $response;
}

// 控制器
public function index()
{
    echo "Controller\n";  // 3. 控制器执行
    return response();    // 4. 返回响应
}

// 输出顺序：A: 进入 → B: 进入 → Controller → B: 离开 → A: 离开
```

**3. 全局中间件和路由中间件的区别是什么？**

- 全局中间件：对所有HTTP请求生效，在`$middleware`数组中定义
- 路由中间件：只对指定的路由生效，需要在路由定义时显式添加
- 中间件组：一组相关中间件的集合，如`web`和`api`组

**4. 如何向中间件传递参数？**

```php
<?php
// 定义中间件
public function handle(Request $request, Closure $next, string $role): Response
{
    if (!$request->user()->hasRole($role)) {
        abort(403);
    }
    return $next($request);
}

// 使用中间件
Route::get('/admin', function () {})->middleware('role:admin');
Route::get('/editor', function () {})->middleware('role:admin,editor');
```

**5. 什么是可终止中间件（Terminable Middleware）？**

可终止中间件在响应发送到浏览器之后执行`terminate`方法。这对于不需要阻塞响应的操作很有用，如日志记录、统计等。

```php
<?php
class TerminableMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    // 在响应发送后执行
    public function terminate(Request $request, Response $response): void
    {
        // 记录日志、发送统计等
    }
}
```

**6. 如何在控制器中定义中间件？**

```php
<?php
// Laravel 11+
class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            'auth',
            new Middleware('admin', only: ['destroy']),
        ];
    }
}

// Laravel 10及之前
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->only('destroy');
    }
}
```

**7. 如何排除某些路由不使用特定中间件？**

```php
<?php
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // 排除auth中间件
    Route::get('/public', [PublicController::class, 'index'])
        ->withoutMiddleware(['auth']);
});
```

**8. 中间件和服务提供者有什么区别？**

- 中间件：处理HTTP请求/响应，针对每个请求执行
- 服务提供者：在应用启动时注册和引导服务，只执行一次

### 代码挑战题

实现一个请求限流中间件，要求：
1. 支持配置每分钟最大请求数
2. 区分已认证和未认证用户
3. 返回适当的响应头

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RateLimiter
{
    public function handle(
        Request $request,
        Closure $next,
        int $maxAttempts = 60
    ): Response {
        $key = $this->getKey($request);
        $attempts = Cache::get($key, 0);

        if ($attempts >= $maxAttempts) {
            return response()->json([
                'message' => 'Too Many Requests',
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $maxAttempts,
                'X-RateLimit-Remaining' => 0,
                'Retry-After' => 60,
            ]);
        }

        Cache::put($key, $attempts + 1, 60);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $maxAttempts,
            'X-RateLimit-Remaining' => $maxAttempts - $attempts - 1,
        ]);
    }

    private function getKey(Request $request): string
    {
        if ($user = $request->user()) {
            return 'rate_limit:user:' . $user->id;
        }
        return 'rate_limit:ip:' . $request->ip();
    }
}
```

## 延伸阅读

### 官方文档

- [Laravel中间件文档](https://laravel.com/docs/middleware)
- [Laravel HTTP内核](https://laravel.com/docs/lifecycle)
- [Laravel路由](https://laravel.com/docs/routing)

### 相关主题

- **服务容器**：了解依赖注入如何在中间件中工作
- **路由系统**：深入理解路由与中间件的配合
- **HTTP层**：Request和Response对象的详细用法
- **认证系统**：Laravel内置的认证中间件实现

### 推荐实践项目

1. 实现一个完整的API认证系统，包含JWT认证中间件
2. 构建多租户SaaS应用的租户识别中间件
3. 开发请求追踪系统，记录完整的请求生命周期
4. 实现智能限流系统，根据用户等级动态调整限制

### 源码学习

深入理解Laravel中间件的内部实现：

- `Illuminate\Foundation\Http\Kernel`：HTTP内核实现
- `Illuminate\Pipeline\Pipeline`：管道类实现
- `Illuminate\Routing\Router`：路由器中间件处理
- `Illuminate\Routing\Middleware\*`：Laravel内置中间件

---

中间件是Laravel框架中不可或缺的组成部分，掌握中间件的使用能够帮助你构建更加安全、可维护的Web应用。通过本文的学习，你应该能够创建自定义中间件、理解中间件的执行机制，并在实际项目中灵活运用中间件来解决各种横切关注点问题。
