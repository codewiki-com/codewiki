---
title: Java 泛型
description: 深入理解 Java 泛型：类型参数、通配符、类型擦除与 PECS
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - 泛型
  - 通配符
  - PECS
status: imported
origin: old/src/content/docs/java/generics.zh.md
divergence: 0.219
issues: []
legacy:
  category: Java
  subcategory: 泛型
  order: 3
  lastUpdated: 2026-01-07
---

泛型是 Java 5 引入的一项重要特性，它允许在定义类、接口和方法时使用类型参数，从而实现代码复用、类型安全和更好的可读性。本文将深入探讨 Java 泛型的核心概念和最佳实践。

## 为什么需要泛型

在 Java 5 之前，集合类只能存储 `Object` 类型，这导致了两个主要问题：

### 问题 1：类型不安全

```java
// Java 5 之前
List list = new ArrayList();
list.add("Hello");
list.add(123);  // 编译通过，但类型混乱

String str = (String) list.get(1);  // 运行时 ClassCastException
```

### 问题 2：需要频繁的类型转换

```java
List list = new ArrayList();
list.add("Hello");
String str = (String) list.get(0);  // 必须显式转换
```

### 使用泛型后

```java
List<String> list = new ArrayList<>();
list.add("Hello");
// list.add(123);  // 编译错误，类型安全
String str = list.get(0);  // 无需类型转换
```

## 泛型类

泛型类允许在类定义时使用类型参数，这些参数在创建实例时被具体类型替换。

### 基本语法

```java
public class Box<T> {
    private T content;

    public void set(T content) {
        this.content = content;
    }

    public T get() {
        return content;
    }
}

// 使用
Box<String> stringBox = new Box<>();
stringBox.set("Hello");
String value = stringBox.get();

Box<Integer> intBox = new Box<>();
intBox.set(123);
Integer number = intBox.get();
```

### 多个类型参数

```java
public class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() {
        return key;
    }

    public V getValue() {
        return value;
    }
}

// 使用
Pair<String, Integer> pair = new Pair<>("Age", 25);
String key = pair.getKey();
Integer value = pair.getValue();
```

### 嵌套泛型

```java
List<Pair<String, Integer>> pairList = new ArrayList<>();
pairList.add(new Pair<>("Alice", 30));
pairList.add(new Pair<>("Bob", 25));

for (Pair<String, Integer> pair : pairList) {
    System.out.println(pair.getKey() + ": " + pair.getValue());
}
```

## 泛型接口

泛型接口的定义和使用方式与泛型类类似。

```java
public interface Comparable<T> {
    int compareTo(T other);
}

public class Person implements Comparable<Person> {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public int compareTo(Person other) {
        return Integer.compare(this.age, other.age);
    }
}
```

### 泛型接口的实现方式

```java
// 方式1：实现时指定具体类型
public class StringProcessor implements Processor<String> {
    @Override
    public String process(String input) {
        return input.toUpperCase();
    }
}

// 方式2：实现类也保持泛型
public class GenericProcessor<T> implements Processor<T> {
    @Override
    public T process(T input) {
        return input;
    }
}
```

## 泛型方法

泛型方法可以在普通类或泛型类中定义，它有自己的类型参数。

### 基本语法

```java
public class ArrayUtils {
    // 泛型方法：类型参数在返回类型之前声明
    public static <T> void swap(T[] array, int i, int j) {
        T temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    public static <T> T getMiddle(T... elements) {
        return elements[elements.length / 2];
    }
}

// 使用
String[] words = {"Hello", "World", "Java"};
ArrayUtils.swap(words, 0, 2);

String middle = ArrayUtils.getMiddle("A", "B", "C", "D", "E");
```

### 泛型方法与泛型类结合

```java
public class Box<T> {
    private T content;

    public T get() {
        return content;
    }

    // 泛型方法，使用不同的类型参数 U
    public <U> void inspect(U item) {
        System.out.println("T: " + content.getClass().getName());
        System.out.println("U: " + item.getClass().getName());
    }
}

// 使用
Box<Integer> intBox = new Box<>();
intBox.inspect("Hello");  // T 是 Integer，U 是 String
```

### 静态泛型方法

```java
public class Utils {
    // 静态泛型方法不能使用类的类型参数
    public static <T> List<T> asList(T... elements) {
        List<T> list = new ArrayList<>();
        for (T element : elements) {
            list.add(element);
        }
        return list;
    }
}

// 使用
List<String> list = Utils.asList("A", "B", "C");
```

## 类型擦除

Java 泛型是通过类型擦除实现的，这意味着泛型信息只在编译时存在，运行时会被擦除。

### 类型擦除的原理

```java
// 编译前
public class Box<T> {
    private T content;

    public void set(T content) {
        this.content = content;
    }

    public T get() {
        return content;
    }
}

// 编译后（类型擦除）
public class Box {
    private Object content;

    public void set(Object content) {
        this.content = content;
    }

    public Object get() {
        return content;
    }
}
```

### 有边界的类型擦除

```java
// 编译前
public class NumberBox<T extends Number> {
    private T value;

    public T getValue() {
        return value;
    }
}

// 编译后
public class NumberBox {
    private Number value;  // 擦除为边界类型 Number

    public Number getValue() {
        return value;
    }
}
```

### 类型擦除的影响

```java
// 1. 无法使用基本类型
// List<int> list = new ArrayList<>();  // 编译错误
List<Integer> list = new ArrayList<>();  // 必须使用包装类

// 2. 无法在运行时获取泛型类型
List<String> stringList = new ArrayList<>();
List<Integer> intList = new ArrayList<>();
System.out.println(stringList.getClass() == intList.getClass());  // true

// 3. 无法创建泛型数组
// T[] array = new T[10];  // 编译错误
// List<String>[] arrays = new List<String>[10];  // 编译错误

// 4. 无法使用 instanceof
// if (obj instanceof List<String>) { }  // 编译错误
if (obj instanceof List<?>) { }  // 正确
```

### 桥接方法

类型擦除会导致编译器生成桥接方法以保持多态性：

```java
public class Node<T> {
    private T data;

    public void setData(T data) {
        this.data = data;
    }
}

public class IntegerNode extends Node<Integer> {
    @Override
    public void setData(Integer data) {
        super.setData(data);
    }
}

// 编译后，IntegerNode 会生成桥接方法：
// public void setData(Object data) {
//     setData((Integer) data);
// }
```

## 通配符

通配符（`?`）用于表示未知类型，主要用于增强泛型的灵活性。

### 无界通配符

```java
public static void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

// 可以接受任何类型的 List
printList(Arrays.asList(1, 2, 3));
printList(Arrays.asList("A", "B", "C"));
```

### 上界通配符（extends）

```java
// 表示 List 中的元素是 Number 或其子类
public static double sum(List<? extends Number> list) {
    double total = 0;
    for (Number num : list) {
        total += num.doubleValue();
    }
    return total;
}

// 使用
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.1, 2.2, 3.3);
System.out.println(sum(integers));  // 6.0
System.out.println(sum(doubles));   // 6.6
```

### 下界通配符（super）

```java
// 表示 List 中的元素是 Integer 或其父类
public static void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
}

// 使用
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

addNumbers(integers);  // 正确
addNumbers(numbers);   // 正确
addNumbers(objects);   // 正确
```

### 通配符的限制

```java
List<? extends Number> list = new ArrayList<Integer>();

// 无法添加元素（除了 null）
// list.add(1);        // 编译错误
// list.add(1.0);      // 编译错误
list.add(null);        // 正确

// 可以读取（作为 Number 类型）
Number num = list.get(0);
```

## PECS 原则

PECS 是 "Producer Extends, Consumer Super" 的缩写，这是使用通配符的黄金法则。

### Producer Extends

如果你需要从集合中读取数据（生产者），使用 `? extends T`：

```java
public class Collections {
    // 从 src 读取数据（生产者），使用 extends
    public static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (int i = 0; i < src.size(); i++) {
            dest.set(i, src.get(i));  // 从 src 读取
        }
    }
}

// 使用示例
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Number> numbers = Arrays.asList(0.0, 0.0, 0.0);
Collections.copy(numbers, integers);  // 正确：从 Integer 读，写入 Number
```

### Consumer Super

如果你需要向集合中写入数据（消费者），使用 `? super T`：

```java
public static void addAll(List<? super Integer> list) {
    // 向 list 写入数据（消费者），使用 super
    list.add(1);
    list.add(2);
    list.add(3);
}

// 使用
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

addAll(integers);  // 正确
addAll(numbers);   // 正确
addAll(objects);   // 正确
```

### PECS 实战示例

```java
public class Stack<E> {
    private List<E> elements = new ArrayList<>();

    public void push(E e) {
        elements.add(e);
    }

    public E pop() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.remove(elements.size() - 1);
    }

    // Producer：从 src 读取数据
    public void pushAll(Iterable<? extends E> src) {
        for (E e : src) {
            push(e);
        }
    }

    // Consumer：向 dst 写入数据
    public void popAll(Collection<? super E> dst) {
        while (!elements.isEmpty()) {
            dst.add(pop());
        }
    }
}

// 使用
Stack<Number> numberStack = new Stack<>();
List<Integer> integers = Arrays.asList(1, 2, 3);
numberStack.pushAll(integers);  // 正确：Integer extends Number

List<Object> objects = new ArrayList<>();
numberStack.popAll(objects);    // 正确：Object super Number
```

### 何时不使用通配符

如果既需要读取又需要写入，不要使用通配符：

```java
public static <T> void swap(List<T> list, int i, int j) {
    T temp = list.get(i);  // 读取
    list.set(i, list.get(j));  // 写入
    list.set(j, temp);     // 写入
}
```

## 泛型的边界

泛型边界用于限制类型参数的范围。

### 单一边界

```java
public class NumberBox<T extends Number> {
    private T value;

    public NumberBox(T value) {
        this.value = value;
    }

    public double getDoubleValue() {
        return value.doubleValue();  // 可以调用 Number 的方法
    }
}

// 使用
NumberBox<Integer> intBox = new NumberBox<>(123);
NumberBox<Double> doubleBox = new NumberBox<>(3.14);
// NumberBox<String> stringBox = new NumberBox<>("Hello");  // 编译错误
```

### 多重边界

```java
public interface Flyable {
    void fly();
}

public interface Swimmable {
    void swim();
}

// 类型参数必须同时满足多个边界
public class Animal<T extends Flyable & Swimmable> {
    private T creature;

    public Animal(T creature) {
        this.creature = creature;
    }

    public void doActions() {
        creature.fly();
        creature.swim();
    }
}

class Duck implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("Duck flying");
    }

    @Override
    public void swim() {
        System.out.println("Duck swimming");
    }
}

// 使用
Animal<Duck> duck = new Animal<>(new Duck());
duck.doActions();
```

### 递归类型边界

这种模式常用于实现 Comparable 接口：

```java
public class Employee implements Comparable<Employee> {
    private String name;
    private int salary;

    public Employee(String name, int salary) {
        this.name = name;
        this.salary = salary;
    }

    @Override
    public int compareTo(Employee other) {
        return Integer.compare(this.salary, other.salary);
    }
}

// 泛型方法使用递归类型边界
public static <T extends Comparable<T>> T max(List<T> list) {
    if (list.isEmpty()) {
        throw new IllegalArgumentException("Empty list");
    }

    T max = list.get(0);
    for (int i = 1; i < list.size(); i++) {
        if (list.get(i).compareTo(max) > 0) {
            max = list.get(i);
        }
    }
    return max;
}
```

## 泛型与反射

由于类型擦除，泛型信息在运行时大部分会丢失，但某些情况下可以通过反射获取。

### 通过反射获取泛型信息

```java
import java.lang.reflect.*;

public class GenericReflection {

    // 字段的泛型信息
    private List<String> stringList;
    private Map<String, Integer> map;

    public static void printFieldTypes() throws Exception {
        Field stringListField = GenericReflection.class
            .getDeclaredField("stringList");
        Field mapField = GenericReflection.class
            .getDeclaredField("map");

        // 获取泛型类型
        Type stringListType = stringListField.getGenericType();
        Type mapType = mapField.getGenericType();

        if (stringListType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) stringListType;
            System.out.println("Raw type: " + pt.getRawType());
            System.out.println("Type arguments: " +
                Arrays.toString(pt.getActualTypeArguments()));
        }

        if (mapType instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) mapType;
            System.out.println("Raw type: " + pt.getRawType());
            System.out.println("Type arguments: " +
                Arrays.toString(pt.getActualTypeArguments()));
        }
    }
}

// 输出：
// Raw type: interface java.util.List
// Type arguments: [class java.lang.String]
// Raw type: interface java.util.Map
// Type arguments: [class java.lang.String, class java.lang.Integer]
```

### 获取父类的泛型类型

```java
public abstract class BaseDao<T> {
    private Class<T> entityClass;

    @SuppressWarnings("unchecked")
    public BaseDao() {
        // 获取父类的泛型类型
        Type type = getClass().getGenericSuperclass();
        if (type instanceof ParameterizedType) {
            ParameterizedType pt = (ParameterizedType) type;
            entityClass = (Class<T>) pt.getActualTypeArguments()[0];
        }
    }

    public Class<T> getEntityClass() {
        return entityClass;
    }
}

public class UserDao extends BaseDao<User> {
    // entityClass 将会是 User.class
}

// 使用
UserDao userDao = new UserDao();
System.out.println(userDao.getEntityClass());  // class User
```

### 泛型数组的创建

虽然不能直接创建泛型数组，但可以通过反射实现：

```java
public class GenericArray<T> {
    private T[] array;

    @SuppressWarnings("unchecked")
    public GenericArray(Class<T> type, int size) {
        // 使用反射创建泛型数组
        array = (T[]) Array.newInstance(type, size);
    }

    public void set(int index, T value) {
        array[index] = value;
    }

    public T get(int index) {
        return array[index];
    }

    public int length() {
        return array.length;
    }
}

// 使用
GenericArray<String> stringArray = new GenericArray<>(String.class, 10);
stringArray.set(0, "Hello");
System.out.println(stringArray.get(0));
```

## 常见陷阱与最佳实践

### 陷阱 1：泛型数组创建

```java
// 错误：不能直接创建泛型数组
// T[] array = new T[10];
// List<String>[] arrays = new List<String>[10];

// 解决方案 1：使用 ArrayList
List<List<String>> listOfLists = new ArrayList<>();

// 解决方案 2：使用通配符
List<?>[] arrays = new List<?>[10];

// 解决方案 3：使用反射（见上面的示例）
```

### 陷阱 2：基本类型不能作为类型参数

```java
// 错误
// List<int> intList = new ArrayList<>();

// 正确：使用包装类
List<Integer> intList = new ArrayList<>();
```

### 陷阱 3：静态字段和方法

```java
public class GenericClass<T> {
    // 错误：静态字段不能使用类的类型参数
    // private static T value;

    // 错误：静态方法不能使用类的类型参数
    // public static T getValue() {
    //     return value;
    // }

    // 正确：静态方法可以有自己的类型参数
    public static <E> void printArray(E[] array) {
        for (E element : array) {
            System.out.println(element);
        }
    }
}
```

### 陷阱 4：异常类不能是泛型

```java
// 错误：异常类不能有类型参数
// public class GenericException<T> extends Exception { }

// 错误：catch 子句不能使用类型参数
// try {
//     // ...
// } catch (T e) {
//     // ...
// }
```

### 最佳实践 1：优先使用泛型

```java
// 不好
public Object getFirst(List list) {
    return list.get(0);
}

// 好
public <T> T getFirst(List<T> list) {
    return list.get(0);
}
```

### 最佳实践 2：使用有意义的类型参数名

```java
// 常见约定：
// E - Element（集合中的元素）
// K - Key（映射中的键）
// V - Value（映射中的值）
// N - Number（数值类型）
// T - Type（通用类型）
// S, U, V - 第二、第三、第四个类型

public class Cache<K, V> {
    private Map<K, V> map = new HashMap<>();

    public void put(K key, V value) {
        map.put(key, value);
    }

    public V get(K key) {
        return map.get(key);
    }
}
```

### 最佳实践 3：API 设计时优先考虑调用者

```java
// 不够灵活
public void addAll(List<Number> list, Number... elements) {
    for (Number element : elements) {
        list.add(element);
    }
}

// 更灵活：使用泛型和通配符
public <T> void addAll(List<? super T> list, T... elements) {
    for (T element : elements) {
        list.add(element);
    }
}
```

### 最佳实践 4：避免原始类型

```java
// 不好：原始类型，失去类型安全
List list = new ArrayList();
list.add("Hello");
list.add(123);

// 好：使用泛型
List<String> list = new ArrayList<>();
list.add("Hello");
// list.add(123);  // 编译错误
```

### 最佳实践 5：使用 @SafeVarargs

```java
// 警告：可能的堆污染
public static <T> void addToList(List<T> list, T... elements) {
    for (T element : elements) {
        list.add(element);
    }
}

// 正确：使用 @SafeVarargs 抑制警告
@SafeVarargs
public static <T> void addToList(List<T> list, T... elements) {
    for (T element : elements) {
        list.add(element);
    }
}
```

## 总结

Java 泛型是一个强大的特性，它提供了：

1. **类型安全**：在编译时捕获类型错误
2. **代码复用**：编写适用于多种类型的通用代码
3. **消除类型转换**：减少显式类型转换的需要
4. **更好的可读性**：代码意图更加清晰

关键要点：

- 泛型通过类型擦除实现，运行时类型信息大部分会丢失
- 使用通配符（`?`、`? extends T`、`? super T`）增强灵活性
- 遵循 PECS 原则：Producer Extends, Consumer Super
- 使用泛型边界限制类型参数的范围
- 了解泛型的限制和陷阱，避免常见错误

掌握泛型是成为 Java 高级开发者的必经之路，它广泛应用于集合框架、流 API 和各种库中。通过实践和深入理解，你将能够编写更安全、更灵活的 Java 代码。
