---
title: Java Design Patterns
description: Learn common Java design patterns including creational, structural and behavioral patterns
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - Java
  - design patterns
  - architecture
  - OOP
status: imported
origin: old/src/content/docs/java/design-patterns.en.md
divergence: 0.095
issues: []
legacy:
  category: Java
  subcategory: Architecture
  order: 24
  lastUpdated: 2026-01-07
---

Design patterns are proven, reusable solutions to common software design problems. They represent best practices evolved over time by experienced software developers. We cover the essential design patterns in Java, organized by their purpose and scope.

## What Are Design Patterns?

Design patterns are general, reusable solutions to commonly occurring problems within a given context in software design. They are not finished designs that can be transformed directly into code but rather templates for solving problems that can be used in many different situations.

The concept of design patterns was popularized by the "Gang of Four" (GoF) in their 1994 book "Design Patterns: Elements of Reusable Object-Oriented Software." They identified 23 classic patterns divided into three categories:

- **Creational Patterns**: Deal with object creation mechanisms
- **Structural Patterns**: Deal with object composition and relationships
- **Behavioral Patterns**: Deal with object interaction and responsibility

### Why Learn Design Patterns?

1. **Proven Solutions**: Patterns are tested solutions to recurring problems
2. **Common Vocabulary**: Developers can communicate more effectively using pattern names
3. **Code Maintainability**: Patterns promote cleaner, more maintainable code
4. **Flexibility**: Patterns often make systems more flexible and adaptable to change
5. **Interview Preparation**: Design patterns are frequently asked about in technical interviews

## Design Principles

Before diving into specific patterns, it is important to understand the foundational principles that guide good object-oriented design.

### SOLID Principles

```java
// Single Responsibility Principle (SRP)
// A class should have only one reason to change

// Bad: Class handles multiple responsibilities
class UserManager {
    public void saveUser(User user) { /* save to database */ }
    public void sendEmail(User user) { /* send email */ }
    public void generateReport(User user) { /* generate PDF */ }
}

// Good: Each class has a single responsibility
class UserRepository {
    public void save(User user) { /* save to database */ }
}

class EmailService {
    public void sendWelcomeEmail(User user) { /* send email */ }
}

class UserReportGenerator {
    public byte[] generate(User user) { /* generate PDF */ }
}
```

```java
// Open/Closed Principle (OCP)
// Classes should be open for extension but closed for modification

// Bad: Must modify class to add new shapes
class AreaCalculator {
    public double calculate(Object shape) {
        if (shape instanceof Rectangle) {
            Rectangle r = (Rectangle) shape;
            return r.width * r.height;
        } else if (shape instanceof Circle) {
            Circle c = (Circle) shape;
            return Math.PI * c.radius * c.radius;
        }
        return 0;
    }
}

// Good: Extend through inheritance without modifying existing code
interface Shape {
    double calculateArea();
}

class Rectangle implements Shape {
    private double width, height;

    public double calculateArea() {
        return width * height;
    }
}

class Circle implements Shape {
    private double radius;

    public double calculateArea() {
        return Math.PI * radius * radius;
    }
}
```

```java
// Liskov Substitution Principle (LSP)
// Subtypes must be substitutable for their base types

// Bad: Square violates LSP when used as Rectangle
class Rectangle {
    protected int width, height;

    public void setWidth(int width) { this.width = width; }
    public void setHeight(int height) { this.height = height; }
    public int getArea() { return width * height; }
}

class Square extends Rectangle {
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width; // Violates expected behavior
    }
}

// Good: Use composition or separate hierarchies
interface Shape {
    int getArea();
}

class Rectangle implements Shape {
    private int width, height;
    public int getArea() { return width * height; }
}

class Square implements Shape {
    private int side;
    public int getArea() { return side * side; }
}
```

```java
// Interface Segregation Principle (ISP)
// Clients should not be forced to depend on methods they do not use

// Bad: Fat interface
interface Worker {
    void work();
    void eat();
    void sleep();
}

class Robot implements Worker {
    public void work() { /* working */ }
    public void eat() { /* robots do not eat! */ }
    public void sleep() { /* robots do not sleep! */ }
}

// Good: Segregated interfaces
interface Workable {
    void work();
}

interface Eatable {
    void eat();
}

interface Sleepable {
    void sleep();
}

class Human implements Workable, Eatable, Sleepable {
    public void work() { /* working */ }
    public void eat() { /* eating */ }
    public void sleep() { /* sleeping */ }
}

class Robot implements Workable {
    public void work() { /* working */ }
}
```

```java
// Dependency Inversion Principle (DIP)
// High-level modules should not depend on low-level modules;
// both should depend on abstractions

// Bad: High-level class depends on concrete implementation
class UserService {
    private MySQLDatabase database = new MySQLDatabase();

    public void saveUser(User user) {
        database.insert(user);
    }
}

// Good: Depend on abstractions
interface Database {
    void insert(Object data);
}

class MySQLDatabase implements Database {
    public void insert(Object data) { /* MySQL implementation */ }
}

class MongoDatabase implements Database {
    public void insert(Object data) { /* MongoDB implementation */ }
}

class UserService {
    private final Database database;

    public UserService(Database database) {
        this.database = database;
    }

    public void saveUser(User user) {
        database.insert(user);
    }
}
```

## Creational Patterns

Creational patterns provide ways to create objects while hiding the creation logic, rather than instantiating objects directly using the new operator.

### Singleton Pattern

The Singleton pattern ensures a class has only one instance and provides a global point of access to it.

#### When to Use

- When exactly one instance of a class is needed
- When the single instance should be accessible from a well-known access point
- Examples: Configuration managers, connection pools, logging services

#### Implementation

```java
// Thread-safe Singleton using double-checked locking
public class DatabaseConnection {

    private static volatile DatabaseConnection instance;
    private Connection connection;

    // Private constructor prevents instantiation from outside
    private DatabaseConnection() {
        // Initialize database connection
        try {
            connection = DriverManager.getConnection(
                "jdbc:mysql://localhost:3306/mydb", "user", "password"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Failed to connect to database", e);
        }
    }

    // Double-checked locking for thread-safe lazy initialization
    public static DatabaseConnection getInstance() {
        if (instance == null) {
            synchronized (DatabaseConnection.class) {
                if (instance == null) {
                    instance = new DatabaseConnection();
                }
            }
        }
        return instance;
    }

    public Connection getConnection() {
        return connection;
    }

    public void executeQuery(String sql) {
        // Execute database query
    }
}

// Usage
DatabaseConnection db = DatabaseConnection.getInstance();
db.executeQuery("SELECT * FROM users");
```

#### Enum Singleton (Recommended)

```java
// Thread-safe and serialization-safe Singleton using enum
public enum ConfigurationManager {
    INSTANCE;

    private Properties properties;

    ConfigurationManager() {
        properties = new Properties();
        try {
            properties.load(
                getClass().getClassLoader().getResourceAsStream("config.properties")
            );
        } catch (IOException e) {
            throw new RuntimeException("Failed to load configuration", e);
        }
    }

    public String getProperty(String key) {
        return properties.getProperty(key);
    }

    public String getProperty(String key, String defaultValue) {
        return properties.getProperty(key, defaultValue);
    }
}

// Usage
String dbUrl = ConfigurationManager.INSTANCE.getProperty("database.url");
```

#### Bill Pugh Singleton (Initialization-on-demand holder)

```java
// Thread-safe Singleton without synchronization overhead
public class Logger {

    private Logger() {
        // Private constructor
    }

    // Static inner class - loaded only when getInstance() is called
    private static class LoggerHolder {
        private static final Logger INSTANCE = new Logger();
    }

    public static Logger getInstance() {
        return LoggerHolder.INSTANCE;
    }

    public void log(String level, String message) {
        System.out.printf("[%s] %s: %s%n",
            LocalDateTime.now(), level, message);
    }

    public void info(String message) {
        log("INFO", message);
    }

    public void error(String message) {
        log("ERROR", message);
    }

    public void debug(String message) {
        log("DEBUG", message);
    }
}
```

### Factory Method Pattern

The Factory Method pattern defines an interface for creating objects but lets subclasses decide which class to instantiate.

#### When to Use

- When a class cannot anticipate the type of objects it needs to create
- When a class wants its subclasses to specify the objects it creates
- When you want to localize the knowledge of which class gets created

#### Implementation

```java
// Product interface
public interface Document {
    void open();
    void save();
    void close();
}

// Concrete products
public class PDFDocument implements Document {
    private String filename;

    public PDFDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening PDF document: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving PDF document: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing PDF document: " + filename);
    }
}

public class WordDocument implements Document {
    private String filename;

    public WordDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening Word document: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving Word document: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing Word document: " + filename);
    }
}

public class SpreadsheetDocument implements Document {
    private String filename;

    public SpreadsheetDocument(String filename) {
        this.filename = filename;
    }

    @Override
    public void open() {
        System.out.println("Opening Spreadsheet: " + filename);
    }

    @Override
    public void save() {
        System.out.println("Saving Spreadsheet: " + filename);
    }

    @Override
    public void close() {
        System.out.println("Closing Spreadsheet: " + filename);
    }
}

// Creator abstract class
public abstract class Application {

    // Factory method
    public abstract Document createDocument(String filename);

    // Template method using the factory method
    public void newDocument(String filename) {
        Document doc = createDocument(filename);
        doc.open();
        System.out.println("Document ready for editing");
    }

    public void openDocument(String filename) {
        Document doc = createDocument(filename);
        doc.open();
    }
}

// Concrete creators
public class PDFApplication extends Application {
    @Override
    public Document createDocument(String filename) {
        return new PDFDocument(filename);
    }
}

public class WordApplication extends Application {
    @Override
    public Document createDocument(String filename) {
        return new WordDocument(filename);
    }
}

public class SpreadsheetApplication extends Application {
    @Override
    public Document createDocument(String filename) {
        return new SpreadsheetDocument(filename);
    }
}

// Usage
Application pdfApp = new PDFApplication();
pdfApp.newDocument("report.pdf");

Application wordApp = new WordApplication();
wordApp.newDocument("letter.docx");
```

#### Simple Factory (Not a GoF Pattern but Commonly Used)

```java
public class DocumentFactory {

    public static Document createDocument(String type, String filename) {
        return switch (type.toLowerCase()) {
            case "pdf" -> new PDFDocument(filename);
            case "word", "docx" -> new WordDocument(filename);
            case "excel", "xlsx" -> new SpreadsheetDocument(filename);
            default -> throw new IllegalArgumentException(
                "Unknown document type: " + type
            );
        };
    }
}

// Usage
Document pdf = DocumentFactory.createDocument("pdf", "report.pdf");
Document word = DocumentFactory.createDocument("word", "letter.docx");
```

### Abstract Factory Pattern

The Abstract Factory pattern provides an interface for creating families of related objects without specifying their concrete classes.

#### When to Use

- When the system should be independent of how its products are created
- When a system should be configured with one of multiple families of products
- When you want to provide a class library of products and expose only their interfaces

#### Implementation

```java
// Abstract products
public interface Button {
    void render();
    void onClick(Runnable action);
}

public interface Checkbox {
    void render();
    boolean isChecked();
    void setChecked(boolean checked);
}

public interface TextField {
    void render();
    String getText();
    void setText(String text);
}

// Windows family of products
public class WindowsButton implements Button {
    @Override
    public void render() {
        System.out.println("Rendering Windows-style button");
    }

    @Override
    public void onClick(Runnable action) {
        System.out.println("Windows button clicked");
        action.run();
    }
}

public class WindowsCheckbox implements Checkbox {
    private boolean checked = false;

    @Override
    public void render() {
        System.out.println("Rendering Windows-style checkbox");
    }

    @Override
    public boolean isChecked() { return checked; }

    @Override
    public void setChecked(boolean checked) { this.checked = checked; }
}

public class WindowsTextField implements TextField {
    private String text = "";

    @Override
    public void render() {
        System.out.println("Rendering Windows-style text field");
    }

    @Override
    public String getText() { return text; }

    @Override
    public void setText(String text) { this.text = text; }
}

// macOS family of products
public class MacOSButton implements Button {
    @Override
    public void render() {
        System.out.println("Rendering macOS-style button");
    }

    @Override
    public void onClick(Runnable action) {
        System.out.println("macOS button clicked");
        action.run();
    }
}

public class MacOSCheckbox implements Checkbox {
    private boolean checked = false;

    @Override
    public void render() {
        System.out.println("Rendering macOS-style checkbox");
    }

    @Override
    public boolean isChecked() { return checked; }

    @Override
    public void setChecked(boolean checked) { this.checked = checked; }
}

public class MacOSTextField implements TextField {
    private String text = "";

    @Override
    public void render() {
        System.out.println("Rendering macOS-style text field");
    }

    @Override
    public String getText() { return text; }

    @Override
    public void setText(String text) { this.text = text; }
}

// Abstract factory
public interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox();
    TextField createTextField();
}

// Concrete factories
public class WindowsFactory implements GUIFactory {
    @Override
    public Button createButton() {
        return new WindowsButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new WindowsCheckbox();
    }

    @Override
    public TextField createTextField() {
        return new WindowsTextField();
    }
}

public class MacOSFactory implements GUIFactory {
    @Override
    public Button createButton() {
        return new MacOSButton();
    }

    @Override
    public Checkbox createCheckbox() {
        return new MacOSCheckbox();
    }

    @Override
    public TextField createTextField() {
        return new MacOSTextField();
    }
}

// Client code
public class Application {
    private Button button;
    private Checkbox checkbox;
    private TextField textField;

    public Application(GUIFactory factory) {
        button = factory.createButton();
        checkbox = factory.createCheckbox();
        textField = factory.createTextField();
    }

    public void render() {
        button.render();
        checkbox.render();
        textField.render();
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        String os = System.getProperty("os.name").toLowerCase();
        GUIFactory factory;

        if (os.contains("windows")) {
            factory = new WindowsFactory();
        } else {
            factory = new MacOSFactory();
        }

        Application app = new Application(factory);
        app.render();
    }
}
```

### Builder Pattern

The Builder pattern separates the construction of a complex object from its representation, allowing the same construction process to create different representations.

#### When to Use

- When the algorithm for creating a complex object should be independent of the parts
- When the construction process must allow different representations
- When you want to avoid telescoping constructors (constructors with many parameters)

#### Implementation

```java
// Product
public class Computer {
    // Required parameters
    private final String cpu;
    private final int ram;

    // Optional parameters
    private final int storage;
    private final boolean hasGPU;
    private final String gpuModel;
    private final boolean hasWifi;
    private final boolean hasBluetooth;
    private final String operatingSystem;

    private Computer(Builder builder) {
        this.cpu = builder.cpu;
        this.ram = builder.ram;
        this.storage = builder.storage;
        this.hasGPU = builder.hasGPU;
        this.gpuModel = builder.gpuModel;
        this.hasWifi = builder.hasWifi;
        this.hasBluetooth = builder.hasBluetooth;
        this.operatingSystem = builder.operatingSystem;
    }

    // Getters
    public String getCpu() { return cpu; }
    public int getRam() { return ram; }
    public int getStorage() { return storage; }
    public boolean hasGPU() { return hasGPU; }
    public String getGpuModel() { return gpuModel; }
    public boolean hasWifi() { return hasWifi; }
    public boolean hasBluetooth() { return hasBluetooth; }
    public String getOperatingSystem() { return operatingSystem; }

    @Override
    public String toString() {
        return String.format(
            "Computer[CPU=%s, RAM=%dGB, Storage=%dGB, GPU=%s, WiFi=%b, BT=%b, OS=%s]",
            cpu, ram, storage, hasGPU ? gpuModel : "None", hasWifi, hasBluetooth, operatingSystem
        );
    }

    // Builder class
    public static class Builder {
        // Required parameters
        private final String cpu;
        private final int ram;

        // Optional parameters with default values
        private int storage = 256;
        private boolean hasGPU = false;
        private String gpuModel = null;
        private boolean hasWifi = true;
        private boolean hasBluetooth = true;
        private String operatingSystem = "Linux";

        public Builder(String cpu, int ram) {
            this.cpu = cpu;
            this.ram = ram;
        }

        public Builder storage(int storage) {
            this.storage = storage;
            return this;
        }

        public Builder gpu(String gpuModel) {
            this.hasGPU = true;
            this.gpuModel = gpuModel;
            return this;
        }

        public Builder wifi(boolean hasWifi) {
            this.hasWifi = hasWifi;
            return this;
        }

        public Builder bluetooth(boolean hasBluetooth) {
            this.hasBluetooth = hasBluetooth;
            return this;
        }

        public Builder operatingSystem(String os) {
            this.operatingSystem = os;
            return this;
        }

        public Computer build() {
            return new Computer(this);
        }
    }
}

// Usage
Computer gamingPC = new Computer.Builder("Intel i9", 32)
    .storage(2000)
    .gpu("NVIDIA RTX 4090")
    .operatingSystem("Windows 11")
    .build();

Computer officePC = new Computer.Builder("Intel i5", 16)
    .storage(512)
    .operatingSystem("Windows 11")
    .build();

Computer server = new Computer.Builder("AMD EPYC", 128)
    .storage(4000)
    .wifi(false)
    .bluetooth(false)
    .build();

System.out.println(gamingPC);
System.out.println(officePC);
System.out.println(server);
```

#### Director Pattern (Optional)

```java
// Director class for common configurations
public class ComputerDirector {

    public Computer buildGamingComputer() {
        return new Computer.Builder("Intel i9", 32)
            .storage(2000)
            .gpu("NVIDIA RTX 4090")
            .operatingSystem("Windows 11")
            .build();
    }

    public Computer buildOfficeComputer() {
        return new Computer.Builder("Intel i5", 16)
            .storage(512)
            .operatingSystem("Windows 11")
            .build();
    }

    public Computer buildDeveloperComputer() {
        return new Computer.Builder("Apple M2", 32)
            .storage(1000)
            .operatingSystem("macOS")
            .build();
    }
}

// Usage
ComputerDirector director = new ComputerDirector();
Computer gaming = director.buildGamingComputer();
Computer office = director.buildOfficeComputer();
```

### Prototype Pattern

The Prototype pattern creates new objects by copying an existing object, known as the prototype.

#### When to Use

- When the classes to instantiate are specified at runtime
- When you want to avoid building a class hierarchy of factories
- When creating an object is more expensive than copying an existing one

#### Implementation

```java
// Prototype interface
public interface Prototype<T> extends Cloneable {
    T clone();
}

// Concrete prototype
public class Employee implements Prototype<Employee> {
    private String name;
    private String position;
    private double salary;
    private List<String> skills;
    private Address address;

    public Employee(String name, String position, double salary) {
        this.name = name;
        this.position = position;
        this.salary = salary;
        this.skills = new ArrayList<>();
        this.address = new Address();
    }

    // Private constructor for cloning
    private Employee(Employee source) {
        this.name = source.name;
        this.position = source.position;
        this.salary = source.salary;
        // Deep copy of mutable objects
        this.skills = new ArrayList<>(source.skills);
        this.address = source.address.clone();
    }

    @Override
    public Employee clone() {
        return new Employee(this);
    }

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }
    public double getSalary() { return salary; }
    public void setSalary(double salary) { this.salary = salary; }
    public List<String> getSkills() { return skills; }
    public void addSkill(String skill) { this.skills.add(skill); }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }

    @Override
    public String toString() {
        return String.format("Employee[name=%s, position=%s, salary=%.2f, skills=%s]",
            name, position, salary, skills);
    }
}

public class Address implements Prototype<Address> {
    private String street;
    private String city;
    private String country;

    public Address() {}

    public Address(String street, String city, String country) {
        this.street = street;
        this.city = city;
        this.country = country;
    }

    private Address(Address source) {
        this.street = source.street;
        this.city = source.city;
        this.country = source.country;
    }

    @Override
    public Address clone() {
        return new Address(this);
    }

    // Getters and setters
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}

// Prototype registry
public class EmployeeRegistry {
    private Map<String, Employee> prototypes = new HashMap<>();

    public EmployeeRegistry() {
        // Register default prototypes
        Employee developer = new Employee("", "Software Developer", 80000);
        developer.addSkill("Java");
        developer.addSkill("SQL");
        prototypes.put("developer", developer);

        Employee manager = new Employee("", "Project Manager", 100000);
        manager.addSkill("Leadership");
        manager.addSkill("Agile");
        prototypes.put("manager", manager);

        Employee intern = new Employee("", "Intern", 30000);
        prototypes.put("intern", intern);
    }

    public Employee createEmployee(String type, String name) {
        Employee prototype = prototypes.get(type);
        if (prototype == null) {
            throw new IllegalArgumentException("Unknown employee type: " + type);
        }
        Employee employee = prototype.clone();
        employee.setName(name);
        return employee;
    }

    public void registerPrototype(String type, Employee prototype) {
        prototypes.put(type, prototype);
    }
}

// Usage
EmployeeRegistry registry = new EmployeeRegistry();

Employee dev1 = registry.createEmployee("developer", "Alice");
Employee dev2 = registry.createEmployee("developer", "Bob");
Employee manager = registry.createEmployee("manager", "Charlie");

dev1.addSkill("Spring Boot");
System.out.println(dev1); // Has "Java", "SQL", "Spring Boot"
System.out.println(dev2); // Has only "Java", "SQL" (independent copy)
```

## Structural Patterns

Structural patterns deal with how classes and objects are composed to form larger structures.

### Adapter Pattern

The Adapter pattern allows incompatible interfaces to work together by wrapping an object in an adapter to make it compatible with another class.

#### When to Use

- When you want to use an existing class, but its interface does not match what you need
- When you want to create a reusable class that cooperates with unrelated classes
- When you need to use several existing subclasses without adapting each one

#### Implementation

```java
// Target interface (what the client expects)
public interface MediaPlayer {
    void play(String filename);
    void pause();
    void stop();
    String getStatus();
}

// Adaptee (existing class with incompatible interface)
public class AdvancedVideoPlayer {
    private String currentFile;
    private boolean playing;

    public void loadVideo(String filename) {
        this.currentFile = filename;
        System.out.println("Loading video: " + filename);
    }

    public void playVideo() {
        if (currentFile != null) {
            playing = true;
            System.out.println("Playing video: " + currentFile);
        }
    }

    public void pauseVideo() {
        playing = false;
        System.out.println("Video paused");
    }

    public void stopVideo() {
        playing = false;
        currentFile = null;
        System.out.println("Video stopped");
    }

    public boolean isPlaying() {
        return playing;
    }

    public String getCurrentFile() {
        return currentFile;
    }
}

// Object Adapter for AdvancedVideoPlayer
public class VideoPlayerAdapter implements MediaPlayer {
    private AdvancedVideoPlayer videoPlayer;

    public VideoPlayerAdapter() {
        this.videoPlayer = new AdvancedVideoPlayer();
    }

    @Override
    public void play(String filename) {
        videoPlayer.loadVideo(filename);
        videoPlayer.playVideo();
    }

    @Override
    public void pause() {
        videoPlayer.pauseVideo();
    }

    @Override
    public void stop() {
        videoPlayer.stopVideo();
    }

    @Override
    public String getStatus() {
        if (videoPlayer.isPlaying()) {
            return "Playing: " + videoPlayer.getCurrentFile();
        }
        return "Stopped";
    }
}

// Usage
MediaPlayer player = new VideoPlayerAdapter();
player.play("movie.mp4");
System.out.println(player.getStatus());
player.stop();
```

### Decorator Pattern

The Decorator pattern attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

#### When to Use

- When you want to add responsibilities to objects dynamically and transparently
- When extension by subclassing is impractical
- When you need to remove responsibilities dynamically

#### Implementation

```java
// Component interface
public interface Coffee {
    String getDescription();
    double getCost();
}

// Concrete component
public class SimpleCoffee implements Coffee {
    @Override
    public String getDescription() {
        return "Simple Coffee";
    }

    @Override
    public double getCost() {
        return 2.00;
    }
}

public class Espresso implements Coffee {
    @Override
    public String getDescription() {
        return "Espresso";
    }

    @Override
    public double getCost() {
        return 2.50;
    }
}

// Base decorator
public abstract class CoffeeDecorator implements Coffee {
    protected Coffee decoratedCoffee;

    public CoffeeDecorator(Coffee coffee) {
        this.decoratedCoffee = coffee;
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription();
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost();
    }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Milk";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.50;
    }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Sugar";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.25;
    }
}

public class WhippedCreamDecorator extends CoffeeDecorator {
    public WhippedCreamDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + ", Whipped Cream";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 0.75;
    }
}

// Usage
Coffee coffee = new SimpleCoffee();
System.out.printf("%s: $%.2f%n", coffee.getDescription(), coffee.getCost());
// Simple Coffee: $2.00

coffee = new MilkDecorator(coffee);
System.out.printf("%s: $%.2f%n", coffee.getDescription(), coffee.getCost());
// Simple Coffee, Milk: $2.50

coffee = new SugarDecorator(coffee);
coffee = new WhippedCreamDecorator(coffee);
System.out.printf("%s: $%.2f%n", coffee.getDescription(), coffee.getCost());
// Simple Coffee, Milk, Sugar, Whipped Cream: $3.50

// Or chain decorators in one line
Coffee fancyLatte = new WhippedCreamDecorator(
    new MilkDecorator(
        new Espresso()
    )
);
System.out.printf("%s: $%.2f%n", fancyLatte.getDescription(), fancyLatte.getCost());
// Espresso, Milk, Whipped Cream: $3.75
```

### Facade Pattern

The Facade pattern provides a unified interface to a set of interfaces in a subsystem. It defines a higher-level interface that makes the subsystem easier to use.

#### When to Use

- When you want to provide a simple interface to a complex subsystem
- When there are many dependencies between clients and implementation classes
- When you want to layer your subsystems

#### Implementation

```java
// Complex subsystem classes
public class CPU {
    public void freeze() {
        System.out.println("CPU: Freezing processor");
    }

    public void jump(long position) {
        System.out.println("CPU: Jumping to position " + position);
    }

    public void execute() {
        System.out.println("CPU: Executing instructions");
    }
}

public class Memory {
    public void load(long position, byte[] data) {
        System.out.println("Memory: Loading " + data.length +
            " bytes at position " + position);
    }
}

public class HardDrive {
    public byte[] read(long lba, int size) {
        System.out.println("HardDrive: Reading " + size +
            " bytes from sector " + lba);
        return new byte[size];
    }
}

public class PowerSupply {
    public void turnOn() {
        System.out.println("PowerSupply: Turning on");
    }

    public void turnOff() {
        System.out.println("PowerSupply: Turning off");
    }
}

// Facade
public class ComputerFacade {
    private static final long BOOT_ADDRESS = 0x0000;
    private static final long BOOT_SECTOR = 0;
    private static final int SECTOR_SIZE = 512;

    private CPU cpu;
    private Memory memory;
    private HardDrive hardDrive;
    private PowerSupply powerSupply;

    public ComputerFacade() {
        this.cpu = new CPU();
        this.memory = new Memory();
        this.hardDrive = new HardDrive();
        this.powerSupply = new PowerSupply();
    }

    public void start() {
        System.out.println("=== Starting Computer ===");
        powerSupply.turnOn();
        cpu.freeze();
        byte[] bootSector = hardDrive.read(BOOT_SECTOR, SECTOR_SIZE);
        memory.load(BOOT_ADDRESS, bootSector);
        cpu.jump(BOOT_ADDRESS);
        cpu.execute();
        System.out.println("=== Computer Started ===\n");
    }

    public void shutdown() {
        System.out.println("=== Shutting Down Computer ===");
        cpu.freeze();
        powerSupply.turnOff();
        System.out.println("=== Computer Shut Down ===\n");
    }
}

// Usage - Client only needs to know the Facade
ComputerFacade computer = new ComputerFacade();
computer.start();
// ... use the computer ...
computer.shutdown();
```

### Proxy Pattern

The Proxy pattern provides a surrogate or placeholder for another object to control access to it.

#### Types of Proxy

- **Virtual Proxy**: Delays the creation of expensive objects until needed
- **Protection Proxy**: Controls access based on permissions
- **Caching Proxy**: Provides temporary storage for expensive operation results

#### Implementation

```java
// Subject interface
public interface Image {
    void display();
    String getFilename();
}

// Real subject
public class RealImage implements Image {
    private String filename;

    public RealImage(String filename) {
        this.filename = filename;
        loadFromDisk();
    }

    private void loadFromDisk() {
        System.out.println("Loading image from disk: " + filename);
        // Simulate expensive loading operation
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        System.out.println("Image loaded: " + filename);
    }

    @Override
    public void display() {
        System.out.println("Displaying image: " + filename);
    }

    @Override
    public String getFilename() {
        return filename;
    }
}

// Virtual Proxy - lazy loading
public class ImageProxy implements Image {
    private String filename;
    private RealImage realImage;

    public ImageProxy(String filename) {
        this.filename = filename;
        // Does NOT load the image yet
    }

    @Override
    public void display() {
        if (realImage == null) {
            realImage = new RealImage(filename);
        }
        realImage.display();
    }

    @Override
    public String getFilename() {
        return filename;
    }
}

// Usage
// Virtual Proxy - image only loads when displayed
Image image = new ImageProxy("large_photo.jpg");
System.out.println("Image created but not loaded yet");
image.display(); // Now it loads
```

### Composite Pattern

The Composite pattern composes objects into tree structures to represent part-whole hierarchies. It lets clients treat individual objects and compositions of objects uniformly.

#### When to Use

- When you want to represent part-whole hierarchies of objects
- When you want clients to be able to ignore the difference between compositions and individual objects

#### Implementation

```java
// Component
public interface FileSystemComponent {
    String getName();
    long getSize();
    void display(String indent);
}

// Leaf
public class File implements FileSystemComponent {
    private String name;
    private long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getSize() {
        return size;
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "File: " + name + " (" + size + " bytes)");
    }
}

// Composite
public class Directory implements FileSystemComponent {
    private String name;
    private List<FileSystemComponent> children = new ArrayList<>();

    public Directory(String name) {
        this.name = name;
    }

    public void add(FileSystemComponent component) {
        children.add(component);
    }

    public void remove(FileSystemComponent component) {
        children.remove(component);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public long getSize() {
        long totalSize = 0;
        for (FileSystemComponent child : children) {
            totalSize += child.getSize();
        }
        return totalSize;
    }

    @Override
    public void display(String indent) {
        System.out.println(indent + "Directory: " + name +
            " (" + getSize() + " bytes total)");
        for (FileSystemComponent child : children) {
            child.display(indent + "  ");
        }
    }
}

// Usage
Directory root = new Directory("root");

Directory home = new Directory("home");
Directory documents = new Directory("documents");

documents.add(new File("resume.pdf", 102400));
documents.add(new File("cover_letter.docx", 51200));

home.add(documents);
home.add(new File(".bashrc", 1024));

root.add(home);
root.add(new File("README.txt", 256));

root.display("");
```

## Behavioral Patterns

Behavioral patterns focus on communication between objects, how they interact and distribute responsibilities.

### Strategy Pattern

The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable.

#### When to Use

- When you have many related classes that differ only in their behavior
- When you need different variants of an algorithm
- When a class defines many behaviors using conditional statements

#### Implementation

```java
// Strategy interface
public interface PaymentStrategy {
    boolean pay(double amount);
    String getPaymentMethod();
}

// Concrete strategies
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    private String cardHolder;

    public CreditCardPayment(String cardNumber, String cardHolder) {
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("Paying $%.2f using Credit Card%n", amount);
        System.out.println("Card: **** **** **** " + cardNumber.substring(12));
        return true;
    }

    @Override
    public String getPaymentMethod() {
        return "Credit Card";
    }
}

public class PayPalPayment implements PaymentStrategy {
    private String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("Paying $%.2f using PayPal%n", amount);
        System.out.println("Account: " + email);
        return true;
    }

    @Override
    public String getPaymentMethod() {
        return "PayPal";
    }
}

// Context
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void addItem(Item item) {
        items.add(item);
    }

    public double getTotal() {
        return items.stream()
            .mapToDouble(item -> item.getPrice() * item.getQuantity())
            .sum();
    }

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public boolean checkout() {
        if (paymentStrategy == null) {
            throw new IllegalStateException("Payment method not set");
        }
        return paymentStrategy.pay(getTotal());
    }
}

// Usage
ShoppingCart cart = new ShoppingCart();
cart.addItem(new Item("Laptop", 999.99, 1));
cart.addItem(new Item("Mouse", 29.99, 2));

// Pay with credit card
cart.setPaymentStrategy(new CreditCardPayment("1234567890123456", "John Doe"));
cart.checkout();

// Or pay with PayPal
cart.setPaymentStrategy(new PayPalPayment("john@email.com"));
cart.checkout();
```

### Observer Pattern

The Observer pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

#### When to Use

- When changes to one object require changing others
- When an object should be able to notify other objects without knowing who they are
- When you need to maintain consistency between related objects

#### Implementation

```java
// Observer interface
public interface Observer {
    void update(String event, Object data);
}

// Subject interface
public interface Subject {
    void attach(Observer observer);
    void detach(Observer observer);
    void notifyObservers(String event, Object data);
}

// Concrete subject
public class StockMarket implements Subject {
    private Map<String, Double> stocks = new HashMap<>();
    private List<Observer> observers = new ArrayList<>();

    @Override
    public void attach(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void detach(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers(String event, Object data) {
        for (Observer observer : observers) {
            observer.update(event, data);
        }
    }

    public void setStockPrice(String symbol, double price) {
        Double oldPrice = stocks.get(symbol);
        stocks.put(symbol, price);

        Map<String, Object> data = new HashMap<>();
        data.put("symbol", symbol);
        data.put("oldPrice", oldPrice);
        data.put("newPrice", price);

        notifyObservers("STOCK_UPDATE", data);
    }
}

// Concrete observer
public class StockDisplay implements Observer {
    private String name;

    public StockDisplay(String name) {
        this.name = name;
    }

    @Override
    @SuppressWarnings("unchecked")
    public void update(String event, Object data) {
        if ("STOCK_UPDATE".equals(event)) {
            Map<String, Object> stockData = (Map<String, Object>) data;
            String symbol = (String) stockData.get("symbol");
            Double newPrice = (Double) stockData.get("newPrice");

            System.out.printf("[%s] %s: $%.2f%n", name, symbol, newPrice);
        }
    }
}

// Usage
StockMarket market = new StockMarket();

Observer mobileDisplay = new StockDisplay("Mobile App");
Observer webDisplay = new StockDisplay("Web Dashboard");

market.attach(mobileDisplay);
market.attach(webDisplay);

market.setStockPrice("AAPL", 145.0);
market.setStockPrice("GOOGL", 2800.0);
```

### Command Pattern

The Command pattern encapsulates a request as an object, letting you parameterize clients with different requests, queue or log requests, and support undoable operations.

#### When to Use

- When you want to parameterize objects with an action
- When you want to queue, specify, or execute requests at different times
- When you need to support undo

#### Implementation

```java
// Command interface
public interface Command {
    void execute();
    void undo();
    String getDescription();
}

// Receiver
public class TextEditor {
    private StringBuilder content = new StringBuilder();

    public void insertText(int position, String text) {
        content.insert(position, text);
    }

    public void deleteText(int start, int length) {
        content.delete(start, start + length);
    }

    public String getText() {
        return content.toString();
    }
}

// Concrete commands
public class InsertTextCommand implements Command {
    private TextEditor editor;
    private String text;
    private int position;

    public InsertTextCommand(TextEditor editor, int position, String text) {
        this.editor = editor;
        this.position = position;
        this.text = text;
    }

    @Override
    public void execute() {
        editor.insertText(position, text);
    }

    @Override
    public void undo() {
        editor.deleteText(position, text.length());
    }

    @Override
    public String getDescription() {
        return "Insert '" + text + "' at position " + position;
    }
}

// Invoker with undo support
public class TextEditorInvoker {
    private Deque<Command> undoStack = new ArrayDeque<>();

    public void executeCommand(Command command) {
        command.execute();
        undoStack.push(command);
        System.out.println("Executed: " + command.getDescription());
    }

    public void undo() {
        if (!undoStack.isEmpty()) {
            Command command = undoStack.pop();
            command.undo();
            System.out.println("Undone: " + command.getDescription());
        }
    }
}

// Usage
TextEditor editor = new TextEditor();
TextEditorInvoker invoker = new TextEditorInvoker();

invoker.executeCommand(new InsertTextCommand(editor, 0, "Hello"));
System.out.println("Content: " + editor.getText()); // "Hello"

invoker.executeCommand(new InsertTextCommand(editor, 5, " World"));
System.out.println("Content: " + editor.getText()); // "Hello World"

invoker.undo();
System.out.println("Content: " + editor.getText()); // "Hello"
```

### Template Method Pattern

The Template Method pattern defines the skeleton of an algorithm in a method, deferring some steps to subclasses.

#### When to Use

- When you have multiple classes with similar algorithms but different implementations
- When you want to control the points where subclasses can extend the algorithm
- When you want to avoid code duplication

#### Implementation

```java
// Abstract class with template method
public abstract class DataProcessor {

    // Template method - defines the algorithm skeleton
    public final void process() {
        readData();
        if (validateData()) {
            transformData();
            saveData();
        }
        cleanup();
    }

    // Abstract methods - must be implemented by subclasses
    protected abstract void readData();
    protected abstract void transformData();

    // Hook methods - can be overridden by subclasses
    protected boolean validateData() {
        System.out.println("Performing default validation...");
        return true;
    }

    // Concrete methods - common implementation
    private void saveData() {
        System.out.println("Saving data to database...");
    }

    private void cleanup() {
        System.out.println("Cleaning up resources...\n");
    }
}

// Concrete implementations
public class CSVDataProcessor extends DataProcessor {
    @Override
    protected void readData() {
        System.out.println("Reading data from CSV file...");
    }

    @Override
    protected void transformData() {
        System.out.println("Transforming CSV data...");
    }
}

public class XMLDataProcessor extends DataProcessor {
    @Override
    protected void readData() {
        System.out.println("Reading data from XML file...");
    }

    @Override
    protected void transformData() {
        System.out.println("Parsing and transforming XML data...");
    }
}

// Usage
DataProcessor csvProcessor = new CSVDataProcessor();
csvProcessor.process();

DataProcessor xmlProcessor = new XMLDataProcessor();
xmlProcessor.process();
```

### State Pattern

The State pattern allows an object to alter its behavior when its internal state changes.

#### When to Use

- When an object's behavior depends on its state
- When you have large conditional statements that depend on the object's state
- When you want state-specific behavior to be defined independently

#### Implementation

```java
// State interface
public interface OrderState {
    void next(Order order);
    void previous(Order order);
    void printStatus();
}

// Concrete states
public class PendingState implements OrderState {
    @Override
    public void next(Order order) {
        order.setState(new ProcessingState());
    }

    @Override
    public void previous(Order order) {
        System.out.println("Order is in the initial state");
    }

    @Override
    public void printStatus() {
        System.out.println("Order is PENDING");
    }
}

public class ProcessingState implements OrderState {
    @Override
    public void next(Order order) {
        order.setState(new ShippedState());
    }

    @Override
    public void previous(Order order) {
        order.setState(new PendingState());
    }

    @Override
    public void printStatus() {
        System.out.println("Order is PROCESSING");
    }
}

public class ShippedState implements OrderState {
    @Override
    public void next(Order order) {
        order.setState(new DeliveredState());
    }

    @Override
    public void previous(Order order) {
        System.out.println("Cannot go back - order has been shipped");
    }

    @Override
    public void printStatus() {
        System.out.println("Order is SHIPPED");
    }
}

public class DeliveredState implements OrderState {
    @Override
    public void next(Order order) {
        System.out.println("Order has been delivered - final state");
    }

    @Override
    public void previous(Order order) {
        System.out.println("Cannot go back - order has been delivered");
    }

    @Override
    public void printStatus() {
        System.out.println("Order is DELIVERED");
    }
}

// Context
public class Order {
    private OrderState state;

    public Order() {
        this.state = new PendingState();
    }

    public void setState(OrderState state) {
        this.state = state;
    }

    public void nextState() {
        state.next(this);
    }

    public void previousState() {
        state.previous(this);
    }

    public void printStatus() {
        state.printStatus();
    }
}

// Usage
Order order = new Order();
order.printStatus();    // PENDING
order.nextState();
order.printStatus();    // PROCESSING
order.nextState();
order.printStatus();    // SHIPPED
order.nextState();
order.printStatus();    // DELIVERED
```

### Chain of Responsibility Pattern

The Chain of Responsibility pattern passes requests along a chain of handlers. Each handler decides either to process the request or to pass it to the next handler.

#### When to Use

- When you want to decouple senders and receivers of a request
- When multiple objects may handle a request
- When you want to issue a request without specifying the receiver explicitly

#### Implementation

```java
// Handler interface
public abstract class SupportHandler {
    protected SupportHandler nextHandler;
    protected String handlerName;

    public SupportHandler(String handlerName) {
        this.handlerName = handlerName;
    }

    public void setNextHandler(SupportHandler nextHandler) {
        this.nextHandler = nextHandler;
    }

    public void handleRequest(SupportTicket ticket) {
        if (canHandle(ticket)) {
            processRequest(ticket);
        } else if (nextHandler != null) {
            System.out.println(handlerName + " passing to next handler...");
            nextHandler.handleRequest(ticket);
        } else {
            System.out.println("No handler available for: " + ticket.getIssue());
        }
    }

    protected abstract boolean canHandle(SupportTicket ticket);
    protected abstract void processRequest(SupportTicket ticket);
}

// Concrete handlers
public class Level1Support extends SupportHandler {
    public Level1Support() {
        super("Level 1 Support");
    }

    @Override
    protected boolean canHandle(SupportTicket ticket) {
        return ticket.getPriority() == SupportTicket.Priority.LOW;
    }

    @Override
    protected void processRequest(SupportTicket ticket) {
        System.out.println(handlerName + " handling: " + ticket.getIssue());
    }
}

public class Level2Support extends SupportHandler {
    public Level2Support() {
        super("Level 2 Support");
    }

    @Override
    protected boolean canHandle(SupportTicket ticket) {
        return ticket.getPriority() == SupportTicket.Priority.MEDIUM;
    }

    @Override
    protected void processRequest(SupportTicket ticket) {
        System.out.println(handlerName + " handling: " + ticket.getIssue());
    }
}

public class Level3Support extends SupportHandler {
    public Level3Support() {
        super("Level 3 Support");
    }

    @Override
    protected boolean canHandle(SupportTicket ticket) {
        return ticket.getPriority() == SupportTicket.Priority.HIGH;
    }

    @Override
    protected void processRequest(SupportTicket ticket) {
        System.out.println(handlerName + " handling: " + ticket.getIssue());
    }
}

// Build the chain
SupportHandler level1 = new Level1Support();
SupportHandler level2 = new Level2Support();
SupportHandler level3 = new Level3Support();

level1.setNextHandler(level2);
level2.setNextHandler(level3);

// Usage
SupportTicket ticket = new SupportTicket("System crash", SupportTicket.Priority.HIGH);
level1.handleRequest(ticket);
```

## Pattern Selection Guide

### Choosing the Right Pattern

| Problem | Recommended Pattern |
|---------|---------------------|
| Need exactly one instance | Singleton |
| Create objects without specifying exact class | Factory Method |
| Create families of related objects | Abstract Factory |
| Construct complex objects step by step | Builder |
| Clone existing objects | Prototype |
| Convert interface to expected interface | Adapter |
| Add responsibilities dynamically | Decorator |
| Simplify complex subsystem | Facade |
| Control access to objects | Proxy |
| Represent part-whole hierarchies | Composite |
| Switch algorithms at runtime | Strategy |
| Notify multiple objects of state changes | Observer |
| Encapsulate requests as objects | Command |
| Define algorithm skeleton | Template Method |
| Change behavior based on state | State |
| Chain request handlers | Chain of Responsibility |

## Best Practices

### When to Use Patterns

1. **Do Not Force Patterns**: Only use patterns when they solve a real problem
2. **Start Simple**: Begin with the simplest solution; refactor to patterns when needed
3. **Understand the Problem**: Make sure you understand why a pattern is appropriate
4. **Consider Maintenance**: Patterns should make code easier to maintain, not harder

### Common Mistakes to Avoid

1. **Over-Engineering**: Using patterns where simple code would suffice
2. **Pattern Obsession**: Trying to apply patterns everywhere
3. **Ignoring SOLID Principles**: Patterns work best with good OOP fundamentals
4. **Misusing Singleton**: Using Singleton for global state instead of proper dependency injection
5. **Premature Abstraction**: Creating factories for classes that do not need them

### Testing Considerations

```java
// Dependency injection makes patterns more testable
public class OrderService {
    private final PaymentStrategy paymentStrategy;
    private final NotificationService notificationService;

    // Constructor injection - easy to mock
    public OrderService(PaymentStrategy paymentStrategy,
                       NotificationService notificationService) {
        this.paymentStrategy = paymentStrategy;
        this.notificationService = notificationService;
    }
}

// Test with mocks
@Test
void testOrderProcessing() {
    PaymentStrategy mockPayment = mock(PaymentStrategy.class);
    NotificationService mockNotification = mock(NotificationService.class);

    when(mockPayment.pay(anyDouble())).thenReturn(true);

    OrderService service = new OrderService(mockPayment, mockNotification);
    // ... test service methods
}
```

## Summary

Design patterns are powerful tools that help solve common software design problems. Key takeaways:

1. **Creational Patterns** (Singleton, Factory, Builder, Prototype) handle object creation
2. **Structural Patterns** (Adapter, Decorator, Facade, Proxy, Composite) handle object composition
3. **Behavioral Patterns** (Strategy, Observer, Command, State, Template Method, Chain of Responsibility) handle object interaction

Remember:
- Patterns are guidelines, not strict rules
- Apply patterns when they genuinely solve a problem
- Master SOLID principles first; patterns build on them
- Consider readability, maintainability, and performance
- Practice implementing patterns to understand their nuances

The best way to learn design patterns is to recognize opportunities to apply them in real projects. Start with the most commonly used patterns (Singleton, Factory, Strategy, Observer) and gradually expand your toolkit as you encounter new problems that patterns can solve.
