---
title: Pest 测试框架指南
description: Pest PHP 测试框架完整指南，涵盖表达式语法、期望断言、钩子、数据集、架构测试和 Laravel 集成
track: php
section: tooling
difficulty: intermediate
tags:
  - PHP
  - Pest
  - 测试
  - TDD
  - 单元测试
  - Laravel
status: imported
origin: old/src/content/docs/php/pest.zh.md
divergence: 0.219
issues: []
legacy:
  category: PHP
  subcategory: Testing
  order: 23
  lastUpdated: 2026-01-22
---

Pest 是一个基于 PHPUnit 构建的优雅 PHP 测试框架，旨在通过其富有表现力的简约语法为编写测试带来乐趣。由 Nuno Maduro 创建，Pest 专注于简洁性和开发者体验，同时保持与 PHPUnit 强大功能的完全兼容。它已迅速成为 Laravel 社区及更广泛 PHP 生态系统中首选的测试框架。

## 概念解释

Pest 重新构想了 PHP 测试应有的样子和感觉。与冗长的基于类的测试不同，Pest 使用函数式方法，通过 `test()` 和 `it()` 函数使测试读起来像自然语句。这种设计理念减少了样板代码和认知负担，让开发者专注于真正重要的事情：测试应用程序行为。

在底层，Pest 是 PHPUnit 的轻量包装器，这意味着你可以获得 PHPUnit 的所有能力，同时拥有更简洁的 API。Pest 测试可以与 PHPUnit 测试共存，使迁移变得渐进且无痛。该框架引入了自己的期望 API，既流畅可读又提供强大的断言能力。

Pest 还在 PHP 中开创了架构测试，允许你以编程方式执行编码标准和架构决策。结合其插件生态系统（特别是 Laravel Pest），它为现代 PHP 应用程序提供了全面的测试解决方案。

## 核心原理

### 函数式测试语法

Pest 采用函数式编程来创建可读、简洁的测试：

```php
<?php

// 传统 PHPUnit
class CalculatorTest extends TestCase
{
    public function test_it_can_add_two_numbers(): void
    {
        $calculator = new Calculator();
        $result = $calculator->add(2, 3);
        $this->assertEquals(5, $result);
    }
}

// Pest 等价写法
test('it can add two numbers', function () {
    $calculator = new Calculator();
    $result = $calculator->add(2, 3);

    expect($result)->toBe(5);
});

// 或使用 it() 进行 BDD 风格
it('can add two numbers', function () {
    expect((new Calculator())->add(2, 3))->toBe(5);
});
```

### 期望 API

Pest 的期望 API 提供了流畅的、可链式调用的断言接口：

```php
// 基本期望
expect($value)->toBe(5);
expect($value)->toEqual(5);
expect($value)->not->toBe(10);

// 类型期望
expect($user)->toBeInstanceOf(User::class);
expect($items)->toBeArray();
expect($name)->toBeString();
expect($count)->toBeInt();
expect($price)->toBeFloat();
expect($active)->toBeBool();
expect($data)->toBeNull();

// 字符串期望
expect($email)->toContain('@');
expect($url)->toStartWith('https://');
expect($filename)->toEndWith('.php');
expect($slug)->toMatch('/^[a-z0-9-]+$/');

// 数组期望
expect($array)->toHaveCount(3);
expect($array)->toContain('item');
expect($config)->toHaveKey('database');
expect($user)->toHaveKeys(['name', 'email']);
expect($data)->toMatchArray(['key' => 'value']);

// 链式期望
expect($user)
    ->toBeInstanceOf(User::class)
    ->name->toBe('John')
    ->email->toContain('@')
    ->age->toBeGreaterThan(18);
```

### 高阶测试

Pest 支持高阶测试，自动访问测试对象的方法：

```php
// 高阶测试
test('collection')
    ->expect(fn () => collect([1, 2, 3]))
    ->each->toBeInt()
    ->first()->toBe(1)
    ->last()->toBe(3)
    ->count()->toBe(3);

// 高阶期望
expect([1, 2, 3])
    ->each(fn ($number) => $number->toBeInt()->toBeLessThan(10));

// 序列期望
expect([1, 2, 3])->sequence(
    fn ($number) => $number->toBe(1),
    fn ($number) => $number->toBe(2),
    fn ($number) => $number->toBe(3),
);
```

## 核心要点

### 安装和设置

```bash
# 安装 Pest
composer require pestphp/pest --dev --with-all-dependencies

# 在项目中初始化 Pest
./vendor/bin/pest --init

# 对于 Laravel 项目
composer require pestphp/pest-plugin-laravel --dev
php artisan pest:install

# 附加插件
composer require pestphp/pest-plugin-faker --dev      # Faker 集成
composer require pestphp/pest-plugin-watch --dev      # 监视模式
composer require pestphp/pest-plugin-parallel --dev   # 并行测试
```

### 项目结构

```
tests/
├── Pest.php                    # Pest 配置
├── TestCase.php                # 基础测试用例
├── Helpers.php                 # 自定义辅助函数
├── Unit/
│   ├── CalculatorTest.php
│   ├── UserTest.php
│   └── Services/
│       └── PaymentServiceTest.php
├── Feature/
│   ├── AuthenticationTest.php
│   ├── OrderTest.php
│   └── Api/
│       └── ProductApiTest.php
└── Architecture/
    └── ArchitectureTest.php

# phpunit.xml 应包含 Pest 配置
```

### Pest 配置 (tests/Pest.php)

```php
<?php

// tests/Pest.php

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
|--------------------------------------------------------------------------
| 测试用例
|--------------------------------------------------------------------------
| 将测试用例类绑定到特定目录
*/

uses(TestCase::class)->in('Feature');
uses(TestCase::class, RefreshDatabase::class)->in('Feature/Database');

/*
|--------------------------------------------------------------------------
| 期望扩展
|--------------------------------------------------------------------------
| 扩展 Pest 的期望 API
*/

expect()->extend('toBeValidEmail', function () {
    return $this->toMatch('/^[^\s@]+@[^\s@]+\.[^\s@]+$/');
});

expect()->extend('toBeSlug', function () {
    return $this->toMatch('/^[a-z0-9]+(?:-[a-z0-9]+)*$/');
});

expect()->extend('toBeUuid', function () {
    return $this->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i');
});

/*
|--------------------------------------------------------------------------
| 函数
|--------------------------------------------------------------------------
| 测试的全局辅助函数
*/

function createUser(array $attributes = []): User
{
    return User::factory()->create($attributes);
}

function createAdmin(): User
{
    return User::factory()->admin()->create();
}

/*
|--------------------------------------------------------------------------
| 钩子
|--------------------------------------------------------------------------
| 全局 before/after 钩子
*/

uses()->beforeEach(function () {
    // 在每个测试前运行
})->in('Feature');

uses()->afterEach(function () {
    // 在每个测试后运行
})->in('Feature');
```

### 运行测试

```bash
# 运行所有测试
./vendor/bin/pest

# 运行特定测试文件
./vendor/bin/pest tests/Unit/CalculatorTest.php

# 运行匹配模式的测试
./vendor/bin/pest --filter="can add"

# 运行特定组的测试
./vendor/bin/pest --group=api

# 带覆盖率运行
./vendor/bin/pest --coverage
./vendor/bin/pest --coverage --min=80

# 并行运行
./vendor/bin/pest --parallel

# 监视模式（需要插件）
./vendor/bin/pest --watch

# 只运行上次失败的测试
./vendor/bin/pest --retry

# 分析慢测试
./vendor/bin/pest --profile
```

## 代码示例

### 单元测试

```php
<?php

// tests/Unit/CalculatorTest.php

use App\Calculator;

beforeEach(function () {
    $this->calculator = new Calculator();
});

describe('加法', function () {
    it('adds two positive numbers', function () {
        expect($this->calculator->add(2, 3))->toBe(5);
    });

    it('adds negative numbers', function () {
        expect($this->calculator->add(-2, -3))->toBe(-5);
    });

    it('adds zero', function () {
        expect($this->calculator->add(5, 0))->toBe(5);
    });
});

describe('除法', function () {
    it('divides two numbers', function () {
        expect($this->calculator->divide(10, 2))->toBe(5.0);
    });

    it('throws exception when dividing by zero', function () {
        expect(fn () => $this->calculator->divide(10, 0))
            ->toThrow(DivisionByZeroError::class);
    });
});

describe('复杂运算', function () {
    it('calculates percentage', function () {
        expect($this->calculator->percentage(200, 15))->toBe(30.0);
    });

    it('handles decimal precision', function () {
        expect($this->calculator->add(0.1, 0.2))
            ->toBeFloat()
            ->toEqualWithDelta(0.3, 0.0001);
    });
});
```

### 服务测试

```php
<?php

// tests/Unit/Services/OrderServiceTest.php

use App\Services\OrderService;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Exceptions\InsufficientStockException;
use App\Repositories\OrderRepository;
use App\Repositories\ProductRepository;

beforeEach(function () {
    $this->orderRepository = Mockery::mock(OrderRepository::class);
    $this->productRepository = Mockery::mock(ProductRepository::class);

    $this->service = new OrderService(
        $this->orderRepository,
        $this->productRepository
    );
});

afterEach(function () {
    Mockery::close();
});

describe('createOrder', function () {
    it('creates an order with valid items', function () {
        $user = new User(['id' => 1, 'name' => 'John']);
        $product = new Product(['id' => 1, 'name' => '小部件', 'price' => 100, 'stock' => 10]);
        $items = [['product_id' => 1, 'quantity' => 2]];

        $this->productRepository
            ->shouldReceive('find')
            ->with(1)
            ->andReturn($product);

        $this->productRepository
            ->shouldReceive('decrementStock')
            ->with(1, 2)
            ->once();

        $this->orderRepository
            ->shouldReceive('create')
            ->once()
            ->andReturn(new Order(['id' => 1, 'total' => 200]));

        $order = $this->service->createOrder($user, $items);

        expect($order)
            ->toBeInstanceOf(Order::class)
            ->total->toBe(200);
    });

    it('throws exception when product is out of stock', function () {
        $user = new User(['id' => 1]);
        $product = new Product(['id' => 1, 'stock' => 1]);
        $items = [['product_id' => 1, 'quantity' => 5]];

        $this->productRepository
            ->shouldReceive('find')
            ->with(1)
            ->andReturn($product);

        expect(fn () => $this->service->createOrder($user, $items))
            ->toThrow(InsufficientStockException::class);
    });

    it('calculates correct total for multiple items', function () {
        $user = new User(['id' => 1]);
        $product1 = new Product(['id' => 1, 'price' => 100, 'stock' => 10]);
        $product2 = new Product(['id' => 2, 'price' => 50, 'stock' => 10]);
        $items = [
            ['product_id' => 1, 'quantity' => 2],
            ['product_id' => 2, 'quantity' => 3]
        ];

        $this->productRepository
            ->shouldReceive('find')
            ->with(1)
            ->andReturn($product1);

        $this->productRepository
            ->shouldReceive('find')
            ->with(2)
            ->andReturn($product2);

        $this->productRepository->shouldReceive('decrementStock')->twice();

        $this->orderRepository
            ->shouldReceive('create')
            ->withArgs(function ($data) {
                return $data['total'] === 350; // (100*2) + (50*3)
            })
            ->andReturn(new Order(['id' => 1, 'total' => 350]));

        $order = $this->service->createOrder($user, $items);

        expect($order->total)->toBe(350);
    });
});
```

### Laravel 功能测试

```php
<?php

// tests/Feature/AuthenticationTest.php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create([
        'email' => 'john@example.com',
        'password' => bcrypt('password123')
    ]);
});

describe('登录', function () {
    it('allows users to login with correct credentials', function () {
        $response = $this->post('/login', [
            'email' => 'john@example.com',
            'password' => 'password123'
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($this->user);
    });

    it('rejects invalid credentials', function () {
        $response = $this->post('/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    });

    it('validates required fields', function () {
        $response = $this->post('/login', []);

        $response->assertSessionHasErrors(['email', 'password']);
    });

    it('locks account after 5 failed attempts', function () {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', [
                'email' => 'john@example.com',
                'password' => 'wrong'
            ]);
        }

        $response = $this->post('/login', [
            'email' => 'john@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(429); // 请求过多
    });
});

describe('注册', function () {
    it('allows new users to register', function () {
        $response = $this->post('/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertRedirect('/dashboard');

        $this->assertDatabaseHas('users', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com'
        ]);
    });

    it('rejects duplicate email', function () {
        $response = $this->post('/register', [
            'name' => 'John Clone',
            'email' => 'john@example.com', // 已存在
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertSessionHasErrors('email');
    });
});

describe('登出', function () {
    it('allows authenticated users to logout', function () {
        $this->actingAs($this->user);

        $response = $this->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    });
});
```

### API 测试

```php
<?php

// tests/Feature/Api/ProductApiTest.php

use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->token = $this->user->createToken('test')->plainTextToken;
});

describe('GET /api/products', function () {
    it('returns paginated products', function () {
        Product::factory()->count(25)->create();

        $response = $this->getJson('/api/products');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'name', 'price', 'created_at']
                ],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ])
            ->assertJsonCount(20, 'data'); // 默认分页
    });

    it('filters products by category', function () {
        Product::factory()->create(['category' => 'electronics']);
        Product::factory()->count(3)->create(['category' => 'clothing']);

        $response = $this->getJson('/api/products?category=electronics');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data');
    });

    it('searches products by name', function () {
        Product::factory()->create(['name' => 'iPhone 15']);
        Product::factory()->create(['name' => 'Samsung Galaxy']);

        $response = $this->getJson('/api/products?search=iphone');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'iPhone 15');
    });
});

describe('POST /api/products', function () {
    it('creates a product when authenticated', function () {
        $productData = [
            'name' => '新产品',
            'price' => 99.99,
            'description' => '一个很棒的产品',
            'category' => 'electronics'
        ];

        $response = $this->withToken($this->token)
            ->postJson('/api/products', $productData);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', '新产品')
            ->assertJsonPath('data.price', 99.99);

        $this->assertDatabaseHas('products', [
            'name' => '新产品',
            'price' => 99.99
        ]);
    });

    it('requires authentication', function () {
        $response = $this->postJson('/api/products', [
            'name' => '产品',
            'price' => 50
        ]);

        $response->assertUnauthorized();
    });

    it('validates required fields', function () {
        $response = $this->withToken($this->token)
            ->postJson('/api/products', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'price']);
    });
});

describe('PUT /api/products/{id}', function () {
    it('updates a product', function () {
        $product = Product::factory()->create(['name' => '旧名称']);

        $response = $this->withToken($this->token)
            ->putJson("/api/products/{$product->id}", [
                'name' => '新名称'
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', '新名称');

        expect($product->fresh()->name)->toBe('新名称');
    });

    it('returns 404 for non-existent product', function () {
        $response = $this->withToken($this->token)
            ->putJson('/api/products/999', ['name' => '测试']);

        $response->assertNotFound();
    });
});

describe('DELETE /api/products/{id}', function () {
    it('deletes a product', function () {
        $product = Product::factory()->create();

        $response = $this->withToken($this->token)
            ->deleteJson("/api/products/{$product->id}");

        $response->assertNoContent();

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    });
});
```

### 数据集（数据提供者）

```php
<?php

// tests/Unit/ValidationTest.php

use App\Validators\EmailValidator;

describe('邮箱验证', function () {
    // 内联数据集
    it('validates correct emails', function (string $email) {
        expect(EmailValidator::isValid($email))->toBeTrue();
    })->with([
        '简单' => 'test@example.com',
        '带子域名' => 'test@mail.example.com',
        '带加号' => 'test+tag@example.com',
        '带点' => 'first.last@example.com',
    ]);

    it('rejects invalid emails', function (string $email) {
        expect(EmailValidator::isValid($email))->toBeFalse();
    })->with([
        '缺少 @' => 'invalid-email',
        '缺少域名' => 'test@',
        '缺少本地部分' => '@example.com',
        '空格' => 'test @example.com',
        '双点' => 'test..test@example.com',
    ]);
});

// 在 Pest.php 或单独文件中命名数据集
dataset('valid emails', [
    '标准' => ['user@example.com'],
    '子域名' => ['user@mail.example.com'],
    '带加号' => ['user+tag@example.com'],
    '数字' => ['12345@example.com'],
]);

dataset('invalid emails', [
    '无 @ 符号' => ['userexample.com'],
    '多个 @' => ['user@@example.com'],
    '特殊字符' => ['user<>@example.com'],
]);

// 使用命名数据集
it('validates email format', function (string $email) {
    expect(EmailValidator::isValid($email))->toBeTrue();
})->with('valid emails');

// 组合数据集
it('processes order correctly', function (string $status, int $total, bool $expected) {
    $order = new Order(['status' => $status, 'total' => $total]);
    expect($order->canBeCancelled())->toBe($expected);
})->with([
    ['pending', 100, true],
    ['processing', 100, true],
    ['shipped', 100, false],
    ['delivered', 100, false],
    ['pending', 0, false], // 零总额不能取消
]);

// 延迟数据集（按需生成）
dataset('random users', function () {
    for ($i = 0; $i < 5; $i++) {
        yield "用户 {$i}" => [fake()->name(), fake()->email()];
    }
});
```

### 架构测试

```php
<?php

// tests/Architecture/ArchitectureTest.php

arch('控制器不应有公共属性')
    ->expect('App\Http\Controllers')
    ->toHaveNoPublicProperties();

arch('模型应继承基础模型')
    ->expect('App\Models')
    ->toExtend('Illuminate\Database\Eloquent\Model');

arch('控制器应有 Controller 后缀')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('控制器只应被路由使用')
    ->expect('App\Http\Controllers')
    ->toOnlyBeUsedIn('App\Providers\RouteServiceProvider');

arch('服务不应依赖控制器')
    ->expect('App\Services')
    ->not->toUse('App\Http\Controllers');

arch('领域层不应依赖基础设施')
    ->expect('App\Domain')
    ->not->toUse([
        'Illuminate\Support\Facades',
        'Illuminate\Http',
    ]);

arch('生产代码中不应有调试语句')
    ->expect(['dd', 'dump', 'var_dump', 'print_r', 'ray'])
    ->not->toBeUsed();

arch('应声明严格类型')
    ->expect('App')
    ->toUseStrictTypes();

arch('仓库应是接口')
    ->expect('App\Contracts\Repositories')
    ->toBeInterfaces();

arch('事件应是 final')
    ->expect('App\Events')
    ->toBeFinal();

arch('值对象应是只读')
    ->expect('App\ValueObjects')
    ->toBeReadonly();

arch('动作应有单一公共方法')
    ->expect('App\Actions')
    ->toHaveMethod('execute');

// 分层架构
arch('应用层不应依赖基础设施')
    ->expect('App\Application')
    ->not->toUse('App\Infrastructure');

arch('领域层不应有依赖')
    ->expect('App\Domain')
    ->not->toUse([
        'App\Application',
        'App\Infrastructure',
        'App\Http',
    ]);
```

## 最佳实践

### 使用 Describe 块组织测试

```php
<?php

// 组织良好的测试文件
describe('用户注册', function () {

    describe('验证', function () {
        it('requires name', function () {
            // ...
        });

        it('requires valid email', function () {
            // ...
        });

        it('requires password confirmation', function () {
            // ...
        });
    });

    describe('成功注册', function () {
        it('creates user in database', function () {
            // ...
        });

        it('sends welcome email', function () {
            // ...
        });

        it('logs user in automatically', function () {
            // ...
        });
    });

    describe('边界情况', function () {
        it('handles unicode names', function () {
            // ...
        });

        it('trims whitespace from inputs', function () {
            // ...
        });
    });
});
```

### 自定义期望

```php
<?php

// tests/Pest.php

expect()->extend('toBeValidJson', function () {
    json_decode($this->value);
    return $this->and(json_last_error())->toBe(JSON_ERROR_NONE);
});

expect()->extend('toBeWithinRange', function (int $min, int $max) {
    return $this
        ->toBeGreaterThanOrEqual($min)
        ->toBeLessThanOrEqual($max);
});

expect()->extend('toHaveSuccessStatus', function () {
    return $this
        ->toBeInstanceOf(\Illuminate\Http\Response::class)
        ->and($this->value->status())->toBeWithinRange(200, 299);
});

expect()->extend('toContainOnlyInstancesOf', function (string $class) {
    foreach ($this->value as $item) {
        expect($item)->toBeInstanceOf($class);
    }
    return $this;
});

// 使用
test('api returns valid json', function () {
    $response = $this->getJson('/api/users');
    expect($response->content())->toBeValidJson();
});

test('score is within range', function () {
    $score = calculateScore();
    expect($score)->toBeWithinRange(0, 100);
});
```

### 测试异常

```php
<?php

use App\Exceptions\InsufficientFundsException;
use App\Services\PaymentService;

it('throws exception when balance is insufficient', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(1000, balance: 500))
        ->toThrow(InsufficientFundsException::class);
});

it('throws exception with specific message', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(1000, balance: 500))
        ->toThrow(InsufficientFundsException::class, '余额不足');
});

it('throws exception matching callback', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(1000, balance: 500))
        ->toThrow(function (InsufficientFundsException $e) {
            expect($e->getRequiredAmount())->toBe(1000);
            expect($e->getAvailableBalance())->toBe(500);
        });
});

// 测试不抛出异常
it('succeeds with sufficient balance', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(500, balance: 1000))
        ->not->toThrow(InsufficientFundsException::class);
});
```

## 常见陷阱

### 忘记返回期望

```php
// 错误：实际上没有任何断言
it('validates email', function () {
    $email = 'test@example.com';
    expect($email)->toBeString(); // 有效
    expect($email)->toContain('@'); // 有效
    $email; // 什么都不做！
});

// 正确：正确的断言链
it('validates email', function () {
    $email = 'test@example.com';
    expect($email)
        ->toBeString()
        ->toContain('@')
        ->toEndWith('.com');
});
```

### 不清理状态

```php
// 错误：状态在测试间泄漏
$counter = 0;

it('increments counter', function () use (&$counter) {
    $counter++;
    expect($counter)->toBe(1); // 如果其他测试先运行可能失败
});

// 正确：在钩子中重置状态
beforeEach(function () {
    $this->counter = 0;
});

it('increments counter', function () {
    $this->counter++;
    expect($this->counter)->toBe(1);
});

// 或使用隔离的实例
it('increments counter', function () {
    $counter = new Counter();
    $counter->increment();
    expect($counter->getValue())->toBe(1);
});
```

### 过度模拟

```php
// 错误：测试的是模拟，而不是代码
it('creates user', function () {
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')->once()->andReturn(new User());
    $repo->shouldReceive('find')->andReturn(new User());

    $service = new UserService($repo);
    $user = $service->createUser(['name' => 'John']);

    // 即使服务逻辑有问题，这个测试也会通过
    expect($user)->toBeInstanceOf(User::class);
});

// 正确：测试真实行为，只模拟外部依赖
it('creates user with correct data', function () {
    // 使用带测试数据库的真实仓库
    $service = new UserService(new UserRepository());

    $user = $service->createUser([
        'name' => 'John',
        'email' => 'john@example.com'
    ]);

    expect($user)
        ->toBeInstanceOf(User::class)
        ->name->toBe('John')
        ->email->toBe('john@example.com')
        ->created_at->not->toBeNull();
});
```

## 性能考量

### 并行测试

```bash
# 安装并行插件
composer require pestphp/pest-plugin-parallel --dev

# 并行运行测试
./vendor/bin/pest --parallel

# 指定进程数
./vendor/bin/pest --parallel --processes=8
```

```php
// 确保测试隔离以便并行执行
beforeEach(function () {
    // 使用唯一标识符避免冲突
    $this->testId = uniqid();
});

// 使用数据库事务
uses(RefreshDatabase::class);

// 或为每个进程使用唯一数据库
// 在 phpunit.xml 或 Pest.php 中配置
```

### 优化测试速度

```php
<?php

// 高效使用工厂
beforeAll(function () {
    // 为文件中所有测试创建一次共享数据
    User::factory()->count(10)->create();
});

// 策略性使用数据库填充
uses(RefreshDatabase::class);
uses()->beforeEach(fn () => $this->seed(TestDataSeeder::class))->in('Feature');

// 模拟慢速外部服务
beforeEach(function () {
    Http::fake([
        'api.stripe.com/*' => Http::response(['success' => true]),
        'api.sendgrid.com/*' => Http::response(['sent' => true]),
    ]);
});

// 单元测试使用内存数据库
// phpunit.xml
// <env name="DB_CONNECTION" value="sqlite"/>
// <env name="DB_DATABASE" value=":memory:"/>
```

### 分析测试

```bash
# 查找慢测试
./vendor/bin/pest --profile

# 输出显示最慢的测试
# Tests:  50 passed
# Time:   12.34s
#
# 慢测试：
#  - 2.34s tests/Feature/ImportTest.php::it imports large file
#  - 1.56s tests/Feature/ReportTest.php::it generates PDF report
#  - 1.23s tests/Feature/EmailTest.php::it sends bulk emails
```

## 实战场景

### 测试事件驱动系统

```php
<?php

use App\Events\OrderPlaced;
use App\Listeners\SendOrderConfirmation;
use App\Listeners\UpdateInventory;
use App\Models\Order;
use Illuminate\Support\Facades\Event;

describe('订单事件', function () {
    it('dispatches OrderPlaced event when order is created', function () {
        Event::fake();

        $order = Order::factory()->create();

        Event::assertDispatched(OrderPlaced::class, function ($event) use ($order) {
            return $event->order->id === $order->id;
        });
    });

    it('triggers all expected listeners', function () {
        Event::fake();

        $order = Order::factory()->create();

        Event::assertListening(OrderPlaced::class, SendOrderConfirmation::class);
        Event::assertListening(OrderPlaced::class, UpdateInventory::class);
    });

    it('sends confirmation email when order is placed', function () {
        Mail::fake();

        $order = Order::factory()->create();

        $listener = new SendOrderConfirmation();
        $listener->handle(new OrderPlaced($order));

        Mail::assertSent(OrderConfirmationMail::class, function ($mail) use ($order) {
            return $mail->order->id === $order->id;
        });
    });
});
```

### 测试任务和队列

```php
<?php

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Support\Facades\Queue;

describe('播客处理', function () {
    it('queues processing job when podcast is uploaded', function () {
        Queue::fake();

        $podcast = Podcast::factory()->create();

        Queue::assertPushed(ProcessPodcast::class, function ($job) use ($podcast) {
            return $job->podcast->id === $podcast->id;
        });
    });

    it('processes podcast correctly', function () {
        Storage::fake('podcasts');

        $podcast = Podcast::factory()->create([
            'status' => 'pending'
        ]);

        // 同步执行任务
        (new ProcessPodcast($podcast))->handle();

        expect($podcast->fresh())
            ->status->toBe('processed')
            ->duration->not->toBeNull()
            ->transcription->not->toBeNull();
    });

    it('handles processing failure gracefully', function () {
        $podcast = Podcast::factory()->create();

        // 模拟失败
        $job = new ProcessPodcast($podcast);
        $job->failed(new Exception('处理失败'));

        expect($podcast->fresh())
            ->status->toBe('failed')
            ->error_message->toBe('处理失败');
    });
});
```

## 面试要点

1. **什么是 Pest，它与 PHPUnit 有什么不同？**
   - Pest 是基于 PHPUnit 构建的测试框架，具有更具表现力的函数式语法。它使用 test() 和 it() 函数代替类，有流畅的期望 API，并原生支持数据集和架构测试等功能。

2. **解释 Pest 的期望 API。**
   - Pest 的 expect() 函数返回一个期望对象，具有可链式调用的方法如 toBe()、toEqual()、toContain() 等。它支持高阶期望、通过 extend() 自定义期望，以及用于否定的 not 修饰符。

3. **Pest 中的数据集如何工作？**
   - 数据集（数据提供者）允许使用不同的输入运行相同的测试。使用 ->with([]) 内联定义或在 Pest.php 中定义命名数据集。它们支持数组、生成器和用于清晰测试输出的命名条目。

4. **什么是 Pest 中的架构测试？**
   - 架构测试使用 arch() 以编程方式执行编码标准。测试类是否遵循命名约定、依赖是否正确流动、是否存在调试语句，以及层是否遵守边界。

5. **如何在 Pest 中组织测试？**
   - 使用 describe() 块分组相关测试，beforeEach/afterEach 进行设置/清理，分离 Unit/Feature/Architecture 目录，并在 Pest.php 中进行共享配置、自定义期望和全局辅助函数。

6. **Pest 如何与 Laravel 集成？**
   - pest-plugin-laravel 包提供 Laravel 特定功能：RefreshDatabase trait、用于认证的 actingAs()、assertDatabaseHas()、HTTP 测试辅助函数和自动 TestCase 绑定。

7. **什么是高阶测试？**
   - 高阶测试自动将方法调用代理到测试对象。使用 ->expect(fn() => $subject) 创建流畅的断言，可以自然地读取并访问嵌套属性/方法。

## 延伸阅读

- [Pest 官方文档](https://pestphp.com/docs/)
- [Pest GitHub 仓库](https://github.com/pestphp/pest)
- [Pest Laravel 插件](https://pestphp.com/docs/plugins/laravel)
- [PHPUnit 文档](https://phpunit.de/documentation.html)
- [测试 Laravel 应用程序](https://laravel.com/docs/testing)
- [Pest 架构测试](https://pestphp.com/docs/arch-testing)
- [Pest TDD 课程](https://laracasts.com/series/pest-from-scratch)
