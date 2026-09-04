---
title: Laravel PHP Framework
description: Build elegant PHP applications with Laravel
track: backend
section: http-apis
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - Eloquent
  - web development
status: imported
origin: old/src/content/docs/backend/php-laravel.en.md
divergence: 0.26
issues: []
legacy:
  category: Backend
  subcategory: Frameworks
  order: 26
  lastUpdated: 2026-01-07
---

## Introduction

Laravel is a powerful, elegant PHP web application framework designed to make common web development tasks enjoyable and efficient. Created by Taylor Otwell in 2011, Laravel has become the most popular PHP framework, known for its expressive syntax, robust features, and excellent developer experience. It follows the Model-View-Controller (MVC) architectural pattern and provides a comprehensive ecosystem for building modern web applications.

### Why Choose Laravel?

Laravel was built with the philosophy that development should be an enjoyable and creative experience. Its elegant syntax and thoughtful design make it accessible to beginners while remaining powerful enough for complex enterprise applications.

Core advantages of Laravel include:

- **Elegant Syntax**: Laravel's expressive, intuitive syntax makes code readable and maintainable
- **Rapid Development**: Built-in tools for authentication, routing, sessions, and caching accelerate development
- **Eloquent ORM**: A beautiful, simple ActiveRecord implementation for database operations
- **Blade Templates**: A powerful templating engine with zero performance overhead
- **Artisan CLI**: A robust command-line interface for automating repetitive tasks
- **Security First**: Built-in protection against SQL injection, XSS, CSRF, and other vulnerabilities
- **Testing Support**: PHPUnit integration with convenient helper methods for application testing
- **Rich Ecosystem**: Laravel Forge, Vapor, Nova, and many first-party packages extend functionality

### Laravel vs Other PHP Frameworks

| Feature | Laravel | Symfony | CodeIgniter | Slim |
|---------|---------|---------|-------------|------|
| Architecture | Full-stack MVC | Full-stack MVC | MVC | Micro-framework |
| ORM | Eloquent (built-in) | Doctrine (optional) | Query Builder | None |
| Template Engine | Blade | Twig | PHP/Custom | None |
| CLI Tool | Artisan | Console | spark | None |
| Learning Curve | Moderate | Steep | Easy | Easy |
| Best For | Full applications | Enterprise apps | Small/Medium apps | APIs |

## Laravel Architecture

### Understanding MVC in Laravel

Laravel follows the Model-View-Controller (MVC) pattern, which separates application logic into three interconnected components:

- **Model**: Represents data and business logic, interacts with the database via Eloquent ORM
- **View**: Handles presentation layer using Blade templates
- **Controller**: Processes requests, coordinates between Models and Views, returns responses

```
+----------------------------------------------------------+
|                    Laravel Request Flow                    |
+----------------------------------------------------------+
|                                                           |
|   Request --> Route --> Middleware --> Controller         |
|                                              |            |
|                                              v            |
|                                           Model           |
|                                              |            |
|                                              v            |
|   Response <-- View <------------------------|            |
|                                                           |
+----------------------------------------------------------+
```

### Installation and Project Setup

Install Laravel using Composer:

```bash
# Install Laravel installer globally
composer global require laravel/installer

# Create a new Laravel project
laravel new myproject

# Or using Composer directly
composer create-project laravel/laravel myproject

# Navigate to project directory
cd myproject

# Start development server
php artisan serve
```

### Project Structure

A typical Laravel project structure:

```
myproject/
├── app/
│   ├── Console/            # Artisan commands
│   ├── Exceptions/         # Exception handlers
│   ├── Http/
│   │   ├── Controllers/    # Application controllers
│   │   ├── Middleware/     # HTTP middleware
│   │   └── Requests/       # Form request classes
│   ├── Models/             # Eloquent models
│   ├── Providers/          # Service providers
│   └── Services/           # Custom services
├── bootstrap/              # Framework bootstrap files
├── config/                 # Configuration files
├── database/
│   ├── factories/          # Model factories
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── public/                 # Public assets, entry point
├── resources/
│   ├── css/               # CSS files
│   ├── js/                # JavaScript files
│   └── views/             # Blade templates
├── routes/
│   ├── api.php            # API routes
│   ├── channels.php       # Broadcast channels
│   ├── console.php        # Console routes
│   └── web.php            # Web routes
├── storage/               # Logs, cache, sessions
├── tests/                 # Test files
├── .env                   # Environment variables
├── artisan                # CLI entry point
├── composer.json          # PHP dependencies
└── package.json           # NPM dependencies
```

### Configuration

Laravel uses `.env` files for environment-specific configuration:

```bash
# .env
APP_NAME=MyLaravelApp
APP_ENV=local
APP_KEY=base64:generated-key-here
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myproject
DB_USERNAME=root
DB_PASSWORD=

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

Access configuration values in code:

```php
// Access environment variables
$debug = env('APP_DEBUG', false);

// Access configuration values
$appName = config('app.name');
$dbConnection = config('database.default');

// Set configuration at runtime
config(['app.timezone' => 'America/New_York']);
```

## Routing

### Basic Routing

Laravel provides an expressive routing system:

```php
// routes/web.php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserController;

// Basic routes
Route::get('/', function () {
    return view('welcome');
});

Route::get('/about', function () {
    return view('about');
});

// Route with parameters
Route::get('/users/{id}', function (string $id) {
    return "User: {$id}";
});

// Optional parameters
Route::get('/posts/{slug?}', function (?string $slug = null) {
    return $slug ? "Post: {$slug}" : 'All Posts';
});

// Regular expression constraints
Route::get('/user/{id}', function (string $id) {
    return "User ID: {$id}";
})->where('id', '[0-9]+');

Route::get('/post/{slug}', function (string $slug) {
    return "Post: {$slug}";
})->where('slug', '[a-z0-9-]+');

// Named routes
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');

// Generate URL from named route
$url = route('dashboard');
```

### Controller Routes

Route to controller actions:

```php
// routes/web.php
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;

// Single action route
Route::get('/posts', [PostController::class, 'index'])->name('posts.index');
Route::get('/posts/create', [PostController::class, 'create'])->name('posts.create');
Route::post('/posts', [PostController::class, 'store'])->name('posts.store');
Route::get('/posts/{post}', [PostController::class, 'show'])->name('posts.show');
Route::get('/posts/{post}/edit', [PostController::class, 'edit'])->name('posts.edit');
Route::put('/posts/{post}', [PostController::class, 'update'])->name('posts.update');
Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('posts.destroy');

// Resource routes (generates all CRUD routes)
Route::resource('posts', PostController::class);

// API resource (excludes create and edit)
Route::apiResource('posts', PostController::class);

// Nested resources
Route::resource('posts.comments', CommentController::class);
// Creates: posts/{post}/comments, posts/{post}/comments/{comment}, etc.

// Partial resource routes
Route::resource('posts', PostController::class)->only(['index', 'show']);
Route::resource('posts', PostController::class)->except(['destroy']);
```

### Route Groups

Organize routes with groups:

```php
// routes/web.php

// Middleware group
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/profile', [ProfileController::class, 'show']);
});

// Prefix group
Route::prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/posts', [AdminPostController::class, 'index']);
});

// Name prefix group
Route::name('admin.')->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index'])
        ->name('users.index'); // admin.users.index
});

// Combined group attributes
Route::prefix('admin')
    ->name('admin.')
    ->middleware(['auth', 'admin'])
    ->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])
            ->name('dashboard');
        Route::resource('users', AdminUserController::class);
    });

// Controller group
Route::controller(PostController::class)->group(function () {
    Route::get('/posts', 'index');
    Route::post('/posts', 'store');
    Route::get('/posts/{id}', 'show');
});
```

### API Routes

Define API routes in `routes/api.php`:

```php
// routes/api.php
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\AuthController;

// API routes are automatically prefixed with /api
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected API routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('posts', PostController::class);

    Route::post('/logout', [AuthController::class, 'logout']);
});

// API versioning
Route::prefix('v1')->group(function () {
    Route::apiResource('posts', PostController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('posts', V2\PostController::class);
});
```

## Middleware

### Understanding Middleware

Middleware provides a mechanism for filtering HTTP requests entering your application:

```php
// app/Http/Middleware/EnsureUserIsAdmin.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->is_admin) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
```

### Creating Custom Middleware

Create middleware using Artisan:

```bash
php artisan make:middleware CheckAge
```

```php
// app/Http/Middleware/CheckAge.php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAge
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, int $minAge = 18): Response
    {
        if ($request->user()->age < $minAge) {
            return redirect('home')->with('error', 'You must be at least ' . $minAge . ' years old.');
        }

        return $next($request);
    }
}
```

### Registering Middleware

Register middleware in `bootstrap/app.php` (Laravel 11+) or `app/Http/Kernel.php`:

```php
// bootstrap/app.php (Laravel 11+)
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\CheckAge;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware
        $middleware->append(EnsureTokenIsValid::class);

        // Middleware aliases
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'age' => CheckAge::class,
        ]);

        // Middleware groups
        $middleware->group('admin', [
            'auth',
            EnsureUserIsAdmin::class,
        ]);
    })
    ->create();
```

### Using Middleware

Apply middleware to routes:

```php
// Single middleware
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware('admin');

// Multiple middleware
Route::get('/profile', [ProfileController::class, 'show'])
    ->middleware(['auth', 'verified']);

// Middleware with parameters
Route::get('/alcohol', [ProductController::class, 'alcohol'])
    ->middleware('age:21');

// Controller middleware
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

### Common Built-in Middleware

```php
// Authentication
Route::middleware('auth')->group(function () {
    // Requires authenticated user
});

// Guest only
Route::middleware('guest')->group(function () {
    // Only for non-authenticated users
});

// Email verification
Route::middleware('verified')->group(function () {
    // Requires verified email
});

// Rate limiting
Route::middleware('throttle:60,1')->group(function () {
    // 60 requests per minute
});

// CORS
Route::middleware('cors')->group(function () {
    // Cross-origin requests allowed
});
```

## Eloquent ORM

### Defining Models

Eloquent provides an elegant ActiveRecord implementation:

```php
// app/Models/Post.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'posts';

    /**
     * The primary key for the model.
     */
    protected $primaryKey = 'id';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'status',
        'published_at',
        'user_id',
        'category_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'deleted_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
        'metadata' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['reading_time'];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate slug on creating
        static::creating(function ($post) {
            if (empty($post->slug)) {
                $post->slug = \Str::slug($post->title);
            }
        });
    }

    // Accessors
    public function getReadingTimeAttribute(): string
    {
        $words = str_word_count(strip_tags($this->content));
        $minutes = max(1, ceil($words / 200));
        return "{$minutes} min read";
    }

    // Mutators
    public function setTitleAttribute(string $value): void
    {
        $this->attributes['title'] = ucfirst($value);
    }

    // Scopes
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    public function scopeByCategory(Builder $query, int $categoryId): Builder
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopePopular(Builder $query, int $limit = 10): Builder
    {
        return $query->orderByDesc('views')->limit($limit);
    }
}
```

### Eloquent Relationships

Define relationships between models:

```php
// app/Models/Post.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * Get the author of the post.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the category of the post.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the comments for the post.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    /**
     * Get the tags for the post.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'post_tag')
                    ->withTimestamps();
    }

    /**
     * Get all images for the post (polymorphic).
     */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}

// app/Models/User.php
class User extends Authenticatable
{
    /**
     * Get all posts by the user.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get the user's profile.
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    /**
     * Get the roles for the user.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
                    ->withPivot('assigned_at')
                    ->withTimestamps();
    }
}

// app/Models/Category.php
class Category extends Model
{
    /**
     * Get posts in this category.
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Get child categories.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * Get parent category.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }
}
```

### QueryBuilder and Eloquent Queries

```php
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Basic queries
$posts = Post::all();
$publishedPosts = Post::where('status', 'published')->get();
$post = Post::find(1);
$post = Post::findOrFail(1);
$post = Post::where('slug', 'my-post')->first();
$post = Post::where('slug', 'my-post')->firstOrFail();

// Complex where clauses
$posts = Post::where('status', 'published')
    ->where('views', '>', 100)
    ->orWhere('is_featured', true)
    ->get();

// Where with closure (grouped conditions)
$posts = Post::where('status', 'published')
    ->where(function ($query) {
        $query->where('views', '>', 100)
              ->orWhere('is_featured', true);
    })
    ->get();

// Date queries
$recentPosts = Post::whereDate('created_at', today())->get();
$thisMonthPosts = Post::whereMonth('created_at', now()->month)->get();
$thisYearPosts = Post::whereYear('created_at', now()->year)->get();

// Ordering and limiting
$latestPosts = Post::latest()->take(10)->get();
$oldestPosts = Post::oldest()->take(10)->get();
$popularPosts = Post::orderByDesc('views')->limit(5)->get();

// Pagination
$posts = Post::published()->paginate(15);
$posts = Post::published()->simplePaginate(15);
$posts = Post::published()->cursorPaginate(15);

// Eager loading (prevent N+1 queries)
$posts = Post::with(['author', 'category', 'tags'])->get();
$posts = Post::with(['author:id,name,email', 'comments.user'])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('author', 'tags');

// Aggregates
$count = Post::count();
$maxViews = Post::max('views');
$avgViews = Post::avg('views');
$totalViews = Post::sum('views');

// Chunking results for memory efficiency
Post::chunk(100, function ($posts) {
    foreach ($posts as $post) {
        // Process each post
    }
});

// Using query builder
$posts = DB::table('posts')
    ->join('users', 'posts.user_id', '=', 'users.id')
    ->select('posts.*', 'users.name as author_name')
    ->where('posts.status', 'published')
    ->get();
```

### Creating and Updating Records

```php
// Create new record
$post = new Post();
$post->title = 'My New Post';
$post->content = 'Post content here';
$post->user_id = auth()->id();
$post->save();

// Create using mass assignment
$post = Post::create([
    'title' => 'My New Post',
    'content' => 'Post content here',
    'user_id' => auth()->id(),
]);

// Find or create
$post = Post::firstOrCreate(
    ['slug' => 'my-post'],
    ['title' => 'My Post', 'content' => 'Content']
);

// Update or create
$post = Post::updateOrCreate(
    ['slug' => 'my-post'],
    ['title' => 'Updated Title', 'content' => 'Updated content']
);

// Update existing record
$post = Post::find(1);
$post->title = 'Updated Title';
$post->save();

// Update using mass assignment
$post->update([
    'title' => 'Updated Title',
    'content' => 'Updated content',
]);

// Mass update
Post::where('status', 'draft')
    ->where('created_at', '<', now()->subDays(30))
    ->update(['status' => 'archived']);

// Delete records
$post = Post::find(1);
$post->delete();

// Delete by ID
Post::destroy(1);
Post::destroy([1, 2, 3]);

// Mass delete
Post::where('status', 'archived')
    ->where('created_at', '<', now()->subYear())
    ->delete();

// Soft delete (if using SoftDeletes trait)
$post->delete(); // Sets deleted_at timestamp

// Restore soft deleted record
$post->restore();

// Force delete (permanently)
$post->forceDelete();

// Include soft deleted in queries
$posts = Post::withTrashed()->get();
$deletedPosts = Post::onlyTrashed()->get();
```

### Database Migrations

Create and manage database schema:

```bash
# Create migration
php artisan make:migration create_posts_table

# Create migration for specific table
php artisan make:migration add_featured_to_posts_table --table=posts
```

```php
// database/migrations/2024_01_15_000000_create_posts_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->text('excerpt')->nullable();
            $table->string('featured_image')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->unsignedBigInteger('views')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('published_at');
            $table->fullText(['title', 'content']);
        });

        // Pivot table for tags
        Schema::create('post_tag', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->primary(['post_id', 'tag_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('post_tag');
        Schema::dropIfExists('posts');
    }
};
```

Run migrations:

```bash
# Run all migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Rollback and re-run all migrations
php artisan migrate:refresh

# Drop all tables and re-run migrations
php artisan migrate:fresh

# Run with seeding
php artisan migrate:fresh --seed
```

## Blade Templates

### Blade Basics

Blade is Laravel's powerful templating engine:

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', config('app.name'))</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
</head>
<body class="antialiased">
    <header>
        @include('partials.navigation')
    </header>

    <main>
        @if(session('success'))
            <div class="alert alert-success">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="alert alert-danger">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>

    <footer>
        @include('partials.footer')
    </footer>

    @stack('scripts')
</body>
</html>
```

```blade
{{-- resources/views/posts/index.blade.php --}}
@extends('layouts.app')

@section('title', 'Blog Posts')

@section('content')
<div class="container">
    <h1>Blog Posts</h1>

    {{-- Search Form --}}
    <form action="{{ route('posts.index') }}" method="GET" class="search-form">
        <input type="text" name="q" value="{{ request('q') }}" placeholder="Search posts...">
        <button type="submit">Search</button>
    </form>

    {{-- Posts Grid --}}
    <div class="posts-grid">
        @forelse($posts as $post)
            <article class="post-card">
                @if($post->featured_image)
                    <img src="{{ asset('storage/' . $post->featured_image) }}"
                         alt="{{ $post->title }}">
                @endif

                <div class="post-content">
                    <h2>
                        <a href="{{ route('posts.show', $post) }}">
                            {{ $post->title }}
                        </a>
                    </h2>

                    <div class="post-meta">
                        <span>By {{ $post->author->name }}</span>
                        <span>{{ $post->published_at->format('M d, Y') }}</span>
                        <span>{{ $post->reading_time }}</span>
                    </div>

                    <p>{{ Str::limit($post->excerpt, 150) }}</p>

                    <div class="tags">
                        @foreach($post->tags as $tag)
                            <a href="{{ route('posts.index', ['tag' => $tag->slug]) }}"
                               class="tag">
                                {{ $tag->name }}
                            </a>
                        @endforeach
                    </div>
                </div>
            </article>
        @empty
            <p>No posts found.</p>
        @endforelse
    </div>

    {{-- Pagination --}}
    {{ $posts->withQueryString()->links() }}
</div>
@endsection

@push('styles')
<style>
    .posts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 2rem;
    }
</style>
@endpush
```

### Blade Directives

```blade
{{-- Conditionals --}}
@if($user->isAdmin())
    <p>Welcome, Admin!</p>
@elseif($user->isPremium())
    <p>Welcome, Premium User!</p>
@else
    <p>Welcome!</p>
@endif

@unless($user->isGuest())
    <p>You are logged in.</p>
@endunless

@isset($post)
    <h1>{{ $post->title }}</h1>
@endisset

@empty($posts)
    <p>No posts available.</p>
@endempty

{{-- Authentication --}}
@auth
    <p>Welcome, {{ auth()->user()->name }}!</p>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
@endguest

@auth('admin')
    <p>Admin panel access</p>
@endauth

{{-- Loops --}}
@foreach($posts as $post)
    <p>{{ $loop->iteration }}. {{ $post->title }}</p>

    @if($loop->first)
        <span class="badge">First Post</span>
    @endif

    @if($loop->last)
        <span class="badge">Last Post</span>
    @endif
@endforeach

@for($i = 0; $i < 10; $i++)
    <p>Iteration {{ $i }}</p>
@endfor

@while($condition)
    <p>Keep looping...</p>
@endwhile

{{-- Loop with continue/break --}}
@foreach($users as $user)
    @continue($user->inactive)
    @break($user->id === 5)
    <p>{{ $user->name }}</p>
@endforeach

{{-- Switch statement --}}
@switch($post->status)
    @case('draft')
        <span class="badge-gray">Draft</span>
        @break
    @case('published')
        <span class="badge-green">Published</span>
        @break
    @case('archived')
        <span class="badge-red">Archived</span>
        @break
    @default
        <span class="badge">Unknown</span>
@endswitch

{{-- Class and style bindings --}}
<div @class([
    'post-card',
    'featured' => $post->is_featured,
    'draft' => $post->status === 'draft',
])>
    {{ $post->title }}
</div>

{{-- Checked, selected, disabled --}}
<input type="checkbox" @checked($post->is_featured)>
<option value="draft" @selected($post->status === 'draft')>Draft</option>
<button @disabled($post->trashed())>Edit</button>

{{-- Raw PHP --}}
@php
    $totalPosts = count($posts);
    $message = "Found {$totalPosts} posts";
@endphp
```

### Blade Components

Create reusable components:

```php
// Create component class
php artisan make:component Alert
```

```php
// app/View/Components/Alert.php
<?php

namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Alert extends Component
{
    /**
     * Create a new component instance.
     */
    public function __construct(
        public string $type = 'info',
        public ?string $message = null,
        public bool $dismissible = false
    ) {}

    /**
     * Get the alert class based on type.
     */
    public function alertClass(): string
    {
        return match($this->type) {
            'success' => 'bg-green-100 text-green-800',
            'error' => 'bg-red-100 text-red-800',
            'warning' => 'bg-yellow-100 text-yellow-800',
            default => 'bg-blue-100 text-blue-800',
        };
    }

    /**
     * Get the view / contents that represent the component.
     */
    public function render(): View|Closure|string
    {
        return view('components.alert');
    }
}
```

```blade
{{-- resources/views/components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'p-4 rounded-lg ' . $alertClass()]) }}
     role="alert">
    @if($dismissible)
        <button type="button" class="close" onclick="this.parentElement.remove()">
            &times;
        </button>
    @endif

    @if($message)
        {{ $message }}
    @else
        {{ $slot }}
    @endif
</div>
```

Using components:

```blade
{{-- Basic usage --}}
<x-alert type="success" message="Post created successfully!" />

{{-- With slot content --}}
<x-alert type="error" dismissible>
    <strong>Error!</strong> Something went wrong.
</x-alert>

{{-- With additional attributes --}}
<x-alert type="warning" class="mb-4" id="my-alert">
    Please review your submission.
</x-alert>
```

Anonymous components:

```blade
{{-- resources/views/components/card.blade.php --}}
@props([
    'title' => null,
    'footer' => null,
])

<div {{ $attributes->merge(['class' => 'card']) }}>
    @if($title)
        <div class="card-header">
            {{ $title }}
        </div>
    @endif

    <div class="card-body">
        {{ $slot }}
    </div>

    @if($footer)
        <div class="card-footer">
            {{ $footer }}
        </div>
    @endif
</div>

{{-- Usage --}}
<x-card title="Welcome">
    <p>Card content here.</p>

    <x-slot:footer>
        <button>Save</button>
    </x-slot:footer>
</x-card>
```

## Authentication

### Laravel Breeze Setup

Laravel Breeze provides simple authentication scaffolding:

```bash
# Install Breeze
composer require laravel/breeze --dev

# Install Breeze with Blade
php artisan breeze:install blade

# Or with Inertia + Vue
php artisan breeze:install vue

# Or with Inertia + React
php artisan breeze:install react

# Install NPM dependencies and build
npm install && npm run dev

# Run migrations
php artisan migrate
```

### Manual Authentication

Implement authentication manually:

```php
// app/Http/Controllers/Auth/LoginController.php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm(): View
    {
        return view('auth.login');
    }

    /**
     * Handle login request.
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'))
                ->with('success', 'Welcome back!');
        }

        return back()
            ->withInput($request->only('email'))
            ->withErrors([
                'email' => 'The provided credentials do not match our records.',
            ]);
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home')
            ->with('success', 'You have been logged out.');
    }
}
```

```php
// app/Http/Controllers/Auth/RegisterController.php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class RegisterController extends Controller
{
    /**
     * Show registration form.
     */
    public function showRegistrationForm(): View
    {
        return view('auth.register');
    }

    /**
     * Handle registration.
     */
    public function register(RegisterRequest $request): RedirectResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('dashboard')
            ->with('success', 'Welcome! Your account has been created.');
    }
}
```

### Authorization with Gates and Policies

Define authorization logic:

```php
// app/Providers/AuthServiceProvider.php
<?php

namespace App\Providers;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     */
    protected $policies = [
        Post::class => PostPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Define gates
        Gate::define('admin', function (User $user) {
            return $user->is_admin;
        });

        Gate::define('edit-settings', function (User $user) {
            return $user->hasRole('admin') || $user->hasRole('editor');
        });

        // Before callback (super admin bypass)
        Gate::before(function (User $user, string $ability) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });
    }
}
```

```php
// app/Policies/PostPolicy.php
<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * Determine if the user can view any posts.
     */
    public function viewAny(?User $user): bool
    {
        return true; // Anyone can view posts
    }

    /**
     * Determine if the user can view the post.
     */
    public function view(?User $user, Post $post): bool
    {
        if ($post->status === 'published') {
            return true;
        }

        return $user?->id === $post->user_id;
    }

    /**
     * Determine if the user can create posts.
     */
    public function create(User $user): bool
    {
        return $user->hasVerifiedEmail();
    }

    /**
     * Determine if the user can update the post.
     */
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }

    /**
     * Determine if the user can delete the post.
     */
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }

    /**
     * Determine if the user can restore the post.
     */
    public function restore(User $user, Post $post): bool
    {
        return $user->id === $post->user_id;
    }

    /**
     * Determine if the user can permanently delete the post.
     */
    public function forceDelete(User $user, Post $post): bool
    {
        return $user->is_admin;
    }
}
```

Using authorization:

```php
// In controller
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);

    // Or using Gate
    if (Gate::denies('update', $post)) {
        abort(403);
    }

    // Update logic
}

// In Blade templates
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan

@cannot('delete', $post)
    <p>You cannot delete this post.</p>
@endcannot

@canany(['update', 'delete'], $post)
    <div class="actions">...</div>
@endcanany
```

### API Authentication with Sanctum

Install and configure Laravel Sanctum:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

```php
// app/Http/Controllers/Api/AuthController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle API login.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Handle API logout.
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        // Or revoke all tokens
        // $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
```

## Queues and Jobs

### Creating Jobs

```bash
php artisan make:job ProcessPodcast
```

```php
// app/Jobs/ProcessPodcast.php
<?php

namespace App\Jobs;

use App\Models\Podcast;
use App\Services\AudioProcessor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessPodcast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public int $backoff = 60;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 300;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Podcast $podcast
    ) {}

    /**
     * Execute the job.
     */
    public function handle(AudioProcessor $processor): void
    {
        Log::info("Processing podcast: {$this->podcast->title}");

        // Process the podcast audio
        $processor->process($this->podcast->audio_path);

        // Update podcast status
        $this->podcast->update(['status' => 'processed']);

        Log::info("Podcast processed successfully: {$this->podcast->id}");
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Podcast processing failed: {$this->podcast->id}", [
            'error' => $exception->getMessage(),
        ]);

        $this->podcast->update(['status' => 'failed']);
    }
}
```

### Dispatching Jobs

```php
use App\Jobs\ProcessPodcast;
use App\Jobs\SendWelcomeEmail;
use App\Models\Podcast;

// Basic dispatch
ProcessPodcast::dispatch($podcast);

// Dispatch with delay
ProcessPodcast::dispatch($podcast)
    ->delay(now()->addMinutes(10));

// Dispatch to specific queue
ProcessPodcast::dispatch($podcast)
    ->onQueue('podcasts');

// Dispatch to specific connection
ProcessPodcast::dispatch($podcast)
    ->onConnection('redis');

// Dispatch after response is sent
ProcessPodcast::dispatchAfterResponse($podcast);

// Conditional dispatch
ProcessPodcast::dispatchIf($podcast->needs_processing, $podcast);
ProcessPodcast::dispatchUnless($podcast->is_processed, $podcast);

// Job chaining
Bus::chain([
    new ProcessPodcast($podcast),
    new OptimizePodcast($podcast),
    new NotifySubscribers($podcast),
])->dispatch();

// Job batching
Bus::batch([
    new ProcessPodcast($podcast1),
    new ProcessPodcast($podcast2),
    new ProcessPodcast($podcast3),
])
->then(function (Batch $batch) {
    // All jobs completed successfully
})
->catch(function (Batch $batch, Throwable $e) {
    // First batch job failure detected
})
->finally(function (Batch $batch) {
    // Batch has finished executing
})
->dispatch();
```

### Queue Workers

Run queue workers:

```bash
# Start a queue worker
php artisan queue:work

# Process jobs from specific queue
php artisan queue:work --queue=high,default,low

# Process single job
php artisan queue:work --once

# Specify connection
php artisan queue:work redis --queue=emails

# With memory limit and timeout
php artisan queue:work --memory=512 --timeout=60

# Restart workers after code changes
php artisan queue:restart
```

### Scheduled Tasks

Define scheduled tasks in `routes/console.php` or `app/Console/Kernel.php`:

```php
// routes/console.php (Laravel 11+)
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\SendDailyDigest;
use App\Jobs\CleanupOldPosts;

Schedule::command('inspire')->hourly();

Schedule::command(SendDailyDigest::class)
    ->dailyAt('08:00')
    ->timezone('America/New_York')
    ->emailOutputOnFailure('admin@example.com');

Schedule::job(new CleanupOldPosts)
    ->daily()
    ->withoutOverlapping()
    ->runInBackground();

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->weekly();

// Complex scheduling
Schedule::command('report:generate')
    ->weekdays()
    ->at('17:00')
    ->environments(['production'])
    ->when(function () {
        return true;
    })
    ->onOneServer()
    ->before(function () {
        // Task is about to run
    })
    ->after(function () {
        // Task has completed
    });
```

Run the scheduler:

```bash
# Run scheduler once
php artisan schedule:run

# Run scheduler continuously (for testing)
php artisan schedule:work

# List scheduled tasks
php artisan schedule:list
```

Add to crontab for production:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

## Events and Listeners

### Creating Events

```bash
php artisan make:event PostPublished
```

```php
// app/Events/PostPublished.php
<?php

namespace App\Events;

use App\Models\Post;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PostPublished implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Post $post
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->post->user_id),
            new Channel('posts'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'post.published';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->post->id,
            'title' => $this->post->title,
            'slug' => $this->post->slug,
        ];
    }
}
```

### Creating Listeners

```bash
php artisan make:listener SendPostPublishedNotification --event=PostPublished
```

```php
// app/Listeners/SendPostPublishedNotification.php
<?php

namespace App\Listeners;

use App\Events\PostPublished;
use App\Notifications\NewPostNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPostPublishedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the queue the job should be sent to.
     */
    public string $queue = 'notifications';

    /**
     * Handle the event.
     */
    public function handle(PostPublished $event): void
    {
        $subscribers = $event->post->author->subscribers;

        foreach ($subscribers as $subscriber) {
            $subscriber->notify(new NewPostNotification($event->post));
        }
    }

    /**
     * Determine whether the listener should be queued.
     */
    public function shouldQueue(PostPublished $event): bool
    {
        return $event->post->status === 'published';
    }
}
```

### Registering Events

```php
// app/Providers/EventServiceProvider.php
<?php

namespace App\Providers;

use App\Events\PostPublished;
use App\Listeners\SendPostPublishedNotification;
use App\Listeners\UpdatePostStatistics;
use App\Listeners\NotifyAdmins;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        PostPublished::class => [
            SendPostPublishedNotification::class,
            UpdatePostStatistics::class,
            NotifyAdmins::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        // Model observers
        Post::observe(PostObserver::class);
    }
}
```

### Dispatching Events

```php
use App\Events\PostPublished;

// Dispatch event
event(new PostPublished($post));

// Or using static method
PostPublished::dispatch($post);

// Dispatch with broadcast
PostPublished::dispatch($post)->broadcast();
```

## Testing

### Feature Tests

```php
// tests/Feature/PostTest.php
<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    public function test_guests_can_view_published_posts(): void
    {
        $post = Post::factory()->published()->create();

        $response = $this->get(route('posts.index'));

        $response->assertStatus(200)
                 ->assertSee($post->title);
    }

    public function test_guests_cannot_create_posts(): void
    {
        $response = $this->get(route('posts.create'));

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_create_posts(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('posts.store'), [
                'title' => 'Test Post',
                'content' => 'This is the content of the test post.',
                'status' => 'draft',
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('posts', [
            'title' => 'Test Post',
            'user_id' => $user->id,
        ]);
    }

    public function test_users_can_only_edit_their_own_posts(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::factory()->for($otherUser)->create();

        $response = $this->actingAs($user)
            ->get(route('posts.edit', $post));

        $response->assertForbidden();
    }

    public function test_post_creation_validates_input(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('posts.store'), [
                'title' => '', // Empty title
                'content' => 'Content',
            ]);

        $response->assertSessionHasErrors(['title']);
    }

    public function test_api_returns_paginated_posts(): void
    {
        Post::factory()->count(25)->published()->create();

        $response = $this->getJson('/api/posts');

        $response->assertStatus(200)
                 ->assertJsonCount(15, 'data')
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['id', 'title', 'slug', 'excerpt'],
                     ],
                     'meta' => ['current_page', 'total'],
                 ]);
    }
}
```

### Unit Tests

```php
// tests/Unit/PostTest.php
<?php

namespace Tests\Unit;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_post_has_slug(): void
    {
        $post = Post::factory()->create(['title' => 'My Test Post']);

        $this->assertEquals('my-test-post', $post->slug);
    }

    public function test_post_belongs_to_author(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->for($user)->create();

        $this->assertInstanceOf(User::class, $post->author);
        $this->assertEquals($user->id, $post->author->id);
    }

    public function test_reading_time_calculation(): void
    {
        $post = Post::factory()->create([
            'content' => str_repeat('word ', 400), // 400 words
        ]);

        $this->assertEquals('2 min read', $post->reading_time);
    }

    public function test_published_scope(): void
    {
        Post::factory()->count(3)->published()->create();
        Post::factory()->count(2)->draft()->create();

        $publishedPosts = Post::published()->count();

        $this->assertEquals(3, $publishedPosts);
    }
}
```

### Model Factories

```php
// database/factories/PostFactory.php
<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        $title = fake()->sentence();

        return [
            'user_id' => User::factory(),
            'category_id' => Category::factory(),
            'title' => $title,
            'slug' => Str::slug($title),
            'content' => fake()->paragraphs(5, true),
            'excerpt' => fake()->paragraph(),
            'status' => 'draft',
            'views' => fake()->numberBetween(0, 1000),
            'published_at' => null,
        ];
    }

    /**
     * Indicate that the post is published.
     */
    public function published(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    /**
     * Indicate that the post is a draft.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }

    /**
     * Indicate that the post is featured.
     */
    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
```

Run tests:

```bash
# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage

# Run specific test file
php artisan test tests/Feature/PostTest.php

# Run specific test method
php artisan test --filter test_guests_can_view_published_posts

# Run in parallel
php artisan test --parallel
```

## Deployment

### Production Configuration

Optimize Laravel for production:

```bash
# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Cache events
php artisan event:cache

# Optimize autoloader
composer install --optimize-autoloader --no-dev

# All optimizations at once
php artisan optimize
```

### Environment Configuration

Production `.env` settings:

```bash
APP_NAME=MyApp
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://yourapp.com

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=your-mail-host
MAIL_PORT=587
MAIL_USERNAME=your-mail-username
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=tls
```

### Deployment Script

Example deployment script:

```bash
#!/bin/bash
set -e

echo "Deploying application..."

# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan optimize:clear
php artisan optimize

# Restart queue workers
php artisan queue:restart

# Restart PHP-FPM (if using)
sudo systemctl reload php8.2-fpm

echo "Deployment complete!"
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM php:8.2-fpm

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libpq-dev

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Install dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/var/www
    depends_on:
      - mysql
      - redis

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - .:/var/www
      - ./docker/nginx:/etc/nginx/conf.d
    depends_on:
      - app

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: laravel
      MYSQL_ROOT_PASSWORD: secret
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

  queue:
    build:
      context: .
      dockerfile: Dockerfile
    command: php artisan queue:work --sleep=3 --tries=3
    depends_on:
      - app
      - redis

volumes:
  mysql_data:
  redis_data:
```

## Summary

Laravel is a comprehensive PHP framework that provides everything needed to build modern, secure, and scalable web applications. Its key strengths include:

1. **Elegant Syntax**: Expressive, readable code that makes development enjoyable
2. **Eloquent ORM**: Beautiful ActiveRecord implementation for database operations
3. **Blade Templates**: Powerful templating with zero overhead
4. **Robust Routing**: Flexible routing system with middleware support
5. **Built-in Authentication**: Complete auth system with API support via Sanctum
6. **Queue System**: Background job processing for improved performance
7. **Event System**: Decoupled application architecture with events and listeners
8. **Testing Support**: Comprehensive testing tools for confident deployments
9. **Artisan CLI**: Powerful command-line tools for automation
10. **Rich Ecosystem**: First-party packages like Forge, Vapor, Nova, and Horizon

Laravel's philosophy of making development an enjoyable experience, combined with its robust feature set, makes it an excellent choice for PHP web development. Whether building a simple blog or a complex enterprise application, Laravel provides the tools and patterns to do it elegantly and efficiently.

For continued learning, explore the official Laravel documentation, join the Laravel community, and practice building real-world applications. The framework's active development and extensive ecosystem ensure it remains at the forefront of PHP development.
