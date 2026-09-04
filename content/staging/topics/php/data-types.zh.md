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
origin: old/src/content/docs/php/data-types.zh.md
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

PHP 是一门动态弱类型语言，其灵活的类型系统既是优势也是挑战。深入理解 PHP 的数据类型体系，对于编写健壮、可维护的代码至关重要。

## 概念解释

### 什么是数据类型？

数据类型定义了变量可以存储的数据种类以及可以对这些数据执行的操作。PHP 支持多种数据类型，可以分为三大类：

1. **标量类型 (Scalar Types)**: 存储单一值
   - `bool` (布尔型)
   - `int` (整型)
   - `float` (浮点型，也称 `double`)
   - `string` (字符串)

2. **复合类型 (Compound Types)**: 存储多个值或复杂结构
   - `array` (数组)
   - `object` (对象)
   - `callable` (可调用类型)
   - `iterable` (可迭代类型)

3. **特殊类型 (Special Types)**: 具有特殊用途
   - `null` (空值)
   - `resource` (资源)
   - `never` (PHP 8.1+)
   - `void` (无返回值)
   - `mixed` (PHP 8.0+)

### 历史背景

PHP 最初设计为简单的模板语言，类型系统非常宽松。随着语言发展：

- **PHP 5.0** (2004): 引入类型提示，支持类/接口类型声明
- **PHP 7.0** (2015): 引入标量类型声明和返回类型声明
- **PHP 7.1** (2016): 引入可空类型 `?Type` 和 `void`
- **PHP 7.4** (2019): 引入属性类型声明
- **PHP 8.0** (2020): 引入联合类型和 `mixed` 类型
- **PHP 8.1** (2021): 引入交集类型和 `never` 类型
- **PHP 8.2** (2022): 引入 DNF 类型 (交集与联合的组合)

### 解决什么问题？

理解数据类型有助于：

1. **避免类型错误**: 防止因类型不匹配导致的运行时错误
2. **提高代码质量**: 明确的类型声明使代码更易读、易维护
3. **优化性能**: 正确的类型使用可以提升执行效率
4. **增强 IDE 支持**: 类型信息帮助 IDE 提供更好的自动补全和错误检测

## 核心原理

### 类型存储机制

PHP 内部使用 `zval` 结构体存储变量，其中包含类型标识和值：

```c
// PHP 内部 zval 结构 (简化版)
struct _zval_struct {
    zend_value value;      // 存储实际值
    union {
        uint32_t type_info;  // 类型信息
    } u1;
};
```

PHP 的类型是在运行时确定的，这意味着：

1. 同一个变量可以在不同时间持有不同类型的值
2. 类型检查发生在运行时而非编译时
3. 类型转换可以隐式或显式进行

### 类型判定 (Type Juggling)

PHP 会根据上下文自动进行类型转换，这称为类型判定或类型杂耍：

```php
<?php
// 数值上下文
$sum = "10" + 5;        // string "10" 转为 int 10
echo $sum;              // 输出: 15

// 字符串上下文
$concat = "10" . 5;     // int 5 转为 string "5"
echo $concat;           // 输出: 105

// 布尔上下文
if ("hello") {          // 非空字符串转为 true
    echo "真值";
}

// 比较上下文
var_dump("10" == 10);   // bool(true) - 类型转换后比较
var_dump("10" === 10);  // bool(false) - 严格比较
?>
```

### 写时复制 (Copy-on-Write)

PHP 使用写时复制优化内存使用：

```php
<?php
$a = "Hello";
$b = $a;        // $b 和 $a 共享同一块内存

$b = "World";   // 现在才真正复制，$b 获得独立内存
?>
```

## 核心要点

### 标量类型详解

#### 布尔型 (bool)

```php
<?php
// 布尔值只有两个: true 和 false
$isActive = true;
$isDeleted = false;

// 转换为 false 的值 (falsy values)
$falsyValues = [
    false,      // 布尔 false
    0,          // 整数 0
    0.0,        // 浮点 0.0
    -0.0,       // 负零
    "",         // 空字符串
    "0",        // 字符串 "0"
    [],         // 空数组
    null,       // null
];

// 其他所有值都转换为 true
$truthyValues = [
    true,
    1,
    -1,
    0.1,
    "0.0",      // 非 "0" 的字符串
    "false",    // 字符串 "false"
    [0],        // 非空数组
];

// 使用 var_export 查看布尔值
var_export((bool)"0");     // false
var_export((bool)"0.0");   // true (容易混淆!)
?>
```

#### 整型 (int)

```php
<?php
// 不同进制的整数表示
$decimal = 1234;           // 十进制
$negative = -1234;         // 负数
$octal = 0755;             // 八进制 (以 0 开头)
$hex = 0xFF;               // 十六进制 (以 0x 开头)
$binary = 0b11111111;      // 二进制 (以 0b 开头)

// PHP 7.4+ 支持数字分隔符
$billion = 1_000_000_000;
$bytes = 0xCAFE_BABE;
$permissions = 0b0111_0101;

// 整数边界
echo PHP_INT_MAX . "\n";   // 64位系统: 9223372036854775807
echo PHP_INT_MIN . "\n";   // 64位系统: -9223372036854775808
echo PHP_INT_SIZE . "\n";  // 字节数: 8 (64位系统)

// 整数溢出会自动转为 float
$overflow = PHP_INT_MAX + 1;
var_dump($overflow);       // float(9.2233720368548E+18)
?>
```

#### 浮点型 (float)

```php
<?php
$pi = 3.14159;
$scientific = 1.2e3;       // 1200
$negExp = 7E-10;           // 0.0000000007
$underscore = 1_234.567_89; // PHP 7.4+

// 浮点数精度问题
$a = 0.1 + 0.2;
echo $a . "\n";                          // 0.3
var_dump($a == 0.3);                     // bool(false)!
var_dump(abs($a - 0.3) < 0.00001);       // bool(true) - 正确的比较方式

// 使用 bcmath 进行精确计算
$result = bcadd('0.1', '0.2', 2);
echo $result . "\n";                     // 0.30

// 特殊浮点值
$inf = INF;                // 无穷大
$negInf = -INF;            // 负无穷大
$nan = NAN;                // 非数字

var_dump(is_infinite($inf));   // bool(true)
var_dump(is_nan($nan));        // bool(true)
var_dump($nan == $nan);        // bool(false) - NAN 不等于自身!
?>
```

#### 字符串 (string)

```php
<?php
// 四种字符串定义方式

// 1. 单引号 - 不解析变量和大多数转义
$single = 'Hello $name\n';
echo $single . "\n";  // 输出: Hello $name\n

// 2. 双引号 - 解析变量和转义序列
$name = "World";
$double = "Hello $name\n";
echo $double;  // 输出: Hello World (换行)

// 复杂变量语法
$user = ['name' => 'Alice'];
echo "Welcome, {$user['name']}!\n";

// 3. Heredoc - 类似双引号
$heredoc = <<<TEXT
这是 Heredoc 语法
变量会被解析: $name
支持换行
TEXT;

// 4. Nowdoc - 类似单引号 (PHP 5.3+)
$nowdoc = <<<'TEXT'
这是 Nowdoc 语法
变量不会被解析: $name
TEXT;

// 字符串作为字符数组访问
$str = "Hello";
echo $str[0] . "\n";        // H
echo $str[-1] . "\n";       // o (负索引，PHP 7.1+)

// 字符串长度
echo strlen($str) . "\n";        // 5 (字节数)
echo mb_strlen("你好") . "\n";   // 2 (字符数)
?>
```

### 复合类型详解

#### 数组 (array)

```php
<?php
// PHP 数组实际上是有序映射 (ordered map)

// 索引数组
$fruits = ['apple', 'banana', 'orange'];
$fruits[] = 'grape';  // 自动分配索引

// 关联数组
$person = [
    'name' => '张三',
    'age' => 25,
    'city' => '北京'
];

// 混合数组
$mixed = [
    0 => 'zero',
    'key' => 'value',
    1 => 'one',
    'nested' => [1, 2, 3]
];

// 数组解构 (PHP 7.1+)
[$a, $b, $c] = $fruits;
['name' => $name, 'age' => $age] = $person;

// 展开运算符 (PHP 7.4+)
$numbers = [1, 2, 3];
$more = [0, ...$numbers, 4, 5];  // [0, 1, 2, 3, 4, 5]

// 数组类型检查
var_dump(is_array($fruits));    // bool(true)
var_dump(gettype($fruits));     // string(5) "array"
?>
```

#### 对象 (object)

```php
<?php
// 类定义
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

$user = new User('李四', 30);
echo $user->name . "\n";        // 李四
echo $user->getAge() . "\n";    // 30

// 匿名类 (PHP 7.0+)
$logger = new class {
    public function log(string $message): void {
        echo "[LOG] $message\n";
    }
};
$logger->log("Hello");

// stdClass - 通用对象
$obj = new stdClass();
$obj->name = "Object";
$obj->value = 42;

// 数组转对象
$array = ['a' => 1, 'b' => 2];
$object = (object)$array;
echo $object->a . "\n";  // 1

// 对象类型检查
var_dump($user instanceof User);  // bool(true)
var_dump(is_object($user));       // bool(true)
var_dump(get_class($user));       // string(4) "User"
?>
```

#### 可调用类型 (callable)

```php
<?php
// callable 类型可以是多种形式

// 1. 普通函数
function greet(string $name): string {
    return "Hello, $name!";
}

// 2. 匿名函数 (闭包)
$multiply = function(int $a, int $b): int {
    return $a * $b;
};

// 3. 箭头函数 (PHP 7.4+)
$add = fn(int $a, int $b): int => $a + $b;

// 4. 类方法
class Calculator {
    public static function divide(int $a, int $b): float {
        return $a / $b;
    }

    public function subtract(int $a, int $b): int {
        return $a - $b;
    }
}

// 调用不同类型的 callable
function execute(callable $fn, ...$args): mixed {
    return $fn(...$args);
}

echo execute('greet', 'World') . "\n";
echo execute($multiply, 3, 4) . "\n";
echo execute($add, 5, 6) . "\n";
echo execute([Calculator::class, 'divide'], 10, 2) . "\n";

$calc = new Calculator();
echo execute([$calc, 'subtract'], 10, 3) . "\n";

// 使用 Closure 类型提示 (更严格)
function applyFn(Closure $fn, mixed $value): mixed {
    return $fn($value);
}
?>
```

#### 可迭代类型 (iterable)

```php
<?php
// iterable 类型表示可以被 foreach 遍历的值

function processItems(iterable $items): void {
    foreach ($items as $item) {
        echo $item . " ";
    }
    echo "\n";
}

// 数组
processItems([1, 2, 3]);

// 生成器
function numberGenerator(): Generator {
    for ($i = 1; $i <= 3; $i++) {
        yield $i;
    }
}
processItems(numberGenerator());

// 实现 Traversable 接口的对象
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

### 特殊类型详解

#### NULL

```php
<?php
$null = null;
$uninitialized;  // 也是 null

// 检查 null
var_dump(is_null($null));        // bool(true)
var_dump($null === null);        // bool(true)
var_dump(isset($null));          // bool(false)
var_dump(isset($uninitialized)); // bool(false)

// null 合并运算符
$value = null;
$default = $value ?? 'default';
echo $default . "\n";  // default

// null 合并赋值运算符 (PHP 7.4+)
$config['timeout'] ??= 30;

// nullsafe 运算符 (PHP 8.0+)
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

#### 资源 (resource)

```php
<?php
// resource 是一种特殊类型，表示外部资源的引用

// 文件资源
$file = fopen('/tmp/test.txt', 'w');
var_dump(is_resource($file));       // bool(true)
var_dump(get_resource_type($file)); // string(6) "stream"
fclose($file);

// 注意: PHP 8.0+ 很多资源类型已改为对象
// 例如: curl_init() 返回 CurlHandle 对象而非 resource

// 检查资源是否有效
if (is_resource($file)) {
    // 资源仍然有效
}
?>
```

#### void、never、mixed

```php
<?php
// void - 函数没有返回值 (PHP 7.1+)
function logMessage(string $msg): void {
    echo $msg . "\n";
    // 不能 return 任何值 (return; 是允许的)
}

// never - 函数永不正常返回 (PHP 8.1+)
function throwError(string $msg): never {
    throw new Exception($msg);
    // 或 exit()、die()
}

function infiniteLoop(): never {
    while (true) {
        // 永远不会结束
    }
}

// mixed - 任意类型 (PHP 8.0+)
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

## 代码示例

### 类型声明完整示例

```php
<?php
declare(strict_types=1);  // 启用严格类型模式

// 标量类型声明
function calculateDiscount(
    float $price,
    int $quantity,
    float $discountRate = 0.1
): float {
    $total = $price * $quantity;
    $discount = $total * $discountRate;
    return $total - $discount;
}

// 可空类型 (PHP 7.1+)
function findUser(?int $id): ?array {
    if ($id === null) {
        return null;
    }
    // 模拟数据库查询
    return ['id' => $id, 'name' => 'User ' . $id];
}

// 联合类型 (PHP 8.0+)
function formatId(int|string $id): string {
    return is_int($id) ? "ID-$id" : $id;
}

// 交集类型 (PHP 8.1+)
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

// 返回类型 self、static、parent
class BaseClass {
    public function getInstance(): self {
        return new self();
    }

    public static function create(): static {
        return new static();  // 延迟静态绑定
    }
}

class ChildClass extends BaseClass {
    // static 返回类型会返回 ChildClass 实例
}

// 使用示例
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

### 类型转换详细示例

```php
<?php
// 显式类型转换

// 转换为整数
$values = [
    (int)"123",           // 123
    (int)"123.45",        // 123
    (int)"12abc",         // 12
    (int)"abc12",         // 0
    (int)true,            // 1
    (int)false,           // 0
    (int)null,            // 0
    (int)12.9,            // 12 (截断，非四舍五入)
];

// 转换为浮点数
$floats = [
    (float)"123.45",      // 123.45
    (float)"123e2",       // 12300.0
    (float)true,          // 1.0
    (float)"1.2.3",       // 1.2
];

// 转换为字符串
$strings = [
    (string)123,          // "123"
    (string)12.34,        // "12.34"
    (string)true,         // "1"
    (string)false,        // ""
    (string)null,         // ""
    (string)[1, 2],       // 警告，结果为 "Array"
];

// 转换为布尔值 (参考前面的 falsy values)

// 转换为数组
$arrays = [
    (array)"hello",       // ["hello"]
    (array)123,           // [123]
    (array)null,          // []
];

// 对象转数组
class Point {
    public int $x = 10;
    protected int $y = 20;
    private int $z = 30;
}

$point = new Point();
$arr = (array)$point;
print_r($arr);
// 输出: Array ( [x] => 10 [*y] => 20 [Pointz] => 30 )
// 注意: protected 和 private 属性有特殊的键名格式

// 数组转对象
$data = ['name' => 'Test', 'value' => 100];
$obj = (object)$data;
echo $obj->name . "\n";  // Test
?>
```

### 类型检测函数

```php
<?php
// 类型检测函数大全

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
    echo "值: " . var_export($value, true) . "\n";
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

// is_numeric 的特殊行为
var_dump(is_numeric("123"));      // bool(true)
var_dump(is_numeric("12.34"));    // bool(true)
var_dump(is_numeric("1e10"));     // bool(true)
var_dump(is_numeric("0x1A"));     // bool(false) - 十六进制字符串不算
var_dump(is_numeric("  123"));    // bool(true) - 允许前导空格
?>
```

### 严格类型模式

```php
<?php
// 文件顶部声明严格类型
declare(strict_types=1);

function add(int $a, int $b): int {
    return $a + $b;
}

// 严格模式下，这会抛出 TypeError
// echo add("5", "3");  // Fatal error

// 正确用法
echo add(5, 3) . "\n";  // 8

// 注意: strict_types 只影响调用方
// 下面的代码在非严格模式文件中调用时可以传字符串
function multiply(int $a, int $b): int {
    return $a * $b;
}

// 弱类型与强类型对比
// file_weak.php (无 strict_types)
// <?php
// require 'file_strict.php';
// echo add("5", "3");  // 有效! 因为调用方没有 strict_types

// 返回类型也受 strict_types 影响
function getNumber(): int {
    return 42;    // OK
    // return "42";  // TypeError in strict mode
}
?>
```

## 最佳实践

### 始终使用类型声明

```php
<?php
declare(strict_types=1);

// 推荐: 完整的类型声明
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

### 使用适当的类型转换

```php
<?php
// 推荐: 明确的类型转换
function processInput(mixed $input): int {
    // 验证后再转换
    if (!is_numeric($input)) {
        throw new InvalidArgumentException('Input must be numeric');
    }
    return (int)$input;
}

// 不推荐: 隐式依赖类型转换
function badProcess($input) {
    return $input + 0;  // 隐式转换，可能有意外结果
}

// 推荐: 使用 filter_var 进行安全转换
$userInput = "123";
$int = filter_var($userInput, FILTER_VALIDATE_INT);
if ($int === false) {
    throw new InvalidArgumentException('Invalid integer');
}
?>
```

### 正确处理可空类型

```php
<?php
declare(strict_types=1);

class Config {
    private array $settings = [];

    // 推荐: 使用可空类型和默认值
    public function get(string $key, mixed $default = null): mixed {
        return $this->settings[$key] ?? $default;
    }

    // 推荐: 使用断言方法
    public function getRequired(string $key): mixed {
        if (!isset($this->settings[$key])) {
            throw new RuntimeException("Required config key: {$key}");
        }
        return $this->settings[$key];
    }

    // PHP 8.0+ 使用 nullsafe 运算符
    public function getNestedValue(): ?string {
        return $this->getUser()?->getProfile()?->getName();
    }
}
?>
```

### 使用 Union Types 合理化

```php
<?php
declare(strict_types=1);

// 推荐: 有意义的联合类型
function parseId(int|string $id): int {
    return is_string($id) ? (int)$id : $id;
}

// 推荐: 使用接口代替过多的联合类型
interface Stringable {
    public function __toString(): string;
}

function format(Stringable|string $value): string {
    return (string)$value;
}

// 不推荐: 过于宽泛的联合类型
// function process(int|float|string|array|object $data) { ... }
// 这种情况考虑使用 mixed 或重新设计
?>
```

### 使用 readonly 和 final

```php
<?php
declare(strict_types=1);

// PHP 8.1+ readonly 属性
class ImmutablePoint {
    public function __construct(
        public readonly int $x,
        public readonly int $y,
    ) {}
}

// PHP 8.2+ readonly 类
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

## 常见陷阱

### 浮点数比较陷阱

```php
<?php
// 错误: 直接比较浮点数
$a = 0.1 + 0.2;
if ($a == 0.3) {  // 可能为 false!
    echo "Equal";
}

// 正确: 使用精度比较
function floatEquals(float $a, float $b, float $epsilon = 0.00001): bool {
    return abs($a - $b) < $epsilon;
}

if (floatEquals($a, 0.3)) {
    echo "Equal (with epsilon)\n";
}

// 更好: 使用 bcmath 或 decimal 扩展
$result = bcadd('0.1', '0.2', 10);
if (bccomp($result, '0.3', 10) === 0) {
    echo "Equal (bcmath)\n";
}
?>
```

### 字符串数字比较陷阱

```php
<?php
// PHP 7 及之前的行为
var_dump("10" == "1e1");    // true in PHP 7, false in PHP 8
var_dump("0" == "");        // true in PHP 7, false in PHP 8
var_dump(100 == "100abc");  // true in PHP 7, false in PHP 8

// PHP 8 改进了字符串数字比较
// 现在只有当字符串确实是数字时才会转换

// 建议: 始终使用严格比较
var_dump("10" === "10");    // true
var_dump(10 === 10);        // true
var_dump("10" === 10);      // false - 明确的类型差异
?>
```

### 空数组和 null 的区别

```php
<?php
$empty = [];
$null = null;

// isset 和 empty 的区别
var_dump(isset($empty));     // true
var_dump(isset($null));      // false

var_dump(empty($empty));     // true
var_dump(empty($null));      // true

// 类型检查
var_dump(is_null($empty));   // false
var_dump(is_null($null));    // true

var_dump(is_array($empty));  // true
var_dump(is_array($null));   // false

// 推荐: 明确检查
function processArray(?array $data): array {
    // 方式1: null 合并
    $data = $data ?? [];

    // 方式2: 显式检查
    if ($data === null) {
        return [];
    }

    return array_map(fn($x) => $x * 2, $data);
}
?>
```

### 类型声明继承陷阱

```php
<?php
declare(strict_types=1);

class Animal {
    public function speak(): string {
        return "...";
    }
}

class Dog extends Animal {
    // 返回类型可以更具体 (协变)
    public function speak(): string {
        return "Woof!";
    }
}

// 参数类型的逆变
interface Logger {
    public function log(string $message): void;
}

class FileLogger implements Logger {
    // 错误: 不能使参数类型更具体
    // public function log(EmailMessage $message): void { }

    // 正确: 参数类型只能相同或更宽泛
    public function log(string $message): void {
        file_put_contents('/tmp/log.txt', $message, FILE_APPEND);
    }
}
?>
```

### 数组键类型转换

```php
<?php
// 数组键的隐式转换
$array = [];

$array[1] = 'integer key';
$array['1'] = 'string key';      // 覆盖! 转换为整数 1
$array[1.5] = 'float key';       // 覆盖! 截断为整数 1
$array[true] = 'bool key';       // 覆盖! 转换为整数 1

print_r($array);
// 输出: Array ( [1] => bool key )

// null 作为键会转换为空字符串
$array[null] = 'null key';
$array[''] = 'empty string key';  // 覆盖!

// 建议: 使用一致的键类型
function createIndexedArray(array $items): array {
    $result = [];
    foreach ($items as $index => $item) {
        $result[(string)$index] = $item;  // 强制字符串键
    }
    return $result;
}
?>
```

## 性能考量

### 类型声明的性能影响

```php
<?php
// 类型检查有轻微的性能开销，但通常可以忽略

// 测试代码
$iterations = 1000000;

// 无类型声明
function addUntyped($a, $b) {
    return $a + $b;
}

// 有类型声明
function addTyped(int $a, int $b): int {
    return $a + $b;
}

// 性能测试
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

// 结论: 差异通常在 5-10% 以内，类型安全带来的好处远超性能损失
?>
```

### 选择合适的数据类型

```php
<?php
// 整数 vs 浮点数
// 如果不需要小数，使用整数更高效

// 数组 vs 对象
// 对于简单的键值对，数组更轻量
$arrayConfig = ['host' => 'localhost', 'port' => 3306];

// 对于复杂逻辑，对象更合适
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

// SplFixedArray 用于固定大小的数组
// 比普通数组更高效，但功能有限
$fixed = new SplFixedArray(1000);
for ($i = 0; $i < 1000; $i++) {
    $fixed[$i] = $i * 2;
}
?>
```

### 字符串性能优化

```php
<?php
// 字符串连接性能
$iterations = 10000;

// 慢: 循环中使用 . 连接
$result = '';
$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    $result .= "item$i,";
}
$concatTime = microtime(true) - $start;

// 快: 使用数组 + implode
$parts = [];
$start = microtime(true);
for ($i = 0; $i < $iterations; $i++) {
    $parts[] = "item$i";
}
$result = implode(',', $parts);
$implodeTime = microtime(true) - $start;

// 更快: 使用 sprintf 构建复杂字符串
// 避免多次字符串连接

echo "Concat time: {$concatTime}\n";
echo "Implode time: {$implodeTime}\n";
?>
```

## 实战场景

### API 数据验证

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
     * @return array<string, string> 验证错误
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

// 使用示例
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
    echo "验证通过\n";
} else {
    print_r($errors);
}
?>
```

### 数据传输对象 (DTO)

```php
<?php
declare(strict_types=1);

/**
 * 使用 PHP 8 特性构建类型安全的 DTO
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

// 使用示例
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

### 泛型模拟 (使用 PHPDoc)

```php
<?php
declare(strict_types=1);

/**
 * PHP 不支持原生泛型，但可以使用 PHPDoc 注解
 * 配合 PHPStan 或 Psalm 进行静态分析
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

// 使用示例
/** @var Collection<User> */
$users = new Collection();
$users->add(new User('Alice', 25));
$users->add(new User('Bob', 30));

$names = $users->map(fn(User $u): string => $u->name);
$adults = $users->filter(fn(User $u): bool => $u->age >= 18);
?>
```

## 面试要点

### 常见面试题

1. **PHP 有哪些数据类型？如何分类？**

   答: PHP 有四大类数据类型：
   - 标量类型: bool, int, float, string
   - 复合类型: array, object, callable, iterable
   - 特殊类型: null, resource
   - 伪类型: mixed, void, never

2. **== 和 === 的区别是什么？**

   答:
   - `==` 是宽松比较，会进行类型转换后比较值
   - `===` 是严格比较，同时比较类型和值
   - 推荐使用 `===` 避免意外的类型转换

3. **什么是类型判定 (Type Juggling)？**

   答: PHP 会根据上下文自动进行类型转换。例如，在算术运算中字符串会转换为数字，在字符串连接中数字会转换为字符串。

4. **declare(strict_types=1) 的作用是什么？**

   答: 启用严格类型模式后：
   - 标量类型声明会强制执行
   - 不会自动进行类型转换
   - 类型不匹配会抛出 TypeError
   - 只影响声明所在文件的函数调用

5. **如何安全地比较浮点数？**

   答:
   ```php
   // 使用 epsilon 比较
   function floatEquals(float $a, float $b, float $e = 0.00001): bool {
       return abs($a - $b) < $e;
   }

   // 或使用 bcmath 扩展进行精确计算
   bccomp('0.1', '0.1', 10) === 0;
   ```

6. **PHP 8 引入了哪些类型系统的新特性？**

   答:
   - PHP 8.0: 联合类型 `int|string`, mixed 类型, static 返回类型
   - PHP 8.1: 交集类型 `A&B`, never 类型, readonly 属性
   - PHP 8.2: null/false/true 独立类型, DNF 类型 `(A&B)|C`

### 进阶考察点

- 解释 PHP 的写时复制 (Copy-on-Write) 机制
- 如何实现类型安全的集合类
- 讨论 PHP 类型系统的协变和逆变
- 解释为什么 `"php" == 0` 在 PHP 7 中为 true，PHP 8 中为 false
- 如何使用 PHPDoc + 静态分析工具实现类似泛型的功能

## 延伸阅读

### 官方资源

- [PHP 官方文档 - 类型](https://www.php.net/manual/zh/language.types.php)
- [PHP 官方文档 - 类型声明](https://www.php.net/manual/zh/language.types.declarations.php)
- [PHP RFC: Union Types 2.0](https://wiki.php.net/rfc/union_types_v2)
- [PHP RFC: Mixed Type](https://wiki.php.net/rfc/mixed_type_v2)

### 工具和扩展

- [PHPStan](https://phpstan.org/) - PHP 静态分析工具
- [Psalm](https://psalm.dev/) - PHP 静态分析工具，支持泛型
- [PHP BCMath](https://www.php.net/manual/zh/book.bc.php) - 精确数学计算
- [PHP Decimal](https://php-decimal.io/) - 任意精度十进制数

### 相关书籍

- 《Modern PHP》 - Josh Lockhart
- 《PHP 8 Objects, Patterns, and Practice》 - Matt Zandstra
- 《Clean Code in PHP》 - Carsten Windler

---

掌握 PHP 的类型系统是编写高质量代码的基础。建议在新项目中始终启用 `strict_types=1`，使用完整的类型声明，并配合静态分析工具来捕获潜在的类型错误。随着 PHP 8.x 的发展，类型系统变得越来越强大，充分利用这些特性可以显著提高代码的可靠性和可维护性。
