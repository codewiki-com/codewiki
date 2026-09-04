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
origin: old/src/content/docs/php/array-functions.zh.md
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

PHP 提供了丰富的数组函数，使得数组操作变得简洁高效。本文将深入解析六个最核心、最常用的数组函数：`array_map`、`array_filter`、`array_reduce`、`array_merge`、`array_keys` 和 `usort`。掌握这些函数不仅能提升代码质量，也是 PHP 面试中的高频考点。

## 概念解释

### 什么是数组函数

数组函数是 PHP 内置的用于操作数组的函数集合。它们提供了对数组进行遍历、过滤、转换、合并、排序等操作的标准化方法。相比手动编写循环代码，使用数组函数具有以下优势：

- **代码简洁**：一行代码完成复杂操作
- **可读性强**：函数名直接表达意图
- **性能优化**：底层 C 实现，执行效率高
- **减少错误**：避免手写循环的边界条件问题

### 函数式编程思想

本文介绍的 `array_map`、`array_filter`、`array_reduce` 三个函数体现了函数式编程的核心思想：

```php
<?php
// 命令式编程：告诉程序"怎么做"
$result = [];
foreach ($numbers as $n) {
    if ($n > 0) {
        $result[] = $n * 2;
    }
}

// 函数式编程：告诉程序"做什么"
$result = array_map(
    fn($n) => $n * 2,
    array_filter($numbers, fn($n) => $n > 0)
);
```

函数式风格的代码更加声明式，关注数据的转换而非过程的控制。

### 六大核心函数概览

| 函数 | 作用 | 返回值 | 典型场景 |
|------|------|--------|----------|
| `array_map` | 对每个元素应用回调函数 | 新数组 | 数据转换、格式化 |
| `array_filter` | 过滤符合条件的元素 | 新数组 | 数据筛选、清理 |
| `array_reduce` | 将数组归约为单一值 | 任意类型 | 求和、统计、聚合 |
| `array_merge` | 合并多个数组 | 新数组 | 数组拼接、配置合并 |
| `array_keys` | 获取数组的所有键 | 索引数组 | 键名提取、键存在检查 |
| `usort` | 使用自定义规则排序 | 布尔值 | 复杂排序、多字段排序 |

## 核心原理

### array_map 的工作原理

`array_map` 对数组中的每个元素应用回调函数，返回一个包含处理结果的新数组。

**函数签名：**

```php
array_map(?callable $callback, array $array, array ...$arrays): array
```

**执行流程：**

```
输入数组: [a, b, c, d]
           ↓  ↓  ↓  ↓
回调函数:  f  f  f  f
           ↓  ↓  ↓  ↓
输出数组: [f(a), f(b), f(c), f(d)]
```

**内部实现原理：**

```php
<?php
// array_map 的简化实现逻辑
function my_array_map(callable $callback, array $array): array
{
    $result = [];
    foreach ($array as $key => $value) {
        $result[$key] = $callback($value);
    }
    return $result;
}
```

关键特点：
- **保持键名**：输出数组的键与输入数组相同
- **不修改原数组**：返回新数组，原数组不变
- **支持多数组**：可同时处理多个数组

### array_filter 的工作原理

`array_filter` 使用回调函数过滤数组元素，只保留回调返回 `true` 的元素。

**函数签名：**

```php
array_filter(array $array, ?callable $callback = null, int $mode = 0): array
```

**执行流程：**

```
输入数组: [1, 2, 3, 4, 5]
条件函数: n > 2
           ↓
过滤过程: 1→false, 2→false, 3→true, 4→true, 5→true
           ↓
输出数组: [3, 4, 5]（保持原索引）
```

**过滤模式：**

```php
<?php
$arr = ['a' => 1, 'b' => 2, 'c' => 3];

// 默认模式：只传值给回调
array_filter($arr, fn($v) => $v > 1);

// ARRAY_FILTER_USE_KEY：只传键给回调
array_filter($arr, fn($k) => $k !== 'b', ARRAY_FILTER_USE_KEY);

// ARRAY_FILTER_USE_BOTH：同时传值和键
array_filter($arr, fn($v, $k) => $k !== 'a' && $v > 1, ARRAY_FILTER_USE_BOTH);
```

### array_reduce 的工作原理

`array_reduce` 通过回调函数迭代地将数组归约为单一值。

**函数签名：**

```php
array_reduce(array $array, callable $callback, mixed $initial = null): mixed
```

**执行流程（以求和为例）：**

```
初始值: 0
数组: [1, 2, 3, 4]

第1次: callback(0, 1) = 1
第2次: callback(1, 2) = 3
第3次: callback(3, 3) = 6
第4次: callback(6, 4) = 10

最终结果: 10
```

**回调函数参数：**

```php
<?php
// $carry: 上一次迭代的返回值（首次为初始值）
// $item: 当前元素
array_reduce($array, function($carry, $item) {
    return $carry + $item;
}, 0);
```

### array_merge 的工作原理

`array_merge` 将多个数组合并为一个数组。

**函数签名：**

```php
array_merge(array ...$arrays): array
```

**合并规则：**

1. **数字键**：重新索引，从 0 开始连续编号
2. **字符串键**：后面的值覆盖前面的值

```php
<?php
$a = [0 => 'a', 1 => 'b'];
$b = [0 => 'c', 1 => 'd'];
$c = ['x' => 1, 'y' => 2];
$d = ['x' => 3, 'z' => 4];

// 数字键重新索引
array_merge($a, $b);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// 字符串键覆盖
array_merge($c, $d);  // ['x' => 3, 'y' => 2, 'z' => 4]
```

### array_keys 的工作原理

`array_keys` 返回数组中所有的键，可选地筛选特定值对应的键。

**函数签名：**

```php
array_keys(array $array, mixed $filter_value = null, bool $strict = false): array
```

**工作模式：**

```php
<?php
$arr = ['a' => 1, 'b' => 2, 'c' => 1, 'd' => '1'];

// 获取所有键
array_keys($arr);  // ['a', 'b', 'c', 'd']

// 获取值为 1 的键（宽松比较）
array_keys($arr, 1);  // ['a', 'c', 'd']

// 获取值为 1 的键（严格比较）
array_keys($arr, 1, true);  // ['a', 'c']
```

### usort 的工作原理

`usort` 使用用户自定义的比较函数对数组进行排序。

**函数签名：**

```php
usort(array &$array, callable $callback): true
```

**比较函数规则：**

```php
<?php
// 比较函数返回值规则：
// 负数：$a 排在 $b 前面
// 零：$a 和 $b 相等
// 正数：$a 排在 $b 后面

usort($array, function($a, $b) {
    if ($a < $b) return -1;
    if ($a > $b) return 1;
    return 0;
});

// PHP 7+ 可使用太空船运算符简化
usort($array, fn($a, $b) => $a <=> $b);
```

**排序算法：**

PHP 的 usort 使用的是快速排序算法的变体，平均时间复杂度为 O(n log n)。

## 核心要点

### array_map 核心要点

1. **回调函数为 null 时的特殊行为**

```php
<?php
$a = [1, 2, 3];
$b = ['a', 'b', 'c'];
$c = ['x', 'y', 'z'];

// 将多个数组"打包"成数组的数组
$result = array_map(null, $a, $b, $c);
// [[1, 'a', 'x'], [2, 'b', 'y'], [3, 'c', 'z']]
```

2. **多数组处理时的对齐规则**

```php
<?php
$a = [1, 2, 3, 4];
$b = ['a', 'b'];

// 较短的数组用 null 填充
$result = array_map(null, $a, $b);
// [[1, 'a'], [2, 'b'], [3, null], [4, null]]
```

3. **键名保持**

```php
<?php
$arr = ['foo' => 1, 'bar' => 2];
$result = array_map(fn($n) => $n * 2, $arr);
// ['foo' => 2, 'bar' => 4]  键名保持不变
```

### array_filter 核心要点

1. **无回调时过滤假值**

```php
<?php
$arr = [0, '', null, false, 'hello', 1, [], [0]];
$result = array_filter($arr);
// ['hello', 1, [0]]  只保留"真值"
```

2. **保持原始索引**

```php
<?php
$arr = [1, 2, 3, 4, 5];
$result = array_filter($arr, fn($n) => $n > 2);
// [2 => 3, 3 => 4, 4 => 5]  索引不会重置

// 需要重置索引时
$result = array_values(array_filter($arr, fn($n) => $n > 2));
// [0 => 3, 1 => 4, 2 => 5]
```

3. **回调返回值的布尔转换**

```php
<?php
// 回调返回任何"真值"都会保留元素
$arr = ['a', 'bb', 'ccc'];
$result = array_filter($arr, fn($s) => strlen($s));  // 返回长度
// ['a', 'bb', 'ccc']  全部保留（长度都 > 0）
```

### array_reduce 核心要点

1. **初始值的重要性**

```php
<?php
$arr = [1, 2, 3];

// 没有初始值，第一个元素作为初始值
array_reduce($arr, fn($c, $i) => $c + $i);  // 6

// 空数组没有初始值返回 null
array_reduce([], fn($c, $i) => $c + $i);  // null

// 指定初始值更安全
array_reduce([], fn($c, $i) => $c + $i, 0);  // 0
```

2. **返回值类型灵活**

```php
<?php
// 可以返回任意类型
$users = [
    ['id' => 1, 'name' => '张三'],
    ['id' => 2, 'name' => '李四'],
];

// 返回关联数组
$byId = array_reduce($users, function($carry, $user) {
    $carry[$user['id']] = $user;
    return $carry;
}, []);
```

3. **链式操作的替代**

```php
<?php
// 使用 reduce 实现 map + filter
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * 2;
    }
    return $carry;
}, []);
```

### array_merge 核心要点

1. **与 `+` 运算符的区别**

```php
<?php
$a = ['a' => 1, 'b' => 2];
$b = ['b' => 3, 'c' => 4];

// array_merge: 后者覆盖前者
array_merge($a, $b);  // ['a' => 1, 'b' => 3, 'c' => 4]

// + 运算符: 前者优先，后者被忽略
$a + $b;  // ['a' => 1, 'b' => 2, 'c' => 4]
```

2. **数字键的特殊处理**

```php
<?php
$a = [10 => 'a', 20 => 'b'];
$b = [10 => 'c', 30 => 'd'];

// array_merge 重新索引数字键
array_merge($a, $b);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// + 运算符保留数字键
$a + $b;  // [10 => 'a', 20 => 'b', 30 => 'd']
```

3. **递归合并**

```php
<?php
// array_merge 不递归合并嵌套数组
$a = ['user' => ['name' => '张三', 'age' => 25]];
$b = ['user' => ['email' => 'zhang@example.com']];

array_merge($a, $b);
// ['user' => ['email' => 'zhang@example.com']]  整个被覆盖

// 使用 array_merge_recursive 递归合并
array_merge_recursive($a, $b);
// ['user' => ['name' => '张三', 'age' => 25, 'email' => 'zhang@example.com']]
```

### array_keys 核心要点

1. **严格比较模式**

```php
<?php
$arr = ['a' => 1, 'b' => '1', 'c' => true];

// 宽松比较
array_keys($arr, 1);  // ['a', 'b', 'c']  (1 == '1' == true)

// 严格比较
array_keys($arr, 1, true);  // ['a']  (只有整数 1)
```

2. **检查键是否存在**

```php
<?php
$arr = ['name' => '张三', 'age' => null];

// in_array + array_keys 检查键
in_array('age', array_keys($arr));  // true

// 更高效的方式
array_key_exists('age', $arr);  // true
isset($arr['age']);  // false（值为 null）
```

### usort 核心要点

1. **原地排序，修改原数组**

```php
<?php
$arr = [3, 1, 4, 1, 5];
usort($arr, fn($a, $b) => $a <=> $b);
// $arr 被修改为 [1, 1, 3, 4, 5]
// 注意：索引会被重置
```

2. **稳定性问题**

```php
<?php
// PHP 的 usort 不保证稳定性
// 相等元素的相对顺序可能改变
$arr = [
    ['name' => 'Alice', 'score' => 90],
    ['name' => 'Bob', 'score' => 90],
];

usort($arr, fn($a, $b) => $b['score'] <=> $a['score']);
// Alice 和 Bob 的顺序可能交换
```

3. **相关排序函数**

```php
<?php
// usort: 按值排序，重置索引
// uasort: 按值排序，保持键值关联
// uksort: 按键排序

$arr = ['b' => 2, 'a' => 1, 'c' => 3];

uasort($arr, fn($a, $b) => $a <=> $b);
// ['a' => 1, 'b' => 2, 'c' => 3]  保持键

uksort($arr, fn($a, $b) => $a <=> $b);
// ['a' => 1, 'b' => 2, 'c' => 3]  按键排序
```

## 代码示例

### array_map 实战示例

```php
<?php
// 示例1：数据格式化
$prices = [19.99, 29.50, 99.00, 149.95];

$formatted = array_map(
    fn($price) => sprintf('¥%.2f', $price),
    $prices
);
// ['¥19.99', '¥29.50', '¥99.00', '¥149.95']


// 示例2：提取对象属性
$users = [
    ['id' => 1, 'name' => '张三', 'email' => 'zhang@example.com'],
    ['id' => 2, 'name' => '李四', 'email' => 'li@example.com'],
    ['id' => 3, 'name' => '王五', 'email' => 'wang@example.com'],
];

$names = array_map(fn($user) => $user['name'], $users);
// ['张三', '李四', '王五']

// 等价于 array_column
$names = array_column($users, 'name');


// 示例3：批量数据清洗
$inputs = ['  Hello  ', ' WORLD ', '  PHP  '];

$cleaned = array_map(
    fn($s) => strtolower(trim($s)),
    $inputs
);
// ['hello', 'world', 'php']


// 示例4：并行处理多个数组
$firstNames = ['张', '李', '王'];
$lastNames = ['三', '四', '五'];

$fullNames = array_map(
    fn($first, $last) => $first . $last,
    $firstNames,
    $lastNames
);
// ['张三', '李四', '王五']


// 示例5：类型转换
$strings = ['1', '2', '3', '4', '5'];
$integers = array_map('intval', $strings);
// [1, 2, 3, 4, 5]

// 使用内置函数
$arr = ['hello', 'world', 'php'];
$upper = array_map('strtoupper', $arr);
// ['HELLO', 'WORLD', 'PHP']
```

### array_filter 实战示例

```php
<?php
// 示例1：过滤无效数据
$data = ['', 'hello', null, 'world', 0, false, 'php', []];

// 移除所有假值
$valid = array_filter($data);
// ['hello', 'world', 'php']

// 只保留非空字符串
$strings = array_filter($data, fn($item) => is_string($item) && $item !== '');
// ['hello', 'world', 'php']


// 示例2：筛选符合条件的记录
$products = [
    ['name' => '手机', 'price' => 3999, 'stock' => 100],
    ['name' => '电脑', 'price' => 6999, 'stock' => 0],
    ['name' => '耳机', 'price' => 299, 'stock' => 50],
    ['name' => '平板', 'price' => 4999, 'stock' => 30],
];

// 有库存且价格低于5000的产品
$available = array_filter(
    $products,
    fn($p) => $p['stock'] > 0 && $p['price'] < 5000
);
// [0 => 手机, 2 => 耳机]


// 示例3：按键过滤
$config = [
    'db_host' => 'localhost',
    'db_user' => 'root',
    'db_pass' => 'secret',
    'app_name' => 'MyApp',
    'app_debug' => true,
];

// 只保留 db_ 开头的配置
$dbConfig = array_filter(
    $config,
    fn($key) => str_starts_with($key, 'db_'),
    ARRAY_FILTER_USE_KEY
);
// ['db_host' => 'localhost', 'db_user' => 'root', 'db_pass' => 'secret']


// 示例4：同时使用键和值过滤
$scores = [
    '张三' => 85,
    '李四' => 92,
    '王五' => 58,
    '赵六' => 76,
];

// 找出姓"张"或"李"且及格的学生
$passed = array_filter(
    $scores,
    fn($score, $name) => $score >= 60 && preg_match('/^[张李]/', $name),
    ARRAY_FILTER_USE_BOTH
);
// ['张三' => 85, '李四' => 92]


// 示例5：链式过滤和转换
$numbers = range(-5, 5);

// 过滤正数，然后平方
$result = array_map(
    fn($n) => $n * $n,
    array_filter($numbers, fn($n) => $n > 0)
);
// [1, 4, 9, 16, 25]（注意索引未重置）

// 重置索引
$result = array_values(array_map(
    fn($n) => $n * $n,
    array_filter($numbers, fn($n) => $n > 0)
));
// [0 => 1, 1 => 4, 2 => 9, 3 => 16, 4 => 25]
```

### array_reduce 实战示例

```php
<?php
// 示例1：求和与统计
$numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 求和
$sum = array_reduce($numbers, fn($carry, $n) => $carry + $n, 0);
// 55

// 求积
$product = array_reduce($numbers, fn($carry, $n) => $carry * $n, 1);
// 3628800

// 找最大值
$max = array_reduce($numbers, fn($carry, $n) => max($carry, $n), PHP_INT_MIN);
// 10


// 示例2：数组转换为关联数组
$users = [
    ['id' => 1, 'name' => '张三', 'dept' => '技术部'],
    ['id' => 2, 'name' => '李四', 'dept' => '市场部'],
    ['id' => 3, 'name' => '王五', 'dept' => '技术部'],
];

// 以 id 为键建立索引
$usersById = array_reduce($users, function($carry, $user) {
    $carry[$user['id']] = $user;
    return $carry;
}, []);


// 示例3：分组统计
// 按部门分组
$byDept = array_reduce($users, function($carry, $user) {
    $carry[$user['dept']][] = $user;
    return $carry;
}, []);
// ['技术部' => [...], '市场部' => [...]]


// 示例4：统计出现次数
$words = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];

$counts = array_reduce($words, function($carry, $word) {
    $carry[$word] = ($carry[$word] ?? 0) + 1;
    return $carry;
}, []);
// ['apple' => 3, 'banana' => 2, 'orange' => 1]

// 等价于 array_count_values
$counts = array_count_values($words);


// 示例5：扁平化嵌套数组
$nested = [[1, 2], [3, 4], [5, 6]];

$flat = array_reduce($nested, function($carry, $item) {
    return array_merge($carry, $item);
}, []);
// [1, 2, 3, 4, 5, 6]

// 更简洁的写法
$flat = array_merge(...$nested);


// 示例6：构建复杂数据结构
$items = [
    ['category' => '水果', 'name' => '苹果', 'price' => 5],
    ['category' => '水果', 'name' => '香蕉', 'price' => 3],
    ['category' => '蔬菜', 'name' => '白菜', 'price' => 2],
    ['category' => '蔬菜', 'name' => '萝卜', 'price' => 4],
];

// 按分类汇总总价
$summary = array_reduce($items, function($carry, $item) {
    $cat = $item['category'];
    if (!isset($carry[$cat])) {
        $carry[$cat] = ['count' => 0, 'total' => 0];
    }
    $carry[$cat]['count']++;
    $carry[$cat]['total'] += $item['price'];
    return $carry;
}, []);
// ['水果' => ['count' => 2, 'total' => 8], '蔬菜' => ['count' => 2, 'total' => 6]]


// 示例7：实现 map 和 filter 的组合
$numbers = [1, -2, 3, -4, 5, -6];

// 保留正数并平方
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * $n;
    }
    return $carry;
}, []);
// [1, 9, 25]
```

### array_merge 实战示例

```php
<?php
// 示例1：合并配置
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


// 示例2：收集多个来源的数据
$localUsers = [
    ['id' => 1, 'name' => '张三'],
    ['id' => 2, 'name' => '李四'],
];

$remoteUsers = [
    ['id' => 3, 'name' => '王五'],
    ['id' => 4, 'name' => '赵六'],
];

$allUsers = array_merge($localUsers, $remoteUsers);
// 包含所有用户，索引重新编号


// 示例3：展开嵌套数组
$groups = [
    ['admin', 'moderator'],
    ['editor', 'author'],
    ['subscriber'],
];

$allRoles = array_merge(...$groups);
// ['admin', 'moderator', 'editor', 'author', 'subscriber']


// 示例4：条件性合并
$basePermissions = ['read', 'write'];
$isAdmin = true;

$permissions = array_merge(
    $basePermissions,
    $isAdmin ? ['delete', 'admin'] : []
);
// ['read', 'write', 'delete', 'admin']


// 示例5：与 array_unique 配合去重
$arr1 = [1, 2, 3, 4];
$arr2 = [3, 4, 5, 6];

$unique = array_unique(array_merge($arr1, $arr2));
// [1, 2, 3, 4, 5, 6]


// 示例6：深度合并（需要自定义）
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

### array_keys 实战示例

```php
<?php
// 示例1：获取所有键名
$person = [
    'name' => '张三',
    'age' => 28,
    'city' => '北京',
    'job' => '程序员',
];

$keys = array_keys($person);
// ['name', 'age', 'city', 'job']


// 示例2：查找特定值的键
$scores = [
    '张三' => 85,
    '李四' => 92,
    '王五' => 85,
    '赵六' => 78,
];

// 找出得分为 85 的所有学生
$students = array_keys($scores, 85);
// ['张三', '王五']


// 示例3：验证数据结构
$required = ['name', 'email', 'password'];
$input = ['name' => 'test', 'email' => 'test@example.com'];

$missing = array_diff($required, array_keys($input));
// ['password']

if (!empty($missing)) {
    throw new Exception('缺少必填字段: ' . implode(', ', $missing));
}


// 示例4：配合 array_combine
$keys = ['id', 'name', 'email'];
$values = [1, '张三', 'zhang@example.com'];

$user = array_combine($keys, $values);
// ['id' => 1, 'name' => '张三', 'email' => 'zhang@example.com']


// 示例5：反转键值
$arr = ['a' => 1, 'b' => 2, 'c' => 3];

// 使用 array_keys 和 array_values
$flipped = array_combine(
    array_values($arr),
    array_keys($arr)
);
// [1 => 'a', 2 => 'b', 3 => 'c']

// 等价于 array_flip
$flipped = array_flip($arr);


// 示例6：随机选取键
$options = [
    'A' => '选项A',
    'B' => '选项B',
    'C' => '选项C',
    'D' => '选项D',
];

$keys = array_keys($options);
$randomKey = $keys[array_rand($keys)];
$randomValue = $options[$randomKey];
```

### usort 实战示例

```php
<?php
// 示例1：基本数字排序
$numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// 升序
usort($numbers, fn($a, $b) => $a <=> $b);
// [1, 1, 2, 3, 4, 5, 6, 9]

// 降序
usort($numbers, fn($a, $b) => $b <=> $a);
// [9, 6, 5, 4, 3, 2, 1, 1]


// 示例2：按对象属性排序
$products = [
    ['name' => '手机', 'price' => 3999, 'sales' => 1000],
    ['name' => '电脑', 'price' => 6999, 'sales' => 500],
    ['name' => '耳机', 'price' => 299, 'sales' => 3000],
    ['name' => '平板', 'price' => 4999, 'sales' => 800],
];

// 按价格升序
usort($products, fn($a, $b) => $a['price'] <=> $b['price']);

// 按销量降序
usort($products, fn($a, $b) => $b['sales'] <=> $a['sales']);


// 示例3：多字段排序
$students = [
    ['name' => '张三', 'grade' => 3, 'score' => 85],
    ['name' => '李四', 'grade' => 2, 'score' => 92],
    ['name' => '王五', 'grade' => 3, 'score' => 92],
    ['name' => '赵六', 'grade' => 2, 'score' => 85],
];

// 先按年级升序，再按成绩降序
usort($students, function($a, $b) {
    // 先比较年级
    $gradeCompare = $a['grade'] <=> $b['grade'];
    if ($gradeCompare !== 0) {
        return $gradeCompare;
    }
    // 年级相同时，按成绩降序
    return $b['score'] <=> $a['score'];
});


// 示例4：自然排序
$files = ['img12.png', 'img2.png', 'img1.png', 'img10.png'];

// 字符串排序
usort($files, fn($a, $b) => $a <=> $b);
// ['img1.png', 'img10.png', 'img12.png', 'img2.png']

// 自然排序
usort($files, fn($a, $b) => strnatcmp($a, $b));
// ['img1.png', 'img2.png', 'img10.png', 'img12.png']


// 示例5：按字符串长度排序
$words = ['apple', 'pie', 'strawberry', 'fig'];

usort($words, fn($a, $b) => strlen($a) <=> strlen($b));
// ['fig', 'pie', 'apple', 'strawberry']


// 示例6：按日期排序
$events = [
    ['title' => '会议A', 'date' => '2024-03-15'],
    ['title' => '会议B', 'date' => '2024-01-20'],
    ['title' => '会议C', 'date' => '2024-02-10'],
];

usort($events, fn($a, $b) => strtotime($a['date']) <=> strtotime($b['date']));
// 按日期升序排列


// 示例7：保持键值关联（使用 uasort）
$scores = [
    '张三' => 85,
    '李四' => 92,
    '王五' => 78,
];

uasort($scores, fn($a, $b) => $b <=> $a);
// ['李四' => 92, '张三' => 85, '王五' => 78]  保持键值关联


// 示例8：复杂排序逻辑
$tasks = [
    ['title' => '任务A', 'priority' => 'high', 'due' => '2024-01-15'],
    ['title' => '任务B', 'priority' => 'low', 'due' => '2024-01-10'],
    ['title' => '任务C', 'priority' => 'medium', 'due' => '2024-01-15'],
    ['title' => '任务D', 'priority' => 'high', 'due' => '2024-01-10'],
];

$priorityOrder = ['high' => 1, 'medium' => 2, 'low' => 3];

usort($tasks, function($a, $b) use ($priorityOrder) {
    // 先按优先级排序
    $priorityCompare = $priorityOrder[$a['priority']] <=> $priorityOrder[$b['priority']];
    if ($priorityCompare !== 0) {
        return $priorityCompare;
    }
    // 优先级相同时，按截止日期排序
    return strtotime($a['due']) <=> strtotime($b['due']);
});
// 高优先级且截止日期早的排在前面
```

## 最佳实践

### 优先使用内置函数

```php
<?php
// 不推荐：手动循环
$result = [];
foreach ($arr as $item) {
    $result[] = strtoupper($item);
}

// 推荐：使用 array_map
$result = array_map('strtoupper', $arr);
```

### 合理使用箭头函数

```php
<?php
// PHP 7.4+ 箭头函数更简洁
$squared = array_map(fn($n) => $n * $n, $numbers);

// 但复杂逻辑仍用传统闭包
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

### 链式操作时注意索引

```php
<?php
// 过滤后索引不连续
$result = array_filter([1, 2, 3, 4, 5], fn($n) => $n > 2);
// [2 => 3, 3 => 4, 4 => 5]

// 需要连续索引时使用 array_values
$result = array_values(array_filter([1, 2, 3, 4, 5], fn($n) => $n > 2));
// [0 => 3, 1 => 4, 2 => 5]
```

### reduce 时始终提供初始值

```php
<?php
// 不推荐：可能导致空数组时返回 null
$sum = array_reduce($numbers, fn($c, $n) => $c + $n);

// 推荐：提供初始值
$sum = array_reduce($numbers, fn($c, $n) => $c + $n, 0);
```

### 大数据量时考虑性能

```php
<?php
// 对于大数组，考虑使用生成器或分批处理
function processInBatches(array $items, int $batchSize, callable $processor): void
{
    $batches = array_chunk($items, $batchSize);
    foreach ($batches as $batch) {
        $processor($batch);
    }
}
```

### usort 排序的稳定性

```php
<?php
// PHP 8.0+ usort 是稳定的
// PHP 7.x 需要手动保证稳定性
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

## 常见陷阱

### array_map 回调参数数量

```php
<?php
// 错误：回调期望2个参数，但只提供1个数组
$result = array_map(fn($a, $b) => $a + $b, [1, 2, 3]);  // 警告

// 正确：提供两个数组
$result = array_map(fn($a, $b) => $a + $b, [1, 2, 3], [10, 20, 30]);
```

### array_filter 保持索引

```php
<?php
$arr = [1, 2, 3, 4, 5];
$filtered = array_filter($arr, fn($n) => $n > 2);

// 错误预期：[3, 4, 5]
// 实际结果：[2 => 3, 3 => 4, 4 => 5]

// JSON 编码时会变成对象
json_encode($filtered);  // {"2":3,"3":4,"4":5}

// 解决方案
$filtered = array_values(array_filter($arr, fn($n) => $n > 2));
json_encode($filtered);  // [3,4,5]
```

### array_merge 数字键重排

```php
<?php
$arr1 = [10 => 'a', 20 => 'b'];
$arr2 = [10 => 'c', 30 => 'd'];

// 错误预期：保留原键
$merged = array_merge($arr1, $arr2);
// 实际结果：[0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']

// 保留键使用 + 运算符
$merged = $arr1 + $arr2;
// [10 => 'a', 20 => 'b', 30 => 'd']  注意：相同键取第一个
```

### usort 修改原数组

```php
<?php
$original = [3, 1, 4, 1, 5];
$sorted = $original;  // 浅拷贝

usort($sorted, fn($a, $b) => $a <=> $b);

// $original 仍为 [3, 1, 4, 1, 5]
// $sorted 变为 [1, 1, 3, 4, 5]

// 注意：对于包含对象的数组，浅拷贝不够
$users = [/* 包含对象 */];
$sortedUsers = $users;  // 对象是引用
```

### array_reduce 初始值类型

```php
<?php
// 初始值类型决定了结果类型
$numbers = [1, 2, 3];

// 期望返回字符串
$result = array_reduce($numbers, fn($c, $n) => $c . $n, '');
// 结果: "123"

// 期望返回数组
$result = array_reduce($numbers, function($c, $n) {
    $c[] = $n * 2;
    return $c;
}, []);
// 结果: [2, 4, 6]
```

### 空数组处理

```php
<?php
$empty = [];

// array_reduce 空数组返回初始值
array_reduce($empty, fn($c, $n) => $c + $n, 0);  // 0
array_reduce($empty, fn($c, $n) => $c + $n);     // null

// array_merge 空数组正常
array_merge($empty, [1, 2, 3]);  // [1, 2, 3]
array_merge();  // []

// array_filter 空数组返回空数组
array_filter($empty, fn($n) => true);  // []

// usort 空数组正常（但无意义）
usort($empty, fn($a, $b) => $a <=> $b);  // true
```

## 性能考量

### 时间复杂度分析

| 函数 | 时间复杂度 | 说明 |
|------|------------|------|
| `array_map` | O(n) | 线性遍历，n 为元素数量 |
| `array_filter` | O(n) | 线性遍历 |
| `array_reduce` | O(n) | 线性遍历 |
| `array_merge` | O(n+m) | n 和 m 为两个数组的长度 |
| `array_keys` | O(n) | 线性遍历 |
| `usort` | O(n log n) | 快速排序，最坏 O(n^2) |

### 性能对比测试

```php
<?php
$size = 100000;
$arr = range(1, $size);

// 测试1：array_map vs foreach
$start = microtime(true);
$result = array_map(fn($n) => $n * 2, $arr);
$mapTime = microtime(true) - $start;

$start = microtime(true);
$result = [];
foreach ($arr as $n) {
    $result[] = $n * 2;
}
$forTime = microtime(true) - $start;

// 通常 array_map 略慢于 foreach，但差距很小


// 测试2：查找元素
$needle = 50000;

// in_array O(n)
$start = microtime(true);
$found = in_array($needle, $arr);
$inArrayTime = microtime(true) - $start;

// isset (翻转数组后) O(1)
$flipped = array_flip($arr);
$start = microtime(true);
$found = isset($flipped[$needle]);
$issetTime = microtime(true) - $start;

// isset 快几个数量级
```

### 优化建议

**1. 避免嵌套 array_map/filter**

```php
<?php
// 不推荐：多次遍历
$result = array_map(
    fn($n) => $n * 2,
    array_filter($numbers, fn($n) => $n > 0)
);

// 推荐：使用 reduce 一次遍历
$result = array_reduce($numbers, function($carry, $n) {
    if ($n > 0) {
        $carry[] = $n * 2;
    }
    return $carry;
}, []);
```

**2. 大数组使用生成器**

```php
<?php
// 不推荐：一次性加载所有数据
$result = array_map(fn($row) => processRow($row), $hugeArray);

// 推荐：使用生成器
function processRows(array $rows): Generator {
    foreach ($rows as $row) {
        yield processRow($row);
    }
}
```

**3. 查找优化**

```php
<?php
$largeArray = range(1, 1000000);

// 慢：O(n) 每次查找
foreach ($queries as $query) {
    if (in_array($query, $largeArray)) {
        // ...
    }
}

// 快：O(1) 每次查找
$lookup = array_flip($largeArray);
foreach ($queries as $query) {
    if (isset($lookup[$query])) {
        // ...
    }
}
```

**4. 减少函数调用开销**

```php
<?php
// 内联简单逻辑
$doubled = [];
foreach ($numbers as $n) {
    $doubled[] = $n * 2;
}

// 而不是
$doubled = array_map(fn($n) => $n * 2, $numbers);

// 但对于复杂逻辑，array_map 更清晰
$processed = array_map(fn($item) => complexProcess($item), $items);
```

## 实战场景

### 场景1：API 数据转换

```php
<?php
// 从 API 获取的原始数据
$apiResponse = [
    ['user_id' => 1, 'user_name' => 'zhang_san', 'user_email' => 'zhang@example.com'],
    ['user_id' => 2, 'user_name' => 'li_si', 'user_email' => 'li@example.com'],
    ['user_id' => 3, 'user_name' => 'wang_wu', 'user_email' => 'wang@example.com'],
];

// 转换为驼峰命名并添加额外字段
$users = array_map(function($user) {
    return [
        'id' => $user['user_id'],
        'name' => ucwords(str_replace('_', ' ', $user['user_name'])),
        'email' => $user['user_email'],
        'createdAt' => date('Y-m-d H:i:s'),
    ];
}, $apiResponse);
```

### 场景2：表单数据验证

```php
<?php
$input = [
    'name' => '  张三  ',
    'email' => 'invalid-email',
    'age' => '25',
    'role' => 'admin',
];

$required = ['name', 'email', 'age'];
$allowedRoles = ['user', 'editor', 'admin'];

// 检查必填字段
$missing = array_filter($required, fn($field) => empty($input[$field] ?? ''));
if ($missing) {
    throw new Exception('缺少字段: ' . implode(', ', $missing));
}

// 清理和验证数据
$validated = array_reduce(array_keys($input), function($carry, $key) use ($input, $allowedRoles) {
    $value = trim($input[$key]);

    switch ($key) {
        case 'email':
            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('邮箱格式无效');
            }
            break;
        case 'age':
            $value = (int) $value;
            if ($value < 0 || $value > 150) {
                throw new Exception('年龄无效');
            }
            break;
        case 'role':
            if (!in_array($value, $allowedRoles)) {
                throw new Exception('角色无效');
            }
            break;
    }

    $carry[$key] = $value;
    return $carry;
}, []);
```

### 场景3：购物车计算

```php
<?php
$cart = [
    ['product_id' => 1, 'name' => '手机', 'price' => 3999, 'quantity' => 1],
    ['product_id' => 2, 'name' => '保护壳', 'price' => 99, 'quantity' => 2],
    ['product_id' => 3, 'name' => '充电器', 'price' => 149, 'quantity' => 1],
];

// 计算每项小计
$itemsWithSubtotal = array_map(function($item) {
    return array_merge($item, [
        'subtotal' => $item['price'] * $item['quantity']
    ]);
}, $cart);

// 计算总金额
$total = array_reduce($itemsWithSubtotal, fn($sum, $item) => $sum + $item['subtotal'], 0);

// 过滤出高价商品（单价超过100）
$expensiveItems = array_filter($cart, fn($item) => $item['price'] > 100);

// 按价格排序
usort($cart, fn($a, $b) => $b['price'] <=> $a['price']);

// 生成订单摘要
$summary = [
    'items' => $itemsWithSubtotal,
    'itemCount' => array_reduce($cart, fn($sum, $item) => $sum + $item['quantity'], 0),
    'subtotal' => $total,
    'tax' => $total * 0.13,
    'total' => $total * 1.13,
];
```

### 场景4：日志分析

```php
<?php
$logs = [
    ['time' => '2024-01-15 10:30:00', 'level' => 'ERROR', 'message' => '数据库连接失败'],
    ['time' => '2024-01-15 10:31:00', 'level' => 'INFO', 'message' => '重试连接成功'],
    ['time' => '2024-01-15 10:32:00', 'level' => 'WARNING', 'message' => '响应时间过长'],
    ['time' => '2024-01-15 10:33:00', 'level' => 'ERROR', 'message' => '请求超时'],
    ['time' => '2024-01-15 10:34:00', 'level' => 'DEBUG', 'message' => '缓存命中'],
];

// 过滤错误日志
$errors = array_filter($logs, fn($log) => $log['level'] === 'ERROR');

// 按级别分组统计
$countByLevel = array_reduce($logs, function($carry, $log) {
    $level = $log['level'];
    $carry[$level] = ($carry[$level] ?? 0) + 1;
    return $carry;
}, []);

// 提取所有错误消息
$errorMessages = array_map(
    fn($log) => $log['message'],
    array_filter($logs, fn($log) => $log['level'] === 'ERROR')
);

// 按时间排序（最新的在前）
usort($logs, fn($a, $b) => strtotime($b['time']) <=> strtotime($a['time']));
```

### 场景5：配置管理

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

// 深度合并配置
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

// 获取所有配置键路径
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

## 面试要点

### 常见面试题

**1. array_map 和 array_walk 的区别？**

```php
<?php
$arr = [1, 2, 3];

// array_map: 返回新数组，不修改原数组
$result = array_map(fn($n) => $n * 2, $arr);
// $arr 仍为 [1, 2, 3]
// $result 为 [2, 4, 6]

// array_walk: 修改原数组，返回布尔值
array_walk($arr, function(&$n) { $n *= 2; });
// $arr 变为 [2, 4, 6]
```

**2. 如何实现数组去重并保持顺序？**

```php
<?php
$arr = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];

// 方法1：array_unique（保持第一次出现的索引）
$unique = array_values(array_unique($arr));

// 方法2：array_flip 两次（更快）
$unique = array_keys(array_flip($arr));

// 方法3：array_reduce
$unique = array_reduce($arr, function($carry, $item) {
    if (!in_array($item, $carry)) {
        $carry[] = $item;
    }
    return $carry;
}, []);
```

**3. array_merge 和 `+` 运算符的区别？**

```php
<?php
$a = ['x' => 1, 'y' => 2];
$b = ['y' => 3, 'z' => 4];

// array_merge: 后者覆盖前者
array_merge($a, $b);  // ['x' => 1, 'y' => 3, 'z' => 4]

// + 运算符: 前者优先
$a + $b;  // ['x' => 1, 'y' => 2, 'z' => 4]

// 数字键处理
$c = [0 => 'a', 1 => 'b'];
$d = [0 => 'c', 1 => 'd'];

array_merge($c, $d);  // [0 => 'a', 1 => 'b', 2 => 'c', 3 => 'd']（重新索引）
$c + $d;              // [0 => 'a', 1 => 'b']（保留原键，忽略重复）
```

**4. 如何用 reduce 实现 map 和 filter？**

```php
<?php
// 实现 array_map
function myMap(array $arr, callable $fn): array {
    return array_reduce($arr, function($carry, $item) use ($fn) {
        $carry[] = $fn($item);
        return $carry;
    }, []);
}

// 实现 array_filter
function myFilter(array $arr, callable $fn): array {
    return array_reduce($arr, function($carry, $item) use ($fn) {
        if ($fn($item)) {
            $carry[] = $item;
        }
        return $carry;
    }, []);
}
```

**5. usort 排序是否稳定？**

```php
<?php
// PHP 8.0+: usort 是稳定的
// PHP 7.x: usort 不稳定

// 稳定排序意味着相等元素保持原始顺序
$arr = [
    ['name' => 'Alice', 'age' => 30],
    ['name' => 'Bob', 'age' => 30],
];

usort($arr, fn($a, $b) => $a['age'] <=> $b['age']);
// PHP 8+: Alice 始终在 Bob 前面
// PHP 7: 顺序可能改变
```

### 代码实现题

**实现一个 array_group_by 函数：**

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

// 使用
$users = [
    ['name' => '张三', 'dept' => '技术部'],
    ['name' => '李四', 'dept' => '市场部'],
    ['name' => '王五', 'dept' => '技术部'],
];

$grouped = array_group_by($users, 'dept');
// ['技术部' => [...], '市场部' => [...]]
```

**实现一个 array_pluck 函数：**

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

// 使用
$users = [
    ['id' => 1, 'name' => '张三'],
    ['id' => 2, 'name' => '李四'],
];

array_pluck($users, 'name');           // ['张三', '李四']
array_pluck($users, 'name', 'id');     // [1 => '张三', 2 => '李四']
```

## 延伸阅读

### 官方文档

- [PHP 数组函数参考手册](https://www.php.net/manual/zh/ref.array.php)
- [array_map 函数文档](https://www.php.net/manual/zh/function.array-map.php)
- [array_filter 函数文档](https://www.php.net/manual/zh/function.array-filter.php)
- [array_reduce 函数文档](https://www.php.net/manual/zh/function.array-reduce.php)

### 相关概念

- **函数式编程**：map、filter、reduce 是函数式编程的核心概念
- **高阶函数**：接受函数作为参数或返回函数的函数
- **闭包**：PHP 中的匿名函数和箭头函数
- **集合操作**：Laravel Collection 类提供了更丰富的集合操作

### 推荐资源

- 《PHP 7 编程实战》相关章节
- Laravel Collection 源码分析
- Lodash/Ramda JavaScript 库（相同理念的 JS 实现）
- 函数式编程入门教程

### 第三方库

- **Laravel Collection**：流畅的集合操作 API
- **Illuminate Support**：可独立使用的集合类
- **nikic/iter**：PHP 迭代器库
- **lstrojny/functional-php**：函数式编程工具库

## 总结

PHP 的数组函数是日常开发中不可或缺的工具。通过本文的学习，你应该掌握了：

1. **array_map**：数据转换、格式化的首选
2. **array_filter**：数据筛选、清洗的利器
3. **array_reduce**：复杂聚合操作的万能工具
4. **array_merge**：数组合并的标准方式
5. **array_keys**：键操作的基础函数
6. **usort**：灵活排序的解决方案

掌握这些函数不仅能写出更简洁、更易读的代码，也是 PHP 进阶和面试的必备技能。建议在实际项目中多加练习，逐步形成函数式编程的思维方式。
