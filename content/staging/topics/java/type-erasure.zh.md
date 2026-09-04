---
title: Java 类型擦除
description: 深入理解 Java 类型擦除机制：原理剖析、桥接方法、限制与变通方案、泛型具体化
track: java
section: oop-generics
difficulty: advanced
tags:
  - Java
  - 泛型
  - 类型擦除
  - 桥接方法
  - 反射
status: imported
origin: old/src/content/docs/java/type-erasure.zh.md
divergence: 0.229
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: Java
  subcategory: 泛型
  order: 4
  lastUpdated: 2026-01-07
---

类型擦除（Type Erasure）是 Java 泛型实现的核心机制。理解类型擦除对于深入掌握 Java 泛型、排查相关问题以及编写健壮的泛型代码至关重要。本文将全面剖析类型擦除的工作原理、带来的限制以及各种变通方案。

## 概念解释

类型擦除是 Java 编译器用于实现泛型的一种技术。在编译阶段，编译器会将所有泛型类型参数替换为它们的边界类型（如果没有指定边界则替换为 `Object`），并在必要的地方插入类型转换代码，从而生成普通的非泛型字节码。

### 为什么选择类型擦除

Java 5 引入泛型时，设计者面临一个重要决策：如何在不破坏现有代码的前提下添加泛型支持？

Java 团队最终选择了类型擦除方案，主要基于以下考量：

1. **向后兼容性**：泛型代码可以与 Java 5 之前的遗留代码无缝互操作
2. **二进制兼容性**：旧版本编译的类文件无需重新编译即可与新版本一起工作
3. **迁移兼容性**：允许渐进式地将非泛型代码迁移到泛型代码

### 与其他语言的对比

不同语言对泛型的实现方式各异：

| 语言 | 实现方式 | 特点 |
|------|---------|------|
| Java | 类型擦除 | 运行时无泛型信息，向后兼容 |
| C# | 具体化泛型 | 运行时保留类型信息，支持值类型泛型 |
| C++ | 模板 | 编译时代码生成，完全类型安全 |
| Kotlin | 类型擦除 + 内联具体化 | 兼容 JVM，通过 reified 关键字部分解决 |

## 核心原理

### 类型擦除的工作流程

编译器在处理泛型代码时执行以下步骤：

```java
// 步骤 1：原始泛型代码
public class Box<T> {
    private T value;

    public void set(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }
}

// 步骤 2：类型擦除后的代码（概念上）
public class Box {
    private Object value;

    public void set(Object value) {
        this.value = value;
    }

    public Object get() {
        return value;
    }
}
```

### 擦除规则详解

类型擦除遵循以下规则：

#### 规则 1：无界类型参数擦除为 Object

```java
// 擦除前
public class Container<T> {
    private T item;
}

// 擦除后
public class Container {
    private Object item;
}
```

#### 规则 2：有界类型参数擦除为第一个边界

```java
// 擦除前
public class NumberContainer<T extends Number> {
    private T number;

    public double getDoubleValue() {
        return number.doubleValue();
    }
}

// 擦除后
public class NumberContainer {
    private Number number;  // 擦除为边界类型 Number

    public double getDoubleValue() {
        return number.doubleValue();
    }
}
```

#### 规则 3：多重边界擦除为第一个边界

```java
// 擦除前
public class MultiContainer<T extends Comparable<T> & Serializable> {
    private T item;
}

// 擦除后
public class MultiContainer {
    private Comparable item;  // 擦除为第一个边界 Comparable
}
```

#### 规则 4：通配符类型的擦除

```java
// 擦除前
public void process(List<? extends Number> list) {
    Number n = list.get(0);
}

// 擦除后
public void process(List list) {
    Number n = (Number) list.get(0);  // 插入类型转换
}
```

### 编译器插入的类型转换

当从泛型容器获取元素时，编译器会自动插入必要的类型转换：

```java
// 源代码
List<String> list = new ArrayList<>();
list.add("Hello");
String s = list.get(0);

// 编译后的等效代码
List list = new ArrayList();
list.add("Hello");
String s = (String) list.get(0);  // 编译器插入的类型转换
```

### 字节码分析

使用 `javap -c` 可以查看编译后的字节码，验证类型擦除的效果：

```java
// 源代码
public class TypeErasureDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("Hello");
        String s = list.get(0);
    }
}
```

```
// 部分字节码输出
public static void main(java.lang.String[]);
  Code:
    0: new           #2    // class java/util/ArrayList
    3: dup
    4: invokespecial #3    // Method java/util/ArrayList."<init>":()V
    7: astore_1
    8: aload_1
    9: ldc           #4    // String Hello
   11: invokeinterface #5, 2  // InterfaceMethod java/util/List.add:(Ljava/lang/Object;)Z
   16: pop
   17: aload_1
   18: iconst_0
   19: invokeinterface #6, 2  // InterfaceMethod java/util/List.get:(I)Ljava/lang/Object;
   24: checkcast     #7    // class java/lang/String  <- 类型转换
   27: astore_2
```

## 核心要点

### 桥接方法（Bridge Methods）

桥接方法是编译器为保持多态性而自动生成的合成方法。当子类继承泛型父类并具体化类型参数时，就会产生桥接方法。

#### 桥接方法产生的原因

```java
// 父类
public class Node<T> {
    private T data;

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}

// 子类
public class IntegerNode extends Node<Integer> {
    @Override
    public Integer getData() {
        return super.getData();
    }

    @Override
    public void setData(Integer data) {
        super.setData(data);
    }
}
```

类型擦除后，父类 `Node` 变为：

```java
public class Node {
    private Object data;

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }
}
```

问题出现了：`IntegerNode.setData(Integer)` 的签名与父类 `Node.setData(Object)` 不匹配。为了保持多态性，编译器生成桥接方法：

```java
public class IntegerNode extends Node {
    // 用户定义的方法
    public Integer getData() {
        return (Integer) super.getData();
    }

    public void setData(Integer data) {
        super.setData(data);
    }

    // 编译器生成的桥接方法
    public Object getData() {           // 桥接方法
        return getData();               // 调用 Integer getData()
    }

    public void setData(Object data) {  // 桥接方法
        setData((Integer) data);        // 调用 void setData(Integer)
    }
}
```

#### 识别桥接方法

可以通过反射识别桥接方法：

```java
import java.lang.reflect.Method;

public class BridgeMethodDemo {
    public static void main(String[] args) {
        for (Method method : IntegerNode.class.getDeclaredMethods()) {
            System.out.printf(
                "方法: %s, 桥接方法: %s, 合成方法: %s%n",
                method.getName(),
                method.isBridge(),
                method.isSynthetic()
            );
        }
    }
}

// 输出:
// 方法: getData, 桥接方法: false, 合成方法: false
// 方法: getData, 桥接方法: true, 合成方法: true
// 方法: setData, 桥接方法: false, 合成方法: false
// 方法: setData, 桥接方法: true, 合成方法: true
```

#### 桥接方法的实际影响

桥接方法通常对开发者透明，但在以下场景需要注意：

```java
// 使用反射获取方法时可能获取到桥接方法
Method[] methods = IntegerNode.class.getMethods();
for (Method m : methods) {
    if (m.getName().equals("setData")) {
        // 可能匹配到桥接方法 setData(Object) 或原始方法 setData(Integer)
        if (!m.isBridge()) {
            // 只处理非桥接方法
            System.out.println("原始方法: " + m);
        }
    }
}
```

### 类型擦除带来的限制

#### 限制 1：无法使用基本类型作为类型参数

```java
// 编译错误
// List<int> intList = new ArrayList<>();

// 正确：使用包装类
List<Integer> intList = new ArrayList<>();

// Java 会自动装箱和拆箱
intList.add(42);        // 自动装箱
int value = intList.get(0);  // 自动拆箱
```

#### 限制 2：运行时无法获取泛型类型参数

```java
public class TypeCheckDemo {
    public static void main(String[] args) {
        List<String> stringList = new ArrayList<>();
        List<Integer> intList = new ArrayList<>();

        // 运行时类型相同
        System.out.println(stringList.getClass() == intList.getClass());  // true

        // 无法使用 instanceof 检查参数化类型
        // if (stringList instanceof List<String>) { }  // 编译错误

        // 只能检查原始类型
        if (stringList instanceof List<?>) {
            System.out.println("是 List 类型");
        }
    }
}
```

#### 限制 3：无法创建泛型数组

```java
// 编译错误：无法创建泛型数组
// T[] array = new T[10];
// List<String>[] stringLists = new List<String>[10];

// 原因：数组在运行时知道其元素类型，但泛型信息被擦除
// 如果允许创建，可能导致堆污染（Heap Pollution）

// 变通方案 1：使用通配符
List<?>[] wildcardLists = new List<?>[10];

// 变通方案 2：使用 ArrayList
List<List<String>> listOfLists = new ArrayList<>();

// 变通方案 3：使用反射
@SuppressWarnings("unchecked")
public static <T> T[] createArray(Class<T> clazz, int size) {
    return (T[]) Array.newInstance(clazz, size);
}
```

#### 限制 4：无法创建泛型类型的实例

```java
public class Factory<T> {
    // 编译错误
    // public T create() {
    //     return new T();  // 无法实例化类型参数
    // }

    // 变通方案 1：传入 Class 对象
    private Class<T> clazz;

    public Factory(Class<T> clazz) {
        this.clazz = clazz;
    }

    public T create() throws Exception {
        return clazz.getDeclaredConstructor().newInstance();
    }

    // 变通方案 2：使用 Supplier
    public static <T> T create(Supplier<T> supplier) {
        return supplier.get();
    }
}

// 使用
Factory<String> factory = new Factory<>(String.class);
String s = factory.create();

String s2 = Factory.create(String::new);
```

#### 限制 5：泛型类的静态上下文限制

```java
public class StaticGenericDemo<T> {
    // 编译错误：静态字段不能使用类的类型参数
    // private static T value;

    // 编译错误：静态方法不能使用类的类型参数
    // public static T getValue() {
    //     return value;
    // }

    // 正确：静态方法可以定义自己的类型参数
    public static <E> E process(E input) {
        return input;
    }
}
```

#### 限制 6：异常处理的限制

```java
// 编译错误：不能声明泛型异常类
// public class GenericException<T> extends Exception { }

// 编译错误：不能在 catch 子句中使用类型参数
// public <T extends Exception> void handle() {
//     try {
//         // ...
//     } catch (T e) {  // 错误
//         // ...
//     }
// }

// 正确：可以在 throws 子句中使用类型参数
public <T extends Exception> void process(Class<T> exceptionClass) throws T {
    try {
        // 业务逻辑
    } catch (Exception e) {
        throw exceptionClass.cast(e);
    }
}
```

### 堆污染（Heap Pollution）

堆污染发生在参数化类型的变量引用了不属于该参数化类型的对象时：

```java
public class HeapPollutionDemo {
    public static void main(String[] args) {
        List<String> stringList = new ArrayList<>();
        List rawList = stringList;  // 原始类型赋值

        rawList.add(42);  // 编译警告，但运行通过 - 堆污染！

        // 稍后使用时会抛出 ClassCastException
        for (String s : stringList) {  // 运行时错误
            System.out.println(s);
        }
    }

    // 可变参数也可能导致堆污染
    @SafeVarargs  // 使用此注解表示方法不会导致堆污染
    public static <T> void addToList(List<T> list, T... elements) {
        for (T element : elements) {
            list.add(element);
        }
    }
}
```

## 代码示例

### 示例 1：理解类型擦除的影响

```java
import java.util.*;

public class TypeErasureExample {

    // 方法重载失败示例
    // 以下两个方法在类型擦除后签名相同，无法重载

    // public void process(List<String> list) { }
    // public void process(List<Integer> list) { }  // 编译错误

    // 解决方案：使用不同的方法名或添加额外参数
    public void processStrings(List<String> list) {
        for (String s : list) {
            System.out.println("String: " + s);
        }
    }

    public void processIntegers(List<Integer> list) {
        for (Integer i : list) {
            System.out.println("Integer: " + i);
        }
    }

    // 或使用泛型方法
    public <T> void process(List<T> list, Class<T> type) {
        for (T item : list) {
            System.out.println(type.getSimpleName() + ": " + item);
        }
    }

    public static void main(String[] args) {
        TypeErasureExample demo = new TypeErasureExample();

        List<String> strings = Arrays.asList("A", "B", "C");
        List<Integer> integers = Arrays.asList(1, 2, 3);

        demo.process(strings, String.class);
        demo.process(integers, Integer.class);
    }
}
```

### 示例 2：通过类型令牌保存类型信息

```java
import java.lang.reflect.*;
import java.util.*;

/**
 * 类型安全的异构容器
 * 使用 Class 对象作为类型令牌（Type Token）
 */
public class TypeSafeContainer {
    private Map<Class<?>, Object> container = new HashMap<>();

    public <T> void put(Class<T> type, T instance) {
        container.put(type, instance);
    }

    public <T> T get(Class<T> type) {
        return type.cast(container.get(type));
    }

    public static void main(String[] args) {
        TypeSafeContainer container = new TypeSafeContainer();

        container.put(String.class, "Hello");
        container.put(Integer.class, 42);
        container.put(List.class, Arrays.asList(1, 2, 3));

        String s = container.get(String.class);
        Integer i = container.get(Integer.class);
        List<?> list = container.get(List.class);

        System.out.println("String: " + s);
        System.out.println("Integer: " + i);
        System.out.println("List: " + list);
    }
}
```

### 示例 3：使用超类型令牌（Super Type Token）

```java
import java.lang.reflect.*;
import java.util.*;

/**
 * 超类型令牌 - 解决泛型类型信息保留问题
 * 基于 Neal Gafter 的设计
 */
public abstract class TypeReference<T> {
    private final Type type;

    protected TypeReference() {
        Type superclass = getClass().getGenericSuperclass();
        if (superclass instanceof ParameterizedType) {
            this.type = ((ParameterizedType) superclass).getActualTypeArguments()[0];
        } else {
            throw new RuntimeException("Missing type parameter");
        }
    }

    public Type getType() {
        return type;
    }

    @Override
    public String toString() {
        return type.getTypeName();
    }
}

// 使用示例
public class SuperTypeTokenDemo {
    public static void main(String[] args) {
        // 创建匿名子类以捕获泛型类型信息
        TypeReference<List<String>> listStringType = new TypeReference<List<String>>() {};
        TypeReference<Map<String, Integer>> mapType = new TypeReference<Map<String, Integer>>() {};

        System.out.println(listStringType);  // java.util.List<java.lang.String>
        System.out.println(mapType);         // java.util.Map<java.lang.String, java.lang.Integer>

        // 可以获取参数化类型的详细信息
        Type type = listStringType.getType();
        if (type instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) type;
            System.out.println("原始类型: " + pt.getRawType());
            System.out.println("类型参数: " + Arrays.toString(pt.getActualTypeArguments()));
        }
    }
}
```

### 示例 4：泛型数组的创建与处理

```java
import java.lang.reflect.Array;
import java.util.*;

public class GenericArrayDemo<T> {
    private T[] array;
    private Class<T> componentType;

    @SuppressWarnings("unchecked")
    public GenericArrayDemo(Class<T> componentType, int size) {
        this.componentType = componentType;
        // 使用反射创建泛型数组
        this.array = (T[]) Array.newInstance(componentType, size);
    }

    public void set(int index, T value) {
        array[index] = value;
    }

    public T get(int index) {
        return array[index];
    }

    public T[] getArray() {
        return array;
    }

    // 另一种方式：使用 Object 数组内部存储
    public static class GenericStack<E> {
        private Object[] elements;
        private int size = 0;
        private static final int DEFAULT_CAPACITY = 16;

        public GenericStack() {
            elements = new Object[DEFAULT_CAPACITY];
        }

        public void push(E element) {
            ensureCapacity();
            elements[size++] = element;
        }

        @SuppressWarnings("unchecked")
        public E pop() {
            if (size == 0) {
                throw new EmptyStackException();
            }
            E result = (E) elements[--size];
            elements[size] = null;  // 消除过期引用
            return result;
        }

        private void ensureCapacity() {
            if (size == elements.length) {
                elements = Arrays.copyOf(elements, 2 * size + 1);
            }
        }
    }

    public static void main(String[] args) {
        // 使用反射创建的泛型数组
        GenericArrayDemo<String> stringArray = new GenericArrayDemo<>(String.class, 5);
        stringArray.set(0, "Hello");
        stringArray.set(1, "World");
        System.out.println(stringArray.get(0) + " " + stringArray.get(1));

        // 验证数组类型
        String[] array = stringArray.getArray();
        System.out.println("数组类型: " + array.getClass().getComponentType());

        // 使用泛型栈
        GenericStack<Integer> stack = new GenericStack<>();
        stack.push(1);
        stack.push(2);
        stack.push(3);
        System.out.println(stack.pop());  // 3
        System.out.println(stack.pop());  // 2
    }
}
```

### 示例 5：桥接方法深入分析

```java
import java.lang.reflect.*;
import java.util.*;

interface Comparator<T> {
    int compare(T o1, T o2);
}

class StringLengthComparator implements Comparator<String> {
    @Override
    public int compare(String o1, String o2) {
        return Integer.compare(o1.length(), o2.length());
    }
}

public class BridgeMethodAnalysis {
    public static void main(String[] args) {
        System.out.println("=== StringLengthComparator 的所有方法 ===\n");

        for (Method method : StringLengthComparator.class.getDeclaredMethods()) {
            System.out.println("方法名: " + method.getName());
            System.out.println("  返回类型: " + method.getReturnType().getSimpleName());
            System.out.println("  参数类型: " + Arrays.toString(
                Arrays.stream(method.getParameterTypes())
                    .map(Class::getSimpleName)
                    .toArray(String[]::new)
            ));
            System.out.println("  是否桥接方法: " + method.isBridge());
            System.out.println("  是否合成方法: " + method.isSynthetic());
            System.out.println("  修饰符: " + Modifier.toString(method.getModifiers()));
            System.out.println();
        }

        // 演示多态调用
        Comparator<String> comparator = new StringLengthComparator();

        // 通过接口调用 - 使用桥接方法
        System.out.println("通过接口比较 'hi' 和 'hello': " +
            comparator.compare("hi", "hello"));

        // 直接调用 - 使用原始方法
        StringLengthComparator directComparator = new StringLengthComparator();
        System.out.println("直接比较 'hi' 和 'hello': " +
            directComparator.compare("hi", "hello"));
    }
}
```

## 最佳实践

### 优先使用泛型而非原始类型

```java
// 不推荐：使用原始类型
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);  // 需要强制转换

// 推荐：使用泛型
List<String> list = new ArrayList<>();
list.add("hello");
String s = list.get(0);  // 类型安全，无需转换
```

### 使用类型令牌传递类型信息

```java
// 不好：无法在运行时获取类型信息
public <T> T deserialize(String json) {
    // 无法知道 T 的实际类型
    return null;
}

// 好：使用 Class 类型令牌
public <T> T deserialize(String json, Class<T> clazz) {
    // 可以使用 clazz 进行反射操作
    return gson.fromJson(json, clazz);
}

// 更好：对于复杂泛型类型，使用 TypeReference
public <T> T deserialize(String json, TypeReference<T> typeRef) {
    return gson.fromJson(json, typeRef.getType());
}
```

### 正确处理泛型数组

```java
// 不推荐：强制转换 Object 数组
@SuppressWarnings("unchecked")
public <T> T[] toArray(List<T> list) {
    return (T[]) list.toArray();  // 可能导致 ClassCastException
}

// 推荐：使用 Class 参数创建正确类型的数组
@SuppressWarnings("unchecked")
public <T> T[] toArray(List<T> list, Class<T> clazz) {
    T[] array = (T[]) Array.newInstance(clazz, list.size());
    return list.toArray(array);
}

// 或者使用集合提供的方法
String[] array = list.toArray(new String[0]);
```

### 谨慎使用 @SuppressWarnings

```java
// 不好：在类级别抑制警告
@SuppressWarnings("unchecked")
public class Container<T> {
    // 整个类的警告都被抑制，可能隐藏真正的问题
}

// 好：在最小范围内抑制警告，并添加注释说明原因
public class Container<T> {
    private Object[] elements;

    public T get(int index) {
        // 数组创建时只存储 T 类型的元素，所以转换是安全的
        @SuppressWarnings("unchecked")
        T result = (T) elements[index];
        return result;
    }
}
```

### 使用 @SafeVarargs 标注安全的可变参数方法

```java
// 可变参数方法可能导致堆污染警告
public static <T> List<T> asList(T... elements) {
    return new ArrayList<>(Arrays.asList(elements));
}

// 使用 @SafeVarargs 标注确认安全的方法
@SafeVarargs
public static <T> List<T> safeAsList(T... elements) {
    // 只读访问数组，不会导致堆污染
    return new ArrayList<>(Arrays.asList(elements));
}

// 注意：@SafeVarargs 只能用于 final、static 或 private 方法
```

### 文档化泛型 API 的行为

```java
/**
 * 从集合中获取符合条件的第一个元素
 *
 * @param <T> 集合元素类型
 * @param collection 要搜索的集合，不能为 null
 * @param predicate 匹配条件，不能为 null
 * @return 符合条件的第一个元素，如果没有找到则返回 null
 * @throws NullPointerException 如果 collection 或 predicate 为 null
 *
 * <p>类型擦除说明：此方法在运行时无法验证元素的实际类型，
 * 调用者需确保集合中的元素类型与类型参数 T 匹配。</p>
 */
public static <T> T findFirst(Collection<T> collection, Predicate<T> predicate) {
    Objects.requireNonNull(collection, "collection must not be null");
    Objects.requireNonNull(predicate, "predicate must not be null");

    for (T element : collection) {
        if (predicate.test(element)) {
            return element;
        }
    }
    return null;
}
```

## 常见陷阱

### 陷阱 1：误以为可以在运行时检查泛型类型

```java
// 错误的想法
public <T> void process(Object obj) {
    // 无法在运行时判断 obj 是否是 List<String>
    // if (obj instanceof List<String>) { }  // 编译错误

    // 只能检查原始类型
    if (obj instanceof List<?>) {
        List<?> list = (List<?>) obj;
        // 但无法知道 list 中元素的实际类型
    }
}

// 正确的做法：传递 Class 参数
public <T> void process(Object obj, Class<T> expectedType) {
    if (obj instanceof List<?>) {
        List<?> list = (List<?>) obj;
        for (Object element : list) {
            if (!expectedType.isInstance(element)) {
                throw new IllegalArgumentException(
                    "元素类型不匹配: " + element.getClass()
                );
            }
        }
    }
}
```

### 陷阱 2：泛型方法重载歧义

```java
public class OverloadDemo {
    // 这两个方法在类型擦除后签名相同
    // public void process(List<String> list) { }
    // public void process(List<Integer> list) { }  // 编译错误

    // 解决方案 1：使用不同的方法名
    public void processStrings(List<String> list) { }
    public void processIntegers(List<Integer> list) { }

    // 解决方案 2：使用通用泛型方法
    public <T> void process(List<T> list, Consumer<T> handler) {
        for (T item : list) {
            handler.accept(item);
        }
    }
}
```

### 陷阱 3：equals 方法中的泛型陷阱

```java
public class Pair<T> {
    private T first;
    private T second;

    // 错误的 equals 实现
    // public boolean equals(Pair<T> other) {  // 这是重载，不是重写！
    //     return Objects.equals(first, other.first)
    //         && Objects.equals(second, other.second);
    // }

    // 正确的 equals 实现
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;

        Pair<?> other = (Pair<?>) obj;
        return Objects.equals(first, other.first)
            && Objects.equals(second, other.second);
    }

    @Override
    public int hashCode() {
        return Objects.hash(first, second);
    }
}
```

### 陷阱 4：忽略编译器警告

```java
public class WarningDemo {
    public static void main(String[] args) {
        // 警告：使用原始类型
        List rawList = new ArrayList();  // 应该 List<?>

        // 警告：未经检查的转换
        List<String> stringList = (List<String>) rawList;  // 危险！

        // 警告：未经检查的调用
        rawList.add("hello");  // 应该使用泛型版本
    }

    // 正确做法：重视并处理所有警告
    public static void safeMethod() {
        List<String> stringList = new ArrayList<>();
        stringList.add("hello");

        // 如果必须使用原始类型（如与旧代码交互），添加适当的检查
        List rawList = legacyMethod();
        for (Object obj : rawList) {
            if (obj instanceof String) {
                String s = (String) obj;
                // 安全使用 s
            }
        }
    }

    private static List legacyMethod() {
        return new ArrayList();
    }
}
```

### 陷阱 5：泛型与数组协变的不一致

```java
public class CovarianceDemo {
    public static void main(String[] args) {
        // 数组是协变的
        Object[] objectArray = new String[10];
        objectArray[0] = "hello";
        // objectArray[1] = 42;  // 运行时 ArrayStoreException

        // 泛型是不变的
        // List<Object> objectList = new ArrayList<String>();  // 编译错误

        // 如果允许，将导致：
        // List<Object> objectList = stringList;  // 假设允许
        // objectList.add(42);  // 编译通过
        // String s = stringList.get(0);  // 运行时 ClassCastException

        // 正确使用通配符实现协变
        List<? extends Object> wildcardList = new ArrayList<String>();
        // wildcardList.add("hello");  // 编译错误 - 安全！
        Object obj = wildcardList.get(0);  // 可以读取
    }
}
```

## 性能考量

### 类型擦除的性能影响

类型擦除本身不会带来运行时性能开销，因为泛型信息在编译期就已被移除。但以下几点值得关注：

#### 自动装箱的开销

```java
// 由于无法使用基本类型，需要使用包装类
List<Integer> list = new ArrayList<>();

for (int i = 0; i < 1000000; i++) {
    list.add(i);  // 自动装箱：int -> Integer
}

int sum = 0;
for (Integer num : list) {
    sum += num;  // 自动拆箱：Integer -> int
}

// 对于性能敏感的场景，考虑使用原始类型专用集合
// 如 Eclipse Collections 的 IntArrayList
// 或 Trove 的 TIntArrayList
```

#### 类型检查和转换

```java
public class TypeCheckBenchmark {
    // 编译器插入的类型转换通常被 JIT 优化掉
    // 但在某些情况下可能有轻微开销

    public static void withGenerics(List<String> list) {
        for (String s : list) {
            // 编译器插入 checkcast 指令
            process(s);
        }
    }

    public static void withoutGenerics(List<String> list) {
        // 如果确定类型安全，直接使用原始类型可能略快
        // 但不推荐，因为失去类型安全
        for (Object o : (List) list) {
            process((String) o);
        }
    }

    private static void process(String s) {
        // 处理字符串
    }
}
```

#### 反射获取泛型信息的开销

```java
public class ReflectionOverhead {
    private List<String> stringList;

    // 反射操作有一定开销，应该缓存结果
    private static final Type STRING_LIST_TYPE;

    static {
        try {
            STRING_LIST_TYPE = ReflectionOverhead.class
                .getDeclaredField("stringList")
                .getGenericType();
        } catch (NoSuchFieldException e) {
            throw new RuntimeException(e);
        }
    }

    // 不推荐：每次调用都进行反射
    public Type getTypeSlowly() throws Exception {
        return getClass().getDeclaredField("stringList").getGenericType();
    }

    // 推荐：使用缓存的类型信息
    public Type getTypeFast() {
        return STRING_LIST_TYPE;
    }
}
```

### 内存考量

```java
// 由于类型擦除，不同参数化类型共享同一个类
List<String> stringList1 = new ArrayList<>();
List<String> stringList2 = new ArrayList<>();
List<Integer> intList = new ArrayList<>();

// 三个对象使用同一个 ArrayList.class
// 不会因为不同的类型参数而产生额外的类加载开销
System.out.println(stringList1.getClass() == intList.getClass());  // true

// 这与 C++ 模板不同，C++ 会为每种类型实例化生成独立的代码
```

## 实战场景

### 场景 1：实现类型安全的 JSON 反序列化

```java
import com.google.gson.*;
import java.lang.reflect.*;

public class TypeSafeJsonParser {
    private static final Gson gson = new Gson();

    // 简单类型
    public static <T> T parse(String json, Class<T> clazz) {
        return gson.fromJson(json, clazz);
    }

    // 复杂泛型类型
    public static <T> T parse(String json, TypeReference<T> typeRef) {
        return gson.fromJson(json, typeRef.getType());
    }

    // 使用示例
    public static void main(String[] args) {
        // 简单类型
        String userJson = "{\"name\":\"Alice\",\"age\":30}";
        User user = parse(userJson, User.class);

        // 泛型类型
        String listJson = "[{\"name\":\"Alice\"},{\"name\":\"Bob\"}]";
        List<User> users = parse(listJson, new TypeReference<List<User>>() {});

        // 嵌套泛型类型
        String mapJson = "{\"users\":[{\"name\":\"Alice\"}]}";
        Map<String, List<User>> data = parse(mapJson,
            new TypeReference<Map<String, List<User>>>() {});
    }

    static class User {
        String name;
        int age;
    }
}
```

### 场景 2：实现泛型 DAO 层

```java
import java.lang.reflect.*;
import java.util.*;

public abstract class GenericDao<T, ID> {
    protected Class<T> entityClass;

    @SuppressWarnings("unchecked")
    public GenericDao() {
        // 通过反射获取实际的实体类型
        Type superclass = getClass().getGenericSuperclass();
        if (superclass instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) superclass;
            entityClass = (Class<T>) pt.getActualTypeArguments()[0];
        }
    }

    public T findById(ID id) {
        System.out.println("查询 " + entityClass.getSimpleName() + " by ID: " + id);
        // 实际的数据库查询逻辑
        try {
            return entityClass.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public List<T> findAll() {
        System.out.println("查询所有 " + entityClass.getSimpleName());
        return new ArrayList<>();
    }

    public void save(T entity) {
        System.out.println("保存 " + entityClass.getSimpleName() + ": " + entity);
    }

    public void delete(ID id) {
        System.out.println("删除 " + entityClass.getSimpleName() + " by ID: " + id);
    }

    public Class<T> getEntityClass() {
        return entityClass;
    }
}

// 具体实现
class User {
    private Long id;
    private String name;
    // getters, setters...
}

class UserDao extends GenericDao<User, Long> {
    // 自动获得 User 类型的 CRUD 操作

    // 可以添加特定于 User 的方法
    public User findByName(String name) {
        System.out.println("按名称查询用户: " + name);
        return new User();
    }
}

// 使用
class DaoExample {
    public static void main(String[] args) {
        UserDao userDao = new UserDao();

        System.out.println("实体类型: " + userDao.getEntityClass());

        userDao.save(new User());
        User user = userDao.findById(1L);
        List<User> users = userDao.findAll();
    }
}
```

### 场景 3：实现类型安全的事件系统

```java
import java.util.*;
import java.util.concurrent.*;

public class TypeSafeEventBus {
    private final Map<Class<?>, List<EventHandler<?>>> handlers =
        new ConcurrentHashMap<>();

    @FunctionalInterface
    public interface EventHandler<T> {
        void handle(T event);
    }

    public <T> void register(Class<T> eventType, EventHandler<T> handler) {
        handlers.computeIfAbsent(eventType, k -> new CopyOnWriteArrayList<>())
                .add(handler);
    }

    @SuppressWarnings("unchecked")
    public <T> void publish(T event) {
        Class<?> eventType = event.getClass();
        List<EventHandler<?>> eventHandlers = handlers.get(eventType);

        if (eventHandlers != null) {
            for (EventHandler<?> handler : eventHandlers) {
                ((EventHandler<T>) handler).handle(event);
            }
        }

        // 也通知父类类型的处理器
        for (Class<?> type : handlers.keySet()) {
            if (type.isAssignableFrom(eventType) && type != eventType) {
                for (EventHandler<?> handler : handlers.get(type)) {
                    ((EventHandler<T>) handler).handle(event);
                }
            }
        }
    }

    // 事件类定义
    public static class UserEvent {
        private final String userId;
        public UserEvent(String userId) { this.userId = userId; }
        public String getUserId() { return userId; }
    }

    public static class UserCreatedEvent extends UserEvent {
        public UserCreatedEvent(String userId) { super(userId); }
    }

    public static class UserDeletedEvent extends UserEvent {
        public UserDeletedEvent(String userId) { super(userId); }
    }

    // 使用示例
    public static void main(String[] args) {
        TypeSafeEventBus eventBus = new TypeSafeEventBus();

        // 注册处理器
        eventBus.register(UserEvent.class, event ->
            System.out.println("用户事件: " + event.getUserId()));

        eventBus.register(UserCreatedEvent.class, event ->
            System.out.println("用户创建: " + event.getUserId()));

        // 发布事件
        eventBus.publish(new UserCreatedEvent("user-001"));
        // 输出:
        // 用户创建: user-001
        // 用户事件: user-001
    }
}
```

### 场景 4：构建类型安全的配置系统

```java
import java.util.*;

public class TypeSafeConfig {
    private final Map<ConfigKey<?>, Object> config = new HashMap<>();

    // 类型安全的配置键
    public static final class ConfigKey<T> {
        private final String name;
        private final Class<T> type;
        private final T defaultValue;

        public ConfigKey(String name, Class<T> type, T defaultValue) {
            this.name = name;
            this.type = type;
            this.defaultValue = defaultValue;
        }

        public String getName() { return name; }
        public Class<T> getType() { return type; }
        public T getDefaultValue() { return defaultValue; }
    }

    // 预定义的配置键
    public static final ConfigKey<String> HOST =
        new ConfigKey<>("host", String.class, "localhost");
    public static final ConfigKey<Integer> PORT =
        new ConfigKey<>("port", Integer.class, 8080);
    public static final ConfigKey<Boolean> DEBUG =
        new ConfigKey<>("debug", Boolean.class, false);
    public static final ConfigKey<List<String>> ALLOWED_ORIGINS =
        new ConfigKey<>("allowedOrigins", (Class<List<String>>) (Class<?>) List.class,
            Collections.emptyList());

    // 类型安全的设置方法
    public <T> void set(ConfigKey<T> key, T value) {
        config.put(key, value);
    }

    // 类型安全的获取方法
    @SuppressWarnings("unchecked")
    public <T> T get(ConfigKey<T> key) {
        Object value = config.get(key);
        if (value == null) {
            return key.getDefaultValue();
        }
        return (T) value;
    }

    public static void main(String[] args) {
        TypeSafeConfig config = new TypeSafeConfig();

        // 类型安全的配置设置
        config.set(HOST, "api.example.com");
        config.set(PORT, 443);
        config.set(DEBUG, true);
        config.set(ALLOWED_ORIGINS, Arrays.asList("http://localhost:3000"));

        // 类型安全的配置获取
        String host = config.get(HOST);
        int port = config.get(PORT);
        boolean debug = config.get(DEBUG);
        List<String> origins = config.get(ALLOWED_ORIGINS);

        System.out.printf("连接到 %s:%d (debug=%s)%n", host, port, debug);
        System.out.println("允许的来源: " + origins);
    }
}
```

## 面试要点

### 问题 1：什么是类型擦除？为什么 Java 选择类型擦除实现泛型？

**答案要点：**

类型擦除是 Java 编译器在编译泛型代码时，将类型参数替换为其边界类型（无边界则为 Object）的过程。Java 选择类型擦除主要是为了：

1. **向后兼容**：保持与 Java 5 之前代码的二进制兼容性
2. **迁移兼容**：允许泛型和非泛型代码互操作
3. **简化实现**：JVM 无需修改即可支持泛型

```java
// 类型擦除示例
List<String> stringList = new ArrayList<>();  // 编译后变为 ArrayList
List<Integer> intList = new ArrayList<>();    // 编译后也是 ArrayList

// 运行时类型相同
System.out.println(stringList.getClass() == intList.getClass());  // true
```

### 问题 2：什么是桥接方法？什么情况下会生成？

**答案要点：**

桥接方法是编译器为保持多态性而生成的合成方法。当子类继承泛型父类并具体化类型参数时，会产生方法签名不匹配的问题，桥接方法用于解决这个问题。

```java
class Node<T> {
    public void setData(T data) { }  // 擦除后: setData(Object)
}

class IntegerNode extends Node<Integer> {
    @Override
    public void setData(Integer data) { }  // 签名不匹配！

    // 编译器生成桥接方法：
    // public void setData(Object data) {
    //     setData((Integer) data);  // 调用真正的方法
    // }
}
```

### 问题 3：为什么不能创建泛型数组？如何绕过这个限制？

**答案要点：**

不能创建泛型数组是因为数组在运行时需要知道元素的具体类型以进行类型检查，而泛型类型在运行时被擦除。如果允许创建，可能导致堆污染。

```java
// 假设允许：
// List<String>[] arrays = new List<String>[10];  // 编译错误
// Object[] objArray = arrays;
// objArray[0] = Arrays.asList(42);  // 运行时不会报错（类型被擦除）
// String s = arrays[0].get(0);  // ClassCastException

// 解决方案：
// 1. 使用通配符数组
List<?>[] wildcardArray = new List<?>[10];

// 2. 使用 ArrayList
List<List<String>> listOfLists = new ArrayList<>();

// 3. 使用反射
@SuppressWarnings("unchecked")
T[] array = (T[]) Array.newInstance(clazz, size);
```

### 问题 4：如何在运行时获取泛型类型信息？

**答案要点：**

虽然类型参数在运行时被擦除，但以下情况可以保留类型信息：

1. 字段的泛型类型
2. 方法参数和返回值的泛型类型
3. 父类的泛型类型参数

```java
// 获取字段的泛型类型
class Demo {
    private List<String> list;
}

Field field = Demo.class.getDeclaredField("list");
Type type = field.getGenericType();
ParameterizedType pt = (ParameterizedType) type;
Type[] args = pt.getActualTypeArguments();  // [String.class]

// 获取父类的泛型类型
class StringList extends ArrayList<String> { }

Type superclass = StringList.class.getGenericSuperclass();
// 可以获取到 String 类型信息

// 使用超类型令牌
TypeReference<List<String>> typeRef = new TypeReference<List<String>>() {};
```

### 问题 5：解释 PECS 原则及其与类型擦除的关系

**答案要点：**

PECS（Producer Extends, Consumer Super）是使用通配符的指导原则：

- **Producer Extends**：如果需要从集合读取数据，使用 `? extends T`
- **Consumer Super**：如果需要向集合写入数据，使用 `? super T`

```java
// Producer - 读取数据
public static double sum(List<? extends Number> list) {
    double total = 0;
    for (Number n : list) {  // 读取为 Number
        total += n.doubleValue();
    }
    return total;
}

// Consumer - 写入数据
public static void addIntegers(List<? super Integer> list) {
    list.add(1);  // 可以安全添加 Integer
    list.add(2);
}

// 类型擦除后，通配符帮助编译器进行正确的类型检查
// 即使运行时类型信息丢失，编译时的检查确保类型安全
```

### 问题 6：堆污染是什么？如何避免？

**答案要点：**

堆污染指参数化类型变量引用了不属于该类型的对象，通常由以下原因导致：

1. 混合使用泛型和原始类型
2. 可变参数与泛型结合

```java
// 堆污染示例
List<String> strings = new ArrayList<>();
List rawList = strings;  // 原始类型
rawList.add(42);  // 堆污染！
String s = strings.get(0);  // ClassCastException

// 避免方法：
// 1. 不使用原始类型
// 2. 重视编译器警告
// 3. 对安全的可变参数方法使用 @SafeVarargs

@SafeVarargs
public static <T> List<T> asList(T... elements) {
    return new ArrayList<>(Arrays.asList(elements));
}
```

## 延伸阅读

### 官方文档

- [The Java Tutorials - Generics](https://docs.oracle.com/javase/tutorial/java/generics/)
- [The Java Language Specification - Type Erasure](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html#jls-4.6)
- [JEP 218: Generics over Primitive Types](https://openjdk.org/jeps/218)

### 经典书籍

- 《Effective Java》第三版，Joshua Bloch - 第5章：泛型
- 《Java Generics and Collections》，Maurice Naftalin & Philip Wadler
- 《Java核心技术》卷I - 泛型程序设计章节

### 深入文章

- [Neal Gafter - Super Type Tokens](http://gafter.blogspot.com/2006/12/super-type-tokens.html)
- [Angelika Langer - Java Generics FAQ](http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html)
- [Baeldung - Type Erasure in Java](https://www.baeldung.com/java-type-erasure)

### 相关技术

- **Kotlin 的 reified 关键字**：通过内联函数在运行时保留类型信息
- **Valhalla 项目**：Java 未来可能引入的具体化泛型和值类型
- **Jackson TypeReference**：JSON 库中处理泛型类型的标准方案
- **Guava TypeToken**：Google 提供的类型令牌实现

### 源码学习

- `java.util.ArrayList`：观察泛型集合的实现
- `java.util.Collections`：学习泛型工具方法的设计
- `java.lang.reflect.ParameterizedType`：理解运行时类型信息的获取
