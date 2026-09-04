---
title: PHP 数据类型完全指南
description: 深入理解 PHP 的标量类型、复合类型、特殊类型、类型转换与严格类型模式
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - 数据类型
  - 类型系统
  - 类型转换
status: imported
origin: old/src/content/docs/php/data-types.en.md
divergence: 0.198
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 语言基础
  order: 2
  lastUpdated: 2026-01-07
---

PHP is a dynamically weakly-typed language, and its flexible type system is both an advantage and a challenge. A deep understanding of PHP's data type system is essential for writing robust and maintainable code.

## Concept Explanation

### What are Data Types?

Data types define the kinds of data a variable can store and the operations that can be performed on that data. PHP supports multiple data types, which can be divided into three major categories:

1. **Scalar Types**: Store a single value
   - `bool` (Boolean)
   - `int` (Integer)
   - `float` (Floating-point, also called `double`)
   - `string` (String)

2. **Compound Types**: Store multiple values or complex structures
   - `array` (Array)
   - `object` (Object)
   - `callable` (Callable type)
   - `iterable` (Iterable type)

3. **Special Types**: Have special purposes
   - `null` (Null value)
   - `resource` (Resource)
   - `never` (PHP 8.1+)
   - `void` (No return value)
   - `mixed` (PHP 8.0+)

### Historical Background

PHP was originally designed as a simple templating language with a very loose type system. As the language evolved:

- **PHP 5.0** (2004): Introduced type hints, supporting class/interface type declarations
- **PHP 7.0** (2015): Introduced scalar type declarations and return type declarations
- **PHP 7.1** (2016): Introduced nullable types `?Type` and `void`
- **PHP 7.4** (2019): Introduced property type declarations
- **PHP 8.0** (2020): Introduced union types and `mixed` type
- **PHP 8.1** (2021): Introduced intersection types and `never` type
- **PHP 8.2** (2022): Introduced DNF types (combination of intersection and union)

### What Problems Does It Solve?

Understanding data types helps with:

1. **Avoiding Type Errors**: Prevents runtime errors caused by type mismatches
2. **Improving Code Quality**: Explicit type declarations make code more readable and maintainable
3. **Optimizing Performance**: Correct type usage can improve execution efficiency
4. **Enhancing IDE Support**: Type information helps IDEs provide better autocompletion and error detection

## Core Principles

### Type Storage Mechanism

PHP internally uses the `zval` struct to store variables, which contains type identification and values:

```c
// PHP internal zval structure (simplified)
struct _zval_struct {
    zend_value value;      // Stores the actual value
    union {
        uint32_t type_info;  // Type information
    } u1;
};
```

PHP types are determined at runtime, which means:

1. The same variable can hold values of different types at different times
2. Type checking occurs at runtime rather than compile time
3. Type conversion can be done implicitly or explicitly

### Type Juggling

PHP automatically performs type conversion based on context, which is called type juggling:

```php
<?php
// Numeric context
$sum = "10" + 5;        // string "10" converts to int 10
echo $sum;              // Output: 15

// String context
$concat = "10" . 5;     // int 5 converts to string "5"
echo $concat;           // Output: 105

// Boolean context
if ("hello") {          // Non-empty string converts to true
    echo "Truthy";
}

// Comparison context
var_dump("10" == 10);   // bool(true) - comparison after type conversion
var_dump("10" === 10);  // bool(false) - strict comparison
?>
```

### Copy-on-Write

PHP uses copy-on-write to optimize memory usage:

```php
<?php
$a = "Hello";
$b = $a;        // $b and $a share the same memory

$b = "World";   // Now it actually copies, $b gets independent memory
?>
```

## Core Concepts

### Scalar Types in Detail

#### Boolean (bool)

```php
<?php
// Boolean has only two values: true and false
$isActive = true;
$isDeleted = false;

// Values that convert to false (falsy values)
$falsyValues = [
    false,      // Boolean false
    0,          // Integer 0
    0.0,        // Float 0.0
    -0.0,       // Negative zero
    "",         // Empty string
    "0",        // String "0"
    [],         // Empty array
    null,       // null
];

// All other values convert to true
$truthyValues = [
    true,
    1,
    -1,
    0.1,
    "0.0",      // Non-"0" string
    "false",    // String "false"
    [0],        // Non-empty array
];

// Use var_export to view boolean values
var_export((bool)"0");     // false
var_export((bool)"0.0");   // true (easily confused!)
?>
```

#### Integer (int)

```php
<?php
// Different base representations of integers
$decimal = 1234;           // Decimal
$negative = -1234;         // Negative number
$octal = 0755;             // Octal (starts with 0)
$hex = 0xFF;               // Hexadecimal (starts with 0x)
$binary = 0b11111111;      // Binary (starts with 0b)

// PHP 7.4+ supports numeric separators
$billion = 1_000_000_000;
$bytes = 0xCAFE_BABE;
$permissions = 0b0111_0101;

// Integer boundaries
echo PHP_INT_MAX . "\n";   // 64-bit system: 9223372036854775807
echo PHP_INT_MIN . "\n";   // 64-bit system: -9223372036854775808
echo PHP_INT_SIZE . "\n";  // Bytes: 8 (64-bit system)

// Integer overflow automatically converts to float
$overflow = PHP_INT_MAX + 1;
var_dump($overflow);       // float(9.2233720368548E+18)
?>
```

#### Floating-point (float)

```php
<?php
$pi = 3.14159;
$scientific = 1.2e3;       // 1200
$negExp = 7E-10;           // 0.0000000007
$underscore = 1_234.567_89; // PHP 7.4+

// Floating-point precision issues
$a = 0.1 + 0.2;
echo $a . "\n";                          // 0.3
var_dump($a == 0.3);                     // bool(false)!
var_dump(abs($a - 0.3) < 0.00001);       // bool(true) - correct comparison method

// Use bcmath for precise calculations
$result = bcadd('0.1', '0.2', 2);
echo $result . "\n";                     // 0.30

// Special float values
$inf = INF;                // Infinity
$negInf = -INF;            // Negative infinity
$nan = NAN;                // Not a Number

var_dump(is_infinite($inf));   // bool(true)
var_dump(is_nan($nan));        // bool(true)
var_dump($nan == $nan);        // bool(false) - NAN is not equal to itself!
?>
```

#### String (string)

```php
<?php
// Four ways to define strings

// 1. Single quotes - doesn't parse variables and most escapes
$single = 'Hello $name\n';
echo $single . "\n";  // Output: Hello $name\n

// 2. Double quotes - parses variables and escape sequences
$name = "World";
$double = "Hello $name\n";
echo $double;  // Output: Hello World (newline)

// Complex variable syntax
$user = ['name' => 'Alice'];
echo "Welcome, {$user['name']}!\n";

// 3. Heredoc - similar to double quotes
$heredoc = <<<TEXT
This is Heredoc syntax
Variables are parsed: $name
Supports newlines
TEXT;

// 4. Nowdoc - similar to single quotes (PHP 5.3+)
$nowdoc = <<<'TEXT'
This is Nowdoc syntax
Variables are not parsed: $name
TEXT;

// Accessing string as character array
$str = "Hello";
echo $str[0] . "\n";        // H
echo $str[-1] . "\n";       // o (negative index, PHP 7.1+)

// String length
echo strlen($str) . "\n";        // 5 (bytes)
echo mb_strlen("Hello") . "\n";  // 5 (characters)
?>
```

### Compound Types in Detail

#### Array (array)

```php
<?php
// PHP arrays are actually ordered maps

// Indexed array
$fruits = ['apple', 'banana', 'orange'];
$fruits[] = 'grape';  // Automatically assigns index

// Associative array
$person = [
    'name' => 'John',
    'age' => 25,
    'city' => 'New York'
];

// Mixed array
$mixed = [
    0 => 'zero',
    'key' => 'value',
    1 => 'one',
    'nested' => [1, 2, 3]
];

// Array destructuring (PHP 7.1+)
[$a, $b, $c] = $fruits;
['name' => $name, 'age' => $age] = $person;

// Spread operator (PHP 7.4+)
$numbers = [1, 2, 3];
$more = [0, ...$numbers, 4, 5];  // [0, 1, 2, 3, 4, 5]

// Array type checking
var_dump(is_array($fruits));    // bool(true)
var_dump(gettype($fruits));     // string(5) "array"
?>
```

#### Object (object)

```php
<?php
// Class definition
class User {
    public string $name;
    private int $age;

    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }

    public function getAge(): int {
        return $this->age;
    }
}

$user = new User('John', 30);
echo $user->name . "\n";        // John
echo $user->getAge() . "\n";    // 30

// Anonymous class (PHP 7.0+)
$logger = new class {
    public function log(string $message): void {
        echo "[LOG] $message\n";
    }
};
$logger->log("Hello");

// stdClass - generic object
$obj = new stdClass();
$obj->name = "Object";
$obj->value = 42;

// Array to object
$array = ['a' => 1, 'b' => 2];
$object = (object)$array;
echo $object->a . "\n";  // 1

// Object type checking
var_dump($user instanceof User);  // bool(true)
var_dump(is_object($user));       // bool(true)
var_dump(get_class($user));       // string(4) "User"
?>
```

#### Callable Type (callable)

```php
<?php
// callable type can be multiple forms

// 1. Regular function
function greet(string $name): string {
    return "Hello, $name!";
}

// 2. Anonymous function (closure)
$multiply = function(int $a, int $b): int {
    return $a * $b;
};

// 3. Arrow function (PHP 7.4+)
$add = fn(int $a, int $b): int => $a + $b;

// 4. Class method
class Calculator {
    public static function divide(int $a, int $b): float {
        return $a / $b;
    }

    public function subtract(int $a, int $b): int {
        return $a - $b;
    }
}

// Calling different types of callables
function execute(callable $fn, ...$args): mixed {
    return $fn(...$args);
}

echo execute('greet', 'World') . "\n";
echo execute($multiply, 3, 4) . "\n";
echo execute($add, 5, 6) . "\n";
echo execute([Calculator::class, 'divide'], 10, 2) . "\n";

$calc = new Calculator();
echo execute([$calc, 'subtract'], 10, 3) . "\n";

// Using Closure type hint (more strict)
function applyFn(Closure $fn, mixed $value): mixed {
    return $fn($value);
}
?>
```

#### Iterable Type (iterable)

```php
<?php
// iterable type represents values that can be traversed with foreach

function processItems(iterable $items): void {
    foreach ($items as $item) {
        echo $item . " ";
    }
    echo "\n";
}

// Array
processItems([1, 2, 3]);

// Generator
function numberGenerator(): Generator {
    for ($i = 1; $i <= 3; $i++) {
        yield $i;
    }
}
processItems(numberGenerator());

// Objects implementing Traversable interface
class MyCollection implements IteratorAggregate {
    private array $items;

    public function __construct(array $items) {
        $this->items = $items;
    }

    public function getIterator(): Traversable {
        return new ArrayIterator($this->items);
    }
}

processItems(new MyCollection([4, 5, 6]));
?>
```

### Special Types in Detail

#### NULL

```php
<?php
$null = null;
$uninitialized;  // Also null

// Checking for null
var_dump(is_null($null));        // bool(true)
var_dump($null === null);        // bool(true)
var_dump(isset($null));          // bool(false)
var_dump(isset($uninitialized)); // bool(false)

// Null coalescing operator
$value = null;
$default = $value ?? 'default';
echo $default . "\n";  // default

// Null coalescing assignment operator (PHP 7.4+)
$config['timeout'] ??= 30;

// Nullsafe operator (PHP 8.0+)
class Address {
    public ?string $city = null;
}

class Person {
    public ?Address $address = null;
}

$person = new Person();
$city = $person?->address?->city ?? 'Unknown';
echo $city . "\n";  // Unknown
?>
```

#### Resource (resource)

```php
<?php
// resource is a special type representing references to external resources

// File resource
$file = fopen('/tmp/test.txt', 'w');
var_dump(is_resource($file));       // bool(true)
var_dump(get_resource_type($file)); // string(6) "stream"
fclose($file);

// Note: PHP 8.0+ many resource types have been changed to objects
// For example: curl_init() returns CurlHandle object instead of resource

// Check if resource is valid
if (is_resource($file)) {
    // Resource is still valid
}
?>
```

#### void, never, mixed

```php
<?php
// void - function has no return value (PHP 7.1+)
function logMessage(string $msg): void {
    echo $msg . "\n";
    // Cannot return any value (return; is allowed)
}

// never - function never returns normally (PHP 8.1+)
function throwError(string $msg): never {
    throw new Exception($msg);
    // Or exit(), die()
}

function infiniteLoop(): never {
    while (true) {
        // Never ends
    }
}

// mixed - any type (PHP 8.0+)
function process(mixed $data): mixed {
    return match (gettype($data)) {
        'string' => strtoupper($data),
        'integer' => $data * 2,
        'array' => count($data),
        default => $data,
    };
}

echo process('hello') . "\n";  // HELLO
echo process(5) . "\n";        // 10
echo process([1,2,3]) . "\n";  // 3
?>
```

## Code Examples

### Complete Type Declaration Example

```php
<?php
declare(strict_types=1);  // Enable strict type mode

// Scalar type declarations
function calculateDiscount(
    float $price,
    int $quantity,
    float $discountRate = 0.1
): float {
    $total = $price * $quantity;
    $discount = $total * $discountRate;
    return $total - $discount;
}

// Nullable types (PHP 7.1+)
function findUser(?int $id): ?array {
    if ($id === null) {
        return null;
    }
    // Simulate database query
    return ['id' => $id, 'name' => 'User ' . $id];
}

// Union types (PHP 8.0+)
function formatId(int|string $id): string {
    return is_int($id) ? "ID-$id" : $id;
}

// Intersection types (PHP 8.1+)
interface Printable {
    public function print(): void;
}

interface Loggable {
    public function log(): void;
}

class Report implements Printable, Loggable {
    public function print(): void {
        echo "Printing report...\n";
    }

    public function log(): void {
        echo "Logging report...\n";
    }
}

function processReport(Printable&Loggable $report): void {
    $report->print();
    $report->log();
}

// Return types: self, static, parent
class BaseClass {
    public function getInstance(): self {
        return new self();
    }

    public static function create(): static {
        return new static();  // Late static binding
    }
}

class ChildClass extends BaseClass {
    // static return type will return ChildClass instance
}

// Usage examples
echo calculateDiscount(100.0, 5) . "\n";  // 450.0

$user = findUser(1);
print_r($user);

echo formatId(123) . "\n";     // ID-123
echo formatId("ABC") . "\n";   // ABC

processReport(new Report());

$child = ChildClass::create();
var_dump(get_class($child));   // string(10) "ChildClass"
?>
```

### Detailed Type Conversion Examples

```php
<?php
// Explicit type conversion

// Convert to integer
$values = [
    (int)"123",           // 123
    (int)"123.45",        // 123
    (int)"12abc",         // 12
    (int)"abc12",         // 0
    (int)true,            // 1
    (int)false,           // 0
    (int)null,            // 0
    (int)12.9,            // 12 (truncated, not rounded)
];

// Convert to float
$floats = [
    (float)"123.45",      // 123.45
    (float)"123e2",       // 12300.0
    (float)true,          // 1.0
    (float)"1.2.3",       // 1.2
];

// Convert to string
$strings = [
    (string)123,          // "123"
    (string)12.34,        // "12.34"
    (string)true,         // "1"
    (string)false,        // ""
    (string)null,         // ""
    (string)[1, 2],       // Warning, result is "Array"
];

// Convert to boolean (refer to falsy values above)

// Convert to array
$arrays = [
    (array)"hello",       // ["hello"]
    (array)123,           // [123]
    (array)null,          // []
];

// Object to array
class Point {
    public int $x = 10;
    protected int $y = 20;
    private int $z = 30;
}

$point = new Point();
$arr = (array)$point;
print_r($arr);
// Output: Array ( [x] => 10 [*y] => 20 [Pointz] => 30 )
// Note: protected and private properties have special key name formats

// Array to object
$data = ['name' => 'Test', 'value' => 100];
$obj = (object)$data;
echo $obj->name . "\n";  // Test
?>
```

### Type Detection Functions

```php
<?php
// Complete list of type detection functions

$testValues = [
    null,
    true,
    false,
    0,
    1,
    0.0,
    1.5,
    "",
    "0",
    "hello",
    [],
    [1, 2, 3],
    new stdClass(),
];

foreach ($testValues as $value) {
    echo "Value: " . var_export($value, true) . "\n";
    echo "  gettype(): " . gettype($value) . "\n";
    echo "  is_null(): " . var_export(is_null($value), true) . "\n";
    echo "  is_bool(): " . var_export(is_bool($value), true) . "\n";
    echo "  is_int(): " . var_export(is_int($value), true) . "\n";
    echo "  is_float(): " . var_export(is_float($value), true) . "\n";
    echo "  is_string(): " . var_export(is_string($value), true) . "\n";
    echo "  is_array(): " . var_export(is_array($value), true) . "\n";
    echo "  is_object(): " . var_export(is_object($value), true) . "\n";
    echo "  is_scalar(): " . var_export(is_scalar($value), true) . "\n";
    echo "  is_numeric(): " . var_export(is_numeric($value), true) . "\n";
    echo "  empty(): " . var_export(empty($value), true) . "\n";
    echo "\n";
}

// Special behavior of is_numeric
var_dump(is_numeric("123"));      // bool(true)
var_dump(is_numeric("12.34"));    // bool(true)
var_dump(is_numeric("1e10"));     // bool(true)
var_dump(is_numeric("0x1A"));     // bool(false) - hex strings don't count
var_dump(is_numeric("  123"));    // bool(true) - allows leading spaces
?>
```

### Strict Type Mode

```php
<?php
// Declare strict types at the top of the file
declare(strict_types=1);

function add(int $a, int $b): int {
    return $a + $b;
}

// In strict mode, this will throw a TypeError
// echo add("5", "3");  // Fatal error

// Correct usage
echo add(5, 3) . "\n";  // 8

// Note: strict_types only affects the caller
// The following code can accept strings when called from a non-strict mode file
function multiply(int $a, int $b): int {
    return $a * $b;
}

// Weak vs strong typing comparison
// file_weak.php (without strict_types)
// <?php
// require 'file_strict.php';
// echo add("5", "3");  // Valid! Because the caller doesn't have strict_types

// Return types are also affected by strict_types
function getNumber(): int {
    return 42;    // OK
    // return "42";  // TypeError in strict mode
}
?>
```

## Best Practices

### Always Use Type Declarations

```php
<?php
declare(strict_types=1);

// Recommended: Complete type declarations
class UserService {
    public function __construct(
        private readonly UserRepository $repository,
        private readonly LoggerInterface $logger,
    ) {}

    public function findById(int $id): ?User {
        $this->logger->info("Finding user: {$id}");
        return $this->repository->find($id);
    }

    /**
     * @param array<int, User> $users
     * @return array<string, int>
     */
    public function getAgeStats(array $users): array {
        $ages = array_map(fn(User $u): int => $u->getAge(), $users);
        return [
            'min' => min($ages),
            'max' => max($ages),
            'avg' => (int)round(array_sum($ages) / count($ages)),
        ];
    }
}
?>
```

### Use Appropriate Type Conversions

```php
<?php
// Recommended: Explicit type conversion
function processInput(mixed $input): int {
    // Validate before converting
    if (!is_numeric($input)) {
        throw new InvalidArgumentException('Input must be numeric');
    }
    return (int)$input;
}

// Not recommended: Implicit reliance on type conversion
function badProcess($input) {
    return $input + 0;  // Implicit conversion, may have unexpected results
}

// Recommended: Use filter_var for safe conversion
$userInput = "123";
$int = filter_var($userInput, FILTER_VALIDATE_INT);
if ($int === false) {
    throw new InvalidArgumentException('Invalid integer');
}
?>
```

### Handle Nullable Types Correctly

```php
<?php
declare(strict_types=1);

class Config {
    private array $settings = [];

    // Recommended: Use nullable types and default values
    public function get(string $key, mixed $default = null): mixed {
        return $this->settings[$key] ?? $default;
    }

    // Recommended: Use assertion methods
    public function getRequired(string $key): mixed {
        if (!isset($this->settings[$key])) {
            throw new RuntimeException("Required config key: {$key}");
        }
        return $this->settings[$key];
    }

    // PHP 8.0+ use nullsafe operator
    public function getNestedValue(): ?string {
        return $this->getUser()?->getProfile()?->getName();
    }
}
?>
```

### Use Union Types Reasonably

```php
<?php
declare(strict_types=1);

// Recommended: Meaningful union types
function parseId(int|string $id): int {
    return is_string($id) ? (int)$id : $id;
}

// Recommended: Use interfaces instead of too many union types
interface Stringable {
    public function __toString(): string;
}

function format(Stringable|string $value): string {
    return (string)$value;
}

// Not recommended: Overly broad union types
// function process(int|float|string|array|object $data) { ... }
// In this case, consider using mixed or redesigning
?>
```

### Use readonly and final

```php
<?php
declare(strict_types=1);

// PHP 8.1+ readonly properties
class ImmutablePoint {
    public function __construct(
        public readonly int $x,
        public readonly int $y,
    ) {}
}

// PHP 8.2+ readonly class
readonly class ValueObject {
    public function __construct(
        public string $name,
        public int $value,
    ) {}
}

$point = new ImmutablePoint(10, 20);
// $point->x = 30;  // Error: Cannot modify readonly property
?>
```

## Common Pitfalls

### Floating-point Comparison Pitfall

```php
<?php
// Wrong: Direct comparison of floating-point numbers
$a = 0.1 + 0.2;
if ($a == 0.3) {  // May be false!
    echo "Equal";
}

// Correct: Use precision comparison
function floatEquals(float $a, float $b, float $epsilon = 0.00001): bool {
    return abs($a - $b) < $epsilon;
}

if (floatEquals($a, 0.3)) {
    echo "Equal (with epsilon)\n";
}

// Better: Use bcmath or decimal extension
$result = bcadd('0.1', '0.2', 10);
if (bccomp($result, '0.3', 10) === 0) {
    echo "Equal (bcmath)\n";
}
?>
```

### String-Number Comparison Pitfall

```php
<?php
// PHP 7 and earlier behavior
var_dump("10" == "1e1");    // true in PHP 7, false in PHP 8
var_dump("0" == "");        // true in PHP 7, false in PHP 8
var_dump(100 == "100abc");  // true in PHP 7, false in PHP 8

// PHP 8 improved string-number comparison
// Now conversion only happens when the string is actually numeric

// Recommendation: Always use strict comparison
var_dump("10" === "10");    // true
var_dump(10 === 10);        // true
var_dump("10" === 10);      // false - explicit type difference
?>
```

### Difference Between Empty Array and null

```php
<?php
$empty = [];
$null = null;

// Difference between isset and empty
var_dump(isset($empty));     // true
var_dump(isset($null));      // false

var_dump(empty($empty));     // true
var_dump(empty($null));      // true

// Type checking
var_dump(is_null($empty));   // false
var_dump(is_null($null));    // true

var_dump(is_array($empty));  // true
var_dump(is_array($null));   // false

// Recommended: Explicit checking
function processArray(?array $data): array {
    // Method 1: Null coalescing
    $data = $data ?? [];

    // Method 2: Explicit check
    if ($data === null) {
        return [];
    }

    return array_map(fn($x) => $x * 2, $data);
}
?>
```

### Type Declaration Inheritance Pitfall

```php
<?php
declare(strict_types=1);

class Animal {
    public function speak(): string {
        return "...";
    }
}

class Dog extends Animal {
    // Return type can be more specific (covariance)
    public function speak(): string {
        return "Woof!";
    }
}

// Contravariance of parameter types
interface Logger {
    public function log(string $message): void;
}

class FileLogger implements Logger {
    // Error: Cannot make parameter type more specific
    // public function log(EmailMessage $message): void { }

    // Correct: Parameter type can only be the same or more general
    public function log(string $message): void {
        file_put_contents('/tmp/log.txt', $message, FILE_APPEND);
    }
}
?>
```

### Array Key Type Conversion

```php
<?php
// Implicit conversion of array keys
$array = [];

$array[1] = 'integer key';
$array['1'] = 'string key';      // Overwrite! Converts to integer 1
$array[1.5] = 'float key';       // Overwrite! Truncates to integer 1
$array[true] = 'bool key';       // Overwrite! Converts to integer 1

print_r($array);
// Output: Array ( [1] => bool key )

// null as key converts to empty string
$array[null] = 'null key';
$array[''] = 'empty string key';  // Overwrite!

// Recommendation: Use consistent key types
function createIndexedArray(array $items): array {
    $result = [];
    foreach ($items as $index => $item) {
        $result[(string)$index] = $item;  // Force string keys
    }
    return $result;
}
?>
```

## Performance Considerations

### Performance Impact of Type Declarations

```php
<?php
// Type checking has slight performance overhead, but usually negligible

// Test code
$iterations = 1000000;

// Without type declarations
function addUntyped($a, $b) {
    return $a + $b;
}

// With type declarations
function addTyped(int $a, int $b): int {
    return $a + $b;
}

// Performance test
$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    addUntyped(1, 2);
}
$untypedTime = microtime(true) - $start;

$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    addTyped(1, 2);
}
$typedTime = microtime(true) - $start;

// Conclusion: Difference is usually within 5-10%, type safety benefits far outweigh performance loss
?>
```

### Choosing Appropriate Data Types

```php
<?php
// Integer vs Float
// If decimals are not needed, integers are more efficient

// Array vs Object
// For simple key-value pairs, arrays are lighter
$arrayConfig = ['host' => 'localhost', 'port' => 3306];

// For complex logic, objects are more appropriate
class DatabaseConfig {
    public function __construct(
        public readonly string $host,
        public readonly int $port,
        public readonly string $database,
    ) {}

    public function getDsn(): string {
        return "mysql:host={$this->host};port={$this->port};dbname={$this->database}";
    }
}

// SplFixedArray for fixed-size arrays
// More efficient than regular arrays, but limited functionality
$fixed = new SplFixedArray(1000);
for ($i = 0; $i < 1000; $i++) {
    $fixed[$i] = $i * 2;
}
?>
```

### String Performance Optimization

```php
<?php
// String concatenation performance
$iterations = 10000;

// Slow: Using . concatenation in loops
$result = '';
$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    $result .= "item$i,";
}
$concatTime = microtime(true) - $start;

// Fast: Using array + implode
$parts = [];
$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    $parts[] = "item$i";
}
$result = implode(',', $parts);
$implodeTime = microtime(true) - $start;

// Even faster: Use sprintf for building complex strings
// Avoids multiple string concatenations

echo "Concat time: {$concatTime}\n";
echo "Implode time: {$implodeTime}\n";
?>
```

## Real-world Scenarios

### API Data Validation

```php
<?php
declare(strict_types=1);

class ApiRequest {
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $params,
        public readonly ?array $body,
    ) {}

    public static function fromGlobals(): self {
        return new self(
            method: $_SERVER['REQUEST_METHOD'] ?? 'GET',
            path: $_SERVER['REQUEST_URI'] ?? '/',
            params: $_GET,
            body: self::parseBody(),
        );
    }

    private static function parseBody(): ?array {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $body = file_get_contents('php://input');

        if (str_contains($contentType, 'application/json')) {
            $decoded = json_decode($body, true);
            return is_array($decoded) ? $decoded : null;
        }

        return null;
    }
}

class Validator {
    /**
     * @param array<string, string> $rules
     * @return array<string, string> Validation errors
     */
    public static function validate(array $data, array $rules): array {
        $errors = [];

        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            $ruleList = explode('|', $rule);

            foreach ($ruleList as $r) {
                $error = self::checkRule($field, $value, $r);
                if ($error !== null) {
                    $errors[$field] = $error;
                    break;
                }
            }
        }

        return $errors;
    }

    private static function checkRule(string $field, mixed $value, string $rule): ?string {
        return match (true) {
            $rule === 'required' && ($value === null || $value === '')
                => "$field is required",
            str_starts_with($rule, 'type:')
                => self::checkType($field, $value, substr($rule, 5)),
            str_starts_with($rule, 'min:')
                => self::checkMin($field, $value, (int)substr($rule, 4)),
            str_starts_with($rule, 'max:')
                => self::checkMax($field, $value, (int)substr($rule, 4)),
            default => null,
        };
    }

    private static function checkType(string $field, mixed $value, string $type): ?string {
        if ($value === null) return null;

        $valid = match ($type) {
            'int', 'integer' => is_int($value) || (is_string($value) && ctype_digit($value)),
            'float', 'double' => is_numeric($value),
            'string' => is_string($value),
            'bool', 'boolean' => is_bool($value),
            'array' => is_array($value),
            'email' => filter_var($value, FILTER_VALIDATE_EMAIL) !== false,
            default => true,
        };

        return $valid ? null : "$field must be of type $type";
    }

    private static function checkMin(string $field, mixed $value, int $min): ?string {
        if ($value === null) return null;

        $length = is_string($value) ? mb_strlen($value) : (is_array($value) ? count($value) : $value);
        return $length >= $min ? null : "$field must be at least $min";
    }

    private static function checkMax(string $field, mixed $value, int $max): ?string {
        if ($value === null) return null;

        $length = is_string($value) ? mb_strlen($value) : (is_array($value) ? count($value) : $value);
        return $length <= $max ? null : "$field must be at most $max";
    }
}

// Usage example
$data = [
    'name' => 'John Doe',
    'email' => 'john@example.com',
    'age' => '25',
];

$errors = Validator::validate($data, [
    'name' => 'required|type:string|min:2|max:50',
    'email' => 'required|type:email',
    'age' => 'required|type:int|min:0|max:150',
]);

if (empty($errors)) {
    echo "Validation passed\n";
} else {
    print_r($errors);
}
?>
```

### Data Transfer Object (DTO)

```php
<?php
declare(strict_types=1);

/**
 * Building type-safe DTOs using PHP 8 features
 */
readonly class CreateUserDTO {
    public function __construct(
        public string $name,
        public string $email,
        public int $age,
        public ?string $phone = null,
        public array $roles = ['user'],
    ) {
        $this->validate();
    }

    private function validate(): void {
        if (strlen($this->name) < 2) {
            throw new InvalidArgumentException('Name too short');
        }

        if (!filter_var($this->email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email');
        }

        if ($this->age < 0 || $this->age > 150) {
            throw new InvalidArgumentException('Invalid age');
        }
    }

    public static function fromArray(array $data): self {
        return new self(
            name: $data['name'] ?? throw new InvalidArgumentException('Name required'),
            email: $data['email'] ?? throw new InvalidArgumentException('Email required'),
            age: (int)($data['age'] ?? throw new InvalidArgumentException('Age required')),
            phone: $data['phone'] ?? null,
            roles: $data['roles'] ?? ['user'],
        );
    }

    public function toArray(): array {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'age' => $this->age,
            'phone' => $this->phone,
            'roles' => $this->roles,
        ];
    }
}

// Usage example
try {
    $dto = CreateUserDTO::fromArray([
        'name' => 'Alice',
        'email' => 'alice@example.com',
        'age' => '28',
        'roles' => ['user', 'admin'],
    ]);

    echo "Created DTO: \n";
    print_r($dto->toArray());
} catch (InvalidArgumentException $e) {
    echo "Validation error: " . $e->getMessage() . "\n";
}
?>
```

### Generics Simulation (Using PHPDoc)

```php
<?php
declare(strict_types=1);

/**
 * PHP doesn't support native generics, but PHPDoc annotations can be used
 * Combined with PHPStan or Psalm for static analysis
 */

/**
 * @template T
 */
class Collection {
    /** @var array<int, T> */
    private array $items = [];

    /**
     * @param T $item
     */
    public function add(mixed $item): void {
        $this->items[] = $item;
    }

    /**
     * @return T|null
     */
    public function first(): mixed {
        return $this->items[0] ?? null;
    }

    /**
     * @return array<int, T>
     */
    public function all(): array {
        return $this->items;
    }

    /**
     * @param callable(T): bool $predicate
     * @return Collection<T>
     */
    public function filter(callable $predicate): self {
        $filtered = new self();
        foreach ($this->items as $item) {
            if ($predicate($item)) {
                $filtered->add($item);
            }
        }
        return $filtered;
    }

    /**
     * @template U
     * @param callable(T): U $mapper
     * @return Collection<U>
     */
    public function map(callable $mapper): Collection {
        $mapped = new Collection();
        foreach ($this->items as $item) {
            $mapped->add($mapper($item));
        }
        return $mapped;
    }
}

// Usage example
/** @var Collection<User> */
$users = new Collection();
$users->add(new User('Alice', 25));
$users->add(new User('Bob', 30));

$names = $users->map(fn(User $u): string => $u->name);
$adults = $users->filter(fn(User $u): bool => $u->age >= 18);
?>
```

## Interview Key Points

### Common Interview Questions

1. **What data types does PHP have? How are they classified?**

   Answer: PHP has four major categories of data types:
   - Scalar types: bool, int, float, string
   - Compound types: array, object, callable, iterable
   - Special types: null, resource
   - Pseudo types: mixed, void, never

2. **What is the difference between == and ===?**

   Answer:
   - `==` is loose comparison, performs type conversion before comparing values
   - `===` is strict comparison, compares both type and value
   - Using `===` is recommended to avoid unexpected type conversions

3. **What is Type Juggling?**

   Answer: PHP automatically performs type conversion based on context. For example, strings are converted to numbers in arithmetic operations, and numbers are converted to strings in string concatenation.

4. **What does declare(strict_types=1) do?**

   Answer: When strict type mode is enabled:
   - Scalar type declarations are strictly enforced
   - No automatic type conversion occurs
   - Type mismatches throw TypeError
   - Only affects function calls in the file where it's declared

5. **How to safely compare floating-point numbers?**

   Answer:
   ```php
   // Using epsilon comparison
   function floatEquals(float $a, float $b, float $e = 0.00001): bool {
       return abs($a - $b) < $e;
   }

   // Or use bcmath extension for precise calculations
   bccomp('0.1', '0.1', 10) === 0;
   ```

6. **What new type system features were introduced in PHP 8?**

   Answer:
   - PHP 8.0: Union types `int|string`, mixed type, static return type
   - PHP 8.1: Intersection types `A&B`, never type, readonly properties
   - PHP 8.2: null/false/true as standalone types, DNF types `(A&B)|C`

### Advanced Topics

- Explain PHP's Copy-on-Write mechanism
- How to implement type-safe collection classes
- Discuss covariance and contravariance in PHP's type system
- Explain why `"php" == 0` is true in PHP 7 but false in PHP 8
- How to use PHPDoc + static analysis tools to achieve generics-like functionality

## Further Reading

### Official Resources

- [PHP Official Documentation - Types](https://www.php.net/manual/en/language.types.php)
- [PHP Official Documentation - Type Declarations](https://www.php.net/manual/en/language.types.declarations.php)
- [PHP RFC: Union Types 2.0](https://wiki.php.net/rfc/union_types_v2)
- [PHP RFC: Mixed Type](https://wiki.php.net/rfc/mixed_type_v2)

### Tools and Extensions

- [PHPStan](https://phpstan.org/) - PHP Static Analysis Tool
- [Psalm](https://psalm.dev/) - PHP Static Analysis Tool with generics support
- [PHP BCMath](https://www.php.net/manual/en/book.bc.php) - Arbitrary Precision Mathematics
- [PHP Decimal](https://php-decimal.io/) - Arbitrary Precision Decimal Numbers

### Related Books

- "Modern PHP" - Josh Lockhart
- "PHP 8 Objects, Patterns, and Practice" - Matt Zandstra
- "Clean Code in PHP" - Carsten Windler

---

Mastering PHP's type system is fundamental to writing high-quality code. Always enable `strict_types=1` in new projects, use complete type declarations, and combine with static analysis tools to catch potential type errors. As PHP 8.x continues to evolve, the type system becomes increasingly powerful. Taking full advantage of these features can significantly improve code reliability and maintainability.
