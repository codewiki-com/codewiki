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
origin: old/src/content/docs/java/oop.en.md
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

Object-Oriented Programming (OOP) is a programming paradigm that organizes code around objects and data rather than actions and logic. Java is a pure object-oriented language that implements all four fundamental OOP principles: encapsulation, inheritance, polymorphism, and abstraction.

## Classes and Objects

### What is a Class?

A class is a blueprint or template for creating objects. It defines the structure and behavior that objects of that type will have.

### What is an Object?

An object is an instance of a class. It represents a specific entity with its own state and behavior.

### Basic Class Structure

```java
public class Car {
    // Fields (attributes)
    private String brand;
    private String model;
    private int year;
    private double price;

    // Constructor
    public Car(String brand, String model, int year, double price) {
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.price = price;
    }

    // Default constructor
    public Car() {
        this.brand = "Unknown";
        this.model = "Unknown";
        this.year = 0;
        this.price = 0.0;
    }

    // Methods (behavior)
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

### Creating and Using Objects

```java
public class Main {
    public static void main(String[] args) {
        // Creating objects
        Car car1 = new Car("Toyota", "Camry", 2023, 28000.0);
        Car car2 = new Car("Honda", "Accord", 2022, 30000.0);
        Car car3 = new Car(); // Using default constructor

        // Using object methods
        car1.displayInfo();
        car1.startEngine();

        // Calculating depreciation
        double valueAfter3Years = car1.calculateDepreciation(3);
        System.out.println("Value after 3 years: $" + valueAfter3Years);
    }
}
```

### The `this` Keyword

The `this` keyword refers to the current object instance. It's used to:
- Distinguish between instance variables and parameters with the same name
- Call other constructors in the same class
- Pass the current object as a parameter

```java
public class Student {
    private String name;
    private int id;

    public Student(String name, int id) {
        this.name = name; // 'this' distinguishes instance variable from parameter
        this.id = id;
    }

    // Constructor chaining
    public Student(String name) {
        this(name, 0); // Calls the other constructor
    }

    public Student getCurrentStudent() {
        return this; // Returns current object
    }

    public void compare(Student other) {
        if (this.id == other.id) {
            System.out.println("Same ID");
        }
    }
}
```

## Encapsulation

Encapsulation is the bundling of data (fields) and methods that operate on that data within a single unit (class), while restricting direct access to some of the object's components. This is achieved through access modifiers and getter/setter methods.

### Access Modifiers

- **private**: Accessible only within the same class
- **default** (no modifier): Accessible within the same package
- **protected**: Accessible within the same package and subclasses
- **public**: Accessible from anywhere

### Implementing Encapsulation

```java
public class BankAccount {
    // Private fields - hidden from outside access
    private String accountNumber;
    private String accountHolder;
    private double balance;
    private static double interestRate = 0.03;

    public BankAccount(String accountNumber, String accountHolder, double initialBalance) {
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
        this.balance = initialBalance;
    }

    // Getter methods - controlled read access
    public String getAccountNumber() {
        return accountNumber;
    }

    public String getAccountHolder() {
        return accountHolder;
    }

    public double getBalance() {
        return balance;
    }

    // Setter methods with validation - controlled write access
    public void setAccountHolder(String accountHolder) {
        if (accountHolder != null && !accountHolder.trim().isEmpty()) {
            this.accountHolder = accountHolder;
        } else {
            System.out.println("Invalid account holder name");
        }
    }

    // Business logic methods
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

    // Static method
    public static void setInterestRate(double rate) {
        if (rate >= 0 && rate <= 1) {
            interestRate = rate;
        }
    }
}
```

### Benefits of Encapsulation

```java
public class EncapsulationDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount("123456", "John Doe", 1000.0);

        // Cannot access private fields directly
        // account.balance = -5000; // Compilation error

        // Must use public methods with validation
        account.deposit(500.0);
        account.withdraw(200.0);
        account.withdraw(2000.0); // Will be rejected

        System.out.println("Balance: $" + account.getBalance());

        // Data integrity is maintained
        account.applyInterest();
    }
}
```

## Inheritance

Inheritance allows a class to inherit properties and methods from another class. The class that inherits is called the subclass (child class), and the class being inherited from is called the superclass (parent class).

### Basic Inheritance

```java
// Parent class (Superclass)
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

// Child class (Subclass)
public class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age); // Call parent constructor
        this.breed = breed;
    }

    // Method overriding
    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof! Woof!");
    }

    // Additional method specific to Dog
    public void fetch() {
        System.out.println(name + " is fetching the ball");
    }

    @Override
    public void displayInfo() {
        super.displayInfo(); // Call parent method
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

### The `super` Keyword

The `super` keyword is used to:
- Call the parent class constructor
- Access parent class methods
- Access parent class fields (if not private)

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
        super(brand, maxSpeed); // Must be first statement
        this.batteryCapacity = batteryCapacity;
        this.range = range;
    }

    @Override
    public void displaySpecs() {
        super.displaySpecs(); // Call parent method
        System.out.println("Battery Capacity: " + batteryCapacity + " kWh");
        System.out.println("Range: " + range + " km");
    }

    public void charge() {
        System.out.println(super.brand + " is charging"); // Access parent field
    }
}
```

### Inheritance Example

```java
public class InheritanceDemo {
    public static void main(String[] args) {
        // Create objects of different classes
        Animal animal = new Animal("Generic Animal", 5);
        Dog dog = new Dog("Buddy", 3, "Golden Retriever");
        Cat cat = new Cat("Whiskers", 2, true);

        // All can use parent class methods
        animal.eat();
        dog.eat();
        cat.eat();

        // Each has its own implementation of makeSound()
        animal.makeSound();
        dog.makeSound();
        cat.makeSound();

        // Child-specific methods
        dog.fetch();
        cat.scratch();

        // Display information
        System.out.println("\n--- Dog Info ---");
        dog.displayInfo();

        System.out.println("\n--- Cat Info ---");
        cat.displayInfo();
    }
}
```

### Types of Inheritance in Java

Java supports:
- **Single Inheritance**: One class inherits from one parent class
- **Multilevel Inheritance**: A chain of inheritance (A → B → C)
- **Hierarchical Inheritance**: Multiple classes inherit from one parent

Java does NOT support multiple inheritance (a class inheriting from multiple classes) to avoid the diamond problem. However, this can be achieved through interfaces.

```java
// Multilevel Inheritance
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

// Hierarchical Inheritance
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

## Polymorphism

Polymorphism means "many forms." It allows objects of different classes to be treated as objects of a common parent class. There are two types: compile-time (method overloading) and runtime (method overriding) polymorphism.

### Method Overloading (Compile-time Polymorphism)

Method overloading allows multiple methods with the same name but different parameters in the same class.

```java
public class Calculator {
    // Overloaded methods with different parameter counts
    public int add(int a, int b) {
        return a + b;
    }

    public int add(int a, int b, int c) {
        return a + b + c;
    }

    // Overloaded methods with different parameter types
    public double add(double a, double b) {
        return a + b;
    }

    public String add(String a, String b) {
        return a + b;
    }

    // Different parameter order
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

### Method Overriding (Runtime Polymorphism)

Method overriding allows a subclass to provide a specific implementation of a method that is already defined in its parent class.

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

### Polymorphic Behavior

```java
public class PolymorphismDemo {
    public static void main(String[] args) {
        // Parent reference, child objects
        Employee emp1 = new Employee("John", 50000);
        Employee emp2 = new Manager("Sarah", 70000, 15000);
        Employee emp3 = new Developer("Mike", 60000, 8);

        // Array of Employee references
        Employee[] employees = {emp1, emp2, emp3};

        // Polymorphic behavior - correct method called based on actual object type
        for (Employee emp : employees) {
            emp.displayInfo();
            System.out.println("---");
        }

        // Calculate total payroll
        double totalPayroll = 0;
        for (Employee emp : employees) {
            totalPayroll += emp.calculateSalary();
        }
        System.out.println("Total Payroll: $" + totalPayroll);
    }
}
```

### Dynamic Method Dispatch

Dynamic method dispatch is the mechanism by which a call to an overridden method is resolved at runtime rather than compile-time.

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

        // Runtime decision - which method to call
        shape = new Circle(5.0);
        shape.draw(); // Calls Circle's draw()
        System.out.println("Area: " + shape.calculateArea());

        shape = new Rectangle(4.0, 6.0);
        shape.draw(); // Calls Rectangle's draw()
        System.out.println("Area: " + shape.calculateArea());

        // The method called is determined by the actual object type, not the reference type
    }
}
```

## Abstract Classes

Abstract classes are classes that cannot be instantiated and may contain abstract methods (methods without implementation). They serve as templates for other classes.

### Defining Abstract Classes

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

    // Abstract methods - must be implemented by subclasses
    public abstract void startEngine();
    public abstract void stopEngine();
    public abstract double calculateMaintenanceCost();

    // Concrete method - has implementation
    public void displayInfo() {
        System.out.println("Brand: " + brand);
        System.out.println("Year: " + year);
        System.out.println("Price: $" + price);
    }

    // Concrete method with logic
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

### Abstract Class Example

```java
public class AbstractClassDemo {
    public static void main(String[] args) {
        // Cannot instantiate abstract class
        // Vehicle vehicle = new Vehicle("Generic", 2023, 20000); // ERROR

        // Can create instances of concrete subclasses
        Vehicle motorcycle = new Motorcycle("Harley Davidson", 2023, 18000, 1200);
        Vehicle truck = new Truck("Ford", 2022, 45000, 5.0);

        // Use polymorphism
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

### When to Use Abstract Classes

Use abstract classes when:
- You want to share code among several closely related classes
- You expect classes that extend your abstract class to have many common methods or fields
- You want to declare non-static or non-final fields
- You need to provide a common interface with some implementation

```java
public abstract class PaymentMethod {
    protected String accountHolder;
    protected double balance;

    public PaymentMethod(String accountHolder, double balance) {
        this.accountHolder = accountHolder;
        this.balance = balance;
    }

    // Abstract methods
    public abstract boolean processPayment(double amount);
    public abstract String getPaymentType();

    // Concrete methods
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

## Interfaces

An interface is a completely abstract class that contains only abstract methods (before Java 8) and constants. Interfaces define a contract that implementing classes must follow.

### Basic Interface

```java
public interface Drawable {
    // All methods are public and abstract by default
    void draw();
    void resize(double scale);
    void move(int x, int y);
}

public interface Colorable {
    void setColor(String color);
    String getColor();
}

// Class implementing interface
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

### Interface with Default and Static Methods (Java 8+)

```java
public interface Vehicle {
    // Abstract methods
    void start();
    void stop();
    double getSpeed();

    // Default method - can be overridden
    default void honk() {
        System.out.println("Beep beep!");
    }

    default void displayStatus() {
        System.out.println("Vehicle is " + (getSpeed() > 0 ? "moving" : "stopped"));
        System.out.println("Current speed: " + getSpeed() + " km/h");
    }

    // Static method - cannot be overridden
    static void showVehicleInfo() {
        System.out.println("This is a vehicle interface");
    }

    // Constant (public static final by default)
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

    // Override default method
    @Override
    public void honk() {
        System.out.println("Car horn: Honk honk!");
    }
}
```

### Multiple Interface Implementation

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

// Duck can fly, swim, and walk
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

// Fish can only swim
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

// Bird can fly and walk
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

### Interface Example

```java
public class InterfaceDemo {
    public static void main(String[] args) {
        Duck duck = new Duck("Donald");
        duck.walk();
        duck.swim();
        duck.fly();
        duck.land();

        System.out.println("---");

        // Polymorphism with interfaces
        Flyable flyingBird = new Bird("Eagle");
        flyingBird.fly();
        flyingBird.land();

        Swimmable swimmer = new Fish("Salmon");
        swimmer.swim();

        System.out.println("---");

        // Array of interface references
        Swimmable[] swimmers = {duck, new Fish("Tuna")};
        for (Swimmable s : swimmers) {
            s.swim();
        }
    }
}
```

### Interface vs Abstract Class

| Feature | Interface | Abstract Class |
|---------|-----------|----------------|
| Multiple inheritance | Yes (a class can implement multiple interfaces) | No (a class can extend only one class) |
| Method implementation | Default and static methods only (Java 8+) | Can have any method implementation |
| Variables | Only constants (public static final) | Can have any type of variables |
| Access modifiers | Methods are public by default | Can have any access modifier |
| Constructor | Cannot have constructors | Can have constructors |
| When to use | Define capabilities (what a class can do) | Define "is-a" relationships |

### Functional Interfaces

A functional interface has exactly one abstract method and can be used with lambda expressions.

```java
@FunctionalInterface
public interface Calculator {
    int calculate(int a, int b);

    // Can have default and static methods
    default void printResult(int result) {
        System.out.println("Result: " + result);
    }
}

public class FunctionalInterfaceDemo {
    public static void main(String[] args) {
        // Using lambda expressions
        Calculator addition = (a, b) -> a + b;
        Calculator subtraction = (a, b) -> a - b;
        Calculator multiplication = (a, b) -> a * b;
        Calculator division = (a, b) -> b != 0 ? a / b : 0;

        System.out.println("10 + 5 = " + addition.calculate(10, 5));
        System.out.println("10 - 5 = " + subtraction.calculate(10, 5));
        System.out.println("10 * 5 = " + multiplication.calculate(10, 5));
        System.out.println("10 / 5 = " + division.calculate(10, 5));

        // Using default method
        addition.printResult(addition.calculate(10, 5));
    }
}
```

## Inner Classes

Inner classes are classes defined within another class. Java supports several types of inner classes.

### Member Inner Class

A non-static class defined inside another class.

```java
public class OuterClass {
    private String outerField = "Outer field";
    private static String staticOuterField = "Static outer field";

    // Member inner class
    public class InnerClass {
        private String innerField = "Inner field";

        public void display() {
            // Can access outer class members
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
        // Create outer class instance
        OuterClass outer = new OuterClass();
        outer.testInner();

        // Create inner class instance
        OuterClass.InnerClass inner = outer.new InnerClass();
        inner.display();
    }
}
```

### Static Nested Class

A static class defined inside another class.

```java
public class University {
    private String universityName;
    private static String country = "USA";

    public University(String name) {
        this.universityName = name;
    }

    // Static nested class
    public static class Department {
        private String departmentName;
        private int numberOfStudents;

        public Department(String name, int students) {
            this.departmentName = name;
            this.numberOfStudents = students;
        }

        public void displayInfo() {
            // Can access static members of outer class
            System.out.println("Country: " + country);
            System.out.println("Department: " + departmentName);
            System.out.println("Students: " + numberOfStudents);

            // Cannot access non-static members
            // System.out.println(universityName); // ERROR
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

        // Create static nested class instance (no outer instance needed)
        University.Department csDept = new University.Department("Computer Science", 500);
        csDept.displayInfo();

        University.Department mathDept = new University.Department("Mathematics", 300);
        mathDept.displayInfo();
    }
}
```

### Local Inner Class

A class defined inside a method.

```java
public class LocalInnerDemo {
    private String outerField = "Outer";

    public void testLocalInner() {
        String localVariable = "Local";

        // Local inner class
        class LocalInner {
            private String innerField = "Inner";

            public void display() {
                System.out.println(outerField);
                System.out.println(localVariable); // Must be final or effectively final
                System.out.println(innerField);
            }
        }

        // Use local inner class
        LocalInner inner = new LocalInner();
        inner.display();
    }

    public static void main(String[] args) {
        LocalInnerDemo demo = new LocalInnerDemo();
        demo.testLocalInner();
    }
}
```

### Anonymous Inner Class

A class without a name, used for one-time use.

```java
interface Greeting {
    void greet(String name);
}

abstract class Animal {
    abstract void makeSound();
}

public class AnonymousInnerDemo {
    public static void main(String[] args) {
        // Anonymous inner class implementing interface
        Greeting greeting = new Greeting() {
            @Override
            public void greet(String name) {
                System.out.println("Hello, " + name + "!");
            }
        };
        greeting.greet("John");

        // Anonymous inner class extending abstract class
        Animal dog = new Animal() {
            @Override
            void makeSound() {
                System.out.println("Woof!");
            }
        };
        dog.makeSound();

        // Anonymous inner class with Thread
        Thread thread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("Thread is running");
            }
        });
        thread.start();

        // Same using lambda (for functional interfaces)
        Thread lambdaThread = new Thread(() ->
            System.out.println("Lambda thread is running")
        );
        lambdaThread.start();
    }
}
```

### Practical Example: Event Handling with Inner Classes

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

    // Inner interface
    public interface ClickListener {
        void onClick();
    }
}

public class EventHandlingDemo {
    public static void main(String[] args) {
        Button button1 = new Button("Submit");
        Button button2 = new Button("Cancel");

        // Using anonymous inner class
        button1.setOnClickListener(new Button.ClickListener() {
            @Override
            public void onClick() {
                System.out.println("Form submitted!");
            }
        });

        // Using lambda expression
        button2.setOnClickListener(() ->
            System.out.println("Action cancelled!")
        );

        button1.click();
        button2.click();
    }
}
```

## Best Practices

### Follow SOLID Principles

```java
// Single Responsibility Principle
// Bad: Class doing too many things
class UserService {
    public void createUser(String name, String email) { }
    public void sendEmail(String email, String message) { }
    public void generateReport(User user) { }
}

// Good: Separate responsibilities
class UserService {
    public void createUser(String name, String email) { }
}

class EmailService {
    public void sendEmail(String email, String message) { }
}

class ReportService {
    public void generateReport(User user) { }
}

// Open/Closed Principle
// Bad: Modifying existing code
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

// Good: Open for extension, closed for modification
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

### Favor Composition Over Inheritance

```java
// Inheritance approach (rigid)
class Vehicle {
    void move() { }
}

class FlyingVehicle extends Vehicle {
    void fly() { }
}

// Composition approach (flexible)
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

### Use Proper Access Modifiers

```java
public class BestPracticesExample {
    // Private fields
    private String name;
    private int age;

    // Public constructor
    public BestPracticesExample(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // Public getters
    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    // Private helper method
    private boolean isValid() {
        return name != null && age > 0;
    }

    // Public method using private helper
    public void display() {
        if (isValid()) {
            System.out.println("Name: " + name + ", Age: " + age);
        }
    }
}
```

### Override equals() and hashCode() Properly

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

### Use Meaningful Names

```java
// Bad
public class D {
    private int d;

    public void p() {
        // process
    }
}

// Good
public class DataProcessor {
    private int dataCount;

    public void processData() {
        // process
    }
}
```

### Keep Methods Small and Focused

```java
// Bad: Method doing too much
public void processOrder(Order order) {
    validateOrder(order);
    calculateTotal(order);
    applyDiscount(order);
    processPayment(order);
    updateInventory(order);
    sendConfirmation(order);
}

// Good: Delegating to smaller methods
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

## Summary

Java's Object-Oriented Programming features provide powerful tools for creating maintainable, scalable, and robust applications:

- **Classes and Objects**: Blueprint and instances representing real-world entities
- **Encapsulation**: Data hiding and controlled access through getters/setters
- **Inheritance**: Code reuse and establishing hierarchical relationships
- **Polymorphism**: Multiple forms through method overloading and overriding
- **Abstract Classes**: Templates for related classes with partial implementation
- **Interfaces**: Contracts defining capabilities and enabling multiple inheritance
- **Inner Classes**: Logical grouping and encapsulation of related functionality

By mastering these concepts and following best practices, you can write clean, efficient, and maintainable Java code that leverages the full power of object-oriented programming.
