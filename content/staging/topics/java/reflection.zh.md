---
title: 反射
description: Java 反射完整指南，Class 对象、动态代理和运行时类型信息
track: java
section: oop-generics
difficulty: advanced
tags:
  - Java
  - Reflection
  - Class
  - Dynamic Proxy
status: imported
origin: old/src/content/docs/java/reflection.zh.md
divergence: 0.216
issues: []
legacy:
  category: Java
  subcategory: Advanced Features
  order: 8
  lastUpdated: 2026-01-07
---

Java 反射是一种强大的机制，允许程序在运行时检查和修改类、接口、字段和方法的行为。它提供了在编译时不知道名称的情况下检查类结构、动态创建实例、调用方法和访问字段的能力。

## 反射简介

反射使 Java 代码能够发现已加载类的字段、方法和构造器的信息。它还允许在安全限制内使用反射成员对其底层对应物进行操作。

### 何时使用反射

反射常用于：

- **框架和库**：Spring、Hibernate、JUnit 广泛使用反射
- **IDE 功能**：代码补全、重构工具
- **序列化/反序列化**：JSON/XML 处理库
- **依赖注入**：动态创建和装配对象
- **测试**：访问私有方法和字段进行单元测试
- **插件系统**：在运行时加载和实例化类

### 基本示例

```java
import java.lang.reflect.*;

public class ReflectionIntro {
    public static void main(String[] args) throws Exception {
        // 获取 String 的 Class 对象
        Class<?> stringClass = String.class;

        // 打印所有声明的方法
        System.out.println("Methods of String class:");
        for (Method method : stringClass.getDeclaredMethods()) {
            System.out.println("  " + method.getName());
        }

        // 动态创建实例
        String str = (String) stringClass
            .getConstructor(String.class)
            .newInstance("Hello, Reflection!");

        System.out.println("Created string: " + str);

        // 动态调用方法
        Method lengthMethod = stringClass.getMethod("length");
        int length = (int) lengthMethod.invoke(str);
        System.out.println("String length: " + length);
    }
}
```

## Class 对象

`Class` 类是所有反射操作的入口点。Java 中的每种类型都有一个关联的 `Class` 对象，包含关于该类型的元数据。

### 获取 Class 对象

有几种方法可以获取 `Class` 对象：

```java
public class ObtainingClassObjects {
    public static void main(String[] args) throws Exception {
        // 1. 使用 .class 语法（编译时）
        Class<String> stringClass = String.class;
        Class<int[]> intArrayClass = int[].class;
        Class<Void> voidClass = void.class;

        // 2. 在实例上使用 getClass()（运行时）
        String str = "Hello";
        Class<?> strClass = str.getClass();

        // 3. 使用 Class.forName() 和完全限定名
        Class<?> listClass = Class.forName("java.util.ArrayList");

        // 4. 使用类加载器
        ClassLoader loader = Thread.currentThread().getContextClassLoader();
        Class<?> mapClass = loader.loadClass("java.util.HashMap");

        // 5. 对于基本类型
        Class<Integer> intWrapperClass = Integer.class;
        Class<?> intPrimitiveClass = Integer.TYPE; // 或 int.class

        // 验证它们是不同的
        System.out.println("int.class == Integer.class: " +
            (int.class == Integer.class)); // false
        System.out.println("int.class == Integer.TYPE: " +
            (int.class == Integer.TYPE));  // true
    }
}
```

### Class 对象属性

```java
public class ClassProperties {
    public static void main(String[] args) {
        Class<String> clazz = String.class;

        // 基本信息
        System.out.println("Name: " + clazz.getName());
        System.out.println("Simple Name: " + clazz.getSimpleName());
        System.out.println("Canonical Name: " + clazz.getCanonicalName());
        System.out.println("Package: " + clazz.getPackage().getName());

        // 类型检查
        System.out.println("Is Interface: " + clazz.isInterface());
        System.out.println("Is Array: " + clazz.isArray());
        System.out.println("Is Primitive: " + clazz.isPrimitive());
        System.out.println("Is Enum: " + clazz.isEnum());
        System.out.println("Is Annotation: " + clazz.isAnnotation());
        System.out.println("Is Record: " + clazz.isRecord());
        System.out.println("Is Sealed: " + clazz.isSealed());

        // 修饰符
        int modifiers = clazz.getModifiers();
        System.out.println("Is Public: " + Modifier.isPublic(modifiers));
        System.out.println("Is Final: " + Modifier.isFinal(modifiers));
        System.out.println("Is Abstract: " + Modifier.isAbstract(modifiers));

        // 继承层次
        System.out.println("Superclass: " + clazz.getSuperclass());
        System.out.println("Interfaces: " +
            java.util.Arrays.toString(clazz.getInterfaces()));
    }
}
```

### 使用泛型类型

```java
import java.lang.reflect.*;
import java.util.*;

public class GenericTypeInfo {
    private List<String> stringList;
    private Map<String, Integer> map;

    public static void main(String[] args) throws Exception {
        Field listField = GenericTypeInfo.class.getDeclaredField("stringList");
        Field mapField = GenericTypeInfo.class.getDeclaredField("map");

        // 获取泛型类型信息
        Type listType = listField.getGenericType();
        if (listType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) listType;
            System.out.println("Raw type: " + pt.getRawType());
            System.out.println("Type arguments: " +
                Arrays.toString(pt.getActualTypeArguments()));
        }

        // 带多个类型参数的 Map
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

## 检查类信息

反射提供对类结构的全面访问，包括继承层次、实现的接口和嵌套类。

### 类层次结构

```java
public class ClassHierarchy {
    public static void printHierarchy(Class<?> clazz) {
        System.out.println("Class Hierarchy for: " + clazz.getName());

        // 父类链
        System.out.println("\nSuperclass chain:");
        Class<?> current = clazz;
        int level = 0;
        while (current != null) {
            System.out.println("  ".repeat(level) + current.getName());
            current = current.getSuperclass();
            level++;
        }

        // 所有接口（包括继承的）
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

### 嵌套类和成员

```java
public class NestedClassInspection {
    public class InnerClass {}
    public static class StaticNestedClass {}
    private interface PrivateInterface {}

    public static void main(String[] args) {
        Class<?> clazz = NestedClassInspection.class;

        // 获取声明的类（包括私有的）
        System.out.println("Declared classes:");
        for (Class<?> nested : clazz.getDeclaredClasses()) {
            System.out.println("  " + nested.getSimpleName() +
                " (static: " + Modifier.isStatic(nested.getModifiers()) + ")");
        }

        // 只获取公共类
        System.out.println("\nPublic classes:");
        for (Class<?> nested : clazz.getClasses()) {
            System.out.println("  " + nested.getSimpleName());
        }

        // 检查外部类
        Class<?> inner = InnerClass.class;
        System.out.println("\nEnclosing class of InnerClass: " +
            inner.getEnclosingClass());
        System.out.println("Is member class: " + inner.isMemberClass());
        System.out.println("Is local class: " + inner.isLocalClass());
        System.out.println("Is anonymous class: " + inner.isAnonymousClass());
    }
}
```

## 使用字段

反射允许你在运行时发现、读取和修改字段，包括私有字段。

### 发现字段

```java
import java.lang.reflect.*;

public class FieldDiscovery {
    public String publicField = "public";
    private int privateField = 42;
    protected double protectedField = 3.14;
    static final String CONSTANT = "constant";

    public static void main(String[] args) {
        Class<?> clazz = FieldDiscovery.class;

        // getDeclaredFields() - 此类中声明的所有字段
        System.out.println("Declared fields:");
        for (Field field : clazz.getDeclaredFields()) {
            System.out.printf("  %s %s %s%n",
                Modifier.toString(field.getModifiers()),
                field.getType().getSimpleName(),
                field.getName());
        }

        // getFields() - 所有公共字段（包括继承的）
        System.out.println("\nPublic fields:");
        for (Field field : clazz.getFields()) {
            System.out.println("  " + field.getName());
        }
    }
}
```

### 读取和写入字段值

```java
import java.lang.reflect.*;

public class FieldAccess {
    private String name = "initial";
    private int count = 0;
    private static String staticField = "static value";

    public static void main(String[] args) throws Exception {
        FieldAccess instance = new FieldAccess();
        Class<?> clazz = instance.getClass();

        // 访问私有字段
        Field nameField = clazz.getDeclaredField("name");
        nameField.setAccessible(true); // 绕过访问控制

        // 读取值
        String currentName = (String) nameField.get(instance);
        System.out.println("Current name: " + currentName);

        // 写入值
        nameField.set(instance, "modified");
        System.out.println("Modified name: " + instance.name);

        // 访问静态字段
        Field staticF = clazz.getDeclaredField("staticField");
        staticF.setAccessible(true);
        System.out.println("Static field: " + staticF.get(null)); // 静态字段用 null
        staticF.set(null, "new static value");
        System.out.println("Modified static: " + staticField);

        // 使用基本类型
        Field countField = clazz.getDeclaredField("count");
        countField.setAccessible(true);
        countField.setInt(instance, 100);
        System.out.println("Count: " + countField.getInt(instance));
    }
}
```

### 修改 Final 字段

```java
import java.lang.reflect.*;

public class FinalFieldModification {
    private final String finalField = "original";
    private static final int STATIC_FINAL = 42;

    public static void main(String[] args) throws Exception {
        FinalFieldModification instance = new FinalFieldModification();

        // 修改实例 final 字段
        Field field = FinalFieldModification.class.getDeclaredField("finalField");
        field.setAccessible(true);

        // 这对实例字段有效
        field.set(instance, "modified");
        System.out.println("Final field: " + field.get(instance));

        // 注意：修改 static final 字段更复杂
        // 由于常量折叠和其他优化，可能在现代 JVM 中无法可靠工作
    }
}
```

## 使用方法

方法反射允许在运行时动态发现和调用方法。

### 发现方法

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
            // 方法签名
            StringBuilder sb = new StringBuilder();
            sb.append(Modifier.toString(method.getModifiers())).append(" ");
            sb.append(method.getReturnType().getSimpleName()).append(" ");
            sb.append(method.getName()).append("(");

            // 参数
            Parameter[] params = method.getParameters();
            for (int i = 0; i < params.length; i++) {
                if (i > 0) sb.append(", ");
                sb.append(params[i].getType().getSimpleName());
                sb.append(" ").append(params[i].getName());
            }
            sb.append(")");

            // 异常
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

### 调用方法

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

        // 调用带参数的公共方法
        Method greetMethod = clazz.getMethod("greet", String.class);
        String result = (String) greetMethod.invoke(instance, "World");
        System.out.println(result); // Hello, World!

        // 调用带基本类型参数的方法
        Method addMethod = clazz.getMethod("add", int.class, int.class);
        int sum = (int) addMethod.invoke(instance, 5, 3);
        System.out.println("Sum: " + sum); // Sum: 8

        // 调用私有方法
        Method privateMethod = clazz.getDeclaredMethod("privateMethod");
        privateMethod.setAccessible(true);
        privateMethod.invoke(instance);

        // 调用静态方法
        Method staticMethod = clazz.getMethod("staticMethod", String.class);
        String upper = (String) staticMethod.invoke(null, "hello");
        System.out.println(upper); // HELLO
    }
}
```

### 可变参数方法

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

        // 可变参数方法有数组参数类型
        Method printAll = clazz.getMethod("printAll", String[].class);
        System.out.println("Is varargs: " + printAll.isVarArgs());

        // 用数组调用
        printAll.invoke(instance, (Object) new String[]{"a", "b", "c"});

        // 带可变参数的 sum
        Method sumMethod = clazz.getMethod("sum", int.class, int[].class);
        int result = (int) sumMethod.invoke(instance, 10, new int[]{20, 30, 40});
        System.out.println("Sum: " + result); // 100
    }
}
```

## 使用构造器

构造器反射允许使用任何构造器动态实例化对象。

### 发现构造器

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

### 创建实例

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

        // 使用 Class.newInstance() - 在 Java 9+ 中已弃用
        // 只对无参构造器有效
        // InstanceCreation obj1 = clazz.newInstance();

        // 使用 Constructor.newInstance() - 推荐
        
        // 无参构造器
        Constructor<?> noArg = clazz.getConstructor();
        InstanceCreation obj1 = (InstanceCreation) noArg.newInstance();
        System.out.println(obj1);

        // 单参数构造器
        Constructor<?> singleArg = clazz.getConstructor(String.class);
        InstanceCreation obj2 = (InstanceCreation) singleArg.newInstance("Alice");
        System.out.println(obj2);

        // 双参数构造器
        Constructor<?> twoArgs = clazz.getConstructor(String.class, int.class);
        InstanceCreation obj3 = (InstanceCreation) twoArgs.newInstance("Bob", 25);
        System.out.println(obj3);
    }
}
```

### 私有构造器

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
        // 正常方式 - 使用工厂方法
        PrivateConstructorAccess obj1 = PrivateConstructorAccess.getInstance();

        // 通过反射破坏单例
        Constructor<PrivateConstructorAccess> constructor =
            PrivateConstructorAccess.class.getDeclaredConstructor();
        constructor.setAccessible(true);

        PrivateConstructorAccess obj2 = constructor.newInstance();
        PrivateConstructorAccess obj3 = constructor.newInstance();

        System.out.println("Same instance? " + (obj2 == obj3)); // false
    }
}
```

## 使用数组

反射通过 `java.lang.reflect.Array` 类为数组类型提供特殊支持。

### 动态创建数组

```java
import java.lang.reflect.*;

public class ArrayReflection {
    public static void main(String[] args) {
        // 创建一维数组
        int[] intArray = (int[]) Array.newInstance(int.class, 5);

        // 设置值
        for (int i = 0; i < 5; i++) {
            Array.setInt(intArray, i, i * 10);
        }

        // 获取值
        System.out.println("Int array:");
        for (int i = 0; i < Array.getLength(intArray); i++) {
            System.out.println("  [" + i + "] = " + Array.getInt(intArray, i));
        }

        // 创建多维数组
        int[][] matrix = (int[][]) Array.newInstance(int.class, 3, 4);
        Array.set(matrix, 0, new int[]{1, 2, 3, 4});

        // 创建对象数组
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

### 数组类型信息

```java
import java.lang.reflect.*;

public class ArrayTypeInfo {
    public static void main(String[] args) {
        // 不同的数组类型
        Class<?> intArrayClass = int[].class;
        Class<?> stringArrayClass = String[].class;
        Class<?> objectArrayClass = Object[].class;
        Class<?> multiDimClass = int[][].class;

        // 检查类是否是数组
        System.out.println("int[] is array: " + intArrayClass.isArray());
        System.out.println("String is array: " + String.class.isArray());

        // 获取组件类型
        System.out.println("\nComponent types:");
        System.out.println("int[] component: " + intArrayClass.getComponentType());
        System.out.println("String[] component: " + stringArrayClass.getComponentType());
        System.out.println("int[][] component: " + multiDimClass.getComponentType());

        // 数组类名
        System.out.println("\nArray class names:");
        System.out.println("int[]: " + intArrayClass.getName());
        System.out.println("String[]: " + stringArrayClass.getName());
        System.out.println("int[][]: " + multiDimClass.getName());
    }
}
```

## 注解和反射

反射对于在运行时读取注解至关重要，使得 Spring 和 JUnit 等框架成为可能。

### 读取注解

```java
import java.lang.annotation.*;
import java.lang.reflect.*;

// 定义自定义注解
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

// 使用注解
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

        // 类级别注解
        if (clazz.isAnnotationPresent(Entity.class)) {
            Entity entity = clazz.getAnnotation(Entity.class);
            System.out.println("Entity table: " + entity.table());
        }

        // 字段注解
        System.out.println("\nField annotations:");
        for (Field field : clazz.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column != null) {
                System.out.printf("  %s -> column '%s', nullable: %b%n",
                    field.getName(), column.name(), column.nullable());
            }
        }

        // 方法注解
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

### 注解处理示例

```java
import java.lang.annotation.*;
import java.lang.reflect.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Inject {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Component {}

// 简单的依赖注入示例
public class SimpleInjector {

    public static <T> T createInstance(Class<T> clazz) throws Exception {
        T instance = clazz.getDeclaredConstructor().newInstance();

        // 处理 @Inject 注解
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Inject.class)) {
                field.setAccessible(true);
                Class<?> fieldType = field.getType();

                // 递归创建和注入依赖
                Object dependency = createInstance(fieldType);
                field.set(instance, dependency);
            }
        }

        return instance;
    }
}

// 使用
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

## 动态代理

Java 动态代理是一个强大的功能，允许在运行时创建接口的代理实现。

### 基本动态代理

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

        // 创建一个记录所有方法调用的代理
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

        // 使用代理
        System.out.println("Sum: " + proxy.add(5, 3));
        System.out.println("Difference: " + proxy.subtract(10, 4));
        System.out.println("Product: " + proxy.multiply(6, 7));
    }
}
```

### 可重用的调用处理器

```java
import java.lang.reflect.*;

// 通用日志处理器
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

### 事务代理示例

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
        // 从目标类获取方法以检查注解
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

### 多接口代理

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
        // 创建实现多个接口的代理
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

        // 转换为每个接口并使用
        ((Greeting) proxy).sayHello("World");
        ((Farewell) proxy).sayGoodbye("World");

        // 检查代理类
        System.out.println("Is proxy: " + Proxy.isProxyClass(proxy.getClass()));
        System.out.println("Proxy class: " + proxy.getClass().getName());
    }
}
```

## 用例和应用

### 用例 1：对象映射器/序列化

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

            // 跳过静态和瞬态字段
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
        // 使用示例
        class Person {
            private String name;
            private int age;
            private transient String password; // 将被跳过

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

        // 转换为 map
        Map<String, Object> map = toMap(person);
        System.out.println("As map: " + map);

        // 转换回对象
        Map<String, Object> data = new HashMap<>();
        data.put("name", "Bob");
        data.put("age", 25);
        Person restored = fromMap(data, Person.class);
        System.out.println("Restored: " + restored);
    }
}
```

### 用例 2：简单的依赖注入容器

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

        // 也按接口注册
        for (Class<?> iface : clazz.getInterfaces()) {
            instances.put(iface, instance);
        }
    }

    private Object createInstance(Class<?> clazz) throws Exception {
        // 查找构造器（优先 @Autowired）
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

        // 解析构造器参数
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

        // 注入字段依赖
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

### 用例 3：测试框架运行器

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

        // 查找 setup/teardown 方法
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

        // 运行每个测试
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

// 示例测试类
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

### 用例 4：插件系统

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
        // 在实际应用中，你会扫描 JAR 文件或目录
        // 这是使用类路径扫描的简化示例

        ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
        String path = packageName.replace('.', '/');

        // 查找所有实现 Plugin 接口的类
        // （简化 - 实际实现会使用类路径扫描）
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
                // 未找到插件类，跳过
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

## 性能考虑

反射功能强大但有性能开销。理解这些成本有助于做出明智的决策。

### 性能比较

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

        // 预热
        for (int i = 0; i < 100_000; i++) {
            obj.setValue(i);
            obj.getValue();
        }

        // 直接访问
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            obj.setValue(i);
            int v = obj.getValue();
        }
        end = System.nanoTime();
        System.out.println("Direct access: " + (end - start) / 1_000_000 + " ms");

        // 反射方法调用
        start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            setter.invoke(obj, i);
            getter.invoke(obj);
        }
        end = System.nanoTime();
        System.out.println("Reflection methods: " + (end - start) / 1_000_000 + " ms");

        // 反射字段访问
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

### 性能优化技巧

```java
import java.lang.reflect.*;
import java.util.*;

public class ReflectionOptimization {

    // 1. 缓存反射对象
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

    // 2. 使用 MethodHandle 获得更好的性能（Java 7+）
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

    // 3. 避免在热点路径中使用反射
    // 改用接口和普通多态

    // 4. 考虑使用代码生成
    // 像 ByteBuddy 或 ASM 这样的库可以在运行时生成代码
    // 避免反射开销
}
```

### MethodHandle vs 反射

```java
import java.lang.invoke.*;
import java.lang.reflect.*;

public class MethodHandleComparison {
    public String process(String input) {
        return input.toUpperCase();
    }

    public static void main(String[] args) throws Throwable {
        MethodHandleComparison obj = new MethodHandleComparison();

        // 传统反射
        Method method = obj.getClass().getMethod("process", String.class);

        // MethodHandle（预热后性能更好）
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        MethodType type = MethodType.methodType(String.class, String.class);
        MethodHandle handle = lookup.findVirtual(
            MethodHandleComparison.class, "process", type);

        // 两者都能实现相同的结果
        String result1 = (String) method.invoke(obj, "hello");
        String result2 = (String) handle.invoke(obj, "hello");

        System.out.println("Reflection result: " + result1);
        System.out.println("MethodHandle result: " + result2);

        // MethodHandle 使用 invokeExact 可以更快
        MethodHandle boundHandle = handle.bindTo(obj);
        String result3 = (String) boundHandle.invokeExact("hello");
        System.out.println("Bound handle result: " + result3);
    }
}
```

## 安全和最佳实践

### 安全考虑

```java
import java.lang.reflect.*;

public class ReflectionSecurity {

    // 1. 安全管理器（在 Java 17 中已弃用，未来版本将移除）
    // 在早期版本中，SecurityManager 可以限制反射

    // 2. 模块系统限制（Java 9+）
    // 模块可以控制通过反射访问的内容
    // 使用 --add-opens 覆盖（不推荐用于生产）

    // 3. setAccessible() 考虑
    public static void accessPrivate() throws Exception {
        class Secret {
            private String password = "secret123";
        }

        Secret secret = new Secret();
        Field field = Secret.class.getDeclaredField("password");

        // 在 Java 9+ 中如果模块没有打开其包，这可能会抛出 InaccessibleObjectException
        try {
            field.setAccessible(true);
            System.out.println("Password: " + field.get(secret));
        } catch (Exception e) {
            System.out.println("Access denied: " + e.getMessage());
        }
    }

    // 4. 防止对单例的反射攻击
    public enum SecureSingleton {
        INSTANCE;

        // 枚举单例不能被反射破坏
        // Constructor.newInstance() 对枚举抛出 IllegalArgumentException
    }
}
```

### 最佳实践

```java
import java.lang.reflect.*;
import java.util.*;

public class ReflectionBestPractices {

    // 1. 总是缓存反射对象
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

    // 2. 正确处理异常
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

    // 3. 尽可能优先使用接口而非反射
    interface Processor {
        void process();
    }

    // 好：使用接口
    public static void runProcessor(Processor p) {
        p.process();
    }

    // 避免：当接口可以工作时使用反射
    public static void runProcessorReflection(Object obj) throws Exception {
        Method m = obj.getClass().getMethod("process");
        m.invoke(obj);
    }

    // 4. 记录反射使用
    /**
     * 使用反射创建指定类的实例。
     * 该类必须有一个公共的无参构造器。
     *
     * @param className 完全限定的类名
     * @return 类的新实例
     * @throws ReflectionException 如果实例化失败
     */
    public static Object createInstance(String className) {
        try {
            Class<?> clazz = Class.forName(className);
            return clazz.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create instance of " + className, e);
        }
    }

    // 5. 需要时使用 try-with-resources 或 finally 进行清理
    // （虽然反射本身不需要清理）

    // 6. 验证输入
    public static void setFieldValue(Object obj, String fieldName, Object value) {
        Objects.requireNonNull(obj, "Object cannot be null");
        Objects.requireNonNull(fieldName, "Field name cannot be null");

        try {
            Field field = obj.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);

            // 类型检查
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

### Java 模块系统和反射

```java
// 在模块化应用程序中（Java 9+），你需要显式打开包以进行反射访问。

// module-info.java
/*
module com.example.myapp {
    // 导出用于编译时访问
    exports com.example.myapp.api;

    // 打开用于反射（运行时访问）
    opens com.example.myapp.model;

    // 只打开给特定模块
    opens com.example.myapp.internal to com.example.framework;

    // 打开整个模块用于反射（不推荐）
    // open module com.example.myapp { ... }
}
*/

// 没有正确的 opens 声明，反射将抛出：
// java.lang.reflect.InaccessibleObjectException

// 测试的变通方法（不用于生产）：
// java --add-opens java.base/java.lang=ALL-UNNAMED MyApp
```

## 总结

Java 反射是一个强大的功能，允许在运行时内省和操作类、方法、字段和构造器。

### 关键要点

1. **Class 对象**：所有反射操作的入口点，通过 `.class`、`getClass()` 或 `Class.forName()` 获取

2. **字段访问**：在运行时发现、读取和修改字段，包括使用 `setAccessible(true)` 访问私有字段

3. **方法调用**：动态发现和调用方法，处理参数和返回值

4. **构造器使用**：使用任何构造器动态创建实例

5. **注解**：在运行时读取注解元数据，支持框架开发

6. **动态代理**：在运行时创建接口的代理实现，用于 AOP 风格编程

7. **性能**：反射比直接访问慢；缓存反射对象，对热点路径考虑使用 MethodHandles

8. **安全**：注意 Java 9+ 中的模块系统限制，谨慎处理访问

### 何时使用反射

- **适合使用**：框架、库、测试工具和插件系统
- **避免**：性能关键的代码路径
- **考虑替代方案**：如果可能，使用接口、泛型或代码生成

### 使用反射的常见框架

- **Spring Framework**：依赖注入、AOP、组件扫描
- **Hibernate/JPA**：对象关系映射
- **JUnit/TestNG**：测试发现和执行
- **Jackson/Gson**：JSON 序列化/反序列化
- **Mockito**：为测试创建模拟对象

反射破坏了封装并可以绕过访问控制，因此要负责任地使用它。在构建应用程序时，尽可能优先使用编译时类型安全，将反射保留给真正需要动态行为的情况。
