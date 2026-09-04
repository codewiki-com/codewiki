---
title: PHP 8新特性
description: PHP 8完全指南，JIT编译器、属性、联合类型与match表达式
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - PHP 8
  - JIT
  - 属性
status: imported
origin: old/src/content/docs/php/php8-features.en.md
divergence: 0.217
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 语言特性
  order: 4
  lastUpdated: 2026-01-07
---

PHP 8 is a significant milestone in the evolution of the PHP language, officially released in November 2020. This version introduces numerous exciting new features, including the JIT compiler, Attributes, Union Types, Named Arguments, and more, greatly improving PHP's performance and development experience. This article will dive deep into PHP 8's core new features and help you quickly master these functionalities through practical examples.

## JIT Compiler (Just-In-Time Compiler)

### What is JIT

JIT (Just-In-Time compilation) is one of the most important underlying improvements in PHP 8. The traditional PHP execution flow is: source code -> lexical analysis -> syntax analysis -> compile to OPCode -> Zend VM execution. JIT adds an additional step to this process: compiling hot code (frequently executed code) into machine code for direct execution, thereby bypassing the Zend VM's interpretation process.

### How JIT Works

PHP 8's JIT compiler is implemented based on DynASM (Dynamic Assembler), which can convert PHP bytecode into native machine code at runtime. The JIT compiler has two modes:

1. **Tracing JIT**: Traces hot code paths and compiles frequently executed code segments
2. **Function JIT**: Compiles and optimizes entire functions

```php
// php.ini configuration
opcache.enable=1
opcache.jit_buffer_size=100M
opcache.jit=1255
```

The meaning of the JIT configuration parameter `opcache.jit=1255`:
- First digit (1): CPU-specific optimization flag (0=disabled, 1=enabled)
- Second digit (2): Register allocation strategy (0=disabled, 1=local, 2=root allocation)
- Third digit (5): JIT trigger strategy (0=on script load, 1=on first execution, 2=after profiling, 3=hot code, 4=doc comments, 5=tracing-based)
- Fourth digit (5): JIT optimization level (0=disabled, 1=minimal, 2=inline functions, 3=optimized, 4=inline, 5=fully optimized)

### JIT Performance Test Example

```php
<?php
// CPU-intensive task: Calculate Fibonacci sequence
function fibonacci(int $n): int
{
    if ($n <= 1) {
        return $n;
    }
    return fibonacci($n - 1) + fibonacci($n - 2);
}

// Performance test
$start = microtime(true);
$result = fibonacci(35);
$end = microtime(true);

echo "Result: {$result}\n";
echo "Execution time: " . ($end - $start) . " seconds\n";

// With JIT enabled, such CPU-intensive tasks can achieve 2-3x performance improvement
```

### Numerical Computation Performance Comparison

```php
<?php
// Matrix multiplication example
function matrixMultiply(array $a, array $b): array
{
    $rowsA = count($a);
    $colsA = count($a[0]);
    $colsB = count($b[0]);
    $result = [];

    for ($i = 0; $i < $rowsA; $i++) {
        $result[$i] = [];
        for ($j = 0; $j < $colsB; $j++) {
            $sum = 0;
            for ($k = 0; $k < $colsA; $k++) {
                $sum += $a[$i][$k] * $b[$k][$j];
            }
            $result[$i][$j] = $sum;
        }
    }

    return $result;
}

// Generate test matrices
function generateMatrix(int $rows, int $cols): array
{
    $matrix = [];
    for ($i = 0; $i < $rows; $i++) {
        for ($j = 0; $j < $cols; $j++) {
            $matrix[$i][$j] = random_int(1, 100);
        }
    }
    return $matrix;
}

$matrixA = generateMatrix(100, 100);
$matrixB = generateMatrix(100, 100);

$start = microtime(true);
$result = matrixMultiply($matrixA, $matrixB);
$elapsed = microtime(true) - $start;

echo "Matrix multiplication time: {$elapsed} seconds\n";
// With JIT enabled, performance improvement can exceed 50%
```

### JIT Use Cases

JIT is particularly effective for the following scenarios:
- Math-intensive applications
- Image processing (such as GD, Imagick operations)
- Machine learning inference
- Complex data structure operations
- Large loop iterations

For I/O-intensive web applications (such as typical CRUD operations, database queries), the performance improvement from JIT may not be as noticeable, since the bottleneck is usually in I/O waiting rather than CPU computation.

## Attributes

### Attributes Overview

Attributes are a metadata annotation mechanism introduced in PHP 8, replacing the previous PHPDoc comment approach. Attributes use the `#[...]` syntax and can be applied to classes, methods, functions, parameters, properties, and class constants. Attributes provide type-safe, structured metadata accessible through the Reflection API.

### Basic Syntax

```php
<?php
// Define attribute classes
#[Attribute]
class Route
{
    public function __construct(
        public string $path,
        public string $method = 'GET'
    ) {}
}

#[Attribute]
class Middleware
{
    public function __construct(
        public string $name
    ) {}
}

// Using attributes
#[Route('/users', 'GET')]
#[Middleware('auth')]
class UserController
{
    #[Route('/users/{id}', 'GET')]
    public function show(int $id): array
    {
        return ['id' => $id, 'name' => 'John Doe'];
    }

    #[Route('/users', 'POST')]
    #[Middleware('csrf')]
    public function store(array $data): array
    {
        return ['status' => 'created'];
    }
}
```

### Reading Attributes

```php
<?php
// Reading attributes via reflection
$reflection = new ReflectionClass(UserController::class);

// Get class attributes
$classAttributes = $reflection->getAttributes();
foreach ($classAttributes as $attribute) {
    $instance = $attribute->newInstance();
    echo "Attribute name: " . $attribute->getName() . "\n";

    if ($instance instanceof Route) {
        echo "Path: {$instance->path}, Method: {$instance->method}\n";
    }
}

// Get method attributes
foreach ($reflection->getMethods() as $method) {
    $methodAttributes = $method->getAttributes(Route::class);
    foreach ($methodAttributes as $attribute) {
        $route = $attribute->newInstance();
        echo "Method {$method->getName()}: {$route->method} {$route->path}\n";
    }
}
```

### Attribute Target Restrictions

```php
<?php
// Restrict attributes to specific targets only
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_FUNCTION)]
class Cache
{
    public function __construct(
        public int $ttl = 3600,
        public string $key = ''
    ) {}
}

// Repeatable attributes
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
class Tag
{
    public function __construct(
        public string $name
    ) {}
}

#[Tag('api')]
#[Tag('v2')]
#[Tag('public')]
class ApiController
{
    #[Cache(ttl: 600, key: 'user_list')]
    public function index(): array
    {
        return [];
    }
}
```

Attribute target constants:
- `Attribute::TARGET_CLASS` - Class
- `Attribute::TARGET_FUNCTION` - Function
- `Attribute::TARGET_METHOD` - Method
- `Attribute::TARGET_PROPERTY` - Property
- `Attribute::TARGET_CLASS_CONSTANT` - Class constant
- `Attribute::TARGET_PARAMETER` - Parameter
- `Attribute::TARGET_ALL` - All targets
- `Attribute::IS_REPEATABLE` - Allow repeated use

### Practical Application: Validator

```php
<?php
#[Attribute(Attribute::TARGET_PROPERTY)]
class Required
{
    public function __construct(
        public string $message = 'This field is required'
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class MaxLength
{
    public function __construct(
        public int $length,
        public string $message = ''
    ) {
        $this->message = $message ?: "Length cannot exceed {$length} characters";
    }
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Email
{
    public function __construct(
        public string $message = 'Please enter a valid email address'
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Range
{
    public function __construct(
        public int|float $min,
        public int|float $max,
        public string $message = ''
    ) {
        $this->message = $message ?: "Value must be between {$min} and {$max}";
    }
}

class UserDTO
{
    #[Required]
    #[MaxLength(50)]
    public string $name;

    #[Required]
    #[Email]
    public string $email;

    #[Range(min: 18, max: 120, message: 'Age must be between 18 and 120')]
    public int $age;

    #[MaxLength(200, message: 'Bio cannot exceed 200 characters')]
    public string $bio = '';
}

// Validator implementation
class Validator
{
    public function validate(object $object): array
    {
        $errors = [];
        $reflection = new ReflectionClass($object);

        foreach ($reflection->getProperties() as $property) {
            $propertyName = $property->getName();
            $property->setAccessible(true);
            $value = $property->isInitialized($object)
                ? $property->getValue($object)
                : null;

            foreach ($property->getAttributes() as $attribute) {
                $validator = $attribute->newInstance();

                if ($validator instanceof Required && empty($value)) {
                    $errors[$propertyName][] = $validator->message;
                }

                if ($validator instanceof MaxLength && strlen($value ?? '') > $validator->length) {
                    $errors[$propertyName][] = $validator->message;
                }

                if ($validator instanceof Email && $value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$propertyName][] = $validator->message;
                }

                if ($validator instanceof Range && $value !== null) {
                    if ($value < $validator->min || $value > $validator->max) {
                        $errors[$propertyName][] = $validator->message;
                    }
                }
            }
        }

        return $errors;
    }
}

// Usage example
$user = new UserDTO();
$user->name = '';
$user->email = 'invalid-email';
$user->age = 15;

$validator = new Validator();
$errors = $validator->validate($user);
print_r($errors);
// Output:
// Array (
//     [name] => Array ( [0] => This field is required )
//     [email] => Array ( [0] => Please enter a valid email address )
//     [age] => Array ( [0] => Age must be between 18 and 120 )
// )
```

### Practical Application: Routing System

```php
<?php
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Route
{
    public function __construct(
        public string $path,
        public array $methods = ['GET'],
        public ?string $name = null
    ) {}
}

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Middleware
{
    public function __construct(
        public string $name,
        public array $options = []
    ) {}
}

class Router
{
    private array $routes = [];

    public function registerController(string $controllerClass): void
    {
        $reflection = new ReflectionClass($controllerClass);

        // Get class-level route prefix
        $classRoutes = $reflection->getAttributes(Route::class);
        $prefix = '';
        if (!empty($classRoutes)) {
            $prefix = $classRoutes[0]->newInstance()->path;
        }

        // Register method routes
        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            $routeAttributes = $method->getAttributes(Route::class);

            foreach ($routeAttributes as $routeAttr) {
                $route = $routeAttr->newInstance();
                $fullPath = $prefix . $route->path;

                // Collect middleware
                $middlewares = [];
                foreach ($method->getAttributes(Middleware::class) as $mwAttr) {
                    $middlewares[] = $mwAttr->newInstance();
                }

                $this->routes[] = [
                    'path' => $fullPath,
                    'methods' => $route->methods,
                    'name' => $route->name,
                    'controller' => $controllerClass,
                    'action' => $method->getName(),
                    'middlewares' => $middlewares
                ];
            }
        }
    }

    public function getRoutes(): array
    {
        return $this->routes;
    }
}

// Usage example
#[Route('/api/v1')]
class ArticleController
{
    #[Route('/articles', methods: ['GET'], name: 'articles.index')]
    #[Middleware('auth')]
    #[Middleware('throttle', options: ['limit' => 60])]
    public function index(): array
    {
        return ['articles' => []];
    }

    #[Route('/articles/{id}', methods: ['GET'], name: 'articles.show')]
    public function show(int $id): array
    {
        return ['article' => ['id' => $id]];
    }

    #[Route('/articles', methods: ['POST'], name: 'articles.store')]
    #[Middleware('auth')]
    #[Middleware('csrf')]
    public function store(): array
    {
        return ['status' => 'created'];
    }
}

$router = new Router();
$router->registerController(ArticleController::class);
print_r($router->getRoutes());
```

## Union Types

### Basic Syntax

Union types allow declaring that a value can be one of multiple types, using `|` to separate multiple types.

```php
<?php
class Result
{
    // Property union types
    private int|float $value;
    private string|null $error;

    // Method parameter and return value union types
    public function setValue(int|float $value): void
    {
        $this->value = $value;
    }

    public function getValue(): int|float
    {
        return $this->value;
    }

    // Can be combined with null
    public function getError(): string|null
    {
        return $this->error;
    }
}

// Function union types
function processInput(string|array $input): string|array
{
    if (is_string($input)) {
        return strtoupper($input);
    }
    return array_map('strtoupper', $input);
}

echo processInput('hello');           // HELLO
print_r(processInput(['a', 'b']));    // ['A', 'B']
```

### Union Types with Class Hierarchies

```php
<?php
interface Renderable
{
    public function render(): string;
}

class HtmlView implements Renderable
{
    public function __construct(private string $content) {}

    public function render(): string
    {
        return "<div>{$this->content}</div>";
    }
}

class JsonResponse implements Renderable
{
    public function __construct(private array $data) {}

    public function render(): string
    {
        return json_encode($this->data, JSON_UNESCAPED_UNICODE);
    }
}

class PlainText implements Renderable
{
    public function __construct(private string $text) {}

    public function render(): string
    {
        return $this->text;
    }
}

class ResponseHandler
{
    // Accept classes implementing Renderable interface or string
    public function handle(Renderable|string $response): string
    {
        if ($response instanceof Renderable) {
            return $response->render();
        }
        return $response;
    }

    // Accept multiple response types
    public function output(HtmlView|JsonResponse|PlainText|string $content): void
    {
        if (is_string($content)) {
            echo $content;
        } else {
            echo $content->render();
        }
    }
}

$handler = new ResponseHandler();
echo $handler->handle(new HtmlView('Hello'));       // <div>Hello</div>
echo $handler->handle(new JsonResponse(['a' => 1])); // {"a":1}
echo $handler->handle('Plain text');                 // Plain text
```

### false and null as Standalone Types

```php
<?php
class Database
{
    private ?PDO $pdo = null;

    // false can be part of union type, indicating operation failure
    public function find(int $id): array|false
    {
        $stmt = $this->pdo?->prepare("SELECT * FROM users WHERE id = ?");
        $stmt?->execute([$id]);
        $result = $stmt?->fetch(PDO::FETCH_ASSOC);
        return $result ?: false;
    }

    // null indicates possible non-existence
    public function findOrNull(int $id): array|null
    {
        $stmt = $this->pdo?->prepare("SELECT * FROM users WHERE id = ?");
        $stmt?->execute([$id]);
        $result = $stmt?->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    // mixed type (new in PHP 8) represents any type
    public function getValue(string $key): mixed
    {
        // Can return any type
        return $this->cache[$key] ?? null;
    }
}

// Using false type for checking
$db = new Database();
$user = $db->find(1);

if ($user === false) {
    echo "User not found\n";
} else {
    echo "Found user: {$user['name']}\n";
}
```

### Practical Application of Union Types

```php
<?php
class ConfigManager
{
    private array $config = [];

    // Config values can be multiple types
    public function set(string $key, string|int|float|bool|array|null $value): void
    {
        $this->config[$key] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    // Batch get, accepts array or string
    public function getMany(array|string $keys): array
    {
        if (is_string($keys)) {
            $keys = [$keys];
        }

        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->config[$key] ?? null;
        }
        return $result;
    }
}

class Logger
{
    // Log content can be string or object convertible to string
    public function log(string|Stringable $message, array $context = []): void
    {
        $msg = is_string($message) ? $message : $message->__toString();
        echo "[" . date('Y-m-d H:i:s') . "] {$msg}\n";
    }
}

class LogMessage implements Stringable
{
    public function __construct(
        private string $level,
        private string $message
    ) {}

    public function __toString(): string
    {
        return "[{$this->level}] {$this->message}";
    }
}

$logger = new Logger();
$logger->log("Plain log message");
$logger->log(new LogMessage('ERROR', 'An error occurred'));
```

## Named Arguments

### Basic Usage

Named arguments allow passing arguments by parameter name rather than position, improving code readability.

```php
<?php
function createUser(
    string $name,
    string $email,
    int $age = 18,
    bool $active = true,
    string $role = 'user',
    ?string $avatar = null,
    array $permissions = []
): array {
    return compact('name', 'email', 'age', 'active', 'role', 'avatar', 'permissions');
}

// Traditional way: must pass all parameters in order
$user1 = createUser('John', 'john@example.com', 25, true, 'admin', null, ['read', 'write']);

// Named arguments: only pass needed parameters, order doesn't matter
$user2 = createUser(
    name: 'Jane',
    email: 'jane@example.com',
    role: 'editor',
    permissions: ['read']
);

// Mix positional and named arguments (positional must come first)
$user3 = createUser(
    'Bob',              // positional argument
    'bob@example.com',  // positional argument
    role: 'moderator',  // named argument
    age: 30             // named argument
);

print_r($user2);
// Output:
// Array (
//     [name] => Jane
//     [email] => jane@example.com
//     [age] => 18
//     [active] => 1
//     [role] => editor
//     [avatar] =>
//     [permissions] => Array ( [0] => read )
// )
```

### Combined with Attributes

```php
<?php
#[Attribute]
class Column
{
    public function __construct(
        public string $name = '',
        public string $type = 'string',
        public int $length = 255,
        public bool $nullable = false,
        public bool $unique = false,
        public mixed $default = null,
        public bool $primary = false,
        public bool $autoIncrement = false
    ) {}
}

class User
{
    #[Column(name: 'user_id', type: 'integer', primary: true, autoIncrement: true)]
    public int $id;

    #[Column(type: 'string', length: 100)]
    public string $name;

    #[Column(type: 'string', unique: true)]
    public string $email;

    #[Column(type: 'text', nullable: true, default: '')]
    public ?string $bio;

    #[Column(type: 'datetime', default: 'CURRENT_TIMESTAMP')]
    public \DateTimeInterface $createdAt;
}
```

### Combined with Built-in Functions

```php
<?php
// Many built-in functions also support named arguments

// array_fill
$array = array_fill(
    start_index: 0,
    count: 5,
    value: 'hello'
);

// htmlspecialchars
$escaped = htmlspecialchars(
    string: '<script>alert("xss")</script>',
    flags: ENT_QUOTES | ENT_HTML5,
    encoding: 'UTF-8',
    double_encode: false
);

// setcookie
setcookie(
    name: 'user_session',
    value: 'abc123',
    expires_or_options: time() + 3600,
    path: '/',
    domain: '',
    secure: true,
    httponly: true
);

// PHP 8 also supports passing options via array
setcookie('user_session', 'abc123', [
    'expires' => time() + 3600,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);

// json_encode
$json = json_encode(
    value: ['name' => 'John', 'age' => 25],
    flags: JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT,
    depth: 512
);
```

### Combined with Array Spread

```php
<?php
function configure(
    string $host = 'localhost',
    int $port = 3306,
    string $database = 'app',
    string $username = 'root',
    string $password = '',
    string $charset = 'utf8mb4'
): array {
    return [
        'dsn' => "mysql:host={$host};port={$port};dbname={$database};charset={$charset}",
        'username' => $username,
        'password' => $password
    ];
}

// Create connection from config array
$config = [
    'host' => '192.168.1.100',
    'database' => 'production',
    'username' => 'app_user',
    'password' => 'secret'
];

// Using spread operator with named arguments
$connection = configure(...$config);
print_r($connection);

// Override partial config
$testConnection = configure(
    ...['host' => 'localhost', 'database' => 'test'],
    username: 'test_user',
    password: 'test_pass'
);
```

## Match Expression

### Basic Syntax

`match` is a new expression introduced in PHP 8, an enhanced version of `switch` that provides more concise and safe syntax.

```php
<?php
// Traditional switch
function getStatusTextOld(int $status): string
{
    switch ($status) {
        case 200:
            $text = 'Success';
            break;
        case 404:
            $text = 'Not Found';
            break;
        case 500:
            $text = 'Server Error';
            break;
        default:
            $text = 'Unknown Status';
    }
    return $text;
}

// Using match expression
function getStatusText(int $status): string
{
    return match ($status) {
        200 => 'Success',
        201 => 'Created',
        204 => 'No Content',
        301, 302 => 'Redirect',
        400 => 'Bad Request',
        401 => 'Unauthorized',
        403 => 'Forbidden',
        404 => 'Not Found',
        500 => 'Server Error',
        502 => 'Bad Gateway',
        503 => 'Service Unavailable',
        default => 'Unknown Status'
    };
}

echo getStatusText(404); // Not Found
echo getStatusText(301); // Redirect
```

### Core Differences Between Match and Switch

```php
<?php
// 1. match is an expression that returns a value; switch is a statement
$result = match ($value) {
    1 => 'one',
    2 => 'two',
    default => 'other'
};

// 2. match uses strict comparison (===), switch uses loose comparison (==)
$value = '1';

// switch uses loose comparison
switch ($value) {
    case 1:          // '1' == 1 is true
        echo 'switch: matched integer 1';  // will execute
        break;
}

// match uses strict comparison
$result = match ($value) {
    1 => 'match: matched integer 1',       // won't match
    '1' => 'match: matched string "1"',    // will match
    default => 'match: default'
};
echo $result; // match: matched string "1"

// 3. match doesn't need break, no fall-through problem
// 4. match must be exhaustive, otherwise throws UnhandledMatchError
try {
    $result = match (3) {
        1 => 'one',
        2 => 'two'
        // no default, and 3 has no match
    };
} catch (UnhandledMatchError $e) {
    echo "Unhandled match: " . $e->getMessage();
}
```

### Multiple Condition Matching

```php
<?php
function getSeasonName(int $month): string
{
    return match ($month) {
        3, 4, 5 => 'Spring',
        6, 7, 8 => 'Summer',
        9, 10, 11 => 'Autumn',
        12, 1, 2 => 'Winter',
        default => throw new InvalidArgumentException("Invalid month: {$month}")
    };
}

echo getSeasonName(7);  // Summer
echo getSeasonName(12); // Winter

// File type detection
function getFileCategory(string $extension): string
{
    return match (strtolower($extension)) {
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp' => 'Image',
        'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv' => 'Video',
        'mp3', 'wav', 'flac', 'aac', 'ogg' => 'Audio',
        'doc', 'docx', 'pdf', 'txt', 'rtf', 'odt' => 'Document',
        'xls', 'xlsx', 'csv' => 'Spreadsheet',
        'zip', 'rar', '7z', 'tar', 'gz' => 'Archive',
        'php', 'js', 'py', 'java', 'c', 'cpp', 'go', 'rs' => 'Code',
        default => 'Other'
    };
}
```

### Complex Condition Matching (match(true) Pattern)

```php
<?php
class Order
{
    public function __construct(
        public string $status,
        public float $amount,
        public bool $isPriority = false,
        public bool $isVip = false
    ) {}
}

function calculateShippingFee(Order $order): float
{
    return match (true) {
        $order->amount >= 500 => 0.0,                              // Free shipping over 500
        $order->isPriority && $order->isVip => 15.0,               // VIP priority shipping
        $order->isPriority => 25.0,                                 // Priority shipping
        $order->isVip && $order->amount >= 200 => 5.0,             // VIP discount over 200
        $order->amount >= 200 => 10.0,                              // Reduced shipping over 200
        $order->isVip => 8.0,                                       // VIP user discount
        default => 15.0                                             // Standard shipping
    };
}

// User permission check
function getAccessLevel(array $user): string
{
    return match (true) {
        $user['is_superadmin'] ?? false => 'superadmin',
        $user['is_admin'] ?? false => 'admin',
        ($user['role'] ?? '') === 'editor' => 'editor',
        ($user['role'] ?? '') === 'author' => 'author',
        isset($user['id']) => 'member',
        default => 'guest'
    };
}

// Numeric range check
function getScoreGrade(int $score): string
{
    return match (true) {
        $score >= 90 => 'A (Excellent)',
        $score >= 80 => 'B (Good)',
        $score >= 70 => 'C (Average)',
        $score >= 60 => 'D (Pass)',
        $score >= 0 => 'F (Fail)',
        default => throw new InvalidArgumentException('Invalid score')
    };
}
```

### Match with Enums

```php
<?php
enum PaymentMethod: string
{
    case CreditCard = 'credit_card';
    case DebitCard = 'debit_card';
    case Alipay = 'alipay';
    case WechatPay = 'wechat_pay';
    case BankTransfer = 'bank_transfer';
    case Cash = 'cash';
}

function getPaymentFee(PaymentMethod $method, float $amount): float
{
    $rate = match ($method) {
        PaymentMethod::CreditCard => 0.029,      // 2.9%
        PaymentMethod::DebitCard => 0.015,       // 1.5%
        PaymentMethod::Alipay,
        PaymentMethod::WechatPay => 0.006,       // 0.6%
        PaymentMethod::BankTransfer => 0.001,    // 0.1%
        PaymentMethod::Cash => 0.0,              // Free
    };

    return round($amount * $rate, 2);
}

function getPaymentLabel(PaymentMethod $method): string
{
    return match ($method) {
        PaymentMethod::CreditCard => 'Credit Card',
        PaymentMethod::DebitCard => 'Debit Card',
        PaymentMethod::Alipay => 'Alipay',
        PaymentMethod::WechatPay => 'WeChat Pay',
        PaymentMethod::BankTransfer => 'Bank Transfer',
        PaymentMethod::Cash => 'Cash',
    };
}

echo getPaymentFee(PaymentMethod::CreditCard, 1000); // 29
echo getPaymentFee(PaymentMethod::Alipay, 1000);     // 6
echo getPaymentLabel(PaymentMethod::WechatPay);      // WeChat Pay
```

## Constructor Property Promotion

### Basic Syntax

Constructor property promotion is syntactic sugar that simplifies class definitions by allowing you to declare and initialize class properties directly in the constructor parameter list.

```php
<?php
// PHP 7 traditional approach
class UserOld
{
    private string $name;
    private string $email;
    private int $age;
    private bool $active;

    public function __construct(
        string $name,
        string $email,
        int $age,
        bool $active = true
    ) {
        $this->name = $name;
        $this->email = $email;
        $this->age = $age;
        $this->active = $active;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }
}

// PHP 8 constructor property promotion
class User
{
    public function __construct(
        private string $name,
        private string $email,
        private int $age,
        private bool $active = true
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function isActive(): bool
    {
        return $this->active;
    }
}

$user = new User('John', 'john@example.com', 25);
echo $user->getName();    // John
echo $user->isActive();   // true
```

### Mixing Promoted and Regular Parameters

```php
<?php
class Product
{
    private float $totalPrice;
    private \DateTimeImmutable $createdAt;

    public function __construct(
        public readonly string $name,          // Promoted to readonly property
        public readonly float $price,          // Promoted to readonly property
        public readonly int $quantity,         // Promoted to readonly property
        float $taxRate = 0.13,                 // Regular parameter, won't become property
        ?string $sku = null                    // Regular parameter
    ) {
        // $taxRate and $sku are regular parameters, only available in constructor
        $this->totalPrice = $this->price * $this->quantity * (1 + $taxRate);
        $this->createdAt = new \DateTimeImmutable();

        if ($sku !== null) {
            // Can process SKU here
        }
    }

    public function getTotalPrice(): float
    {
        return $this->totalPrice;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}

$product = new Product('iPhone', 7999.0, 2, taxRate: 0.13);
echo $product->name;           // iPhone
echo $product->getTotalPrice(); // 18077.74
```

### Combined with Attributes and Union Types

```php
<?php
#[Attribute(Attribute::TARGET_CLASS)]
class Entity
{
    public function __construct(
        public string $table,
        public ?string $connection = null
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Column
{
    public function __construct(
        public string $name = '',
        public string $type = 'string'
    ) {}
}

#[Entity(table: 'articles')]
class Article
{
    public function __construct(
        #[Column(name: 'id', type: 'integer')]
        public readonly int $id,

        #[Column(name: 'title', type: 'string')]
        public string $title,

        #[Column(name: 'content', type: 'text')]
        public string|null $content = null,

        #[Column(name: 'author_id', type: 'string')]
        public int|string $authorId,

        #[Column(name: 'created_at', type: 'datetime')]
        public \DateTimeInterface $createdAt = new \DateTimeImmutable(),

        private array $tags = [],
        private bool $published = false
    ) {}

    public function addTag(string $tag): self
    {
        $this->tags[] = $tag;
        return $this;
    }

    public function getTags(): array
    {
        return $this->tags;
    }

    public function publish(): self
    {
        $this->published = true;
        return $this;
    }

    public function isPublished(): bool
    {
        return $this->published;
    }
}

$article = new Article(
    id: 1,
    title: 'PHP 8 New Features',
    authorId: 'user_123',
    tags: ['PHP', 'Tutorial']
);
$article->addTag('PHP8')->publish();
```

### Different Access Modifiers

```php
<?php
class DatabaseConfig
{
    public function __construct(
        public string $host,           // Public property
        public int $port,              // Public property
        protected string $database,    // Protected property
        private string $username,      // Private property
        private string $password,      // Private property
        public readonly string $driver = 'mysql'  // Readonly public property
    ) {}

    public function getDsn(): string
    {
        return "{$this->driver}:host={$this->host};port={$this->port};dbname={$this->database}";
    }

    public function getCredentials(): array
    {
        return [
            'username' => $this->username,
            'password' => str_repeat('*', strlen($this->password))
        ];
    }
}

$config = new DatabaseConfig(
    host: 'localhost',
    port: 3306,
    database: 'myapp',
    username: 'root',
    password: 'secret'
);

echo $config->host;     // localhost (public, accessible)
echo $config->driver;   // mysql (readonly, accessible)
echo $config->getDsn(); // mysql:host=localhost;port=3306;dbname=myapp
// echo $config->password; // Error: private property not accessible
```

## Nullsafe Operator

### Basic Syntax

The nullsafe operator `?->` is used to safely access properties or methods of objects that might be null, avoiding tedious null checks.

```php
<?php
class Country
{
    public function __construct(
        private string $name,
        private string $code
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function getCode(): string
    {
        return $this->code;
    }
}

class Address
{
    public function __construct(
        private string $city,
        private string $street,
        private ?string $apartment = null,
        private ?Country $country = null
    ) {}

    public function getCity(): string
    {
        return $this->city;
    }

    public function getCountry(): ?Country
    {
        return $this->country;
    }
}

class Company
{
    public function __construct(
        private string $name,
        private ?Address $address = null
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function getAddress(): ?Address
    {
        return $this->address;
    }
}

class User
{
    public function __construct(
        private string $name,
        private ?Company $company = null
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function getCompany(): ?Company
    {
        return $this->company;
    }
}

// PHP 7 approach: requires multiple null checks
function getCountryNameOld(?User $user): ?string
{
    if ($user === null) {
        return null;
    }
    $company = $user->getCompany();
    if ($company === null) {
        return null;
    }
    $address = $company->getAddress();
    if ($address === null) {
        return null;
    }
    $country = $address->getCountry();
    if ($country === null) {
        return null;
    }
    return $country->getName();
}

// PHP 8 approach: using nullsafe operator
function getCountryName(?User $user): ?string
{
    return $user?->getCompany()?->getAddress()?->getCountry()?->getName();
}

// Test cases
$user1 = new User('John');
$user2 = new User(
    'Jane',
    new Company('Acme Inc')
);
$user3 = new User(
    'Bob',
    new Company(
        'Tech Corp',
        new Address('Beijing', 'Zhongguancun Street', null, new Country('China', 'CN'))
    )
);

echo getCountryName($user1) ?? 'Unknown country'; // Unknown country
echo getCountryName($user2) ?? 'Unknown country'; // Unknown country
echo getCountryName($user3);                      // China
echo getCountryName(null) ?? 'No user';           // No user
```

### Method Chaining and Property Access

```php
<?php
class QueryBuilder
{
    private ?array $result = null;
    private array $query = [];

    public function select(string ...$columns): self
    {
        $this->query['select'] = $columns;
        return $this;
    }

    public function from(string $table): self
    {
        $this->query['from'] = $table;
        return $this;
    }

    public function where(string $column, string $operator, mixed $value): self
    {
        $this->query['where'][] = [$column, $operator, $value];
        return $this;
    }

    public function first(): ?array
    {
        // Simulate returning first result
        return ['id' => 1, 'name' => 'Test User'];
    }

    public function get(): array
    {
        // Simulate returning all results
        return [
            ['id' => 1, 'name' => 'User 1'],
            ['id' => 2, 'name' => 'User 2']
        ];
    }
}

class Database
{
    private ?QueryBuilder $builder = null;

    public function query(): ?QueryBuilder
    {
        return $this->builder;
    }

    public function connect(): self
    {
        $this->builder = new QueryBuilder();
        return $this;
    }

    public function disconnect(): self
    {
        $this->builder = null;
        return $this;
    }
}

$db = new Database();

// Safe access when not connected
$result = $db->query()?->select('*')?->from('users')?->first();
var_dump($result); // null

// Normal access after connecting
$db->connect();
$result = $db->query()?->select('id', 'name')?->from('users')?->first();
var_dump($result); // ['id' => 1, 'name' => 'Test User']

// Safe access again after disconnecting
$db->disconnect();
$result = $db->query()?->select('*')?->from('users')?->get();
var_dump($result); // null
```

### Combined with Null Coalescing Operator

```php
<?php
class Config
{
    private array $data = [];

    public function __construct(array $data = [])
    {
        $this->data = $data;
    }

    public function get(string $key): mixed
    {
        return $this->data[$key] ?? null;
    }

    public function getSection(string $section): ?Config
    {
        $data = $this->data[$section] ?? null;
        return is_array($data) ? new Config($data) : null;
    }
}

class Application
{
    private ?Config $config = null;

    public function setConfig(Config $config): void
    {
        $this->config = $config;
    }

    public function getConfig(): ?Config
    {
        return $this->config;
    }
}

$app = new Application();

// Using nullsafe operator + null coalescing operator to provide default values
$host = $app->getConfig()?->getSection('database')?->get('host') ?? 'localhost';
$port = $app->getConfig()?->getSection('database')?->get('port') ?? 3306;

echo "Host: {$host}, Port: {$port}\n"; // Host: localhost, Port: 3306

// After setting config
$app->setConfig(new Config([
    'database' => [
        'host' => '192.168.1.100',
        'port' => 5432,
        'name' => 'mydb'
    ],
    'cache' => [
        'driver' => 'redis',
        'host' => '127.0.0.1'
    ]
]));

$host = $app->getConfig()?->getSection('database')?->get('host') ?? 'localhost';
$port = $app->getConfig()?->getSection('database')?->get('port') ?? 3306;

echo "Host: {$host}, Port: {$port}\n"; // Host: 192.168.1.100, Port: 5432
```

### Short-Circuit Evaluation

```php
<?php
class Logger
{
    private int $callCount = 0;

    public function log(string $message): self
    {
        $this->callCount++;
        echo "[{$this->callCount}] {$message}\n";
        return $this;
    }

    public function getCallCount(): int
    {
        return $this->callCount;
    }
}

class Service
{
    public function __construct(
        private ?Logger $logger = null
    ) {}

    public function process(): void
    {
        // If logger is null, subsequent methods won't execute
        $this->logger?->log('Starting process')?->log('Processing')?->log('Process complete');
    }

    public function getLogCount(): int
    {
        return $this->logger?->getCallCount() ?? 0;
    }
}

// Service without logger
$service1 = new Service();
$service1->process(); // No output
echo "Log count: " . $service1->getLogCount() . "\n"; // Log count: 0

// Service with logger
$service2 = new Service(new Logger());
$service2->process();
// Output:
// [1] Starting process
// [2] Processing
// [3] Process complete
echo "Log count: " . $service2->getLogCount() . "\n"; // Log count: 3
```

## Other Important New Features

### New String Functions

```php
<?php
$string = 'Hello, World! Welcome to PHP 8.';

// str_contains - Check if string contains substring
if (str_contains($string, 'World')) {
    echo "Contains 'World'\n";
}

// str_starts_with - Check if string starts with specified substring
if (str_starts_with($string, 'Hello')) {
    echo "Starts with 'Hello'\n";
}

// str_ends_with - Check if string ends with specified substring
if (str_ends_with($string, '8.')) {
    echo "Ends with '8.'\n";
}

// Practical application: URL route matching
function matchRoute(string $path, string $pattern): bool
{
    // Check if it's an API route
    if (str_starts_with($path, '/api/')) {
        echo "This is an API route\n";
    }

    // Check if it's a JSON request
    if (str_ends_with($path, '.json')) {
        echo "Requesting JSON format\n";
    }

    // Check if it contains version number
    if (str_contains($path, '/v2/')) {
        echo "Using API v2\n";
    }

    return true;
}

matchRoute('/api/v2/users.json', '/api/users');

// PHP 7 required this approach
// if (strpos($string, 'World') !== false) { ... }
// if (substr($string, 0, 5) === 'Hello') { ... }
// if (substr($string, -2) === '8.') { ... }
```

### fdiv Function

```php
<?php
// fdiv - Safe float division, won't throw DivisionByZeroError
$a = 10.0;
$b = 0.0;

// Traditional division produces warning
// $result = $a / $b; // Warning: Division by zero

// fdiv returns INF, -INF, or NAN
echo fdiv(10, 0);   // INF
echo fdiv(-10, 0);  // -INF
echo fdiv(0, 0);    // NAN

// Practical application: Calculate percentage
function calculatePercentage(float $part, float $total): float
{
    $result = fdiv($part, $total) * 100;

    // Handle special cases
    if (is_nan($result)) {
        return 0.0;
    }
    if (is_infinite($result)) {
        return 100.0;
    }

    return round($result, 2);
}

echo calculatePercentage(50, 200);  // 25
echo calculatePercentage(0, 0);     // 0
echo calculatePercentage(100, 0);   // 100
```

### WeakMap

```php
<?php
// WeakMap allows objects as keys, entries are automatically deleted when objects are destroyed
class CacheManager
{
    private WeakMap $cache;

    public function __construct()
    {
        $this->cache = new WeakMap();
    }

    public function set(object $key, mixed $value): void
    {
        $this->cache[$key] = $value;
    }

    public function get(object $key): mixed
    {
        return $this->cache[$key] ?? null;
    }

    public function has(object $key): bool
    {
        return isset($this->cache[$key]);
    }

    public function count(): int
    {
        return count($this->cache);
    }
}

class Entity
{
    public function __construct(public int $id) {}
}

$cache = new CacheManager();

// Create objects and cache them
$entity1 = new Entity(1);
$entity2 = new Entity(2);

$cache->set($entity1, ['computed' => 'value1']);
$cache->set($entity2, ['computed' => 'value2']);

echo "Cache entries: " . $cache->count() . "\n"; // 2
echo $cache->has($entity1) ? "Exists\n" : "Does not exist\n"; // Exists

// When object is destroyed, WeakMap entry is automatically deleted
unset($entity1);
echo "Cache entries: " . $cache->count() . "\n"; // 1

// Use case: Attach metadata to objects without increasing reference count
class ObjectMetadata
{
    private static WeakMap $metadata;

    public static function init(): void
    {
        self::$metadata = new WeakMap();
    }

    public static function attach(object $obj, array $data): void
    {
        self::$metadata[$obj] = $data;
    }

    public static function get(object $obj): ?array
    {
        return self::$metadata[$obj] ?? null;
    }
}

ObjectMetadata::init();
$user = new Entity(100);
ObjectMetadata::attach($user, ['created_by' => 'system', 'created_at' => time()]);
print_r(ObjectMetadata::get($user));
```

### mixed Type

```php
<?php
// mixed represents any type, equivalent to object|resource|array|string|int|float|bool|null

class Container
{
    private array $bindings = [];

    // Accept any type of value
    public function bind(string $key, mixed $value): void
    {
        $this->bindings[$key] = $value;
    }

    // Return any type of value
    public function get(string $key): mixed
    {
        return $this->bindings[$key] ?? null;
    }
}

// Generic processing function
function process(mixed $value): mixed
{
    return match (true) {
        is_string($value) => strtoupper($value),
        is_array($value) => count($value),
        is_int($value) => $value * 2,
        is_float($value) => round($value, 2),
        is_bool($value) => $value ? 'yes' : 'no',
        is_object($value) => get_class($value),
        is_null($value) => 'null',
        default => 'unknown'
    };
}

echo process('hello');         // HELLO
echo process([1, 2, 3]);       // 3
echo process(21);              // 42
echo process(3.14159);         // 3.14
echo process(true);            // yes
echo process(new stdClass());  // stdClass
echo process(null);            // null
```

### static Return Type

```php
<?php
// static return type is used for fluent interfaces, ensuring subclass methods return correct types

class Builder
{
    protected array $data = [];

    public function set(string $key, mixed $value): static
    {
        $this->data[$key] = $value;
        return $this;
    }

    public function merge(array $data): static
    {
        $this->data = array_merge($this->data, $data);
        return $this;
    }

    public function build(): array
    {
        return $this->data;
    }
}

class UserBuilder extends Builder
{
    public function setName(string $name): static
    {
        return $this->set('name', $name);
    }

    public function setEmail(string $email): static
    {
        return $this->set('email', $email);
    }

    public function setAge(int $age): static
    {
        return $this->set('age', $age);
    }
}

class AdminBuilder extends UserBuilder
{
    public function setPermissions(array $permissions): static
    {
        return $this->set('permissions', $permissions);
    }
}

// static return type ensures method chaining returns correct type
$admin = (new AdminBuilder())
    ->setName('Administrator')
    ->setEmail('admin@example.com')
    ->setAge(30)
    ->setPermissions(['read', 'write', 'delete'])
    ->merge(['department' => 'IT'])
    ->build();

print_r($admin);
// Array (
//     [name] => Administrator
//     [email] => admin@example.com
//     [age] => 30
//     [permissions] => Array ( [0] => read [1] => write [2] => delete )
//     [department] => IT
// )
```

### throw Expression

```php
<?php
// throw can now be used as an expression, usable in more contexts

class Validator
{
    // Using in arrow functions
    public function required(string $field): \Closure
    {
        return fn($value) => $value !== '' && $value !== null
            ? $value
            : throw new \InvalidArgumentException("{$field} is required");
    }

    // Using in ternary operator
    public function validate(?string $value, string $fieldName): string
    {
        return $value !== null && $value !== ''
            ? $value
            : throw new \InvalidArgumentException("{$fieldName} cannot be empty");
    }

    // Using in null coalescing operator
    public function getRequired(array $data, string $key): mixed
    {
        return $data[$key] ?? throw new \RuntimeException("Missing required key: {$key}");
    }

    // Using in match expression
    public function validateStatus(string $status): string
    {
        return match ($status) {
            'pending', 'processing', 'completed' => $status,
            'cancelled' => throw new \LogicException('Cancelled status cannot be processed'),
            default => throw new \InvalidArgumentException("Invalid status: {$status}")
        };
    }
}

$validator = new Validator();

// Test throw in arrow function
$requiredName = $validator->required('name');
try {
    $requiredName(''); // Will throw exception
} catch (\InvalidArgumentException $e) {
    echo $e->getMessage() . "\n"; // name is required
}

// Test throw in null coalescing
try {
    $validator->getRequired(['name' => 'test'], 'email');
} catch (\RuntimeException $e) {
    echo $e->getMessage() . "\n"; // Missing required key: email
}

// Test throw in match
try {
    $validator->validateStatus('invalid');
} catch (\InvalidArgumentException $e) {
    echo $e->getMessage() . "\n"; // Invalid status: invalid
}
```

### Trailing Commas in Parameters

```php
<?php
// PHP 8 allows trailing commas in function parameters, closure use lists, etc.

// Trailing comma in function parameters
function createConfig(
    string $host,
    int $port,
    string $database,
    string $username,
    string $password,  // Trailing comma
) {
    return compact('host', 'port', 'database', 'username', 'password');
}

// Trailing comma in closure use list
$prefix = 'user_';
$suffix = '_cache';

$createKey = function (string $name) use (
    $prefix,
    $suffix,  // Trailing comma
) {
    return $prefix . $name . $suffix;
};

echo $createKey('profile'); // user_profile_cache

// Trailing comma in attribute parameters
#[Attribute]
class Validate
{
    public function __construct(
        public array $rules,
        public string $message = '',
        public bool $bail = false,  // Trailing comma
    ) {}
}
```

## Upgrading to PHP 8: Important Considerations

### Breaking Changes

```php
<?php
// 1. Comparison operator changes (significant impact)
// PHP 7: 0 == "foo" is true (number vs string comparison)
// PHP 8: 0 == "foo" is false (string converted to number for comparison)

$value = 0;
$string = "hello";

// PHP 8 behavior
if ($value == $string) {
    echo "equal"; // PHP 7 would execute this
} else {
    echo "not equal"; // PHP 8 executes this
}

// 2. @ error suppression operator no longer suppresses fatal errors
// The following code still throws TypeError in PHP 8
// @strlen([]);

// 3. Reflection API changes
$reflectionMethod = new ReflectionMethod(SomeClass::class, 'someMethod');
$parameters = $reflectionMethod->getParameters();

foreach ($parameters as $param) {
    // PHP 7: $param->getClass()
    // PHP 8: Use $param->getType()
    $type = $param->getType();
    if ($type instanceof ReflectionNamedType && !$type->isBuiltin()) {
        echo "Class type: " . $type->getName() . "\n";
    }
}

// 4. Internal functions strict type checking
// PHP 7: strlen([]); // Warning + returns null
// PHP 8: strlen([]); // TypeError

// 5. Resource types become objects
$file = fopen('test.txt', 'r');
// PHP 7: is_resource($file) is true
// PHP 8 some resources become objects, like CurlHandle, GdImage, etc.

// 6. Default error reporting level changed
// PHP 8 default error_reporting = E_ALL
```

### Deprecated Features

```php
<?php
// 1. Required parameters cannot follow optional parameters
// Deprecated (PHP 8.0 warning, future versions will error)
function badFunction($optional = null, $required) { } // Warning

// Correct approach
function goodFunction($required, $optional = null) { }

// 2. Implicit incompatible float to int conversion
$float = 1.9;
// Deprecated
// $int = (int) $float; // Will lose decimal part, recommend using floor/ceil/round

// 3. create_function() removed
// PHP 7: create_function('$a', 'return $a * 2;');
// PHP 8: Use anonymous function
$double = fn($a) => $a * 2;

// 4. each() function removed
// PHP 7: while (list($key, $value) = each($array)) { }
// PHP 8: foreach ($array as $key => $value) { }

// 5. Serializable interface deprecated (PHP 8.1)
// Use __serialize() and __unserialize() magic methods instead
class NewSerializable
{
    private string $data;

    public function __serialize(): array
    {
        return ['data' => $this->data];
    }

    public function __unserialize(array $data): void
    {
        $this->data = $data['data'];
    }
}
```

### Upgrade Recommendations

```php
<?php
// 1. Enable strict mode
declare(strict_types=1);

// 2. Use more modern type declarations
class ModernClass
{
    // Use constructor property promotion
    public function __construct(
        private readonly string $name,
        private int|float $value,
        private ?array $options = null
    ) {}

    // Use union types and return types
    public function process(string|array $input): array|false
    {
        // Use match instead of switch
        return match (gettype($input)) {
            'string' => [$input],
            'array' => $input,
            default => false
        };
    }
}

// 3. Use nullsafe operator to simplify code
$result = $object?->method()?->property ?? 'default';

// 4. Use attributes instead of PHPDoc annotations
#[Route('/api/users')]
#[Middleware('auth')]
class ApiController
{
    #[Cache(ttl: 3600)]
    public function index(): array
    {
        return [];
    }
}
```

## Summary

PHP 8 brings many exciting new features that improve language performance and significantly enhance the development experience:

| Feature | Main Advantage | Use Case |
|---------|----------------|----------|
| JIT Compiler | 2-3x performance improvement for CPU-intensive tasks | Mathematical computation, image processing, machine learning |
| Attributes | Native metadata support, type-safe | Route definitions, validation rules, ORM mapping |
| Union Types | More precise type declarations | API parameters, config handling, polymorphic return values |
| Named Arguments | Improved code readability | Multi-parameter functions, config passing |
| Match Expression | Concise and safe conditional branching | Status handling, type conversion, mapping |
| Constructor Property Promotion | Reduced boilerplate code | DTOs, entities, value objects |
| Nullsafe Operator | Safe object chain access | Nested object access, optional associations |

### Migration Recommendations

1. **Gradual upgrade**: First upgrade to PHP 7.4, resolve all deprecation warnings, then upgrade to PHP 8
2. **Enable strict mode**: Add `declare(strict_types=1);` to all files
3. **Update dependencies**: Ensure all Composer packages support PHP 8
4. **Run tests**: Ensure sufficient test coverage, especially for type-related tests
5. **Use static analysis**: Tools like PHPStan, Psalm can detect potential type issues
6. **Gradual adoption**: Prioritize using PHP 8 features in new code, gradually refactor old code

## Further Reading

- [PHP 8.0 Official Migration Guide](https://www.php.net/manual/en/migration80.php)
- [PHP 8.1 New Features](https://www.php.net/releases/8.1/en.php) - Enums, Fibers, readonly properties, etc.
- [PHP 8.2 New Features](https://www.php.net/releases/8.2/en.php) - readonly classes, DNF types, etc.
- [PHP 8.3 New Features](https://www.php.net/releases/8.3/en.php) - Typed class constants, dynamic class constant fetch, etc.
- [PHP RFC Index](https://wiki.php.net/rfc) - Learn about PHP language evolution
