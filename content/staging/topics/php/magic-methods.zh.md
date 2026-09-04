---
title: PHP 魔术方法
description: 深入学习 PHP 魔术方法，包括构造析构、属性访问、方法重载和序列化
track: php
section: oop
difficulty: intermediate
tags:
  - PHP
  - 魔术方法
  - OOP
status: imported
origin: old/src/content/docs/php/magic-methods.zh.md
divergence: 0.211
issues:
  - title-lang-en
  - title-language
legacy:
  category: PHP
  subcategory: 面向对象
  order: 13
  lastUpdated: 2026-01-07
---

魔术方法（Magic Methods）是 PHP 面向对象编程中的特殊方法，它们以双下划线 `__` 开头，在特定情况下会被 PHP 自动调用。掌握魔术方法可以让你的代码更加优雅、灵活，并实现许多高级功能。

## 魔术方法概述

PHP 提供了多种魔术方法，每种都有其特定的用途：

| 魔术方法 | 触发时机 |
|---------|---------|
| `__construct()` | 对象创建时 |
| `__destruct()` | 对象销毁时 |
| `__get()` | 读取不可访问的属性时 |
| `__set()` | 写入不可访问的属性时 |
| `__isset()` | 对不可访问的属性调用 isset() 或 empty() 时 |
| `__unset()` | 对不可访问的属性调用 unset() 时 |
| `__call()` | 调用不可访问的实例方法时 |
| `__callStatic()` | 调用不可访问的静态方法时 |
| `__toString()` | 对象被当作字符串使用时 |
| `__invoke()` | 对象被当作函数调用时 |
| `__clone()` | 对象被克隆时 |
| `__sleep()` | 对象被序列化之前 |
| `__wakeup()` | 对象被反序列化之后 |

## 构造与析构方法

### __construct() - 构造方法

构造方法是创建对象时自动调用的方法，用于初始化对象的属性和执行必要的设置操作。

```php
<?php

class Database
{
    private PDO $connection;
    private string $host;
    private string $database;

    public function __construct(
        string $host,
        string $database,
        string $username,
        string $password
    ) {
        $this->host = $host;
        $this->database = $database;

        $dsn = "mysql:host={$host};dbname={$database};charset=utf8mb4";

        try {
            $this->connection = new PDO($dsn, $username, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            echo "数据库连接成功: {$database}\n";
        } catch (PDOException $e) {
            throw new RuntimeException("数据库连接失败: " . $e->getMessage());
        }
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }
}

// 创建对象时自动调用 __construct
$db = new Database('localhost', 'myapp', 'root', 'password');
```

#### 构造方法的继承

子类可以通过 `parent::__construct()` 调用父类的构造方法：

```php
<?php

class Animal
{
    protected string $name;
    protected int $age;

    public function __construct(string $name, int $age)
    {
        $this->name = $name;
        $this->age = $age;
    }
}

class Dog extends Animal
{
    private string $breed;

    public function __construct(string $name, int $age, string $breed)
    {
        // 调用父类构造方法
        parent::__construct($name, $age);
        $this->breed = $breed;
    }

    public function getInfo(): string
    {
        return "{$this->name} 是一只 {$this->age} 岁的 {$this->breed}";
    }
}

$dog = new Dog('小黑', 3, '拉布拉多');
echo $dog->getInfo(); // 输出: 小黑 是一只 3 岁的 拉布拉多
```

#### PHP 8 构造器属性提升

PHP 8 引入了构造器属性提升（Constructor Property Promotion），可以简化代码：

```php
<?php

// PHP 8 之前的写法
class UserOld
{
    private string $name;
    private string $email;
    private int $age;

    public function __construct(string $name, string $email, int $age)
    {
        $this->name = $name;
        $this->email = $email;
        $this->age = $age;
    }
}

// PHP 8+ 的简化写法
class User
{
    public function __construct(
        private string $name,
        private string $email,
        private int $age = 0
    ) {
        // 属性自动声明和赋值
    }

    public function getName(): string
    {
        return $this->name;
    }
}

$user = new User('张三', 'zhangsan@example.com', 25);
echo $user->getName(); // 输出: 张三
```

### __destruct() - 析构方法

析构方法在对象被销毁时自动调用，通常用于清理资源、关闭连接或保存数据。

```php
<?php

class FileHandler
{
    private $handle;
    private string $filename;
    private array $buffer = [];

    public function __construct(string $filename)
    {
        $this->filename = $filename;
        $this->handle = fopen($filename, 'a');

        if ($this->handle === false) {
            throw new RuntimeException("无法打开文件: {$filename}");
        }

        echo "文件已打开: {$filename}\n";
    }

    public function write(string $content): void
    {
        $this->buffer[] = $content;
    }

    public function __destruct()
    {
        // 写入缓冲区内容
        if (!empty($this->buffer)) {
            $content = implode("\n", $this->buffer) . "\n";
            fwrite($this->handle, $content);
            echo "缓冲区数据已写入\n";
        }

        // 关闭文件句柄
        if ($this->handle) {
            fclose($this->handle);
            echo "文件已关闭: {$this->filename}\n";
        }
    }
}

// 使用示例
function processLog(): void
{
    $logger = new FileHandler('/tmp/app.log');
    $logger->write('日志条目 1');
    $logger->write('日志条目 2');
    // 函数结束时，$logger 被销毁，__destruct 自动调用
}

processLog();
// 输出:
// 文件已打开: /tmp/app.log
// 缓冲区数据已写入
// 文件已关闭: /tmp/app.log
```

#### 析构方法的注意事项

```php
<?php

class Resource
{
    private string $id;

    public function __construct(string $id)
    {
        $this->id = $id;
        echo "创建资源: {$id}\n";
    }

    public function __destruct()
    {
        echo "释放资源: {$this->id}\n";
    }
}

// 1. 正常销毁顺序
$a = new Resource('A');
$b = new Resource('B');
// 脚本结束时，按创建的逆序销毁: B, A

// 2. 使用 unset 显式销毁
$c = new Resource('C');
unset($c); // 立即调用 __destruct

// 3. 赋值 null 销毁
$d = new Resource('D');
$d = null; // 立即调用 __destruct

// 4. 循环引用问题
class Node
{
    public ?Node $next = null;
    public string $name;

    public function __construct(string $name)
    {
        $this->name = $name;
    }

    public function __destruct()
    {
        echo "销毁节点: {$this->name}\n";
    }
}

$node1 = new Node('Node1');
$node2 = new Node('Node2');
$node1->next = $node2;
$node2->next = $node1; // 循环引用

// PHP 的垃圾回收器会处理循环引用
// 但建议手动断开引用
$node1->next = null;
$node2->next = null;
```

## 属性访问魔术方法

### __get() 和 __set()

这两个方法用于实现属性重载，当访问不存在或不可访问的属性时触发。

```php
<?php

class DynamicObject
{
    private array $data = [];
    private array $readonly = ['id', 'created_at'];

    public function __get(string $name): mixed
    {
        if (array_key_exists($name, $this->data)) {
            echo "获取属性: {$name}\n";
            return $this->data[$name];
        }

        throw new OutOfBoundsException("属性不存在: {$name}");
    }

    public function __set(string $name, mixed $value): void
    {
        if (in_array($name, $this->readonly) && isset($this->data[$name])) {
            throw new RuntimeException("属性 {$name} 是只读的");
        }

        echo "设置属性: {$name} = " . var_export($value, true) . "\n";
        $this->data[$name] = $value;
    }

    public function getData(): array
    {
        return $this->data;
    }
}

$obj = new DynamicObject();
$obj->name = '张三';      // 设置属性: name = '张三'
$obj->age = 25;           // 设置属性: age = 25
$obj->id = 1;             // 设置属性: id = 1

echo $obj->name;          // 获取属性: name，输出: 张三

// $obj->id = 2;          // 抛出异常: 属性 id 是只读的
```

#### 实现属性访问器模式

```php
<?php

class Model
{
    private array $attributes = [];
    private array $original = [];
    private array $changes = [];

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
        $this->original = $this->attributes;
    }

    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->setAttribute($key, $value);
        }
        return $this;
    }

    public function __get(string $key): mixed
    {
        return $this->getAttribute($key);
    }

    public function __set(string $key, mixed $value): void
    {
        $this->setAttribute($key, $value);
    }

    protected function getAttribute(string $key): mixed
    {
        // 检查是否有访问器方法
        $method = 'get' . $this->studly($key) . 'Attribute';

        if (method_exists($this, $method)) {
            return $this->$method();
        }

        return $this->attributes[$key] ?? null;
    }

    protected function setAttribute(string $key, mixed $value): void
    {
        // 检查是否有修改器方法
        $method = 'set' . $this->studly($key) . 'Attribute';

        if (method_exists($this, $method)) {
            $this->$method($value);
            return;
        }

        // 记录变更
        if (!isset($this->original[$key]) || $this->original[$key] !== $value) {
            $this->changes[$key] = $value;
        }

        $this->attributes[$key] = $value;
    }

    private function studly(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $value)));
    }

    public function isDirty(): bool
    {
        return !empty($this->changes);
    }

    public function getChanges(): array
    {
        return $this->changes;
    }
}

class User extends Model
{
    // 访问器：获取全名
    protected function getFullNameAttribute(): string
    {
        return $this->attributes['first_name'] . ' ' . $this->attributes['last_name'];
    }

    // 修改器：密码自动加密
    protected function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = password_hash($value, PASSWORD_DEFAULT);
    }

    // 访问器：格式化邮箱
    protected function getEmailAttribute(): string
    {
        return strtolower($this->attributes['email'] ?? '');
    }
}

$user = new User([
    'first_name' => '张',
    'last_name' => '三',
    'email' => 'ZhangSan@Example.COM'
]);

$user->password = 'secret123';

echo $user->full_name;  // 输出: 张 三
echo $user->email;      // 输出: zhangsan@example.com
```

### __isset() 和 __unset()

这两个方法分别在对不可访问属性调用 `isset()`/`empty()` 和 `unset()` 时触发。

```php
<?php

class Container
{
    private array $items = [];

    public function __set(string $name, mixed $value): void
    {
        $this->items[$name] = $value;
    }

    public function __get(string $name): mixed
    {
        return $this->items[$name] ?? null;
    }

    public function __isset(string $name): bool
    {
        echo "检查属性是否存在: {$name}\n";
        return isset($this->items[$name]);
    }

    public function __unset(string $name): void
    {
        echo "删除属性: {$name}\n";
        unset($this->items[$name]);
    }

    public function all(): array
    {
        return $this->items;
    }
}

$container = new Container();
$container->name = '测试';
$container->value = 100;

// 触发 __isset
if (isset($container->name)) {
    echo "name 存在\n";
}

// empty() 也会触发 __isset
if (!empty($container->value)) {
    echo "value 不为空\n";
}

// 触发 __unset
unset($container->name);

print_r($container->all());
// 输出: Array ( [value] => 100 )
```

#### 实现完整的属性管理类

```php
<?php

class Entity
{
    private array $data = [];
    private array $hidden = [];
    private array $guarded = [];

    public function __construct(array $data = [], array $hidden = [], array $guarded = [])
    {
        $this->hidden = $hidden;
        $this->guarded = $guarded;

        foreach ($data as $key => $value) {
            if (!in_array($key, $this->guarded)) {
                $this->data[$key] = $value;
            }
        }
    }

    public function __get(string $name): mixed
    {
        if (in_array($name, $this->hidden)) {
            throw new RuntimeException("属性 {$name} 是隐藏的");
        }

        return $this->data[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        if (in_array($name, $this->guarded)) {
            throw new RuntimeException("属性 {$name} 是受保护的，不能修改");
        }

        $this->data[$name] = $value;
    }

    public function __isset(string $name): bool
    {
        if (in_array($name, $this->hidden)) {
            return false;
        }

        return isset($this->data[$name]);
    }

    public function __unset(string $name): void
    {
        if (in_array($name, $this->guarded)) {
            throw new RuntimeException("属性 {$name} 是受保护的，不能删除");
        }

        unset($this->data[$name]);
    }

    public function toArray(): array
    {
        return array_diff_key($this->data, array_flip($this->hidden));
    }
}

$user = new Entity(
    ['id' => 1, 'name' => '张三', 'password' => 'hashed', 'role' => 'admin'],
    ['password'],  // 隐藏字段
    ['id', 'role'] // 受保护字段
);

echo $user->name;           // 输出: 张三
// echo $user->password;    // 抛出异常: 属性 password 是隐藏的
// $user->id = 2;           // 抛出异常: 属性 id 是受保护的

print_r($user->toArray());
// 输出: Array ( [id] => 1 [name] => 张三 [role] => admin )
```

## 方法重载魔术方法

### __call() - 实例方法重载

当调用对象中不存在或不可访问的方法时，`__call()` 会被自动调用。

```php
<?php

class QueryBuilder
{
    private string $table = '';
    private array $wheres = [];
    private array $orders = [];
    private ?int $limitValue = null;

    public function __call(string $method, array $arguments): self
    {
        // 处理 whereXxx 方法
        if (str_starts_with($method, 'where')) {
            $column = $this->camelToSnake(substr($method, 5));
            $this->wheres[] = [$column, '=', $arguments[0]];
            return $this;
        }

        // 处理 orderByXxx 方法
        if (str_starts_with($method, 'orderBy')) {
            $column = $this->camelToSnake(substr($method, 7));
            $direction = $arguments[0] ?? 'ASC';
            $this->orders[] = [$column, $direction];
            return $this;
        }

        throw new BadMethodCallException("方法不存在: {$method}");
    }

    public function table(string $table): self
    {
        $this->table = $table;
        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limitValue = $limit;
        return $this;
    }

    public function toSql(): string
    {
        $sql = "SELECT * FROM {$this->table}";

        if (!empty($this->wheres)) {
            $conditions = array_map(function ($where) {
                return "{$where[0]} {$where[1]} ?";
            }, $this->wheres);
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        if (!empty($this->orders)) {
            $orders = array_map(function ($order) {
                return "{$order[0]} {$order[1]}";
            }, $this->orders);
            $sql .= ' ORDER BY ' . implode(', ', $orders);
        }

        if ($this->limitValue !== null) {
            $sql .= " LIMIT {$this->limitValue}";
        }

        return $sql;
    }

    private function camelToSnake(string $input): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $input));
    }
}

$query = new QueryBuilder();
$sql = $query
    ->table('users')
    ->whereStatus('active')        // 自动转换为 where status = ?
    ->whereCreatedAt('2024-01-01') // 自动转换为 where created_at = ?
    ->orderByCreatedAt('DESC')     // 自动转换为 order by created_at DESC
    ->limit(10)
    ->toSql();

echo $sql;
// 输出: SELECT * FROM users WHERE status = ? AND created_at = ? ORDER BY created_at DESC LIMIT 10
```

### __callStatic() - 静态方法重载

当调用类中不存在或不可访问的静态方法时，`__callStatic()` 会被自动调用。

```php
<?php

class Facade
{
    protected static array $instances = [];

    public static function __callStatic(string $method, array $arguments): mixed
    {
        $instance = static::getInstance();

        if (!method_exists($instance, $method)) {
            throw new BadMethodCallException(
                sprintf('方法 %s::%s 不存在', static::class, $method)
            );
        }

        return $instance->$method(...$arguments);
    }

    protected static function getInstance(): object
    {
        $class = static::class;

        if (!isset(static::$instances[$class])) {
            static::$instances[$class] = static::createInstance();
        }

        return static::$instances[$class];
    }

    protected static function createInstance(): object
    {
        throw new RuntimeException('子类必须实现 createInstance 方法');
    }
}

class Logger
{
    public function info(string $message): void
    {
        echo "[INFO] {$message}\n";
    }

    public function error(string $message): void
    {
        echo "[ERROR] {$message}\n";
    }

    public function debug(string $message): void
    {
        echo "[DEBUG] {$message}\n";
    }
}

class Log extends Facade
{
    protected static function createInstance(): object
    {
        return new Logger();
    }
}

// 使用静态方法调用，实际执行的是 Logger 实例的方法
Log::info('这是一条信息');   // 输出: [INFO] 这是一条信息
Log::error('发生错误');      // 输出: [ERROR] 发生错误
Log::debug('调试信息');      // 输出: [DEBUG] 调试信息
```

#### 实现链式静态调用

```php
<?php

class DB
{
    private static ?self $instance = null;
    private string $table = '';
    private array $selects = ['*'];
    private array $wheres = [];

    public static function __callStatic(string $method, array $arguments): self
    {
        $instance = new self();
        return $instance->$method(...$arguments);
    }

    public function __call(string $method, array $arguments): self
    {
        if ($method === 'table') {
            $this->table = $arguments[0];
            return $this;
        }

        throw new BadMethodCallException("方法不存在: {$method}");
    }

    public static function table(string $table): self
    {
        $instance = new self();
        $instance->table = $table;
        return $instance;
    }

    public function select(string ...$columns): self
    {
        $this->selects = $columns;
        return $this;
    }

    public function where(string $column, string $operator, mixed $value): self
    {
        $this->wheres[] = compact('column', 'operator', 'value');
        return $this;
    }

    public function get(): array
    {
        $sql = $this->toSql();
        echo "执行 SQL: {$sql}\n";
        // 这里应该执行实际的数据库查询
        return [];
    }

    public function toSql(): string
    {
        $columns = implode(', ', $this->selects);
        $sql = "SELECT {$columns} FROM {$this->table}";

        if (!empty($this->wheres)) {
            $conditions = array_map(function ($w) {
                $value = is_string($w['value']) ? "'{$w['value']}'" : $w['value'];
                return "{$w['column']} {$w['operator']} {$value}";
            }, $this->wheres);
            $sql .= ' WHERE ' . implode(' AND ', $conditions);
        }

        return $sql;
    }
}

// 使用示例
$users = DB::table('users')
    ->select('id', 'name', 'email')
    ->where('status', '=', 'active')
    ->where('age', '>', 18)
    ->get();

// 输出: 执行 SQL: SELECT id, name, email FROM users WHERE status = 'active' AND age > 18
```

## 对象转换魔术方法

### __toString() - 字符串转换

当对象被当作字符串使用时，`__toString()` 方法会被自动调用。

```php
<?php

class Money
{
    private float $amount;
    private string $currency;

    private const SYMBOLS = [
        'CNY' => '¥',
        'USD' => '$',
        'EUR' => '€',
        'GBP' => '£',
        'JPY' => '¥',
    ];

    public function __construct(float $amount, string $currency = 'CNY')
    {
        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public function __toString(): string
    {
        $symbol = self::SYMBOLS[$this->currency] ?? $this->currency;
        return $symbol . number_format($this->amount, 2);
    }

    public function add(Money $other): self
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException('货币类型不匹配');
        }

        return new self($this->amount + $other->amount, $this->currency);
    }

    public function getAmount(): float
    {
        return $this->amount;
    }
}

$price = new Money(99.99);
$tax = new Money(8.00);
$total = $price->add($tax);

echo "价格: {$price}\n";    // 输出: 价格: ¥99.99
echo "税费: {$tax}\n";      // 输出: 税费: ¥8.00
echo "总计: {$total}\n";    // 输出: 总计: ¥107.99

// 可以直接在字符串中使用
echo "您需要支付 {$total}";  // 输出: 您需要支付 ¥107.99
```

#### 实现复杂对象的字符串表示

```php
<?php

class HtmlElement
{
    private string $tag;
    private array $attributes = [];
    private array $children = [];
    private bool $selfClosing;

    private const SELF_CLOSING_TAGS = ['img', 'br', 'hr', 'input', 'meta', 'link'];

    public function __construct(string $tag, array $attributes = [])
    {
        $this->tag = strtolower($tag);
        $this->attributes = $attributes;
        $this->selfClosing = in_array($this->tag, self::SELF_CLOSING_TAGS);
    }

    public function setAttribute(string $name, string $value): self
    {
        $this->attributes[$name] = $value;
        return $this;
    }

    public function addClass(string $class): self
    {
        $existing = $this->attributes['class'] ?? '';
        $classes = array_filter(explode(' ', $existing));
        $classes[] = $class;
        $this->attributes['class'] = implode(' ', array_unique($classes));
        return $this;
    }

    public function append(string|self $child): self
    {
        if ($this->selfClosing) {
            throw new RuntimeException("自闭合标签不能有子元素");
        }
        $this->children[] = $child;
        return $this;
    }

    public function __toString(): string
    {
        $attrs = $this->renderAttributes();

        if ($this->selfClosing) {
            return "<{$this->tag}{$attrs} />";
        }

        $content = implode('', array_map('strval', $this->children));
        return "<{$this->tag}{$attrs}>{$content}</{$this->tag}>";
    }

    private function renderAttributes(): string
    {
        if (empty($this->attributes)) {
            return '';
        }

        $parts = [];
        foreach ($this->attributes as $name => $value) {
            $parts[] = sprintf('%s="%s"', $name, htmlspecialchars($value));
        }

        return ' ' . implode(' ', $parts);
    }
}

// 构建 HTML 结构
$div = new HtmlElement('div', ['class' => 'container']);
$div->addClass('main')
    ->append(
        (new HtmlElement('h1'))
            ->addClass('title')
            ->append('欢迎访问')
    )
    ->append(
        (new HtmlElement('p'))
            ->addClass('content')
            ->append('这是一个 PHP 魔术方法示例。')
    )
    ->append(
        (new HtmlElement('img', ['src' => 'logo.png', 'alt' => 'Logo']))
    );

echo $div;
// 输出:
// <div class="container main">
//   <h1 class="title">欢迎访问</h1>
//   <p class="content">这是一个 PHP 魔术方法示例。</p>
//   <img src="logo.png" alt="Logo" />
// </div>
```

### __invoke() - 可调用对象

当对象被当作函数调用时，`__invoke()` 方法会被自动调用。这使得对象可以像函数一样使用。

```php
<?php

class Validator
{
    private string $pattern;
    private string $message;

    public function __construct(string $pattern, string $message)
    {
        $this->pattern = $pattern;
        $this->message = $message;
    }

    public function __invoke(string $value): bool|string
    {
        if (preg_match($this->pattern, $value)) {
            return true;
        }

        return $this->message;
    }
}

// 创建验证器实例
$emailValidator = new Validator(
    '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/',
    '请输入有效的邮箱地址'
);

$phoneValidator = new Validator(
    '/^1[3-9]\d{9}$/',
    '请输入有效的手机号码'
);

// 像函数一样调用对象
$result = $emailValidator('test@example.com');
echo $result === true ? '邮箱有效' : $result;  // 输出: 邮箱有效

$result = $phoneValidator('12345');
echo "\n" . ($result === true ? '手机号有效' : $result);  // 输出: 请输入有效的手机号码
```

#### 实现中间件模式

```php
<?php

class Middleware
{
    private Closure $handler;

    public function __construct(Closure $handler)
    {
        $this->handler = $handler;
    }

    public function __invoke(array $request, Closure $next): array
    {
        return ($this->handler)($request, $next);
    }
}

class Pipeline
{
    private array $middlewares = [];

    public function pipe(callable $middleware): self
    {
        $this->middlewares[] = $middleware;
        return $this;
    }

    public function process(array $request, Closure $destination): array
    {
        $pipeline = array_reduce(
            array_reverse($this->middlewares),
            function (Closure $next, callable $middleware) {
                return function (array $request) use ($middleware, $next) {
                    return $middleware($request, $next);
                };
            },
            $destination
        );

        return $pipeline($request);
    }
}

// 创建中间件
$authMiddleware = new Middleware(function (array $request, Closure $next) {
    if (!isset($request['token'])) {
        return ['error' => '未授权访问', 'code' => 401];
    }
    echo "认证检查通过\n";
    return $next($request);
});

$loggingMiddleware = new Middleware(function (array $request, Closure $next) {
    echo "请求开始: " . json_encode($request) . "\n";
    $response = $next($request);
    echo "请求结束: " . json_encode($response) . "\n";
    return $response;
});

$rateLimitMiddleware = new Middleware(function (array $request, Closure $next) {
    echo "速率限制检查\n";
    return $next($request);
});

// 构建管道
$pipeline = new Pipeline();
$pipeline
    ->pipe($loggingMiddleware)
    ->pipe($authMiddleware)
    ->pipe($rateLimitMiddleware);

// 处理请求
$response = $pipeline->process(
    ['token' => 'abc123', 'action' => 'getData'],
    function (array $request) {
        return ['data' => '处理结果', 'code' => 200];
    }
);

print_r($response);
```

#### 使用 __invoke 实现策略模式

```php
<?php

interface PricingStrategy
{
    public function __invoke(float $price, int $quantity): float;
}

class RegularPricing implements PricingStrategy
{
    public function __invoke(float $price, int $quantity): float
    {
        return $price * $quantity;
    }
}

class BulkPricing implements PricingStrategy
{
    private int $threshold;
    private float $discount;

    public function __construct(int $threshold = 10, float $discount = 0.1)
    {
        $this->threshold = $threshold;
        $this->discount = $discount;
    }

    public function __invoke(float $price, int $quantity): float
    {
        $total = $price * $quantity;

        if ($quantity >= $this->threshold) {
            $total *= (1 - $this->discount);
        }

        return $total;
    }
}

class VIPPricing implements PricingStrategy
{
    private float $discount;

    public function __construct(float $discount = 0.2)
    {
        $this->discount = $discount;
    }

    public function __invoke(float $price, int $quantity): float
    {
        return $price * $quantity * (1 - $this->discount);
    }
}

class ShoppingCart
{
    private array $items = [];
    private PricingStrategy $strategy;

    public function __construct(PricingStrategy $strategy)
    {
        $this->strategy = $strategy;
    }

    public function addItem(string $name, float $price, int $quantity): void
    {
        $this->items[] = compact('name', 'price', 'quantity');
    }

    public function setStrategy(PricingStrategy $strategy): void
    {
        $this->strategy = $strategy;
    }

    public function getTotal(): float
    {
        $total = 0;
        foreach ($this->items as $item) {
            // 直接调用策略对象
            $total += ($this->strategy)($item['price'], $item['quantity']);
        }
        return $total;
    }
}

// 使用示例
$cart = new ShoppingCart(new RegularPricing());
$cart->addItem('商品A', 100, 5);
$cart->addItem('商品B', 50, 3);

echo "普通价格: ¥" . $cart->getTotal() . "\n";  // 输出: 普通价格: ¥650

$cart->setStrategy(new BulkPricing(5, 0.15));
echo "批量价格: ¥" . $cart->getTotal() . "\n";  // 输出: 批量价格: ¥552.5

$cart->setStrategy(new VIPPricing(0.2));
echo "VIP价格: ¥" . $cart->getTotal() . "\n";   // 输出: VIP价格: ¥520
```

## 对象克隆魔术方法

### __clone() - 克隆对象

当使用 `clone` 关键字克隆对象时，`__clone()` 方法会被自动调用。这允许你自定义克隆行为，特别是处理深拷贝。

```php
<?php

class Address
{
    public function __construct(
        public string $city,
        public string $street
    ) {}
}

class Person
{
    public function __construct(
        public string $name,
        public Address $address,
        public DateTime $createdAt
    ) {}

    public function __clone(): void
    {
        // 深拷贝：克隆嵌套对象
        $this->address = clone $this->address;
        $this->createdAt = clone $this->createdAt;
    }
}

// 创建原始对象
$person1 = new Person(
    '张三',
    new Address('北京', '长安街'),
    new DateTime()
);

// 浅拷贝（没有 __clone）和深拷贝（有 __clone）的区别

// 使用 clone 关键字
$person2 = clone $person1;
$person2->name = '李四';
$person2->address->city = '上海';

echo "Person1: {$person1->name}, {$person1->address->city}\n";
// 输出: Person1: 张三, 北京（地址没有被改变，因为我们做了深拷贝）

echo "Person2: {$person2->name}, {$person2->address->city}\n";
// 输出: Person2: 李四, 上海
```

#### 实现原型模式

```php
<?php

abstract class Prototype
{
    protected string $id;

    public function __construct()
    {
        $this->id = uniqid('obj_');
    }

    public function getId(): string
    {
        return $this->id;
    }

    abstract public function __clone(): void;
}

class Document extends Prototype
{
    private string $title;
    private string $content;
    private array $metadata;
    private DateTime $createdAt;
    private ?DateTime $modifiedAt = null;

    public function __construct(string $title, string $content)
    {
        parent::__construct();
        $this->title = $title;
        $this->content = $content;
        $this->metadata = [];
        $this->createdAt = new DateTime();
    }

    public function setMetadata(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
    }

    public function __clone(): void
    {
        // 生成新 ID
        $this->id = uniqid('obj_');

        // 复制时间对象
        $this->createdAt = new DateTime();
        $this->modifiedAt = null;

        // 深拷贝数组中的对象
        foreach ($this->metadata as $key => $value) {
            if (is_object($value)) {
                $this->metadata[$key] = clone $value;
            }
        }
    }

    public function modify(): void
    {
        $this->modifiedAt = new DateTime();
    }

    public function getInfo(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => substr($this->content, 0, 50) . '...',
            'created' => $this->createdAt->format('Y-m-d H:i:s'),
            'modified' => $this->modifiedAt?->format('Y-m-d H:i:s'),
        ];
    }
}

// 创建原型文档
$template = new Document(
    '报告模板',
    '这是一个标准报告模板，包含...'
);
$template->setMetadata('author', '系统');
$template->setMetadata('version', '1.0');

// 从模板克隆新文档
$report1 = clone $template;
$report2 = clone $template;

echo "模板ID: " . $template->getId() . "\n";
echo "报告1 ID: " . $report1->getId() . "\n";
echo "报告2 ID: " . $report2->getId() . "\n";

// 每个克隆都有独立的 ID
```

#### 防止克隆

有时你可能想禁止对象被克隆，比如单例模式：

```php
<?php

class Singleton
{
    private static ?self $instance = null;

    private function __construct()
    {
        // 私有构造函数
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    // 禁止克隆
    private function __clone(): void
    {
        throw new RuntimeException('单例对象不能被克隆');
    }

    // 禁止反序列化
    public function __wakeup(): void
    {
        throw new RuntimeException('单例对象不能被反序列化');
    }
}

$instance = Singleton::getInstance();
// $clone = clone $instance;  // 致命错误：无法访问私有方法
```

## 序列化魔术方法

### __sleep() 和 __wakeup()

这两个方法用于自定义对象的序列化和反序列化行为。

```php
<?php

class DatabaseConnection
{
    private string $host;
    private string $database;
    private string $username;
    private string $password;
    private ?PDO $connection = null;
    private array $queryLog = [];

    public function __construct(
        string $host,
        string $database,
        string $username,
        string $password
    ) {
        $this->host = $host;
        $this->database = $database;
        $this->username = $username;
        $this->password = $password;
        $this->connect();
    }

    private function connect(): void
    {
        $dsn = "mysql:host={$this->host};dbname={$this->database}";
        // 实际项目中这里会创建 PDO 连接
        echo "建立数据库连接\n";
        // $this->connection = new PDO($dsn, $this->username, $this->password);
    }

    public function query(string $sql): void
    {
        $this->queryLog[] = [
            'sql' => $sql,
            'time' => microtime(true)
        ];
        echo "执行查询: {$sql}\n";
    }

    public function __sleep(): array
    {
        // 序列化前：关闭连接，清理临时数据
        echo "准备序列化，关闭连接\n";
        $this->connection = null;

        // 返回需要序列化的属性名数组
        // 注意：不包含 connection 和 queryLog
        return ['host', 'database', 'username', 'password'];
    }

    public function __wakeup(): void
    {
        // 反序列化后：重新建立连接
        echo "反序列化完成，重新连接\n";
        $this->queryLog = [];
        $this->connect();
    }

    public function getQueryLog(): array
    {
        return $this->queryLog;
    }
}

// 使用示例
$db = new DatabaseConnection('localhost', 'myapp', 'root', 'secret');
$db->query('SELECT * FROM users');
$db->query('SELECT * FROM orders');

// 序列化
$serialized = serialize($db);
echo "序列化数据长度: " . strlen($serialized) . " 字节\n\n";

// 反序列化
$restoredDb = unserialize($serialized);
$restoredDb->query('SELECT * FROM products');

echo "查询日志数量: " . count($restoredDb->getQueryLog()) . "\n";
// 输出: 1（因为之前的日志没有被序列化）
```

### __serialize() 和 __unserialize() (PHP 7.4+)

PHP 7.4 引入了更现代的序列化方法，推荐使用这对方法替代 `__sleep()` 和 `__wakeup()`。

```php
<?php

class Session
{
    private string $id;
    private string $userId;
    private array $data;
    private DateTime $createdAt;
    private DateTime $lastAccess;
    private ?object $connection = null; // 不可序列化的资源

    public function __construct(string $userId)
    {
        $this->id = bin2hex(random_bytes(16));
        $this->userId = $userId;
        $this->data = [];
        $this->createdAt = new DateTime();
        $this->lastAccess = new DateTime();
    }

    public function set(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
        $this->touch();
    }

    public function get(string $key): mixed
    {
        $this->touch();
        return $this->data[$key] ?? null;
    }

    private function touch(): void
    {
        $this->lastAccess = new DateTime();
    }

    public function __serialize(): array
    {
        // 返回要序列化的数据数组
        // 可以自由地转换和处理数据
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'data' => $this->data,
            'createdAt' => $this->createdAt->format('Y-m-d H:i:s'),
            'lastAccess' => $this->lastAccess->format('Y-m-d H:i:s'),
            // connection 不被序列化
        ];
    }

    public function __unserialize(array $data): void
    {
        // 从数组恢复对象状态
        $this->id = $data['id'];
        $this->userId = $data['userId'];
        $this->data = $data['data'];
        $this->createdAt = new DateTime($data['createdAt']);
        $this->lastAccess = new DateTime($data['lastAccess']);
        $this->connection = null; // 需要时重新建立
    }

    public function getInfo(): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->userId,
            'created' => $this->createdAt->format('Y-m-d H:i:s'),
            'lastAccess' => $this->lastAccess->format('Y-m-d H:i:s'),
            'dataKeys' => array_keys($this->data),
        ];
    }
}

// 创建会话
$session = new Session('user_123');
$session->set('cart', ['item1', 'item2']);
$session->set('preferences', ['theme' => 'dark']);

echo "原始会话:\n";
print_r($session->getInfo());

// 序列化
$serialized = serialize($session);

// 反序列化
$restored = unserialize($serialized);

echo "\n恢复的会话:\n";
print_r($restored->getInfo());
```

#### 处理敏感数据

```php
<?php

class SecureConfig
{
    private array $settings;
    private string $encryptionKey;
    private array $sensitiveKeys = ['api_key', 'password', 'secret'];

    public function __construct(array $settings, string $encryptionKey)
    {
        $this->settings = $settings;
        $this->encryptionKey = $encryptionKey;
    }

    public function get(string $key): mixed
    {
        return $this->settings[$key] ?? null;
    }

    public function __serialize(): array
    {
        // 加密敏感数据
        $encryptedSettings = [];

        foreach ($this->settings as $key => $value) {
            if (in_array($key, $this->sensitiveKeys)) {
                $encryptedSettings[$key] = $this->encrypt($value);
            } else {
                $encryptedSettings[$key] = $value;
            }
        }

        return [
            'settings' => $encryptedSettings,
            'sensitiveKeys' => $this->sensitiveKeys,
            // 注意：encryptionKey 不被序列化，需要在反序列化时重新提供
        ];
    }

    public function __unserialize(array $data): void
    {
        $this->sensitiveKeys = $data['sensitiveKeys'];
        $this->settings = $data['settings'];
        // 加密密钥需要从其他安全来源获取
        $this->encryptionKey = getenv('ENCRYPTION_KEY') ?: '';

        // 解密敏感数据
        if ($this->encryptionKey) {
            foreach ($this->sensitiveKeys as $key) {
                if (isset($this->settings[$key])) {
                    $this->settings[$key] = $this->decrypt($this->settings[$key]);
                }
            }
        }
    }

    private function encrypt(string $data): string
    {
        // 简化的加密示例（实际项目中使用更安全的方法）
        return base64_encode(openssl_encrypt(
            $data,
            'AES-256-CBC',
            $this->encryptionKey,
            0,
            substr(md5($this->encryptionKey), 0, 16)
        ));
    }

    private function decrypt(string $data): string
    {
        return openssl_decrypt(
            base64_decode($data),
            'AES-256-CBC',
            $this->encryptionKey,
            0,
            substr(md5($this->encryptionKey), 0, 16)
        );
    }
}
```

## 综合实例：ORM 模型基类

下面是一个综合使用多种魔术方法的实际示例：

```php
<?php

abstract class Model
{
    protected static string $table = '';
    protected static string $primaryKey = 'id';
    protected static array $fillable = [];
    protected static array $hidden = [];
    protected static array $casts = [];

    protected array $attributes = [];
    protected array $original = [];
    protected bool $exists = false;

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    // 静态方法重载：Model::find(), Model::where() 等
    public static function __callStatic(string $method, array $arguments): mixed
    {
        $instance = new static();

        return match ($method) {
            'find' => $instance->findById($arguments[0]),
            'create' => $instance->createNew($arguments[0] ?? []),
            'where' => $instance->newQuery()->where(...$arguments),
            default => throw new BadMethodCallException("方法不存在: {$method}")
        };
    }

    // 实例方法重载：$model->whereXxx() 等
    public function __call(string $method, array $arguments): mixed
    {
        if (str_starts_with($method, 'where')) {
            $column = $this->snakeCase(substr($method, 5));
            return $this->newQuery()->where($column, $arguments[0]);
        }

        throw new BadMethodCallException("方法不存在: {$method}");
    }

    // 属性访问
    public function __get(string $key): mixed
    {
        // 检查访问器
        $method = 'get' . $this->studlyCase($key) . 'Attribute';
        if (method_exists($this, $method)) {
            return $this->$method();
        }

        // 类型转换
        $value = $this->attributes[$key] ?? null;
        return $this->castAttribute($key, $value);
    }

    public function __set(string $key, mixed $value): void
    {
        // 检查修改器
        $method = 'set' . $this->studlyCase($key) . 'Attribute';
        if (method_exists($this, $method)) {
            $this->$method($value);
            return;
        }

        // 检查是否可填充
        if (!empty(static::$fillable) && !in_array($key, static::$fillable)) {
            throw new RuntimeException("属性 {$key} 不可填充");
        }

        $this->attributes[$key] = $value;
    }

    public function __isset(string $key): bool
    {
        return isset($this->attributes[$key]);
    }

    public function __unset(string $key): void
    {
        unset($this->attributes[$key]);
    }

    // 字符串转换
    public function __toString(): string
    {
        return json_encode($this->toArray(), JSON_UNESCAPED_UNICODE);
    }

    // 作为函数调用：$model($id) 等同于 $model->find($id)
    public function __invoke(int $id): ?static
    {
        return $this->findById($id);
    }

    // 克隆时重置状态
    public function __clone(): void
    {
        $this->exists = false;
        unset($this->attributes[static::$primaryKey]);
        $this->original = [];
    }

    // 序列化
    public function __serialize(): array
    {
        return [
            'attributes' => $this->attributes,
            'original' => $this->original,
            'exists' => $this->exists,
        ];
    }

    public function __unserialize(array $data): void
    {
        $this->attributes = $data['attributes'];
        $this->original = $data['original'];
        $this->exists = $data['exists'];
    }

    // 辅助方法
    public function fill(array $attributes): self
    {
        foreach ($attributes as $key => $value) {
            $this->$key = $value;
        }
        return $this;
    }

    public function toArray(): array
    {
        $result = [];
        foreach ($this->attributes as $key => $value) {
            if (!in_array($key, static::$hidden)) {
                $result[$key] = $this->$key;
            }
        }
        return $result;
    }

    public function isDirty(): bool
    {
        return $this->attributes !== $this->original;
    }

    protected function findById(int $id): ?static
    {
        echo "查询: SELECT * FROM " . static::$table . " WHERE " . static::$primaryKey . " = {$id}\n";
        // 实际会执行数据库查询
        return null;
    }

    protected function createNew(array $attributes): static
    {
        $model = new static($attributes);
        $model->save();
        return $model;
    }

    protected function newQuery(): QueryBuilder
    {
        return new QueryBuilder(static::$table);
    }

    public function save(): bool
    {
        if ($this->exists) {
            echo "更新: UPDATE " . static::$table . " SET ... WHERE " . static::$primaryKey . " = {$this->attributes[static::$primaryKey]}\n";
        } else {
            echo "插入: INSERT INTO " . static::$table . " ...\n";
            $this->exists = true;
        }

        $this->original = $this->attributes;
        return true;
    }

    protected function castAttribute(string $key, mixed $value): mixed
    {
        if (!isset(static::$casts[$key]) || $value === null) {
            return $value;
        }

        return match (static::$casts[$key]) {
            'int', 'integer' => (int) $value,
            'float', 'double' => (float) $value,
            'bool', 'boolean' => (bool) $value,
            'array' => json_decode($value, true),
            'datetime' => new DateTime($value),
            default => $value
        };
    }

    private function studlyCase(string $value): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $value)));
    }

    private function snakeCase(string $value): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $value));
    }
}

// 简化的查询构建器
class QueryBuilder
{
    private string $table;
    private array $wheres = [];

    public function __construct(string $table)
    {
        $this->table = $table;
    }

    public function where(string $column, mixed $value): self
    {
        $this->wheres[] = [$column, '=', $value];
        return $this;
    }

    public function get(): array
    {
        echo "执行查询: SELECT * FROM {$this->table}";
        if (!empty($this->wheres)) {
            $conditions = array_map(fn($w) => "{$w[0]} {$w[1]} '{$w[2]}'", $this->wheres);
            echo " WHERE " . implode(' AND ', $conditions);
        }
        echo "\n";
        return [];
    }
}

// 使用示例
class User extends Model
{
    protected static string $table = 'users';
    protected static array $fillable = ['name', 'email', 'password'];
    protected static array $hidden = ['password'];
    protected static array $casts = [
        'email_verified' => 'bool',
        'created_at' => 'datetime',
    ];

    // 访问器：获取全名
    protected function getDisplayNameAttribute(): string
    {
        return strtoupper($this->attributes['name'] ?? '');
    }

    // 修改器：密码自动加密
    protected function setPasswordAttribute(string $value): void
    {
        $this->attributes['password'] = password_hash($value, PASSWORD_DEFAULT);
    }
}

// 演示
echo "=== 创建用户 ===\n";
$user = new User([
    'name' => '张三',
    'email' => 'zhangsan@example.com',
    'password' => 'secret123'
]);

echo "显示名称: " . $user->display_name . "\n";
echo "JSON: " . $user . "\n\n";

echo "=== 静态方法 ===\n";
User::find(1);
User::where('status', 'active')->get();

echo "\n=== 实例方法 ===\n";
$user->whereEmail('test@example.com')->get();

echo "\n=== 克隆 ===\n";
$clone = clone $user;
echo "克隆后存在: " . ($clone->exists ? '是' : '否') . "\n";
```

## 最佳实践

### 适度使用魔术方法

魔术方法虽然强大，但过度使用会使代码难以理解和维护：

```php
<?php

// 不推荐：过度使用魔术方法
class OverlyMagic
{
    private array $data = [];

    public function __get($name) { return $this->data[$name] ?? null; }
    public function __set($name, $value) { $this->data[$name] = $value; }
    public function __call($method, $args) { /* 复杂逻辑 */ }
    public function __callStatic($method, $args) { /* 更多逻辑 */ }
}

// 推荐：明确的方法定义，魔术方法作为补充
class WellDesigned
{
    private string $name;
    private array $metadata = [];

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    // 仅对动态元数据使用魔术方法
    public function __get(string $key): mixed
    {
        return $this->metadata[$key] ?? null;
    }

    public function __set(string $key, mixed $value): void
    {
        $this->metadata[$key] = $value;
    }
}
```

### 提供良好的类型提示和文档

```php
<?php

/**
 * 配置容器类
 *
 * @property string $app_name 应用名称
 * @property bool $debug 调试模式
 * @property array $database 数据库配置
 *
 * @method static self getInstance() 获取单例实例
 * @method mixed get(string $key, mixed $default = null) 获取配置项
 */
class Config
{
    private static ?self $instance = null;
    private array $items = [];

    public static function __callStatic(string $method, array $arguments): mixed
    {
        if ($method === 'getInstance') {
            return self::$instance ??= new self();
        }

        return self::getInstance()->$method(...$arguments);
    }

    public function __get(string $name): mixed
    {
        return $this->items[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        $this->items[$name] = $value;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->items[$key] ?? $default;
    }
}
```

### 异常处理

```php
<?php

class StrictEntity
{
    private array $allowed = ['id', 'name', 'email'];
    private array $data = [];

    public function __get(string $name): mixed
    {
        if (!in_array($name, $this->allowed)) {
            throw new OutOfBoundsException(
                sprintf('属性 "%s" 不存在于 %s', $name, static::class)
            );
        }

        return $this->data[$name] ?? null;
    }

    public function __set(string $name, mixed $value): void
    {
        if (!in_array($name, $this->allowed)) {
            throw new OutOfBoundsException(
                sprintf('不能设置未定义的属性 "%s"', $name)
            );
        }

        $this->data[$name] = $value;
    }

    public function __call(string $method, array $arguments): mixed
    {
        throw new BadMethodCallException(
            sprintf('方法 %s::%s() 不存在', static::class, $method)
        );
    }
}
```

## 总结

PHP 魔术方法是面向对象编程中的强大工具，它们允许你：

1. **控制对象生命周期**：使用 `__construct()` 和 `__destruct()` 管理资源
2. **实现属性重载**：使用 `__get()`、`__set()`、`__isset()` 和 `__unset()` 创建动态属性
3. **实现方法重载**：使用 `__call()` 和 `__callStatic()` 处理动态方法调用
4. **自定义对象表示**：使用 `__toString()` 和 `__invoke()` 改变对象行为
5. **控制克隆行为**：使用 `__clone()` 实现深拷贝
6. **自定义序列化**：使用 `__sleep()`/`__wakeup()` 或 `__serialize()`/`__unserialize()` 控制序列化过程

合理使用这些魔术方法可以让你的代码更加优雅、灵活，但要注意不要过度使用，保持代码的可读性和可维护性。
