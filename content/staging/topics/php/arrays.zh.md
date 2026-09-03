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
origin: old/src/content/docs/php/arrays.zh.md
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

数组是 PHP 中最强大和最通用的数据结构之一。它们允许你在单个变量中存储多个值，使数据的组织和操作变得高效且直观。本综合指南涵盖了你需要了解的关于 PHP 数组的所有内容，从基本概念到高级技术。

## 什么是数组

PHP 中的数组是一个有序映射，将键与值关联起来。与某些其他编程语言中的数组不同，PHP 数组非常灵活，可以保存不同数据类型的值。它们可以充当传统数组、列表、哈希表、字典、集合、栈、队列等。

```php
<?php
// 数组可以保存任意类型的多个值
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

### 关键特性

- **动态大小**：数组根据需要自动增长或缩小
- **混合类型**：可以包含不同数据类型的元素
- **灵活的键**：支持整数键和字符串键
- **有序**：保持插入顺序（自 PHP 7.0 起）
- **写时复制**：数组按值复制，而非按引用复制

## 索引数组

索引数组（也称为数值数组）使用整数键来访问值。索引默认从 0 开始。

### 创建索引数组

```php
<?php
// 使用方括号语法（推荐）
$fruits = ["apple", "banana", "orange", "grape"];

// 使用 array() 函数
$colors = array("red", "green", "blue");

// 创建空数组并添加元素
$numbers = [];
$numbers[] = 10;
$numbers[] = 20;
$numbers[] = 30;

// 显式指定索引
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

### 访问元素

```php
<?php
$fruits = ["apple", "banana", "orange", "grape"];

// 通过索引访问
echo $fruits[0]; // apple
echo $fruits[2]; // orange

// 访问最后一个元素
echo $fruits[count($fruits) - 1]; // grape

// 负数索引（PHP 7.1+）- 不像 Python 那样工作！
// 使用 array_slice 代替
$lastTwo = array_slice($fruits, -2);
print_r($lastTwo); // ["orange", "grape"]

// 访问前检查索引是否存在
if (isset($fruits[5])) {
    echo $fruits[5];
} else {
    echo "Index 5 does not exist";
}
?>
```

### 非连续索引

PHP 数组不要求索引连续：

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

// 下一个自动分配的索引将是 11
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

## 关联数组

关联数组使用命名键（字符串）来访问值，类似于其他语言中的字典或哈希映射。

### 创建关联数组

```php
<?php
// 使用 key => value 语法
$person = [
    "name" => "John Doe",
    "age" => 30,
    "email" => "john@example.com",
    "active" => true
];

// 使用 array() 函数
$config = array(
    "host" => "localhost",
    "port" => 3306,
    "database" => "myapp"
);

// 逐个添加元素
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

### 访问和修改

```php
<?php
$person = [
    "name" => "John Doe",
    "age" => 30,
    "email" => "john@example.com"
];

// 通过键访问
echo $person["name"]; // John Doe
echo $person["age"];  // 30

// 修改现有值
$person["age"] = 31;

// 添加新的键值对
$person["phone"] = "555-1234";

// 删除一个键
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

// 检查键是否存在
if (array_key_exists("name", $person)) {
    echo "Name exists: " . $person["name"];
}

// 空合并运算符用于安全访问
$country = $person["country"] ?? "Unknown";
echo $country; // Unknown
?>
```

### 混合键

数组可以同时拥有数值键和字符串键：

```php
<?php
$mixed = [
    0 => "first",
    "name" => "John",
    1 => "second",
    "age" => 30,
    "third"  // 自动分配索引 2
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

## 多维数组

多维数组是包含一个或多个数组的数组。它们用于表示复杂的数据结构，如表格、矩阵或层次数据。

### 二维数组

```php
<?php
// 用户数组（类表格结构）
$users = [
    ["id" => 1, "name" => "Alice", "role" => "admin"],
    ["id" => 2, "name" => "Bob", "role" => "editor"],
    ["id" => 3, "name" => "Charlie", "role" => "viewer"]
];

// 访问特定元素
echo $users[0]["name"]; // Alice
echo $users[1]["role"]; // editor

// 遍历二维数组
foreach ($users as $user) {
    echo "ID: {$user['id']}, Name: {$user['name']}, Role: {$user['role']}\n";
}
/*
ID: 1, Name: Alice, Role: admin
ID: 2, Name: Bob, Role: editor
ID: 3, Name: Charlie, Role: viewer
*/

// 矩阵（数值网格）
$matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

echo $matrix[1][1]; // 5（中心元素）
?>
```

### 三维数组

```php
<?php
// 公司结构
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

// 访问嵌套数据
echo $company["Engineering"]["Frontend"][0]["name"]; // Alice

// 遍历嵌套结构
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

### 实际示例：购物车

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

// 计算总价
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

## 创建数组

PHP 提供了多种创建数组的方法，每种方法适用于不同的场景。

### 方括号语法

现代推荐的创建数组方式：

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

### array() 函数

传统语法，仍然广泛使用：

```php
<?php
$empty = array();
$indexed = array(1, 2, 3, 4, 5);
$associative = array("key1" => "value1", "key2" => "value2");
?>
```

### range() 函数

创建包含一系列元素的数组：

```php
<?php
// 数值范围
$numbers = range(1, 10);
print_r($numbers); // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

// 带步长
$evens = range(2, 10, 2);
print_r($evens); // [2, 4, 6, 8, 10]

// 字符范围
$letters = range('a', 'f');
print_r($letters); // ['a', 'b', 'c', 'd', 'e', 'f']

// 降序范围
$countdown = range(5, 1);
print_r($countdown); // [5, 4, 3, 2, 1]
?>
```

### array_fill() 和 array_fill_keys()

使用预设值创建数组：

```php
<?php
// 用相同的值填充数组
$filled = array_fill(0, 5, "default");
print_r($filled); // ["default", "default", "default", "default", "default"]

// 从指定索引开始填充
$indexed = array_fill(10, 3, "value");
print_r($indexed); // [10 => "value", 11 => "value", 12 => "value"]

// 用特定键和默认值创建数组
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

使用一个数组作为键，另一个数组作为值来创建数组：

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

### Compact 和 Extract

变量与数组的相互转换：

```php
<?php
// compact() - 从变量创建数组
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

// extract() - 从数组创建变量
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

## 访问数组元素

### 基本访问

```php
<?php
$colors = ["red", "green", "blue"];
$person = ["name" => "John", "age" => 30];

// 直接访问
echo $colors[0];      // red
echo $person["name"]; // John

// 变量作为键
$key = "age";
echo $person[$key]; // 30

// 嵌套访问
$data = [
    "users" => [
        ["name" => "Alice"],
        ["name" => "Bob"]
    ]
];
echo $data["users"][1]["name"]; // Bob
?>
```

### 安全访问模式

```php
<?php
$data = ["name" => "John"];

// 访问前检查存在性
if (isset($data["email"])) {
    echo $data["email"];
} else {
    echo "Email not set";
}

// 空合并运算符（PHP 7+）
$email = $data["email"] ?? "not provided";
echo $email; // not provided

// array_key_exists 与 isset 的区别
$data = ["key" => null];

var_dump(isset($data["key"]));            // false（null 被视为未设置）
var_dump(array_key_exists("key", $data)); // true（键存在）

// 空合并赋值（PHP 7.4+）
$data["country"] ??= "USA";
echo $data["country"]; // USA
?>
```

### 解构（数组解包）

```php
<?php
// list 赋值
$coordinates = [10, 20, 30];
list($x, $y, $z) = $coordinates;
echo "X: $x, Y: $y, Z: $z"; // X: 10, Y: 20, Z: 30

// 简短语法（PHP 7.1+）
[$a, $b, $c] = [1, 2, 3];
echo "$a, $b, $c"; // 1, 2, 3

// 跳过元素
[$first, , $third] = ["one", "two", "three"];
echo "$first, $third"; // one, three

// 关联数组解构（PHP 7.1+）
$person = ["name" => "John", "age" => 30, "city" => "NYC"];
["name" => $name, "age" => $age] = $person;
echo "$name is $age years old"; // John is 30 years old

// 交换变量
$a = 1;
$b = 2;
[$a, $b] = [$b, $a];
echo "$a, $b"; // 2, 1

// 在 foreach 循环中使用
$users = [
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 30]
];

foreach ($users as ["name" => $name, "age" => $age]) {
    echo "$name: $age years old\n";
}
?>
```

## 修改数组

### 添加元素

```php
<?php
$fruits = ["apple", "banana"];

// 追加到末尾
$fruits[] = "orange";

// 使用 array_push（可添加多个）
array_push($fruits, "grape", "mango");

// 添加到开头
array_unshift($fruits, "pear");

// 在特定位置插入
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

// 关联数组
$person = ["name" => "John"];
$person["age"] = 30;
$person["email"] = "john@example.com";
?>
```

### 删除元素

```php
<?php
$fruits = ["apple", "banana", "orange", "grape", "mango"];

// 删除最后一个元素
$last = array_pop($fruits);
echo $last; // mango

// 删除第一个元素
$first = array_shift($fruits);
echo $first; // apple

// 通过键删除
unset($fruits[1]); // 删除 "orange"（索引不会重新编号）

// 通过值删除（第一个匹配项）
$key = array_search("grape", $fruits);
if ($key !== false) {
    unset($fruits[$key]);
}

// 删除多个元素
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
$removed = array_splice($numbers, 3, 4); // 从索引 3 开始删除 4 个元素
print_r($removed); // [4, 5, 6, 7]
print_r($numbers); // [1, 2, 3, 8, 9, 10]

// unset 后重新索引数组
$reindexed = array_values($fruits);
?>
```

### 替换元素

```php
<?php
$colors = ["red", "green", "blue", "yellow"];

// 通过索引替换
$colors[1] = "lime";

// 使用 array_splice 替换
array_splice($colors, 2, 1, ["navy", "cyan"]);
print_r($colors); // ["red", "lime", "navy", "cyan", "yellow"]

// 使用 array_replace 替换
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

## 数组迭代

### foreach 循环

遍历数组最常用的方式：

```php
<?php
// 简单遍历
$fruits = ["apple", "banana", "orange"];

foreach ($fruits as $fruit) {
    echo $fruit . "\n";
}

// 带索引/键
foreach ($fruits as $index => $fruit) {
    echo "$index: $fruit\n";
}
/*
0: apple
1: banana
2: orange
*/

// 关联数组
$person = ["name" => "John", "age" => 30, "city" => "NYC"];

foreach ($person as $key => $value) {
    echo "$key: $value\n";
}

// 通过引用修改值
$numbers = [1, 2, 3, 4, 5];

foreach ($numbers as &$number) {
    $number *= 2;
}
unset($number); // 重要：循环后取消引用

print_r($numbers); // [2, 4, 6, 8, 10]
?>
```

### for 循环

当需要索引时很有用：

```php
<?php
$colors = ["red", "green", "blue"];
$count = count($colors);

for ($i = 0; $i < $count; $i++) {
    echo "Color $i: {$colors[$i]}\n";
}

// 反向遍历
for ($i = $count - 1; $i >= 0; $i--) {
    echo "Color $i: {$colors[$i]}\n";
}
?>
```

### while 循环与数组函数

```php
<?php
$fruits = ["apple", "banana", "orange"];

// 使用 each() - 在 PHP 7.2+ 中已弃用
// 改用 foreach 或 array_walk

// 使用 array_shift
while ($fruit = array_shift($fruits)) {
    echo $fruit . "\n";
}
// 注意：$fruits 现在是空的

// 使用 current/next 重置并遍历
$colors = ["red", "green", "blue"];
reset($colors);
while ($color = current($colors)) {
    echo $color . "\n";
    next($colors);
}
?>
```

### array_walk 和 array_walk_recursive

对每个元素应用回调函数：

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// array_walk 就地修改数组
array_walk($numbers, function(&$value, $key) {
    $value = $value * 2;
});
print_r($numbers); // [2, 4, 6, 8, 10]

// 带额外数据
$prices = [100, 200, 300];
array_walk($prices, function(&$price, $key, $taxRate) {
    $price = $price * (1 + $taxRate);
}, 0.08);
print_r($prices); // [108, 216, 324]

// 递归遍历嵌套数组
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

## 数组函数

PHP 提供了丰富的内置数组函数。以下是最常用的函数：

### 计数和信息

```php
<?php
$fruits = ["apple", "banana", "orange", "apple"];

// 计算元素数量
echo count($fruits);     // 4
echo sizeof($fruits);    // 4（count 的别名）

// 统计值出现次数
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

// 检查是否为数组
var_dump(is_array($fruits));     // true
var_dump(is_array("not array")); // false

// 检查是否为空
$empty = [];
var_dump(empty($empty)); // true

// 获取唯一值
$unique = array_unique($fruits);
print_r($unique); // ["apple", "banana", "orange"]
?>
```

### 键和值

```php
<?php
$person = [
    "name" => "John",
    "age" => 30,
    "email" => "john@example.com"
];

// 获取所有键
$keys = array_keys($person);
print_r($keys); // ["name", "age", "email"]

// 获取所有值
$values = array_values($person);
print_r($values); // ["John", 30, "john@example.com"]

// 获取特定值对应的键
$data = ["a" => 1, "b" => 2, "c" => 1];
$keysForOne = array_keys($data, 1);
print_r($keysForOne); // ["a", "c"]

// 交换键和值
$flipped = array_flip(["a" => 0, "b" => 1, "c" => 2]);
print_r($flipped); // [0 => "a", 1 => "b", 2 => "c"]

// 获取第一个/最后一个键（PHP 7.3+）
echo array_key_first($person); // name
echo array_key_last($person);  // email
?>
```

### 栈和队列操作

```php
<?php
// 栈（LIFO - 后进先出）
$stack = [];

// 入栈
array_push($stack, "first");
array_push($stack, "second");
array_push($stack, "third");

// 出栈
$top = array_pop($stack); // "third"
echo $top;

print_r($stack); // ["first", "second"]

// 队列（FIFO - 先进先出）
$queue = [];

// 入队（添加到末尾）
array_push($queue, "first");
array_push($queue, "second");
array_push($queue, "third");

// 出队（从前面移除）
$front = array_shift($queue); // "first"
echo $front;

print_r($queue); // ["second", "third"]

// 添加到前面
array_unshift($queue, "new first");
print_r($queue); // ["new first", "second", "third"]
?>
```

### 切片和提取

```php
<?php
$letters = ["a", "b", "c", "d", "e", "f"];

// 切片（提取部分）
$slice1 = array_slice($letters, 2);      // ["c", "d", "e", "f"] - 从索引 2 开始
$slice2 = array_slice($letters, 1, 3);   // ["b", "c", "d"] - 从索引 1 开始的 3 个元素
$slice3 = array_slice($letters, -2);     // ["e", "f"] - 最后 2 个元素
$slice4 = array_slice($letters, 0, -2);  // ["a", "b", "c", "d"] - 除最后 2 个外的所有元素

// 保留键
$assoc = ["a" => 1, "b" => 2, "c" => 3, "d" => 4];
$preserved = array_slice($assoc, 1, 2, true);
print_r($preserved); // ["b" => 2, "c" => 3]

// 接合（移除/替换部分）
$numbers = [1, 2, 3, 4, 5];
$removed = array_splice($numbers, 2, 2, [30, 40]);
print_r($removed);  // [3, 4] - 移除的元素
print_r($numbers);  // [1, 2, 30, 40, 5] - 修改后的数组

// 获取随机元素
$colors = ["red", "green", "blue", "yellow", "purple"];
$randomKey = array_rand($colors);           // 随机键
$randomKeys = array_rand($colors, 2);       // 包含 2 个随机键的数组
echo $colors[$randomKey];
?>
```

## 数组排序

PHP 提供了多种函数以不同方式对数组进行排序。

### 索引数组排序

```php
<?php
$numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// 升序排序（修改原数组）
sort($numbers);
print_r($numbers); // [1, 1, 2, 3, 4, 5, 6, 9]

// 降序排序
rsort($numbers);
print_r($numbers); // [9, 6, 5, 4, 3, 2, 1, 1]

$fruits = ["banana", "Apple", "orange", "apple"];

// 区分大小写排序
sort($fruits);
print_r($fruits); // ["Apple", "apple", "banana", "orange"]

// 自然排序（不区分大小写）
sort($fruits, SORT_NATURAL | SORT_FLAG_CASE);
print_r($fruits); // ["Apple", "apple", "banana", "orange"]

// 数值排序
$mixed = ["10", "1", "2", "20"];
sort($mixed, SORT_NUMERIC);
print_r($mixed); // ["1", "2", "10", "20"]
?>
```

### 关联数组排序

```php
<?php
$ages = [
    "John" => 30,
    "Alice" => 25,
    "Bob" => 35
];

// 按值排序，保留键
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

// 按值降序排序
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

// 按键排序
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

// 按键降序排序
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

### 自然排序

```php
<?php
$files = ["img12.png", "img1.png", "img2.png", "img10.png"];

// 常规排序
sort($files);
print_r($files);
// ["img1.png", "img10.png", "img12.png", "img2.png"]

// 自然排序
$files = ["img12.png", "img1.png", "img2.png", "img10.png"];
natsort($files);
print_r($files);
// ["img1.png", "img2.png", "img10.png", "img12.png"]

// 不区分大小写的自然排序
$items = ["Item12", "item1", "ITEM2", "item10"];
natcasesort($items);
print_r($items);
// ["item1", "ITEM2", "item10", "Item12"]
?>
```

### 自定义排序

```php
<?php
// usort - 用户自定义比较函数
$numbers = [3, 1, 4, 1, 5, 9];

usort($numbers, function($a, $b) {
    return $a - $b; // 升序
    // return $b - $a; // 降序
});
print_r($numbers); // [1, 1, 3, 4, 5, 9]

// 太空船运算符（PHP 7+）
usort($numbers, fn($a, $b) => $a <=> $b);

// 对复杂数组排序
$users = [
    ["name" => "John", "age" => 30],
    ["name" => "Alice", "age" => 25],
    ["name" => "Bob", "age" => 35]
];

// 按年龄排序
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

// 按姓名排序（字符串比较）
usort($users, fn($a, $b) => strcmp($a["name"], $b["name"]));

// uasort - 保持键关联
$scores = ["Alice" => 85, "Bob" => 92, "Charlie" => 78];
uasort($scores, fn($a, $b) => $b - $a); // 降序
print_r($scores);
/*
Array
(
    [Bob] => 92
    [Alice] => 85
    [Charlie] => 78
)
*/

// uksort - 使用回调函数按键排序
uksort($scores, fn($a, $b) => strlen($a) - strlen($b));
?>
```

### 多维数组排序

```php
<?php
$products = [
    ["name" => "Laptop", "price" => 999, "stock" => 5],
    ["name" => "Mouse", "price" => 29, "stock" => 50],
    ["name" => "Keyboard", "price" => 79, "stock" => 25],
    ["name" => "Monitor", "price" => 299, "stock" => 10]
];

// 按单列排序
usort($products, fn($a, $b) => $a["price"] <=> $b["price"]);

// 按多列排序（价格升序，然后库存降序）
usort($products, function($a, $b) {
    $priceCompare = $a["price"] <=> $b["price"];
    if ($priceCompare !== 0) {
        return $priceCompare;
    }
    return $b["stock"] <=> $a["stock"];
});

// 使用 array_multisort
$names = array_column($products, "name");
$prices = array_column($products, "price");

array_multisort($prices, SORT_ASC, $names, SORT_ASC, $products);
print_r($products);
?>
```

## 数组搜索和过滤

### 搜索

```php
<?php
$fruits = ["apple", "banana", "orange", "grape"];

// 检查值是否存在
if (in_array("banana", $fruits)) {
    echo "Banana found!";
}

// 严格类型检查
$mixed = [1, "1", 2, "2"];
var_dump(in_array(1, $mixed));         // true
var_dump(in_array("1", $mixed));       // true
var_dump(in_array(1, $mixed, true));   // true（严格模式）
var_dump(in_array("1", $mixed, true)); // true（严格模式）

// 查找值对应的键
$key = array_search("orange", $fruits);
echo $key; // 2

// 严格搜索
$key = array_search(1, $mixed, true); // 0

// 检查键是否存在
$person = ["name" => "John", "age" => null];
var_dump(isset($person["age"]));              // false（null）
var_dump(array_key_exists("age", $person));   // true

// 查找所有匹配的键
$data = [1, 2, 3, 1, 2, 1];
$keys = array_keys($data, 1);
print_r($keys); // [0, 3, 5]
?>
```

### 过滤

```php
<?php
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 使用回调函数过滤
$evens = array_filter($numbers, fn($n) => $n % 2 === 0);
print_r($evens); // [2, 4, 6, 8, 10]

$odds = array_filter($numbers, fn($n) => $n % 2 !== 0);
print_r($odds); // [1, 3, 5, 7, 9]

// 按键过滤
$data = ["a" => 1, "b" => 2, "c" => 3, "d" => 4];
$filtered = array_filter($data, fn($key) => $key !== "b", ARRAY_FILTER_USE_KEY);
print_r($filtered); // ["a" => 1, "c" => 3, "d" => 4]

// 同时按键和值过滤
$filtered = array_filter($data, fn($value, $key) => $value > 1 && $key !== "d", ARRAY_FILTER_USE_BOTH);
print_r($filtered); // ["b" => 2, "c" => 3]

// 移除空值
$mixed = ["hello", "", null, 0, false, "world", [], 1];
$nonEmpty = array_filter($mixed); // 使用默认过滤器（移除假值）
print_r($nonEmpty); // ["hello", "world", 1]

// 仅移除 null
$withNulls = ["a" => 1, "b" => null, "c" => 2, "d" => null];
$noNulls = array_filter($withNulls, fn($v) => $v !== null);
print_r($noNulls); // ["a" => 1, "c" => 2]

// 复杂过滤
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

## 数组转换

### array_map

对每个元素应用回调函数并返回新数组：

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// 计算每个数的平方
$squared = array_map(fn($n) => $n ** 2, $numbers);
print_r($squared); // [1, 4, 9, 16, 25]

// 多个数组
$a = [1, 2, 3];
$b = [10, 20, 30];

$sums = array_map(fn($x, $y) => $x + $y, $a, $b);
print_r($sums); // [11, 22, 33]

// 带键（null 回调创建数组的数组）
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

// 转换复杂数据
$users = [
    ["first" => "John", "last" => "Doe"],
    ["first" => "Jane", "last" => "Smith"]
];

$fullNames = array_map(fn($u) => "{$u['first']} {$u['last']}", $users);
print_r($fullNames); // ["John Doe", "Jane Smith"]
?>
```

### array_reduce

将数组归约为单个值：

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// 求和
$sum = array_reduce($numbers, fn($carry, $item) => $carry + $item, 0);
echo $sum; // 15

// 求积
$product = array_reduce($numbers, fn($carry, $item) => $carry * $item, 1);
echo $product; // 120

// 找最大值
$max = array_reduce($numbers, fn($carry, $item) => max($carry, $item), PHP_INT_MIN);
echo $max; // 5

// 构建字符串
$letters = ["H", "e", "l", "l", "o"];
$word = array_reduce($letters, fn($carry, $item) => $carry . $item, "");
echo $word; // Hello

// 复杂归约
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

// 按类别分组
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

从多维数组中提取一列：

```php
<?php
$users = [
    ["id" => 1, "name" => "Alice", "email" => "alice@example.com"],
    ["id" => 2, "name" => "Bob", "email" => "bob@example.com"],
    ["id" => 3, "name" => "Charlie", "email" => "charlie@example.com"]
];

// 提取单列
$names = array_column($users, "name");
print_r($names); // ["Alice", "Bob", "Charlie"]

// 提取列并指定键
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

// 按列索引（null 表示完整行）
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

// 也适用于对象
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

### 数组扁平化

```php
<?php
// 简单扁平化
$nested = [[1, 2], [3, 4], [5, 6]];
$flat = array_merge(...$nested);
print_r($flat); // [1, 2, 3, 4, 5, 6]

// 递归扁平化函数
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

// 使用迭代器（更节省内存）
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

## 合并和拆分数组

### 合并数组

```php
<?php
$array1 = [1, 2, 3];
$array2 = [4, 5, 6];

// array_merge - 重新索引数值键
$merged = array_merge($array1, $array2);
print_r($merged); // [1, 2, 3, 4, 5, 6]

// 展开运算符（PHP 7.4+）
$merged = [...$array1, ...$array2];
print_r($merged); // [1, 2, 3, 4, 5, 6]

// 关联数组
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

// array_merge_recursive - 递归合并
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

// 联合运算符（+）- 保留重复键的第一个值
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

### 拆分数组

```php
<?php
$letters = ["a", "b", "c", "d", "e", "f", "g", "h"];

// array_chunk - 分割成块
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

// 保留键
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

// 字符串分割成数组
$str = "apple,banana,orange";
$fruits = explode(",", $str);
print_r($fruits); // ["apple", "banana", "orange"]

// 带限制的分割
$parts = explode(",", $str, 2);
print_r($parts); // ["apple", "banana,orange"]

// 按多个分隔符分割
$text = "one;two,three|four";
$parts = preg_split('/[;,|]/', $text);
print_r($parts); // ["one", "two", "three", "four"]

// 数组连接成字符串
$words = ["Hello", "World"];
$sentence = implode(" ", $words);
echo $sentence; // Hello World
?>
```

### 集合操作

```php
<?php
$set1 = [1, 2, 3, 4, 5];
$set2 = [4, 5, 6, 7, 8];

// 差集 - 在第一个中但不在第二个中的元素
$diff = array_diff($set1, $set2);
print_r($diff); // [1, 2, 3]

// 交集 - 两者都有的元素
$intersect = array_intersect($set1, $set2);
print_r($intersect); // [4, 5]

// 对称差集（在其中一个但不同时在两个中的元素）
$symmetric = array_merge(
    array_diff($set1, $set2),
    array_diff($set2, $set1)
);
print_r($symmetric); // [1, 2, 3, 6, 7, 8]

// 带键操作
$arr1 = ["a" => 1, "b" => 2, "c" => 3];
$arr2 = ["a" => 1, "b" => 3, "d" => 4];

// 仅按键比较差集
$diffKeys = array_diff_key($arr1, $arr2);
print_r($diffKeys); // ["c" => 3]

// 按键和值比较差集
$diffAssoc = array_diff_assoc($arr1, $arr2);
print_r($diffAssoc); // ["b" => 2, "c" => 3]

// 按键比较交集
$intersectKeys = array_intersect_key($arr1, $arr2);
print_r($intersectKeys); // ["a" => 1, "b" => 2]

// 按键和值比较交集
$intersectAssoc = array_intersect_assoc($arr1, $arr2);
print_r($intersectAssoc); // ["a" => 1]
?>
```

## 数组比较

### 比较数组

```php
<?php
$arr1 = [1, 2, 3];
$arr2 = [1, 2, 3];
$arr3 = [3, 2, 1];
$arr4 = ["1", "2", "3"];

// 相等（==）- 相同的键和值（类型转换）
var_dump($arr1 == $arr2);  // true
var_dump($arr1 == $arr3);  // false（顺序不同）
var_dump($arr1 == $arr4);  // true（类型转换）

// 全等（===）- 相同的键、值、顺序和类型
var_dump($arr1 === $arr2); // true
var_dump($arr1 === $arr4); // false（类型不同）

// 不等
var_dump($arr1 != $arr3);  // true
var_dump($arr1 <> $arr3);  // true（与 != 相同）
var_dump($arr1 !== $arr4); // true

// 比较排序后的数组
sort($arr1);
sort($arr3);
var_dump($arr1 === $arr3); // true（排序后相同）

// 自定义比较函数
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

### 比较数组内容

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

// 由于顺序不同，简单比较失败
var_dump($products1 == $products2); // false

// 通过序列化比较（顺序无关）
function arrays_equal_unordered(array $a, array $b): bool {
    $serialize = fn($arr) => array_map('serialize', $arr);
    sort($a);
    sort($b);
    return $serialize($a) === $serialize($b);
}

var_dump(arrays_equal_unordered($products1, $products2)); // true

// 查找差异
$added = array_udiff($products2, $products1, fn($a, $b) =>
    ($a["id"] ?? 0) <=> ($b["id"] ?? 0)
);

$removed = array_udiff($products1, $products2, fn($a, $b) =>
    ($a["id"] ?? 0) <=> ($b["id"] ?? 0)
);
?>
```

## 高级数组技术

### 引用处理

```php
<?php
// 数组按值复制
$original = [1, 2, 3];
$copy = $original;
$copy[0] = 100;

print_r($original); // [1, 2, 3] - 未改变
print_r($copy);     // [100, 2, 3]

// 按引用传递
$data = [1, 2, 3];
$reference = &$data;
$reference[0] = 100;

print_r($data); // [100, 2, 3] - 改变了

// 带引用参数的函数
function double_values(array &$arr): void {
    foreach ($arr as &$value) {
        $value *= 2;
    }
    unset($value); // 重要！
}

$numbers = [1, 2, 3];
double_values($numbers);
print_r($numbers); // [2, 4, 6]
?>
```

### 数组作为对象属性

```php
<?php
// ArrayObject - 像数组一样工作的对象
$arrayObj = new ArrayObject(["a" => 1, "b" => 2]);
$arrayObj["c"] = 3;
$arrayObj->append(4);

foreach ($arrayObj as $key => $value) {
    echo "$key: $value\n";
}

// 转换为普通数组
$regularArray = $arrayObj->getArrayCopy();

// 自定义类数组类
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

### 生成器处理大型数组

```php
<?php
// 内存高效地遍历大型数据集
function large_range(int $start, int $end): Generator {
    for ($i = $start; $i <= $end; $i++) {
        yield $i;
    }
}

// 无论范围大小都使用最小内存
foreach (large_range(1, 1000000) as $number) {
    if ($number > 5) break;
    echo $number . "\n";
}

// 文件行的生成器
function read_lines(string $filename): Generator {
    $handle = fopen($filename, "r");
    while (($line = fgets($handle)) !== false) {
        yield trim($line);
    }
    fclose($handle);
}

// 逐行处理大文件
foreach (read_lines("/path/to/large/file.txt") as $line) {
    // 处理每一行而不加载整个文件
}

// 带键的 yield
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

### 递归数组操作

```php
<?php
// 深度合并
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

// 深度搜索
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

### 数组缓存模式

```php
<?php
// 记忆化
function fibonacci(int $n, array &$cache = []): int {
    if ($n <= 1) return $n;
    if (isset($cache[$n])) return $cache[$n];
    return $cache[$n] = fibonacci($n - 1, $cache) + fibonacci($n - 2, $cache);
}

echo fibonacci(50); // 使用缓存速度很快

// 静态缓存
function expensive_operation(string $key): mixed {
    static $cache = [];

    if (!isset($cache[$key])) {
        // 模拟耗时操作
        $cache[$key] = "result_for_$key";
    }

    return $cache[$key];
}

// 使用数组实现类 LRU 缓存
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
        // 移到末尾（最近使用）
        $value = $this->cache[$key];
        unset($this->cache[$key]);
        $this->cache[$key] = $value;
        return $value;
    }

    public function set(string $key, mixed $value): void {
        if (isset($this->cache[$key])) {
            unset($this->cache[$key]);
        } elseif (count($this->cache) >= $this->maxSize) {
            // 移除最旧的（第一个）项
            array_shift($this->cache);
        }
        $this->cache[$key] = $value;
    }
}
?>
```

## 最佳实践

### 使用简短数组语法

```php
<?php
// 推荐（现代方式）
$array = ["apple", "banana", "orange"];

// 遗留方式（仍然有效但冗长）
$array = array("apple", "banana", "orange");
?>
```

### 类型声明

```php
<?php
// 在函数签名中指定数组类型
function processItems(array $items): array {
    return array_map(fn($item) => strtoupper($item), $items);
}

// PHP 8+ 联合类型
function getValue(string|int $key, array $data): mixed {
    return $data[$key] ?? null;
}

// 使用文档块进行更具体的类型说明
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

### 不可变操作

```php
<?php
// 优先使用不修改原数组的函数
$original = [3, 1, 4, 1, 5];

// 不好：修改原数组
sort($original);

// 更好：创建排序后的副本
$original = [3, 1, 4, 1, 5];
$sorted = $original;
sort($sorted);

// 或使用展开运算符
$original = [3, 1, 4, 1, 5];
$sorted = [...$original];
sort($sorted);
?>
```

### 空安全

```php
<?php
// 访问前始终检查
$data = ["name" => "John"];

// 好：使用空合并
$email = $data["email"] ?? "not set";

// 好：使用 isset 或 array_key_exists 检查
if (isset($data["email"])) {
    sendEmail($data["email"]);
}

// PHP 8：嵌套访问的空安全运算符
$users = [
    ["profile" => ["name" => "John"]],
    ["profile" => null]
];

// 不会因 null profile 而报错
$name = $users[1]["profile"]["name"] ?? "Unknown";
?>
```

### 清晰的变量名

```php
<?php
// 不好：名称不清晰
$arr = ["red", "green", "blue"];
$tmp = [];
foreach ($arr as $a) {
    $tmp[] = strtoupper($a);
}

// 好：描述性名称
$colors = ["red", "green", "blue"];
$uppercaseColors = [];
foreach ($colors as $color) {
    $uppercaseColors[] = strtoupper($color);
}

// 更好：使用 array_map
$colors = ["red", "green", "blue"];
$uppercaseColors = array_map("strtoupper", $colors);
?>
```

## 常见陷阱

### foreach 中的引用陷阱

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// 问题：循环后引用仍然存在
foreach ($numbers as &$number) {
    $number *= 2;
}
// $number 仍然引用 $numbers[4]！

foreach ($numbers as $number) {
    // 最后一次迭代会覆盖 $numbers[4]
}
print_r($numbers); // [2, 4, 6, 8, 8] - 意外！

// 解决方案：始终取消引用
$numbers = [1, 2, 3, 4, 5];
foreach ($numbers as &$number) {
    $number *= 2;
}
unset($number); // 重要！

foreach ($numbers as $number) {
    // 现在安全了
}
print_r($numbers); // [2, 4, 6, 8, 10]
?>
```

### 数组键类型强制转换

```php
<?php
// PHP 将某些值强制转换为整数
$array = [];
$array["1"] = "string key";
$array[1] = "int key";

print_r($array);
/*
Array
(
    [1] => int key  // 只有一个条目！字符串 "1" 变成了整数 1
)
*/

// 浮点键被截断
$array[1.9] = "float key";
print_r($array);
/*
Array
(
    [1] => float key  // 1.9 变成了 1
)
*/

// null 变成空字符串键
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

### 空数组检查

```php
<?php
// 这些行为不同
$array = [];
$array2 = [0];
$array3 = [false];
$array4 = [null];

// empty() 检查是否为真值
var_dump(empty($array));  // true
var_dump(empty($array2)); // false（有元素）
var_dump(empty($array3)); // false（有元素）

// count 更可靠
var_dump(count($array) === 0);  // true
var_dump(count($array2) === 0); // false

// 最好：与空数组比较
var_dump($array === []); // true
?>
```

### 就地排序与返回值

```php
<?php
$numbers = [3, 1, 4, 1, 5];

// 错误：sort() 返回 bool，不是数组
$sorted = sort($numbers); // $sorted 是 true，不是排序后的数组

// 正确：sort 就地修改
$numbers = [3, 1, 4, 1, 5];
sort($numbers);
print_r($numbers); // [1, 1, 3, 4, 5]

// 如果需要保留原数组
$original = [3, 1, 4, 1, 5];
$sorted = $original; // 先复制
sort($sorted);
?>
```

### 数组加法运算符的意外行为

```php
<?php
$arr1 = [0 => "a", 1 => "b"];
$arr2 = [0 => "c", 1 => "d", 2 => "e"];

// 加法运算符保留重复键的第一个值
$result = $arr1 + $arr2;
print_r($result);
/*
Array
(
    [0] => a  // 来自 $arr1，不是 "c"
    [1] => b  // 来自 $arr1，不是 "d"
    [2] => e  // 来自 $arr2（新键）
)
*/

// array_merge 重新索引并覆盖
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

## 总结

PHP 数组非常通用，是 PHP 应用程序中数据操作的基础。从简单列表到复杂的嵌套结构，理解数组对于有效的 PHP 开发至关重要。

### 关键要点

- PHP 数组是有序映射，可以使用整数键和字符串键
- 使用现代方括号 `[]` 语法创建数组
- foreach 循环后始终取消引用以避免意外行为
- 利用内置数组函数如 `array_map`、`array_filter` 和 `array_reduce`
- 注意数组键的类型强制转换
- 使用生成器高效处理大型数据集
- 优先使用不修改原数组的不可变操作

### 后续步骤

掌握 PHP 数组后，考虑探索：
- PHP 集合库（如 Laravel Collections 或 Doctrine Collections）
- SPL 数据结构（SplFixedArray、SplDoublyLinkedList、SplHeap）
- 数组的 JSON 编码和解码
- 数据库结果作为数组处理
- 在 PHP 框架中使用数组

通过实际项目练习这些概念，巩固你对 PHP 数组的理解！
