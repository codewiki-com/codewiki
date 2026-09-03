---
title: Kotlin 语言基础
description: 深入理解 Kotlin 变量、数据类型、空安全与控制流
track: kotlin
section: basics
difficulty: beginner
tags:
  - Kotlin
  - 基础
  - 空安全
  - Android
status: imported
origin: old/src/content/docs/kotlin/fundamentals.zh.md
divergence: 0.152
issues: []
legacy:
  category: Kotlin
  subcategory: 语言基础
  order: 1
  lastUpdated: 2026-01-07
---

Kotlin 是一门现代化的编程语言,由 JetBrains 开发,已成为 Android 开发的首选语言。本文将深入探讨 Kotlin 的核心基础知识,包括变量声明、数据类型、空安全机制、控制流和函数定义。

## 变量声明:val 与 var

Kotlin 提供两种变量声明方式:`val` 和 `var`,它们的主要区别在于可变性。

### val - 只读变量(不可变)

`val` 声明的变量在初始化后不能重新赋值,类似于 Java 中的 `final` 变量。

```kotlin
val name: String = "张三"
val age = 25  // 类型推断为 Int

// 编译错误:val 不能重新赋值
// name = "李四"
```

### var - 可变变量

`var` 声明的变量可以在初始化后重新赋值。

```kotlin
var city: String = "北京"
var score = 85  // 类型推断为 Int

// 可以重新赋值
city = "上海"
score = 90
```

### 最佳实践

- **优先使用 `val`**:这有助于编写更安全、更易理解的代码
- 只在确实需要修改变量值时使用 `var`
- Kotlin 的类型推断能力强大,大多数情况下可以省略类型声明

```kotlin
val pi = 3.14159  // 自动推断为 Double
val isActive = true  // 自动推断为 Boolean
val items = listOf(1, 2, 3)  // 自动推断为 List<Int>
```

## 数据类型

Kotlin 中的所有类型都是对象,没有 Java 中的原始类型概念。

### 基本数据类型

```kotlin
// 整数类型
val byteValue: Byte = 127
val shortValue: Short = 32767
val intValue: Int = 2147483647
val longValue: Long = 9223372036854775807L

// 浮点类型
val floatValue: Float = 3.14F
val doubleValue: Double = 3.14159265359

// 布尔类型
val isKotlinFun: Boolean = true

// 字符类型
val grade: Char = 'A'
```

### 字符串

Kotlin 提供了强大的字符串处理功能。

```kotlin
// 基本字符串
val message: String = "Hello, Kotlin!"

// 字符串模板
val name = "小明"
val greeting = "你好,$name!"  // 你好,小明!
val info = "姓名:$name,长度:${name.length}"  // 姓名:小明,长度:2

// 多行字符串
val poem = """
    床前明月光,
    疑是地上霜。
    举头望明月,
    低头思故乡。
""".trimIndent()

// 字符串操作
val text = "Kotlin"
println(text.uppercase())  // KOTLIN
println(text.lowercase())  // kotlin
println(text.substring(0, 3))  // Kot
```

### 数组

```kotlin
// 创建数组
val numbers = arrayOf(1, 2, 3, 4, 5)
val strings = arrayOf("苹果", "香蕉", "橙子")

// 指定大小创建数组
val zeros = IntArray(5)  // [0, 0, 0, 0, 0]
val initialized = IntArray(5) { it * 2 }  // [0, 2, 4, 6, 8]

// 访问数组元素
println(numbers[0])  // 1
numbers[0] = 10

// 遍历数组
for (number in numbers) {
    println(number)
}

// 使用索引遍历
for (index in numbers.indices) {
    println("索引 $index: ${numbers[index]}")
}
```

### 集合类型

```kotlin
// List - 只读列表
val fruits = listOf("苹果", "香蕉", "橙子")
println(fruits[0])  // 苹果
println(fruits.size)  // 3

// MutableList - 可变列表
val cities = mutableListOf("北京", "上海")
cities.add("广州")
cities.remove("上海")
cities[0] = "深圳"

// Set - 只读集合(无重复元素)
val uniqueNumbers = setOf(1, 2, 3, 2, 1)  // [1, 2, 3]

// MutableSet - 可变集合
val tags = mutableSetOf("Kotlin", "Java")
tags.add("Android")

// Map - 只读映射
val countryCodes = mapOf(
    "中国" to "CN",
    "美国" to "US",
    "日本" to "JP"
)
println(countryCodes["中国"])  // CN

// MutableMap - 可变映射
val userScores = mutableMapOf("小明" to 85, "小红" to 92)
userScores["小刚"] = 78
userScores["小明"] = 90
```

## 空安全

Kotlin 的空安全机制是其最重要的特性之一,可以在编译时防止空指针异常(NullPointerException)。

### 可空类型与非空类型

```kotlin
// 非空类型(默认)
var nonNullString: String = "Hello"
// nonNullString = null  // 编译错误

// 可空类型(添加 ?)
var nullableString: String? = "Hello"
nullableString = null  // 正确
```

### 安全调用操作符 ?.

安全调用操作符 `?.` 只在对象非空时才执行调用。

```kotlin
var name: String? = "小明"
println(name?.length)  // 2

name = null
println(name?.length)  // null,不会抛出异常

// 链式调用
data class Address(val city: String?)
data class User(val address: Address?)

val user: User? = User(Address("北京"))
val city = user?.address?.city  // 北京

val nullUser: User? = null
val nullCity = nullUser?.address?.city  // null
```

### Elvis 操作符 ?:

Elvis 操作符 `?:` 提供默认值,当左侧表达式为 `null` 时返回右侧的值。

```kotlin
val name: String? = null
val displayName = name ?: "匿名用户"
println(displayName)  // 匿名用户

// 结合安全调用
val length = name?.length ?: 0
println(length)  // 0

// 实际应用
fun getUsername(user: String?): String {
    return user?.trim()?.takeIf { it.isNotEmpty() } ?: "访客"
}

println(getUsername(null))  // 访客
println(getUsername(""))  // 访客
println(getUsername("  "))  // 访客
println(getUsername("张三"))  // 张三
```

### 非空断言操作符 !!

`!!` 操作符将可空类型转换为非空类型,如果值为 `null` 则抛出异常。

```kotlin
val name: String? = "小明"
val length = name!!.length  // 2

val nullName: String? = null
// val error = nullName!!.length  // 抛出 NullPointerException
```

**注意**:应该尽量避免使用 `!!`,只在确定值不为 `null` 时使用。

### 安全转换 as?

```kotlin
val obj: Any = "Hello"
val str: String? = obj as? String  // 成功转换
val num: Int? = obj as? Int  // 转换失败,返回 null

if (str != null) {
    println(str.uppercase())
}
```

### let 函数与空安全

`let` 函数常用于在非空时执行代码块。

```kotlin
val name: String? = "小明"

name?.let {
    println("姓名:$it")
    println("长度:${it.length}")
}

// 处理多个可空值
val firstName: String? = "三"
val lastName: String? = "张"

firstName?.let { first ->
    lastName?.let { last ->
        println("全名:$last$first")
    }
}
```

## 控制流

### if 表达式

在 Kotlin 中,`if` 是一个表达式,可以返回值。

```kotlin
// 基本 if
val age = 18
if (age >= 18) {
    println("成年人")
} else {
    println("未成年人")
}

// if 作为表达式
val status = if (age >= 18) "成年" else "未成年"
println(status)

// 多分支
val score = 85
val grade = if (score >= 90) {
    "优秀"
} else if (score >= 80) {
    "良好"
} else if (score >= 60) {
    "及格"
} else {
    "不及格"
}
```

### when 表达式

`when` 是 Kotlin 对 switch 语句的替代,功能更强大。

```kotlin
// 基本用法
val dayOfWeek = 1
when (dayOfWeek) {
    1 -> println("星期一")
    2 -> println("星期二")
    3 -> println("星期三")
    else -> println("其他")
}

// when 作为表达式
val dayName = when (dayOfWeek) {
    1 -> "星期一"
    2 -> "星期二"
    3 -> "星期三"
    4 -> "星期四"
    5 -> "星期五"
    6, 7 -> "周末"
    else -> "无效"
}

// 带范围的 when
val score = 85
val result = when (score) {
    in 90..100 -> "优秀"
    in 80..89 -> "良好"
    in 60..79 -> "及格"
    else -> "不及格"
}

// 类型检查
fun describe(obj: Any): String = when (obj) {
    1 -> "数字一"
    "Hello" -> "问候语"
    is String -> "字符串,长度:${obj.length}"
    is Int -> "整数"
    else -> "未知类型"
}

// 不带参数的 when
val temperature = 25
val description = when {
    temperature < 0 -> "冰冷"
    temperature < 15 -> "寒冷"
    temperature < 25 -> "凉爽"
    temperature < 35 -> "温暖"
    else -> "炎热"
}
```

### for 循环

```kotlin
// 遍历范围
for (i in 1..5) {
    println(i)  // 1, 2, 3, 4, 5
}

// 不包含结束值
for (i in 1 until 5) {
    println(i)  // 1, 2, 3, 4
}

// 指定步长
for (i in 1..10 step 2) {
    println(i)  // 1, 3, 5, 7, 9
}

// 降序
for (i in 5 downTo 1) {
    println(i)  // 5, 4, 3, 2, 1
}

// 遍历集合
val fruits = listOf("苹果", "香蕉", "橙子")
for (fruit in fruits) {
    println(fruit)
}

// 带索引遍历
for ((index, fruit) in fruits.withIndex()) {
    println("$index: $fruit")
}

// 遍历 Map
val scores = mapOf("小明" to 85, "小红" to 92)
for ((name, score) in scores) {
    println("$name: $score 分")
}
```

### while 和 do-while 循环

```kotlin
// while 循环
var count = 0
while (count < 5) {
    println("计数:$count")
    count++
}

// do-while 循环(至少执行一次)
var number = 0
do {
    println("数字:$number")
    number++
} while (number < 3)
```

### break 和 continue

```kotlin
// break
for (i in 1..10) {
    if (i == 5) break
    println(i)  // 1, 2, 3, 4
}

// continue
for (i in 1..5) {
    if (i == 3) continue
    println(i)  // 1, 2, 4, 5
}

// 标签跳转
outer@ for (i in 1..3) {
    for (j in 1..3) {
        if (i == 2 && j == 2) break@outer
        println("i=$i, j=$j")
    }
}
```

## 函数

函数是 Kotlin 中的一等公民,支持多种定义和使用方式。

### 基本函数声明

```kotlin
// 有返回值的函数
fun add(a: Int, b: Int): Int {
    return a + b
}

// 单表达式函数
fun multiply(a: Int, b: Int): Int = a * b

// 自动推断返回类型
fun subtract(a: Int, b: Int) = a - b

// 无返回值的函数(返回 Unit)
fun printSum(a: Int, b: Int) {
    println("和:${a + b}")
}

// 显式声明 Unit
fun greet(name: String): Unit {
    println("你好,$name!")
}
```

### 默认参数

```kotlin
fun createUser(
    name: String,
    age: Int = 18,
    city: String = "北京"
) {
    println("姓名:$name, 年龄:$age, 城市:$city")
}

createUser("小明")  // 姓名:小明, 年龄:18, 城市:北京
createUser("小红", 25)  // 姓名:小红, 年龄:25, 城市:北京
createUser("小刚", 30, "上海")  // 姓名:小刚, 年龄:30, 城市:上海
```

### 命名参数

```kotlin
fun sendEmail(
    to: String,
    subject: String,
    body: String,
    cc: String? = null
) {
    println("发送邮件给:$to")
    println("主题:$subject")
}

// 使用命名参数,提高可读性
sendEmail(
    to = "user@example.com",
    subject = "欢迎",
    body = "欢迎使用 Kotlin!"
)

// 可以改变参数顺序
sendEmail(
    subject = "通知",
    body = "系统维护",
    to = "admin@example.com"
)
```

### 可变参数

```kotlin
fun printNumbers(vararg numbers: Int) {
    for (number in numbers) {
        println(number)
    }
}

printNumbers(1, 2, 3)
printNumbers(1, 2, 3, 4, 5)

// 求和函数
fun sum(vararg numbers: Int): Int {
    var total = 0
    for (number in numbers) {
        total += number
    }
    return total
}

println(sum(1, 2, 3, 4, 5))  // 15

// 展开数组
val array = intArrayOf(1, 2, 3)
printNumbers(*array)  // 使用 * 展开操作符
```

### 高阶函数

Kotlin 支持将函数作为参数传递或返回。

```kotlin
// 函数作为参数
fun calculate(a: Int, b: Int, operation: (Int, Int) -> Int): Int {
    return operation(a, b)
}

val sum = calculate(5, 3) { x, y -> x + y }  // 8
val product = calculate(5, 3) { x, y -> x * y }  // 15

// 函数返回函数
fun makeMultiplier(factor: Int): (Int) -> Int {
    return { number -> number * factor }
}

val double = makeMultiplier(2)
val triple = makeMultiplier(3)

println(double(5))  // 10
println(triple(5))  // 15
```

### 扩展函数

扩展函数允许为现有类添加新功能,无需继承。

```kotlin
// 为 String 类添加扩展函数
fun String.addExclamation(): String {
    return "$this!"
}

println("你好".addExclamation())  // 你好!

// 为 Int 类添加扩展函数
fun Int.isEven(): Boolean {
    return this % 2 == 0
}

println(4.isEven())  // true
println(5.isEven())  // false

// 实用的扩展函数
fun String.truncate(maxLength: Int): String {
    return if (length <= maxLength) this
    else substring(0, maxLength) + "..."
}

println("这是一个很长的字符串".truncate(5))  // 这是一个很...
```

### Lambda 表达式

```kotlin
// Lambda 基本语法
val square: (Int) -> Int = { x -> x * x }
println(square(5))  // 25

// 简化语法(使用 it)
val double: (Int) -> Int = { it * 2 }
println(double(5))  // 10

// 多参数 Lambda
val add: (Int, Int) -> Int = { a, b -> a + b }
println(add(3, 4))  // 7

// 集合操作中的 Lambda
val numbers = listOf(1, 2, 3, 4, 5)

val doubled = numbers.map { it * 2 }
println(doubled)  // [2, 4, 6, 8, 10]

val evens = numbers.filter { it % 2 == 0 }
println(evens)  // [2, 4]

val sum = numbers.reduce { acc, number -> acc + number }
println(sum)  // 15

// 复杂操作链
val result = numbers
    .filter { it % 2 == 0 }
    .map { it * it }
    .sum()
println(result)  // 20 (2² + 4² = 4 + 16 = 20)
```

### 内联函数

使用 `inline` 关键字可以减少函数调用开销。

```kotlin
inline fun measureTime(block: () -> Unit) {
    val start = System.currentTimeMillis()
    block()
    val end = System.currentTimeMillis()
    println("执行时间:${end - start}ms")
}

measureTime {
    var sum = 0
    for (i in 1..1000000) {
        sum += i
    }
    println("总和:$sum")
}
```

## 总结

本文介绍了 Kotlin 语言的核心基础知识:

1. **变量声明**:`val` 用于不可变变量,`var` 用于可变变量,优先使用 `val`
2. **数据类型**:包括基本类型、字符串、数组和集合,所有类型都是对象
3. **空安全**:通过 `?`、`?.`、`?:` 和 `!!` 操作符在编译时防止空指针异常
4. **控制流**:`if` 和 `when` 是表达式,`for`、`while` 提供循环功能
5. **函数**:支持默认参数、命名参数、可变参数、高阶函数和扩展函数

掌握这些基础知识是学习 Kotlin 高级特性和 Android 开发的重要基础。Kotlin 的简洁语法和强大功能使其成为现代应用开发的理想选择。

## 下一步学习

- 面向对象编程:类、对象、继承、接口
- 数据类和密封类
- 协程与异步编程
- Kotlin 标准库函数
- Android 开发实践
