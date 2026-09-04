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
origin: old/src/content/docs/php/exceptions.en.md
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

Exception handling is an indispensable error management mechanism in modern PHP development. Through exceptions, we can separate error handling code from normal business logic, building more robust and maintainable applications. This article will comprehensively cover all aspects of PHP exception handling.

## Conceptual Explanation

### What is an Exception

An exception is an unexpected situation or error condition that occurs during program execution. Unlike traditional error handling methods (such as returning error codes), exceptions provide a structured way to handle errors, allowing them to propagate up the call stack until they are caught by an appropriate handler.

### Historical Evolution of Exceptions

- **PHP 5.0 (2004)**: Introduced basic exception handling mechanism, including the `Exception` base class and `try/catch` syntax
- **PHP 5.1 (2005)**: Introduced SPL (Standard PHP Library) exception classes
- **PHP 5.5 (2013)**: Introduced the `finally` block
- **PHP 7.0 (2015)**: Introduced the `Throwable` interface, unifying the handling of `Exception` and `Error`; supported catching multiple exception types in a single `catch` block
- **PHP 7.1 (2016)**: Supported catching multiple exception types in `catch` blocks (using `|` separator)
- **PHP 8.0 (2020)**: Introduced `match` expression for more elegant exception handling; `catch` blocks can omit the exception variable

### Problems Solved by Exceptions

1. **Separation of error handling and business logic**: Centralized management of error handling code
2. **Error propagation**: Automatically propagates up the call stack without manual return value checking
3. **Detailed error information**: Contains message, code, file, line number, and stack trace
4. **Typed errors**: Distinguishes different types of errors through exception class hierarchy

## Core Principles

### The Throwable Interface

Since PHP 7, all throwable objects must implement the `Throwable` interface. This interface defines the following methods:

```php
<?php
interface Throwable {
    public function getMessage(): string;       // Get exception message
    public function getCode(): int;             // Get exception code
    public function getFile(): string;          // Get file where exception occurred
    public function getLine(): int;             // Get line number where exception occurred
    public function getTrace(): array;          // Get stack trace array
    public function getTraceAsString(): string; // Get stack trace as string
    public function getPrevious(): ?Throwable;  // Get previous exception
    public function __toString(): string;       // Convert to string
}
```

### Exception Class Hierarchy

```
Throwable (interface)
├── Error (PHP 7+, internal errors)
│   ├── ArithmeticError
│   │   └── DivisionByZeroError
│   ├── AssertionError
│   ├── CompileError
│   │   └── ParseError
│   ├── TypeError
│   │   └── ArgumentCountError
│   └── ValueError (PHP 8+)
│
└── Exception (user exceptions)
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

### Exception Propagation Mechanism

When an exception is thrown, PHP will:

1. Stop execution of the current code block
2. Search for a matching `catch` block in the current scope
3. If not found, propagate up the call stack
4. If still uncaught at the top level, call the global exception handler
5. If no global handler exists, produce a fatal error and terminate the script

```php
<?php
function level3() {
    throw new Exception("Exception thrown in level3");
}

function level2() {
    level3();  // Exception propagates from here
}

function level1() {
    try {
        level2();
    } catch (Exception $e) {
        echo "Caught in level1: " . $e->getMessage();
    }
}

level1();  // Output: Caught in level1: Exception thrown in level3
```

## Key Points

### Basic try/catch/finally Syntax

```php
<?php
try {
    // Code that might throw an exception
    $result = riskyOperation();

} catch (InvalidArgumentException $e) {
    // Catch a specific type of exception
    echo "Argument error: " . $e->getMessage();

} catch (RuntimeException $e) {
    // Catch another type of exception
    echo "Runtime error: " . $e->getMessage();

} catch (Exception $e) {
    // Catch all other Exceptions
    echo "General error: " . $e->getMessage();

} finally {
    // Executes regardless of whether an exception occurred
    cleanup();
}
```

### Throwing Exceptions

```php
<?php
// Basic throw
throw new Exception("An error occurred");

// With error code
throw new Exception("An error occurred", 1001);

// With previous exception (exception chaining)
throw new Exception("An error occurred", 1001, $previousException);

// Throw specific types of exceptions
throw new InvalidArgumentException("Invalid argument");
throw new RuntimeException("Runtime error");
```

### PHP 7.1+ Multi-type Catching

```php
<?php
try {
    $data = processData($input);

} catch (InvalidArgumentException | TypeError $e) {
    // Catch multiple exception types simultaneously
    echo "Input error: " . $e->getMessage();

} catch (PDOException | mysqli_sql_exception $e) {
    // Catch database-related exceptions
    echo "Database error: " . $e->getMessage();
}
```

### PHP 8.0+ Non-capturing Exceptions

```php
<?php
try {
    riskyOperation();

} catch (SpecificException) {
    // PHP 8.0+: Can omit exception variable when not needed
    log("A SpecificException occurred");
}
```

### Characteristics of the finally Block

The `finally` block executes in the following situations:

```php
<?php
function demonstrateFinally($scenario) {
    try {
        switch ($scenario) {
            case 'normal':
                echo "Normal execution\n";
                return "Normal return";

            case 'exception':
                throw new Exception("Test exception");

            case 'return_in_catch':
                throw new Exception("Test");
        }

    } catch (Exception $e) {
        echo "Exception caught\n";
        if ($scenario === 'return_in_catch') {
            return "Return from catch";
        }

    } finally {
        echo "finally executed\n";
        // Note: return in finally will override previous returns
    }

    return "Return at function end";
}

// Test various scenarios
echo demonstrateFinally('normal') . "\n";
// Output: Normal execution -> finally executed -> Normal return

echo demonstrateFinally('exception') . "\n";
// Output: Exception caught -> finally executed -> Return at function end

echo demonstrateFinally('return_in_catch') . "\n";
// Output: Exception caught -> finally executed -> Return from catch
```

### Re-throwing Exceptions

```php
<?php
function processData($data) {
    try {
        // Perform some operation
        validateData($data);

    } catch (ValidationException $e) {
        // Log the error
        error_log("Validation failed: " . $e->getMessage());

        // Re-throw the original exception
        throw $e;

        // Or wrap and throw a new exception
        // throw new ProcessingException("Data processing failed", 0, $e);
    }
}
```

## Code Examples

### Detailed Exception Class Usage

```php
<?php
/**
 * Complete usage demonstration of the Exception class
 */
function demonstrateException() {
    try {
        // Create and throw an exception
        throw new Exception(
            "This is the exception message",  // Message
            1001                               // Error code
        );

    } catch (Exception $e) {
        // Get basic information
        echo "Message: " . $e->getMessage() . "\n";
        echo "Code: " . $e->getCode() . "\n";
        echo "File: " . $e->getFile() . "\n";
        echo "Line: " . $e->getLine() . "\n";

        // Get stack trace
        echo "\nStack trace array:\n";
        print_r($e->getTrace());

        echo "\nStack trace string:\n";
        echo $e->getTraceAsString() . "\n";

        // Get previous exception
        echo "\nPrevious exception: ";
        var_dump($e->getPrevious());

        // String representation
        echo "\nString representation:\n";
        echo $e . "\n";  // Calls __toString()
    }
}

demonstrateException();
```

### Custom Exception Classes

```php
<?php
/**
 * Application base exception class
 */
class AppException extends Exception
{
    /**
     * Additional context information
     */
    protected array $context = [];

    /**
     * HTTP status code (for API responses)
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
     * Get context information
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Add context information
     */
    public function withContext(array $context): self
    {
        $this->context = array_merge($this->context, $context);
        return $this;
    }

    /**
     * Get HTTP status code
     */
    public function getHttpStatusCode(): int
    {
        return $this->httpStatusCode;
    }

    /**
     * Convert to array (for API responses)
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
     * Convert to JSON
     */
    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_UNESCAPED_UNICODE);
    }
}

/**
 * Validation exception
 */
class ValidationException extends AppException
{
    protected int $httpStatusCode = 422;

    /**
     * Field error list
     */
    private array $errors = [];

    public function __construct(
        array $errors,
        string $message = 'Data validation failed'
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
 * Resource not found exception
 */
class NotFoundException extends AppException
{
    protected int $httpStatusCode = 404;

    public function __construct(
        string $resource,
        mixed $identifier,
        ?Throwable $previous = null
    ) {
        $message = sprintf('%s not found: %s', $resource, $identifier);
        parent::__construct($message, 404, $previous, [
            'resource' => $resource,
            'identifier' => $identifier
        ]);
    }
}

/**
 * Authentication exception
 */
class AuthenticationException extends AppException
{
    protected int $httpStatusCode = 401;

    public function __construct(
        string $message = 'Authentication failed',
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 401, $previous);
    }
}

/**
 * Authorization exception
 */
class AuthorizationException extends AppException
{
    protected int $httpStatusCode = 403;

    public function __construct(
        string $message = 'Insufficient permissions',
        ?string $permission = null,
        ?Throwable $previous = null
    ) {
        parent::__construct($message, 403, $previous, [
            'required_permission' => $permission
        ]);
    }
}

/**
 * Business logic exception
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
 * External service exception
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
            "External service [{$serviceName}] error: {$message}",
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

### Exception Chaining

```php
<?php
/**
 * Exception chaining demonstration
 *
 * Exception chaining allows us to create a new exception after catching one
 * while preserving the original exception's information
 */
class DatabaseConnectionException extends Exception {}
class RepositoryException extends Exception {}
class ServiceException extends Exception {}

/**
 * Database layer
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
        // Wrap the low-level exception, adding more context
        throw new DatabaseConnectionException(
            'Unable to establish database connection',
            1001,
            $e  // Preserve original exception
        );
    }
}

/**
 * Repository layer
 */
function findUserById(int $id): array
{
    try {
        $pdo = connectToDatabase();
        // ... query database
        return ['id' => $id, 'name' => 'Test'];

    } catch (DatabaseConnectionException $e) {
        throw new RepositoryException(
            "Unable to query user ID: {$id}",
            2001,
            $e  // Preserve database exception
        );
    }
}

/**
 * Service layer
 */
function getUserProfile(int $id): array
{
    try {
        $user = findUserById($id);
        return ['profile' => $user];

    } catch (RepositoryException $e) {
        throw new ServiceException(
            'Failed to get user profile',
            3001,
            $e  // Preserve repository exception
        );
    }
}

/**
 * Get the complete exception chain
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
 * Format and print exception chain
 */
function printExceptionChain(Throwable $e, int $level = 0): void
{
    $indent = str_repeat('  ', $level);

    echo "{$indent}[" . get_class($e) . "]\n";
    echo "{$indent}Message: {$e->getMessage()}\n";
    echo "{$indent}Code: {$e->getCode()}\n";
    echo "{$indent}Location: {$e->getFile()}:{$e->getLine()}\n";

    if ($e->getPrevious() !== null) {
        echo "{$indent}Caused by:\n";
        printExceptionChain($e->getPrevious(), $level + 1);
    }
}

// Usage example
try {
    $profile = getUserProfile(1);

} catch (ServiceException $e) {
    echo "=== Exception Chain Details ===\n\n";
    printExceptionChain($e);

    echo "\n=== Exception Chain Array ===\n";
    print_r(getExceptionChain($e));
}
```

### Detailed SPL Exception Classes

```php
<?php
/**
 * SPL (Standard PHP Library) Exception Classes Usage Guide
 *
 * SPL provides two major categories of exceptions:
 * 1. LogicException - Code logic errors (should be discovered during development)
 * 2. RuntimeException - Runtime errors (can only be discovered at runtime)
 */

// ============================================================
// LogicException and its subclasses - Represent problems with the code itself
// ============================================================

/**
 * InvalidArgumentException - Invalid argument
 * Used when a passed argument doesn't meet expectations
 */
function divide(int $a, int $b): float
{
    if ($b === 0) {
        throw new InvalidArgumentException('Divisor cannot be zero');
    }
    return $a / $b;
}

/**
 * LengthException - Length-related errors
 * Used when length is invalid (e.g., array length, string length)
 */
function createArray(int $size): array
{
    if ($size < 0) {
        throw new LengthException('Array size cannot be negative');
    }
    if ($size > 1000000) {
        throw new LengthException('Array size exceeds maximum limit');
    }
    return array_fill(0, $size, null);
}

/**
 * OutOfRangeException - Index out of bounds (logic level)
 * Used when an illegal index is requested (determinable at compile time)
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
                "Index {$index} out of range [0, {$this->size})"
            );
        }
        $this->items[$index] = $value;
    }
}

/**
 * DomainException - Domain error
 * Used when a value is not within the expected domain range
 */
function setMonth(int $month): void
{
    if ($month < 1 || $month > 12) {
        throw new DomainException('Month must be between 1 and 12');
    }
    // Set month...
}

/**
 * BadFunctionCallException - Function call error
 * Used when a callback references an undefined function or missing arguments
 */
function callUserCallback(callable $callback, array $args): mixed
{
    if (!is_callable($callback)) {
        throw new BadFunctionCallException('Provided callback is not callable');
    }
    return call_user_func_array($callback, $args);
}

/**
 * BadMethodCallException - Method call error
 * Used when calling an undefined method or with wrong arguments
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
                "Method '{$name}' is not defined"
            );
        }
        return call_user_func_array($this->methods[$name], $arguments);
    }
}

// ============================================================
// RuntimeException and its subclasses - Represent problems discovered at runtime
// ============================================================

/**
 * OutOfBoundsException - Index out of bounds (runtime)
 * Used when accessing an illegal key (determinable only at runtime)
 */
class Dictionary
{
    private array $data = [];

    public function get(string $key): mixed
    {
        if (!array_key_exists($key, $this->data)) {
            throw new OutOfBoundsException("Key '{$key}' does not exist");
        }
        return $this->data[$key];
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }
}

/**
 * OverflowException - Overflow error
 * Used when adding elements to an already full container
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
            throw new OverflowException('Queue is full');
        }
        $this->items[] = $item;
    }
}

/**
 * UnderflowException - Underflow error
 * Used when performing invalid operations on an empty container
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
            throw new UnderflowException('Stack is empty');
        }
        return array_pop($this->items);
    }
}

/**
 * RangeException - Range error (runtime)
 * Used when a value exceeds range (usually arithmetic operation results)
 */
function calculatePercentage(float $part, float $total): float
{
    if ($total == 0) {
        throw new RangeException('Total cannot be zero');
    }
    $percentage = ($part / $total) * 100;
    if ($percentage < 0 || $percentage > 100) {
        throw new RangeException('Percentage must be between 0 and 100');
    }
    return $percentage;
}

/**
 * UnexpectedValueException - Unexpected value error
 * Used when a value doesn't match expected type/condition (runtime data validation)
 */
function processApiResponse(array $response): array
{
    if (!isset($response['status'])) {
        throw new UnexpectedValueException('API response missing status field');
    }

    if (!in_array($response['status'], ['success', 'error'])) {
        throw new UnexpectedValueException(
            "Unknown status value: {$response['status']}"
        );
    }

    return $response;
}

// ============================================================
// SPL Exception Usage Examples
// ============================================================

echo "=== SPL Exception Examples ===\n\n";

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
    $queue->enqueue('c');  // Overflow
} catch (OverflowException $e) {
    echo "OverflowException: {$e->getMessage()}\n";
}

// UnderflowException
try {
    $stack = new Stack();
    $stack->pop();  // Empty stack
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

### Global Exception Handler

```php
<?php
/**
 * Global Exception Handler
 *
 * Catches all unhandled exceptions
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
     * Register as global exception handler
     */
    public function register(): void
    {
        set_exception_handler([$this, 'handle']);
    }

    /**
     * Handle exception
     */
    public function handle(Throwable $e): void
    {
        // Log exception
        $this->log($e);

        // Clear output buffer
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // Determine HTTP status code
        $statusCode = $this->getStatusCode($e);
        http_response_code($statusCode);

        // Output based on request type
        if ($this->isJsonRequest()) {
            $this->outputJson($e, $statusCode);
        } else {
            $this->outputHtml($e, $statusCode);
        }

        exit(1);
    }

    /**
     * Log exception to file
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

        // Include exception chain
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
     * Get HTTP status code
     */
    private function getStatusCode(Throwable $e): int
    {
        if ($e instanceof AppException) {
            return $e->getHttpStatusCode();
        }

        // Return different status codes based on exception type
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
     * Check if this is a JSON request
     */
    private function isJsonRequest(): bool
    {
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        return str_contains($accept, 'application/json') ||
               str_contains($contentType, 'application/json');
    }

    /**
     * Output JSON response
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
     * Output HTML response
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
     * Get public error message
     */
    private function getPublicMessage(int $statusCode): string
    {
        return match ($statusCode) {
            400 => 'Bad Request',
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Resource Not Found',
            422 => 'Validation Failed',
            500 => 'Internal Server Error',
            502 => 'Bad Gateway',
            503 => 'Service Unavailable',
            default => 'An Error Occurred',
        };
    }

    /**
     * Render debug page
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exception: {$type}</title>
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
                <h2>Exception Location</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">File</div>
                        <div class="value">{$file}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Line</div>
                        <div class="value">{$line}</div>
                    </div>
                </div>
            </div>
            <div class="section">
                <h2>Stack Trace</h2>
                <pre>{$trace}</pre>
            </div>
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Render error page
     */
    private function renderErrorPage(int $statusCode): string
    {
        $message = $this->getPublicMessage($statusCode);

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error {$statusCode}</title>
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
        <a href="/" class="back-link">Return to Home</a>
    </div>
</body>
</html>
HTML;
    }
}

// Register global exception handler
$debug = getenv('APP_ENV') === 'development';
$handler = new GlobalExceptionHandler($debug);
$handler->register();
```

## Best Practices

### Use Exceptions Instead of Error Codes

```php
<?php
// Not recommended: Using error codes
function createUserBad(array $data): array
{
    if (empty($data['email'])) {
        return ['success' => false, 'error' => 'EMAIL_REQUIRED'];
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'error' => 'EMAIL_INVALID'];
    }
    // ... create user
    return ['success' => true, 'user' => $user];
}

// Recommended: Using exceptions
function createUserGood(array $data): User
{
    $errors = [];

    if (empty($data['email'])) {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Invalid email format';
    }

    if (!empty($errors)) {
        throw new ValidationException($errors);
    }

    // ... create user
    return $user;
}
```

### Create Meaningful Exception Hierarchies

```php
<?php
// Application exception base class
abstract class AppException extends Exception
{
    abstract public function getHttpStatusCode(): int;
}

// Client errors (4xx)
abstract class ClientException extends AppException {}

// Server errors (5xx)
abstract class ServerException extends AppException {}

// Specific client exceptions
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

// Specific server exceptions
class InternalServerException extends ServerException
{
    public function getHttpStatusCode(): int { return 500; }
}

class ServiceUnavailableException extends ServerException
{
    public function getHttpStatusCode(): int { return 503; }
}
```

### Use Exception Chaining to Preserve Context

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
            // Wrap database exception, add business context
            throw new RepositoryException(
                "Unable to fetch user ID: {$id}",
                0,
                $e  // Preserve original exception
            );
        }
    }
}
```

### Use finally for Resource Cleanup

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
                throw new RuntimeException("Unable to open file: {$filename}");
            }

            while (($line = fgets($handle)) !== false) {
                $results[] = $this->processLine($line);
            }

            return $results;

        } catch (ProcessingException $e) {
            // Handle specific exception
            throw new FileProcessingException(
                "Error processing file {$filename}",
                0,
                $e
            );

        } finally {
            // Ensure resource is released
            if ($handle !== null && is_resource($handle)) {
                fclose($handle);
            }
        }
    }
}
```

### Don't Ignore Exceptions

```php
<?php
// Very bad: Empty catch block
try {
    riskyOperation();
} catch (Exception $e) {
    // Do nothing - dangerous!
}

// Bad: Just simple logging
try {
    riskyOperation();
} catch (Exception $e) {
    error_log($e->getMessage());
    // Then what?
}

// Good: Proper handling
try {
    riskyOperation();
} catch (RecoverableException $e) {
    // Recoverable exception: log and continue
    $this->logger->warning('Operation failed, using default value', [
        'exception' => $e->getMessage()
    ]);
    return $defaultValue;

} catch (CriticalException $e) {
    // Critical exception: log and re-throw
    $this->logger->error('Critical error', [
        'exception' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
    throw $e;
}
```

### Provide Meaningful Error Messages

```php
<?php
// Bad: Vague messages
throw new Exception('Error');
throw new Exception('Operation failed');

// Good: Specific, actionable messages
throw new Exception(sprintf(
    'Unable to connect to database %s@%s:%d, error: %s',
    $username,
    $host,
    $port,
    $error
));

throw new ValidationException([
    'email' => 'Invalid email format, should be example@domain.com format',
    'age' => 'Age must be an integer between 18 and 120',
]);
```

### Handle Exceptions at the Appropriate Level

```php
<?php
/**
 * Exception handling hierarchy principles:
 *
 * 1. Handle exceptions where you best know how to handle them
 * 2. If you don't know how to handle it, let it propagate upward
 * 3. Don't catch exceptions you can't properly handle
 */

// Controller layer: Handle and convert to HTTP response
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
            return new JsonResponse(['error' => 'Access denied'], 403);
        }
        // Other exceptions propagate to global handler
    }
}

// Service layer: Handle business logic related exceptions
class UserService
{
    public function getUser(int $id): User
    {
        $user = $this->repository->find($id);

        if ($user === null) {
            throw new NotFoundException('User', $id);
        }

        if (!$this->authService->canView($user)) {
            throw new AuthorizationException('Not authorized to view this user');
        }

        return $user;
    }
}

// Repository layer: Handle data access exceptions
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
                'Failed to query user',
                0,
                $e
            );
        }
    }
}
```

## Common Pitfalls

### Catching Overly Broad Exceptions

```php
<?php
// Pitfall: Catching all exceptions
try {
    $user = $userService->createUser($data);
} catch (Exception $e) {
    // This catches all exceptions, including those you might want to propagate
    echo "Failed to create user";
}

// Correct: Only catch expected exceptions
try {
    $user = $userService->createUser($data);
} catch (ValidationException $e) {
    // Handle validation errors
    return $this->renderValidationErrors($e->getErrors());
} catch (DuplicateEntryException $e) {
    // Handle duplicate record
    return $this->renderError('User already exists');
}
// Other exceptions propagate
```

### Throwing Exceptions in Loops

```php
<?php
// Pitfall: Throwing exception in loop interrupts the entire loop
function processItems(array $items): void
{
    foreach ($items as $item) {
        if (!$item->isValid()) {
            throw new ValidationException("Item {$item->id} is invalid");
            // Subsequent items won't be processed
        }
        $item->process();
    }
}

// Better: Collect errors and handle together
function processItemsBetter(array $items): ProcessResult
{
    $processed = [];
    $errors = [];

    foreach ($items as $item) {
        try {
            if (!$item->isValid()) {
                throw new ValidationException("Item {$item->id} is invalid");
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

### Throwing Exceptions in Destructors

```php
<?php
// Pitfall: Throwing exception in destructor
class BadResource
{
    public function __destruct()
    {
        if (!$this->cleanup()) {
            // Dangerous! Throwing exception in destructor can cause fatal error
            throw new Exception("Cleanup failed");
        }
    }
}

// Correct: Log errors in destructor instead of throwing exceptions
class GoodResource
{
    public function __destruct()
    {
        try {
            $this->cleanup();
        } catch (Exception $e) {
            error_log("Resource cleanup failed: " . $e->getMessage());
        }
    }

    // Provide explicit cleanup method
    public function close(): void
    {
        if (!$this->cleanup()) {
            throw new Exception("Cleanup failed");
        }
    }
}
```

### Losing Original Exception When Re-throwing

```php
<?php
// Pitfall: Losing original exception information
try {
    $this->database->query($sql);
} catch (PDOException $e) {
    // Original exception information is lost!
    throw new DatabaseException("Database error");
}

// Correct: Preserve original exception
try {
    $this->database->query($sql);
} catch (PDOException $e) {
    throw new DatabaseException(
        "Failed to execute SQL query",
        0,
        $e  // Preserve original exception
    );
}
```

### Return Override Issue in finally

```php
<?php
// Pitfall: return in finally overrides return in try/catch
function dangerousReturn(): string
{
    try {
        return "from try";
    } finally {
        return "from finally";  // This overrides the return value from try!
    }
}

echo dangerousReturn();  // Output: from finally

// Correct: Don't use return in finally
function safeReturn(): string
{
    $result = null;

    try {
        $result = "from try";
        return $result;
    } finally {
        // Only do cleanup work, don't return
        cleanup();
    }
}
```

### Using Exceptions for Flow Control

```php
<?php
// Pitfall: Using exceptions to control normal flow
function findUser(int $id): ?User
{
    try {
        return $this->repository->find($id);
    } catch (NotFoundException $e) {
        return null;  // Should not use exceptions for normal "not found" cases
    }
}

// Correct: Use return values for normal "not found" cases
function findUserBetter(int $id): ?User
{
    return $this->repository->find($id);  // Return null for not found
}

// If "must find", use a different method
function getUserOrFail(int $id): User
{
    $user = $this->repository->find($id);

    if ($user === null) {
        throw new NotFoundException('User', $id);
    }

    return $user;
}
```

## Performance Considerations

### Performance Overhead of Exceptions

```php
<?php
/**
 * Exception performance testing
 *
 * Exceptions have certain performance overhead, mainly from:
 * 1. Stack trace generation
 * 2. Object creation
 * 3. Stack unwinding
 */

// Performance test: Exceptions vs Return values
function benchmarkExceptions(int $iterations): array
{
    // Test returning error codes
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        $result = functionWithErrorCode(false);
        if ($result['error']) {
            // Handle error
        }
    }
    $errorCodeTime = microtime(true) - $start;

    // Test exceptions
    $start = microtime(true);
    for ($i = 0; $i < $iterations; $i++) {
        try {
            functionWithException(false);
        } catch (Exception $e) {
            // Handle exception
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
        return ['error' => true, 'message' => 'Operation failed'];
    }
    return ['error' => false, 'data' => 'success'];
}

function functionWithException(bool $success): string
{
    if (!$success) {
        throw new Exception('Operation failed');
    }
    return 'success';
}

// Run benchmark
$result = benchmarkExceptions(10000);
printf("Error codes: %.4f seconds\n", $result['error_code']);
printf("Exceptions: %.4f seconds\n", $result['exception']);
printf("Exception/Error code ratio: %.2fx\n", $result['ratio']);
```

### Performance Optimization Suggestions

```php
<?php
/**
 * Exception performance optimization suggestions
 */

// 1. Don't use exceptions as control flow in tight loops
// Bad
function processItemsBad(array $items): array
{
    $results = [];
    foreach ($items as $item) {
        try {
            $results[] = processItem($item);
        } catch (SkipException $e) {
            continue;  // Don't use exceptions to skip items
        }
    }
    return $results;
}

// Good
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

// 2. For high-frequency operations, consider using return values instead of exceptions
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

// 3. If exceptions are needed, consider caching or reusing exception objects (special scenarios only)
class CachedExceptions
{
    private static ?InvalidArgumentException $invalidArg = null;

    public static function getInvalidArgumentException(): InvalidArgumentException
    {
        if (self::$invalidArg === null) {
            self::$invalidArg = new InvalidArgumentException('Invalid argument');
        }
        return self::$invalidArg;
    }
}
```

## Real-world Scenarios

### API Error Handling

```php
<?php
/**
 * RESTful API exception handling example
 */

// Define API exceptions
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

// Specific API exceptions
class ApiValidationException extends ApiException
{
    public function __construct(array $errors)
    {
        parent::__construct(
            'Request parameter validation failed',
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
            "Requested resource not found",
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
            'Too many requests',
            429,
            'RATE_LIMIT_EXCEEDED',
            ['retry_after' => $retryAfter]
        );
    }
}

// API controller base class
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
                    'message' => 'Internal server error',
                ],
            ], 500);
        }
    }
}

// Usage example
class UserController extends ApiController
{
    public function create(): void
    {
        $this->handleRequest(function () {
            $data = json_decode(file_get_contents('php://input'), true);

            // Validation
            $errors = $this->validate($data);
            if (!empty($errors)) {
                throw new ApiValidationException($errors);
            }

            // Create user
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

### Database Transaction Handling

```php
<?php
/**
 * Database transactions with exception handling
 */
class TransactionManager
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Execute operation within a transaction
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

            // Wrap as specific exception
            throw new TransactionException(
                'Transaction execution failed',
                0,
                $e
            );
        }
    }

    /**
     * Transaction with retry
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

                // Check if it's a retryable error (e.g., deadlock)
                $previous = $e->getPrevious();
                if ($previous instanceof PDOException) {
                    $sqlState = $previous->getCode();

                    // 40001 = serialization error, 40P01 = deadlock
                    if (!in_array($sqlState, ['40001', '40P01'])) {
                        throw $e;  // Non-retryable error
                    }
                }

                if ($attempts < $maxRetries) {
                    usleep($delayMs * 1000 * $attempts);  // Exponential backoff
                }
            }
        }

        throw new TransactionException(
            "Transaction failed after {$maxRetries} attempts",
            0,
            $lastException
        );
    }
}

// Usage example
class OrderService
{
    private TransactionManager $txManager;

    public function createOrder(array $items, User $user): Order
    {
        return $this->txManager->transactionWithRetry(function (PDO $pdo) use ($items, $user) {
            // Create order
            $order = $this->orderRepository->create([
                'user_id' => $user->id,
                'status' => 'pending',
            ]);

            foreach ($items as $item) {
                // Check inventory
                $product = $this->productRepository->findForUpdate($item['product_id']);

                if ($product->stock < $item['quantity']) {
                    throw new InsufficientStockException(
                        $product->name,
                        $product->stock,
                        $item['quantity']
                    );
                }

                // Deduct inventory
                $this->productRepository->decrementStock(
                    $product->id,
                    $item['quantity']
                );

                // Create order item
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

### External Service Calls

```php
<?php
/**
 * External service call exception handling
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
                    sleep(pow(2, $attempts));  // Exponential backoff
                }

            } catch (HttpClientException $e) {
                // 4xx errors don't retry
                throw $e;
            }
        }

        throw new HttpException(
            "Request failed after {$this->maxRetries} attempts",
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
                    throw new HttpTimeoutException("Request timeout: {$url}");
                }
                throw new HttpException("cURL error [{$errno}]: {$error}");
            }

            if ($httpCode >= 400 && $httpCode < 500) {
                throw new HttpClientException(
                    "Client error [{$httpCode}]",
                    $httpCode,
                    null,
                    ['url' => $url, 'response' => $response]
                );
            }

            if ($httpCode >= 500) {
                throw new HttpServerException(
                    "Server error [{$httpCode}]",
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

// Usage example
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
            // Handle client errors (e.g., card declined)
            $body = $e->getContext()['response'] ?? null;
            $errorCode = $body['error']['code'] ?? 'unknown';

            return match ($errorCode) {
                'card_declined' => PaymentResult::declined('Card declined'),
                'insufficient_funds' => PaymentResult::declined('Insufficient funds'),
                default => PaymentResult::failed("Payment failed: {$errorCode}"),
            };

        } catch (HttpException $e) {
            // Log server errors
            error_log("Payment gateway error: " . $e->getMessage());
            throw new PaymentGatewayException('Payment service temporarily unavailable', 0, $e);
        }
    }
}
```

## Interview Key Points

### Basic Concepts

**Q: What is the difference between Exception and Error?**

A: Before PHP 7, only `Exception` was used for exception handling. PHP 7 introduced the `Throwable` interface and `Error` class:

- `Exception`: Represents exceptional situations that can be caught and handled by the application
- `Error`: Represents PHP engine-level errors, such as type errors, parse errors, etc.
- Both implement the `Throwable` interface and can be caught using `catch (Throwable $t)`

### Exception Handling Mechanism

**Q: Under what circumstances does the finally block execute?**

A: The `finally` block executes in the following situations:
- try block completes normally
- Exception thrown in try block is caught by catch
- Exception thrown in try block is not caught (finally executes then exception continues to propagate)
- return statement in try or catch block (finally executes before return)

The only case it doesn't execute is when `exit()` or `die()` is called.

### Exception Chaining

**Q: What is exception chaining? Why use it?**

A: Exception chaining is passing the original exception as the `$previous` parameter of a new exception, preserving complete error context:

```php
try {
    // Low-level operation
} catch (LowLevelException $e) {
    throw new HighLevelException("Higher-level error description", 0, $e);
}
```

Benefits:
- Preserves original error information and stack trace
- Provides better error context and abstraction
- Facilitates debugging and logging

### SPL Exceptions

**Q: What is the difference between LogicException and RuntimeException?**

A:
- `LogicException`: Represents code logic errors, theoretically should be discovered during development through code review or testing
  - Examples: `InvalidArgumentException`, `OutOfRangeException`

- `RuntimeException`: Represents errors that can only be discovered at runtime
  - Examples: `OutOfBoundsException`, `UnexpectedValueException`

### Best Practices

**Q: When should you use exceptions vs return values?**

A:
Use exceptions:
- Error situations are truly exceptional (not normal business flow)
- Need to propagate errors across multiple call stack levels
- Error needs to interrupt current operation

Use return values:
- "Not found" and other normal business situations
- High-frequency operations (performance sensitive)
- Simple validation results

### Performance Issues

**Q: How do exceptions affect performance?**

A: Exceptions have certain performance overhead:
- Creating exception objects generates stack traces
- Throwing exceptions involves stack unwinding
- Exceptions are approximately 10-100 times slower than return values

Optimization suggestions:
- Don't use exceptions in tight loops
- Don't use exceptions to control normal flow
- For high-frequency operations, consider using return values

## Further Reading

### Official Documentation

- [PHP Exception Handling](https://www.php.net/manual/en/language.exceptions.php)
- [Exception Class](https://www.php.net/manual/en/class.exception.php)
- [Throwable Interface](https://www.php.net/manual/en/class.throwable.php)
- [SPL Exceptions](https://www.php.net/manual/en/spl.exceptions.php)
- [Error Class](https://www.php.net/manual/en/class.error.php)

### PSR Standards

- [PSR-3: Logger Interface](https://www.php-fig.org/psr/psr-3/) - Logger interface standard
- [PSR-15: HTTP Server Request Handlers](https://www.php-fig.org/psr/psr-15/) - HTTP request handlers, includes exception handling

### Recommended Books

- "PHP Objects, Patterns, and Practice" - Matt Zandstra
- "Modern PHP" - Josh Lockhart
- "Clean Code" - Robert C. Martin (general error handling best practices)

### Quality Articles

- [PHP 7 Error Handling](https://www.php.net/manual/en/language.errors.php7.php)
- [Exception Best Practices in PHP](https://www.php.net/manual/en/language.exceptions.php#language.exceptions.extending)
- [Handling Exceptions in Laravel](https://laravel.com/docs/errors)
- [Symfony Exception Handling](https://symfony.com/doc/current/controller/error_pages.html)
