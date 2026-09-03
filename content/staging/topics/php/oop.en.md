---
title: PHP Object-Oriented Programming
description: "Master PHP OOP: classes, inheritance, interfaces, Traits and magic methods"
track: php
section: oop
difficulty: intermediate
tags:
  - PHP
  - OOP
  - Classes
  - Traits
status: imported
origin: old/src/content/docs/php/oop.en.md
divergence: 0.218
issues: []
legacy:
  category: PHP
  subcategory: Object-Oriented
  order: 2
  lastUpdated: 2026-01-07
---

Object-Oriented Programming (OOP) is a programming paradigm that uses "objects" to design applications and programs. PHP provides comprehensive support for OOP, making it easier to write maintainable, reusable, and organized code.

## Classes and Objects

A class is a blueprint for creating objects. An object is an instance of a class.

### Basic Class Definition

```php
<?php

class Car {
    // Properties
    public $brand;
    public $model;
    public $year;

    // Methods
    public function startEngine() {
        return "Engine started!";
    }

    public function getInfo() {
        return "{$this->brand} {$this->model} ({$this->year})";
    }
}

// Creating objects
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

## Properties and Methods

Properties are variables that belong to a class, and methods are functions that belong to a class.

### Property Types

```php
<?php

class Product {
    // Typed properties (PHP 7.4+)
    public string $name;
    public float $price;
    public int $stock;
    private ?string $description = null;

    // Property with default value
    public bool $isAvailable = true;

    // Array property
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

## Constructors and Destructors

Constructors are special methods called when an object is created. Destructors are called when an object is destroyed.

### Constructor

```php
<?php

class User {
    private string $username;
    private string $email;
    private DateTime $createdAt;

    // Constructor
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

// Using constructor
$user = new User("john_doe", "john@example.com");
echo $user->getUsername(); // john_doe
```

### Constructor Property Promotion (PHP 8.0+)

```php
<?php

class Customer {
    // Constructor property promotion - more concise syntax
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

### Destructor

```php
<?php

class DatabaseConnection {
    private $connection;

    public function __construct(string $host, string $database) {
        $this->connection = new PDO("mysql:host={$host};dbname={$database}");
        echo "Database connection established\n";
    }

    // Destructor
    public function __destruct() {
        $this->connection = null;
        echo "Database connection closed\n";
    }
}

$db = new DatabaseConnection("localhost", "mydb");
// Destructor is automatically called when script ends or object is unset
```

## Inheritance

Inheritance allows a class to inherit properties and methods from another class.

### Basic Inheritance

```php
<?php

// Parent class (Base class)
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

// Child class (Derived class)
class Dog extends Animal {
    private string $breed;

    public function __construct(string $name, int $age, string $breed) {
        parent::__construct($name, $age); // Call parent constructor
        $this->breed = $breed;
    }

    public function bark(): string {
        return "{$this->name} says: Woof! Woof!";
    }

    // Override parent method
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

// Usage
$dog = new Dog("Buddy", 3, "Golden Retriever");
echo $dog->getInfo(); // Buddy is 3 years old. Breed: Golden Retriever
echo $dog->bark(); // Buddy says: Woof! Woof!
echo $dog->eat(); // Buddy is eating.

$cat = new Cat("Whiskers", 2);
echo $cat->meow(); // Whiskers says: Meow!
echo $cat->sleep(); // Whiskers is sleeping.
```

### Final Classes and Methods

```php
<?php

class PaymentProcessor {
    // Final method cannot be overridden
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

// Final class cannot be extended
final class CreditCardProcessor extends PaymentProcessor {
    public function processPayment(float $amount): bool {
        // Can override non-final methods
        echo "Processing credit card payment: ${$amount}\n";
        return parent::processPayment($amount);
    }

    // This would cause an error:
    // public function validatePayment(float $amount): bool { }
}

// This would cause an error:
// class NewProcessor extends CreditCardProcessor { }
```

## Abstract Classes

Abstract classes cannot be instantiated and are meant to be extended. They can contain abstract methods that must be implemented by child classes.

```php
<?php

abstract class Shape {
    protected string $color;

    public function __construct(string $color) {
        $this->color = $color;
    }

    // Abstract method - must be implemented by child classes
    abstract public function calculateArea(): float;
    abstract public function calculatePerimeter(): float;

    // Concrete method - can be used by child classes
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

// Usage
$rectangle = new Rectangle("blue", 10, 5);
echo $rectangle->describe();
// A blue shape with area: 50 and perimeter: 30

$circle = new Circle("red", 7);
echo $circle->describe();
// A red shape with area: 153.93804002589985 and perimeter: 43.982297150257104

// This would cause an error:
// $shape = new Shape("green");
```

## Interfaces

Interfaces define a contract that classes must follow. They contain only method signatures without implementation.

### Basic Interface

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
        // Insert log into database
        echo "Logging to database: {$message}\n";
    }

    public function error(string $message): void {
        echo "Error to database: {$message}\n";
    }

    public function warning(string $message): void {
        echo "Warning to database: {$message}\n";
    }
}

// Usage with type hinting
function logMessage(Logger $logger, string $message): void {
    $logger->log($message);
}

$fileLogger = new FileLogger("app.log");
$dbLogger = new DatabaseLogger(null);

logMessage($fileLogger, "Application started");
logMessage($dbLogger, "User logged in");
```

### Multiple Interfaces

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

// A class can implement multiple interfaces
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

### Interface Inheritance

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

Traits allow you to reuse code in multiple classes. Unlike inheritance, a class can use multiple traits.

### Basic Traits

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

// Usage
$article = new Article("PHP Object Oriented Programming", "Content here...");
echo $article->getSlug(); // php-object-oriented-programming
echo $article->getCreatedAt()->format('Y-m-d H:i:s');

sleep(2);
$article->update("Updated content...");
echo $article->getUpdatedAt()->format('Y-m-d H:i:s');
```

### Trait Conflict Resolution

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
        // Use Logger's log method instead of Debugger's
        Logger::log insteadof Debugger;

        // Use Debugger's process method instead of Logger's
        Debugger::process insteadof Logger;

        // Create alias for Debugger's log method
        Debugger::log as debugLog;

        // Create alias for Logger's process method
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

### Traits with Abstract Methods

```php
<?php

trait Validatable {
    private array $errors = [];

    // Abstract method that must be implemented by the class using this trait
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

## Magic Methods

Magic methods are special methods that start with `__` and are automatically called in certain situations.

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

### __get() and __set()

```php
<?php

class DynamicProperties {
    private array $data = [];

    // Called when reading inaccessible properties
    public function __get(string $name) {
        if (array_key_exists($name, $this->data)) {
            return $this->data[$name];
        }
        return null;
    }

    // Called when writing to inaccessible properties
    public function __set(string $name, $value): void {
        $this->data[$name] = $value;
    }

    // Called when checking if inaccessible property is set
    public function __isset(string $name): bool {
        return isset($this->data[$name]);
    }

    // Called when unsetting inaccessible property
    public function __unset(string $name): void {
        unset($this->data[$name]);
    }
}

$obj = new DynamicProperties();
$obj->name = "John"; // Calls __set()
echo $obj->name; // Calls __get() - outputs: John
var_dump(isset($obj->name)); // Calls __isset() - outputs: bool(true)
unset($obj->name); // Calls __unset()
```

### __call() and __callStatic()

```php
<?php

class MagicCaller {
    private array $methods = [];

    // Register a dynamic method
    public function addMethod(string $name, callable $callback): void {
        $this->methods[$name] = $callback;
    }

    // Called when invoking inaccessible instance methods
    public function __call(string $name, array $arguments) {
        if (isset($this->methods[$name])) {
            return call_user_func_array($this->methods[$name], $arguments);
        }
        throw new Exception("Method {$name} does not exist");
    }

    // Called when invoking inaccessible static methods
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

    // Makes object callable like a function
    public function __invoke(int $number): int {
        return $number * $this->factor;
    }
}

$double = new Multiplier(2);
$triple = new Multiplier(3);

echo $double(5); // 10
echo $triple(5); // 15

// Can be used with array functions
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

    // Called when object is cloned
    public function __clone() {
        // Deep copy of the address object
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

// Without __clone(), both persons would share the same address object
$person2->getAddress()->street = "456 Oak Ave";

echo $person1->getAddress()->street; // 123 Main St
echo $person2->getAddress()->street; // 456 Oak Ave
```

### __serialize() and __unserialize()

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

    // Called during serialization
    public function __serialize(): array {
        return [
            'id' => $this->id,
            'data' => $this->data,
            'created' => $this->createdAt->format('Y-m-d H:i:s')
        ];
    }

    // Called during unserialization
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

    // Customize what var_dump() shows
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
// Shows username and email, but hides password
```

## Access Modifiers

PHP has three access modifiers that control the visibility of properties and methods.

```php
<?php

class BankAccount {
    // Public: accessible from anywhere
    public string $accountHolder;

    // Protected: accessible within class and child classes
    protected float $balance = 0;

    // Private: accessible only within this class
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

    // Private method
    private function validateAmount(float $amount): bool {
        return $amount > 0;
    }

    // Protected method
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
        $this->logTransaction("Interest", $interest); // Can access protected method

        // Cannot access private property:
        // echo $this->accountNumber; // Error!
    }
}

$account = new SavingsAccount("Jane Doe", "ACC001", 0.05);
$account->deposit(1000);
$account->addInterest();
echo $account->getBalance(); // 1050
```

## Static Properties and Methods

Static properties and methods belong to the class itself, not to instances.

```php
<?php

class Counter {
    // Static property
    private static int $count = 0;
    private static array $instances = [];

    private int $id;

    public function __construct() {
        self::$count++;
        $this->id = self::$count;
        self::$instances[] = $this;
    }

    // Static method
    public static function getCount(): int {
        return self::$count;
    }

    public static function getInstances(): array {
        return self::$instances;
    }

    public function getId(): int {
        return $this->id;
    }

    // Static method to reset counter
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

### Late Static Binding

```php
<?php

class ParentClass {
    protected static string $name = "Parent";

    public static function getName(): string {
        return static::$name; // Late static binding with 'static'
    }

    public static function getNameEarly(): string {
        return self::$name; // Early binding with 'self'
    }
}

class ChildClass extends ParentClass {
    protected static string $name = "Child";
}

echo ParentClass::getName(); // Parent
echo ChildClass::getName(); // Child (late static binding)

echo ParentClass::getNameEarly(); // Parent
echo ChildClass::getNameEarly(); // Parent (early binding, always refers to ParentClass)
```

## Type Declarations

PHP supports type declarations for properties, parameters, and return types.

### Property Types

```php
<?php

class TypedClass {
    // Scalar types
    public int $integer;
    public float $decimal;
    public string $text;
    public bool $flag;

    // Array type
    public array $items;

    // Object type
    public DateTime $date;

    // Nullable types
    public ?string $optionalText = null;

    // Union types (PHP 8.0+)
    public int|float $number;

    // Mixed type (PHP 8.0+)
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

### Method Type Declarations

```php
<?php

class Calculator {
    // Parameter and return type declarations
    public function add(int $a, int $b): int {
        return $a + $b;
    }

    public function divide(float $a, float $b): float|string {
        if ($b === 0.0) {
            return "Cannot divide by zero";
        }
        return $a / $b;
    }

    // Nullable return type
    public function findUser(int $id): ?User {
        // Return User object or null
        return null;
    }

    // Void return type (returns nothing)
    public function logMessage(string $message): void {
        echo $message . "\n";
    }

    // Never return type (PHP 8.1+) - never returns normally
    public function throwError(): never {
        throw new Exception("Error occurred");
    }

    // Mixed parameter type
    public function process(mixed $data): mixed {
        return $data;
    }
}
```

### Readonly Properties (PHP 8.1+)

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

// This would cause an error:
// $point->x = 15; // Cannot modify readonly property
```

## Best Practices

### Single Responsibility Principle

Each class should have one responsibility.

```php
<?php

// Bad: Class doing too many things
class UserBad {
    public function createUser($data) { }
    public function sendEmail($email) { }
    public function logActivity($message) { }
}

// Good: Separate responsibilities
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
        // Save user to database
        return true;
    }
}

class EmailService {
    public function send(string $to, string $subject, string $body): void {
        // Send email
    }
}

class ActivityLogger {
    public function log(string $message): void {
        // Log activity
    }
}
```

### Dependency Injection

Inject dependencies rather than creating them inside classes.

```php
<?php

// Bad: Hard-coded dependency
class OrderProcessorBad {
    private $logger;

    public function __construct() {
        $this->logger = new FileLogger("orders.log"); // Hard-coded
    }
}

// Good: Dependency injection
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

// Usage
$logger = new FileLogger("orders.log");
$gateway = new StripeGateway();
$processor = new OrderProcessor($logger, $gateway);
```

### Use Type Hints

Always use type hints for better code quality and IDE support.

```php
<?php

// Bad: No type hints
class UserServiceBad {
    public function create($name, $email) {
        // ...
    }
}

// Good: Type hints everywhere
class UserService {
    public function create(string $name, string $email): User {
        return new User($name, $email);
    }

    public function findById(int $id): ?User {
        // Returns User or null
        return null;
    }

    public function getAll(): array {
        return [];
    }
}
```

### Use Interfaces for Contracts

Define interfaces for better abstraction and testability.

```php
<?php

interface CacheInterface {
    public function get(string $key): mixed;
    public function set(string $key, mixed $value, int $ttl = 3600): bool;
    public function delete(string $key): bool;
}

class RedisCache implements CacheInterface {
    public function get(string $key): mixed {
        // Redis implementation
        return null;
    }

    public function set(string $key, mixed $value, int $ttl = 3600): bool {
        // Redis implementation
        return true;
    }

    public function delete(string $key): bool {
        // Redis implementation
        return true;
    }
}

class FileCache implements CacheInterface {
    public function get(string $key): mixed {
        // File implementation
        return null;
    }

    public function set(string $key, mixed $value, int $ttl = 3600): bool {
        // File implementation
        return true;
    }

    public function delete(string $key): bool {
        // File implementation
        return true;
    }
}

// Easy to swap implementations
class Application {
    public function __construct(
        private CacheInterface $cache
    ) {}
}
```

### Favor Composition Over Inheritance

```php
<?php

// Instead of deep inheritance hierarchies
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

// Compose behaviors
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

## Conclusion

PHP's object-oriented features provide powerful tools for creating maintainable, reusable, and well-organized code. Key takeaways:

- **Classes and Objects**: Foundation of OOP, use them to model real-world entities
- **Inheritance**: Enables code reuse through parent-child relationships
- **Abstract Classes**: Define common behavior with some implementation
- **Interfaces**: Define contracts without implementation
- **Traits**: Enable horizontal code reuse across unrelated classes
- **Magic Methods**: Provide special behaviors for common operations
- **Access Modifiers**: Control visibility and encapsulation
- **Type Declarations**: Improve code safety and documentation

By mastering these concepts and following best practices, you can write cleaner, more maintainable PHP applications that are easier to test, extend, and debug.
