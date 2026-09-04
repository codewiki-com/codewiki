---
title: PHP 面向对象编程
description: 掌握 PHP OOP：类、继承、接口、Traits 和魔术方法
track: php
section: oop
difficulty: intermediate
tags:
  - PHP
  - OOP
  - Classes
  - Traits
status: imported
origin: old/src/content/docs/php/oop.zh.md
divergence: 0.218
issues: []
legacy:
  category: PHP
  subcategory: Object-Oriented
  order: 2
  lastUpdated: 2026-01-07
---

面向对象编程（OOP）是一种使用"对象"来设计应用程序和程序的编程范式。PHP 提供了对 OOP 的全面支持，使编写可维护、可重用和有组织的代码变得更加容易。

## 类和对象

类是创建对象的蓝图。对象是类的实例。

### 基本类定义

```php
<?php

class Car {
    // 属性
    public $brand;
    public $model;
    public $year;

    // 方法
    public function startEngine() {
        return "Engine started!";
    }

    public function getInfo() {
        return "{$this->brand} {$this->model} ({$this->year})";
    }
}

// 创建对象
$car1 = new Car();
$car1->brand = "Toyota";
$car1->model = "Camry";
$car1->year = 2024;

echo $car1->getInfo(); // Toyota Camry (2024)
echo $car1->startEngine(); // Engine started!

$car2 = new Car();
$car2->brand = "Honda";
$car2->model = "Civic";
$car2->year = 2023;
```

## 属性和方法

属性是属于类的变量，方法是属于类的函数。

### 属性类型

```php
<?php

class Product {
    // 类型化属性（PHP 7.4+）
    public string $name;
    public float $price;
    public int $stock;
    private ?string $description = null;

    // 带有默认值的属性
    public bool $isAvailable = true;

    // 数组属性
    public array $categories = [];

    public function addCategory(string $category): void {
        $this->categories[] = $category;
    }

    public function updateStock(int $quantity): void {
        $this->stock += $quantity;
        $this->isAvailable = $this->stock > 0;
    }
}

$product = new Product();
$product->name = "Laptop";
$product->price = 999.99;
$product->stock = 10;
$product->addCategory("Electronics");
$product->addCategory("Computers");
```

## 构造函数和析构函数

构造函数是在创建对象时调用的特殊方法。析构函数在对象被销毁时调用。

### 构造函数

```php
<?php

class User {
    private string $username;
    private string $email;
    private DateTime $createdAt;

    // 构造函数
    public function __construct(string $username, string $email) {
        $this->username = $username;
        $this->email = $email;
        $this->createdAt = new DateTime();
    }

    public function getUsername(): string {
        return $this->username;
    }

    public function getEmail(): string {
        return $this->email;
    }
}

// 使用构造函数
$user = new User("john_doe", "john@example.com");
echo $user->getUsername(); // john_doe
```

### 构造函数属性提升（PHP 8.0+）

```php
<?php

class Customer {
    // 构造函数属性提升 - 更简洁的语法
    public function __construct(
        private string $name,
        private string $email,
        private ?string $phone = null,
        private array $orders = []
    ) {}

    public function getName(): string {
        return $this->name;
    }

    public function addOrder(string $order): void {
        $this->orders[] = $order;
    }

    public function getOrders(): array {
        return $this->orders;
    }
}

$customer = new Customer("Jane Smith", "jane@example.com", "555-0123");
$customer->addOrder("Order #1001");
```

### 析构函数

```php
<?php

class DatabaseConnection {
    private $connection;

    public function __construct(string $host, string $database) {
        $this->connection = new PDO("mysql:host={$host};dbname={$database}");
        echo "Database connection established\n";
    }

    // 析构函数
    public function __destruct() {
        $this->connection = null;
        echo "Database connection closed\n";
    }
}

$db = new DatabaseConnection("localhost", "mydb");
// 当脚本结束或对象被 unset 时，析构函数会自动调用
```

## 继承

继承允许一个类从另一个类继承属性和方法。

### 基本继承

```php
<?php

// 父类（基类）
class Animal {
    protected string $name;
    protected int $age;

    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }

    public function eat(): string {
        return "{$this->name} is eating.";
    }

    public function sleep(): string {
        return "{$this->name} is sleeping.";
    }

    public function getInfo(): string {
        return "{$this->name} is {$this->age} years old.";
    }
}

// 子类（派生类）
class Dog extends Animal {
    private string $breed;

    public function __construct(string $name, int $age, string $breed) {
        parent::__construct($name, $age); // 调用父类构造函数
        $this->breed = $breed;
    }

    public function bark(): string {
        return "{$this->name} says: Woof! Woof!";
    }

    // 重写父类方法
    public function getInfo(): string {
        return parent::getInfo() . " Breed: {$this->breed}";
    }
}

class Cat extends Animal {
    private bool $isIndoor;

    public function __construct(string $name, int $age, bool $isIndoor = true) {
        parent::__construct($name, $age);
        $this->isIndoor = $isIndoor;
    }

    public function meow(): string {
        return "{$this->name} says: Meow!";
    }
}

// 用法
$dog = new Dog("Buddy", 3, "Golden Retriever");
echo $dog->getInfo(); // Buddy is 3 years old. Breed: Golden Retriever
echo $dog->bark(); // Buddy says: Woof! Woof!
echo $dog->eat(); // Buddy is eating.

$cat = new Cat("Whiskers", 2);
echo $cat->meow(); // Whiskers says: Meow!
echo $cat->sleep(); // Whiskers is sleeping.
```

### Final 类和方法

```php
<?php

class PaymentProcessor {
    // Final 方法不能被重写
    final public function validatePayment(float $amount): bool {
        return $amount > 0;
    }

    public function processPayment(float $amount): bool {
        if ($this->validatePayment($amount)) {
            return true;
        }
        return false;
    }
}

// Final 类不能被继承
final class CreditCardProcessor extends PaymentProcessor {
    public function processPayment(float $amount): bool {
        // 可以重写非 final 方法
        echo "Processing credit card payment: ${$amount}\n";
        return parent::processPayment($amount);
    }

    // 这会导致错误：
    // public function validatePayment(float $amount): bool { }
}

// 这会导致错误：
// class NewProcessor extends CreditCardProcessor { }
```

## 抽象类

抽象类不能被实例化，只能被继承。它们可以包含必须由子类实现的抽象方法。

```php
<?php

abstract class Shape {
    protected string $color;

    public function __construct(string $color) {
        $this->color = $color;
    }

    // 抽象方法 - 必须由子类实现
    abstract public function calculateArea(): float;
    abstract public function calculatePerimeter(): float;

    // 具体方法 - 可被子类使用
    public function getColor(): string {
        return $this->color;
    }

    public function describe(): string {
        return "A {$this->color} shape with area: " .
               $this->calculateArea() . " and perimeter: " .
               $this->calculatePerimeter();
    }
}

class Rectangle extends Shape {
    private float $width;
    private float $height;

    public function __construct(string $color, float $width, float $height) {
        parent::__construct($color);
        $this->width = $width;
        $this->height = $height;
    }

    public function calculateArea(): float {
        return $this->width * $this->height;
    }

    public function calculatePerimeter(): float {
        return 2 * ($this->width + $this->height);
    }
}

class Circle extends Shape {
    private float $radius;

    public function __construct(string $color, float $radius) {
        parent::__construct($color);
        $this->radius = $radius;
    }

    public function calculateArea(): float {
        return pi() * $this->radius ** 2;
    }

    public function calculatePerimeter(): float {
        return 2 * pi() * $this->radius;
    }
}

// 用法
$rectangle = new Rectangle("blue", 10, 5);
echo $rectangle->describe();
// A blue shape with area: 50 and perimeter: 30

$circle = new Circle("red", 7);
echo $circle->describe();
// A red shape with area: 153.93804002589985 and perimeter: 43.982297150257104

// 这会导致错误：
// $shape = new Shape("green");
```

## 接口

接口定义类必须遵循的契约。它们只包含方法签名，没有实现。

### 基本接口

```php
<?php

interface Logger {
    public function log(string $message): void;
    public function error(string $message): void;
    public function warning(string $message): void;
}

class FileLogger implements Logger {
    private string $filename;

    public function __construct(string $filename) {
        $this->filename = $filename;
    }

    public function log(string $message): void {
        file_put_contents($this->filename, "[LOG] {$message}\n", FILE_APPEND);
    }

    public function error(string $message): void {
        file_put_contents($this->filename, "[ERROR] {$message}\n", FILE_APPEND);
    }

    public function warning(string $message): void {
        file_put_contents($this->filename, "[WARNING] {$message}\n", FILE_APPEND);
    }
}

class DatabaseLogger implements Logger {
    private $connection;

    public function __construct($connection) {
        $this->connection = $connection;
    }

    public function log(string $message): void {
        // 将日志插入数据库
        echo "Logging to database: {$message}\n";
    }

    public function error(string $message): void {
        echo "Error to database: {$message}\n";
    }

    public function warning(string $message): void {
        echo "Warning to database: {$message}\n";
    }
}

// 使用类型提示
function logMessage(Logger $logger, string $message): void {
    $logger->log($message);
}

$fileLogger = new FileLogger("app.log");
$dbLogger = new DatabaseLogger(null);

logMessage($fileLogger, "Application started");
logMessage($dbLogger, "User logged in");
```

### 多接口实现

```php
<?php

interface Readable {
    public function read(): string;
}

interface Writable {
    public function write(string $data): bool;
}

interface Deletable {
    public function delete(): bool;
}

// 一个类可以实现多个接口
class File implements Readable, Writable, Deletable {
    private string $filename;
    private string $content = "";

    public function __construct(string $filename) {
        $this->filename = $filename;
    }

    public function read(): string {
        if (file_exists($this->filename)) {
            $this->content = file_get_contents($this->filename);
        }
        return $this->content;
    }

    public function write(string $data): bool {
        $this->content = $data;
        return file_put_contents($this->filename, $data) !== false;
    }

    public function delete(): bool {
        if (file_exists($this->filename)) {
            return unlink($this->filename);
        }
        return false;
    }
}
```

### 接口继承

```php
<?php

interface Vehicle {
    public function start(): void;
    public function stop(): void;
}

interface ElectricVehicle extends Vehicle {
    public function charge(int $minutes): void;
    public function getBatteryLevel(): int;
}

class Tesla implements ElectricVehicle {
    private bool $isRunning = false;
    private int $batteryLevel = 100;

    public function start(): void {
        $this->isRunning = true;
        echo "Tesla started silently\n";
    }

    public function stop(): void {
        $this->isRunning = false;
        echo "Tesla stopped\n";
    }

    public function charge(int $minutes): void {
        $this->batteryLevel = min(100, $this->batteryLevel + $minutes);
        echo "Charged for {$minutes} minutes. Battery: {$this->batteryLevel}%\n";
    }

    public function getBatteryLevel(): int {
        return $this->batteryLevel;
    }
}
```

## Traits

Traits 允许你在多个类中复用代码。与继承不同，一个类可以使用多个 Traits。

### 基本 Traits

```php
<?php

trait Timestampable {
    private DateTime $createdAt;
    private ?DateTime $updatedAt = null;

    public function initializeTimestamps(): void {
        $this->createdAt = new DateTime();
    }

    public function updateTimestamp(): void {
        $this->updatedAt = new DateTime();
    }

    public function getCreatedAt(): DateTime {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?DateTime {
        return $this->updatedAt;
    }
}

trait Sluggable {
    private string $slug;

    public function generateSlug(string $text): void {
        $this->slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text), '-'));
    }

    public function getSlug(): string {
        return $this->slug;
    }
}

class Article {
    use Timestampable, Sluggable;

    private string $title;
    private string $content;

    public function __construct(string $title, string $content) {
        $this->title = $title;
        $this->content = $content;
        $this->initializeTimestamps();
        $this->generateSlug($title);
    }

    public function update(string $content): void {
        $this->content = $content;
        $this->updateTimestamp();
    }

    public function getTitle(): string {
        return $this->title;
    }
}

// 用法
$article = new Article("PHP Object Oriented Programming", "Content here...");
echo $article->getSlug(); // php-object-oriented-programming
echo $article->getCreatedAt()->format('Y-m-d H:i:s');

sleep(2);
$article->update("Updated content...");
echo $article->getUpdatedAt()->format('Y-m-d H:i:s');
```

### Trait 冲突解决

```php
<?php

trait Logger {
    public function log(string $message): void {
        echo "[LOG] {$message}\n";
    }

    public function process(): void {
        echo "Logger processing\n";
    }
}

trait Debugger {
    public function log(string $message): void {
        echo "[DEBUG] {$message}\n";
    }

    public function process(): void {
        echo "Debugger processing\n";
    }
}

class Application {
    use Logger, Debugger {
        // 使用 Logger 的 log 方法而不是 Debugger 的
        Logger::log insteadof Debugger;

        // 使用 Debugger 的 process 方法而不是 Logger 的
        Debugger::process insteadof Logger;

        // 为 Debugger 的 log 方法创建别名
        Debugger::log as debugLog;

        // 为 Logger 的 process 方法创建别名
        Logger::process as logProcess;
    }

    public function run(): void {
        $this->log("Application started");
        $this->debugLog("Debugging application");
        $this->process();
        $this->logProcess();
    }
}

$app = new Application();
$app->run();
```

### 带有抽象方法的 Traits

```php
<?php

trait Validatable {
    private array $errors = [];

    // 使用此 trait 的类必须实现的抽象方法
    abstract protected function rules(): array;

    public function validate(array $data): bool {
        $this->errors = [];
        $rules = $this->rules();

        foreach ($rules as $field => $rule) {
            if ($rule === 'required' && empty($data[$field])) {
                $this->errors[$field] = "{$field} is required";
            }
        }

        return empty($this->errors);
    }

    public function getErrors(): array {
        return $this->errors;
    }
}

class UserForm {
    use Validatable;

    protected function rules(): array {
        return [
            'username' => 'required',
            'email' => 'required',
            'password' => 'required'
        ];
    }
}

$form = new UserForm();
$isValid = $form->validate(['username' => 'john']);
if (!$isValid) {
    print_r($form->getErrors());
}
```

## 魔术方法

魔术方法是以 `__` 开头的特殊方法，在特定情况下会自动调用。

### __toString()

```php
<?php

class Book {
    public function __construct(
        private string $title,
        private string $author,
        private int $year
    ) {}

    public function __toString(): string {
        return "\"{$this->title}\" by {$this->author} ({$this->year})";
    }
}

$book = new Book("1984", "George Orwell", 1949);
echo $book; // "1984" by George Orwell (1949)
```

### __get() 和 __set()

```php
<?php

class DynamicProperties {
    private array $data = [];

    // 读取不可访问属性时调用
    public function __get(string $name) {
        if (array_key_exists($name, $this->data)) {
            return $this->data[$name];
        }
        return null;
    }

    // 写入不可访问属性时调用
    public function __set(string $name, $value): void {
        $this->data[$name] = $value;
    }

    // 检查不可访问属性是否设置时调用
    public function __isset(string $name): bool {
        return isset($this->data[$name]);
    }

    // 删除不可访问属性时调用
    public function __unset(string $name): void {
        unset($this->data[$name]);
    }
}

$obj = new DynamicProperties();
$obj->name = "John"; // 调用 __set()
echo $obj->name; // 调用 __get() - 输出：John
var_dump(isset($obj->name)); // 调用 __isset() - 输出：bool(true)
unset($obj->name); // 调用 __unset()
```

### __call() 和 __callStatic()

```php
<?php

class MagicCaller {
    private array $methods = [];

    // 注册动态方法
    public function addMethod(string $name, callable $callback): void {
        $this->methods[$name] = $callback;
    }

    // 调用不可访问的实例方法时调用
    public function __call(string $name, array $arguments) {
        if (isset($this->methods[$name])) {
            return call_user_func_array($this->methods[$name], $arguments);
        }
        throw new Exception("Method {$name} does not exist");
    }

    // 调用不可访问的静态方法时调用
    public static function __callStatic(string $name, array $arguments) {
        echo "Static method {$name} called with arguments: " .
             implode(', ', $arguments) . "\n";
    }
}

$obj = new MagicCaller();
$obj->addMethod('greet', function($name) {
    return "Hello, {$name}!";
});

echo $obj->greet("Alice"); // Hello, Alice!
MagicCaller::someStaticMethod("arg1", "arg2");
```

### __invoke()

```php
<?php

class Multiplier {
    public function __construct(
        private int $factor
    ) {}

    // 使对象可以像函数一样调用
    public function __invoke(int $number): int {
        return $number * $this->factor;
    }
}

$double = new Multiplier(2);
$triple = new Multiplier(3);

echo $double(5); // 10
echo $triple(5); // 15

// 可以与数组函数一起使用
$numbers = [1, 2, 3, 4, 5];
$doubled = array_map($double, $numbers);
print_r($doubled); // [2, 4, 6, 8, 10]
```

### __clone()

```php
<?php

class Address {
    public function __construct(
        public string $street,
        public string $city
    ) {}
}

class Person {
    public function __construct(
        private string $name,
        private Address $address
    ) {}

    // 当对象被克隆时调用
    public function __clone() {
        // 深拷贝 address 对象
        $this->address = clone $this->address;
    }

    public function getAddress(): Address {
        return $this->address;
    }

    public function getName(): string {
        return $this->name;
    }
}

$address = new Address("123 Main St", "New York");
$person1 = new Person("John", $address);
$person2 = clone $person1;

// 如果没有 __clone()，两个 person 将共享同一个 address 对象
$person2->getAddress()->street = "456 Oak Ave";

echo $person1->getAddress()->street; // 123 Main St
echo $person2->getAddress()->street; // 456 Oak Ave
```

### __serialize() 和 __unserialize()

```php
<?php

class Session {
    private string $id;
    private array $data;
    private DateTime $createdAt;

    public function __construct(string $id) {
        $this->id = $id;
        $this->data = [];
        $this->createdAt = new DateTime();
    }

    public function set(string $key, $value): void {
        $this->data[$key] = $value;
    }

    // 序列化时调用
    public function __serialize(): array {
        return [
            'id' => $this->id,
            'data' => $this->data,
            'created' => $this->createdAt->format('Y-m-d H:i:s')
        ];
    }

    // 反序列化时调用
    public function __unserialize(array $data): void {
        $this->id = $data['id'];
        $this->data = $data['data'];
        $this->createdAt = new DateTime($data['created']);
    }
}

$session = new Session("abc123");
$session->set("user_id", 42);
$session->set("username", "john");

$serialized = serialize($session);
$restored = unserialize($serialized);
```

### __debugInfo()

```php
<?php

class SecureUser {
    public function __construct(
        private string $username,
        private string $password,
        private string $email
    ) {}

    // 自定义 var_dump() 显示的内容
    public function __debugInfo(): array {
        return [
            'username' => $this->username,
            'email' => $this->email,
            'password' => '***HIDDEN***'
        ];
    }
}

$user = new SecureUser("john_doe", "secret123", "john@example.com");
var_dump($user);
// 显示 username 和 email，但隐藏 password
```

## 访问修饰符

PHP 有三种访问修饰符，控制属性和方法的可见性。

```php
<?php

class BankAccount {
    // Public：从任何地方都可访问
    public string $accountHolder;

    // Protected：在类和子类中可访问
    protected float $balance = 0;

    // Private：仅在本类中可访问
    private string $accountNumber;

    public function __construct(string $holder, string $accountNumber) {
        $this->accountHolder = $holder;
        $this->accountNumber = $accountNumber;
    }

    public function deposit(float $amount): void {
        if ($this->validateAmount($amount)) {
            $this->balance += $amount;
        }
    }

    public function getBalance(): float {
        return $this->balance;
    }

    // 私有方法
    private function validateAmount(float $amount): bool {
        return $amount > 0;
    }

    // 受保护方法
    protected function logTransaction(string $type, float $amount): void {
        echo "[{$type}] Amount: {$amount}, New balance: {$this->balance}\n";
    }
}

class SavingsAccount extends BankAccount {
    private float $interestRate;

    public function __construct(string $holder, string $accountNumber, float $rate) {
        parent::__construct($holder, $accountNumber);
        $this->interestRate = $rate;
    }

    public function addInterest(): void {
        $interest = $this->balance * $this->interestRate;
        $this->balance += $interest;
        $this->logTransaction("Interest", $interest); // 可以访问受保护方法

        // 不能访问私有属性：
        // echo $this->accountNumber; // 错误！
    }
}

$account = new SavingsAccount("Jane Doe", "ACC001", 0.05);
$account->deposit(1000);
$account->addInterest();
echo $account->getBalance(); // 1050
```

## 静态属性和方法

静态属性和方法属于类本身，而不是实例。

```php
<?php

class Counter {
    // 静态属性
    private static int $count = 0;
    private static array $instances = [];

    private int $id;

    public function __construct() {
        self::$count++;
        $this->id = self::$count;
        self::$instances[] = $this;
    }

    // 静态方法
    public static function getCount(): int {
        return self::$count;
    }

    public static function getInstances(): array {
        return self::$instances;
    }

    public function getId(): int {
        return $this->id;
    }

    // 重置计数器的静态方法
    public static function reset(): void {
        self::$count = 0;
        self::$instances = [];
    }
}

$obj1 = new Counter();
$obj2 = new Counter();
$obj3 = new Counter();

echo Counter::getCount(); // 3
echo $obj1->getId(); // 1
echo $obj2->getId(); // 2

Counter::reset();
echo Counter::getCount(); // 0
```

### 延迟静态绑定

```php
<?php

class ParentClass {
    protected static string $name = "Parent";

    public static function getName(): string {
        return static::$name; // 使用 'static' 进行延迟静态绑定
    }

    public static function getNameEarly(): string {
        return self::$name; // 使用 'self' 进行早期绑定
    }
}

class ChildClass extends ParentClass {
    protected static string $name = "Child";
}

echo ParentClass::getName(); // Parent
echo ChildClass::getName(); // Child（延迟静态绑定）

echo ParentClass::getNameEarly(); // Parent
echo ChildClass::getNameEarly(); // Parent（早期绑定，始终引用 ParentClass）
```

## 类型声明

PHP 支持属性、参数和返回类型的类型声明。

### 属性类型

```php
<?php

class TypedClass {
    // 标量类型
    public int $integer;
    public float $decimal;
    public string $text;
    public bool $flag;

    // 数组类型
    public array $items;

    // 对象类型
    public DateTime $date;

    // 可空类型
    public ?string $optionalText = null;

    // 联合类型（PHP 8.0+）
    public int|float $number;

    // Mixed 类型（PHP 8.0+）
    public mixed $anything;

    public function __construct() {
        $this->integer = 42;
        $this->decimal = 3.14;
        $this->text = "Hello";
        $this->flag = true;
        $this->items = [1, 2, 3];
        $this->date = new DateTime();
        $this->number = 10;
        $this->anything = "can be anything";
    }
}
```

### 方法类型声明

```php
<?php

class Calculator {
    // 参数和返回类型声明
    public function add(int $a, int $b): int {
        return $a + $b;
    }

    public function divide(float $a, float $b): float|string {
        if ($b === 0.0) {
            return "Cannot divide by zero";
        }
        return $a / $b;
    }

    // 可空返回类型
    public function findUser(int $id): ?User {
        // 返回 User 对象或 null
        return null;
    }

    // Void 返回类型（不返回任何内容）
    public function logMessage(string $message): void {
        echo $message . "\n";
    }

    // Never 返回类型（PHP 8.1+）- 永远不会正常返回
    public function throwError(): never {
        throw new Exception("Error occurred");
    }

    // Mixed 参数类型
    public function process(mixed $data): mixed {
        return $data;
    }
}
```

### 只读属性（PHP 8.1+）

```php
<?php

class ImmutablePoint {
    public function __construct(
        public readonly float $x,
        public readonly float $y
    ) {}
}

$point = new ImmutablePoint(10.5, 20.3);
echo $point->x; // 10.5

// 这会导致错误：
// $point->x = 15; // Cannot modify readonly property
```

## 最佳实践

### 单一职责原则

每个类应该只有一个职责。

```php
<?php

// 不好：类做太多事情
class UserBad {
    public function createUser($data) { }
    public function sendEmail($email) { }
    public function logActivity($message) { }
}

// 好：分离职责
class User {
    public function __construct(
        private string $name,
        private string $email
    ) {}

    public function getName(): string {
        return $this->name;
    }
}

class UserRepository {
    public function save(User $user): bool {
        // 将用户保存到数据库
        return true;
    }
}

class EmailService {
    public function send(string $to, string $subject, string $body): void {
        // 发送邮件
    }
}

class ActivityLogger {
    public function log(string $message): void {
        // 记录活动
    }
}
```

### 依赖注入

注入依赖而不是在类内部创建它们。

```php
<?php

// 不好：硬编码依赖
class OrderProcessorBad {
    private $logger;

    public function __construct() {
        $this->logger = new FileLogger("orders.log"); // 硬编码
    }
}

// 好：依赖注入
class OrderProcessor {
    public function __construct(
        private Logger $logger,
        private PaymentGateway $gateway
    ) {}

    public function process(Order $order): bool {
        $this->logger->log("Processing order #{$order->getId()}");
        return $this->gateway->charge($order->getTotal());
    }
}

// 用法
$logger = new FileLogger("orders.log");
$gateway = new StripeGateway();
$processor = new OrderProcessor($logger, $gateway);
```

### 使用类型提示

始终使用类型提示以获得更好的代码质量和 IDE 支持。

```php
<?php

// 不好：没有类型提示
class UserServiceBad {
    public function create($name, $email) {
        // ...
    }
}

// 好：到处都有类型提示
class UserService {
    public function create(string $name, string $email): User {
        return new User($name, $email);
    }

    public function findById(int $id): ?User {
        // 返回 User 或 null
        return null;
    }

    public function getAll(): array {
        return [];
    }
}
```

### 使用接口作为契约

定义接口以获得更好的抽象和可测试性。

```php
<?php

interface CacheInterface {
    public function get(string $key): mixed;
    public function set(string $key, mixed $value, int $ttl = 3600): bool;
    public function delete(string $key): bool;
}

class RedisCache implements CacheInterface {
    public function get(string $key): mixed {
        // Redis 实现
        return null;
    }

    public function set(string $key, mixed $value, int $ttl = 3600): bool {
        // Redis 实现
        return true;
    }

    public function delete(string $key): bool {
        // Redis 实现
        return true;
    }
}

class FileCache implements CacheInterface {
    public function get(string $key): mixed {
        // 文件实现
        return null;
    }

    public function set(string $key, mixed $value, int $ttl = 3600): bool {
        // 文件实现
        return true;
    }

    public function delete(string $key): bool {
        // 文件实现
        return true;
    }
}

// 易于切换实现
class Application {
    public function __construct(
        private CacheInterface $cache
    ) {}
}
```

### 优先使用组合而不是继承

```php
<?php

// 替代深层继承层次结构
interface Flyable {
    public function fly(): string;
}

interface Swimmable {
    public function swim(): string;
}

class FlyingAbility implements Flyable {
    public function fly(): string {
        return "Flying in the sky";
    }
}

class SwimmingAbility implements Swimmable {
    public function swim(): string {
        return "Swimming in water";
    }
}

// 组合行为
class Duck {
    private Flyable $flyingAbility;
    private Swimmable $swimmingAbility;

    public function __construct() {
        $this->flyingAbility = new FlyingAbility();
        $this->swimmingAbility = new SwimmingAbility();
    }

    public function performFly(): string {
        return $this->flyingAbility->fly();
    }

    public function performSwim(): string {
        return $this->swimmingAbility->swim();
    }
}
```

## 总结

PHP 的面向对象特性为创建可维护、可重用和组织良好的代码提供了强大的工具。关键要点：

- **类和对象**：OOP 的基础，用它们来建模现实世界的实体
- **继承**：通过父子关系实现代码重用
- **抽象类**：定义带有部分实现的通用行为
- **接口**：定义没有实现的契约
- **Traits**：允许在不相关的类之间进行水平代码重用
- **魔术方法**：为常见操作提供特殊行为
- **访问修饰符**：控制可见性和封装
- **类型声明**：提高代码安全性和文档化

通过掌握这些概念并遵循最佳实践，你可以编写更清晰、更易维护的 PHP 应用程序，它们更容易测试、扩展和调试。
