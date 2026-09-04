---
title: Pest Testing Framework Guide
description: Complete guide to Pest PHP testing framework covering expressive syntax, expectations, hooks, datasets, architecture testing, and Laravel integration
track: php
section: tooling
difficulty: intermediate
tags:
  - PHP
  - Pest
  - Testing
  - TDD
  - Unit Testing
  - Laravel
status: imported
origin: old/src/content/docs/php/pest.en.md
divergence: 0.219
issues: []
legacy:
  category: PHP
  subcategory: Testing
  order: 23
  lastUpdated: 2026-01-22
---

Pest is an elegant PHP testing framework built on top of PHPUnit, designed to bring joy to writing tests through its expressive, minimalist syntax. Created by Nuno Maduro, Pest focuses on simplicity and developer experience while maintaining full compatibility with PHPUnit's powerful features. It has quickly become the preferred testing framework in the Laravel community and beyond.

## Concept Explanation

Pest reimagines how PHP tests should look and feel. Instead of verbose class-based tests, Pest uses a functional approach with `test()` and `it()` functions that make tests read like natural sentences. This design philosophy reduces boilerplate code and cognitive overhead, letting developers focus on what truly matters: testing application behavior.

Under the hood, Pest is a thin wrapper around PHPUnit, meaning you get all of PHPUnit's power with a cleaner API. Pest tests can coexist with PHPUnit tests, making migration gradual and painless. The framework introduces its own expectation API that reads fluently while providing powerful assertion capabilities.

Pest also pioneered architecture testing in PHP, allowing you to enforce coding standards and architectural decisions programmatically. Combined with its plugin ecosystem (especially Laravel Pest), it offers a comprehensive testing solution for modern PHP applications.

## Core Principles

### The Functional Testing Syntax

Pest embraces functional programming to create readable, concise tests:

```php
<?php

// Traditional PHPUnit
class CalculatorTest extends TestCase
{
    public function test_it_can_add_two_numbers(): void
    {
        $calculator = new Calculator();
        $result = $calculator->add(2, 3);
        $this->assertEquals(5, $result);
    }
}

// Pest equivalent
test('it can add two numbers', function () {
    $calculator = new Calculator();
    $result = $calculator->add(2, 3);

    expect($result)->toBe(5);
});

// Or using it() for BDD style
it('can add two numbers', function () {
    expect((new Calculator())->add(2, 3))->toBe(5);
});
```

### Expectation API

Pest's expectation API provides a fluent, chainable interface for assertions:

```php
// Basic expectations
expect($value)->toBe(5);
expect($value)->toEqual(5);
expect($value)->not->toBe(10);

// Type expectations
expect($user)->toBeInstanceOf(User::class);
expect($items)->toBeArray();
expect($name)->toBeString();
expect($count)->toBeInt();
expect($price)->toBeFloat();
expect($active)->toBeBool();
expect($data)->toBeNull();

// String expectations
expect($email)->toContain('@');
expect($url)->toStartWith('https://');
expect($filename)->toEndWith('.php');
expect($slug)->toMatch('/^[a-z0-9-]+$/');

// Array expectations
expect($array)->toHaveCount(3);
expect($array)->toContain('item');
expect($config)->toHaveKey('database');
expect($user)->toHaveKeys(['name', 'email']);
expect($data)->toMatchArray(['key' => 'value']);

// Chainable expectations
expect($user)
    ->toBeInstanceOf(User::class)
    ->name->toBe('John')
    ->email->toContain('@')
    ->age->toBeGreaterThan(18);
```

### Higher-Order Tests

Pest supports higher-order tests that automatically access test subject methods:

```php
// Higher-order test
test('collection')
    ->expect(fn () => collect([1, 2, 3]))
    ->each->toBeInt()
    ->first()->toBe(1)
    ->last()->toBe(3)
    ->count()->toBe(3);

// Higher-order expectations
expect([1, 2, 3])
    ->each(fn ($number) => $number->toBeInt()->toBeLessThan(10));

// Sequence expectations
expect([1, 2, 3])->sequence(
    fn ($number) => $number->toBe(1),
    fn ($number) => $number->toBe(2),
    fn ($number) => $number->toBe(3),
);
```

## Key Concepts

### Installation and Setup

```bash
# Install Pest
composer require pestphp/pest --dev --with-all-dependencies

# Initialize Pest in your project
./vendor/bin/pest --init

# For Laravel projects
composer require pestphp/pest-plugin-laravel --dev
php artisan pest:install

# Additional plugins
composer require pestphp/pest-plugin-faker --dev      # Faker integration
composer require pestphp/pest-plugin-watch --dev      # Watch mode
composer require pestphp/pest-plugin-parallel --dev   # Parallel testing
```

### Project Structure

```
tests/
├── Pest.php                    # Pest configuration
├── TestCase.php                # Base test case
├── Helpers.php                 # Custom helpers
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

# phpunit.xml should include Pest configuration
```

### Pest Configuration (tests/Pest.php)

```php
<?php

// tests/Pest.php

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
| Bind test case classes to specific directories
*/

uses(TestCase::class)->in('Feature');
uses(TestCase::class, RefreshDatabase::class)->in('Feature/Database');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
| Extend Pest's expectation API
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
| Functions
|--------------------------------------------------------------------------
| Global helper functions for tests
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
| Hooks
|--------------------------------------------------------------------------
| Global before/after hooks
*/

uses()->beforeEach(function () {
    // Runs before each test
})->in('Feature');

uses()->afterEach(function () {
    // Runs after each test
})->in('Feature');
```

### Running Tests

```bash
# Run all tests
./vendor/bin/pest

# Run specific test file
./vendor/bin/pest tests/Unit/CalculatorTest.php

# Run tests matching pattern
./vendor/bin/pest --filter="can add"

# Run tests in specific group
./vendor/bin/pest --group=api

# Run with coverage
./vendor/bin/pest --coverage
./vendor/bin/pest --coverage --min=80

# Run in parallel
./vendor/bin/pest --parallel

# Watch mode (with plugin)
./vendor/bin/pest --watch

# Run only tests that failed last time
./vendor/bin/pest --retry

# Profile slow tests
./vendor/bin/pest --profile
```

## Code Examples

### Unit Testing

```php
<?php

// tests/Unit/CalculatorTest.php

use App\Calculator;

beforeEach(function () {
    $this->calculator = new Calculator();
});

describe('addition', function () {
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

describe('division', function () {
    it('divides two numbers', function () {
        expect($this->calculator->divide(10, 2))->toBe(5.0);
    });

    it('throws exception when dividing by zero', function () {
        expect(fn () => $this->calculator->divide(10, 0))
            ->toThrow(DivisionByZeroError::class);
    });
});

describe('complex operations', function () {
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

### Service Testing

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
        $product = new Product(['id' => 1, 'name' => 'Widget', 'price' => 100, 'stock' => 10]);
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

### Feature Testing with Laravel

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

describe('login', function () {
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

        $response->assertStatus(429); // Too many requests
    });
});

describe('registration', function () {
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
            'email' => 'john@example.com', // Already exists
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertSessionHasErrors('email');
    });
});

describe('logout', function () {
    it('allows authenticated users to logout', function () {
        $this->actingAs($this->user);

        $response = $this->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    });
});
```

### API Testing

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
            ->assertJsonCount(20, 'data'); // Default pagination
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
            'name' => 'New Product',
            'price' => 99.99,
            'description' => 'A great product',
            'category' => 'electronics'
        ];

        $response = $this->withToken($this->token)
            ->postJson('/api/products', $productData);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'New Product')
            ->assertJsonPath('data.price', 99.99);

        $this->assertDatabaseHas('products', [
            'name' => 'New Product',
            'price' => 99.99
        ]);
    });

    it('requires authentication', function () {
        $response = $this->postJson('/api/products', [
            'name' => 'Product',
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
        $product = Product::factory()->create(['name' => 'Old Name']);

        $response = $this->withToken($this->token)
            ->putJson("/api/products/{$product->id}", [
                'name' => 'New Name'
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        expect($product->fresh()->name)->toBe('New Name');
    });

    it('returns 404 for non-existent product', function () {
        $response = $this->withToken($this->token)
            ->putJson('/api/products/999', ['name' => 'Test']);

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

### Datasets (Data Providers)

```php
<?php

// tests/Unit/ValidationTest.php

use App\Validators\EmailValidator;

describe('email validation', function () {
    // Inline dataset
    it('validates correct emails', function (string $email) {
        expect(EmailValidator::isValid($email))->toBeTrue();
    })->with([
        'simple' => 'test@example.com',
        'with subdomain' => 'test@mail.example.com',
        'with plus' => 'test+tag@example.com',
        'with dots' => 'first.last@example.com',
    ]);

    it('rejects invalid emails', function (string $email) {
        expect(EmailValidator::isValid($email))->toBeFalse();
    })->with([
        'missing @' => 'invalid-email',
        'missing domain' => 'test@',
        'missing local part' => '@example.com',
        'spaces' => 'test @example.com',
        'double dots' => 'test..test@example.com',
    ]);
});

// Named datasets in Pest.php or separate file
dataset('valid emails', [
    'standard' => ['user@example.com'],
    'subdomain' => ['user@mail.example.com'],
    'with plus' => ['user+tag@example.com'],
    'numeric' => ['12345@example.com'],
]);

dataset('invalid emails', [
    'no at sign' => ['userexample.com'],
    'multiple at' => ['user@@example.com'],
    'special chars' => ['user<>@example.com'],
]);

// Using named datasets
it('validates email format', function (string $email) {
    expect(EmailValidator::isValid($email))->toBeTrue();
})->with('valid emails');

// Combined datasets
it('processes order correctly', function (string $status, int $total, bool $expected) {
    $order = new Order(['status' => $status, 'total' => $total]);
    expect($order->canBeCancelled())->toBe($expected);
})->with([
    ['pending', 100, true],
    ['processing', 100, true],
    ['shipped', 100, false],
    ['delivered', 100, false],
    ['pending', 0, false], // Zero total cannot be cancelled
]);

// Lazy datasets (generated on demand)
dataset('random users', function () {
    for ($i = 0; $i < 5; $i++) {
        yield "user {$i}" => [fake()->name(), fake()->email()];
    }
});
```

### Architecture Testing

```php
<?php

// tests/Architecture/ArchitectureTest.php

arch('controllers should not have public properties')
    ->expect('App\Http\Controllers')
    ->toHaveNoPublicProperties();

arch('models should extend base model')
    ->expect('App\Models')
    ->toExtend('Illuminate\Database\Eloquent\Model');

arch('controllers should have Controller suffix')
    ->expect('App\Http\Controllers')
    ->toHaveSuffix('Controller');

arch('controllers should only be used by routes')
    ->expect('App\Http\Controllers')
    ->toOnlyBeUsedIn('App\Providers\RouteServiceProvider');

arch('services should not depend on controllers')
    ->expect('App\Services')
    ->not->toUse('App\Http\Controllers');

arch('domain should not depend on infrastructure')
    ->expect('App\Domain')
    ->not->toUse([
        'Illuminate\Support\Facades',
        'Illuminate\Http',
    ]);

arch('no debugging statements in production code')
    ->expect(['dd', 'dump', 'var_dump', 'print_r', 'ray'])
    ->not->toBeUsed();

arch('strict types should be declared')
    ->expect('App')
    ->toUseStrictTypes();

arch('repositories should be interfaces')
    ->expect('App\Contracts\Repositories')
    ->toBeInterfaces();

arch('events should be final')
    ->expect('App\Events')
    ->toBeFinal();

arch('value objects should be readonly')
    ->expect('App\ValueObjects')
    ->toBeReadonly();

arch('actions should have single public method')
    ->expect('App\Actions')
    ->toHaveMethod('execute');

// Layered architecture
arch('application layer should not depend on infrastructure')
    ->expect('App\Application')
    ->not->toUse('App\Infrastructure');

arch('domain layer should have no dependencies')
    ->expect('App\Domain')
    ->not->toUse([
        'App\Application',
        'App\Infrastructure',
        'App\Http',
    ]);
```

## Best Practices

### Organizing Tests with Describe Blocks

```php
<?php

// Well-organized test file
describe('User Registration', function () {

    describe('validation', function () {
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

    describe('successful registration', function () {
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

    describe('edge cases', function () {
        it('handles unicode names', function () {
            // ...
        });

        it('trims whitespace from inputs', function () {
            // ...
        });
    });
});
```

### Custom Expectations

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

// Usage
test('api returns valid json', function () {
    $response = $this->getJson('/api/users');
    expect($response->content())->toBeValidJson();
});

test('score is within range', function () {
    $score = calculateScore();
    expect($score)->toBeWithinRange(0, 100);
});
```

### Testing Exceptions

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
        ->toThrow(InsufficientFundsException::class, 'Insufficient balance');
});

it('throws exception matching callback', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(1000, balance: 500))
        ->toThrow(function (InsufficientFundsException $e) {
            expect($e->getRequiredAmount())->toBe(1000);
            expect($e->getAvailableBalance())->toBe(500);
        });
});

// Testing that no exception is thrown
it('succeeds with sufficient balance', function () {
    $service = new PaymentService();

    expect(fn () => $service->charge(500, balance: 1000))
        ->not->toThrow(InsufficientFundsException::class);
});
```

## Common Pitfalls

### Forgetting to Return Expectations

```php
// WRONG: Nothing is actually asserted
it('validates email', function () {
    $email = 'test@example.com';
    expect($email)->toBeString(); // Works
    expect($email)->toContain('@'); // Works
    $email; // Does nothing!
});

// CORRECT: Proper assertion chain
it('validates email', function () {
    $email = 'test@example.com';
    expect($email)
        ->toBeString()
        ->toContain('@')
        ->toEndWith('.com');
});
```

### Not Cleaning Up State

```php
// WRONG: State leaks between tests
$counter = 0;

it('increments counter', function () use (&$counter) {
    $counter++;
    expect($counter)->toBe(1); // May fail if other tests ran first
});

// CORRECT: Reset state in hooks
beforeEach(function () {
    $this->counter = 0;
});

it('increments counter', function () {
    $this->counter++;
    expect($this->counter)->toBe(1);
});

// Or use isolated instances
it('increments counter', function () {
    $counter = new Counter();
    $counter->increment();
    expect($counter->getValue())->toBe(1);
});
```

### Over-Mocking

```php
// WRONG: Testing the mock, not the code
it('creates user', function () {
    $repo = Mockery::mock(UserRepository::class);
    $repo->shouldReceive('create')->once()->andReturn(new User());
    $repo->shouldReceive('find')->andReturn(new User());

    $service = new UserService($repo);
    $user = $service->createUser(['name' => 'John']);

    // This test passes even if service logic is broken
    expect($user)->toBeInstanceOf(User::class);
});

// CORRECT: Test real behavior, mock only external dependencies
it('creates user with correct data', function () {
    // Use real repository with test database
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

## Performance Considerations

### Parallel Testing

```bash
# Install parallel plugin
composer require pestphp/pest-plugin-parallel --dev

# Run tests in parallel
./vendor/bin/pest --parallel

# Specify number of processes
./vendor/bin/pest --parallel --processes=8
```

```php
// Ensure tests are isolated for parallel execution
beforeEach(function () {
    // Use unique identifiers to avoid conflicts
    $this->testId = uniqid();
});

// Use database transactions
uses(RefreshDatabase::class);

// Or use unique database per process
// Configure in phpunit.xml or Pest.php
```

### Optimizing Test Speed

```php
<?php

// Use factories efficiently
beforeAll(function () {
    // Create shared data once for all tests in file
    User::factory()->count(10)->create();
});

// Use database seeding strategically
uses(RefreshDatabase::class);
uses()->beforeEach(fn () => $this->seed(TestDataSeeder::class))->in('Feature');

// Mock slow external services
beforeEach(function () {
    Http::fake([
        'api.stripe.com/*' => Http::response(['success' => true]),
        'api.sendgrid.com/*' => Http::response(['sent' => true]),
    ]);
});

// Use in-memory database for unit tests
// phpunit.xml
// <env name="DB_CONNECTION" value="sqlite"/>
// <env name="DB_DATABASE" value=":memory:"/>
```

### Profiling Tests

```bash
# Find slow tests
./vendor/bin/pest --profile

# Output shows slowest tests
# Tests:  50 passed
# Time:   12.34s
#
# Slow tests:
#  - 2.34s tests/Feature/ImportTest.php::it imports large file
#  - 1.56s tests/Feature/ReportTest.php::it generates PDF report
#  - 1.23s tests/Feature/EmailTest.php::it sends bulk emails
```

## Real-World Scenarios

### Testing Event-Driven Systems

```php
<?php

use App\Events\OrderPlaced;
use App\Listeners\SendOrderConfirmation;
use App\Listeners\UpdateInventory;
use App\Models\Order;
use Illuminate\Support\Facades\Event;

describe('order events', function () {
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

### Testing Jobs and Queues

```php
<?php

use App\Jobs\ProcessPodcast;
use App\Models\Podcast;
use Illuminate\Support\Facades\Queue;

describe('podcast processing', function () {
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

        // Execute job synchronously
        (new ProcessPodcast($podcast))->handle();

        expect($podcast->fresh())
            ->status->toBe('processed')
            ->duration->not->toBeNull()
            ->transcription->not->toBeNull();
    });

    it('handles processing failure gracefully', function () {
        $podcast = Podcast::factory()->create();

        // Simulate failure
        $job = new ProcessPodcast($podcast);
        $job->failed(new Exception('Processing failed'));

        expect($podcast->fresh())
            ->status->toBe('failed')
            ->error_message->toBe('Processing failed');
    });
});
```

## Interview Key Points

1. **What is Pest and how does it differ from PHPUnit?**
   - Pest is a testing framework built on PHPUnit with a more expressive, functional syntax. It uses test() and it() functions instead of classes, has a fluent expectation API, and supports features like datasets and architecture testing natively.

2. **Explain Pest's expectation API.**
   - Pest's expect() function returns an Expectation object with chainable methods like toBe(), toEqual(), toContain(), etc. It supports higher-order expectations, custom expectations via extend(), and the not modifier for negation.

3. **How do datasets work in Pest?**
   - Datasets (data providers) allow running the same test with different inputs. Define inline with ->with([]) or named datasets in Pest.php. They support arrays, generators, and named entries for clear test output.

4. **What is architecture testing in Pest?**
   - Architecture testing uses arch() to enforce coding standards programmatically. Test that classes follow naming conventions, dependencies flow correctly, no debugging statements exist, and layers respect boundaries.

5. **How do you organize tests in Pest?**
   - Use describe() blocks for grouping related tests, beforeEach/afterEach for setup/teardown, separate Unit/Feature/Architecture directories, and Pest.php for shared configuration, custom expectations, and global helpers.

6. **How does Pest integrate with Laravel?**
   - The pest-plugin-laravel package provides Laravel-specific features: RefreshDatabase trait, actingAs() for authentication, assertDatabaseHas(), HTTP testing helpers, and automatic TestCase binding.

7. **What are higher-order tests?**
   - Higher-order tests automatically proxy method calls to the test subject. Use ->expect(fn() => $subject) to create fluid assertions that read naturally and access nested properties/methods.

## Further Reading

- [Pest Official Documentation](https://pestphp.com/docs/)
- [Pest GitHub Repository](https://github.com/pestphp/pest)
- [Pest Laravel Plugin](https://pestphp.com/docs/plugins/laravel)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Testing Laravel Applications](https://laravel.com/docs/testing)
- [Pest Architecture Testing](https://pestphp.com/docs/arch-testing)
- [TDD with Pest Course](https://laracasts.com/series/pest-from-scratch)
