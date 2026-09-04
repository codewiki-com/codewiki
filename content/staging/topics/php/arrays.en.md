---
title: PHP Arrays Complete Guide
description: Master PHP arrays including indexed, associative, multidimensional arrays and array functions
track: php
section: basics
difficulty: beginner
tags:
  - PHP
  - arrays
  - data structures
status: imported
origin: old/src/content/docs/php/arrays.en.md
divergence: 0.208
issues:
  - title-lang-zh
  - title-language
legacy:
  category: PHP
  subcategory: Data Structures
  order: 8
  lastUpdated: 2026-01-07
---

Arrays are one of the most powerful and versatile data structures in PHP. They allow you to store multiple values in a single variable, making data organization and manipulation efficient and intuitive. This comprehensive guide covers everything you need to know about PHP arrays, from basic concepts to advanced techniques.

## What is an Array

An array in PHP is an ordered map that associates keys with values. Unlike arrays in some other programming languages, PHP arrays are highly flexible and can hold values of different data types. They can function as traditional arrays, lists, hash tables, dictionaries, collections, stacks, queues, and more.

```php
<?php
// Arrays can hold multiple values of any type
$mixed = [
    "string value",
    42,
    3.14,
    true,
    null,
    ["nested", "array"]
];

print_r($mixed);
/*
Array
(
    [0] => string value
    [1] => 42
    [2] => 3.14
    [3] => 1
    [4] =>
    [5] => Array
        (
            [0] => nested
            [1] => array
        )
)
*/
?>
```

### Key Characteristics

- **Dynamic sizing**: Arrays automatically grow or shrink as needed
- **Mixed types**: Can contain elements of different data types
- **Flexible keys**: Support both integer and string keys
- **Ordered**: Maintain insertion order (since PHP 7.0)
- **Copy-on-write**: Arrays are copied by value, not by reference

## Indexed Arrays

Indexed arrays (also called numeric arrays) use integer keys to access values. The index starts at 0 by default.

### Creating Indexed Arrays

```php
<?php
// Using square bracket syntax (recommended)
$fruits = ["apple", "banana", "orange", "grape"];

// Using array() function
$colors = array("red", "green", "blue");

// Creating an empty array and adding elements
$numbers = [];
$numbers[] = 10;
$numbers[] = 20;
$numbers[] = 30;

// Specifying indexes explicitly
$letters = [];
$letters[0] = "a";
$letters[1] = "b";
$letters[2] = "c";

print_r($fruits);
/*
Array
(
    [0] => apple
    [1] => banana
    [2] => orange
    [3] => grape
)
*/
?>
```

### Accessing Elements

```php
<?php
$fruits = ["apple", "banana", "orange", "grape"];

// Access by index
echo $fruits[0]; // apple
echo $fruits[2]; // orange

// Access last element
echo $fruits[count($fruits) - 1]; // grape

// Negative indexing (PHP 7.1+) - doesn't work like Python!
// Use array_slice instead
$lastTwo = array_slice($fruits, -2);
print_r($lastTwo); // ["orange", "grape"]

// Check if index exists before accessing
if (isset($fruits[5])) {
    echo $fruits[5];
} else {
    echo "Index 5 does not exist";
}
?>
```

### Non-Sequential Indexes

PHP arrays don't require sequential indexes:

```php
<?php
$sparse = [];
$sparse[0] = "first";
$sparse[5] = "sixth";
$sparse[10] = "eleventh";

print_r($sparse);
/*
Array
(
    [0] => first
    [5] => sixth
    [10] => eleventh
)
*/

// Next auto-assigned index will be 11
$sparse[] = "next";
print_r($sparse);
/*
Array
(
    [0] => first
    [5] => sixth
    [10] => eleventh
    [11] => next
)
*/
?>
```

## Associative Arrays

Associative arrays use named keys (strings) to access values, similar to dictionaries or hash maps in other languages.

### Creating Associative Arrays

```php
<?php
// Using key => value syntax
$person = [
    "name" => "John Doe",
    "age" => 30,
    "email" => "john@example.com",
    "active" => true
];

// Using array() function
$config = array(
    "host" => "localhost",
    "port" => 3306,
    "database" => "myapp"
);

// Adding elements one by one
$user = [];
$user["id"] = 1;
$user["username"] = "johndoe";
$user["role"] = "admin";

print_r($person);
/*
Array
(
    [name] => John Doe
    [age] => 30
    [email] => john@example.com
    [active] => 1
)
*/
?>
```

### Accessing and Modifying

```php
<?php
$person = [
    "name" => "John Doe",
    "age" => 30,
    "email" => "john@example.com"
];

// Access by key
echo $person["name"]; // John Doe
echo $person["age"];  // 30

// Modify existing value
$person["age"] = 31;

// Add new key-value pair
$person["phone"] = "555-1234";

// Remove a key
unset($person["email"]);

print_r($person);
/*
Array
(
    [name] => John Doe
    [age] => 31
    [phone] => 555-1234
)
*/

// Check if key exists
if (array_key_exists("name", $person)) {
    echo "Name exists: " . $person["name"];
}

// Null coalescing operator for safe access
$country = $person["country"] ?? "Unknown";
echo $country; // Unknown
?>
```

### Mixed Keys

Arrays can have both numeric and string keys:

```php
<?php
$mixed = [
    0 => "first",
    "name" => "John",
    1 => "second",
    "age" => 30,
    "third"  // Auto-assigned index 2
];

print_r($mixed);
/*
Array
(
    [0] => first
    [name] => John
    [1] => second
    [age] => 30
    [2] => third
)
*/
?>
```

## Multidimensional Arrays

Multidimensional arrays are arrays containing one or more arrays. They are useful for representing complex data structures like tables, matrices, or hierarchical data.

### Two-Dimensional Arrays

```php
<?php
// Array of users (table-like structure)
$users = [
    ["id" => 1, "name" => "Alice", "role" => "admin"],
    ["id" => 2, "name" => "Bob", "role" => "editor"],
    ["id" => 3, "name" => "Charlie", "role" => "viewer"]
];

// Access specific element
echo $users[0]["name"]; // Alice
echo $users[1]["role"]; // editor

// Iterate through 2D array
foreach ($users as $user) {
    echo "ID: {$user['id']}, Name: {$user['name']}, Role: {$user['role']}\n";
}
/*
ID: 1, Name: Alice, Role: admin
ID: 2, Name: Bob, Role: editor
ID: 3, Name: Charlie, Role: viewer
*/

// Matrix (numeric grid)
$matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

echo $matrix[1][1]; // 5 (center element)
?>
```

### Three-Dimensional Arrays

```php
<?php
// Company structure
$company = [
    "Engineering" => [
        "Frontend" => [
            ["name" => "Alice", "title" => "Senior Developer"],
            ["name" => "Bob", "title" => "Junior Developer"]
        ],
        "Backend" => [
            ["name" => "Charlie", "title" => "Lead Developer"],
            ["name" => "Diana", "title" => "Developer"]
        ]
    ],
    "Marketing" => [
        "Digital" => [
            ["name" => "Eve", "title" => "Marketing Manager"]
        ],
        "Content" => [
            ["name" => "Frank", "title" => "Content Writer"]
        ]
    ]
];

// Access nested data
echo $company["Engineering"]["Frontend"][0]["name"]; // Alice

// Iterate through nested structure
foreach ($company as $department => $teams) {
    echo "\n=== $department Department ===\n";
    foreach ($teams as $team => $members) {
        echo "\n$team Team:\n";
        foreach ($members as $member) {
            echo "  - {$member['name']} ({$member['title']})\n";
        }
    }
}
?>
```

### Practical Example: Shopping Cart

```php
<?php
$cart = [
    "items" => [
        [
            "id" => 101,
            "name" => "Laptop",
            "price" => 999.99,
            "quantity" => 1,
            "attributes" => [
                "color" => "silver",
                "storage" => "256GB"
            ]
        ],
        [
            "id" => 102,
            "name" => "Mouse",
            "price" => 29.99,
            "quantity" => 2,
            "attributes" => [
                "color" => "black",
                "wireless" => true
            ]
        ]
    ],
    "customer" => [
        "id" => 1,
        "name" => "John Doe",
        "email" => "john@example.com"
    ],
    "shipping" => [
        "method" => "express",
        "cost" => 15.00
    ]
];

// Calculate total
$subtotal = 0;
foreach ($cart["items"] as $item) {
    $subtotal += $item["price"] * $item["quantity"];
}
$total = $subtotal + $cart["shipping"]["cost"];

echo "Subtotal: $" . number_format($subtotal, 2) . "\n";
echo "Shipping: $" . number_format($cart["shipping"]["cost"], 2) . "\n";
echo "Total: $" . number_format($total, 2) . "\n";
/*
Subtotal: $1,059.97
Shipping: $15.00
Total: $1,074.97
*/
?>
```

## Creating Arrays

PHP offers multiple ways to create arrays, each suited for different scenarios.

### Square Bracket Syntax

The modern and recommended way to create arrays:

```php
<?php
$empty = [];
$indexed = [1, 2, 3, 4, 5];
$associative = ["key1" => "value1", "key2" => "value2"];
$nested = [
    "level1" => [
        "level2" => [
            "value" => "deep"
        ]
    ]
];
?>
```

### array() Function

The traditional syntax, still widely used:

```php
<?php
$empty = array();
$indexed = array(1, 2, 3, 4, 5);
$associative = array("key1" => "value1", "key2" => "value2");
?>
```

### range() Function

Creates an array containing a range of elements:

```php
<?php
// Numeric range
$numbers = range(1, 10);
print_r($numbers); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// With step
$evens = range(2, 10, 2);
print_r($evens); // [2, 4, 6, 8, 10]

// Character range
$letters = range('a', 'f');
print_r($letters); // ['a', 'b', 'c', 'd', 'e', 'f']

// Descending range
$countdown = range(5, 1);
print_r($countdown); // [5, 4, 3, 2, 1]
?>
```

### array_fill() and array_fill_keys()

Create arrays with preset values:

```php
<?php
// Fill array with same value
$filled = array_fill(0, 5, "default");
print_r($filled); // ["default", "default", "default", "default", "default"]

// Fill with starting index
$indexed = array_fill(10, 3, "value");
print_r($indexed); // [10 => "value", 11 => "value", 12 => "value"]

// Create array with specific keys and a default value
$keys = ["name", "email", "phone"];
$template = array_fill_keys($keys, null);
print_r($template);
/*
Array
(
    [name] =>
    [email] =>
    [phone] =>
)
*/
?>
```

### array_combine()

Creates an array using one array for keys and another for values:

```php
<?php
$keys = ["name", "age", "city"];
$values = ["John", 30, "New York"];

$person = array_combine($keys, $values);
print_r($person);
/*
Array
(
    [name] => John
    [age] => 30
    [city] => New York
)
*/
?>
```

### Compact and Extract

Convert variables to/from arrays:

```php
<?php
// compact() - creates array from variables
$name = "John";
$age = 30;
$city = "New York";

$person = compact("name", "age", "city");
print_r($person);
/*
Array
(
    [name] => John
    [age] => 30
    [city] => New York
)
*/

// extract() - creates variables from array
$data = [
    "title" => "PHP Developer",
    "salary" => 75000,
    "department" => "Engineering"
];

extract($data);
echo $title;      // PHP Developer
echo $salary;     // 75000
echo $department; // Engineering
?>
```

## Accessing Array Elements

### Basic Access

```php
<?php
$colors = ["red", "green", "blue"];
$person = ["name" => "John", "age" => 30];

// Direct access
echo $colors[0];      // red
echo $person["name"]; // John

// Variable as key
$key = "age";
echo $person[$key]; // 30

// Nested access
$data = [
    "users" => [
        ["name" => "Alice"],
        ["name" => "Bob"]
    ]
];
echo $data["users"][1]["name"]; // Bob
?>
```

### Safe Access Patterns

```php
<?php
$data = ["name" => "John"];

// Check existence before access
if (isset($data["email"])) {
    echo $data["email"];
} else {
    echo "Email not set";
}

// Null coalescing operator (PHP 7+)
$email = $data["email"] ?? "not provided";
echo $email; // not provided

// array_key_exists vs isset
$data = ["key" => null];

var_dump(isset($data["key"]));            // false (null is considered unset)
var_dump(array_key_exists("key", $data)); // true (key exists)

// Null coalescing assignment (PHP 7.4+)
$data["country"] ??= "USA";
echo $data["country"]; // USA
?>
```

### Destructuring (Array Unpacking)

```php
<?php
// List assignment
$coordinates = [10, 20, 30];
list($x, $y, $z) = $coordinates;
echo "X: $x, Y: $y, Z: $z"; // X: 10, Y: 20, Z: 30

// Short syntax (PHP 7.1+)
[$a, $b, $c] = [1, 2, 3];
echo "$a, $b, $c"; // 1, 2, 3

// Skip elements
[$first, , $third] = ["one", "two", "three"];
echo "$first, $third"; // one, three

// Associative array destructuring (PHP 7.1+)
$person = ["name" => "John", "age" => 30, "city" => "NYC"];
["name" => $name, "age" => $age] = $person;
echo "$name is $age years old"; // John is 30 years old

// Swap variables
$a = 1;
$b = 2;
[$a, $b] = [$b, $a];
echo "$a, $b"; // 2, 1

// In foreach loops
$users = [
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 30]
];

foreach ($users as ["name" => $name, "age" => $age]) {
    echo "$name: $age years old\n";
}
?>
```

## Modifying Arrays

### Adding Elements

```php
<?php
$fruits = ["apple", "banana"];

// Append to end
$fruits[] = "orange";

// Using array_push (can add multiple)
array_push($fruits, "grape", "mango");

// Add to beginning
array_unshift($fruits, "pear");

// Insert at specific position
array_splice($fruits, 2, 0, ["kiwi"]);

print_r($fruits);
/*
Array
(
    [0] => pear
    [1] => apple
    [2] => kiwi
    [3] => banana
    [4] => orange
    [5] => grape
    [6] => mango
)
*/

// Associative arrays
$person = ["name" => "John"];
$person["age"] = 30;
$person["email"] = "john@example.com";
?>
```

### Removing Elements

```php
<?php
$fruits = ["apple", "banana", "orange", "grape", "mango"];

// Remove last element
$last = array_pop($fruits);
echo $last; // mango

// Remove first element
$first = array_shift($fruits);
echo $first; // apple

// Remove by key
unset($fruits[1]); // Removes "orange" (indexes not reindexed)

// Remove by value (first occurrence)
$key = array_search("grape", $fruits);
if ($key !== false) {
    unset($fruits[$key]);
}

// Remove multiple elements
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
$removed = array_splice($numbers, 3, 4); // Remove 4 elements starting at index 3
print_r($removed); // [4, 5, 6, 7]
print_r($numbers); // [1, 2, 3, 8, 9, 10]

// Reindex array after unset
$reindexed = array_values($fruits);
?>
```

### Replacing Elements

```php
<?php
$colors = ["red", "green", "blue", "yellow"];

// Replace by index
$colors[1] = "lime";

// Replace using array_splice
array_splice($colors, 2, 1, ["navy", "cyan"]);
print_r($colors); // ["red", "lime", "navy", "cyan", "yellow"]

// Replace using array_replace
$defaults = ["color" => "blue", "size" => "medium", "stock" => 0];
$custom = ["color" => "red", "stock" => 50];

$result = array_replace($defaults, $custom);
print_r($result);
/*
Array
(
    [color] => red
    [size] => medium
    [stock] => 50
)
*/
?>
```

## Array Iteration

### foreach Loop

The most common way to iterate arrays:

```php
<?php
// Simple iteration
$fruits = ["apple", "banana", "orange"];

foreach ($fruits as $fruit) {
    echo $fruit . "\n";
}

// With index/key
foreach ($fruits as $index => $fruit) {
    echo "$index: $fruit\n";
}
/*
0: apple
1: banana
2: orange
*/

// Associative array
$person = ["name" => "John", "age" => 30, "city" => "NYC"];

foreach ($person as $key => $value) {
    echo "$key: $value\n";
}

// Modify values by reference
$numbers = [1, 2, 3, 4, 5];

foreach ($numbers as &$number) {
    $number *= 2;
}
unset($number); // Important: unset reference after loop

print_r($numbers); // [2, 4, 6, 8, 10]
?>
```

### for Loop

Useful when you need the index:

```php
<?php
$colors = ["red", "green", "blue"];
$count = count($colors);

for ($i = 0; $i < $count; $i++) {
    echo "Color $i: {$colors[$i]}\n";
}

// Reverse iteration
for ($i = $count - 1; $i >= 0; $i--) {
    echo "Color $i: {$colors[$i]}\n";
}
?>
```

### while Loop with Array Functions

```php
<?php
$fruits = ["apple", "banana", "orange"];

// Using each() - deprecated in PHP 7.2+
// Use foreach or array_walk instead

// Using array_shift
while ($fruit = array_shift($fruits)) {
    echo $fruit . "\n";
}
// Note: $fruits is now empty

// Reset and iterate with current/next
$colors = ["red", "green", "blue"];
reset($colors);
while ($color = current($colors)) {
    echo $color . "\n";
    next($colors);
}
?>
```

### array_walk and array_walk_recursive

Apply a callback to each element:

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// array_walk modifies array in place
array_walk($numbers, function(&$value, $key) {
    $value = $value * 2;
});
print_r($numbers); // [2, 4, 6, 8, 10]

// With additional data
$prices = [100, 200, 300];
array_walk($prices, function(&$price, $key, $taxRate) {
    $price = $price * (1 + $taxRate);
}, 0.08);
print_r($prices); // [108, 216, 324]

// Recursive walk for nested arrays
$data = [
    "name" => "  John  ",
    "details" => [
        "email" => "  john@example.com  ",
        "phone" => "  555-1234  "
    ]
];

array_walk_recursive($data, function(&$value) {
    if (is_string($value)) {
        $value = trim($value);
    }
});
print_r($data);
/*
Array
(
    [name] => John
    [details] => Array
        (
            [email] => john@example.com
            [phone] => 555-1234
        )
)
*/
?>
```

## Array Functions

PHP provides a rich set of built-in array functions. Here are the most commonly used ones:

### Counting and Information

```php
<?php
$fruits = ["apple", "banana", "orange", "apple"];

// Count elements
echo count($fruits);     // 4
echo sizeof($fruits);    // 4 (alias of count)

// Count values
$counts = array_count_values($fruits);
print_r($counts);
/*
Array
(
    [apple] => 2
    [banana] => 1
    [orange] => 1
)
*/

// Check if array
var_dump(is_array($fruits));     // true
var_dump(is_array("not array")); // false

// Check if empty
$empty = [];
var_dump(empty($empty)); // true

// Get unique values
$unique = array_unique($fruits);
print_r($unique); // ["apple", "banana", "orange"]
?>
```

### Keys and Values

```php
<?php
$person = [
    "name" => "John",
    "age" => 30,
    "email" => "john@example.com"
];

// Get all keys
$keys = array_keys($person);
print_r($keys); // ["name", "age", "email"]

// Get all values
$values = array_values($person);
print_r($values); // ["John", 30, "john@example.com"]

// Get keys for specific value
$data = ["a" => 1, "b" => 2, "c" => 1];
$keysForOne = array_keys($data, 1);
print_r($keysForOne); // ["a", "c"]

// Flip keys and values
$flipped = array_flip(["a" => 0, "b" => 1, "c" => 2]);
print_r($flipped); // [0 => "a", 1 => "b", 2 => "c"]

// Get first/last key (PHP 7.3+)
echo array_key_first($person); // name
echo array_key_last($person);  // email
?>
```

### Stack and Queue Operations

```php
<?php
// Stack (LIFO - Last In First Out)
$stack = [];

// Push onto stack
array_push($stack, "first");
array_push($stack, "second");
array_push($stack, "third");

// Pop from stack
$top = array_pop($stack); // "third"
echo $top;

print_r($stack); // ["first", "second"]

// Queue (FIFO - First In First Out)
$queue = [];

// Enqueue (add to end)
array_push($queue, "first");
array_push($queue, "second");
array_push($queue, "third");

// Dequeue (remove from front)
$front = array_shift($queue); // "first"
echo $front;

print_r($queue); // ["second", "third"]

// Add to front
array_unshift($queue, "new first");
print_r($queue); // ["new first", "second", "third"]
?>
```

### Slicing and Extracting

```php
<?php
$letters = ["a", "b", "c", "d", "e", "f"];

// Slice (extract portion)
$slice1 = array_slice($letters, 2);      // ["c", "d", "e", "f"] - from index 2
$slice2 = array_slice($letters, 1, 3);   // ["b", "c", "d"] - 3 elements from index 1
$slice3 = array_slice($letters, -2);     // ["e", "f"] - last 2 elements
$slice4 = array_slice($letters, 0, -2);  // ["a", "b", "c", "d"] - all except last 2

// Preserve keys
$assoc = ["a" => 1, "b" => 2, "c" => 3, "d" => 4];
$preserved = array_slice($assoc, 1, 2, true);
print_r($preserved); // ["b" => 2, "c" => 3]

// Splice (remove/replace portion)
$numbers = [1, 2, 3, 4, 5];
$removed = array_splice($numbers, 2, 2, [30, 40]);
print_r($removed);  // [3, 4] - removed elements
print_r($numbers);  // [1, 2, 30, 40, 5] - modified array

// Get random elements
$colors = ["red", "green", "blue", "yellow", "purple"];
$randomKey = array_rand($colors);           // Random key
$randomKeys = array_rand($colors, 2);       // Array of 2 random keys
echo $colors[$randomKey];
?>
```

## Sorting Arrays

PHP provides numerous functions for sorting arrays in different ways.

### Sorting Indexed Arrays

```php
<?php
$numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// Sort ascending (modifies original)
sort($numbers);
print_r($numbers); // [1, 1, 2, 3, 4, 5, 6, 9]

// Sort descending
rsort($numbers);
print_r($numbers); // [9, 6, 5, 4, 3, 2, 1, 1]

$fruits = ["banana", "Apple", "orange", "apple"];

// Case-sensitive sort
sort($fruits);
print_r($fruits); // ["Apple", "apple", "banana", "orange"]

// Natural order (case-insensitive)
sort($fruits, SORT_NATURAL | SORT_FLAG_CASE);
print_r($fruits); // ["Apple", "apple", "banana", "orange"]

// Numeric sort
$mixed = ["10", "1", "2", "20"];
sort($mixed, SORT_NUMERIC);
print_r($mixed); // ["1", "2", "10", "20"]
?>
```

### Sorting Associative Arrays

```php
<?php
$ages = [
    "John" => 30,
    "Alice" => 25,
    "Bob" => 35
];

// Sort by value, maintain keys
asort($ages);
print_r($ages);
/*
Array
(
    [Alice] => 25
    [John] => 30
    [Bob] => 35
)
*/

// Sort by value descending
arsort($ages);
print_r($ages);
/*
Array
(
    [Bob] => 35
    [John] => 30
    [Alice] => 25
)
*/

// Sort by key
ksort($ages);
print_r($ages);
/*
Array
(
    [Alice] => 25
    [Bob] => 35
    [John] => 30
)
*/

// Sort by key descending
krsort($ages);
print_r($ages);
/*
Array
(
    [John] => 30
    [Bob] => 35
    [Alice] => 25
)
*/
?>
```

### Natural Sorting

```php
<?php
$files = ["img12.png", "img1.png", "img2.png", "img10.png"];

// Regular sort
sort($files);
print_r($files);
// ["img1.png", "img10.png", "img12.png", "img2.png"]

// Natural sort
$files = ["img12.png", "img1.png", "img2.png", "img10.png"];
natsort($files);
print_r($files);
// ["img1.png", "img2.png", "img10.png", "img12.png"]

// Case-insensitive natural sort
$items = ["Item12", "item1", "ITEM2", "item10"];
natcasesort($items);
print_r($items);
// ["item1", "ITEM2", "item10", "Item12"]
?>
```

### Custom Sorting

```php
<?php
// usort - user-defined comparison function
$numbers = [3, 1, 4, 1, 5, 9];

usort($numbers, function($a, $b) {
    return $a - $b; // Ascending
    // return $b - $a; // Descending
});
print_r($numbers); // [1, 1, 3, 4, 5, 9]

// Spaceship operator (PHP 7+)
usort($numbers, fn($a, $b) => $a <=> $b);

// Sort complex arrays
$users = [
    ["name" => "John", "age" => 30],
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 35]
];

// Sort by age
usort($users, fn($a, $b) => $a["age"] <=> $b["age"]);
print_r($users);
/*
Array
(
    [0] => Array([name] => Alice, [age] => 25)
    [1] => Array([name] => John, [age] => 30)
    [2] => Array([name] => Bob, [age] => 35)
)
*/

// Sort by name (string comparison)
usort($users, fn($a, $b) => strcmp($a["name"], $b["name"]));

// uasort - maintain key association
$scores = ["Alice" => 85, "Bob" => 92, "Charlie" => 78];
uasort($scores, fn($a, $b) => $b - $a); // Descending
print_r($scores);
/*
Array
(
    [Bob] => 92
    [Alice] => 85
    [Charlie] => 78
)
*/

// uksort - sort by keys using callback
uksort($scores, fn($a, $b) => strlen($a) - strlen($b));
?>
```

### Sorting Multidimensional Arrays

```php
<?php
$products = [
    ["name" => "Laptop", "price" => 999, "stock" => 5],
    ["name" => "Mouse", "price" => 29, "stock" => 50],
    ["name" => "Keyboard", "price" => 79, "stock" => 25],
    ["name" => "Monitor", "price" => 299, "stock" => 10]
];

// Sort by single column
usort($products, fn($a, $b) => $a["price"] <=> $b["price"]);

// Sort by multiple columns (price ascending, then stock descending)
usort($products, function($a, $b) {
    $priceCompare = $a["price"] <=> $b["price"];
    if ($priceCompare !== 0) {
        return $priceCompare;
    }
    return $b["stock"] <=> $a["stock"];
});

// Using array_multisort
$names = array_column($products, "name");
$prices = array_column($products, "price");

array_multisort($prices, SORT_ASC, $names, SORT_ASC, $products);
print_r($products);
?>
```

## Array Searching and Filtering

### Searching

```php
<?php
$fruits = ["apple", "banana", "orange", "grape"];

// Check if value exists
if (in_array("banana", $fruits)) {
    echo "Banana found!";
}

// Strict type checking
$mixed = [1, "1", 2, "2"];
var_dump(in_array(1, $mixed));         // true
var_dump(in_array("1", $mixed));       // true
var_dump(in_array(1, $mixed, true));   // true (strict)
var_dump(in_array("1", $mixed, true)); // true (strict)

// Find key for value
$key = array_search("orange", $fruits);
echo $key; // 2

// Strict search
$key = array_search(1, $mixed, true); // 0

// Check if key exists
$person = ["name" => "John", "age" => null];
var_dump(isset($person["age"]));              // false (null)
var_dump(array_key_exists("age", $person));   // true

// Find all matching keys
$data = [1, 2, 3, 1, 2, 1];
$keys = array_keys($data, 1);
print_r($keys); // [0, 3, 5]
?>
```

### Filtering

```php
<?php
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Filter with callback
$evens = array_filter($numbers, fn($n) => $n % 2 === 0);
print_r($evens); // [2, 4, 6, 8, 10]

$odds = array_filter($numbers, fn($n) => $n % 2 !== 0);
print_r($odds); // [1, 3, 5, 7, 9]

// Filter by key
$data = ["a" => 1, "b" => 2, "c" => 3, "d" => 4];
$filtered = array_filter($data, fn($key) => $key !== "b", ARRAY_FILTER_USE_KEY);
print_r($filtered); // ["a" => 1, "c" => 3, "d" => 4]

// Filter by both key and value
$filtered = array_filter($data, fn($value, $key) => $value > 1 && $key !== "d", ARRAY_FILTER_USE_BOTH);
print_r($filtered); // ["b" => 2, "c" => 3]

// Remove empty values
$mixed = ["hello", "", null, 0, false, "world", [], 1];
$nonEmpty = array_filter($mixed); // Uses default filter (removes falsy values)
print_r($nonEmpty); // ["hello", "world", 1]

// Remove nulls only
$withNulls = ["a" => 1, "b" => null, "c" => 2, "d" => null];
$noNulls = array_filter($withNulls, fn($v) => $v !== null);
print_r($noNulls); // ["a" => 1, "c" => 2]

// Complex filtering
$users = [
    ["name" => "Alice", "age" => 25, "active" => true],
    ["name" => "Bob", "age" => 17, "active" => true],
    ["name" => "Charlie", "age" => 30, "active" => false],
    ["name" => "Diana", "age" => 22, "active" => true]
];

$activeAdults = array_filter($users, fn($user) =>
    $user["active"] && $user["age"] >= 18
);
print_r($activeAdults);
/*
Array
(
    [0] => Array([name] => Alice, [age] => 25, [active] => 1)
    [3] => Array([name] => Diana, [age] => 22, [active] => 1)
)
*/
?>
```

## Array Transformation

### array_map

Applies a callback to each element and returns a new array:

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// Square each number
$squared = array_map(fn($n) => $n ** 2, $numbers);
print_r($squared); // [1, 4, 9, 16, 25]

// Multiple arrays
$a = [1, 2, 3];
$b = [10, 20, 30];

$sums = array_map(fn($x, $y) => $x + $y, $a, $b);
print_r($sums); // [11, 22, 33]

// With keys (null callback creates array of arrays)
$keys = ["a", "b", "c"];
$values = [1, 2, 3];
$combined = array_map(null, $keys, $values);
print_r($combined);
/*
Array
(
    [0] => Array([0] => a, [1] => 1)
    [1] => Array([0] => b, [1] => 2)
    [2] => Array([0] => c, [1] => 3)
)
*/

// Transform complex data
$users = [
    ["first" => "John", "last" => "Doe"],
    ["first" => "Jane", "last" => "Smith"]
];

$fullNames = array_map(fn($u) => "{$u['first']} {$u['last']}", $users);
print_r($fullNames); // ["John Doe", "Jane Smith"]
?>
```

### array_reduce

Reduces an array to a single value:

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// Sum
$sum = array_reduce($numbers, fn($carry, $item) => $carry + $item, 0);
echo $sum; // 15

// Product
$product = array_reduce($numbers, fn($carry, $item) => $carry * $item, 1);
echo $product; // 120

// Find max
$max = array_reduce($numbers, fn($carry, $item) => max($carry, $item), PHP_INT_MIN);
echo $max; // 5

// Build string
$letters = ["H", "e", "l", "l", "o"];
$word = array_reduce($letters, fn($carry, $item) => $carry . $item, "");
echo $word; // Hello

// Complex reduction
$orders = [
    ["product" => "Laptop", "price" => 999, "qty" => 1],
    ["product" => "Mouse", "price" => 29, "qty" => 3],
    ["product" => "Keyboard", "price" => 79, "qty" => 2]
];

$total = array_reduce($orders, fn($carry, $order) =>
    $carry + ($order["price"] * $order["qty"]),
    0
);
echo $total; // 1244

// Group by category
$items = [
    ["category" => "fruit", "name" => "apple"],
    ["category" => "vegetable", "name" => "carrot"],
    ["category" => "fruit", "name" => "banana"],
    ["category" => "vegetable", "name" => "broccoli"]
];

$grouped = array_reduce($items, function($carry, $item) {
    $carry[$item["category"]][] = $item["name"];
    return $carry;
}, []);
print_r($grouped);
/*
Array
(
    [fruit] => Array([0] => apple, [1] => banana)
    [vegetable] => Array([0] => carrot, [1] => broccoli)
)
*/
?>
```

### array_column

Extracts a column from multidimensional arrays:

```php
<?php
$users = [
    ["id" => 1, "name" => "Alice", "email" => "alice@example.com"],
    ["id" => 2, "name" => "Bob", "email" => "bob@example.com"],
    ["id" => 3, "name" => "Charlie", "email" => "charlie@example.com"]
];

// Extract single column
$names = array_column($users, "name");
print_r($names); // ["Alice", "Bob", "Charlie"]

// Extract column with specific key
$emailsById = array_column($users, "email", "id");
print_r($emailsById);
/*
Array
(
    [1] => alice@example.com
    [2] => bob@example.com
    [3] => charlie@example.com
)
*/

// Index by column (null for full rows)
$usersById = array_column($users, null, "id");
print_r($usersById);
/*
Array
(
    [1] => Array([id] => 1, [name] => Alice, [email] => alice@example.com)
    [2] => Array([id] => 2, [name] => Bob, [email] => bob@example.com)
    [3] => Array([id] => 3, [name] => Charlie, [email] => charlie@example.com)
)
*/

// Works with objects too
class User {
    public function __construct(
        public int $id,
        public string $name
    ) {}
}

$userObjects = [
    new User(1, "Alice"),
    new User(2, "Bob")
];

$names = array_column($userObjects, "name");
print_r($names); // ["Alice", "Bob"]
?>
```

### Flattening Arrays

```php
<?php
// Simple flatten
$nested = [[1, 2], [3, 4], [5, 6]];
$flat = array_merge(...$nested);
print_r($flat); // [1, 2, 3, 4, 5, 6]

// Recursive flatten function
function array_flatten(array $array): array {
    $result = [];
    array_walk_recursive($array, function($value) use (&$result) {
        $result[] = $value;
    });
    return $result;
}

$deepNested = [1, [2, [3, [4, [5]]]]];
$flat = array_flatten($deepNested);
print_r($flat); // [1, 2, 3, 4, 5]

// Using iterator (more memory efficient)
function flatten_iterator(array $array): Generator {
    foreach ($array as $item) {
        if (is_array($item)) {
            yield from flatten_iterator($item);
        } else {
            yield $item;
        }
    }
}

$flat = iterator_to_array(flatten_iterator($deepNested));
print_r($flat); // [1, 2, 3, 4, 5]
?>
```

## Combining and Splitting Arrays

### Merging Arrays

```php
<?php
$array1 = [1, 2, 3];
$array2 = [4, 5, 6];

// array_merge - reindexes numeric keys
$merged = array_merge($array1, $array2);
print_r($merged); // [1, 2, 3, 4, 5, 6]

// Spread operator (PHP 7.4+)
$merged = [...$array1, ...$array2];
print_r($merged); // [1, 2, 3, 4, 5, 6]

// With associative arrays
$defaults = ["color" => "blue", "size" => "M"];
$custom = ["color" => "red", "weight" => 100];

$merged = array_merge($defaults, $custom);
print_r($merged);
/*
Array
(
    [color] => red
    [size] => M
    [weight] => 100
)
*/

// array_merge_recursive - merges recursively
$arr1 = ["colors" => ["red", "blue"]];
$arr2 = ["colors" => ["green"]];

$merged = array_merge_recursive($arr1, $arr2);
print_r($merged);
/*
Array
(
    [colors] => Array([0] => red, [1] => blue, [2] => green)
)
*/

// Union operator (+) - keeps first value for duplicate keys
$first = ["a" => 1, "b" => 2];
$second = ["b" => 3, "c" => 4];

$union = $first + $second;
print_r($union);
/*
Array
(
    [a] => 1
    [b] => 2
    [c] => 4
)
*/
?>
```

### Splitting Arrays

```php
<?php
$letters = ["a", "b", "c", "d", "e", "f", "g", "h"];

// array_chunk - split into chunks
$chunks = array_chunk($letters, 3);
print_r($chunks);
/*
Array
(
    [0] => Array([0] => a, [1] => b, [2] => c)
    [1] => Array([0] => d, [1] => e, [2] => f)
    [2] => Array([0] => g, [1] => h)
)
*/

// Preserve keys
$data = ["a" => 1, "b" => 2, "c" => 3, "d" => 4];
$chunks = array_chunk($data, 2, true);
print_r($chunks);
/*
Array
(
    [0] => Array([a] => 1, [b] => 2)
    [1] => Array([c] => 3, [d] => 4)
)
*/

// Split string into array
$str = "apple,banana,orange";
$fruits = explode(",", $str);
print_r($fruits); // ["apple", "banana", "orange"]

// Split with limit
$parts = explode(",", $str, 2);
print_r($parts); // ["apple", "banana,orange"]

// Split by multiple delimiters
$text = "one;two,three|four";
$parts = preg_split('/[;,|]/', $text);
print_r($parts); // ["one", "two", "three", "four"]

// Join array into string
$words = ["Hello", "World"];
$sentence = implode(" ", $words);
echo $sentence; // Hello World
?>
```

### Set Operations

```php
<?php
$set1 = [1, 2, 3, 4, 5];
$set2 = [4, 5, 6, 7, 8];

// Difference - elements in first not in second
$diff = array_diff($set1, $set2);
print_r($diff); // [1, 2, 3]

// Intersection - elements in both
$intersect = array_intersect($set1, $set2);
print_r($intersect); // [4, 5]

// Symmetric difference (elements in either but not both)
$symmetric = array_merge(
    array_diff($set1, $set2),
    array_diff($set2, $set1)
);
print_r($symmetric); // [1, 2, 3, 6, 7, 8]

// With keys
$arr1 = ["a" => 1, "b" => 2, "c" => 3];
$arr2 = ["a" => 1, "b" => 3, "d" => 4];

// Diff by keys only
$diffKeys = array_diff_key($arr1, $arr2);
print_r($diffKeys); // ["c" => 3]

// Diff by keys and values
$diffAssoc = array_diff_assoc($arr1, $arr2);
print_r($diffAssoc); // ["b" => 2, "c" => 3]

// Intersect by keys
$intersectKeys = array_intersect_key($arr1, $arr2);
print_r($intersectKeys); // ["a" => 1, "b" => 2]

// Intersect by keys and values
$intersectAssoc = array_intersect_assoc($arr1, $arr2);
print_r($intersectAssoc); // ["a" => 1]
?>
```

## Array Comparison

### Comparing Arrays

```php
<?php
$arr1 = [1, 2, 3];
$arr2 = [1, 2, 3];
$arr3 = [3, 2, 1];
$arr4 = ["1", "2", "3"];

// Equality (==) - same keys and values (type juggling)
var_dump($arr1 == $arr2);  // true
var_dump($arr1 == $arr3);  // false (different order)
var_dump($arr1 == $arr4);  // true (type juggling)

// Identity (===) - same keys, values, order, and types
var_dump($arr1 === $arr2); // true
var_dump($arr1 === $arr4); // false (different types)

// Inequality
var_dump($arr1 != $arr3);  // true
var_dump($arr1 <> $arr3);  // true (same as !=)
var_dump($arr1 !== $arr4); // true

// Compare sorted arrays
sort($arr1);
sort($arr3);
var_dump($arr1 === $arr3); // true (same after sorting)

// Custom comparison function
function arrays_equal(array $a, array $b): bool {
    if (count($a) !== count($b)) {
        return false;
    }
    foreach ($a as $key => $value) {
        if (!array_key_exists($key, $b) || $b[$key] !== $value) {
            return false;
        }
    }
    return true;
}
?>
```

### Comparing Array Contents

```php
<?php
$products1 = [
    ["id" => 1, "name" => "Apple"],
    ["id" => 2, "name" => "Banana"]
];

$products2 = [
    ["id" => 2, "name" => "Banana"],
    ["id" => 1, "name" => "Apple"]
];

// Simple comparison fails due to order
var_dump($products1 == $products2); // false

// Compare by serialization (order-independent)
function arrays_equal_unordered(array $a, array $b): bool {
    $serialize = fn($arr) => array_map('serialize', $arr);
    sort($a);
    sort($b);
    return $serialize($a) === $serialize($b);
}

var_dump(arrays_equal_unordered($products1, $products2)); // true

// Find differences
$added = array_udiff($products2, $products1, fn($a, $b) =>
    ($a["id"] ?? 0) <=> ($b["id"] ?? 0)
);

$removed = array_udiff($products1, $products2, fn($a, $b) =>
    ($a["id"] ?? 0) <=> ($b["id"] ?? 0)
);
?>
```

## Advanced Array Techniques

### Reference Handling

```php
<?php
// Arrays are copied by value
$original = [1, 2, 3];
$copy = $original;
$copy[0] = 100;

print_r($original); // [1, 2, 3] - unchanged
print_r($copy);     // [100, 2, 3]

// Pass by reference
$data = [1, 2, 3];
$reference = &$data;
$reference[0] = 100;

print_r($data); // [100, 2, 3] - changed

// Function with reference parameter
function double_values(array &$arr): void {
    foreach ($arr as &$value) {
        $value *= 2;
    }
    unset($value); // Important!
}

$numbers = [1, 2, 3];
double_values($numbers);
print_r($numbers); // [2, 4, 6]
?>
```

### Array as Object Properties

```php
<?php
// ArrayObject - object that works like array
$arrayObj = new ArrayObject(["a" => 1, "b" => 2]);
$arrayObj["c"] = 3;
$arrayObj->append(4);

foreach ($arrayObj as $key => $value) {
    echo "$key: $value\n";
}

// Convert to regular array
$regularArray = $arrayObj->getArrayCopy();

// Custom array-like class
class Collection implements ArrayAccess, Iterator, Countable {
    private array $items = [];
    private int $position = 0;

    public function offsetExists($offset): bool {
        return isset($this->items[$offset]);
    }

    public function offsetGet($offset): mixed {
        return $this->items[$offset] ?? null;
    }

    public function offsetSet($offset, $value): void {
        if (is_null($offset)) {
            $this->items[] = $value;
        } else {
            $this->items[$offset] = $value;
        }
    }

    public function offsetUnset($offset): void {
        unset($this->items[$offset]);
    }

    public function current(): mixed {
        return $this->items[array_keys($this->items)[$this->position]];
    }

    public function key(): mixed {
        return array_keys($this->items)[$this->position];
    }

    public function next(): void {
        $this->position++;
    }

    public function rewind(): void {
        $this->position = 0;
    }

    public function valid(): bool {
        return $this->position < count($this->items);
    }

    public function count(): int {
        return count($this->items);
    }
}

$collection = new Collection();
$collection["name"] = "John";
$collection[] = "value";
echo count($collection); // 2
?>
```

### Generators for Large Arrays

```php
<?php
// Memory-efficient iteration over large datasets
function large_range(int $start, int $end): Generator {
    for ($i = $start; $i <= $end; $i++) {
        yield $i;
    }
}

// Uses minimal memory regardless of range size
foreach (large_range(1, 1000000) as $number) {
    if ($number > 5) break;
    echo $number . "\n";
}

// Generator for file lines
function read_lines(string $filename): Generator {
    $handle = fopen($filename, "r");
    while (($line = fgets($handle)) !== false) {
        yield trim($line);
    }
    fclose($handle);
}

// Process large file line by line
foreach (read_lines("/path/to/large/file.txt") as $line) {
    // Process each line without loading entire file
}

// Yield with keys
function indexed_range(int $start, int $end): Generator {
    for ($i = $start; $i <= $end; $i++) {
        yield "item_$i" => $i;
    }
}

foreach (indexed_range(1, 3) as $key => $value) {
    echo "$key: $value\n";
}
/*
item_1: 1
item_2: 2
item_3: 3
*/
?>
```

### Recursive Array Operations

```php
<?php
// Deep merge
function array_merge_deep(array ...$arrays): array {
    $result = [];
    foreach ($arrays as $array) {
        foreach ($array as $key => $value) {
            if (is_array($value) && isset($result[$key]) && is_array($result[$key])) {
                $result[$key] = array_merge_deep($result[$key], $value);
            } else {
                $result[$key] = $value;
            }
        }
    }
    return $result;
}

$arr1 = [
    "database" => [
        "host" => "localhost",
        "credentials" => ["user" => "root"]
    ]
];

$arr2 = [
    "database" => [
        "port" => 3306,
        "credentials" => ["password" => "secret"]
    ]
];

$merged = array_merge_deep($arr1, $arr2);
print_r($merged);
/*
Array
(
    [database] => Array
        (
            [host] => localhost
            [credentials] => Array
                (
                    [user] => root
                    [password] => secret
                )
            [port] => 3306
        )
)
*/

// Deep search
function array_search_deep(mixed $needle, array $haystack, string $path = ""): ?string {
    foreach ($haystack as $key => $value) {
        $currentPath = $path ? "$path.$key" : $key;
        if ($value === $needle) {
            return $currentPath;
        }
        if (is_array($value)) {
            $result = array_search_deep($needle, $value, $currentPath);
            if ($result !== null) {
                return $result;
            }
        }
    }
    return null;
}

$data = [
    "users" => [
        "admin" => ["id" => 1, "name" => "Admin"],
        "guest" => ["id" => 2, "name" => "Guest"]
    ]
];

$path = array_search_deep("Guest", $data);
echo $path; // users.guest.name
?>
```

### Array Caching Patterns

```php
<?php
// Memoization
function fibonacci(int $n, array &$cache = []): int {
    if ($n <= 1) return $n;
    if (isset($cache[$n])) return $cache[$n];
    return $cache[$n] = fibonacci($n - 1, $cache) + fibonacci($n - 2, $cache);
}

echo fibonacci(50); // Fast with caching

// Static cache
function expensive_operation(string $key): mixed {
    static $cache = [];

    if (!isset($cache[$key])) {
        // Simulate expensive operation
        $cache[$key] = "result_for_$key";
    }

    return $cache[$key];
}

// LRU-like cache with array
class SimpleCache {
    private array $cache = [];
    private int $maxSize;

    public function __construct(int $maxSize = 100) {
        $this->maxSize = $maxSize;
    }

    public function get(string $key): mixed {
        if (!isset($this->cache[$key])) {
            return null;
        }
        // Move to end (most recently used)
        $value = $this->cache[$key];
        unset($this->cache[$key]);
        $this->cache[$key] = $value;
        return $value;
    }

    public function set(string $key, mixed $value): void {
        if (isset($this->cache[$key])) {
            unset($this->cache[$key]);
        } elseif (count($this->cache) >= $this->maxSize) {
            // Remove oldest (first) item
            array_shift($this->cache);
        }
        $this->cache[$key] = $value;
    }
}
?>
```

## Best Practices

### Use Short Array Syntax

```php
<?php
// Preferred (modern)
$array = ["apple", "banana", "orange"];

// Legacy (still valid but verbose)
$array = array("apple", "banana", "orange");
?>
```

### Type Declarations

```php
<?php
// Specify array types in function signatures
function processItems(array $items): array {
    return array_map(fn($item) => strtoupper($item), $items);
}

// PHP 8+ union types
function getValue(string|int $key, array $data): mixed {
    return $data[$key] ?? null;
}

// Using docblocks for more specific typing
/**
 * @param array<string, int> $scores
 * @return array<string, string>
 */
function formatScores(array $scores): array {
    $result = [];
    foreach ($scores as $name => $score) {
        $result[$name] = "$name: $score points";
    }
    return $result;
}
?>
```

### Immutable Operations

```php
<?php
// Prefer functions that don't modify original array
$original = [3, 1, 4, 1, 5];

// Bad: modifies original
sort($original);

// Better: create sorted copy
$original = [3, 1, 4, 1, 5];
$sorted = $original;
sort($sorted);

// Or use spread operator
$original = [3, 1, 4, 1, 5];
$sorted = [...$original];
sort($sorted);
?>
```

### Null Safety

```php
<?php
// Always check before accessing
$data = ["name" => "John"];

// Good: use null coalescing
$email = $data["email"] ?? "not set";

// Good: check with isset or array_key_exists
if (isset($data["email"])) {
    sendEmail($data["email"]);
}

// PHP 8: null-safe operator for nested access
$users = [
    ["profile" => ["name" => "John"]],
    ["profile" => null]
];

// Won't error on null profile
$name = $users[1]["profile"]["name"] ?? "Unknown";
?>
```

### Clear Variable Names

```php
<?php
// Bad: unclear names
$arr = ["red", "green", "blue"];
$tmp = [];
foreach ($arr as $a) {
    $tmp[] = strtoupper($a);
}

// Good: descriptive names
$colors = ["red", "green", "blue"];
$uppercaseColors = [];
foreach ($colors as $color) {
    $uppercaseColors[] = strtoupper($color);
}

// Better: use array_map
$colors = ["red", "green", "blue"];
$uppercaseColors = array_map("strtoupper", $colors);
?>
```

## Common Pitfalls

### Reference Gotcha in Foreach

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// Problem: reference persists after loop
foreach ($numbers as &$number) {
    $number *= 2;
}
// $number still references $numbers[4]!

foreach ($numbers as $number) {
    // Last iteration overwrites $numbers[4]
}
print_r($numbers); // [2, 4, 6, 8, 8] - Unexpected!

// Solution: always unset reference
$numbers = [1, 2, 3, 4, 5];
foreach ($numbers as &$number) {
    $number *= 2;
}
unset($number); // Important!

foreach ($numbers as $number) {
    // Safe now
}
print_r($numbers); // [2, 4, 6, 8, 10]
?>
```

### Array Key Type Coercion

```php
<?php
// PHP coerces certain values to integers
$array = [];
$array["1"] = "string key";
$array[1] = "int key";

print_r($array);
/*
Array
(
    [1] => int key  // Only one entry! String "1" became int 1
)
*/

// Float keys are truncated
$array[1.9] = "float key";
print_r($array);
/*
Array
(
    [1] => float key  // 1.9 became 1
)
*/

// null becomes empty string key
$array[null] = "null key";
print_r($array);
/*
Array
(
    [1] => float key
    [] => null key
)
*/
?>
```

### Empty Array Checks

```php
<?php
// These behave differently
$array = [];
$array2 = [0];
$array3 = [false];
$array4 = [null];

// empty() checks if truthy
var_dump(empty($array));  // true
var_dump(empty($array2)); // false (has element)
var_dump(empty($array3)); // false (has element)

// Count is more reliable
var_dump(count($array) === 0);  // true
var_dump(count($array2) === 0); // false

// Best: compare to empty array
var_dump($array === []); // true
?>
```

### In-Place Sort vs Return Value

```php
<?php
$numbers = [3, 1, 4, 1, 5];

// WRONG: sort() returns bool, not array
$sorted = sort($numbers); // $sorted is true, not the sorted array

// CORRECT: sort modifies in place
$numbers = [3, 1, 4, 1, 5];
sort($numbers);
print_r($numbers); // [1, 1, 3, 4, 5]

// If you need to preserve original
$original = [3, 1, 4, 1, 5];
$sorted = $original; // Copy first
sort($sorted);
?>
```

### Array Plus Operator Surprise

```php
<?php
$arr1 = [0 => "a", 1 => "b"];
$arr2 = [0 => "c", 1 => "d", 2 => "e"];

// Plus operator keeps FIRST value for duplicate keys
$result = $arr1 + $arr2;
print_r($result);
/*
Array
(
    [0] => a  // From $arr1, not "c"
    [1] => b  // From $arr1, not "d"
    [2] => e  // From $arr2 (new key)
)
*/

// array_merge reindexes and overwrites
$result = array_merge($arr1, $arr2);
print_r($result);
/*
Array
(
    [0] => a
    [1] => b
    [2] => c
    [3] => d
    [4] => e
)
*/
?>
```

## Conclusion

PHP arrays are incredibly versatile and form the backbone of data manipulation in PHP applications. From simple lists to complex nested structures, understanding arrays is essential for effective PHP development.

### Key Takeaways

- PHP arrays are ordered maps that can use both integer and string keys
- Use the modern square bracket `[]` syntax for creating arrays
- Always unset references after foreach loops to avoid unexpected behavior
- Leverage built-in array functions like `array_map`, `array_filter`, and `array_reduce`
- Be aware of type coercion with array keys
- Use generators for memory-efficient handling of large datasets
- Prefer immutable operations that don't modify original arrays

### Next Steps

After mastering PHP arrays, consider exploring:
- PHP Collections libraries (like Laravel Collections or Doctrine Collections)
- SPL data structures (SplFixedArray, SplDoublyLinkedList, SplHeap)
- JSON encoding and decoding with arrays
- Database result handling as arrays
- Working with arrays in PHP frameworks

Practice these concepts with real projects to solidify your understanding of PHP arrays!
