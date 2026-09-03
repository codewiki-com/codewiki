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
origin: old/src/content/docs/java/inner-classes.en.md
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

Inner classes are a powerful and flexible feature in the Java language that allows defining a class inside another class. Inner classes not only provide better encapsulation mechanisms but can also access private members of the outer class, making them important tools for implementing callbacks, event handling, and design patterns. This article will comprehensively explore the various types of Java inner classes and their application scenarios.

## Concept Explanation

### What are Inner Classes

An inner class is a class defined inside another class. Unlike regular top-level classes, an inner class is a member of the outer class and can access all members of the outer class, including private members.

Inner classes in Java can be divided into four types:

1. **Member Inner Class**: A non-static class defined inside a class but outside methods
2. **Static Nested Class**: An inner class modified with the static keyword
3. **Local Class**: A class defined inside a method or code block
4. **Anonymous Class**: An inner class without a name, typically used for one-time usage

```java
public class OuterClass {
    // Member inner class
    class MemberInnerClass { }

    // Static nested class
    static class StaticNestedClass { }

    public void method() {
        // Local class
        class LocalClass { }

        // Anonymous class
        Runnable runnable = new Runnable() {
            @Override
            public void run() { }
        };
    }
}
```

### Historical Background of Inner Classes

Inner classes were introduced in Java 1.1 (1997), mainly for the following purposes:

1. **Support GUI event handling**: In the AWT/Swing era, event listeners frequently required creating small classes
2. **Enhance encapsulation**: Hide classes that are only used in specific contexts
3. **Provide an alternative to closures**: Before Lambda expressions, anonymous classes were the primary way to achieve closure-like functionality

### Problems Solved by Inner Classes

1. **Logical grouping**: Place classes used in only one location inside the class that uses them
2. **Enhanced encapsulation**: Hide implementation details, visible only to the outer class
3. **Access to outer class members**: Inner classes can directly access private members of the outer class
4. **Code readability**: Keeping related code together improves readability

## Core Principles

### Compilation Mechanism

Inner classes generate independent `.class` files during compilation. The naming rules are as follows:

- Member inner class: `OuterClass$InnerClass.class`
- Static nested class: `OuterClass$StaticNestedClass.class`
- Local class: `OuterClass$1LocalClass.class` (number indicates definition order)
- Anonymous class: `OuterClass$1.class` (pure numeric numbering)

```java
// Files generated after compilation:
// OuterClass.class
// OuterClass$MemberInner.class
// OuterClass$StaticNested.class
// OuterClass$1LocalClass.class
// OuterClass$1.class (anonymous class)

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

### Outer Class Reference

Non-static inner classes implicitly hold a reference to the outer class instance. The compiler automatically adds a field pointing to the outer class:

```java
// Source code
public class Outer {
    private int value = 10;

    class Inner {
        public void printValue() {
            System.out.println(value);
        }
    }
}

// Compiled inner class (decompiled representation)
class Outer$Inner {
    final Outer this$0;  // Outer class reference added by compiler

    Outer$Inner(Outer outer) {
        this.this$0 = outer;
    }

    public void printValue() {
        System.out.println(this$0.value);
    }
}
```

### Access Control

Inner classes can use all access modifiers:

```java
public class Outer {
    // public inner class: accessible from anywhere
    public class PublicInner { }

    // protected inner class: accessible from same package and subclasses
    protected class ProtectedInner { }

    // default (package-private) inner class: accessible from same package
    class PackageInner { }

    // private inner class: only accessible from outer class
    private class PrivateInner { }
}
```

### Variable Capture Mechanism

Local classes and anonymous classes can capture local variables from the outer scope, but these variables must be **effectively final** (effectively immutable):

```java
public void method() {
    int count = 0;
    // count++;  // If uncommented, the anonymous class below will cause compilation error

    Runnable r = new Runnable() {
        @Override
        public void run() {
            // count++;  // Error: cannot modify captured variable
            System.out.println(count);  // Can read
        }
    };
}
```

The reason for this restriction is: local variables are stored on the stack and are destroyed after the method finishes executing, while inner classes may continue to exist after the method returns. The compiler actually copies the variable's value into the inner class.

## Key Points

### Member Inner Class

Member inner classes are the most common form of inner classes, existing as members of the outer class.

**Characteristics**:
- Can access all members of the outer class (including private members)
- Holds an implicit reference to the outer class instance
- Cannot define static members (Java 16+ allows defining static constants)
- Can use any access modifier

```java
public class LinkedList<E> {
    private Node<E> head;
    private int size;

    // Member inner class: Node is an implementation detail of LinkedList
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
        size++;  // Can access private member of outer class
    }

    public int size() {
        return size;
    }
}
```

**Creation Methods**:

```java
public class Outer {
    class Inner {
        public void greet() {
            System.out.println("Hello from Inner!");
        }
    }

    public static void main(String[] args) {
        // Must first create outer class instance
        Outer outer = new Outer();

        // Method 1: Create through outer class instance
        Outer.Inner inner1 = outer.new Inner();

        // Method 2: Simplified syntax (inside outer class)
        Inner inner2 = new Inner();  // In instance method of Outer

        inner1.greet();
    }
}
```

### Static Nested Class

Static nested classes are modified with static and do not hold a reference to the outer class.

**Characteristics**:
- Can be created without an outer class instance
- Can only access static members of the outer class
- Can define both static and non-static members
- Essentially a regular top-level class, just defined inside another class

```java
public class Calculator {
    private static int precision = 2;

    // Static nested class: used to encapsulate calculation results
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
                   / Math.pow(10, precision);  // Can access static member of outer class
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
            return new Result(0, false, "Divisor cannot be zero");
        }
        return new Result(a / b, true, "Calculation successful");
    }

    public static void main(String[] args) {
        // Creating static nested class instance: no outer class instance needed
        Calculator.Result result = Calculator.divide(10, 3);
        System.out.println("Result: " + result.getValue());  // 3.33
    }
}
```

**Member Inner Class vs Static Nested Class**:

| Feature | Member Inner Class | Static Nested Class |
|---------|-------------------|---------------------|
| static modifier | No | Yes |
| Outer class reference | Implicitly held | None |
| Access outer class members | All members | Only static members |
| Creation method | Requires outer class instance | No outer class instance needed |
| Can define static members | No (before Java 16) | Yes |

### Local Class

A local class is a class defined inside a method or code block.

**Characteristics**:
- Scope limited to the method or code block where it is defined
- Can access all members of the outer class
- Can access effectively final local variables of the method
- Cannot use access modifiers (defaults to package-private)
- Cannot define static members

```java
public class MessageProcessor {
    private String prefix = "[System]";

    public void processMessages(List<String> messages) {
        final String suffix = " - Processed";  // effectively final

        // Local class: only used within this method
        class MessageFormatter {
            private String timestamp;

            MessageFormatter() {
                this.timestamp = LocalDateTime.now().toString();
            }

            String format(String message) {
                // Can access outer class members
                // Can access effectively final variables of the method
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

### Anonymous Class

An anonymous class is an inner class without a name, typically used for one-time implementation of interfaces or extending classes.

**Characteristics**:
- No class name, definition and instantiation occur simultaneously
- Can implement one interface or extend one class (not both)
- Cannot define constructors (can use instance initializer blocks)
- Commonly used for event handling, callbacks, and simple interface implementations

```java
public class EventHandlerDemo {

    interface ClickListener {
        void onClick(String buttonName);
    }

    public void setupButton(ClickListener listener) {
        // Simulate button click
        listener.onClick("Submit");
    }

    public void demo() {
        // Anonymous class implementing interface
        setupButton(new ClickListener() {
            @Override
            public void onClick(String buttonName) {
                System.out.println("Button clicked: " + buttonName);
            }
        });

        // Anonymous class extending class
        Thread thread = new Thread() {
            @Override
            public void run() {
                System.out.println("Running in anonymous thread");
            }
        };
        thread.start();

        // Anonymous class implementing abstract class
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

**Anonymous Class Construction**:

```java
public class AnonymousConstruction {

    interface Calculator {
        int calculate(int a, int b);
    }

    public void demo() {
        final int factor = 10;

        // Anonymous class using instance initializer block instead of constructor
        Calculator calc = new Calculator() {
            private int multiplier;

            // Instance initializer block
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

## Code Examples

### Example 1: Iterator Pattern

Using a member inner class to implement an iterator is a classic application of inner classes:

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

    // Member inner class implementing iterator
    private class ArrayListIterator implements Iterator<E> {
        private int cursor = 0;      // Index of next element to return
        private int lastRet = -1;    // Index of last returned element

        @Override
        public boolean hasNext() {
            return cursor < size;    // Can access private member size of outer class
        }

        @Override
        @SuppressWarnings("unchecked")
        public E next() {
            if (!hasNext()) {
                throw new NoSuchElementException();
            }
            lastRet = cursor;
            return (E) elements[cursor++];  // Can access private member elements of outer class
        }

        @Override
        public void remove() {
            if (lastRet < 0) {
                throw new IllegalStateException();
            }
            // Remove element
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

    // Usage example
    public static void main(String[] args) {
        CustomArrayList<String> list = new CustomArrayList<>();
        list.add("Apple");
        list.add("Banana");
        list.add("Cherry");

        // Iterate using iterator
        for (String fruit : list) {
            System.out.println(fruit);
        }

        // Remove elements using iterator
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

### Example 2: Builder Pattern

Using a static nested class to implement the Builder pattern:

```java
public class User {
    // Required parameters
    private final String username;
    private final String email;

    // Optional parameters
    private final String firstName;
    private final String lastName;
    private final int age;
    private final String phone;
    private final String address;

    // Private constructor, can only be created through Builder
    private User(Builder builder) {
        this.username = builder.username;
        this.email = builder.email;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.age = builder.age;
        this.phone = builder.phone;
        this.address = builder.address;
    }

    // Getter methods
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

    // Static nested class Builder
    public static class Builder {
        // Required parameters
        private final String username;
        private final String email;

        // Optional parameters - with default values
        private String firstName = "";
        private String lastName = "";
        private int age = 0;
        private String phone = "";
        private String address = "";

        // Builder constructor: set required parameters
        public Builder(String username, String email) {
            this.username = username;
            this.email = email;
        }

        // Methods for setting optional parameters, return this to support method chaining
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

        // Build User object
        public User build() {
            // Validation logic can be added here
            if (username == null || username.isEmpty()) {
                throw new IllegalStateException("Username is required");
            }
            if (email == null || !email.contains("@")) {
                throw new IllegalStateException("Valid email is required");
            }
            return new User(this);
        }
    }

    // Usage example
    public static void main(String[] args) {
        User user = new User.Builder("john_doe", "john@example.com")
                .firstName("John")
                .lastName("Doe")
                .age(30)
                .phone("123-456-7890")
                .address("123 Main St")
                .build();

        System.out.println(user);

        // Only set required parameters
        User minimalUser = new User.Builder("jane_doe", "jane@example.com")
                .build();

        System.out.println(minimalUser);
    }
}
```

### Example 3: Event Handling System

Using anonymous classes and local classes to implement event handling:

```java
public class EventSystem {

    // Event interface
    public interface Event {
        String getType();
        Object getData();
    }

    // Event listener interface
    public interface EventListener {
        void onEvent(Event event);
    }

    // Event manager
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
            // Local class implementing Event interface
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

    // Usage example
    public static void main(String[] args) {
        EventManager manager = new EventManager();

        // Subscribe to events using anonymous class
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

        // Publish events
        manager.publish("user.login", "john_doe");
        manager.publish("order.created", "Order #12345");
    }
}
```

### Example 4: State Machine Implementation

Using member inner classes to implement the state pattern:

```java
public class VendingMachine {

    // State interface
    private interface State {
        void insertCoin();
        void pressButton();
        void dispense();
    }

    // Current state
    private State currentState;

    // Product count
    private int count;

    // Member inner class: No coin state
    private class NoCoinState implements State {
        @Override
        public void insertCoin() {
            System.out.println("Coin inserted");
            currentState = hasCoinState;  // Can access outer class member
        }

        @Override
        public void pressButton() {
            System.out.println("Please insert a coin first");
        }

        @Override
        public void dispense() {
            System.out.println("Please insert a coin first");
        }
    }

    // Member inner class: Has coin state
    private class HasCoinState implements State {
        @Override
        public void insertCoin() {
            System.out.println("Coin already inserted, cannot insert another");
        }

        @Override
        public void pressButton() {
            System.out.println("Button pressed");
            currentState = dispensingState;
            currentState.dispense();
        }

        @Override
        public void dispense() {
            System.out.println("Please press the button first");
        }
    }

    // Member inner class: Dispensing state
    private class DispensingState implements State {
        @Override
        public void insertCoin() {
            System.out.println("Dispensing in progress, please wait");
        }

        @Override
        public void pressButton() {
            System.out.println("Dispensing in progress, please wait");
        }

        @Override
        public void dispense() {
            System.out.println("Product dispensed");
            count--;  // Can access outer class member

            if (count > 0) {
                currentState = noCoinState;
            } else {
                System.out.println("Products sold out");
                currentState = soldOutState;
            }
        }
    }

    // Member inner class: Sold out state
    private class SoldOutState implements State {
        @Override
        public void insertCoin() {
            System.out.println("Products sold out, returning coin");
        }

        @Override
        public void pressButton() {
            System.out.println("Products sold out");
        }

        @Override
        public void dispense() {
            System.out.println("Products sold out");
        }
    }

    // State instances
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

    // Usage example
    public static void main(String[] args) {
        VendingMachine machine = new VendingMachine(2);

        // Normal purchase flow
        machine.insertCoin();
        machine.pressButton();
        System.out.println("Remaining: " + machine.getCount());

        System.out.println("---");

        // Purchase again
        machine.insertCoin();
        machine.pressButton();
        System.out.println("Remaining: " + machine.getCount());

        System.out.println("---");

        // Products sold out
        machine.insertCoin();
    }
}
```

## Best Practices

### Choose the Right Inner Class Type

```java
// Use static nested class: when inner class doesn't need to access outer class instance members
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

// Use member inner class: when inner class needs to access outer class instance members
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

// Use anonymous class: for one-time simple implementations
button.setOnClickListener(new OnClickListener() {
    @Override
    public void onClick() {
        System.out.println("Clicked!");
    }
});

// Java 8+ prefer Lambda (if functional interface)
button.setOnClickListener(() -> System.out.println("Clicked!"));
```

### Prefer Static Nested Classes

Static nested classes don't hold outer class references, use less memory, and don't prevent the outer class from being garbage collected:

```java
// Recommended: static nested class
public class Outer {
    public static class Inner {
        // Does not hold reference to Outer
    }
}

// Not recommended: using non-static inner class when not accessing outer class instance members
public class Outer {
    public class Inner {
        // Unnecessarily holds reference to Outer
    }
}
```

### Limit Inner Class Visibility

```java
public class DataProcessor {
    // private inner class: only used within outer class
    private class ProcessingContext {
        // ...
    }

    // public static nested class: as public API
    public static class Result {
        // ...
    }
}
```

### Avoid Deep Nesting

```java
// Not recommended: too deep nesting
public class A {
    class B {
        class C {
            class D {
                // Hard to read and maintain
            }
        }
    }
}

// Recommended: keep flat structure
public class A {
    private class B { }
    private class C { }
    private class D { }
}
```

### Use Meaningful Inner Class Names

```java
public class HttpClient {
    // Good: name clearly indicates purpose
    public static class Response {
        private int statusCode;
        private String body;
    }

    public static class RequestBuilder {
        // ...
    }

    // Bad: vague names
    public static class Data { }
    public static class Helper { }
}
```

## Common Pitfalls

### Pitfall 1: Memory Leaks

Member inner classes hold references to the outer class, which can cause memory leaks:

```java
public class Activity {
    private byte[] largeData = new byte[1024 * 1024];  // 1MB

    // Dangerous: Handler holds reference to Activity
    private class MyHandler extends Handler {
        @Override
        public void handleMessage(Message msg) {
            // Handle message
        }
    }

    private MyHandler handler = new MyHandler();

    public void postDelayedMessage() {
        // If Activity is destroyed but message not yet processed,
        // handler will prevent Activity (including largeData) from being garbage collected
        handler.postDelayed(() -> {}, 60000);  // Execute after 60 seconds
    }
}

// Solution: use static nested class + weak reference
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
                // Safely access Activity
            }
        }
    }

    private final MyHandler handler = new MyHandler(this);
}
```

### Pitfall 2: Serialization Issues

Serialization of inner classes can be problematic:

```java
// Problem: serializing inner class attempts to serialize outer class
public class Outer implements Serializable {
    private transient Connection connection;  // Not serializable

    class Inner implements Serializable {
        private String data;
        // Serializing Inner will fail because it holds reference to Outer
        // and Outer holds non-serializable connection
    }
}

// Solution: use static nested class
public class Outer {
    private transient Connection connection;

    static class Inner implements Serializable {
        private String data;
        // Can be serialized normally
    }
}
```

### Pitfall 3: this Reference Confusion

```java
public class Outer {
    private String name = "Outer";

    class Inner {
        private String name = "Inner";

        void printNames() {
            System.out.println(name);           // "Inner" (current class's name)
            System.out.println(this.name);      // "Inner" (current class's name)
            System.out.println(Outer.this.name); // "Outer" (outer class's name)
        }
    }
}
```

### Pitfall 4: effectively final Variables

```java
public void process(List<String> items) {
    int count = 0;

    items.forEach(item -> {
        // count++;  // Compilation error: count is not effectively final
        System.out.println(item);
    });

    // Solution 1: use atomic class
    AtomicInteger atomicCount = new AtomicInteger(0);
    items.forEach(item -> {
        atomicCount.incrementAndGet();
    });

    // Solution 2: use array or container
    int[] countWrapper = {0};
    items.forEach(item -> {
        countWrapper[0]++;
    });
}
```

### Pitfall 5: Anonymous Classes Cannot Have Constructors

```java
// Error: anonymous class cannot define constructor
Runnable r = new Runnable() {
    // public Runnable() { }  // Compilation error

    @Override
    public void run() { }
};

// Solution: use instance initializer block
Runnable r = new Runnable() {
    private int value;

    {
        // Instance initializer block
        this.value = 42;
        System.out.println("Initialized with value: " + value);
    }

    @Override
    public void run() {
        System.out.println("Value: " + value);
    }
};
```

## Performance Considerations

### Outer Class Reference Overhead

Each instance of a member inner class stores an additional outer class reference:

```java
// Each Inner instance uses an extra reference size (typically 4 or 8 bytes)
public class Outer {
    class Inner {
        private int value;
        // Compiler adds: final Outer this$0;
    }
}

// For many instances, consider using static nested class
public class Outer {
    static class Inner {
        private int value;
        private Outer outer;  // Store explicitly if needed
    }
}
```

### Performance of Accessing Outer Class Members

When inner classes access private members of the outer class, the compiler generates synthetic methods:

```java
public class Outer {
    private int value = 10;

    class Inner {
        void printValue() {
            System.out.println(value);  // Accessed through synthetic method
        }
    }
}

// Compiler generates (decompiled representation):
public class Outer {
    private int value = 10;

    // Synthetic method: for inner class to access private member
    static int access$000(Outer outer) {
        return outer.value;
    }
}
```

In hot code paths, this additional method call may affect performance. For performance-sensitive scenarios, consider:

```java
// Use package-private instead of private
public class Outer {
    int value = 10;  // Package-private, inner class can access directly

    class Inner {
        void printValue() {
            System.out.println(value);  // Direct access, no synthetic method
        }
    }
}
```

### Anonymous Class Instance Creation

A new instance is created each time execution reaches an anonymous class definition:

```java
// Creates new Comparator instance on each call
public void sort(List<String> list) {
    list.sort(new Comparator<String>() {
        @Override
        public int compare(String s1, String s2) {
            return s1.length() - s2.length();
        }
    });
}

// Optimization: use static constant or Lambda
private static final Comparator<String> BY_LENGTH = (s1, s2) -> s1.length() - s2.length();

public void sort(List<String> list) {
    list.sort(BY_LENGTH);  // Reuse same instance
}
```

### Class Loading Overhead

Each inner class is a separate class file, increasing class loading overhead:

```java
// Having many inner classes increases application startup time
public class Outer {
    class Inner1 { }
    class Inner2 { }
    class Inner3 { }
    // ... each inner class needs to be loaded separately
}
```

## Real-World Scenarios

### Scenario 1: Callbacks and Listeners

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
                // Simulate download process
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

    // Usage example
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

### Scenario 2: Factory Methods Returning Private Implementations

```java
public interface Database {
    void connect();
    void query(String sql);
    void close();

    // Factory methods
    static Database createMySQLDatabase(String host, int port) {
        return new MySQLDatabase(host, port);
    }

    static Database createPostgreSQLDatabase(String host, int port) {
        return new PostgreSQLDatabase(host, port);
    }

    // Private static nested class implementations
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

### Scenario 3: Simulating Multiple Inheritance

Java doesn't support multiple inheritance, but similar effects can be achieved through inner classes:

```java
public class Robot {

    // Simulating multiple inheritance: Robot has both Walker and Talker abilities

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

    // Direct method calls
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

        // Can also get interface references
        Walker walker = robot.getWalker();
        walker.walk();
    }
}
```

### Scenario 4: Map Entry Implementation

```java
public class SimpleHashMap<K, V> {
    private Entry<K, V>[] table;
    private int size;

    @SuppressWarnings("unchecked")
    public SimpleHashMap(int capacity) {
        table = new Entry[capacity];
    }

    // Static nested class: Entry doesn't need access to outer class instance
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

## Interview Key Points

### Basic Concepts of Inner Classes

**Q: What types of inner classes are there in Java? What are their differences?**

A: Java has four types of inner classes:

1. **Member Inner Class**: Defined inside a class but outside methods. Holds outer class reference and can access all members of outer class.
2. **Static Nested Class**: Modified with static. Doesn't hold outer class reference, can only access static members of outer class.
3. **Local Class**: Defined inside a method or code block. Can access outer class members and effectively final local variables.
4. **Anonymous Class**: A nameless one-time class. Commonly used for implementing interfaces or extending classes.

### Outer Class Reference

**Q: How do you access the outer class's this reference from an inner class?**

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

### Creating Inner Class Instances

**Q: How do you create a member inner class instance from outside the outer class?**

```java
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();

// Or in one line
Outer.Inner inner2 = new Outer().new Inner();
```

### Static Nested Class vs Member Inner Class

**Q: When should you use a static nested class, and when should you use a member inner class?**

A:
- **Use static nested class**: When the inner class doesn't need to access instance members of the outer class, you should use a static nested class. This avoids holding an outer class reference, reducing memory usage and potential memory leaks.
- **Use member inner class**: When the inner class needs to access instance members of the outer class.

### Anonymous Class vs Lambda

**Q: What are the differences between anonymous classes and Lambda expressions?**

| Feature | Anonymous Class | Lambda Expression |
|---------|----------------|-------------------|
| Applicable scope | Any interface or class | Only functional interfaces |
| this reference | Points to anonymous class itself | Points to enclosing class |
| Can add fields/methods | Yes | No |
| Compilation method | Generates separate class file | Uses invokedynamic |

```java
// Anonymous class: this points to anonymous class instance
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println(this.getClass());  // Outer$1
    }
};

// Lambda: this points to enclosing class
Runnable r2 = () -> {
    System.out.println(this.getClass());  // Outer
};
```

### Memory Leak Issues

**Q: What problems can inner classes cause? How can they be avoided?**

A: Member inner classes hold an implicit reference to the outer class, which can cause memory leaks. When the inner class's lifetime is longer than the outer class (such as asynchronous callbacks, long-running threads), it prevents the outer class from being garbage collected.

Solutions:
1. Use static nested classes
2. If you need to access the outer class, use WeakReference
3. Ensure timely unregistration/cleanup

### effectively final

**Q: Why can local classes and anonymous classes only access effectively final local variables?**

A: Local variables are stored on the stack and are destroyed after the method finishes executing. However, inner classes may continue to exist after the method returns. The compiler copies the captured local variables into the inner class, and to ensure value consistency, the variables must be effectively final.

## Further Reading

### Related Concepts

- **Closure**: Inner classes (especially anonymous and local classes) implement closure-like functionality by capturing variables from the outer scope
- **Lambda Expressions**: A feature introduced in Java 8 that can replace anonymous classes in many scenarios
- **Design Patterns**: Many design patterns (such as Iterator, Builder, State pattern) are implemented using inner classes

### Improvements in New Java Versions

- **Java 16**: Allows member inner classes to define static members
- **Java 17+**: Sealed Classes can be combined with nested classes

### Recommended Resources

- "Effective Java" Item 24: Favor static member classes over nonstatic
- "Core Java" Chapter 6: Inner Classes
- Oracle Official Tutorial: Nested Classes
- JLS (Java Language Specification) Section 8.1.3: Inner Classes

### Code Examples

Complete code examples from this article can be found in the following repository, including usage examples of all inner class types and performance tests:

```java
// Complete example structure
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
