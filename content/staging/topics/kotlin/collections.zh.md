---
title: 集合与序列
description: Kotlin集合完全指南，List、Set、Map与序列操作
track: kotlin
section: functions-classes
difficulty: intermediate
tags:
  - Kotlin
  - 集合
  - List
  - Sequence
status: imported
origin: old/src/content/docs/kotlin/collections.zh.md
divergence: 0.205
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: 标准库
  order: 9
  lastUpdated: 2026-01-07
---

集合是任何编程语言中最重要的数据结构之一。Kotlin 提供了强大而灵活的集合框架，包括 List、Set、Map 三大核心类型，以及用于延迟计算的序列（Sequence）。本文将深入探讨 Kotlin 集合的各个方面，帮助你掌握高效的数据处理技能。

## 集合概述

Kotlin 的集合框架建立在 Java 集合之上，但提供了更丰富的 API 和更清晰的可变性区分。

### 可变与不可变集合

Kotlin 集合的一个核心设计理念是区分**只读集合**和**可变集合**。

```kotlin
// 只读集合 - 没有修改方法
val readOnlyList: List<String> = listOf("苹果", "香蕉", "橙子")
val readOnlySet: Set<Int> = setOf(1, 2, 3)
val readOnlyMap: Map<String, Int> = mapOf("一" to 1, "二" to 2)

// 可变集合 - 可以添加、删除、修改元素
val mutableList: MutableList<String> = mutableListOf("苹果", "香蕉")
val mutableSet: MutableSet<Int> = mutableSetOf(1, 2, 3)
val mutableMap: MutableMap<String, Int> = mutableMapOf("一" to 1)
```

**重要说明**：只读集合并不意味着不可变。如果底层实现是可变的，通过其他引用仍可修改。

```kotlin
val mutableNumbers = mutableListOf(1, 2, 3)
val readOnlyView: List<Int> = mutableNumbers  // 只读视图

mutableNumbers.add(4)
println(readOnlyView)  // [1, 2, 3, 4] - 只读视图也看到了变化
```

### 集合接口层次

```kotlin
// Collection 接口层次
// Iterable
//   └── Collection
//         ├── List
//         ├── Set
//         └── (Map 不是 Collection 的子接口)

// 可变集合接口层次
// MutableIterable
//   └── MutableCollection
//         ├── MutableList
//         └── MutableSet
```

## List - 有序集合

List 是最常用的集合类型，它保持元素的插入顺序，允许通过索引访问元素，并且允许重复元素。

### 创建 List

```kotlin
// 空列表
val emptyList: List<String> = emptyList()
val emptyList2 = listOf<Int>()

// 使用 listOf 创建只读列表
val fruits = listOf("苹果", "香蕉", "橙子", "苹果")  // 允许重复
println(fruits)  // [苹果, 香蕉, 橙子, 苹果]

// 使用 mutableListOf 创建可变列表
val numbers = mutableListOf(1, 2, 3)
numbers.add(4)
numbers.removeAt(0)
println(numbers)  // [2, 3, 4]

// 使用 ArrayList
val arrayList = ArrayList<String>()
arrayList.add("Kotlin")

// 使用 buildList 构建复杂列表（Kotlin 1.6+）
val complexList = buildList {
    add("第一项")
    addAll(listOf("第二项", "第三项"))
    if (true) {
        add("条件项")
    }
}

// 使用 List 构造函数创建指定大小的列表
val squares = List(5) { index -> index * index }
println(squares)  // [0, 1, 4, 9, 16]

// 创建重复元素的列表
val repeated = List(3) { "Kotlin" }
println(repeated)  // [Kotlin, Kotlin, Kotlin]
```

### 访问 List 元素

```kotlin
val languages = listOf("Kotlin", "Java", "Python", "Go")

// 使用索引访问
println(languages[0])  // Kotlin
println(languages.get(1))  // Java

// 安全访问 - 索引越界时返回 null
println(languages.getOrNull(10))  // null

// 提供默认值
println(languages.getOrElse(10) { "未知语言" })  // 未知语言

// 获取第一个和最后一个元素
println(languages.first())  // Kotlin
println(languages.last())   // Go

// 安全获取
println(languages.firstOrNull())  // Kotlin
println(emptyList<String>().firstOrNull())  // null

// 条件获取
println(languages.first { it.startsWith("P") })  // Python
println(languages.firstOrNull { it.startsWith("X") })  // null

// 获取子列表
println(languages.subList(1, 3))  // [Java, Python]
println(languages.take(2))  // [Kotlin, Java]
println(languages.takeLast(2))  // [Python, Go]
println(languages.drop(1))  // [Java, Python, Go]
println(languages.dropLast(2))  // [Kotlin, Java]
```

### 修改 MutableList

```kotlin
val cities = mutableListOf("北京", "上海")

// 添加元素
cities.add("广州")
cities.add(0, "深圳")  // 在指定位置插入
cities.addAll(listOf("杭州", "成都"))
cities += "武汉"  // 操作符重载
println(cities)  // [深圳, 北京, 上海, 广州, 杭州, 成都, 武汉]

// 修改元素
cities[0] = "天津"
cities.set(1, "重庆")

// 删除元素
cities.remove("广州")  // 按值删除
cities.removeAt(0)  // 按索引删除
cities.removeAll { it.length > 2 }  // 按条件删除
cities -= "武汉"  // 操作符重载

// 清空列表
cities.clear()

// 批量操作
val items = mutableListOf(1, 2, 3, 4, 5)
items.retainAll { it % 2 == 0 }  // 只保留偶数
println(items)  // [2, 4]
```

### List 常用操作

```kotlin
val numbers = listOf(3, 1, 4, 1, 5, 9, 2, 6)

// 查找元素
println(numbers.indexOf(1))  // 1 (第一个匹配的索引)
println(numbers.lastIndexOf(1))  // 3 (最后一个匹配的索引)
println(numbers.indexOfFirst { it > 4 })  // 4
println(numbers.indexOfLast { it > 4 })  // 7

// 包含检查
println(3 in numbers)  // true
println(numbers.contains(3))  // true
println(numbers.containsAll(listOf(1, 2, 3)))  // true

// 排序（返回新列表）
println(numbers.sorted())  // [1, 1, 2, 3, 4, 5, 6, 9]
println(numbers.sortedDescending())  // [9, 6, 5, 4, 3, 2, 1, 1]
println(numbers.reversed())  // [6, 2, 9, 5, 1, 4, 1, 3]
println(numbers.shuffled())  // 随机顺序

// 自定义排序
data class Person(val name: String, val age: Int)
val people = listOf(
    Person("张三", 25),
    Person("李四", 30),
    Person("王五", 20)
)
println(people.sortedBy { it.age })  // 按年龄升序
println(people.sortedByDescending { it.name })  // 按姓名降序
println(people.sortedWith(compareBy({ it.age }, { it.name })))  // 多条件排序

// 可变列表原地排序
val mutableNumbers = mutableListOf(3, 1, 4, 1, 5)
mutableNumbers.sort()
println(mutableNumbers)  // [1, 1, 3, 4, 5]
```

## Set - 无重复集合

Set 是不包含重复元素的集合。Kotlin 提供了基于哈希的 HashSet 和保持插入顺序的 LinkedHashSet。

### 创建 Set

```kotlin
// 空集合
val emptySet: Set<String> = emptySet()

// 使用 setOf 创建只读 Set（默认是 LinkedHashSet，保持顺序）
val colors = setOf("红", "绿", "蓝", "红")  // 重复元素会被忽略
println(colors)  // [红, 绿, 蓝]
println(colors.size)  // 3

// 使用 mutableSetOf 创建可变 Set
val numbers = mutableSetOf(1, 2, 3)
numbers.add(4)
numbers.add(2)  // 已存在，不会添加
println(numbers)  // [1, 2, 3, 4]

// 指定实现类型
val hashSet = hashSetOf(3, 1, 4, 1, 5)  // 无序
val linkedHashSet = linkedSetOf(3, 1, 4, 1, 5)  // 保持插入顺序
val sortedSet = sortedSetOf(3, 1, 4, 1, 5)  // 排序
println(sortedSet)  // [1, 3, 4, 5]

// 使用 buildSet 构建
val builtSet = buildSet {
    add("A")
    addAll(setOf("B", "C"))
}
```

### Set 操作

```kotlin
val set1 = setOf(1, 2, 3, 4, 5)
val set2 = setOf(4, 5, 6, 7, 8)

// 集合运算
val union = set1 union set2  // 并集
println(union)  // [1, 2, 3, 4, 5, 6, 7, 8]

val intersect = set1 intersect set2  // 交集
println(intersect)  // [4, 5]

val subtract = set1 subtract set2  // 差集
println(subtract)  // [1, 2, 3]

// 也可以使用操作符
println(set1 + set2)  // 并集
println(set1 - set2)  // 差集

// 子集检查
val subset = setOf(1, 2)
println(subset.all { it in set1 })  // true - subset 是 set1 的子集

// 修改可变 Set
val mutableSet = mutableSetOf("A", "B", "C")
mutableSet.add("D")
mutableSet.remove("A")
mutableSet.addAll(setOf("E", "F"))
mutableSet.removeAll { it > "C" }
println(mutableSet)  // [B, C]
```

### Set 的实际应用

```kotlin
// 去重
val duplicates = listOf(1, 2, 2, 3, 3, 3, 4)
val unique = duplicates.toSet()
println(unique)  // [1, 2, 3, 4]

// 快速查找
val validCodes = setOf("A001", "B002", "C003", "D004")
fun isValidCode(code: String): Boolean = code in validCodes

// 标签系统
data class Article(val title: String, val tags: Set<String>)

val articles = listOf(
    Article("Kotlin 入门", setOf("Kotlin", "编程", "入门")),
    Article("Android 开发", setOf("Android", "Kotlin", "移动开发")),
    Article("Java 基础", setOf("Java", "编程", "入门"))
)

// 查找包含特定标签的文章
val kotlinArticles = articles.filter { "Kotlin" in it.tags }
println(kotlinArticles.map { it.title })  // [Kotlin 入门, Android 开发]

// 获取所有标签
val allTags = articles.flatMap { it.tags }.toSet()
println(allTags)  // [Kotlin, 编程, 入门, Android, 移动开发, Java]
```

## Map - 键值对集合

Map 存储键值对（key-value pairs），每个键只能对应一个值。

### 创建 Map

```kotlin
// 空 Map
val emptyMap: Map<String, Int> = emptyMap()

// 使用 mapOf 创建只读 Map
val capitals = mapOf(
    "中国" to "北京",
    "日本" to "东京",
    "韩国" to "首尔"
)

// 使用 Pair 创建
val scores = mapOf(
    Pair("数学", 95),
    Pair("语文", 88),
    Pair("英语", 92)
)

// 使用 mutableMapOf 创建可变 Map
val userAges = mutableMapOf(
    "张三" to 25,
    "李四" to 30
)
userAges["王五"] = 28

// 指定实现类型
val hashMap = hashMapOf("a" to 1, "b" to 2)  // 无序
val linkedHashMap = linkedMapOf("a" to 1, "b" to 2)  // 保持插入顺序
val sortedMap = sortedMapOf("c" to 3, "a" to 1, "b" to 2)  // 按键排序
println(sortedMap)  // {a=1, b=2, c=3}

// 使用 buildMap 构建
val config = buildMap {
    put("host", "localhost")
    put("port", "8080")
    if (true) {
        put("debug", "true")
    }
}
```

### 访问 Map

```kotlin
val countries = mapOf(
    "CN" to "中国",
    "US" to "美国",
    "JP" to "日本"
)

// 使用 [] 操作符访问
println(countries["CN"])  // 中国
println(countries["XX"])  // null (键不存在)

// 使用 get 方法
println(countries.get("US"))  // 美国

// 安全访问 - 提供默认值
println(countries.getOrDefault("XX", "未知国家"))  // 未知国家
println(countries.getOrElse("XX") { "国家代码 $it 未找到" })  // 国家代码 XX 未找到

// getValue - 键不存在时抛出异常
// println(countries.getValue("XX"))  // NoSuchElementException

// 检查键或值是否存在
println("CN" in countries)  // true
println(countries.containsKey("CN"))  // true
println(countries.containsValue("中国"))  // true

// 获取所有键、值、条目
println(countries.keys)  // [CN, US, JP]
println(countries.values)  // [中国, 美国, 日本]
println(countries.entries)  // [CN=中国, US=美国, JP=日本]
```

### 修改 MutableMap

```kotlin
val inventory = mutableMapOf(
    "苹果" to 100,
    "香蕉" to 50
)

// 添加或更新
inventory["橙子"] = 75
inventory.put("葡萄", 30)
inventory.putAll(mapOf("西瓜" to 20, "芒果" to 40))

// 使用 += 操作符
inventory += "梨" to 60
inventory += mapOf("桃" to 45)

// 仅在键不存在时添加
inventory.putIfAbsent("苹果", 200)  // 不会更新，因为键已存在
inventory.getOrPut("榴莲") { 10 }  // 添加并返回值

// 删除
inventory.remove("香蕉")
inventory.remove("苹果", 50)  // 只有值匹配时才删除
inventory -= "橙子"

// 条件更新
inventory.compute("西瓜") { _, v -> (v ?: 0) + 10 }
inventory.merge("苹果", 50) { old, new -> old + new }

// 遍历并修改
inventory.replaceAll { key, value ->
    if (key.length > 2) value * 2 else value
}

// 清空
inventory.clear()
```

### Map 遍历

```kotlin
val prices = mapOf(
    "咖啡" to 25.0,
    "茶" to 15.0,
    "果汁" to 20.0
)

// 遍历条目
for (entry in prices) {
    println("${entry.key}: ¥${entry.value}")
}

// 解构遍历
for ((name, price) in prices) {
    println("$name: ¥$price")
}

// 使用 forEach
prices.forEach { (name, price) ->
    println("$name: ¥$price")
}

// 只遍历键或值
prices.keys.forEach { println("商品: $it") }
prices.values.forEach { println("价格: ¥$it") }

// 使用索引遍历
prices.entries.forEachIndexed { index, (name, price) ->
    println("$index. $name: ¥$price")
}
```

### Map 的实际应用

```kotlin
// 分组统计
data class Student(val name: String, val grade: Int, val score: Int)

val students = listOf(
    Student("张三", 1, 85),
    Student("李四", 2, 92),
    Student("王五", 1, 78),
    Student("赵六", 2, 88),
    Student("钱七", 1, 95)
)

// 按年级分组
val byGrade: Map<Int, List<Student>> = students.groupBy { it.grade }
println(byGrade)

// 计算每个年级的平均分
val avgByGrade = students.groupBy { it.grade }
    .mapValues { (_, students) -> students.map { it.score }.average() }
println(avgByGrade)  // {1=86.0, 2=90.0}

// 创建查找表
val studentByName: Map<String, Student> = students.associateBy { it.name }
println(studentByName["张三"])  // Student(name=张三, grade=1, score=85)

// 转换为 Map
val nameToScore: Map<String, Int> = students.associate { it.name to it.score }
println(nameToScore)  // {张三=85, 李四=92, 王五=78, 赵六=88, 钱七=95}

// 计数
val words = listOf("apple", "banana", "apple", "cherry", "banana", "apple")
val wordCount = words.groupingBy { it }.eachCount()
println(wordCount)  // {apple=3, banana=2, cherry=1}
```

## 集合转换操作

Kotlin 提供了丰富的集合转换操作，使数据处理变得简洁而强大。

### map - 映射转换

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// 基本映射
val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]

// 带索引的映射
val indexed = numbers.mapIndexed { index, value ->
    "[$index] = $value"
}
println(indexed)  // [[0] = 1, [1] = 2, [2] = 3, [3] = 4, [4] = 5]

// 过滤 null 值的映射
val nullableList = listOf(1, 2, null, 4, null)
val nonNull = nullableList.mapNotNull { it?.times(2) }
println(nonNull)  // [2, 4, 8]

// 映射 Map 的键或值
val prices = mapOf("A" to 100, "B" to 200)
val discounted = prices.mapValues { it.value * 0.9 }
println(discounted)  // {A=90.0, B=180.0}

val uppercaseKeys = prices.mapKeys { it.key.lowercase() }
println(uppercaseKeys)  // {a=100, b=200}
```

### filter - 过滤

```kotlin
val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

// 基本过滤
val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4, 6, 8, 10]

// 带索引的过滤
val indexed = numbers.filterIndexed { index, _ -> index % 2 == 0 }
println(indexed)  // [1, 3, 5, 7, 9]

// 过滤非 null 值
val nullable = listOf(1, null, 2, null, 3)
val nonNull = nullable.filterNotNull()
println(nonNull)  // [1, 2, 3]

// 按类型过滤
val mixed: List<Any> = listOf(1, "a", 2, "b", 3.0)
val strings = mixed.filterIsInstance<String>()
println(strings)  // [a, b]

// 分区 - 将元素分成满足和不满足条件的两组
val (passed, failed) = numbers.partition { it >= 6 }
println("及格: $passed, 不及格: $failed")  // 及格: [6, 7, 8, 9, 10], 不及格: [1, 2, 3, 4, 5]

// 过滤 Map
val scores = mapOf("张三" to 85, "李四" to 92, "王五" to 58)
val passedStudents = scores.filter { it.value >= 60 }
println(passedStudents)  // {张三=85, 李四=92}
```

### flatMap - 扁平化映射

```kotlin
// 基本 flatMap
val nested = listOf(listOf(1, 2), listOf(3, 4), listOf(5))
val flattened = nested.flatten()
println(flattened)  // [1, 2, 3, 4, 5]

// flatMap 结合映射和扁平化
val sentences = listOf("Hello World", "Kotlin is great")
val words = sentences.flatMap { it.split(" ") }
println(words)  // [Hello, World, Kotlin, is, great]

// 实际应用 - 获取所有订单的商品
data class Order(val id: Int, val items: List<String>)

val orders = listOf(
    Order(1, listOf("手机", "耳机")),
    Order(2, listOf("电脑", "鼠标", "键盘")),
    Order(3, listOf("平板"))
)

val allItems = orders.flatMap { it.items }
println(allItems)  // [手机, 耳机, 电脑, 鼠标, 键盘, 平板]

// flatMapIndexed
val indexed = listOf("a", "b", "c").flatMapIndexed { index, s ->
    List(index + 1) { s }
}
println(indexed)  // [a, b, b, c, c, c]
```

### 其他转换操作

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// zip - 合并两个集合
val letters = listOf("a", "b", "c")
val zipped = numbers.zip(letters)
println(zipped)  // [(1, a), (2, b), (3, c)]

val combined = numbers.zip(letters) { num, letter -> "$letter$num" }
println(combined)  // [a1, b2, c3]

// unzip - 拆分 Pair 列表
val pairs = listOf(1 to "a", 2 to "b", 3 to "c")
val (nums, chars) = pairs.unzip()
println(nums)   // [1, 2, 3]
println(chars)  // [a, b, c]

// associate - 创建 Map
val words = listOf("apple", "banana", "cherry")
val wordLengths = words.associateWith { it.length }
println(wordLengths)  // {apple=5, banana=6, cherry=6}

val indexedWords = words.withIndex().associate { it.index to it.value }
println(indexedWords)  // {0=apple, 1=banana, 2=cherry}

// chunked - 分块
val chunked = (1..10).toList().chunked(3)
println(chunked)  // [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

// windowed - 滑动窗口
val windowed = (1..5).toList().windowed(3)
println(windowed)  // [[1, 2, 3], [2, 3, 4], [3, 4, 5]]

val windowed2 = (1..5).toList().windowed(3, step = 2)
println(windowed2)  // [[1, 2, 3], [3, 4, 5]]

// distinct - 去重
val duplicates = listOf(1, 2, 2, 3, 3, 3)
println(duplicates.distinct())  // [1, 2, 3]

data class Person(val name: String, val age: Int)
val people = listOf(
    Person("张三", 25),
    Person("李四", 25),
    Person("张三", 30)
)
println(people.distinctBy { it.name })  // [Person(name=张三, age=25), Person(name=李四, age=25)]
```

## 聚合操作

聚合操作将集合中的多个元素组合成单个结果。

### 基本聚合

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// 数量
println(numbers.count())  // 5
println(numbers.count { it % 2 == 0 })  // 2

// 求和
println(numbers.sum())  // 15
println(numbers.sumOf { it * 2 })  // 30

// 平均值
println(numbers.average())  // 3.0

// 最大值和最小值
println(numbers.max())  // 5
println(numbers.min())  // 1
println(numbers.maxOrNull())  // 5 (空集合返回 null)

// 按条件找最大/最小
data class Product(val name: String, val price: Double)
val products = listOf(
    Product("手机", 5999.0),
    Product("耳机", 299.0),
    Product("电脑", 8999.0)
)

val mostExpensive = products.maxByOrNull { it.price }
println(mostExpensive)  // Product(name=电脑, price=8999.0)

val cheapest = products.minByOrNull { it.price }
println(cheapest)  // Product(name=耳机, price=299.0)

// 自定义比较
val longest = listOf("a", "abc", "ab").maxWithOrNull(compareBy { it.length })
println(longest)  // abc
```

### fold 和 reduce

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// reduce - 从第一个元素开始累积
val sum = numbers.reduce { acc, num -> acc + num }
println(sum)  // 15

val product = numbers.reduce { acc, num -> acc * num }
println(product)  // 120

// fold - 提供初始值
val sumWithInitial = numbers.fold(10) { acc, num -> acc + num }
println(sumWithInitial)  // 25

// fold 可以改变结果类型
val concatenated = numbers.fold("数字:") { acc, num -> "$acc $num" }
println(concatenated)  // 数字: 1 2 3 4 5

// foldIndexed - 带索引的 fold
val indexed = numbers.foldIndexed(0) { index, acc, num ->
    acc + index * num
}
println(indexed)  // 0*1 + 1*2 + 2*3 + 3*4 + 4*5 = 40

// 从右向左
val rightFolded = listOf("a", "b", "c").foldRight("") { s, acc ->
    "$acc$s"
}
println(rightFolded)  // cba

// runningFold - 返回中间结果
val running = numbers.runningFold(0) { acc, num -> acc + num }
println(running)  // [0, 1, 3, 6, 10, 15]

// scan 是 runningFold 的别名
val scanned = numbers.scan(0) { acc, num -> acc + num }
println(scanned)  // [0, 1, 3, 6, 10, 15]
```

### 分组聚合

```kotlin
data class Sale(val product: String, val amount: Double, val quantity: Int)

val sales = listOf(
    Sale("手机", 5999.0, 2),
    Sale("耳机", 299.0, 5),
    Sale("手机", 5999.0, 1),
    Sale("电脑", 8999.0, 1),
    Sale("耳机", 299.0, 3)
)

// groupBy 后聚合
val totalByProduct = sales
    .groupBy { it.product }
    .mapValues { (_, sales) ->
        sales.sumOf { it.amount * it.quantity }
    }
println(totalByProduct)  // {手机=17997.0, 耳机=2392.0, 电脑=8999.0}

// 使用 groupingBy 更高效
val countByProduct = sales.groupingBy { it.product }.eachCount()
println(countByProduct)  // {手机=2, 耳机=2, 电脑=1}

// fold 分组
val quantityByProduct = sales.groupingBy { it.product }
    .fold(0) { acc, sale -> acc + sale.quantity }
println(quantityByProduct)  // {手机=3, 耳机=8, 电脑=1}

// reduce 分组
val highestSaleByProduct = sales.groupingBy { it.product }
    .reduce { _, highest, current ->
        if (current.quantity > highest.quantity) current else highest
    }
println(highestSaleByProduct)  // {手机=Sale(..., quantity=2), 耳机=Sale(..., quantity=5), ...}

// aggregate - 最灵活的分组聚合
val stats = sales.groupingBy { it.product }.aggregate { key, acc: Pair<Int, Double>?, element, first ->
    if (first) {
        element.quantity to element.amount * element.quantity
    } else {
        (acc!!.first + element.quantity) to (acc.second + element.amount * element.quantity)
    }
}
println(stats)  // {手机=(3, 17997.0), 耳机=(8, 2392.0), 电脑=(1, 8999.0)}
```

## 序列 (Sequence)

序列是 Kotlin 提供的惰性求值集合，适合处理大量数据或需要链式操作的场景。

### 序列 vs 集合

```kotlin
// 集合 - 立即求值
val listResult = listOf(1, 2, 3, 4, 5)
    .map {
        println("map: $it")
        it * 2
    }
    .filter {
        println("filter: $it")
        it > 4
    }
    .first()
// 输出所有 map，然后所有 filter

println("---")

// 序列 - 惰性求值
val sequenceResult = listOf(1, 2, 3, 4, 5)
    .asSequence()
    .map {
        println("map: $it")
        it * 2
    }
    .filter {
        println("filter: $it")
        it > 4
    }
    .first()
// 输出: map: 1, filter: 2, map: 2, filter: 4, map: 3, filter: 6
// 找到第一个满足条件的元素后停止
```

### 创建序列

```kotlin
// 从集合创建
val fromList = listOf(1, 2, 3).asSequence()

// 使用 sequenceOf
val direct = sequenceOf(1, 2, 3)

// 使用 generateSequence
val naturals = generateSequence(1) { it + 1 }  // 无限序列
println(naturals.take(5).toList())  // [1, 2, 3, 4, 5]

// 带终止条件
val limited = generateSequence(1) { if (it < 100) it * 2 else null }
println(limited.toList())  // [1, 2, 4, 8, 16, 32, 64, 128]

// 使用 sequence 构建器
val fibonacci = sequence {
    var a = 0
    var b = 1
    while (true) {
        yield(a)
        val next = a + b
        a = b
        b = next
    }
}
println(fibonacci.take(10).toList())  // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// yieldAll - 产出整个集合
val combined = sequence {
    yield(1)
    yieldAll(listOf(2, 3, 4))
    yieldAll(generateSequence(5) { it + 1 }.take(3))
}
println(combined.toList())  // [1, 2, 3, 4, 5, 6, 7]
```

### 序列操作

```kotlin
// 序列支持与集合相同的操作
val numbers = (1..1_000_000).asSequence()

// 链式操作
val result = numbers
    .filter { it % 2 == 0 }
    .map { it * 2 }
    .take(10)
    .toList()
println(result)  // [4, 8, 12, 16, 20, 24, 28, 32, 36, 40]

// 中间操作 - 返回新序列，惰性执行
val intermediate = numbers
    .filter { it % 2 == 0 }
    .map { it * 2 }
// 此时还没有执行任何计算

// 终端操作 - 触发计算
val final = intermediate.take(10).toList()

// 常见的终端操作
val seq = sequenceOf(1, 2, 3, 4, 5)
println(seq.toList())  // 转为 List
println(seq.toSet())   // 转为 Set
println(seq.first())   // 获取第一个
println(seq.count())   // 计数
println(seq.sum())     // 求和
println(seq.any { it > 3 })  // 存在检查
println(seq.none { it > 10 })  // 不存在检查
println(seq.all { it > 0 })  // 全部满足检查
```

### 序列的性能优势

```kotlin
import kotlin.system.measureTimeMillis

// 大数据量处理对比
val largeList = (1..10_000_000).toList()

// 使用集合 - 每个操作都创建中间集合
val listTime = measureTimeMillis {
    largeList
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)
        .toList()
}
println("集合耗时: ${listTime}ms")

// 使用序列 - 惰性求值，无中间集合
val sequenceTime = measureTimeMillis {
    largeList.asSequence()
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)
        .toList()
}
println("序列耗时: ${sequenceTime}ms")

// 序列通常快很多，因为：
// 1. 不创建中间集合
// 2. 找到 100 个元素后立即停止
```

### 何时使用序列

```kotlin
// 使用序列的场景：
// 1. 链式操作多（3个以上）
// 2. 数据量大
// 3. 只需要部分结果（如 first, take）
// 4. 操作可能短路

// 使用集合的场景：
// 1. 数据量小（几十个元素）
// 2. 操作简单（1-2个操作）
// 3. 需要随机访问
// 4. 需要多次遍历

// 实际示例：处理大文件
import java.io.File

fun processLargeFile(file: File): List<String> {
    return file.bufferedReader()
        .lineSequence()  // 返回序列，逐行读取
        .filter { it.isNotBlank() }
        .map { it.trim().lowercase() }
        .filter { it.startsWith("kotlin") }
        .take(100)
        .toList()
}

// 无限数据流处理
fun <T> repeatForever(value: T): Sequence<T> = sequence {
    while (true) {
        yield(value)
    }
}

val repeatedValues = repeatForever("Kotlin")
    .mapIndexed { index, value -> "$value-$index" }
    .take(5)
    .toList()
println(repeatedValues)  // [Kotlin-0, Kotlin-1, Kotlin-2, Kotlin-3, Kotlin-4]
```

## 集合操作最佳实践

### 选择正确的集合类型

```kotlin
// 需要按索引访问 -> List
val items = listOf("a", "b", "c")
println(items[1])

// 需要去重 -> Set
val uniqueIds = setOf(1, 2, 3, 2, 1)

// 需要键值对映射 -> Map
val config = mapOf("host" to "localhost", "port" to "8080")

// 需要保持插入顺序
val orderedSet = linkedSetOf(3, 1, 2)  // 保持 3, 1, 2 的顺序

// 需要排序
val sortedNumbers = sortedSetOf(3, 1, 2)  // 自动排序为 1, 2, 3

// 需要高效查找
val lookupTable = hashSetOf("a", "b", "c")  // O(1) 查找
```

### 使用合适的操作

```kotlin
// 检查是否为空
val list = listOf<String>()
if (list.isEmpty()) println("列表为空")
if (list.isNotEmpty()) println("列表不为空")

// 安全获取
val first = list.firstOrNull() ?: "默认值"

// 避免 !! 操作符
// 不推荐
// val item = list.find { it == "x" }!!

// 推荐
val item = list.find { it == "x" } ?: throw IllegalStateException("未找到")

// 使用 in 操作符检查包含
if ("a" in listOf("a", "b", "c")) {
    println("包含 a")
}

// 链式操作保持可读性
val result = listOf(1, 2, 3, 4, 5)
    .filter { it > 2 }
    .map { it * 2 }
    .sorted()
    .joinToString(", ")
```

### 处理大数据量

```kotlin
// 使用序列处理大量数据
val largeData = (1..1_000_000).asSequence()
    .filter { it % 2 == 0 }
    .map { it.toString() }
    .take(1000)
    .toList()

// 批量处理
fun processInBatches(items: List<Int>, batchSize: Int = 1000) {
    items.chunked(batchSize).forEach { batch ->
        processBatch(batch)
    }
}

fun processBatch(batch: List<Int>) {
    println("处理 ${batch.size} 个元素")
}

// 使用 forEach 而非 map 执行副作用
listOf(1, 2, 3).forEach { println(it) }  // 推荐
listOf(1, 2, 3).map { println(it) }  // 不推荐 - map 用于转换
```

### 避免常见陷阱

```kotlin
// 陷阱 1: 在循环中修改集合
val list = mutableListOf(1, 2, 3, 4, 5)
// 错误 - ConcurrentModificationException
// for (item in list) {
//     if (item == 3) list.remove(item)
// }

// 正确
list.removeAll { it == 3 }

// 陷阱 2: 假设只读集合不可变
val mutableSource = mutableListOf(1, 2, 3)
val readOnlyView: List<Int> = mutableSource
mutableSource.add(4)  // readOnlyView 也会看到变化

// 正确 - 创建真正的不可变副本
val immutableCopy = mutableSource.toList()

// 陷阱 3: 序列重复使用
val seq = sequenceOf(1, 2, 3)
// seq.forEach { println(it) }  // 第一次正常
// seq.forEach { println(it) }  // 可能出问题

// 正确 - 转换为列表或重新创建序列
val reusable = seq.toList()

// 陷阱 4: 不必要的转换
val numbers = listOf(1, 2, 3)
// 不推荐
numbers.toList().filter { it > 1 }
// 推荐
numbers.filter { it > 1 }
```

## 实战示例

### 数据处理管道

```kotlin
data class Order(
    val id: String,
    val customerId: String,
    val items: List<OrderItem>,
    val status: String,
    val createdAt: Long
)

data class OrderItem(
    val productId: String,
    val quantity: Int,
    val price: Double
)

class OrderAnalytics(private val orders: List<Order>) {

    // 计算总销售额
    fun totalRevenue(): Double {
        return orders
            .filter { it.status == "completed" }
            .flatMap { it.items }
            .sumOf { it.price * it.quantity }
    }

    // 获取热门商品
    fun topProducts(limit: Int = 10): List<Pair<String, Int>> {
        return orders
            .flatMap { it.items }
            .groupBy { it.productId }
            .mapValues { (_, items) -> items.sumOf { it.quantity } }
            .entries
            .sortedByDescending { it.value }
            .take(limit)
            .map { it.key to it.value }
    }

    // 按客户统计
    fun revenueByCustomer(): Map<String, Double> {
        return orders
            .filter { it.status == "completed" }
            .groupBy { it.customerId }
            .mapValues { (_, customerOrders) ->
                customerOrders
                    .flatMap { it.items }
                    .sumOf { it.price * it.quantity }
            }
    }

    // 订单趋势（按天）
    fun ordersByDay(): Map<String, Int> {
        return orders
            .groupBy {
                java.time.Instant.ofEpochMilli(it.createdAt)
                    .atZone(java.time.ZoneId.systemDefault())
                    .toLocalDate()
                    .toString()
            }
            .mapValues { it.value.size }
    }
}
```

### 函数式数据验证

```kotlin
sealed class ValidationResult {
    object Valid : ValidationResult()
    data class Invalid(val errors: List<String>) : ValidationResult()
}

data class User(
    val username: String,
    val email: String,
    val age: Int,
    val password: String
)

object UserValidator {
    private val validations: List<(User) -> String?> = listOf(
        { user ->
            if (user.username.length < 3) "用户名至少3个字符" else null
        },
        { user ->
            if (!user.email.contains("@")) "邮箱格式无效" else null
        },
        { user ->
            if (user.age < 18) "年龄必须大于18" else null
        },
        { user ->
            if (user.password.length < 8) "密码至少8个字符" else null
        },
        { user ->
            if (!user.password.any { it.isDigit() }) "密码必须包含数字" else null
        }
    )

    fun validate(user: User): ValidationResult {
        val errors = validations.mapNotNull { it(user) }
        return if (errors.isEmpty()) {
            ValidationResult.Valid
        } else {
            ValidationResult.Invalid(errors)
        }
    }
}

// 使用
fun main() {
    val user = User(
        username = "ab",
        email = "invalid-email",
        age = 16,
        password = "short"
    )

    when (val result = UserValidator.validate(user)) {
        is ValidationResult.Valid -> println("验证通过")
        is ValidationResult.Invalid -> {
            println("验证失败:")
            result.errors.forEach { println("  - $it") }
        }
    }
}
```

### 树结构扁平化

```kotlin
data class TreeNode<T>(
    val value: T,
    val children: List<TreeNode<T>> = emptyList()
)

fun <T> TreeNode<T>.flatten(): Sequence<T> = sequence {
    yield(value)
    children.forEach { child ->
        yieldAll(child.flatten())
    }
}

// 使用示例
fun main() {
    val tree = TreeNode(
        "根节点",
        listOf(
            TreeNode("子节点1", listOf(
                TreeNode("孙节点1-1"),
                TreeNode("孙节点1-2")
            )),
            TreeNode("子节点2", listOf(
                TreeNode("孙节点2-1")
            )),
            TreeNode("子节点3")
        )
    )

    tree.flatten().forEach { println(it) }
    // 输出:
    // 根节点
    // 子节点1
    // 孙节点1-1
    // 孙节点1-2
    // 子节点2
    // 孙节点2-1
    // 子节点3
}
```

## 总结

Kotlin 的集合框架提供了强大而灵活的数据处理能力：

1. **三大集合类型**：
   - List：有序集合，支持索引访问，允许重复元素
   - Set：无重复元素的集合，适合快速查找
   - Map：键值对集合，适合关联数据

2. **可变性区分**：
   - 只读集合（List、Set、Map）：没有修改方法
   - 可变集合（MutableList、MutableSet、MutableMap）：支持增删改

3. **丰富的操作函数**：
   - 转换：map、flatMap、associate
   - 过滤：filter、partition、filterIsInstance
   - 聚合：fold、reduce、sum、count、groupBy

4. **序列的惰性求值**：
   - 适合大数据量和链式操作
   - 避免创建中间集合
   - 支持无限序列

掌握这些集合操作，能够帮助你写出更简洁、更高效的 Kotlin 代码。在实际开发中，选择合适的集合类型和操作方法，是提高代码质量的关键。
