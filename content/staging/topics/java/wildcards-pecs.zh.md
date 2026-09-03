---
title: Java 通配符与 PECS 原则
description: 深入理解 Java 泛型通配符：无界通配符、上界通配符、下界通配符与 PECS 原则的完整指南
track: java
section: oop-generics
difficulty: intermediate
tags:
  - Java
  - 泛型
  - 通配符
  - PECS
  - 类型系统
status: imported
origin: old/src/content/docs/java/wildcards-pecs.zh.md
divergence: 0.21
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

通配符是 Java 泛型中最强大也最容易混淆的特性之一。本文将深入剖析三种通配符类型及其底层原理，并通过 PECS 原则指导你在实际开发中做出正确的选择。

## 概念解释

### 什么是通配符

通配符（Wildcard）用问号 `?` 表示，代表一个未知的类型。它主要用于声明变量、参数或返回类型时，当具体类型不确定或需要增强灵活性时使用。

```java
// 不使用通配符：只能接受 List<Object>
public void printList(List<Object> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

// List<String> 不是 List<Object> 的子类型！
List<String> strings = Arrays.asList("Hello", "World");
// printList(strings);  // 编译错误！

// 使用通配符：可以接受任何类型的 List
public void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

printList(strings);  // 现在可以正常工作
```

### 为什么需要通配符

Java 泛型是不变的（invariant），这意味着 `List<String>` 不是 `List<Object>` 的子类型，即使 `String` 是 `Object` 的子类。这种设计保证了类型安全，但也带来了灵活性问题。

```java
// 泛型不变性示例
List<String> strings = new ArrayList<>();
// List<Object> objects = strings;  // 编译错误！

// 如果允许，会导致类型安全问题：
// objects.add(123);  // 添加 Integer
// String s = strings.get(0);  // ClassCastException!
```

通配符的引入解决了这个问题，它允许我们在保持类型安全的同时，编写更灵活的代码。

### 三种通配符类型概览

| 通配符类型 | 语法 | 含义 | 读取能力 | 写入能力 |
|-----------|------|------|---------|---------|
| 无界通配符 | `?` | 任意类型 | 只能读取为 Object | 只能写入 null |
| 上界通配符 | `? extends T` | T 或 T 的子类 | 可读取为 T | 只能写入 null |
| 下界通配符 | `? super T` | T 或 T 的父类 | 只能读取为 Object | 可写入 T 及其子类 |

## 核心原理

### 类型擦除与通配符

要理解通配符的工作原理，首先要理解 Java 的类型擦除机制。

```java
// 编译前
public void process(List<? extends Number> list) {
    for (Number n : list) {
        System.out.println(n.doubleValue());
    }
}

// 编译后（类型擦除）
public void process(List list) {
    for (Object n : list) {
        System.out.println(((Number) n).doubleValue());
    }
}
```

编译器在类型擦除后插入必要的类型检查和转换，确保运行时的类型安全。

### 协变、逆变与不变

理解这三个概念是掌握通配符的关键：

**不变（Invariant）**：`List<String>` 和 `List<Object>` 之间没有子类型关系。

```java
List<String> strings = new ArrayList<>();
List<Object> objects = strings;  // 编译错误：不变
```

**协变（Covariant）**：使用 `? extends T` 实现，子类型关系保持一致。

```java
List<? extends Number> numbers;
numbers = new ArrayList<Integer>();   // Integer extends Number
numbers = new ArrayList<Double>();    // Double extends Number
// 协变：List<Integer> 是 List<? extends Number> 的子类型
```

**逆变（Contravariant）**：使用 `? super T` 实现，子类型关系反转。

```java
List<? super Integer> list;
list = new ArrayList<Integer>();  // Integer
list = new ArrayList<Number>();   // Number super Integer
list = new ArrayList<Object>();   // Object super Integer
// 逆变：List<Object> 是 List<? super Integer> 的子类型
```

### 通配符捕获

编译器有时需要"捕获"通配符表示的未知类型：

```java
public static void swap(List<?> list, int i, int j) {
    // 直接操作会报错
    // Object temp = list.get(i);
    // list.set(i, list.get(j));  // 编译错误！
    // list.set(j, temp);

    // 使用辅助方法进行通配符捕获
    swapHelper(list, i, j);
}

// 辅助方法捕获通配符类型
private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

## 核心要点

### 无界通配符 `?`

无界通配符表示任意未知类型，适用于以下场景：

1. **只需要 Object 类的方法**

```java
public static void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);  // 调用 Object.toString()
    }
}
```

2. **不依赖类型参数的操作**

```java
public static int getSize(List<?> list) {
    return list.size();  // size() 不依赖元素类型
}

public static boolean isEmpty(Collection<?> collection) {
    return collection.isEmpty();
}
```

3. **使用 Class<?> 表示任意类型**

```java
public static void printClassName(Class<?> clazz) {
    System.out.println(clazz.getName());
}

printClassName(String.class);
printClassName(Integer.class);
```

**无界通配符的限制**

```java
List<?> list = new ArrayList<String>();

// 读取：只能作为 Object
Object obj = list.get(0);  // 正确
// String str = list.get(0);  // 编译错误

// 写入：只能写入 null
list.add(null);  // 正确
// list.add("Hello");  // 编译错误
// list.add(new Object());  // 编译错误
```

### 上界通配符 `? extends T`

上界通配符表示 T 或 T 的任意子类，主要用于从集合中读取数据。

```java
// 可以接受 List<Number>、List<Integer>、List<Double> 等
public static double sum(List<? extends Number> numbers) {
    double total = 0;
    for (Number num : numbers) {
        total += num.doubleValue();
    }
    return total;
}

// 使用示例
List<Integer> integers = Arrays.asList(1, 2, 3);
List<Double> doubles = Arrays.asList(1.5, 2.5, 3.5);
List<BigDecimal> bigDecimals = Arrays.asList(
    new BigDecimal("1.1"),
    new BigDecimal("2.2")
);

System.out.println(sum(integers));     // 6.0
System.out.println(sum(doubles));      // 7.5
System.out.println(sum(bigDecimals));  // 3.3
```

**为什么不能写入**

```java
List<? extends Number> numbers = new ArrayList<Integer>();

// 读取：可以读取为 Number
Number num = numbers.get(0);  // 正确

// 写入：编译器不知道具体类型，所以禁止写入
// numbers.add(new Integer(1));  // 编译错误
// numbers.add(new Double(1.0)); // 编译错误
// numbers.add(new Number() {}); // 编译错误
numbers.add(null);  // 只有 null 可以
```

想象一下：如果 `List<? extends Number>` 实际指向 `List<Integer>`，而你尝试添加 `Double`，就会破坏类型安全。

### 下界通配符 `? super T`

下界通配符表示 T 或 T 的任意父类，主要用于向集合中写入数据。

```java
// 可以接受 List<Integer>、List<Number>、List<Object>
public static void addIntegers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
}

// 使用示例
List<Integer> integers = new ArrayList<>();
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

addIntegers(integers);  // 正确
addIntegers(numbers);   // 正确
addIntegers(objects);   // 正确
```

**为什么只能写入 T 及其子类**

```java
List<? super Integer> list = new ArrayList<Number>();

// 写入：可以安全地添加 Integer 及其子类
list.add(1);                    // Integer - 正确
list.add(Integer.valueOf(2));   // Integer - 正确
// list.add(1.0);              // Double - 编译错误
// list.add(new Number() {});  // Number - 编译错误

// 读取：只能作为 Object
Object obj = list.get(0);  // 正确
// Integer i = list.get(0); // 编译错误
// Number n = list.get(0);  // 编译错误
```

### PECS 原则详解

**PECS** 是 "**P**roducer **E**xtends, **C**onsumer **S**uper" 的缩写，由 Joshua Bloch 在《Effective Java》中提出。

- **Producer（生产者）**：如果需要从集合中读取数据，使用 `? extends T`
- **Consumer（消费者）**：如果需要向集合中写入数据，使用 `? super T`

```java
// Collections.copy 是 PECS 的经典示例
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        T element = src.get(i);   // src 是生产者，读取数据
        dest.set(i, element);     // dest 是消费者，写入数据
    }
}

// 使用示例
List<Integer> src = Arrays.asList(1, 2, 3);
List<Number> dest = new ArrayList<>(Arrays.asList(0.0, 0.0, 0.0));
Collections.copy(dest, src);  // 从 Integer 列表复制到 Number 列表
```

## 代码示例

### 示例 1：实现一个泛型栈

```java
import java.util.*;

public class GenericStack<E> {
    private final List<E> elements = new ArrayList<>();

    public void push(E element) {
        elements.add(element);
    }

    public E pop() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.remove(elements.size() - 1);
    }

    public E peek() {
        if (elements.isEmpty()) {
            throw new EmptyStackException();
        }
        return elements.get(elements.size() - 1);
    }

    public boolean isEmpty() {
        return elements.isEmpty();
    }

    public int size() {
        return elements.size();
    }

    /**
     * 从 Iterable 中批量压入元素
     * 使用 extends：src 是生产者（读取数据）
     */
    public void pushAll(Iterable<? extends E> src) {
        for (E element : src) {
            push(element);
        }
    }

    /**
     * 批量弹出元素到 Collection
     * 使用 super：dst 是消费者（写入数据）
     */
    public void popAll(Collection<? super E> dst) {
        while (!isEmpty()) {
            dst.add(pop());
        }
    }
}

// 使用示例
public class StackDemo {
    public static void main(String[] args) {
        GenericStack<Number> numberStack = new GenericStack<>();

        // pushAll 使用 extends，可以传入 Integer 列表
        List<Integer> integers = Arrays.asList(1, 2, 3);
        numberStack.pushAll(integers);

        // 也可以传入 Double 列表
        List<Double> doubles = Arrays.asList(4.0, 5.0);
        numberStack.pushAll(doubles);

        // popAll 使用 super，可以弹出到 Object 列表
        List<Object> result = new ArrayList<>();
        numberStack.popAll(result);

        System.out.println(result);  // [5.0, 4.0, 3, 2, 1]
    }
}
```

### 示例 2：实现通用的集合工具方法

```java
import java.util.*;
import java.util.function.Predicate;

public class CollectionUtils {

    /**
     * 查找集合中的最大值
     * 使用递归类型边界确保元素可比较
     */
    public static <T extends Comparable<? super T>> T max(Collection<? extends T> collection) {
        if (collection.isEmpty()) {
            throw new NoSuchElementException("Collection is empty");
        }

        Iterator<? extends T> iterator = collection.iterator();
        T max = iterator.next();

        while (iterator.hasNext()) {
            T current = iterator.next();
            if (current.compareTo(max) > 0) {
                max = current;
            }
        }

        return max;
    }

    /**
     * 复制满足条件的元素
     * src: 生产者（读取）→ extends
     * dest: 消费者（写入）→ super
     */
    public static <T> void copyIf(
            Collection<? extends T> src,
            Collection<? super T> dest,
            Predicate<? super T> predicate) {
        for (T element : src) {
            if (predicate.test(element)) {
                dest.add(element);
            }
        }
    }

    /**
     * 合并多个集合
     * sources: 每个源都是生产者
     */
    @SafeVarargs
    public static <T> List<T> merge(Collection<? extends T>... sources) {
        List<T> result = new ArrayList<>();
        for (Collection<? extends T> source : sources) {
            result.addAll(source);
        }
        return result;
    }

    /**
     * 计算两个集合的交集
     */
    public static <T> Set<T> intersection(
            Set<? extends T> set1,
            Set<? extends T> set2) {
        Set<T> result = new HashSet<>();
        for (T element : set1) {
            if (set2.contains(element)) {
                result.add(element);
            }
        }
        return result;
    }
}

// 使用示例
public class UtilsDemo {
    public static void main(String[] args) {
        // max 示例
        List<Integer> numbers = Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6);
        Integer max = CollectionUtils.max(numbers);
        System.out.println("Max: " + max);  // Max: 9

        // copyIf 示例
        List<Integer> source = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        List<Number> evens = new ArrayList<>();
        CollectionUtils.copyIf(source, evens, n -> n % 2 == 0);
        System.out.println("Evens: " + evens);  // Evens: [2, 4, 6, 8, 10]

        // merge 示例
        List<Integer> list1 = Arrays.asList(1, 2, 3);
        List<Integer> list2 = Arrays.asList(4, 5, 6);
        List<Number> merged = CollectionUtils.merge(list1, list2);
        System.out.println("Merged: " + merged);  // Merged: [1, 2, 3, 4, 5, 6]
    }
}
```

### 示例 3：实现一个类型安全的异构容器

```java
import java.util.*;

/**
 * 类型安全的异构容器
 * 可以存储不同类型的对象，同时保持类型安全
 */
public class TypeSafeContainer {
    private final Map<Class<?>, Object> container = new HashMap<>();

    /**
     * 存储指定类型的值
     */
    public <T> void put(Class<T> type, T instance) {
        container.put(Objects.requireNonNull(type), instance);
    }

    /**
     * 获取指定类型的值
     */
    public <T> T get(Class<T> type) {
        return type.cast(container.get(type));
    }

    /**
     * 存储支持子类型的值
     * 使用 extends 允许传入子类
     */
    public <T> void putWithSubtype(Class<T> type, T instance) {
        container.put(Objects.requireNonNull(type), instance);
    }

    /**
     * 获取可能是父类型的值
     * 使用 super 允许返回值被视为父类型
     */
    @SuppressWarnings("unchecked")
    public <T> T getAsType(Class<? super T> type, Class<T> actualType) {
        Object value = container.get(type);
        return actualType.cast(value);
    }
}

// 使用示例
public class ContainerDemo {
    public static void main(String[] args) {
        TypeSafeContainer container = new TypeSafeContainer();

        // 存储不同类型的值
        container.put(String.class, "Hello");
        container.put(Integer.class, 42);
        container.put(List.class, Arrays.asList(1, 2, 3));

        // 类型安全地获取值
        String str = container.get(String.class);
        Integer num = container.get(Integer.class);
        List<?> list = container.get(List.class);

        System.out.println(str);   // Hello
        System.out.println(num);   // 42
        System.out.println(list);  // [1, 2, 3]
    }
}
```

### 示例 4：实现比较器工厂

```java
import java.util.*;
import java.util.function.Function;

public class ComparatorFactory {

    /**
     * 创建一个比较器，支持比较超类型
     * Comparator<? super T> 可以比较 T 及其子类
     */
    public static <T, U extends Comparable<? super U>> Comparator<T> comparing(
            Function<? super T, ? extends U> keyExtractor) {
        return (o1, o2) -> {
            U key1 = keyExtractor.apply(o1);
            U key2 = keyExtractor.apply(o2);
            return key1.compareTo(key2);
        };
    }

    /**
     * 组合多个比较器
     * 使用 super 使得比较器可以比较子类型
     */
    @SafeVarargs
    public static <T> Comparator<T> compose(Comparator<? super T>... comparators) {
        return (o1, o2) -> {
            for (Comparator<? super T> comparator : comparators) {
                int result = comparator.compare(o1, o2);
                if (result != 0) {
                    return result;
                }
            }
            return 0;
        };
    }

    /**
     * 反转比较器
     */
    public static <T> Comparator<T> reverse(Comparator<? super T> comparator) {
        return (o1, o2) -> comparator.compare(o2, o1);
    }

    /**
     * 空值安全的比较器
     */
    public static <T> Comparator<T> nullsFirst(Comparator<? super T> comparator) {
        return (o1, o2) -> {
            if (o1 == null && o2 == null) return 0;
            if (o1 == null) return -1;
            if (o2 == null) return 1;
            return comparator.compare(o1, o2);
        };
    }
}

// 使用示例
class Person {
    private final String name;
    private final int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() { return name; }
    public int getAge() { return age; }

    @Override
    public String toString() {
        return name + "(" + age + ")";
    }
}

public class ComparatorDemo {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
            new Person("Alice", 30),
            new Person("Bob", 25),
            new Person("Charlie", 30),
            new Person("David", 25)
        );

        // 按年龄排序
        Comparator<Person> byAge = ComparatorFactory.comparing(Person::getAge);

        // 按姓名排序
        Comparator<Person> byName = ComparatorFactory.comparing(Person::getName);

        // 组合：先按年龄，再按姓名
        Comparator<Person> byAgeAndName = ComparatorFactory.compose(byAge, byName);

        List<Person> sorted = new ArrayList<>(people);
        sorted.sort(byAgeAndName);
        System.out.println(sorted);
        // [Bob(25), David(25), Alice(30), Charlie(30)]

        // 反转排序
        sorted.sort(ComparatorFactory.reverse(byAgeAndName));
        System.out.println(sorted);
        // [Charlie(30), Alice(30), David(25), Bob(25)]
    }
}
```

## 最佳实践

### 优先使用泛型方法而非通配符

当类型参数只使用一次时，考虑使用通配符；当需要建立类型关系时，使用泛型方法。

```java
// 好：通配符更简洁
public static void printList(List<?> list) {
    for (Object obj : list) {
        System.out.println(obj);
    }
}

// 好：需要建立类型关系时使用泛型方法
public static <T> void copy(List<T> dest, List<T> src) {
    // dest 和 src 必须是相同类型
}

// 更好：使用 PECS 增加灵活性
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    // 更灵活
}
```

### 返回类型不要使用通配符

通配符在返回类型中会强制调用者处理通配符，降低 API 的可用性。

```java
// 不好：调用者必须处理通配符
public List<? extends Number> getNumbers() {
    return Arrays.asList(1, 2, 3);
}

// 好：返回具体类型
public List<Number> getNumbers() {
    return Arrays.asList(1, 2, 3);
}

// 或者使用泛型方法
public <T extends Number> List<T> getNumbers(Class<T> type) {
    // ...
}
```

### 使用有界通配符提高 API 灵活性

```java
// 不好：只能接受 List<Number>
public static double sum(List<Number> numbers) {
    return numbers.stream()
        .mapToDouble(Number::doubleValue)
        .sum();
}

// 好：可以接受 List<Integer>、List<Double> 等
public static double sum(List<? extends Number> numbers) {
    return numbers.stream()
        .mapToDouble(Number::doubleValue)
        .sum();
}
```

### Comparable 和 Comparator 中的通配符

```java
// 标准模式：支持比较父类实现的 Comparable
public static <T extends Comparable<? super T>> T max(Collection<? extends T> c) {
    // ...
}

// 为什么使用 Comparable<? super T>？
// 考虑：class Apple extends Fruit implements Comparable<Fruit>
// 如果使用 Comparable<T>，Apple 无法使用此方法
// 因为 Apple implements Comparable<Fruit>，不是 Comparable<Apple>
```

### 使用 @SafeVarargs 抑制堆污染警告

```java
@SafeVarargs
public static <T> List<T> asList(T... elements) {
    List<T> result = new ArrayList<>();
    for (T element : elements) {
        result.add(element);
    }
    return result;
}
```

## 常见陷阱

### 陷阱 1：混淆 `List<Object>` 和 `List<?>`

```java
// List<Object> 可以添加任何对象
List<Object> objects = new ArrayList<>();
objects.add("Hello");
objects.add(123);
objects.add(new Object());

// List<?> 几乎不能添加任何对象（除了 null）
List<?> unknown = new ArrayList<>();
// unknown.add("Hello");  // 编译错误
// unknown.add(123);       // 编译错误
unknown.add(null);         // 这是唯一允许的
```

### 陷阱 2：尝试向 `? extends` 添加元素

```java
List<? extends Number> numbers = new ArrayList<Integer>();

// 常见错误：认为可以添加 Number 或其子类
// numbers.add(1);      // 编译错误
// numbers.add(1.0);    // 编译错误
// numbers.add(new Integer(1));  // 编译错误

// 原因：编译器不知道实际类型是什么
// 可能是 List<Integer>、List<Double>、List<BigDecimal> 等
```

### 陷阱 3：尝试读取 `? super` 为具体类型

```java
List<? super Integer> list = new ArrayList<Number>();
list.add(1);
list.add(2);

// 常见错误：认为可以读取为 Integer 或 Number
// Integer i = list.get(0);  // 编译错误
// Number n = list.get(0);   // 编译错误

// 正确：只能读取为 Object
Object obj = list.get(0);  // 正确
```

### 陷阱 4：原始类型与通配符混淆

```java
// 原始类型：完全绕过泛型检查（不推荐）
List rawList = new ArrayList();
rawList.add("Hello");
rawList.add(123);  // 没有编译错误，但类型不安全

// 无界通配符：仍然保持类型安全
List<?> wildcardList = new ArrayList<>();
// wildcardList.add("Hello");  // 编译错误
```

### 陷阱 5：多重边界与通配符

```java
// 泛型可以有多重边界
public class Box<T extends Number & Comparable<T>> { }

// 但通配符只能有一个边界
List<? extends Number> list1;  // 正确
// List<? extends Number & Comparable<?>> list2;  // 语法错误
```

### 陷阱 6：通配符捕获问题

```java
public static void swap(List<?> list, int i, int j) {
    // 这段代码看起来合理，但编译失败
    // Object temp = list.get(i);
    // list.set(i, list.get(j));  // 编译错误！
    // list.set(j, temp);         // 编译错误！
}

// 解决方案：使用辅助方法
public static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);
}

private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

### 陷阱 7：instanceof 与泛型

```java
// 错误：不能使用参数化类型进行 instanceof 检查
// if (obj instanceof List<String>) { }  // 编译错误

// 正确：使用无界通配符
if (obj instanceof List<?>) {
    List<?> list = (List<?>) obj;
    // ...
}
```

## 性能考量

### 类型擦除的影响

由于类型擦除，通配符本身不会带来运行时开销。所有泛型检查都在编译时完成。

```java
// 编译前
public void process(List<? extends Number> numbers) {
    for (Number n : numbers) {
        System.out.println(n.doubleValue());
    }
}

// 编译后（无泛型开销）
public void process(List numbers) {
    for (Object obj : numbers) {
        Number n = (Number) obj;  // 类型转换
        System.out.println(n.doubleValue());
    }
}
```

### 装箱拆箱开销

通配符不能使用基本类型，因此可能带来装箱拆箱开销。

```java
// 必须使用包装类型，存在装箱开销
List<? extends Number> numbers = Arrays.asList(1, 2, 3);  // 自动装箱

// 对于性能敏感的场景，考虑使用专门的原始类型集合
// 如 Eclipse Collections 的 IntList、DoubleList 等
```

### 避免不必要的通配符

```java
// 不必要的通配符
public void process(List<? extends String> strings) {
    // String 是 final 类，没有子类
    // 使用 List<String> 即可
}

// 更好
public void process(List<String> strings) {
    // 更简洁，性能相同
}
```

## 实战场景

### 场景 1：事件处理系统

```java
// 事件基类
abstract class Event {
    private final long timestamp = System.currentTimeMillis();
    public long getTimestamp() { return timestamp; }
}

// 具体事件类型
class UserEvent extends Event {
    private final String userId;
    public UserEvent(String userId) { this.userId = userId; }
    public String getUserId() { return userId; }
}

class OrderEvent extends Event {
    private final String orderId;
    public OrderEvent(String orderId) { this.orderId = orderId; }
    public String getOrderId() { return orderId; }
}

// 事件处理器接口
interface EventHandler<E extends Event> {
    void handle(E event);
}

// 事件总线
class EventBus {
    private final Map<Class<? extends Event>,
                      List<EventHandler<? super Event>>> handlers = new HashMap<>();

    // 注册处理器
    // 使用 ? super E 允许注册可以处理父类事件的处理器
    public <E extends Event> void register(
            Class<E> eventType,
            EventHandler<? super E> handler) {
        handlers.computeIfAbsent(eventType, k -> new ArrayList<>())
                .add((EventHandler<? super Event>) handler);
    }

    // 发布事件
    @SuppressWarnings("unchecked")
    public <E extends Event> void publish(E event) {
        List<EventHandler<? super Event>> eventHandlers =
            handlers.get(event.getClass());
        if (eventHandlers != null) {
            for (EventHandler<? super Event> handler : eventHandlers) {
                handler.handle(event);
            }
        }
    }
}

// 使用示例
public class EventDemo {
    public static void main(String[] args) {
        EventBus bus = new EventBus();

        // 注册 UserEvent 处理器
        bus.register(UserEvent.class, event -> {
            System.out.println("User: " + event.getUserId());
        });

        // 注册可以处理任何 Event 的处理器
        EventHandler<Event> genericHandler = event -> {
            System.out.println("Event at: " + event.getTimestamp());
        };
        bus.register(UserEvent.class, genericHandler);
        bus.register(OrderEvent.class, genericHandler);

        // 发布事件
        bus.publish(new UserEvent("user123"));
        bus.publish(new OrderEvent("order456"));
    }
}
```

### 场景 2：数据转换管道

```java
// 转换器接口
interface Transformer<I, O> {
    O transform(I input);
}

// 转换管道
class Pipeline<I, O> {
    private final List<Transformer<?, ?>> transformers = new ArrayList<>();
    private final Class<I> inputType;
    private final Class<O> outputType;

    private Pipeline(Class<I> inputType, Class<O> outputType) {
        this.inputType = inputType;
        this.outputType = outputType;
    }

    public static <T> Pipeline<T, T> of(Class<T> type) {
        return new Pipeline<>(type, type);
    }

    // 添加转换步骤
    // 使用 extends 确保输入类型兼容
    @SuppressWarnings("unchecked")
    public <R> Pipeline<I, R> then(Transformer<? super O, ? extends R> transformer) {
        Pipeline<I, R> newPipeline = new Pipeline<>(inputType, null);
        newPipeline.transformers.addAll(this.transformers);
        newPipeline.transformers.add(transformer);
        return newPipeline;
    }

    // 执行管道
    @SuppressWarnings("unchecked")
    public O execute(I input) {
        Object current = input;
        for (Transformer transformer : transformers) {
            current = transformer.transform(current);
        }
        return (O) current;
    }
}

// 使用示例
public class PipelineDemo {
    public static void main(String[] args) {
        Pipeline<String, Integer> pipeline = Pipeline.of(String.class)
            .then(String::trim)
            .then(String::toLowerCase)
            .then(String::length);

        Integer result = pipeline.execute("  HELLO WORLD  ");
        System.out.println(result);  // 11
    }
}
```

### 场景 3：Repository 模式

```java
// 实体基类
abstract class Entity {
    protected Long id;
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
}

// 具体实体
class User extends Entity {
    private String name;
    public User(String name) { this.name = name; }
    public String getName() { return name; }
}

class Product extends Entity {
    private String title;
    public Product(String title) { this.title = title; }
    public String getTitle() { return title; }
}

// 通用 Repository 接口
interface Repository<E extends Entity> {
    E findById(Long id);
    List<E> findAll();
    void save(E entity);
    void delete(E entity);

    // 批量保存：使用 extends 接受子类集合
    default void saveAll(Collection<? extends E> entities) {
        for (E entity : entities) {
            save(entity);
        }
    }

    // 批量查询结果写入：使用 super 写入父类集合
    default void findAllInto(Collection<? super E> dest) {
        dest.addAll(findAll());
    }
}

// 内存实现
class InMemoryRepository<E extends Entity> implements Repository<E> {
    private final Map<Long, E> store = new HashMap<>();
    private long idSequence = 0;

    @Override
    public E findById(Long id) {
        return store.get(id);
    }

    @Override
    public List<E> findAll() {
        return new ArrayList<>(store.values());
    }

    @Override
    public void save(E entity) {
        if (entity.getId() == null) {
            entity.setId(++idSequence);
        }
        store.put(entity.getId(), entity);
    }

    @Override
    public void delete(E entity) {
        store.remove(entity.getId());
    }
}

// 使用示例
public class RepositoryDemo {
    public static void main(String[] args) {
        Repository<User> userRepo = new InMemoryRepository<>();

        // 批量保存
        List<User> users = Arrays.asList(
            new User("Alice"),
            new User("Bob")
        );
        userRepo.saveAll(users);

        // 查询到 Object 列表（展示 super 的用法）
        List<Object> allEntities = new ArrayList<>();
        userRepo.findAllInto(allEntities);

        for (Object entity : allEntities) {
            System.out.println(((User) entity).getName());
        }
    }
}
```

## 面试要点

### Q1: `List<?>` 和 `List<Object>` 有什么区别？

**答案**：

- `List<Object>` 是一个具体的参数化类型，可以添加任何对象
- `List<?>` 是一个通配符类型，代表未知类型的 List
- `List<String>` 不是 `List<Object>` 的子类型，但是 `List<?>` 的子类型
- `List<?>` 只能添加 null，但可以安全地读取为 Object

```java
List<Object> objects = new ArrayList<>();
objects.add("Hello");  // 可以添加

List<?> unknown = new ArrayList<String>();
// unknown.add("Hello");  // 编译错误
```

### Q2: 解释 PECS 原则

**答案**：

PECS 是 "Producer Extends, Consumer Super" 的缩写：
- **Producer Extends**：如果需要从集合中读取数据（生产者），使用 `? extends T`
- **Consumer Super**：如果需要向集合中写入数据（消费者），使用 `? super T`

```java
// src 是生产者（读取），dest 是消费者（写入）
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T item : src) {
        dest.add(item);
    }
}
```

### Q3: 为什么 `List<? extends Number>` 不能添加 Integer？

**答案**：

因为编译器不知道 `List<? extends Number>` 的实际类型：
- 可能是 `List<Integer>`
- 可能是 `List<Double>`
- 可能是 `List<BigDecimal>`

如果实际类型是 `List<Double>`，添加 `Integer` 就会破坏类型安全。

```java
List<? extends Number> list = new ArrayList<Double>();
// list.add(new Integer(1));  // 如果允许，会污染 Double 列表
```

### Q4: 什么是通配符捕获？

**答案**：

通配符捕获是编译器将通配符绑定到具体类型的过程。当需要对通配符类型进行读写操作时，可以使用辅助方法捕获通配符类型。

```java
public static void swap(List<?> list, int i, int j) {
    swapHelper(list, i, j);  // 通配符捕获
}

private static <T> void swapHelper(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

### Q5: `Comparable<T>` 和 `Comparable<? super T>` 有什么区别？

**答案**：

`Comparable<? super T>` 更灵活，允许类型通过父类实现 Comparable：

```java
// 如果 Apple extends Fruit implements Comparable<Fruit>
// 使用 Comparable<T>，Apple 无法排序
// 使用 Comparable<? super T>，可以利用 Fruit 的比较逻辑

public static <T extends Comparable<? super T>> T max(Collection<? extends T> c) {
    // 支持通过父类实现 Comparable 的类型
}
```

### Q6: 什么情况下不应该使用通配符？

**答案**：

1. **返回类型**：返回通配符类型会强制调用者处理通配符
2. **需要同时读写**：通配符限制了读或写能力
3. **需要类型关系**：当需要多个参数有相同类型时

```java
// 不好：返回通配符
public List<? extends Number> getNumbers() { }

// 好：返回具体类型
public List<Number> getNumbers() { }

// 需要同时读写，使用泛型方法
public static <T> void swap(List<T> list, int i, int j) {
    T temp = list.get(i);
    list.set(i, list.get(j));
    list.set(j, temp);
}
```

## 延伸阅读

### 官方文档

- [Java Generics Tutorial](https://docs.oracle.com/javase/tutorial/java/generics/)
- [Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html)
- [Guidelines for Wildcard Use](https://docs.oracle.com/javase/tutorial/java/generics/wildcardGuidelines.html)

### 经典书籍

- 《Effective Java》第三版 - Joshua Bloch（第 5 章：泛型）
  - Item 31: Use bounded wildcards to increase API flexibility
  - Item 32: Combine generics and varargs judiciously
- 《Java Generics and Collections》- Maurice Naftalin, Philip Wadler
- 《Java 核心技术 卷 I》- Cay S. Horstmann（泛型程序设计章节）

### 优质文章

- [Java Generics FAQs](http://www.angelikalanger.com/GenericsFAQ/JavaGenericsFAQ.html) - Angelika Langer
- [The Java Generics Guide](https://www.baeldung.com/java-generics) - Baeldung
- [Understanding PECS](https://stackoverflow.com/questions/2723397/what-is-pecs-producer-extends-consumer-super) - Stack Overflow 经典讨论

### 相关主题

- [Java 泛型基础](/java/generics) - 泛型类、泛型接口、泛型方法
- [Java 类型擦除](/java/type-erasure) - 类型擦除机制详解
- [Java 集合框架](/java/collections) - 泛型在集合中的应用
- [Java 函数式接口](/java/functional-interfaces) - 泛型在函数式编程中的应用
