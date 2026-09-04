---
title: Java 设计模式
description: 学习 Java 常用设计模式，包括创建型、结构型和行为型模式
track: architecture
section: design-patterns
difficulty: intermediate
tags:
  - Java
  - 设计模式
  - 架构
  - OOP
status: imported
origin: old/src/content/docs/java/design-patterns.zh.md
divergence: 0.095
issues: []
legacy:
  category: Java
  subcategory: 架构
  order: 24
  lastUpdated: 2026-01-07
---

设计模式（Design Patterns）是软件开发中经过验证的、可重用的解决方案，用于解决常见的设计问题。它们是前人智慧的结晶，能够帮助我们编写更加灵活、可维护和可扩展的代码。

## 设计模式概述

### 什么是设计模式

设计模式不是具体的代码，而是解决特定问题的通用方案。它们描述了在特定场景下，类和对象如何交互以及如何分配职责。

### 设计模式的分类

根据 GoF（Gang of Four）的经典分类，设计模式分为三大类：

| 类型 | 描述 | 包含模式 |
|------|------|----------|
| **创建型模式** | 关注对象的创建机制 | 单例、工厂、抽象工厂、建造者、原型 |
| **结构型模式** | 关注类和对象的组合 | 适配器、装饰器、代理、外观、桥接、组合、享元 |
| **行为型模式** | 关注对象之间的通信 | 观察者、策略、模板方法、命令、迭代器、状态、职责链、中介者、备忘录、访问者 |

### 设计模式的六大原则

在学习具体模式之前，先了解设计模式遵循的基本原则：

```java
// 1. 单一职责原则（SRP）：一个类只负责一项职责
public class UserService {
    // 只处理用户相关的业务逻辑
}

public class EmailService {
    // 只处理邮件发送相关的逻辑
}

// 2. 开闭原则（OCP）：对扩展开放，对修改关闭
public interface Shape {
    double calculateArea();
}

public class Circle implements Shape {
    private double radius;

    @Override
    public double calculateArea() {
        return Math.PI * radius * radius;
    }
}

// 3. 里氏替换原则（LSP）：子类可以替换父类
// 4. 接口隔离原则（ISP）：使用多个专门的接口
// 5. 依赖倒置原则（DIP）：依赖于抽象而非具体实现
// 6. 迪米特法则（LoD）：最少知识原则
```

---

## 创建型模式

创建型模式关注对象的创建过程，将对象的创建与使用分离，使系统更加灵活。

### 单例模式（Singleton）

单例模式确保一个类只有一个实例，并提供一个全局访问点。

#### 应用场景

- 数据库连接池
- 线程池
- 配置管理器
- 日志记录器

#### 饿汉式单例

```java
/**
 * 饿汉式单例 - 类加载时就创建实例
 * 优点：线程安全，实现简单
 * 缺点：可能造成资源浪费（如果实例从未使用）
 */
public class EagerSingleton {
    // 类加载时就创建实例
    private static final EagerSingleton INSTANCE = new EagerSingleton();

    // 私有构造方法，防止外部实例化
    private EagerSingleton() {
        // 防止反射攻击
        if (INSTANCE != null) {
            throw new IllegalStateException("实例已存在！");
        }
    }

    // 提供全局访问点
    public static EagerSingleton getInstance() {
        return INSTANCE;
    }

    public void doSomething() {
        System.out.println("执行业务逻辑");
    }
}
```

#### 懒汉式单例（双重检查锁定）

```java
/**
 * 懒汉式单例 - 延迟加载，使用时才创建
 * 双重检查锁定（DCL）保证线程安全和性能
 */
public class LazySingleton {
    // volatile 防止指令重排序
    private static volatile LazySingleton instance;

    private LazySingleton() {
        if (instance != null) {
            throw new IllegalStateException("实例已存在！");
        }
    }

    public static LazySingleton getInstance() {
        // 第一次检查，避免不必要的同步
        if (instance == null) {
            synchronized (LazySingleton.class) {
                // 第二次检查，确保只创建一个实例
                if (instance == null) {
                    instance = new LazySingleton();
                }
            }
        }
        return instance;
    }
}
```

#### 静态内部类单例（推荐）

```java
/**
 * 静态内部类单例 - 延迟加载且线程安全
 * 利用 JVM 类加载机制保证线程安全
 */
public class StaticInnerSingleton {

    private StaticInnerSingleton() {
        if (SingletonHolder.INSTANCE != null) {
            throw new IllegalStateException("实例已存在！");
        }
    }

    // 静态内部类，只有在第一次使用时才会加载
    private static class SingletonHolder {
        private static final StaticInnerSingleton INSTANCE = new StaticInnerSingleton();
    }

    public static StaticInnerSingleton getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

#### 枚举单例（最佳实践）

```java
/**
 * 枚举单例 - 最简洁且最安全的实现
 * 自动防止反射攻击和序列化问题
 */
public enum EnumSingleton {
    INSTANCE;

    private String config;

    public void setConfig(String config) {
        this.config = config;
    }

    public String getConfig() {
        return config;
    }

    public void doSomething() {
        System.out.println("枚举单例执行业务逻辑");
    }
}

// 使用示例
class SingletonDemo {
    public static void main(String[] args) {
        EnumSingleton singleton = EnumSingleton.INSTANCE;
        singleton.setConfig("数据库配置");
        singleton.doSomething();
    }
}
```

---

### 工厂模式（Factory）

工厂模式将对象的创建委托给工厂类，客户端无需知道具体的创建细节。

#### 简单工厂模式

```java
/**
 * 产品接口
 */
public interface Product {
    void use();
}

/**
 * 具体产品 A
 */
public class ConcreteProductA implements Product {
    @Override
    public void use() {
        System.out.println("使用产品 A");
    }
}

/**
 * 具体产品 B
 */
public class ConcreteProductB implements Product {
    @Override
    public void use() {
        System.out.println("使用产品 B");
    }
}

/**
 * 简单工厂
 */
public class SimpleFactory {

    public static Product createProduct(String type) {
        return switch (type) {
            case "A" -> new ConcreteProductA();
            case "B" -> new ConcreteProductB();
            default -> throw new IllegalArgumentException("未知产品类型: " + type);
        };
    }
}

// 使用示例
class SimpleFactoryDemo {
    public static void main(String[] args) {
        Product productA = SimpleFactory.createProduct("A");
        productA.use(); // 输出：使用产品 A

        Product productB = SimpleFactory.createProduct("B");
        productB.use(); // 输出：使用产品 B
    }
}
```

#### 工厂方法模式

```java
/**
 * 日志记录器接口
 */
public interface Logger {
    void log(String message);
}

/**
 * 文件日志记录器
 */
public class FileLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[FILE] " + message);
    }
}

/**
 * 数据库日志记录器
 */
public class DatabaseLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[DATABASE] " + message);
    }
}

/**
 * 控制台日志记录器
 */
public class ConsoleLogger implements Logger {
    @Override
    public void log(String message) {
        System.out.println("[CONSOLE] " + message);
    }
}

/**
 * 抽象工厂
 */
public interface LoggerFactory {
    Logger createLogger();
}

/**
 * 文件日志工厂
 */
public class FileLoggerFactory implements LoggerFactory {
    @Override
    public Logger createLogger() {
        // 可以在这里添加初始化逻辑，如设置文件路径
        return new FileLogger();
    }
}

/**
 * 数据库日志工厂
 */
public class DatabaseLoggerFactory implements LoggerFactory {
    @Override
    public Logger createLogger() {
        // 可以在这里添加初始化逻辑，如建立数据库连接
        return new DatabaseLogger();
    }
}

/**
 * 控制台日志工厂
 */
public class ConsoleLoggerFactory implements LoggerFactory {
    @Override
    public Logger createLogger() {
        return new ConsoleLogger();
    }
}

// 使用示例
class FactoryMethodDemo {
    public static void main(String[] args) {
        // 根据需求选择不同的工厂
        LoggerFactory factory = new FileLoggerFactory();
        Logger logger = factory.createLogger();
        logger.log("这是一条日志消息");

        // 切换到数据库日志
        factory = new DatabaseLoggerFactory();
        logger = factory.createLogger();
        logger.log("保存到数据库的日志");
    }
}
```

#### 抽象工厂模式

```java
/**
 * 抽象产品：按钮
 */
public interface Button {
    void render();
    void onClick();
}

/**
 * 抽象产品：输入框
 */
public interface TextField {
    void render();
    String getValue();
}

/**
 * Windows 风格按钮
 */
public class WindowsButton implements Button {
    @Override
    public void render() {
        System.out.println("渲染 Windows 风格按钮");
    }

    @Override
    public void onClick() {
        System.out.println("Windows 按钮被点击");
    }
}

/**
 * Mac 风格按钮
 */
public class MacButton implements Button {
    @Override
    public void render() {
        System.out.println("渲染 Mac 风格按钮");
    }

    @Override
    public void onClick() {
        System.out.println("Mac 按钮被点击");
    }
}

/**
 * Windows 风格输入框
 */
public class WindowsTextField implements TextField {
    @Override
    public void render() {
        System.out.println("渲染 Windows 风格输入框");
    }

    @Override
    public String getValue() {
        return "Windows 输入值";
    }
}

/**
 * Mac 风格输入框
 */
public class MacTextField implements TextField {
    @Override
    public void render() {
        System.out.println("渲染 Mac 风格输入框");
    }

    @Override
    public String getValue() {
        return "Mac 输入值";
    }
}

/**
 * 抽象工厂：GUI 工厂
 */
public interface GUIFactory {
    Button createButton();
    TextField createTextField();
}

/**
 * Windows GUI 工厂
 */
public class WindowsGUIFactory implements GUIFactory {
    @Override
    public Button createButton() {
        return new WindowsButton();
    }

    @Override
    public TextField createTextField() {
        return new WindowsTextField();
    }
}

/**
 * Mac GUI 工厂
 */
public class MacGUIFactory implements GUIFactory {
    @Override
    public Button createButton() {
        return new MacButton();
    }

    @Override
    public TextField createTextField() {
        return new MacTextField();
    }
}

/**
 * 客户端代码
 */
public class Application {
    private Button button;
    private TextField textField;

    public Application(GUIFactory factory) {
        button = factory.createButton();
        textField = factory.createTextField();
    }

    public void render() {
        button.render();
        textField.render();
    }
}

// 使用示例
class AbstractFactoryDemo {
    public static void main(String[] args) {
        // 根据操作系统选择工厂
        String os = System.getProperty("os.name").toLowerCase();
        GUIFactory factory;

        if (os.contains("win")) {
            factory = new WindowsGUIFactory();
        } else {
            factory = new MacGUIFactory();
        }

        Application app = new Application(factory);
        app.render();
    }
}
```

---

### 建造者模式（Builder）

建造者模式将复杂对象的构建过程与表示分离，使同样的构建过程可以创建不同的表示。

#### 应用场景

- 创建具有多个可选参数的对象
- 构建复杂的不可变对象
- 链式调用创建对象

#### 经典建造者模式

```java
/**
 * 产品类：电脑
 */
public class Computer {
    private String cpu;
    private String memory;
    private String storage;
    private String gpu;
    private String monitor;

    // 私有构造方法，只能通过 Builder 创建
    private Computer() {}

    // Getter 方法
    public String getCpu() { return cpu; }
    public String getMemory() { return memory; }
    public String getStorage() { return storage; }
    public String getGpu() { return gpu; }
    public String getMonitor() { return monitor; }

    @Override
    public String toString() {
        return String.format("Computer[CPU=%s, Memory=%s, Storage=%s, GPU=%s, Monitor=%s]",
                cpu, memory, storage, gpu, monitor);
    }

    /**
     * 建造者接口
     */
    public interface Builder {
        Builder cpu(String cpu);
        Builder memory(String memory);
        Builder storage(String storage);
        Builder gpu(String gpu);
        Builder monitor(String monitor);
        Computer build();
    }

    /**
     * 具体建造者
     */
    public static class ConcreteBuilder implements Builder {
        private Computer computer = new Computer();

        @Override
        public Builder cpu(String cpu) {
            computer.cpu = cpu;
            return this;
        }

        @Override
        public Builder memory(String memory) {
            computer.memory = memory;
            return this;
        }

        @Override
        public Builder storage(String storage) {
            computer.storage = storage;
            return this;
        }

        @Override
        public Builder gpu(String gpu) {
            computer.gpu = gpu;
            return this;
        }

        @Override
        public Builder monitor(String monitor) {
            computer.monitor = monitor;
            return this;
        }

        @Override
        public Computer build() {
            return computer;
        }
    }

    // 获取建造者的静态方法
    public static Builder builder() {
        return new ConcreteBuilder();
    }
}

// 使用示例
class BuilderDemo {
    public static void main(String[] args) {
        // 使用建造者模式创建电脑
        Computer gamingPC = Computer.builder()
                .cpu("Intel i9-13900K")
                .memory("64GB DDR5")
                .storage("2TB NVMe SSD")
                .gpu("NVIDIA RTX 4090")
                .monitor("4K 144Hz")
                .build();

        System.out.println(gamingPC);

        // 创建办公电脑（只需要基本配置）
        Computer officePC = Computer.builder()
                .cpu("Intel i5-13400")
                .memory("16GB DDR4")
                .storage("512GB SSD")
                .build();

        System.out.println(officePC);
    }
}
```

#### 不可变对象的建造者

```java
/**
 * 不可变的用户类
 */
public final class User {
    private final String id;
    private final String name;
    private final String email;
    private final int age;
    private final String phone;
    private final String address;

    private User(Builder builder) {
        this.id = builder.id;
        this.name = builder.name;
        this.email = builder.email;
        this.age = builder.age;
        this.phone = builder.phone;
        this.address = builder.address;
    }

    // 只有 Getter，没有 Setter
    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public int getAge() { return age; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }

    public static Builder builder(String id, String name) {
        return new Builder(id, name);
    }

    /**
     * 静态内部建造者类
     */
    public static class Builder {
        // 必需参数
        private final String id;
        private final String name;

        // 可选参数，设置默认值
        private String email = "";
        private int age = 0;
        private String phone = "";
        private String address = "";

        public Builder(String id, String name) {
            this.id = id;
            this.name = name;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder age(int age) {
            if (age < 0 || age > 150) {
                throw new IllegalArgumentException("年龄必须在 0-150 之间");
            }
            this.age = age;
            return this;
        }

        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }

        public Builder address(String address) {
            this.address = address;
            return this;
        }

        public User build() {
            // 可以在这里添加验证逻辑
            return new User(this);
        }
    }

    @Override
    public String toString() {
        return String.format("User{id='%s', name='%s', email='%s', age=%d, phone='%s', address='%s'}",
                id, name, email, age, phone, address);
    }
}

// 使用示例
class ImmutableBuilderDemo {
    public static void main(String[] args) {
        User user = User.builder("001", "张三")
                .email("zhangsan@example.com")
                .age(25)
                .phone("13800138000")
                .address("北京市朝阳区")
                .build();

        System.out.println(user);
    }
}
```

---

## 结构型模式

结构型模式关注类和对象的组合，用于形成更大的结构。

### 适配器模式（Adapter）

适配器模式将一个类的接口转换成客户希望的另一个接口，使原本不兼容的类可以一起工作。

#### 应用场景

- 整合遗留系统
- 第三方库适配
- 接口转换

#### 类适配器（使用继承）

```java
/**
 * 目标接口：现代媒体播放器
 */
public interface MediaPlayer {
    void play(String audioType, String fileName);
}

/**
 * 被适配的类：旧的 MP3 播放器
 */
public class OldMp3Player {
    public void playMp3(String fileName) {
        System.out.println("播放 MP3 文件: " + fileName);
    }
}

/**
 * 类适配器：通过继承适配
 */
public class Mp3Adapter extends OldMp3Player implements MediaPlayer {
    @Override
    public void play(String audioType, String fileName) {
        if ("mp3".equalsIgnoreCase(audioType)) {
            playMp3(fileName);
        } else {
            System.out.println("不支持的格式: " + audioType);
        }
    }
}
```

#### 对象适配器（使用组合）

```java
/**
 * 高级媒体播放器接口
 */
public interface AdvancedMediaPlayer {
    void playVlc(String fileName);
    void playMp4(String fileName);
}

/**
 * VLC 播放器实现
 */
public class VlcPlayer implements AdvancedMediaPlayer {
    @Override
    public void playVlc(String fileName) {
        System.out.println("播放 VLC 文件: " + fileName);
    }

    @Override
    public void playMp4(String fileName) {
        // 不支持
    }
}

/**
 * MP4 播放器实现
 */
public class Mp4Player implements AdvancedMediaPlayer {
    @Override
    public void playVlc(String fileName) {
        // 不支持
    }

    @Override
    public void playMp4(String fileName) {
        System.out.println("播放 MP4 文件: " + fileName);
    }
}

/**
 * 对象适配器：通过组合适配
 */
public class MediaAdapter implements MediaPlayer {
    private AdvancedMediaPlayer advancedPlayer;

    public MediaAdapter(String audioType) {
        if ("vlc".equalsIgnoreCase(audioType)) {
            advancedPlayer = new VlcPlayer();
        } else if ("mp4".equalsIgnoreCase(audioType)) {
            advancedPlayer = new Mp4Player();
        }
    }

    @Override
    public void play(String audioType, String fileName) {
        if ("vlc".equalsIgnoreCase(audioType)) {
            advancedPlayer.playVlc(fileName);
        } else if ("mp4".equalsIgnoreCase(audioType)) {
            advancedPlayer.playMp4(fileName);
        }
    }
}

/**
 * 音频播放器：使用适配器
 */
public class AudioPlayer implements MediaPlayer {
    private MediaAdapter mediaAdapter;

    @Override
    public void play(String audioType, String fileName) {
        // 内置支持 MP3
        if ("mp3".equalsIgnoreCase(audioType)) {
            System.out.println("播放 MP3 文件: " + fileName);
        }
        // 使用适配器支持其他格式
        else if ("vlc".equalsIgnoreCase(audioType) || "mp4".equalsIgnoreCase(audioType)) {
            mediaAdapter = new MediaAdapter(audioType);
            mediaAdapter.play(audioType, fileName);
        } else {
            System.out.println("不支持的格式: " + audioType);
        }
    }
}

// 使用示例
class AdapterDemo {
    public static void main(String[] args) {
        AudioPlayer player = new AudioPlayer();

        player.play("mp3", "beyond_the_horizon.mp3");
        player.play("mp4", "alone.mp4");
        player.play("vlc", "far_far_away.vlc");
        player.play("avi", "mind_me.avi");
    }
}
```

---

### 装饰器模式（Decorator）

装饰器模式动态地给对象添加额外的职责，比继承更加灵活。

#### 应用场景

- Java I/O 流
- 动态添加功能
- 不修改原有代码的情况下扩展功能

#### 基本实现

```java
/**
 * 组件接口：咖啡
 */
public interface Coffee {
    String getDescription();
    double getCost();
}

/**
 * 具体组件：浓缩咖啡
 */
public class Espresso implements Coffee {
    @Override
    public String getDescription() {
        return "浓缩咖啡";
    }

    @Override
    public double getCost() {
        return 25.0;
    }
}

/**
 * 具体组件：美式咖啡
 */
public class Americano implements Coffee {
    @Override
    public String getDescription() {
        return "美式咖啡";
    }

    @Override
    public double getCost() {
        return 20.0;
    }
}

/**
 * 装饰器抽象类
 */
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

/**
 * 具体装饰器：加牛奶
 */
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + " + 牛奶";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 5.0;
    }
}

/**
 * 具体装饰器：加糖
 */
public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + " + 糖";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 2.0;
    }
}

/**
 * 具体装饰器：加奶油
 */
public class WhipDecorator extends CoffeeDecorator {
    public WhipDecorator(Coffee coffee) {
        super(coffee);
    }

    @Override
    public String getDescription() {
        return decoratedCoffee.getDescription() + " + 奶油";
    }

    @Override
    public double getCost() {
        return decoratedCoffee.getCost() + 8.0;
    }
}

// 使用示例
class DecoratorDemo {
    public static void main(String[] args) {
        // 基础浓缩咖啡
        Coffee coffee = new Espresso();
        System.out.println(coffee.getDescription() + " = " + coffee.getCost() + "元");

        // 加牛奶
        coffee = new MilkDecorator(coffee);
        System.out.println(coffee.getDescription() + " = " + coffee.getCost() + "元");

        // 再加糖
        coffee = new SugarDecorator(coffee);
        System.out.println(coffee.getDescription() + " = " + coffee.getCost() + "元");

        // 美式咖啡加奶油和牛奶
        Coffee americano = new WhipDecorator(new MilkDecorator(new Americano()));
        System.out.println(americano.getDescription() + " = " + americano.getCost() + "元");
    }
}
```

#### Java I/O 中的装饰器模式

```java
import java.io.*;

public class IODecoratorExample {
    public static void main(String[] args) {
        try {
            // Java I/O 使用装饰器模式
            // FileInputStream 是具体组件
            // BufferedInputStream 是装饰器
            // DataInputStream 也是装饰器

            InputStream in = new FileInputStream("data.txt");
            InputStream bufferedIn = new BufferedInputStream(in);
            DataInputStream dataIn = new DataInputStream(bufferedIn);

            // 或者链式调用
            DataInputStream chainedIn = new DataInputStream(
                new BufferedInputStream(
                    new FileInputStream("data.txt")
                )
            );

            // 读取数据
            // ...

            chainedIn.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

---

### 代理模式（Proxy）

代理模式为其他对象提供一种代理以控制对这个对象的访问。

#### 应用场景

- 远程代理（RMI）
- 虚拟代理（延迟加载）
- 保护代理（权限控制）
- 缓存代理

#### 静态代理

```java
/**
 * 服务接口
 */
public interface Image {
    void display();
}

/**
 * 真实对象：高分辨率图片
 */
public class HighResolutionImage implements Image {
    private String fileName;

    public HighResolutionImage(String fileName) {
        this.fileName = fileName;
        loadFromDisk();
    }

    private void loadFromDisk() {
        System.out.println("从磁盘加载高分辨率图片: " + fileName);
        // 模拟加载时间
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public void display() {
        System.out.println("显示图片: " + fileName);
    }
}

/**
 * 代理类：图片代理（延迟加载）
 */
public class ImageProxy implements Image {
    private String fileName;
    private HighResolutionImage realImage;

    public ImageProxy(String fileName) {
        this.fileName = fileName;
    }

    @Override
    public void display() {
        // 延迟加载：只有在真正需要时才加载图片
        if (realImage == null) {
            realImage = new HighResolutionImage(fileName);
        }
        realImage.display();
    }
}

// 使用示例
class StaticProxyDemo {
    public static void main(String[] args) {
        // 创建代理对象（此时不会加载图片）
        Image image1 = new ImageProxy("photo1.jpg");
        Image image2 = new ImageProxy("photo2.jpg");

        System.out.println("图片代理已创建");

        // 第一次显示时才加载
        System.out.println("\n第一次显示 image1:");
        image1.display();

        // 第二次显示时不需要再加载
        System.out.println("\n第二次显示 image1:");
        image1.display();

        // image2 还没有被加载
        System.out.println("\n显示 image2:");
        image2.display();
    }
}
```

#### 动态代理（JDK Proxy）

```java
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * 用户服务接口
 */
public interface UserService {
    void addUser(String name);
    void deleteUser(String name);
    String getUser(String name);
}

/**
 * 用户服务实现
 */
public class UserServiceImpl implements UserService {
    @Override
    public void addUser(String name) {
        System.out.println("添加用户: " + name);
    }

    @Override
    public void deleteUser(String name) {
        System.out.println("删除用户: " + name);
    }

    @Override
    public String getUser(String name) {
        System.out.println("获取用户: " + name);
        return "User: " + name;
    }
}

/**
 * 日志处理器
 */
public class LoggingHandler implements InvocationHandler {
    private Object target;

    public LoggingHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 前置处理：记录方法调用
        System.out.println("[LOG] 调用方法: " + method.getName());
        System.out.println("[LOG] 参数: " + java.util.Arrays.toString(args));
        long startTime = System.currentTimeMillis();

        // 调用真实对象的方法
        Object result = method.invoke(target, args);

        // 后置处理：记录执行时间
        long endTime = System.currentTimeMillis();
        System.out.println("[LOG] 返回值: " + result);
        System.out.println("[LOG] 执行时间: " + (endTime - startTime) + "ms");
        System.out.println();

        return result;
    }
}

/**
 * 代理工厂
 */
public class ProxyFactory {
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target) {
        return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new LoggingHandler(target)
        );
    }
}

// 使用示例
class DynamicProxyDemo {
    public static void main(String[] args) {
        // 创建真实对象
        UserService userService = new UserServiceImpl();

        // 创建代理对象
        UserService proxy = ProxyFactory.createProxy(userService);

        // 通过代理调用方法
        proxy.addUser("张三");
        proxy.getUser("李四");
        proxy.deleteUser("王五");
    }
}
```

#### CGLIB 代理

```java
import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;
import java.lang.reflect.Method;

/**
 * 没有接口的类
 */
public class OrderService {
    public void createOrder(String orderId) {
        System.out.println("创建订单: " + orderId);
    }

    public void cancelOrder(String orderId) {
        System.out.println("取消订单: " + orderId);
    }
}

/**
 * CGLIB 方法拦截器
 */
public class CglibMethodInterceptor implements MethodInterceptor {
    @Override
    public Object intercept(Object obj, Method method, Object[] args,
            MethodProxy proxy) throws Throwable {
        System.out.println("[CGLIB] 方法调用前: " + method.getName());

        // 调用父类的方法
        Object result = proxy.invokeSuper(obj, args);

        System.out.println("[CGLIB] 方法调用后: " + method.getName());
        return result;
    }
}

/**
 * CGLIB 代理工厂
 */
public class CglibProxyFactory {
    @SuppressWarnings("unchecked")
    public static <T> T createProxy(Class<T> clazz) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(clazz);
        enhancer.setCallback(new CglibMethodInterceptor());
        return (T) enhancer.create();
    }
}

// 使用示例
class CglibProxyDemo {
    public static void main(String[] args) {
        // 创建 CGLIB 代理
        OrderService proxy = CglibProxyFactory.createProxy(OrderService.class);

        proxy.createOrder("ORD-001");
        proxy.cancelOrder("ORD-001");
    }
}
```

---

## 行为型模式

行为型模式关注对象之间的通信和职责分配。

### 观察者模式（Observer）

观察者模式定义对象间的一对多依赖关系，当一个对象状态改变时，所有依赖它的对象都会收到通知。

#### 应用场景

- 事件处理系统
- GUI 事件监听
- 消息推送
- 发布/订阅系统

#### 自定义实现

```java
import java.util.ArrayList;
import java.util.List;

/**
 * 观察者接口
 */
public interface Observer {
    void update(String message);
}

/**
 * 主题接口
 */
public interface Subject {
    void attach(Observer observer);
    void detach(Observer observer);
    void notifyObservers();
}

/**
 * 具体主题：新闻发布者
 */
public class NewsPublisher implements Subject {
    private List<Observer> observers = new ArrayList<>();
    private String latestNews;

    @Override
    public void attach(Observer observer) {
        observers.add(observer);
    }

    @Override
    public void detach(Observer observer) {
        observers.remove(observer);
    }

    @Override
    public void notifyObservers() {
        for (Observer observer : observers) {
            observer.update(latestNews);
        }
    }

    public void publishNews(String news) {
        this.latestNews = news;
        System.out.println("发布新闻: " + news);
        notifyObservers();
    }
}

/**
 * 具体观察者：邮件订阅者
 */
public class EmailSubscriber implements Observer {
    private String name;

    public EmailSubscriber(String name) {
        this.name = name;
    }

    @Override
    public void update(String message) {
        System.out.println(name + " 收到邮件通知: " + message);
    }
}

/**
 * 具体观察者：APP 推送订阅者
 */
public class AppSubscriber implements Observer {
    private String name;

    public AppSubscriber(String name) {
        this.name = name;
    }

    @Override
    public void update(String message) {
        System.out.println(name + " 收到 APP 推送: " + message);
    }
}

/**
 * 具体观察者：短信订阅者
 */
public class SmsSubscriber implements Observer {
    private String phone;

    public SmsSubscriber(String phone) {
        this.phone = phone;
    }

    @Override
    public void update(String message) {
        System.out.println("短信发送到 " + phone + ": " + message);
    }
}

// 使用示例
class ObserverDemo {
    public static void main(String[] args) {
        // 创建发布者
        NewsPublisher publisher = new NewsPublisher();

        // 创建订阅者
        Observer emailSub1 = new EmailSubscriber("张三");
        Observer emailSub2 = new EmailSubscriber("李四");
        Observer appSub = new AppSubscriber("王五");
        Observer smsSub = new SmsSubscriber("13800138000");

        // 订阅
        publisher.attach(emailSub1);
        publisher.attach(emailSub2);
        publisher.attach(appSub);
        publisher.attach(smsSub);

        // 发布新闻
        System.out.println("=== 第一条新闻 ===");
        publisher.publishNews("Java 21 正式发布！");

        // 取消订阅
        publisher.detach(emailSub2);

        // 再次发布
        System.out.println("\n=== 第二条新闻 ===");
        publisher.publishNews("Spring Boot 4.0 即将发布！");
    }
}
```

#### 使用 Java 内置支持

```java
import java.beans.PropertyChangeListener;
import java.beans.PropertyChangeSupport;

/**
 * 使用 PropertyChangeSupport 实现观察者模式
 */
public class Stock {
    private String symbol;
    private double price;
    private PropertyChangeSupport support;

    public Stock(String symbol, double price) {
        this.symbol = symbol;
        this.price = price;
        this.support = new PropertyChangeSupport(this);
    }

    public void addPropertyChangeListener(PropertyChangeListener listener) {
        support.addPropertyChangeListener(listener);
    }

    public void removePropertyChangeListener(PropertyChangeListener listener) {
        support.removePropertyChangeListener(listener);
    }

    public String getSymbol() {
        return symbol;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double newPrice) {
        double oldPrice = this.price;
        this.price = newPrice;
        // 触发属性变更事件
        support.firePropertyChange("price", oldPrice, newPrice);
    }
}

// 使用示例
class PropertyChangeDemo {
    public static void main(String[] args) {
        Stock stock = new Stock("AAPL", 150.0);

        // 添加监听器
        stock.addPropertyChangeListener(evt -> {
            System.out.printf("股票 %s 价格变化: %.2f -> %.2f%n",
                    ((Stock) evt.getSource()).getSymbol(),
                    evt.getOldValue(),
                    evt.getNewValue());
        });

        // 修改价格
        stock.setPrice(155.0);
        stock.setPrice(160.5);
        stock.setPrice(158.0);
    }
}
```

---

### 策略模式（Strategy）

策略模式定义一系列算法，将它们封装起来，并使它们可以相互替换。

#### 应用场景

- 多种算法选择
- 支付方式选择
- 排序策略
- 验证规则

#### 基本实现

```java
/**
 * 策略接口：支付策略
 */
public interface PaymentStrategy {
    void pay(double amount);
    String getPaymentMethod();
}

/**
 * 具体策略：信用卡支付
 */
public class CreditCardPayment implements PaymentStrategy {
    private String cardNumber;
    private String cardHolder;

    public CreditCardPayment(String cardNumber, String cardHolder) {
        this.cardNumber = cardNumber;
        this.cardHolder = cardHolder;
    }

    @Override
    public void pay(double amount) {
        System.out.printf("使用信用卡支付 %.2f 元%n", amount);
        System.out.println("卡号: " + maskCardNumber(cardNumber));
        System.out.println("持卡人: " + cardHolder);
    }

    @Override
    public String getPaymentMethod() {
        return "信用卡";
    }

    private String maskCardNumber(String cardNumber) {
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }
}

/**
 * 具体策略：支付宝支付
 */
public class AlipayPayment implements PaymentStrategy {
    private String account;

    public AlipayPayment(String account) {
        this.account = account;
    }

    @Override
    public void pay(double amount) {
        System.out.printf("使用支付宝支付 %.2f 元%n", amount);
        System.out.println("账号: " + account);
    }

    @Override
    public String getPaymentMethod() {
        return "支付宝";
    }
}

/**
 * 具体策略：微信支付
 */
public class WeChatPayment implements PaymentStrategy {
    private String weChatId;

    public WeChatPayment(String weChatId) {
        this.weChatId = weChatId;
    }

    @Override
    public void pay(double amount) {
        System.out.printf("使用微信支付 %.2f 元%n", amount);
        System.out.println("微信号: " + weChatId);
    }

    @Override
    public String getPaymentMethod() {
        return "微信支付";
    }
}

/**
 * 上下文类：购物车
 */
public class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    private PaymentStrategy paymentStrategy;

    public void addItem(Item item) {
        items.add(item);
    }

    public void removeItem(Item item) {
        items.remove(item);
    }

    public double calculateTotal() {
        return items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
    }

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.paymentStrategy = strategy;
    }

    public void checkout() {
        if (paymentStrategy == null) {
            throw new IllegalStateException("请选择支付方式");
        }

        double total = calculateTotal();
        System.out.println("=== 结算 ===");
        System.out.println("商品列表:");
        for (Item item : items) {
            System.out.printf("  %s x%d = %.2f%n",
                    item.getName(), item.getQuantity(),
                    item.getPrice() * item.getQuantity());
        }
        System.out.printf("总计: %.2f 元%n", total);
        System.out.println("支付方式: " + paymentStrategy.getPaymentMethod());
        System.out.println();

        paymentStrategy.pay(total);
    }

    // 商品类
    public static class Item {
        private String name;
        private double price;
        private int quantity;

        public Item(String name, double price, int quantity) {
            this.name = name;
            this.price = price;
            this.quantity = quantity;
        }

        public String getName() { return name; }
        public double getPrice() { return price; }
        public int getQuantity() { return quantity; }
    }
}

// 使用示例
class StrategyDemo {
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new ShoppingCart.Item("Java 编程思想", 108.0, 1));
        cart.addItem(new ShoppingCart.Item("机械键盘", 299.0, 1));
        cart.addItem(new ShoppingCart.Item("鼠标垫", 29.0, 2));

        // 使用信用卡支付
        System.out.println(">>> 使用信用卡支付 <<<");
        cart.setPaymentStrategy(new CreditCardPayment("6222021234567890", "张三"));
        cart.checkout();

        System.out.println();

        // 使用支付宝支付
        System.out.println(">>> 使用支付宝支付 <<<");
        cart.setPaymentStrategy(new AlipayPayment("zhangsan@example.com"));
        cart.checkout();

        System.out.println();

        // 使用微信支付
        System.out.println(">>> 使用微信支付 <<<");
        cart.setPaymentStrategy(new WeChatPayment("wxid_zhangsan"));
        cart.checkout();
    }
}
```

#### 结合 Lambda 表达式

```java
import java.util.function.Function;

/**
 * 折扣策略（使用函数式接口）
 */
@FunctionalInterface
public interface DiscountStrategy {
    double applyDiscount(double price);
}

/**
 * 价格计算器
 */
public class PriceCalculator {

    // 预定义策略
    public static final DiscountStrategy NO_DISCOUNT = price -> price;
    public static final DiscountStrategy MEMBER_DISCOUNT = price -> price * 0.9;
    public static final DiscountStrategy VIP_DISCOUNT = price -> price * 0.8;
    public static final DiscountStrategy SUPER_VIP_DISCOUNT = price -> price * 0.7;

    private DiscountStrategy strategy;

    public PriceCalculator(DiscountStrategy strategy) {
        this.strategy = strategy;
    }

    public double calculate(double originalPrice) {
        return strategy.applyDiscount(originalPrice);
    }

    public void setStrategy(DiscountStrategy strategy) {
        this.strategy = strategy;
    }
}

// 使用示例
class LambdaStrategyDemo {
    public static void main(String[] args) {
        double originalPrice = 100.0;

        // 使用预定义策略
        PriceCalculator calculator = new PriceCalculator(PriceCalculator.NO_DISCOUNT);
        System.out.println("原价: " + calculator.calculate(originalPrice));

        calculator.setStrategy(PriceCalculator.MEMBER_DISCOUNT);
        System.out.println("会员价: " + calculator.calculate(originalPrice));

        calculator.setStrategy(PriceCalculator.VIP_DISCOUNT);
        System.out.println("VIP 价: " + calculator.calculate(originalPrice));

        // 使用 Lambda 自定义策略
        calculator.setStrategy(price -> price * 0.5);
        System.out.println("特价: " + calculator.calculate(originalPrice));

        // 满减策略
        calculator.setStrategy(price -> price > 50 ? price - 20 : price);
        System.out.println("满 50 减 20: " + calculator.calculate(originalPrice));
    }
}
```

---

### 模板方法模式（Template Method）

模板方法模式在父类中定义算法的骨架，将某些步骤延迟到子类中实现。

#### 应用场景

- 框架设计
- 算法骨架固定，细节可变
- 代码复用

#### 基本实现

```java
/**
 * 抽象类：饮料模板
 */
public abstract class Beverage {

    // 模板方法 - 定义算法骨架（final 防止子类覆盖）
    public final void prepareBeverage() {
        boilWater();
        brew();
        pourInCup();
        if (customerWantsCondiments()) {
            addCondiments();
        }
        System.out.println("饮料准备完成！\n");
    }

    // 具体方法 - 所有子类共用
    private void boilWater() {
        System.out.println("烧开水...");
    }

    private void pourInCup() {
        System.out.println("倒入杯中...");
    }

    // 抽象方法 - 子类必须实现
    protected abstract void brew();
    protected abstract void addCondiments();

    // 钩子方法 - 子类可选择覆盖
    protected boolean customerWantsCondiments() {
        return true;
    }
}

/**
 * 具体类：茶
 */
public class Tea extends Beverage {

    @Override
    protected void brew() {
        System.out.println("浸泡茶叶...");
    }

    @Override
    protected void addCondiments() {
        System.out.println("加柠檬...");
    }

    @Override
    protected boolean customerWantsCondiments() {
        // 可以根据用户输入决定
        return false; // 茶默认不加调料
    }
}

/**
 * 具体类：咖啡
 */
public class Coffee extends Beverage {

    @Override
    protected void brew() {
        System.out.println("冲泡咖啡...");
    }

    @Override
    protected void addCondiments() {
        System.out.println("加糖和牛奶...");
    }
}

/**
 * 具体类：热巧克力
 */
public class HotChocolate extends Beverage {

    @Override
    protected void brew() {
        System.out.println("冲泡可可粉...");
    }

    @Override
    protected void addCondiments() {
        System.out.println("加棉花糖和奶油...");
    }
}

// 使用示例
class TemplateMethodDemo {
    public static void main(String[] args) {
        System.out.println("=== 制作茶 ===");
        Beverage tea = new Tea();
        tea.prepareBeverage();

        System.out.println("=== 制作咖啡 ===");
        Beverage coffee = new Coffee();
        coffee.prepareBeverage();

        System.out.println("=== 制作热巧克力 ===");
        Beverage hotChocolate = new HotChocolate();
        hotChocolate.prepareBeverage();
    }
}
```

#### 数据处理框架示例

```java
import java.util.List;
import java.util.ArrayList;

/**
 * 抽象数据处理器
 */
public abstract class DataProcessor<T, R> {

    // 模板方法
    public final List<R> process() {
        System.out.println("开始数据处理...");

        // 1. 读取数据
        List<T> rawData = readData();
        System.out.println("读取到 " + rawData.size() + " 条数据");

        // 2. 验证数据
        List<T> validData = validateData(rawData);
        System.out.println("验证通过 " + validData.size() + " 条数据");

        // 3. 转换数据
        List<R> transformedData = new ArrayList<>();
        for (T data : validData) {
            R result = transformData(data);
            if (result != null) {
                transformedData.add(result);
            }
        }
        System.out.println("转换完成 " + transformedData.size() + " 条数据");

        // 4. 保存数据（可选）
        if (shouldSave()) {
            saveData(transformedData);
            System.out.println("数据已保存");
        }

        System.out.println("数据处理完成！");
        return transformedData;
    }

    // 抽象方法 - 子类必须实现
    protected abstract List<T> readData();
    protected abstract R transformData(T data);

    // 可选覆盖的方法
    protected List<T> validateData(List<T> data) {
        return data; // 默认不做验证
    }

    protected void saveData(List<R> data) {
        // 默认不保存
    }

    // 钩子方法
    protected boolean shouldSave() {
        return false;
    }
}

/**
 * CSV 数据处理器
 */
public class CsvProcessor extends DataProcessor<String, String[]> {

    private String filePath;

    public CsvProcessor(String filePath) {
        this.filePath = filePath;
    }

    @Override
    protected List<String> readData() {
        // 模拟读取 CSV 文件
        return List.of(
            "张三,25,北京",
            "李四,30,上海",
            "",  // 空行
            "王五,28,广州"
        );
    }

    @Override
    protected List<String> validateData(List<String> data) {
        // 过滤空行
        return data.stream()
                .filter(line -> !line.isEmpty())
                .toList();
    }

    @Override
    protected String[] transformData(String data) {
        return data.split(",");
    }

    @Override
    protected boolean shouldSave() {
        return true;
    }

    @Override
    protected void saveData(List<String[]> data) {
        System.out.println("保存到数据库...");
        for (String[] row : data) {
            System.out.println("  插入: " + String.join(", ", row));
        }
    }
}

// 使用示例
class DataProcessorDemo {
    public static void main(String[] args) {
        DataProcessor<String, String[]> processor = new CsvProcessor("data.csv");
        List<String[]> result = processor.process();

        System.out.println("\n处理结果:");
        for (String[] row : result) {
            System.out.println(java.util.Arrays.toString(row));
        }
    }
}
```

---

## 设计模式对比与选择

### 创建型模式对比

| 模式 | 目的 | 适用场景 |
|------|------|----------|
| **单例** | 确保只有一个实例 | 配置管理、连接池、日志 |
| **工厂方法** | 将实例化延迟到子类 | 产品族扩展、解耦创建 |
| **抽象工厂** | 创建相关对象家族 | 跨平台 UI、主题切换 |
| **建造者** | 分步构建复杂对象 | 多参数对象、不可变对象 |

### 结构型模式对比

| 模式 | 目的 | 适用场景 |
|------|------|----------|
| **适配器** | 接口转换 | 遗留系统整合、第三方库 |
| **装饰器** | 动态添加职责 | I/O 流、动态功能扩展 |
| **代理** | 控制访问 | 延迟加载、权限控制、AOP |

### 行为型模式对比

| 模式 | 目的 | 适用场景 |
|------|------|----------|
| **观察者** | 一对多通知 | 事件系统、消息推送 |
| **策略** | 算法可替换 | 支付方式、排序算法 |
| **模板方法** | 定义算法骨架 | 框架设计、流程固定 |

---

## 设计模式最佳实践

### 选择合适的模式

```java
// 问题：需要全局唯一的配置管理
// 解决：使用单例模式
public enum AppConfig {
    INSTANCE;
    // ...
}

// 问题：需要根据类型创建不同的解析器
// 解决：使用工厂模式
Parser parser = ParserFactory.create(fileType);

// 问题：需要动态添加日志、缓存等功能
// 解决：使用装饰器模式
Service service = new CacheDecorator(new LoggingDecorator(new RealService()));

// 问题：需要根据用户级别使用不同的折扣算法
// 解决：使用策略模式
DiscountStrategy strategy = getStrategyByUserLevel(user);
```

### 避免过度设计

```java
// 反例：简单场景使用复杂模式
// 只有一种支付方式时不需要策略模式
public void pay(double amount) {
    // 直接实现即可
    alipay.pay(amount);
}

// 正例：当真正需要扩展时再引入模式
public void pay(double amount, PaymentStrategy strategy) {
    strategy.pay(amount);
}
```

### 组合使用模式

```java
/**
 * 组合使用单例 + 工厂 + 策略模式
 */
public class PaymentServiceFactory {
    private static final PaymentServiceFactory INSTANCE = new PaymentServiceFactory();
    private Map<String, PaymentStrategy> strategies = new HashMap<>();

    private PaymentServiceFactory() {
        strategies.put("alipay", new AlipayPayment());
        strategies.put("wechat", new WeChatPayment());
        strategies.put("credit", new CreditCardPayment());
    }

    public static PaymentServiceFactory getInstance() {
        return INSTANCE;
    }

    public PaymentStrategy getStrategy(String type) {
        PaymentStrategy strategy = strategies.get(type);
        if (strategy == null) {
            throw new IllegalArgumentException("未知支付类型: " + type);
        }
        return strategy;
    }
}
```

---

## 总结

设计模式是软件开发的宝贵经验总结，掌握它们可以帮助我们：

1. **提高代码质量**：使代码更加灵活、可维护和可扩展
2. **促进团队沟通**：提供通用的术语和解决方案
3. **避免重复造轮子**：利用已验证的解决方案

### 学习建议

1. **理解原理**：不仅要知道怎么用，更要理解为什么这样设计
2. **结合实践**：在实际项目中识别和应用设计模式
3. **适度使用**：根据实际需求选择模式，避免过度设计
4. **持续学习**：设计模式只是开始，还需要学习架构模式和领域驱动设计

### 推荐阅读

- 《设计模式：可复用面向对象软件的基础》- GoF
- 《Head First 设计模式》
- 《Effective Java》中的设计模式相关章节
