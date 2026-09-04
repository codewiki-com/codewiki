---
title: PHP Language Fundamentals
description: Deep dive into PHP variables, data types, operators and control structures
track: php
section: basics
difficulty: beginner
tags:
  - PHP
  - Fundamentals
  - Variables
  - Arrays
status: imported
origin: old/src/content/docs/php/fundamentals.en.md
divergence: 0.139
issues: []
legacy:
  category: PHP
  subcategory: Language Basics
  order: 1
  lastUpdated: 2026-01-07
---

PHP (Hypertext Preprocessor) is a widely-used open-source scripting language especially suited for web development. This comprehensive guide covers the fundamental building blocks of PHP programming.

## Variables and Data Types

### Variable Basics

In PHP, variables start with the `$` symbol followed by the variable name. PHP is a loosely typed language, meaning you don't need to declare the data type explicitly.

```php
<?php
$name = "John Doe";
$age = 30;
$price = 19.99;
$isActive = true;
?>
```

**Variable Naming Rules:**
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Case-sensitive (`$name` and `$Name` are different)
- Cannot start with a number

### Data Types

PHP supports several primitive data types:

#### String

A sequence of characters enclosed in quotes.

```php
<?php
$singleQuote = 'Hello World';
$doubleQuote = "Hello World";
$name = "Alice";
$greeting = "Hello, $name!"; // Variable interpolation works with double quotes
echo $greeting; // Output: Hello, Alice!
?>
```

#### Integer

Whole numbers without decimal points.

```php
<?php
$positiveInt = 42;
$negativeInt = -10;
$hexInt = 0x1A; // Hexadecimal
$octalInt = 0755; // Octal
$binaryInt = 0b1010; // Binary

var_dump($positiveInt); // int(42)
?>
```

#### Float (Double)

Numbers with decimal points.

```php
<?php
$pi = 3.14159;
$scientificNotation = 1.5e3; // 1500
$negativeFloat = -7.89;

var_dump($pi); // float(3.14159)
?>
```

#### Boolean

Represents two possible states: true or false.

```php
<?php
$isLogged = true;
$hasPermission = false;

if ($isLogged) {
    echo "User is logged in";
}
?>
```

#### Array

An ordered map that associates keys with values.

```php
<?php
$colors = array("red", "green", "blue");
// Or using short syntax
$fruits = ["apple", "banana", "orange"];
?>
```

#### Object

Instances of classes.

```php
<?php
class Person {
    public $name;
    public $age;

    public function __construct($name, $age) {
        $this->name = $name;
        $this->age = $age;
    }
}

$person = new Person("John", 30);
echo $person->name; // Output: John
?>
```

#### NULL

Represents a variable with no value.

```php
<?php
$empty = null;
$notSet;

var_dump($empty); // NULL
var_dump($notSet); // NULL (undefined variables are null)
?>
```

### Type Checking and Conversion

```php
<?php
$value = "123";

// Type checking
var_dump(is_string($value)); // bool(true)
var_dump(is_int($value)); // bool(false)
var_dump(is_numeric($value)); // bool(true)

// Type conversion (casting)
$intValue = (int)$value;
$floatValue = (float)"3.14";
$stringValue = (string)123;

// Get variable type
echo gettype($value); // string
?>
```

## Operators

### Arithmetic Operators

Used for mathematical calculations.

```php
<?php
$a = 10;
$b = 3;

echo $a + $b;  // Addition: 13
echo $a - $b;  // Subtraction: 7
echo $a * $b;  // Multiplication: 30
echo $a / $b;  // Division: 3.333...
echo $a % $b;  // Modulus (remainder): 1
echo $a ** $b; // Exponentiation: 1000
?>
```

### Assignment Operators

```php
<?php
$x = 10;      // Basic assignment
$x += 5;      // $x = $x + 5 (15)
$x -= 3;      // $x = $x - 3 (12)
$x *= 2;      // $x = $x * 2 (24)
$x /= 4;      // $x = $x / 4 (6)
$x %= 4;      // $x = $x % 4 (2)

$text = "Hello";
$text .= " World"; // String concatenation assignment
echo $text; // Hello World
?>
```

### Comparison Operators

Return boolean values (true or false).

```php
<?php
$a = 5;
$b = "5";
$c = 10;

var_dump($a == $b);   // Equal (true) - loose comparison
var_dump($a === $b);  // Identical (false) - strict comparison
var_dump($a != $c);   // Not equal (true)
var_dump($a !== $b);  // Not identical (true)
var_dump($a < $c);    // Less than (true)
var_dump($a > $c);    // Greater than (false)
var_dump($a <= 5);    // Less than or equal (true)
var_dump($a >= 5);    // Greater than or equal (true)

// Spaceship operator (PHP 7+)
echo 1 <=> 2; // -1 (left is less)
echo 2 <=> 2; // 0 (equal)
echo 3 <=> 2; // 1 (left is greater)
?>
```

### Logical Operators

Used to combine conditional statements.

```php
<?php
$age = 25;
$hasLicense = true;

// AND - both conditions must be true
if ($age >= 18 && $hasLicense) {
    echo "Can drive";
}

// OR - at least one condition must be true
if ($age < 18 || !$hasLicense) {
    echo "Cannot drive";
}

// NOT - reverses the boolean value
$isMinor = !($age >= 18);

// Alternative syntax
$result1 = true and false; // false
$result2 = true or false;  // true
$result3 = true xor false; // true (exclusive or)
?>
```

### Increment/Decrement Operators

```php
<?php
$counter = 5;

echo ++$counter; // Pre-increment: 6 (increment then return)
echo $counter++; // Post-increment: 6 (return then increment)
echo $counter;   // 7

echo --$counter; // Pre-decrement: 6
echo $counter--; // Post-decrement: 6
echo $counter;   // 5
?>
```

### String Operators

```php
<?php
$first = "Hello";
$second = "World";

// Concatenation
$result = $first . " " . $second; // "Hello World"

// Concatenation assignment
$greeting = "Hello";
$greeting .= " there!"; // "Hello there!"
?>
```

## Control Structures

### If-Else Statements

```php
<?php
$score = 85;

if ($score >= 90) {
    echo "Grade: A";
} elseif ($score >= 80) {
    echo "Grade: B";
} elseif ($score >= 70) {
    echo "Grade: C";
} elseif ($score >= 60) {
    echo "Grade: D";
} else {
    echo "Grade: F";
}

// Ternary operator (shorthand)
$status = ($score >= 60) ? "Pass" : "Fail";

// Null coalescing operator (PHP 7+)
$username = $_GET['user'] ?? 'Guest';
?>
```

### Switch Statement

Useful for multiple conditions on the same variable.

```php
<?php
$day = "Monday";

switch ($day) {
    case "Monday":
        echo "Start of the work week";
        break;
    case "Tuesday":
    case "Wednesday":
    case "Thursday":
        echo "Mid-week days";
        break;
    case "Friday":
        echo "End of work week";
        break;
    case "Saturday":
    case "Sunday":
        echo "Weekend!";
        break;
    default:
        echo "Invalid day";
}
?>
```

### Loops

#### While Loop

Executes as long as the condition is true.

```php
<?php
$counter = 1;

while ($counter <= 5) {
    echo "Count: $counter\n";
    $counter++;
}

// Output:
// Count: 1
// Count: 2
// Count: 3
// Count: 4
// Count: 5
?>
```

#### Do-While Loop

Executes at least once, then checks the condition.

```php
<?php
$number = 6;

do {
    echo "Number: $number\n";
    $number++;
} while ($number <= 5);

// Output: Number: 6 (executes once despite condition being false)
?>
```

#### For Loop

Used when the number of iterations is known.

```php
<?php
// Basic for loop
for ($i = 0; $i < 5; $i++) {
    echo "Iteration: $i\n";
}

// Multiple expressions
for ($i = 0, $j = 10; $i < 10; $i++, $j--) {
    echo "i: $i, j: $j\n";
}
?>
```

#### Foreach Loop

Specifically designed for arrays.

```php
<?php
$colors = ["red", "green", "blue"];

// Simple foreach
foreach ($colors as $color) {
    echo "Color: $color\n";
}

// With keys
$person = [
    "name" => "John",
    "age" => 30,
    "city" => "New York"
];

foreach ($person as $key => $value) {
    echo "$key: $value\n";
}
?>
```

### Break and Continue

```php
<?php
// Break - exit the loop
for ($i = 0; $i < 10; $i++) {
    if ($i == 5) {
        break; // Exit loop when i is 5
    }
    echo $i . " ";
} // Output: 0 1 2 3 4

echo "\n";

// Continue - skip current iteration
for ($i = 0; $i < 5; $i++) {
    if ($i == 2) {
        continue; // Skip when i is 2
    }
    echo $i . " ";
} // Output: 0 1 3 4
?>
```

## Functions

### Defining Functions

Functions are reusable blocks of code.

```php
<?php
// Basic function
function greet() {
    echo "Hello, World!";
}

greet(); // Call the function

// Function with parameters
function greetPerson($name) {
    echo "Hello, $name!";
}

greetPerson("Alice"); // Hello, Alice!

// Function with default parameters
function greetWithTitle($name, $title = "Mr.") {
    echo "Hello, $title $name!";
}

greetWithTitle("Smith"); // Hello, Mr. Smith!
greetWithTitle("Jones", "Dr."); // Hello, Dr. Jones!
?>
```

### Return Values

```php
<?php
function add($a, $b) {
    return $a + $b;
}

$sum = add(5, 3);
echo $sum; // 8

// Multiple return points
function getGrade($score) {
    if ($score >= 90) return "A";
    if ($score >= 80) return "B";
    if ($score >= 70) return "C";
    if ($score >= 60) return "D";
    return "F";
}

echo getGrade(85); // B
?>
```

### Type Declarations

PHP 7+ supports type declarations for parameters and return values.

```php
<?php
// Parameter type declarations
function multiply(int $a, int $b): int {
    return $a * $b;
}

echo multiply(5, 3); // 15

// Strict types (add at the top of file)
declare(strict_types=1);

function divide(float $a, float $b): float {
    return $a / $b;
}

// Multiple types (PHP 8+)
function process(int|float $number): int|float {
    return $number * 2;
}
?>
```

### Variable Scope

```php
<?php
$globalVar = "I'm global";

function testScope() {
    // Local variable
    $localVar = "I'm local";

    // Access global variable
    global $globalVar;
    echo $globalVar;

    // Alternative using $GLOBALS
    echo $GLOBALS['globalVar'];
}

// Static variables retain their value
function counter() {
    static $count = 0;
    $count++;
    echo $count . "\n";
}

counter(); // 1
counter(); // 2
counter(); // 3
?>
```

### Anonymous Functions (Closures)

```php
<?php
// Anonymous function
$greet = function($name) {
    echo "Hello, $name!";
};

$greet("Bob"); // Hello, Bob!

// Using with array functions
$numbers = [1, 2, 3, 4, 5];
$squared = array_map(function($n) {
    return $n * $n;
}, $numbers);

print_r($squared); // [1, 4, 9, 16, 25]

// Arrow functions (PHP 7.4+)
$double = fn($n) => $n * 2;
echo $double(5); // 10
?>
```

## Arrays

Arrays are one of the most important data structures in PHP.

### Creating Arrays

```php
<?php
// Indexed array
$fruits = ["apple", "banana", "orange"];
$colors = array("red", "green", "blue");

// Associative array
$person = [
    "name" => "John",
    "age" => 30,
    "email" => "john@example.com"
];

// Multidimensional array
$users = [
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 30],
    ["name" => "Charlie", "age" => 35]
];
?>
```

### Accessing Array Elements

```php
<?php
$fruits = ["apple", "banana", "orange"];

echo $fruits[0]; // apple
echo $fruits[2]; // orange

$person = ["name" => "John", "age" => 30];
echo $person["name"]; // John

// Multidimensional access
$users = [
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 30]
];

echo $users[0]["name"]; // Alice
echo $users[1]["age"];  // 30
?>
```

### Modifying Arrays

```php
<?php
$fruits = ["apple", "banana"];

// Add elements
$fruits[] = "orange";           // Append
$fruits[1] = "grape";           // Modify existing
array_push($fruits, "mango");   // Add to end
array_unshift($fruits, "pear"); // Add to beginning

// Remove elements
unset($fruits[0]);              // Remove by index
$last = array_pop($fruits);     // Remove and return last
$first = array_shift($fruits);  // Remove and return first

// Merge arrays
$array1 = [1, 2, 3];
$array2 = [4, 5, 6];
$merged = array_merge($array1, $array2); // [1, 2, 3, 4, 5, 6]
?>
```

### Array Functions

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// Count elements
echo count($numbers); // 5

// Check if element exists
if (in_array(3, $numbers)) {
    echo "Found!";
}

// Check if key exists
$person = ["name" => "John", "age" => 30];
if (array_key_exists("name", $person)) {
    echo "Key exists!";
}

// Get keys and values
$keys = array_keys($person);     // ["name", "age"]
$values = array_values($person); // ["John", 30]

// Search
$fruits = ["apple", "banana", "orange"];
$position = array_search("banana", $fruits); // 1

// Slice
$slice = array_slice($numbers, 1, 3); // [2, 3, 4]

// Filter
$even = array_filter($numbers, function($n) {
    return $n % 2 == 0;
}); // [2, 4]

// Map
$squared = array_map(function($n) {
    return $n * $n;
}, $numbers); // [1, 4, 9, 16, 25]

// Reduce
$sum = array_reduce($numbers, function($carry, $item) {
    return $carry + $item;
}, 0); // 15

// Sort
sort($numbers);           // Sort ascending
rsort($numbers);          // Sort descending
asort($person);           // Sort associative array by value
ksort($person);           // Sort associative array by key
?>
```

### Array Iteration

```php
<?php
$fruits = ["apple", "banana", "orange"];

// Foreach
foreach ($fruits as $fruit) {
    echo $fruit . "\n";
}

// With index
foreach ($fruits as $index => $fruit) {
    echo "$index: $fruit\n";
}

// Associative array
$person = ["name" => "John", "age" => 30, "city" => "NYC"];
foreach ($person as $key => $value) {
    echo "$key: $value\n";
}

// Array destructuring in foreach (PHP 7.1+)
$users = [
    ["Alice", 25],
    ["Bob", 30]
];

foreach ($users as [$name, $age]) {
    echo "$name is $age years old\n";
}
?>
```

## Strings

Strings are sequences of characters and are fundamental to PHP programming.

### String Creation

```php
<?php
// Single quotes - literal strings
$name = 'John';
$message = 'Hello, World!';

// Double quotes - allows variable interpolation
$greeting = "Hello, $name!";
$text = "Line 1\nLine 2"; // Escape sequences work

// Heredoc syntax - multi-line strings with parsing
$html = <<<HTML
<div>
    <h1>$name's Profile</h1>
    <p>Welcome to the site!</p>
</div>
HTML;

// Nowdoc syntax - multi-line literal strings (PHP 5.3+)
$code = <<<'CODE'
$var = "This won't be parsed";
echo $var;
CODE;
?>
```

### String Concatenation

```php
<?php
$first = "Hello";
$second = "World";

// Using dot operator
$result = $first . " " . $second; // "Hello World"

// Using double quotes
$result = "$first $second"; // "Hello World"

// Concatenation assignment
$message = "Hello";
$message .= " World"; // "Hello World"
?>
```

### String Functions

```php
<?php
$text = "Hello World";

// Length
echo strlen($text); // 11

// Case conversion
echo strtoupper($text); // HELLO WORLD
echo strtolower($text); // hello world
echo ucfirst("hello");  // Hello
echo ucwords("hello world"); // Hello World

// Substring
echo substr($text, 0, 5);  // Hello
echo substr($text, 6);     // World
echo substr($text, -5);    // World

// Position
$pos = strpos($text, "World"); // 6
$pos = stripos($text, "world"); // 6 (case-insensitive)

// Replace
$new = str_replace("World", "PHP", $text); // Hello PHP
$new = str_ireplace("world", "PHP", $text); // Hello PHP (case-insensitive)

// Trim whitespace
$dirty = "  Hello  ";
echo trim($dirty);   // "Hello"
echo ltrim($dirty);  // "Hello  "
echo rtrim($dirty);  // "  Hello"

// Split and join
$words = explode(" ", $text);      // ["Hello", "World"]
$joined = implode("-", $words);    // "Hello-World"

// Repeat
echo str_repeat("Ha", 3); // HaHaHa

// Reverse
echo strrev("Hello"); // olleH

// Character access
echo $text[0];  // H
echo $text[6];  // W
?>
```

### String Formatting

```php
<?php
// sprintf - formatted string
$name = "John";
$age = 30;
$formatted = sprintf("Name: %s, Age: %d", $name, $age);
echo $formatted; // Name: John, Age: 30

// printf - print formatted string
printf("%.2f", 3.14159); // 3.14

// Number formatting
$number = 1234567.89;
echo number_format($number);           // 1,234,568
echo number_format($number, 2);        // 1,234,567.89
echo number_format($number, 2, ",", "."); // 1.234.567,89
?>
```

### String Comparison

```php
<?php
$str1 = "hello";
$str2 = "Hello";
$str3 = "hello";

// Case-sensitive comparison
if ($str1 == $str3) {
    echo "Equal";
}

// Case-insensitive comparison
if (strcasecmp($str1, $str2) == 0) {
    echo "Equal (case-insensitive)";
}

// strcmp returns -1, 0, or 1
$result = strcmp($str1, $str2); // Returns > 0
?>
```

### String Parsing

```php
<?php
// Parse CSV
$csv = "John,Doe,30,NYC";
$data = str_getcsv($csv);
print_r($data); // ["John", "Doe", "30", "NYC"]

// Parse URL
$url = "https://example.com:8080/path?key=value#section";
$parts = parse_url($url);
/*
Array (
    [scheme] => https
    [host] => example.com
    [port] => 8080
    [path] => /path
    [query] => key=value
    [fragment] => section
)
*/

// HTML entities
$html = "<h1>Title</h1>";
$encoded = htmlspecialchars($html); // &lt;h1&gt;Title&lt;/h1&gt;
$decoded = htmlspecialchars_decode($encoded);

// URL encoding
$query = "hello world";
$encoded = urlencode($query);  // hello+world
$decoded = urldecode($encoded);
?>
```

### Regular Expressions

```php
<?php
$text = "The price is $50";

// Match pattern
if (preg_match('/\$(\d+)/', $text, $matches)) {
    echo "Found: " . $matches[1]; // 50
}

// Replace with pattern
$cleaned = preg_replace('/\d+/', 'XX', $text); // "The price is $XX"

// Split by pattern
$parts = preg_split('/\s+/', "Hello   World  PHP");
print_r($parts); // ["Hello", "World", "PHP"]

// Match all
$text = "Email: john@example.com, alice@test.com";
preg_match_all('/[\w.-]+@[\w.-]+\.\w+/', $text, $emails);
print_r($emails[0]); // ["john@example.com", "alice@test.com"]
?>
```

## Conclusion

We covered the fundamental concepts of PHP programming including variables, data types, operators, control structures, functions, arrays, and strings. These building blocks form the foundation for more advanced PHP development.

### Key Takeaways

- PHP is a loosely typed language with flexible variable handling
- Understanding data types and type conversion is crucial for robust code
- Control structures provide the logic flow for your applications
- Functions promote code reusability and organization
- Arrays are versatile data structures essential for data manipulation
- String operations are fundamental for text processing and web development

### Next Steps

After mastering these fundamentals, you can explore:
- Object-Oriented Programming (OOP) in PHP
- Working with databases (MySQL, PostgreSQL)
- Error and exception handling
- File system operations
- PHP frameworks (Laravel, Symfony, CodeIgniter)
- Modern PHP features (PHP 8+)

Keep practicing with code examples and building small projects to reinforce these concepts!
