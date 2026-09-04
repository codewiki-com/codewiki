---
title: Laravel Eloquent ORM
description: 深入理解Laravel Eloquent ORM，掌握模型定义、关联关系、查询构建、预加载与性能优化
track: php
section: laravel-symfony
difficulty: intermediate
tags:
  - PHP
  - Laravel
  - Eloquent
  - ORM
  - 数据库
status: imported
origin: old/src/content/docs/php/eloquent.en.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: PHP
  subcategory: Laravel
  order: 4
  lastUpdated: 2026-01-07
---

## Concept Explanation

Eloquent ORM (Object-Relational Mapping) is Laravel framework's built-in database abstraction layer that provides an elegant and expressive way to interact with databases. With Eloquent, each table in the database corresponds to a "Model", allowing developers to manipulate database records using object-oriented approaches without writing raw SQL statements.

### What is ORM?

ORM is a programming technique used to establish mapping relationships between object-oriented programming languages and relational databases:

- **Object**: Class instances in the program
- **Relational**: Tables and rows in the database
- **Mapping**: Corresponding object properties to database columns

```
┌─────────────────┐         ┌─────────────────┐
│   PHP Object    │  ←───→  │  Database Row   │
├─────────────────┤         ├─────────────────┤
│ $user->id       │  ←───→  │ id INT          │
│ $user->name     │  ←───→  │ name VARCHAR    │
│ $user->email    │  ←───→  │ email VARCHAR   │
│ $user->posts()  │  ←───→  │ posts table FK  │
└─────────────────┘         └─────────────────┘
```

### Why Use Eloquent?

1. **Code Readability**: Uses object-oriented syntax, making code more intuitive and understandable
2. **Type Safety**: IDE auto-completion and type checking support
3. **Relationships**: Elegantly handles complex relationships between tables
4. **Data Validation**: Works with Laravel's validation system to protect data integrity
5. **Event System**: Model lifecycle hooks for implementing automated logic
6. **Soft Deletes**: Built-in soft delete support to preserve data history
7. **Timestamps**: Automatic management of created_at and updated_at

## Core Principles

### Active Record Pattern

Eloquent adopts the Active Record design pattern, which means:

- Each model class corresponds to a table in the database
- A model instance corresponds to a row in the table
- Model properties correspond to columns in the table
- Model methods are used to operate on records (CRUD)

```php
<?php
// Active Record pattern illustration
// The model is both a data container and contains data operation methods

$user = new User();           // Create container for new record
$user->name = 'John';         // Set property (corresponds to column value)
$user->email = 'john@example.com';
$user->save();                // Execute INSERT operation

$user = User::find(1);        // Query record with ID 1
$user->name = 'Jane';         // Modify property
$user->save();                // Execute UPDATE operation

$user->delete();              // Execute DELETE operation
```

### Query Builder Integration

Eloquent is built on top of Laravel Query Builder, providing a fluent chainable interface:

```
┌─────────────────────────────────────────────────────────────┐
│                      Eloquent Model                          │
├─────────────────────────────────────────────────────────────┤
│    User::where('active', true)->orderBy('name')->get()      │
└───────────────────────────┬─────────────────────────────────┘
                            │ Converts to
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Query Builder                           │
├─────────────────────────────────────────────────────────────┤
│    DB::table('users')->where('active', true)...             │
└───────────────────────────┬─────────────────────────────────┘
                            │ Generates
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Raw SQL                               │
├─────────────────────────────────────────────────────────────┤
│    SELECT * FROM users WHERE active = 1 ORDER BY name       │
└─────────────────────────────────────────────────────────────┘
```

### Model Event Lifecycle

Eloquent models trigger a series of events during operations:

```
Create flow: creating → created
Update flow: updating → updated
Delete flow: deleting → deleted
Restore flow: restoring → restored (soft delete)

Save flow: saving → [creating/updating] → [created/updated] → saved
```

## Key Concepts

### Model Definition Basics

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model
{
    use SoftDeletes;  // Enable soft deletes

    // Associated database table (defaults to plural snake_case of class name)
    protected $table = 'users';

    // Primary key field (defaults to id)
    protected $primaryKey = 'id';

    // Whether primary key is auto-incrementing
    public $incrementing = true;

    // Primary key type
    protected $keyType = 'int';

    // Whether to automatically manage timestamps
    public $timestamps = true;

    // Timestamp format
    protected $dateFormat = 'Y-m-d H:i:s';

    // Custom timestamp column names
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    // Database connection (for multi-database scenarios)
    protected $connection = 'mysql';

    // Mass assignable fields (whitelist)
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
    ];

    // Non-mass assignable fields (blacklist, choose either $fillable or $guarded)
    // protected $guarded = ['id', 'is_admin'];

    // Hidden fields (not shown during serialization)
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Visible fields (shown during serialization)
    protected $visible = [
        'id',
        'name',
        'email',
    ];

    // Accessors appended to serialization result
    protected $appends = [
        'full_name',
        'avatar_url',
    ];

    // Attribute type casting
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'settings' => 'array',
        'metadata' => 'object',
        'price' => 'decimal:2',
        'options' => 'collection',
    ];

    // Default attribute values
    protected $attributes = [
        'is_active' => true,
        'role' => 'user',
    ];
}
```

### CRUD Operations

```php
<?php
use App\Models\User;

// ==================== Create ====================

// Method 1: Instantiate then save
$user = new User();
$user->name = 'John Doe';
$user->email = 'john@example.com';
$user->password = bcrypt('password');
$user->save();

// Method 2: Mass assignment with create (fields must be in $fillable)
$user = User::create([
    'name' => 'Jane Doe',
    'email' => 'jane@example.com',
    'password' => bcrypt('password'),
]);

// Method 3: firstOrCreate - find or create
$user = User::firstOrCreate(
    ['email' => 'john@example.com'],           // Search criteria
    ['name' => 'John', 'password' => bcrypt('pwd')]  // Additional data when creating
);

// Method 4: updateOrCreate - update or create
$user = User::updateOrCreate(
    ['email' => 'john@example.com'],
    ['name' => 'John Updated', 'last_login' => now()]
);

// ==================== Read ====================

// Get all records
$users = User::all();

// Find by primary key
$user = User::find(1);
$users = User::find([1, 2, 3]);

// Find or throw 404 exception
$user = User::findOrFail(1);

// Conditional query
$users = User::where('is_active', true)->get();

// Get first record
$user = User::where('email', 'john@example.com')->first();
$user = User::where('email', 'john@example.com')->firstOrFail();

// Aggregate functions
$count = User::count();
$maxAge = User::max('age');
$avgSalary = User::where('department', 'IT')->avg('salary');

// ==================== Update ====================

// Method 1: Find then update
$user = User::find(1);
$user->name = 'Updated Name';
$user->save();

// Method 2: Bulk update
User::where('is_active', false)
    ->update(['status' => 'inactive']);

// Method 3: Update or create
User::updateOrCreate(
    ['email' => 'john@example.com'],
    ['name' => 'John', 'last_login' => now()]
);

// Increment/Decrement operations
User::find(1)->increment('login_count');
User::find(1)->decrement('credits', 10);

// ==================== Delete ====================

// Method 1: Find then delete
$user = User::find(1);
$user->delete();

// Method 2: Delete by primary key
User::destroy(1);
User::destroy([1, 2, 3]);

// Method 3: Conditional delete
User::where('is_active', false)->delete();

// Soft delete (requires use SoftDeletes)
$user->delete();        // Sets deleted_at
$user->forceDelete();   // Permanently delete

// Restore soft deleted record
$user->restore();

// Query including soft deleted records
User::withTrashed()->get();
User::onlyTrashed()->get();
```

### Advanced Query Builder Usage

```php
<?php
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

// ==================== Conditional Queries ====================

// Basic where
$users = User::where('status', 'active')
    ->where('age', '>=', 18)
    ->get();

// orWhere
$users = User::where('role', 'admin')
    ->orWhere('role', 'moderator')
    ->get();

// whereIn / whereNotIn
$users = User::whereIn('id', [1, 2, 3])->get();
$users = User::whereNotIn('status', ['banned', 'suspended'])->get();

// whereBetween
$users = User::whereBetween('age', [18, 65])->get();

// whereNull / whereNotNull
$users = User::whereNull('deleted_at')->get();
$users = User::whereNotNull('email_verified_at')->get();

// whereDate / whereMonth / whereYear / whereTime
$users = User::whereDate('created_at', '2024-01-01')->get();
$users = User::whereMonth('created_at', 12)->get();
$users = User::whereYear('created_at', 2024)->get();

// whereColumn (column comparison)
$users = User::whereColumn('updated_at', '>', 'created_at')->get();

// where closure (grouped conditions)
$users = User::where('is_active', true)
    ->where(function (Builder $query) {
        $query->where('role', 'admin')
              ->orWhere('role', 'moderator');
    })
    ->get();

// ==================== Sorting and Pagination ====================

// Sorting
$users = User::orderBy('name', 'asc')
    ->orderByDesc('created_at')
    ->get();

// Latest/Oldest
$users = User::latest()->get();  // Order by created_at descending
$users = User::oldest()->get();  // Order by created_at ascending

// Random order
$users = User::inRandomOrder()->limit(5)->get();

// Pagination
$users = User::paginate(15);           // Standard pagination
$users = User::simplePaginate(15);     // Simple pagination (no total count)
$users = User::cursorPaginate(15);     // Cursor pagination (for large datasets)

// ==================== Selection and Limiting ====================

// Select specific columns
$users = User::select('id', 'name', 'email')->get();
$users = User::select(['id', 'name as user_name'])->get();

// Add selection columns
$users = User::select('id', 'name')
    ->addSelect('email')
    ->get();

// Distinct
$roles = User::distinct()->pluck('role');

// Limit and offset
$users = User::limit(10)->offset(20)->get();
$users = User::skip(20)->take(10)->get();

// ==================== Aggregation and Grouping ====================

// Aggregate functions
$count = User::count();
$max = User::max('age');
$min = User::min('age');
$avg = User::avg('salary');
$sum = User::sum('balance');

// Grouping
$usersByRole = User::select('role', DB::raw('count(*) as count'))
    ->groupBy('role')
    ->get();

// having (filtering after grouping)
$departments = User::select('department', DB::raw('count(*) as employee_count'))
    ->groupBy('department')
    ->having('employee_count', '>', 5)
    ->get();

// ==================== Raw Expressions ====================

// Raw query
$users = User::select(DB::raw('count(*) as user_count, status'))
    ->groupBy('status')
    ->get();

// whereRaw
$users = User::whereRaw('age > ? and votes > 100', [25])->get();

// orderByRaw
$users = User::orderByRaw('updated_at - created_at DESC')->get();

// selectRaw
$users = User::selectRaw('price * quantity as total_value')->get();
```

### Relationships

Relationships are one of Eloquent's most powerful features, allowing you to elegantly define and query relationships between tables.

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class User extends Model
{
    // ==================== One to One ====================

    /**
     * User profile (one to one)
     * users.id → profiles.user_id
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);

        // Custom foreign key
        // return $this->hasOne(Profile::class, 'author_id');

        // Custom local key
        // return $this->hasOne(Profile::class, 'user_id', 'id');
    }

    // ==================== One to Many ====================

    /**
     * User's posts (one to many)
     * users.id → posts.user_id
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Relationship with default sorting
     */
    public function latestPosts(): HasMany
    {
        return $this->hasMany(Post::class)->latest()->limit(5);
    }

    // ==================== Inverse One to Many (Many to One) ====================

    /**
     * Post's author
     * posts.user_id → users.id
     */
    // Defined in Post model
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ==================== Many to Many ====================

    /**
     * User's roles (many to many)
     * Requires pivot table: role_user (alphabetical order)
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);

        // Custom pivot table and key names
        // return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * Many to many with pivot data
     */
    public function rolesWithPivot(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('assigned_at', 'assigned_by')  // Get pivot table fields
            ->withTimestamps()                          // Auto-maintain timestamps
            ->as('assignment');                         // Custom pivot accessor name
    }

    // ==================== Has Many Through ====================

    /**
     * Comments on all posts by user
     * users → posts → comments
     */
    public function postComments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Comment::class,  // Final model
            Post::class,     // Intermediate model
            'user_id',       // Foreign key on intermediate table
            'post_id',       // Foreign key on final table
            'id',            // Local key
            'id'             // Local key on intermediate table
        );
    }

    // ==================== Polymorphic Relationships ====================

    /**
     * User's comments (polymorphic one to many)
     * Comments can belong to posts, videos, etc.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * User's avatar (polymorphic one to one)
     */
    public function avatar(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }

    /**
     * User's tags (polymorphic many to many)
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

```php
<?php
// Using relationships

// Accessing related data
$user = User::find(1);
$profile = $user->profile;          // Returns Profile model instance
$posts = $user->posts;              // Returns Collection
$roles = $user->roles;              // Returns Collection

// Dynamic property vs method call
$user->posts;                       // Returns result collection
$user->posts();                     // Returns relationship builder (can continue chaining)
$user->posts()->where('published', true)->get();

// ==================== Related Data Operations ====================

// Creating related data
$user->posts()->create([
    'title' => 'New Post',
    'content' => 'Post content',
]);

// Saving related model
$post = new Post(['title' => 'Title']);
$user->posts()->save($post);

// Bulk save
$user->posts()->saveMany([
    new Post(['title' => 'Post 1']),
    new Post(['title' => 'Post 2']),
]);

// ==================== Many to Many Operations ====================

// Attach relationship
$user->roles()->attach($roleId);
$user->roles()->attach([1, 2, 3]);
$user->roles()->attach([1 => ['assigned_by' => 'admin']]);  // With pivot data

// Detach relationship
$user->roles()->detach($roleId);
$user->roles()->detach([1, 2, 3]);
$user->roles()->detach();  // Detach all

// Sync relationships (keep IDs in array, remove others)
$user->roles()->sync([1, 2, 3]);
$user->roles()->syncWithoutDetaching([1, 2, 3]);  // Only add, don't remove

// Toggle relationships (remove if exists, add if not)
$user->roles()->toggle([1, 2, 3]);

// Update pivot table data
$user->roles()->updateExistingPivot($roleId, ['active' => true]);

// ==================== Relationship Queries ====================

// Query based on relationship existence
$usersWithPosts = User::has('posts')->get();
$usersWithManyPosts = User::has('posts', '>=', 5)->get();

// Relationship existence with conditions
$usersWithPublishedPosts = User::whereHas('posts', function ($query) {
    $query->where('published', true);
})->get();

// Relationship doesn't exist
$usersWithoutPosts = User::doesntHave('posts')->get();
$usersWithoutPublishedPosts = User::whereDoesntHave('posts', function ($query) {
    $query->where('published', true);
})->get();

// Count related records
$users = User::withCount('posts')->get();
// Access: $user->posts_count

// Count with conditions
$users = User::withCount([
    'posts',
    'posts as published_posts_count' => function ($query) {
        $query->where('published', true);
    }
])->get();
```

### Eager Loading

Eager loading is the key technique for solving the N+1 query problem.

```php
<?php
// ==================== N+1 Problem Demonstration ====================

// Bad example: Produces N+1 queries
$posts = Post::all();          // 1 query
foreach ($posts as $post) {
    echo $post->author->name;  // 1 additional query per loop
}
// If there are 100 posts, that's 101 queries total!

// ==================== Using Eager Loading to Solve ====================

// Method 1: with() eager loading
$posts = Post::with('author')->get();  // Only 2 queries
foreach ($posts as $post) {
    echo $post->author->name;  // No additional queries
}

// Eager load multiple relationships
$posts = Post::with(['author', 'comments', 'tags'])->get();

// Nested eager loading
$posts = Post::with('author.profile')->get();  // Load author and their profile

// Multi-level nesting
$posts = Post::with('author.profile.avatar')->get();

// ==================== Conditional Eager Loading ====================

// Adding constraints when eager loading
$users = User::with(['posts' => function ($query) {
    $query->where('published', true)
          ->orderBy('created_at', 'desc')
          ->limit(5);
}])->get();

// Select specific columns
$posts = Post::with('author:id,name,email')->get();

// Complex conditional eager loading
$users = User::with([
    'posts' => function ($query) {
        $query->where('published', true);
    },
    'posts.comments' => function ($query) {
        $query->where('approved', true);
    }
])->get();

// ==================== Lazy Eager Loading ====================

// Load relationships after query (for conditional loading)
$posts = Post::all();

if ($needAuthors) {
    $posts->load('author');
}

// Lazy loading with conditions
$posts->load(['comments' => function ($query) {
    $query->where('approved', true);
}]);

// loadMissing - Only load relationships not already loaded
$posts->loadMissing('author');

// ==================== Eager Loading Counts ====================

// When you only need counts, not full data
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;
}

// Conditional counts
$posts = Post::withCount([
    'comments',
    'comments as approved_comments_count' => function ($query) {
        $query->where('approved', true);
    }
])->get();

// Eager loading aggregates
$posts = Post::withSum('comments', 'votes')
    ->withAvg('comments', 'rating')
    ->get();

// ==================== Default Eager Loading ====================

// Define default eager loading in model
class Post extends Model
{
    // Automatically load author when querying Post
    protected $with = ['author'];

    // Can be disabled in queries
    // Post::without('author')->get();
}
```

### Accessors and Mutators

Accessors and mutators allow automatic data transformation when getting or setting model attributes.

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Model
{
    // ==================== Laravel 9+ New Syntax ====================

    /**
     * Full name accessor
     * Access: $user->full_name
     */
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    /**
     * First name accessor and mutator
     * Capitalize on get, lowercase on save
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }

    /**
     * Password mutator (auto-encrypt on save)
     */
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => bcrypt($value),
        );
    }

    /**
     * Cached accessor (avoid repeated calculations)
     */
    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar
                ? Storage::url($this->avatar)
                : 'https://ui-avatars.com/api/?name=' . urlencode($this->name),
        )->shouldCache();
    }

    /**
     * Virtual attribute (doesn't correspond to database column)
     */
    protected function isAdmin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->role === 'admin',
        );
    }

    /**
     * Complex mutator (sets multiple attributes)
     */
    protected function fullAddress(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->street}, {$this->city}, {$this->country}",
            set: function (string $value) {
                $parts = explode(', ', $value);
                return [
                    'street' => $parts[0] ?? '',
                    'city' => $parts[1] ?? '',
                    'country' => $parts[2] ?? '',
                ];
            },
        );
    }

    // ==================== Laravel 8 and Earlier Syntax ====================

    /**
     * Old-style accessor
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Old-style mutator
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = bcrypt($value);
    }

    // ==================== Adding to Serialization ====================

    // Add accessors to JSON/array output
    protected $appends = ['full_name', 'avatar_url', 'is_admin'];
}
```

```php
<?php
// Using accessors and mutators

$user = new User();
$user->first_name = 'JOHN';    // Auto-converted to 'john' (storage)
echo $user->first_name;         // Outputs 'John' (display)

$user->password = 'secret';    // Auto-encrypted

echo $user->full_name;         // Outputs 'John Doe'
echo $user->is_admin;          // true or false

// Setting virtual attribute
$user->full_address = '123 Main St, New York, USA';
// Auto-decomposed into street, city, country

// JSON output includes attributes from appends
echo $user->toJson();
// {"id":1,"first_name":"John",...,"full_name":"John Doe","is_admin":false}
```

### Attribute Casting

```php
<?php
// app/Models/Post.php

namespace App\Models;

use App\Casts\Json;
use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    /**
     * Attribute type casting
     */
    protected $casts = [
        // Basic types
        'is_published' => 'boolean',
        'views' => 'integer',
        'rating' => 'float',
        'price' => 'decimal:2',

        // Date and time
        'published_at' => 'datetime',
        'event_date' => 'date',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'immutable_datetime',  // Immutable DateTime

        // Arrays and objects
        'tags' => 'array',           // JSON ↔ array
        'metadata' => 'object',      // JSON ↔ stdClass
        'settings' => 'collection',  // JSON ↔ Collection

        // Encryption
        'secret_key' => 'encrypted',
        'api_token' => 'encrypted:array',

        // Hashing (only on set)
        'password' => 'hashed',

        // Enums (PHP 8.1+)
        'status' => PostStatus::class,

        // Custom Cast classes
        'options' => Json::class,
        'address' => AddressCast::class,
    ];

    /**
     * Dynamic casting method
     */
    protected function casts(): array
    {
        return [
            'secret' => Hash::class.':sha256',
        ];
    }
}
```

```php
<?php
// Custom Cast class

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AddressCast implements CastsAttributes
{
    /**
     * Transform when reading from database
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): Address
    {
        return new Address(
            $attributes['address_line1'],
            $attributes['address_line2'],
            $attributes['city'],
            $attributes['state'],
            $attributes['zip']
        );
    }

    /**
     * Transform when writing to database
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): array
    {
        if (! $value instanceof Address) {
            throw new InvalidArgumentException('Value must be an instance of Address.');
        }

        return [
            'address_line1' => $value->line1,
            'address_line2' => $value->line2,
            'city' => $value->city,
            'state' => $value->state,
            'zip' => $value->zip,
        ];
    }
}

// Usage
$user->address = new Address('123 Main St', null, 'NYC', 'NY', '10001');
echo $user->address->city;  // 'NYC'
```

## Code Examples

### Complete Blog System Model Example

```php
<?php
// ==================== User Model ====================
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'bio',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'settings' => 'array',
    ];

    protected $appends = ['avatar_url', 'posts_count'];

    // ==================== Relationships ====================

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id');
    }

    public function publishedPosts(): HasMany
    {
        return $this->hasMany(Post::class, 'author_id')
            ->where('status', 'published')
            ->latest();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('assigned_at')
            ->withTimestamps();
    }

    // ==================== Accessors ====================

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar
                ? asset('storage/' . $this->avatar)
                : "https://ui-avatars.com/api/?name=" . urlencode($this->name),
        );
    }

    protected function postsCount(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->posts()->count(),
        )->shouldCache();
    }

    // ==================== Scopes ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeAuthors($query)
    {
        return $query->has('posts');
    }

    public function scopeWithRole($query, string $role)
    {
        return $query->whereHas('roles', function ($q) use ($role) {
            $q->where('name', $role);
        });
    }

    // ==================== Methods ====================

    public function hasRole(string $role): bool
    {
        return $this->roles()->where('name', $role)->exists();
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }
}
```

```php
<?php
// ==================== Post Model ====================
// app/Models/Post.php

namespace App\Models;

use App\Enums\PostStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Str;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'status',
        'published_at',
        'author_id',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'status' => PostStatus::class,
        'metadata' => 'array',
    ];

    protected $with = ['author'];  // Default eager loading

    protected $withCount = ['comments'];

    protected $appends = ['reading_time', 'is_published'];

    // ==================== Relationships ====================

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->latest();
    }

    public function approvedComments(): HasMany
    {
        return $this->hasMany(Comment::class)
            ->where('is_approved', true)
            ->latest();
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class)->withTimestamps();
    }

    // ==================== Accessors and Mutators ====================

    protected function title(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => [
                'title' => $value,
                'slug' => Str::slug($value),
            ],
        );
    }

    protected function readingTime(): Attribute
    {
        return Attribute::make(
            get: function () {
                $words = str_word_count(strip_tags($this->content));
                $minutes = ceil($words / 200);
                return $minutes . ' min read';
            },
        );
    }

    protected function isPublished(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->status === PostStatus::PUBLISHED
                && $this->published_at
                && $this->published_at->isPast(),
        );
    }

    protected function excerpt(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ?: Str::limit(strip_tags($this->content), 200),
        );
    }

    // ==================== Scopes ====================

    public function scopePublished($query)
    {
        return $query->where('status', PostStatus::PUBLISHED)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', PostStatus::DRAFT);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->whereHas('categories', function ($q) use ($category) {
            $q->where('slug', $category);
        });
    }

    public function scopePopular($query)
    {
        return $query->orderByDesc('views');
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'like', "%{$term}%")
              ->orWhere('content', 'like', "%{$term}%");
        });
    }

    // ==================== Methods ====================

    public function publish(): bool
    {
        return $this->update([
            'status' => PostStatus::PUBLISHED,
            'published_at' => now(),
        ]);
    }

    public function incrementViews(): void
    {
        $this->increment('views');
    }

    // ==================== Events ====================

    protected static function booted(): void
    {
        // Auto-generate slug before creating
        static::creating(function (Post $post) {
            if (empty($post->slug)) {
                $post->slug = Str::slug($post->title);
            }
        });

        // Delete related comments when deleting
        static::deleting(function (Post $post) {
            $post->comments()->delete();
        });
    }
}
```

```php
<?php
// ==================== Using in Controller ====================
// app/Http/Controllers/PostController.php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Category;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\UpdatePostRequest;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * Post listing
     */
    public function index(Request $request)
    {
        $posts = Post::query()
            ->published()
            ->with(['author:id,name,avatar', 'categories:id,name,slug'])
            ->withCount('approvedComments')
            ->when($request->category, fn ($q, $cat) => $q->byCategory($cat))
            ->when($request->search, fn ($q, $term) => $q->search($term))
            ->when($request->sort === 'popular', fn ($q) => $q->popular())
            ->latest('published_at')
            ->paginate(15);

        return view('posts.index', compact('posts'));
    }

    /**
     * Post details
     */
    public function show(Post $post)
    {
        // Route model binding auto-retrieves
        abort_unless($post->is_published, 404);

        $post->load([
            'author.profile',
            'categories',
            'tags',
            'approvedComments.user:id,name,avatar',
        ]);

        $post->incrementViews();

        // Related posts
        $relatedPosts = Post::published()
            ->where('id', '!=', $post->id)
            ->whereHas('categories', function ($q) use ($post) {
                $q->whereIn('id', $post->categories->pluck('id'));
            })
            ->limit(4)
            ->get();

        return view('posts.show', compact('post', 'relatedPosts'));
    }

    /**
     * Create post
     */
    public function store(StorePostRequest $request)
    {
        $post = $request->user()->posts()->create($request->validated());

        // Sync categories and tags
        $post->categories()->sync($request->categories);
        $post->tags()->sync($request->tags);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', 'Post created successfully!');
    }

    /**
     * Update post
     */
    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());
        $post->categories()->sync($request->categories);
        $post->tags()->sync($request->tags);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', 'Post updated successfully!');
    }

    /**
     * Delete post
     */
    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return redirect()
            ->route('posts.index')
            ->with('success', 'Post deleted!');
    }
}
```

### Database Migration Example

```php
<?php
// database/migrations/2024_01_01_000001_create_posts_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('content');
            $table->text('excerpt')->nullable();
            $table->string('featured_image')->nullable();
            $table->string('status')->default('draft');
            $table->unsignedInteger('views')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('published_at');
            $table->index(['status', 'published_at']);
        });

        // Many-to-many pivot tables
        Schema::create('category_post', function (Blueprint $table) {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->primary(['category_id', 'post_id']);
        });

        Schema::create('post_tag', function (Blueprint $table) {
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['post_id', 'tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_tag');
        Schema::dropIfExists('category_post');
        Schema::dropIfExists('posts');
    }
};
```

## Best Practices

### Model Design Principles

```php
<?php
// Good practices

// 1. Keep models lean, use Repository pattern for complex queries
class PostRepository
{
    public function getPublishedWithRelations(int $perPage = 15)
    {
        return Post::published()
            ->with(['author', 'categories'])
            ->withCount('comments')
            ->latest()
            ->paginate($perPage);
    }
}

// 2. Use query scopes to encapsulate common conditions
class Post extends Model
{
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }
}

// 3. Use $fillable properly for mass assignment protection
protected $fillable = ['title', 'content', 'status'];
// Never use protected $guarded = [];

// 4. Add type hints to accessors
protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn (): string => "{$this->first_name} {$this->last_name}",
    );
}

// 5. Use enums instead of magic strings (PHP 8.1+)
enum PostStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}
```

### Query Optimization

```php
<?php
// 1. Always use eager loading to avoid N+1
// Wrong
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;  // N additional queries
}

// Correct
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name;  // No additional queries
}

// 2. Only select needed columns
$users = User::select(['id', 'name', 'email'])->get();
$posts = Post::with('author:id,name')->get();

// 3. Use cursor for large datasets
foreach (User::cursor() as $user) {
    // Process one at a time, memory-friendly
}

// Or use chunk for batch processing
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // Process user
    }
});

// 4. Use lazy collections
User::lazy()->each(function ($user) {
    // Process user
});

// 5. Conditional loading
Post::when($includeAuthor, function ($query) {
    $query->with('author');
})->get();
```

### Relationship Best Practices

```php
<?php
// 1. Explicitly define return types
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}

// 2. Create dedicated relationship methods for complex queries
public function publishedPosts(): HasMany
{
    return $this->hasMany(Post::class)
        ->where('status', 'published')
        ->latest();
}

// 3. Use withDefault to avoid null checks
public function author(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => 'Anonymous',
    ]);
}

// 4. Bulk operations on related data
$user->posts()->createMany([
    ['title' => 'Post 1'],
    ['title' => 'Post 2'],
]);

// 5. Use saveQuietly to avoid triggering events
$post->comments()->saveQuietly($comment);
```

## Common Pitfalls

### N+1 Query Problem

```php
<?php
// Problem: Additional query on each loop iteration
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;      // 1 query
    echo $post->comments->count(); // 1 query
}
// 100 posts = 1 + 100 + 100 = 201 queries!

// Solution
$posts = Post::with(['author', 'comments'])->get();
// Or
$posts = Post::withCount('comments')->with('author')->get();
// Only 3 queries
```

### Mass Assignment Vulnerability

```php
<?php
// Dangerous: Allows all fields to be mass assigned
protected $guarded = [];

// Attacker could submit:
// ['name' => 'Hacker', 'is_admin' => true, 'balance' => 9999999]

// Safe approach: Explicitly specify fillable fields
protected $fillable = ['name', 'email', 'password'];

// Or use form request validation
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'email' => 'required|email|unique:users',
]);
User::create($validated);
```

### Attribute Access Confusion

```php
<?php
// Problem: Confusing dynamic properties with method calls
$user->posts;       // Returns Collection (query executed)
$user->posts();     // Returns HasMany relationship object (can continue building query)

// Correct usage
$allPosts = $user->posts;                          // Get all posts
$publishedPosts = $user->posts()->published()->get(); // Chain query

// Pitfall: Repeated access will re-query (unless cached)
foreach ($users as $user) {
    echo count($user->posts);  // Queries each time
}

// Solution: Eager loading
$users = User::with('posts')->get();
```

### Soft Delete Related Issues

```php
<?php
// Problem: Soft deleted records still occupy unique constraints
// After user email is soft deleted, new user cannot use same email

// Solution 1: Use unique constraint excluding soft deletes
$table->unique(['email', 'deleted_at']);

// Solution 2: Check in validation
'email' => 'required|unique:users,email,NULL,id,deleted_at,NULL',

// Solution 3: Use composite unique index
Schema::table('users', function (Blueprint $table) {
    $table->dropUnique('users_email_unique');
    $table->unique(['email', 'deleted_at']);
});
```

### Timestamp Issues

```php
<?php
// Problem: Bulk update doesn't trigger updated_at
User::where('status', 'inactive')->update(['status' => 'active']);
// updated_at won't auto-update

// Solution
User::where('status', 'inactive')->update([
    'status' => 'active',
    'updated_at' => now(),
]);

// Or use touch
$users = User::where('status', 'inactive')->get();
$users->each->touch();

// Problem: update doesn't trigger model events
// Solution: Update individually
User::where('status', 'inactive')
    ->get()
    ->each(function ($user) {
        $user->update(['status' => 'active']);  // Triggers events
    });
```

### Relationship Count Pitfall

```php
<?php
// Problem: Accessing count() produces additional queries
foreach ($posts as $post) {
    echo $post->comments()->count();  // Queries each loop
}

// Solution 1: Use withCount for eager loading
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;  // No additional queries
}

// Solution 2: Count after loading
$posts = Post::with('comments')->get();
foreach ($posts as $post) {
    echo $post->comments->count();  // Calculated in memory
}
```

## Performance Considerations

### Query Performance Optimization

```php
<?php
// Use explain to analyze queries
DB::enableQueryLog();
$posts = Post::with('author')->where('status', 'published')->get();
dd(DB::getQueryLog());

// Or use Laravel Debugbar
// Install: composer require barryvdh/laravel-debugbar --dev

// 1. Add necessary indexes
Schema::table('posts', function (Blueprint $table) {
    $table->index('status');
    $table->index('published_at');
    $table->index(['status', 'published_at']);
    $table->index('author_id');
});

// 2. Use composite indexes
$table->index(['status', 'published_at', 'created_at']);

// 3. Only select needed columns
Post::select(['id', 'title', 'slug', 'excerpt', 'published_at'])
    ->published()
    ->get();

// 4. Use exists instead of count
// Slow
if (User::where('email', $email)->count() > 0) { }

// Fast
if (User::where('email', $email)->exists()) { }
```

### Memory Optimization

```php
<?php
// 1. Use chunk for batch processing large datasets
Post::chunk(1000, function ($posts) {
    foreach ($posts as $post) {
        // Process each post
    }
});

// 2. Use cursor for one-at-a-time processing
foreach (Post::cursor() as $post) {
    // Memory holds only one record
}

// 3. Use lazy collections
Post::lazy()->each(function ($post) {
    // Process post
});

// 4. Unset unneeded relationships
$posts = Post::with('author')->get();
$posts->each(function ($post) {
    $post->unsetRelation('author');
});

// 5. Use toBase() to skip model instantiation
$users = User::toBase()->get();
// Returns stdClass instead of Model instances, faster but loses model features
```

### Caching Strategies

```php
<?php
use Illuminate\Support\Facades\Cache;

// 1. Query caching
$posts = Cache::remember('published_posts', 3600, function () {
    return Post::published()->with('author')->get();
});

// 2. Model caching
class Post extends Model
{
    protected static function booted()
    {
        // Clear cache on update or delete
        static::saved(function () {
            Cache::forget('published_posts');
        });

        static::deleted(function () {
            Cache::forget('published_posts');
        });
    }
}

// 3. Using cache tags
$posts = Cache::tags(['posts', 'home'])->remember('featured_posts', 3600, function () {
    return Post::featured()->limit(5)->get();
});

// Clear all cache for specific tag
Cache::tags('posts')->flush();

// 4. Caching related data
public function getCachedCommentsAttribute()
{
    return Cache::remember(
        "post.{$this->id}.comments",
        3600,
        fn () => $this->comments()->approved()->get()
    );
}
```

### Bulk Operation Optimization

```php
<?php
// 1. Bulk insert
$data = [];
for ($i = 0; $i < 1000; $i++) {
    $data[] = [
        'name' => "User {$i}",
        'email' => "user{$i}@example.com",
        'created_at' => now(),
        'updated_at' => now(),
    ];
}
User::insert($data);  // Single INSERT, fastest

// 2. Bulk update (upsert)
User::upsert(
    [
        ['email' => 'a@example.com', 'name' => 'A', 'votes' => 10],
        ['email' => 'b@example.com', 'name' => 'B', 'votes' => 20],
    ],
    ['email'],           // Unique key
    ['name', 'votes']    // Fields to update
);

// 3. Conditional bulk update
DB::table('posts')
    ->whereIn('id', $ids)
    ->update(['status' => 'archived']);

// 4. Avoid save in loops
// Slow
foreach ($users as $user) {
    $user->update(['status' => 'active']);
}

// Fast
User::whereIn('id', $userIds)->update(['status' => 'active']);
```

## Real-World Scenarios

### Scenario 1: E-commerce Order System

```php
<?php
// app/Models/Order.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'order_number',
        'status',
        'subtotal',
        'tax',
        'shipping',
        'total',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'shipping' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
        'shipped_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Calculated properties
    public function recalculateTotal(): void
    {
        $subtotal = $this->items->sum(function ($item) {
            return $item->price * $item->quantity;
        });

        $this->update([
            'subtotal' => $subtotal,
            'tax' => $subtotal * 0.1,
            'total' => $subtotal * 1.1 + $this->shipping,
        ]);
    }

    // State transitions
    public function markAsPaid(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        return $this->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }

    // Generate order number
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->order_number = 'ORD-' . date('Ymd') . '-' . strtoupper(uniqid());
        });
    }
}

// Usage example
$order = Order::create([
    'user_id' => auth()->id(),
    'subtotal' => 0,
    'tax' => 0,
    'shipping' => 10.00,
    'total' => 0,
]);

$order->items()->createMany([
    ['product_id' => 1, 'quantity' => 2, 'price' => 29.99],
    ['product_id' => 2, 'quantity' => 1, 'price' => 49.99],
]);

$order->recalculateTotal();

// Query user orders
$orders = Order::forUser(auth()->id())
    ->with(['items.product', 'payments'])
    ->latest()
    ->paginate(10);
```

### Scenario 2: Multi-Tenant System

```php
<?php
// app/Models/Traits/BelongsToTenant.php

namespace App\Models\Traits;

use App\Models\Tenant;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // Auto-add tenant filter
        static::addGlobalScope(new TenantScope);

        // Auto-set tenant ID when creating
        static::creating(function ($model) {
            if (session()->has('tenant_id')) {
                $model->tenant_id = session('tenant_id');
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

// app/Models/Scopes/TenantScope.php
namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (session()->has('tenant_id')) {
            $builder->where('tenant_id', session('tenant_id'));
        }
    }
}

// Using in models
class Project extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'description', 'tenant_id'];
}

// Usage example
// Automatically returns only current tenant's projects
$projects = Project::all();

// When cross-tenant query is needed
$allProjects = Project::withoutGlobalScope(TenantScope::class)->get();
```

### Scenario 3: Permission System

```php
<?php
// app/Models/User.php (permission-related parts)

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withTimestamps();
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class)
            ->withTimestamps();
    }

    // Get all permissions (direct + role permissions)
    public function getAllPermissions(): Collection
    {
        return $this->permissions
            ->merge($this->roles->flatMap->permissions)
            ->unique('id');
    }

    // Check permission
    public function hasPermission(string $permission): bool
    {
        return $this->getAllPermissions()
            ->contains('slug', $permission);
    }

    // Check role
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('slug', $role);
    }

    // Check any permission
    public function hasAnyPermission(array $permissions): bool
    {
        $userPermissions = $this->getAllPermissions()->pluck('slug');
        return collect($permissions)->intersect($userPermissions)->isNotEmpty();
    }

    // Assign role
    public function assignRole(string $role): void
    {
        $roleModel = Role::where('slug', $role)->firstOrFail();
        $this->roles()->syncWithoutDetaching([$roleModel->id]);
    }

    // Remove role
    public function removeRole(string $role): void
    {
        $roleModel = Role::where('slug', $role)->first();
        if ($roleModel) {
            $this->roles()->detach($roleModel->id);
        }
    }
}

// app/Models/Role.php
class Role extends Model
{
    protected $fillable = ['name', 'slug', 'description'];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class);
    }

    public function givePermission(string $permission): void
    {
        $permModel = Permission::where('slug', $permission)->firstOrFail();
        $this->permissions()->syncWithoutDetaching([$permModel->id]);
    }
}

// Usage example
$user = User::find(1);

$user->assignRole('admin');
$user->hasRole('admin');          // true
$user->hasPermission('users.create');  // true

// In controller
if ($user->hasPermission('posts.delete')) {
    $post->delete();
}
```

## Interview Key Points

### Core Concept Questions

**Q1: What is the N+1 query problem? How do you solve it?**

```php
<?php
// N+1 problem example
$posts = Post::all();           // 1 query
foreach ($posts as $post) {
    echo $post->author->name;   // 1 query per iteration
}
// 100 posts = 101 queries

// Solution: Use with() for eager loading
$posts = Post::with('author')->get();  // Only 2 queries
```

**Q2: What's the difference between with() and load() in Eloquent?**

```php
<?php
// with(): Eager loading during query
$posts = Post::with('author')->get();

// load(): Load relationships after getting results (Lazy Eager Loading)
$posts = Post::all();
$posts->load('author');

// Decision criteria:
// - with(): When you know you need related data upfront
// - load(): When you conditionally need to load
if ($needAuthors) {
    $posts->load('author');
}
```

**Q3: What's the difference between $fillable and $guarded?**

```php
<?php
// $fillable: Whitelist, specifies fields that can be mass assigned
protected $fillable = ['name', 'email'];

// $guarded: Blacklist, specifies fields that cannot be mass assigned
protected $guarded = ['id', 'is_admin'];

// You can only use one, not both
// Recommended to use $fillable (more secure, more explicit)
```

**Q4: How do you implement soft deletes? How do you query after soft delete?**

```php
<?php
// 1. Add soft delete column in migration
$table->softDeletes();

// 2. Use SoftDeletes trait in model
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
}

// 3. Soft delete operations
$post->delete();        // Sets deleted_at
$post->forceDelete();   // Permanently delete
$post->restore();       // Restore

// 4. Query soft deleted records
Post::withTrashed()->get();    // Include deleted
Post::onlyTrashed()->get();    // Only deleted
Post::all();                   // Default excludes deleted
```

**Q5: What are accessors and mutators used for?**

```php
<?php
class User extends Model
{
    // Accessor: Transform when getting attribute
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    // Mutator: Transform when setting attribute
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => bcrypt($value),
        );
    }
}

// Usage
echo $user->full_name;        // Accessor
$user->password = 'secret';   // Mutator auto-encrypts
```

### Advanced Questions

**Q6: How do you optimize queries with large amounts of records?**

```php
<?php
// 1. Use chunk for batch processing
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // Process
    }
});

// 2. Use cursor for one-at-a-time processing
foreach (User::cursor() as $user) {
    // Memory-friendly
}

// 3. Only select needed columns
User::select(['id', 'name'])->get();

// 4. Use indexes
// Ensure WHERE condition columns are indexed

// 5. Use caching
Cache::remember('users', 3600, fn () => User::all());
```

**Q7: Explain the execution order of model events**

```
creating → created
updating → updated
saving → [creating/updating] → [created/updated] → saved
deleting → deleted
restoring → restored (soft delete)
```

**Q8: How do you implement polymorphic relationships?**

```php
<?php
// Comments can belong to posts or videos
class Comment extends Model
{
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
}

class Post extends Model
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

class Video extends Model
{
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }
}

// Database structure
// comments: id, body, commentable_id, commentable_type
```

## Further Reading

### Official Resources

- [Laravel Eloquent Official Documentation](https://laravel.com/docs/eloquent)
- [Laravel Database Migrations Documentation](https://laravel.com/docs/migrations)
- [Laravel Database: Query Builder](https://laravel.com/docs/queries)

### Recommended Books

- "Laravel: Up & Running" by Matt Stauffer
- "Laravel Official Tutorial" Laravel.com

### Quality Articles

- [Eloquent Performance Patterns](https://laravel-news.com/eloquent-performance-patterns)
- [Laravel Daily - Eloquent Tips](https://laraveldaily.com/tag/eloquent/)
- [Mastering Eloquent ORM](https://www.stitcher.io/blog/eloquent-mysql-views)

### Related Tools

- [Laravel Debugbar](https://github.com/barryvdh/laravel-debugbar) - Debugging and performance analysis
- [Laravel IDE Helper](https://github.com/barryvdh/laravel-ide-helper) - IDE auto-completion support
- [Laravel Query Detector](https://github.com/beyondcode/laravel-query-detector) - N+1 query detection
- [Clockwork](https://underground.works/clockwork/) - Development debugging tool

### Advanced Topics

- Repository Pattern combined with Eloquent
- Using Eloquent in Domain-Driven Design (DDD)
- Multiple database connections and read-write separation
- Eloquent and caching strategies
- Custom Collection classes

---

Eloquent ORM is one of Laravel framework's core components, elevating database operations to an object-oriented level. By now, you should have mastered Eloquent's core concepts, relationships, query optimization, and best practices. In real projects, properly utilizing eager loading, query scopes, attribute casting, and other features will help you write both elegant and efficient database code. Keep following Laravel's official documentation and community resources to continuously improve your Eloquent skills.
