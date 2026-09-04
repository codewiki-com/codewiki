---
title: Java Object-Oriented Programming
description: "Master Java OOP: classes, objects, encapsulation, inheritance, polymorphism and interfaces"
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - OOP
  - Classes
  - Inheritance
status: imported
origin: old/src/content/docs/java/oop.zh.md
divergence: 0.197
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: Object-Oriented
  order: 2
  lastUpdated: 2026-01-07
---

面向对象编程（OOP）是一种以对象和数据为中心组织代码的编程范式，而不是以动作和逻辑为中心。Java 是一种纯面向对象语言，实现了所有四个基本的 OOP 原则：封装、继承、多态和抽象。

## 类和对象

### 什么是类？

类是创建对象的蓝图或模板。它定义了该类型对象将具有的结构和行为。

### 什么是对象？

对象是类的实例。它代表一个具有自身状态和行为的特定实体。

### 基本类结构

```java
public class Car {
    // 字段（属性）
    private String brand;
    private String model;
    private int year;
    private double price;

    // 构造函数
    public Car(String brand, String model, int year, double price) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.price = price;
    }

    // 默认构造函数
    public Car() {
        this.brand = "Unknown";
        this.model = "Unknown";
        this.year = 0;
        this.price = 0.0;
    }

    // 方法（行为）
    public void displayInfo() {
        System.out.println("Brand: " + brand);
        System.out.println("Model: " + model);
        System.out.println("Year: " + year);
        System.out.println("Price: $" + price);
    }

    public void startEngine() {
        System.out.println(brand + " " + model + " engine started!");
    }

    public double calculateDepreciation(int yearsUsed) {
        double depreciationRate = 0.15;
        return price * Math.pow(1 - depreciationRate, yearsUsed);
    }
}
```

### 创建和使用对象

```java
public class Main {
    public static void main(String[] args) {
        // 创建对象
        Car car1 = new Car("Toyota", "Camry", 2023, 28000.0);
        Car car2 = new Car("Honda", "Accord", 2022, 30000.0);
        Car car3 = new Car(); // 使用默认构造函数

        // 使用对象方法
        car1.displayInfo();
        car1.startEngine();

        // 计算折旧
        double valueAfter3Years = car1.calculateDepreciation(3);
        System.out.println("Value after 3 years: $" + valueAfter3Years);
    }
}
```

### `this` 关键字

`this` 关键字引用当前对象实例。它用于：
- 区分同名的实例变量和参数
- 调用同一个类中的其他构造函数
- 将当前对象作为参数传递

```java
public class Student {
    private String name;
    private int id;

    public Student(String name, int id) {
        this.name = name; // 'this' 区分实例变量和参数
        this.id = id;
    }

    // 构造函数链
    public Student(String name) {
        this(name, 0); // 调用另一个构造函数
    }

    public Student getCurrentStudent() {
        return this; // 返回当前对象
    }

    public void compare(Student other) {
        if (this.id == other.id) {
            System.out.println("Same ID");
        }
    }
}
```

## 封装

封装是将数据（字段）和操作这些数据的方法捆绑在一个单元（类）中，同时限制对对象某些组件的直接访问。这是通过访问修饰符和 getter/setter 方法实现的。

### 访问修饰符

- **private**：只能在同一个类中访问
- **default**（无修饰符）：只能在同一个包中访问
- **protected**：可以在同一个包和子类中访问
- **public**：可以从任何地方访问

### 实现封装

```java
public class BankAccount {
    // 私有字段 - 对外部访问隐藏
    private String accountNumber;
    private String accountHolder;
    private double balance;
    private static double interestRate = 0.03;

    public BankAccount(String accountNumber, String accountHolder, double initialBalance) {
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.balance = initialBalance;
    }

    // Getter 方法 - 受控的读取访问
    public String getAccountNumber() {
        return accountNumber;
    }

    public String getAccountHolder() {
        return accountHolder;
    }

    public double getBalance() {
        return balance;
    }

    // 带验证的 Setter 方法 - 受控的写入访问
    public void setAccountHolder(String accountHolder) {
        if (accountHolder != null && !accountHolder.trim().isEmpty()) {
            this.accountHolder = accountHolder;
        } else {
            System.out.println("Invalid account holder name");
        }
    }

    // 业务逻辑方法
    public boolean deposit(double amount) {
        if (amount > 0) {
            balance += amount;
            System.out.println("Deposited: $" + amount);
            return true;
        } else {
            System.out.println("Invalid deposit amount");
            return false;
        }
    }

    public boolean withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
            System.out.println("Withdrawn: $" + amount);
            return true;
        } else {
            System.out.println("Insufficient funds or invalid amount");
            return false;
        }
    }

    public void applyInterest() {
        balance += balance * interestRate;
        System.out.println("Interest applied. New balance: $" + balance);
    }

    // 静态方法
    public static void setInterestRate(double rate) {
        if (rate >= 0 && rate <= 1) {
            interestRate = rate;
        }
    }
}
```

### 封装的好处

```java
public class EncapsulationDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount("123456", "John Doe", 1000.0);

        // 不能直接访问私有字段
        // account.balance = -5000; // 编译错误

        // 必须使用带验证的公共方法
        account.deposit(500.0);
        account.withdraw(200.0);
        account.withdraw(2000.0); // 将被拒绝

        System.out.println("Balance: $" + account.getBalance());

        // 数据完整性得到保持
        account.applyInterest();
    }
}
```

## 继承

继承允许一个类继承另一个类的属性和方法。继承的类称为子类（派生类），被继承的类称为超类（父类）。

### 基本继承

```java
// 父类（超类）
public class Animal {
    protected String name;
    protected int age;

    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void eat() {
        System.out.println(name + " is eating");
    }

    public void sleep() {
        System.out.println(name + " is sleeping");
    }

    public void makeSound() {
        System.out.println(name + " makes a sound");
    }

    public void displayInfo() {
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
    }
}

// 子类（派生类）
public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age); // 调用父类构造函数
        this.breed = breed;
    }

    // 方法重写
    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof! Woof!");
    }

    // Dog 特有的额外方法
    public void fetch() {
        System.out.println(name + " is fetching the ball");
    }

    @Override
    public void displayInfo() {
        super.displayInfo(); // 调用父类方法
        System.out.println("Breed: " + breed);
    }
}

public class Cat extends Animal {
    private boolean isIndoor;

    public Cat(String name, int age, boolean isIndoor) {
        super(name, age);
        this.isIndoor = isIndoor;
    }

    @Override
    public void makeSound() {
        System.out.println(name + " meows: Meow! Meow!");
    }

    public void scratch() {
        System.out.println(name + " is scratching");
    }

    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Indoor cat: " + isIndoor);
    }
}
```

### `super` 关键字

`super` 关键字用于：
- 调用父类构造函数
- 访问父类方法
- 访问父类字段（如果不是私有的）

```java
public class Vehicle {
    protected String brand;
    protected int maxSpeed;

    public Vehicle(String brand, int maxSpeed) {
        this.brand = brand;
        this.maxSpeed = maxSpeed;
    }

    public void displaySpecs() {
        System.out.println("Brand: " + brand);
        System.out.println("Max Speed: " + maxSpeed + " km/h");
    }
}

public class ElectricCar extends Vehicle {
    private int batteryCapacity;
    private int range;

    public ElectricCar(String brand, int maxSpeed, int batteryCapacity, int range) {
        super(brand, maxSpeed); // 必须是第一条语句
        this.batteryCapacity = batteryCapacity;
        this.range = range;
    }

    @Override
    public void displaySpecs() {
        super.displaySpecs(); // 调用父类方法
        System.out.println("Battery Capacity: " + batteryCapacity + " kWh");
        System.out.println("Range: " + range + " km");
    }

    public void charge() {
        System.out.println(super.brand + " is charging"); // 访问父类字段
    }
}
```

### 继承示例

```java
public class InheritanceDemo {
    public static void main(String[] args) {
        // 创建不同类的对象
        Animal animal = new Animal("Generic Animal", 5);
        Dog dog = new Dog("Buddy", 3, "Golden Retriever");
        Cat cat = new Cat("Whiskers", 2, true);

        // 都可以使用父类方法
        animal.eat();
        dog.eat();
        cat.eat();

        // 每个都有自己的 makeSound() 实现
        animal.makeSound();
        dog.makeSound();
        cat.makeSound();

        // 子类特有的方法
        dog.fetch();
        cat.scratch();

        // 显示信息
        System.out.println("\n--- Dog Info ---");
        dog.displayInfo();

        System.out.println("\n--- Cat Info ---");
        cat.displayInfo();
    }
}
```

### Java 中的继承类型

Java 支持：
- **单继承**：一个类继承一个父类
- **多级继承**：继承链（A → B → C）
- **层次继承**：多个类继承一个父类

Java 不支持多重继承（一个类继承多个类）以避免菱形问题。但是，这可以通过接口实现。

```java
// 多级继承
public class LivingBeing {
    public void breathe() {
        System.out.println("Breathing...");
    }
}

public class Mammal extends LivingBeing {
    public void nurseYoung() {
        System.out.println("Nursing young...");
    }
}

public class Human extends Mammal {
    public void think() {
        System.out.println("Thinking...");
    }
}

// 层次继承
public class Shape {
    public void draw() {
        System.out.println("Drawing shape");
    }
}

public class Circle extends Shape {
    public void draw() {
        System.out.println("Drawing circle");
    }
}

public class Rectangle extends Shape {
    public void draw() {
        System.out.println("Drawing rectangle");
    }
}
```

## 多态

多态意味着"多种形式"。它允许不同类的对象被当作共同父类的对象来处理。有两种类型：编译时多态（方法重载）和运行时多态（方法重写）。

### 方法重载（编译时多态）

方法重载允许同一个类中有多个同名但参数不同的方法。

```java
public class Calculator {
    // 不同参数数量的重载方法
    public int add(int a, int b) {
        return a + b;
    }

    public int add(int a, int b, int c) {
        return a + b + c;
    }

    // 不同参数类型的重载方法
    public double add(double a, double b) {
        return a + b;
    }

    public String add(String a, String b) {
        return a + b;
    }

    // 不同参数顺序
    public void display(int a, String b) {
        System.out.println("Integer: " + a + ", String: " + b);
    }

    public void display(String a, int b) {
        System.out.println("String: " + a + ", Integer: " + b);
    }
}

public class OverloadingDemo {
    public static void main(String[] args) {
        Calculator calc = new Calculator();

        System.out.println(calc.add(5, 10));           // 15
        System.out.println(calc.add(5, 10, 15));       // 30
        System.out.println(calc.add(5.5, 10.5));       // 16.0
        System.out.println(calc.add("Hello ", "World")); // Hello World

        calc.display(100, "Test");
        calc.display("Test", 100);
    }
}
```

### 方法重写（运行时多态）

方法重写允许子类提供在其父类中已定义方法的特定实现。

```java
public class Employee {
    protected String name;
    protected double baseSalary;

    public Employee(String name, double baseSalary) {
        this.name = name;
        this.baseSalary = baseSalary;
    }

    public double calculateSalary() {
        return baseSalary;
    }

    public void displayInfo() {
        System.out.println("Employee: " + name);
        System.out.println("Salary: $" + calculateSalary());
    }
}

public class Manager extends Employee {
    private double bonus;

    public Manager(String name, double baseSalary, double bonus) {
        super(name, baseSalary);
        this.bonus = bonus;
    }

    @Override
    public double calculateSalary() {
        return baseSalary + bonus;
    }

    @Override
    public void displayInfo() {
        System.out.println("Manager: " + name);
        System.out.println("Base Salary: $" + baseSalary);
        System.out.println("Bonus: $" + bonus);
        System.out.println("Total Salary: $" + calculateSalary());
    }
}

public class Developer extends Employee {
    private int projectsCompleted;
    private double projectBonus;

    public Developer(String name, double baseSalary, int projectsCompleted) {
        super(name, baseSalary);
        this.projectsCompleted = projectsCompleted;
        this.projectBonus = 500.0;
    }

    @Override
    public double calculateSalary() {
        return baseSalary + (projectsCompleted * projectBonus);
    }

    @Override
    public void displayInfo() {
        System.out.println("Developer: " + name);
        System.out.println("Projects Completed: " + projectsCompleted);
        System.out.println("Total Salary: $" + calculateSalary());
    }
}
```

### 多态行为

```java
public class PolymorphismDemo {
    public static void main(String[] args) {
        // 父类引用，子类对象
        Employee emp1 = new Employee("John", 50000);
        Employee emp2 = new Manager("Sarah", 70000, 15000);
        Employee emp3 = new Developer("Mike", 60000, 8);

        // Employee 引用数组
        Employee[] employees = {emp1, emp2, emp3};

        // 多态行为 - 根据实际对象类型调用正确的方法
        for (Employee emp : employees) {
            emp.displayInfo();
            System.out.println("---");
        }

        // 计算总工资
        double totalPayroll = 0;
        for (Employee emp : employees) {
            totalPayroll += emp.calculateSalary();
        }
        System.out.println("Total Payroll: $" + totalPayroll);
    }
}
```

### 动态方法分派

动态方法分派是在运行时而不是编译时解析对重写方法调用的机制。

```java
public class Shape {
    public void draw() {
        System.out.println("Drawing a shape");
    }

    public double calculateArea() {
        return 0.0;
    }
}

public class Circle extends Shape {
    private double radius;

    public Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a circle with radius " + radius);
    }

    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private double length;
    private double width;

    public Rectangle(double length, double width) {
        this.length = length;
        this.width = width;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a rectangle " + length + "x" + width);
    }

    @Override
    public double calculateArea() {
        return length * width;
    }
}

public class DynamicDispatchDemo {
    public static void main(String[] args) {
        Shape shape;

        // 运行时决定 - 调用哪个方法
        shape = new Circle(5.0);
        shape.draw(); // 调用 Circle 的 draw()
        System.out.println("Area: " + shape.calculateArea());

        shape = new Rectangle(4.0, 6.0);
        shape.draw(); // 调用 Rectangle 的 draw()
        System.out.println("Area: " + shape.calculateArea());

        // 调用的方法由实际对象类型决定，而不是引用类型
    }
}
```

## 抽象类

抽象类是不能被实例化的类，可能包含抽象方法（没有实现的方法）。它们作为其他类的模板。

### 定义抽象类

```java
public abstract class Vehicle {
    protected String brand;
    protected int year;
    protected double price;

    public Vehicle(String brand, int year, double price) {
        this.brand = brand;
        this.year = year;
        this.price = price;
    }

    // 抽象方法 - 必须由子类实现
    public abstract void startEngine();
    public abstract void stopEngine();
    public abstract double calculateMaintenanceCost();

    // 具体方法 - 有实现
    public void displayInfo() {
        System.out.println("Brand: " + brand);
        System.out.println("Year: " + year);
        System.out.println("Price: $" + price);
    }

    // 带逻辑的具体方法
    public double calculateDepreciation(int years) {
        return price * Math.pow(0.85, years);
    }
}

public class Motorcycle extends Vehicle {
    private int engineCC;

    public Motorcycle(String brand, int year, double price, int engineCC) {
        super(brand, year, price);
        this.engineCC = engineCC;
    }

    @Override
    public void startEngine() {
        System.out.println("Motorcycle engine started with a roar!");
    }

    @Override
    public void stopEngine() {
        System.out.println("Motorcycle engine stopped.");
    }

    @Override
    public double calculateMaintenanceCost() {
        return 500 + (engineCC * 0.5);
    }

    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Engine CC: " + engineCC);
        System.out.println("Maintenance Cost: $" + calculateMaintenanceCost());
    }
}

public class Truck extends Vehicle {
    private double cargoCapacity;

    public Truck(String brand, int year, double price, double cargoCapacity) {
        super(brand, year, price);
        this.cargoCapacity = cargoCapacity;
    }

    @Override
    public void startEngine() {
        System.out.println("Truck diesel engine started.");
    }

    @Override
    public void stopEngine() {
        System.out.println("Truck engine stopped.");
    }

    @Override
    public double calculateMaintenanceCost() {
        return 1500 + (cargoCapacity * 100);
    }

    @Override
    public void displayInfo() {
        super.displayInfo();
        System.out.println("Cargo Capacity: " + cargoCapacity + " tons");
        System.out.println("Maintenance Cost: $" + calculateMaintenanceCost());
    }
}
```

### 抽象类示例

```java
public class AbstractClassDemo {
    public static void main(String[] args) {
        // 不能实例化抽象类
        // Vehicle vehicle = new Vehicle("Generic", 2023, 20000); // 错误

        // 可以创建具体子类的实例
        Vehicle motorcycle = new Motorcycle("Harley Davidson", 2023, 18000, 1200);
        Vehicle truck = new Truck("Ford", 2022, 45000, 5.0);

        // 使用多态
        Vehicle[] vehicles = {motorcycle, truck};

        for (Vehicle vehicle : vehicles) {
            vehicle.displayInfo();
            vehicle.startEngine();
            vehicle.stopEngine();
            System.out.println("Value after 3 years: $" +
                vehicle.calculateDepreciation(3));
            System.out.println("---");
        }
    }
}
```

### 何时使用抽象类

在以下情况使用抽象类：
- 你想在几个密切相关的类之间共享代码
- 你期望扩展抽象类的类有许多共同的方法或字段
- 你想声明非静态或非 final 字段
- 你需要提供带有部分实现的公共接口

```java
public abstract class PaymentMethod {
    protected String accountHolder;
    protected double balance;

    public PaymentMethod(String accountHolder, double balance) {
        this.accountHolder = accountHolder;
        this.balance = balance;
    }

    // 抽象方法
    public abstract boolean processPayment(double amount);
    public abstract String getPaymentType();

    // 具体方法
    public double getBalance() {
        return balance;
    }

    public void displayAccount() {
        System.out.println("Account Holder: " + accountHolder);
        System.out.println("Balance: $" + balance);
        System.out.println("Payment Type: " + getPaymentType());
    }

    protected boolean hasSufficientFunds(double amount) {
        return balance >= amount;
    }
}

public class CreditCard extends PaymentMethod {
    private String cardNumber;
    private double creditLimit;

    public CreditCard(String accountHolder, double balance, String cardNumber, double creditLimit) {
        super(accountHolder, balance);
        this.cardNumber = cardNumber;
        this.creditLimit = creditLimit;
    }

    @Override
    public boolean processPayment(double amount) {
        if (amount <= creditLimit) {
            balance -= amount;
            System.out.println("Credit card payment of $" + amount + " processed");
            return true;
        }
        System.out.println("Payment exceeds credit limit");
        return false;
    }

    @Override
    public String getPaymentType() {
        return "Credit Card";
    }
}

public class DebitCard extends PaymentMethod {
    private String bankName;

    public DebitCard(String accountHolder, double balance, String bankName) {
        super(accountHolder, balance);
        this.bankName = bankName;
    }

    @Override
    public boolean processPayment(double amount) {
        if (hasSufficientFunds(amount)) {
            balance -= amount;
            System.out.println("Debit card payment of $" + amount + " processed");
            return true;
        }
        System.out.println("Insufficient funds");
        return false;
    }

    @Override
    public String getPaymentType() {
        return "Debit Card - " + bankName;
    }
}
```

## 接口

接口是一个完全抽象的类，只包含抽象方法（Java 8 之前）和常量。接口定义了实现类必须遵循的契约。

### 基本接口

```java
public interface Drawable {
    // 所有方法默认是 public 和 abstract
    void draw();
    void resize(double scale);
    void move(int x, int y);
}

public interface Colorable {
    void setColor(String color);
    String getColor();
}

// 实现接口的类
public class Square implements Drawable, Colorable {
    private int x, y;
    private double size;
    private String color;

    public Square(int x, int y, double size, String color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a " + color + " square at (" + x + ", " + y +
            ") with size " + size);
    }

    @Override
    public void resize(double scale) {
        size *= scale;
        System.out.println("Square resized to " + size);
    }

    @Override
    public void move(int x, int y) {
        this.x = x;
        this.y = y;
        System.out.println("Square moved to (" + x + ", " + y + ")");
    }

    @Override
    public void setColor(String color) {
        this.color = color;
    }

    @Override
    public String getColor() {
        return color;
    }
}

public class CircleShape implements Drawable, Colorable {
    private int x, y;
    private double radius;
    private String color;

    public CircleShape(int x, int y, double radius, String color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    @Override
    public void draw() {
        System.out.println("Drawing a " + color + " circle at (" + x + ", " + y +
            ") with radius " + radius);
    }

    @Override
    public void resize(double scale) {
        radius *= scale;
        System.out.println("Circle resized to radius " + radius);
    }

    @Override
    public void move(int x, int y) {
        this.x = x;
        this.y = y;
        System.out.println("Circle moved to (" + x + ", " + y + ")");
    }

    @Override
    public void setColor(String color) {
        this.color = color;
    }

    @Override
    public String getColor() {
        return color;
    }
}
```

### 带默认方法和静态方法的接口（Java 8+）

```java
public interface Vehicle {
    // 抽象方法
    void start();
    void stop();
    double getSpeed();

    // 默认方法 - 可以被重写
    default void honk() {
        System.out.println("Beep beep!");
    }

    default void displayStatus() {
        System.out.println("Vehicle is " + (getSpeed() > 0 ? "moving" : "stopped"));
        System.out.println("Current speed: " + getSpeed() + " km/h");
    }

    // 静态方法 - 不能被重写
    static void showVehicleInfo() {
        System.out.println("This is a vehicle interface");
    }

    // 常量（默认是 public static final）
    int MAX_SPEED = 200;
}

public class Car implements Vehicle {
    private boolean isRunning;
    private double currentSpeed;

    @Override
    public void start() {
        isRunning = true;
        currentSpeed = 0;
        System.out.println("Car started");
    }

    @Override
    public void stop() {
        isRunning = false;
        currentSpeed = 0;
        System.out.println("Car stopped");
    }

    @Override
    public double getSpeed() {
        return currentSpeed;
    }

    public void accelerate(double speed) {
        if (isRunning) {
            currentSpeed = Math.min(currentSpeed + speed, MAX_SPEED);
            System.out.println("Accelerating to " + currentSpeed + " km/h");
        }
    }

    // 重写默认方法
    @Override
    public void honk() {
        System.out.println("Car horn: Honk honk!");
    }
}
```

### 多接口实现

```java
public interface Flyable {
    void fly();
    void land();
}

public interface Swimmable {
    void swim();
}

public interface Walkable {
    void walk();
}

// 鸭子可以飞、游泳和行走
public class Duck implements Flyable, Swimmable, Walkable {
    private String name;

    public Duck(String name) {
        this.name = name;
    }

    @Override
    public void fly() {
        System.out.println(name + " is flying");
    }

    @Override
    public void land() {
        System.out.println(name + " has landed");
    }

    @Override
    public void swim() {
        System.out.println(name + " is swimming");
    }

    @Override
    public void walk() {
        System.out.println(name + " is walking");
    }
}

// 鱼只能游泳
public class Fish implements Swimmable {
    private String species;

    public Fish(String species) {
        this.species = species;
    }

    @Override
    public void swim() {
        System.out.println(species + " fish is swimming");
    }
}

// 鸟可以飞和行走
public class Bird implements Flyable, Walkable {
    private String type;

    public Bird(String type) {
        this.type = type;
    }

    @Override
    public void fly() {
        System.out.println(type + " bird is flying");
    }

    @Override
    public void land() {
        System.out.println(type + " bird has landed");
    }

    @Override
    public void walk() {
        System.out.println(type + " bird is walking");
    }
}
```

### 接口示例

```java
public class InterfaceDemo {
    public static void main(String[] args) {
        Duck duck = new Duck("Donald");
        duck.walk();
        duck.swim();
        duck.fly();
        duck.land();

        System.out.println("---");

        // 使用接口的多态
        Flyable flyingBird = new Bird("Eagle");
        flyingBird.fly();
        flyingBird.land();

        Swimmable swimmer = new Fish("Salmon");
        swimmer.swim();

        System.out.println("---");

        // 接口引用数组
        Swimmable[] swimmers = {duck, new Fish("Tuna")};
        for (Swimmable s : swimmers) {
            s.swim();
        }
    }
}
```

### 接口 vs 抽象类

| 特性 | 接口 | 抽象类 |
|------|------|--------|
| 多重继承 | 是（一个类可以实现多个接口） | 否（一个类只能继承一个类） |
| 方法实现 | 仅默认方法和静态方法（Java 8+） | 可以有任何方法实现 |
| 变量 | 只有常量（public static final） | 可以有任何类型的变量 |
| 访问修饰符 | 方法默认是 public | 可以有任何访问修饰符 |
| 构造函数 | 不能有构造函数 | 可以有构造函数 |
| 何时使用 | 定义能力（类能做什么） | 定义"是一个"关系 |

### 函数式接口

函数式接口只有一个抽象方法，可以与 lambda 表达式一起使用。

```java
@FunctionalInterface
public interface Calculator {
    int calculate(int a, int b);

    // 可以有默认方法和静态方法
    default void printResult(int result) {
        System.out.println("Result: " + result);
    }
}

public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // 使用 lambda 表达式
        Calculator addition = (a, b) -> a + b;
        Calculator subtraction = (a, b) -> a - b;
        Calculator multiplication = (a, b) -> a * b;
        Calculator division = (a, b) -> b != 0 ? a / b : 0;

        System.out.println("10 + 5 = " + addition.calculate(10, 5));
        System.out.println("10 - 5 = " + subtraction.calculate(10, 5));
        System.out.println("10 * 5 = " + multiplication.calculate(10, 5));
        System.out.println("10 / 5 = " + division.calculate(10, 5));

        // 使用默认方法
        addition.printResult(addition.calculate(10, 5));
    }
}
```

## 内部类

内部类是在另一个类内部定义的类。Java 支持几种类型的内部类。

### 成员内部类

在另一个类内部定义的非静态类。

```java
public class OuterClass {
    private String outerField = "Outer field";
    private static String staticOuterField = "Static outer field";

    // 成员内部类
    public class InnerClass {
        private String innerField = "Inner field";

        public void display() {
            // 可以访问外部类成员
            System.out.println("Accessing: " + outerField);
            System.out.println("Accessing: " + staticOuterField);
            System.out.println("Accessing: " + innerField);
        }

        public void modifyOuter() {
            outerField = "Modified by inner class";
        }
    }

    public void testInner() {
        InnerClass inner = new InnerClass();
        inner.display();
        inner.modifyOuter();
        System.out.println("After modification: " + outerField);
    }
}

public class InnerClassDemo {
    public static void main(String[] args) {
        // 创建外部类实例
        OuterClass outer = new OuterClass();
        outer.testInner();

        // 创建内部类实例
        OuterClass.InnerClass inner = outer.new InnerClass();
        inner.display();
    }
}
```

### 静态嵌套类

在另一个类内部定义的静态类。

```java
public class University {
    private String universityName;
    private static String country = "USA";

    public University(String name) {
        this.universityName = name;
    }

    // 静态嵌套类
    public static class Department {
        private String departmentName;
        private int numberOfStudents;

        public Department(String name, int students) {
            this.departmentName = name;
            this.numberOfStudents = students;
        }

        public void displayInfo() {
            // 可以访问外部类的静态成员
            System.out.println("Country: " + country);
            System.out.println("Department: " + departmentName);
            System.out.println("Students: " + numberOfStudents);

            // 不能访问非静态成员
            // System.out.println(universityName); // 错误
        }
    }

    public void displayUniversity() {
        System.out.println("University: " + universityName);
    }
}

public class StaticNestedDemo {
    public static void main(String[] args) {
        University university = new University("MIT");
        university.displayUniversity();

        // 创建静态嵌套类实例（不需要外部实例）
        University.Department csDept = new University.Department("Computer Science", 500);
        csDept.displayInfo();

        University.Department mathDept = new University.Department("Mathematics", 300);
        mathDept.displayInfo();
    }
}
```

### 局部内部类

在方法内部定义的类。

```java
public class LocalInnerDemo {
    private String outerField = "Outer";

    public void testLocalInner() {
        String localVariable = "Local";

        // 局部内部类
        class LocalInner {
            private String innerField = "Inner";

            public void display() {
                System.out.println(outerField);
                System.out.println(localVariable); // 必须是 final 或实际上的 final
                System.out.println(innerField);
            }
        }

        // 使用局部内部类
        LocalInner inner = new LocalInner();
        inner.display();
    }

    public static void main(String[] args) {
        LocalInnerDemo demo = new LocalInnerDemo();
        demo.testLocalInner();
    }
}
```

### 匿名内部类

没有名称的类，用于一次性使用。

```java
interface Greeting {
    void greet(String name);
}

abstract class Animal {
    abstract void makeSound();
}

public class AnonymousInnerDemo {
    public static void main(String[] args) {
        // 实现接口的匿名内部类
        Greeting greeting = new Greeting() {
            @Override
            public void greet(String name) {
                System.out.println("Hello, " + name + "!");
            }
        };
        greeting.greet("John");

        // 扩展抽象类的匿名内部类
        Animal dog = new Animal() {
            @Override
            void makeSound() {
                System.out.println("Woof!");
            }
        };
        dog.makeSound();

        // 使用 Thread 的匿名内部类
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("Thread is running");
            }
        });
        thread.start();

        // 使用 lambda 的相同功能（用于函数式接口）
        Thread lambdaThread = new Thread(() ->
            System.out.println("Lambda thread is running")
        );
        lambdaThread.start();
    }
}
```

### 实际示例：使用内部类的事件处理

```java
public class Button {
    private String label;
    private ClickListener listener;

    public Button(String label) {
        this.label = label;
    }

    public void setOnClickListener(ClickListener listener) {
        this.listener = listener;
    }

    public void click() {
        System.out.println("Button '" + label + "' clicked");
        if (listener != null) {
            listener.onClick();
        }
    }

    // 内部接口
    public interface ClickListener {
        void onClick();
    }
}

public class EventHandlingDemo {
    public static void main(String[] args) {
        Button button1 = new Button("Submit");
        Button button2 = new Button("Cancel");

        // 使用匿名内部类
        button1.setOnClickListener(new Button.ClickListener() {
            @Override
            public void onClick() {
                System.out.println("Form submitted!");
            }
        });

        // 使用 lambda 表达式
        button2.setOnClickListener(() ->
            System.out.println("Action cancelled!")
        );

        button1.click();
        button2.click();
    }
}
```

## 最佳实践

### 遵循 SOLID 原则

```java
// 单一职责原则
// 不好：类做太多事情
class UserService {
    public void createUser(String name, String email) { }
    public void sendEmail(String email, String message) { }
    public void generateReport(User user) { }
}

// 好：分离职责
class UserService {
    public void createUser(String name, String email) { }
}

class EmailService {
    public void sendEmail(String email, String message) { }
}

class ReportService {
    public void generateReport(User user) { }
}

// 开闭原则
// 不好：修改现有代码
class DiscountCalculator {
    public double calculate(String customerType, double amount) {
        if (customerType.equals("regular")) {
            return amount * 0.95;
        } else if (customerType.equals("premium")) {
            return amount * 0.90;
        }
        return amount;
    }
}

// 好：对扩展开放，对修改关闭
interface DiscountStrategy {
    double applyDiscount(double amount);
}

class RegularDiscount implements DiscountStrategy {
    public double applyDiscount(double amount) {
        return amount * 0.95;
    }
}

class PremiumDiscount implements DiscountStrategy {
    public double applyDiscount(double amount) {
        return amount * 0.90;
    }
}

class DiscountCalculatorGood {
    private DiscountStrategy strategy;

    public DiscountCalculatorGood(DiscountStrategy strategy) {
        this.strategy = strategy;
    }

    public double calculate(double amount) {
        return strategy.applyDiscount(amount);
    }
}
```

### 优先使用组合而非继承

```java
// 继承方式（刚性）
class Vehicle {
    void move() { }
}

class FlyingVehicle extends Vehicle {
    void fly() { }
}

// 组合方式（灵活）
interface Movable {
    void move();
}

class Engine {
    void start() { System.out.println("Engine started"); }
    void stop() { System.out.println("Engine stopped"); }
}

class Wings {
    void extend() { System.out.println("Wings extended"); }
    void retract() { System.out.println("Wings retracted"); }
}

class Airplane implements Movable {
    private Engine engine;
    private Wings wings;

    public Airplane() {
        this.engine = new Engine();
        this.wings = new Wings();
    }

    @Override
    public void move() {
        engine.start();
        wings.extend();
        System.out.println("Flying");
    }
}
```

### 使用适当的访问修饰符

```java
public class BestPracticesExample {
    // 私有字段
    private String name;
    private int age;

    // 公共构造函数
    public BestPracticesExample(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 公共 getter
    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    // 私有辅助方法
    private boolean isValid() {
        return name != null && age > 0;
    }

    // 使用私有辅助方法的公共方法
    public void display() {
        if (isValid()) {
            System.out.println("Name: " + name + ", Age: " + age);
        }
    }
}
```

### 正确重写 equals() 和 hashCode()

```java
import java.util.Objects;

public class Person {
    private String name;
    private int age;
    private String email;

    public Person(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        Person person = (Person) obj;
        return age == person.age &&
               Objects.equals(name, person.name) &&
               Objects.equals(email, person.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age, email);
    }

    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + ", email='" + email + "'}";
    }
}
```

### 使用有意义的命名

```java
// 不好
public class D {
    private int d;

    public void p() {
        // 处理
    }
}

// 好
public class DataProcessor {
    private int dataCount;

    public void processData() {
        // 处理
    }
}
```

### 保持方法小而专注

```java
// 不好：方法做太多事情
public void processOrder(Order order) {
    validateOrder(order);
    calculateTotal(order);
    applyDiscount(order);
    processPayment(order);
    updateInventory(order);
    sendConfirmation(order);
}

// 好：委托给更小的方法
public void processOrder(Order order) {
    if (!validateOrder(order)) {
        throw new IllegalArgumentException("Invalid order");
    }

    double total = calculateTotal(order);
    processPayment(order, total);
    finalizeOrder(order);
}

private boolean validateOrder(Order order) {
    return order != null && !order.getItems().isEmpty();
}

private double calculateTotal(Order order) {
    double subtotal = order.getSubtotal();
    double discount = calculateDiscount(order);
    return subtotal - discount;
}

private void finalizeOrder(Order order) {
    updateInventory(order);
    sendConfirmation(order);
}
```

## 总结

Java 的面向对象编程特性提供了强大的工具来创建可维护、可扩展和健壮的应用程序：

- **类和对象**：代表现实世界实体的蓝图和实例
- **封装**：通过 getter/setter 实现数据隐藏和受控访问
- **继承**：代码重用和建立层次关系
- **多态**：通过方法重载和重写实现多种形式
- **抽象类**：具有部分实现的相关类模板
- **接口**：定义能力并启用多重继承的契约
- **内部类**：相关功能的逻辑分组和封装

通过掌握这些概念并遵循最佳实践，你可以编写干净、高效且可维护的 Java 代码，充分利用面向对象编程的全部功能。
