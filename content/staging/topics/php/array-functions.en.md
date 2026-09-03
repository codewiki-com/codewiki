---
title: PHP 数组函数深度解析
description: 深入理解 PHP 核心数组函数 array_map、array_filter、array_reduce、array_merge、array_keys 和 usort 的原理与实践
track: php
section: basics
difficulty: intermediate
tags:
  - PHP
  - 数组
  - 函数式编程
  - 数据处理
  - 面试
status: imported
origin: old/src/content/docs/php/array-functions.en.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 数组操作
  order: 9
  lastUpdated: 2026-01-07
---

PHP provides a rich set of array functions that make array manipulation concise and efficient. This article analyzes six of the most core and commonly used array functions: `array_map`, `array_filter`, `array_reduce`, `array_merge`, `array_keys`, and `usort`. Mastering these functions improves code quality and covers frequently asked topics in PHP interviews.

## Concept Explanation

### What Are Array Functions

Array functions are built-in PHP functions designed for array manipulation. They provide standardized methods for traversing, filtering, transforming, merging, and sorting arrays. Compared to manually writing loop code, using array functions offers several advantages:

- **Concise code**: Complete complex operations in a single line
- **Better readability**: Function names directly express intent
- **Performance optimization**: Implemented in C at the underlying level for high execution efficiency
- **Reduced errors**: Avoid boundary condition issues when writing loops manually

### Functional Programming Concepts

The three functions `array_map`, `array_filter`, and `array_reduce` introduced in this article embody core concepts of functional programming:

```php
<?php
// Imperative programming: tells the program "how to do it"
$result = [];
foreach ($numbers as $n) {
    if ($n > 0) {
        $result[] = $n * 2;
    }
}

// Functional programming: tells the program "what to do"
$result = array_map(
    fn($n) => $n * 2,
    array_filter($numbers, fn($n) => $n > 0)
);
```

Functional style code is more declarative, focusing on data transformation rather than process control.

### Overview of the Six Core Functions

| Function | Purpose | Return Value | Typical Use Case |
|----------|---------|--------------|------------------|
| `array_map` | Apply callback function to each element | New array | Data transformation, formatting |
| `array_filter` | Filter elements matching conditions | New array | Data filtering, cleaning |
| `array_reduce` | Reduce array to a single value | Any type | Summation, statistics, aggregation |
| `array_merge` | Merge multiple arrays | New array | Array concatenation, config merging |
| `array_keys` | Get all keys of an array | Indexed array | Key extraction, key existence check |
| `usort` | Sort using custom rules | Boolean | Complex sorting, multi-field sorting |

## Core Principles

### How array_map Works

`array_map` applies a callback function to each element in an array and returns a new array containing the processed results.

**Function signature:**

```php
array_map(?callable $callback, array $array, array ...$arrays): array
```

**Execution flow:**

```
Input array: [a, b, c, d]
              ↓  ↓  ↓  ↓
Callback:     f  f  f  f
              ↓  ↓  ↓  ↓
Output array: [f(a), f(b), f(c), f(d)]
```

**Internal implementation principle:**

```php
<?php
// Simplified implementation logic of array_map
function my_array_map(callable $callback, array $array): array
{
    $result = [];
    foreach ($array as $key => $value) {
        $result[$key] = $callback($value);
    }
    return $result;
}
```

Key characteristics:
- **Preserves keys**: Output array keys are the same as input array
- **Does not modify original array**: Returns a new array, original remains unchanged
- **Supports multiple arrays**: Can process multiple arrays simultaneously

### How array_filter Works

`array_filter` uses a callback function to filter array elements, keeping only elements for which the callback returns `true`.

**Function signature:**

```php
array_filter(array $array, ?callable $callback = null, int $mode = 0): array
```

**Execution flow:**

```
Input array: [1, 2, 3, 4, 5]
Condition function: n > 2
           ↓
Filtering process: 1→false, 2→false, 3→true, 4→true, 5→true
           ↓
Output array: [3, 4, 5] (preserving original indices)
```

**Filter modes:**

```php
<?php
$arr = ['a' => 1, 'b' => 2, 'c' => 3];

// Default mode: only passes value to callback
array_filter($arr, fn($v) => $v > 1);

// ARRAY_FILTER_USE_KEY: only passes key to callback
array_filter($arr, fn($k) => $k !== 'b', ARRAY_FILTER_USE_KEY);

// ARRAY_FILTER_USE_BOTH: passes both value and key
array_filter($arr, fn($v, $k) => $k !== 'a' && $v > 1, ARRAY_FILTER_USE_BOTH);
```

### How array_reduce Works

`array_reduce` iteratively reduces an array to a single value through a callback function.

**Function signature:**

```php
array_reduce(array $array, callable $callback, mixed $initial = null): mixed
```

**Execution flow (using sum as example):**

```
Initial value: 0
Array: [1, 2, 3, 4]

1st iteration: callback(0, 1) = 1
2nd iteration: callback(1, 2) = 3
3rd iteration: callback(3, 3) = 6
4th iteration: callback(6, 4) = 10

Final result: 10
```

**Callback function parameters:**

```php
<?php
// $carry: return value from previous iteration (initial value for first iteration)
// $item: current element
array_reduce($array, function($carry, $item) {
    return $carry + $item;
}, 0);
```

### How array_merge Works

`array_merge` merges multiple arrays into one array.

**Function signature:**

```php
array_merge(array ...$arrays): array
```

**Merge rules:**

1. **Numeric keys**: Re-indexed, numbered consecutively starting from 0
2. **String keys**: Later values overwrite earlier values

```php
<?php
$a = [0 => 'a', 1 => 'b'];
$b = [0 => 'c', 1 => 'd'];
$c = ['x' => 1, 'y' => 2];
$d = ['x' => 3, 'z' => 4];

// Numeric keys re-indexed
array_merge($a, $b);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// String keys overwrite
array_merge($c, $d);  // ['x' => 3, 'y' => 2, 'z' => 4]
```

### How array_keys Works

`array_keys` returns all keys in an array, optionally filtering keys corresponding to a specific value.

**Function signature:**

```php
array_keys(array $array, mixed $filter_value = null, bool $strict = false): array
```

**Working modes:**

```php
<?php
$arr = ['a' => 1, 'b' => 2, 'c' => 1, 'd' => '1'];

// Get all keys
array_keys($arr);  // ['a', 'b', 'c', 'd']

// Get keys with value 1 (loose comparison)
array_keys($arr, 1);  // ['a', 'c', 'd']

// Get keys with value 1 (strict comparison)
array_keys($arr, 1, true);  // ['a', 'c']
```

### How usort Works

`usort` sorts an array using a user-defined comparison function.

**Function signature:**

```php
usort(array &$array, callable $callback): true
```

**Comparison function rules:**

```php
<?php
// Comparison function return value rules:
// Negative: $a sorts before $b
// Zero: $a and $b are equal
// Positive: $a sorts after $b

usort($array, function($a, $b) {
    if ($a < $b) return -1;
    if ($a > $b) return 1;
    return 0;
});

// PHP 7+ can use spaceship operator for simplification
usort($array, fn($a, $b) => $a <=> $b);
```

**Sorting algorithm:**

PHP's usort uses a variant of the quicksort algorithm with an average time complexity of O(n log n).

## Key Points

### array_map Key Points

1. **Special behavior when callback is null**

```php
<?php
$a = [1, 2, 3];
$b = ['a', 'b', 'c'];
$c = ['x', 'y', 'z'];

// "Zips" multiple arrays into an array of arrays
$result = array_map(null, $a, $b, $c);
// [[1, 'a', 'x'], [2, 'b', 'y'], [3, 'c', 'z']]
```

2. **Alignment rules when processing multiple arrays**

```php
<?php
$a = [1, 2, 3, 4];
$b = ['a', 'b'];

// Shorter arrays are padded with null
$result = array_map(null, $a, $b);
// [[1, 'a'], [2, 'b'], [3, null], [4, null]]
```

3. **Key preservation**

```php
<?php
$arr = ['foo' => 1, 'bar' => 2];
$result = array_map(fn($n) => $n * 2, $arr);
// ['foo' => 2, 'bar' => 4]  keys are preserved
```

### array_filter Key Points

1. **Filters falsy values when no callback is provided**

```php
<?php
$arr = [0, '', null, false, 'hello', 1, [], [0]];
$result = array_filter($arr);
// ['hello', 1, [0]]  only keeps "truthy" values
```

2. **Preserves original indices**

```php
<?php
$arr = [1, 2, 3, 4, 5];
$result = array_filter($arr, fn($n) => $n > 2);
// [2 => 3, 3 => 4, 4 => 5]  indices are not reset

// When you need to reset indices
$result = array_values(array_filter($arr, fn($n) => $n > 2));
// [0 => 3, 1 => 4, 2 => 5]
```

3. **Boolean conversion of callback return values**

```php
<?php
// Callback returning any "truthy" value will keep the element
$arr = ['a', 'bb', 'ccc'];
$result = array_filter($arr, fn($s) => strlen($s));  // returns length
// ['a', 'bb', 'ccc']  all kept (all lengths > 0)
```

### array_reduce Key Points

1. **Importance of initial value**

```php
<?php
$arr = [1, 2, 3];

// Without initial value, first element becomes initial value
array_reduce($arr, fn($c, $i) => $c + $i);  // 6

// Empty array without initial value returns null
array_reduce([], fn($c, $i) => $c + $i);  // null

// Specifying initial value is safer
array_reduce([], fn($c, $i) => $c + $i, 0);  // 0
```

2. **Flexible return type**

```php
<?php
// Can return any type
$users = [
    ['id' => 1, 'name' => 'Zhang San'],
    ['id' => 2, 'name' => 'Li Si'],
];

// Return associative array
$byId = array_reduce($users, function($carry, $user) {
    $carry[$user['id']] = $user;
    return $carry;
}, []);
```

3. **Alternative to chained operations**

```php
<?php
// Using reduce to implement map + filter
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * 2;
    }
    return $carry;
}, []);
```

### array_merge Key Points

1. **Difference from `+` operator**

```php
<?php
$a = ['a' => 1, 'b' => 2];
$b = ['b' => 3, 'c' => 4];

// array_merge: later overwrites earlier
array_merge($a, $b);  // ['a' => 1, 'b' => 3, 'c' => 4]

// + operator: earlier takes priority, later is ignored
$a + $b;  // ['a' => 1, 'b' => 2, 'c' => 4]
```

2. **Special handling of numeric keys**

```php
<?php
$a = [10 => 'a', 20 => 'b'];
$b = [10 => 'c', 30 => 'd'];

// array_merge re-indexes numeric keys
array_merge($a, $b);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// + operator preserves numeric keys
$a + $b;  // [10 => 'a', 20 => 'b', 30 => 'd']
```

3. **Recursive merge**

```php
<?php
// array_merge does not recursively merge nested arrays
$a = ['user' => ['name' => 'Zhang San', 'age' => 25]];
$b = ['user' => ['email' => 'zhang@example.com']];

array_merge($a, $b);
// ['user' => ['email' => 'zhang@example.com']]  entire value is overwritten

// Use array_merge_recursive for recursive merge
array_merge_recursive($a, $b);
// ['user' => ['name' => 'Zhang San', 'age' => 25, 'email' => 'zhang@example.com']]
```

### array_keys Key Points

1. **Strict comparison mode**

```php
<?php
$arr = ['a' => 1, 'b' => '1', 'c' => true];

// Loose comparison
array_keys($arr, 1);  // ['a', 'b', 'c']  (1 == '1' == true)

// Strict comparison
array_keys($arr, 1, true);  // ['a']  (only integer 1)
```

2. **Checking if key exists**

```php
<?php
$arr = ['name' => 'Zhang San', 'age' => null];

// Using in_array + array_keys to check key
in_array('age', array_keys($arr));  // true

// More efficient approach
array_key_exists('age', $arr);  // true
isset($arr['age']);  // false (value is null)
```

### usort Key Points

1. **Sorts in place, modifies original array**

```php
<?php
$arr = [3, 1, 4, 1, 5];
usort($arr, fn($a, $b) => $a <=> $b);
// $arr is modified to [1, 1, 3, 4, 5]
// Note: indices are reset
```

2. **Stability issues**

```php
<?php
// PHP's usort does not guarantee stability
// Relative order of equal elements may change
$arr = [
    ['name' => 'Alice', 'score' => 90],
    ['name' => 'Bob', 'score' => 90],
];

usort($arr, fn($a, $b) => $b['score'] <=> $a['score']);
// Order of Alice and Bob may swap
```

3. **Related sorting functions**

```php
<?php
// usort: sort by value, reset indices
// uasort: sort by value, maintain key-value association
// uksort: sort by key

$arr = ['b' => 2, 'a' => 1, 'c' => 3];

uasort($arr, fn($a, $b) => $a <=> $b);
// ['a' => 1, 'b' => 2, 'c' => 3]  keys preserved

uksort($arr, fn($a, $b) => $a <=> $b);
// ['a' => 1, 'b' => 2, 'c' => 3]  sorted by key
```

## Code Examples

### array_map Practical Examples

```php
<?php
// Example 1: Data formatting
$prices = [19.99, 29.50, 99.00, 149.95];

$formatted = array_map(
    fn($price) => sprintf('$%.2f', $price),
    $prices
);
// ['$19.99', '$29.50', '$99.00', '$149.95']


// Example 2: Extracting object properties
$users = [
    ['id' => 1, 'name' => 'Zhang San', 'email' => 'zhang@example.com'],
    ['id' => 2, 'name' => 'Li Si', 'email' => 'li@example.com'],
    ['id' => 3, 'name' => 'Wang Wu', 'email' => 'wang@example.com'],
];

$names = array_map(fn($user) => $user['name'], $users);
// ['Zhang San', 'Li Si', 'Wang Wu']

// Equivalent to array_column
$names = array_column($users, 'name');


// Example 3: Batch data cleaning
$inputs = ['  Hello  ', ' WORLD ', '  PHP  '];

$cleaned = array_map(
    fn($s) => strtolower(trim($s)),
    $inputs
);
// ['hello', 'world', 'php']


// Example 4: Parallel processing of multiple arrays
$firstNames = ['John', 'Jane', 'Bob'];
$lastNames = ['Doe', 'Smith', 'Johnson'];

$fullNames = array_map(
    fn($first, $last) => $first . ' ' . $last,
    $firstNames,
    $lastNames
);
// ['John Doe', 'Jane Smith', 'Bob Johnson']


// Example 5: Type conversion
$strings = ['1', '2', '3', '4', '5'];
$integers = array_map('intval', $strings);
// [1, 2, 3, 4, 5]

// Using built-in functions
$arr = ['hello', 'world', 'php'];
$upper = array_map('strtoupper', $arr);
// ['HELLO', 'WORLD', 'PHP']
```

### array_filter Practical Examples

```php
<?php
// Example 1: Filtering invalid data
$data = ['', 'hello', null, 'world', 0, false, 'php', []];

// Remove all falsy values
$valid = array_filter($data);
// ['hello', 'world', 'php']

// Keep only non-empty strings
$strings = array_filter($data, fn($item) => is_string($item) && $item !== '');
// ['hello', 'world', 'php']


// Example 2: Filtering records matching conditions
$products = [
    ['name' => 'Phone', 'price' => 3999, 'stock' => 100],
    ['name' => 'Computer', 'price' => 6999, 'stock' => 0],
    ['name' => 'Headphones', 'price' => 299, 'stock' => 50],
    ['name' => 'Tablet', 'price' => 4999, 'stock' => 30],
];

// Products in stock and priced under 5000
$available = array_filter(
    $products,
    fn($p) => $p['stock'] > 0 && $p['price'] < 5000
);
// [0 => Phone, 2 => Headphones]


// Example 3: Filtering by key
$config = [
    'db_host' => 'localhost',
    'db_user' => 'root',
    'db_pass' => 'secret',
    'app_name' => 'MyApp',
    'app_debug' => true,
];

// Keep only configs starting with db_
$dbConfig = array_filter(
    $config,
    fn($key) => str_starts_with($key, 'db_'),
    ARRAY_FILTER_USE_KEY
);
// ['db_host' => 'localhost', 'db_user' => 'root', 'db_pass' => 'secret']


// Example 4: Using both key and value for filtering
$scores = [
    'Zhang San' => 85,
    'Li Si' => 92,
    'Wang Wu' => 58,
    'Zhao Liu' => 76,
];

// Find students with surnames "Zhang" or "Li" who passed
$passed = array_filter(
    $scores,
    fn($score, $name) => $score >= 60 && preg_match('/^(Zhang|Li)/', $name),
    ARRAY_FILTER_USE_BOTH
);
// ['Zhang San' => 85, 'Li Si' => 92]


// Example 5: Chained filtering and transformation
$numbers = range(-5, 5);

// Filter positive numbers, then square them
$result = array_map(
    fn($n) => $n * $n,
    array_filter($numbers, fn($n) => $n > 0)
);
// [1, 4, 9, 16, 25] (note: indices not reset)

// Reset indices
$result = array_values(array_map(
    fn($n) => $n * $n,
    array_filter($numbers, fn($n) => $n > 0)
));
// [0 => 1, 1 => 4, 2 => 9, 3 => 16, 4 => 25]
```

### array_reduce Practical Examples

```php
<?php
// Example 1: Sum and statistics
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Sum
$sum = array_reduce($numbers, fn($carry, $n) => $carry + $n, 0);
// 55

// Product
$product = array_reduce($numbers, fn($carry, $n) => $carry * $n, 1);
// 3628800

// Find maximum
$max = array_reduce($numbers, fn($carry, $n) => max($carry, $n), PHP_INT_MIN);
// 10


// Example 2: Converting array to associative array
$users = [
    ['id' => 1, 'name' => 'Zhang San', 'dept' => 'Tech'],
    ['id' => 2, 'name' => 'Li Si', 'dept' => 'Marketing'],
    ['id' => 3, 'name' => 'Wang Wu', 'dept' => 'Tech'],
];

// Build index with id as key
$usersById = array_reduce($users, function($carry, $user) {
    $carry[$user['id']] = $user;
    return $carry;
}, []);


// Example 3: Grouping statistics
// Group by department
$byDept = array_reduce($users, function($carry, $user) {
    $carry[$user['dept']][] = $user;
    return $carry;
}, []);
// ['Tech' => [...], 'Marketing' => [...]]


// Example 4: Counting occurrences
$words = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];

$counts = array_reduce($words, function($carry, $word) {
    $carry[$word] = ($carry[$word] ?? 0) + 1;
    return $carry;
}, []);
// ['apple' => 3, 'banana' => 2, 'orange' => 1]

// Equivalent to array_count_values
$counts = array_count_values($words);


// Example 5: Flattening nested arrays
$nested = [[1, 2], [3, 4], [5, 6]];

$flat = array_reduce($nested, function($carry, $item) {
    return array_merge($carry, $item);
}, []);
// [1, 2, 3, 4, 5, 6]

// More concise approach
$flat = array_merge(...$nested);


// Example 6: Building complex data structures
$items = [
    ['category' => 'Fruit', 'name' => 'Apple', 'price' => 5],
    ['category' => 'Fruit', 'name' => 'Banana', 'price' => 3],
    ['category' => 'Vegetable', 'name' => 'Cabbage', 'price' => 2],
    ['category' => 'Vegetable', 'name' => 'Carrot', 'price' => 4],
];

// Summarize total price by category
$summary = array_reduce($items, function($carry, $item) {
    $cat = $item['category'];
    if (!isset($carry[$cat])) {
        $carry[$cat] = ['count' => 0, 'total' => 0];
    }
    $carry[$cat]['count']++;
    $carry[$cat]['total'] += $item['price'];
    return $carry;
}, []);
// ['Fruit' => ['count' => 2, 'total' => 8], 'Vegetable' => ['count' => 2, 'total' => 6]]


// Example 7: Implementing combined map and filter
$numbers = [1, -2, 3, -4, 5, -6];

// Keep positive numbers and square them
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * $n;
    }
    return $carry;
}, []);
// [1, 9, 25]
```

### array_merge Practical Examples

```php
<?php
// Example 1: Merging configurations
$defaultConfig = [
    'debug' => false,
    'cache' => true,
    'timeout' => 30,
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
    ],
];

$userConfig = [
    'debug' => true,
    'timeout' => 60,
];

$config = array_merge($defaultConfig, $userConfig);
// ['debug' => true, 'cache' => true, 'timeout' => 60, 'db' => [...]]


// Example 2: Collecting data from multiple sources
$localUsers = [
    ['id' => 1, 'name' => 'Zhang San'],
    ['id' => 2, 'name' => 'Li Si'],
];

$remoteUsers = [
    ['id' => 3, 'name' => 'Wang Wu'],
    ['id' => 4, 'name' => 'Zhao Liu'],
];

$allUsers = array_merge($localUsers, $remoteUsers);
// Contains all users, indices renumbered


// Example 3: Expanding nested arrays
$groups = [
    ['admin', 'moderator'],
    ['editor', 'author'],
    ['subscriber'],
];

$allRoles = array_merge(...$groups);
// ['admin', 'moderator', 'editor', 'author', 'subscriber']


// Example 4: Conditional merging
$basePermissions = ['read', 'write'];
$isAdmin = true;

$permissions = array_merge(
    $basePermissions,
    $isAdmin ? ['delete', 'admin'] : []
);
// ['read', 'write', 'delete', 'admin']


// Example 5: Deduplicating with array_unique
$arr1 = [1, 2, 3, 4];
$arr2 = [3, 4, 5, 6];

$unique = array_unique(array_merge($arr1, $arr2));
// [1, 2, 3, 4, 5, 6]


// Example 6: Deep merge (requires custom implementation)
function array_merge_deep(array $base, array $override): array
{
    foreach ($override as $key => $value) {
        if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
            $base[$key] = array_merge_deep($base[$key], $value);
        } else {
            $base[$key] = $value;
        }
    }
    return $base;
}

$default = ['db' => ['host' => 'localhost', 'port' => 3306]];
$custom = ['db' => ['host' => '192.168.1.100']];

$result = array_merge_deep($default, $custom);
// ['db' => ['host' => '192.168.1.100', 'port' => 3306]]
```

### array_keys Practical Examples

```php
<?php
// Example 1: Getting all key names
$person = [
    'name' => 'Zhang San',
    'age' => 28,
    'city' => 'Beijing',
    'job' => 'Programmer',
];

$keys = array_keys($person);
// ['name', 'age', 'city', 'job']


// Example 2: Finding keys for specific values
$scores = [
    'Zhang San' => 85,
    'Li Si' => 92,
    'Wang Wu' => 85,
    'Zhao Liu' => 78,
];

// Find all students with score 85
$students = array_keys($scores, 85);
// ['Zhang San', 'Wang Wu']


// Example 3: Validating data structure
$required = ['name', 'email', 'password'];
$input = ['name' => 'test', 'email' => 'test@example.com'];

$missing = array_diff($required, array_keys($input));
// ['password']

if (!empty($missing)) {
    throw new Exception('Missing required fields: ' . implode(', ', $missing));
}


// Example 4: Using with array_combine
$keys = ['id', 'name', 'email'];
$values = [1, 'Zhang San', 'zhang@example.com'];

$user = array_combine($keys, $values);
// ['id' => 1, 'name' => 'Zhang San', 'email' => 'zhang@example.com']


// Example 5: Flipping key-value pairs
$arr = ['a' => 1, 'b' => 2, 'c' => 3];

// Using array_keys and array_values
$flipped = array_combine(
    array_values($arr),
    array_keys($arr)
);
// [1 => 'a', 2 => 'b', 3 => 'c']

// Equivalent to array_flip
$flipped = array_flip($arr);


// Example 6: Random key selection
$options = [
    'A' => 'Option A',
    'B' => 'Option B',
    'C' => 'Option C',
    'D' => 'Option D',
];

$keys = array_keys($options);
$randomKey = $keys[array_rand($keys)];
$randomValue = $options[$randomKey];
```

### usort Practical Examples

```php
<?php
// Example 1: Basic numeric sorting
$numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// Ascending
usort($numbers, fn($a, $b) => $a <=> $b);
// [1, 1, 2, 3, 4, 5, 6, 9]

// Descending
usort($numbers, fn($a, $b) => $b <=> $a);
// [9, 6, 5, 4, 3, 2, 1, 1]


// Example 2: Sorting by object property
$products = [
    ['name' => 'Phone', 'price' => 3999, 'sales' => 1000],
    ['name' => 'Computer', 'price' => 6999, 'sales' => 500],
    ['name' => 'Headphones', 'price' => 299, 'sales' => 3000],
    ['name' => 'Tablet', 'price' => 4999, 'sales' => 800],
];

// Sort by price ascending
usort($products, fn($a, $b) => $a['price'] <=> $b['price']);

// Sort by sales descending
usort($products, fn($a, $b) => $b['sales'] <=> $a['sales']);


// Example 3: Multi-field sorting
$students = [
    ['name' => 'Zhang San', 'grade' => 3, 'score' => 85],
    ['name' => 'Li Si', 'grade' => 2, 'score' => 92],
    ['name' => 'Wang Wu', 'grade' => 3, 'score' => 92],
    ['name' => 'Zhao Liu', 'grade' => 2, 'score' => 85],
];

// Sort by grade ascending, then by score descending
usort($students, function($a, $b) {
    // Compare grade first
    $gradeCompare = $a['grade'] <=> $b['grade'];
    if ($gradeCompare !== 0) {
        return $gradeCompare;
    }
    // When grade is equal, sort by score descending
    return $b['score'] <=> $a['score'];
});


// Example 4: Natural sorting
$files = ['img12.png', 'img2.png', 'img1.png', 'img10.png'];

// String sorting
usort($files, fn($a, $b) => $a <=> $b);
// ['img1.png', 'img10.png', 'img12.png', 'img2.png']

// Natural sorting
usort($files, fn($a, $b) => strnatcmp($a, $b));
// ['img1.png', 'img2.png', 'img10.png', 'img12.png']


// Example 5: Sorting by string length
$words = ['apple', 'pie', 'strawberry', 'fig'];

usort($words, fn($a, $b) => strlen($a) <=> strlen($b));
// ['fig', 'pie', 'apple', 'strawberry']


// Example 6: Sorting by date
$events = [
    ['title' => 'Meeting A', 'date' => '2024-03-15'],
    ['title' => 'Meeting B', 'date' => '2024-01-20'],
    ['title' => 'Meeting C', 'date' => '2024-02-10'],
];

usort($events, fn($a, $b) => strtotime($a['date']) <=> strtotime($b['date']));
// Sorted by date ascending


// Example 7: Maintaining key-value association (using uasort)
$scores = [
    'Zhang San' => 85,
    'Li Si' => 92,
    'Wang Wu' => 78,
];

uasort($scores, fn($a, $b) => $b <=> $a);
// ['Li Si' => 92, 'Zhang San' => 85, 'Wang Wu' => 78]  key-value association preserved


// Example 8: Complex sorting logic
$tasks = [
    ['title' => 'Task A', 'priority' => 'high', 'due' => '2024-01-15'],
    ['title' => 'Task B', 'priority' => 'low', 'due' => '2024-01-10'],
    ['title' => 'Task C', 'priority' => 'medium', 'due' => '2024-01-15'],
    ['title' => 'Task D', 'priority' => 'high', 'due' => '2024-01-10'],
];

$priorityOrder = ['high' => 1, 'medium' => 2, 'low' => 3];

usort($tasks, function($a, $b) use ($priorityOrder) {
    // Sort by priority first
    $priorityCompare = $priorityOrder[$a['priority']] <=> $priorityOrder[$b['priority']];
    if ($priorityCompare !== 0) {
        return $priorityCompare;
    }
    // When priority is equal, sort by due date
    return strtotime($a['due']) <=> strtotime($b['due']);
});
// High priority with earlier due date comes first
```

## Best Practices

### Prefer Built-in Functions

```php
<?php
// Not recommended: manual loop
$result = [];
foreach ($arr as $item) {
    $result[] = strtoupper($item);
}

// Recommended: use array_map
$result = array_map('strtoupper', $arr);
```

### Use Arrow Functions Appropriately

```php
<?php
// PHP 7.4+ arrow functions are more concise
$squared = array_map(fn($n) => $n * $n, $numbers);

// But use traditional closures for complex logic
$filtered = array_filter($users, function($user) {
    if ($user['status'] !== 'active') {
        return false;
    }
    if ($user['age'] < 18) {
        return false;
    }
    return true;
});
```

### Watch Out for Indices When Chaining Operations

```php
<?php
// After filtering, indices are not consecutive
$result = array_filter([1, 2, 3, 4, 5], fn($n) => $n > 2);
// [2 => 3, 3 => 4, 4 => 5]

// Use array_values when consecutive indices are needed
$result = array_values(array_filter([1, 2, 3, 4, 5], fn($n) => $n > 2));
// [0 => 3, 1 => 4, 2 => 5]
```

### Always Provide Initial Value for reduce

```php
<?php
// Not recommended: may return null for empty arrays
$sum = array_reduce($numbers, fn($c, $n) => $c + $n);

// Recommended: provide initial value
$sum = array_reduce($numbers, fn($c, $n) => $c + $n, 0);
```

### Consider Performance for Large Datasets

```php
<?php
// For large arrays, consider using generators or batch processing
function processInBatches(array $items, int $batchSize, callable $processor): void
{
    $batches = array_chunk($items, $batchSize);
    foreach ($batches as $batch) {
        $processor($batch);
    }
}
```

### Sort Stability with usort

```php
<?php
// PHP 8.0+ usort is stable
// PHP 7.x requires manual stability guarantee
function stableUsort(array &$array, callable $compare): void
{
    $index = 0;
    foreach ($array as &$item) {
        $item = [$index++, $item];
    }
    unset($item);

    usort($array, function($a, $b) use ($compare) {
        $result = $compare($a[1], $b[1]);
        return $result === 0 ? $a[0] <=> $b[0] : $result;
    });

    foreach ($array as &$item) {
        $item = $item[1];
    }
    unset($item);
}
```

## Common Pitfalls

### array_map Callback Parameter Count

```php
<?php
// Error: callback expects 2 parameters, but only 1 array provided
$result = array_map(fn($a, $b) => $a + $b, [1, 2, 3]);  // Warning

// Correct: provide two arrays
$result = array_map(fn($a, $b) => $a + $b, [1, 2, 3], [10, 20, 30]);
```

### array_filter Preserves Indices

```php
<?php
$arr = [1, 2, 3, 4, 5];
$filtered = array_filter($arr, fn($n) => $n > 2);

// Wrong expectation: [3, 4, 5]
// Actual result: [2 => 3, 3 => 4, 4 => 5]

// JSON encoding becomes an object
json_encode($filtered);  // {"2":3,"3":4,"4":5}

// Solution
$filtered = array_values(array_filter($arr, fn($n) => $n > 2));
json_encode($filtered);  // [3,4,5]
```

### array_merge Re-indexes Numeric Keys

```php
<?php
$arr1 = [10 => 'a', 20 => 'b'];
$arr2 = [10 => 'c', 30 => 'd'];

// Wrong expectation: preserve original keys
$merged = array_merge($arr1, $arr2);
// Actual result: [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// Use + operator to preserve keys
$merged = $arr1 + $arr2;
// [10 => 'a', 20 => 'b', 30 => 'd']  Note: same key takes first value
```

### usort Modifies Original Array

```php
<?php
$original = [3, 1, 4, 1, 5];
$sorted = $original;  // Shallow copy

usort($sorted, fn($a, $b) => $a <=> $b);

// $original is still [3, 1, 4, 1, 5]
// $sorted becomes [1, 1, 3, 4, 5]

// Note: for arrays containing objects, shallow copy is not enough
$users = [/* contains objects */];
$sortedUsers = $users;  // Objects are references
```

### array_reduce Initial Value Type

```php
<?php
// Initial value type determines result type
$numbers = [1, 2, 3];

// Expecting string return
$result = array_reduce($numbers, fn($c, $n) => $c . $n, '');
// Result: "123"

// Expecting array return
$result = array_reduce($numbers, function($c, $n) {
    $c[] = $n * 2;
    return $c;
}, []);
// Result: [2, 4, 6]
```

### Empty Array Handling

```php
<?php
$empty = [];

// array_reduce with empty array returns initial value
array_reduce($empty, fn($c, $n) => $c + $n, 0);  // 0
array_reduce($empty, fn($c, $n) => $c + $n);     // null

// array_merge with empty array works normally
array_merge($empty, [1, 2, 3]);  // [1, 2, 3]
array_merge();  // []

// array_filter with empty array returns empty array
array_filter($empty, fn($n) => true);  // []

// usort with empty array works (but pointless)
usort($empty, fn($a, $b) => $a <=> $b);  // true
```

## Performance Considerations

### Time Complexity Analysis

| Function | Time Complexity | Notes |
|----------|-----------------|-------|
| `array_map` | O(n) | Linear traversal, n is element count |
| `array_filter` | O(n) | Linear traversal |
| `array_reduce` | O(n) | Linear traversal |
| `array_merge` | O(n+m) | n and m are lengths of both arrays |
| `array_keys` | O(n) | Linear traversal |
| `usort` | O(n log n) | Quicksort, worst case O(n^2) |

### Performance Comparison Tests

```php
<?php
$size = 100000;
$arr = range(1, $size);

// Test 1: array_map vs foreach
$start = microtime(true);
$result = array_map(fn($n) => $n * 2, $arr);
$mapTime = microtime(true) - $start;

$start = microtime(true);
$result = [];
foreach ($arr as $n) {
    $result[] = $n * 2;
}
$forTime = microtime(true) - $start;

// Usually array_map is slightly slower than foreach, but the difference is minimal


// Test 2: Finding elements
$needle = 50000;

// in_array O(n)
$start = microtime(true);
$found = in_array($needle, $arr);
$inArrayTime = microtime(true) - $start;

// isset (after flipping array) O(1)
$flipped = array_flip($arr);
$start = microtime(true);
$found = isset($flipped[$needle]);
$issetTime = microtime(true) - $start;

// isset is orders of magnitude faster
```

### Optimization Suggestions

**1. Avoid Nested array_map/filter**

```php
<?php
// Not recommended: multiple traversals
$result = array_map(
    fn($n) => $n * 2,
    array_filter($numbers, fn($n) => $n > 0)
);

// Recommended: single traversal with reduce
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * 2;
    }
    return $carry;
}, []);
```

**2. Use Generators for Large Arrays**

```php
<?php
// Not recommended: loading all data at once
$result = array_map(fn($row) => processRow($row), $hugeArray);

// Recommended: use generators
function processRows(array $rows): Generator {
    foreach ($rows as $row) {
        yield processRow($row);
    }
}
```

**3. Lookup Optimization**

```php
<?php
$largeArray = range(1, 1000000);

// Slow: O(n) per lookup
foreach ($queries as $query) {
    if (in_array($query, $largeArray)) {
        // ...
    }
}

// Fast: O(1) per lookup
$lookup = array_flip($largeArray);
foreach ($queries as $query) {
    if (isset($lookup[$query])) {
        // ...
    }
}
```

**4. Reduce Function Call Overhead**

```php
<?php
// Inline simple logic
$doubled = [];
foreach ($numbers as $n) {
    $doubled[] = $n * 2;
}

// Instead of
$doubled = array_map(fn($n) => $n * 2, $numbers);

// But for complex logic, array_map is clearer
$processed = array_map(fn($item) => complexProcess($item), $items);
```

## Real-World Scenarios

### Scenario 1: API Data Transformation

```php
<?php
// Raw data from API
$apiResponse = [
    ['user_id' => 1, 'user_name' => 'zhang_san', 'user_email' => 'zhang@example.com'],
    ['user_id' => 2, 'user_name' => 'li_si', 'user_email' => 'li@example.com'],
    ['user_id' => 3, 'user_name' => 'wang_wu', 'user_email' => 'wang@example.com'],
];

// Convert to camelCase and add extra fields
$users = array_map(function($user) {
    return [
        'id' => $user['user_id'],
        'name' => ucwords(str_replace('_', ' ', $user['user_name'])),
        'email' => $user['user_email'],
        'createdAt' => date('Y-m-d H:i:s'),
    ];
}, $apiResponse);
```

### Scenario 2: Form Data Validation

```php
<?php
$input = [
    'name' => '  John Doe  ',
    'email' => 'invalid-email',
    'age' => '25',
    'role' => 'admin',
];

$required = ['name', 'email', 'age'];
$allowedRoles = ['user', 'editor', 'admin'];

// Check required fields
$missing = array_filter($required, fn($field) => empty($input[$field] ?? ''));
if ($missing) {
    throw new Exception('Missing fields: ' . implode(', ', $missing));
}

// Clean and validate data
$validated = array_reduce(array_keys($input), function($carry, $key) use ($input, $allowedRoles) {
    $value = trim($input[$key]);

    switch ($key) {
        case 'email':
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            break;
        case 'age':
            $value = (int) $value;
            if ($value < 0 || $value > 150) {
                throw new Exception('Invalid age');
            }
            break;
        case 'role':
            if (!in_array($value, $allowedRoles)) {
                throw new Exception('Invalid role');
            }
            break;
    }

    $carry[$key] = $value;
    return $carry;
}, []);
```

### Scenario 3: Shopping Cart Calculation

```php
<?php
$cart = [
    ['product_id' => 1, 'name' => 'Phone', 'price' => 3999, 'quantity' => 1],
    ['product_id' => 2, 'name' => 'Case', 'price' => 99, 'quantity' => 2],
    ['product_id' => 3, 'name' => 'Charger', 'price' => 149, 'quantity' => 1],
];

// Calculate subtotal for each item
$itemsWithSubtotal = array_map(function($item) {
    return array_merge($item, [
        'subtotal' => $item['price'] * $item['quantity']
    ]);
}, $cart);

// Calculate total amount
$total = array_reduce($itemsWithSubtotal, fn($sum, $item) => $sum + $item['subtotal'], 0);

// Filter expensive items (unit price over 100)
$expensiveItems = array_filter($cart, fn($item) => $item['price'] > 100);

// Sort by price
usort($cart, fn($a, $b) => $b['price'] <=> $a['price']);

// Generate order summary
$summary = [
    'items' => $itemsWithSubtotal,
    'itemCount' => array_reduce($cart, fn($sum, $item) => $sum + $item['quantity'], 0),
    'subtotal' => $total,
    'tax' => $total * 0.13,
    'total' => $total * 1.13,
];
```

### Scenario 4: Log Analysis

```php
<?php
$logs = [
    ['time' => '2024-01-15 10:30:00', 'level' => 'ERROR', 'message' => 'Database connection failed'],
    ['time' => '2024-01-15 10:31:00', 'level' => 'INFO', 'message' => 'Retry connection successful'],
    ['time' => '2024-01-15 10:32:00', 'level' => 'WARNING', 'message' => 'Response time too long'],
    ['time' => '2024-01-15 10:33:00', 'level' => 'ERROR', 'message' => 'Request timeout'],
    ['time' => '2024-01-15 10:34:00', 'level' => 'DEBUG', 'message' => 'Cache hit'],
];

// Filter error logs
$errors = array_filter($logs, fn($log) => $log['level'] === 'ERROR');

// Count by level
$countByLevel = array_reduce($logs, function($carry, $log) {
    $level = $log['level'];
    $carry[$level] = ($carry[$level] ?? 0) + 1;
    return $carry;
}, []);

// Extract all error messages
$errorMessages = array_map(
    fn($log) => $log['message'],
    array_filter($logs, fn($log) => $log['level'] === 'ERROR')
);

// Sort by time (newest first)
usort($logs, fn($a, $b) => strtotime($b['time']) <=> strtotime($a['time']));
```

### Scenario 5: Configuration Management

```php
<?php
$defaultConfig = [
    'app' => [
        'name' => 'MyApp',
        'debug' => false,
        'timezone' => 'UTC',
    ],
    'database' => [
        'driver' => 'mysql',
        'host' => 'localhost',
        'port' => 3306,
        'charset' => 'utf8mb4',
    ],
    'cache' => [
        'driver' => 'file',
        'ttl' => 3600,
    ],
];

$envConfig = [
    'app' => [
        'debug' => true,
    ],
    'database' => [
        'host' => '192.168.1.100',
        'password' => 'secret',
    ],
];

// Deep merge configuration
function mergeConfig(array $default, array $override): array
{
    return array_reduce(
        array_keys($override),
        function($config, $key) use ($override) {
            if (is_array($config[$key] ?? null) && is_array($override[$key])) {
                $config[$key] = mergeConfig($config[$key], $override[$key]);
            } else {
                $config[$key] = $override[$key];
            }
            return $config;
        },
        $default
    );
}

$config = mergeConfig($defaultConfig, $envConfig);

// Get all configuration key paths
function getConfigKeys(array $config, string $prefix = ''): array
{
    return array_reduce(
        array_keys($config),
        function($keys, $key) use ($config, $prefix) {
            $path = $prefix ? "{$prefix}.{$key}" : $key;
            if (is_array($config[$key])) {
                return array_merge($keys, getConfigKeys($config[$key], $path));
            }
            return array_merge($keys, [$path]);
        },
        []
    );
}
```

## Interview Key Points

### Common Interview Questions

**1. What is the difference between array_map and array_walk?**

```php
<?php
$arr = [1, 2, 3];

// array_map: returns new array, does not modify original
$result = array_map(fn($n) => $n * 2, $arr);
// $arr is still [1, 2, 3]
// $result is [2, 4, 6]

// array_walk: modifies original array, returns boolean
array_walk($arr, function(&$n) { $n *= 2; });
// $arr becomes [2, 4, 6]
```

**2. How to deduplicate an array while preserving order?**

```php
<?php
$arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];

// Method 1: array_unique (preserves first occurrence index)
$unique = array_values(array_unique($arr));

// Method 2: array_flip twice (faster)
$unique = array_keys(array_flip($arr));

// Method 3: array_reduce
$unique = array_reduce($arr, function($carry, $item) {
    if (!in_array($item, $carry)) {
        $carry[] = $item;
    }
    return $carry;
}, []);
```

**3. What is the difference between array_merge and `+` operator?**

```php
<?php
$a = ['x' => 1, 'y' => 2];
$b = ['y' => 3, 'z' => 4];

// array_merge: later overwrites earlier
array_merge($a, $b);  // ['x' => 1, 'y' => 3, 'z' => 4]

// + operator: earlier takes priority
$a + $b;  // ['x' => 1, 'y' => 2, 'z' => 4]

// Numeric key handling
$c = [0 => 'a', 1 => 'b'];
$d = [0 => 'c', 1 => 'd'];

array_merge($c, $d);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd'] (re-indexed)
$c + $d;              // [0 => 'a', 1 => 'b'] (original keys preserved, duplicates ignored)
```

**4. How to implement map and filter using reduce?**

```php
<?php
// Implementing array_map
function myMap(array $arr, callable $fn): array {
    return array_reduce($arr, function($carry, $item) use ($fn) {
        $carry[] = $fn($item);
        return $carry;
    }, []);
}

// Implementing array_filter
function myFilter(array $arr, callable $fn): array {
    return array_reduce($arr, function($carry, $item) use ($fn) {
        if ($fn($item)) {
            $carry[] = $item;
        }
        return $carry;
    }, []);
}
```

**5. Is usort sorting stable?**

```php
<?php
// PHP 8.0+: usort is stable
// PHP 7.x: usort is not stable

// Stable sorting means equal elements maintain original order
$arr = [
    ['name' => 'Alice', 'age' => 30],
    ['name' => 'Bob', 'age' => 30],
];

usort($arr, fn($a, $b) => $a['age'] <=> $b['age']);
// PHP 8+: Alice is always before Bob
// PHP 7: Order may change
```

### Code Implementation Questions

**Implement an array_group_by function:**

```php
<?php
function array_group_by(array $array, string $key): array
{
    return array_reduce($array, function($carry, $item) use ($key) {
        $groupKey = $item[$key] ?? '_null_';
        $carry[$groupKey][] = $item;
        return $carry;
    }, []);
}

// Usage
$users = [
    ['name' => 'Zhang San', 'dept' => 'Tech'],
    ['name' => 'Li Si', 'dept' => 'Marketing'],
    ['name' => 'Wang Wu', 'dept' => 'Tech'],
];

$grouped = array_group_by($users, 'dept');
// ['Tech' => [...], 'Marketing' => [...]]
```

**Implement an array_pluck function:**

```php
<?php
function array_pluck(array $array, string $valueKey, ?string $indexKey = null): array
{
    $result = array_map(fn($item) => $item[$valueKey] ?? null, $array);

    if ($indexKey !== null) {
        $keys = array_map(fn($item) => $item[$indexKey] ?? null, $array);
        return array_combine($keys, $result);
    }

    return $result;
}

// Usage
$users = [
    ['id' => 1, 'name' => 'Zhang San'],
    ['id' => 2, 'name' => 'Li Si'],
];

array_pluck($users, 'name');           // ['Zhang San', 'Li Si']
array_pluck($users, 'name', 'id');     // [1 => 'Zhang San', 2 => 'Li Si']
```

## Further Reading

### Official Documentation

- [PHP Array Functions Reference Manual](https://www.php.net/manual/en/ref.array.php)
- [array_map Function Documentation](https://www.php.net/manual/en/function.array-map.php)
- [array_filter Function Documentation](https://www.php.net/manual/en/function.array-filter.php)
- [array_reduce Function Documentation](https://www.php.net/manual/en/function.array-reduce.php)

### Related Concepts

- **Functional Programming**: map, filter, reduce are core concepts of functional programming
- **Higher-Order Functions**: Functions that accept functions as arguments or return functions
- **Closures**: Anonymous functions and arrow functions in PHP
- **Collection Operations**: Laravel Collection class provides richer collection operations

### Recommended Resources

- "PHP 7 Programming Cookbook" relevant chapters
- Laravel Collection source code analysis
- Lodash/Ramda JavaScript libraries (same concepts in JS implementation)
- Introduction to Functional Programming tutorials

### Third-Party Libraries

- **Laravel Collection**: Fluent collection manipulation API
- **Illuminate Support**: Standalone usable collection class
- **nikic/iter**: PHP iterator library
- **lstrojny/functional-php**: Functional programming utility library

## Summary

PHP array functions are indispensable tools in everyday development. By now, you should have mastered:

1. **array_map**: The preferred choice for data transformation and formatting
2. **array_filter**: A powerful tool for data filtering and cleaning
3. **array_reduce**: The universal tool for complex aggregation operations
4. **array_merge**: The standard way to merge arrays
5. **array_keys**: The fundamental function for key operations
6. **usort**: The solution for flexible sorting

These functions help you write more concise and readable code and are essential skills for PHP advancement and interviews. Practice in real projects to develop a functional programming mindset.
