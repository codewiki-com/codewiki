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
origin: old/src/content/docs/php/php8-features.zh.md
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

PHP 8 是 PHP 语言发展历程中的一个重要里程碑，于 2020 年 11 月正式发布。这个版本引入了众多令人兴奋的新特性，包括 JIT 编译器、属性（Attributes）、联合类型、命名参数等，极大地提升了 PHP 的性能和开发体验。本文将深入探讨 PHP 8 的核心新特性，并通过实际示例帮助你快速掌握这些功能。

## JIT 编译器（Just-In-Time Compiler）

### 什么是 JIT

JIT（即时编译）是 PHP 8 最重要的底层改进之一。传统的 PHP 执行流程是：源代码 -> 词法分析 -> 语法分析 -> 编译为 OPCode -> Zend VM 执行。而 JIT 在此基础上增加了一个步骤：将热点代码（频繁执行的代码）编译为机器码直接执行，从而绕过 Zend VM 的解释执行过程。

### JIT 的工作原理

PHP 8 的 JIT 编译器基于 DynASM（Dynamic Assembler）实现，它能够在运行时将 PHP 字节码转换为本地机器码。JIT 编译器有两种模式：

1. **Tracing JIT**：追踪热点代码路径，对频繁执行的代码段进行编译
2. **Function JIT**：对整个函数进行编译优化

```php
// php.ini 配置
opcache.enable=1
opcache.jit_buffer_size=100M
opcache.jit=1255
```

JIT 配置参数 `opcache.jit=1255` 的含义：
- 第一位（1）：CPU 特定优化标志（0=禁用，1=启用）
- 第二位（2）：寄存器分配策略（0=禁用，1=本地，2=根分配）
- 第三位（5）：JIT 触发策略（0=脚本加载时，1=首次执行时，2=性能分析后，3=热代码，4=文档注释，5=基于追踪）
- 第四位（5）：JIT 优化级别（0=禁用，1=最小，2=内联函数，3=优化，4=内联，5=全优化）

### JIT 性能测试示例

```php
<?php
// 计算密集型任务：计算斐波那契数列
function fibonacci(int $n): int
{
    if ($n <= 1) {
        return $n;
    }
    return fibonacci($n - 1) + fibonacci($n - 2);
}

// 性能测试
$start = microtime(true);
$result = fibonacci(35);
$end = microtime(true);

echo "结果: {$result}\n";
echo "执行时间: " . ($end - $start) . " 秒\n";

// 开启 JIT 后，此类计算密集型任务可获得 2-3 倍性能提升
```

### 数值计算性能对比

```php
<?php
// 矩阵乘法示例
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

// 生成测试矩阵
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

echo "矩阵乘法耗时: {$elapsed} 秒\n";
// JIT 开启后性能提升可达 50% 以上
```

### JIT 适用场景

JIT 对以下场景效果显著：
- 数学计算密集型应用
- 图像处理（如 GD、Imagick 操作）
- 机器学习推理
- 复杂的数据结构操作
- 大量循环迭代

对于 I/O 密集型的 Web 应用（如典型的 CRUD 操作、数据库查询），JIT 的性能提升可能不太明显，因为瓶颈通常在 I/O 等待而非 CPU 计算。

## 属性（Attributes）

### 属性概述

属性是 PHP 8 引入的元数据注解机制，取代了之前的 PHPDoc 注释方式。属性使用 `#[...]` 语法，可以应用于类、方法、函数、参数、属性和类常量。属性提供了类型安全、可通过反射 API 访问的结构化元数据。

### 基本语法

```php
<?php
// 定义属性类
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

// 使用属性
#[Route('/users', 'GET')]
#[Middleware('auth')]
class UserController
{
    #[Route('/users/{id}', 'GET')]
    public function show(int $id): array
    {
        return ['id' => $id, 'name' => '张三'];
    }

    #[Route('/users', 'POST')]
    #[Middleware('csrf')]
    public function store(array $data): array
    {
        return ['status' => 'created'];
    }
}
```

### 读取属性

```php
<?php
// 通过反射读取属性
$reflection = new ReflectionClass(UserController::class);

// 获取类的属性
$classAttributes = $reflection->getAttributes();
foreach ($classAttributes as $attribute) {
    $instance = $attribute->newInstance();
    echo "属性名: " . $attribute->getName() . "\n";

    if ($instance instanceof Route) {
        echo "路径: {$instance->path}, 方法: {$instance->method}\n";
    }
}

// 获取方法的属性
foreach ($reflection->getMethods() as $method) {
    $methodAttributes = $method->getAttributes(Route::class);
    foreach ($methodAttributes as $attribute) {
        $route = $attribute->newInstance();
        echo "方法 {$method->getName()}: {$route->method} {$route->path}\n";
    }
}
```

### 属性的目标限制

```php
<?php
// 限制属性只能用于特定目标
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_FUNCTION)]
class Cache
{
    public function __construct(
        public int $ttl = 3600,
        public string $key = ''
    ) {}
}

// 允许重复使用的属性
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

属性目标常量：
- `Attribute::TARGET_CLASS` - 类
- `Attribute::TARGET_FUNCTION` - 函数
- `Attribute::TARGET_METHOD` - 方法
- `Attribute::TARGET_PROPERTY` - 属性
- `Attribute::TARGET_CLASS_CONSTANT` - 类常量
- `Attribute::TARGET_PARAMETER` - 参数
- `Attribute::TARGET_ALL` - 所有目标
- `Attribute::IS_REPEATABLE` - 允许重复使用

### 实际应用：验证器

```php
<?php
#[Attribute(Attribute::TARGET_PROPERTY)]
class Required
{
    public function __construct(
        public string $message = '此字段为必填项'
    ) {}
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class MaxLength
{
    public function __construct(
        public int $length,
        public string $message = ''
    ) {
        $this->message = $message ?: "长度不能超过 {$length} 个字符";
    }
}

#[Attribute(Attribute::TARGET_PROPERTY)]
class Email
{
    public function __construct(
        public string $message = '请输入有效的邮箱地址'
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
        $this->message = $message ?: "值必须在 {$min} 到 {$max} 之间";
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

    #[Range(min: 18, max: 120, message: '年龄必须在18到120岁之间')]
    public int $age;

    #[MaxLength(200, message: '简介不能超过200字')]
    public string $bio = '';
}

// 验证器实现
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

// 使用示例
$user = new UserDTO();
$user->name = '';
$user->email = 'invalid-email';
$user->age = 15;

$validator = new Validator();
$errors = $validator->validate($user);
print_r($errors);
// 输出：
// Array (
//     [name] => Array ( [0] => 此字段为必填项 )
//     [email] => Array ( [0] => 请输入有效的邮箱地址 )
//     [age] => Array ( [0] => 年龄必须在18到120岁之间 )
// )
```

### 实际应用：路由系统

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

        // 获取类级别的路由前缀
        $classRoutes = $reflection->getAttributes(Route::class);
        $prefix = '';
        if (!empty($classRoutes)) {
            $prefix = $classRoutes[0]->newInstance()->path;
        }

        // 注册方法路由
        foreach ($reflection->getMethods(ReflectionMethod::IS_PUBLIC) as $method) {
            $routeAttributes = $method->getAttributes(Route::class);

            foreach ($routeAttributes as $routeAttr) {
                $route = $routeAttr->newInstance();
                $fullPath = $prefix . $route->path;

                // 收集中间件
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

// 使用示例
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

## 联合类型（Union Types）

### 基本语法

联合类型允许声明一个值可以是多种类型之一，使用 `|` 分隔多个类型。

```php
<?php
class Result
{
    // 属性联合类型
    private int|float $value;
    private string|null $error;

    // 方法参数和返回值联合类型
    public function setValue(int|float $value): void
    {
        $this->value = $value;
    }

    public function getValue(): int|float
    {
        return $this->value;
    }

    // 可以与 null 组合
    public function getError(): string|null
    {
        return $this->error;
    }
}

// 函数联合类型
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

### 联合类型与类层次结构

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
    // 接受实现 Renderable 接口的类或字符串
    public function handle(Renderable|string $response): string
    {
        if ($response instanceof Renderable) {
            return $response->render();
        }
        return $response;
    }

    // 接受多种响应类型
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

### false 和 null 作为独立类型

```php
<?php
class Database
{
    private ?PDO $pdo = null;

    // false 可以作为联合类型的一部分，表示操作失败
    public function find(int $id): array|false
    {
        $stmt = $this->pdo?->prepare("SELECT * FROM users WHERE id = ?");
        $stmt?->execute([$id]);
        $result = $stmt?->fetch(PDO::FETCH_ASSOC);
        return $result ?: false;
    }

    // null 表示可能不存在
    public function findOrNull(int $id): array|null
    {
        $stmt = $this->pdo?->prepare("SELECT * FROM users WHERE id = ?");
        $stmt?->execute([$id]);
        $result = $stmt?->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    // mixed 类型（PHP 8 新增）表示任意类型
    public function getValue(string $key): mixed
    {
        // 可以返回任何类型
        return $this->cache[$key] ?? null;
    }
}

// 使用 false 类型进行判断
$db = new Database();
$user = $db->find(1);

if ($user === false) {
    echo "用户不存在\n";
} else {
    echo "找到用户: {$user['name']}\n";
}
```

### 联合类型的实际应用

```php
<?php
class ConfigManager
{
    private array $config = [];

    // 配置值可以是多种类型
    public function set(string $key, string|int|float|bool|array|null $value): void
    {
        $this->config[$key] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->config[$key] ?? $default;
    }

    // 批量获取，接受数组或字符串
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
    // 日志内容可以是字符串或可转换为字符串的对象
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
$logger->log("普通日志消息");
$logger->log(new LogMessage('ERROR', '发生错误'));
```

## 命名参数（Named Arguments）

### 基本用法

命名参数允许按参数名而非位置传递参数，提高代码可读性。

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

// 传统方式：必须按顺序传递所有参数
$user1 = createUser('张三', 'zhang@example.com', 25, true, 'admin', null, ['read', 'write']);

// 命名参数：只传递需要的参数，顺序无关
$user2 = createUser(
    name: '李四',
    email: 'li@example.com',
    role: 'editor',
    permissions: ['read']
);

// 混合使用位置参数和命名参数（位置参数必须在前）
$user3 = createUser(
    '王五',              // 位置参数
    'wang@example.com',  // 位置参数
    role: 'moderator',   // 命名参数
    age: 30              // 命名参数
);

print_r($user2);
// 输出：
// Array (
//     [name] => 李四
//     [email] => li@example.com
//     [age] => 18
//     [active] => 1
//     [role] => editor
//     [avatar] =>
//     [permissions] => Array ( [0] => read )
// )
```

### 与属性结合使用

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

### 与内置函数结合

```php
<?php
// 许多内置函数也支持命名参数

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

// PHP 8 也支持通过数组传递选项
setcookie('user_session', 'abc123', [
    'expires' => time() + 3600,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Strict'
]);

// json_encode
$json = json_encode(
    value: ['name' => '张三', 'age' => 25],
    flags: JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT,
    depth: 512
);
```

### 与数组展开结合

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

// 从配置数组创建连接
$config = [
    'host' => '192.168.1.100',
    'database' => 'production',
    'username' => 'app_user',
    'password' => 'secret'
];

// 使用展开运算符与命名参数
$connection = configure(...$config);
print_r($connection);

// 覆盖部分配置
$testConnection = configure(
    ...['host' => 'localhost', 'database' => 'test'],
    username: 'test_user',
    password: 'test_pass'
);
```

## Match 表达式

### 基本语法

`match` 是 PHP 8 引入的新表达式，是 `switch` 的增强版本，提供了更简洁、安全的语法。

```php
<?php
// 传统 switch
function getStatusTextOld(int $status): string
{
    switch ($status) {
        case 200:
            $text = '成功';
            break;
        case 404:
            $text = '未找到';
            break;
        case 500:
            $text = '服务器错误';
            break;
        default:
            $text = '未知状态';
    }
    return $text;
}

// 使用 match 表达式
function getStatusText(int $status): string
{
    return match ($status) {
        200 => '成功',
        201 => '已创建',
        204 => '无内容',
        301, 302 => '重定向',
        400 => '错误请求',
        401 => '未授权',
        403 => '禁止访问',
        404 => '未找到',
        500 => '服务器错误',
        502 => '网关错误',
        503 => '服务不可用',
        default => '未知状态'
    };
}

echo getStatusText(404); // 未找到
echo getStatusText(301); // 重定向
```

### Match 与 Switch 的核心区别

```php
<?php
// 1. match 是表达式，返回值；switch 是语句
$result = match ($value) {
    1 => 'one',
    2 => 'two',
    default => 'other'
};

// 2. match 使用严格比较（===），switch 使用松散比较（==）
$value = '1';

// switch 使用松散比较
switch ($value) {
    case 1:          // '1' == 1 为 true
        echo 'switch: 匹配到整数 1';  // 会执行
        break;
}

// match 使用严格比较
$result = match ($value) {
    1 => 'match: 匹配到整数 1',       // 不会匹配
    '1' => 'match: 匹配到字符串 "1"', // 会匹配
    default => 'match: 默认'
};
echo $result; // match: 匹配到字符串 "1"

// 3. match 不需要 break，没有 fall-through 问题
// 4. match 必须穷尽所有情况，否则抛出 UnhandledMatchError
try {
    $result = match (3) {
        1 => 'one',
        2 => 'two'
        // 没有 default，且 3 没有匹配项
    };
} catch (UnhandledMatchError $e) {
    echo "未处理的匹配: " . $e->getMessage();
}
```

### 多条件匹配

```php
<?php
function getSeasonName(int $month): string
{
    return match ($month) {
        3, 4, 5 => '春季',
        6, 7, 8 => '夏季',
        9, 10, 11 => '秋季',
        12, 1, 2 => '冬季',
        default => throw new InvalidArgumentException("无效月份: {$month}")
    };
}

echo getSeasonName(7);  // 夏季
echo getSeasonName(12); // 冬季

// 文件类型判断
function getFileCategory(string $extension): string
{
    return match (strtolower($extension)) {
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp' => '图片',
        'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv' => '视频',
        'mp3', 'wav', 'flac', 'aac', 'ogg' => '音频',
        'doc', 'docx', 'pdf', 'txt', 'rtf', 'odt' => '文档',
        'xls', 'xlsx', 'csv' => '表格',
        'zip', 'rar', '7z', 'tar', 'gz' => '压缩包',
        'php', 'js', 'py', 'java', 'c', 'cpp', 'go', 'rs' => '代码',
        default => '其他'
    };
}
```

### 复杂条件匹配（match(true) 模式）

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
        $order->amount >= 500 => 0.0,                              // 满500免运费
        $order->isPriority && $order->isVip => 15.0,               // VIP优先配送
        $order->isPriority => 25.0,                                 // 优先配送
        $order->isVip && $order->amount >= 200 => 5.0,             // VIP满200优惠
        $order->amount >= 200 => 10.0,                              // 满200减运费
        $order->isVip => 8.0,                                       // VIP 用户优惠
        default => 15.0                                             // 标准运费
    };
}

// 用户权限判断
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

// 数值范围判断
function getScoreGrade(int $score): string
{
    return match (true) {
        $score >= 90 => 'A（优秀）',
        $score >= 80 => 'B（良好）',
        $score >= 70 => 'C（中等）',
        $score >= 60 => 'D（及格）',
        $score >= 0 => 'F（不及格）',
        default => throw new InvalidArgumentException('无效分数')
    };
}
```

### Match 与枚举结合

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
        PaymentMethod::Cash => 0.0,              // 免费
    };

    return round($amount * $rate, 2);
}

function getPaymentLabel(PaymentMethod $method): string
{
    return match ($method) {
        PaymentMethod::CreditCard => '信用卡',
        PaymentMethod::DebitCard => '借记卡',
        PaymentMethod::Alipay => '支付宝',
        PaymentMethod::WechatPay => '微信支付',
        PaymentMethod::BankTransfer => '银行转账',
        PaymentMethod::Cash => '现金',
    };
}

echo getPaymentFee(PaymentMethod::CreditCard, 1000); // 29
echo getPaymentFee(PaymentMethod::Alipay, 1000);     // 6
echo getPaymentLabel(PaymentMethod::WechatPay);      // 微信支付
```

## 构造函数属性提升（Constructor Property Promotion）

### 基本语法

构造函数属性提升是一种简化类定义的语法糖，可以在构造函数参数列表中直接声明和初始化类属性。

```php
<?php
// PHP 7 传统写法
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

// PHP 8 构造函数属性提升
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

$user = new User('张三', 'zhang@example.com', 25);
echo $user->getName();    // 张三
echo $user->isActive();   // true
```

### 混合使用提升属性和普通参数

```php
<?php
class Product
{
    private float $totalPrice;
    private \DateTimeImmutable $createdAt;

    public function __construct(
        public readonly string $name,          // 提升为 readonly 属性
        public readonly float $price,          // 提升为 readonly 属性
        public readonly int $quantity,         // 提升为 readonly 属性
        float $taxRate = 0.13,                 // 普通参数，不会成为属性
        ?string $sku = null                    // 普通参数
    ) {
        // $taxRate 和 $sku 是普通参数，只在构造函数中可用
        $this->totalPrice = $this->price * $this->quantity * (1 + $taxRate);
        $this->createdAt = new \DateTimeImmutable();

        if ($sku !== null) {
            // 可以在这里处理 SKU
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

### 与属性和联合类型结合

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
    title: 'PHP 8 新特性',
    authorId: 'user_123',
    tags: ['PHP', '教程']
);
$article->addTag('PHP8')->publish();
```

### 不同访问修饰符

```php
<?php
class DatabaseConfig
{
    public function __construct(
        public string $host,           // 公开属性
        public int $port,              // 公开属性
        protected string $database,    // 受保护属性
        private string $username,      // 私有属性
        private string $password,      // 私有属性
        public readonly string $driver = 'mysql'  // 只读公开属性
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

echo $config->host;     // localhost（公开，可访问）
echo $config->driver;   // mysql（只读，可访问）
echo $config->getDsn(); // mysql:host=localhost;port=3306;dbname=myapp
// echo $config->password; // 错误：私有属性不可访问
```

## Nullsafe 运算符（Nullsafe Operator）

### 基本语法

Nullsafe 运算符 `?->` 用于安全地访问可能为 null 的对象的属性或方法，避免繁琐的 null 检查。

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

// PHP 7 方式：需要多次 null 检查
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

// PHP 8 方式：使用 nullsafe 运算符
function getCountryName(?User $user): ?string
{
    return $user?->getCompany()?->getAddress()?->getCountry()?->getName();
}

// 测试用例
$user1 = new User('张三');
$user2 = new User(
    '李四',
    new Company('Acme Inc')
);
$user3 = new User(
    '王五',
    new Company(
        'Tech Corp',
        new Address('北京', '中关村大街', null, new Country('中国', 'CN'))
    )
);

echo getCountryName($user1) ?? '未知国家'; // 未知国家
echo getCountryName($user2) ?? '未知国家'; // 未知国家
echo getCountryName($user3);               // 中国
echo getCountryName(null) ?? '无用户';      // 无用户
```

### 方法链与属性访问

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
        // 模拟返回第一条结果
        return ['id' => 1, 'name' => '测试用户'];
    }

    public function get(): array
    {
        // 模拟返回所有结果
        return [
            ['id' => 1, 'name' => '用户1'],
            ['id' => 2, 'name' => '用户2']
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

// 未连接时安全访问
$result = $db->query()?->select('*')?->from('users')?->first();
var_dump($result); // null

// 连接后正常访问
$db->connect();
$result = $db->query()?->select('id', 'name')?->from('users')?->first();
var_dump($result); // ['id' => 1, 'name' => '测试用户']

// 断开连接后再次安全访问
$db->disconnect();
$result = $db->query()?->select('*')?->from('users')?->get();
var_dump($result); // null
```

### 与 null 合并运算符结合

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

// 使用 nullsafe 运算符 + null 合并运算符提供默认值
$host = $app->getConfig()?->getSection('database')?->get('host') ?? 'localhost';
$port = $app->getConfig()?->getSection('database')?->get('port') ?? 3306;

echo "Host: {$host}, Port: {$port}\n"; // Host: localhost, Port: 3306

// 设置配置后
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

### 短路求值特性

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
        // 如果 logger 为 null，后续方法都不会执行
        $this->logger?->log('开始处理')?->log('处理中')?->log('处理完成');
    }

    public function getLogCount(): int
    {
        return $this->logger?->getCallCount() ?? 0;
    }
}

// 没有 logger 的服务
$service1 = new Service();
$service1->process(); // 不会输出任何内容
echo "日志次数: " . $service1->getLogCount() . "\n"; // 日志次数: 0

// 有 logger 的服务
$service2 = new Service(new Logger());
$service2->process();
// 输出：
// [1] 开始处理
// [2] 处理中
// [3] 处理完成
echo "日志次数: " . $service2->getLogCount() . "\n"; // 日志次数: 3
```

## 其他重要新特性

### 新的字符串函数

```php
<?php
$string = 'Hello, World! Welcome to PHP 8.';

// str_contains - 检查字符串是否包含子串
if (str_contains($string, 'World')) {
    echo "包含 'World'\n";
}

// str_starts_with - 检查字符串是否以指定子串开头
if (str_starts_with($string, 'Hello')) {
    echo "以 'Hello' 开头\n";
}

// str_ends_with - 检查字符串是否以指定子串结尾
if (str_ends_with($string, '8.')) {
    echo "以 '8.' 结尾\n";
}

// 实际应用：URL 路由匹配
function matchRoute(string $path, string $pattern): bool
{
    // 检查是否是 API 路由
    if (str_starts_with($path, '/api/')) {
        echo "这是一个 API 路由\n";
    }

    // 检查是否是 JSON 请求
    if (str_ends_with($path, '.json')) {
        echo "请求 JSON 格式\n";
    }

    // 检查是否包含版本号
    if (str_contains($path, '/v2/')) {
        echo "使用 API v2\n";
    }

    return true;
}

matchRoute('/api/v2/users.json', '/api/users');

// PHP 7 需要这样写
// if (strpos($string, 'World') !== false) { ... }
// if (substr($string, 0, 5) === 'Hello') { ... }
// if (substr($string, -2) === '8.') { ... }
```

### fdiv 函数

```php
<?php
// fdiv - 安全的浮点数除法，不会抛出 DivisionByZeroError
$a = 10.0;
$b = 0.0;

// 传统除法会产生警告
// $result = $a / $b; // Warning: Division by zero

// fdiv 返回 INF、-INF 或 NAN
echo fdiv(10, 0);   // INF
echo fdiv(-10, 0);  // -INF
echo fdiv(0, 0);    // NAN

// 实际应用：计算百分比
function calculatePercentage(float $part, float $total): float
{
    $result = fdiv($part, $total) * 100;

    // 处理特殊情况
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

### 弱引用映射（WeakMap）

```php
<?php
// WeakMap 允许将对象作为键，当对象被销毁时，对应的条目自动删除
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

// 创建对象并缓存
$entity1 = new Entity(1);
$entity2 = new Entity(2);

$cache->set($entity1, ['computed' => 'value1']);
$cache->set($entity2, ['computed' => 'value2']);

echo "缓存条目数: " . $cache->count() . "\n"; // 2
echo $cache->has($entity1) ? "存在\n" : "不存在\n"; // 存在

// 销毁对象时，WeakMap 中的条目自动删除
unset($entity1);
echo "缓存条目数: " . $cache->count() . "\n"; // 1

// 适用场景：为对象附加元数据而不增加对象本身的引用计数
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

### mixed 类型

```php
<?php
// mixed 表示任意类型，等同于 object|resource|array|string|int|float|bool|null

class Container
{
    private array $bindings = [];

    // 接受任意类型的值
    public function bind(string $key, mixed $value): void
    {
        $this->bindings[$key] = $value;
    }

    // 返回任意类型的值
    public function get(string $key): mixed
    {
        return $this->bindings[$key] ?? null;
    }
}

// 通用处理函数
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

### 静态返回类型

```php
<?php
// static 返回类型用于流式接口，确保子类方法返回正确的类型

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

// static 返回类型确保链式调用返回正确的类型
$admin = (new AdminBuilder())
    ->setName('管理员')
    ->setEmail('admin@example.com')
    ->setAge(30)
    ->setPermissions(['read', 'write', 'delete'])
    ->merge(['department' => 'IT'])
    ->build();

print_r($admin);
// Array (
//     [name] => 管理员
//     [email] => admin@example.com
//     [age] => 30
//     [permissions] => Array ( [0] => read [1] => write [2] => delete )
//     [department] => IT
// )
```

### throw 表达式

```php
<?php
// throw 现在可以用作表达式，可以在更多上下文中使用

class Validator
{
    // 在箭头函数中使用
    public function required(string $field): \Closure
    {
        return fn($value) => $value !== '' && $value !== null
            ? $value
            : throw new \InvalidArgumentException("{$field} 是必填项");
    }

    // 在三元运算符中使用
    public function validate(?string $value, string $fieldName): string
    {
        return $value !== null && $value !== ''
            ? $value
            : throw new \InvalidArgumentException("{$fieldName} 不能为空");
    }

    // 在 null 合并运算符中使用
    public function getRequired(array $data, string $key): mixed
    {
        return $data[$key] ?? throw new \RuntimeException("缺少必需的键: {$key}");
    }

    // 在 match 表达式中使用
    public function validateStatus(string $status): string
    {
        return match ($status) {
            'pending', 'processing', 'completed' => $status,
            'cancelled' => throw new \LogicException('已取消的状态不能处理'),
            default => throw new \InvalidArgumentException("无效状态: {$status}")
        };
    }
}

$validator = new Validator();

// 测试箭头函数中的 throw
$requiredName = $validator->required('name');
try {
    $requiredName(''); // 会抛出异常
} catch (\InvalidArgumentException $e) {
    echo $e->getMessage() . "\n"; // name 是必填项
}

// 测试 null 合并中的 throw
try {
    $validator->getRequired(['name' => 'test'], 'email');
} catch (\RuntimeException $e) {
    echo $e->getMessage() . "\n"; // 缺少必需的键: email
}

// 测试 match 中的 throw
try {
    $validator->validateStatus('invalid');
} catch (\InvalidArgumentException $e) {
    echo $e->getMessage() . "\n"; // 无效状态: invalid
}
```

### 可变参数的尾部逗号

```php
<?php
// PHP 8 允许在函数参数、闭包 use 列表等位置使用尾部逗号

// 函数参数中的尾部逗号
function createConfig(
    string $host,
    int $port,
    string $database,
    string $username,
    string $password,  // 尾部逗号
) {
    return compact('host', 'port', 'database', 'username', 'password');
}

// 闭包 use 列表中的尾部逗号
$prefix = 'user_';
$suffix = '_cache';

$createKey = function (string $name) use (
    $prefix,
    $suffix,  // 尾部逗号
) {
    return $prefix . $name . $suffix;
};

echo $createKey('profile'); // user_profile_cache

// 属性参数中的尾部逗号
#[Attribute]
class Validate
{
    public function __construct(
        public array $rules,
        public string $message = '',
        public bool $bail = false,  // 尾部逗号
    ) {}
}
```

## 升级到 PHP 8 的注意事项

### 不兼容的变更

```php
<?php
// 1. 比较运算符变更（影响较大）
// PHP 7: 0 == "foo" 为 true（数字与字符串比较）
// PHP 8: 0 == "foo" 为 false（字符串转为数字比较）

$value = 0;
$string = "hello";

// PHP 8 行为
if ($value == $string) {
    echo "相等"; // PHP 7 会执行这里
} else {
    echo "不相等"; // PHP 8 会执行这里
}

// 2. @ 错误抑制运算符不再抑制致命错误
// 以下代码在 PHP 8 中仍会抛出 TypeError
// @strlen([]);

// 3. 反射 API 变更
$reflectionMethod = new ReflectionMethod(SomeClass::class, 'someMethod');
$parameters = $reflectionMethod->getParameters();

foreach ($parameters as $param) {
    // PHP 7: $param->getClass()
    // PHP 8: 使用 $param->getType()
    $type = $param->getType();
    if ($type instanceof ReflectionNamedType && !$type->isBuiltin()) {
        echo "类类型: " . $type->getName() . "\n";
    }
}

// 4. 内部函数严格类型检查
// PHP 7: strlen([]); // 警告 + 返回 null
// PHP 8: strlen([]); // TypeError

// 5. 资源类型变为对象
$file = fopen('test.txt', 'r');
// PHP 7: is_resource($file) 为 true
// PHP 8 某些资源变为对象，如 CurlHandle, GdImage 等

// 6. 默认错误报告级别变更
// PHP 8 默认 error_reporting = E_ALL
```

### 已弃用的特性

```php
<?php
// 1. 必需参数不能在可选参数之后
// 已弃用（PHP 8.0 警告，未来版本会报错）
function badFunction($optional = null, $required) { } // 警告

// 正确写法
function goodFunction($required, $optional = null) { }

// 2. 隐式不兼容的 float 到 int 转换
$float = 1.9;
// 已弃用
// $int = (int) $float; // 会丢失小数部分，建议使用 floor/ceil/round

// 3. create_function() 已移除
// PHP 7: create_function('$a', 'return $a * 2;');
// PHP 8: 使用匿名函数
$double = fn($a) => $a * 2;

// 4. each() 函数已移除
// PHP 7: while (list($key, $value) = each($array)) { }
// PHP 8: foreach ($array as $key => $value) { }

// 5. Serializable 接口已弃用（PHP 8.1）
// 使用 __serialize() 和 __unserialize() 魔术方法代替
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

### 升级建议

```php
<?php
// 1. 启用严格模式
declare(strict_types=1);

// 2. 使用更现代的类型声明
class ModernClass
{
    // 使用构造函数属性提升
    public function __construct(
        private readonly string $name,
        private int|float $value,
        private ?array $options = null
    ) {}

    // 使用联合类型和返回类型
    public function process(string|array $input): array|false
    {
        // 使用 match 替代 switch
        return match (gettype($input)) {
            'string' => [$input],
            'array' => $input,
            default => false
        };
    }
}

// 3. 使用 nullsafe 运算符简化代码
$result = $object?->method()?->property ?? 'default';

// 4. 使用属性替代 PHPDoc 注解
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

## 总结

PHP 8 带来了许多令人兴奋的新特性，这些特性不仅提升了语言的性能，还极大地改善了开发体验：

| 特性 | 主要优势 | 使用场景 |
|------|----------|----------|
| JIT 编译器 | 计算密集型任务性能提升 2-3 倍 | 数学计算、图像处理、机器学习 |
| 属性（Attributes） | 原生元数据支持，类型安全 | 路由定义、验证规则、ORM 映射 |
| 联合类型 | 更精确的类型声明 | API 参数、配置处理、多态返回值 |
| 命名参数 | 提高代码可读性 | 多参数函数、配置传递 |
| Match 表达式 | 简洁安全的条件分支 | 状态处理、类型转换、映射 |
| 构造函数属性提升 | 减少样板代码 | DTO、实体类、值对象 |
| Nullsafe 运算符 | 安全的对象链访问 | 嵌套对象访问、可选关联 |

### 迁移建议

1. **逐步升级**：先升级到 PHP 7.4，解决所有弃用警告，然后再升级到 PHP 8
2. **启用严格模式**：在所有文件中添加 `declare(strict_types=1);`
3. **更新依赖**：确保所有 Composer 包支持 PHP 8
4. **运行测试**：确保有足够的测试覆盖率，特别是类型相关的测试
5. **使用静态分析**：PHPStan、Psalm 等工具可以发现潜在的类型问题
6. **渐进式采用**：在新代码中优先使用 PHP 8 特性，逐步重构旧代码

## 扩展阅读

- [PHP 8.0 官方迁移指南](https://www.php.net/manual/zh/migration80.php)
- [PHP 8.1 新特性](https://www.php.net/releases/8.1/zh.php) - 枚举、Fibers、readonly 属性等
- [PHP 8.2 新特性](https://www.php.net/releases/8.2/zh.php) - readonly 类、DNF 类型等
- [PHP 8.3 新特性](https://www.php.net/releases/8.3/zh.php) - 类型化类常量、动态类常量获取等
- [PHP RFC 索引](https://wiki.php.net/rfc) - 了解 PHP 语言的演进方向
