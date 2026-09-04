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
origin: old/src/content/docs/php/eloquent.zh.md
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

## 概念解释

Eloquent ORM（Object-Relational Mapping，对象关系映射）是Laravel框架内置的数据库抽象层，它提供了一种优雅、富有表现力的方式与数据库进行交互。通过Eloquent，数据库中的每张表都对应一个"模型"（Model），开发者可以通过面向对象的方式操作数据库记录，而无需编写原始SQL语句。

### 什么是ORM？

ORM是一种编程技术，用于在面向对象编程语言和关系型数据库之间建立映射关系：

- **对象**（Object）：程序中的类实例
- **关系**（Relational）：数据库中的表和行
- **映射**（Mapping）：将对象属性与数据库列对应

```
┌─────────────────┐         ┌─────────────────┐
│   PHP Object    │  ←───→  │  Database Row   │
├─────────────────┤         ├─────────────────┤
│ $user->id       │  ←───→  │ id INT          │
│ $user->name     │  ←───→  │ name VARCHAR    │
│ $user->email    │  ←───→  │ email VARCHAR   │
│ $user->posts()  │  ←───→  │ posts表外键关联  │
└─────────────────┘         └─────────────────┘
```

### 为什么使用Eloquent？

1. **代码可读性**：使用面向对象语法，代码更直观易懂
2. **类型安全**：IDE自动补全和类型检查支持
3. **关联关系**：优雅地处理表之间的复杂关系
4. **数据验证**：结合Laravel的验证系统保护数据完整性
5. **事件系统**：模型生命周期钩子，实现自动化逻辑
6. **软删除**：内置软删除支持，保留数据历史
7. **时间戳**：自动管理created_at和updated_at

## 核心原理

### Active Record模式

Eloquent采用Active Record设计模式，这意味着：

- 每个模型类对应数据库中的一张表
- 模型实例对应表中的一行记录
- 模型的属性对应表中的列
- 模型方法用于操作记录（CRUD）

```php
<?php
// Active Record模式示意
// 模型既是数据容器，也包含数据操作方法

$user = new User();           // 创建新记录的容器
$user->name = 'John';         // 设置属性（对应列值）
$user->email = 'john@example.com';
$user->save();                // 执行INSERT操作

$user = User::find(1);        // 查询ID为1的记录
$user->name = 'Jane';         // 修改属性
$user->save();                // 执行UPDATE操作

$user->delete();              // 执行DELETE操作
```

### 查询构建器集成

Eloquent建立在Laravel Query Builder之上，提供了流畅的链式调用接口：

```
┌─────────────────────────────────────────────────────────────┐
│                      Eloquent Model                          │
├─────────────────────────────────────────────────────────────┤
│    User::where('active', true)->orderBy('name')->get()      │
└───────────────────────────┬─────────────────────────────────┘
                            │ 转换为
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Query Builder                           │
├─────────────────────────────────────────────────────────────┤
│    DB::table('users')->where('active', true)...             │
└───────────────────────────┬─────────────────────────────────┘
                            │ 生成
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        原始SQL                               │
├─────────────────────────────────────────────────────────────┤
│    SELECT * FROM users WHERE active = 1 ORDER BY name       │
└─────────────────────────────────────────────────────────────┘
```

### 模型事件生命周期

Eloquent模型在操作过程中会触发一系列事件：

```
创建流程: creating → created
更新流程: updating → updated
删除流程: deleting → deleted
恢复流程: restoring → restored (软删除)

保存流程: saving → [creating/updating] → [created/updated] → saved
```

## 核心要点

### 模型定义基础

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Model
{
    use SoftDeletes;  // 启用软删除

    // 关联的数据表（默认为类名的复数蛇形形式）
    protected $table = 'users';

    // 主键字段（默认为id）
    protected $primaryKey = 'id';

    // 主键是否自增
    public $incrementing = true;

    // 主键类型
    protected $keyType = 'int';

    // 是否自动管理时间戳
    public $timestamps = true;

    // 时间戳格式
    protected $dateFormat = 'Y-m-d H:i:s';

    // 自定义时间戳列名
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    // 数据库连接（多数据库场景）
    protected $connection = 'mysql';

    // 可批量赋值的字段（白名单）
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
    ];

    // 禁止批量赋值的字段（黑名单，与$fillable二选一）
    // protected $guarded = ['id', 'is_admin'];

    // 隐藏字段（序列化时不显示）
    protected $hidden = [
        'password',
        'remember_token',
    ];

    // 显示字段（序列化时显示）
    protected $visible = [
        'id',
        'name',
        'email',
    ];

    // 追加到序列化结果的访问器
    protected $appends = [
        'full_name',
        'avatar_url',
    ];

    // 属性类型转换
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'settings' => 'array',
        'metadata' => 'object',
        'price' => 'decimal:2',
        'options' => 'collection',
    ];

    // 默认属性值
    protected $attributes = [
        'is_active' => true,
        'role' => 'user',
    ];
}
```

### CRUD操作

```php
<?php
use App\Models\User;

// ==================== 创建 ====================

// 方式1：实例化后保存
$user = new User();
$user->name = 'John Doe';
$user->email = 'john@example.com';
$user->password = bcrypt('password');
$user->save();

// 方式2：使用create批量赋值（需在$fillable中定义）
$user = User::create([
    'name' => 'Jane Doe',
    'email' => 'jane@example.com',
    'password' => bcrypt('password'),
]);

// 方式3：firstOrCreate - 查找或创建
$user = User::firstOrCreate(
    ['email' => 'john@example.com'],           // 查找条件
    ['name' => 'John', 'password' => bcrypt('pwd')]  // 创建时的额外数据
);

// 方式4：updateOrCreate - 更新或创建
$user = User::updateOrCreate(
    ['email' => 'john@example.com'],
    ['name' => 'John Updated', 'last_login' => now()]
);

// ==================== 读取 ====================

// 获取所有记录
$users = User::all();

// 根据主键查找
$user = User::find(1);
$users = User::find([1, 2, 3]);

// 查找或抛出404异常
$user = User::findOrFail(1);

// 条件查询
$users = User::where('is_active', true)->get();

// 获取第一条
$user = User::where('email', 'john@example.com')->first();
$user = User::where('email', 'john@example.com')->firstOrFail();

// 聚合函数
$count = User::count();
$maxAge = User::max('age');
$avgSalary = User::where('department', 'IT')->avg('salary');

// ==================== 更新 ====================

// 方式1：查找后更新
$user = User::find(1);
$user->name = 'Updated Name';
$user->save();

// 方式2：批量更新
User::where('is_active', false)
    ->update(['status' => 'inactive']);

// 方式3：更新或创建
User::updateOrCreate(
    ['email' => 'john@example.com'],
    ['name' => 'John', 'last_login' => now()]
);

// 增减操作
User::find(1)->increment('login_count');
User::find(1)->decrement('credits', 10);

// ==================== 删除 ====================

// 方式1：查找后删除
$user = User::find(1);
$user->delete();

// 方式2：根据主键删除
User::destroy(1);
User::destroy([1, 2, 3]);

// 方式3：条件删除
User::where('is_active', false)->delete();

// 软删除（需要use SoftDeletes）
$user->delete();        // 设置deleted_at
$user->forceDelete();   // 真正删除

// 恢复软删除
$user->restore();

// 查询包含软删除
User::withTrashed()->get();
User::onlyTrashed()->get();
```

### 查询构建器高级用法

```php
<?php
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

// ==================== 条件查询 ====================

// 基本where
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

// whereColumn（列比较）
$users = User::whereColumn('updated_at', '>', 'created_at')->get();

// where闭包（分组条件）
$users = User::where('is_active', true)
    ->where(function (Builder $query) {
        $query->where('role', 'admin')
              ->orWhere('role', 'moderator');
    })
    ->get();

// ==================== 排序与分页 ====================

// 排序
$users = User::orderBy('name', 'asc')
    ->orderByDesc('created_at')
    ->get();

// 最新/最早
$users = User::latest()->get();  // 按created_at降序
$users = User::oldest()->get();  // 按created_at升序

// 随机排序
$users = User::inRandomOrder()->limit(5)->get();

// 分页
$users = User::paginate(15);           // 标准分页
$users = User::simplePaginate(15);     // 简单分页（无总数）
$users = User::cursorPaginate(15);     // 游标分页（大数据集）

// ==================== 选择与限制 ====================

// 选择特定列
$users = User::select('id', 'name', 'email')->get();
$users = User::select(['id', 'name as user_name'])->get();

// 添加选择列
$users = User::select('id', 'name')
    ->addSelect('email')
    ->get();

// 去重
$roles = User::distinct()->pluck('role');

// 限制与偏移
$users = User::limit(10)->offset(20)->get();
$users = User::skip(20)->take(10)->get();

// ==================== 聚合与分组 ====================

// 聚合函数
$count = User::count();
$max = User::max('age');
$min = User::min('age');
$avg = User::avg('salary');
$sum = User::sum('balance');

// 分组
$usersByRole = User::select('role', DB::raw('count(*) as count'))
    ->groupBy('role')
    ->get();

// having（分组后筛选）
$departments = User::select('department', DB::raw('count(*) as employee_count'))
    ->groupBy('department')
    ->having('employee_count', '>', 5)
    ->get();

// ==================== 原始表达式 ====================

// 原始查询
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

### 关联关系

关联关系是Eloquent最强大的特性之一，它允许优雅地定义和查询表之间的关系。

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
    // ==================== 一对一 ====================

    /**
     * 用户档案（一对一）
     * users.id → profiles.user_id
     */
    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);

        // 自定义外键
        // return $this->hasOne(Profile::class, 'author_id');

        // 自定义本地键
        // return $this->hasOne(Profile::class, 'user_id', 'id');
    }

    // ==================== 一对多 ====================

    /**
     * 用户的文章（一对多）
     * users.id → posts.user_id
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    /**
     * 带默认排序的关联
     */
    public function latestPosts(): HasMany
    {
        return $this->hasMany(Post::class)->latest()->limit(5);
    }

    // ==================== 反向一对多（多对一） ====================

    /**
     * 文章所属用户
     * posts.user_id → users.id
     */
    // 在Post模型中定义
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ==================== 多对多 ====================

    /**
     * 用户的角色（多对多）
     * 需要中间表：role_user（按字母顺序）
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class);

        // 自定义中间表和键名
        // return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    /**
     * 带中间表数据的多对多
     */
    public function rolesWithPivot(): BelongsToMany
    {
        return $this->belongsToMany(Role::class)
            ->withPivot('assigned_at', 'assigned_by')  // 获取中间表字段
            ->withTimestamps()                          // 自动维护时间戳
            ->as('assignment');                         // 自定义中间表访问名
    }

    // ==================== 远程一对多 ====================

    /**
     * 用户发布的所有文章的评论
     * users → posts → comments
     */
    public function postComments(): HasManyThrough
    {
        return $this->hasManyThrough(
            Comment::class,  // 最终模型
            Post::class,     // 中间模型
            'user_id',       // 中间表外键
            'post_id',       // 最终表外键
            'id',            // 本地键
            'id'             // 中间表本地键
        );
    }

    // ==================== 多态关联 ====================

    /**
     * 用户的所有评论（多态一对多）
     * 评论可以属于文章、视频等多种模型
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable');
    }

    /**
     * 用户的头像（多态一对一）
     */
    public function avatar(): MorphOne
    {
        return $this->morphOne(Image::class, 'imageable');
    }

    /**
     * 用户的标签（多态多对多）
     */
    public function tags(): MorphToMany
    {
        return $this->morphToMany(Tag::class, 'taggable');
    }
}
```

```php
<?php
// 使用关联关系

// 访问关联数据
$user = User::find(1);
$profile = $user->profile;          // 返回Profile模型实例
$posts = $user->posts;              // 返回Collection
$roles = $user->roles;              // 返回Collection

// 动态属性 vs 方法调用
$user->posts;                       // 返回结果集合
$user->posts();                     // 返回关联构建器（可继续链式调用）
$user->posts()->where('published', true)->get();

// ==================== 关联数据操作 ====================

// 创建关联数据
$user->posts()->create([
    'title' => '新文章',
    'content' => '文章内容',
]);

// 保存关联模型
$post = new Post(['title' => '标题']);
$user->posts()->save($post);

// 批量保存
$user->posts()->saveMany([
    new Post(['title' => '文章1']),
    new Post(['title' => '文章2']),
]);

// ==================== 多对多关联操作 ====================

// 附加关联
$user->roles()->attach($roleId);
$user->roles()->attach([1, 2, 3]);
$user->roles()->attach([1 => ['assigned_by' => 'admin']]);  // 带中间表数据

// 移除关联
$user->roles()->detach($roleId);
$user->roles()->detach([1, 2, 3]);
$user->roles()->detach();  // 移除所有

// 同步关联（保持数组中的ID，移除其他）
$user->roles()->sync([1, 2, 3]);
$user->roles()->syncWithoutDetaching([1, 2, 3]);  // 只添加不移除

// 切换关联（有则移除，无则添加）
$user->roles()->toggle([1, 2, 3]);

// 更新中间表数据
$user->roles()->updateExistingPivot($roleId, ['active' => true]);

// ==================== 关联查询 ====================

// 基于关联存在的查询
$usersWithPosts = User::has('posts')->get();
$usersWithManyPosts = User::has('posts', '>=', 5)->get();

// 带条件的关联存在查询
$usersWithPublishedPosts = User::whereHas('posts', function ($query) {
    $query->where('published', true);
})->get();

// 关联不存在
$usersWithoutPosts = User::doesntHave('posts')->get();
$usersWithoutPublishedPosts = User::whereDoesntHave('posts', function ($query) {
    $query->where('published', true);
})->get();

// 统计关联数量
$users = User::withCount('posts')->get();
// 访问：$user->posts_count

// 带条件的统计
$users = User::withCount([
    'posts',
    'posts as published_posts_count' => function ($query) {
        $query->where('published', true);
    }
])->get();
```

### 预加载（Eager Loading）

预加载是解决N+1查询问题的关键技术。

```php
<?php
// ==================== N+1 问题演示 ====================

// 错误示例：产生N+1查询
$posts = Post::all();          // 1次查询
foreach ($posts as $post) {
    echo $post->author->name;  // 每次循环额外1次查询
}
// 如果有100篇文章，总共101次查询！

// ==================== 使用预加载解决 ====================

// 方式1：with() 预加载
$posts = Post::with('author')->get();  // 只有2次查询
foreach ($posts as $post) {
    echo $post->author->name;  // 无额外查询
}

// 预加载多个关联
$posts = Post::with(['author', 'comments', 'tags'])->get();

// 嵌套预加载
$posts = Post::with('author.profile')->get();  // 加载作者及其档案

// 多层嵌套
$posts = Post::with('author.profile.avatar')->get();

// ==================== 条件预加载 ====================

// 预加载时添加约束
$users = User::with(['posts' => function ($query) {
    $query->where('published', true)
          ->orderBy('created_at', 'desc')
          ->limit(5);
}])->get();

// 选择特定列
$posts = Post::with('author:id,name,email')->get();

// 复杂条件预加载
$users = User::with([
    'posts' => function ($query) {
        $query->where('published', true);
    },
    'posts.comments' => function ($query) {
        $query->where('approved', true);
    }
])->get();

// ==================== 延迟预加载 ====================

// 查询后再加载关联（用于条件加载）
$posts = Post::all();

if ($needAuthors) {
    $posts->load('author');
}

// 带条件的延迟加载
$posts->load(['comments' => function ($query) {
    $query->where('approved', true);
}]);

// loadMissing - 仅加载未加载的关联
$posts->loadMissing('author');

// ==================== 预加载计数 ====================

// 只需要计数，不需要完整数据
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;
}

// 条件计数
$posts = Post::withCount([
    'comments',
    'comments as approved_comments_count' => function ($query) {
        $query->where('approved', true);
    }
])->get();

// 预加载聚合
$posts = Post::withSum('comments', 'votes')
    ->withAvg('comments', 'rating')
    ->get();

// ==================== 默认预加载 ====================

// 在模型中定义默认预加载
class Post extends Model
{
    // 每次查询Post时自动加载author
    protected $with = ['author'];

    // 可以在查询时禁用
    // Post::without('author')->get();
}
```

### 访问器与修改器（Accessors & Mutators）

访问器和修改器允许在获取或设置模型属性时自动转换数据。

```php
<?php
// app/Models/User.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Model
{
    // ==================== Laravel 9+ 新语法 ====================

    /**
     * 全名访问器
     * 访问：$user->full_name
     */
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    /**
     * 名字访问器和修改器
     * 获取时首字母大写，保存时转小写
     */
    protected function firstName(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucfirst($value),
            set: fn (string $value) => strtolower($value),
        );
    }

    /**
     * 密码修改器（保存时自动加密）
     */
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => bcrypt($value),
        );
    }

    /**
     * 带缓存的访问器（避免重复计算）
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
     * 虚拟属性（不对应数据库列）
     */
    protected function isAdmin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->role === 'admin',
        );
    }

    /**
     * 复杂修改器（设置多个属性）
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

    // ==================== Laravel 8及以前的语法 ====================

    /**
     * 旧式访问器
     */
    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * 旧式修改器
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = bcrypt($value);
    }

    // ==================== 添加到序列化 ====================

    // 将访问器添加到JSON/数组输出
    protected $appends = ['full_name', 'avatar_url', 'is_admin'];
}
```

```php
<?php
// 使用访问器和修改器

$user = new User();
$user->first_name = 'JOHN';    // 自动转为 'john'（存储）
echo $user->first_name;         // 输出 'John'（显示）

$user->password = 'secret';    // 自动加密

echo $user->full_name;         // 输出 'John Doe'
echo $user->is_admin;          // true 或 false

// 设置虚拟属性
$user->full_address = '123 Main St, New York, USA';
// 自动分解为 street, city, country

// JSON输出包含appends中的属性
echo $user->toJson();
// {"id":1,"first_name":"John",...,"full_name":"John Doe","is_admin":false}
```

### 属性类型转换

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
     * 属性类型转换
     */
    protected $casts = [
        // 基本类型
        'is_published' => 'boolean',
        'views' => 'integer',
        'rating' => 'float',
        'price' => 'decimal:2',

        // 日期时间
        'published_at' => 'datetime',
        'event_date' => 'date',
        'created_at' => 'datetime:Y-m-d H:i:s',
        'updated_at' => 'immutable_datetime',  // 不可变DateTime

        // 数组和对象
        'tags' => 'array',           // JSON ↔ 数组
        'metadata' => 'object',      // JSON ↔ stdClass
        'settings' => 'collection',  // JSON ↔ Collection

        // 加密
        'secret_key' => 'encrypted',
        'api_token' => 'encrypted:array',

        // 哈希（仅设置时）
        'password' => 'hashed',

        // 枚举（PHP 8.1+）
        'status' => PostStatus::class,

        // 自定义Cast类
        'options' => Json::class,
        'address' => AddressCast::class,
    ];

    /**
     * 动态类型转换方法
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
// 自定义Cast类

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class AddressCast implements CastsAttributes
{
    /**
     * 从数据库读取时转换
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
     * 写入数据库时转换
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

// 使用
$user->address = new Address('123 Main St', null, 'NYC', 'NY', '10001');
echo $user->address->city;  // 'NYC'
```

## 代码示例

### 完整的博客系统模型示例

```php
<?php
// ==================== User模型 ====================
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

    // ==================== 关联关系 ====================

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

    // ==================== 访问器 ====================

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

    // ==================== 作用域 ====================

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

    // ==================== 方法 ====================

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
// ==================== Post模型 ====================
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

    protected $with = ['author'];  // 默认预加载

    protected $withCount = ['comments'];

    protected $appends = ['reading_time', 'is_published'];

    // ==================== 关联关系 ====================

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

    // ==================== 访问器与修改器 ====================

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

    // ==================== 作用域 ====================

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

    // ==================== 方法 ====================

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

    // ==================== 事件 ====================

    protected static function booted(): void
    {
        // 创建前自动生成slug
        static::creating(function (Post $post) {
            if (empty($post->slug)) {
                $post->slug = Str::slug($post->title);
            }
        });

        // 删除时同时删除相关评论
        static::deleting(function (Post $post) {
            $post->comments()->delete();
        });
    }
}
```

```php
<?php
// ==================== 控制器中使用 ====================
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
     * 文章列表
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
     * 文章详情
     */
    public function show(Post $post)
    {
        // 路由模型绑定自动获取
        abort_unless($post->is_published, 404);

        $post->load([
            'author.profile',
            'categories',
            'tags',
            'approvedComments.user:id,name,avatar',
        ]);

        $post->incrementViews();

        // 相关文章
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
     * 创建文章
     */
    public function store(StorePostRequest $request)
    {
        $post = $request->user()->posts()->create($request->validated());

        // 同步分类和标签
        $post->categories()->sync($request->categories);
        $post->tags()->sync($request->tags);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', '文章创建成功！');
    }

    /**
     * 更新文章
     */
    public function update(UpdatePostRequest $request, Post $post)
    {
        $this->authorize('update', $post);

        $post->update($request->validated());
        $post->categories()->sync($request->categories);
        $post->tags()->sync($request->tags);

        return redirect()
            ->route('posts.show', $post)
            ->with('success', '文章更新成功！');
    }

    /**
     * 删除文章
     */
    public function destroy(Post $post)
    {
        $this->authorize('delete', $post);

        $post->delete();

        return redirect()
            ->route('posts.index')
            ->with('success', '文章已删除！');
    }
}
```

### 数据库迁移示例

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

            // 索引
            $table->index('status');
            $table->index('published_at');
            $table->index(['status', 'published_at']);
        });

        // 多对多关联表
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

## 最佳实践

### 模型设计原则

```php
<?php
// 良好实践

// 1. 保持模型精简，使用Repository模式处理复杂查询
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

// 2. 使用查询作用域封装常用条件
class Post extends Model
{
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }
}

// 3. 合理使用$fillable保护批量赋值
protected $fillable = ['title', 'content', 'status'];
// 永远不要使用 protected $guarded = [];

// 4. 为访问器添加类型提示
protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn (): string => "{$this->first_name} {$this->last_name}",
    );
}

// 5. 使用枚举替代魔术字符串（PHP 8.1+）
enum PostStatus: string
{
    case DRAFT = 'draft';
    case PUBLISHED = 'published';
    case ARCHIVED = 'archived';
}
```

### 查询优化

```php
<?php
// 1. 始终使用预加载避免N+1
// 错误
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;  // N次额外查询
}

// 正确
$posts = Post::with('author')->get();
foreach ($posts as $post) {
    echo $post->author->name;  // 无额外查询
}

// 2. 只选择需要的列
$users = User::select(['id', 'name', 'email'])->get();
$posts = Post::with('author:id,name')->get();

// 3. 使用游标处理大数据集
foreach (User::cursor() as $user) {
    // 逐条处理，内存友好
}

// 或使用chunk分块处理
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // 处理用户
    }
});

// 4. 使用惰性集合
User::lazy()->each(function ($user) {
    // 处理用户
});

// 5. 条件性加载
Post::when($includeAuthor, function ($query) {
    $query->with('author');
})->get();
```

### 关联关系最佳实践

```php
<?php
// 1. 明确定义返回类型
public function posts(): HasMany
{
    return $this->hasMany(Post::class);
}

// 2. 为复杂查询创建专门的关联方法
public function publishedPosts(): HasMany
{
    return $this->hasMany(Post::class)
        ->where('status', 'published')
        ->latest();
}

// 3. 使用withDefault避免null检查
public function author(): BelongsTo
{
    return $this->belongsTo(User::class)->withDefault([
        'name' => '匿名用户',
    ]);
}

// 4. 批量操作关联数据
$user->posts()->createMany([
    ['title' => '文章1'],
    ['title' => '文章2'],
]);

// 5. 使用saveQuietly避免触发事件
$post->comments()->saveQuietly($comment);
```

## 常见陷阱

### N+1查询问题

```php
<?php
// 问题：每次循环都执行额外查询
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->author->name;      // 查询1次
    echo $post->comments->count(); // 查询1次
}
// 100篇文章 = 1 + 100 + 100 = 201次查询！

// 解决方案
$posts = Post::with(['author', 'comments'])->get();
// 或
$posts = Post::withCount('comments')->with('author')->get();
// 只有3次查询
```

### 批量赋值漏洞

```php
<?php
// 危险：允许所有字段批量赋值
protected $guarded = [];

// 攻击者可以提交：
// ['name' => 'Hacker', 'is_admin' => true, 'balance' => 9999999]

// 安全做法：明确指定可填充字段
protected $fillable = ['name', 'email', 'password'];

// 或使用表单请求验证
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'email' => 'required|email|unique:users',
]);
User::create($validated);
```

### 属性访问误解

```php
<?php
// 问题：混淆动态属性和方法调用
$user->posts;       // 返回Collection（已执行查询）
$user->posts();     // 返回HasMany关系对象（可继续构建查询）

// 正确使用
$allPosts = $user->posts;                          // 获取所有文章
$publishedPosts = $user->posts()->published()->get(); // 链式查询

// 陷阱：重复访问会重新查询（除非已缓存）
foreach ($users as $user) {
    echo count($user->posts);  // 每次都查询
}

// 解决：预加载
$users = User::with('posts')->get();
```

### 软删除相关问题

```php
<?php
// 问题：忘记软删除的记录仍占用唯一约束
// 用户email被软删除后，新用户无法使用同一email

// 解决方案1：使用唯一约束排除软删除
$table->unique(['email', 'deleted_at']);

// 解决方案2：在验证时检查
'email' => 'required|unique:users,email,NULL,id,deleted_at,NULL',

// 解决方案3：使用复合唯一索引
Schema::table('users', function (Blueprint $table) {
    $table->dropUnique('users_email_unique');
    $table->unique(['email', 'deleted_at']);
});
```

### 时间戳问题

```php
<?php
// 问题：批量更新不触发updated_at
User::where('status', 'inactive')->update(['status' => 'active']);
// updated_at不会自动更新

// 解决方案
User::where('status', 'inactive')->update([
    'status' => 'active',
    'updated_at' => now(),
]);

// 或使用touch
$users = User::where('status', 'inactive')->get();
$users->each->touch();

// 问题：update不触发模型事件
// 解决：逐个更新
User::where('status', 'inactive')
    ->get()
    ->each(function ($user) {
        $user->update(['status' => 'active']);  // 触发事件
    });
```

### 关联计数陷阱

```php
<?php
// 问题：访问count()会产生额外查询
foreach ($posts as $post) {
    echo $post->comments()->count();  // 每次循环都查询
}

// 解决方案1：使用withCount预加载
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;  // 无额外查询
}

// 解决方案2：加载后使用count
$posts = Post::with('comments')->get();
foreach ($posts as $post) {
    echo $post->comments->count();  // 内存中计算
}
```

## 性能考量

### 查询性能优化

```php
<?php
// 使用explain分析查询
DB::enableQueryLog();
$posts = Post::with('author')->where('status', 'published')->get();
dd(DB::getQueryLog());

// 或使用Laravel Debugbar
// 安装：composer require barryvdh/laravel-debugbar --dev

// 1. 添加必要的索引
Schema::table('posts', function (Blueprint $table) {
    $table->index('status');
    $table->index('published_at');
    $table->index(['status', 'published_at']);
    $table->index('author_id');
});

// 2. 使用复合索引
$table->index(['status', 'published_at', 'created_at']);

// 3. 只选择需要的列
Post::select(['id', 'title', 'slug', 'excerpt', 'published_at'])
    ->published()
    ->get();

// 4. 使用exists替代count
// 慢
if (User::where('email', $email)->count() > 0) { }

// 快
if (User::where('email', $email)->exists()) { }
```

### 内存优化

```php
<?php
// 1. 大数据集使用chunk分块处理
Post::chunk(1000, function ($posts) {
    foreach ($posts as $post) {
        // 处理每篇文章
    }
});

// 2. 使用cursor逐条处理
foreach (Post::cursor() as $post) {
    // 内存只保持一条记录
}

// 3. 使用lazy惰性集合
Post::lazy()->each(function ($post) {
    // 处理文章
});

// 4. 释放不需要的关联
$posts = Post::with('author')->get();
$posts->each(function ($post) {
    $post->unsetRelation('author');
});

// 5. 使用toBase()跳过模型实例化
$users = User::toBase()->get();
// 返回stdClass而非Model实例，更快但失去模型功能
```

### 缓存策略

```php
<?php
use Illuminate\Support\Facades\Cache;

// 1. 查询缓存
$posts = Cache::remember('published_posts', 3600, function () {
    return Post::published()->with('author')->get();
});

// 2. 模型缓存
class Post extends Model
{
    protected static function booted()
    {
        // 更新或删除时清除缓存
        static::saved(function () {
            Cache::forget('published_posts');
        });

        static::deleted(function () {
            Cache::forget('published_posts');
        });
    }
}

// 3. 使用缓存标签
$posts = Cache::tags(['posts', 'home'])->remember('featured_posts', 3600, function () {
    return Post::featured()->limit(5)->get();
});

// 清除特定标签的所有缓存
Cache::tags('posts')->flush();

// 4. 关联数据缓存
public function getCachedCommentsAttribute()
{
    return Cache::remember(
        "post.{$this->id}.comments",
        3600,
        fn () => $this->comments()->approved()->get()
    );
}
```

### 批量操作优化

```php
<?php
// 1. 批量插入
$data = [];
for ($i = 0; $i < 1000; $i++) {
    $data[] = [
        'name' => "User {$i}",
        'email' => "user{$i}@example.com",
        'created_at' => now(),
        'updated_at' => now(),
    ];
}
User::insert($data);  // 单次INSERT，最快

// 2. 批量更新（upsert）
User::upsert(
    [
        ['email' => 'a@example.com', 'name' => 'A', 'votes' => 10],
        ['email' => 'b@example.com', 'name' => 'B', 'votes' => 20],
    ],
    ['email'],           // 唯一键
    ['name', 'votes']    // 更新的字段
);

// 3. 条件批量更新
DB::table('posts')
    ->whereIn('id', $ids)
    ->update(['status' => 'archived']);

// 4. 避免在循环中save
// 慢
foreach ($users as $user) {
    $user->update(['status' => 'active']);
}

// 快
User::whereIn('id', $userIds)->update(['status' => 'active']);
```

## 实战场景

### 场景1：电商订单系统

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

    // 关联关系
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

    // 作用域
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

    // 计算属性
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

    // 状态转换
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

    // 生成订单号
    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            $order->order_number = 'ORD-' . date('Ymd') . '-' . strtoupper(uniqid());
        });
    }
}

// 使用示例
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

// 查询用户订单
$orders = Order::forUser(auth()->id())
    ->with(['items.product', 'payments'])
    ->latest()
    ->paginate(10);
```

### 场景2：多租户系统

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
        // 自动添加租户过滤
        static::addGlobalScope(new TenantScope);

        // 创建时自动设置租户ID
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

// 在模型中使用
class Project extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'description', 'tenant_id'];
}

// 使用示例
// 自动只返回当前租户的项目
$projects = Project::all();

// 需要跨租户查询时
$allProjects = Project::withoutGlobalScope(TenantScope::class)->get();
```

### 场景3：权限系统

```php
<?php
// app/Models/User.php（权限相关部分）

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

    // 获取所有权限（直接权限 + 角色权限）
    public function getAllPermissions(): Collection
    {
        return $this->permissions
            ->merge($this->roles->flatMap->permissions)
            ->unique('id');
    }

    // 检查权限
    public function hasPermission(string $permission): bool
    {
        return $this->getAllPermissions()
            ->contains('slug', $permission);
    }

    // 检查角色
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('slug', $role);
    }

    // 检查任一权限
    public function hasAnyPermission(array $permissions): bool
    {
        $userPermissions = $this->getAllPermissions()->pluck('slug');
        return collect($permissions)->intersect($userPermissions)->isNotEmpty();
    }

    // 分配角色
    public function assignRole(string $role): void
    {
        $roleModel = Role::where('slug', $role)->firstOrFail();
        $this->roles()->syncWithoutDetaching([$roleModel->id]);
    }

    // 移除角色
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

// 使用示例
$user = User::find(1);

$user->assignRole('admin');
$user->hasRole('admin');          // true
$user->hasPermission('users.create');  // true

// 在控制器中
if ($user->hasPermission('posts.delete')) {
    $post->delete();
}
```

## 面试要点

### 核心概念题

**Q1: 什么是N+1查询问题？如何解决？**

```php
<?php
// N+1问题示例
$posts = Post::all();           // 1次查询
foreach ($posts as $post) {
    echo $post->author->name;   // 每次循环1次查询
}
// 100篇文章 = 101次查询

// 解决方案：使用with()预加载
$posts = Post::with('author')->get();  // 只有2次查询
```

**Q2: Eloquent的with()和load()有什么区别？**

```php
<?php
// with(): 在查询时预加载（Eager Loading）
$posts = Post::with('author')->get();

// load(): 在已获取结果后加载关联（Lazy Eager Loading）
$posts = Post::all();
$posts->load('author');

// 选择依据：
// - with(): 预先知道需要关联数据
// - load(): 根据条件决定是否加载
if ($needAuthors) {
    $posts->load('author');
}
```

**Q3: $fillable和$guarded的区别？**

```php
<?php
// $fillable: 白名单，指定可以批量赋值的字段
protected $fillable = ['name', 'email'];

// $guarded: 黑名单，指定不可批量赋值的字段
protected $guarded = ['id', 'is_admin'];

// 二者只能用其一，不能同时使用
// 推荐使用$fillable（更安全，更明确）
```

**Q4: 如何实现软删除？软删除后如何查询？**

```php
<?php
// 1. 迁移中添加软删除列
$table->softDeletes();

// 2. 模型中使用SoftDeletes trait
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;
}

// 3. 软删除操作
$post->delete();        // 设置deleted_at
$post->forceDelete();   // 真正删除
$post->restore();       // 恢复

// 4. 查询软删除记录
Post::withTrashed()->get();    // 包含已删除
Post::onlyTrashed()->get();    // 只查已删除
Post::all();                   // 默认不含已删除
```

**Q5: 访问器(Accessor)和修改器(Mutator)的作用？**

```php
<?php
class User extends Model
{
    // 访问器：获取属性时转换
    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => "{$this->first_name} {$this->last_name}",
        );
    }

    // 修改器：设置属性时转换
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn ($value) => bcrypt($value),
        );
    }
}

// 使用
echo $user->full_name;        // 访问器
$user->password = 'secret';   // 修改器自动加密
```

### 进阶问题

**Q6: 如何优化包含大量记录的查询？**

```php
<?php
// 1. 使用chunk分块处理
User::chunk(1000, function ($users) {
    foreach ($users as $user) {
        // 处理
    }
});

// 2. 使用cursor逐条处理
foreach (User::cursor() as $user) {
    // 内存友好
}

// 3. 只选择需要的列
User::select(['id', 'name'])->get();

// 4. 使用索引
// 确保WHERE条件列有索引

// 5. 使用缓存
Cache::remember('users', 3600, fn () => User::all());
```

**Q7: 解释模型事件的执行顺序**

```
creating → created
updating → updated
saving → [creating/updating] → [created/updated] → saved
deleting → deleted
restoring → restored (软删除)
```

**Q8: 如何实现多态关联？**

```php
<?php
// 评论可以属于文章或视频
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

// 数据库结构
// comments: id, body, commentable_id, commentable_type
```

## 延伸阅读

### 官方资源

- [Laravel Eloquent 官方文档](https://laravel.com/docs/eloquent)
- [Laravel 数据库迁移文档](https://laravel.com/docs/migrations)
- [Laravel 数据库：Query Builder](https://laravel.com/docs/queries)

### 推荐书籍

- 《Laravel: Up & Running》 by Matt Stauffer
- 《Laravel官方教程》 Laravel.com

### 优质文章

- [Eloquent Performance Patterns](https://laravel-news.com/eloquent-performance-patterns)
- [Laravel Daily - Eloquent Tips](https://laraveldaily.com/tag/eloquent/)
- [Mastering Eloquent ORM](https://www.stitcher.io/blog/eloquent-mysql-views)

### 相关工具

- [Laravel Debugbar](https://github.com/barryvdh/laravel-debugbar) - 调试和性能分析
- [Laravel IDE Helper](https://github.com/barryvdh/laravel-ide-helper) - IDE自动补全支持
- [Laravel Query Detector](https://github.com/beyondcode/laravel-query-detector) - N+1查询检测
- [Clockwork](https://underground.works/clockwork/) - 开发调试工具

### 进阶主题

- Repository模式与Eloquent结合
- 领域驱动设计（DDD）中的Eloquent使用
- 多数据库连接与读写分离
- Eloquent与缓存策略
- 自定义Collection类

---

Eloquent ORM是Laravel框架的核心组件之一，它将数据库操作提升到了面向对象的层次。通过本文的学习，你应该已经掌握了Eloquent的核心概念、关联关系、查询优化和最佳实践。在实际项目中，合理运用预加载、查询作用域和属性转换等特性，可以编写出既优雅又高效的数据库操作代码。持续关注Laravel官方文档和社区资源，不断提升你的Eloquent技能。
