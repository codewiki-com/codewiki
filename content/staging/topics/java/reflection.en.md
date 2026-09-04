---
title: Reflection
description: Complete guide to Java reflection, Class objects, dynamic proxies and runtime type information
track: java
section: oop-generics
difficulty: advanced
tags:
  - Java
  - Reflection
  - Class
  - Dynamic Proxy
status: imported
origin: old/src/content/docs/java/reflection.en.md
divergence: 0.216
issues: []
legacy:
  category: Java
  subcategory: Advanced Features
  order: 8
  lastUpdated: 2026-01-07
---

Java Reflection is a powerful mechanism that allows programs to examine and modify the behavior of classes, interfaces, fields, and methods at runtime. It provides the ability to inspect class structures, create instances dynamically, invoke methods, and access fields without knowing their names at compile time.

## Introduction to Reflection

Reflection enables Java code to discover information about fields, methods, and constructors of loaded classes. It also allows the use of reflected members to operate on their underlying counterparts within security restrictions.

### When to Use Reflection

Reflection is commonly used in:

- **Frameworks and Libraries**: Spring, Hibernate, JUnit use reflection extensively
- **IDE Features**: Code completion, refactoring tools
- **Serialization/Deserialization**: JSON/XML processing libraries
- **Dependency Injection**: Creating and wiring objects dynamically
- **Testing**: Accessing private methods and fields for unit tests
- **Plugin Systems**: Loading and instantiating classes at runtime

### Basic Example

```java
import java.lang.reflect.*;

public class ReflectionIntro {
    public static void main(String[] args) throws Exception {
        // Get the Class object for String
        Class<?> stringClass = String.class;

        // Print all declared methods
        System.out.println("Methods of String class:");
        for (Method method : stringClass.getDeclaredMethods()) {
            System.out.println("  " + method.getName());
        }

        // Create an instance dynamically
        String str = (String) stringClass
            .getConstructor(String.class)
            .newInstance("Hello, Reflection!");

        System.out.println("Created string: " + str);

        // Invoke a method dynamically
        Method lengthMethod = stringClass.getMethod("length");
        int length = (int) lengthMethod.invoke(str);
        System.out.println("String length: " + length);
    }
}
```

## The Class Object

The `Class` class is the entry point for all reflection operations. Every type in Java has an associated `Class` object that contains metadata about the type.

### Obtaining Class Objects

There are several ways to obtain a `Class` object:

```java
public class ObtainingClassObjects {
    public static void main(String[] args) throws Exception {
        // 1. Using .class syntax (compile-time)
        Class<String> stringClass = String.class;
        Class<int[]> intArrayClass = int[].class;
        Class<Void> voidClass = void.class;

        // 2. Using getClass() on an instance (runtime)
        String str = "Hello";
        Class<?> strClass = str.getClass();

        // 3. Using Class.forName() with fully qualified name
        Class<?> listClass = Class.forName("java.util.ArrayList");

        // 4. Using class loader
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        Class<?> mapClass = loader.loadClass("java.util.HashMap");

        // 5. For primitive types
        Class<Integer> intWrapperClass = Integer.class;
        Class<?> intPrimitiveClass = Integer.TYPE; // or int.class

        // Verify they are different
        System.out.println("int.class == Integer.class: " +
            (int.class == Integer.class)); // false
        System.out.println("int.class == Integer.TYPE: " +
            (int.class == Integer.TYPE));  // true
    }
}
```

### Class Object Properties

```java
public class ClassProperties {
    public static void main(String[] args) {
        Class<String> clazz = String.class;

        // Basic information
        System.out.println("Name: " + clazz.getName());
        System.out.println("Simple Name: " + clazz.getSimpleName());
        System.out.println("Canonical Name: " + clazz.getCanonicalName());
        System.out.println("Package: " + clazz.getPackage().getName());

        // Type checks
        System.out.println("Is Interface: " + clazz.isInterface());
        System.out.println("Is Array: " + clazz.isArray());
        System.out.println("Is Primitive: " + clazz.isPrimitive());
        System.out.println("Is Enum: " + clazz.isEnum());
        System.out.println("Is Annotation: " + clazz.isAnnotation());
        System.out.println("Is Record: " + clazz.isRecord());
        System.out.println("Is Sealed: " + clazz.isSealed());

        // Modifiers
        int modifiers = clazz.getModifiers();
        System.out.println("Is Public: " + Modifier.isPublic(modifiers));
        System.out.println("Is Final: " + Modifier.isFinal(modifiers));
        System.out.println("Is Abstract: " + Modifier.isAbstract(modifiers));

        // Hierarchy
        System.out.println("Superclass: " + clazz.getSuperclass());
        System.out.println("Interfaces: " +
            java.util.Arrays.toString(clazz.getInterfaces()));
    }
}
```

### Working with Generic Types

```java
import java.lang.reflect.*;
import java.util.*;

public class GenericTypeInfo {
    private List<String> stringList;
    private Map<String, Integer> map;

    public static void main(String[] args) throws Exception {
        Field listField = GenericTypeInfo.class.getDeclaredField("stringList");
        Field mapField = GenericTypeInfo.class.getDeclaredField("map");

        // Get generic type information
        Type listType = listField.getGenericType();
        if (listType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) listType;
            System.out.println("Raw type: " + pt.getRawType());
            System.out.println("Type arguments: " +
                Arrays.toString(pt.getActualTypeArguments()));
        }

        // Map with multiple type parameters
        Type mapType = mapField.getGenericType();
        if (mapType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) mapType;
            System.out.println("Map raw type: " + pt.getRawType());
            for (Type arg : pt.getActualTypeArguments()) {
                System.out.println("  Type arg: " + arg);
            }
        }
    }
}
```

## Inspecting Class Information

Reflection provides comprehensive access to class structure including inheritance hierarchy, implemented interfaces, and nested classes.

### Class Hierarchy

```java
public class ClassHierarchy {
    public static void printHierarchy(Class<?> clazz) {
        System.out.println("Class Hierarchy for: " + clazz.getName());

        // Superclass chain
        System.out.println("\nSuperclass chain:");
        Class<?> current = clazz;
        int level = 0;
        while (current != null) {
            System.out.println("  ".repeat(level) + current.getName());
            current = current.getSuperclass();
            level++;
        }

        // All interfaces (including inherited)
        System.out.println("\nAll interfaces:");
        printInterfaces(clazz, 0);
    }

    private static void printInterfaces(Class<?> clazz, int indent) {
        for (Class<?> iface : clazz.getInterfaces()) {
            System.out.println("  ".repeat(indent) + iface.getName());
            printInterfaces(iface, indent + 1);
        }
        if (clazz.getSuperclass() != null) {
            printInterfaces(clazz.getSuperclass(), indent);
        }
    }

    public static void main(String[] args) {
        printHierarchy(java.util.ArrayList.class);
    }
}
```

### Nested Classes and Members

```java
public class NestedClassInspection {
    public class InnerClass {}
    public static class StaticNestedClass {}
    private interface PrivateInterface {}

    public static void main(String[] args) {
        Class<?> clazz = NestedClassInspection.class;

        // Get declared classes (including private)
        System.out.println("Declared classes:");
        for (Class<?> nested : clazz.getDeclaredClasses()) {
            System.out.println("  " + nested.getSimpleName() +
                " (static: " + Modifier.isStatic(nested.getModifiers()) + ")");
        }

        // Get public classes only
        System.out.println("\nPublic classes:");
        for (Class<?> nested : clazz.getClasses()) {
            System.out.println("  " + nested.getSimpleName());
        }

        // Check enclosing class
        Class<?> inner = InnerClass.class;
        System.out.println("\nEnclosing class of InnerClass: " +
            inner.getEnclosingClass());
        System.out.println("Is member class: " + inner.isMemberClass());
        System.out.println("Is local class: " + inner.isLocalClass());
        System.out.println("Is anonymous class: " + inner.isAnonymousClass());
    }
}
```

## Working with Fields

Reflection allows you to discover, read, and modify fields at runtime, including private fields.

### Discovering Fields

```java
import java.lang.reflect.*;

public class FieldDiscovery {
    public String publicField = "public";
    private int privateField = 42;
    protected double protectedField = 3.14;
    static final String CONSTANT = "constant";

    public static void main(String[] args) {
        Class<?> clazz = FieldDiscovery.class;

        // getDeclaredFields() - all fields declared in this class
        System.out.println("Declared fields:");
        for (Field field : clazz.getDeclaredFields()) {
            System.out.printf("  %s %s %s%n",
                Modifier.toString(field.getModifiers()),
                field.getType().getSimpleName(),
                field.getName());
        }

        // getFields() - all public fields (including inherited)
        System.out.println("\nPublic fields:");
        for (Field field : clazz.getFields()) {
            System.out.println("  " + field.getName());
        }
    }
}
```

### Reading and Writing Field Values

```java
import java.lang.reflect.*;

public class FieldAccess {
    private String name = "initial";
    private int count = 0;
    private static String staticField = "static value";

    public static void main(String[] args) throws Exception {
        FieldAccess instance = new FieldAccess();
        Class<?> clazz = instance.getClass();

        // Access private field
        Field nameField = clazz.getDeclaredField("name");
        nameField.setAccessible(true); // Bypass access control

        // Read value
        String currentName = (String) nameField.get(instance);
        System.out.println("Current name: " + currentName);

        // Write value
        nameField.set(instance, "modified");
        System.out.println("Modified name: " + instance.name);

        // Access static field
        Field staticF = clazz.getDeclaredField("staticField");
        staticF.setAccessible(true);
        System.out.println("Static field: " + staticF.get(null)); // null for static
        staticF.set(null, "new static value");
        System.out.println("Modified static: " + staticField);

        // Working with primitive types
        Field countField = clazz.getDeclaredField("count");
        countField.setAccessible(true);
        countField.setInt(instance, 100);
        System.out.println("Count: " + countField.getInt(instance));
    }
}
```

### Modifying Final Fields

```java
import java.lang.reflect.*;

public class FinalFieldModification {
    private final String finalField = "original";
    private static final int STATIC_FINAL = 42;

    public static void main(String[] args) throws Exception {
        FinalFieldModification instance = new FinalFieldModification();

        // Modify instance final field
        Field field = FinalFieldModification.class.getDeclaredField("finalField");
        field.setAccessible(true);

        // This works for instance fields
        field.set(instance, "modified");
        System.out.println("Final field: " + field.get(instance));

        // Note: Modifying static final fields is more complex
        // and may not work reliably in modern JVMs due to
        // constant folding and other optimizations
    }
}
```

## Working with Methods

Method reflection enables dynamic method discovery and invocation at runtime.

### Discovering Methods

```java
import java.lang.reflect.*;

public class MethodDiscovery {
    public void publicMethod() {}
    private String privateMethod(int x) { return String.valueOf(x); }
    protected void protectedMethod(String s, int n) {}
    static void staticMethod() {}

    public static void main(String[] args) {
        Class<?> clazz = MethodDiscovery.class;

        System.out.println("All declared methods:");
        for (Method method : clazz.getDeclaredMethods()) {
            // Method signature
            StringBuilder sb = new StringBuilder();
            sb.append(Modifier.toString(method.getModifiers())).append(" ");
            sb.append(method.getReturnType().getSimpleName()).append(" ");
            sb.append(method.getName()).append("(");

            // Parameters
            Parameter[] params = method.getParameters();
            for (int i = 0; i < params.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(params[i].getType().getSimpleName());
                sb.append(" ").append(params[i].getName());
            }
            sb.append(")");

            // Exceptions
            Class<?>[] exceptions = method.getExceptionTypes();
            if (exceptions.length > 0) {
                sb.append(" throws ");
                for (int i = 0; i < exceptions.length; i++) {
                    if (i > 0) sb.append(", ");
                    sb.append(exceptions[i].getSimpleName());
                }
            }

            System.out.println("  " + sb);
        }
    }
}
```

### Invoking Methods

```java
import java.lang.reflect.*;

public class MethodInvocation {
    public String greet(String name) {
        return "Hello, " + name + "!";
    }

    public int add(int a, int b) {
        return a + b;
    }

    private void privateMethod() {
        System.out.println("Private method called!");
    }

    public static String staticMethod(String input) {
        return input.toUpperCase();
    }

    public static void main(String[] args) throws Exception {
        MethodInvocation instance = new MethodInvocation();
        Class<?> clazz = instance.getClass();

        // Invoke public method with parameters
        Method greetMethod = clazz.getMethod("greet", String.class);
        String result = (String) greetMethod.invoke(instance, "World");
        System.out.println(result); // Hello, World!

        // Invoke method with primitive parameters
        Method addMethod = clazz.getMethod("add", int.class, int.class);
        int sum = (int) addMethod.invoke(instance, 5, 3);
        System.out.println("Sum: " + sum); // Sum: 8

        // Invoke private method
        Method privateMethod = clazz.getDeclaredMethod("privateMethod");
        privateMethod.setAccessible(true);
        privateMethod.invoke(instance);

        // Invoke static method
        Method staticMethod = clazz.getMethod("staticMethod", String.class);
        String upper = (String) staticMethod.invoke(null, "hello");
        System.out.println(upper); // HELLO
    }
}
```

### Variable Arguments Methods

```java
import java.lang.reflect.*;

public class VarArgsReflection {
    public void printAll(String... values) {
        for (String value : values) {
            System.out.println(value);
        }
    }

    public int sum(int first, int... rest) {
        int total = first;
        for (int value : rest) {
            total += value;
        }
        return total;
    }

    public static void main(String[] args) throws Exception {
        VarArgsReflection instance = new VarArgsReflection();
        Class<?> clazz = instance.getClass();

        // Varargs methods have array parameter types
        Method printAll = clazz.getMethod("printAll", String[].class);
        System.out.println("Is varargs: " + printAll.isVarArgs());

        // Invoke with array
        printAll.invoke(instance, (Object) new String[]{"a", "b", "c"});

        // Sum with varargs
        Method sumMethod = clazz.getMethod("sum", int.class, int[].class);
        int result = (int) sumMethod.invoke(instance, 10, new int[]{20, 30, 40});
        System.out.println("Sum: " + result); // 100
    }
}
```

## Working with Constructors

Constructor reflection enables dynamic object instantiation with any constructor.

### Discovering Constructors

```java
import java.lang.reflect.*;

public class ConstructorDiscovery {
    public ConstructorDiscovery() {}
    public ConstructorDiscovery(String name) {}
    private ConstructorDiscovery(int id, String name) {}

    public static void main(String[] args) {
        Class<?> clazz = ConstructorDiscovery.class;

        System.out.println("Public constructors:");
        for (Constructor<?> constructor : clazz.getConstructors()) {
            System.out.println("  " + constructor);
        }

        System.out.println("\nAll constructors (including private):");
        for (Constructor<?> constructor : clazz.getDeclaredConstructors()) {
            System.out.println("  " + constructor);
            System.out.println("    Parameters: " + constructor.getParameterCount());
        }
    }
}
```

### Creating Instances

```java
import java.lang.reflect.*;

public class InstanceCreation {
    private String name;
    private int age;

    public InstanceCreation() {
        this.name = "default";
        this.age = 0;
    }

    public InstanceCreation(String name) {
        this.name = name;
        this.age = 0;
    }

    public InstanceCreation(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public String toString() {
        return "InstanceCreation{name='" + name + "', age=" + age + "}";
    }

    public static void main(String[] args) throws Exception {
        Class<?> clazz = InstanceCreation.class;

        // Using Class.newInstance() - deprecated in Java 9+
        // Only works with no-arg constructor
        // InstanceCreation obj1 = clazz.newInstance();

        // Using Constructor.newInstance() - preferred

        // No-arg constructor
        Constructor<?> noArg = clazz.getConstructor();
        InstanceCreation obj1 = (InstanceCreation) noArg.newInstance();
        System.out.println(obj1);

        // Single parameter constructor
        Constructor<?> singleArg = clazz.getConstructor(String.class);
        InstanceCreation obj2 = (InstanceCreation) singleArg.newInstance("Alice");
        System.out.println(obj2);

        // Two parameter constructor
        Constructor<?> twoArgs = clazz.getConstructor(String.class, int.class);
        InstanceCreation obj3 = (InstanceCreation) twoArgs.newInstance("Bob", 25);
        System.out.println(obj3);
    }
}
```

### Private Constructors

```java
import java.lang.reflect.*;

public class PrivateConstructorAccess {
    private static PrivateConstructorAccess instance;

    private PrivateConstructorAccess() {
        System.out.println("Private constructor called!");
    }

    public static PrivateConstructorAccess getInstance() {
        if (instance == null) {
            instance = new PrivateConstructorAccess();
        }
        return instance;
    }

    public static void main(String[] args) throws Exception {
        // Normal way - using factory method
        PrivateConstructorAccess obj1 = PrivateConstructorAccess.getInstance();

        // Breaking singleton with reflection
        Constructor<PrivateConstructorAccess> constructor =
            PrivateConstructorAccess.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        PrivateConstructorAccess obj2 = constructor.newInstance();
        PrivateConstructorAccess obj3 = constructor.newInstance();

        System.out.println("Same instance? " + (obj2 == obj3)); // false
    }
}
```

## Working with Arrays

Reflection provides special support for array types through the `java.lang.reflect.Array` class.

### Creating Arrays Dynamically

```java
import java.lang.reflect.*;

public class ArrayReflection {
    public static void main(String[] args) {
        // Create a one-dimensional array
        int[] intArray = (int[]) Array.newInstance(int.class, 5);

        // Set values
        for (int i = 0; i < 5; i++) {
            Array.setInt(intArray, i, i * 10);
        }

        // Get values
        System.out.println("Int array:");
        for (int i = 0; i < Array.getLength(intArray); i++) {
            System.out.println("  [" + i + "] = " + Array.getInt(intArray, i));
        }

        // Create a multi-dimensional array
        int[][] matrix = (int[][]) Array.newInstance(int.class, 3, 4);
        Array.set(matrix, 0, new int[]{1, 2, 3, 4});

        // Create array of objects
        String[] strArray = (String[]) Array.newInstance(String.class, 3);
        Array.set(strArray, 0, "Hello");
        Array.set(strArray, 1, "World");
        Array.set(strArray, 2, "!");

        System.out.println("\nString array:");
        for (int i = 0; i < Array.getLength(strArray); i++) {
            System.out.println("  [" + i + "] = " + Array.get(strArray, i));
        }
    }
}
```

### Array Type Information

```java
import java.lang.reflect.*;

public class ArrayTypeInfo {
    public static void main(String[] args) {
        // Different array types
        Class<?> intArrayClass = int[].class;
        Class<?> stringArrayClass = String[].class;
        Class<?> objectArrayClass = Object[].class;
        Class<?> multiDimClass = int[][].class;

        // Check if a class is an array
        System.out.println("int[] is array: " + intArrayClass.isArray());
        System.out.println("String is array: " + String.class.isArray());

        // Get component type
        System.out.println("\nComponent types:");
        System.out.println("int[] component: " + intArrayClass.getComponentType());
        System.out.println("String[] component: " + stringArrayClass.getComponentType());
        System.out.println("int[][] component: " + multiDimClass.getComponentType());

        // Array class names
        System.out.println("\nArray class names:");
        System.out.println("int[]: " + intArrayClass.getName());
        System.out.println("String[]: " + stringArrayClass.getName());
        System.out.println("int[][]: " + multiDimClass.getName());
    }
}
```

## Annotations and Reflection

Reflection is essential for reading annotations at runtime, enabling frameworks like Spring and JUnit.

### Reading Annotations

```java
import java.lang.annotation.*;
import java.lang.reflect.*;

// Define custom annotations
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Entity {
    String table() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Column {
    String name() default "";
    boolean nullable() default true;
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Transactional {
    boolean readOnly() default false;
}

// Use annotations
@Entity(table = "users")
public class User {
    @Column(name = "user_id", nullable = false)
    private Long id;

    @Column(name = "user_name")
    private String name;

    @Transactional(readOnly = true)
    public String getName() {
        return name;
    }

    @Transactional
    public void setName(String name) {
        this.name = name;
    }

    public static void main(String[] args) throws Exception {
        Class<?> clazz = User.class;

        // Class-level annotations
        if (clazz.isAnnotationPresent(Entity.class)) {
            Entity entity = clazz.getAnnotation(Entity.class);
            System.out.println("Entity table: " + entity.table());
        }

        // Field annotations
        System.out.println("\nField annotations:");
        for (Field field : clazz.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column != null) {
                System.out.printf("  %s -> column '%s', nullable: %b%n",
                    field.getName(), column.name(), column.nullable());
            }
        }

        // Method annotations
        System.out.println("\nMethod annotations:");
        for (Method method : clazz.getDeclaredMethods()) {
            Transactional tx = method.getAnnotation(Transactional.class);
            if (tx != null) {
                System.out.printf("  %s -> readOnly: %b%n",
                    method.getName(), tx.readOnly());
            }
        }
    }
}
```

### Annotation Processing Example

```java
import java.lang.annotation.*;
import java.lang.reflect.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Inject {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Component {}

// Simple dependency injection example
public class SimpleInjector {

    public static <T> T createInstance(Class<T> clazz) throws Exception {
        T instance = clazz.getDeclaredConstructor().newInstance();

        // Process @Inject annotations
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Inject.class)) {
                field.setAccessible(true);
                Class<?> fieldType = field.getType();

                // Recursively create and inject dependencies
                Object dependency = createInstance(fieldType);
                field.set(instance, dependency);
            }
        }

        return instance;
    }
}

// Usage
@Component
class UserRepository {
    public String findUser() {
        return "User from repository";
    }
}

@Component
class UserService {
    @Inject
    private UserRepository repository;

    public String getUser() {
        return repository.findUser();
    }
}

class InjectionDemo {
    public static void main(String[] args) throws Exception {
        UserService service = SimpleInjector.createInstance(UserService.class);
        System.out.println(service.getUser());
    }
}
```

## Dynamic Proxies

Java Dynamic Proxy is a powerful feature that allows creating proxy implementations of interfaces at runtime.

### Basic Dynamic Proxy

```java
import java.lang.reflect.*;

interface Calculator {
    int add(int a, int b);
    int subtract(int a, int b);
    int multiply(int a, int b);
}

class CalculatorImpl implements Calculator {
    public int add(int a, int b) { return a + b; }
    public int subtract(int a, int b) { return a - b; }
    public int multiply(int a, int b) { return a * b; }
}

public class DynamicProxyExample {
    public static void main(String[] args) {
        Calculator realCalculator = new CalculatorImpl();

        // Create a proxy that logs all method calls
        Calculator proxy = (Calculator) Proxy.newProxyInstance(
            Calculator.class.getClassLoader(),
            new Class<?>[] { Calculator.class },
            new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args)
                        throws Throwable {
                    System.out.println("Calling: " + method.getName() +
                        " with args: " + java.util.Arrays.toString(args));

                    long start = System.nanoTime();
                    Object result = method.invoke(realCalculator, args);
                    long duration = System.nanoTime() - start;

                    System.out.println("Result: " + result +
                        " (took " + duration + " ns)");
                    return result;
                }
            }
        );

        // Use the proxy
        System.out.println("Sum: " + proxy.add(5, 3));
        System.out.println("Difference: " + proxy.subtract(10, 4));
        System.out.println("Product: " + proxy.multiply(6, 7));
    }
}
```

### Reusable Invocation Handler

```java
import java.lang.reflect.*;

// Generic logging handler
class LoggingHandler implements InvocationHandler {
    private final Object target;

    public LoggingHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println(">>> Before: " + method.getName());
        try {
            Object result = method.invoke(target, args);
            System.out.println("<<< After: " + method.getName() + " returned: " + result);
            return result;
        } catch (InvocationTargetException e) {
            System.out.println("!!! Exception in: " + method.getName());
            throw e.getTargetException();
        }
    }

    @SuppressWarnings("unchecked")
    public static <T> T createProxy(T target, Class<T> interfaceType) {
        return (T) Proxy.newProxyInstance(
            interfaceType.getClassLoader(),
            new Class<?>[] { interfaceType },
            new LoggingHandler(target)
        );
    }
}
```

### Transaction Proxy Example

```java
import java.lang.reflect.*;
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Transactional {
    boolean readOnly() default false;
}

interface UserService {
    @Transactional
    void createUser(String name);

    @Transactional(readOnly = true)
    String getUser(int id);
}

class UserServiceImpl implements UserService {
    public void createUser(String name) {
        System.out.println("Creating user: " + name);
    }

    public String getUser(int id) {
        return "User-" + id;
    }
}

class TransactionHandler implements InvocationHandler {
    private final Object target;

    public TransactionHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // Get the method from the target class to check for annotations
        Method targetMethod = target.getClass().getMethod(
            method.getName(), method.getParameterTypes());

        Transactional tx = targetMethod.getAnnotation(Transactional.class);

        if (tx != null) {
            System.out.println("--- BEGIN TRANSACTION (readOnly=" + tx.readOnly() + ")");
            try {
                Object result = method.invoke(target, args);
                System.out.println("--- COMMIT TRANSACTION");
                return result;
            } catch (Exception e) {
                System.out.println("--- ROLLBACK TRANSACTION");
                throw e;
            }
        } else {
            return method.invoke(target, args);
        }
    }
}

class TransactionDemo {
    public static void main(String[] args) {
        UserService realService = new UserServiceImpl();

        UserService proxy = (UserService) Proxy.newProxyInstance(
            UserService.class.getClassLoader(),
            new Class<?>[] { UserService.class },
            new TransactionHandler(realService)
        );

        proxy.createUser("Alice");
        System.out.println();
        String user = proxy.getUser(42);
        System.out.println("Got: " + user);
    }
}
```

### Proxy for Multiple Interfaces

```java
import java.lang.reflect.*;

interface Greeting {
    void sayHello(String name);
}

interface Farewell {
    void sayGoodbye(String name);
}

public class MultiInterfaceProxy {
    public static void main(String[] args) {
        // Create a proxy implementing multiple interfaces
        Object proxy = Proxy.newProxyInstance(
            MultiInterfaceProxy.class.getClassLoader(),
            new Class<?>[] { Greeting.class, Farewell.class },
            (proxyObj, method, methodArgs) -> {
                String name = (String) methodArgs[0];
                if (method.getName().equals("sayHello")) {
                    System.out.println("Hello, " + name + "!");
                } else if (method.getName().equals("sayGoodbye")) {
                    System.out.println("Goodbye, " + name + "!");
                }
                return null;
            }
        );

        // Cast to each interface and use
        ((Greeting) proxy).sayHello("World");
        ((Farewell) proxy).sayGoodbye("World");

        // Check proxy class
        System.out.println("Is proxy: " + Proxy.isProxyClass(proxy.getClass()));
        System.out.println("Proxy class: " + proxy.getClass().getName());
    }
}
```

## Use Cases and Applications

### Use Case 1: Object Mapper / Serialization

```java
import java.lang.reflect.*;
import java.util.*;

public class SimpleObjectMapper {

    public static Map<String, Object> toMap(Object obj) throws Exception {
        Map<String, Object> map = new LinkedHashMap<>();
        Class<?> clazz = obj.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            String name = field.getName();
            Object value = field.get(obj);

            // Skip static and transient fields
            int modifiers = field.getModifiers();
            if (Modifier.isStatic(modifiers) || Modifier.isTransient(modifiers)) {
                continue;
            }

            map.put(name, value);
        }
        return map;
    }

    public static <T> T fromMap(Map<String, Object> map, Class<T> clazz) throws Exception {
        T instance = clazz.getDeclaredConstructor().newInstance();

        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            String name = field.getName();

            if (map.containsKey(name)) {
                Object value = map.get(name);
                field.set(instance, value);
            }
        }
        return instance;
    }

    public static void main(String[] args) throws Exception {
        // Example usage
        class Person {
            private String name;
            private int age;
            private transient String password; // Will be skipped

            public Person() {}

            @Override
            public String toString() {
                return "Person{name='" + name + "', age=" + age + "}";
            }
        }

        Person person = new Person();
        Field nameField = Person.class.getDeclaredField("name");
        Field ageField = Person.class.getDeclaredField("age");
        nameField.setAccessible(true);
        ageField.setAccessible(true);
        nameField.set(person, "Alice");
        ageField.set(person, 30);

        // Convert to map
        Map<String, Object> map = toMap(person);
        System.out.println("As map: " + map);

        // Convert back to object
        Map<String, Object> data = new HashMap<>();
        data.put("name", "Bob");
        data.put("age", 25);
        Person restored = fromMap(data, Person.class);
        System.out.println("Restored: " + restored);
    }
}
```

### Use Case 2: Simple Dependency Injection Container

```java
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Service {}

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.CONSTRUCTOR})
@interface Autowired {}

public class SimpleContainer {
    private final Map<Class<?>, Object> instances = new HashMap<>();

    public void register(Class<?> clazz) throws Exception {
        if (!clazz.isAnnotationPresent(Service.class)) {
            throw new IllegalArgumentException("Class must be annotated with @Service");
        }

        Object instance = createInstance(clazz);
        instances.put(clazz, instance);

        // Also register by interfaces
        for (Class<?> iface : clazz.getInterfaces()) {
            instances.put(iface, instance);
        }
    }

    private Object createInstance(Class<?> clazz) throws Exception {
        // Find constructor (prefer @Autowired)
        Constructor<?> constructor = null;
        for (Constructor<?> c : clazz.getDeclaredConstructors()) {
            if (c.isAnnotationPresent(Autowired.class)) {
                constructor = c;
                break;
            }
        }
        if (constructor == null) {
            constructor = clazz.getDeclaredConstructor();
        }

        // Resolve constructor parameters
        Object[] args = new Object[constructor.getParameterCount()];
        Class<?>[] paramTypes = constructor.getParameterTypes();
        for (int i = 0; i < paramTypes.length; i++) {
            args[i] = instances.get(paramTypes[i]);
            if (args[i] == null) {
                throw new IllegalStateException(
                    "No instance found for " + paramTypes[i]);
            }
        }

        constructor.setAccessible(true);
        Object instance = constructor.newInstance(args);

        // Inject field dependencies
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Autowired.class)) {
                field.setAccessible(true);
                Object dependency = instances.get(field.getType());
                if (dependency == null) {
                    throw new IllegalStateException(
                        "No instance found for " + field.getType());
                }
                field.set(instance, dependency);
            }
        }

        return instance;
    }

    @SuppressWarnings("unchecked")
    public <T> T get(Class<T> clazz) {
        return (T) instances.get(clazz);
    }
}
```

### Use Case 3: Test Framework Runner

```java
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Test {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface BeforeEach {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface AfterEach {}

public class SimpleTestRunner {

    public static void runTests(Class<?> testClass) {
        System.out.println("Running tests in: " + testClass.getSimpleName());
        System.out.println("=".repeat(50));

        int passed = 0;
        int failed = 0;

        // Find setup/teardown methods
        Method beforeEach = null;
        Method afterEach = null;
        List<Method> testMethods = new ArrayList<>();

        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(BeforeEach.class)) {
                beforeEach = method;
            } else if (method.isAnnotationPresent(AfterEach.class)) {
                afterEach = method;
            } else if (method.isAnnotationPresent(Test.class)) {
                testMethods.add(method);
            }
        }

        // Run each test
        for (Method test : testMethods) {
            try {
                Object instance = testClass.getDeclaredConstructor().newInstance();

                // Before
                if (beforeEach != null) {
                    beforeEach.invoke(instance);
                }

                // Test
                test.invoke(instance);

                // After
                if (afterEach != null) {
                    afterEach.invoke(instance);
                }

                System.out.println("PASSED: " + test.getName());
                passed++;

            } catch (InvocationTargetException e) {
                System.out.println("FAILED: " + test.getName());
                System.out.println("  Cause: " + e.getTargetException().getMessage());
                failed++;
            } catch (Exception e) {
                System.out.println("ERROR: " + test.getName());
                System.out.println("  Cause: " + e.getMessage());
                failed++;
            }
        }

        System.out.println("=".repeat(50));
        System.out.println("Results: " + passed + " passed, " + failed + " failed");
    }
}

// Example test class
class CalculatorTest {
    private int value;

    @BeforeEach
    void setup() {
        value = 10;
    }

    @Test
    void testAddition() {
        assert value + 5 == 15 : "Addition failed";
    }

    @Test
    void testSubtraction() {
        assert value - 3 == 7 : "Subtraction failed";
    }

    @Test
    void testFailing() {
        throw new AssertionError("This test always fails");
    }

    @AfterEach
    void cleanup() {
        value = 0;
    }
}
```

### Use Case 4: Plugin System

```java
import java.lang.reflect.*;
import java.io.*;
import java.net.*;
import java.util.*;

interface Plugin {
    String getName();
    void execute();
}

public class PluginLoader {
    private final List<Plugin> plugins = new ArrayList<>();

    public void loadPlugins(String packageName) throws Exception {
        // In real applications, you would scan JAR files or directories
        // This is a simplified example using classpath scanning

        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        String path = packageName.replace('.', '/');

        // Find all classes implementing Plugin interface
        // (simplified - real implementation would use classpath scanning)
        String[] pluginClasses = {
            packageName + ".LoggingPlugin",
            packageName + ".MetricsPlugin"
        };

        for (String className : pluginClasses) {
            try {
                Class<?> clazz = Class.forName(className);

                if (Plugin.class.isAssignableFrom(clazz) &&
                    !clazz.isInterface() &&
                    !Modifier.isAbstract(clazz.getModifiers())) {

                    Plugin plugin = (Plugin) clazz.getDeclaredConstructor().newInstance();
                    plugins.add(plugin);
                    System.out.println("Loaded plugin: " + plugin.getName());
                }
            } catch (ClassNotFoundException e) {
                // Plugin class not found, skip
            }
        }
    }

    public void executeAll() {
        for (Plugin plugin : plugins) {
            System.out.println("Executing: " + plugin.getName());
            plugin.execute();
        }
    }
}
```

## Performance Considerations

Reflection is powerful but comes with performance overhead. Understanding these costs helps make informed decisions.

### Performance Comparison

```java
import java.lang.reflect.*;

public class ReflectionPerformance {
    private int value;

    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }

    public static void main(String[] args) throws Exception {
        ReflectionPerformance obj = new ReflectionPerformance();
        Method getter = obj.getClass().getMethod("getValue");
        Method setter = obj.getClass().getMethod("setValue", int.class);
        Field field = obj.getClass().getDeclaredField("value");
        field.setAccessible(true);

        int iterations = 10_000_000;
        long start, end;

        // Warm up
        for (int i = 0; i < 100_000; i++) {
            obj.setValue(i);
            obj.getValue();
        }

        // Direct access
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            obj.setValue(i);
            int v = obj.getValue();
        }
        end = System.nanoTime();
        System.out.println("Direct access: " + (end - start) / 1_000_000 + " ms");

        // Reflection method invocation
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            setter.invoke(obj, i);
            getter.invoke(obj);
        }
        end = System.nanoTime();
        System.out.println("Reflection methods: " + (end - start) / 1_000_000 + " ms");

        // Reflection field access
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            field.setInt(obj, i);
            field.getInt(obj);
        }
        end = System.nanoTime();
        System.out.println("Reflection fields: " + (end - start) / 1_000_000 + " ms");
    }
}
```

### Performance Optimization Tips

```java
import java.lang.reflect.*;
import java.util.*;

public class ReflectionOptimization {

    // 1. Cache reflection objects
    private static final Map<String, Method> methodCache = new HashMap<>();
    private static final Map<String, Field> fieldCache = new HashMap<>();

    public static Method getCachedMethod(Class<?> clazz, String name, Class<?>... params)
            throws NoSuchMethodException {
        String key = clazz.getName() + "#" + name;
        return methodCache.computeIfAbsent(key, k -> {
            try {
                Method method = clazz.getMethod(name, params);
                method.setAccessible(true);
                return method;
            } catch (NoSuchMethodException e) {
                throw new RuntimeException(e);
            }
        });
    }

    // 2. Use MethodHandle for better performance (Java 7+)
    public static void methodHandleExample() throws Throwable {
        java.lang.invoke.MethodHandles.Lookup lookup =
            java.lang.invoke.MethodHandles.lookup();
        java.lang.invoke.MethodType type =
            java.lang.invoke.MethodType.methodType(int.class);
        java.lang.invoke.MethodHandle handle =
            lookup.findVirtual(String.class, "length", type);

        String str = "Hello";
        int length = (int) handle.invoke(str);
        System.out.println("Length: " + length);
    }

    // 3. Avoid reflection in hot paths
    // Use interfaces and normal polymorphism instead

    // 4. Consider using code generation
    // Libraries like ByteBuddy or ASM can generate code at runtime
    // that avoids reflection overhead
}
```

### MethodHandle vs Reflection

```java
import java.lang.invoke.*;
import java.lang.reflect.*;

public class MethodHandleComparison {
    public String process(String input) {
        return input.toUpperCase();
    }

    public static void main(String[] args) throws Throwable {
        MethodHandleComparison obj = new MethodHandleComparison();

        // Traditional reflection
        Method method = obj.getClass().getMethod("process", String.class);

        // MethodHandle (more performant after warmup)
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        MethodType type = MethodType.methodType(String.class, String.class);
        MethodHandle handle = lookup.findVirtual(
            MethodHandleComparison.class, "process", type);

        // Both achieve the same result
        String result1 = (String) method.invoke(obj, "hello");
        String result2 = (String) handle.invoke(obj, "hello");

        System.out.println("Reflection result: " + result1);
        System.out.println("MethodHandle result: " + result2);

        // MethodHandle can be even faster with invokeExact
        MethodHandle boundHandle = handle.bindTo(obj);
        String result3 = (String) boundHandle.invokeExact("hello");
        System.out.println("Bound handle result: " + result3);
    }
}
```

## Security and Best Practices

### Security Considerations

```java
import java.lang.reflect.*;

public class ReflectionSecurity {

    // 1. Security Manager (deprecated in Java 17, removed in future versions)
    // In earlier versions, SecurityManager could restrict reflection

    // 2. Module system restrictions (Java 9+)
    // Modules can control what is accessible via reflection
    // use --add-opens to override (not recommended for production)

    // 3. setAccessible() considerations
    public static void accessPrivate() throws Exception {
        class Secret {
            private String password = "secret123";
        }

        Secret secret = new Secret();
        Field field = Secret.class.getDeclaredField("password");

        // This may throw InaccessibleObjectException in Java 9+
        // if the module doesn't open its packages
        try {
            field.setAccessible(true);
            System.out.println("Password: " + field.get(secret));
        } catch (Exception e) {
            System.out.println("Access denied: " + e.getMessage());
        }
    }

    // 4. Preventing reflection attacks on singletons
    public enum SecureSingleton {
        INSTANCE;

        // Enum singletons cannot be broken by reflection
        // Constructor.newInstance() throws IllegalArgumentException for enums
    }
}
```

### Best Practices

```java
import java.lang.reflect.*;
import java.util.*;

public class ReflectionBestPractices {

    // 1. Always cache reflection objects
    private static final Map<Class<?>, List<Field>> fieldCache =
        new WeakHashMap<>();

    public static List<Field> getFields(Class<?> clazz) {
        return fieldCache.computeIfAbsent(clazz, c -> {
            List<Field> fields = new ArrayList<>();
            for (Field f : c.getDeclaredFields()) {
                f.setAccessible(true);
                fields.add(f);
            }
            return Collections.unmodifiableList(fields);
        });
    }

    // 2. Handle exceptions properly
    public static Object invokeMethod(Object obj, String methodName, Object... args) {
        try {
            Class<?>[] paramTypes = new Class<?>[args.length];
            for (int i = 0; i < args.length; i++) {
                paramTypes[i] = args[i].getClass();
            }

            Method method = obj.getClass().getMethod(methodName, paramTypes);
            return method.invoke(obj, args);

        } catch (NoSuchMethodException e) {
            throw new IllegalArgumentException("Method not found: " + methodName, e);
        } catch (IllegalAccessException e) {
            throw new IllegalStateException("Cannot access method: " + methodName, e);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RuntimeException) {
                throw (RuntimeException) cause;
            }
            throw new RuntimeException("Method invocation failed", cause);
        }
    }

    // 3. Prefer interfaces over reflection when possible
    interface Processor {
        void process();
    }

    // Good: Using interface
    public static void runProcessor(Processor p) {
        p.process();
    }

    // Avoid: Using reflection when interface would work
    public static void runProcessorReflection(Object obj) throws Exception {
        Method m = obj.getClass().getMethod("process");
        m.invoke(obj);
    }

    // 4. Document reflection usage
    /**
     * Creates an instance of the specified class using reflection.
     * The class must have a public no-argument constructor.
     *
     * @param className fully qualified class name
     * @return new instance of the class
     * @throws ReflectionException if instantiation fails
     */
    public static Object createInstance(String className) {
        try {
            Class<?> clazz = Class.forName(className);
            return clazz.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create instance of " + className, e);
        }
    }

    // 5. Use try-with-resources or finally for cleanup when needed
    // (though reflection itself doesn't require cleanup)

    // 6. Validate inputs
    public static void setFieldValue(Object obj, String fieldName, Object value) {
        Objects.requireNonNull(obj, "Object cannot be null");
        Objects.requireNonNull(fieldName, "Field name cannot be null");

        try {
            Field field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);

            // Type check
            if (value != null && !field.getType().isAssignableFrom(value.getClass())) {
                throw new IllegalArgumentException(
                    "Value type " + value.getClass() +
                    " is not compatible with field type " + field.getType());
            }

            field.set(obj, value);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException("Failed to set field: " + fieldName, e);
        }
    }
}
```

### Java Module System and Reflection

```java
// In modular applications (Java 9+), you need to explicitly open packages
// for reflection access.

// module-info.java
/*
module com.example.myapp {
    // Export for compile-time access
    exports com.example.myapp.api;

    // Open for reflection (runtime access)
    opens com.example.myapp.model;

    // Open to specific modules only
    opens com.example.myapp.internal to com.example.framework;

    // Open entire module for reflection (not recommended)
    // open module com.example.myapp { ... }
}
*/

// Without proper opens declarations, reflection will throw:
// java.lang.reflect.InaccessibleObjectException

// Workaround for testing (not for production):
// java --add-opens java.base/java.lang=ALL-UNNAMED MyApp
```

## Summary

Java Reflection is a powerful feature that enables runtime introspection and manipulation of classes, methods, fields, and constructors.

### Key Takeaways

1. **Class Object**: The entry point for all reflection operations, obtained via `.class`, `getClass()`, or `Class.forName()`

2. **Field Access**: Discover, read, and modify fields at runtime, including private fields with `setAccessible(true)`

3. **Method Invocation**: Dynamically discover and invoke methods, handling parameters and return values

4. **Constructor Usage**: Create instances dynamically using any constructor

5. **Annotations**: Read annotation metadata at runtime, enabling framework development

6. **Dynamic Proxies**: Create proxy implementations of interfaces at runtime for AOP-style programming

7. **Performance**: Reflection is slower than direct access; cache reflection objects and consider MethodHandles for hot paths

8. **Security**: Be aware of module system restrictions in Java 9+ and handle access carefully

### When to Use Reflection

- **Do use** for frameworks, libraries, testing tools, and plugin systems
- **Avoid** in performance-critical code paths
- **Consider alternatives** like interfaces, generics, or code generation when possible

### Common Frameworks Using Reflection

- **Spring Framework**: Dependency injection, AOP, component scanning
- **Hibernate/JPA**: Object-relational mapping
- **JUnit/TestNG**: Test discovery and execution
- **Jackson/Gson**: JSON serialization/deserialization
- **Mockito**: Creating mock objects for testing

Reflection breaks encapsulation and can bypass access controls, so use it responsibly. When building applications, prefer compile-time type safety when possible, and reserve reflection for cases where dynamic behavior is truly necessary.
