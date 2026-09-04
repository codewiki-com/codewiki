---
title: Laravel Framework
description: Complete guide to Laravel, routing, controllers, Eloquent ORM and middleware
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - MVC
  - Eloquent
status: imported
origin: old/src/content/docs/php/laravel.en.md
divergence: 0.231
issues: []
legacy:
  category: PHP
  subcategory: Web Frameworks
  order: 3
  lastUpdated: 2026-01-07
---

Laravel is a powerful, elegant PHP framework designed for web artisans. It provides an expressive, beautiful syntax while offering robust features for building modern web applications. Laravel follows the Model-View-Controller (MVC) architectural pattern and comes with built-in tools for routing, authentication, database management, and much more.

## Getting Started

### Installation

Laravel requires PHP 8.1 or higher and Composer. To create a new Laravel project:

```bash
# Create a new Laravel project
composer create-project laravel/laravel my-application

# Navigate to your project
cd my-application

# Start the development server
php artisan serve
```

Alternatively, you can use the Laravel installer:

```bash
# Install the Laravel installer globally
composer global require laravel/installer

# Create a new project
laravel new my-application
```

### Project Structure

A Laravel project follows a well-organized directory structure:

```
my-application/
├── app/                    # Application core code
│   ├── Http/
│   │   ├── Controllers/    # Request controllers
│   │   └── Middleware/     # HTTP middleware
│   ├── Models/             # Eloquent models
│   └── Providers/          # Service providers
├── bootstrap/              # Framework bootstrap files
├── config/                 # Configuration files
├── database/
│   ├── factories/          # Model factories
│   ├── migrations/         # Database migrations
│   └── seeders/            # Database seeders
├── public/                 # Publicly accessible files
├── resources/
│   ├── css/                # CSS files
│   ├── js/                 # JavaScript files
│   └── views/              # Blade templates
├── routes/                 # Route definitions
│   ├── api.php             # API routes
│   └── web.php             # Web routes
├── storage/                # Logs, cache, sessions
├── tests/                  # Test files
└── .env                    # Environment configuration
```

## Routing

Routes define how your application responds to HTTP requests. Laravel's routing system is expressive and flexible.

### Basic Routes

Routes are defined in `routes/web.php` for web routes and `routes/api.php` for API routes:

```php
use Illuminate\Support\Facades\Route;

// Basic GET route
Route::get('/', function () {
    return view('welcome');
});

// Route with parameter
Route::get('/users/{id}', function (string $id) {
    return "User ID: " . $id;
});

// Optional parameter
Route::get('/posts/{slug?}', function (?string $slug = null) {
    return $slug ? "Post: {$slug}" : "All posts";
});

// Multiple HTTP methods
Route::match(['get', 'post'], '/form', function () {
    return 'This handles GET and POST requests';
});

// Any HTTP method
Route::any('/webhook', function () {
    return 'Handles any HTTP method';
});
```

### Named Routes

Named routes allow you to generate URLs and redirects easily:

```php
Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');

// Generate URL to named route
$url = route('dashboard');

// Redirect to named route
return redirect()->route('dashboard');

// Named route with parameters
Route::get('/posts/{post}/comments/{comment}', function ($postId, $commentId) {
    // ...
})->name('posts.comments.show');

$url = route('posts.comments.show', ['post' => 1, 'comment' => 5]);
```

### Route Groups

Group routes that share common attributes:

```php
// Prefix group
Route::prefix('admin')->group(function () {
    Route::get('/users', function () {
        // Matches /admin/users
    });

    Route::get('/settings', function () {
        // Matches /admin/settings
    });
});

// Middleware group
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return view('dashboard');
    });

    Route::get('/profile', function () {
        return view('profile');
    });
});

// Combined attributes
Route::prefix('api/v1')
    ->middleware('api')
    ->name('api.')
    ->group(function () {
        Route::get('/users', function () {
            // Name: api.users, URL: /api/v1/users
        })->name('users');
    });
```

### Route Model Binding

Laravel automatically injects model instances based on route parameters:

```php
use App\Models\User;
use App\Models\Post;

// Implicit binding - Laravel finds User by ID
Route::get('/users/{user}', function (User $user) {
    return $user->name;
});

// Implicit binding with custom column
Route::get('/posts/{post:slug}', function (Post $post) {
    return $post->title;
});

// Scoped binding - ensures comment belongs to post
Route::get('/posts/{post}/comments/{comment:id}', function (Post $post, Comment $comment) {
    return $comment;
})->scopeBindings();
```

## Controllers

Controllers organize request handling logic into dedicated classes.

### Creating Controllers

```bash
# Create a basic controller
php artisan make:controller UserController

# Create a resource controller with all CRUD methods
php artisan make:controller PostController --resource

# Create an API resource controller (no create/edit methods)
php artisan make:controller Api/ProductController --api

# Create controller with model binding
php artisan make:controller CommentController --model=Comment
```

### Basic Controller

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(): View
    {
        $users = User::paginate(15);

        return view('users.index', compact('users'));
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): View
    {
        return view('users.show', compact('user'));
    }

    /**
     * Show the form for creating a new user.
     */
    public function create(): View
    {
        return view('users.create');
    }

    /**
     * Store a newly created user.
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
            ->with('success', 'User created successfully!');
    }

    /**
     * Update the specified user.
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
            ->with('success', 'User updated successfully!');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'User deleted successfully!');
    }
}
```

### Resource Routes

Register all CRUD routes with a single line:

```php
use App\Http\Controllers\PostController;

// Registers all resource routes
Route::resource('posts', PostController::class);

// This creates the following routes:
// GET     /posts              -> index()    -> posts.index
// GET     /posts/create       -> create()   -> posts.create
// POST    /posts              -> store()    -> posts.store
// GET     /posts/{post}       -> show()     -> posts.show
// GET     /posts/{post}/edit  -> edit()     -> posts.edit
// PUT     /posts/{post}       -> update()   -> posts.update
// DELETE  /posts/{post}       -> destroy()  -> posts.destroy

// Limit to specific methods
Route::resource('posts', PostController::class)->only([
    'index', 'show'
]);

// Exclude specific methods
Route::resource('posts', PostController::class)->except([
    'destroy'
]);

// API resources (no create/edit)
Route::apiResource('products', ProductController::class);
```

### Single Action Controllers

For controllers that handle only one action:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Response;

class ProcessOrderController extends Controller
{
    /**
     * Process the order.
     */
    public function __invoke(Order $order): Response
    {
        $order->process();

        return response()->json([
            'message' => 'Order processed successfully',
            'order' => $order,
        ]);
    }
}
```

Register single action controller:

```php
Route::post('/orders/{order}/process', ProcessOrderController::class);
```

## Middleware

Middleware filters HTTP requests entering your application. They can inspect, modify, or reject requests.

### Creating Middleware

```bash
php artisan make:middleware EnsureUserIsAdmin
```

```php
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
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            return redirect()->route('home')
                ->with('error', 'You do not have admin access.');
        }

        return $next($request);
    }
}
```

### Registering Middleware

Register middleware in `bootstrap/app.php` (Laravel 11+):

```php
use App\Http\Middleware\EnsureUserIsAdmin;

return Application::configure(basePath: dirname(__DIR__))
    ->withMiddleware(function (Middleware $middleware) {
        // Global middleware (runs on every request)
        $middleware->append(EnsureUserIsAdmin::class);

        // Middleware alias
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'role' => \App\Http\Middleware\CheckRole::class,
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

```php
// Single middleware
Route::get('/admin', function () {
    // ...
})->middleware('admin');

// Multiple middleware
Route::get('/admin/users', function () {
    // ...
})->middleware(['auth', 'admin']);

// Middleware with parameters
Route::get('/posts', function () {
    // ...
})->middleware('role:editor');

// Controller middleware
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->except('index');
        $this->middleware('log')->only('store');
    }
}
```

### Middleware with Parameters

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user || !in_array($user->role, $roles)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
```

Usage:

```php
Route::get('/admin', function () {
    // ...
})->middleware('role:admin,super-admin');
```

### After Middleware

Middleware can perform actions after the response:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LogResponseTime
{
    public function handle(Request $request, Closure $next): mixed
    {
        $start = microtime(true);

        $response = $next($request);

        $duration = microtime(true) - $start;

        Log::info('Request processed', [
            'url' => $request->url(),
            'duration_ms' => round($duration * 1000, 2),
        ]);

        return $response;
    }
}
```

## Eloquent ORM

Eloquent is Laravel's powerful ActiveRecord implementation for working with databases.

### Defining Models

```bash
# Create a model
php artisan make:model Post

# Create model with migration, factory, seeder, and controller
php artisan make:model Post -mfsc

# Create model with all options
php artisan make:model Post --all
```

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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
        'published_at',
        'user_id',
    ];

    /**
     * The attributes that should be hidden for arrays.
     */
    protected $hidden = [
        'created_at',
        'updated_at',
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
     * Get the reading time attribute.
     */
    public function getReadingTimeAttribute(): int
    {
        $words = str_word_count(strip_tags($this->content));
        return (int) ceil($words / 200);
    }

    /**
     * Set the title and auto-generate slug.
     */
    public function setTitleAttribute(string $value): void
    {
        $this->attributes['title'] = $value;
        $this->attributes['slug'] = Str::slug($value);
    }
}
```

### Eloquent Relationships

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Post extends Model
{
    /**
     * One-to-Many (Inverse): Post belongs to a User
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * One-to-Many: Post has many Comments
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Many-to-Many: Post belongs to many Tags
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)
            ->withTimestamps()
            ->withPivot('order');
    }

    /**
     * One-to-One: Post has one Featured Image
     */
    public function featuredImage(): HasOne
    {
        return $this->hasOne(Image::class)->where('is_featured', true);
    }

    /**
     * Polymorphic: Post has many Images
     */
    public function images(): MorphMany
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}

class User extends Model
{
    /**
     * One-to-Many: User has many Posts
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Has Many Through: User has many Comments through Posts
     */
    public function comments(): HasManyThrough
    {
        return $this->hasManyThrough(Comment::class, Post::class);
    }
}
```

### Querying with Eloquent

```php
use App\Models\Post;
use App\Models\User;

// Retrieve all records
$posts = Post::all();

// Find by primary key
$post = Post::find(1);
$post = Post::findOrFail(1); // Throws 404 if not found

// First matching record
$post = Post::where('slug', 'my-first-post')->first();
$post = Post::where('slug', 'my-first-post')->firstOrFail();

// Where clauses
$posts = Post::where('status', 'published')
    ->where('views', '>', 100)
    ->orWhere('is_featured', true)
    ->get();

// Where with array
$posts = Post::whereIn('status', ['published', 'draft'])->get();
$posts = Post::whereBetween('created_at', [$startDate, $endDate])->get();
$posts = Post::whereNull('deleted_at')->get();

// Ordering and limiting
$posts = Post::orderBy('created_at', 'desc')
    ->take(10)
    ->get();

// Counting and aggregates
$count = Post::where('status', 'published')->count();
$avgViews = Post::avg('views');
$maxViews = Post::max('views');

// Chunking for large datasets
Post::chunk(100, function ($posts) {
    foreach ($posts as $post) {
        // Process each post
    }
});

// Lazy loading with cursor (memory efficient)
foreach (Post::cursor() as $post) {
    // Process each post
}
```

### Eager Loading

Prevent N+1 query problems with eager loading:

```php
// Without eager loading: N+1 problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name; // Queries for each post
}

// With eager loading: 2 queries total
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name; // No additional query
}

// Multiple relationships
$posts = Post::with(['author', 'tags', 'comments'])->get();

// Nested relationships
$posts = Post::with('author.profile')->get();

// Eager loading with constraints
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)
        ->orderBy('created_at', 'desc');
}])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('author');

// Count related models without loading them
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;
}
```

### Creating and Updating Records

```php
// Create a new record
$post = new Post();
$post->title = 'My New Post';
$post->content = 'Post content here...';
$post->user_id = auth()->id();
$post->save();

// Create using mass assignment
$post = Post::create([
    'title' => 'My New Post',
    'content' => 'Post content here...',
    'user_id' => auth()->id(),
]);

// Update existing record
$post = Post::find(1);
$post->title = 'Updated Title';
$post->save();

// Update using mass assignment
$post->update([
    'title' => 'Updated Title',
    'content' => 'Updated content...',
]);

// Update or create
$post = Post::updateOrCreate(
    ['slug' => 'my-post'],           // Search criteria
    ['title' => 'My Post', 'content' => '...'] // Values to update/create
);

// First or create
$user = User::firstOrCreate(
    ['email' => 'john@example.com'],
    ['name' => 'John Doe']
);

// Upsert (bulk update or insert)
Post::upsert([
    ['id' => 1, 'title' => 'Post 1', 'views' => 100],
    ['id' => 2, 'title' => 'Post 2', 'views' => 200],
], ['id'], ['title', 'views']);
```

### Deleting Records

```php
// Delete a specific record
$post = Post::find(1);
$post->delete();

// Delete by primary key
Post::destroy(1);
Post::destroy([1, 2, 3]);

// Delete with conditions
Post::where('status', 'draft')
    ->where('created_at', '<', now()->subYear())
    ->delete();

// Soft deletes (requires SoftDeletes trait)
$post->delete(); // Sets deleted_at timestamp

// Restore soft deleted record
$post->restore();

// Permanently delete
$post->forceDelete();

// Query including soft deleted
$posts = Post::withTrashed()->get();

// Query only soft deleted
$posts = Post::onlyTrashed()->get();
```

### Query Scopes

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * Local scope for published posts.
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Local scope for posts by author.
     */
    public function scopeByAuthor(Builder $query, User $user): Builder
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Local scope for popular posts.
     */
    public function scopePopular(Builder $query, int $minViews = 1000): Builder
    {
        return $query->where('views', '>=', $minViews)
            ->orderBy('views', 'desc');
    }
}

// Using scopes
$posts = Post::published()->get();
$posts = Post::published()->byAuthor($user)->get();
$posts = Post::popular(5000)->get();
```

## Blade Templates

Blade is Laravel's powerful templating engine that compiles to plain PHP.

### Basic Blade Syntax

```blade
{{-- resources/views/posts/show.blade.php --}}

{{-- Escaped output --}}
<h1>{{ $post->title }}</h1>

{{-- Unescaped output (use with caution) --}}
<div>{!! $post->content !!}</div>

{{-- Comments (not rendered in HTML) --}}
{{-- This is a Blade comment --}}

{{-- PHP directives --}}
@php
    $currentDate = now()->format('Y-m-d');
@endphp

{{-- Conditionals --}}
@if($post->isPublished())
    <span class="badge badge-success">Published</span>
@elseif($post->isScheduled())
    <span class="badge badge-warning">Scheduled</span>
@else
    <span class="badge badge-secondary">Draft</span>
@endif

{{-- Unless (inverse of if) --}}
@unless($post->isPublished())
    <span>Not yet published</span>
@endunless

{{-- Isset and empty checks --}}
@isset($post->featured_image)
    <img src="{{ $post->featured_image }}" alt="{{ $post->title }}">
@endisset

@empty($posts)
    <p>No posts available.</p>
@endempty

{{-- Authentication directives --}}
@auth
    <p>Welcome, {{ auth()->user()->name }}!</p>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
@endguest
```

### Loops

```blade
{{-- For loop --}}
@for($i = 0; $i < 10; $i++)
    <p>Iteration {{ $i }}</p>
@endfor

{{-- Foreach loop --}}
@foreach($posts as $post)
    <article>
        <h2>{{ $post->title }}</h2>
        <p>{{ $post->excerpt }}</p>
    </article>
@endforeach

{{-- Forelse (foreach with empty fallback) --}}
@forelse($posts as $post)
    <article>
        <h2>{{ $post->title }}</h2>
    </article>
@empty
    <p>No posts found.</p>
@endforelse

{{-- While loop --}}
@while(true)
    <p>Looping forever...</p>
    @break
@endwhile

{{-- Loop variable --}}
@foreach($posts as $post)
    @if($loop->first)
        <p>This is the first post.</p>
    @endif

    <article class="{{ $loop->even ? 'bg-gray' : 'bg-white' }}">
        <span>{{ $loop->iteration }} of {{ $loop->count }}</span>
        <h2>{{ $post->title }}</h2>
    </article>

    @if($loop->last)
        <p>This is the last post.</p>
    @endif
@endforeach

{{-- Continue and break --}}
@foreach($posts as $post)
    @continue($post->isDraft())

    <article>{{ $post->title }}</article>

    @break($loop->iteration >= 10)
@endforeach
```

### Layouts and Components

**Layout Template:**

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'My Application')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
</head>
<body>
    <nav>
        @include('partials.navigation')
    </nav>

    <main class="container">
        @hasSection('sidebar')
            <div class="grid grid-cols-4">
                <div class="col-span-3">
                    @yield('content')
                </div>
                <aside>
                    @yield('sidebar')
                </aside>
            </div>
        @else
            @yield('content')
        @endif
    </main>

    <footer>
        @include('partials.footer')
    </footer>

    @stack('scripts')
</body>
</html>
```

**Child Template:**

```blade
{{-- resources/views/posts/show.blade.php --}}
@extends('layouts.app')

@section('title', $post->title)

@section('content')
    <article>
        <h1>{{ $post->title }}</h1>
        <div class="meta">
            <span>By {{ $post->author->name }}</span>
            <span>{{ $post->published_at->diffForHumans() }}</span>
        </div>
        <div class="content">
            {!! $post->content !!}
        </div>
    </article>
@endsection

@section('sidebar')
    <h3>Related Posts</h3>
    @foreach($relatedPosts as $related)
        <a href="{{ route('posts.show', $related) }}">
            {{ $related->title }}
        </a>
    @endforeach
@endsection

@push('scripts')
    <script src="/js/post-interactions.js"></script>
@endpush
```

### Blade Components

**Create a component:**

```bash
php artisan make:component Alert
php artisan make:component Forms/Input
```

**Component Class:**

```php
<?php
// app/View/Components/Alert.php

namespace App\View\Components;

use Illuminate\View\Component;
use Illuminate\View\View;

class Alert extends Component
{
    public function __construct(
        public string $type = 'info',
        public ?string $message = null,
        public bool $dismissible = false
    ) {}

    public function render(): View
    {
        return view('components.alert');
    }

    public function alertClasses(): string
    {
        return match($this->type) {
            'success' => 'bg-green-100 text-green-800 border-green-500',
            'error' => 'bg-red-100 text-red-800 border-red-500',
            'warning' => 'bg-yellow-100 text-yellow-800 border-yellow-500',
            default => 'bg-blue-100 text-blue-800 border-blue-500',
        };
    }
}
```

**Component View:**

```blade
{{-- resources/views/components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'alert border-l-4 p-4 ' . $alertClasses()]) }}
     role="alert">
    @if($dismissible)
        <button type="button" class="close" onclick="this.parentElement.remove()">
            &times;
        </button>
    @endif

    @if($message)
        <p>{{ $message }}</p>
    @else
        {{ $slot }}
    @endif
</div>
```

**Using Components:**

```blade
{{-- Simple usage --}}
<x-alert type="success" message="Your changes have been saved!" />

{{-- With slot content --}}
<x-alert type="error" dismissible>
    <strong>Error!</strong> Something went wrong.
</x-alert>

{{-- With additional attributes --}}
<x-alert type="warning" class="mb-4" id="warning-alert">
    Please review your input.
</x-alert>

{{-- Named slots --}}
<x-card>
    <x-slot:header>
        <h2>Card Title</h2>
    </x-slot>

    <p>Card content goes here.</p>

    <x-slot:footer>
        <button>Submit</button>
    </x-slot>
</x-card>
```

## Validation

Laravel provides robust validation for incoming request data.

### Basic Validation

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|unique:posts,slug',
            'content' => 'required|string|min:100',
            'excerpt' => 'nullable|string|max:500',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
            'published_at' => 'nullable|date|after:today',
            'featured_image' => 'nullable|image|mimes:jpg,png,webp|max:2048',
        ]);

        // Create post with validated data
        $post = Post::create($validated);

        return redirect()->route('posts.show', $post);
    }
}
```

### Form Request Validation

Create a dedicated form request class:

```bash
php artisan make:request StorePostRequest
```

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Post::class);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                Rule::unique('posts')->ignore($this->post),
            ],
            'content' => ['required', 'string', 'min:100'],
            'category_id' => ['required', 'exists:categories,id'],
            'status' => ['required', Rule::in(['draft', 'published', 'scheduled'])],
            'tags' => ['array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * Get custom attribute names for validator errors.
     */
    public function attributes(): array
    {
        return [
            'category_id' => 'category',
            'tags.*' => 'tag',
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Please provide a title for your post.',
            'content.min' => 'Your post content must be at least :min characters.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'slug' => Str::slug($this->slug ?? $this->title),
        ]);
    }
}
```

Use the form request in your controller:

```php
use App\Http\Requests\StorePostRequest;

public function store(StorePostRequest $request)
{
    // Request is automatically validated
    $post = Post::create($request->validated());

    return redirect()->route('posts.show', $post);
}
```

### Custom Validation Rules

```bash
php artisan make:rule Uppercase
```

```php
<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Uppercase implements ValidationRule
{
    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strtoupper($value) !== $value) {
            $fail('The :attribute must be uppercase.');
        }
    }
}

// Usage
use App\Rules\Uppercase;

$request->validate([
    'code' => ['required', 'string', new Uppercase],
]);
```

### Displaying Validation Errors

```blade
{{-- Display all errors --}}
@if($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

{{-- Display error for specific field --}}
<div class="form-group">
    <label for="title">Title</label>
    <input type="text"
           name="title"
           id="title"
           value="{{ old('title') }}"
           class="form-control @error('title') is-invalid @enderror">

    @error('title')
        <span class="invalid-feedback">{{ $message }}</span>
    @enderror
</div>

{{-- Check if field has error --}}
@if($errors->has('email'))
    <p class="text-red-500">{{ $errors->first('email') }}</p>
@endif
```

## Authentication

Laravel provides a complete authentication system out of the box.

### Laravel Breeze (Starter Kit)

```bash
# Install Laravel Breeze
composer require laravel/breeze --dev

# Install with Blade views
php artisan breeze:install blade

# Or with Vue/React/Livewire
php artisan breeze:install vue
php artisan breeze:install react
php artisan breeze:install livewire

# Run migrations and build assets
php artisan migrate
npm install && npm run build
```

### Manual Authentication

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Handle a login attempt.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        throw ValidationException::withMessages([
            'email' => __('auth.failed'),
        ]);
    }

    /**
     * Log the user out.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
```

### Protecting Routes

```php
// Using middleware
Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware('auth');

// Grouped routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
});

// Guest only routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm']);
    Route::post('/login', [LoginController::class, 'login']);
});
```

### Accessing the Authenticated User

```php
use Illuminate\Support\Facades\Auth;

// Get the currently authenticated user
$user = Auth::user();
$user = auth()->user();
$user = $request->user();

// Get the user's ID
$id = Auth::id();

// Check if user is authenticated
if (Auth::check()) {
    // User is logged in
}

// In Blade templates
@auth
    <p>Welcome, {{ auth()->user()->name }}!</p>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
@endguest
```

### Authorization with Gates and Policies

**Define Gates:**

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Gate;

public function boot(): void
{
    Gate::define('update-post', function (User $user, Post $post) {
        return $user->id === $post->user_id;
    });

    Gate::define('admin', function (User $user) {
        return $user->is_admin;
    });
}
```

**Create a Policy:**

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
     * Determine if the user can view any posts.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine if the user can view the post.
     */
    public function view(User $user, Post $post): bool
    {
        return $post->status === 'published'
            || $user->id === $post->user_id;
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
        return $user->id === $post->user_id;
    }

    /**
     * Determine if the user can delete the post.
     */
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id
            || $user->is_admin;
    }
}
```

**Using Authorization:**

```php
// In controllers
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);

    // User is authorized...
}

// Using Gate facade
use Illuminate\Support\Facades\Gate;

if (Gate::allows('update-post', $post)) {
    // User can update the post
}

if (Gate::denies('update-post', $post)) {
    abort(403);
}

// In Blade templates
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan

@cannot('delete', $post)
    <p>You cannot delete this post.</p>
@endcannot

@canany(['update', 'delete'], $post)
    <div class="actions">
        {{-- Show action buttons --}}
    </div>
@endcanany
```

## Database Migrations

Migrations are version control for your database schema.

### Creating Migrations

```bash
# Create a migration
php artisan make:migration create_posts_table

# Create a migration for modifying a table
php artisan make:migration add_status_to_posts_table --table=posts

# Create model with migration
php artisan make:model Post -m
```

### Writing Migrations

```php
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
            // Primary key
            $table->id();

            // Foreign keys
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();

            // String columns
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('featured_image')->nullable();

            // Text columns
            $table->text('excerpt')->nullable();
            $table->longText('content');

            // Numeric columns
            $table->unsignedInteger('views')->default(0);
            $table->decimal('rating', 3, 2)->nullable();

            // Boolean columns
            $table->boolean('is_featured')->default(false);

            // Enum columns
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');

            // Date/time columns
            $table->timestamp('published_at')->nullable();
            $table->timestamps(); // created_at and updated_at
            $table->softDeletes(); // deleted_at

            // Indexes
            $table->index('status');
            $table->index(['user_id', 'status']);
            $table->fullText('content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Rollback the last batch of migrations
php artisan migrate:rollback

# Rollback all migrations
php artisan migrate:reset

# Rollback and re-run all migrations
php artisan migrate:refresh

# Drop all tables and re-run all migrations
php artisan migrate:fresh

# Run migrations with seeding
php artisan migrate --seed
php artisan migrate:fresh --seed
```

## Conclusion

Laravel is a comprehensive PHP framework that provides everything you need to build modern web applications. Its elegant syntax, powerful features, and extensive ecosystem make it an excellent choice for projects of any size.

Key takeaways:

- **Routing** provides a clean, expressive way to define application endpoints
- **Controllers** organize request handling logic into dedicated classes
- **Middleware** offers a convenient mechanism for filtering HTTP requests
- **Eloquent ORM** simplifies database operations with an intuitive ActiveRecord implementation
- **Blade templates** compile to plain PHP while providing convenient directives and components
- **Validation** ensures data integrity with powerful, flexible rules
- **Authentication** comes ready out of the box with starter kits like Breeze

Laravel's extensive documentation, active community, and rich ecosystem of packages make it one of the most popular PHP frameworks for building web applications. Whether you are building a simple blog or a complex enterprise application, Laravel provides the tools and structure you need to succeed.
