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
origin: old/src/content/docs/php/middleware.en.md
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

Middleware is one of the most powerful features in the Laravel framework, providing a convenient mechanism for filtering HTTP requests entering your application. Through middleware, you can perform various operations before a request reaches the controller or before a response is returned to the client.

## Concept Explanation

### What is Middleware?

Middleware is an "onion model" request processing mechanism where each HTTP request must pass through a series of middleware layers before finally reaching the application's core processing logic. Similarly, responses must also pass back through these middleware layers in reverse order before being returned to the client.

Typical use cases for middleware include:

- **Authentication**: Verify whether a user is logged in
- **Authorization**: Check whether a user has permission to access a resource
- **Logging**: Record request and response information
- **CORS Handling**: Add Cross-Origin Resource Sharing response headers
- **Request Modification**: Transform or validate request data
- **Response Modification**: Compress responses, add response headers
- **Rate Limiting**: Limit API request frequency
- **Maintenance Mode**: Return a unified response during application maintenance

### Historical Evolution of Middleware

The concept of middleware originated from the "pipes and filters" architectural pattern in software engineering. In web development, the middleware pattern has been widely adopted, such as in Node.js's Express framework and Python's Django. Laravel introduced the middleware mechanism starting from version 2.0, underwent a major refactoring in Laravel 5.0, and formed the mature middleware system we have today.

## Core Principles

### Middleware in the Request Lifecycle

The Laravel application request lifecycle is as follows:

```
Client Request
    |
public/index.php
    |
Bootstrap
    |
HTTP Kernel
    |
Global Middleware (executed in sequence)
    |
Route Matching
    |
Route/Controller Middleware
    |
Controller Method
    |
Response Generation
    |
Middleware (post-logic executed in reverse order)
    |
Return Response to Client
```

### Middleware Execution Mechanism

Laravel uses the Pipeline pattern to implement the chain calling of middleware. The core implementation is in the `Illuminate\Pipeline\Pipeline` class:

```php
<?php
// Simplified pipeline implementation principle
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
                // Call the middleware's handle method
                return $pipe->handle($passable, $stack);
            };
        };
    }
}
```

### Onion Model Explained

Middleware uses the "onion model" for execution, which means:

1. Requests pass from outer middleware to inner middleware (pre-logic)
2. After reaching the core processing, responses return from inner to outer middleware (post-logic)

```
Request -> [Middleware A] -> [Middleware B] -> [Middleware C] -> Controller
Response <- [Middleware A] <- [Middleware B] <- [Middleware C] <- Controller
```

```php
<?php
// Middleware execution order example
class LogMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Pre-logic: executed when request arrives
        Log::info('Request started: ' . $request->path());

        // 2. Call the next middleware
        $response = $next($request);

        // 3. Post-logic: executed when response returns
        Log::info('Request ended, status code: ' . $response->getStatusCode());

        return $response;
    }
}
```

## Key Points

### Basic Structure of Middleware

Every middleware must implement the `handle` method:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExampleMiddleware
{
    /**
     * Handle an incoming request
     *
     * @param  Request  $request  The current HTTP request
     * @param  Closure  $next     Closure for the next middleware
     * @return Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Pre-logic

        $response = $next($request);

        // Post-logic

        return $response;
    }
}
```

### Three Types of Middleware

1. **Global Middleware**: Applied to all requests
2. **Route Middleware**: Applied only to specific routes
3. **Middleware Groups**: A collection of related middleware

### Middleware Registration Location

In Laravel 11+, middleware is registered in `bootstrap/app.php`:

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
        // Register global middleware
        $middleware->append(\App\Http\Middleware\LogRequests::class);

        // Register route middleware aliases
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
        ]);

        // Register middleware groups
        $middleware->group('api', [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
        ]);
    })
    ->create();
```

In Laravel 10 and earlier versions, middleware is registered in `app/Http/Kernel.php`:

```php
<?php
// app/Http/Kernel.php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack
     * These middleware run during every request
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Foundation\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * Route middleware aliases
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
     * Middleware groups
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

## Code Examples

### Creating Middleware

Use Artisan commands to create middleware:

```bash
# Create basic middleware
php artisan make:middleware CheckAge

# Create middleware in a specific directory
php artisan make:middleware Admin/EnsureUserIsAdmin
```

Generated middleware file:

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
            return redirect('home')->with('error', 'You must be at least 18 years old');
        }

        return $next($request);
    }
}
```

### Before and After Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Before Middleware: executes logic before request processing
class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Execute before the request reaches the controller
        $this->validateRequest($request);

        return $next($request);
    }

    private function validateRequest(Request $request): void
    {
        // Validation logic
    }
}

// After Middleware: executes logic after response returns
class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Execute before the response is returned to the client
        $response->headers->set('X-Response-Time', microtime(true));

        return $response;
    }
}

// Combined Middleware: has both before and after logic
class TimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Before: record start time
        $startTime = microtime(true);

        $response = $next($request);

        // After: calculate and add response time
        $duration = microtime(true) - $startTime;
        $response->headers->set('X-Response-Time', round($duration * 1000, 2) . 'ms');

        return $response;
    }
}
```

### Registering Global Middleware

```php
<?php
// bootstrap/app.php (Laravel 11+)

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // Append to the end of the global middleware stack
        $middleware->append([
            \App\Http\Middleware\LogRequests::class,
            \App\Http\Middleware\MeasureResponseTime::class,
        ]);

        // Prepend to the beginning of the global middleware stack
        $middleware->prepend([
            \App\Http\Middleware\TrustProxies::class,
        ]);

        // Remove specific global middleware
        $middleware->remove([
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
        ]);
    })
    ->create();
```

### Route Middleware

```php
<?php
// routes/web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;

// Single middleware
Route::get('/profile', [ProfileController::class, 'show'])
    ->middleware('auth');

// Multiple middleware
Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'admin']);

// Excluding middleware
Route::middleware(['auth'])->group(function () {
    Route::get('/account', [AccountController::class, 'show']);

    // This route does not use auth middleware
    Route::get('/public-info', [InfoController::class, 'show'])
        ->withoutMiddleware(['auth']);
});

// Route group with middleware
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/settings', [AdminController::class, 'settings']);
    Route::get('/logs', [AdminController::class, 'logs']);
});

// Middleware defined in controller
Route::get('/posts', [PostController::class, 'index']);
```

### Controller Middleware

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PostController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware for the controller
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
        // Public access, requires auth
    }

    public function show($id)
    {
        // Public access, requires auth
    }

    public function create()
    {
        // Requires auth + admin
    }

    public function store()
    {
        // Requires auth + admin + throttle
    }

    public function destroy($id)
    {
        // Requires auth + admin + throttle
    }
}
```

Controller middleware syntax in Laravel 10 and earlier:

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

### Middleware Groups

```php
<?php
// bootstrap/app.php (Laravel 11+)

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // Custom middleware group
        $middleware->group('admin', [
            'auth',
            \App\Http\Middleware\EnsureUserIsAdmin::class,
            \App\Http\Middleware\LogAdminActions::class,
        ]);

        // Add middleware to existing groups
        $middleware->appendToGroup('web', [
            \App\Http\Middleware\LocaleMiddleware::class,
        ]);

        $middleware->prependToGroup('api', [
            \App\Http\Middleware\ApiVersion::class,
        ]);
    })
    ->create();
```

Using middleware groups:

```php
<?php
// routes/web.php

// Using custom middleware group
Route::middleware('admin')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::resource('users', AdminUserController::class);
});
```

### Middleware Parameters

Middleware can receive additional parameters:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle the request
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string   ...$roles  Variadic parameter, receives multiple roles
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

        abort(403, 'You do not have permission to access this resource');
    }
}
```

Registering and using middleware with parameters:

```php
<?php
// bootstrap/app.php
$middleware->alias([
    'role' => \App\Http\Middleware\EnsureUserHasRole::class,
]);

// routes/web.php
// Single parameter
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('role:admin');

// Multiple parameters (comma-separated)
Route::get('/editor', [EditorController::class, 'index'])
    ->middleware('role:admin,editor');

// Another way to specify multiple parameters
Route::get('/manager', [ManagerController::class, 'index'])
    ->middleware('role:admin,manager,supervisor');
```

### Advanced Parameter Example: Cache Middleware

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
     * @param  int      $minutes  Cache duration (minutes)
     * @param  string   $prefix   Cache key prefix
     * @return Response
     */
    public function handle(
        Request $request,
        Closure $next,
        int $minutes = 60,
        string $prefix = 'response'
    ): Response {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        $cacheKey = $prefix . ':' . sha1($request->fullUrl());

        // Try to get from cache
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response($cachedResponse['content'])
                ->withHeaders($cachedResponse['headers'])
                ->header('X-Cache', 'HIT');
        }

        // Execute the request
        $response = $next($request);

        // Only cache successful responses
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

// Usage example
Route::get('/api/articles', [ArticleController::class, 'index'])
    ->middleware('cache:30,articles');  // Cache for 30 minutes with prefix 'articles'
```

### Terminable Middleware

Terminable middleware executes after the response has been sent to the browser, suitable for logging, statistics, and other operations that don't affect the response:

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
        // Add a unique identifier to the request
        $request->attributes->set('request_id', uniqid('req_'));

        return $next($request);
    }

    /**
     * Execute after the response has been sent to the browser
     * This does not affect response time
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

### Complete Authentication Middleware Example

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
     * Authentication middleware
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @param  string   ...$guards  Authentication guards
     * @return Response
     */
    public function handle(Request $request, Closure $next, string ...$guards): Response
    {
        // If no guards specified, use the default guard
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                // Set the current guard in use
                Auth::shouldUse($guard);
                return $next($request);
            }
        }

        // Unauthenticated
        return $this->unauthenticated($request, $guards);
    }

    /**
     * Handle unauthenticated requests
     */
    protected function unauthenticated(Request $request, array $guards): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Unauthorized access',
                'error' => 'Unauthenticated',
            ], 401);
        }

        return redirect()->guest(route('login'));
    }
}
```

### API Version Control Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiVersion
{
    /**
     * Handle API version
     */
    public function handle(Request $request, Closure $next, string $defaultVersion = 'v1'): Response
    {
        // Get API version from request header
        $version = $request->header('X-API-Version')
            ?? $request->header('Accept-Version')
            ?? $request->query('api_version')
            ?? $defaultVersion;

        // Validate version format
        if (!preg_match('/^v\d+$/', $version)) {
            return response()->json([
                'error' => 'Invalid API version format',
                'message' => 'API version should be in format: v1, v2, etc.',
            ], 400);
        }

        // Check if version is supported
        $supportedVersions = config('api.supported_versions', ['v1', 'v2']);
        if (!in_array($version, $supportedVersions)) {
            return response()->json([
                'error' => 'Unsupported API version',
                'message' => "Supported versions: " . implode(', ', $supportedVersions),
            ], 400);
        }

        // Add version information to the request
        $request->attributes->set('api_version', $version);

        $response = $next($request);

        // Return the version used in the response header
        $response->headers->set('X-API-Version', $version);

        return $response;
    }
}
```

### CORS Middleware

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Cors
{
    /**
     * Allowed origins
     */
    protected array $allowedOrigins = [
        'http://localhost:3000',
        'https://example.com',
    ];

    /**
     * Allowed methods
     */
    protected array $allowedMethods = [
        'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'
    ];

    /**
     * Allowed headers
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
        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            return $this->handlePreflightRequest($request);
        }

        $response = $next($request);

        return $this->addCorsHeaders($request, $response);
    }

    /**
     * Handle preflight request
     */
    protected function handlePreflightRequest(Request $request): Response
    {
        $response = response('', 204);
        return $this->addCorsHeaders($request, $response);
    }

    /**
     * Add CORS response headers
     */
    protected function addCorsHeaders(Request $request, Response $response): Response
    {
        $origin = $request->header('Origin');

        // Check if origin is allowed
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

## Best Practices

### Single Responsibility Principle

Each middleware should be responsible for only one function:

```php
<?php
// Good practice: separate concerns

// Authentication middleware - only handles authentication
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

// Authorization middleware - only handles authorization
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

// Logging middleware - only handles logging
class LogRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('Request: ' . $request->path());
        return $next($request);
    }
}

// Bad practice: one middleware doing too many things
class DoEverything
{
    public function handle(Request $request, Closure $next): Response
    {
        // Authentication
        if (!Auth::check()) {
            return redirect()->route('login');
        }

        // Authorization
        if (!$request->user()->isAdmin()) {
            abort(403);
        }

        // Logging
        Log::info('Request: ' . $request->path());

        // Rate limiting
        // ...

        return $next($request);
    }
}
```

### Use Middleware Groups Wisely

Organize related middleware into groups for easier management:

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

### Middleware Execution Order

Pay attention to the registration order of middleware, as some middleware must execute before others:

```php
<?php
// Correct order
$middleware->web(prepend: [
    \App\Http\Middleware\TrustProxies::class,      // 1. Trust proxies (first)
]);

$middleware->web(append: [
    \App\Http\Middleware\EncryptCookies::class,    // 2. Encrypt cookies
    \App\Http\Middleware\StartSession::class,      // 3. Start session (needs cookies)
    \App\Http\Middleware\Authenticate::class,      // 4. Authenticate (needs session)
]);
```

### Avoid Complex Business Logic in Middleware

```php
<?php
// Good practice: middleware only does filtering and transformation
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

// Bad practice: handling business logic in middleware
class ProcessSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Should not handle subscription renewal logic here
        if ($user->subscription->isExpiring()) {
            $user->subscription->renew();
            $user->notify(new SubscriptionRenewed());
        }

        return $next($request);
    }
}
```

### Use Dependency Injection

Inject dependencies through the constructor instead of using Facades directly:

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

## Common Pitfalls

### Forgetting to Call $next()

```php
<?php
// Wrong: forgetting to call $next()
class BrokenMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()->isAdmin()) {
            // Error: not returning $next($request)
            // The request will be blocked here
        }

        return response('Forbidden', 403);
    }
}

// Correct approach
class CorrectMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()->isAdmin()) {
            return response('Forbidden', 403);
        }

        return $next($request);  // Always call $next()
    }
}
```

### Incorrect Middleware Order

```php
<?php
// Problem: Session middleware after authentication middleware
// Authentication middleware cannot access session data
$middlewareGroups = [
    'web' => [
        \App\Http\Middleware\Authenticate::class,  // Needs session
        \Illuminate\Session\Middleware\StartSession::class,  // Too late!
    ],
];

// Correct order
$middlewareGroups = [
    'web' => [
        \Illuminate\Session\Middleware\StartSession::class,  // Start session first
        \App\Http\Middleware\Authenticate::class,  // Then authenticate
    ],
];
```

### Throwing Unhandled Exceptions in Middleware

```php
<?php
// Problem: unhandled exceptions will crash the application
class UnsafeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $data = json_decode($request->getContent(), true);
        // If JSON is invalid, an exception will be thrown
        $this->processData($data);

        return $next($request);
    }
}

// Correct approach: handle exceptions gracefully
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

### Modifying Response but Forgetting to Return It

```php
<?php
// Wrong: modified the response but returned the original
class BrokenAfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Error: created a new response here but didn't return it
        $response->headers->set('X-Custom-Header', 'value');

        return $next($request);  // Returned a new response, previous modifications lost
    }
}

// Correct approach
class CorrectAfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Custom-Header', 'value');

        return $response;  // Return the modified response
    }
}
```

### Relying on Request Data in terminate Method

```php
<?php
// Problem: some request data may not be available in terminate
class ProblematicMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Problem: in some cases, $request->user() may be null
        Log::info('User: ' . $request->user()->id);
    }
}

// Correct approach: save needed data in handle
class SafeTerminatingMiddleware
{
    protected ?int $userId = null;

    public function handle(Request $request, Closure $next): Response
    {
        // Save needed data in handle
        $this->userId = $request->user()?->id;

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        Log::info('User ID: ' . ($this->userId ?? 'guest'));
    }
}
```

### Memory Leaks in Middleware

```php
<?php
// Problem: storing request-specific data in singleton middleware
class MemoryLeakMiddleware
{
    // This array will accumulate across all requests
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

// Correct approach: don't store request-specific state in middleware
// or clean up in terminate
class CleanMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Use request attributes to store temporary data
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

## Performance Considerations

### Reduce the Number of Global Middleware

Global middleware runs on every request, so add them carefully:

```php
<?php
// Not recommended: making all middleware global
$middleware->append([
    \App\Http\Middleware\LogRequests::class,
    \App\Http\Middleware\TrackAnalytics::class,
    \App\Http\Middleware\CompressResponse::class,
    \App\Http\Middleware\AddSecurityHeaders::class,
]);

// Recommended: only make necessary middleware global, use others as needed
$middleware->append([
    \App\Http\Middleware\TrustProxies::class,  // Must be global
]);

// Other middleware as route middleware
$middleware->alias([
    'log' => \App\Http\Middleware\LogRequests::class,
    'analytics' => \App\Http\Middleware\TrackAnalytics::class,
]);
```

### Use Terminable Middleware for Time-Consuming Operations

```php
<?php
// Not recommended: performing time-consuming operations in handle
class SlowMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // This increases response time
        $this->sendToAnalytics($request, $response);
        $this->updateStatistics($request);

        return $response;
    }
}

// Recommended: use terminate for time-consuming operations
class FastMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    // Execute after response is sent, doesn't affect user experience
    public function terminate(Request $request, Response $response): void
    {
        $this->sendToAnalytics($request, $response);
        $this->updateStatistics($request);
    }
}
```

### Cache Middleware Computation Results

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

        // Use cache to avoid repeated database queries
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

### Avoid Database Queries in Middleware (Unless Necessary)

```php
<?php
// Not recommended: querying the database on every request
class ExpensiveMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // This query runs on every request
        $settings = Settings::all();
        config(['app.settings' => $settings]);

        return $next($request);
    }
}

// Recommended: use caching
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

### Use Middleware Priority

Laravel allows setting middleware priority to ensure critical middleware executes first:

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

## Real-World Scenarios

### Scenario 1: Multi-Tenant System

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
        // Identify tenant from subdomain
        $subdomain = $this->extractSubdomain($request);

        if (!$subdomain) {
            abort(404, 'Tenant not found');
        }

        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant || !$tenant->is_active) {
            abort(404, 'Tenant not found or inactive');
        }

        // Set the current tenant
        $this->tenantManager->setTenant($tenant);

        // Switch database connection
        config(['database.default' => 'tenant']);
        config(['database.connections.tenant.database' => $tenant->database_name]);

        // Add tenant information to the request
        $request->attributes->set('tenant', $tenant);

        $response = $next($request);

        // Add tenant identifier to response header
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

### Scenario 2: API Request Rate Limiting

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
     * @param  int  $maxAttempts  Maximum number of attempts
     * @param  int  $decayMinutes  Time window (minutes)
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
     * Generate request signature
     */
    protected function resolveRequestSignature(Request $request): string
    {
        // Use user ID for authenticated users
        if ($user = $request->user()) {
            return 'rate_limit:user:' . $user->id;
        }

        // Use IP + User-Agent for unauthenticated users
        return 'rate_limit:ip:' . sha1(
            $request->ip() . '|' . $request->userAgent()
        );
    }

    /**
     * Build rate limit response
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
     * Add rate limit headers
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

### Scenario 3: Request Logging and Auditing

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

        // Add request ID to request and log context
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
     * Capture request data, filtering sensitive fields
     */
    protected function captureRequestData(Request $request): array
    {
        $data = $request->all();

        return $this->filterSensitiveData($data);
    }

    /**
     * Filter sensitive data
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

### Scenario 4: Multi-Language Support

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

        // Add locale setting to request attributes
        $request->attributes->set('locale', $locale);

        $response = $next($request);

        // Return the language used in response header
        $response->headers->set('Content-Language', $locale);

        return $response;
    }

    /**
     * Determine the locale to use
     */
    protected function determineLocale(Request $request): string
    {
        // 1. Check URL parameter
        if ($locale = $request->query('lang')) {
            if ($this->isSupported($locale)) {
                return $locale;
            }
        }

        // 2. Check request header
        if ($locale = $request->header('Accept-Language')) {
            $locale = $this->parseAcceptLanguage($locale);
            if ($locale && $this->isSupported($locale)) {
                return $locale;
            }
        }

        // 3. Check user preference (logged-in users)
        if ($user = $request->user()) {
            if ($this->isSupported($user->preferred_locale)) {
                return $user->preferred_locale;
            }
        }

        // 4. Check cookie
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
            return substr($locale, 0, 2);  // Take the first two characters
        }
        return null;
    }
}
```

### Scenario 5: Request Signature Verification (Webhook Security)

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyWebhookSignature
{
    /**
     * @param  string  $provider  Webhook provider (stripe, github, etc.)
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

// Usage example
// routes/api.php
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripe'])
    ->middleware('verify.webhook:stripe');

Route::post('/webhooks/github', [WebhookController::class, 'handleGithub'])
    ->middleware('verify.webhook:github');
```

## Interview Key Points

### Common Interview Questions

**1. What is middleware? What is its role in Laravel?**

Middleware is a mechanism for filtering HTTP requests. It allows you to execute code before a request reaches the application or before a response is returned to the client. Common uses include: authentication, logging, CORS handling, request modification, etc.

**2. Explain middleware execution order and the onion model**

```php
<?php
// Middleware A
public function handle($request, $next)
{
    echo "A: entering\n";     // 1. Executes first
    $response = $next($request);
    echo "A: leaving\n";      // 6. Executes last
    return $response;
}

// Middleware B
public function handle($request, $next)
{
    echo "B: entering\n";     // 2. Executes second
    $response = $next($request);
    echo "B: leaving\n";      // 5. Executes second to last
    return $response;
}

// Controller
public function index()
{
    echo "Controller\n";      // 3. Controller executes
    return response();        // 4. Returns response
}

// Output order: A: entering -> B: entering -> Controller -> B: leaving -> A: leaving
```

**3. What is the difference between global middleware and route middleware?**

- Global middleware: Applied to all HTTP requests, defined in the `$middleware` array
- Route middleware: Applied only to specified routes, must be explicitly added in route definitions
- Middleware groups: A collection of related middleware, such as `web` and `api` groups

**4. How do you pass parameters to middleware?**

```php
<?php
// Define middleware
public function handle(Request $request, Closure $next, string $role): Response
{
    if (!$request->user()->hasRole($role)) {
        abort(403);
    }
    return $next($request);
}

// Use middleware
Route::get('/admin', function () {})->middleware('role:admin');
Route::get('/editor', function () {})->middleware('role:admin,editor');
```

**5. What is terminable middleware?**

Terminable middleware executes the `terminate` method after the response has been sent to the browser. This is useful for operations that don't need to block the response, such as logging and statistics.

```php
<?php
class TerminableMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    // Executes after response is sent
    public function terminate(Request $request, Response $response): void
    {
        // Log, send statistics, etc.
    }
}
```

**6. How do you define middleware in a controller?**

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

// Laravel 10 and earlier
class UserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->only('destroy');
    }
}
```

**7. How do you exclude certain routes from using specific middleware?**

```php
<?php
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Exclude auth middleware
    Route::get('/public', [PublicController::class, 'index'])
        ->withoutMiddleware(['auth']);
});
```

**8. What is the difference between middleware and service providers?**

- Middleware: Handles HTTP requests/responses, executes for each request
- Service providers: Register and bootstrap services at application startup, executes only once

### Coding Challenge

Implement a request rate limiting middleware with the following requirements:
1. Support configurable maximum requests per minute
2. Distinguish between authenticated and unauthenticated users
3. Return appropriate response headers

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

## Further Reading

### Official Documentation

- [Laravel Middleware Documentation](https://laravel.com/docs/middleware)
- [Laravel HTTP Kernel](https://laravel.com/docs/lifecycle)
- [Laravel Routing](https://laravel.com/docs/routing)

### Related Topics

- **Service Container**: Understanding how dependency injection works in middleware
- **Routing System**: Deep dive into how routing works with middleware
- **HTTP Layer**: Detailed usage of Request and Response objects
- **Authentication System**: Laravel's built-in authentication middleware implementation

### Recommended Practice Projects

1. Implement a complete API authentication system with JWT authentication middleware
2. Build tenant identification middleware for a multi-tenant SaaS application
3. Develop a request tracing system that records the complete request lifecycle
4. Implement an intelligent rate limiting system that dynamically adjusts limits based on user tier

### Source Code Study

Deep dive into the internal implementation of Laravel middleware:

- `Illuminate\Foundation\Http\Kernel`: HTTP Kernel implementation
- `Illuminate\Pipeline\Pipeline`: Pipeline class implementation
- `Illuminate\Routing\Router`: Router middleware handling
- `Illuminate\Routing\Middleware\*`: Laravel's built-in middleware

---

Middleware is an indispensable component of the Laravel framework. Mastering middleware usage helps you build more secure and maintainable web applications. After reading this guide, you should be able to create custom middleware, understand middleware execution mechanisms, and apply middleware effectively in real projects to solve various cross-cutting concerns.
