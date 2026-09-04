---
title: PHP 魔术方法
description: 深入学习 PHP 魔术方法，包括构造析构、属性访问、方法重载和序列化
track: php
section: oop
difficulty: intermediate
tags:
  - PHP
  - 魔术方法
  - OOP
status: imported
origin: old/src/content/docs/php/magic-methods.en.md
divergence: 0.211
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 面向对象
  order: 13
  lastUpdated: 2026-01-07
---

Magic Methods are special methods in PHP object-oriented programming that begin with double underscores `__` and are automatically called by PHP under specific circumstances. Mastering magic methods can make your code more elegant and flexible, enabling many advanced features.

## Overview of Magic Methods

PHP provides various magic methods, each with its specific purpose:

| Magic Method | Trigger Condition |
|---------|---------|
| `__construct()` | When an object is created |
| `__destruct()` | When an object is destroyed |
| `__get()` | When reading an inaccessible property |
| `__set()` | When writing to an inaccessible property |
| `__isset()` | When isset() or empty() is called on an inaccessible property |
| `__unset()` | When unset() is called on an inaccessible property |
| `__call()` | When calling an inaccessible instance method |
| `__callStatic()` | When calling an inaccessible static method |
| `__toString()` | When an object is used as a string |
| `__invoke()` | When an object is called as a function |
| `__clone()` | When an object is cloned |
| `__sleep()` | Before an object is serialized |
| `__wakeup()` | After an object is unserialized |

## Constructor and Destructor Methods

### __construct() - Constructor Method

The constructor is automatically called when an object is created, used to initialize object properties and perform necessary setup operations.

```php
<?php

class Database
{
    private PDO $connection;
    private string $host;
    private string $database;

    public function __construct(
        string $host,
        string $database,
        string $username,
        string $password
    ) {
        $this->host = $host;
        $this->database = $database;

        $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

        try {
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            echo "Database connection successful: {$database}\n";
        } catch (PDOException $e) {
            throw new RuntimeException("Database connection failed: " . $e->getMessage());
        }
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }
}

// __construct is automatically called when creating an object
$db = new Database('localhost', 'myapp', 'root', 'password');
```

#### Constructor Inheritance

A child class can call the parent class constructor using `parent::__construct()`:

```php
<?php

class Animal
{
    protected string $name;
    protected int $age;

    public function __construct(string $name, int $age)
    {
        $this->name = $name;
        $this->age = $age;
    }
}

class Dog extends Animal
{
    private string $breed;

    public function __construct(string $name, int $age, string $breed)
    {
        // Call parent constructor
        parent::__construct($name, $age);
        $this->breed = $breed;
    }

    public function getInfo(): string
    {
        return "{$this->name} is a {$this->age}-year-old {$this->breed}";
    }
}

$dog = new Dog('Blackie', 3, 'Labrador');
echo $dog->getInfo(); // Output: Blackie is a 3-year-old Labrador
```

#### PHP 8 Constructor Property Promotion

PHP 8 introduced Constructor Property Promotion, which simplifies code:

```php
<?php

// Pre-PHP 8 syntax
class UserOld
{
    private string $name;
    private string $email;
    private int $age;

    public function __construct(string $name, string $email, int $age)
    {
        $this->name = $name;
        $this->email = $email;
        $this->age = $age;
    }
}

// PHP 8+ simplified syntax
class User
{
    public function __construct(
        private string $name,
        private string $email,
        private int $age = 0
    ) {
        // Properties are automatically declared and assigned
    }

    public function getName(): string
    {
        return $this->name;
    }
}

$user = new User('John', 'john@example.com', 25);
echo $user->getName(); // Output: John
```

### __destruct() - Destructor Method

The destructor is automatically called when an object is destroyed, typically used to clean up resources, close connections, or save data.

```php
<?php

class FileHandler
{
    private $handle;
    private string $filename;
    private array $buffer = [];

    public function __construct(string $filename)
    {
        $this->filename = $filename;
        $this->handle = fopen($filename, 'a');

        if ($this->handle === false) {
            throw new RuntimeException("Cannot open file: {$filename}");
        }

        echo "File opened: {$filename}\n";
    }

    public function write(string $content): void
    {
        $this->buffer[] = $content;
    }

    public function __destruct()
    {
        // Write buffer contents
        if (!empty($this->buffer)) {
            $content = implode("\n", $this->buffer) . "\n";
            fwrite($this->handle, $content);
            echo "Buffer data written\n";
        }

        // Close file handle
        if ($this->handle) {
            fclose($this->handle);
            echo "File closed: {$this->filename}\n";
        }
    }
}

// Usage example
function processLog(): void
{
    $logger = new FileHandler('/tmp/app.log');
    $logger->write('Log entry 1');
    $logger->write('Log entry 2');
    // When function ends, $logger is destroyed and __destruct is automatically called
}

processLog();
// Output:
// File opened: /tmp/app.log
// Buffer data written
// File closed: /tmp/app.log
```

#### Destructor Considerations

```php
<?php

class Resource
{
    private string $id;

    public function __construct(string $id)
    {
        $this->id = $id;
        echo "Resource created: {$id}\n";
    }

    public function __destruct()
    {
        echo "Resource released: {$this->id}\n";
    }
}

// 1. Normal destruction order
$a = new Resource('A');
$b = new Resource('B');
// At script end, destroyed in reverse order of creation: B, A

// 2. Explicit destruction using unset
$c = new Resource('C');
unset($c); // Immediately calls __destruct

// 3. Destruction by assigning null
$d = new Resource('D');
$d = null; // Immediately calls __destruct

// 4. Circular reference issue
class Node
{
    public ?Node $next = null;
    public string $name;

    public function __construct(string $name)
    {
        $this->name = $name;
    }

    public function __destruct()
    {
        echo "Node destroyed: {$this->name}\n";
    }
}

$node1 = new Node('Node1');
$node2 = new Node('Node2');
$node1->next = $node2;
$node2->next = $node1; // Circular reference

// PHP's garbage collector handles circular references
// But it's recommended to manually break references
$node1->next = null;
$node2->next = null;
```

## Property Access Magic Methods

### __get() and __set()

These two methods are used to implement property overloading, triggered when accessing non-existent or inaccessible properties.

```php
<?php

class DynamicObject
{
    private array $data = [];
    private array $readonly = ['id', 'created_at'];

    public function __get(string $name): mixed
    {
        if (array_key_exists($name, $this->data)) {
            echo "Getting property: {$name}\n";
            return $this->data[$name];
        }

        throw new OutOfBoundsException("Property does not exist: {$name}");
    }

    public function __set(string $name, mixed $value): void
    {
        if (in_array($name, $this->readonly) && isset($this->data[$name])) {
            throw new RuntimeException("Property {$name} is read-only");
        }

        echo "Setting property: {$name} = " . var_export($value, true) . "\n";
        $this->data[$name] = $value;
    }

    public function getData(): array
    {
        return $this->data;
    }
}

$obj = new DynamicObject();
$obj->name = 'John';      // Setting property: name = 'John'
$obj->age = 25;           // Setting property: age = 25
$obj->id = 1;             // Setting property: id = 1

echo $obj->name;          // Getting property: name, Output: John

// $obj->id = 2;          // Throws exception: Property id is read-only
```

#### Implementing Property Accessor Pattern

```php
<?php

class Model
{
    private array $attributes = [];
    private array $original = [];
    private array $changes = [];

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
        $this->original = $this->attributes;
    }

    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->setAttribute($key, $value);
        }
        return $this;
    }

    public function __get(string $key): mixed
    {
        return $this->getAttribute($key);
    }

    public function __set(string $key, mixed $value): void
    {
        $this->setAttribute($key, $value);
    }

    protected function getAttribute(string $key): mixed
    {
        // Check if accessor method exists
        $method = 'get' . $this->studly($key) . 'Attribute';

        if (method_exists($this, $method)) {
            return $this->$method();
        }

        return $this->attributes[$key] ?? null;
    }

    protected function setAttribute(string $key, mixed $value): void
    {
        // Check if mutator method exists
        $method = 'set' . $this->studly($key) . 'Attribute';

        if (method_exists($this, $method)) {
            $this->$method($value);
            return;
        }

        // Track changes
        if (!isset($this->original[$key]) || $this->original[$key] !== $value) {
            $this->changes[$key] = $value;
        }

        $this->attributes[$key] = $value;
    }

    private function studly(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $value)));
    }

    public function isDirty(): bool
    {
        return !empty($this->changes);
    }

    public function getChanges(): array
    {
        return $this->changes;
    }
}

class User extends Model
{
    // Accessor: get full name
    protected function getFullNameAttribute(): string
    {
        return $this->attributes['first_name'] . ' ' . $this->attributes['last_name'];
    }

    // Mutator: automatically hash password
    protected function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = password_hash($value, PASSWORD_DEFAULT);
    }

    // Accessor: format email
    protected function getEmailAttribute(): string
    {
        return strtolower($this->attributes['email'] ?? '');
    }
}

$user = new User([
    'first_name' => 'John',
    'last_name' => 'Doe',
    'email' => 'JohnDoe@Example.COM'
]);

$user->password = 'secret123';

echo $user->full_name;  // Output: John Doe
echo $user->email;      // Output: johndoe@example.com
```

### __isset() and __unset()

These two methods are triggered when calling `isset()`/`empty()` and `unset()` on inaccessible properties respectively.

```php
<?php

class Container
{
    private array $items = [];

    public function __set(string $name, mixed $value): void
    {
        $this->items[$name] = $value;
    }

    public function __get(string $name): mixed
    {
        return $this->items[$name] ?? null;
    }

    public function __isset(string $name): bool
    {
        echo "Checking if property exists: {$name}\n";
        return isset($this->items[$name]);
    }

    public function __unset(string $name): void
    {
        echo "Deleting property: {$name}\n";
        unset($this->items[$name]);
    }

    public function all(): array
    {
        return $this->items;
    }
}

$container = new Container();
$container->name = 'test';
$container->value = 100;

// Triggers __isset
if (isset($container->name)) {
    echo "name exists\n";
}

// empty() also triggers __isset
if (!empty($container->value)) {
    echo "value is not empty\n";
}

// Triggers __unset
unset($container->name);

print_r($container->all());
// Output: Array ( [value] => 100 )
```

#### Implementing Complete Property Management Class

```php
<?php

class Entity
{
    private array $data = [];
    private array $hidden = [];
    private array $guarded = [];

    public function __construct(array $data = [], array $hidden = [], array $guarded = [])
    {
        $this->hidden = $hidden;
        $this->guarded = $guarded;

        foreach ($data as $key => $value) {
            if (!in_array($key, $this->guarded)) {
                $this->data[$key] = $value;
            }
        }
    }

    public function __get(string $name): mixed
    {
        if (in_array($name, $this->hidden)) {
            throw new RuntimeException("Property {$name} is hidden");
        }

        return $this->data[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        if (in_array($name, $this->guarded)) {
            throw new RuntimeException("Property {$name} is protected and cannot be modified");
        }

        $this->data[$name] = $value;
    }

    public function __isset(string $name): bool
    {
        if (in_array($name, $this->hidden)) {
            return false;
        }

        return isset($this->data[$name]);
    }

    public function __unset(string $name): void
    {
        if (in_array($name, $this->guarded)) {
            throw new RuntimeException("Property {$name} is protected and cannot be deleted");
        }

        unset($this->data[$name]);
    }

    public function toArray(): array
    {
        return array_diff_key($this->data, array_flip($this->hidden));
    }
}

$user = new Entity(
    ['id' => 1, 'name' => 'John', 'password' => 'hashed', 'role' => 'admin'],
    ['password'],  // Hidden fields
    ['id', 'role'] // Protected fields
);

echo $user->name;           // Output: John
// echo $user->password;    // Throws exception: Property password is hidden
// $user->id = 2;           // Throws exception: Property id is protected

print_r($user->toArray());
// Output: Array ( [id] => 1 [name] => John [role] => admin )
```

## Method Overloading Magic Methods

### __call() - Instance Method Overloading

When calling a non-existent or inaccessible method on an object, `__call()` is automatically called.

```php
<?php

class QueryBuilder
{
    private string $table = '';
    private array $wheres = [];
    private array $orders = [];
    private ?int $limitValue = null;

    public function __call(string $method, array $arguments): self
    {
        // Handle whereXxx methods
        if (str_starts_with($method, 'where')) {
            $column = $this->camelToSnake(substr($method, 5));
            $this->wheres[] = [$column, '=', $arguments[0]];
            return $this;
        }

        // Handle orderByXxx methods
        if (str_starts_with($method, 'orderBy')) {
            $column = $this->camelToSnake(substr($method, 7));
            $direction = $arguments[0] ?? 'ASC';
            $this->orders[] = [$column, $direction];
            return $this;
        }

        throw new BadMethodCallException("Method does not exist: {$method}");
    }

    public function table(string $table): self
    {
        $this->table = $table;
        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limitValue = $limit;
        return $this;
    }

    public function toSql(): string
    {
        $sql = "SELECT * FROM {$this->table}";

        if (!empty($this->wheres)) {
            $conditions = array_map(function ($where) {
                return "{$where[0]} {$where[1]} ?";
            }, $this->wheres);
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        if (!empty($this->orders)) {
            $orders = array_map(function ($order) {
                return "{$order[0]} {$order[1]}";
            }, $this->orders);
            $sql .= ' ORDER BY ' . implode(', ', $orders);
        }

        if ($this->limitValue !== null) {
            $sql .= " LIMIT {$this->limitValue}";
        }

        return $sql;
    }

    private function camelToSnake(string $input): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }
}

$query = new QueryBuilder();
$sql = $query
    ->table('users')
    ->whereStatus('active')        // Automatically converts to where status = ?
    ->whereCreatedAt('2024-01-01') // Automatically converts to where created_at = ?
    ->orderByCreatedAt('DESC')     // Automatically converts to order by created_at DESC
    ->limit(10)
    ->toSql();

echo $sql;
// Output: SELECT * FROM users WHERE status = ? AND created_at = ? ORDER BY created_at DESC LIMIT 10
```

### __callStatic() - Static Method Overloading

When calling a non-existent or inaccessible static method on a class, `__callStatic()` is automatically called.

```php
<?php

class Facade
{
    protected static array $instances = [];

    public static function __callStatic(string $method, array $arguments): mixed
    {
        $instance = static::getInstance();

        if (!method_exists($instance, $method)) {
            throw new BadMethodCallException(
                sprintf('Method %s::%s does not exist', static::class, $method)
            );
        }

        return $instance->$method(...$arguments);
    }

    protected static function getInstance(): object
    {
        $class = static::class;

        if (!isset(static::$instances[$class])) {
            static::$instances[$class] = static::createInstance();
        }

        return static::$instances[$class];
    }

    protected static function createInstance(): object
    {
        throw new RuntimeException('Subclass must implement createInstance method');
    }
}

class Logger
{
    public function info(string $message): void
    {
        echo "[INFO] {$message}\n";
    }

    public function error(string $message): void
    {
        echo "[ERROR] {$message}\n";
    }

    public function debug(string $message): void
    {
        echo "[DEBUG] {$message}\n";
    }
}

class Log extends Facade
{
    protected static function createInstance(): object
    {
        return new Logger();
    }
}

// Using static method calls, actually executing Logger instance methods
Log::info('This is an info message');   // Output: [INFO] This is an info message
Log::error('An error occurred');        // Output: [ERROR] An error occurred
Log::debug('Debug information');        // Output: [DEBUG] Debug information
```

#### Implementing Chained Static Calls

```php
<?php

class DB
{
    private static ?self $instance = null;
    private string $table = '';
    private array $selects = ['*'];
    private array $wheres = [];

    public static function __callStatic(string $method, array $arguments): self
    {
        $instance = new self();
        return $instance->$method(...$arguments);
    }

    public function __call(string $method, array $arguments): self
    {
        if ($method === 'table') {
            $this->table = $arguments[0];
            return $this;
        }

        throw new BadMethodCallException("Method does not exist: {$method}");
    }

    public static function table(string $table): self
    {
        $instance = new self();
        $instance->table = $table;
        return $instance;
    }

    public function select(string ...$columns): self
    {
        $this->selects = $columns;
        return $this;
    }

    public function where(string $column, string $operator, mixed $value): self
    {
        $this->wheres[] = compact('column', 'operator', 'value');
        return $this;
    }

    public function get(): array
    {
        $sql = $this->toSql();
        echo "Executing SQL: {$sql}\n";
        // Here would execute the actual database query
        return [];
    }

    public function toSql(): string
    {
        $columns = implode(', ', $this->selects);
        $sql = "SELECT {$columns} FROM {$this->table}";

        if (!empty($this->wheres)) {
            $conditions = array_map(function ($w) {
                $value = is_string($w['value']) ? "'{$w['value']}'" : $w['value'];
                return "{$w['column']} {$w['operator']} {$value}";
            }, $this->wheres);
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        return $sql;
    }
}

// Usage example
$users = DB::table('users')
    ->select('id', 'name', 'email')
    ->where('status', '=', 'active')
    ->where('age', '>', 18)
    ->get();

// Output: Executing SQL: SELECT id, name, email FROM users WHERE status = 'active' AND age > 18
```

## Object Conversion Magic Methods

### __toString() - String Conversion

When an object is used as a string, the `__toString()` method is automatically called.

```php
<?php

class Money
{
    private float $amount;
    private string $currency;

    private const SYMBOLS = [
        'CNY' => '¥',
        'USD' => '$',
        'EUR' => '€',
        'GBP' => '£',
        'JPY' => '¥',
    ];

    public function __construct(float $amount, string $currency = 'CNY')
    {
        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public function __toString(): string
    {
        $symbol = self::SYMBOLS[$this->currency] ?? $this->currency;
        return $symbol . number_format($this->amount, 2);
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException('Currency types do not match');
        }

        return new self($this->amount + $other->amount, $this->currency);
    }

    public function getAmount(): float
    {
        return $this->amount;
    }
}

$price = new Money(99.99);
$tax = new Money(8.00);
$total = $price->add($tax);

echo "Price: {$price}\n";    // Output: Price: ¥99.99
echo "Tax: {$tax}\n";        // Output: Tax: ¥8.00
echo "Total: {$total}\n";    // Output: Total: ¥107.99

// Can be used directly in strings
echo "You need to pay {$total}";  // Output: You need to pay ¥107.99
```

#### Implementing Complex Object String Representation

```php
<?php

class HtmlElement
{
    private string $tag;
    private array $attributes = [];
    private array $children = [];
    private bool $selfClosing;

    private const SELF_CLOSING_TAGS = ['img', 'br', 'hr', 'input', 'meta', 'link'];

    public function __construct(string $tag, array $attributes = [])
    {
        $this->tag = strtolower($tag);
        $this->attributes = $attributes;
        $this->selfClosing = in_array($this->tag, self::SELF_CLOSING_TAGS);
    }

    public function setAttribute(string $name, string $value): self
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function addClass(string $class): self
    {
        $existing = $this->attributes['class'] ?? '';
        $classes = array_filter(explode(' ', $existing));
        $classes[] = $class;
        $this->attributes['class'] = implode(' ', array_unique($classes));
        return $this;
    }

    public function append(string|self $child): self
    {
        if ($this->selfClosing) {
            throw new RuntimeException("Self-closing tags cannot have children");
        }
        $this->children[] = $child;
        return $this;
    }

    public function __toString(): string
    {
        $attrs = $this->renderAttributes();

        if ($this->selfClosing) {
            return "<{$this->tag}{$attrs} />";
        }

        $content = implode('', array_map('strval', $this->children));
        return "<{$this->tag}{$attrs}>{$content}</{$this->tag}>";
    }

    private function renderAttributes(): string
    {
        if (empty($this->attributes)) {
            return '';
        }

        $parts = [];
        foreach ($this->attributes as $name => $value) {
            $parts[] = sprintf('%s="%s"', $name, htmlspecialchars($value));
        }

        return ' ' . implode(' ', $parts);
    }
}

// Build HTML structure
$div = new HtmlElement('div', ['class' => 'container']);
$div->addClass('main')
    ->append(
        (new HtmlElement('h1'))
            ->addClass('title')
            ->append('Welcome')
    )
    ->append(
        (new HtmlElement('p'))
            ->addClass('content')
            ->append('This is a PHP magic methods example.')
    )
    ->append(
        (new HtmlElement('img', ['src' => 'logo.png', 'alt' => 'Logo']))
    );

echo $div;
// Output:
// <div class="container main">
//   <h1 class="title">Welcome</h1>
//   <p class="content">This is a PHP magic methods example.</p>
//   <img src="logo.png" alt="Logo" />
// </div>
```

### __invoke() - Callable Objects

When an object is called as a function, the `__invoke()` method is automatically called. This allows objects to be used like functions.

```php
<?php

class Validator
{
    private string $pattern;
    private string $message;

    public function __construct(string $pattern, string $message)
    {
        $this->pattern = $pattern;
        $this->message = $message;
    }

    public function __invoke(string $value): bool|string
    {
        if (preg_match($this->pattern, $value)) {
            return true;
        }

        return $this->message;
    }
}

// Create validator instances
$emailValidator = new Validator(
    '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
    'Please enter a valid email address'
);

$phoneValidator = new Validator(
    '/^1[3-9]\d{9}$/',
    'Please enter a valid phone number'
);

// Call objects like functions
$result = $emailValidator('test@example.com');
echo $result === true ? 'Email is valid' : $result;  // Output: Email is valid

$result = $phoneValidator('12345');
echo "\n" . ($result === true ? 'Phone number is valid' : $result);  // Output: Please enter a valid phone number
```

#### Implementing Middleware Pattern

```php
<?php

class Middleware
{
    private Closure $handler;

    public function __construct(Closure $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(array $request, Closure $next): array
    {
        return ($this->handler)($request, $next);
    }
}

class Pipeline
{
    private array $middlewares = [];

    public function pipe(callable $middleware): self
    {
        $this->middlewares[] = $middleware;
        return $this;
    }

    public function process(array $request, Closure $destination): array
    {
        $pipeline = array_reduce(
            array_reverse($this->middlewares),
            function (Closure $next, callable $middleware) {
                return function (array $request) use ($middleware, $next) {
                    return $middleware($request, $next);
                };
            },
            $destination
        );

        return $pipeline($request);
    }
}

// Create middleware
$authMiddleware = new Middleware(function (array $request, Closure $next) {
    if (!isset($request['token'])) {
        return ['error' => 'Unauthorized access', 'code' => 401];
    }
    echo "Authentication check passed\n";
    return $next($request);
});

$loggingMiddleware = new Middleware(function (array $request, Closure $next) {
    echo "Request started: " . json_encode($request) . "\n";
    $response = $next($request);
    echo "Request ended: " . json_encode($response) . "\n";
    return $response;
});

$rateLimitMiddleware = new Middleware(function (array $request, Closure $next) {
    echo "Rate limit check\n";
    return $next($request);
});

// Build pipeline
$pipeline = new Pipeline();
$pipeline
    ->pipe($loggingMiddleware)
    ->pipe($authMiddleware)
    ->pipe($rateLimitMiddleware);

// Process request
$response = $pipeline->process(
    ['token' => 'abc123', 'action' => 'getData'],
    function (array $request) {
        return ['data' => 'Processing result', 'code' => 200];
    }
);

print_r($response);
```

#### Using __invoke to Implement Strategy Pattern

```php
<?php

interface PricingStrategy
{
    public function __invoke(float $price, int $quantity): float;
}

class RegularPricing implements PricingStrategy
{
    public function __invoke(float $price, int $quantity): float
    {
        return $price * $quantity;
    }
}

class BulkPricing implements PricingStrategy
{
    private int $threshold;
    private float $discount;

    public function __construct(int $threshold = 10, float $discount = 0.1)
    {
        $this->threshold = $threshold;
        $this->discount = $discount;
    }

    public function __invoke(float $price, int $quantity): float
    {
        $total = $price * $quantity;

        if ($quantity >= $this->threshold) {
            $total *= (1 - $this->discount);
        }

        return $total;
    }
}

class VIPPricing implements PricingStrategy
{
    private float $discount;

    public function __construct(float $discount = 0.2)
    {
        $this->discount = $discount;
    }

    public function __invoke(float $price, int $quantity): float
    {
        return $price * $quantity * (1 - $this->discount);
    }
}

class ShoppingCart
{
    private array $items = [];
    private PricingStrategy $strategy;

    public function __construct(PricingStrategy $strategy)
    {
        $this->strategy = $strategy;
    }

    public function addItem(string $name, float $price, int $quantity): void
    {
        $this->items[] = compact('name', 'price', 'quantity');
    }

    public function setStrategy(PricingStrategy $strategy): void
    {
        $this->strategy = $strategy;
    }

    public function getTotal(): float
    {
        $total = 0;
        foreach ($this->items as $item) {
            // Directly call the strategy object
            $total += ($this->strategy)($item['price'], $item['quantity']);
        }
        return $total;
    }
}

// Usage example
$cart = new ShoppingCart(new RegularPricing());
$cart->addItem('Product A', 100, 5);
$cart->addItem('Product B', 50, 3);

echo "Regular price: $" . $cart->getTotal() . "\n";  // Output: Regular price: $650

$cart->setStrategy(new BulkPricing(5, 0.15));
echo "Bulk price: $" . $cart->getTotal() . "\n";  // Output: Bulk price: $552.5

$cart->setStrategy(new VIPPricing(0.2));
echo "VIP price: $" . $cart->getTotal() . "\n";   // Output: VIP price: $520
```

## Object Cloning Magic Method

### __clone() - Cloning Objects

When using the `clone` keyword to clone an object, the `__clone()` method is automatically called. This allows you to customize cloning behavior, especially for handling deep copies.

```php
<?php

class Address
{
    public function __construct(
        public string $city,
        public string $street
    ) {}
}

class Person
{
    public function __construct(
        public string $name,
        public Address $address,
        public DateTime $createdAt
    ) {}

    public function __clone(): void
    {
        // Deep copy: clone nested objects
        $this->address = clone $this->address;
        $this->createdAt = clone $this->createdAt;
    }
}

// Create original object
$person1 = new Person(
    'John',
    new Address('New York', 'Broadway'),
    new DateTime()
);

// Difference between shallow copy (without __clone) and deep copy (with __clone)

// Using clone keyword
$person2 = clone $person1;
$person2->name = 'Jane';
$person2->address->city = 'Los Angeles';

echo "Person1: {$person1->name}, {$person1->address->city}\n";
// Output: Person1: John, New York (address unchanged because we did deep copy)

echo "Person2: {$person2->name}, {$person2->address->city}\n";
// Output: Person2: Jane, Los Angeles
```

#### Implementing Prototype Pattern

```php
<?php

abstract class Prototype
{
    protected string $id;

    public function __construct()
    {
        $this->id = uniqid('obj_');
    }

    public function getId(): string
    {
        return $this->id;
    }

    abstract public function __clone(): void;
}

class Document extends Prototype
{
    private string $title;
    private string $content;
    private array $metadata;
    private DateTime $createdAt;
    private ?DateTime $modifiedAt = null;

    public function __construct(string $title, string $content)
    {
        parent::__construct();
        $this->title = $title;
        $this->content = $content;
        $this->metadata = [];
        $this->createdAt = new DateTime();
    }

    public function setMetadata(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
    }

    public function __clone(): void
    {
        // Generate new ID
        $this->id = uniqid('obj_');

        // Copy time objects
        $this->createdAt = new DateTime();
        $this->modifiedAt = null;

        // Deep copy objects in array
        foreach ($this->metadata as $key => $value) {
            if (is_object($value)) {
                $this->metadata[$key] = clone $value;
            }
        }
    }

    public function modify(): void
    {
        $this->modifiedAt = new DateTime();
    }

    public function getInfo(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => substr($this->content, 0, 50) . '...',
            'created' => $this->createdAt->format('Y-m-d H:i:s'),
            'modified' => $this->modifiedAt?->format('Y-m-d H:i:s'),
        ];
    }
}

// Create prototype document
$template = new Document(
    'Report Template',
    'This is a standard report template containing...'
);
$template->setMetadata('author', 'System');
$template->setMetadata('version', '1.0');

// Clone new documents from template
$report1 = clone $template;
$report2 = clone $template;

echo "Template ID: " . $template->getId() . "\n";
echo "Report 1 ID: " . $report1->getId() . "\n";
echo "Report 2 ID: " . $report2->getId() . "\n";

// Each clone has an independent ID
```

#### Preventing Cloning

Sometimes you may want to prevent an object from being cloned, such as in the Singleton pattern:

```php
<?php

class Singleton
{
    private static ?self $instance = null;

    private function __construct()
    {
        // Private constructor
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // Prevent cloning
    private function __clone(): void
    {
        throw new RuntimeException('Singleton object cannot be cloned');
    }

    // Prevent unserialization
    public function __wakeup(): void
    {
        throw new RuntimeException('Singleton object cannot be unserialized');
    }
}

$instance = Singleton::getInstance();
// $clone = clone $instance;  // Fatal error: Cannot access private method
```

## Serialization Magic Methods

### __sleep() and __wakeup()

These two methods are used to customize object serialization and unserialization behavior.

```php
<?php

class DatabaseConnection
{
    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private ?PDO $connection = null;
    private array $queryLog = [];

    public function __construct(
        string $host,
        string $database,
        string $username,
        string $password
    ) {
        $this->host = $host;
        $this->database = $database;
        $this->username = $username;
        $this->password = $password;
        $this->connect();
    }

    private function connect(): void
    {
        $dsn = "mysql:host={$this->host};dbname={$this->database}";
        // In actual projects, this would create a PDO connection
        echo "Establishing database connection\n";
        // $this->connection = new PDO($dsn, $this->username, $this->password);
    }

    public function query(string $sql): void
    {
        $this->queryLog[] = [
            'sql' => $sql,
            'time' => microtime(true)
        ];
        echo "Executing query: {$sql}\n";
    }

    public function __sleep(): array
    {
        // Before serialization: close connection, clean up temporary data
        echo "Preparing for serialization, closing connection\n";
        $this->connection = null;

        // Return array of property names to serialize
        // Note: connection and queryLog are not included
        return ['host', 'database', 'username', 'password'];
    }

    public function __wakeup(): void
    {
        // After unserialization: re-establish connection
        echo "Unserialization complete, reconnecting\n";
        $this->queryLog = [];
        $this->connect();
    }

    public function getQueryLog(): array
    {
        return $this->queryLog;
    }
}

// Usage example
$db = new DatabaseConnection('localhost', 'myapp', 'root', 'secret');
$db->query('SELECT * FROM users');
$db->query('SELECT * FROM orders');

// Serialize
$serialized = serialize($db);
echo "Serialized data length: " . strlen($serialized) . " bytes\n\n";

// Unserialize
$restoredDb = unserialize($serialized);
$restoredDb->query('SELECT * FROM products');

echo "Query log count: " . count($restoredDb->getQueryLog()) . "\n";
// Output: 1 (because previous logs were not serialized)
```

### __serialize() and __unserialize() (PHP 7.4+)

PHP 7.4 introduced more modern serialization methods. Use these methods instead of `__sleep()` and `__wakeup()`.

```php
<?php

class Session
{
    private string $id;
    private string $userId;
    private array $data;
    private DateTime $createdAt;
    private DateTime $lastAccess;
    private ?object $connection = null; // Non-serializable resource

    public function __construct(string $userId)
    {
        $this->id = bin2hex(random_bytes(16));
        $this->userId = $userId;
        $this->data = [];
        $this->createdAt = new DateTime();
        $this->lastAccess = new DateTime();
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
        $this->touch();
    }

    public function get(string $key): mixed
    {
        $this->touch();
        return $this->data[$key] ?? null;
    }

    private function touch(): void
    {
        $this->lastAccess = new DateTime();
    }

    public function __serialize(): array
    {
        // Return array of data to serialize
        // Can freely transform and process data
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'data' => $this->data,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'lastAccess' => $this->lastAccess->format('Y-m-d H:i:s'),
            // connection is not serialized
        ];
    }

    public function __unserialize(array $data): void
    {
        // Restore object state from array
        $this->id = $data['id'];
        $this->userId = $data['userId'];
        $this->data = $data['data'];
        $this->createdAt = new DateTime($data['createdAt']);
        $this->lastAccess = new DateTime($data['lastAccess']);
        $this->connection = null; // Re-establish when needed
    }

    public function getInfo(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'created' => $this->createdAt->format('Y-m-d H:i:s'),
            'lastAccess' => $this->lastAccess->format('Y-m-d H:i:s'),
            'dataKeys' => array_keys($this->data),
        ];
    }
}

// Create session
$session = new Session('user_123');
$session->set('cart', ['item1', 'item2']);
$session->set('preferences', ['theme' => 'dark']);

echo "Original session:\n";
print_r($session->getInfo());

// Serialize
$serialized = serialize($session);

// Unserialize
$restored = unserialize($serialized);

echo "\nRestored session:\n";
print_r($restored->getInfo());
```

#### Handling Sensitive Data

```php
<?php

class SecureConfig
{
    private array $settings;
    private string $encryptionKey;
    private array $sensitiveKeys = ['api_key', 'password', 'secret'];

    public function __construct(array $settings, string $encryptionKey)
    {
        $this->settings = $settings;
        $this->encryptionKey = $encryptionKey;
    }

    public function get(string $key): mixed
    {
        return $this->settings[$key] ?? null;
    }

    public function __serialize(): array
    {
        // Encrypt sensitive data
        $encryptedSettings = [];

        foreach ($this->settings as $key => $value) {
            if (in_array($key, $this->sensitiveKeys)) {
                $encryptedSettings[$key] = $this->encrypt($value);
            } else {
                $encryptedSettings[$key] = $value;
            }
        }

        return [
            'settings' => $encryptedSettings,
            'sensitiveKeys' => $this->sensitiveKeys,
            // Note: encryptionKey is not serialized, needs to be provided again on unserialization
        ];
    }

    public function __unserialize(array $data): void
    {
        $this->sensitiveKeys = $data['sensitiveKeys'];
        $this->settings = $data['settings'];
        // Encryption key needs to be obtained from another secure source
        $this->encryptionKey = getenv('ENCRYPTION_KEY') ?: '';

        // Decrypt sensitive data
        if ($this->encryptionKey) {
            foreach ($this->sensitiveKeys as $key) {
                if (isset($this->settings[$key])) {
                    $this->settings[$key] = $this->decrypt($this->settings[$key]);
                }
            }
        }
    }

    private function encrypt(string $data): string
    {
        // Simplified encryption example (use more secure methods in production)
        return base64_encode(openssl_encrypt(
            $data,
            'AES-256-CBC',
            $this->encryptionKey,
            0,
            substr(md5($this->encryptionKey), 0, 16)
        ));
    }

    private function decrypt(string $data): string
    {
        return openssl_decrypt(
            base64_decode($data),
            'AES-256-CBC',
            $this->encryptionKey,
            0,
            substr(md5($this->encryptionKey), 0, 16)
        );
    }
}
```

## Comprehensive Example: ORM Model Base Class

This practical example combines multiple magic methods:

```php
<?php

abstract class Model
{
    protected static string $table = '';
    protected static string $primaryKey = 'id';
    protected static array $fillable = [];
    protected static array $hidden = [];
    protected static array $casts = [];

    protected array $attributes = [];
    protected array $original = [];
    protected bool $exists = false;

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    // Static method overloading: Model::find(), Model::where(), etc.
    public static function __callStatic(string $method, array $arguments): mixed
    {
        $instance = new static();

        return match ($method) {
            'find' => $instance->findById($arguments[0]),
            'create' => $instance->createNew($arguments[0] ?? []),
            'where' => $instance->newQuery()->where(...$arguments),
            default => throw new BadMethodCallException("Method does not exist: {$method}")
        };
    }

    // Instance method overloading: $model->whereXxx(), etc.
    public function __call(string $method, array $arguments): mixed
    {
        if (str_starts_with($method, 'where')) {
            $column = $this->snakeCase(substr($method, 5));
            return $this->newQuery()->where($column, $arguments[0]);
        }

        throw new BadMethodCallException("Method does not exist: {$method}");
    }

    // Property access
    public function __get(string $key): mixed
    {
        // Check for accessor
        $method = 'get' . $this->studlyCase($key) . 'Attribute';
        if (method_exists($this, $method)) {
            return $this->$method();
        }

        // Type casting
        $value = $this->attributes[$key] ?? null;
        return $this->castAttribute($key, $value);
    }

    public function __set(string $key, mixed $value): void
    {
        // Check for mutator
        $method = 'set' . $this->studlyCase($key) . 'Attribute';
        if (method_exists($this, $method)) {
            $this->$method($value);
            return;
        }

        // Check if fillable
        if (!empty(static::$fillable) && !in_array($key, static::$fillable)) {
            throw new RuntimeException("Property {$key} is not fillable");
        }

        $this->attributes[$key] = $value;
    }

    public function __isset(string $key): bool
    {
        return isset($this->attributes[$key]);
    }

    public function __unset(string $key): void
    {
        unset($this->attributes[$key]);
    }

    // String conversion
    public function __toString(): string
    {
        return json_encode($this->toArray(), JSON_UNESCAPED_UNICODE);
    }

    // Call as function: $model($id) is equivalent to $model->find($id)
    public function __invoke(int $id): ?static
    {
        return $this->findById($id);
    }

    // Reset state when cloning
    public function __clone(): void
    {
        $this->exists = false;
        unset($this->attributes[static::$primaryKey]);
        $this->original = [];
    }

    // Serialization
    public function __serialize(): array
    {
        return [
            'attributes' => $this->attributes,
            'original' => $this->original,
            'exists' => $this->exists,
        ];
    }

    public function __unserialize(array $data): void
    {
        $this->attributes = $data['attributes'];
        $this->original = $data['original'];
        $this->exists = $data['exists'];
    }

    // Helper methods
    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->$key = $value;
        }
        return $this;
    }

    public function toArray(): array
    {
        $result = [];
        foreach ($this->attributes as $key => $value) {
            if (!in_array($key, static::$hidden)) {
                $result[$key] = $this->$key;
            }
        }
        return $result;
    }

    public function isDirty(): bool
    {
        return $this->attributes !== $this->original;
    }

    protected function findById(int $id): ?static
    {
        echo "Query: SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = {$id}\n";
        // Would actually execute database query
        return null;
    }

    protected function createNew(array $attributes): static
    {
        $model = new static($attributes);
        $model->save();
        return $model;
    }

    protected function newQuery(): QueryBuilder
    {
        return new QueryBuilder(static::$table);
    }

    public function save(): bool
    {
        if ($this->exists) {
            echo "Update: UPDATE " . static::$table . " SET ... WHERE " . static::$primaryKey . " = {$this->attributes[static::$primaryKey]}\n";
        } else {
            echo "Insert: INSERT INTO " . static::$table . " ...\n";
            $this->exists = true;
        }

        $this->original = $this->attributes;
        return true;
    }

    protected function castAttribute(string $key, mixed $value): mixed
    {
        if (!isset(static::$casts[$key]) || $value === null) {
            return $value;
        }

        return match (static::$casts[$key]) {
            'int', 'integer' => (int) $value,
            'float', 'double' => (float) $value,
            'bool', 'boolean' => (bool) $value,
            'array' => json_decode($value, true),
            'datetime' => new DateTime($value),
            default => $value
        };
    }

    private function studlyCase(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $value)));
    }

    private function snakeCase(string $value): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $value));
    }
}

// Simplified query builder
class QueryBuilder
{
    private string $table;
    private array $wheres = [];

    public function __construct(string $table)
    {
        $this->table = $table;
    }

    public function where(string $column, mixed $value): self
    {
        $this->wheres[] = [$column, '=', $value];
        return $this;
    }

    public function get(): array
    {
        echo "Executing query: SELECT * FROM {$this->table}";
        if (!empty($this->wheres)) {
            $conditions = array_map(fn($w) => "{$w[0]} {$w[1]} '{$w[2]}'", $this->wheres);
            echo " WHERE " . implode(' AND ', $conditions);
        }
        echo "\n";
        return [];
    }
}

// Usage example
class User extends Model
{
    protected static string $table = 'users';
    protected static array $fillable = ['name', 'email', 'password'];
    protected static array $hidden = ['password'];
    protected static array $casts = [
        'email_verified' => 'bool',
        'created_at' => 'datetime',
    ];

    // Accessor: get display name
    protected function getDisplayNameAttribute(): string
    {
        return strtoupper($this->attributes['name'] ?? '');
    }

    // Mutator: automatically hash password
    protected function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = password_hash($value, PASSWORD_DEFAULT);
    }
}

// Demo
echo "=== Create User ===\n";
$user = new User([
    'name' => 'John',
    'email' => 'john@example.com',
    'password' => 'secret123'
]);

echo "Display name: " . $user->display_name . "\n";
echo "JSON: " . $user . "\n\n";

echo "=== Static Methods ===\n";
User::find(1);
User::where('status', 'active')->get();

echo "\n=== Instance Methods ===\n";
$user->whereEmail('test@example.com')->get();

echo "\n=== Clone ===\n";
$clone = clone $user;
echo "Clone exists: " . ($clone->exists ? 'Yes' : 'No') . "\n";
```

## Best Practices

### Use Magic Methods Moderately

While magic methods are powerful, overusing them can make code difficult to understand and maintain:

```php
<?php

// Not recommended: Overusing magic methods
class OverlyMagic
{
    private array $data = [];

    public function __get($name) { return $this->data[$name] ?? null; }
    public function __set($name, $value) { $this->data[$name] = $value; }
    public function __call($method, $args) { /* Complex logic */ }
    public function __callStatic($method, $args) { /* More logic */ }
}

// Recommended: Clear method definitions with magic methods as supplements
class WellDesigned
{
    private string $name;
    private array $metadata = [];

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    // Only use magic methods for dynamic metadata
    public function __get(string $key): mixed
    {
        return $this->metadata[$key] ?? null;
    }

    public function __set(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
    }
}
```

### Provide Good Type Hints and Documentation

```php
<?php

/**
 * Configuration container class
 *
 * @property string $app_name Application name
 * @property bool $debug Debug mode
 * @property array $database Database configuration
 *
 * @method static self getInstance() Get singleton instance
 * @method mixed get(string $key, mixed $default = null) Get configuration item
 */
class Config
{
    private static ?self $instance = null;
    private array $items = [];

    public static function __callStatic(string $method, array $arguments): mixed
    {
        if ($method === 'getInstance') {
            return self::$instance ??= new self();
        }

        return self::getInstance()->$method(...$arguments);
    }

    public function __get(string $name): mixed
    {
        return $this->items[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        $this->items[$name] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->items[$key] ?? $default;
    }
}
```

### Exception Handling

```php
<?php

class StrictEntity
{
    private array $allowed = ['id', 'name', 'email'];
    private array $data = [];

    public function __get(string $name): mixed
    {
        if (!in_array($name, $this->allowed)) {
            throw new OutOfBoundsException(
                sprintf('Property "%s" does not exist in %s', $name, static::class)
            );
        }

        return $this->data[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        if (!in_array($name, $this->allowed)) {
            throw new OutOfBoundsException(
                sprintf('Cannot set undefined property "%s"', $name)
            );
        }

        $this->data[$name] = $value;
    }

    public function __call(string $method, array $arguments): mixed
    {
        throw new BadMethodCallException(
            sprintf('Method %s::%s() does not exist', static::class, $method)
        );
    }
}
```

## Summary

PHP magic methods are powerful tools in object-oriented programming that allow you to:

1. **Control object lifecycle**: Use `__construct()` and `__destruct()` to manage resources
2. **Implement property overloading**: Use `__get()`, `__set()`, `__isset()`, and `__unset()` to create dynamic properties
3. **Implement method overloading**: Use `__call()` and `__callStatic()` to handle dynamic method calls
4. **Customize object representation**: Use `__toString()` and `__invoke()` to change object behavior
5. **Control cloning behavior**: Use `__clone()` to implement deep copying
6. **Customize serialization**: Use `__sleep()`/`__wakeup()` or `__serialize()`/`__unserialize()` to control the serialization process

Using these magic methods appropriately can make your code more elegant and flexible, but be careful not to overuse them to maintain code readability and maintainability.
