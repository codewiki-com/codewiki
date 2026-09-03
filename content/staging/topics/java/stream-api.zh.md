---
title: Java Stream API
description: 掌握 Java Stream API:创建、中间操作、终端操作与并行流
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Stream
  - 函数式编程
  - Lambda
status: imported
origin: old/src/content/docs/java/stream-api.zh.md
divergence: 0.243
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: Java 8+
  order: 7
  lastUpdated: 2026-01-07
---

## 什么是 Stream API

Stream API 是 Java 8 引入的一个重要特性,它提供了一种声明式的方式来处理集合数据。Stream 不是数据结构,而是数据源的视图,支持链式操作和函数式编程风格。

### Stream 的特点

- **不存储数据**: Stream 不是数据结构,不会存储元素
- **函数式编程**: 支持 Lambda 表达式和方法引用
- **惰性执行**: 中间操作不会立即执行,只有遇到终端操作才会触发计算
- **可消费性**: Stream 只能被消费一次,消费后不能重复使用
- **支持并行**: 可以轻松转换为并行流,充分利用多核处理器

## Stream 的创建

### 从集合创建

```java
import java.util.*;
import java.util.stream.*;

public class StreamCreation {
    public static void main(String[] args) {
        // 从 List 创建
        List<String> list = Arrays.asList("Java", "Python", "C++", "JavaScript");
        Stream<String> stream1 = list.stream();

        // 从 Set 创建
        Set<Integer> set = new HashSet<>(Arrays.asList(1, 2, 3, 4, 5));
        Stream<Integer> stream2 = set.stream();

        // 从 Map 创建
        Map<String, Integer> map = new HashMap<>();
        map.put("Java", 8);
        map.put("Python", 3);
        Stream<Map.Entry<String, Integer>> stream3 = map.entrySet().stream();
    }
}
```

### 从数组创建

```java
public class StreamFromArray {
    public static void main(String[] args) {
        // 使用 Arrays.stream()
        String[] array = {"A", "B", "C", "D"};
        Stream<String> stream1 = Arrays.stream(array);

        // 指定范围
        int[] numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
        IntStream stream2 = Arrays.stream(numbers, 2, 7); // [3, 4, 5, 6, 7]

        // 使用 Stream.of()
        Stream<String> stream3 = Stream.of("A", "B", "C");
    }
}
```

### 使用 Stream.builder()

```java
public class StreamBuilder {
    public static void main(String[] args) {
        Stream<String> stream = Stream.<String>builder()
            .add("Apple")
            .add("Banana")
            .add("Orange")
            .build();

        stream.forEach(System.out::println);
    }
}
```

### 使用 Stream.generate() 和 Stream.iterate()

```java
public class InfiniteStreams {
    public static void main(String[] args) {
        // generate() - 生成无限流
        Stream<Double> randomStream = Stream.generate(Math::random)
            .limit(5);

        // iterate() - 迭代生成
        Stream<Integer> evenNumbers = Stream.iterate(0, n -> n + 2)
            .limit(10);
        evenNumbers.forEach(System.out::println); // 0, 2, 4, 6, 8...

        // Java 9+ iterate() 带条件
        Stream<Integer> limitedStream = Stream.iterate(0, n -> n < 20, n -> n + 2);
    }
}
```

### 从文件和其他源创建

```java
import java.io.*;
import java.nio.file.*;

public class StreamFromFile {
    public static void main(String[] args) throws IOException {
        // 从文件读取行
        Stream<String> lines = Files.lines(Paths.get("file.txt"));

        // 使用 try-with-resources 确保资源关闭
        try (Stream<String> stream = Files.lines(Paths.get("file.txt"))) {
            stream.forEach(System.out::println);
        }

        // 从字符串创建
        String text = "Hello World";
        IntStream charStream = text.chars();
    }
}
```

## 中间操作 (Intermediate Operations)

中间操作返回一个新的 Stream,可以链式调用。这些操作是惰性的,只有在终端操作执行时才会真正执行。

### filter() - 过滤

```java
import java.util.*;
import java.util.stream.*;

public class FilterExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 过滤出偶数
        List<Integer> evenNumbers = numbers.stream()
            .filter(n -> n % 2 == 0)
            .collect(Collectors.toList());
        System.out.println("偶数: " + evenNumbers); // [2, 4, 6, 8, 10]

        // 过滤字符串
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Eve");
        List<String> longNames = names.stream()
            .filter(name -> name.length() > 4)
            .collect(Collectors.toList());
        System.out.println("长名字: " + longNames); // [Alice, Charlie, David]
    }
}
```

### map() - 映射转换

```java
public class MapExample {
    public static void main(String[] args) {
        List<String> words = Arrays.asList("hello", "world", "java", "stream");

        // 转换为大写
        List<String> upperCase = words.stream()
            .map(String::toUpperCase)
            .collect(Collectors.toList());
        System.out.println(upperCase); // [HELLO, WORLD, JAVA, STREAM]

        // 获取字符串长度
        List<Integer> lengths = words.stream()
            .map(String::length)
            .collect(Collectors.toList());
        System.out.println(lengths); // [5, 5, 4, 6]

        // 对象转换
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        List<String> names = persons.stream()
            .map(Person::getName)
            .collect(Collectors.toList());
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
}
```

### flatMap() - 扁平化映射

```java
public class FlatMapExample {
    public static void main(String[] args) {
        // 嵌套列表扁平化
        List<List<Integer>> nestedList = Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(4, 5, 6),
            Arrays.asList(7, 8, 9)
        );

        List<Integer> flatList = nestedList.stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());
        System.out.println(flatList); // [1, 2, 3, 4, 5, 6, 7, 8, 9]

        // 字符串分词
        List<String> sentences = Arrays.asList("Hello World", "Java Stream", "API Example");
        List<String> words = sentences.stream()
            .flatMap(sentence -> Arrays.stream(sentence.split(" ")))
            .collect(Collectors.toList());
        System.out.println(words); // [Hello, World, Java, Stream, API, Example]

        // 多个数组合并
        String[][] arrays = {{"a", "b"}, {"c", "d"}, {"e", "f"}};
        String[] result = Stream.of(arrays)
            .flatMap(Stream::of)
            .toArray(String[]::new);
    }
}
```

### distinct() - 去重

```java
public class DistinctExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 2, 4, 3, 5, 1, 6);

        List<Integer> distinctNumbers = numbers.stream()
            .distinct()
            .collect(Collectors.toList());
        System.out.println(distinctNumbers); // [1, 2, 3, 4, 5, 6]

        // 对象去重(需要重写 equals 和 hashCode)
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Alice", 25)
        );

        List<Person> distinctPersons = persons.stream()
            .distinct()
            .collect(Collectors.toList());
    }
}
```

### sorted() - 排序

```java
public class SortedExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2, 7, 4, 6);

        // 自然排序
        List<Integer> sorted = numbers.stream()
            .sorted()
            .collect(Collectors.toList());
        System.out.println("升序: " + sorted);

        // 倒序排序
        List<Integer> reversed = numbers.stream()
            .sorted(Comparator.reverseOrder())
            .collect(Collectors.toList());
        System.out.println("降序: " + reversed);

        // 对象排序
        List<Person> persons = Arrays.asList(
            new Person("Charlie", 35),
            new Person("Alice", 25),
            new Person("Bob", 30)
        );

        // 按年龄排序
        List<Person> sortedByAge = persons.stream()
            .sorted(Comparator.comparingInt(Person::getAge))
            .collect(Collectors.toList());

        // 按名字排序
        List<Person> sortedByName = persons.stream()
            .sorted(Comparator.comparing(Person::getName))
            .collect(Collectors.toList());

        // 多字段排序
        List<Person> multiSort = persons.stream()
            .sorted(Comparator.comparing(Person::getAge)
                .thenComparing(Person::getName))
            .collect(Collectors.toList());
    }
}
```

### limit() 和 skip() - 截取和跳过

```java
public class LimitSkipExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 获取前 5 个元素
        List<Integer> first5 = numbers.stream()
            .limit(5)
            .collect(Collectors.toList());
        System.out.println("前5个: " + first5); // [1, 2, 3, 4, 5]

        // 跳过前 3 个元素
        List<Integer> skip3 = numbers.stream()
            .skip(3)
            .collect(Collectors.toList());
        System.out.println("跳过前3个: " + skip3); // [4, 5, 6, 7, 8, 9, 10]

        // 组合使用:分页效果
        int pageSize = 3;
        int pageNumber = 2; // 第2页(从0开始)
        List<Integer> page = numbers.stream()
            .skip(pageNumber * pageSize)
            .limit(pageSize)
            .collect(Collectors.toList());
        System.out.println("第2页: " + page); // [7, 8, 9]
    }
}
```

### peek() - 中间查看

```java
public class PeekExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 调试使用
        List<Integer> result = numbers.stream()
            .peek(n -> System.out.println("原始值: " + n))
            .map(n -> n * 2)
            .peek(n -> System.out.println("翻倍后: " + n))
            .filter(n -> n > 5)
            .peek(n -> System.out.println("过滤后: " + n))
            .collect(Collectors.toList());

        System.out.println("最终结果: " + result);
    }
}
```

## 终端操作 (Terminal Operations)

终端操作会触发流的计算,并产生结果或副作用。执行终端操作后,流就会被消费,不能再使用。

### collect() - 收集结果

```java
import java.util.stream.Collectors;
import java.util.*;

public class CollectExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Eve");

        // 收集到 List
        List<String> list = names.stream()
            .filter(name -> name.length() > 3)
            .collect(Collectors.toList());

        // 收集到 Set
        Set<String> set = names.stream()
            .collect(Collectors.toSet());

        // 收集到 Map
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        Map<String, Integer> nameToAge = persons.stream()
            .collect(Collectors.toMap(
                Person::getName,
                Person::getAge
            ));

        // 分组
        Map<Integer, List<Person>> groupByAge = persons.stream()
            .collect(Collectors.groupingBy(Person::getAge));

        // 分区
        Map<Boolean, List<Person>> partitioned = persons.stream()
            .collect(Collectors.partitioningBy(p -> p.getAge() > 28));

        // 连接字符串
        String joined = names.stream()
            .collect(Collectors.joining(", "));
        System.out.println(joined); // Alice, Bob, Charlie, David, Eve

        String withPrefixSuffix = names.stream()
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println(withPrefixSuffix); // [Alice, Bob, Charlie, David, Eve]
    }
}
```

### forEach() 和 forEachOrdered() - 遍历

```java
public class ForEachExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("A", "B", "C", "D", "E");

        // forEach - 不保证顺序(并行流中)
        list.stream().forEach(System.out::println);

        // forEachOrdered - 保证顺序
        list.parallelStream().forEachOrdered(System.out::println);

        // 使用 Lambda
        list.stream().forEach(item -> {
            System.out.println("处理: " + item);
        });
    }
}
```

### reduce() - 归约操作

```java
public class ReduceExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 求和
        Optional<Integer> sum = numbers.stream()
            .reduce((a, b) -> a + b);
        System.out.println("总和: " + sum.get()); // 15

        // 带初始值的求和
        Integer sum2 = numbers.stream()
            .reduce(0, (a, b) -> a + b);
        System.out.println("总和: " + sum2); // 15

        // 求最大值
        Optional<Integer> max = numbers.stream()
            .reduce(Integer::max);
        System.out.println("最大值: " + max.get()); // 5

        // 求最小值
        Optional<Integer> min = numbers.stream()
            .reduce(Integer::min);
        System.out.println("最小值: " + min.get()); // 1

        // 字符串连接
        List<String> words = Arrays.asList("Java", "Stream", "API");
        String concatenated = words.stream()
            .reduce("", (a, b) -> a + b);
        System.out.println(concatenated); // JavaStreamAPI

        // 复杂归约
        Integer product = numbers.stream()
            .reduce(1, (a, b) -> a * b);
        System.out.println("乘积: " + product); // 120
    }
}
```

### count(), min(), max() - 统计操作

```java
public class StatisticsExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(3, 7, 2, 9, 1, 5, 8, 4, 6);

        // 计数
        long count = numbers.stream()
            .filter(n -> n > 5)
            .count();
        System.out.println("大于5的数量: " + count); // 4

        // 最大值
        Optional<Integer> max = numbers.stream()
            .max(Integer::compareTo);
        System.out.println("最大值: " + max.get()); // 9

        // 最小值
        Optional<Integer> min = numbers.stream()
            .min(Integer::compareTo);
        System.out.println("最小值: " + min.get()); // 1

        // 对象的最大最小值
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        Optional<Person> oldest = persons.stream()
            .max(Comparator.comparingInt(Person::getAge));

        Optional<Person> youngest = persons.stream()
            .min(Comparator.comparingInt(Person::getAge));
    }
}
```

### anyMatch(), allMatch(), noneMatch() - 匹配操作

```java
public class MatchExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // anyMatch - 任意一个匹配
        boolean hasEven = numbers.stream()
            .anyMatch(n -> n % 2 == 0);
        System.out.println("有偶数: " + hasEven); // true

        // allMatch - 全部匹配
        boolean allPositive = numbers.stream()
            .allMatch(n -> n > 0);
        System.out.println("全是正数: " + allPositive); // true

        // noneMatch - 全部不匹配
        boolean noNegative = numbers.stream()
            .noneMatch(n -> n < 0);
        System.out.println("没有负数: " + noNegative); // true

        // 实际应用
        List<String> emails = Arrays.asList(
            "user1@example.com",
            "user2@example.com",
            "invalid-email"
        );

        boolean allValid = emails.stream()
            .allMatch(email -> email.contains("@") && email.contains("."));
        System.out.println("所有邮箱都有效: " + allValid); // false
    }
}
```

### findFirst() 和 findAny() - 查找操作

```java
public class FindExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David", "Eve");

        // findFirst - 返回第一个元素
        Optional<String> first = names.stream()
            .filter(name -> name.length() > 4)
            .findFirst();
        System.out.println("第一个长名字: " + first.orElse("未找到")); // Alice

        // findAny - 返回任意一个元素(并行流中更高效)
        Optional<String> any = names.parallelStream()
            .filter(name -> name.startsWith("C"))
            .findAny();
        System.out.println("任意一个C开头: " + any.orElse("未找到")); // Charlie

        // 实际应用:查找第一个偶数
        List<Integer> numbers = Arrays.asList(1, 3, 5, 8, 9, 10);
        Optional<Integer> firstEven = numbers.stream()
            .filter(n -> n % 2 == 0)
            .findFirst();
        firstEven.ifPresent(n -> System.out.println("第一个偶数: " + n)); // 8
    }
}
```

### toArray() - 转换为数组

```java
public class ToArrayExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

        // 转换为 Object 数组
        Object[] array1 = names.stream().toArray();

        // 转换为指定类型数组
        String[] array2 = names.stream()
            .toArray(String[]::new);

        // 过滤后转数组
        Integer[] evenNumbers = Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
            .filter(n -> n % 2 == 0)
            .toArray(Integer[]::new);

        System.out.println(Arrays.toString(evenNumbers)); // [2, 4, 6, 8, 10]
    }
}
```

## Optional 类

Optional 是一个容器对象,用于避免空指针异常。Stream API 的很多终端操作返回 Optional。

### Optional 基本使用

```java
import java.util.Optional;

public class OptionalExample {
    public static void main(String[] args) {
        // 创建 Optional
        Optional<String> optional1 = Optional.of("Hello");
        Optional<String> optional2 = Optional.ofNullable(null);
        Optional<String> optional3 = Optional.empty();

        // 检查值是否存在
        if (optional1.isPresent()) {
            System.out.println(optional1.get());
        }

        // 使用 ifPresent
        optional1.ifPresent(value -> System.out.println("值: " + value));

        // 获取值或默认值
        String value1 = optional2.orElse("默认值");
        String value2 = optional2.orElseGet(() -> "通过Supplier获取");

        // 抛出异常
        try {
            String value3 = optional2.orElseThrow(() ->
                new IllegalStateException("值不存在"));
        } catch (IllegalStateException e) {
            System.out.println(e.getMessage());
        }

        // map 转换
        Optional<Integer> length = optional1.map(String::length);
        System.out.println("长度: " + length.orElse(0));

        // flatMap
        Optional<String> upperCase = optional1
            .flatMap(s -> Optional.of(s.toUpperCase()));

        // filter
        Optional<String> filtered = optional1
            .filter(s -> s.length() > 3);
    }
}
```

### Optional 与 Stream 结合

```java
public class OptionalWithStream {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

        // 查找并处理
        names.stream()
            .filter(name -> name.startsWith("C"))
            .findFirst()
            .ifPresent(name -> System.out.println("找到: " + name));

        // 链式处理
        String result = names.stream()
            .filter(name -> name.length() > 5)
            .findFirst()
            .map(String::toUpperCase)
            .orElse("未找到");

        System.out.println(result); // CHARLIE

        // Java 9+ Optional.stream()
        List<Optional<String>> listOfOptionals = Arrays.asList(
            Optional.of("A"),
            Optional.empty(),
            Optional.of("B")
        );

        List<String> values = listOfOptionals.stream()
            .flatMap(Optional::stream)
            .collect(Collectors.toList());
        System.out.println(values); // [A, B]
    }
}
```

## Collectors 收集器

Collectors 提供了丰富的收集器实现,用于将流元素收集到各种数据结构中。

### 基本收集器

```java
public class BasicCollectors {
    public static void main(String[] args) {
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 25),
            new Person("David", 30),
            new Person("Eve", 35)
        );

        // toList
        List<String> names = persons.stream()
            .map(Person::getName)
            .collect(Collectors.toList());

        // toSet
        Set<Integer> ages = persons.stream()
            .map(Person::getAge)
            .collect(Collectors.toSet());

        // toCollection
        LinkedList<String> linkedList = persons.stream()
            .map(Person::getName)
            .collect(Collectors.toCollection(LinkedList::new));

        // toMap
        Map<String, Integer> nameAgeMap = persons.stream()
            .collect(Collectors.toMap(
                Person::getName,
                Person::getAge
            ));

        // toMap 处理重复键
        Map<Integer, String> ageNameMap = persons.stream()
            .collect(Collectors.toMap(
                Person::getAge,
                Person::getName,
                (existing, replacement) -> existing + ", " + replacement
            ));
        System.out.println(ageNameMap); // {25=Alice, Charlie, 30=Bob, David, 35=Eve}
    }
}
```

### 分组和分区

```java
public class GroupingExample {
    public static void main(String[] args) {
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 25),
            new Person("David", 30),
            new Person("Eve", 35)
        );

        // groupingBy - 按年龄分组
        Map<Integer, List<Person>> byAge = persons.stream()
            .collect(Collectors.groupingBy(Person::getAge));

        System.out.println("按年龄分组:");
        byAge.forEach((age, list) ->
            System.out.println(age + ": " + list));

        // groupingBy 统计每组数量
        Map<Integer, Long> countByAge = persons.stream()
            .collect(Collectors.groupingBy(
                Person::getAge,
                Collectors.counting()
            ));
        System.out.println("每个年龄的人数: " + countByAge);

        // groupingBy 获取每组的名字列表
        Map<Integer, List<String>> namesByAge = persons.stream()
            .collect(Collectors.groupingBy(
                Person::getAge,
                Collectors.mapping(Person::getName, Collectors.toList())
            ));

        // partitioningBy - 分区(返回 Map<Boolean, List>)
        Map<Boolean, List<Person>> partitioned = persons.stream()
            .collect(Collectors.partitioningBy(p -> p.getAge() > 28));

        System.out.println("年龄>28: " + partitioned.get(true));
        System.out.println("年龄<=28: " + partitioned.get(false));

        // 多级分组
        List<Student> students = Arrays.asList(
            new Student("Alice", "Math", 90),
            new Student("Bob", "Math", 85),
            new Student("Charlie", "Physics", 95),
            new Student("David", "Physics", 88)
        );

        Map<String, Map<Boolean, List<Student>>> multiLevel = students.stream()
            .collect(Collectors.groupingBy(
                Student::getSubject,
                Collectors.partitioningBy(s -> s.getScore() > 90)
            ));
    }
}

class Student {
    private String name;
    private String subject;
    private int score;

    public Student(String name, String subject, int score) {
        this.name = name;
        this.subject = subject;
        this.score = score;
    }

    public String getName() { return name; }
    public String getSubject() { return subject; }
    public int getScore() { return score; }
}
```

### 统计收集器

```java
public class SummarizingCollectors {
    public static void main(String[] args) {
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35),
            new Person("David", 40),
            new Person("Eve", 45)
        );

        // 求和
        Integer totalAge = persons.stream()
            .collect(Collectors.summingInt(Person::getAge));
        System.out.println("总年龄: " + totalAge); // 175

        // 平均值
        Double averageAge = persons.stream()
            .collect(Collectors.averagingInt(Person::getAge));
        System.out.println("平均年龄: " + averageAge); // 35.0

        // 统计摘要
        IntSummaryStatistics stats = persons.stream()
            .collect(Collectors.summarizingInt(Person::getAge));

        System.out.println("统计信息:");
        System.out.println("  数量: " + stats.getCount());
        System.out.println("  总和: " + stats.getSum());
        System.out.println("  最小值: " + stats.getMin());
        System.out.println("  最大值: " + stats.getMax());
        System.out.println("  平均值: " + stats.getAverage());

        // maxBy 和 minBy
        Optional<Person> oldest = persons.stream()
            .collect(Collectors.maxBy(Comparator.comparingInt(Person::getAge)));

        Optional<Person> youngest = persons.stream()
            .collect(Collectors.minBy(Comparator.comparingInt(Person::getAge)));
    }
}
```

### 字符串连接

```java
public class JoiningExample {
    public static void main(String[] args) {
        List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

        // 简单连接
        String result1 = names.stream()
            .collect(Collectors.joining());
        System.out.println(result1); // AliceBobCharlieDavid

        // 使用分隔符
        String result2 = names.stream()
            .collect(Collectors.joining(", "));
        System.out.println(result2); // Alice, Bob, Charlie, David

        // 使用前缀和后缀
        String result3 = names.stream()
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println(result3); // [Alice, Bob, Charlie, David]

        // 结合 map
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        String personInfo = persons.stream()
            .map(p -> p.getName() + "(" + p.getAge() + ")")
            .collect(Collectors.joining(", "));
        System.out.println(personInfo); // Alice(25), Bob(30), Charlie(35)
    }
}
```

## 并行流 (Parallel Streams)

并行流利用多核处理器并行处理数据,可以显著提高大数据集的处理性能。

### 创建并行流

```java
public class ParallelStreamCreation {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 方式1: 从集合创建
        numbers.parallelStream()
            .forEach(System.out::println);

        // 方式2: 将顺序流转换为并行流
        numbers.stream()
            .parallel()
            .forEach(System.out::println);

        // 检查是否是并行流
        boolean isParallel = numbers.parallelStream().isParallel();
        System.out.println("是并行流: " + isParallel); // true

        // 转回顺序流
        numbers.parallelStream()
            .sequential()
            .forEach(System.out::println);
    }
}
```

### 并行流性能示例

```java
import java.time.Duration;
import java.time.Instant;

public class ParallelPerformance {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>();
        for (int i = 0; i < 10_000_000; i++) {
            numbers.add(i);
        }

        // 顺序流
        Instant start1 = Instant.now();
        long sum1 = numbers.stream()
            .mapToLong(Integer::longValue)
            .sum();
        Instant end1 = Instant.now();
        System.out.println("顺序流耗时: " +
            Duration.between(start1, end1).toMillis() + "ms");

        // 并行流
        Instant start2 = Instant.now();
        long sum2 = numbers.parallelStream()
            .mapToLong(Integer::longValue)
            .sum();
        Instant end2 = Instant.now();
        System.out.println("并行流耗时: " +
            Duration.between(start2, end2).toMillis() + "ms");
    }
}
```

### 并行流注意事项

```java
public class ParallelStreamCaveats {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 问题1: 线程安全问题(错误示例)
        List<Integer> resultList = new ArrayList<>();
        // 不要这样做! ArrayList 不是线程安全的
        numbers.parallelStream()
            .forEach(resultList::add); // 可能导致数据丢失或异常

        // 正确做法: 使用 collect
        List<Integer> safeResult = numbers.parallelStream()
            .collect(Collectors.toList());

        // 问题2: 顺序问题
        System.out.println("并行流(无序):");
        numbers.parallelStream()
            .forEach(System.out::println); // 顺序不确定

        System.out.println("\n并行流(有序):");
        numbers.parallelStream()
            .forEachOrdered(System.out::println); // 保持顺序

        // 问题3: 性能陷阱
        // 小数据集使用并行流可能更慢(线程开销)
        List<Integer> smallList = Arrays.asList(1, 2, 3, 4, 5);

        // 对于小数据集,顺序流更快
        smallList.stream()
            .map(n -> n * 2)
            .collect(Collectors.toList());

        // 适合并行的场景:
        // 1. 数据量大
        // 2. 计算密集型操作
        // 3. 无状态操作
        // 4. 不需要保持顺序
    }
}
```

### 并行流最佳实践

```java
public class ParallelBestPractices {
    public static void main(String[] args) {
        // 1. 使用线程安全的归约操作
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        int sum = numbers.parallelStream()
            .reduce(0, Integer::sum);

        // 2. 避免有状态的 Lambda 表达式
        // 错误示例
        int[] counter = {0};
        numbers.parallelStream()
            .forEach(n -> counter[0]++); // 不要这样做!

        // 正确示例: 使用 count()
        long count = numbers.parallelStream()
            .filter(n -> n > 5)
            .count();

        // 3. 选择合适的数据结构
        // ArrayList 和数组适合并行流(易于分割)
        // LinkedList 不适合(难以分割)

        // 4. 设置并行度(谨慎使用)
        System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "4");

        // 5. 对比测试
        // 始终测试并行流是否真的带来性能提升

        // 6. 使用专用的并行流操作
        List<Person> persons = Arrays.asList(
            new Person("Alice", 25),
            new Person("Bob", 30),
            new Person("Charlie", 35)
        );

        // 并发收集
        Map<Integer, List<Person>> grouped = persons.parallelStream()
            .collect(Collectors.groupingByConcurrent(Person::getAge));
    }
}
```

## 实战示例

### 示例1: 数据统计分析

```java
public class DataAnalysis {
    public static void main(String[] args) {
        List<Order> orders = Arrays.asList(
            new Order("O001", "Alice", 150.0, "已完成"),
            new Order("O002", "Bob", 200.0, "已完成"),
            new Order("O003", "Alice", 300.0, "处理中"),
            new Order("O004", "Charlie", 250.0, "已完成"),
            new Order("O005", "Bob", 180.0, "已取消")
        );

        // 1. 计算总销售额(仅已完成订单)
        double totalSales = orders.stream()
            .filter(o -> "已完成".equals(o.getStatus()))
            .mapToDouble(Order::getAmount)
            .sum();
        System.out.println("总销售额: " + totalSales);

        // 2. 按客户分组统计销售额
        Map<String, Double> salesByCustomer = orders.stream()
            .filter(o -> "已完成".equals(o.getStatus()))
            .collect(Collectors.groupingBy(
                Order::getCustomer,
                Collectors.summingDouble(Order::getAmount)
            ));
        System.out.println("客户销售额: " + salesByCustomer);

        // 3. 找出最大订单
        Optional<Order> maxOrder = orders.stream()
            .max(Comparator.comparingDouble(Order::getAmount));
        maxOrder.ifPresent(o ->
            System.out.println("最大订单: " + o.getOrderId() + ", 金额: " + o.getAmount()));

        // 4. 统计各状态订单数量
        Map<String, Long> ordersByStatus = orders.stream()
            .collect(Collectors.groupingBy(
                Order::getStatus,
                Collectors.counting()
            ));
        System.out.println("各状态订单数: " + ordersByStatus);

        // 5. 获取销售额前3的订单
        List<Order> top3 = orders.stream()
            .sorted(Comparator.comparingDouble(Order::getAmount).reversed())
            .limit(3)
            .collect(Collectors.toList());
        System.out.println("前3大订单: " + top3);
    }
}

class Order {
    private String orderId;
    private String customer;
    private double amount;
    private String status;

    public Order(String orderId, String customer, double amount, String status) {
        this.orderId = orderId;
        this.customer = customer;
        this.amount = amount;
        this.status = status;
    }

    public String getOrderId() { return orderId; }
    public String getCustomer() { return customer; }
    public double getAmount() { return amount; }
    public String getStatus() { return status; }

    @Override
    public String toString() {
        return orderId + "(" + amount + ")";
    }
}
```

### 示例2: 文本处理

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

public class TextProcessing {
    public static void main(String[] args) throws IOException {
        String text = "Java Stream API 提供了强大的数据处理能力。" +
                      "Stream API 支持函数式编程风格。" +
                      "使用 Stream API 可以编写简洁优雅的代码。";

        // 1. 分词统计
        Map<String, Long> wordCount = Arrays.stream(text.split("\\s+"))
            .map(String::toLowerCase)
            .collect(Collectors.groupingBy(
                word -> word,
                Collectors.counting()
            ));
        System.out.println("词频统计: " + wordCount);

        // 2. 找出最常出现的词
        Optional<Map.Entry<String, Long>> mostCommon = wordCount.entrySet().stream()
            .max(Map.Entry.comparingByValue());
        mostCommon.ifPresent(entry ->
            System.out.println("最常见的词: " + entry.getKey() +
                             " (出现 " + entry.getValue() + " 次)"));

        // 3. 按词频排序
        List<Map.Entry<String, Long>> sorted = wordCount.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .collect(Collectors.toList());
        System.out.println("按频率排序: " + sorted);

        // 4. 统计不同长度的单词数量
        Map<Integer, Long> lengthDistribution = Arrays.stream(text.split("\\s+"))
            .collect(Collectors.groupingBy(
                String::length,
                Collectors.counting()
            ));
        System.out.println("单词长度分布: " + lengthDistribution);

        // 5. 读取文件并处理(示例)
        /*
        try (Stream<String> lines = Files.lines(Paths.get("file.txt"))) {
            Map<String, Long> fileWordCount = lines
                .flatMap(line -> Arrays.stream(line.split("\\s+")))
                .filter(word -> !word.isEmpty())
                .collect(Collectors.groupingBy(
                    String::toLowerCase,
                    Collectors.counting()
                ));
        }
        */
    }
}
```

### 示例3: 数据转换和映射

```java
public class DataTransformation {
    public static void main(String[] args) {
        List<Employee> employees = Arrays.asList(
            new Employee("E001", "Alice", "IT", 8000),
            new Employee("E002", "Bob", "HR", 6000),
            new Employee("E003", "Charlie", "IT", 9000),
            new Employee("E004", "David", "Finance", 7000),
            new Employee("E005", "Eve", "IT", 8500)
        );

        // 1. 员工转换为 DTO
        List<EmployeeDTO> dtos = employees.stream()
            .map(e -> new EmployeeDTO(
                e.getId(),
                e.getName(),
                e.getDepartment()
            ))
            .collect(Collectors.toList());

        // 2. 按部门分组并计算平均工资
        Map<String, Double> avgSalaryByDept = employees.stream()
            .collect(Collectors.groupingBy(
                Employee::getDepartment,
                Collectors.averagingDouble(Employee::getSalary)
            ));
        System.out.println("部门平均工资: " + avgSalaryByDept);

        // 3. 创建部门-员工名单映射
        Map<String, String> deptEmployees = employees.stream()
            .collect(Collectors.groupingBy(
                Employee::getDepartment,
                Collectors.mapping(
                    Employee::getName,
                    Collectors.joining(", ")
                )
            ));
        System.out.println("部门员工: " + deptEmployees);

        // 4. 工资调整(涨薪10%)
        List<Employee> raisedEmployees = employees.stream()
            .map(e -> new Employee(
                e.getId(),
                e.getName(),
                e.getDepartment(),
                e.getSalary() * 1.1
            ))
            .collect(Collectors.toList());

        // 5. 筛选高薪员工并排序
        List<String> highEarners = employees.stream()
            .filter(e -> e.getSalary() > 7500)
            .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
            .map(e -> e.getName() + ": $" + e.getSalary())
            .collect(Collectors.toList());
        System.out.println("高薪员工: " + highEarners);
    }
}

class Employee {
    private String id;
    private String name;
    private String department;
    private double salary;

    public Employee(String id, String name, String department, double salary) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.salary = salary;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public double getSalary() { return salary; }
}

class EmployeeDTO {
    private String id;
    private String name;
    private String department;

    public EmployeeDTO(String id, String name, String department) {
        this.id = id;
        this.name = name;
        this.department = department;
    }
}
```

## 性能优化建议

### 选择合适的流类型

```java
public class StreamTypeSelection {
    public static void main(String[] args) {
        // 使用基本类型流避免装箱拆箱
        // 不推荐
        int sum1 = Stream.of(1, 2, 3, 4, 5)
            .reduce(0, Integer::sum);

        // 推荐
        int sum2 = IntStream.of(1, 2, 3, 4, 5)
            .sum();

        // LongStream
        long sum3 = LongStream.range(1, 1000000)
            .sum();

        // DoubleStream
        double avg = DoubleStream.of(1.5, 2.5, 3.5, 4.5)
            .average()
            .orElse(0.0);
    }
}
```

### 避免不必要的操作

```java
public class AvoidUnnecessaryOps {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 不好: 多次遍历
        long count = numbers.stream().filter(n -> n > 5).count();
        int sum = numbers.stream().filter(n -> n > 5).mapToInt(Integer::intValue).sum();

        // 好: 一次遍历
        IntSummaryStatistics stats = numbers.stream()
            .filter(n -> n > 5)
            .mapToInt(Integer::intValue)
            .summaryStatistics();

        long betterCount = stats.getCount();
        int betterSum = (int) stats.getSum();

        // 使用短路操作
        boolean hasLarge = numbers.stream()
            .anyMatch(n -> n > 100); // 找到一个就停止
    }
}
```

### 合理使用并行流

```java
public class ParallelUsage {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            list.add(i);
        }

        // 小数据集 - 使用顺序流
        int smallSum = list.stream()
            .filter(n -> n % 2 == 0)
            .mapToInt(Integer::intValue)
            .sum();

        // 大数据集 - 考虑并行流
        List<Integer> bigList = new ArrayList<>();
        for (int i = 0; i < 10_000_000; i++) {
            bigList.add(i);
        }

        long bigSum = bigList.parallelStream()
            .mapToLong(Integer::longValue)
            .sum();
    }
}
```

## 常见陷阱和注意事项

### Stream 只能使用一次

```java
public class StreamReuse {
    public static void main(String[] args) {
        Stream<String> stream = Stream.of("A", "B", "C");

        stream.forEach(System.out::println);

        // 错误: stream 已经被消费
        // stream.forEach(System.out::println); // 会抛出 IllegalStateException

        // 正确做法: 重新创建 stream
        List<String> list = Arrays.asList("A", "B", "C");
        list.stream().forEach(System.out::println);
        list.stream().forEach(System.out::println); // 可以再次使用
    }
}
```

### 修改外部变量

```java
public class ExternalModification {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 不要这样做
        int[] sum = {0};
        numbers.stream().forEach(n -> sum[0] += n); // 不好的实践

        // 正确做法
        int correctSum = numbers.stream()
            .mapToInt(Integer::intValue)
            .sum();
    }
}
```

### 空指针处理

```java
public class NullHandling {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("A", null, "B", null, "C");

        // 过滤 null 值
        List<String> nonNull = list.stream()
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        // 使用 Optional
        Optional<String> result = list.stream()
            .filter(Objects::nonNull)
            .findFirst();

        result.ifPresent(System.out::println);
    }
}
```

## 总结

Stream API 是 Java 8 引入的重要特性,它提供了:

1. **声明式编程**: 代码更简洁,更易读
2. **函数式风格**: 支持 Lambda 表达式和方法引用
3. **惰性执行**: 提高性能,只在需要时计算
4. **并行处理**: 轻松利用多核处理器
5. **丰富的操作**: 提供了大量内置的中间和终端操作

### 最佳实践

- 优先使用 Stream API 处理集合数据
- 合理选择顺序流或并行流
- 使用基本类型流(IntStream, LongStream, DoubleStream)避免装箱
- 利用 Optional 避免空指针异常
- 使用 Collectors 进行复杂的归约操作
- 注意 Stream 的一次性消费特性
- 避免在流操作中修改外部状态

掌握 Stream API 能够显著提高 Java 编程的效率和代码质量,是现代 Java 开发者必备的技能。
