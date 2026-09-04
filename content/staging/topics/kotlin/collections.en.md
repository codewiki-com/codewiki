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
origin: old/src/content/docs/kotlin/collections.en.md
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

Collections are among the most important data structures in any programming language. Kotlin provides a powerful and flexible collection framework, including the three core types: List, Set, and Map, as well as Sequences for lazy evaluation. We'll cover all aspects of Kotlin collections in depth to help you master efficient data processing skills.

## Collections Overview

Kotlin's collection framework is built on top of Java collections but provides a richer API and clearer mutability distinctions.

### Mutable vs Immutable Collections

A core design principle of Kotlin collections is the distinction between **read-only collections** and **mutable collections**.

```kotlin
// Read-only collections - no modification methods
val readOnlyList: List<String> = listOf("Apple", "Banana", "Orange")
val readOnlySet: Set<Int> = setOf(1, 2, 3)
val readOnlyMap: Map<String, Int> = mapOf("One" to 1, "Two" to 2)

// Mutable collections - can add, remove, modify elements
val mutableList: MutableList<String> = mutableListOf("Apple", "Banana")
val mutableSet: MutableSet<Int> = mutableSetOf(1, 2, 3)
val mutableMap: MutableMap<String, Int> = mutableMapOf("One" to 1)
```

**Important Note**: Read-only collections do not mean immutable. If the underlying implementation is mutable, it can still be modified through other references.

```kotlin
val mutableNumbers = mutableListOf(1, 2, 3)
val readOnlyView: List<Int> = mutableNumbers  // Read-only view

mutableNumbers.add(4)
println(readOnlyView)  // [1, 2, 3, 4] - The read-only view also sees the change
```

### Collection Interface Hierarchy

```kotlin
// Collection interface hierarchy
// Iterable
//   └── Collection
//         ├── List
//         ├── Set
//         └── (Map is not a subinterface of Collection)

// Mutable collection interface hierarchy
// MutableIterable
//   └── MutableCollection
//         ├── MutableList
//         └── MutableSet
```

## List - Ordered Collection

List is the most commonly used collection type. It maintains the insertion order of elements, allows access by index, and permits duplicate elements.

### Creating Lists

```kotlin
// Empty list
val emptyList: List<String> = emptyList()
val emptyList2 = listOf<Int>()

// Using listOf to create a read-only list
val fruits = listOf("Apple", "Banana", "Orange", "Apple")  // Duplicates allowed
println(fruits)  // [Apple, Banana, Orange, Apple]

// Using mutableListOf to create a mutable list
val numbers = mutableListOf(1, 2, 3)
numbers.add(4)
numbers.removeAt(0)
println(numbers)  // [2, 3, 4]

// Using ArrayList
val arrayList = ArrayList<String>()
arrayList.add("Kotlin")

// Using buildList to construct complex lists (Kotlin 1.6+)
val complexList = buildList {
    add("First item")
    addAll(listOf("Second item", "Third item"))
    if (true) {
        add("Conditional item")
    }
}

// Using List constructor to create a list of specified size
val squares = List(5) { index -> index * index }
println(squares)  // [0, 1, 4, 9, 16]

// Creating a list with repeated elements
val repeated = List(3) { "Kotlin" }
println(repeated)  // [Kotlin, Kotlin, Kotlin]
```

### Accessing List Elements

```kotlin
val languages = listOf("Kotlin", "Java", "Python", "Go")

// Access by index
println(languages[0])  // Kotlin
println(languages.get(1))  // Java

// Safe access - returns null when index is out of bounds
println(languages.getOrNull(10))  // null

// Provide default value
println(languages.getOrElse(10) { "Unknown language" })  // Unknown language

// Get first and last elements
println(languages.first())  // Kotlin
println(languages.last())   // Go

// Safe retrieval
println(languages.firstOrNull())  // Kotlin
println(emptyList<String>().firstOrNull())  // null

// Conditional retrieval
println(languages.first { it.startsWith("P") })  // Python
println(languages.firstOrNull { it.startsWith("X") })  // null

// Get sublist
println(languages.subList(1, 3))  // [Java, Python]
println(languages.take(2))  // [Kotlin, Java]
println(languages.takeLast(2))  // [Python, Go]
println(languages.drop(1))  // [Java, Python, Go]
println(languages.dropLast(2))  // [Kotlin, Java]
```

### Modifying MutableList

```kotlin
val cities = mutableListOf("Beijing", "Shanghai")

// Adding elements
cities.add("Guangzhou")
cities.add(0, "Shenzhen")  // Insert at specified position
cities.addAll(listOf("Hangzhou", "Chengdu"))
cities += "Wuhan"  // Operator overloading
println(cities)  // [Shenzhen, Beijing, Shanghai, Guangzhou, Hangzhou, Chengdu, Wuhan]

// Modifying elements
cities[0] = "Tianjin"
cities.set(1, "Chongqing")

// Removing elements
cities.remove("Guangzhou")  // Remove by value
cities.removeAt(0)  // Remove by index
cities.removeAll { it.length > 2 }  // Remove by condition
cities -= "Wuhan"  // Operator overloading

// Clear the list
cities.clear()

// Batch operations
val items = mutableListOf(1, 2, 3, 4, 5)
items.retainAll { it % 2 == 0 }  // Keep only even numbers
println(items)  // [2, 4]
```

### Common List Operations

```kotlin
val numbers = listOf(3, 1, 4, 1, 5, 9, 2, 6)

// Finding elements
println(numbers.indexOf(1))  // 1 (index of first match)
println(numbers.lastIndexOf(1))  // 3 (index of last match)
println(numbers.indexOfFirst { it > 4 })  // 4
println(numbers.indexOfLast { it > 4 })  // 7

// Containment checks
println(3 in numbers)  // true
println(numbers.contains(3))  // true
println(numbers.containsAll(listOf(1, 2, 3)))  // true

// Sorting (returns new list)
println(numbers.sorted())  // [1, 1, 2, 3, 4, 5, 6, 9]
println(numbers.sortedDescending())  // [9, 6, 5, 4, 3, 2, 1, 1]
println(numbers.reversed())  // [6, 2, 9, 5, 1, 4, 1, 3]
println(numbers.shuffled())  // Random order

// Custom sorting
data class Person(val name: String, val age: Int)
val people = listOf(
    Person("Alice", 25),
    Person("Bob", 30),
    Person("Charlie", 20)
)
println(people.sortedBy { it.age })  // Ascending by age
println(people.sortedByDescending { it.name })  // Descending by name
println(people.sortedWith(compareBy({ it.age }, { it.name })))  // Multi-criteria sorting

// In-place sorting for mutable list
val mutableNumbers = mutableListOf(3, 1, 4, 1, 5)
mutableNumbers.sort()
println(mutableNumbers)  // [1, 1, 3, 4, 5]
```

## Set - Collection Without Duplicates

Set is a collection that does not contain duplicate elements. Kotlin provides hash-based HashSet and LinkedHashSet which maintains insertion order.

### Creating Sets

```kotlin
// Empty set
val emptySet: Set<String> = emptySet()

// Using setOf to create a read-only Set (default is LinkedHashSet, maintains order)
val colors = setOf("Red", "Green", "Blue", "Red")  // Duplicate elements are ignored
println(colors)  // [Red, Green, Blue]
println(colors.size)  // 3

// Using mutableSetOf to create a mutable Set
val numbers = mutableSetOf(1, 2, 3)
numbers.add(4)
numbers.add(2)  // Already exists, won't be added
println(numbers)  // [1, 2, 3, 4]

// Specify implementation type
val hashSet = hashSetOf(3, 1, 4, 1, 5)  // Unordered
val linkedHashSet = linkedSetOf(3, 1, 4, 1, 5)  // Maintains insertion order
val sortedSet = sortedSetOf(3, 1, 4, 1, 5)  // Sorted
println(sortedSet)  // [1, 3, 4, 5]

// Using buildSet to construct
val builtSet = buildSet {
    add("A")
    addAll(setOf("B", "C"))
}
```

### Set Operations

```kotlin
val set1 = setOf(1, 2, 3, 4, 5)
val set2 = setOf(4, 5, 6, 7, 8)

// Set operations
val union = set1 union set2  // Union
println(union)  // [1, 2, 3, 4, 5, 6, 7, 8]

val intersect = set1 intersect set2  // Intersection
println(intersect)  // [4, 5]

val subtract = set1 subtract set2  // Difference
println(subtract)  // [1, 2, 3]

// Can also use operators
println(set1 + set2)  // Union
println(set1 - set2)  // Difference

// Subset check
val subset = setOf(1, 2)
println(subset.all { it in set1 })  // true - subset is a subset of set1

// Modifying mutable Set
val mutableSet = mutableSetOf("A", "B", "C")
mutableSet.add("D")
mutableSet.remove("A")
mutableSet.addAll(setOf("E", "F"))
mutableSet.removeAll { it > "C" }
println(mutableSet)  // [B, C]
```

### Practical Applications of Set

```kotlin
// Removing duplicates
val duplicates = listOf(1, 2, 2, 3, 3, 3, 4)
val unique = duplicates.toSet()
println(unique)  // [1, 2, 3, 4]

// Fast lookup
val validCodes = setOf("A001", "B002", "C003", "D004")
fun isValidCode(code: String): Boolean = code in validCodes

// Tag system
data class Article(val title: String, val tags: Set<String>)

val articles = listOf(
    Article("Kotlin Basics", setOf("Kotlin", "Programming", "Beginner")),
    Article("Android Development", setOf("Android", "Kotlin", "Mobile")),
    Article("Java Fundamentals", setOf("Java", "Programming", "Beginner"))
)

// Find articles with specific tags
val kotlinArticles = articles.filter { "Kotlin" in it.tags }
println(kotlinArticles.map { it.title })  // [Kotlin Basics, Android Development]

// Get all tags
val allTags = articles.flatMap { it.tags }.toSet()
println(allTags)  // [Kotlin, Programming, Beginner, Android, Mobile, Java]
```

## Map - Key-Value Pair Collection

Map stores key-value pairs, where each key can only correspond to one value.

### Creating Maps

```kotlin
// Empty Map
val emptyMap: Map<String, Int> = emptyMap()

// Using mapOf to create a read-only Map
val capitals = mapOf(
    "China" to "Beijing",
    "Japan" to "Tokyo",
    "Korea" to "Seoul"
)

// Using Pair to create
val scores = mapOf(
    Pair("Math", 95),
    Pair("Chinese", 88),
    Pair("English", 92)
)

// Using mutableMapOf to create a mutable Map
val userAges = mutableMapOf(
    "Alice" to 25,
    "Bob" to 30
)
userAges["Charlie"] = 28

// Specify implementation type
val hashMap = hashMapOf("a" to 1, "b" to 2)  // Unordered
val linkedHashMap = linkedMapOf("a" to 1, "b" to 2)  // Maintains insertion order
val sortedMap = sortedMapOf("c" to 3, "a" to 1, "b" to 2)  // Sorted by key
println(sortedMap)  // {a=1, b=2, c=3}

// Using buildMap to construct
val config = buildMap {
    put("host", "localhost")
    put("port", "8080")
    if (true) {
        put("debug", "true")
    }
}
```

### Accessing Maps

```kotlin
val countries = mapOf(
    "CN" to "China",
    "US" to "United States",
    "JP" to "Japan"
)

// Using [] operator to access
println(countries["CN"])  // China
println(countries["XX"])  // null (key doesn't exist)

// Using get method
println(countries.get("US"))  // United States

// Safe access - provide default value
println(countries.getOrDefault("XX", "Unknown country"))  // Unknown country
println(countries.getOrElse("XX") { "Country code $it not found" })  // Country code XX not found

// getValue - throws exception when key doesn't exist
// println(countries.getValue("XX"))  // NoSuchElementException

// Check if key or value exists
println("CN" in countries)  // true
println(countries.containsKey("CN"))  // true
println(countries.containsValue("China"))  // true

// Get all keys, values, entries
println(countries.keys)  // [CN, US, JP]
println(countries.values)  // [China, United States, Japan]
println(countries.entries)  // [CN=China, US=United States, JP=Japan]
```

### Modifying MutableMap

```kotlin
val inventory = mutableMapOf(
    "Apple" to 100,
    "Banana" to 50
)

// Add or update
inventory["Orange"] = 75
inventory.put("Grape", 30)
inventory.putAll(mapOf("Watermelon" to 20, "Mango" to 40))

// Using += operator
inventory += "Pear" to 60
inventory += mapOf("Peach" to 45)

// Add only if key doesn't exist
inventory.putIfAbsent("Apple", 200)  // Won't update because key already exists
inventory.getOrPut("Durian") { 10 }  // Add and return value

// Remove
inventory.remove("Banana")
inventory.remove("Apple", 50)  // Only removes if value matches
inventory -= "Orange"

// Conditional update
inventory.compute("Watermelon") { _, v -> (v ?: 0) + 10 }
inventory.merge("Apple", 50) { old, new -> old + new }

// Iterate and modify
inventory.replaceAll { key, value ->
    if (key.length > 5) value * 2 else value
}

// Clear
inventory.clear()
```

### Map Iteration

```kotlin
val prices = mapOf(
    "Coffee" to 25.0,
    "Tea" to 15.0,
    "Juice" to 20.0
)

// Iterate over entries
for (entry in prices) {
    println("${entry.key}: $${entry.value}")
}

// Destructuring iteration
for ((name, price) in prices) {
    println("$name: $$price")
}

// Using forEach
prices.forEach { (name, price) ->
    println("$name: $$price")
}

// Iterate over keys or values only
prices.keys.forEach { println("Product: $it") }
prices.values.forEach { println("Price: $$it") }

// Iterate with index
prices.entries.forEachIndexed { index, (name, price) ->
    println("$index. $name: $$price")
}
```

### Practical Applications of Map

```kotlin
// Grouping and statistics
data class Student(val name: String, val grade: Int, val score: Int)

val students = listOf(
    Student("Alice", 1, 85),
    Student("Bob", 2, 92),
    Student("Charlie", 1, 78),
    Student("David", 2, 88),
    Student("Eve", 1, 95)
)

// Group by grade
val byGrade: Map<Int, List<Student>> = students.groupBy { it.grade }
println(byGrade)

// Calculate average score per grade
val avgByGrade = students.groupBy { it.grade }
    .mapValues { (_, students) -> students.map { it.score }.average() }
println(avgByGrade)  // {1=86.0, 2=90.0}

// Create lookup table
val studentByName: Map<String, Student> = students.associateBy { it.name }
println(studentByName["Alice"])  // Student(name=Alice, grade=1, score=85)

// Convert to Map
val nameToScore: Map<String, Int> = students.associate { it.name to it.score }
println(nameToScore)  // {Alice=85, Bob=92, Charlie=78, David=88, Eve=95}

// Counting
val words = listOf("apple", "banana", "apple", "cherry", "banana", "apple")
val wordCount = words.groupingBy { it }.eachCount()
println(wordCount)  // {apple=3, banana=2, cherry=1}
```

## Collection Transformation Operations

Kotlin provides rich collection transformation operations, making data processing concise and powerful.

### map - Mapping Transformation

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// Basic mapping
val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]

// Mapping with index
val indexed = numbers.mapIndexed { index, value ->
    "[$index] = $value"
}
println(indexed)  // [[0] = 1, [1] = 2, [2] = 3, [3] = 4, [4] = 5]

// Mapping that filters null values
val nullableList = listOf(1, 2, null, 4, null)
val nonNull = nullableList.mapNotNull { it?.times(2) }
println(nonNull)  // [2, 4, 8]

// Mapping Map keys or values
val prices = mapOf("A" to 100, "B" to 200)
val discounted = prices.mapValues { it.value * 0.9 }
println(discounted)  // {A=90.0, B=180.0}

val lowercaseKeys = prices.mapKeys { it.key.lowercase() }
println(lowercaseKeys)  // {a=100, b=200}
```

### filter - Filtering

```kotlin
val numbers = listOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)

// Basic filtering
val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4, 6, 8, 10]

// Filtering with index
val indexed = numbers.filterIndexed { index, _ -> index % 2 == 0 }
println(indexed)  // [1, 3, 5, 7, 9]

// Filter out null values
val nullable = listOf(1, null, 2, null, 3)
val nonNull = nullable.filterNotNull()
println(nonNull)  // [1, 2, 3]

// Filter by type
val mixed: List<Any> = listOf(1, "a", 2, "b", 3.0)
val strings = mixed.filterIsInstance<String>()
println(strings)  // [a, b]

// Partition - split elements into two groups based on condition
val (passed, failed) = numbers.partition { it >= 6 }
println("Passed: $passed, Failed: $failed")  // Passed: [6, 7, 8, 9, 10], Failed: [1, 2, 3, 4, 5]

// Filtering Map
val scores = mapOf("Alice" to 85, "Bob" to 92, "Charlie" to 58)
val passedStudents = scores.filter { it.value >= 60 }
println(passedStudents)  // {Alice=85, Bob=92}
```

### flatMap - Flattening Transformation

```kotlin
// Basic flatMap
val nested = listOf(listOf(1, 2), listOf(3, 4), listOf(5))
val flattened = nested.flatten()
println(flattened)  // [1, 2, 3, 4, 5]

// flatMap combines mapping and flattening
val sentences = listOf("Hello World", "Kotlin is great")
val words = sentences.flatMap { it.split(" ") }
println(words)  // [Hello, World, Kotlin, is, great]

// Practical application - get all items from all orders
data class Order(val id: Int, val items: List<String>)

val orders = listOf(
    Order(1, listOf("Phone", "Earbuds")),
    Order(2, listOf("Computer", "Mouse", "Keyboard")),
    Order(3, listOf("Tablet"))
)

val allItems = orders.flatMap { it.items }
println(allItems)  // [Phone, Earbuds, Computer, Mouse, Keyboard, Tablet]

// flatMapIndexed
val indexed = listOf("a", "b", "c").flatMapIndexed { index, s ->
    List(index + 1) { s }
}
println(indexed)  // [a, b, b, c, c, c]
```

### Other Transformation Operations

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// zip - combine two collections
val letters = listOf("a", "b", "c")
val zipped = numbers.zip(letters)
println(zipped)  // [(1, a), (2, b), (3, c)]

val combined = numbers.zip(letters) { num, letter -> "$letter$num" }
println(combined)  // [a1, b2, c3]

// unzip - split Pair list
val pairs = listOf(1 to "a", 2 to "b", 3 to "c")
val (nums, chars) = pairs.unzip()
println(nums)   // [1, 2, 3]
println(chars)  // [a, b, c]

// associate - create Map
val words = listOf("apple", "banana", "cherry")
val wordLengths = words.associateWith { it.length }
println(wordLengths)  // {apple=5, banana=6, cherry=6}

val indexedWords = words.withIndex().associate { it.index to it.value }
println(indexedWords)  // {0=apple, 1=banana, 2=cherry}

// chunked - split into chunks
val chunked = (1..10).toList().chunked(3)
println(chunked)  // [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]

// windowed - sliding window
val windowed = (1..5).toList().windowed(3)
println(windowed)  // [[1, 2, 3], [2, 3, 4], [3, 4, 5]]

val windowed2 = (1..5).toList().windowed(3, step = 2)
println(windowed2)  // [[1, 2, 3], [3, 4, 5]]

// distinct - remove duplicates
val duplicates = listOf(1, 2, 2, 3, 3, 3)
println(duplicates.distinct())  // [1, 2, 3]

data class Person(val name: String, val age: Int)
val people = listOf(
    Person("Alice", 25),
    Person("Bob", 25),
    Person("Alice", 30)
)
println(people.distinctBy { it.name })  // [Person(name=Alice, age=25), Person(name=Bob, age=25)]
```

## Aggregation Operations

Aggregation operations combine multiple elements in a collection into a single result.

### Basic Aggregation

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// Count
println(numbers.count())  // 5
println(numbers.count { it % 2 == 0 })  // 2

// Sum
println(numbers.sum())  // 15
println(numbers.sumOf { it * 2 })  // 30

// Average
println(numbers.average())  // 3.0

// Max and min
println(numbers.max())  // 5
println(numbers.min())  // 1
println(numbers.maxOrNull())  // 5 (returns null for empty collection)

// Find max/min by condition
data class Product(val name: String, val price: Double)
val products = listOf(
    Product("Phone", 5999.0),
    Product("Earbuds", 299.0),
    Product("Computer", 8999.0)
)

val mostExpensive = products.maxByOrNull { it.price }
println(mostExpensive)  // Product(name=Computer, price=8999.0)

val cheapest = products.minByOrNull { it.price }
println(cheapest)  // Product(name=Earbuds, price=299.0)

// Custom comparison
val longest = listOf("a", "abc", "ab").maxWithOrNull(compareBy { it.length })
println(longest)  // abc
```

### fold and reduce

```kotlin
val numbers = listOf(1, 2, 3, 4, 5)

// reduce - accumulate starting from first element
val sum = numbers.reduce { acc, num -> acc + num }
println(sum)  // 15

val product = numbers.reduce { acc, num -> acc * num }
println(product)  // 120

// fold - provide initial value
val sumWithInitial = numbers.fold(10) { acc, num -> acc + num }
println(sumWithInitial)  // 25

// fold can change result type
val concatenated = numbers.fold("Numbers:") { acc, num -> "$acc $num" }
println(concatenated)  // Numbers: 1 2 3 4 5

// foldIndexed - fold with index
val indexed = numbers.foldIndexed(0) { index, acc, num ->
    acc + index * num
}
println(indexed)  // 0*1 + 1*2 + 2*3 + 3*4 + 4*5 = 40

// Right to left
val rightFolded = listOf("a", "b", "c").foldRight("") { s, acc ->
    "$acc$s"
}
println(rightFolded)  // cba

// runningFold - return intermediate results
val running = numbers.runningFold(0) { acc, num -> acc + num }
println(running)  // [0, 1, 3, 6, 10, 15]

// scan is an alias for runningFold
val scanned = numbers.scan(0) { acc, num -> acc + num }
println(scanned)  // [0, 1, 3, 6, 10, 15]
```

### Grouped Aggregation

```kotlin
data class Sale(val product: String, val amount: Double, val quantity: Int)

val sales = listOf(
    Sale("Phone", 5999.0, 2),
    Sale("Earbuds", 299.0, 5),
    Sale("Phone", 5999.0, 1),
    Sale("Computer", 8999.0, 1),
    Sale("Earbuds", 299.0, 3)
)

// Aggregate after groupBy
val totalByProduct = sales
    .groupBy { it.product }
    .mapValues { (_, sales) ->
        sales.sumOf { it.amount * it.quantity }
    }
println(totalByProduct)  // {Phone=17997.0, Earbuds=2392.0, Computer=8999.0}

// Using groupingBy is more efficient
val countByProduct = sales.groupingBy { it.product }.eachCount()
println(countByProduct)  // {Phone=2, Earbuds=2, Computer=1}

// Grouped fold
val quantityByProduct = sales.groupingBy { it.product }
    .fold(0) { acc, sale -> acc + sale.quantity }
println(quantityByProduct)  // {Phone=3, Earbuds=8, Computer=1}

// Grouped reduce
val highestSaleByProduct = sales.groupingBy { it.product }
    .reduce { _, highest, current ->
        if (current.quantity > highest.quantity) current else highest
    }
println(highestSaleByProduct)  // {Phone=Sale(..., quantity=2), Earbuds=Sale(..., quantity=5), ...}

// aggregate - most flexible grouped aggregation
val stats = sales.groupingBy { it.product }.aggregate { key, acc: Pair<Int, Double>?, element, first ->
    if (first) {
        element.quantity to element.amount * element.quantity
    } else {
        (acc!!.first + element.quantity) to (acc.second + element.amount * element.quantity)
    }
}
println(stats)  // {Phone=(3, 17997.0), Earbuds=(8, 2392.0), Computer=(1, 8999.0)}
```

## Sequences

Sequences are Kotlin's lazy-evaluated collections, suitable for processing large amounts of data or scenarios requiring chained operations.

### Sequence vs Collection

```kotlin
// Collection - eager evaluation
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
// Outputs all map operations, then all filter operations

println("---")

// Sequence - lazy evaluation
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
// Output: map: 1, filter: 2, map: 2, filter: 4, map: 3, filter: 6
// Stops after finding the first element that satisfies the condition
```

### Creating Sequences

```kotlin
// From collection
val fromList = listOf(1, 2, 3).asSequence()

// Using sequenceOf
val direct = sequenceOf(1, 2, 3)

// Using generateSequence
val naturals = generateSequence(1) { it + 1 }  // Infinite sequence
println(naturals.take(5).toList())  // [1, 2, 3, 4, 5]

// With termination condition
val limited = generateSequence(1) { if (it < 100) it * 2 else null }
println(limited.toList())  // [1, 2, 4, 8, 16, 32, 64, 128]

// Using sequence builder
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

// yieldAll - yield entire collection
val combined = sequence {
    yield(1)
    yieldAll(listOf(2, 3, 4))
    yieldAll(generateSequence(5) { it + 1 }.take(3))
}
println(combined.toList())  // [1, 2, 3, 4, 5, 6, 7]
```

### Sequence Operations

```kotlin
// Sequences support the same operations as collections
val numbers = (1..1_000_000).asSequence()

// Chained operations
val result = numbers
    .filter { it % 2 == 0 }
    .map { it * 2 }
    .take(10)
    .toList()
println(result)  // [4, 8, 12, 16, 20, 24, 28, 32, 36, 40]

// Intermediate operations - return new sequence, lazy execution
val intermediate = numbers
    .filter { it % 2 == 0 }
    .map { it * 2 }
// No computation has been performed yet

// Terminal operations - trigger computation
val final = intermediate.take(10).toList()

// Common terminal operations
val seq = sequenceOf(1, 2, 3, 4, 5)
println(seq.toList())  // Convert to List
println(seq.toSet())   // Convert to Set
println(seq.first())   // Get first
println(seq.count())   // Count
println(seq.sum())     // Sum
println(seq.any { it > 3 })  // Existence check
println(seq.none { it > 10 })  // Non-existence check
println(seq.all { it > 0 })  // All satisfy check
```

### Performance Advantages of Sequences

```kotlin
import kotlin.system.measureTimeMillis

// Large data processing comparison
val largeList = (1..10_000_000).toList()

// Using collection - each operation creates intermediate collection
val listTime = measureTimeMillis {
    largeList
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)
        .toList()
}
println("Collection time: ${listTime}ms")

// Using sequence - lazy evaluation, no intermediate collections
val sequenceTime = measureTimeMillis {
    largeList.asSequence()
        .filter { it % 2 == 0 }
        .map { it * 2 }
        .take(100)
        .toList()
}
println("Sequence time: ${sequenceTime}ms")

// Sequences are usually much faster because:
// 1. No intermediate collections created
// 2. Stops immediately after finding 100 elements
```

### When to Use Sequences

```kotlin
// Use sequences when:
// 1. Many chained operations (3 or more)
// 2. Large data volume
// 3. Only need partial results (e.g., first, take)
// 4. Operations may short-circuit

// Use collections when:
// 1. Small data volume (dozens of elements)
// 2. Simple operations (1-2 operations)
// 3. Need random access
// 4. Need multiple iterations

// Practical example: processing large files
import java.io.File

fun processLargeFile(file: File): List<String> {
    return file.bufferedReader()
        .lineSequence()  // Returns sequence, reads line by line
        .filter { it.isNotBlank() }
        .map { it.trim().lowercase() }
        .filter { it.startsWith("kotlin") }
        .take(100)
        .toList()
}

// Infinite data stream processing
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

## Collection Best Practices

### Choosing the Right Collection Type

```kotlin
// Need index access -> List
val items = listOf("a", "b", "c")
println(items[1])

// Need uniqueness -> Set
val uniqueIds = setOf(1, 2, 3, 2, 1)

// Need key-value mapping -> Map
val config = mapOf("host" to "localhost", "port" to "8080")

// Need to maintain insertion order
val orderedSet = linkedSetOf(3, 1, 2)  // Maintains 3, 1, 2 order

// Need sorting
val sortedNumbers = sortedSetOf(3, 1, 2)  // Automatically sorted to 1, 2, 3

// Need efficient lookup
val lookupTable = hashSetOf("a", "b", "c")  // O(1) lookup
```

### Using Appropriate Operations

```kotlin
// Check if empty
val list = listOf<String>()
if (list.isEmpty()) println("List is empty")
if (list.isNotEmpty()) println("List is not empty")

// Safe retrieval
val first = list.firstOrNull() ?: "Default value"

// Avoid !! operator
// Not recommended
// val item = list.find { it == "x" }!!

// Recommended
val item = list.find { it == "x" } ?: throw IllegalStateException("Not found")

// Use in operator to check containment
if ("a" in listOf("a", "b", "c")) {
    println("Contains a")
}

// Keep chained operations readable
val result = listOf(1, 2, 3, 4, 5)
    .filter { it > 2 }
    .map { it * 2 }
    .sorted()
    .joinToString(", ")
```

### Processing Large Data Volumes

```kotlin
// Use sequences for large data
val largeData = (1..1_000_000).asSequence()
    .filter { it % 2 == 0 }
    .map { it.toString() }
    .take(1000)
    .toList()

// Batch processing
fun processInBatches(items: List<Int>, batchSize: Int = 1000) {
    items.chunked(batchSize).forEach { batch ->
        processBatch(batch)
    }
}

fun processBatch(batch: List<Int>) {
    println("Processing ${batch.size} elements")
}

// Use forEach instead of map for side effects
listOf(1, 2, 3).forEach { println(it) }  // Recommended
listOf(1, 2, 3).map { println(it) }  // Not recommended - map is for transformation
```

### Avoiding Common Pitfalls

```kotlin
// Pitfall 1: Modifying collection during iteration
val list = mutableListOf(1, 2, 3, 4, 5)
// Wrong - ConcurrentModificationException
// for (item in list) {
//     if (item == 3) list.remove(item)
// }

// Correct
list.removeAll { it == 3 }

// Pitfall 2: Assuming read-only collections are immutable
val mutableSource = mutableListOf(1, 2, 3)
val readOnlyView: List<Int> = mutableSource
mutableSource.add(4)  // readOnlyView also sees the change

// Correct - create a truly immutable copy
val immutableCopy = mutableSource.toList()

// Pitfall 3: Reusing sequences
val seq = sequenceOf(1, 2, 3)
// seq.forEach { println(it) }  // First time works fine
// seq.forEach { println(it) }  // May cause issues

// Correct - convert to list or recreate sequence
val reusable = seq.toList()

// Pitfall 4: Unnecessary conversions
val numbers = listOf(1, 2, 3)
// Not recommended
numbers.toList().filter { it > 1 }
// Recommended
numbers.filter { it > 1 }
```

## Practical Examples

### Data Processing Pipeline

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

    // Calculate total revenue
    fun totalRevenue(): Double {
        return orders
            .filter { it.status == "completed" }
            .flatMap { it.items }
            .sumOf { it.price * it.quantity }
    }

    // Get top products
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

    // Statistics by customer
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

    // Order trends (by day)
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

### Functional Data Validation

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
            if (user.username.length < 3) "Username must be at least 3 characters" else null
        },
        { user ->
            if (!user.email.contains("@")) "Invalid email format" else null
        },
        { user ->
            if (user.age < 18) "Age must be at least 18" else null
        },
        { user ->
            if (user.password.length < 8) "Password must be at least 8 characters" else null
        },
        { user ->
            if (!user.password.any { it.isDigit() }) "Password must contain a digit" else null
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

// Usage
fun main() {
    val user = User(
        username = "ab",
        email = "invalid-email",
        age = 16,
        password = "short"
    )

    when (val result = UserValidator.validate(user)) {
        is ValidationResult.Valid -> println("Validation passed")
        is ValidationResult.Invalid -> {
            println("Validation failed:")
            result.errors.forEach { println("  - $it") }
        }
    }
}
```

### Tree Structure Flattening

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

// Usage example
fun main() {
    val tree = TreeNode(
        "Root",
        listOf(
            TreeNode("Child 1", listOf(
                TreeNode("Grandchild 1-1"),
                TreeNode("Grandchild 1-2")
            )),
            TreeNode("Child 2", listOf(
                TreeNode("Grandchild 2-1")
            )),
            TreeNode("Child 3")
        )
    )

    tree.flatten().forEach { println(it) }
    // Output:
    // Root
    // Child 1
    // Grandchild 1-1
    // Grandchild 1-2
    // Child 2
    // Grandchild 2-1
    // Child 3
}
```

## Summary

Kotlin's collection framework provides powerful and flexible data processing capabilities:

1. **Three Core Collection Types**:
   - List: Ordered collection, supports index access, allows duplicate elements
   - Set: Collection without duplicate elements, suitable for fast lookup
   - Map: Key-value pair collection, suitable for associated data

2. **Mutability Distinction**:
   - Read-only collections (List, Set, Map): No modification methods
   - Mutable collections (MutableList, MutableSet, MutableMap): Support add, remove, modify

3. **Rich Operation Functions**:
   - Transformation: map, flatMap, associate
   - Filtering: filter, partition, filterIsInstance
   - Aggregation: fold, reduce, sum, count, groupBy

4. **Lazy Evaluation with Sequences**:
   - Suitable for large data volumes and chained operations
   - Avoids creating intermediate collections
   - Supports infinite sequences

Mastering these collection operations helps you write more concise and efficient Kotlin code. In real development, choosing the appropriate collection type and operation methods is key to improving code quality.
