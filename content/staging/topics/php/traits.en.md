---
title: PHP Traits 复用
description: 掌握 PHP Traits 实现代码复用，解决单继承限制
track: php
section: oop
difficulty: intermediate
tags:
  - PHP
  - Traits
  - OOP
  - 代码复用
status: imported
origin: old/src/content/docs/php/traits.en.md
divergence: 0.192
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 面向对象
  order: 12
  lastUpdated: 2026-01-07
---

## What are Traits

Traits are a code reuse mechanism introduced in PHP 5.4, designed to solve the limitation of PHP's single inheritance. A Trait is similar to a class but cannot be instantiated. It allows developers to reuse sets of methods across different class hierarchies, enabling horizontal code composition.

### Why Do We Need Traits

In the traditional single inheritance model, when two unrelated classes need to share the same functionality, there are typically several options:

1. **Copy the code** - Violates the DRY (Don't Repeat Yourself) principle
2. **Create a common parent class** - May lead to unnatural inheritance hierarchies
3. **Use interfaces** - Can only define method signatures, cannot provide implementations

Traits provide a fourth option: horizontally composing functional code while keeping the class hierarchy unchanged.

### Comparison of Traits with Interfaces and Abstract Classes

| Feature | Trait | Interface | Abstract Class |
|---------|-------|-----------|----------------|
| Can contain method implementations | Yes | Yes (default implementations after PHP 8.0) | Yes |
| Can contain properties | Yes | No (only constants) | Yes |
| Can be used multiple times | Yes | Yes | No |
| Defines a contract | No | Yes | Yes |
| Can be instantiated | No | No | No |
| Supports type checking | No | Yes | Yes |

## Trait Basic Syntax

### Defining a Trait

Use the `trait` keyword to define a Trait:

```php
<?php

trait Loggable
{
    protected array $logs = [];

    public function log(string $message): void
    {
        $this->logs[] = [
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => $message
        ];
    }

    public function getLogs(): array
    {
        return $this->logs;
    }

    public function clearLogs(): void
    {
        $this->logs = [];
    }
}
```

### Using a Trait in a Class

Use the `use` keyword to include a Trait in a class:

```php
<?php

class User
{
    use Loggable;

    private string $name;

    public function __construct(string $name)
    {
        $this->name = $name;
        $this->log("User {$name} has been created");
    }

    public function updateName(string $newName): void
    {
        $oldName = $this->name;
        $this->name = $newName;
        $this->log("Username updated from {$oldName} to {$newName}");
    }
}

$user = new User('John');
$user->updateName('Jane');

print_r($user->getLogs());
// Output:
// Array
// (
//     [0] => Array ( [timestamp] => 2026-01-07 10:30:00, [message] => User John has been created )
//     [1] => Array ( [timestamp] => 2026-01-07 10:30:01, [message] => Username updated from John to Jane )
// )
```

### Trait Method Priority Rules

Trait method priority follows these rules (from highest to lowest):

1. **Methods defined in the current class** - Highest priority
2. **Methods from Traits** - Medium priority
3. **Inherited parent class methods** - Lowest priority

```php
<?php

trait Greeting
{
    public function hello(): string
    {
        return "Trait: Hello!";
    }
}

class ParentClass
{
    public function hello(): string
    {
        return "Parent: Hello!";
    }
}

class ChildClass extends ParentClass
{
    use Greeting;
    // Without override, will use the Trait's hello() method
}

class OverrideClass extends ParentClass
{
    use Greeting;

    public function hello(): string
    {
        return "Override: Hello!";
    }
}

$child = new ChildClass();
echo $child->hello();     // Output: Trait: Hello!

$override = new OverrideClass();
echo $override->hello();  // Output: Override: Hello!
```

## Using Multiple Traits

A class can use multiple Traits, enabling flexible combination of functionality:

```php
<?php

trait Timestampable
{
    protected ?DateTime $createdAt = null;
    protected ?DateTime $updatedAt = null;

    public function setCreatedAt(): void
    {
        $this->createdAt = new DateTime();
    }

    public function setUpdatedAt(): void
    {
        $this->updatedAt = new DateTime();
    }

    public function getCreatedAt(): ?DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?DateTime
    {
        return $this->updatedAt;
    }
}

trait Sluggable
{
    protected string $slug = '';

    public function generateSlug(string $text): string
    {
        // Simplified slug generation logic
        $slug = strtolower(trim($text));
        $slug = preg_replace('/[^a-z0-9\p{Han}]+/u', '-', $slug);
        $this->slug = trim($slug, '-');
        return $this->slug;
    }

    public function getSlug(): string
    {
        return $this->slug;
    }
}

trait SoftDeletable
{
    protected ?DateTime $deletedAt = null;

    public function softDelete(): void
    {
        $this->deletedAt = new DateTime();
    }

    public function restore(): void
    {
        $this->deletedAt = null;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function getDeletedAt(): ?DateTime
    {
        return $this->deletedAt;
    }
}

class Article
{
    use Loggable, Timestampable, Sluggable, SoftDeletable;

    private string $title;
    private string $content;

    public function __construct(string $title, string $content)
    {
        $this->title = $title;
        $this->content = $content;
        $this->setCreatedAt();
        $this->generateSlug($title);
        $this->log("Article '{$title}' has been created");
    }

    public function update(string $title, string $content): void
    {
        $this->title = $title;
        $this->content = $content;
        $this->setUpdatedAt();
        $this->generateSlug($title);
        $this->log("Article has been updated");
    }
}

$article = new Article('PHP Traits Tutorial', 'This is an article about Traits...');
echo $article->getSlug(); // Output: php-traits-tutorial
```

## Conflict Resolution

When multiple Traits contain methods with the same name, the conflict must be explicitly resolved, otherwise a fatal error will occur.

### Using insteadof to Select Methods

The `insteadof` keyword is used to specify which Trait's method to use when a conflict occurs:

```php
<?php

trait Logger
{
    public function log(string $message): void
    {
        echo "[Logger] {$message}\n";
    }

    public function debug(string $message): void
    {
        echo "[DEBUG] {$message}\n";
    }
}

trait FileLogger
{
    public function log(string $message): void
    {
        file_put_contents('app.log', $message . PHP_EOL, FILE_APPEND);
    }

    public function debug(string $message): void
    {
        file_put_contents('debug.log', $message . PHP_EOL, FILE_APPEND);
    }
}

class Application
{
    use Logger, FileLogger {
        // Use FileLogger's log method instead of Logger's
        FileLogger::log insteadof Logger;
        // Use Logger's debug method instead of FileLogger's
        Logger::debug insteadof FileLogger;
    }
}

$app = new Application();
$app->log('Application started');     // Writes to file
$app->debug('Debug information');     // Outputs to console
```

### Using as to Create Aliases

The `as` keyword can create an alias for an excluded method, making it still accessible:

```php
<?php

class AdvancedApplication
{
    use Logger, FileLogger {
        FileLogger::log insteadof Logger;
        Logger::log as consoleLog;        // Create alias for Logger::log
        FileLogger::debug insteadof Logger;
        Logger::debug as consoleDebug;    // Create alias for Logger::debug
    }
}

$app = new AdvancedApplication();
$app->log('Write to file');           // Uses FileLogger::log
$app->consoleLog('Output to console'); // Uses Logger::log (via alias)
```

### Changing Method Visibility

Using `as` can also change method visibility:

```php
<?php

trait SecretOperations
{
    public function secretMethod(): string
    {
        return 'This is a secret operation';
    }

    public function anotherMethod(): void
    {
        echo "Another method\n";
    }
}

class SecureClass
{
    use SecretOperations {
        secretMethod as private;  // Change public method to private
        anotherMethod as protected hiddenMethod;  // Rename and change visibility
    }

    public function doSomething(): string
    {
        // Can still access the private method internally
        return $this->secretMethod();
    }
}

$secure = new SecureClass();
echo $secure->doSomething();  // Works normally
// $secure->secretMethod();   // Error: Cannot access private method
```

### Complex Conflict Resolution Example

```php
<?php

trait A
{
    public function process(): string
    {
        return "A::process";
    }

    public function validate(): bool
    {
        return true;
    }
}

trait B
{
    public function process(): string
    {
        return "B::process";
    }

    public function validate(): bool
    {
        return false;
    }
}

trait C
{
    public function process(): string
    {
        return "C::process";
    }
}

class ComplexClass
{
    use A, B, C {
        // For the process method, use A's version
        A::process insteadof B, C;
        // Keep B and C's versions as aliases
        B::process as processB;
        C::process as processC;
        // For the validate method, use B's version
        B::validate insteadof A;
    }

    public function runAll(): array
    {
        return [
            'default' => $this->process(),
            'fromB' => $this->processB(),
            'fromC' => $this->processC(),
        ];
    }
}

$obj = new ComplexClass();
print_r($obj->runAll());
// Output:
// Array ( [default] => A::process, [fromB] => B::process, [fromC] => C::process )
```

## Abstract Methods

Traits can define abstract methods, forcing classes that use the Trait to implement these methods. This establishes a contract relationship between the Trait and the using class.

### Basic Usage

```php
<?php

trait Notifiable
{
    abstract public function getNotificationChannels(): array;
    abstract public function routeNotification(string $channel): mixed;

    public function notify(string $message): void
    {
        foreach ($this->getNotificationChannels() as $channel) {
            $route = $this->routeNotification($channel);
            $this->sendNotification($channel, $route, $message);
        }
    }

    protected function sendNotification(string $channel, mixed $route, string $message): void
    {
        echo "Sending via {$channel} to {$route}: {$message}\n";
    }
}

class Customer
{
    use Notifiable;

    private string $email;
    private string $phone;

    public function __construct(string $email, string $phone)
    {
        $this->email = $email;
        $this->phone = $phone;
    }

    // Must implement abstract method
    public function getNotificationChannels(): array
    {
        return ['email', 'sms'];
    }

    // Must implement abstract method
    public function routeNotification(string $channel): mixed
    {
        return match($channel) {
            'email' => $this->email,
            'sms' => $this->phone,
            default => null
        };
    }
}

$customer = new Customer('user@example.com', '1234567890');
$customer->notify('Your order has been shipped');
// Output:
// Sending via email to user@example.com: Your order has been shipped
// Sending via sms to 1234567890: Your order has been shipped
```

### Abstract Methods with Type Constraints

```php
<?php

trait Cacheable
{
    abstract public function getCacheKey(): string;
    abstract public function getCacheDuration(): int;
    abstract public function toArray(): array;

    protected static array $cache = [];

    public function cache(): void
    {
        $key = $this->getCacheKey();
        self::$cache[$key] = [
            'data' => $this->toArray(),
            'expires' => time() + $this->getCacheDuration()
        ];
    }

    public function invalidateCache(): void
    {
        unset(self::$cache[$this->getCacheKey()]);
    }

    public static function fromCache(string $key): ?array
    {
        if (isset(self::$cache[$key])) {
            if (self::$cache[$key]['expires'] > time()) {
                return self::$cache[$key]['data'];
            }
            unset(self::$cache[$key]);
        }
        return null;
    }
}

class Product
{
    use Cacheable;

    public function __construct(
        private int $id,
        private string $name,
        private float $price
    ) {}

    public function getCacheKey(): string
    {
        return "product_{$this->id}";
    }

    public function getCacheDuration(): int
    {
        return 3600; // 1 hour
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'price' => $this->price
        ];
    }
}

$product = new Product(1, 'PHP Programming Guide', 99.00);
$product->cache();

$cached = Product::fromCache('product_1');
print_r($cached);
```

## Static Methods and Properties

Traits can contain static methods and static properties, which is very useful in scenarios like implementing the singleton pattern.

### Static Methods

```php
<?php

trait Singleton
{
    private static ?self $instance = null;

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // Prevent cloning
    private function __clone(): void {}

    // Prevent creating new instance through unserialization
    public function __wakeup(): void
    {
        throw new Exception("Cannot unserialize singleton");
    }
}

class Database
{
    use Singleton;

    private function __construct()
    {
        echo "Database connection established\n";
    }

    public function query(string $sql): void
    {
        echo "Executing query: {$sql}\n";
    }
}

$db1 = Database::getInstance();
$db2 = Database::getInstance();
var_dump($db1 === $db2); // bool(true) - same instance
```

### Static Properties

Note that each class using the Trait has its own independent copy of static properties:

```php
<?php

trait Counter
{
    private static int $count = 0;

    public static function increment(): void
    {
        self::$count++;
    }

    public static function decrement(): void
    {
        self::$count--;
    }

    public static function getCount(): int
    {
        return self::$count;
    }

    public static function resetCount(): void
    {
        self::$count = 0;
    }
}

class PageView
{
    use Counter;
}

class ApiRequest
{
    use Counter;
}

// Each class using the Trait has its own independent static property
PageView::increment();
PageView::increment();
ApiRequest::increment();

echo PageView::getCount();   // Output: 2
echo ApiRequest::getCount(); // Output: 1
```

### Static Factory Methods

```php
<?php

trait HasFactory
{
    public static function create(array $attributes = []): self
    {
        $instance = new self();

        foreach ($attributes as $key => $value) {
            if (property_exists($instance, $key)) {
                $instance->$key = $value;
            }
        }

        return $instance;
    }

    public static function createMany(array $items): array
    {
        return array_map(fn($attrs) => self::create($attrs), $items);
    }
}

class User
{
    use HasFactory;

    public string $name = '';
    public string $email = '';
    public int $age = 0;

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'age' => $this->age
        ];
    }
}

$user = User::create([
    'name' => 'John',
    'email' => 'john@example.com',
    'age' => 25
]);

print_r($user->toArray());

$users = User::createMany([
    ['name' => 'Jane', 'email' => 'jane@example.com', 'age' => 30],
    ['name' => 'Bob', 'email' => 'bob@example.com', 'age' => 28]
]);
```

## Properties

Traits can define properties, but you need to be aware of property conflict issues.

### Defining and Using Properties

```php
<?php

trait HasUuid
{
    protected string $uuid;

    public function initializeUuid(): void
    {
        $this->uuid = $this->generateUuid();
    }

    public function getUuid(): string
    {
        return $this->uuid;
    }

    protected function generateUuid(): string
    {
        // Simplified UUID v4 generation
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}

trait HasStatus
{
    protected string $status = 'pending';
    protected array $allowedStatuses = ['pending', 'active', 'inactive', 'deleted'];

    public function setStatus(string $status): void
    {
        if (!in_array($status, $this->allowedStatuses)) {
            throw new InvalidArgumentException("Invalid status: {$status}");
        }
        $this->status = $status;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }
}

class Order
{
    use HasUuid, HasStatus;

    private float $total;

    public function __construct(float $total)
    {
        $this->total = $total;
        $this->initializeUuid();
    }
}

$order = new Order(199.99);
echo $order->getUuid();    // Output: something like a1b2c3d4-e5f6-4789-a012-b34567890abc
echo $order->getStatus();  // Output: pending
$order->setStatus('active');
echo $order->isActive();   // Output: true
```

### Property Conflict Handling

When a Trait and a class define properties with the same name, they must have the same initial value and visibility, otherwise a fatal error will occur:

```php
<?php

trait DefaultSettings
{
    protected int $timeout = 30;
    protected bool $debug = false;
}

class ApiClient
{
    use DefaultSettings;

    // Correct: Same definition is allowed
    // protected int $timeout = 30;

    // Error: Different initial value will cause fatal error
    // protected int $timeout = 60;  // Fatal error

    public function getTimeout(): int
    {
        return $this->timeout;
    }
}
```

### Strategies to Avoid Property Conflicts

```php
<?php

trait Trackable
{
    // Use prefix to avoid conflicts
    protected array $_trackable_data = [];
    protected ?DateTime $_trackable_lastAccess = null;

    public function track(string $event): void
    {
        $this->_trackable_data[] = [
            'event' => $event,
            'time' => new DateTime()
        ];
        $this->_trackable_lastAccess = new DateTime();
    }

    public function getTrackingData(): array
    {
        return $this->_trackable_data;
    }
}
```

## Trait Composition and Nesting

Traits can use other Traits, forming composite structures, which makes code reuse more flexible.

### Traits Using Other Traits

```php
<?php

trait Identifiable
{
    protected int $id;

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }
}

trait Nameable
{
    protected string $name;

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }
}

// Trait composing other Traits
trait Entity
{
    use Identifiable, Nameable, Timestampable;

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'created_at' => $this->createdAt?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt?->format('Y-m-d H:i:s'),
        ];
    }
}

class Product
{
    use Entity;

    private float $price;

    public function __construct(int $id, string $name, float $price)
    {
        $this->setId($id);
        $this->setName($name);
        $this->price = $price;
        $this->setCreatedAt();
    }

    public function getPrice(): float
    {
        return $this->price;
    }
}

$product = new Product(1, 'PHP Programming Guide', 99.00);
print_r($product->toArray());
```

### Resolving Conflicts in Composed Traits

```php
<?php

trait A
{
    public function method(): string
    {
        return 'A';
    }
}

trait B
{
    public function method(): string
    {
        return 'B';
    }
}

// Resolving conflicts in a composed Trait
trait Combined
{
    use A, B {
        A::method insteadof B;
        B::method as methodFromB;
    }

    public function combined(): string
    {
        return $this->method() . ' + ' . $this->methodFromB();
    }
}

class MyClass
{
    use Combined;
}

$obj = new MyClass();
echo $obj->combined(); // Output: A + B
```

## Practical Use Cases

### Scenario 1: Building Common Model Functionality

```php
<?php

trait HasAttributes
{
    protected array $attributes = [];
    protected array $original = [];
    protected array $changes = [];

    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->setAttribute($key, $value);
        }
        return $this;
    }

    public function setAttribute(string $key, mixed $value): void
    {
        if (!isset($this->original[$key])) {
            $this->original[$key] = $this->attributes[$key] ?? null;
        }

        if (($this->original[$key] ?? null) !== $value) {
            $this->changes[$key] = $value;
        }

        $this->attributes[$key] = $value;
    }

    public function getAttribute(string $key): mixed
    {
        return $this->attributes[$key] ?? null;
    }

    public function isDirty(?string $key = null): bool
    {
        if ($key === null) {
            return !empty($this->changes);
        }
        return array_key_exists($key, $this->changes);
    }

    public function getChanges(): array
    {
        return $this->changes;
    }

    public function syncOriginal(): void
    {
        $this->original = $this->attributes;
        $this->changes = [];
    }
}

trait HasEvents
{
    protected static array $eventListeners = [];

    public static function on(string $event, callable $callback): void
    {
        self::$eventListeners[$event][] = $callback;
    }

    protected function fireEvent(string $event, array $data = []): void
    {
        if (isset(self::$eventListeners[$event])) {
            foreach (self::$eventListeners[$event] as $callback) {
                $callback($this, $data);
            }
        }
    }
}

trait HasValidation
{
    protected array $errors = [];

    abstract protected function validationRules(): array;

    public function validate(): bool
    {
        $this->errors = [];
        $rules = $this->validationRules();

        foreach ($rules as $field => $fieldRules) {
            $value = $this->getAttribute($field);

            foreach ($fieldRules as $rule) {
                $result = $this->validateRule($field, $value, $rule);
                if ($result !== true) {
                    $this->errors[$field][] = $result;
                }
            }
        }

        return empty($this->errors);
    }

    protected function validateRule(string $field, mixed $value, string $rule): bool|string
    {
        return match($rule) {
            'required' => !empty($value) ?: "{$field} is required",
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL) !== false ?: "{$field} must be a valid email",
            'numeric' => is_numeric($value) ?: "{$field} must be numeric",
            default => true
        };
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}

class UserModel
{
    use HasAttributes, HasEvents, HasValidation;

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
        $this->syncOriginal();
    }

    protected function validationRules(): array
    {
        return [
            'name' => ['required'],
            'email' => ['required', 'email'],
            'age' => ['numeric']
        ];
    }

    public function save(): bool
    {
        if (!$this->validate()) {
            return false;
        }

        $this->fireEvent('saving', ['changes' => $this->getChanges()]);

        // Simulate save logic
        echo "Saving user data...\n";

        $this->syncOriginal();
        $this->fireEvent('saved');

        return true;
    }
}

// Usage example
UserModel::on('saving', function($model, $data) {
    echo "Saving, changes: " . json_encode($data['changes']) . "\n";
});

UserModel::on('saved', function($model) {
    echo "Save successful!\n";
});

$user = new UserModel([
    'name' => 'Bob',
    'email' => 'bob@example.com',
    'age' => 28
]);

$user->setAttribute('name', 'Bobby');

if ($user->save()) {
    echo "User created successfully\n";
} else {
    print_r($user->getErrors());
}
```

### Scenario 2: API Response Formatting

```php
<?php

trait JsonSerializable
{
    abstract protected function toSerializableArray(): array;

    public function toJson(int $options = 0): string
    {
        return json_encode($this->toSerializableArray(), $options | JSON_UNESCAPED_UNICODE);
    }

    public function jsonSerialize(): array
    {
        return $this->toSerializableArray();
    }
}

trait ApiResponse
{
    use JsonSerializable;

    protected int $statusCode = 200;
    protected string $message = 'Success';
    protected mixed $data = null;
    protected array $meta = [];

    public function setStatusCode(int $code): self
    {
        $this->statusCode = $code;
        return $this;
    }

    public function setMessage(string $message): self
    {
        $this->message = $message;
        return $this;
    }

    public function setData(mixed $data): self
    {
        $this->data = $data;
        return $this;
    }

    public function setMeta(array $meta): self
    {
        $this->meta = $meta;
        return $this;
    }

    protected function toSerializableArray(): array
    {
        $response = [
            'status' => $this->statusCode,
            'message' => $this->message,
        ];

        if ($this->data !== null) {
            $response['data'] = $this->data;
        }

        if (!empty($this->meta)) {
            $response['meta'] = $this->meta;
        }

        return $response;
    }

    public function success(mixed $data = null, string $message = 'Success'): self
    {
        return $this->setStatusCode(200)
                    ->setMessage($message)
                    ->setData($data);
    }

    public function error(string $message, int $code = 400): self
    {
        return $this->setStatusCode($code)
                    ->setMessage($message);
    }

    public function paginated(array $items, int $total, int $page, int $perPage): self
    {
        return $this->setData($items)
                    ->setMeta([
                        'pagination' => [
                            'total' => $total,
                            'per_page' => $perPage,
                            'current_page' => $page,
                            'last_page' => (int) ceil($total / $perPage),
                        ]
                    ]);
    }
}

class ApiController
{
    use ApiResponse;

    public function index(): string
    {
        $users = [
            ['id' => 1, 'name' => 'John'],
            ['id' => 2, 'name' => 'Jane'],
        ];

        return $this->paginated($users, 100, 1, 10)->toJson(JSON_PRETTY_PRINT);
    }

    public function show(int $id): string
    {
        if ($id <= 0) {
            return $this->error('Invalid user ID', 400)->toJson();
        }

        $user = ['id' => $id, 'name' => 'Test User'];
        return $this->success($user, 'Retrieved successfully')->toJson();
    }
}

$controller = new ApiController();
echo $controller->index();
echo "\n";
echo $controller->show(1);
```

### Scenario 3: Event Emitter

```php
<?php

trait EventEmitter
{
    protected array $listeners = [];

    public function on(string $event, callable $callback): self
    {
        if (!isset($this->listeners[$event])) {
            $this->listeners[$event] = [];
        }
        $this->listeners[$event][] = $callback;
        return $this;
    }

    public function off(string $event, ?callable $callback = null): self
    {
        if (!isset($this->listeners[$event])) {
            return $this;
        }

        if ($callback === null) {
            unset($this->listeners[$event]);
        } else {
            $this->listeners[$event] = array_filter(
                $this->listeners[$event],
                fn($cb) => $cb !== $callback
            );
        }

        return $this;
    }

    public function emit(string $event, mixed ...$args): self
    {
        if (!isset($this->listeners[$event])) {
            return $this;
        }

        foreach ($this->listeners[$event] as $callback) {
            $result = call_user_func_array($callback, $args);
            // If callback returns false, stop event propagation
            if ($result === false) {
                break;
            }
        }

        return $this;
    }

    public function once(string $event, callable $callback): self
    {
        $wrapper = function(...$args) use ($event, $callback, &$wrapper) {
            $this->off($event, $wrapper);
            return call_user_func_array($callback, $args);
        };

        return $this->on($event, $wrapper);
    }
}

class ShoppingCart
{
    use EventEmitter;

    private array $items = [];
    private float $total = 0;

    public function addItem(string $name, float $price, int $quantity = 1): self
    {
        $item = [
            'name' => $name,
            'price' => $price,
            'quantity' => $quantity,
            'subtotal' => $price * $quantity
        ];

        $this->items[] = $item;
        $this->total += $item['subtotal'];

        $this->emit('itemAdded', $item, $this);

        return $this;
    }

    public function checkout(): self
    {
        $this->emit('beforeCheckout', $this);

        // Checkout logic...

        $this->emit('afterCheckout', $this);
        $this->items = [];
        $this->total = 0;

        return $this;
    }

    public function getTotal(): float
    {
        return $this->total;
    }
}

// Usage example
$cart = new ShoppingCart();

$cart->on('itemAdded', function($item, $cart) {
    echo "Added item: {$item['name']} x {$item['quantity']} = {$item['subtotal']}\n";
});

$cart->on('beforeCheckout', function($cart) {
    echo "Preparing checkout, total: {$cart->getTotal()}\n";
});

$cart->addItem('PHP Programming Guide', 99.00, 2)
     ->addItem('MySQL Database', 79.00, 1)
     ->checkout();
```

## Combining Traits with Interfaces

Traits and interfaces work perfectly together - interfaces define the contract, and Traits provide the default implementation:

```php
<?php

interface Serializable
{
    public function serialize(): string;
    public function unserialize(string $data): void;
}

trait SerializableTrait
{
    public function serialize(): string
    {
        return serialize($this->toArray());
    }

    public function unserialize(string $data): void
    {
        $array = unserialize($data);
        $this->fromArray($array);
    }

    abstract public function toArray(): array;
    abstract public function fromArray(array $data): void;
}

interface Comparable
{
    public function compareTo(mixed $other): int;
}

trait ComparableTrait
{
    abstract public function getValue(): mixed;

    public function compareTo(mixed $other): int
    {
        if (!$other instanceof static) {
            throw new InvalidArgumentException('Cannot compare different types');
        }

        $thisValue = $this->getValue();
        $otherValue = $other->getValue();

        return $thisValue <=> $otherValue;
    }

    public function equals(mixed $other): bool
    {
        return $this->compareTo($other) === 0;
    }

    public function lessThan(mixed $other): bool
    {
        return $this->compareTo($other) < 0;
    }

    public function greaterThan(mixed $other): bool
    {
        return $this->compareTo($other) > 0;
    }
}

class Money implements Serializable, Comparable
{
    use SerializableTrait, ComparableTrait;

    public function __construct(
        private float $amount,
        private string $currency = 'USD'
    ) {}

    public function getValue(): float
    {
        return $this->amount;
    }

    public function toArray(): array
    {
        return [
            'amount' => $this->amount,
            'currency' => $this->currency
        ];
    }

    public function fromArray(array $data): void
    {
        $this->amount = $data['amount'];
        $this->currency = $data['currency'];
    }
}

$money1 = new Money(100.00);
$money2 = new Money(150.00);

echo $money1->lessThan($money2) ? '100 < 150' : '100 >= 150';  // Output: 100 < 150
echo "\n";
echo $money1->serialize();  // Output: serialized string
```

## Common Pitfalls and Considerations

### Property Duplicate Definition

```php
<?php

trait TraitA
{
    public int $value = 10;
}

trait TraitB
{
    public int $value = 20;  // Conflicts with TraitA
}

// Error: Fatal error
// class MyClass
// {
//     use TraitA, TraitB;
// }

// Solution: Define property directly in the class
class FixedClass
{
    use TraitA, TraitB;
    public int $value = 30;  // Class definition overrides Trait's
}
```

### Incorrect Assumptions About $this

```php
<?php

trait Dangerous
{
    public function doSomething(): string
    {
        // Wrong assumption: Assumes the class definitely has a name property
        return $this->name;  // May cause error
    }
}

// Safer approach: Use abstract methods
trait Safer
{
    abstract public function getName(): string;

    public function doSomething(): string
    {
        return $this->getName();  // Safe, because implementation is enforced
    }
}
```

### Constructor Conflicts

```php
<?php

trait HasConstructor
{
    public function __construct()
    {
        echo "Trait constructor\n";
    }
}

// The class constructor will override the Trait's constructor
class MyClass
{
    use HasConstructor;

    public function __construct()
    {
        echo "Class constructor\n";
    }
}

// Recommended: Use initialization methods instead of constructors
trait BetterApproach
{
    protected bool $initialized = false;

    protected function initializeTrait(): void
    {
        if ($this->initialized) {
            return;
        }
        echo "Trait initialization\n";
        $this->initialized = true;
    }
}

class BetterClass
{
    use BetterApproach;

    public function __construct()
    {
        $this->initializeTrait();  // Explicit call
        echo "Class constructor\n";
    }
}
```

## Best Practices

### Keep Traits Single Responsibility

```php
<?php

// Good practice: Each Trait focuses on one functionality
trait HasTimestamps
{
    // Only handles timestamp-related logic
}

trait HasSoftDeletes
{
    // Only handles soft delete-related logic
}

// Avoid: A Trait containing too many unrelated features
trait KitchenSink
{
    // Contains logging, caching, validation, serialization and various other features
    // Too many responsibilities, hard to maintain
}
```

### Use Meaningful Names

```php
<?php

// Recommended: Use adjectives or capability descriptions for naming
trait Loggable {}
trait Cacheable {}
trait Timestampable {}
trait SoftDeletable {}

// Or use Trait suffix
trait LoggerTrait {}
trait CacheTrait {}

// Avoid: Using nouns for naming (easily confused with classes)
// trait Logger {}  // Not recommended
// trait Cache {}   // Not recommended
```

### Use Abstract Methods to Establish Contracts

```php
<?php

trait Publishable
{
    protected ?DateTime $publishedAt = null;

    // Use abstract methods to define dependencies
    abstract public function getTitle(): string;
    abstract public function getContent(): string;

    public function publish(): string
    {
        $this->publishedAt = new DateTime();
        return "Published: " . $this->getTitle();
    }

    public function isPublished(): bool
    {
        return $this->publishedAt !== null;
    }
}
```

### Document Traits

```php
<?php

/**
 * Trait providing soft delete functionality
 *
 * Classes using this Trait should ensure the database table has a deleted_at column
 *
 * @property DateTime|null $deletedAt Deletion timestamp
 */
trait SoftDeletable
{
    /**
     * @var DateTime|null Soft delete timestamp
     */
    protected ?DateTime $deletedAt = null;

    /**
     * Soft delete the current record
     *
     * @return self
     */
    public function softDelete(): self
    {
        $this->deletedAt = new DateTime();
        return $this;
    }

    /**
     * Restore a soft deleted record
     *
     * @return self
     */
    public function restore(): self
    {
        $this->deletedAt = null;
        return $this;
    }
}
```

### Prefer Composition Over Complex Inheritance

```php
<?php

// Good practice: Use Trait composition
trait Identifiable { }
trait Timestampable { }
trait SoftDeletable { }

class Post
{
    use Identifiable, Timestampable, SoftDeletable;
}

// Bad practice: Deep inheritance hierarchy
class Entity { }
class TimestampedEntity extends Entity { }
class SoftDeletableEntity extends TimestampedEntity { }
class Post extends SoftDeletableEntity { }
```

## Summary

PHP Traits are a powerful code reuse mechanism that compensates for the limitations of single inheritance, allowing developers to share code across different class hierarchies. In this article, we covered:

1. **Trait Basics** - How to define and use Traits, and priority rules
2. **Multiple Trait Usage** - Combining multiple Traits in a single class
3. **Conflict Resolution** - Using `insteadof` and `as` to handle method conflicts
4. **Abstract Methods** - Defining contracts in Traits, forcing implementation of specific methods
5. **Static Members** - Static methods and properties in Traits
6. **Property Handling** - Trait property definition and conflict handling
7. **Composition and Nesting** - Using Traits within other Traits
8. **Practical Applications** - Building reusable model functionality, API responses, and event systems
9. **Best Practices** - Single responsibility, naming conventions, documentation, etc.

Using Traits appropriately can make code more modular and maintainable, but be careful not to overuse them. When functionality truly needs to be shared across multiple unrelated classes, Traits are an ideal choice.
