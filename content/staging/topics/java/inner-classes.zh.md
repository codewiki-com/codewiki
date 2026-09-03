---
title: Java 内部类
description: 深入理解 Java 内部类：成员内部类、静态嵌套类、局部类与匿名类的原理与实践
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - 内部类
  - 嵌套类
  - 匿名类
  - 面向对象
status: imported
origin: old/src/content/docs/java/inner-classes.zh.md
divergence: 0.188
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: 面向对象
  order: 7
  lastUpdated: 2026-01-07
---

内部类（Inner Class）是 Java 语言中一个强大而灵活的特性，它允许在一个类的内部定义另一个类。内部类不仅提供了更好的封装机制，还能访问外部类的私有成员，是实现回调、事件处理和设计模式的重要工具。本文将全面深入地探讨 Java 内部类的各种类型及其应用场景。

## 概念解释

### 什么是内部类

内部类是定义在另一个类内部的类。与普通的顶层类（Top-level Class）不同，内部类是外部类的一个成员，可以访问外部类的所有成员，包括私有成员。

Java 中的内部类可以分为四种类型：

1. **成员内部类（Member Inner Class）**：定义在类内部，方法外部的非静态类
2. **静态嵌套类（Static Nested Class）**：使用 static 修饰的内部类
3. **局部类（Local Class）**：定义在方法或代码块内部的类
4. **匿名类（Anonymous Class）**：没有名字的内部类，通常用于一次性使用

```java
public class OuterClass {
    // 成员内部类
    class MemberInnerClass { }

    // 静态嵌套类
    static class StaticNestedClass { }

    public void method() {
        // 局部类
        class LocalClass { }

        // 匿名类
        Runnable runnable = new Runnable() {
            @Override
            public void run() { }
        };
    }
}
```

### 内部类的历史背景

内部类是 Java 1.1（1997年）引入的特性，主要目的是：

1. **支持 GUI 事件处理**：在 AWT/Swing 时代，事件监听器需要频繁创建小型类
2. **增强封装性**：将仅在特定上下文中使用的类隐藏起来
3. **提供闭包的替代方案**：在 Lambda 表达式出现之前，匿名类是实现类似闭包功能的主要方式

### 内部类解决的问题

1. **逻辑分组**：将只在一个地方使用的类放在使用它的类内部
2. **增强封装**：隐藏实现细节，只对外部类可见
3. **访问外部类成员**：内部类可以直接访问外部类的私有成员
4. **代码可读性**：将相关代码放在一起，提高可读性

## 核心原理

### 编译机制

内部类在编译时会生成独立的 `.class` 文件。命名规则如下：

- 成员内部类：`OuterClass$InnerClass.class`
- 静态嵌套类：`OuterClass$StaticNestedClass.class`
- 局部类：`OuterClass$1LocalClass.class`（数字表示定义顺序）
- 匿名类：`OuterClass$1.class`（纯数字编号）

```java
// 编译后生成的文件：
// OuterClass.class
// OuterClass$MemberInner.class
// OuterClass$StaticNested.class
// OuterClass$1LocalClass.class
// OuterClass$1.class (匿名类)

public class OuterClass {
    class MemberInner { }
    static class StaticNested { }

    void method() {
        class LocalClass { }
        new Runnable() {
            public void run() { }
        };
    }
}
```

### 外部类引用

非静态内部类会隐式持有外部类实例的引用。编译器会自动为内部类添加一个指向外部类的字段：

```java
// 源代码
public class Outer {
    private int value = 10;

    class Inner {
        public void printValue() {
            System.out.println(value);
        }
    }
}

// 编译后的内部类（反编译示意）
class Outer$Inner {
    final Outer this$0;  // 编译器自动添加的外部类引用

    Outer$Inner(Outer outer) {
        this.this$0 = outer;
    }

    public void printValue() {
        System.out.println(this$0.value);
    }
}
```

### 访问控制

内部类可以使用所有的访问修饰符：

```java
public class Outer {
    // public 内部类：任何地方都可以访问
    public class PublicInner { }

    // protected 内部类：同包和子类可以访问
    protected class ProtectedInner { }

    // 默认（包级私有）内部类：同包可以访问
    class PackageInner { }

    // private 内部类：只有外部类可以访问
    private class PrivateInner { }
}
```

### 变量捕获机制

局部类和匿名类可以捕获外部作用域中的局部变量，但这些变量必须是 **effectively final**（实际上不可变）的：

```java
public void method() {
    int count = 0;
    // count++;  // 如果取消注释，下面的匿名类将编译错误

    Runnable r = new Runnable() {
        @Override
        public void run() {
            // count++;  // 错误：不能修改捕获的变量
            System.out.println(count);  // 可以读取
        }
    };
}
```

这个限制的原因是：局部变量存储在栈上，方法执行完毕后会被销毁，而内部类可能在方法返回后继续存在。编译器实际上是将变量的值复制到内部类中。

## 核心要点

### 成员内部类

成员内部类是最常见的内部类形式，它作为外部类的成员存在。

**特点**：
- 可以访问外部类的所有成员（包括私有成员）
- 持有外部类实例的隐式引用
- 不能定义静态成员（Java 16+ 允许定义静态常量）
- 可以使用任何访问修饰符

```java
public class LinkedList<E> {
    private Node<E> head;
    private int size;

    // 成员内部类：Node 是 LinkedList 的实现细节
    private class Node<E> {
        E data;
        Node<E> next;

        Node(E data) {
            this.data = data;
        }
    }

    public void add(E element) {
        Node<E> newNode = new Node<>(element);
        if (head == null) {
            head = newNode;
        } else {
            Node<E> current = head;
            while (current.next != null) {
                current = current.next;
            }
            current.next = newNode;
        }
        size++;  // 可以访问外部类的私有成员
    }

    public int size() {
        return size;
    }
}
```

**创建方式**：

```java
public class Outer {
    class Inner {
        public void greet() {
            System.out.println("Hello from Inner!");
        }
    }

    public static void main(String[] args) {
        // 必须先创建外部类实例
        Outer outer = new Outer();

        // 方式1：通过外部类实例创建
        Outer.Inner inner1 = outer.new Inner();

        // 方式2：简化语法（在外部类内部）
        Inner inner2 = new Inner();  // 在 Outer 的实例方法中

        inner1.greet();
    }
}
```

### 静态嵌套类

静态嵌套类使用 static 修饰，它不持有外部类的引用。

**特点**：
- 不需要外部类实例即可创建
- 只能访问外部类的静态成员
- 可以定义静态成员和非静态成员
- 本质上是一个普通的顶层类，只是在另一个类内部定义

```java
public class Calculator {
    private static int precision = 2;

    // 静态嵌套类：用于封装计算结果
    public static class Result {
        private double value;
        private boolean success;
        private String message;

        public Result(double value, boolean success, String message) {
            this.value = value;
            this.success = success;
            this.message = message;
        }

        public double getValue() {
            return Math.round(value * Math.pow(10, precision))
                   / Math.pow(10, precision);  // 可以访问外部类的静态成员
        }

        public boolean isSuccess() {
            return success;
        }

        public String getMessage() {
            return message;
        }
    }

    public static Result divide(double a, double b) {
        if (b == 0) {
            return new Result(0, false, "除数不能为零");
        }
        return new Result(a / b, true, "计算成功");
    }

    public static void main(String[] args) {
        // 创建静态嵌套类实例：不需要外部类实例
        Calculator.Result result = Calculator.divide(10, 3);
        System.out.println("Result: " + result.getValue());  // 3.33
    }
}
```

**成员内部类 vs 静态嵌套类**：

| 特性 | 成员内部类 | 静态嵌套类 |
|------|-----------|-----------|
| static 修饰符 | 无 | 有 |
| 外部类引用 | 隐式持有 | 无 |
| 访问外部类成员 | 所有成员 | 仅静态成员 |
| 创建方式 | 需要外部类实例 | 不需要外部类实例 |
| 可定义静态成员 | 否（Java 16 之前） | 是 |

### 局部类

局部类是定义在方法或代码块内部的类。

**特点**：
- 作用域仅限于定义它的方法或代码块
- 可以访问外部类的所有成员
- 可以访问方法中 effectively final 的局部变量
- 不能使用访问修饰符（默认为包级私有）
- 不能定义静态成员

```java
public class MessageProcessor {
    private String prefix = "[System]";

    public void processMessages(List<String> messages) {
        final String suffix = " - Processed";  // effectively final

        // 局部类：只在这个方法内使用
        class MessageFormatter {
            private String timestamp;

            MessageFormatter() {
                this.timestamp = LocalDateTime.now().toString();
            }

            String format(String message) {
                // 可以访问外部类成员
                // 可以访问方法的 effectively final 变量
                return prefix + " " + message + suffix + " at " + timestamp;
            }
        }

        MessageFormatter formatter = new MessageFormatter();
        for (String message : messages) {
            System.out.println(formatter.format(message));
        }
    }
}
```

### 匿名类

匿名类是没有名字的内部类，通常用于实现接口或继承类的一次性使用场景。

**特点**：
- 没有类名，定义和实例化同时进行
- 可以实现一个接口或继承一个类（不能同时）
- 不能定义构造函数（可以使用实例初始化块）
- 常用于事件处理、回调和简单的接口实现

```java
public class EventHandlerDemo {

    interface ClickListener {
        void onClick(String buttonName);
    }

    public void setupButton(ClickListener listener) {
        // 模拟按钮点击
        listener.onClick("Submit");
    }

    public void demo() {
        // 匿名类实现接口
        setupButton(new ClickListener() {
            @Override
            public void onClick(String buttonName) {
                System.out.println("Button clicked: " + buttonName);
            }
        });

        // 匿名类继承类
        Thread thread = new Thread() {
            @Override
            public void run() {
                System.out.println("Running in anonymous thread");
            }
        };
        thread.start();

        // 匿名类实现抽象类
        abstract class Greeting {
            abstract void greet();
            void sayBye() {
                System.out.println("Goodbye!");
            }
        }

        Greeting greeting = new Greeting() {
            @Override
            void greet() {
                System.out.println("Hello!");
            }
        };
        greeting.greet();
        greeting.sayBye();
    }
}
```

**匿名类的构造**：

```java
public class AnonymousConstruction {

    interface Calculator {
        int calculate(int a, int b);
    }

    public void demo() {
        final int factor = 10;

        // 匿名类使用实例初始化块代替构造函数
        Calculator calc = new Calculator() {
            private int multiplier;

            // 实例初始化块
            {
                multiplier = factor;
                System.out.println("Calculator initialized with factor: " + multiplier);
            }

            @Override
            public int calculate(int a, int b) {
                return (a + b) * multiplier;
            }
        };

        System.out.println(calc.calculate(3, 5));  // 80
    }
}
```

## 代码示例

### 示例1：迭代器模式

使用成员内部类实现迭代器是内部类的经典应用：

```java
public class CustomArrayList<E> implements Iterable<E> {
    private Object[] elements;
    private int size;
    private static final int DEFAULT_CAPACITY = 10;

    public CustomArrayList() {
        elements = new Object[DEFAULT_CAPACITY];
        size = 0;
    }

    public void add(E element) {
        ensureCapacity();
        elements[size++] = element;
    }

    @SuppressWarnings("unchecked")
    public E get(int index) {
        checkIndex(index);
        return (E) elements[index];
    }

    public int size() {
        return size;
    }

    private void ensureCapacity() {
        if (size == elements.length) {
            elements = Arrays.copyOf(elements, elements.length * 2);
        }
    }

    private void checkIndex(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }
    }

    // 成员内部类实现迭代器
    private class ArrayListIterator implements Iterator<E> {
        private int cursor = 0;      // 下一个要返回的元素索引
        private int lastRet = -1;    // 上一个返回的元素索引

        @Override
        public boolean hasNext() {
            return cursor < size;    // 可以访问外部类的私有成员 size
        }

        @Override
        @SuppressWarnings("unchecked")
        public E next() {
            if (!hasNext()) {
                throw new NoSuchElementException();
            }
            lastRet = cursor;
            return (E) elements[cursor++];  // 可以访问外部类的私有成员 elements
        }

        @Override
        public void remove() {
            if (lastRet < 0) {
                throw new IllegalStateException();
            }
            // 删除元素
            System.arraycopy(elements, lastRet + 1, elements, lastRet, size - lastRet - 1);
            size--;
            cursor = lastRet;
            lastRet = -1;
        }
    }

    @Override
    public Iterator<E> iterator() {
        return new ArrayListIterator();
    }

    // 使用示例
    public static void main(String[] args) {
        CustomArrayList<String> list = new CustomArrayList<>();
        list.add("Apple");
        list.add("Banana");
        list.add("Cherry");

        // 使用迭代器遍历
        for (String fruit : list) {
            System.out.println(fruit);
        }

        // 使用迭代器删除元素
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            String fruit = iterator.next();
            if (fruit.startsWith("B")) {
                iterator.remove();
            }
        }

        System.out.println("After removal:");
        for (String fruit : list) {
            System.out.println(fruit);
        }
    }
}
```

### 示例2：Builder 模式

使用静态嵌套类实现 Builder 模式：

```java
public class User {
    // 必需参数
    private final String username;
    private final String email;

    // 可选参数
    private final String firstName;
    private final String lastName;
    private final int age;
    private final String phone;
    private final String address;

    // 私有构造函数，只能通过 Builder 创建
    private User(Builder builder) {
        this.username = builder.username;
        this.email = builder.email;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.age = builder.age;
        this.phone = builder.phone;
        this.address = builder.address;
    }

    // Getter 方法
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public int getAge() { return age; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }

    @Override
    public String toString() {
        return "User{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", age=" + age +
                ", phone='" + phone + '\'' +
                ", address='" + address + '\'' +
                '}';
    }

    // 静态嵌套类 Builder
    public static class Builder {
        // 必需参数
        private final String username;
        private final String email;

        // 可选参数 - 带默认值
        private String firstName = "";
        private String lastName = "";
        private int age = 0;
        private String phone = "";
        private String address = "";

        // Builder 构造函数：设置必需参数
        public Builder(String username, String email) {
            this.username = username;
            this.email = email;
        }

        // 可选参数的设置方法，返回 this 以支持链式调用
        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder age(int age) {
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

        // 构建 User 对象
        public User build() {
            // 可以在这里添加验证逻辑
            if (username == null || username.isEmpty()) {
                throw new IllegalStateException("Username is required");
            }
            if (email == null || !email.contains("@")) {
                throw new IllegalStateException("Valid email is required");
            }
            return new User(this);
        }
    }

    // 使用示例
    public static void main(String[] args) {
        User user = new User.Builder("john_doe", "john@example.com")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .phone("123-456-7890")
                .address("123 Main St")
                .build();

        System.out.println(user);

        // 只设置必需参数
        User minimalUser = new User.Builder("jane_doe", "jane@example.com")
                .build();

        System.out.println(minimalUser);
    }
}
```

### 示例3：事件处理系统

使用匿名类和局部类实现事件处理：

```java
public class EventSystem {

    // 事件接口
    public interface Event {
        String getType();
        Object getData();
    }

    // 事件监听器接口
    public interface EventListener {
        void onEvent(Event event);
    }

    // 事件管理器
    public static class EventManager {
        private Map<String, List<EventListener>> listeners = new HashMap<>();

        public void subscribe(String eventType, EventListener listener) {
            listeners.computeIfAbsent(eventType, k -> new ArrayList<>()).add(listener);
        }

        public void unsubscribe(String eventType, EventListener listener) {
            List<EventListener> eventListeners = listeners.get(eventType);
            if (eventListeners != null) {
                eventListeners.remove(listener);
            }
        }

        public void publish(String eventType, Object data) {
            // 局部类实现 Event 接口
            class SimpleEvent implements Event {
                private final String type;
                private final Object eventData;
                private final long timestamp;

                SimpleEvent(String type, Object data) {
                    this.type = type;
                    this.eventData = data;
                    this.timestamp = System.currentTimeMillis();
                }

                @Override
                public String getType() {
                    return type;
                }

                @Override
                public Object getData() {
                    return eventData;
                }

                public long getTimestamp() {
                    return timestamp;
                }
            }

            Event event = new SimpleEvent(eventType, data);

            List<EventListener> eventListeners = listeners.get(eventType);
            if (eventListeners != null) {
                for (EventListener listener : eventListeners) {
                    listener.onEvent(event);
                }
            }
        }
    }

    // 使用示例
    public static void main(String[] args) {
        EventManager manager = new EventManager();

        // 使用匿名类订阅事件
        manager.subscribe("user.login", new EventListener() {
            @Override
            public void onEvent(Event event) {
                System.out.println("User logged in: " + event.getData());
            }
        });

        manager.subscribe("user.login", new EventListener() {
            @Override
            public void onEvent(Event event) {
                System.out.println("Logging user activity: " + event.getData());
            }
        });

        manager.subscribe("order.created", new EventListener() {
            @Override
            public void onEvent(Event event) {
                System.out.println("New order created: " + event.getData());
            }
        });

        // 发布事件
        manager.publish("user.login", "john_doe");
        manager.publish("order.created", "Order #12345");
    }
}
```

### 示例4：状态机实现

使用成员内部类实现状态模式：

```java
public class VendingMachine {

    // 状态接口
    private interface State {
        void insertCoin();
        void pressButton();
        void dispense();
    }

    // 当前状态
    private State currentState;

    // 产品数量
    private int count;

    // 成员内部类：无币状态
    private class NoCoinState implements State {
        @Override
        public void insertCoin() {
            System.out.println("硬币已投入");
            currentState = hasCoinState;  // 可以访问外部类成员
        }

        @Override
        public void pressButton() {
            System.out.println("请先投入硬币");
        }

        @Override
        public void dispense() {
            System.out.println("请先投入硬币");
        }
    }

    // 成员内部类：有币状态
    private class HasCoinState implements State {
        @Override
        public void insertCoin() {
            System.out.println("已有硬币，无法再投入");
        }

        @Override
        public void pressButton() {
            System.out.println("按钮已按下");
            currentState = dispensingState;
            currentState.dispense();
        }

        @Override
        public void dispense() {
            System.out.println("请先按下按钮");
        }
    }

    // 成员内部类：出货状态
    private class DispensingState implements State {
        @Override
        public void insertCoin() {
            System.out.println("正在出货，请稍候");
        }

        @Override
        public void pressButton() {
            System.out.println("正在出货，请稍候");
        }

        @Override
        public void dispense() {
            System.out.println("商品已发放");
            count--;  // 可以访问外部类成员

            if (count > 0) {
                currentState = noCoinState;
            } else {
                System.out.println("商品已售罄");
                currentState = soldOutState;
            }
        }
    }

    // 成员内部类：售罄状态
    private class SoldOutState implements State {
        @Override
        public void insertCoin() {
            System.out.println("商品已售罄，退还硬币");
        }

        @Override
        public void pressButton() {
            System.out.println("商品已售罄");
        }

        @Override
        public void dispense() {
            System.out.println("商品已售罄");
        }
    }

    // 状态实例
    private final State noCoinState = new NoCoinState();
    private final State hasCoinState = new HasCoinState();
    private final State dispensingState = new DispensingState();
    private final State soldOutState = new SoldOutState();

    public VendingMachine(int count) {
        this.count = count;
        if (count > 0) {
            currentState = noCoinState;
        } else {
            currentState = soldOutState;
        }
    }

    public void insertCoin() {
        currentState.insertCoin();
    }

    public void pressButton() {
        currentState.pressButton();
    }

    public int getCount() {
        return count;
    }

    // 使用示例
    public static void main(String[] args) {
        VendingMachine machine = new VendingMachine(2);

        // 正常购买流程
        machine.insertCoin();
        machine.pressButton();
        System.out.println("剩余: " + machine.getCount());

        System.out.println("---");

        // 再次购买
        machine.insertCoin();
        machine.pressButton();
        System.out.println("剩余: " + machine.getCount());

        System.out.println("---");

        // 商品售罄
        machine.insertCoin();
    }
}
```

## 最佳实践

### 选择合适的内部类类型

```java
// 使用静态嵌套类：当内部类不需要访问外部类的实例成员时
public class Network {
    public static class Connection {
        private String host;
        private int port;

        public Connection(String host, int port) {
            this.host = host;
            this.port = port;
        }
    }
}

// 使用成员内部类：当内部类需要访问外部类的实例成员时
public class BinaryTree<E> {
    private Node root;

    private class Node {
        E data;
        Node left, right;

        Node(E data) {
            this.data = data;
        }
    }
}

// 使用匿名类：一次性的简单实现
button.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick() {
        System.out.println("Clicked!");
    }
});

// Java 8+ 优先使用 Lambda（如果是函数式接口）
button.setOnClickListener(() -> System.out.println("Clicked!"));
```

### 优先使用静态嵌套类

静态嵌套类不持有外部类引用，内存占用更少，且不会阻止外部类被垃圾回收：

```java
// 推荐：静态嵌套类
public class Outer {
    public static class Inner {
        // 不持有 Outer 的引用
    }
}

// 不推荐：当不需要访问外部类实例成员时使用非静态内部类
public class Outer {
    public class Inner {
        // 不必要地持有 Outer 的引用
    }
}
```

### 限制内部类的可见性

```java
public class DataProcessor {
    // private 内部类：只在外部类内部使用
    private class ProcessingContext {
        // ...
    }

    // public 静态嵌套类：作为公共 API
    public static class Result {
        // ...
    }
}
```

### 避免过深的嵌套

```java
// 不推荐：嵌套层次过深
public class A {
    class B {
        class C {
            class D {
                // 难以阅读和维护
            }
        }
    }
}

// 推荐：保持扁平结构
public class A {
    private class B { }
    private class C { }
    private class D { }
}
```

### 使用有意义的内部类名

```java
public class HttpClient {
    // 好：名称清晰表明用途
    public static class Response {
        private int statusCode;
        private String body;
    }

    public static class RequestBuilder {
        // ...
    }

    // 不好：名称模糊
    public static class Data { }
    public static class Helper { }
}
```

## 常见陷阱

### 陷阱1：内存泄漏

成员内部类持有外部类的引用，可能导致内存泄漏：

```java
public class Activity {
    private byte[] largeData = new byte[1024 * 1024];  // 1MB

    // 危险：Handler 持有 Activity 的引用
    private class MyHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
            // 处理消息
        }
    }

    private MyHandler handler = new MyHandler();

    public void postDelayedMessage() {
        // 如果 Activity 被销毁但消息还未处理，
        // handler 会阻止 Activity（包括 largeData）被垃圾回收
        handler.postDelayed(() -> {}, 60000);  // 60秒后执行
    }
}

// 解决方案：使用静态嵌套类 + 弱引用
public class Activity {
    private byte[] largeData = new byte[1024 * 1024];

    private static class MyHandler extends Handler {
        private final WeakReference<Activity> activityRef;

        MyHandler(Activity activity) {
            this.activityRef = new WeakReference<>(activity);
        }

        @Override
        public void handleMessage(Message msg) {
            Activity activity = activityRef.get();
            if (activity != null) {
                // 安全地访问 Activity
            }
        }
    }

    private final MyHandler handler = new MyHandler(this);
}
```

### 陷阱2：序列化问题

内部类的序列化可能出现问题：

```java
// 问题：内部类序列化会尝试序列化外部类
public class Outer implements Serializable {
    private transient Connection connection;  // 不可序列化

    class Inner implements Serializable {
        private String data;
        // 序列化 Inner 会失败，因为它持有 Outer 的引用
        // 而 Outer 持有不可序列化的 connection
    }
}

// 解决方案：使用静态嵌套类
public class Outer {
    private transient Connection connection;

    static class Inner implements Serializable {
        private String data;
        // 可以正常序列化
    }
}
```

### 陷阱3：this 引用混淆

```java
public class Outer {
    private String name = "Outer";

    class Inner {
        private String name = "Inner";

        void printNames() {
            System.out.println(name);           // "Inner"（当前类的 name）
            System.out.println(this.name);      // "Inner"（当前类的 name）
            System.out.println(Outer.this.name); // "Outer"（外部类的 name）
        }
    }
}
```

### 陷阱4：effectively final 变量

```java
public void process(List<String> items) {
    int count = 0;

    items.forEach(item -> {
        // count++;  // 编译错误：count 不是 effectively final
        System.out.println(item);
    });

    // 解决方案1：使用原子类
    AtomicInteger atomicCount = new AtomicInteger(0);
    items.forEach(item -> {
        atomicCount.incrementAndGet();
    });

    // 解决方案2：使用数组或容器
    int[] countWrapper = {0};
    items.forEach(item -> {
        countWrapper[0]++;
    });
}
```

### 陷阱5：匿名类不能有构造函数

```java
// 错误：匿名类不能定义构造函数
Runnable r = new Runnable() {
    // public Runnable() { }  // 编译错误

    @Override
    public void run() { }
};

// 解决方案：使用实例初始化块
Runnable r = new Runnable() {
    private int value;

    {
        // 实例初始化块
        this.value = 42;
        System.out.println("Initialized with value: " + value);
    }

    @Override
    public void run() {
        System.out.println("Value: " + value);
    }
};
```

## 性能考量

### 外部类引用的开销

成员内部类每个实例都会额外存储一个外部类引用：

```java
// 每个 Inner 实例额外占用一个引用大小（通常 4 或 8 字节）
public class Outer {
    class Inner {
        private int value;
        // 编译器添加：final Outer this$0;
    }
}

// 对于大量实例，考虑使用静态嵌套类
public class Outer {
    static class Inner {
        private int value;
        private Outer outer;  // 如果需要，显式存储
    }
}
```

### 访问外部类成员的性能

内部类访问外部类私有成员时，编译器会生成合成方法（synthetic method）：

```java
public class Outer {
    private int value = 10;

    class Inner {
        void printValue() {
            System.out.println(value);  // 通过合成方法访问
        }
    }
}

// 编译器生成（反编译示意）：
public class Outer {
    private int value = 10;

    // 合成方法：供内部类访问私有成员
    static int access$000(Outer outer) {
        return outer.value;
    }
}
```

在热点代码中，这个额外的方法调用可能影响性能。对于性能敏感的场景，考虑：

```java
// 使用包级私有而非私有
public class Outer {
    int value = 10;  // 包级私有，内部类可以直接访问

    class Inner {
        void printValue() {
            System.out.println(value);  // 直接访问，无合成方法
        }
    }
}
```

### 匿名类实例的创建

每次执行到匿名类定义处都会创建新实例：

```java
// 每次调用都创建新的 Comparator 实例
public void sort(List<String> list) {
    list.sort(new Comparator<String>() {
        @Override
        public int compare(String s1, String s2) {
            return s1.length() - s2.length();
        }
    });
}

// 优化：使用静态常量或 Lambda
private static final Comparator<String> BY_LENGTH = (s1, s2) -> s1.length() - s2.length();

public void sort(List<String> list) {
    list.sort(BY_LENGTH);  // 复用同一个实例
}
```

### 类加载开销

每个内部类都是独立的类文件，会增加类加载的开销：

```java
// 如果有大量内部类，会增加应用启动时间
public class Outer {
    class Inner1 { }
    class Inner2 { }
    class Inner3 { }
    // ... 每个内部类都需要单独加载
}
```

## 实战场景

### 场景1：回调和监听器

```java
public class FileDownloader {

    public interface DownloadCallback {
        void onProgress(int percentage);
        void onComplete(byte[] data);
        void onError(Exception e);
    }

    public void download(String url, DownloadCallback callback) {
        new Thread(() -> {
            try {
                // 模拟下载过程
                for (int i = 0; i <= 100; i += 10) {
                    Thread.sleep(100);
                    callback.onProgress(i);
                }
                callback.onComplete(new byte[1024]);
            } catch (Exception e) {
                callback.onError(e);
            }
        }).start();
    }

    // 使用示例
    public static void main(String[] args) {
        FileDownloader downloader = new FileDownloader();

        downloader.download("http://example.com/file", new DownloadCallback() {
            @Override
            public void onProgress(int percentage) {
                System.out.println("Progress: " + percentage + "%");
            }

            @Override
            public void onComplete(byte[] data) {
                System.out.println("Download complete: " + data.length + " bytes");
            }

            @Override
            public void onError(Exception e) {
                System.out.println("Download failed: " + e.getMessage());
            }
        });
    }
}
```

### 场景2：工厂方法返回私有实现

```java
public interface Database {
    void connect();
    void query(String sql);
    void close();

    // 工厂方法
    static Database createMySQLDatabase(String host, int port) {
        return new MySQLDatabase(host, port);
    }

    static Database createPostgreSQLDatabase(String host, int port) {
        return new PostgreSQLDatabase(host, port);
    }

    // 私有静态嵌套类实现
    class MySQLDatabase implements Database {
        private final String host;
        private final int port;

        private MySQLDatabase(String host, int port) {
            this.host = host;
            this.port = port;
        }

        @Override
        public void connect() {
            System.out.println("Connecting to MySQL at " + host + ":" + port);
        }

        @Override
        public void query(String sql) {
            System.out.println("Executing MySQL query: " + sql);
        }

        @Override
        public void close() {
            System.out.println("Closing MySQL connection");
        }
    }

    class PostgreSQLDatabase implements Database {
        private final String host;
        private final int port;

        private PostgreSQLDatabase(String host, int port) {
            this.host = host;
            this.port = port;
        }

        @Override
        public void connect() {
            System.out.println("Connecting to PostgreSQL at " + host + ":" + port);
        }

        @Override
        public void query(String sql) {
            System.out.println("Executing PostgreSQL query: " + sql);
        }

        @Override
        public void close() {
            System.out.println("Closing PostgreSQL connection");
        }
    }
}
```

### 场景3：多继承模拟

Java 不支持多继承，但可以通过内部类实现类似效果：

```java
public class Robot {

    // 模拟多继承：Robot 同时具有 Walker 和 Talker 的能力

    public interface Walker {
        void walk();
    }

    public interface Talker {
        void talk();
    }

    private class WalkingAbility implements Walker {
        @Override
        public void walk() {
            System.out.println("Robot is walking");
        }
    }

    private class TalkingAbility implements Talker {
        @Override
        public void talk() {
            System.out.println("Robot is talking");
        }
    }

    private final WalkingAbility walkingAbility = new WalkingAbility();
    private final TalkingAbility talkingAbility = new TalkingAbility();

    public Walker getWalker() {
        return walkingAbility;
    }

    public Talker getTalker() {
        return talkingAbility;
    }

    // 直接调用方法
    public void walk() {
        walkingAbility.walk();
    }

    public void talk() {
        talkingAbility.talk();
    }

    public static void main(String[] args) {
        Robot robot = new Robot();
        robot.walk();
        robot.talk();

        // 也可以获取接口引用
        Walker walker = robot.getWalker();
        walker.walk();
    }
}
```

### 场景4：Map 的 Entry 实现

```java
public class SimpleHashMap<K, V> {
    private Entry<K, V>[] table;
    private int size;

    @SuppressWarnings("unchecked")
    public SimpleHashMap(int capacity) {
        table = new Entry[capacity];
    }

    // 静态嵌套类：Entry 不需要访问外部类实例
    private static class Entry<K, V> {
        final int hash;
        final K key;
        V value;
        Entry<K, V> next;

        Entry(int hash, K key, V value, Entry<K, V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    public void put(K key, V value) {
        int hash = key.hashCode();
        int index = Math.abs(hash) % table.length;

        Entry<K, V> entry = table[index];
        while (entry != null) {
            if (entry.hash == hash && entry.key.equals(key)) {
                entry.value = value;
                return;
            }
            entry = entry.next;
        }

        table[index] = new Entry<>(hash, key, value, table[index]);
        size++;
    }

    public V get(K key) {
        int hash = key.hashCode();
        int index = Math.abs(hash) % table.length;

        Entry<K, V> entry = table[index];
        while (entry != null) {
            if (entry.hash == hash && entry.key.equals(key)) {
                return entry.value;
            }
            entry = entry.next;
        }
        return null;
    }

    public int size() {
        return size;
    }
}
```

## 面试要点

### 内部类的基本概念

**问：Java 中有哪几种内部类？它们有什么区别？**

答：Java 中有四种内部类：

1. **成员内部类**：定义在类内部，方法外部。持有外部类引用，可以访问外部类所有成员。
2. **静态嵌套类**：使用 static 修饰。不持有外部类引用，只能访问外部类静态成员。
3. **局部类**：定义在方法或代码块内部。可以访问外部类成员和 effectively final 的局部变量。
4. **匿名类**：没有类名的一次性类。常用于实现接口或继承类。

### 外部类引用

**问：如何在内部类中访问外部类的 this 引用？**

```java
public class Outer {
    private String name = "Outer";

    class Inner {
        private String name = "Inner";

        void print() {
            System.out.println(this.name);        // Inner
            System.out.println(Outer.this.name);  // Outer
        }
    }
}
```

### 创建内部类实例

**问：如何在外部类外部创建成员内部类的实例？**

```java
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();

// 或者一行
Outer.Inner inner2 = new Outer().new Inner();
```

### 静态嵌套类 vs 成员内部类

**问：什么时候使用静态嵌套类，什么时候使用成员内部类？**

答：
- **使用静态嵌套类**：当内部类不需要访问外部类的实例成员时，应该使用静态嵌套类。这样可以避免持有外部类引用，减少内存占用和潜在的内存泄漏。
- **使用成员内部类**：当内部类需要访问外部类的实例成员时使用。

### 匿名类 vs Lambda

**问：匿名类和 Lambda 表达式有什么区别？**

| 特性 | 匿名类 | Lambda 表达式 |
|------|--------|--------------|
| 适用范围 | 任何接口或类 | 仅函数式接口 |
| this 指向 | 匿名类自身 | 外围类 |
| 可添加字段/方法 | 是 | 否 |
| 编译方式 | 生成独立类文件 | 使用 invokedynamic |

```java
// 匿名类：this 指向匿名类实例
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println(this.getClass());  // Outer$1
    }
};

// Lambda：this 指向外围类
Runnable r2 = () -> {
    System.out.println(this.getClass());  // Outer
};
```

### 内存泄漏问题

**问：内部类可能导致什么问题？如何避免？**

答：成员内部类持有外部类的隐式引用，可能导致内存泄漏。当内部类的生命周期比外部类长时（如异步回调、长时间运行的线程），会阻止外部类被垃圾回收。

解决方案：
1. 使用静态嵌套类
2. 如果需要访问外部类，使用 WeakReference
3. 确保及时取消注册/清理

### effectively final

**问：为什么局部类和匿名类只能访问 effectively final 的局部变量？**

答：局部变量存储在栈上，方法执行完毕后被销毁。而内部类可能在方法返回后继续存在。编译器会将捕获的局部变量复制到内部类中，为了保证值的一致性，要求变量是 effectively final 的。

## 延伸阅读

### 相关概念

- **闭包（Closure）**：内部类（特别是匿名类和局部类）实现了类似闭包的功能，可以捕获外部作用域的变量
- **Lambda 表达式**：Java 8 引入的特性，在很多场景下可以替代匿名类
- **设计模式**：许多设计模式（如迭代器、Builder、状态模式）使用内部类实现

### Java 新版本的改进

- **Java 16**：允许成员内部类定义静态成员
- **Java 17+**：密封类（Sealed Classes）可以与嵌套类结合使用

### 推荐资源

- 《Effective Java》第 24 条：静态成员类优于非静态成员类
- 《Java 核心技术》第 6 章：内部类
- Oracle 官方教程：Nested Classes
- JLS（Java Language Specification）第 8.1.3 节：Inner Classes

### 代码示例

本文完整代码示例可以在以下仓库找到，包含所有内部类类型的使用示例和性能测试：

```java
// 完整示例结构
src/
├── innerclass/
│   ├── MemberInnerClassDemo.java
│   ├── StaticNestedClassDemo.java
│   ├── LocalClassDemo.java
│   ├── AnonymousClassDemo.java
│   ├── patterns/
│   │   ├── IteratorPattern.java
│   │   ├── BuilderPattern.java
│   │   └── StatePattern.java
│   └── performance/
│       └── InnerClassBenchmark.java
```
