---
title: Java 集合框架
description: 掌握 Java 集合框架：List、Set、Queue、Map 及其实现
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - 集合
  - List
  - Map
status: imported
origin: old/src/content/docs/java/collections.zh.md
divergence: 0.293
issues: []
legacy:
  category: Java
  subcategory: 集合框架
  order: 4
  lastUpdated: 2026-01-07
---

Java 集合框架（Collections Framework）是 Java 中用于存储和操作对象组的统一架构。它提供了一系列接口和实现类，使开发者能够高效地处理各种数据结构。

## 集合框架概述

Java 集合框架主要包含以下几个核心接口：

- **Collection**: 集合层次结构的根接口
  - **List**: 有序集合，允许重复元素
  - **Set**: 不允许重复元素的集合
  - **Queue**: 用于在处理前保存元素的集合
- **Map**: 键值对映射，不是 Collection 的子接口

## List 接口及其实现

List 是一个有序集合，允许存储重复元素，可以通过索引访问元素。

### ArrayList

ArrayList 是基于动态数组实现的 List，提供快速随机访问。

```java
import java.util.ArrayList;
import java.util.List;

public class ArrayListExample {
    public static void main(String[] args) {
        // 创建 ArrayList
        List<String> fruits = new ArrayList<>();

        // 添加元素
        fruits.add("苹果");
        fruits.add("香蕉");
        fruits.add("橙子");
        fruits.add("苹果"); // 允许重复

        // 通过索引访问
        System.out.println("第一个元素: " + fruits.get(0));

        // 修改元素
        fruits.set(1, "草莓");

        // 插入元素
        fruits.add(2, "葡萄");

        // 删除元素
        fruits.remove("橙子");
        fruits.remove(0); // 通过索引删除

        // 遍历
        for (String fruit : fruits) {
            System.out.println(fruit);
        }

        // 获取大小
        System.out.println("集合大小: " + fruits.size());

        // 检查是否包含
        System.out.println("包含苹果? " + fruits.contains("苹果"));
    }
}
```

**特点：**
- 随机访问速度快 O(1)
- 插入和删除操作（中间位置）较慢 O(n)
- 适合读多写少的场景
- 非线程安全

### LinkedList

LinkedList 基于双向链表实现，适合频繁插入和删除操作。

```java
import java.util.LinkedList;
import java.util.List;

public class LinkedListExample {
    public static void main(String[] args) {
        LinkedList<String> tasks = new LinkedList<>();

        // 添加元素
        tasks.add("任务1");
        tasks.add("任务2");
        tasks.add("任务3");

        // 在头部添加
        tasks.addFirst("优先任务");

        // 在尾部添加
        tasks.addLast("最后任务");

        // 获取头部和尾部元素
        System.out.println("第一个任务: " + tasks.getFirst());
        System.out.println("最后一个任务: " + tasks.getLast());

        // 移除头部和尾部
        tasks.removeFirst();
        tasks.removeLast();

        // 作为栈使用
        tasks.push("栈顶元素");
        String top = tasks.pop();
        System.out.println("弹出元素: " + top);

        // 作为队列使用
        tasks.offer("队列元素");
        String head = tasks.poll();
        System.out.println("出队元素: " + head);
    }
}
```

**特点：**
- 插入和删除速度快 O(1)
- 随机访问较慢 O(n)
- 实现了 Deque 接口，可作为栈或队列使用
- 占用内存较多（需要存储前后指针）

### Vector 和 Stack

Vector 是线程安全的动态数组，Stack 继承自 Vector，实现了后进先出（LIFO）栈。

```java
import java.util.Vector;
import java.util.Stack;

public class VectorStackExample {
    public static void main(String[] args) {
        // Vector 示例
        Vector<Integer> vector = new Vector<>();
        vector.add(10);
        vector.add(20);
        vector.add(30);

        // Stack 示例
        Stack<String> stack = new Stack<>();
        stack.push("第一层");
        stack.push("第二层");
        stack.push("第三层");

        // 查看栈顶元素（不移除）
        System.out.println("栈顶: " + stack.peek());

        // 弹出元素
        while (!stack.isEmpty()) {
            System.out.println("弹出: " + stack.pop());
        }
    }
}
```

**注意：** Vector 和 Stack 由于性能原因，现代 Java 开发中通常不推荐使用，建议使用 ArrayList 和 ArrayDeque 代替。

## Set 接口及其实现

Set 是不允许重复元素的集合，不保证元素的顺序（除了 LinkedHashSet）。

### HashSet

HashSet 基于哈希表实现，提供快速的查找、插入和删除操作。

```java
import java.util.HashSet;
import java.util.Set;

public class HashSetExample {
    public static void main(String[] args) {
        Set<String> cities = new HashSet<>();

        // 添加元素
        cities.add("北京");
        cities.add("上海");
        cities.add("深圳");
        cities.add("北京"); // 重复元素，不会被添加

        System.out.println("城市数量: " + cities.size()); // 输出 3

        // 检查元素
        System.out.println("包含上海? " + cities.contains("上海"));

        // 删除元素
        cities.remove("深圳");

        // 遍历
        for (String city : cities) {
            System.out.println(city);
        }

        // 集合操作
        Set<String> moreCities = new HashSet<>();
        moreCities.add("广州");
        moreCities.add("上海");

        // 并集
        Set<String> union = new HashSet<>(cities);
        union.addAll(moreCities);
        System.out.println("并集: " + union);

        // 交集
        Set<String> intersection = new HashSet<>(cities);
        intersection.retainAll(moreCities);
        System.out.println("交集: " + intersection);

        // 差集
        Set<String> difference = new HashSet<>(cities);
        difference.removeAll(moreCities);
        System.out.println("差集: " + difference);
    }
}
```

**特点：**
- 基于 HashMap 实现
- 不保证元素顺序
- 允许 null 值
- 查找、插入、删除时间复杂度 O(1)

### LinkedHashSet

LinkedHashSet 维护了元素的插入顺序。

```java
import java.util.LinkedHashSet;
import java.util.Set;

public class LinkedHashSetExample {
    public static void main(String[] args) {
        Set<String> orderedSet = new LinkedHashSet<>();

        orderedSet.add("第一个");
        orderedSet.add("第二个");
        orderedSet.add("第三个");
        orderedSet.add("第一个"); // 重复，不会添加

        // 保持插入顺序
        for (String item : orderedSet) {
            System.out.println(item);
        }
    }
}
```

**特点：**
- 维护插入顺序
- 性能略低于 HashSet
- 适合需要保持顺序且去重的场景

### TreeSet

TreeSet 基于红黑树实现，元素自动排序。

```java
import java.util.TreeSet;
import java.util.Set;
import java.util.Comparator;

public class TreeSetExample {
    public static void main(String[] args) {
        // 自然排序
        TreeSet<Integer> numbers = new TreeSet<>();
        numbers.add(5);
        numbers.add(2);
        numbers.add(8);
        numbers.add(1);
        numbers.add(9);

        System.out.println("排序后: " + numbers); // [1, 2, 5, 8, 9]

        // 获取第一个和最后一个
        System.out.println("最小值: " + numbers.first());
        System.out.println("最大值: " + numbers.last());

        // 获取子集
        System.out.println("小于5的元素: " + numbers.headSet(5));
        System.out.println("大于等于5的元素: " + numbers.tailSet(5));
        System.out.println("2到8之间: " + numbers.subSet(2, 8));

        // 自定义排序
        TreeSet<String> names = new TreeSet<>(Comparator.reverseOrder());
        names.add("张三");
        names.add("李四");
        names.add("王五");

        System.out.println("逆序: " + names);

        // 自定义对象排序
        TreeSet<Person> people = new TreeSet<>(Comparator.comparing(Person::getAge));
        people.add(new Person("张三", 25));
        people.add(new Person("李四", 30));
        people.add(new Person("王五", 20));

        for (Person p : people) {
            System.out.println(p.getName() + ": " + p.getAge());
        }
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

**特点：**
- 元素自动排序
- 基于红黑树实现
- 操作时间复杂度 O(log n)
- 不允许 null 值

## Queue 接口及其实现

Queue 用于在处理前保存元素，通常以先进先出（FIFO）方式排序。

### LinkedList 作为 Queue

```java
import java.util.Queue;
import java.util.LinkedList;

public class QueueExample {
    public static void main(String[] args) {
        Queue<String> queue = new LinkedList<>();

        // 添加元素
        queue.offer("客户1");
        queue.offer("客户2");
        queue.offer("客户3");

        // 查看队首元素（不移除）
        System.out.println("队首: " + queue.peek());

        // 处理队列
        while (!queue.isEmpty()) {
            String customer = queue.poll();
            System.out.println("正在服务: " + customer);
        }
    }
}
```

### PriorityQueue

PriorityQueue 是基于优先级堆的无界优先级队列。

```java
import java.util.PriorityQueue;
import java.util.Comparator;

public class PriorityQueueExample {
    public static void main(String[] args) {
        // 自然排序（最小堆）
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(5);
        minHeap.offer(2);
        minHeap.offer(8);
        minHeap.offer(1);

        System.out.println("最小堆:");
        while (!minHeap.isEmpty()) {
            System.out.println(minHeap.poll()); // 1, 2, 5, 8
        }

        // 最大堆
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.offer(5);
        maxHeap.offer(2);
        maxHeap.offer(8);
        maxHeap.offer(1);

        System.out.println("最大堆:");
        while (!maxHeap.isEmpty()) {
            System.out.println(maxHeap.poll()); // 8, 5, 2, 1
        }

        // 自定义优先级
        PriorityQueue<Task> taskQueue = new PriorityQueue<>(
            Comparator.comparing(Task::getPriority).reversed()
        );

        taskQueue.offer(new Task("低优先级任务", 1));
        taskQueue.offer(new Task("高优先级任务", 10));
        taskQueue.offer(new Task("中优先级任务", 5));

        while (!taskQueue.isEmpty()) {
            Task task = taskQueue.poll();
            System.out.println(task.getName() + " (优先级: " + task.getPriority() + ")");
        }
    }
}

class Task {
    private String name;
    private int priority;

    public Task(String name, int priority) {
        this.name = name;
        this.priority = priority;
    }

    public String getName() { return name; }
    public int getPriority() { return priority; }
}
```

### ArrayDeque

ArrayDeque 是基于数组的双端队列，可以作为栈或队列使用。

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class ArrayDequeExample {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>();

        // 作为队列使用 (FIFO)
        deque.offerLast("元素1");
        deque.offerLast("元素2");
        deque.offerLast("元素3");

        System.out.println("队列模式:");
        System.out.println(deque.pollFirst()); // 元素1

        // 作为栈使用 (LIFO)
        Deque<String> stack = new ArrayDeque<>();
        stack.push("A");
        stack.push("B");
        stack.push("C");

        System.out.println("栈模式:");
        System.out.println(stack.pop()); // C
        System.out.println(stack.pop()); // B

        // 双端操作
        Deque<Integer> deque2 = new ArrayDeque<>();
        deque2.offerFirst(1);
        deque2.offerLast(2);
        deque2.offerFirst(0);
        deque2.offerLast(3);

        System.out.println("双端队列: " + deque2); // [0, 1, 2, 3]
    }
}
```

## Map 接口及其实现

Map 存储键值对映射，每个键最多映射到一个值。

### HashMap

HashMap 是基于哈希表的 Map 实现，提供快速的查找操作。

```java
import java.util.HashMap;
import java.util.Map;

public class HashMapExample {
    public static void main(String[] args) {
        Map<String, Integer> scores = new HashMap<>();

        // 添加键值对
        scores.put("张三", 85);
        scores.put("李四", 92);
        scores.put("王五", 78);
        scores.put("张三", 90); // 更新值

        // 获取值
        System.out.println("张三的分数: " + scores.get("张三"));

        // 检查键是否存在
        System.out.println("包含李四? " + scores.containsKey("李四"));

        // 检查值是否存在
        System.out.println("有人得92分? " + scores.containsValue(92));

        // 获取或默认值
        System.out.println("赵六的分数: " + scores.getOrDefault("赵六", 0));

        // putIfAbsent - 仅当键不存在时添加
        scores.putIfAbsent("李四", 95); // 不会更新
        scores.putIfAbsent("赵六", 88); // 会添加

        // 遍历方式1: entrySet
        System.out.println("所有成绩:");
        for (Map.Entry<String, Integer> entry : scores.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }

        // 遍历方式2: keySet
        for (String name : scores.keySet()) {
            System.out.println(name + ": " + scores.get(name));
        }

        // 遍历方式3: values
        for (Integer score : scores.values()) {
            System.out.println("分数: " + score);
        }

        // Java 8 forEach
        scores.forEach((name, score) ->
            System.out.println(name + " 得了 " + score + " 分")
        );

        // compute - 计算新值
        scores.compute("张三", (name, score) -> score + 5);

        // merge - 合并值
        scores.merge("李四", 10, (oldVal, newVal) -> oldVal + newVal);

        // 删除
        scores.remove("王五");

        System.out.println("最终成绩: " + scores);
    }
}
```

**特点：**
- 基于哈希表实现
- 不保证顺序
- 允许一个 null 键和多个 null 值
- 时间复杂度 O(1)
- 非线程安全

### LinkedHashMap

LinkedHashMap 维护键值对的插入顺序或访问顺序。

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LinkedHashMapExample {
    public static void main(String[] args) {
        // 插入顺序
        Map<String, String> insertionOrder = new LinkedHashMap<>();
        insertionOrder.put("1", "一");
        insertionOrder.put("3", "三");
        insertionOrder.put("2", "二");

        System.out.println("插入顺序: " + insertionOrder);

        // 访问顺序 LRU 缓存
        Map<String, String> accessOrder = new LinkedHashMap<>(16, 0.75f, true);
        accessOrder.put("A", "第一");
        accessOrder.put("B", "第二");
        accessOrder.put("C", "第三");

        // 访问元素
        accessOrder.get("A");
        accessOrder.get("B");

        System.out.println("访问顺序: " + accessOrder); // C, A, B

        // LRU 缓存实现
        LRUCache<String, String> cache = new LRUCache<>(3);
        cache.put("1", "一");
        cache.put("2", "二");
        cache.put("3", "三");
        cache.get("1"); // 访问
        cache.put("4", "四"); // 会移除最少使用的 "2"

        System.out.println("LRU缓存: " + cache);
    }
}

class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int maxSize;

    public LRUCache(int maxSize) {
        super(16, 0.75f, true);
        this.maxSize = maxSize;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxSize;
    }
}
```

### TreeMap

TreeMap 基于红黑树实现，键自动排序。

```java
import java.util.TreeMap;
import java.util.Map;
import java.util.Comparator;

public class TreeMapExample {
    public static void main(String[] args) {
        // 自然排序
        TreeMap<Integer, String> map = new TreeMap<>();
        map.put(3, "三");
        map.put(1, "一");
        map.put(4, "四");
        map.put(2, "二");

        System.out.println("排序后: " + map); // {1=一, 2=二, 3=三, 4=四}

        // 获取第一个和最后一个
        System.out.println("第一个键: " + map.firstKey());
        System.out.println("最后一个键: " + map.lastKey());

        // 获取小于指定键的最大键
        System.out.println("小于3的最大键: " + map.lowerKey(3));

        // 获取大于指定键的最小键
        System.out.println("大于2的最小键: " + map.higherKey(2));

        // 子映射
        System.out.println("1到3之间: " + map.subMap(1, 3));
        System.out.println("小于3: " + map.headMap(3));
        System.out.println("大于等于2: " + map.tailMap(2));

        // 逆序
        TreeMap<String, Integer> reverseMap = new TreeMap<>(Comparator.reverseOrder());
        reverseMap.put("A", 1);
        reverseMap.put("C", 3);
        reverseMap.put("B", 2);

        System.out.println("逆序: " + reverseMap);
    }
}
```

### Hashtable

Hashtable 是线程安全的哈希表实现，但现代开发中不推荐使用。

```java
import java.util.Hashtable;
import java.util.Map;

public class HashtableExample {
    public static void main(String[] args) {
        Map<String, String> table = new Hashtable<>();

        table.put("key1", "value1");
        table.put("key2", "value2");

        // 不允许 null 键或值
        // table.put(null, "value"); // 会抛出 NullPointerException
        // table.put("key", null);   // 会抛出 NullPointerException

        System.out.println(table);
    }
}
```

**注意：** 推荐使用 `ConcurrentHashMap` 代替 `Hashtable`。

### ConcurrentHashMap

ConcurrentHashMap 是线程安全的 HashMap，性能优于 Hashtable。

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class ConcurrentHashMapExample {
    public static void main(String[] args) {
        Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();

        // 线程安全的操作
        concurrentMap.put("counter", 0);

        // 原子操作
        concurrentMap.compute("counter", (key, value) -> value + 1);
        concurrentMap.computeIfAbsent("newKey", key -> 100);
        concurrentMap.computeIfPresent("counter", (key, value) -> value * 2);

        System.out.println(concurrentMap);

        // 并发环境示例
        Map<String, Integer> sharedMap = new ConcurrentHashMap<>();

        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                sharedMap.merge("count", 1, Integer::sum);
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        Thread t3 = new Thread(task);

        t1.start();
        t2.start();
        t3.start();

        try {
            t1.join();
            t2.join();
            t3.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("最终计数: " + sharedMap.get("count")); // 3000
    }
}
```

## Collections 工具类

Collections 类提供了一系列静态方法用于操作集合。

### 排序与查找

```java
import java.util.*;

public class CollectionsSortExample {
    public static void main(String[] args) {
        List<Integer> numbers = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9, 3));

        // 排序
        Collections.sort(numbers);
        System.out.println("升序: " + numbers);

        // 逆序
        Collections.reverse(numbers);
        System.out.println("逆序: " + numbers);

        // 二分查找（需要先排序）
        Collections.sort(numbers);
        int index = Collections.binarySearch(numbers, 5);
        System.out.println("5的索引: " + index);

        // 最大值和最小值
        System.out.println("最大值: " + Collections.max(numbers));
        System.out.println("最小值: " + Collections.min(numbers));

        // 自定义排序
        List<String> names = new ArrayList<>(Arrays.asList("张三", "李四", "王五"));
        Collections.sort(names, Comparator.reverseOrder());
        System.out.println("逆序排序: " + names);

        // 随机打乱
        Collections.shuffle(numbers);
        System.out.println("打乱后: " + numbers);

        // 旋转
        Collections.rotate(numbers, 2);
        System.out.println("旋转后: " + numbers);
    }
}
```

### 同步包装

```java
import java.util.*;

public class CollectionsSyncExample {
    public static void main(String[] args) {
        // 创建线程安全的集合
        List<String> list = Collections.synchronizedList(new ArrayList<>());
        Set<String> set = Collections.synchronizedSet(new HashSet<>());
        Map<String, String> map = Collections.synchronizedMap(new HashMap<>());

        // 使用同步集合时，遍历需要手动同步
        synchronized (list) {
            for (String item : list) {
                System.out.println(item);
            }
        }
    }
}
```

### 不可变集合

```java
import java.util.*;

public class CollectionsUnmodifiableExample {
    public static void main(String[] args) {
        List<String> originalList = new ArrayList<>(Arrays.asList("A", "B", "C"));

        // 创建不可变集合
        List<String> unmodifiableList = Collections.unmodifiableList(originalList);

        try {
            unmodifiableList.add("D"); // 抛出 UnsupportedOperationException
        } catch (UnsupportedOperationException e) {
            System.out.println("不能修改不可变集合");
        }

        // Java 9+ 创建不可变集合的简便方法
        List<String> immutableList = List.of("X", "Y", "Z");
        Set<String> immutableSet = Set.of("1", "2", "3");
        Map<String, Integer> immutableMap = Map.of("A", 1, "B", 2, "C", 3);

        // 单例集合
        Set<String> singleton = Collections.singleton("唯一元素");
        List<String> singletonList = Collections.singletonList("唯一元素");
        Map<String, String> singletonMap = Collections.singletonMap("key", "value");

        // 空集合
        List<String> emptyList = Collections.emptyList();
        Set<String> emptySet = Collections.emptySet();
        Map<String, String> emptyMap = Collections.emptyMap();
    }
}
```

### 填充与替换

```java
import java.util.*;

public class CollectionsFillExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D", "E"));

        // 填充
        Collections.fill(list, "X");
        System.out.println("填充后: " + list); // [X, X, X, X, X]

        // 替换
        List<String> list2 = new ArrayList<>(Arrays.asList("A", "B", "A", "C", "A"));
        Collections.replaceAll(list2, "A", "Z");
        System.out.println("替换后: " + list2); // [Z, B, Z, C, Z]

        // 复制
        List<String> source = Arrays.asList("1", "2", "3");
        List<String> dest = new ArrayList<>(Arrays.asList("A", "B", "C", "D", "E"));
        Collections.copy(dest, source);
        System.out.println("复制后: " + dest); // [1, 2, 3, D, E]

        // 频率统计
        List<String> items = Arrays.asList("A", "B", "A", "C", "A", "B");
        int frequency = Collections.frequency(items, "A");
        System.out.println("A出现次数: " + frequency); // 3

        // 是否有交集
        List<String> list1 = Arrays.asList("A", "B", "C");
        List<String> list2 = Arrays.asList("C", "D", "E");
        boolean disjoint = Collections.disjoint(list1, list2);
        System.out.println("没有交集? " + disjoint); // false
    }
}
```

## 迭代器（Iterator）

迭代器提供了遍历集合元素的统一方法。

### 基本使用

```java
import java.util.*;

public class IteratorExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D", "E"));

        // 使用 Iterator
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            String element = iterator.next();
            System.out.println(element);

            // 删除元素
            if (element.equals("C")) {
                iterator.remove(); // 安全删除
            }
        }

        System.out.println("删除后: " + list);
    }
}
```

### ListIterator

ListIterator 是 List 特有的迭代器，支持双向遍历和修改。

```java
import java.util.*;

public class ListIteratorExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C", "D"));

        ListIterator<String> iterator = list.listIterator();

        // 向前遍历
        System.out.println("向前遍历:");
        while (iterator.hasNext()) {
            int index = iterator.nextIndex();
            String element = iterator.next();
            System.out.println(index + ": " + element);

            // 修改元素
            if (element.equals("B")) {
                iterator.set("B-Modified");
            }

            // 添加元素
            if (element.equals("C")) {
                iterator.add("C-New");
            }
        }

        // 向后遍历
        System.out.println("\n向后遍历:");
        while (iterator.hasPrevious()) {
            int index = iterator.previousIndex();
            String element = iterator.previous();
            System.out.println(index + ": " + element);
        }

        System.out.println("\n修改后的列表: " + list);
    }
}
```

### forEach 方法

Java 8 引入了 forEach 方法，使用 Lambda 表达式遍历集合。

```java
import java.util.*;

public class ForEachExample {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("A", "B", "C", "D");

        // forEach with Lambda
        list.forEach(item -> System.out.println(item));

        // forEach with Method Reference
        list.forEach(System.out::println);

        // Map forEach
        Map<String, Integer> map = new HashMap<>();
        map.put("A", 1);
        map.put("B", 2);
        map.put("C", 3);

        map.forEach((key, value) ->
            System.out.println(key + " = " + value)
        );
    }
}
```

### Spliterator

Spliterator 是 Java 8 引入的可分割迭代器，支持并行遍历。

```java
import java.util.*;

public class SpliteratorExample {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8);

        Spliterator<Integer> spliterator1 = numbers.spliterator();
        Spliterator<Integer> spliterator2 = spliterator1.trySplit();

        System.out.println("第一部分:");
        spliterator1.forEachRemaining(System.out::println);

        System.out.println("第二部分:");
        spliterator2.forEachRemaining(System.out::println);
    }
}
```

## 集合选择指南

### List 选择

- **ArrayList**: 需要快速随机访问，读多写少
- **LinkedList**: 频繁在头尾插入删除，或需要队列/栈功能
- **CopyOnWriteArrayList**: 读多写少的并发场景

### Set 选择

- **HashSet**: 不需要排序，追求性能
- **LinkedHashSet**: 需要保持插入顺序
- **TreeSet**: 需要自动排序
- **EnumSet**: 元素是枚举类型

### Queue 选择

- **LinkedList**: 简单的队列需求
- **ArrayDeque**: 高性能队列或栈
- **PriorityQueue**: 需要优先级排序
- **LinkedBlockingQueue**: 线程安全的阻塞队列

### Map 选择

- **HashMap**: 通用场景，追求性能
- **LinkedHashMap**: 需要保持顺序或实现 LRU 缓存
- **TreeMap**: 需要键排序
- **ConcurrentHashMap**: 并发环境
- **EnumMap**: 键是枚举类型

## 性能对比

| 集合类型 | 添加 | 删除 | 查找 | 遍历 | 内存占用 |
|---------|------|------|------|------|----------|
| ArrayList | O(1)/O(n) | O(n) | O(1) | O(n) | 低 |
| LinkedList | O(1) | O(1) | O(n) | O(n) | 高 |
| HashSet | O(1) | O(1) | O(1) | O(n) | 中 |
| TreeSet | O(log n) | O(log n) | O(log n) | O(n) | 中 |
| HashMap | O(1) | O(1) | O(1) | O(n) | 中 |
| TreeMap | O(log n) | O(log n) | O(log n) | O(n) | 中 |
| ArrayDeque | O(1) | O(1) | O(n) | O(n) | 低 |
| PriorityQueue | O(log n) | O(log n) | O(n) | O(n) | 低 |

## 最佳实践

1. **使用接口类型声明变量**
   ```java
   List<String> list = new ArrayList<>();  // 好
   ArrayList<String> list = new ArrayList<>();  // 不推荐
   ```

2. **指定初始容量**
   ```java
   // 如果知道大致容量，可以减少扩容次数
   List<String> list = new ArrayList<>(1000);
   Map<String, String> map = new HashMap<>(100);
   ```

3. **使用泛型**
   ```java
   List<String> list = new ArrayList<>();  // 使用泛型
   List list = new ArrayList();  // 避免使用原始类型
   ```

4. **优先使用不可变集合**
   ```java
   List<String> list = List.of("A", "B", "C");
   Set<String> set = Set.of("1", "2", "3");
   ```

5. **避免在循环中修改集合**
   ```java
   // 错误
   for (String item : list) {
       list.remove(item);  // ConcurrentModificationException
   }

   // 正确
   Iterator<String> it = list.iterator();
   while (it.hasNext()) {
       String item = it.next();
       it.remove();
   }
   ```

6. **选择合适的并发集合**
   ```java
   // 并发环境
   Map<String, String> map = new ConcurrentHashMap<>();
   List<String> list = new CopyOnWriteArrayList<>();
   Queue<String> queue = new ConcurrentLinkedQueue<>();
   ```

## 总结

Java 集合框架是 Java 编程中最重要的组成部分之一。理解各种集合类的特点和适用场景，能够帮助我们编写高效、可维护的代码。关键要点：

- **List** 适合有序、可重复的数据
- **Set** 适合去重和集合运算
- **Queue** 适合先进先出或优先级处理
- **Map** 适合键值对映射
- 根据具体场景选择合适的实现类
- 在并发环境使用线程安全的集合
- 合理使用 Collections 工具类
- 掌握迭代器的使用方法

通过实践和经验积累，你将能够熟练运用 Java 集合框架解决各种实际问题。
