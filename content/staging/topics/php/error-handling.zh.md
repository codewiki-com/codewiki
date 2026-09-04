---
title: PHP 错误和异常处理
description: 掌握 PHP 错误和异常处理，包括错误级别、异常类和自定义错误处理器
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - 错误处理
  - 异常
status: imported
origin: old/src/content/docs/php/error-handling.zh.md
divergence: 0.255
issues: []
legacy:
  category: PHP
  subcategory: Core Concepts
  order: 10
  lastUpdated: 2026-01-07
---

有效的错误和异常处理对于构建健壮、可维护的 PHP 应用程序至关重要。本综合指南涵盖从基本错误类型到高级异常处理策略和自定义错误处理器的所有内容。

## 理解 PHP 错误

PHP 错误发生在脚本执行过程中出现问题时。与异常不同，错误历来是 PHP 报告问题的主要方式。理解错误和异常之间的区别对于有效调试和错误管理至关重要。

### 错误与异常

```php
<?php
// 错误 - 报告问题的传统方式
// 通常由编码错误或运行时问题引起
echo $undefinedVariable; // Notice: Undefined variable

// 异常 - 现代的面向对象错误处理
// 允许结构化处理和恢复
throw new Exception("发生了错误");
?>
```

**主要区别：**

| 方面 | 错误 | 异常 |
|--------|--------|------------|
| 来源 | 引擎级别或手动触发 | 在代码中显式抛出 |
| 处理 | 错误处理器 | Try-catch 块 |
| 恢复 | 选项有限 | 完全控制恢复 |
| 传播 | 取决于错误级别 | 沿调用栈向上冒泡 |
| 信息 | 错误消息、文件、行号 | 完整堆栈跟踪、自定义数据 |

### 错误生命周期

当 PHP 中发生错误时，会发生以下序列：

1. PHP 检测到错误条件
2. 调用错误处理器（默认或自定义）
3. 可选择记录错误
4. 根据错误严重性，脚本可能继续或终止

```php
<?php
// 错误生命周期演示
function demonstrateErrors() {
    // 这会触发 notice（非致命）
    $value = $undefined; // Notice: Undefined variable

    echo "脚本在 notice 后继续\n";

    // 这会触发 warning（非致命）
    include "nonexistent.php"; // Warning: Failed to open stream

    echo "脚本在 warning 后继续\n";

    // 这会触发致命错误（脚本停止）
    // nonExistentFunction(); // Fatal error: Uncaught Error
}

demonstrateErrors();
?>
```

## 错误级别和类型

PHP 定义了多个错误级别，每个级别代表不同严重程度的问题。理解这些级别有助于为不同环境配置适当的错误处理。

### 错误级别常量

```php
<?php
// 错误级别常量及其值
$errorLevels = [
    'E_ERROR'             => E_ERROR,             // 1 - 致命运行时错误
    'E_WARNING'           => E_WARNING,           // 2 - 运行时警告
    'E_PARSE'             => E_PARSE,             // 4 - 编译时解析错误
    'E_NOTICE'            => E_NOTICE,            // 8 - 运行时通知
    'E_CORE_ERROR'        => E_CORE_ERROR,        // 16 - 启动时致命错误
    'E_CORE_WARNING'      => E_CORE_WARNING,      // 32 - 启动时警告
    'E_COMPILE_ERROR'     => E_COMPILE_ERROR,     // 64 - 致命编译时错误
    'E_COMPILE_WARNING'   => E_COMPILE_WARNING,   // 128 - 编译时警告
    'E_USER_ERROR'        => E_USER_ERROR,        // 256 - 用户生成的错误
    'E_USER_WARNING'      => E_USER_WARNING,      // 512 - 用户生成的警告
    'E_USER_NOTICE'       => E_USER_NOTICE,       // 1024 - 用户生成的通知
    'E_STRICT'            => E_STRICT,            // 2048 - 编码标准警告
    'E_RECOVERABLE_ERROR' => E_RECOVERABLE_ERROR, // 4096 - 可捕获的致命错误
    'E_DEPRECATED'        => E_DEPRECATED,        // 8192 - 运行时弃用通知
    'E_USER_DEPRECATED'   => E_USER_DEPRECATED,   // 16384 - 用户生成的弃用
    'E_ALL'               => E_ALL,               // 所有错误和警告
];

foreach ($errorLevels as $name => $value) {
    printf("%-20s = %d\n", $name, $value);
}
?>
```

### 致命错误

致命错误会立即停止脚本执行。这些表示 PHP 无法恢复的严重问题。

```php
<?php
// E_ERROR - 致命运行时错误
// 示例：调用未定义的函数
// undefinedFunction(); // Fatal error

// E_PARSE - 解析错误（语法错误）
// 示例：缺少分号
// echo "Hello" // Parse error

// E_CORE_ERROR - PHP 启动时的致命错误
// 当 PHP 无法加载所需扩展时发生

// E_COMPILE_ERROR - 致命编译时错误
// 当脚本无法编译时发生

// 触发用户致命错误的示例
function processData($data) {
    if (empty($data)) {
        trigger_error("数据不能为空", E_USER_ERROR);
    }
    return count($data);
}

// 这将停止执行
// processData([]); // Fatal error: 数据不能为空
?>
```

### 警告

警告表示潜在问题，但允许脚本继续执行。

```php
<?php
// E_WARNING - 运行时警告
// 非致命错误，脚本继续

// 示例 1：文件未找到
$content = file_get_contents("nonexistent.txt");
// Warning: file_get_contents(): Failed to open stream

// 示例 2：除以零（PHP 7.x 警告，PHP 8+ DivisionByZeroError）
// $result = 10 / 0;

// 示例 3：无效的函数参数
$array = [3, 1, 4, 1, 5];
sort($array, INVALID_CONSTANT);
// Warning: sort(): Invalid sort flag

// E_USER_WARNING - 用户生成的警告
function validateAge($age) {
    if ($age < 0) {
        trigger_error("年龄不能为负数", E_USER_WARNING);
        return false;
    }
    return true;
}

validateAge(-5); // Warning: 年龄不能为负数
echo "脚本继续\n";
?>
```

### 通知

通知是关于可能导致问题的潜在问题的信息性消息。

```php
<?php
// E_NOTICE - 运行时通知
// 表示应该修复的潜在错误

// 示例 1：未定义的变量
echo $undefinedVar;
// Notice: Undefined variable: undefinedVar

// 示例 2：未定义的数组键
$array = ['name' => 'John'];
echo $array['age'];
// Notice: Undefined index: age (PHP 7.x)
// Warning: Undefined array key "age" (PHP 8+)

// 示例 3：未定义的常量
// echo UNDEFINED_CONSTANT;
// Notice: Use of undefined constant (PHP 7.x)
// PHP 8+ 中是 Error

// E_USER_NOTICE - 用户生成的通知
function logDebug($message) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        trigger_error("Debug: $message", E_USER_NOTICE);
    }
}

define('DEBUG_MODE', true);
logDebug("处理开始"); // Notice: Debug: 处理开始
?>
```

### 弃用通知

弃用通知警告将在未来 PHP 版本中删除的功能。

```php
<?php
// E_DEPRECATED - PHP 弃用通知
// 表示将被删除的功能

// 示例：使用已弃用的函数（因 PHP 版本而异）
// $encoded = utf8_encode("Hello"); // 在 PHP 8.2 中已弃用

// E_USER_DEPRECATED - 用户生成的弃用
/**
 * @deprecated 2.0.0 请使用 newMethod() 代替
 */
function oldMethod() {
    trigger_error(
        "oldMethod() 已弃用，请使用 newMethod() 代替",
        E_USER_DEPRECATED
    );
    return newMethod();
}

function newMethod() {
    return "新实现";
}

$result = oldMethod(); // Deprecated: oldMethod() 已弃用
echo $result;
?>
```

## 错误配置

正确配置错误处理对于开发和生产环境都至关重要。

### php.ini 设置

```ini
; 开发环境设置
error_reporting = E_ALL
display_errors = On
display_startup_errors = On
log_errors = On
error_log = /var/log/php/error.log
html_errors = On

; 生产环境设置
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log
html_errors = Off
```

### 运行时配置

```php
<?php
// 在运行时设置错误报告级别
error_reporting(E_ALL);

// 显示错误（仅限开发！）
ini_set('display_errors', '1');

// 将错误记录到文件
ini_set('log_errors', '1');
ini_set('error_log', '/var/log/php/application.log');

// 检查当前设置
echo "错误报告: " . error_reporting() . "\n";
echo "显示错误: " . ini_get('display_errors') . "\n";
echo "记录错误: " . ini_get('log_errors') . "\n";
echo "错误日志: " . ini_get('error_log') . "\n";

// 常见错误报告配置
// 报告所有错误
error_reporting(E_ALL);

// 报告除通知外的所有错误
error_reporting(E_ALL & ~E_NOTICE);

// 报告除通知和弃用外的所有错误
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

// 只报告错误和警告
error_reporting(E_ERROR | E_WARNING);

// 关闭所有错误报告（不推荐）
error_reporting(0);
?>
```

### 基于环境的配置

```php
<?php
// 定义环境
define('ENVIRONMENT', getenv('APP_ENV') ?: 'production');

// 根据环境配置
switch (ENVIRONMENT) {
    case 'development':
        error_reporting(E_ALL);
        ini_set('display_errors', '1');
        ini_set('display_startup_errors', '1');
        break;

    case 'testing':
        error_reporting(E_ALL);
        ini_set('display_errors', '0');
        ini_set('log_errors', '1');
        break;

    case 'production':
        error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
        ini_set('display_errors', '0');
        ini_set('display_startup_errors', '0');
        ini_set('log_errors', '1');
        break;

    default:
        // 最安全的默认值
        error_reporting(E_ALL);
        ini_set('display_errors', '0');
}
?>
```

## 异常处理

异常提供了使用 try-catch 块处理错误的结构化方式。PHP 7+ 通过 Throwable 接口显著改进了异常处理。

### Throwable 层次结构

```php
<?php
/*
Throwable (接口)
├── Error (内部 PHP 错误，PHP 7+)
│   ├── ArithmeticError
│   │   └── DivisionByZeroError
│   ├── AssertionError
│   ├── CompileError
│   │   └── ParseError
│   ├── TypeError
│   │   └── ArgumentCountError
│   ├── ValueError (PHP 8+)
│   ├── UnhandledMatchError (PHP 8+)
│   └── FiberError (PHP 8.1+)
└── Exception (用户层异常)
    ├── LogicException
    │   ├── BadFunctionCallException
    │   │   └── BadMethodCallException
    │   ├── DomainException
    │   ├── InvalidArgumentException
    │   ├── LengthException
    │   └── OutOfRangeException
    └── RuntimeException
        ├── OutOfBoundsException
        ├── OverflowException
        ├── RangeException
        ├── UnderflowException
        └── UnexpectedValueException
*/
?>
```

### 基本 Try-Catch

```php
<?php
// 基本异常处理
function divide($a, $b) {
    if ($b === 0) {
        throw new InvalidArgumentException("不允许除以零");
    }
    return $a / $b;
}

try {
    $result = divide(10, 0);
    echo "结果: $result";
} catch (InvalidArgumentException $e) {
    echo "错误: " . $e->getMessage() . "\n";
    echo "文件: " . $e->getFile() . "\n";
    echo "行号: " . $e->getLine() . "\n";
}

// 脚本在 catch 后继续
echo "执行继续\n";
?>
```

### 多个 Catch 块

```php
<?php
function processInput($input) {
    if (!is_string($input)) {
        throw new TypeError("输入必须是字符串");
    }
    if (empty($input)) {
        throw new InvalidArgumentException("输入不能为空");
    }
    if (strlen($input) > 100) {
        throw new LengthException("输入过长");
    }
    return strtoupper($input);
}

try {
    $result = processInput("");
} catch (TypeError $e) {
    echo "类型错误: " . $e->getMessage() . "\n";
} catch (InvalidArgumentException $e) {
    echo "无效参数: " . $e->getMessage() . "\n";
} catch (LengthException $e) {
    echo "长度错误: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    // 捕获任何其他异常
    echo "一般错误: " . $e->getMessage() . "\n";
}
?>
```

### 捕获多种异常类型（PHP 7.1+）

```php
<?php
function riskyOperation($type) {
    switch ($type) {
        case 'invalid':
            throw new InvalidArgumentException("无效参数");
        case 'runtime':
            throw new RuntimeException("运行时错误");
        case 'type':
            throw new TypeError("类型错误");
        default:
            return "成功";
    }
}

try {
    $result = riskyOperation('invalid');
} catch (InvalidArgumentException | RuntimeException $e) {
    // 以相同方式处理两种异常类型
    echo "捕获: " . get_class($e) . " - " . $e->getMessage() . "\n";
} catch (TypeError $e) {
    echo "发生类型错误\n";
}
?>
```

### Finally 块

finally 块无论是否抛出或捕获异常都会执行。

```php
<?php
class DatabaseConnection {
    private $connected = false;

    public function connect() {
        $this->connected = true;
        echo "已连接到数据库\n";
    }

    public function disconnect() {
        $this->connected = false;
        echo "已断开数据库连接\n";
    }

    public function query($sql) {
        if (!$this->connected) {
            throw new RuntimeException("未连接到数据库");
        }
        if (empty($sql)) {
            throw new InvalidArgumentException("查询不能为空");
        }
        echo "执行: $sql\n";
        return true;
    }
}

$db = new DatabaseConnection();

try {
    $db->connect();
    $db->query("SELECT * FROM users");
    $db->query(""); // 这会抛出异常
} catch (InvalidArgumentException $e) {
    echo "查询错误: " . $e->getMessage() . "\n";
} catch (RuntimeException $e) {
    echo "连接错误: " . $e->getMessage() . "\n";
} finally {
    // 始终断开连接，即使发生异常
    $db->disconnect();
    echo "清理完成\n";
}
?>
```

### 异常属性和方法

```php
<?php
try {
    throw new Exception("发生了错误", 500);
} catch (Exception $e) {
    // 获取异常信息
    echo "消息: " . $e->getMessage() . "\n";     // 错误消息
    echo "代码: " . $e->getCode() . "\n";        // 错误代码
    echo "文件: " . $e->getFile() . "\n";        // 抛出位置的文件
    echo "行号: " . $e->getLine() . "\n";        // 行号
    echo "跟踪:\n" . $e->getTraceAsString() . "\n"; // 堆栈跟踪字符串

    // 获取跟踪数组
    $trace = $e->getTrace();
    foreach ($trace as $index => $frame) {
        printf("#%d %s(%d): %s%s%s()\n",
            $index,
            $frame['file'] ?? 'unknown',
            $frame['line'] ?? 0,
            $frame['class'] ?? '',
            $frame['type'] ?? '',
            $frame['function']
        );
    }
}
?>
```

### 重新抛出异常

```php
<?php
function lowLevelOperation() {
    // 模拟底层错误
    throw new RuntimeException("数据库连接失败");
}

function midLevelOperation() {
    try {
        lowLevelOperation();
    } catch (RuntimeException $e) {
        // 记录原始错误
        error_log($e->getMessage());

        // 用更多上下文重新抛出
        throw new Exception(
            "中层操作失败: " . $e->getMessage(),
            0,
            $e // 前一个异常
        );
    }
}

function highLevelOperation() {
    try {
        midLevelOperation();
    } catch (Exception $e) {
        echo "错误: " . $e->getMessage() . "\n";

        // 访问原始异常
        if ($previous = $e->getPrevious()) {
            echo "原因: " . $previous->getMessage() . "\n";
        }
    }
}

highLevelOperation();
?>
```

### 捕获错误（PHP 7+）

```php
<?php
// PHP 7+ 允许捕获 Error 和 Exception

function callUndefined() {
    return undefinedFunction();
}

try {
    callUndefined();
} catch (Error $e) {
    echo "捕获到错误: " . $e->getMessage() . "\n";
}

// 同时捕获 Error 和 Exception
try {
    // 可能抛出 Error 或 Exception
    $value = random_int(0, 1) ? undefinedFunction() : throw new Exception("随机异常");
} catch (Throwable $e) {
    // 捕获 Error 和 Exception
    echo "捕获: " . get_class($e) . " - " . $e->getMessage() . "\n";
}

// 特定错误类型
try {
    // TypeError
    $array = [];
    $array->method(); // 在非对象上调用方法
} catch (TypeError $e) {
    echo "类型错误: " . $e->getMessage() . "\n";
}

try {
    // ArgumentCountError (PHP 7.1+)
    function requiresArgs($a, $b, $c) {
        return $a + $b + $c;
    }
    requiresArgs(1); // 缺少参数
} catch (ArgumentCountError $e) {
    echo "参数数量错误: " . $e->getMessage() . "\n";
}
?>
```

## 自定义异常类

创建自定义异常类可以实现更具体的错误处理和附加上下文。

### 基本自定义异常

```php
<?php
class ValidationException extends Exception {
    private array $errors;

    public function __construct(
        string $message,
        array $errors = [],
        int $code = 0,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errors = $errors;
    }

    public function getErrors(): array {
        return $this->errors;
    }
}

function validateUser(array $data): void {
    $errors = [];

    if (empty($data['email'])) {
        $errors['email'] = '邮箱是必填项';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = '邮箱格式无效';
    }

    if (empty($data['password'])) {
        $errors['password'] = '密码是必填项';
    } elseif (strlen($data['password']) < 8) {
        $errors['password'] = '密码必须至少 8 个字符';
    }

    if (!empty($errors)) {
        throw new ValidationException('验证失败', $errors);
    }
}

try {
    validateUser([
        'email' => 'invalid-email',
        'password' => '123'
    ]);
} catch (ValidationException $e) {
    echo "错误: " . $e->getMessage() . "\n";
    echo "验证错误:\n";
    foreach ($e->getErrors() as $field => $error) {
        echo "  - $field: $error\n";
    }
}
?>
```

### HTTP 异常类

```php
<?php
abstract class HttpException extends Exception {
    protected int $statusCode;
    protected array $headers = [];

    public function getStatusCode(): int {
        return $this->statusCode;
    }

    public function getHeaders(): array {
        return $this->headers;
    }

    public function setHeaders(array $headers): void {
        $this->headers = $headers;
    }
}

class NotFoundException extends HttpException {
    protected int $statusCode = 404;

    public function __construct(string $message = "资源未找到") {
        parent::__construct($message, 404);
    }
}

class UnauthorizedException extends HttpException {
    protected int $statusCode = 401;

    public function __construct(string $message = "未授权") {
        parent::__construct($message, 401);
        $this->headers['WWW-Authenticate'] = 'Bearer';
    }
}

class ForbiddenException extends HttpException {
    protected int $statusCode = 403;

    public function __construct(string $message = "禁止访问") {
        parent::__construct($message, 403);
    }
}

class BadRequestException extends HttpException {
    protected int $statusCode = 400;

    public function __construct(string $message = "错误的请求") {
        parent::__construct($message, 400);
    }
}

// 在控制器中使用
class UserController {
    private array $users = [
        1 => ['name' => 'John', 'email' => 'john@example.com'],
        2 => ['name' => 'Jane', 'email' => 'jane@example.com'],
    ];

    public function getUser(int $id): array {
        if (!isset($this->users[$id])) {
            throw new NotFoundException("未找到 ID 为 $id 的用户");
        }
        return $this->users[$id];
    }
}

// HTTP 异常处理器
function handleHttpException(HttpException $e): void {
    http_response_code($e->getStatusCode());

    foreach ($e->getHeaders() as $header => $value) {
        header("$header: $value");
    }

    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        'code' => $e->getStatusCode()
    ]);
}

try {
    $controller = new UserController();
    $user = $controller->getUser(99);
} catch (HttpException $e) {
    handleHttpException($e);
}
?>
```

### 领域特定异常

```php
<?php
// 基础应用异常
class ApplicationException extends Exception {
    protected string $errorCode;

    public function __construct(
        string $message,
        string $errorCode = 'APP_ERROR',
        int $code = 0,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorCode = $errorCode;
    }

    public function getErrorCode(): string {
        return $this->errorCode;
    }
}

// 支付相关异常
class PaymentException extends ApplicationException {
    private ?string $transactionId;

    public function __construct(
        string $message,
        string $errorCode = 'PAYMENT_ERROR',
        ?string $transactionId = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $errorCode, 0, $previous);
        $this->transactionId = $transactionId;
    }

    public function getTransactionId(): ?string {
        return $this->transactionId;
    }
}

class InsufficientFundsException extends PaymentException {
    private float $required;
    private float $available;

    public function __construct(
        float $required,
        float $available,
        ?string $transactionId = null
    ) {
        parent::__construct(
            sprintf(
                "余额不足：需要 %.2f，可用 %.2f",
                $required,
                $available
            ),
            'INSUFFICIENT_FUNDS',
            $transactionId
        );
        $this->required = $required;
        $this->available = $available;
    }

    public function getRequired(): float {
        return $this->required;
    }

    public function getAvailable(): float {
        return $this->available;
    }

    public function getShortfall(): float {
        return $this->required - $this->available;
    }
}

class CardDeclinedException extends PaymentException {
    private string $declineCode;

    public function __construct(
        string $declineCode,
        ?string $transactionId = null
    ) {
        $messages = [
            'do_not_honor' => '银行拒绝了该卡',
            'insufficient_funds' => '卡上余额不足',
            'expired_card' => '卡已过期',
            'invalid_cvv' => '安全码无效',
        ];

        parent::__construct(
            $messages[$declineCode] ?? '卡被拒绝',
            'CARD_DECLINED',
            $transactionId
        );
        $this->declineCode = $declineCode;
    }

    public function getDeclineCode(): string {
        return $this->declineCode;
    }
}

// 使用
class PaymentProcessor {
    public function processPayment(float $amount, array $card): void {
        // 模拟支付处理
        $balance = 50.00; // 模拟账户余额

        if ($amount > $balance) {
            throw new InsufficientFundsException(
                $amount,
                $balance,
                'TXN_' . uniqid()
            );
        }

        // 模拟卡被拒绝
        if ($card['number'] === '4000000000000002') {
            throw new CardDeclinedException(
                'do_not_honor',
                'TXN_' . uniqid()
            );
        }

        echo "支付 $amount 处理成功\n";
    }
}

try {
    $processor = new PaymentProcessor();
    $processor->processPayment(100.00, ['number' => '4111111111111111']);
} catch (InsufficientFundsException $e) {
    echo "支付失败: " . $e->getMessage() . "\n";
    echo "您还需要 ¥" . $e->getShortfall() . "\n";
} catch (CardDeclinedException $e) {
    echo "卡被拒绝: " . $e->getMessage() . "\n";
    echo "拒绝代码: " . $e->getDeclineCode() . "\n";
} catch (PaymentException $e) {
    echo "支付错误: " . $e->getMessage() . "\n";
    if ($transactionId = $e->getTransactionId()) {
        echo "交易 ID: $transactionId\n";
    }
}
?>
```

## 自定义错误处理器

自定义错误处理器允许您控制 PHP 错误的处理方式。

### 设置自定义错误处理器

```php
<?php
function customErrorHandler(
    int $errno,
    string $errstr,
    string $errfile,
    int $errline
): bool {
    // 不执行 PHP 内部错误处理器
    $return = true;

    $errorTypes = [
        E_ERROR => '错误',
        E_WARNING => '警告',
        E_NOTICE => '通知',
        E_USER_ERROR => '用户错误',
        E_USER_WARNING => '用户警告',
        E_USER_NOTICE => '用户通知',
        E_STRICT => '严格',
        E_DEPRECATED => '已弃用',
        E_USER_DEPRECATED => '用户弃用',
    ];

    $errorType = $errorTypes[$errno] ?? '未知错误';

    // 记录错误
    $message = sprintf(
        "[%s] %s: %s 在 %s 第 %d 行",
        date('Y-m-d H:i:s'),
        $errorType,
        $errstr,
        $errfile,
        $errline
    );

    error_log($message);

    // 对于致命用户错误，您可能需要终止
    if ($errno === E_USER_ERROR) {
        echo "发生了严重错误。请稍后再试。\n";
        exit(1);
    }

    return $return;
}

// 设置自定义错误处理器
set_error_handler('customErrorHandler');

// 测试处理器
echo $undefined; // 触发 notice
trigger_error("这是一个警告", E_USER_WARNING);
trigger_error("这是一个通知", E_USER_NOTICE);

// 恢复默认错误处理器
restore_error_handler();
?>
```

### 将错误转换为异常

```php
<?php
class ErrorException extends Exception {
    protected int $severity;

    public function __construct(
        string $message,
        int $code,
        int $severity,
        string $filename,
        int $lineno,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->severity = $severity;
        $this->file = $filename;
        $this->line = $lineno;
    }

    public function getSeverity(): int {
        return $this->severity;
    }
}

function errorToExceptionHandler(
    int $errno,
    string $errstr,
    string $errfile,
    int $errline
): bool {
    // 检查错误是否应该报告
    if (!(error_reporting() & $errno)) {
        return false;
    }

    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

set_error_handler('errorToExceptionHandler');

// 现在错误将抛出异常
try {
    // 这将抛出 ErrorException
    echo $undefinedVariable;
} catch (ErrorException $e) {
    echo "将错误作为异常捕获: " . $e->getMessage() . "\n";
}

// 使用 PHP 内置的 ErrorException
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
?>
```

### 自定义异常处理器

```php
<?php
function customExceptionHandler(Throwable $exception): void {
    // 记录异常
    $logMessage = sprintf(
        "[%s] 未捕获的 %s: %s 在 %s:%d\n堆栈跟踪:\n%s",
        date('Y-m-d H:i:s'),
        get_class($exception),
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine(),
        $exception->getTraceAsString()
    );

    error_log($logMessage);

    // 显示用户友好的消息
    if (ENVIRONMENT === 'development') {
        echo "<h1>发生异常</h1>";
        echo "<p><strong>类型:</strong> " . get_class($exception) . "</p>";
        echo "<p><strong>消息:</strong> " . htmlspecialchars($exception->getMessage()) . "</p>";
        echo "<p><strong>文件:</strong> " . $exception->getFile() . "</p>";
        echo "<p><strong>行号:</strong> " . $exception->getLine() . "</p>";
        echo "<h2>堆栈跟踪</h2>";
        echo "<pre>" . htmlspecialchars($exception->getTraceAsString()) . "</pre>";
    } else {
        // 生产环境错误页面
        http_response_code(500);
        echo "<h1>发生错误</h1>";
        echo "<p>抱歉，出了点问题。请稍后再试。</p>";
    }
}

define('ENVIRONMENT', 'development');
set_exception_handler('customExceptionHandler');

// 此异常将被处理器捕获
throw new RuntimeException("出错了！");
?>
```

### 致命错误的关闭处理器

```php
<?php
function shutdownHandler(): void {
    $error = error_get_last();

    if ($error !== null && in_array($error['type'], [
        E_ERROR,
        E_CORE_ERROR,
        E_COMPILE_ERROR,
        E_PARSE
    ])) {
        // 记录致命错误
        $message = sprintf(
            "[%s] 致命错误: %s 在 %s 第 %d 行",
            date('Y-m-d H:i:s'),
            $error['message'],
            $error['file'],
            $error['line']
        );

        error_log($message);

        // 清除所有输出缓冲区
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // 显示错误页面
        http_response_code(500);
        echo "<!DOCTYPE html>
        <html>
        <head><title>服务器错误</title></head>
        <body>
        <h1>500 内部服务器错误</h1>
        <p>发生了意外错误。请稍后再试。</p>
        </body>
        </html>";
    }
}

register_shutdown_function('shutdownHandler');
?>
```

### 完整错误处理设置

```php
<?php
class ErrorHandler {
    private string $logFile;
    private bool $debug;

    public function __construct(string $logFile, bool $debug = false) {
        $this->logFile = $logFile;
        $this->debug = $debug;
    }

    public function register(): void {
        set_error_handler([$this, 'handleError']);
        set_exception_handler([$this, 'handleException']);
        register_shutdown_function([$this, 'handleShutdown']);
    }

    public function handleError(
        int $errno,
        string $errstr,
        string $errfile,
        int $errline
    ): bool {
        if (!(error_reporting() & $errno)) {
            return false;
        }

        throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
    }

    public function handleException(Throwable $e): void {
        $this->log($e);
        $this->render($e);
    }

    public function handleShutdown(): void {
        $error = error_get_last();

        if ($error && $this->isFatal($error['type'])) {
            $exception = new \ErrorException(
                $error['message'],
                0,
                $error['type'],
                $error['file'],
                $error['line']
            );

            $this->handleException($exception);
        }
    }

    private function isFatal(int $type): bool {
        return in_array($type, [
            E_ERROR,
            E_CORE_ERROR,
            E_COMPILE_ERROR,
            E_PARSE
        ]);
    }

    private function log(Throwable $e): void {
        $message = sprintf(
            "[%s] %s: %s 在 %s:%d\n%s\n",
            date('Y-m-d H:i:s'),
            get_class($e),
            $e->getMessage(),
            $e->getFile(),
            $e->getLine(),
            $e->getTraceAsString()
        );

        file_put_contents($this->logFile, $message, FILE_APPEND);
    }

    private function render(Throwable $e): void {
        http_response_code(500);

        if ($this->debug) {
            $this->renderDebug($e);
        } else {
            $this->renderProduction();
        }
    }

    private function renderDebug(Throwable $e): void {
        ?>
        <!DOCTYPE html>
        <html>
        <head>
            <title>错误</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 4px; }
                .trace { background: #f1f1f1; padding: 10px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="error">
                <h1><?= htmlspecialchars(get_class($e)) ?></h1>
                <p><strong>消息:</strong> <?= htmlspecialchars($e->getMessage()) ?></p>
                <p><strong>文件:</strong> <?= htmlspecialchars($e->getFile()) ?></p>
                <p><strong>行号:</strong> <?= $e->getLine() ?></p>
            </div>
            <h2>堆栈跟踪</h2>
            <pre class="trace"><?= htmlspecialchars($e->getTraceAsString()) ?></pre>
        </body>
        </html>
        <?php
    }

    private function renderProduction(): void {
        ?>
        <!DOCTYPE html>
        <html>
        <head><title>服务器错误</title></head>
        <body>
            <h1>哎呀！出了点问题。</h1>
            <p>我们正在努力修复问题。请稍后再试。</p>
        </body>
        </html>
        <?php
    }
}

// 使用
$handler = new ErrorHandler('/var/log/php/app.log', debug: true);
$handler->register();
?>
```

## 日志和监控

正确的日志记录对于调试和监控应用程序健康至关重要。

### PSR-3 Logger 接口

```php
<?php
// PSR-3 兼容的日志器实现
interface LoggerInterface {
    public function emergency(string $message, array $context = []): void;
    public function alert(string $message, array $context = []): void;
    public function critical(string $message, array $context = []): void;
    public function error(string $message, array $context = []): void;
    public function warning(string $message, array $context = []): void;
    public function notice(string $message, array $context = []): void;
    public function info(string $message, array $context = []): void;
    public function debug(string $message, array $context = []): void;
    public function log(string $level, string $message, array $context = []): void;
}

class FileLogger implements LoggerInterface {
    private string $logFile;

    public function __construct(string $logFile) {
        $this->logFile = $logFile;
    }

    public function emergency(string $message, array $context = []): void {
        $this->log('EMERGENCY', $message, $context);
    }

    public function alert(string $message, array $context = []): void {
        $this->log('ALERT', $message, $context);
    }

    public function critical(string $message, array $context = []): void {
        $this->log('CRITICAL', $message, $context);
    }

    public function error(string $message, array $context = []): void {
        $this->log('ERROR', $message, $context);
    }

    public function warning(string $message, array $context = []): void {
        $this->log('WARNING', $message, $context);
    }

    public function notice(string $message, array $context = []): void {
        $this->log('NOTICE', $message, $context);
    }

    public function info(string $message, array $context = []): void {
        $this->log('INFO', $message, $context);
    }

    public function debug(string $message, array $context = []): void {
        $this->log('DEBUG', $message, $context);
    }

    public function log(string $level, string $message, array $context = []): void {
        $message = $this->interpolate($message, $context);

        $logEntry = sprintf(
            "[%s] %s: %s\n",
            date('Y-m-d H:i:s'),
            strtoupper($level),
            $message
        );

        file_put_contents($this->logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }

    private function interpolate(string $message, array $context): string {
        $replace = [];
        foreach ($context as $key => $val) {
            if (is_string($val) || (is_object($val) && method_exists($val, '__toString'))) {
                $replace['{' . $key . '}'] = $val;
            }
        }
        return strtr($message, $replace);
    }
}

// 使用
$logger = new FileLogger('/var/log/app.log');
$logger->info('用户 {user} 从 {ip} 登录', [
    'user' => 'john@example.com',
    'ip' => '192.168.1.1'
]);
$logger->error('支付处理失败', [
    'order_id' => 12345,
    'amount' => 99.99
]);
?>
```

## 最佳实践

### 将异常用于异常情况

```php
<?php
// 错误：将异常用于控制流
function findUserBad(int $id): ?User {
    try {
        return $this->repository->find($id);
    } catch (UserNotFoundException $e) {
        return null; // 不要将异常用于预期情况
    }
}

// 正确：返回 null 或使用 Optional 模式
function findUserGood(int $id): ?User {
    return $this->repository->find($id); // 未找到时返回 null
}

// 正确：仅对真正的异常情况抛出异常
function getUserOrFail(int $id): User {
    $user = $this->repository->find($id);

    if ($user === null) {
        throw new UserNotFoundException("未找到用户 $id");
    }

    return $user;
}
?>
```

### 使用具体的异常类型

```php
<?php
// 错误：通用异常
function processOrder(array $data): void {
    if (empty($data['items'])) {
        throw new Exception("无效的订单"); // 太模糊
    }
}

// 正确：具体异常
function processOrderGood(array $data): void {
    if (empty($data['items'])) {
        throw new InvalidArgumentException("订单必须包含至少一个商品");
    }

    if ($data['total'] <= 0) {
        throw new DomainException("订单总额必须为正数");
    }
}
?>
```

### 永远不要吞掉异常

```php
<?php
// 错误：静默吞掉异常
try {
    processPayment($order);
} catch (Exception $e) {
    // 空的 catch 块 - 问题被隐藏
}

// 错误：记录但不处理
try {
    processPayment($order);
} catch (Exception $e) {
    error_log($e->getMessage());
    // 继续执行，好像什么都没发生
}

// 正确：适当处理
try {
    processPayment($order);
} catch (PaymentFailedException $e) {
    $logger->error('支付失败', ['exception' => $e]);
    $order->setStatus('payment_failed');
    $notifier->notifyPaymentFailure($order);
    throw $e; // 如果调用者需要知道，则重新抛出
}
?>
```

### 使用 Finally 清理资源

```php
<?php
function processFile(string $path): array {
    $handle = fopen($path, 'r');

    if ($handle === false) {
        throw new RuntimeException("无法打开文件: $path");
    }

    try {
        $data = [];
        while (($line = fgets($handle)) !== false) {
            $data[] = processLine($line);
        }
        return $data;
    } finally {
        // 始终关闭文件，即使发生异常
        fclose($handle);
    }
}
?>
```

### 快速失败

```php
<?php
class UserService {
    public function createUser(array $data): User {
        // 尽早验证，快速失败
        $this->validateEmail($data['email'] ?? null);
        $this->validatePassword($data['password'] ?? null);
        $this->validateAge($data['age'] ?? null);

        // 如果到达这里，数据有效
        return $this->repository->create($data);
    }

    private function validateEmail(?string $email): void {
        if (empty($email)) {
            throw new ValidationException('邮箱是必填项');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('邮箱格式无效');
        }
    }

    private function validatePassword(?string $password): void {
        if (empty($password)) {
            throw new ValidationException('密码是必填项');
        }
        if (strlen($password) < 8) {
            throw new ValidationException('密码必须至少 8 个字符');
        }
    }

    private function validateAge(?int $age): void {
        if ($age === null) {
            throw new ValidationException('年龄是必填项');
        }
        if ($age < 18) {
            throw new ValidationException('必须年满 18 岁');
        }
    }
}
?>
```

### 文档化异常

```php
<?php
/**
 * 处理支付交易。
 *
 * @param Order $order 要处理支付的订单
 * @param PaymentMethod $method 要使用的支付方式
 *
 * @return Transaction 完成的交易
 *
 * @throws InvalidArgumentException 如果订单总额无效
 * @throws PaymentDeclinedException 如果支付被拒绝
 * @throws PaymentGatewayException 如果网关通信出错
 * @throws InsufficientFundsException 如果支付方式余额不足
 */
function processPayment(Order $order, PaymentMethod $method): Transaction {
    if ($order->getTotal() <= 0) {
        throw new InvalidArgumentException('订单总额必须为正数');
    }

    try {
        return $this->gateway->charge($method, $order->getTotal());
    } catch (GatewayException $e) {
        throw new PaymentGatewayException(
            '支付网关错误: ' . $e->getMessage(),
            0,
            $e
        );
    }
}
?>
```

### 谨慎使用错误抑制

```php
<?php
// 错误：抑制错误隐藏问题
$data = @file_get_contents($url);

// 正确：显式处理错误
$data = file_get_contents($url);
if ($data === false) {
    throw new RuntimeException("无法获取 URL: $url");
}

// 可接受：当您需要检查特定条件时
// 并且会适当处理该情况
if (@mkdir($dir, 0755, true) === false && !is_dir($dir)) {
    throw new RuntimeException("无法创建目录: $dir");
}
?>
```

### 不同环境使用不同策略

```php
<?php
class ErrorHandlerFactory {
    public static function create(string $environment): ErrorHandler {
        return match ($environment) {
            'development' => new DevelopmentErrorHandler(),
            'testing' => new TestingErrorHandler(),
            'staging' => new StagingErrorHandler(),
            'production' => new ProductionErrorHandler(),
            default => new ProductionErrorHandler(),
        };
    }
}

class DevelopmentErrorHandler extends ErrorHandler {
    protected function render(Throwable $e): void {
        // 显示详细的错误信息
        echo "<h1>" . get_class($e) . "</h1>";
        echo "<p>" . $e->getMessage() . "</p>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
}

class ProductionErrorHandler extends ErrorHandler {
    protected function render(Throwable $e): void {
        // 显示通用错误页面
        http_response_code(500);
        include __DIR__ . '/templates/error_500.html';

        // 对严重错误提醒运维团队
        if ($e instanceof \Error || $e instanceof CriticalException) {
            $this->alertOps($e);
        }
    }

    private function alertOps(Throwable $e): void {
        // 向监控系统发送警报
    }
}
?>
```

## 结论

有效的错误和异常处理对于构建健壮的 PHP 应用程序至关重要。通过理解错误级别、正确配置错误报告、创建有意义的自定义异常和实现全面的错误处理器，您可以创建能够优雅处理问题并提供有价值调试信息的应用程序。

### 关键要点

- 理解错误和异常之间的区别
- 为每个环境适当配置错误报告
- 使用具体的异常类型而不是通用类型
- 实现自定义错误处理器以进行集中错误管理
- 始终使用足够的上下文记录异常以便调试
- 使用 finally 块确保资源清理
- 永远不要静默吞掉异常
- 文档化方法可能抛出的异常

### 下一步

在掌握错误和异常处理后，考虑探索：

- Monolog 和其他 PSR-3 日志库
- 错误监控服务（Sentry、Bugsnag、Raygun）
- 调试工具（Xdebug、Blackfire）
- 使用 PHPUnit 测试错误条件
- 框架特定的错误处理（Laravel、Symfony）
- PHP 8.1+ Fibers 中的异步错误处理

记住，良好的错误处理既能改善调试时的开发者体验，又能在出现问题时改善用户体验。在项目早期就投入时间设置适当的错误处理基础设施。
