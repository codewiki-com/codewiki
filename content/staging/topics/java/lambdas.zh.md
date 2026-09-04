---
title: Java Lambda 表达式
description: 掌握 Java Lambda 表达式，包括函数式接口、方法引用和 Lambda 最佳实践
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Lambda
  - 函数式编程
status: imported
origin: old/src/content/docs/java/lambdas.zh.md
divergence: 0.377
issues:
  - divergent
legacy:
  category: Java
  subcategory: 函数式编程
  order: 21
  lastUpdated: 2026-01-07
---

## 什么是 Lambda 表达式

Lambda 表达式是 Java 8 引入的一项重要特性，它允许我们将功能作为方法参数传递，或将代码视为数据。Lambda 表达式本质上是一个匿名函数，它没有名称、修饰符和返回类型声明。

### Lambda 的优势

- **代码简洁**: 减少样板代码，使代码更加简洁易读
- **函数式编程**: 支持函数式编程范式，可以传递行为
- **延迟执行**: Lambda 表达式可以延迟执行，提高性能
- **并行处理**: 与 Stream API 结合，轻松实现并行处理
- **更好的集合操作**: 简化集合的遍历、过滤、映射等操作

## Lambda 语法详解

### 基本语法结构

Lambda 表达式的基本语法格式为:

```
(参数列表) -> { 方法体 }
```

### 语法变体

```java
import java.util.*;
import java.util.function.*;

public class LambdaSyntax {
    public static void main(String[] args) {
        // 1. 无参数，无返回值
        Runnable runnable = () -> System.out.println("Hello Lambda!");
        runnable.run();

        // 2. 单个参数，可省略括号
        Consumer<String> consumer = s -> System.out.println(s);
        consumer.accept("Single parameter");

        // 3. 多个参数
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        System.out.println("Sum: " + add.apply(5, 3));

        // 4. 显式声明参数类型
        BiFunction<String, String, String> concat =
            (String a, String b) -> a + b;
        System.out.println(concat.apply("Hello, ", "World!"));

        // 5. 多行方法体（需要大括号和 return）
        BiFunction<Integer, Integer, Integer> max = (a, b) -> {
            if (a > b) {
                return a;
            } else {
                return b;
            }
        };
        System.out.println("Max: " + max.apply(10, 20));

        // 6. 单行表达式（自动返回结果）
        java.util.function.Function<Integer, Integer> square = x -> x * x;
        System.out.println("Square: " + square.apply(5));
    }
}
```

### Lambda 与匿名内部类对比

```java
import java.util.*;

public class LambdaVsAnonymous {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

        // 传统匿名内部类方式
        Collections.sort(names, new Comparator<String>() {
            @Override
            public int compare(String s1, String s2) {
                return s1.compareTo(s2);
            }
        });

        // Lambda 表达式方式
        Collections.sort(names, (s1, s2) -> s1.compareTo(s2));

        // 方法引用方式（更简洁）
        Collections.sort(names, String::compareTo);

        // 使用 List.sort() 和 Lambda
        names.sort((s1, s2) -> s1.length() - s2.length());

        // 使用 Comparator 静态方法
        names.sort(Comparator.comparing(String::length));
    }
}
```

## 函数式接口

### 什么是函数式接口

函数式接口（Functional Interface）是只包含一个抽象方法的接口。Lambda 表达式可以用来实现函数式接口。Java 8 引入了 `@FunctionalInterface` 注解来标识函数式接口。

### 核心函数式接口

Java 8 在 `java.util.function` 包中提供了大量内置的函数式接口:

```java
import java.util.function.*;

public class CoreFunctionalInterfaces {
    public static void main(String[] args) {
        // 1. Predicate<T> - 接收一个参数，返回 boolean
        Predicate<Integer> isPositive = n -> n > 0;
        System.out.println("Is 5 positive? " + isPositive.test(5));  // true
        System.out.println("Is -3 positive? " + isPositive.test(-3)); // false

        // 2. java.util.function.Function<T, R> - 接收一个参数，返回一个结果
        java.util.function.Function<String, Integer> length = s -> s.length();
        System.out.println("Length of 'Hello': " + length.apply("Hello")); // 5

        // 3. Consumer<T> - 接收一个参数，无返回值
        Consumer<String> printer = s -> System.out.println("Consumed: " + s);
        printer.accept("Test message");

        // 4. Supplier<T> - 无参数，返回一个结果
        Supplier<Double> randomValue = () -> Math.random();
        System.out.println("Random: " + randomValue.get());

        // 5. BiFunction<T, U, R> - 接收两个参数，返回一个结果
        BiFunction<String, String, String> combiner = (a, b) -> a + " " + b;
        System.out.println(combiner.apply("Hello", "World"));

        // 6. BiPredicate<T, U> - 接收两个参数，返回 boolean
        BiPredicate<String, Integer> lengthCheck = (s, len) -> s.length() == len;
        System.out.println(lengthCheck.test("Hello", 5)); // true

        // 7. BiConsumer<T, U> - 接收两个参数，无返回值
        BiConsumer<String, Integer> printPair = (s, n) ->
            System.out.println(s + ": " + n);
        printPair.accept("Count", 42);

        // 8. UnaryOperator<T> - 接收一个参数，返回相同类型的结果
        UnaryOperator<Integer> doubleIt = n -> n * 2;
        System.out.println("Doubled: " + doubleIt.apply(5)); // 10

        // 9. BinaryOperator<T> - 接收两个相同类型参数，返回相同类型结果
        BinaryOperator<Integer> multiply = (a, b) -> a * b;
        System.out.println("Product: " + multiply.apply(3, 4)); // 12
    }
}
```

### 基本类型函数式接口

为避免自动装箱拆箱带来的性能开销，Java 提供了基本类型版本:

```java
import java.util.function.*;

public class PrimitiveFunctionalInterfaces {
    public static void main(String[] args) {
        // IntPredicate - 接收 int，返回 boolean
        IntPredicate isEven = n -> n % 2 == 0;
        System.out.println("Is 4 even? " + isEven.test(4)); // true

        // IntFunction<R> - 接收 int，返回 R
        IntFunction<String> intToString = n -> "Number: " + n;
        System.out.println(intToString.apply(42));

        // IntConsumer - 接收 int，无返回值
        IntConsumer printInt = n -> System.out.println("Int value: " + n);
        printInt.accept(100);

        // IntSupplier - 无参数，返回 int
        IntSupplier randomInt = () -> (int) (Math.random() * 100);
        System.out.println("Random int: " + randomInt.getAsInt());

        // IntUnaryOperator - 接收 int，返回 int
        IntUnaryOperator increment = n -> n + 1;
        System.out.println("Incremented: " + increment.applyAsInt(5)); // 6

        // IntBinaryOperator - 接收两个 int，返回 int
        IntBinaryOperator max = (a, b) -> a > b ? a : b;
        System.out.println("Max: " + max.applyAsInt(10, 20)); // 20

        // ToIntFunction<T> - 接收 T，返回 int
        ToIntFunction<String> stringLength = s -> s.length();
        System.out.println("Length: " + stringLength.applyAsInt("Hello")); // 5

        // 同样有 Long 和 Double 版本
        LongPredicate isLarge = n -> n > 1000000L;
        DoubleUnaryOperator half = d -> d / 2.0;
    }
}
```

### 自定义函数式接口

```java
// 自定义函数式接口
@FunctionalInterface
interface StringProcessor {
    String process(String input);

    // 可以有默认方法
    default String processAndPrint(String input) {
        String result = process(input);
        System.out.println("Result: " + result);
        return result;
    }

    // 可以有静态方法
    static StringProcessor identity() {
        return s -> s;
    }
}

@FunctionalInterface
interface TriFunction<T, U, V, R> {
    R apply(T t, U u, V v);
}

public class CustomFunctionalInterface {
    public static void main(String[] args) {
        // 使用自定义函数式接口
        StringProcessor toUpper = s -> s.toUpperCase();
        System.out.println(toUpper.process("hello")); // HELLO

        StringProcessor reverse = s -> new StringBuilder(s).reverse().toString();
        System.out.println(reverse.process("hello")); // olleh

        // 使用默认方法
        reverse.processAndPrint("world"); // Result: dlrow

        // 使用静态方法
        StringProcessor identity = StringProcessor.identity();
        System.out.println(identity.process("test")); // test

        // 三参数函数式接口
        TriFunction<String, String, String, String> concat3 =
            (a, b, c) -> a + b + c;
        System.out.println(concat3.apply("Hello", " ", "World")); // Hello World
    }
}
```

### 函数式接口组合

```java
import java.util.function.*;

public class FunctionComposition {
    public static void main(String[] args) {
        // Predicate 组合
        Predicate<Integer> isPositive = n -> n > 0;
        Predicate<Integer> isEven = n -> n % 2 == 0;

        // and - 两个条件都满足
        Predicate<Integer> isPositiveAndEven = isPositive.and(isEven);
        System.out.println("8 is positive and even: " + isPositiveAndEven.test(8));  // true
        System.out.println("7 is positive and even: " + isPositiveAndEven.test(7));  // false

        // or - 满足任一条件
        Predicate<Integer> isPositiveOrEven = isPositive.or(isEven);
        System.out.println("-2 is positive or even: " + isPositiveOrEven.test(-2)); // true

        // negate - 取反
        Predicate<Integer> isNotPositive = isPositive.negate();
        System.out.println("-5 is not positive: " + isNotPositive.test(-5)); // true

        // java.util.function.Function 组合
        java.util.function.Function<Integer, Integer> multiplyBy2 = n -> n * 2;
        java.util.function.Function<Integer, Integer> add10 = n -> n + 10;

        // andThen - 先执行当前函数，再执行参数函数
        java.util.function.Function<Integer, Integer> multiplyThenAdd = multiplyBy2.andThen(add10);
        System.out.println("5 * 2 + 10 = " + multiplyThenAdd.apply(5)); // 20

        // compose - 先执行参数函数，再执行当前函数
        java.util.function.Function<Integer, Integer> addThenMultiply = multiplyBy2.compose(add10);
        System.out.println("(5 + 10) * 2 = " + addThenMultiply.apply(5)); // 30

        // Consumer 组合
        Consumer<String> print = s -> System.out.print(s);
        Consumer<String> printUpper = s -> System.out.print(s.toUpperCase());

        // andThen - 依次执行
        Consumer<String> printBoth = print.andThen(s -> System.out.print(" -> "))
                                          .andThen(printUpper);
        printBoth.accept("hello"); // hello -> HELLO
        System.out.println();
    }
}
```

## 方法引用

方法引用是 Lambda 表达式的简写形式，当 Lambda 表达式只是调用一个已存在的方法时，可以使用方法引用来简化代码。

### 方法引用的四种类型

```java
import java.util.*;
import java.util.function.*;

public class MethodReferenceTypes {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

        // 1. 静态方法引用: ClassName::staticMethodName
        // Lambda: s -> Integer.parseInt(s)
        java.util.function.Function<String, Integer> parser = Integer::parseInt;
        System.out.println("Parsed: " + parser.apply("42")); // 42

        // 排序示例
        List<Integer> numbers = Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6);
        numbers.sort(Integer::compare);
        System.out.println("Sorted: " + numbers);

        // 2. 实例方法引用（特定对象）: instance::instanceMethodName
        String prefix = "Hello, ";
        // Lambda: name -> prefix.concat(name)
        java.util.function.Function<String, String> greeter = prefix::concat;
        System.out.println(greeter.apply("World")); // Hello, World

        PrintHelper helper = new PrintHelper();
        // Lambda: s -> helper.print(s)
        Consumer<String> printer = helper::print;
        printer.accept("Test message");

        // 3. 实例方法引用（任意对象）: ClassName::instanceMethodName
        // Lambda: s -> s.toUpperCase()
        java.util.function.Function<String, String> toUpper = String::toUpperCase;
        System.out.println(toUpper.apply("hello")); // HELLO

        // Lambda: s -> s.length()
        java.util.function.Function<String, Integer> getLength = String::length;
        System.out.println(getLength.apply("Hello")); // 5

        // Lambda: (s1, s2) -> s1.compareTo(s2)
        Comparator<String> comparator = String::compareTo;
        System.out.println(comparator.compare("a", "b")); // -1

        // 4. 构造方法引用: ClassName::new
        // Lambda: () -> new ArrayList<>()
        Supplier<List<String>> listSupplier = ArrayList::new;
        List<String> newList = listSupplier.get();

        // Lambda: s -> new StringBuilder(s)
        java.util.function.Function<String, StringBuilder> sbCreator = StringBuilder::new;
        StringBuilder sb = sbCreator.apply("Hello");

        // 数组构造方法引用
        // Lambda: size -> new String[size]
        IntFunction<String[]> arrayCreator = String[]::new;
        String[] array = arrayCreator.apply(5);
        System.out.println("Array length: " + array.length); // 5
    }
}

class PrintHelper {
    public void print(String message) {
        System.out.println("[PrintHelper] " + message);
    }
}
```

### 方法引用实际应用

```java
import java.util.*;
import java.util.stream.*;

public class MethodReferenceExamples {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Eve");

        // 静态方法引用
        names.forEach(System.out::println);

        // 转换为大写
        List<String> upperNames = names.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println("Upper: " + upperNames);

        // 按长度排序
        names.sort(Comparator.comparingInt(String::length));
        System.out.println("By length: " + names);

        // 过滤非空字符串
        List<String> mixedList = Arrays.asList("a", "", "b", null, "c", "");
        List<String> nonEmpty = mixedList.stream()
            .filter(Objects::nonNull)
            .filter(s -> !s.isEmpty())
            .collect(Collectors.toList());
        System.out.println("Non-empty: " + nonEmpty);

        // 构造方法引用与 Stream
        List<String> personNames = Arrays.asList("Alice", "Bob", "Charlie");
        List<Person> persons = personNames.stream()
            .map(Person::new)  // 调用 Person(String name) 构造器
            .collect(Collectors.toList());

        // 转换为数组
        String[] nameArray = names.stream()
            .toArray(String[]::new);

        // 实例方法引用用于比较
        List<Person> personList = Arrays.asList(
            new Person("Charlie"),
            new Person("Alice"),
            new Person("Bob")
        );
        personList.sort(Comparator.comparing(Person::getName));
        System.out.println("Sorted persons: " + personList);
    }
}

class Person {
    private String name;

    public Person(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    @Override
    public String toString() {
        return name;
    }
}
```

## 变量捕获与 Effectively Final

### 什么是变量捕获

Lambda 表达式可以访问外部作用域的变量，这称为"变量捕获"（Variable Capture）。

```java
import java.util.function.*;

public class VariableCapture {
    private int instanceVar = 10;
    private static int staticVar = 20;

    public void demonstrateCapture() {
        int localVar = 30;
        final int finalVar = 40;

        // 1. 捕获实例变量 - 可以读取和修改
        Consumer<Integer> captureInstance = n -> {
            System.out.println("Instance var: " + instanceVar);
            instanceVar = n;  // 可以修改实例变量
        };
        captureInstance.accept(100);
        System.out.println("Modified instance var: " + instanceVar); // 100

        // 2. 捕获静态变量 - 可以读取和修改
        Consumer<Integer> captureStatic = n -> {
            System.out.println("Static var: " + staticVar);
            staticVar = n;  // 可以修改静态变量
        };
        captureStatic.accept(200);
        System.out.println("Modified static var: " + staticVar); // 200

        // 3. 捕获 final 局部变量 - 只能读取
        Supplier<Integer> captureFinal = () -> finalVar;
        System.out.println("Final var: " + captureFinal.get()); // 40

        // 4. 捕获 effectively final 局部变量 - 只能读取
        Supplier<Integer> captureLocal = () -> localVar;
        System.out.println("Local var: " + captureLocal.get()); // 30

        // 错误示例: 不能修改 effectively final 变量
        // localVar = 50;  // 编译错误: Variable used in lambda expression should be final or effectively final
    }

    public static void main(String[] args) {
        new VariableCapture().demonstrateCapture();
    }
}
```

### Effectively Final 规则

Effectively Final 是指虽然没有显式声明为 `final`，但在初始化后从未被修改过的变量。Lambda 表达式只能访问 final 或 effectively final 的局部变量。

```java
import java.util.*;
import java.util.function.*;

public class EffectivelyFinal {
    public static void main(String[] args) {
        // 正确: effectively final
        String greeting = "Hello";
        Consumer<String> greeter = name -> System.out.println(greeting + ", " + name);
        greeter.accept("World");

        // 错误: 不是 effectively final
        /*
        int counter = 0;
        Runnable increment = () -> counter++;  // 编译错误
        counter = 1;
        */

        // 解决方案1: 使用数组或包装对象
        int[] counter = {0};
        Runnable increment = () -> counter[0]++;
        increment.run();
        increment.run();
        System.out.println("Counter: " + counter[0]); // 2

        // 解决方案2: 使用 AtomicInteger
        java.util.concurrent.atomic.AtomicInteger atomicCounter =
            new java.util.concurrent.atomic.AtomicInteger(0);
        Runnable atomicIncrement = () -> atomicCounter.incrementAndGet();
        atomicIncrement.run();
        atomicIncrement.run();
        System.out.println("Atomic counter: " + atomicCounter.get()); // 2

        // 解决方案3: 使用实例变量
        Counter counterObj = new Counter();
        Runnable objIncrement = () -> counterObj.increment();
        objIncrement.run();
        objIncrement.run();
        System.out.println("Object counter: " + counterObj.getValue()); // 2
    }
}

class Counter {
    private int value = 0;

    public void increment() {
        value++;
    }

    public int getValue() {
        return value;
    }
}
```

### 捕获变量的陷阱

```java
import java.util.*;
import java.util.function.*;

public class CapturePitfalls {
    public static void main(String[] args) {
        // 陷阱1: 循环中捕获变量
        List<Runnable> runnables = new ArrayList<>();

        // 错误方式: 所有 Lambda 都捕获同一个变量
        /*
        for (int i = 0; i < 5; i++) {
            runnables.add(() -> System.out.println(i));  // 编译错误
        }
        */

        // 正确方式: 在循环内创建新的 effectively final 变量
        for (int i = 0; i < 5; i++) {
            final int index = i;
            runnables.add(() -> System.out.println(index));
        }
        runnables.forEach(Runnable::run); // 0 1 2 3 4

        // 陷阱2: 捕获可变对象
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
        Supplier<List<String>> supplier = () -> list;  // 捕获的是引用
        list.add("D");  // 修改原对象
        System.out.println(supplier.get()); // [A, B, C, D] - 包含新添加的元素

        // 正确方式: 捕获防御性副本
        List<String> immutableList = List.copyOf(list);
        Supplier<List<String>> safeSupplier = () -> immutableList;

        // 陷阱3: this 引用
        new CapturePitfalls().demonstrateThis();
    }

    private String name = "OuterClass";

    public void demonstrateThis() {
        // Lambda 中的 this 指向外部类
        Supplier<String> getName = () -> this.name;
        System.out.println("Lambda this: " + getName.get()); // OuterClass

        // 匿名内部类中的 this 指向匿名类实例
        Supplier<String> anonGetName = new Supplier<String>() {
            private String name = "InnerClass";

            @Override
            public String get() {
                return this.name;  // 指向匿名类的 name
            }
        };
        System.out.println("Anonymous this: " + anonGetName.get()); // InnerClass
    }
}
```

## Lambda 与集合操作

### 遍历集合

```java
import java.util.*;

public class LambdaCollectionIteration {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

        // 传统 for 循环
        for (int i = 0; i < names.size(); i++) {
            System.out.println(names.get(i));
        }

        // 增强 for 循环
        for (String name : names) {
            System.out.println(name);
        }

        // forEach + Lambda
        names.forEach(name -> System.out.println(name));

        // forEach + 方法引用
        names.forEach(System.out::println);

        // 带索引的遍历
        java.util.stream.IntStream.range(0, names.size())
            .forEach(i -> System.out.println(i + ": " + names.get(i)));

        // Map 的遍历
        Map<String, Integer> map = new HashMap<>();
        map.put("Alice", 25);
        map.put("Bob", 30);
        map.put("Charlie", 35);

        // forEach 遍历 Map
        map.forEach((key, value) -> System.out.println(key + " = " + value));
    }
}
```

### 集合的条件操作

```java
import java.util.*;

public class LambdaCollectionOperations {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));

        // removeIf - 条件删除
        numbers.removeIf(n -> n % 2 == 0);  // 删除所有偶数
        System.out.println("After removeIf: " + numbers); // [1, 3, 5, 7, 9]

        // replaceAll - 批量替换
        numbers.replaceAll(n -> n * 2);  // 所有元素翻倍
        System.out.println("After replaceAll: " + numbers); // [2, 6, 10, 14, 18]

        // sort - 排序
        numbers.sort((a, b) -> b - a);  // 降序排序
        System.out.println("After sort: " + numbers); // [18, 14, 10, 6, 2]

        // Map 操作
        Map<String, Integer> scores = new HashMap<>();
        scores.put("Alice", 85);
        scores.put("Bob", 90);
        scores.put("Charlie", 78);

        // compute - 计算新值
        scores.compute("Alice", (key, oldValue) -> oldValue + 5);
        System.out.println("Alice's new score: " + scores.get("Alice")); // 90

        // computeIfAbsent - 如果不存在则计算
        scores.computeIfAbsent("David", key -> 0);
        System.out.println("David's score: " + scores.get("David")); // 0

        // computeIfPresent - 如果存在则计算
        scores.computeIfPresent("Bob", (key, value) -> value + 10);
        System.out.println("Bob's new score: " + scores.get("Bob")); // 100

        // merge - 合并值
        scores.merge("Alice", 10, (oldVal, newVal) -> oldVal + newVal);
        System.out.println("Alice after merge: " + scores.get("Alice")); // 100

        // getOrDefault - 获取或返回默认值
        int score = scores.getOrDefault("Eve", -1);
        System.out.println("Eve's score: " + score); // -1

        // putIfAbsent - 如果不存在则放入
        scores.putIfAbsent("Eve", 70);
        System.out.println("Eve's score after put: " + scores.get("Eve")); // 70
    }
}
```

## Lambda 与异常处理

### Lambda 中的异常

Lambda 表达式中的异常处理需要特别注意，因为函数式接口通常不声明检查异常。

```java
import java.util.*;
import java.util.function.*;
import java.io.*;

public class LambdaExceptionHandling {
    public static void main(String[] args) {
        List<String> filePaths = Arrays.asList("file1.txt", "file2.txt", "file3.txt");

        // 问题: 内置函数式接口不支持检查异常
        /*
        filePaths.forEach(path -> {
            // 编译错误: Unhandled exception: IOException
            BufferedReader reader = new BufferedReader(new FileReader(path));
        });
        */

        // 解决方案1: 在 Lambda 内部捕获异常
        filePaths.forEach(path -> {
            try {
                processFile(path);
            } catch (IOException e) {
                System.err.println("Error processing " + path + ": " + e.getMessage());
            }
        });

        // 解决方案2: 包装为运行时异常
        filePaths.forEach(path -> {
            try {
                processFile(path);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        });

        // 解决方案3: 使用自定义包装方法
        filePaths.forEach(wrapConsumer(LambdaExceptionHandling::processFile));

        // 解决方案4: 使用自定义函数式接口
        ThrowingConsumer<String, IOException> processor =
            LambdaExceptionHandling::processFile;
        filePaths.forEach(wrapThrowingConsumer(processor));
    }

    private static void processFile(String path) throws IOException {
        // 模拟文件处理
        if (!new File(path).exists()) {
            throw new IOException("File not found: " + path);
        }
    }

    // 包装方法: 将检查异常转换为运行时异常
    private static <T> Consumer<T> wrapConsumer(ThrowingConsumer<T, Exception> consumer) {
        return t -> {
            try {
                consumer.accept(t);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    private static <T, E extends Exception> Consumer<T> wrapThrowingConsumer(
            ThrowingConsumer<T, E> consumer) {
        return t -> {
            try {
                consumer.accept(t);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }
}

// 支持异常的函数式接口
@FunctionalInterface
interface ThrowingConsumer<T, E extends Exception> {
    void accept(T t) throws E;
}
```

### 完整的异常处理工具类

```java
import java.util.function.*;

public class LambdaExceptionUtils {

    @FunctionalInterface
    public interface ThrowingFunction<T, R, E extends Exception> {
        R apply(T t) throws E;
    }

    @FunctionalInterface
    public interface ThrowingConsumer<T, E extends Exception> {
        void accept(T t) throws E;
    }

    @FunctionalInterface
    public interface ThrowingSupplier<T, E extends Exception> {
        T get() throws E;
    }

    @FunctionalInterface
    public interface ThrowingRunnable<E extends Exception> {
        void run() throws E;
    }

    // 包装 java.util.function.Function
    public static <T, R> java.util.function.Function<T, R> wrap(
            ThrowingFunction<T, R, Exception> function) {
        return t -> {
            try {
                return function.apply(t);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    // 包装 Consumer
    public static <T> Consumer<T> wrap(ThrowingConsumer<T, Exception> consumer) {
        return t -> {
            try {
                consumer.accept(t);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    // 包装 Supplier
    public static <T> Supplier<T> wrap(ThrowingSupplier<T, Exception> supplier) {
        return () -> {
            try {
                return supplier.get();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    // 包装 Runnable
    public static Runnable wrap(ThrowingRunnable<Exception> runnable) {
        return () -> {
            try {
                runnable.run();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };
    }

    // 使用示例
    public static void main(String[] args) {
        java.util.List<String> paths = java.util.Arrays.asList("a.txt", "b.txt");

        // 使用包装方法
        paths.stream()
            .map(wrap(path -> new java.io.FileInputStream(path)))
            .forEach(System.out::println);
    }
}
```

## Lambda 最佳实践

### 保持 Lambda 简短

```java
import java.util.*;
import java.util.function.*;

public class LambdaBestPractices {
    public static void main(String[] args) {
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        // 不好: Lambda 过于复杂
        persons.stream()
            .filter(p -> {
                if (p.getAge() > 20) {
                    String name = p.getName();
                    if (name.startsWith("A") || name.startsWith("B")) {
                        return true;
                    }
                }
                return false;
            })
            .forEach(System.out::println);

        // 好: 提取为方法
        persons.stream()
            .filter(LambdaBestPractices::isValidPerson)
            .forEach(System.out::println);

        // 或者分解为多个简单的 Lambda
        persons.stream()
            .filter(p -> p.getAge() > 20)
            .filter(p -> p.getName().startsWith("A") || p.getName().startsWith("B"))
            .forEach(System.out::println);
    }

    private static boolean isValidPerson(Person p) {
        if (p.getAge() <= 20) {
            return false;
        }
        String name = p.getName();
        return name.startsWith("A") || name.startsWith("B");
    }
}

class Person {
    private String name;
    private int age;

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
```

### 优先使用方法引用

```java
import java.util.*;
import java.util.stream.*;

public class PreferMethodReference {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

        // 不推荐: 冗余的 Lambda
        names.forEach(name -> System.out.println(name));
        names.stream().map(name -> name.toUpperCase()).collect(Collectors.toList());
        names.stream().sorted((s1, s2) -> s1.compareTo(s2)).collect(Collectors.toList());

        // 推荐: 使用方法引用
        names.forEach(System.out::println);
        names.stream().map(String::toUpperCase).collect(Collectors.toList());
        names.stream().sorted(String::compareTo).collect(Collectors.toList());

        // 但有时 Lambda 更清晰
        // 当需要部分应用参数时，Lambda 更合适
        String prefix = "Hello, ";
        names.stream()
            .map(name -> prefix + name)  // Lambda 更清晰
            .forEach(System.out::println);
    }
}
```

### 避免副作用

```java
import java.util.*;
import java.util.stream.*;

public class AvoidSideEffects {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 不好: 有副作用的 Lambda
        List<Integer> results = new ArrayList<>();
        numbers.stream()
            .map(n -> n * 2)
            .forEach(n -> results.add(n));  // 副作用: 修改外部集合

        // 好: 使用收集器
        List<Integer> betterResults = numbers.stream()
            .map(n -> n * 2)
            .collect(Collectors.toList());

        // 不好: 修改外部状态
        int[] sum = {0};
        numbers.forEach(n -> sum[0] += n);  // 副作用

        // 好: 使用 reduce
        int betterSum = numbers.stream()
            .reduce(0, Integer::sum);

        // 或使用专用方法
        int anotherSum = numbers.stream()
            .mapToInt(Integer::intValue)
            .sum();
    }
}
```

### 使用适当的函数式接口

```java
import java.util.function.*;

public class UseAppropriateInterfaces {
    public static void main(String[] args) {
        // 不好: 使用通用接口进行 int 操作
        java.util.function.Function<Integer, Integer> doubleIt = n -> n * 2;
        Integer result1 = doubleIt.apply(5);  // 涉及装箱拆箱

        // 好: 使用专门的基本类型接口
        IntUnaryOperator betterDouble = n -> n * 2;
        int result2 = betterDouble.applyAsInt(5);  // 无装箱

        // 不好: 使用返回 Void 的接口进行消费操作
        java.util.function.Function<String, Void> printer = s -> {
            System.out.println(s);
            return null;  // 必须返回值
        };

        // 好: 使用 Consumer
        Consumer<String> betterPrinter = System.out::println;

        // 不好: 使用 Supplier 返回固定值
        Supplier<String> constantSupplier = () -> "constant";

        // 考虑: 直接使用常量
        final String constant = "constant";
    }
}
```

### 明确参数类型（必要时）

```java
import java.util.*;
import java.util.function.*;

public class ExplicitTypes {
    public static void main(String[] args) {
        // 类型推断正常工作
        BiFunction<String, String, String> concat1 = (a, b) -> a + b;

        // 当类型推断失败时，显式声明类型
        // 例如: 重载方法
        process((String s) -> s.length());  // 明确调用哪个重载

        // 或者使用类型转换
        process((java.util.function.Function<String, Integer>) s -> s.length());
    }

    private static void process(java.util.function.Function<String, Integer> func) {
        System.out.println("String -> Integer: " + func.apply("Hello"));
    }

    private static void process(java.util.function.Function<Integer, String> func) {
        System.out.println("Integer -> String: " + func.apply(42));
    }
}
```

### 处理空值

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class HandleNulls {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", null, "Bob", null, "Charlie");

        // 过滤 null
        List<String> nonNullNames = names.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        System.out.println("Non-null names: " + nonNullNames);

        // 使用 Optional
        Optional<String> firstName = names.stream()
            .filter(Objects::nonNull)
            .findFirst();
        firstName.ifPresent(name -> System.out.println("First name: " + name));

        // 安全的 null 处理
        java.util.function.Function<String, String> safeToUpper =
            s -> s == null ? "" : s.toUpperCase();

        // 使用 Optional 包装
        java.util.function.Function<String, Optional<String>> nullSafe =
            s -> Optional.ofNullable(s);

        List<String> processed = names.stream()
            .map(nullSafe)
            .flatMap(Optional::stream)
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println("Processed: " + processed);
    }
}
```

## 高级应用场景

### 柯里化（Currying）

```java
import java.util.function.*;

public class Currying {
    public static void main(String[] args) {
        // 普通双参数函数
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        System.out.println("Normal add: " + add.apply(3, 5)); // 8

        // 柯里化: 将双参数函数转换为一系列单参数函数
        java.util.function.Function<Integer,
            java.util.function.Function<Integer, Integer>> curriedAdd =
            a -> b -> a + b;

        // 使用柯里化函数
        java.util.function.Function<Integer, Integer> add5 = curriedAdd.apply(5);
        System.out.println("Add 5 to 3: " + add5.apply(3)); // 8
        System.out.println("Add 5 to 10: " + add5.apply(10)); // 15

        // 完整调用
        System.out.println("Curried call: " + curriedAdd.apply(3).apply(5)); // 8

        // 三参数柯里化
        java.util.function.Function<String,
            java.util.function.Function<String,
                java.util.function.Function<String, String>>> concat3 =
            a -> b -> c -> a + b + c;

        java.util.function.Function<String,
            java.util.function.Function<String, String>> greetWith =
            concat3.apply("Hello, ");
        java.util.function.Function<String, String> greetBob = greetWith.apply("Bob");
        System.out.println(greetBob.apply("!")); // Hello, Bob!

        // 实际应用: 日志格式化
        java.util.function.Function<String,
            java.util.function.Function<String, String>> logger =
            level -> message -> "[" + level + "] " + message;

        java.util.function.Function<String, String> infoLogger = logger.apply("INFO");
        java.util.function.Function<String, String> errorLogger = logger.apply("ERROR");

        System.out.println(infoLogger.apply("Application started"));
        System.out.println(errorLogger.apply("Connection failed"));
    }
}
```

### 部分应用（Partial Application）

```java
import java.util.function.*;

public class PartialApplication {
    public static void main(String[] args) {
        // 三参数函数
        TriFunction<String, String, String, String> fullGreeting =
            (greeting, name, punctuation) -> greeting + ", " + name + punctuation;

        // 部分应用: 固定第一个参数
        BiFunction<String, String, String> helloGreeting =
            (name, punctuation) -> fullGreeting.apply("Hello", name, punctuation);

        // 部分应用: 固定前两个参数
        java.util.function.Function<String, String> greetAlice =
            punctuation -> fullGreeting.apply("Hi", "Alice", punctuation);

        System.out.println(helloGreeting.apply("Bob", "!")); // Hello, Bob!
        System.out.println(greetAlice.apply("?")); // Hi, Alice?

        // 通用的部分应用工具方法
        BiFunction<String, String, String> partiallyApplied =
            partial(fullGreeting, "Welcome");

        System.out.println(partiallyApplied.apply("Charlie", ".")); // Welcome, Charlie.
    }

    // 部分应用工具方法
    static <A, B, C, R> BiFunction<B, C, R> partial(
            TriFunction<A, B, C, R> func, A a) {
        return (b, c) -> func.apply(a, b, c);
    }
}

@FunctionalInterface
interface TriFunction<A, B, C, R> {
    R apply(A a, B b, C c);
}
```

### 记忆化（Memoization）

```java
import java.util.*;
import java.util.function.*;

public class Memoization {
    public static void main(String[] args) {
        // 创建记忆化的斐波那契函数
        java.util.function.Function<Integer, Long> fibonacci =
            memoize(Memoization::fib);

        // 测试性能
        long start = System.currentTimeMillis();
        System.out.println("fib(40) = " + fibonacci.apply(40));
        System.out.println("Time: " + (System.currentTimeMillis() - start) + "ms");

        // 第二次调用（使用缓存）
        start = System.currentTimeMillis();
        System.out.println("fib(40) again = " + fibonacci.apply(40));
        System.out.println("Time: " + (System.currentTimeMillis() - start) + "ms");
    }

    // 原始的递归斐波那契（无记忆化）
    private static long fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }

    // 记忆化包装器
    public static <T, R> java.util.function.Function<T, R> memoize(
            java.util.function.Function<T, R> function) {
        Map<T, R> cache = new HashMap<>();
        return input -> cache.computeIfAbsent(input, function);
    }

    // 线程安全版本
    public static <T, R> java.util.function.Function<T, R> memoizeThreadSafe(
            java.util.function.Function<T, R> function) {
        Map<T, R> cache = new java.util.concurrent.ConcurrentHashMap<>();
        return input -> cache.computeIfAbsent(input, function);
    }
}
```

### 组合与管道

```java
import java.util.*;
import java.util.function.*;

public class CompositionAndPipeline {
    public static void main(String[] args) {
        // 定义基本转换函数
        java.util.function.Function<String, String> trim = String::trim;
        java.util.function.Function<String, String> toLowerCase = String::toLowerCase;
        java.util.function.Function<String, String> removeSpaces = s -> s.replace(" ", "");
        java.util.function.Function<String, String> addPrefix = s -> "processed_" + s;

        // 组合成管道
        java.util.function.Function<String, String> pipeline = trim
            .andThen(toLowerCase)
            .andThen(removeSpaces)
            .andThen(addPrefix);

        String input = "  Hello World  ";
        String result = pipeline.apply(input);
        System.out.println("Result: " + result); // processed_helloworld

        // 使用 compose（反向组合）
        java.util.function.Function<String, String> reversePipeline = addPrefix
            .compose(removeSpaces)
            .compose(toLowerCase)
            .compose(trim);

        System.out.println("Reverse result: " + reversePipeline.apply(input));

        // 验证管道
        List<Predicate<String>> validators = Arrays.asList(
            s -> s != null,
            s -> !s.isEmpty(),
            s -> s.length() >= 3,
            s -> s.matches("[a-zA-Z]+")
        );

        Predicate<String> allValidations = validators.stream()
            .reduce(p -> true, Predicate::and);

        System.out.println("Valid 'Hello': " + allValidations.test("Hello")); // true
        System.out.println("Valid '12': " + allValidations.test("12")); // false

        // 处理管道
        List<Consumer<String>> processors = Arrays.asList(
            s -> System.out.println("Length: " + s.length()),
            s -> System.out.println("Upper: " + s.toUpperCase()),
            s -> System.out.println("Reversed: " + new StringBuilder(s).reverse())
        );

        Consumer<String> allProcessors = processors.stream()
            .reduce(Consumer::andThen)
            .orElse(s -> {});

        allProcessors.accept("Hello");
    }
}
```

## Lambda 性能考虑

### 装箱与拆箱

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class BoxingPerformance {
    public static void main(String[] args) {
        int iterations = 10_000_000;

        // 使用包装类型 - 涉及装箱拆箱
        List<Integer> boxedList = new ArrayList<>();
        for (int i = 0; i < iterations; i++) {
            boxedList.add(i);
        }

        long start = System.currentTimeMillis();
        long boxedSum = boxedList.stream()
            .reduce(0, Integer::sum);
        System.out.println("Boxed sum time: " + (System.currentTimeMillis() - start) + "ms");

        // 使用基本类型流 - 无装箱
        int[] primitiveArray = new int[iterations];
        for (int i = 0; i < iterations; i++) {
            primitiveArray[i] = i;
        }

        start = System.currentTimeMillis();
        long primitiveSum = IntStream.of(primitiveArray).sum();
        System.out.println("Primitive sum time: " + (System.currentTimeMillis() - start) + "ms");

        // 从 List 转换为基本类型流
        start = System.currentTimeMillis();
        long mappedSum = boxedList.stream()
            .mapToInt(Integer::intValue)
            .sum();
        System.out.println("Mapped sum time: " + (System.currentTimeMillis() - start) + "ms");
    }
}
```

### Lambda 与匿名类的性能差异

```java
import java.util.*;
import java.util.function.*;

public class LambdaVsAnonymousPerformance {
    public static void main(String[] args) {
        int iterations = 1_000_000;

        // 预热
        for (int i = 0; i < 1000; i++) {
            runWithLambda();
            runWithAnonymous();
        }

        // 测试 Lambda
        long start = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            runWithLambda();
        }
        System.out.println("Lambda time: " + (System.currentTimeMillis() - start) + "ms");

        // 测试匿名类
        start = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            runWithAnonymous();
        }
        System.out.println("Anonymous class time: " + (System.currentTimeMillis() - start) + "ms");
    }

    private static void runWithLambda() {
        java.util.function.Function<Integer, Integer> func = x -> x * 2;
        func.apply(5);
    }

    private static void runWithAnonymous() {
        java.util.function.Function<Integer, Integer> func =
            new java.util.function.Function<Integer, Integer>() {
            @Override
            public Integer apply(Integer x) {
                return x * 2;
            }
        };
        func.apply(5);
    }
}
```

### 避免重复创建 Lambda

```java
import java.util.*;
import java.util.function.*;

public class ReuseLambda {
    // 定义为常量字段，避免重复创建
    private static final Predicate<String> IS_NOT_EMPTY = s -> s != null && !s.isEmpty();
    private static final java.util.function.Function<String, String> TO_UPPER =
        String::toUpperCase;
    private static final Comparator<String> BY_LENGTH =
        Comparator.comparingInt(String::length);

    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "", "Bob", null, "Charlie");

        // 使用预定义的 Lambda
        List<String> processed = names.stream()
            .filter(IS_NOT_EMPTY)
            .map(TO_UPPER)
            .sorted(BY_LENGTH)
            .toList();

        System.out.println(processed);

        // 多次使用同一个 Lambda
        processData(names, IS_NOT_EMPTY);
        processData(Arrays.asList("X", "YY", "ZZZ"), IS_NOT_EMPTY);
    }

    private static void processData(List<String> data, Predicate<String> filter) {
        data.stream()
            .filter(filter)
            .forEach(System.out::println);
    }
}
```

## 常见问题与解决方案

### 序列化 Lambda

```java
import java.io.*;
import java.util.function.*;

public class SerializableLambda {
    public static void main(String[] args) throws Exception {
        // 普通 Lambda 不可序列化
        java.util.function.Function<String, Integer> normalFunc = s -> s.length();

        // 可序列化的 Lambda - 使用交叉类型转换
        java.util.function.Function<String, Integer> serializableFunc =
            (java.util.function.Function<String, Integer> & Serializable) s -> s.length();

        // 或者使用自定义可序列化接口
        SerializableFunction<String, Integer> customSerializable = s -> s.length();

        // 序列化测试
        byte[] bytes = serialize(customSerializable);
        SerializableFunction<String, Integer> deserialized =
            (SerializableFunction<String, Integer>) deserialize(bytes);
        System.out.println("Deserialized result: " + deserialized.apply("Hello")); // 5
    }

    private static byte[] serialize(Object obj) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(baos);
        oos.writeObject(obj);
        return baos.toByteArray();
    }

    private static Object deserialize(byte[] bytes) throws IOException, ClassNotFoundException {
        ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
        ObjectInputStream ois = new ObjectInputStream(bais);
        return ois.readObject();
    }
}

@FunctionalInterface
interface SerializableFunction<T, R>
    extends java.util.function.Function<T, R>, Serializable {
}
```

### 调试 Lambda

```java
import java.util.*;
import java.util.stream.*;

public class DebuggingLambda {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 使用 peek 进行调试
        List<Integer> result = numbers.stream()
            .filter(n -> {
                System.out.println("Filtering: " + n);
                return n > 5;
            })
            .peek(n -> System.out.println("After filter: " + n))
            .map(n -> {
                int doubled = n * 2;
                System.out.println("Mapping " + n + " to " + doubled);
                return doubled;
            })
            .peek(n -> System.out.println("After map: " + n))
            .collect(Collectors.toList());

        System.out.println("Final result: " + result);

        // 提取为方法便于设置断点
        numbers.stream()
            .filter(DebuggingLambda::filterCondition)
            .map(DebuggingLambda::transform)
            .forEach(System.out::println);
    }

    private static boolean filterCondition(int n) {
        return n > 5;  // 可以在这里设置断点
    }

    private static int transform(int n) {
        return n * 2;  // 可以在这里设置断点
    }
}
```

### Lambda 中的递归

```java
import java.util.function.*;

public class RecursiveLambda {
    public static void main(String[] args) {
        // 方法1: 使用数组持有引用
        java.util.function.Function<Integer, Long>[] fibHolder =
            new java.util.function.Function[1];
        fibHolder[0] = n -> {
            if (n <= 1) return (long) n;
            return fibHolder[0].apply(n - 1) + fibHolder[0].apply(n - 2);
        };

        System.out.println("Fibonacci(10) = " + fibHolder[0].apply(10)); // 55

        // 方法2: 使用 Y 组合子
        java.util.function.Function<Integer, Long> fibonacci =
            fix(f -> n -> n <= 1 ? (long) n : f.apply(n - 1) + f.apply(n - 2));

        System.out.println("Fibonacci(10) = " + fibonacci.apply(10)); // 55

        // 方法3: 使用静态方法代替（推荐）
        System.out.println("Fibonacci(10) = " + fib(10)); // 55
    }

    // Y 组合子实现
    private static <T, R> java.util.function.Function<T, R> fix(
            java.util.function.Function<
                java.util.function.Function<T, R>,
                java.util.function.Function<T, R>> f) {
        return new java.util.function.Function<T, R>() {
            @Override
            public R apply(T t) {
                return f.apply(this).apply(t);
            }
        };
    }

    // 传统递归方法（推荐）
    private static long fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}
```

## 总结

Lambda 表达式是 Java 8 引入的重要特性，它带来了以下好处:

1. **代码简化**: 减少样板代码，使代码更加简洁
2. **函数式编程**: 支持将行为作为参数传递
3. **更好的 API**: 配合 Stream API 实现声明式数据处理
4. **并行处理**: 简化并行编程

### 关键要点

- Lambda 表达式本质上是函数式接口的实例
- 方法引用是 Lambda 的简写形式
- 只能捕获 final 或 effectively final 的局部变量
- 优先使用内置的函数式接口
- 保持 Lambda 简短，复杂逻辑应提取为方法
- 注意装箱拆箱的性能影响

### 最佳实践清单

| 实践 | 说明 |
|------|------|
| 保持简短 | Lambda 应该只有一到两行，复杂逻辑提取为方法 |
| 使用方法引用 | 当 Lambda 只是调用现有方法时 |
| 避免副作用 | Lambda 应该是纯函数，不修改外部状态 |
| 使用基本类型接口 | 避免不必要的装箱拆箱 |
| 合理命名参数 | 即使类型可推断，也要使用有意义的参数名 |
| 处理异常 | 使用包装方法处理检查异常 |

掌握 Lambda 表达式是现代 Java 开发的基础技能，它与 Stream API、Optional 等特性结合使用，可以编写出更加优雅、简洁和函数式的 Java 代码。
