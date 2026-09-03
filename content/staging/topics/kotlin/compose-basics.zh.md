---
title: Jetpack Compose 基础入门
description: 深入理解Jetpack Compose核心概念：Composable函数、@Composable注解、remember、mutableStateOf与重组机制
track: kotlin
section: android-multiplatform
difficulty: beginner
tags:
  - Kotlin
  - Jetpack Compose
  - Android
  - UI
  - 声明式编程
status: imported
origin: old/src/content/docs/kotlin/compose-basics.zh.md
divergence: 0.199
issues:
  - title-lang-en
  - title-language
legacy:
  category: Kotlin
  subcategory: Android开发
  order: 3
  lastUpdated: 2026-01-07
---

Jetpack Compose 是 Android 现代化声明式 UI 框架的核心。本文将聚焦于 Compose 最基础也最重要的概念：Composable 函数、状态管理（remember 与 mutableStateOf）以及重组（Recomposition）机制，帮助初学者建立正确的心智模型。

## 概念解释

### 什么是 Jetpack Compose

Jetpack Compose 是 Google 于 2021 年正式发布的 Android 原生 UI 开发工具包。它采用**声明式编程范式**，允许开发者通过描述"UI 应该是什么样子"来构建界面，而非传统的"如何一步步构建 UI"。

**声明式 vs 命令式对比**

```kotlin
// 命令式 UI（传统 View 系统）
// 告诉系统"如何做"
val textView = findViewById<TextView>(R.id.counter)
button.setOnClickListener {
    count++
    textView.text = "点击次数: $count"
}

// 声明式 UI（Compose）
// 告诉系统"是什么"
@Composable
fun Counter() {
    var count by remember { mutableStateOf(0) }

    Column {
        Text("点击次数: $count")
        Button(onClick = { count++ }) {
            Text("点击")
        }
    }
}
```

### Compose 解决的问题

1. **XML 与 Kotlin 分离的割裂感**：传统开发需要在 XML 布局和 Kotlin 代码间切换
2. **View 状态同步困难**：手动更新视图容易产生状态不一致的 Bug
3. **代码复用困难**：自定义 View 需要大量模板代码
4. **预览体验差**：XML 预览与运行时表现可能不一致

### 核心术语

| 术语 | 定义 |
|------|------|
| **Composable** | 使用 @Composable 注解的函数，是构建 UI 的基本单元 |
| **State（状态）** | 驱动 UI 显示的数据，状态变化触发 UI 更新 |
| **Recomposition（重组）** | 当状态变化时，Compose 重新执行 Composable 函数更新 UI 的过程 |
| **remember** | 在重组过程中保持数据的机制 |
| **mutableStateOf** | 创建可观察状态的函数，状态变化自动触发重组 |

## 核心原理

### @Composable 注解的本质

`@Composable` 注解是 Compose 编译器插件的标记。当编译器看到这个注解时，会对函数进行特殊处理：

```kotlin
// 开发者编写的代码
@Composable
fun Greeting(name: String) {
    Text(text = "Hello, $name!")
}

// 编译器实际生成的代码（简化示意）
fun Greeting(name: String, $composer: Composer, $changed: Int) {
    $composer.startRestartGroup(...)

    if ($changed and 0b0001 != 0 || !$composer.skipping) {
        Text(text = "Hello, $name!", $composer, ...)
    } else {
        $composer.skipToGroupEnd()
    }

    $composer.endRestartGroup()?.updateScope { ... }
}
```

编译器插件主要做了以下事情：

1. **注入 Composer 参数**：每个 Composable 函数都会被注入一个 Composer 对象
2. **添加位置信息**：用于追踪 Composable 在组合树中的位置
3. **生成重组逻辑**：决定何时跳过执行、何时重新执行

### 组合（Composition）过程

```
初始组合 (Initial Composition)
         ↓
    执行 Composable 函数
         ↓
    构建 UI 树结构
         ↓
    渲染到屏幕
         ↓
    状态发生变化
         ↓
重组 (Recomposition)
         ↓
    仅重新执行受影响的 Composable
         ↓
    更新 UI 树的相应部分
         ↓
    渲染变化的部分
```

### remember 的工作原理

`remember` 在组合中创建了一个"槽位（Slot）"来存储数据：

```kotlin
@Composable
fun Counter() {
    // remember 创建一个槽位存储 count
    // 重组时，Compose 会从同一槽位读取之前的值
    var count by remember { mutableStateOf(0) }

    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}
```

**内部机制**：

1. **首次组合**：执行 lambda 表达式，将结果存入槽位
2. **后续重组**：直接从槽位读取值，跳过 lambda 执行
3. **组合销毁**：槽位及其数据被清除

### mutableStateOf 与状态订阅

`mutableStateOf` 返回一个 `MutableState<T>` 对象，它是一个可观察的状态容器：

```kotlin
// mutableStateOf 的简化实现原理
class MutableStateImpl<T>(value: T) : MutableState<T> {
    private var _value: T = value

    override var value: T
        get() {
            // 读取时：记录当前 Composable 为订阅者
            Composer.current?.recordRead(this)
            return _value
        }
        set(newValue) {
            if (_value != newValue) {
                _value = newValue
                // 写入时：通知所有订阅者需要重组
                notifySubscribers()
            }
        }
}
```

### 重组的触发与范围

```kotlin
@Composable
fun ParentScreen() {
    var name by remember { mutableStateOf("Android") }

    Column {
        // 当 name 变化时，只有 Greeting 会重组
        // Header 不依赖 name，不会重组
        Header()
        Greeting(name = name)
        Button(onClick = { name = "Compose" }) {
            Text("Change Name")
        }
    }
}

@Composable
fun Header() {
    // 这个函数在 name 变化时不会重组
    Text("Welcome Page")
}

@Composable
fun Greeting(name: String) {
    // 这个函数会因为参数变化而重组
    Text("Hello, $name!")
}
```

**重组范围确定规则**：

1. 读取状态的 Composable 会被标记为需要重组
2. 参数发生变化的 Composable 会重组
3. Compose 编译器会自动确定最小重组范围

## 核心要点

### Composable 函数的特性

```kotlin
// ✅ Composable 函数可以有参数
@Composable
fun UserProfile(name: String, age: Int) { ... }

// ✅ Composable 函数可以有默认参数
@Composable
fun Button(
    text: String,
    enabled: Boolean = true,
    onClick: () -> Unit = {}
) { ... }

// ✅ Composable 函数不返回 UI，而是"发射" UI
@Composable
fun Greeting(name: String) {
    Text("Hello, $name!")  // 发射 Text 到组合
}

// ❌ Composable 函数不应该有副作用（在函数体直接执行）
@Composable
fun BadExample() {
    println("This is a side effect!")  // 避免这样做
    saveToDatabase()  // 避免这样做
}
```

### 状态管理三要素

```kotlin
@Composable
fun StateDemo() {
    // 要素1: mutableStateOf - 创建可观察状态
    // 要素2: remember - 在重组中保持状态
    // 要素3: by 委托 - 简化状态读写语法
    var text by remember { mutableStateOf("") }

    TextField(
        value = text,
        onValueChange = { text = it }
    )
}
```

### 状态提升（State Hoisting）

```kotlin
// 无状态 Composable（推荐）
@Composable
fun Counter(
    count: Int,
    onIncrement: () -> Unit
) {
    Button(onClick = onIncrement) {
        Text("Count: $count")
    }
}

// 有状态的容器
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }

    Counter(
        count = count,
        onIncrement = { count++ }
    )
}
```

### remember 的变体

```kotlin
@Composable
fun RememberVariants(userId: String) {
    // 基础 remember：组合期间保持不变
    val formatter = remember { DateFormatter() }

    // 带 key 的 remember：key 变化时重新计算
    val user = remember(userId) { loadUser(userId) }

    // rememberSaveable：配置变更后仍然保持
    var text by rememberSaveable { mutableStateOf("") }

    // rememberCoroutineScope：获取与组合生命周期绑定的协程作用域
    val scope = rememberCoroutineScope()
}
```

## 代码示例

### 示例1：基础计数器

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SimpleCounter() {
    // 使用 remember 和 mutableStateOf 管理状态
    var count by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // 显示当前计数
        Text(
            text = "当前计数: $count",
            style = MaterialTheme.typography.headlineMedium
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // 减少按钮
            Button(onClick = { count-- }) {
                Text("-")
            }

            // 重置按钮
            OutlinedButton(onClick = { count = 0 }) {
                Text("重置")
            }

            // 增加按钮
            Button(onClick = { count++ }) {
                Text("+")
            }
        }
    }
}
```

### 示例2：输入表单

```kotlin
@Composable
fun UserInputForm() {
    // 多个状态的管理
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var agreed by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // 姓名输入
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("姓名") },
            modifier = Modifier.fillMaxWidth()
        )

        // 邮箱输入
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("邮箱") },
            modifier = Modifier.fillMaxWidth()
        )

        // 同意条款复选框
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = agreed,
                onCheckedChange = { agreed = it }
            )
            Text("我同意用户协议")
        }

        // 提交按钮
        Button(
            onClick = { /* 处理提交 */ },
            enabled = name.isNotBlank() && email.isNotBlank() && agreed,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("提交")
        }
    }
}
```

### 示例3：状态提升模式

```kotlin
// 无状态的展示组件
@Composable
fun TemperatureDisplay(
    celsius: Float,
    onCelsiusChange: (Float) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.padding(16.dp)) {
        Text(
            text = "温度: ${celsius}°C",
            style = MaterialTheme.typography.headlineSmall
        )

        Text(
            text = "华氏度: ${celsius * 9 / 5 + 32}°F",
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        Slider(
            value = celsius,
            onValueChange = onCelsiusChange,
            valueRange = -40f..50f
        )
    }
}

// 有状态的容器组件
@Composable
fun TemperatureScreen() {
    // 状态在容器中管理
    var celsius by remember { mutableStateOf(20f) }

    TemperatureDisplay(
        celsius = celsius,
        onCelsiusChange = { celsius = it }
    )
}
```

### 示例4：派生状态

```kotlin
@Composable
fun ShoppingCart() {
    // 原始状态：商品列表
    var items by remember {
        mutableStateOf(
            listOf(
                CartItem("苹果", 5.0, 2),
                CartItem("香蕉", 3.0, 3),
                CartItem("橙子", 4.0, 1)
            )
        )
    }

    // 派生状态：使用 derivedStateOf 避免不必要的重组
    val totalPrice by remember {
        derivedStateOf {
            items.sumOf { it.price * it.quantity }
        }
    }

    val totalItems by remember {
        derivedStateOf {
            items.sumOf { it.quantity }
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        items.forEach { item ->
            CartItemRow(
                item = item,
                onQuantityChange = { newQty ->
                    items = items.map {
                        if (it.name == item.name) it.copy(quantity = newQty)
                        else it
                    }
                }
            )
        }

        Divider(modifier = Modifier.padding(vertical = 8.dp))

        Text("商品数量: $totalItems")
        Text(
            text = "总计: ¥${"%.2f".format(totalPrice)}",
            style = MaterialTheme.typography.titleLarge
        )
    }
}

data class CartItem(
    val name: String,
    val price: Double,
    val quantity: Int
)

@Composable
fun CartItemRow(
    item: CartItem,
    onQuantityChange: (Int) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(item.name)

        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = {
                if (item.quantity > 0) onQuantityChange(item.quantity - 1)
            }) {
                Text("-")
            }
            Text("${item.quantity}")
            IconButton(onClick = { onQuantityChange(item.quantity + 1) }) {
                Text("+")
            }
        }

        Text("¥${"%.2f".format(item.price * item.quantity)}")
    }
}
```

### 示例5：理解重组

```kotlin
@Composable
fun RecompositionDemo() {
    var counter1 by remember { mutableStateOf(0) }
    var counter2 by remember { mutableStateOf(0) }

    Column(modifier = Modifier.padding(16.dp)) {
        // 这个 Text 只在 counter1 变化时重组
        CounterDisplay(
            label = "计数器1",
            count = counter1
        )

        Button(onClick = { counter1++ }) {
            Text("增加计数器1")
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 这个 Text 只在 counter2 变化时重组
        CounterDisplay(
            label = "计数器2",
            count = counter2
        )

        Button(onClick = { counter2++ }) {
            Text("增加计数器2")
        }
    }
}

@Composable
fun CounterDisplay(label: String, count: Int) {
    // 可以在这里添加日志来观察重组
    // SideEffect { println("$label recomposed with count: $count") }

    Text(
        text = "$label: $count",
        style = MaterialTheme.typography.titleMedium
    )
}
```

## 最佳实践

### 保持 Composable 函数简单纯粹

```kotlin
// ✅ 好的做法：纯粹的 UI 描述
@Composable
fun UserCard(user: User, onEdit: () -> Unit) {
    Card {
        Text(user.name)
        Button(onClick = onEdit) {
            Text("编辑")
        }
    }
}

// ❌ 避免：在 Composable 中执行副作用
@Composable
fun BadUserCard(userId: String) {
    val user = fetchUserFromNetwork(userId)  // 直接网络请求
    saveToAnalytics("user_viewed")  // 直接写入
    Card {
        Text(user.name)
    }
}
```

### 正确使用 remember

```kotlin
// ✅ 使用 remember 缓存昂贵计算
@Composable
fun ExpensiveCalculation(numbers: List<Int>) {
    val result = remember(numbers) {
        numbers.map { it * it }.sum()  // 只在 numbers 变化时重新计算
    }
    Text("结果: $result")
}

// ❌ 不要过度使用 remember
@Composable
fun SimpleText(text: String) {
    // 不需要 remember 简单的字符串操作
    val upperText = remember(text) { text.uppercase() }  // 过度优化
    Text(upperText)
}
```

### 状态提升到合适的层级

```kotlin
// ✅ 状态提升到需要共享的最近共同祖先
@Composable
fun SearchScreen() {
    var query by remember { mutableStateOf("") }

    Column {
        SearchBar(
            query = query,
            onQueryChange = { query = it }
        )
        SearchResults(query = query)
    }
}

// ❌ 状态提升过高会导致不必要的重组
@Composable
fun App() {
    var searchQuery by remember { mutableStateOf("") }  // 只有 SearchScreen 用到

    // 整个 App 都会因为 searchQuery 变化而重组
    NavHost(...) { ... }
}
```

### 使用不可变数据

```kotlin
// ✅ 使用不可变 List，通过创建新 List 更新
@Composable
fun TodoList() {
    var todos by remember { mutableStateOf(listOf<Todo>()) }

    Button(onClick = {
        todos = todos + Todo("New Item")  // 创建新 List
    }) {
        Text("添加")
    }
}

// ❌ 避免修改可变集合
@Composable
fun BadTodoList() {
    val todos = remember { mutableListOf<Todo>() }

    Button(onClick = {
        todos.add(Todo("New Item"))  // 不会触发重组！
    }) {
        Text("添加")
    }
}
```

### Composable 函数命名规范

```kotlin
// ✅ 使用 PascalCase 命名 Composable
@Composable
fun UserProfile() { ... }

@Composable
fun NavigationDrawer() { ... }

// ✅ 返回值的 Composable 使用小写开头（如 remember 系列）
@Composable
fun rememberScrollState(): ScrollState { ... }

// ❌ 不要使用小写开头命名发射 UI 的 Composable
@Composable
fun userProfile() { ... }  // 错误
```

## 常见陷阱

### 陷阱1：在 Composable 中直接使用可变对象

```kotlin
// ❌ 错误：直接修改可变对象不会触发重组
@Composable
fun BrokenCounter() {
    val count = remember { mutableListOf(0) }

    Button(onClick = {
        count[0]++  // 修改了值，但不会触发重组
    }) {
        Text("Count: ${count[0]}")
    }
}

// ✅ 正确：使用 mutableStateOf
@Composable
fun WorkingCounter() {
    var count by remember { mutableStateOf(0) }

    Button(onClick = { count++ }) {
        Text("Count: $count")
    }
}
```

### 陷阱2：在 remember 中使用不稳定的 key

```kotlin
// ❌ 错误：每次重组都创建新的 List 作为 key
@Composable
fun UnstableRemember(items: List<String>) {
    val processed = remember(items.toList()) {  // toList() 每次创建新实例
        items.map { it.uppercase() }
    }
}

// ✅ 正确：直接使用 items（如果它是稳定的引用）
@Composable
fun StableRemember(items: List<String>) {
    val processed = remember(items) {
        items.map { it.uppercase() }
    }
}
```

### 陷阱3：在条件语句中使用 remember

```kotlin
// ❌ 错误：remember 在条件中使用会导致状态丢失
@Composable
fun ConditionalRemember(showAdvanced: Boolean) {
    if (showAdvanced) {
        var advancedSetting by remember { mutableStateOf("") }
        // 当 showAdvanced 变为 false 再变为 true 时，advancedSetting 会重置
    }
}

// ✅ 正确：将 remember 提到条件外部
@Composable
fun CorrectConditionalRemember(showAdvanced: Boolean) {
    var advancedSetting by remember { mutableStateOf("") }

    if (showAdvanced) {
        TextField(
            value = advancedSetting,
            onValueChange = { advancedSetting = it }
        )
    }
}
```

### 陷阱4：忘记使用 rememberSaveable

```kotlin
// ❌ 问题：屏幕旋转后状态丢失
@Composable
fun FormWithRemember() {
    var text by remember { mutableStateOf("") }
    // 配置变更（如旋转屏幕）后，text 会重置为空
}

// ✅ 正确：使用 rememberSaveable 保持配置变更后的状态
@Composable
fun FormWithRememberSaveable() {
    var text by rememberSaveable { mutableStateOf("") }
    // 配置变更后，text 仍然保持
}
```

### 陷阱5：Lambda 捕获过时的状态

```kotlin
// ❌ 错误：lambda 捕获了过时的 count 值
@Composable
fun StaleClosureCounter() {
    var count by remember { mutableStateOf(0) }

    LaunchedEffect(Unit) {
        delay(3000)
        println("Count: $count")  // 总是打印初始值 0
    }
}

// ✅ 正确：使用 rememberUpdatedState 获取最新值
@Composable
fun FreshClosureCounter() {
    var count by remember { mutableStateOf(0) }
    val currentCount by rememberUpdatedState(count)

    LaunchedEffect(Unit) {
        delay(3000)
        println("Count: $currentCount")  // 打印最新值
    }
}
```

### 陷阱6：在 Composable 中执行耗时操作

```kotlin
// ❌ 错误：在 Composable 中直接执行耗时操作
@Composable
fun SlowComposable() {
    val data = loadDataFromDatabase()  // 阻塞主线程
    Text(data.toString())
}

// ✅ 正确：使用 LaunchedEffect 和状态
@Composable
fun FastComposable() {
    var data by remember { mutableStateOf<Data?>(null) }

    LaunchedEffect(Unit) {
        data = withContext(Dispatchers.IO) {
            loadDataFromDatabase()
        }
    }

    if (data != null) {
        Text(data.toString())
    } else {
        CircularProgressIndicator()
    }
}
```

## 性能考量

### 理解智能重组

Compose 的编译器会自动进行重组优化，但了解其工作原理有助于写出高性能代码：

```kotlin
@Composable
fun OptimizedList(items: List<String>) {
    LazyColumn {
        items(
            items = items,
            key = { it }  // 提供稳定的 key 帮助 Compose 识别项目
        ) { item ->
            ListItem(item)
        }
    }
}
```

### 使用 derivedStateOf 避免不必要的重组

```kotlin
@Composable
fun SearchResults(items: List<String>) {
    var searchQuery by remember { mutableStateOf("") }

    // ❌ 每次 searchQuery 变化都重组
    // val filteredItems = items.filter { it.contains(searchQuery) }

    // ✅ 只在结果真正变化时才触发依赖它的重组
    val filteredItems by remember(items) {
        derivedStateOf {
            items.filter { it.contains(searchQuery) }
        }
    }

    TextField(
        value = searchQuery,
        onValueChange = { searchQuery = it }
    )

    LazyColumn {
        items(filteredItems) { item ->
            Text(item)
        }
    }
}
```

### 稳定性与 @Immutable / @Stable 注解

```kotlin
// 使用 @Immutable 标记完全不可变的类
@Immutable
data class User(
    val id: String,
    val name: String,
    val email: String
)

// 使用 @Stable 标记公开属性稳定的类
@Stable
class UserRepository {
    private var cachedUser: User? = null

    fun getUser(): User? = cachedUser
}

// Compose 编译器会利用这些注解优化重组
@Composable
fun UserCard(user: User) {  // User 是 @Immutable，可以安全跳过
    Text(user.name)
}
```

### 避免在循环中创建 lambda

```kotlin
// ❌ 低效：每次重组都创建新的 lambda
@Composable
fun IneffientList(items: List<String>, onItemClick: (String) -> Unit) {
    Column {
        items.forEach { item ->
            Button(onClick = { onItemClick(item) }) {  // 每次重组创建新 lambda
                Text(item)
            }
        }
    }
}

// ✅ 高效：使用 remember 缓存或 LazyColumn
@Composable
fun EfficientList(items: List<String>, onItemClick: (String) -> Unit) {
    LazyColumn {
        items(items) { item ->
            Button(onClick = { onItemClick(item) }) {
                Text(item)
            }
        }
    }
}
```

### 合理使用 key

```kotlin
@Composable
fun AnimatedList(items: List<Item>) {
    LazyColumn {
        items(
            items = items,
            // 使用稳定唯一的 key 而非索引
            key = { item -> item.id }
        ) { item ->
            AnimatedVisibility(visible = true) {
                ItemRow(item)
            }
        }
    }
}
```

## 实战场景

### 场景1：登录表单

```kotlin
@Composable
fun LoginScreen(
    onLoginSuccess: (User) -> Unit
) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val isFormValid by remember {
        derivedStateOf {
            email.isNotBlank() &&
            password.length >= 6 &&
            android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()
        }
    }

    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "登录",
            style = MaterialTheme.typography.headlineLarge,
            modifier = Modifier.padding(bottom = 32.dp)
        )

        OutlinedTextField(
            value = email,
            onValueChange = {
                email = it
                errorMessage = null
            },
            label = { Text("邮箱") },
            isError = errorMessage != null,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = password,
            onValueChange = {
                password = it
                errorMessage = null
            },
            label = { Text("密码") },
            visualTransformation = PasswordVisualTransformation(),
            isError = errorMessage != null,
            modifier = Modifier.fillMaxWidth()
        )

        errorMessage?.let { error ->
            Text(
                text = error,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                scope.launch {
                    isLoading = true
                    try {
                        val user = login(email, password)
                        onLoginSuccess(user)
                    } catch (e: Exception) {
                        errorMessage = "登录失败：${e.message}"
                    } finally {
                        isLoading = false
                    }
                }
            },
            enabled = isFormValid && !isLoading,
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("登录")
            }
        }
    }
}
```

### 场景2：可展开列表

```kotlin
@Composable
fun ExpandableList(sections: List<Section>) {
    // 记录展开状态的 Map
    var expandedSections by remember {
        mutableStateOf(setOf<String>())
    }

    LazyColumn {
        sections.forEach { section ->
            item(key = section.id) {
                SectionHeader(
                    title = section.title,
                    isExpanded = section.id in expandedSections,
                    onToggle = {
                        expandedSections = if (section.id in expandedSections) {
                            expandedSections - section.id
                        } else {
                            expandedSections + section.id
                        }
                    }
                )
            }

            if (section.id in expandedSections) {
                items(
                    items = section.items,
                    key = { it.id }
                ) { item ->
                    SectionItem(item)
                }
            }
        }
    }
}

@Composable
fun SectionHeader(
    title: String,
    isExpanded: Boolean,
    onToggle: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onToggle)
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium
        )
        Icon(
            imageVector = if (isExpanded)
                Icons.Default.KeyboardArrowUp
            else
                Icons.Default.KeyboardArrowDown,
            contentDescription = if (isExpanded) "收起" else "展开"
        )
    }
}
```

### 场景3：搜索与过滤

```kotlin
@Composable
fun SearchableList(allItems: List<Product>) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    // 使用 derivedStateOf 优化过滤逻辑
    val filteredItems by remember(allItems) {
        derivedStateOf {
            allItems.filter { product ->
                val matchesSearch = searchQuery.isBlank() ||
                    product.name.contains(searchQuery, ignoreCase = true)
                val matchesCategory = selectedCategory == null ||
                    product.category == selectedCategory
                matchesSearch && matchesCategory
            }
        }
    }

    val categories = remember(allItems) {
        allItems.map { it.category }.distinct()
    }

    Column {
        // 搜索栏
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            label = { Text("搜索商品") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        )

        // 分类筛选
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            item {
                FilterChip(
                    selected = selectedCategory == null,
                    onClick = { selectedCategory = null },
                    label = { Text("全部") }
                )
            }
            items(categories) { category ->
                FilterChip(
                    selected = selectedCategory == category,
                    onClick = { selectedCategory = category },
                    label = { Text(category) }
                )
            }
        }

        // 结果列表
        LazyColumn {
            items(
                items = filteredItems,
                key = { it.id }
            ) { product ->
                ProductCard(product)
            }
        }
    }
}
```

## 面试要点

### 基础问题

**Q1: 什么是 @Composable 注解，它的作用是什么？**

答：`@Composable` 是一个标记注解，用于标识可组合函数。Compose 编译器插件会对标记了 `@Composable` 的函数进行特殊处理：
- 注入 Composer 参数用于追踪组合状态
- 添加位置信息用于识别组合树中的位置
- 生成重组逻辑以支持智能 UI 更新

**Q2: remember 和 rememberSaveable 有什么区别？**

答：
- `remember`：在重组过程中保持值，但配置变更（如屏幕旋转）后会丢失
- `rememberSaveable`：值会被保存到 SavedInstanceState，配置变更后仍然保持

**Q3: mutableStateOf 返回什么？它如何触发重组？**

答：`mutableStateOf` 返回一个 `MutableState<T>` 对象，这是一个可观察的状态容器。当读取 `.value` 时，Compose 会记录当前 Composable 为订阅者；当写入 `.value` 时，会通知所有订阅者需要重组。

### 进阶问题

**Q4: 什么是重组（Recomposition）？Compose 如何决定哪些部分需要重组？**

答：重组是当状态变化时，Compose 重新执行 Composable 函数来更新 UI 的过程。Compose 使用以下策略确定重组范围：
1. 追踪每个 Composable 读取了哪些状态
2. 当状态变化时，只标记读取该状态的 Composable 需要重组
3. 比较 Composable 的参数，如果参数未变化且是稳定类型，可以跳过重组
4. 编译器会自动确定最小重组范围（通常是 lambda 边界）

**Q5: 为什么 Compose 要求 Composable 函数是幂等的？**

答：因为 Compose 可能会在任何时候、以任何顺序、任何频率调用 Composable 函数。如果函数有副作用或不是幂等的，可能导致：
- 不可预测的行为
- UI 与数据不一致
- 性能问题

**Q6: 如何优化 Compose 的性能？**

答：
1. 使用 `remember` 缓存计算结果
2. 使用 `derivedStateOf` 避免不必要的重组
3. 使用 `@Stable` 或 `@Immutable` 注解帮助编译器优化
4. 为列表项提供稳定的 key
5. 合理使用状态提升，将状态提升到最近需要共享的层级
6. 避免在 Composable 中执行耗时操作

**Q7: 解释状态提升（State Hoisting）模式及其优点**

答：状态提升是将状态从 Composable 中提取到调用者的模式。例如：

```kotlin
// 无状态 Composable
@Composable
fun Counter(count: Int, onIncrement: () -> Unit) { ... }

// 有状态容器
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }
    Counter(count, { count++ })
}
```

优点：
- 提高组件可复用性
- 便于测试（无状态组件更容易测试）
- 支持单一数据源原则
- 便于状态共享

## 延伸阅读

### 官方资源

- [Jetpack Compose 官方文档](https://developer.android.com/jetpack/compose)
- [Compose 状态和 Jetpack](https://developer.android.com/jetpack/compose/state)
- [Compose 编程思想](https://developer.android.com/jetpack/compose/mental-model)
- [Compose 性能指南](https://developer.android.com/jetpack/compose/performance)

### 推荐学习路径

1. **入门阶段**：理解 Composable、State、Recomposition
2. **进阶阶段**：学习 Side Effects（LaunchedEffect、SideEffect 等）
3. **高级阶段**：自定义布局、动画、手势处理
4. **架构阶段**：与 ViewModel、Navigation、Hilt 集成

### 相关文章

- [Compose 中的副作用](/docs/kotlin/jetpack-compose) - 深入了解 LaunchedEffect、SideEffect 等
- [Kotlin 协程基础](/docs/kotlin/coroutines) - Compose 中协程的使用
- [Kotlin 基础语法](/docs/kotlin/fundamentals) - Kotlin 语言基础

### 工具推荐

- **Layout Inspector**：调试 Compose UI 层级
- **Compose Preview**：Android Studio 中实时预览 Composable
- **Recomposition Highlighter**：可视化重组范围（调试用）

### 社区资源

- [Compose Samples](https://github.com/android/compose-samples) - 官方示例项目
- [Now in Android](https://github.com/android/nowinandroid) - 现代 Android 开发最佳实践
- [Accompanist](https://github.com/google/accompanist) - Compose 官方补充库
