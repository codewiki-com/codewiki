---
title: PHP 语言基础
description: 深入理解 PHP 变量、数据类型、运算符与控制结构
track: php
section: basics
difficulty: beginner
tags:
  - PHP
  - 基础
  - 变量
  - 数组
status: imported
origin: old/src/content/docs/php/fundamentals.zh.md
divergence: 0.139
issues: []
legacy:
  category: PHP
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

PHP (Hypertext Preprocessor) 是一种广泛使用的开源服务器端脚本语言,特别适合 Web 开发。本文将深入介绍 PHP 的核心概念和基础语法。

## 变量与数据类型

### 变量声明

PHP 中的变量以美元符号 `$` 开头,无需显式声明类型。变量名区分大小写。

```php
<?php
$name = "张三";
$age = 25;
$isStudent = true;
$salary = 5000.50;

echo "姓名: $name, 年龄: $age\n";
?>
```

### 变量命名规则

- 必须以字母或下划线开头
- 只能包含字母、数字和下划线
- 区分大小写 (`$name` 和 `$Name` 是不同的变量)

```php
<?php
$userName = "有效";
$_private = "有效";
$user_name = "有效";
// $2name = "无效"; // 不能以数字开头
// $user-name = "无效"; // 不能包含连字符
?>
```

### 基本数据类型

PHP 支持多种数据类型:

#### 字符串 (String)

```php
<?php
$singleQuote = '单引号字符串';
$doubleQuote = "双引号字符串";
$name = "李四";
$greeting = "你好, $name!"; // 变量解析
$literal = '你好, $name!'; // 不解析变量

echo $greeting; // 输出: 你好, 李四!
echo "\n";
echo $literal;  // 输出: 你好, $name!
?>
```

#### 整数 (Integer)

```php
<?php
$decimal = 123;      // 十进制
$octal = 0123;       // 八进制
$hex = 0x1A;         // 十六进制
$binary = 0b1111;    // 二进制

echo "十进制: $decimal\n";
echo "八进制: $octal (实际值: " . $octal . ")\n";
echo "十六进制: $hex (实际值: " . $hex . ")\n";
?>
```

#### 浮点数 (Float/Double)

```php
<?php
$price = 19.99;
$scientific = 1.5e3; // 1500
$negative = -0.5;

echo "价格: $price\n";
echo "科学计数法: $scientific\n";
?>
```

#### 布尔值 (Boolean)

```php
<?php
$isTrue = true;
$isFalse = false;

if ($isTrue) {
    echo "这是真值\n";
}

// 假值: false, 0, 0.0, "", "0", null, []
$zero = 0;
if (!$zero) {
    echo "0 被视为假值\n";
}
?>
```

#### 数组 (Array)

```php
<?php
// 索引数组
$fruits = array("苹果", "香蕉", "橙子");
$colors = ["红色", "绿色", "蓝色"]; // 短语法

// 关联数组
$person = array(
    "name" => "王五",
    "age" => 30,
    "city" => "北京"
);

echo $fruits[0] . "\n";  // 苹果
echo $person["name"] . "\n"; // 王五
?>
```

#### NULL

```php
<?php
$empty = null;
$undefined;

var_dump($empty);     // NULL
var_dump($undefined); // NULL (未初始化变量)

// 检查 null
if (is_null($empty)) {
    echo "变量为 null\n";
}
?>
```

### 类型转换

```php
<?php
// 自动类型转换
$num = "123";
$result = $num + 100; // 字符串自动转为整数
echo $result . "\n";  // 223

// 强制类型转换
$str = "45.67";
$int = (int)$str;      // 45
$float = (float)$str;  // 45.67
$bool = (bool)$str;    // true

echo "整数: $int\n";
echo "浮点: $float\n";
echo "布尔: " . ($bool ? "true" : "false") . "\n";
?>
```

### 变量作用域

```php
<?php
$global = "全局变量";

function testScope() {
    $local = "局部变量";
    global $global; // 访问全局变量

    echo $global . "\n";
    echo $local . "\n";
}

testScope();
// echo $local; // 错误: 在函数外无法访问局部变量

// 静态变量
function counter() {
    static $count = 0;
    $count++;
    echo "计数: $count\n";
}

counter(); // 1
counter(); // 2
counter(); // 3
?>
```

## 运算符

### 算术运算符

```php
<?php
$a = 10;
$b = 3;

echo "加法: " . ($a + $b) . "\n";    // 13
echo "减法: " . ($a - $b) . "\n";    // 7
echo "乘法: " . ($a * $b) . "\n";    // 30
echo "除法: " . ($a / $b) . "\n";    // 3.333...
echo "取模: " . ($a % $b) . "\n";    // 1
echo "幂运算: " . ($a ** $b) . "\n"; // 1000

// 自增自减
$x = 5;
echo "x++: " . ($x++) . "\n"; // 5 (先使用后加)
echo "x: $x\n";               // 6
echo "++x: " . (++$x) . "\n"; // 7 (先加后使用)
?>
```

### 赋值运算符

```php
<?php
$x = 10;
$x += 5;  // $x = $x + 5;  结果: 15
$x -= 3;  // $x = $x - 3;  结果: 12
$x *= 2;  // $x = $x * 2;  结果: 24
$x /= 4;  // $x = $x / 4;  结果: 6
$x %= 4;  // $x = $x % 4;  结果: 2

echo "最终结果: $x\n";

// 字符串连接
$str = "Hello";
$str .= " World"; // $str = $str . " World"
echo $str . "\n"; // Hello World
?>
```

### 比较运算符

```php
<?php
$a = 5;
$b = "5";
$c = 10;

// 相等比较
var_dump($a == $b);  // true (值相等)
var_dump($a === $b); // false (类型不同)
var_dump($a != $c);  // true
var_dump($a !== $b); // true (类型不同)

// 大小比较
var_dump($a < $c);   // true
var_dump($a > $c);   // false
var_dump($a <= 5);   // true
var_dump($a >= 5);   // true

// 太空船运算符 (PHP 7+)
echo ($a <=> $c) . "\n"; // -1 (小于)
echo ($a <=> $a) . "\n"; // 0 (等于)
echo ($c <=> $a) . "\n"; // 1 (大于)
?>
```

### 逻辑运算符

```php
<?php
$x = true;
$y = false;

// AND 运算
var_dump($x && $y);  // false
var_dump($x and $y); // false

// OR 运算
var_dump($x || $y);  // true
var_dump($x or $y);  // true

// NOT 运算
var_dump(!$x);       // false

// XOR 运算
var_dump($x xor $y); // true

// 短路求值
function test() {
    echo "函数被调用\n";
    return true;
}

false && test(); // test() 不会被调用
true || test();  // test() 不会被调用
?>
```

### 字符串运算符

```php
<?php
$first = "Hello";
$last = "World";

// 连接运算符
$full = $first . " " . $last;
echo $full . "\n"; // Hello World

// 连接赋值
$greeting = "你好";
$greeting .= ", 世界!";
echo $greeting . "\n"; // 你好, 世界!
?>
```

### 三元运算符

```php
<?php
$age = 20;
$status = ($age >= 18) ? "成年" : "未成年";
echo $status . "\n"; // 成年

// NULL 合并运算符 (PHP 7+)
$username = $_GET['user'] ?? '游客';
echo $username . "\n";

// NULL 合并赋值运算符 (PHP 7.4+)
$config = [];
$config['timeout'] ??= 30; // 如果不存在则赋值
echo $config['timeout'] . "\n"; // 30
?>
```

## 控制结构

### 条件语句

#### if-else 语句

```php
<?php
$score = 85;

if ($score >= 90) {
    echo "优秀\n";
} elseif ($score >= 80) {
    echo "良好\n";
} elseif ($score >= 60) {
    echo "及格\n";
} else {
    echo "不及格\n";
}

// 单行 if
if ($score >= 60) echo "通过考试\n";
?>
```

#### switch 语句

```php
<?php
$day = "星期一";

switch ($day) {
    case "星期一":
    case "星期二":
    case "星期三":
    case "星期四":
    case "星期五":
        echo "工作日\n";
        break;
    case "星期六":
    case "星期日":
        echo "周末\n";
        break;
    default:
        echo "无效的日期\n";
}

// match 表达式 (PHP 8+)
$result = match ($day) {
    "星期一", "星期二", "星期三", "星期四", "星期五" => "工作日",
    "星期六", "星期日" => "周末",
    default => "无效"
};
echo $result . "\n";
?>
```

### 循环语句

#### while 循环

```php
<?php
$i = 1;
while ($i <= 5) {
    echo "循环 $i\n";
    $i++;
}

// do-while 循环
$j = 1;
do {
    echo "至少执行一次: $j\n";
    $j++;
} while ($j <= 3);
?>
```

#### for 循环

```php
<?php
// 基本 for 循环
for ($i = 1; $i <= 5; $i++) {
    echo "数字: $i\n";
}

// 多变量 for 循环
for ($i = 0, $j = 10; $i < 5; $i++, $j--) {
    echo "i=$i, j=$j\n";
}

// 嵌套循环 - 打印乘法表
for ($i = 1; $i <= 3; $i++) {
    for ($j = 1; $j <= 3; $j++) {
        echo "$i x $j = " . ($i * $j) . "\t";
    }
    echo "\n";
}
?>
```

#### foreach 循环

```php
<?php
// 遍历索引数组
$fruits = ["苹果", "香蕉", "橙子"];
foreach ($fruits as $fruit) {
    echo "$fruit\n";
}

// 遍历索引数组(带索引)
foreach ($fruits as $index => $fruit) {
    echo "$index: $fruit\n";
}

// 遍历关联数组
$person = [
    "name" => "赵六",
    "age" => 28,
    "city" => "上海"
];

foreach ($person as $key => $value) {
    echo "$key: $value\n";
}

// 引用修改数组元素
$numbers = [1, 2, 3, 4, 5];
foreach ($numbers as &$num) {
    $num *= 2;
}
unset($num); // 解除引用
print_r($numbers); // [2, 4, 6, 8, 10]
?>
```

### 循环控制

```php
<?php
// break - 跳出循环
for ($i = 1; $i <= 10; $i++) {
    if ($i == 5) {
        break; // 循环到 4 就停止
    }
    echo "$i ";
}
echo "\n";

// continue - 跳过当前迭代
for ($i = 1; $i <= 5; $i++) {
    if ($i == 3) {
        continue; // 跳过 3
    }
    echo "$i "; // 输出: 1 2 4 5
}
echo "\n";

// 嵌套循环中的 break/continue
for ($i = 1; $i <= 3; $i++) {
    for ($j = 1; $j <= 3; $j++) {
        if ($j == 2) {
            break 2; // 跳出两层循环
        }
        echo "($i, $j) ";
    }
}
?>
```

## 函数

### 函数定义与调用

```php
<?php
// 基本函数
function greet($name) {
    echo "你好, $name!\n";
}

greet("小明"); // 你好, 小明!

// 返回值
function add($a, $b) {
    return $a + $b;
}

$sum = add(5, 3);
echo "和: $sum\n"; // 8
?>
```

### 参数类型

```php
<?php
// 默认参数
function makeGreeting($name, $title = "先生") {
    return "你好, $title $name";
}

echo makeGreeting("张三") . "\n";        // 你好, 先生 张三
echo makeGreeting("李四", "女士") . "\n"; // 你好, 女士 李四

// 可变参数 (PHP 5.6+)
function sum(...$numbers) {
    $total = 0;
    foreach ($numbers as $num) {
        $total += $num;
    }
    return $total;
}

echo sum(1, 2, 3, 4, 5) . "\n"; // 15

// 类型声明 (PHP 7+)
function divide(int $a, int $b): float {
    return $a / $b;
}

echo divide(10, 3) . "\n"; // 3.333...
?>
```

### 引用传递

```php
<?php
// 值传递
function increment($num) {
    $num++;
}

$x = 5;
increment($x);
echo $x . "\n"; // 5 (未改变)

// 引用传递
function incrementByRef(&$num) {
    $num++;
}

$y = 5;
incrementByRef($y);
echo $y . "\n"; // 6 (已改变)
?>
```

### 匿名函数与闭包

```php
<?php
// 匿名函数
$square = function($n) {
    return $n * $n;
};

echo $square(5) . "\n"; // 25

// 闭包
function createMultiplier($factor) {
    return function($num) use ($factor) {
        return $num * $factor;
    };
}

$double = createMultiplier(2);
$triple = createMultiplier(3);

echo $double(5) . "\n"; // 10
echo $triple(5) . "\n"; // 15

// 箭头函数 (PHP 7.4+)
$add = fn($a, $b) => $a + $b;
echo $add(3, 7) . "\n"; // 10
?>
```

### 内置函数示例

```php
<?php
// 数学函数
echo abs(-5) . "\n";        // 5
echo ceil(4.3) . "\n";      // 5
echo floor(4.7) . "\n";     // 4
echo round(4.5) . "\n";     // 5
echo max(1, 5, 3) . "\n";   // 5
echo min(1, 5, 3) . "\n";   // 1
echo rand(1, 100) . "\n";   // 随机数

// 字符串函数
echo strlen("你好") . "\n";           // 6 (字节数)
echo mb_strlen("你好") . "\n";       // 2 (字符数)
echo strtoupper("hello") . "\n";    // HELLO
echo strtolower("WORLD") . "\n";    // world
?>
```

## 数组

### 创建数组

```php
<?php
// 索引数组
$colors = array("红", "绿", "蓝");
$fruits = ["苹果", "香蕉", "橙子"];

// 关联数组
$user = array(
    "id" => 1,
    "name" => "用户1",
    "email" => "user@example.com"
);

// 多维数组
$matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

echo $matrix[1][1] . "\n"; // 5
?>
```

### 数组操作

```php
<?php
$fruits = ["苹果", "香蕉"];

// 添加元素
$fruits[] = "橙子";              // 末尾添加
array_push($fruits, "葡萄");     // 末尾添加
array_unshift($fruits, "草莓");  // 开头添加

print_r($fruits);

// 删除元素
$last = array_pop($fruits);      // 删除末尾
$first = array_shift($fruits);   // 删除开头

echo "删除的元素: $first, $last\n";

// 删除指定元素
unset($fruits[1]); // 删除索引1的元素
print_r($fruits);
?>
```

### 数组函数

```php
<?php
$numbers = [3, 1, 4, 1, 5, 9, 2, 6];

// 排序
sort($numbers);        // 升序排序
print_r($numbers);

rsort($numbers);       // 降序排序
print_r($numbers);

// 关联数组排序
$ages = ["张三" => 25, "李四" => 30, "王五" => 20];
asort($ages);          // 按值排序
print_r($ages);

ksort($ages);          // 按键排序
print_r($ages);

// 数组信息
$fruits = ["苹果", "香蕉", "橙子"];
echo "长度: " . count($fruits) . "\n";
echo "是否为数组: " . (is_array($fruits) ? "是" : "否") . "\n";

// 检查元素
if (in_array("香蕉", $fruits)) {
    echo "找到香蕉\n";
}

$key = array_search("橙子", $fruits);
echo "橙子的索引: $key\n";
?>
```

### 数组遍历与处理

```php
<?php
$numbers = [1, 2, 3, 4, 5];

// array_map - 映射
$squared = array_map(function($n) {
    return $n * $n;
}, $numbers);
print_r($squared); // [1, 4, 9, 16, 25]

// array_filter - 过滤
$even = array_filter($numbers, function($n) {
    return $n % 2 == 0;
});
print_r($even); // [2, 4]

// array_reduce - 归约
$sum = array_reduce($numbers, function($carry, $n) {
    return $carry + $n;
}, 0);
echo "总和: $sum\n"; // 15

// 数组合并
$arr1 = [1, 2, 3];
$arr2 = [4, 5, 6];
$merged = array_merge($arr1, $arr2);
print_r($merged);

// 数组切片
$slice = array_slice($numbers, 1, 3);
print_r($slice); // [2, 3, 4]
?>
```

### 数组解构

```php
<?php
// 列表解构 (PHP 7.1+)
$colors = ["红色", "绿色", "蓝色"];
[$red, $green, $blue] = $colors;
echo "$red, $green, $blue\n";

// 跳过元素
[, , $third] = $colors;
echo "第三个: $third\n";

// 关联数组解构
$person = ["name" => "小红", "age" => 22];
["name" => $name, "age" => $age] = $person;
echo "$name 今年 $age 岁\n";
?>
```

## 字符串

### 字符串创建

```php
<?php
// 单引号 - 不解析变量
$single = '这是单引号字符串\n'; // \n 不会被解析
echo $single . "\n";

// 双引号 - 解析变量和转义字符
$name = "小李";
$double = "你好, $name!\n"; // 变量会被解析
echo $double;

// Heredoc - 类似双引号
$heredoc = <<<EOT
这是 Heredoc 语法
可以包含变量: $name
可以多行显示
EOT;
echo $heredoc . "\n";

// Nowdoc - 类似单引号 (PHP 5.3+)
$nowdoc = <<<'EOT'
这是 Nowdoc 语法
不解析变量: $name
EOT;
echo $nowdoc . "\n";
?>
```

### 字符串操作

```php
<?php
$str = "Hello World";

// 长度
echo strlen($str) . "\n";           // 11
echo mb_strlen("你好世界") . "\n";   // 4 (多字节)

// 大小写转换
echo strtoupper($str) . "\n";       // HELLO WORLD
echo strtolower($str) . "\n";       // hello world
echo ucfirst("hello") . "\n";       // Hello
echo ucwords("hello world") . "\n"; // Hello World

// 去除空白
$text = "  空格  ";
echo trim($text) . "\n";            // "空格"
echo ltrim($text) . "\n";           // "空格  "
echo rtrim($text) . "\n";           // "  空格"
?>
```

### 字符串查找与替换

```php
<?php
$text = "PHP是最好的语言";

// 查找
$pos = strpos($text, "最好");
if ($pos !== false) {
    echo "找到位置: $pos\n";
}

// 检查开头和结尾 (PHP 8+)
if (str_starts_with($text, "PHP")) {
    echo "以PHP开头\n";
}

if (str_ends_with($text, "语言")) {
    echo "以语言结尾\n";
}

// 替换
$new = str_replace("最好", "很好", $text);
echo $new . "\n";

// 正则替换
$clean = preg_replace('/\d+/', 'X', "abc123def456");
echo $clean . "\n"; // abcXdefX
?>
```

### 字符串分割与连接

```php
<?php
// 分割字符串
$csv = "苹果,香蕉,橙子";
$fruits = explode(",", $csv);
print_r($fruits);

// 连接数组
$joined = implode(" | ", $fruits);
echo $joined . "\n"; // 苹果 | 香蕉 | 橙子

// 字符串分割为字符数组
$chars = str_split("Hello", 2);
print_r($chars); // ["He", "ll", "o"]

// 多字节分割
$chinese = "你好世界";
for ($i = 0; $i < mb_strlen($chinese); $i++) {
    echo mb_substr($chinese, $i, 1) . "\n";
}
?>
```

### 字符串截取

```php
<?php
$text = "Hello World";

// 基本截取
echo substr($text, 0, 5) . "\n";    // Hello
echo substr($text, 6) . "\n";       // World
echo substr($text, -5) . "\n";      // World

// 多字节截取
$chinese = "你好世界PHP";
echo mb_substr($chinese, 0, 2) . "\n";  // 你好
echo mb_substr($chinese, 2, 2) . "\n";  // 世界
echo mb_substr($chinese, -3) . "\n";    // 界PHP
?>
```

### 字符串格式化

```php
<?php
// sprintf - 格式化字符串
$name = "张三";
$age = 25;
$formatted = sprintf("姓名: %s, 年龄: %d", $name, $age);
echo $formatted . "\n";

// 数字格式化
$price = 1234.56789;
echo number_format($price, 2) . "\n";        // 1,234.57
echo number_format($price, 2, ".", "") . "\n"; // 1234.57

// 填充字符串
echo str_pad("PHP", 10, "*") . "\n";         // PHP*******
echo str_pad("PHP", 10, "*", STR_PAD_LEFT) . "\n"; // *******PHP
echo str_pad("PHP", 10, "*", STR_PAD_BOTH) . "\n"; // ***PHP****
?>
```

### 正则表达式

```php
<?php
$text = "我的邮箱是 user@example.com";

// 匹配
if (preg_match('/[\w\.-]+@[\w\.-]+\.\w+/', $text, $matches)) {
    echo "找到邮箱: " . $matches[0] . "\n";
}

// 全局匹配
$content = "电话: 123-4567, 手机: 987-6543";
preg_match_all('/\d{3}-\d{4}/', $content, $phones);
print_r($phones[0]);

// 验证
$email = "test@example.com";
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "有效的邮箱\n";
}

// 正则替换
$html = "这是<b>加粗</b>文本";
$clean = preg_replace('/<[^>]+>/', '', $html);
echo $clean . "\n"; // 这是加粗文本
?>
```

## 总结

本文介绍了 PHP 的核心基础知识:

1. **变量与数据类型**: PHP 是弱类型语言,支持字符串、整数、浮点数、布尔值、数组和 NULL 等类型
2. **运算符**: 包括算术、赋值、比较、逻辑和字符串运算符
3. **控制结构**: if-else、switch、while、for 和 foreach 等流程控制语句
4. **函数**: 支持默认参数、可变参数、匿名函数和闭包
5. **数组**: 强大的数组功能,支持索引数组和关联数组
6. **字符串**: 丰富的字符串处理函数和正则表达式支持

掌握这些基础知识是学习 PHP 高级特性和框架开发的重要基石。建议通过实际编码练习来加深理解。

## 下一步学习

- 面向对象编程 (OOP)
- 文件处理与上传
- 数据库操作 (MySQL/PDO)
- 表单处理与验证
- Session 和 Cookie
- 错误处理与异常
