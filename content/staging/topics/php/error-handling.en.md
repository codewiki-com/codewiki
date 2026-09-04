---
title: PHP Error and Exception Handling
description: Master PHP error and exception handling including error levels, exception classes and custom error handlers
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - error handling
  - exceptions
status: imported
origin: old/src/content/docs/php/error-handling.en.md
divergence: 0.255
issues: []
legacy:
  category: PHP
  subcategory: Core Concepts
  order: 10
  lastUpdated: 2026-01-07
---

Effective error and exception handling is essential for building robust, maintainable PHP applications. This comprehensive guide covers everything from basic error types to advanced exception handling strategies and custom error handlers.

## Understanding PHP Errors

PHP errors occur when something goes wrong during script execution. Unlike exceptions, errors were historically the primary way PHP reported problems. Understanding the difference between errors and exceptions is crucial for effective debugging and error management.

### Errors vs Exceptions

```php
<?php
// Error - traditional way of reporting problems
// Often caused by coding mistakes or runtime issues
echo $undefinedVariable; // Notice: Undefined variable

// Exception - modern, object-oriented error handling
// Allows structured handling and recovery
throw new Exception("Something went wrong");
?>
```

**Key Differences:**

| Aspect | Errors | Exceptions |
|--------|--------|------------|
| Origin | Engine-level or triggered manually | Thrown explicitly in code |
| Handling | Error handlers | Try-catch blocks |
| Recovery | Limited options | Full control over recovery |
| Propagation | Depends on error level | Bubbles up call stack |
| Information | Error message, file, line | Full stack trace, custom data |

### Error Lifecycle

When an error occurs in PHP, the following sequence happens:

1. PHP detects the error condition
2. The error handler is invoked (default or custom)
3. Error is optionally logged
4. Script may continue or terminate based on error severity

```php
<?php
// Demonstration of error lifecycle
function demonstrateErrors() {
    // This triggers a notice (non-fatal)
    $value = $undefined; // Notice: Undefined variable

    echo "Script continues after notice\n";

    // This triggers a warning (non-fatal)
    include "nonexistent.php"; // Warning: Failed to open stream

    echo "Script continues after warning\n";

    // This would trigger a fatal error (script stops)
    // nonExistentFunction(); // Fatal error: Uncaught Error
}

demonstrateErrors();
?>
```

## Error Levels and Types

PHP defines multiple error levels, each representing a different severity of problem. Understanding these levels helps you configure appropriate error handling for different environments.

### Error Level Constants

```php
<?php
// Error level constants and their values
$errorLevels = [
    'E_ERROR'             => E_ERROR,             // 1 - Fatal runtime errors
    'E_WARNING'           => E_WARNING,           // 2 - Runtime warnings
    'E_PARSE'             => E_PARSE,             // 4 - Compile-time parse errors
    'E_NOTICE'            => E_NOTICE,            // 8 - Runtime notices
    'E_CORE_ERROR'        => E_CORE_ERROR,        // 16 - Fatal errors during startup
    'E_CORE_WARNING'      => E_CORE_WARNING,      // 32 - Warnings during startup
    'E_COMPILE_ERROR'     => E_COMPILE_ERROR,     // 64 - Fatal compile-time errors
    'E_COMPILE_WARNING'   => E_COMPILE_WARNING,   // 128 - Compile-time warnings
    'E_USER_ERROR'        => E_USER_ERROR,        // 256 - User-generated error
    'E_USER_WARNING'      => E_USER_WARNING,      // 512 - User-generated warning
    'E_USER_NOTICE'       => E_USER_NOTICE,       // 1024 - User-generated notice
    'E_STRICT'            => E_STRICT,            // 2048 - Coding standards warnings
    'E_RECOVERABLE_ERROR' => E_RECOVERABLE_ERROR, // 4096 - Catchable fatal error
    'E_DEPRECATED'        => E_DEPRECATED,        // 8192 - Runtime deprecation notices
    'E_USER_DEPRECATED'   => E_USER_DEPRECATED,   // 16384 - User-generated deprecation
    'E_ALL'               => E_ALL,               // All errors and warnings
];

foreach ($errorLevels as $name => $value) {
    printf("%-20s = %d\n", $name, $value);
}
?>
```

### Fatal Errors

Fatal errors stop script execution immediately. These indicate serious problems that PHP cannot recover from.

```php
<?php
// E_ERROR - Fatal runtime error
// Example: Calling undefined function
// undefinedFunction(); // Fatal error

// E_PARSE - Parse error (syntax error)
// Example: Missing semicolon
// echo "Hello" // Parse error

// E_CORE_ERROR - Fatal error during PHP startup
// Occurs when PHP cannot load a required extension

// E_COMPILE_ERROR - Fatal compile-time error
// Occurs when script cannot be compiled

// Example of triggering a user fatal error
function processData($data) {
    if (empty($data)) {
        trigger_error("Data cannot be empty", E_USER_ERROR);
    }
    return count($data);
}

// This will halt execution
// processData([]); // Fatal error: Data cannot be empty
?>
```

### Warnings

Warnings indicate potential problems but allow script execution to continue.

```php
<?php
// E_WARNING - Runtime warning
// Non-fatal error, script continues

// Example 1: File not found
$content = file_get_contents("nonexistent.txt");
// Warning: file_get_contents(): Failed to open stream

// Example 2: Division by zero (PHP 7.x warning, PHP 8+ DivisionByZeroError)
// $result = 10 / 0;

// Example 3: Invalid function argument
$array = [3, 1, 4, 1, 5];
sort($array, INVALID_CONSTANT);
// Warning: sort(): Invalid sort flag

// E_USER_WARNING - User-generated warning
function validateAge($age) {
    if ($age < 0) {
        trigger_error("Age cannot be negative", E_USER_WARNING);
        return false;
    }
    return true;
}

validateAge(-5); // Warning: Age cannot be negative
echo "Script continues\n";
?>
```

### Notices

Notices are informational messages about potential issues that might cause problems.

```php
<?php
// E_NOTICE - Runtime notice
// Indicates potential bugs that should be fixed

// Example 1: Undefined variable
echo $undefinedVar;
// Notice: Undefined variable: undefinedVar

// Example 2: Undefined array key
$array = ['name' => 'John'];
echo $array['age'];
// Notice: Undefined index: age (PHP 7.x)
// Warning: Undefined array key "age" (PHP 8+)

// Example 3: Undefined constant
// echo UNDEFINED_CONSTANT;
// Notice: Use of undefined constant (PHP 7.x)
// Error in PHP 8+

// E_USER_NOTICE - User-generated notice
function logDebug($message) {
    if (defined('DEBUG_MODE') && DEBUG_MODE) {
        trigger_error("Debug: $message", E_USER_NOTICE);
    }
}

define('DEBUG_MODE', true);
logDebug("Processing started"); // Notice: Debug: Processing started
?>
```

### Deprecation Notices

Deprecation notices warn about features that will be removed in future PHP versions.

```php
<?php
// E_DEPRECATED - PHP deprecation notice
// Indicates features that will be removed

// Example: Using deprecated functions (varies by PHP version)
// $encoded = utf8_encode("Hello"); // Deprecated in PHP 8.2

// E_USER_DEPRECATED - User-generated deprecation
/**
 * @deprecated 2.0.0 Use newMethod() instead
 */
function oldMethod() {
    trigger_error(
        "oldMethod() is deprecated, use newMethod() instead",
        E_USER_DEPRECATED
    );
    return newMethod();
}

function newMethod() {
    return "New implementation";
}

$result = oldMethod(); // Deprecated: oldMethod() is deprecated
echo $result;
?>
```

### Strict Standards (E_STRICT)

Strict notices help identify code that may not be forward-compatible.

```php
<?php
// E_STRICT - Strict coding standards
// Helps ensure code portability and best practices

// Example: Static method called non-statically
class Example {
    public static function staticMethod() {
        return "Called statically";
    }
}

// In older PHP versions, this triggers E_STRICT
// $obj = new Example();
// $obj->staticMethod(); // Should be Example::staticMethod()
?>
```

## Error Configuration

Properly configuring error handling is crucial for both development and production environments.

### php.ini Settings

```ini
; Development environment settings
error_reporting = E_ALL
display_errors = On
display_startup_errors = On
log_errors = On
error_log = /var/log/php/error.log
html_errors = On

; Production environment settings
error_reporting = E_ALL & ~E_DEPRECATED & ~E_STRICT
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log
html_errors = Off
```

### Runtime Configuration

```php
<?php
// Set error reporting level at runtime
error_reporting(E_ALL);

// Display errors (development only!)
ini_set('display_errors', '1');

// Log errors to file
ini_set('log_errors', '1');
ini_set('error_log', '/var/log/php/application.log');

// Check current settings
echo "Error Reporting: " . error_reporting() . "\n";
echo "Display Errors: " . ini_get('display_errors') . "\n";
echo "Log Errors: " . ini_get('log_errors') . "\n";
echo "Error Log: " . ini_get('error_log') . "\n";

// Common error reporting configurations
// Report all errors
error_reporting(E_ALL);

// Report all errors except notices
error_reporting(E_ALL & ~E_NOTICE);

// Report all errors except notices and deprecations
error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED);

// Report only errors and warnings
error_reporting(E_ERROR | E_WARNING);

// Turn off all error reporting (not recommended)
error_reporting(0);
?>
```

### Environment-Based Configuration

```php
<?php
// Define environment
define('ENVIRONMENT', getenv('APP_ENV') ?: 'production');

// Configure based on environment
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
        // Safest default
        error_reporting(E_ALL);
        ini_set('display_errors', '0');
}
?>
```

## Exception Handling

Exceptions provide a structured way to handle errors using try-catch blocks. PHP 7+ improved exception handling significantly with the Throwable interface.

### The Throwable Hierarchy

```php
<?php
/*
Throwable (interface)
├── Error (internal PHP errors, PHP 7+)
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
└── Exception (user-land exceptions)
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

### Basic Try-Catch

```php
<?php
// Basic exception handling
function divide($a, $b) {
    if ($b === 0) {
        throw new InvalidArgumentException("Division by zero is not allowed");
    }
    return $a / $b;
}

try {
    $result = divide(10, 0);
    echo "Result: $result";
} catch (InvalidArgumentException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}

// Script continues after catch
echo "Execution continues\n";
?>
```

### Multiple Catch Blocks

```php
<?php
function processInput($input) {
    if (!is_string($input)) {
        throw new TypeError("Input must be a string");
    }
    if (empty($input)) {
        throw new InvalidArgumentException("Input cannot be empty");
    }
    if (strlen($input) > 100) {
        throw new LengthException("Input too long");
    }
    return strtoupper($input);
}

try {
    $result = processInput("");
} catch (TypeError $e) {
    echo "Type Error: " . $e->getMessage() . "\n";
} catch (InvalidArgumentException $e) {
    echo "Invalid Argument: " . $e->getMessage() . "\n";
} catch (LengthException $e) {
    echo "Length Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    // Catch any other exceptions
    echo "General Error: " . $e->getMessage() . "\n";
}
?>
```

### Catching Multiple Exception Types (PHP 7.1+)

```php
<?php
function riskyOperation($type) {
    switch ($type) {
        case 'invalid':
            throw new InvalidArgumentException("Invalid argument");
        case 'runtime':
            throw new RuntimeException("Runtime error");
        case 'type':
            throw new TypeError("Type error");
        default:
            return "Success";
    }
}

try {
    $result = riskyOperation('invalid');
} catch (InvalidArgumentException | RuntimeException $e) {
    // Handle both exception types the same way
    echo "Caught: " . get_class($e) . " - " . $e->getMessage() . "\n";
} catch (TypeError $e) {
    echo "Type error occurred\n";
}
?>
```

### The Finally Block

The finally block executes regardless of whether an exception was thrown or caught.

```php
<?php
class DatabaseConnection {
    private $connected = false;

    public function connect() {
        $this->connected = true;
        echo "Connected to database\n";
    }

    public function disconnect() {
        $this->connected = false;
        echo "Disconnected from database\n";
    }

    public function query($sql) {
        if (!$this->connected) {
            throw new RuntimeException("Not connected to database");
        }
        if (empty($sql)) {
            throw new InvalidArgumentException("Query cannot be empty");
        }
        echo "Executing: $sql\n";
        return true;
    }
}

$db = new DatabaseConnection();

try {
    $db->connect();
    $db->query("SELECT * FROM users");
    $db->query(""); // This will throw an exception
} catch (InvalidArgumentException $e) {
    echo "Query Error: " . $e->getMessage() . "\n";
} catch (RuntimeException $e) {
    echo "Connection Error: " . $e->getMessage() . "\n";
} finally {
    // Always disconnect, even if exception occurred
    $db->disconnect();
    echo "Cleanup completed\n";
}
?>
```

### Exception Properties and Methods

```php
<?php
try {
    throw new Exception("Something went wrong", 500);
} catch (Exception $e) {
    // Get exception information
    echo "Message: " . $e->getMessage() . "\n";     // Error message
    echo "Code: " . $e->getCode() . "\n";           // Error code
    echo "File: " . $e->getFile() . "\n";           // File where thrown
    echo "Line: " . $e->getLine() . "\n";           // Line number
    echo "Trace:\n" . $e->getTraceAsString() . "\n"; // Stack trace as string

    // Get trace as array
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

### Re-throwing Exceptions

```php
<?php
function lowLevelOperation() {
    // Simulate a low-level error
    throw new RuntimeException("Database connection failed");
}

function midLevelOperation() {
    try {
        lowLevelOperation();
    } catch (RuntimeException $e) {
        // Log the original error
        error_log($e->getMessage());

        // Re-throw with more context
        throw new Exception(
            "Mid-level operation failed: " . $e->getMessage(),
            0,
            $e // Previous exception
        );
    }
}

function highLevelOperation() {
    try {
        midLevelOperation();
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";

        // Access the original exception
        if ($previous = $e->getPrevious()) {
            echo "Caused by: " . $previous->getMessage() . "\n";
        }
    }
}

highLevelOperation();
?>
```

### Catching Errors (PHP 7+)

```php
<?php
// PHP 7+ allows catching Error as well as Exception

function callUndefined() {
    return undefinedFunction();
}

try {
    callUndefined();
} catch (Error $e) {
    echo "Error caught: " . $e->getMessage() . "\n";
}

// Catching both Error and Exception
try {
    // Could throw either Error or Exception
    $value = random_int(0, 1) ? undefinedFunction() : throw new Exception("Random exception");
} catch (Throwable $e) {
    // Catches both Error and Exception
    echo "Caught: " . get_class($e) . " - " . $e->getMessage() . "\n";
}

// Specific error types
try {
    // TypeError
    $array = [];
    $array->method(); // Call method on non-object
} catch (TypeError $e) {
    echo "Type error: " . $e->getMessage() . "\n";
}

try {
    // ArgumentCountError (PHP 7.1+)
    function requiresArgs($a, $b, $c) {
        return $a + $b + $c;
    }
    requiresArgs(1); // Missing arguments
} catch (ArgumentCountError $e) {
    echo "Argument count error: " . $e->getMessage() . "\n";
}
?>
```

## Custom Exception Classes

Creating custom exception classes allows for more specific error handling and additional context.

### Basic Custom Exception

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
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Invalid email format';
    }

    if (empty($data['password'])) {
        $errors['password'] = 'Password is required';
    } elseif (strlen($data['password']) < 8) {
        $errors['password'] = 'Password must be at least 8 characters';
    }

    if (!empty($errors)) {
        throw new ValidationException('Validation failed', $errors);
    }
}

try {
    validateUser([
        'email' => 'invalid-email',
        'password' => '123'
    ]);
} catch (ValidationException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Validation Errors:\n";
    foreach ($e->getErrors() as $field => $error) {
        echo "  - $field: $error\n";
    }
}
?>
```

### HTTP Exception Classes

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

    public function __construct(string $message = "Resource not found") {
        parent::__construct($message, 404);
    }
}

class UnauthorizedException extends HttpException {
    protected int $statusCode = 401;

    public function __construct(string $message = "Unauthorized") {
        parent::__construct($message, 401);
        $this->headers['WWW-Authenticate'] = 'Bearer';
    }
}

class ForbiddenException extends HttpException {
    protected int $statusCode = 403;

    public function __construct(string $message = "Access forbidden") {
        parent::__construct($message, 403);
    }
}

class BadRequestException extends HttpException {
    protected int $statusCode = 400;

    public function __construct(string $message = "Bad request") {
        parent::__construct($message, 400);
    }
}

class ConflictException extends HttpException {
    protected int $statusCode = 409;

    public function __construct(string $message = "Resource conflict") {
        parent::__construct($message, 409);
    }
}

// Usage in a controller
class UserController {
    private array $users = [
        1 => ['name' => 'John', 'email' => 'john@example.com'],
        2 => ['name' => 'Jane', 'email' => 'jane@example.com'],
    ];

    public function getUser(int $id): array {
        if (!isset($this->users[$id])) {
            throw new NotFoundException("User with ID $id not found");
        }
        return $this->users[$id];
    }
}

// Exception handler for HTTP exceptions
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

### Domain-Specific Exceptions

```php
<?php
// Base application exception
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

// Payment-related exceptions
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
                "Insufficient funds: required %.2f, available %.2f",
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
            'do_not_honor' => 'Card was declined by the bank',
            'insufficient_funds' => 'Insufficient funds on card',
            'expired_card' => 'Card has expired',
            'invalid_cvv' => 'Invalid security code',
        ];

        parent::__construct(
            $messages[$declineCode] ?? 'Card declined',
            'CARD_DECLINED',
            $transactionId
        );
        $this->declineCode = $declineCode;
    }

    public function getDeclineCode(): string {
        return $this->declineCode;
    }
}

// Usage
class PaymentProcessor {
    public function processPayment(float $amount, array $card): void {
        // Simulate payment processing
        $balance = 50.00; // Simulated account balance

        if ($amount > $balance) {
            throw new InsufficientFundsException(
                $amount,
                $balance,
                'TXN_' . uniqid()
            );
        }

        // Simulate card decline
        if ($card['number'] === '4000000000000002') {
            throw new CardDeclinedException(
                'do_not_honor',
                'TXN_' . uniqid()
            );
        }

        echo "Payment of $amount processed successfully\n";
    }
}

try {
    $processor = new PaymentProcessor();
    $processor->processPayment(100.00, ['number' => '4111111111111111']);
} catch (InsufficientFundsException $e) {
    echo "Payment failed: " . $e->getMessage() . "\n";
    echo "You need an additional $" . $e->getShortfall() . "\n";
} catch (CardDeclinedException $e) {
    echo "Card declined: " . $e->getMessage() . "\n";
    echo "Decline code: " . $e->getDeclineCode() . "\n";
} catch (PaymentException $e) {
    echo "Payment error: " . $e->getMessage() . "\n";
    if ($transactionId = $e->getTransactionId()) {
        echo "Transaction ID: $transactionId\n";
    }
}
?>
```

## Custom Error Handlers

Custom error handlers allow you to take control of how PHP errors are processed.

### Setting a Custom Error Handler

```php
<?php
function customErrorHandler(
    int $errno,
    string $errstr,
    string $errfile,
    int $errline
): bool {
    // Don't execute PHP internal error handler
    $return = true;

    $errorTypes = [
        E_ERROR => 'Error',
        E_WARNING => 'Warning',
        E_NOTICE => 'Notice',
        E_USER_ERROR => 'User Error',
        E_USER_WARNING => 'User Warning',
        E_USER_NOTICE => 'User Notice',
        E_STRICT => 'Strict',
        E_DEPRECATED => 'Deprecated',
        E_USER_DEPRECATED => 'User Deprecated',
    ];

    $errorType = $errorTypes[$errno] ?? 'Unknown Error';

    // Log the error
    $message = sprintf(
        "[%s] %s: %s in %s on line %d",
        date('Y-m-d H:i:s'),
        $errorType,
        $errstr,
        $errfile,
        $errline
    );

    error_log($message);

    // For fatal user errors, you might want to terminate
    if ($errno === E_USER_ERROR) {
        echo "A critical error occurred. Please try again later.\n";
        exit(1);
    }

    return $return;
}

// Set the custom error handler
set_error_handler('customErrorHandler');

// Test the handler
echo $undefined; // Triggers notice
trigger_error("This is a warning", E_USER_WARNING);
trigger_error("This is a notice", E_USER_NOTICE);

// Restore the default error handler
restore_error_handler();
?>
```

### Converting Errors to Exceptions

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
    // Check if error should be reported
    if (!(error_reporting() & $errno)) {
        return false;
    }

    throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
}

set_error_handler('errorToExceptionHandler');

// Now errors will throw exceptions
try {
    // This will throw an ErrorException
    echo $undefinedVariable;
} catch (ErrorException $e) {
    echo "Caught error as exception: " . $e->getMessage() . "\n";
}

// Using PHP's built-in ErrorException
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
?>
```

### Custom Exception Handler

```php
<?php
function customExceptionHandler(Throwable $exception): void {
    // Log the exception
    $logMessage = sprintf(
        "[%s] Uncaught %s: %s in %s:%d\nStack trace:\n%s",
        date('Y-m-d H:i:s'),
        get_class($exception),
        $exception->getMessage(),
        $exception->getFile(),
        $exception->getLine(),
        $exception->getTraceAsString()
    );

    error_log($logMessage);

    // Display user-friendly message
    if (ENVIRONMENT === 'development') {
        echo "<h1>Exception Occurred</h1>";
        echo "<p><strong>Type:</strong> " . get_class($exception) . "</p>";
        echo "<p><strong>Message:</strong> " . htmlspecialchars($exception->getMessage()) . "</p>";
        echo "<p><strong>File:</strong> " . $exception->getFile() . "</p>";
        echo "<p><strong>Line:</strong> " . $exception->getLine() . "</p>";
        echo "<h2>Stack Trace</h2>";
        echo "<pre>" . htmlspecialchars($exception->getTraceAsString()) . "</pre>";
    } else {
        // Production error page
        http_response_code(500);
        echo "<h1>An error occurred</h1>";
        echo "<p>We're sorry, but something went wrong. Please try again later.</p>";
    }
}

define('ENVIRONMENT', 'development');
set_exception_handler('customExceptionHandler');

// This exception will be caught by the handler
throw new RuntimeException("Something went wrong!");
?>
```

### Shutdown Handler for Fatal Errors

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
        // Log the fatal error
        $message = sprintf(
            "[%s] Fatal Error: %s in %s on line %d",
            date('Y-m-d H:i:s'),
            $error['message'],
            $error['file'],
            $error['line']
        );

        error_log($message);

        // Clean any output buffers
        while (ob_get_level() > 0) {
            ob_end_clean();
        }

        // Display error page
        http_response_code(500);
        echo "<!DOCTYPE html>
        <html>
        <head><title>Server Error</title></head>
        <body>
        <h1>500 Internal Server Error</h1>
        <p>An unexpected error occurred. Please try again later.</p>
        </body>
        </html>";
    }
}

register_shutdown_function('shutdownHandler');
?>
```

### Complete Error Handling Setup

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
            "[%s] %s: %s in %s:%d\n%s\n",
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
            <title>Error</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .error { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 4px; }
                .trace { background: #f1f1f1; padding: 10px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="error">
                <h1><?= htmlspecialchars(get_class($e)) ?></h1>
                <p><strong>Message:</strong> <?= htmlspecialchars($e->getMessage()) ?></p>
                <p><strong>File:</strong> <?= htmlspecialchars($e->getFile()) ?></p>
                <p><strong>Line:</strong> <?= $e->getLine() ?></p>
            </div>
            <h2>Stack Trace</h2>
            <pre class="trace"><?= htmlspecialchars($e->getTraceAsString()) ?></pre>
        </body>
        </html>
        <?php
    }

    private function renderProduction(): void {
        ?>
        <!DOCTYPE html>
        <html>
        <head><title>Server Error</title></head>
        <body>
            <h1>Oops! Something went wrong.</h1>
            <p>We're working to fix the problem. Please try again later.</p>
        </body>
        </html>
        <?php
    }
}

// Usage
$handler = new ErrorHandler('/var/log/php/app.log', debug: true);
$handler->register();
?>
```

## Logging and Monitoring

Proper logging is essential for debugging and monitoring application health.

### PSR-3 Logger Interface

```php
<?php
// PSR-3 compatible logger implementation
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

// Usage
$logger = new FileLogger('/var/log/app.log');
$logger->info('User {user} logged in from {ip}', [
    'user' => 'john@example.com',
    'ip' => '192.168.1.1'
]);
$logger->error('Failed to process payment', [
    'order_id' => 12345,
    'amount' => 99.99
]);
?>
```

### Exception Logging

```php
<?php
class ExceptionLogger {
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger) {
        $this->logger = $logger;
    }

    public function logException(Throwable $e, array $context = []): void {
        $context = array_merge($context, [
            'exception' => get_class($e),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        // Log with appropriate level based on exception type
        if ($e instanceof \Error) {
            $this->logger->critical($e->getMessage(), $context);
        } elseif ($e instanceof \RuntimeException) {
            $this->logger->error($e->getMessage(), $context);
        } elseif ($e instanceof \InvalidArgumentException) {
            $this->logger->warning($e->getMessage(), $context);
        } else {
            $this->logger->error($e->getMessage(), $context);
        }

        // Log exception chain
        $previous = $e->getPrevious();
        while ($previous !== null) {
            $this->logger->debug('Caused by: ' . $previous->getMessage(), [
                'exception' => get_class($previous),
                'file' => $previous->getFile(),
                'line' => $previous->getLine(),
            ]);
            $previous = $previous->getPrevious();
        }
    }
}

// Integration with error handler
$logger = new FileLogger('/var/log/app.log');
$exceptionLogger = new ExceptionLogger($logger);

set_exception_handler(function (Throwable $e) use ($exceptionLogger) {
    $exceptionLogger->logException($e, [
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'CLI',
        'user_id' => $_SESSION['user_id'] ?? null,
    ]);

    // Display error page
    http_response_code(500);
    include 'error_500.html';
});
?>
```

### Structured Logging

```php
<?php
class JsonLogger implements LoggerInterface {
    private string $logFile;
    private string $channel;

    public function __construct(string $logFile, string $channel = 'app') {
        $this->logFile = $logFile;
        $this->channel = $channel;
    }

    public function log(string $level, string $message, array $context = []): void {
        $logEntry = [
            '@timestamp' => date('c'),
            'channel' => $this->channel,
            'level' => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'extra' => [
                'pid' => getmypid(),
                'memory_usage' => memory_get_usage(true),
                'request_id' => $_SERVER['HTTP_X_REQUEST_ID'] ?? uniqid(),
            ],
        ];

        if (isset($context['exception']) && $context['exception'] instanceof Throwable) {
            $e = $context['exception'];
            $logEntry['exception'] = [
                'class' => get_class($e),
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTrace(),
            ];
            unset($logEntry['context']['exception']);
        }

        file_put_contents(
            $this->logFile,
            json_encode($logEntry, JSON_UNESCAPED_SLASHES) . "\n",
            FILE_APPEND | LOCK_EX
        );
    }

    // Implement other LoggerInterface methods...
    public function emergency(string $message, array $context = []): void {
        $this->log('emergency', $message, $context);
    }

    public function alert(string $message, array $context = []): void {
        $this->log('alert', $message, $context);
    }

    public function critical(string $message, array $context = []): void {
        $this->log('critical', $message, $context);
    }

    public function error(string $message, array $context = []): void {
        $this->log('error', $message, $context);
    }

    public function warning(string $message, array $context = []): void {
        $this->log('warning', $message, $context);
    }

    public function notice(string $message, array $context = []): void {
        $this->log('notice', $message, $context);
    }

    public function info(string $message, array $context = []): void {
        $this->log('info', $message, $context);
    }

    public function debug(string $message, array $context = []): void {
        $this->log('debug', $message, $context);
    }
}

// Usage for ELK stack integration
$logger = new JsonLogger('/var/log/app/app.json', 'payment');
$logger->info('Payment processed', [
    'order_id' => 12345,
    'amount' => 99.99,
    'currency' => 'USD',
]);
?>
```

## Best Practices

### Use Exceptions for Exceptional Situations

```php
<?php
// Bad: Using exceptions for control flow
function findUserBad(int $id): ?User {
    try {
        return $this->repository->find($id);
    } catch (UserNotFoundException $e) {
        return null; // Don't use exceptions for expected cases
    }
}

// Good: Return null or use Optional pattern
function findUserGood(int $id): ?User {
    return $this->repository->find($id); // Returns null if not found
}

// Good: Throw exception only for truly exceptional cases
function getUserOrFail(int $id): User {
    $user = $this->repository->find($id);

    if ($user === null) {
        throw new UserNotFoundException("User $id not found");
    }

    return $user;
}
?>
```

### Be Specific with Exception Types

```php
<?php
// Bad: Generic exception
function processOrder(array $data): void {
    if (empty($data['items'])) {
        throw new Exception("Invalid order"); // Too vague
    }
}

// Good: Specific exception
function processOrderGood(array $data): void {
    if (empty($data['items'])) {
        throw new InvalidArgumentException("Order must contain at least one item");
    }

    if ($data['total'] <= 0) {
        throw new DomainException("Order total must be positive");
    }
}
?>
```

### Never Swallow Exceptions

```php
<?php
// Bad: Silently swallowing exceptions
try {
    processPayment($order);
} catch (Exception $e) {
    // Empty catch block - problem hidden
}

// Bad: Logging but not handling
try {
    processPayment($order);
} catch (Exception $e) {
    error_log($e->getMessage());
    // Continues as if nothing happened
}

// Good: Handle appropriately
try {
    processPayment($order);
} catch (PaymentFailedException $e) {
    $logger->error('Payment failed', ['exception' => $e]);
    $order->setStatus('payment_failed');
    $notifier->notifyPaymentFailure($order);
    throw $e; // Re-throw if caller needs to know
}
?>
```

### Clean Up Resources with Finally

```php
<?php
function processFile(string $path): array {
    $handle = fopen($path, 'r');

    if ($handle === false) {
        throw new RuntimeException("Cannot open file: $path");
    }

    try {
        $data = [];
        while (($line = fgets($handle)) !== false) {
            $data[] = processLine($line);
        }
        return $data;
    } finally {
        // Always close the file, even if exception occurs
        fclose($handle);
    }
}
?>
```

### Fail Fast

```php
<?php
class UserService {
    public function createUser(array $data): User {
        // Validate early, fail fast
        $this->validateEmail($data['email'] ?? null);
        $this->validatePassword($data['password'] ?? null);
        $this->validateAge($data['age'] ?? null);

        // If we reach here, data is valid
        return $this->repository->create($data);
    }

    private function validateEmail(?string $email): void {
        if (empty($email)) {
            throw new ValidationException('Email is required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException('Invalid email format');
        }
    }

    private function validatePassword(?string $password): void {
        if (empty($password)) {
            throw new ValidationException('Password is required');
        }
        if (strlen($password) < 8) {
            throw new ValidationException('Password must be at least 8 characters');
        }
    }

    private function validateAge(?int $age): void {
        if ($age === null) {
            throw new ValidationException('Age is required');
        }
        if ($age < 18) {
            throw new ValidationException('Must be 18 or older');
        }
    }
}
?>
```

### Document Exceptions

```php
<?php
/**
 * Process a payment transaction.
 *
 * @param Order $order The order to process payment for
 * @param PaymentMethod $method The payment method to use
 *
 * @return Transaction The completed transaction
 *
 * @throws InvalidArgumentException If the order total is invalid
 * @throws PaymentDeclinedException If the payment is declined
 * @throws PaymentGatewayException If there's a gateway communication error
 * @throws InsufficientFundsException If the payment method has insufficient funds
 */
function processPayment(Order $order, PaymentMethod $method): Transaction {
    if ($order->getTotal() <= 0) {
        throw new InvalidArgumentException('Order total must be positive');
    }

    try {
        return $this->gateway->charge($method, $order->getTotal());
    } catch (GatewayException $e) {
        throw new PaymentGatewayException(
            'Payment gateway error: ' . $e->getMessage(),
            0,
            $e
        );
    }
}
?>
```

### Use Error Suppression Sparingly

```php
<?php
// Bad: Suppressing errors hides problems
$data = @file_get_contents($url);

// Good: Handle errors explicitly
$data = file_get_contents($url);
if ($data === false) {
    throw new RuntimeException("Failed to fetch URL: $url");
}

// Acceptable: When you need to check for specific conditions
// and you'll handle the case appropriately
if (@mkdir($dir, 0755, true) === false && !is_dir($dir)) {
    throw new RuntimeException("Failed to create directory: $dir");
}
?>
```

### Different Strategies for Different Environments

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
        // Show detailed error information
        echo "<h1>" . get_class($e) . "</h1>";
        echo "<p>" . $e->getMessage() . "</p>";
        echo "<pre>" . $e->getTraceAsString() . "</pre>";
    }
}

class ProductionErrorHandler extends ErrorHandler {
    protected function render(Throwable $e): void {
        // Show generic error page
        http_response_code(500);
        include __DIR__ . '/templates/error_500.html';

        // Alert operations team for critical errors
        if ($e instanceof \Error || $e instanceof CriticalException) {
            $this->alertOps($e);
        }
    }

    private function alertOps(Throwable $e): void {
        // Send alert to monitoring system
    }
}
?>
```

## Conclusion

Effective error and exception handling is crucial for building robust PHP applications. By understanding error levels, properly configuring error reporting, creating meaningful custom exceptions, and implementing comprehensive error handlers, you can create applications that gracefully handle problems and provide valuable debugging information.

### Key Takeaways

- Understand the difference between errors and exceptions
- Configure error reporting appropriately for each environment
- Use specific exception types rather than generic ones
- Implement custom error handlers for centralized error management
- Always log exceptions with sufficient context for debugging
- Use the finally block to ensure resource cleanup
- Never silently swallow exceptions
- Document the exceptions that methods can throw

### Next Steps

After mastering error and exception handling, consider exploring:

- Monolog and other PSR-3 logging libraries
- Error monitoring services (Sentry, Bugsnag, Raygun)
- Debugging tools (Xdebug, Blackfire)
- Testing error conditions with PHPUnit
- Framework-specific error handling (Laravel, Symfony)
- Async error handling in PHP 8.1+ Fibers

Remember that good error handling improves both developer experience during debugging and user experience when things go wrong. Invest time in setting up proper error handling infrastructure early in your project.
