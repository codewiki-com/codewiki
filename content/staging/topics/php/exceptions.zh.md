---
title: PHP 异常处理
description: 全面掌握 PHP 异常处理机制：try/catch/finally、自定义异常、SPL 异常类、异常链与最佳实践
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - 异常处理
  - Exception
  - SPL
  - 错误处理
status: imported
origin: old/src/content/docs/php/exceptions.zh.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 核心概念
  order: 11
  lastUpdated: 2026-01-07
---

异常处理是现代 PHP 开发中不可或缺的错误管理机制。通过异常，我们可以将错误处理代码与正常业务逻辑分离，构建更加健壮、可维护的应用程序。本文将全面介绍 PHP 异常处理的方方面面。

## 概念解释

### 什么是异常

异常（Exception）是程序执行过程中发生的意外情况或错误条件。与传统的错误处理方式（如返回错误码）不同，异常提供了一种结构化的方式来处理错误，允许错误沿着调用栈向上传播，直到被适当的处理程序捕获。

### 异常的历史演进

- **PHP 5.0 (2004)**：引入基本的异常处理机制，包括 `Exception` 基类和 `try/catch` 语法
- **PHP 5.1 (2005)**：引入 SPL（Standard PHP Library）异常类
- **PHP 5.5 (2013)**：引入 `finally` 块
- **PHP 7.0 (2015)**：引入 `Throwable` 接口，统一了 `Exception` 和 `Error` 的处理；支持在单个 `catch` 块中捕获多种异常类型
- **PHP 7.1 (2016)**：支持 `catch` 块捕获多个异常类型（使用 `|` 分隔）
- **PHP 8.0 (2020)**：引入 `match` 表达式，可更优雅地处理异常；`catch` 块可以不捕获异常变量

### 异常解决的问题

1. **错误处理与业务逻辑分离**：将错误处理代码集中管理
2. **错误传播**：自动沿调用栈向上传递，无需手动检查返回值
3. **详细的错误信息**：包含消息、代码、文件、行号和堆栈跟踪
4. **类型化错误**：通过异常类层次结构区分不同类型的错误

## 核心原理

### Throwable 接口

从 PHP 7 开始，所有可抛出的对象都必须实现 `Throwable` 接口。该接口定义了以下方法：

```php
<?php
interface Throwable {
    public function getMessage(): string;       // 获取异常消息
    public function getCode(): int;             // 获取异常代码
    public function getFile(): string;          // 获取异常发生的文件
    public function getLine(): int;             // 获取异常发生的行号
    public function getTrace(): array;          // 获取堆栈跟踪数组
    public function getTraceAsString(): string; // 获取堆栈跟踪字符串
    public function getPrevious(): ?Throwable;  // 获取前一个异常
    public function __toString(): string;       // 转换为字符串
}
```

### 异常类层次结构

```
Throwable (接口)
├── Error (PHP 7+，内部错误)
│   ├── ArithmeticError
│   │   └── DivisionByZeroError
│   ├── AssertionError
│   ├── CompileError
│   │   └── ParseError
│   ├── TypeError
│   │   └── ArgumentCountError
│   └── ValueError (PHP 8+)
│
└── Exception (用户异常)
    ├── ErrorException
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
```

### 异常传播机制

当异常被抛出时，PHP 会：

1. 停止当前代码块的执行
2. 在当前作用域查找匹配的 `catch` 块
3. 如果找不到，则向上层调用栈传播
4. 如果到达顶层仍未被捕获，则调用全局异常处理器
5. 如果没有全局处理器，则产生致命错误并终止脚本

```php
<?php
function level3() {
    throw new Exception("在 level3 抛出异常");
}

function level2() {
    level3();  // 异常从这里传播
}

function level1() {
    try {
        level2();
    } catch (Exception $e) {
        echo "在 level1 捕获: " . $e->getMessage();
    }
}

level1();  // 输出: 在 level1 捕获: 在 level3 抛出异常
```

## 核心要点

### try/catch/finally 基本语法

```php
<?php
try {
    // 可能抛出异常的代码
    $result = riskyOperation();

} catch (InvalidArgumentException $e) {
    // 捕获特定类型的异常
    echo "参数错误: " . $e->getMessage();

} catch (RuntimeException $e) {
    // 捕获另一种类型的异常
    echo "运行时错误: " . $e->getMessage();

} catch (Exception $e) {
    // 捕获所有其他 Exception
    echo "一般错误: " . $e->getMessage();

} finally {
    // 无论是否发生异常都会执行
    cleanup();
}
```

### 抛出异常

```php
<?php
// 基本抛出
throw new Exception("发生错误");

// 带错误代码
throw new Exception("发生错误", 1001);

// 带前一个异常（异常链）
throw new Exception("发生错误", 1001, $previousException);

// 抛出特定类型的异常
throw new InvalidArgumentException("参数无效");
throw new RuntimeException("运行时错误");
```

### PHP 7.1+ 多类型捕获

```php
<?php
try {
    $data = processData($input);

} catch (InvalidArgumentException | TypeError $e) {
    // 同时捕获多种异常类型
    echo "输入错误: " . $e->getMessage();

} catch (PDOException | mysqli_sql_exception $e) {
    // 捕获数据库相关异常
    echo "数据库错误: " . $e->getMessage();
}
```

### PHP 8.0+ 非捕获异常

```php
<?php
try {
    riskyOperation();

} catch (SpecificException) {
    // PHP 8.0+: 不需要异常变量时可以省略
    log("发生了 SpecificException");
}
```

### finally 块的特性

`finally` 块在以下情况下都会执行：

```php
<?php
function demonstrateFinally($scenario) {
    try {
        switch ($scenario) {
            case 'normal':
                echo "正常执行\n";
                return "正常返回";

            case 'exception':
                throw new Exception("测试异常");

            case 'return_in_catch':
                throw new Exception("测试");
        }

    } catch (Exception $e) {
        echo "捕获异常\n";
        if ($scenario === 'return_in_catch') {
            return "catch 中返回";
        }

    } finally {
        echo "finally 执行\n";
        // 注意：finally 中的 return 会覆盖之前的 return
    }

    return "函数末尾返回";
}

// 测试各种场景
echo demonstrateFinally('normal') . "\n";
// 输出: 正常执行 -> finally 执行 -> 正常返回

echo demonstrateFinally('exception') . "\n";
// 输出: 捕获异常 -> finally 执行 -> 函数末尾返回

echo demonstrateFinally('return_in_catch') . "\n";
// 输出: 捕获异常 -> finally 执行 -> catch 中返回
```

### 重新抛出异常

```php
<?php
function processData($data) {
    try {
        // 执行某些操作
        validateData($data);

    } catch (ValidationException $e) {
        // 记录日志
        error_log("验证失败: " . $e->getMessage());

        // 重新抛出原异常
        throw $e;

        // 或者包装后抛出新异常
        // throw new ProcessingException("数据处理失败", 0, $e);
    }
}
```

## 代码示例

### Exception 类详解

```php
<?php
/**
 * Exception 类的完整用法演示
 */
function demonstrateException() {
    try {
        // 创建并抛出一个异常
        throw new Exception(
            "这是异常消息",  // 消息
            1001             // 错误代码
        );

    } catch (Exception $e) {
        // 获取基本信息
        echo "消息: " . $e->getMessage() . "\n";
        echo "代码: " . $e->getCode() . "\n";
        echo "文件: " . $e->getFile() . "\n";
        echo "行号: " . $e->getLine() . "\n";

        // 获取堆栈跟踪
        echo "\n堆栈跟踪数组:\n";
        print_r($e->getTrace());

        echo "\n堆栈跟踪字符串:\n";
        echo $e->getTraceAsString() . "\n";

        // 获取前一个异常
        echo "\n前一个异常: ";
        var_dump($e->getPrevious());

        // 字符串表示
        echo "\n字符串表示:\n";
        echo $e . "\n";  // 调用 __toString()
    }
}

demonstrateException();
```

### 自定义异常类

```php
<?php
/**
 * 应用程序基础异常类
 */
class AppException extends Exception
{
    /**
     * 额外的上下文信息
     */
    protected array $context = [];

    /**
     * HTTP 状态码（用于 API 响应）
     */
    protected int $httpStatusCode = 500;

    public function __construct(
        string $message = '',
        int $code = 0,
        ?Throwable $previous = null,
        array $context = []
    ) {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }

    /**
     * 获取上下文信息
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * 添加上下文信息
     */
    public function withContext(array $context): self
    {
        $this->context = array_merge($this->context, $context);
        return $this;
    }

    /**
     * 获取 HTTP 状态码
     */
    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }

    /**
     * 转换为数组（用于 API 响应）
     */
    public function toArray(): array
    {
        return [
            'error' => true,
            'type' => (new ReflectionClass($this))->getShortName(),
            'message' => $this->getMessage(),
            'code' => $this->getCode(),
            'context' => $this->context,
        ];
    }

    /**
     * 转换为 JSON
     */
    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_UNESCAPED_UNICODE);
    }
}

/**
 * 验证异常
 */
class ValidationException extends AppException
{
    protected int $httpStatusCode = 422;

    /**
     * 字段错误列表
     */
    private array $errors = [];

    public function __construct(
        array $errors,
        string $message = '数据验证失败'
    ) {
        parent::__construct($message, 422);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'errors' => $this->errors
        ]);
    }
}

/**
 * 资源未找到异常
 */
class NotFoundException extends AppException
{
    protected int $httpStatusCode = 404;

    public function __construct(
        string $resource,
        mixed $identifier,
        ?Throwable $previous = null
    ) {
        $message = sprintf('%s 未找到: %s', $resource, $identifier);
        parent::__construct($message, 404, $previous, [
            'resource' => $resource,
            'identifier' => $identifier
        ]);
    }
}

/**
 * 认证异常
 */
class AuthenticationException extends AppException
{
    protected int $httpStatusCode = 401;

    public function __construct(
        string $message = '认证失败',
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 401, $previous);
    }
}

/**
 * 授权异常
 */
class AuthorizationException extends AppException
{
    protected int $httpStatusCode = 403;

    public function __construct(
        string $message = '权限不足',
        ?string $permission = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 403, $previous, [
            'required_permission' => $permission
        ]);
    }
}

/**
 * 业务逻辑异常
 */
class BusinessException extends AppException
{
    protected int $httpStatusCode = 400;

    public function __construct(
        string $message,
        int $code = 400,
        array $context = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous, $context);
    }
}

/**
 * 外部服务异常
 */
class ExternalServiceException extends AppException
{
    protected int $httpStatusCode = 502;

    private string $serviceName;

    public function __construct(
        string $serviceName,
        string $message,
        ?Throwable $previous = null
    ) {
        $this->serviceName = $serviceName;
        parent::__construct(
            "外部服务 [{$serviceName}] 错误: {$message}",
            502,
            $previous,
            ['service' => $serviceName]
        );
    }

    public function getServiceName(): string
    {
        return $this->serviceName;
    }
}
```

### 异常链（Exception Chaining）

```php
<?php
/**
 * 异常链演示
 *
 * 异常链允许我们在捕获一个异常后，创建一个新异常并保留原始异常的引息
 */
class DatabaseConnectionException extends Exception {}
class RepositoryException extends Exception {}
class ServiceException extends Exception {}

/**
 * 数据库层
 */
function connectToDatabase(): PDO
{
    try {
        $pdo = new PDO(
            'mysql:host=localhost;dbname=myapp',
            'user',
            'wrong_password'
        );
        return $pdo;

    } catch (PDOException $e) {
        // 包装底层异常，添加更多上下文
        throw new DatabaseConnectionException(
            '无法建立数据库连接',
            1001,
            $e  // 保留原始异常
        );
    }
}

/**
 * 仓储层
 */
function findUserById(int $id): array
{
    try {
        $pdo = connectToDatabase();
        // ... 查询数据库
        return ['id' => $id, 'name' => 'Test'];

    } catch (DatabaseConnectionException $e) {
        throw new RepositoryException(
            "无法查询用户 ID: {$id}",
            2001,
            $e  // 保留数据库异常
        );
    }
}

/**
 * 服务层
 */
function getUserProfile(int $id): array
{
    try {
        $user = findUserById($id);
        return ['profile' => $user];

    } catch (RepositoryException $e) {
        throw new ServiceException(
            '获取用户资料失败',
            3001,
            $e  // 保留仓储异常
        );
    }
}

/**
 * 获取完整的异常链
 */
function getExceptionChain(Throwable $e): array
{
    $chain = [];
    $current = $e;

    while ($current !== null) {
        $chain[] = [
            'type' => get_class($current),
            'message' => $current->getMessage(),
            'code' => $current->getCode(),
            'file' => $current->getFile(),
            'line' => $current->getLine(),
        ];
        $current = $current->getPrevious();
    }

    return $chain;
}

/**
 * 格式化输出异常链
 */
function printExceptionChain(Throwable $e, int $level = 0): void
{
    $indent = str_repeat('  ', $level);

    echo "{$indent}[" . get_class($e) . "]\n";
    echo "{$indent}消息: {$e->getMessage()}\n";
    echo "{$indent}代码: {$e->getCode()}\n";
    echo "{$indent}位置: {$e->getFile()}:{$e->getLine()}\n";

    if ($e->getPrevious() !== null) {
        echo "{$indent}原因:\n";
        printExceptionChain($e->getPrevious(), $level + 1);
    }
}

// 使用示例
try {
    $profile = getUserProfile(1);

} catch (ServiceException $e) {
    echo "=== 异常链详情 ===\n\n";
    printExceptionChain($e);

    echo "\n=== 异常链数组 ===\n";
    print_r(getExceptionChain($e));
}
```

### SPL 异常类详解

```php
<?php
/**
 * SPL (Standard PHP Library) 异常类使用指南
 *
 * SPL 提供了两大类异常：
 * 1. LogicException - 代码逻辑错误（应该在开发阶段发现）
 * 2. RuntimeException - 运行时错误（只在运行时才能发现）
 */

// ============================================================
// LogicException 及其子类 - 表示代码本身的问题
// ============================================================

/**
 * InvalidArgumentException - 参数无效
 * 当传入的参数不符合预期时使用
 */
function divide(int $a, int $b): float
{
    if ($b === 0) {
        throw new InvalidArgumentException('除数不能为零');
    }
    return $a / $b;
}

/**
 * LengthException - 长度相关错误
 * 当长度无效时使用（如数组长度、字符串长度）
 */
function createArray(int $size): array
{
    if ($size < 0) {
        throw new LengthException('数组大小不能为负数');
    }
    if ($size > 1000000) {
        throw new LengthException('数组大小超过最大限制');
    }
    return array_fill(0, $size, null);
}

/**
 * OutOfRangeException - 索引越界（逻辑层面）
 * 当请求非法索引时使用（编译期可确定的）
 */
class FixedArray
{
    private array $items;
    private int $size;

    public function __construct(int $size)
    {
        $this->size = $size;
        $this->items = array_fill(0, $size, null);
    }

    public function set(int $index, mixed $value): void
    {
        if ($index < 0 || $index >= $this->size) {
            throw new OutOfRangeException(
                "索引 {$index} 超出范围 [0, {$this->size})"
            );
        }
        $this->items[$index] = $value;
    }
}

/**
 * DomainException - 域错误
 * 当值不在预期的域范围内时使用
 */
function setMonth(int $month): void
{
    if ($month < 1 || $month > 12) {
        throw new DomainException('月份必须在 1-12 之间');
    }
    // 设置月份...
}

/**
 * BadFunctionCallException - 函数调用错误
 * 当回调函数引用未定义的函数或缺少参数时使用
 */
function callUserCallback(callable $callback, array $args): mixed
{
    if (!is_callable($callback)) {
        throw new BadFunctionCallException('提供的回调不可调用');
    }
    return call_user_func_array($callback, $args);
}

/**
 * BadMethodCallException - 方法调用错误
 * 当调用未定义的方法或参数错误时使用
 */
class DynamicObject
{
    private array $methods = [];

    public function registerMethod(string $name, callable $callback): void
    {
        $this->methods[$name] = $callback;
    }

    public function __call(string $name, array $arguments): mixed
    {
        if (!isset($this->methods[$name])) {
            throw new BadMethodCallException(
                "方法 '{$name}' 未定义"
            );
        }
        return call_user_func_array($this->methods[$name], $arguments);
    }
}

// ============================================================
// RuntimeException 及其子类 - 表示运行时才能发现的问题
// ============================================================

/**
 * OutOfBoundsException - 索引越界（运行时）
 * 当访问非法键时使用（运行时才能确定的）
 */
class Dictionary
{
    private array $data = [];

    public function get(string $key): mixed
    {
        if (!array_key_exists($key, $this->data)) {
            throw new OutOfBoundsException("键 '{$key}' 不存在");
        }
        return $this->data[$key];
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }
}

/**
 * OverflowException - 溢出错误
 * 当向已满的容器添加元素时使用
 */
class BoundedQueue
{
    private array $items = [];
    private int $maxSize;

    public function __construct(int $maxSize)
    {
        $this->maxSize = $maxSize;
    }

    public function enqueue(mixed $item): void
    {
        if (count($this->items) >= $this->maxSize) {
            throw new OverflowException('队列已满');
        }
        $this->items[] = $item;
    }
}

/**
 * UnderflowException - 下溢错误
 * 当在空容器上执行无效操作时使用
 */
class Stack
{
    private array $items = [];

    public function push(mixed $item): void
    {
        $this->items[] = $item;
    }

    public function pop(): mixed
    {
        if (empty($this->items)) {
            throw new UnderflowException('栈为空');
        }
        return array_pop($this->items);
    }
}

/**
 * RangeException - 范围错误（运行时）
 * 当值超出范围时使用（通常是算术运算结果）
 */
function calculatePercentage(float $part, float $total): float
{
    if ($total == 0) {
        throw new RangeException('总数不能为零');
    }
    $percentage = ($part / $total) * 100;
    if ($percentage < 0 || $percentage > 100) {
        throw new RangeException('百分比必须在 0-100 之间');
    }
    return $percentage;
}

/**
 * UnexpectedValueException - 意外值错误
 * 当值不匹配预期类型/条件时使用（运行时数据验证）
 */
function processApiResponse(array $response): array
{
    if (!isset($response['status'])) {
        throw new UnexpectedValueException('API 响应缺少 status 字段');
    }

    if (!in_array($response['status'], ['success', 'error'])) {
        throw new UnexpectedValueException(
            "未知的状态值: {$response['status']}"
        );
    }

    return $response;
}

// ============================================================
// SPL 异常使用示例
// ============================================================

echo "=== SPL 异常示例 ===\n\n";

// InvalidArgumentException
try {
    divide(10, 0);
} catch (InvalidArgumentException $e) {
    echo "InvalidArgumentException: {$e->getMessage()}\n";
}

// LengthException
try {
    createArray(-5);
} catch (LengthException $e) {
    echo "LengthException: {$e->getMessage()}\n";
}

// OutOfRangeException
try {
    $arr = new FixedArray(5);
    $arr->set(10, 'value');
} catch (OutOfRangeException $e) {
    echo "OutOfRangeException: {$e->getMessage()}\n";
}

// DomainException
try {
    setMonth(13);
} catch (DomainException $e) {
    echo "DomainException: {$e->getMessage()}\n";
}

// OutOfBoundsException
try {
    $dict = new Dictionary();
    $dict->get('nonexistent');
} catch (OutOfBoundsException $e) {
    echo "OutOfBoundsException: {$e->getMessage()}\n";
}

// OverflowException
try {
    $queue = new BoundedQueue(2);
    $queue->enqueue('a');
    $queue->enqueue('b');
    $queue->enqueue('c');  // 溢出
} catch (OverflowException $e) {
    echo "OverflowException: {$e->getMessage()}\n";
}

// UnderflowException
try {
    $stack = new Stack();
    $stack->pop();  // 空栈
} catch (UnderflowException $e) {
    echo "UnderflowException: {$e->getMessage()}\n";
}

// UnexpectedValueException
try {
    processApiResponse(['status' => 'unknown']);
} catch (UnexpectedValueException $e) {
    echo "UnexpectedValueException: {$e->getMessage()}\n";
}
```

### 全局异常处理器

```php
<?php
/**
 * 全局异常处理器
 *
 * 捕获所有未被处理的异常
 */
class GlobalExceptionHandler
{
    private bool $debug;
    private string $logFile;

    public function __construct(bool $debug = false, string $logFile = '/var/log/php/exceptions.log')
    {
        $this->debug = $debug;
        $this->logFile = $logFile;
    }

    /**
     * 注册为全局异常处理器
     */
    public function register(): void
    {
        set_exception_handler([$this, 'handle']);
    }

    /**
     * 处理异常
     */
    public function handle(Throwable $e): void
    {
        // 记录异常
        $this->log($e);

        // 清除输出缓冲
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // 确定 HTTP 状态码
        $statusCode = $this->getStatusCode($e);
        http_response_code($statusCode);

        // 根据请求类型输出
        if ($this->isJsonRequest()) {
            $this->outputJson($e, $statusCode);
        } else {
            $this->outputHtml($e, $statusCode);
        }

        exit(1);
    }

    /**
     * 记录异常到日志
     */
    private function log(Throwable $e): void
    {
        $message = sprintf(
            "[%s] %s: %s in %s:%d\nStack trace:\n%s\n",
            date('Y-m-d H:i:s'),
            get_class($e),
            $e->getMessage(),
            $e->getFile(),
            $e->getLine(),
            $e->getTraceAsString()
        );

        // 包含异常链
        $previous = $e->getPrevious();
        while ($previous !== null) {
            $message .= sprintf(
                "\nCaused by: %s: %s in %s:%d\n",
                get_class($previous),
                $previous->getMessage(),
                $previous->getFile(),
                $previous->getLine()
            );
            $previous = $previous->getPrevious();
        }

        error_log($message, 3, $this->logFile);
    }

    /**
     * 获取 HTTP 状态码
     */
    private function getStatusCode(Throwable $e): int
    {
        if ($e instanceof AppException) {
            return $e->getHttpStatusCode();
        }

        // 根据异常类型返回不同状态码
        return match (true) {
            $e instanceof InvalidArgumentException => 400,
            $e instanceof AuthenticationException => 401,
            $e instanceof AuthorizationException => 403,
            $e instanceof NotFoundException => 404,
            $e instanceof ValidationException => 422,
            default => 500,
        };
    }

    /**
     * 检查是否为 JSON 请求
     */
    private function isJsonRequest(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        return str_contains($accept, 'application/json') ||
               str_contains($contentType, 'application/json');
    }

    /**
     * 输出 JSON 响应
     */
    private function outputJson(Throwable $e, int $statusCode): void
    {
        header('Content-Type: application/json; charset=utf-8');

        $data = [
            'error' => true,
            'message' => $this->debug ? $e->getMessage() : $this->getPublicMessage($statusCode),
            'code' => $statusCode,
        ];

        if ($e instanceof AppException) {
            $data = array_merge($data, $e->toArray());
        }

        if ($this->debug) {
            $data['debug'] = [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => explode("\n", $e->getTraceAsString()),
            ];
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    /**
     * 输出 HTML 响应
     */
    private function outputHtml(Throwable $e, int $statusCode): void
    {
        header('Content-Type: text/html; charset=utf-8');

        if ($this->debug) {
            echo $this->renderDebugPage($e, $statusCode);
        } else {
            echo $this->renderErrorPage($statusCode);
        }
    }

    /**
     * 获取公开的错误消息
     */
    private function getPublicMessage(int $statusCode): string
    {
        return match ($statusCode) {
            400 => '请求无效',
            401 => '未经授权',
            403 => '禁止访问',
            404 => '资源未找到',
            422 => '数据验证失败',
            500 => '服务器内部错误',
            502 => '网关错误',
            503 => '服务不可用',
            default => '发生错误',
        };
    }

    /**
     * 渲染调试页面
     */
    private function renderDebugPage(Throwable $e, int $statusCode): string
    {
        $type = htmlspecialchars(get_class($e));
        $message = htmlspecialchars($e->getMessage());
        $file = htmlspecialchars($e->getFile());
        $line = $e->getLine();
        $trace = htmlspecialchars($e->getTraceAsString());

        return <<<HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>异常: {$type}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: #1a1a2e; color: #eee; line-height: 1.6; padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 30px; border-radius: 10px 10px 0 0; }
        .header h1 { font-size: 24px; margin-bottom: 10px; }
        .header .type { opacity: 0.8; font-size: 14px; }
        .content { background: #16213e; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #00d9ff; font-size: 16px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .info-item { background: #0f3460; padding: 15px; border-radius: 8px; }
        .info-item .label { color: #888; font-size: 12px; margin-bottom: 5px; }
        .info-item .value { font-family: 'Monaco', 'Consolas', monospace; word-break: break-all; }
        pre {
            background: #0f3460; padding: 20px; border-radius: 8px; overflow-x: auto;
            font-family: 'Monaco', 'Consolas', monospace; font-size: 13px; line-height: 1.8;
        }
        .status-code {
            display: inline-block; background: #e74c3c; padding: 5px 15px;
            border-radius: 20px; font-weight: bold; margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="type">{$type}</div>
            <h1>{$message} <span class="status-code">{$statusCode}</span></h1>
        </div>
        <div class="content">
            <div class="section">
                <h2>异常位置</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">文件</div>
                        <div class="value">{$file}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">行号</div>
                        <div class="value">{$line}</div>
                    </div>
                </div>
            </div>
            <div class="section">
                <h2>堆栈跟踪</h2>
                <pre>{$trace}</pre>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * 渲染错误页面
     */
    private function renderErrorPage(int $statusCode): string
    {
        $message = $this->getPublicMessage($statusCode);

        return <<<HTML
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>错误 {$statusCode}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5; display: flex; justify-content: center;
            align-items: center; min-height: 100vh; padding: 20px;
        }
        .error-box { text-align: center; }
        .error-code { font-size: 120px; font-weight: bold; color: #e74c3c; line-height: 1; }
        .error-message { font-size: 24px; color: #333; margin-top: 10px; }
        .back-link {
            display: inline-block; margin-top: 30px; padding: 12px 30px;
            background: #3498db; color: white; text-decoration: none;
            border-radius: 5px; transition: background 0.3s;
        }
        .back-link:hover { background: #2980b9; }
    </style>
</head>
<body>
    <div class="error-box">
        <div class="error-code">{$statusCode}</div>
        <div class="error-message">{$message}</div>
        <a href="/" class="back-link">返回首页</a>
    </div>
</body>
</html>
HTML;
    }
}

// 注册全局异常处理器
$debug = getenv('APP_ENV') === 'development';
$handler = new GlobalExceptionHandler($debug);
$handler->register();
```

## 最佳实践

### 使用异常而非错误码

```php
<?php
// 不推荐：使用错误码
function createUserBad(array $data): array
{
    if (empty($data['email'])) {
        return ['success' => false, 'error' => 'EMAIL_REQUIRED'];
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'EMAIL_INVALID'];
    }
    // ... 创建用户
    return ['success' => true, 'user' => $user];
}

// 推荐：使用异常
function createUserGood(array $data): User
{
    $errors = [];

    if (empty($data['email'])) {
        $errors['email'] = '邮箱不能为空';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = '邮箱格式无效';
    }

    if (!empty($errors)) {
        throw new ValidationException($errors);
    }

    // ... 创建用户
    return $user;
}
```

### 创建有意义的异常层次结构

```php
<?php
// 应用程序异常基类
abstract class AppException extends Exception
{
    abstract public function getHttpStatusCode(): int;
}

// 客户端错误（4xx）
abstract class ClientException extends AppException {}

// 服务端错误（5xx）
abstract class ServerException extends AppException {}

// 具体的客户端异常
class BadRequestException extends ClientException
{
    public function getHttpStatusCode(): int { return 400; }
}

class UnauthorizedException extends ClientException
{
    public function getHttpStatusCode(): int { return 401; }
}

class ForbiddenException extends ClientException
{
    public function getHttpStatusCode(): int { return 403; }
}

class NotFoundException extends ClientException
{
    public function getHttpStatusCode(): int { return 404; }
}

// 具体的服务端异常
class InternalServerException extends ServerException
{
    public function getHttpStatusCode(): int { return 500; }
}

class ServiceUnavailableException extends ServerException
{
    public function getHttpStatusCode(): int { return 503; }
}
```

### 使用异常链保留上下文

```php
<?php
class UserRepository
{
    public function findById(int $id): User
    {
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data === false) {
                throw new NotFoundException('User', $id);
            }

            return User::fromArray($data);

        } catch (PDOException $e) {
            // 包装数据库异常，添加业务上下文
            throw new RepositoryException(
                "无法获取用户 ID: {$id}",
                0,
                $e  // 保留原始异常
            );
        }
    }
}
```

### finally 用于资源清理

```php
<?php
class FileProcessor
{
    public function processFile(string $filename): array
    {
        $handle = null;
        $results = [];

        try {
            $handle = fopen($filename, 'r');
            if ($handle === false) {
                throw new RuntimeException("无法打开文件: {$filename}");
            }

            while (($line = fgets($handle)) !== false) {
                $results[] = $this->processLine($line);
            }

            return $results;

        } catch (ProcessingException $e) {
            // 处理特定异常
            throw new FileProcessingException(
                "处理文件 {$filename} 时出错",
                0,
                $e
            );

        } finally {
            // 确保资源被释放
            if ($handle !== null && is_resource($handle)) {
                fclose($handle);
            }
        }
    }
}
```

### 不要忽略异常

```php
<?php
// 非常糟糕：空的 catch 块
try {
    riskyOperation();
} catch (Exception $e) {
    // 什么都不做 - 危险！
}

// 糟糕：只是简单记录
try {
    riskyOperation();
} catch (Exception $e) {
    error_log($e->getMessage());
    // 然后呢？
}

// 好：适当处理
try {
    riskyOperation();
} catch (RecoverableException $e) {
    // 可恢复的异常：记录并继续
    $this->logger->warning('操作失败，使用默认值', [
        'exception' => $e->getMessage()
    ]);
    return $defaultValue;

} catch (CriticalException $e) {
    // 严重异常：记录并重新抛出
    $this->logger->error('严重错误', [
        'exception' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    throw $e;
}
```

### 提供有意义的错误消息

```php
<?php
// 不好：模糊的消息
throw new Exception('错误');
throw new Exception('操作失败');

// 好：具体的、可操作的消息
throw new Exception(sprintf(
    '无法连接到数据库 %s@%s:%d，错误: %s',
    $username,
    $host,
    $port,
    $error
));

throw new ValidationException([
    'email' => '邮箱格式无效，应该是 example@domain.com 格式',
    'age' => '年龄必须是 18-120 之间的整数',
]);
```

### 在适当的层次处理异常

```php
<?php
/**
 * 异常处理的层次原则：
 *
 * 1. 在最了解如何处理异常的地方处理它
 * 2. 如果不知道如何处理，让它向上传播
 * 3. 不要捕获你无法正确处理的异常
 */

// 控制器层：处理并转换为 HTTP 响应
class UserController
{
    public function show(int $id): Response
    {
        try {
            $user = $this->userService->getUser($id);
            return new JsonResponse($user->toArray());

        } catch (NotFoundException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 404);

        } catch (AuthorizationException $e) {
            return new JsonResponse(['error' => '无权访问'], 403);
        }
        // 其他异常让它向上传播到全局处理器
    }
}

// 服务层：处理业务逻辑相关异常
class UserService
{
    public function getUser(int $id): User
    {
        $user = $this->repository->find($id);

        if ($user === null) {
            throw new NotFoundException('User', $id);
        }

        if (!$this->authService->canView($user)) {
            throw new AuthorizationException('无权查看此用户');
        }

        return $user;
    }
}

// 仓储层：处理数据访问异常
class UserRepository
{
    public function find(int $id): ?User
    {
        try {
            return $this->queryBuilder
                ->select('*')
                ->from('users')
                ->where('id = ?', $id)
                ->fetchOne(User::class);

        } catch (PDOException $e) {
            throw new DatabaseException(
                '查询用户失败',
                0,
                $e
            );
        }
    }
}
```

## 常见陷阱

### 捕获过于宽泛的异常

```php
<?php
// 陷阱：捕获所有异常
try {
    $user = $userService->createUser($data);
} catch (Exception $e) {
    // 这会捕获所有异常，包括你可能想让它传播的
    echo "创建用户失败";
}

// 正确：只捕获预期的异常
try {
    $user = $userService->createUser($data);
} catch (ValidationException $e) {
    // 处理验证错误
    return $this->renderValidationErrors($e->getErrors());
} catch (DuplicateEntryException $e) {
    // 处理重复记录
    return $this->renderError('用户已存在');
}
// 其他异常让它传播
```

### 在循环中抛出异常

```php
<?php
// 陷阱：在循环中抛出异常会中断整个循环
function processItems(array $items): void
{
    foreach ($items as $item) {
        if (!$item->isValid()) {
            throw new ValidationException("项目 {$item->id} 无效");
            // 后面的项目都不会被处理
        }
        $item->process();
    }
}

// 更好：收集错误后统一处理
function processItemsBetter(array $items): ProcessResult
{
    $processed = [];
    $errors = [];

    foreach ($items as $item) {
        try {
            if (!$item->isValid()) {
                throw new ValidationException("项目 {$item->id} 无效");
            }
            $item->process();
            $processed[] = $item->id;
        } catch (ValidationException $e) {
            $errors[$item->id] = $e->getMessage();
        }
    }

    return new ProcessResult($processed, $errors);
}
```

### 在析构函数中抛出异常

```php
<?php
// 陷阱：在析构函数中抛出异常
class BadResource
{
    public function __destruct()
    {
        if (!$this->cleanup()) {
            // 危险！在析构函数中抛出异常可能导致致命错误
            throw new Exception("清理失败");
        }
    }
}

// 正确：在析构函数中记录错误而不是抛出异常
class GoodResource
{
    public function __destruct()
    {
        try {
            $this->cleanup();
        } catch (Exception $e) {
            error_log("资源清理失败: " . $e->getMessage());
        }
    }

    // 提供显式的清理方法
    public function close(): void
    {
        if (!$this->cleanup()) {
            throw new Exception("清理失败");
        }
    }
}
```

### 重新抛出时丢失原始异常

```php
<?php
// 陷阱：丢失原始异常信息
try {
    $this->database->query($sql);
} catch (PDOException $e) {
    // 原始异常信息丢失了！
    throw new DatabaseException("数据库错误");
}

// 正确：保留原始异常
try {
    $this->database->query($sql);
} catch (PDOException $e) {
    throw new DatabaseException(
        "执行 SQL 查询失败",
        0,
        $e  // 保留原始异常
    );
}
```

### finally 中的 return 覆盖问题

```php
<?php
// 陷阱：finally 中的 return 会覆盖 try/catch 中的 return
function dangerousReturn(): string
{
    try {
        return "from try";
    } finally {
        return "from finally";  // 这会覆盖 try 中的返回值！
    }
}

echo dangerousReturn();  // 输出: from finally

// 正确：不要在 finally 中使用 return
function safeReturn(): string
{
    $result = null;

    try {
        $result = "from try";
        return $result;
    } finally {
        // 只做清理工作，不要 return
        cleanup();
    }
}
```

### 使用异常控制流程

```php
<?php
// 陷阱：使用异常来控制正常流程
function findUser(int $id): ?User
{
    try {
        return $this->repository->find($id);
    } catch (NotFoundException $e) {
        return null;  // 不应该用异常来处理"未找到"这种正常情况
    }
}

// 正确：使用返回值表示正常的"未找到"情况
function findUserBetter(int $id): ?User
{
    return $this->repository->find($id);  // 返回 null 表示未找到
}

// 如果"必须找到"，使用不同的方法
function getUserOrFail(int $id): User
{
    $user = $this->repository->find($id);

    if ($user === null) {
        throw new NotFoundException('User', $id);
    }

    return $user;
}
```

## 性能考量

### 异常的性能开销

```php
<?php
/**
 * 异常的性能测试
 *
 * 异常有一定的性能开销，主要来自：
 * 1. 堆栈跟踪的生成
 * 2. 对象的创建
 * 3. 堆栈展开
 */

// 性能测试：异常 vs 返回值
function benchmarkExceptions(int $iterations): array
{
    // 测试返回错误码
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        $result = functionWithErrorCode(false);
        if ($result['error']) {
            // 处理错误
        }
    }
    $errorCodeTime = microtime(true) - $start;

    // 测试异常
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        try {
            functionWithException(false);
        } catch (Exception $e) {
            // 处理异常
        }
    }
    $exceptionTime = microtime(true) - $start;

    return [
        'error_code' => $errorCodeTime,
        'exception' => $exceptionTime,
        'ratio' => $exceptionTime / $errorCodeTime,
    ];
}

function functionWithErrorCode(bool $success): array
{
    if (!$success) {
        return ['error' => true, 'message' => '操作失败'];
    }
    return ['error' => false, 'data' => 'success'];
}

function functionWithException(bool $success): string
{
    if (!$success) {
        throw new Exception('操作失败');
    }
    return 'success';
}

// 运行基准测试
$result = benchmarkExceptions(10000);
printf("错误码: %.4f 秒\n", $result['error_code']);
printf("异常: %.4f 秒\n", $result['exception']);
printf("异常/错误码比率: %.2fx\n", $result['ratio']);
```

### 性能优化建议

```php
<?php
/**
 * 异常性能优化建议
 */

// 1. 不要在紧密循环中使用异常作为控制流
// 不好
function processItemsBad(array $items): array
{
    $results = [];
    foreach ($items as $item) {
        try {
            $results[] = processItem($item);
        } catch (SkipException $e) {
            continue;  // 不要用异常来跳过项目
        }
    }
    return $results;
}

// 好
function processItemsGood(array $items): array
{
    $results = [];
    foreach ($items as $item) {
        if ($item->shouldSkip()) {
            continue;
        }
        $results[] = processItem($item);
    }
    return $results;
}

// 2. 对于高频操作，考虑使用返回值而非异常
class ValidationResult
{
    public bool $valid;
    public array $errors;

    public function __construct(bool $valid, array $errors = [])
    {
        $this->valid = $valid;
        $this->errors = $errors;
    }

    public static function success(): self
    {
        return new self(true);
    }

    public static function failure(array $errors): self
    {
        return new self(false, $errors);
    }
}

// 3. 如果需要异常，考虑缓存或重用异常对象（仅限特殊场景）
class CachedExceptions
{
    private static ?InvalidArgumentException $invalidArg = null;

    public static function getInvalidArgumentException(): InvalidArgumentException
    {
        if (self::$invalidArg === null) {
            self::$invalidArg = new InvalidArgumentException('参数无效');
        }
        return self::$invalidArg;
    }
}
```

## 实战场景

### API 错误处理

```php
<?php
/**
 * RESTful API 异常处理示例
 */

// 定义 API 异常
class ApiException extends Exception
{
    protected int $httpStatusCode;
    protected string $errorCode;
    protected array $details;

    public function __construct(
        string $message,
        int $httpStatusCode = 500,
        string $errorCode = 'INTERNAL_ERROR',
        array $details = [],
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
        $this->httpStatusCode = $httpStatusCode;
        $this->errorCode = $errorCode;
        $this->details = $details;
    }

    public function toResponse(): array
    {
        return [
            'success' => false,
            'error' => [
                'code' => $this->errorCode,
                'message' => $this->message,
                'details' => $this->details,
            ],
        ];
    }

    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }
}

// 具体的 API 异常
class ApiValidationException extends ApiException
{
    public function __construct(array $errors)
    {
        parent::__construct(
            '请求参数验证失败',
            422,
            'VALIDATION_ERROR',
            ['fields' => $errors]
        );
    }
}

class ApiNotFoundException extends ApiException
{
    public function __construct(string $resource, mixed $id)
    {
        parent::__construct(
            "请求的资源不存在",
            404,
            'NOT_FOUND',
            ['resource' => $resource, 'id' => $id]
        );
    }
}

class ApiRateLimitException extends ApiException
{
    public function __construct(int $retryAfter)
    {
        parent::__construct(
            '请求过于频繁',
            429,
            'RATE_LIMIT_EXCEEDED',
            ['retry_after' => $retryAfter]
        );
    }
}

// API 控制器基类
abstract class ApiController
{
    protected function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    protected function handleRequest(callable $action): void
    {
        try {
            $result = $action();
            $this->json(['success' => true, 'data' => $result]);

        } catch (ApiException $e) {
            $this->json($e->toResponse(), $e->getHttpStatusCode());

        } catch (Throwable $e) {
            error_log($e->getMessage());
            $this->json([
                'success' => false,
                'error' => [
                    'code' => 'INTERNAL_ERROR',
                    'message' => '服务器内部错误',
                ],
            ], 500);
        }
    }
}

// 使用示例
class UserController extends ApiController
{
    public function create(): void
    {
        $this->handleRequest(function () {
            $data = json_decode(file_get_contents('php://input'), true);

            // 验证
            $errors = $this->validate($data);
            if (!empty($errors)) {
                throw new ApiValidationException($errors);
            }

            // 创建用户
            $user = $this->userService->create($data);

            return $user->toArray();
        });
    }

    public function show(int $id): void
    {
        $this->handleRequest(function () use ($id) {
            $user = $this->userService->findById($id);

            if ($user === null) {
                throw new ApiNotFoundException('user', $id);
            }

            return $user->toArray();
        });
    }
}
```

### 数据库事务处理

```php
<?php
/**
 * 带有异常处理的数据库事务
 */
class TransactionManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * 在事务中执行操作
     */
    public function transaction(callable $callback): mixed
    {
        $this->pdo->beginTransaction();

        try {
            $result = $callback($this->pdo);
            $this->pdo->commit();
            return $result;

        } catch (Throwable $e) {
            $this->pdo->rollBack();

            // 包装为特定异常
            throw new TransactionException(
                '事务执行失败',
                0,
                $e
            );
        }
    }

    /**
     * 带重试的事务
     */
    public function transactionWithRetry(
        callable $callback,
        int $maxRetries = 3,
        int $delayMs = 100
    ): mixed {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $maxRetries) {
            try {
                return $this->transaction($callback);

            } catch (TransactionException $e) {
                $lastException = $e;
                $attempts++;

                // 检查是否是可重试的错误（如死锁）
                $previous = $e->getPrevious();
                if ($previous instanceof PDOException) {
                    $sqlState = $previous->getCode();

                    // 40001 = 序列化错误, 40P01 = 死锁
                    if (!in_array($sqlState, ['40001', '40P01'])) {
                        throw $e;  // 不可重试的错误
                    }
                }

                if ($attempts < $maxRetries) {
                    usleep($delayMs * 1000 * $attempts);  // 指数退避
                }
            }
        }

        throw new TransactionException(
            "事务在 {$maxRetries} 次尝试后仍然失败",
            0,
            $lastException
        );
    }
}

// 使用示例
class OrderService
{
    private TransactionManager $txManager;

    public function createOrder(array $items, User $user): Order
    {
        return $this->txManager->transactionWithRetry(function (PDO $pdo) use ($items, $user) {
            // 创建订单
            $order = $this->orderRepository->create([
                'user_id' => $user->id,
                'status' => 'pending',
            ]);

            foreach ($items as $item) {
                // 检查库存
                $product = $this->productRepository->findForUpdate($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    throw new InsufficientStockException(
                        $product->name,
                        $product->stock,
                        $item['quantity']
                    );
                }

                // 扣减库存
                $this->productRepository->decrementStock(
                    $product->id,
                    $item['quantity']
                );

                // 创建订单项
                $this->orderItemRepository->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                ]);
            }

            return $order;
        });
    }
}
```

### 外部服务调用

```php
<?php
/**
 * 外部服务调用异常处理
 */
class HttpClient
{
    private int $timeout;
    private int $maxRetries;

    public function __construct(int $timeout = 30, int $maxRetries = 3)
    {
        $this->timeout = $timeout;
        $this->maxRetries = $maxRetries;
    }

    public function request(string $method, string $url, array $options = []): array
    {
        $attempts = 0;
        $lastException = null;

        while ($attempts < $this->maxRetries) {
            try {
                return $this->doRequest($method, $url, $options);

            } catch (HttpTimeoutException $e) {
                $lastException = $e;
                $attempts++;

                if ($attempts < $this->maxRetries) {
                    sleep(pow(2, $attempts));  // 指数退避
                }

            } catch (HttpClientException $e) {
                // 4xx 错误不重试
                throw $e;
            }
        }

        throw new HttpException(
            "请求在 {$this->maxRetries} 次尝试后失败",
            0,
            $lastException
        );
    }

    private function doRequest(string $method, string $url, array $options): array
    {
        $ch = curl_init();

        try {
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => $this->timeout,
                CURLOPT_CUSTOMREQUEST => $method,
            ]);

            if (isset($options['json'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($options['json']));
                curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            }

            $response = curl_exec($ch);
            $errno = curl_errno($ch);
            $error = curl_error($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($errno !== 0) {
                if ($errno === CURLE_OPERATION_TIMEDOUT) {
                    throw new HttpTimeoutException("请求超时: {$url}");
                }
                throw new HttpException("cURL 错误 [{$errno}]: {$error}");
            }

            if ($httpCode >= 400 && $httpCode < 500) {
                throw new HttpClientException(
                    "客户端错误 [{$httpCode}]",
                    $httpCode,
                    null,
                    ['url' => $url, 'response' => $response]
                );
            }

            if ($httpCode >= 500) {
                throw new HttpServerException(
                    "服务器错误 [{$httpCode}]",
                    $httpCode,
                    null,
                    ['url' => $url]
                );
            }

            return [
                'status' => $httpCode,
                'body' => json_decode($response, true) ?? $response,
            ];

        } finally {
            curl_close($ch);
        }
    }
}

// 使用示例
class PaymentGateway
{
    private HttpClient $client;
    private string $apiKey;

    public function charge(float $amount, string $token): PaymentResult
    {
        try {
            $response = $this->client->request('POST', 'https://api.payment.com/charge', [
                'json' => [
                    'amount' => $amount,
                    'token' => $token,
                ],
                'headers' => [
                    'Authorization' => "Bearer {$this->apiKey}",
                ],
            ]);

            return PaymentResult::success($response['body']['transaction_id']);

        } catch (HttpClientException $e) {
            // 处理客户端错误（如卡被拒绝）
            $body = $e->getContext()['response'] ?? null;
            $errorCode = $body['error']['code'] ?? 'unknown';

            return match ($errorCode) {
                'card_declined' => PaymentResult::declined('卡被拒绝'),
                'insufficient_funds' => PaymentResult::declined('余额不足'),
                default => PaymentResult::failed("支付失败: {$errorCode}"),
            };

        } catch (HttpException $e) {
            // 记录服务器错误
            error_log("支付网关错误: " . $e->getMessage());
            throw new PaymentGatewayException('支付服务暂时不可用', 0, $e);
        }
    }
}
```

## 面试要点

### 基础概念

**Q: Exception 和 Error 的区别是什么？**

A: 在 PHP 7 之前，只有 `Exception` 用于异常处理。PHP 7 引入了 `Throwable` 接口和 `Error` 类：

- `Exception`：表示可以被应用程序捕获和处理的异常情况
- `Error`：表示 PHP 引擎级别的错误，如类型错误、解析错误等
- 两者都实现了 `Throwable` 接口，可以使用 `catch (Throwable $t)` 同时捕获

### 异常处理机制

**Q: finally 块在什么情况下会执行？**

A: `finally` 块在以下情况下都会执行：
- try 块正常执行完成
- try 块中抛出异常被 catch 捕获
- try 块中抛出异常未被捕获（finally 执行后异常继续传播）
- try 或 catch 块中有 return 语句（finally 在 return 之前执行）

唯一不执行的情况是调用了 `exit()` 或 `die()`。

### 异常链

**Q: 什么是异常链？为什么要使用它？**

A: 异常链是将原始异常作为新异常的 `$previous` 参数传递，保留完整的错误上下文：

```php
try {
    // 底层操作
} catch (LowLevelException $e) {
    throw new HighLevelException("更高层的错误描述", 0, $e);
}
```

好处：
- 保留原始错误信息和堆栈跟踪
- 提供更好的错误上下文和抽象
- 便于调试和日志记录

### SPL 异常

**Q: LogicException 和 RuntimeException 的区别？**

A:
- `LogicException`：表示代码逻辑错误，理论上应该在开发阶段通过代码审查或测试发现
  - 例如：`InvalidArgumentException`、`OutOfRangeException`

- `RuntimeException`：表示只有在运行时才能发现的错误
  - 例如：`OutOfBoundsException`、`UnexpectedValueException`

### 最佳实践

**Q: 什么时候应该使用异常，什么时候使用返回值？**

A:
使用异常：
- 错误情况是真正的异常（不是正常业务流程）
- 需要在多层调用栈中传播错误
- 错误需要中断当前操作

使用返回值：
- "未找到"等正常的业务情况
- 高频操作（性能敏感）
- 简单的验证结果

### 性能问题

**Q: 异常对性能有什么影响？**

A: 异常有一定的性能开销：
- 创建异常对象时会生成堆栈跟踪
- 抛出异常涉及堆栈展开
- 异常比返回值慢约 10-100 倍

优化建议：
- 不要在紧密循环中使用异常
- 不要用异常控制正常流程
- 对于高频操作，考虑使用返回值

## 延伸阅读

### 官方文档

- [PHP 异常处理](https://www.php.net/manual/zh/language.exceptions.php)
- [Exception 类](https://www.php.net/manual/zh/class.exception.php)
- [Throwable 接口](https://www.php.net/manual/zh/class.throwable.php)
- [SPL 异常](https://www.php.net/manual/zh/spl.exceptions.php)
- [Error 类](https://www.php.net/manual/zh/class.error.php)

### PSR 标准

- [PSR-3: Logger Interface](https://www.php-fig.org/psr/psr-3/) - 日志接口标准
- [PSR-15: HTTP Server Request Handlers](https://www.php-fig.org/psr/psr-15/) - HTTP 请求处理器，包含异常处理

### 推荐书籍

- 《PHP Objects, Patterns, and Practice》- Matt Zandstra
- 《Modern PHP》- Josh Lockhart
- 《Clean Code》- Robert C. Martin（通用的错误处理最佳实践）

### 优质文章

- [PHP 7 错误处理](https://www.php.net/manual/zh/language.errors.php7.php)
- [Exception Best Practices in PHP](https://www.php.net/manual/zh/language.exceptions.php#language.exceptions.extending)
- [Handling Exceptions in Laravel](https://laravel.com/docs/errors)
- [Symfony Exception Handling](https://symfony.com/doc/current/controller/error_pages.html)
