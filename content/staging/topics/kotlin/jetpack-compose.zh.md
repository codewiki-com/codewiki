---
title: Jetpack Compose
description: Jetpack Compose 完整指南，声明式 UI、Composable 函数和状态管理
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Jetpack Compose
  - Android
  - UI
status: imported
origin: old/src/content/docs/kotlin/jetpack-compose.zh.md
divergence: 0.2
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Kotlin
  subcategory: Android Development
  order: 4
  lastUpdated: 2026-01-07
---

Jetpack Compose 是 Android 构建原生用户界面的现代工具包。它通过使用 Kotlin 的声明式方法来简化和加速 Android 上的 UI 开发。与命令式地操作视图层次结构不同，你只需描述 UI 应该是什么样子，Compose 会负责在数据变化时更新屏幕。

## 声明式 UI 简介

### 范式转变

传统的 Android 开发使用命令式方法，你需要手动查找视图并更新它们：

```kotlin
// 命令式方法（传统 Android Views）
val textView = findViewById<TextView>(R.id.greeting)
val button = findViewById<Button>(R.id.button)

button.setOnClickListener {
    textView.text = "Hello, World!"
    textView.setTextColor(Color.BLUE)
    textView.visibility = View.VISIBLE
}
```

Jetpack Compose 使用声明式方法，你根据当前状态描述 UI：

```kotlin
// 声明式方法（Jetpack Compose）
@Composable
fun Greeting(name: String, isVisible: Boolean) {
    if (isVisible) {
        Text(
            text = "Hello, $name!",
            color = Color.Blue
        )
    }
}
```

### 声明式 UI 的优势

1. **更少的代码**：减少样板代码，专注于描述 UI
2. **直观**：状态变化时 UI 自动更新
3. **加速开发**：实时预览和热重载
4. **强大**：完全访问 Kotlin 语言特性
5. **兼容**：可与现有 Views 一起使用

## 入门指南

### 项目设置

在你的 `build.gradle.kts` 中添加以下依赖：

```kotlin
android {
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)

    // 核心 Compose 库
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    // Activity 集成
    implementation("androidx.activity:activity-compose:1.8.2")

    // ViewModel 集成
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // 导航
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // 调试工具
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### 第一个 Compose Activity

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MyAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Greeting("Android")
                }
            }
        }
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    MyAppTheme {
        Greeting("Android")
    }
}
```

## Composable 函数

Composable 函数是 Compose UI 的基本构建块。它们用 `@Composable` 注解标注，描述 UI 的一部分。

### 基本 Composable 结构

```kotlin
@Composable
fun WelcomeCard(
    userName: String,
    onButtonClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Welcome, $userName!",
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = onButtonClick) {
                Text("Get Started")
            }
        }
    }
}
```

### Composable 规则

1. **只能从其他 composable 调用**：Composable 函数必须在 composable 上下文中调用
2. **可以调用其他 composable**：通过组合较小的函数构建复杂 UI
3. **UI 没有返回值**：Composable 发射 UI 而不是返回它
4. **执行顺序无关**：Compose 可以以任意顺序执行 composable

### 内置 Composables

Compose 提供了许多现成的 composable：

```kotlin
@Composable
fun CommonComposablesDemo() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 文本显示
        Text(
            text = "Hello Compose",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 按钮
        Button(
            onClick = { /* 操作 */ },
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(4.dp))
            Text("Add Item")
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 文本字段
        var text by remember { mutableStateOf("") }
        OutlinedTextField(
            value = text,
            onValueChange = { text = it },
            label = { Text("Enter name") },
            leadingIcon = {
                Icon(Icons.Default.Person, contentDescription = null)
            }
        )

        Spacer(modifier = Modifier.height(8.dp))

        // 图片
        Image(
            painter = painterResource(id = R.drawable.sample_image),
            contentDescription = "示例图片",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
        )

        // 复选框
        var checked by remember { mutableStateOf(false) }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = checked,
                onCheckedChange = { checked = it }
            )
            Text("Accept terms")
        }

        // 开关
        var switchState by remember { mutableStateOf(false) }
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Enable notifications")
            Switch(
                checked = switchState,
                onCheckedChange = { switchState = it }
            )
        }
    }
}
```

### 预览注解

Compose 提供强大的预览功能：

```kotlin
@Preview(
    name = "Light Mode",
    showBackground = true
)
@Preview(
    name = "Dark Mode",
    showBackground = true,
    uiMode = Configuration.UI_MODE_NIGHT_YES
)
@Preview(
    name = "Large Font",
    showBackground = true,
    fontScale = 1.5f
)
@Composable
fun WelcomeCardPreview() {
    MyAppTheme {
        WelcomeCard(
            userName = "John",
            onButtonClick = {}
        )
    }
}

// 交互式预览
@Preview(showBackground = true)
@Composable
fun InteractivePreview() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) {
        Text("Clicked $count times")
    }
}
```

## 状态管理

Compose 中的状态决定了 UI 显示的内容。当状态变化时，Compose 自动重组 UI 树中受影响的部分。

### remember 和 mutableStateOf

最基本的状态管理形式使用 `remember` 在重组之间保持状态，使用 `mutableStateOf` 创建可观察状态：

```kotlin
@Composable
fun Counter() {
    // remember 在重组之间保持状态
    // mutableStateOf 创建触发重组的可观察状态
    var count by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Count: $count",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { count-- }) {
                Text("-")
            }
            Button(onClick = { count++ }) {
                Text("+")
            }
        }
    }
}
```

### 状态提升

状态提升是将状态上移以使 composable 无状态和可重用的模式：

```kotlin
// 无状态 composable（更适合重用和测试）
@Composable
fun CounterDisplay(
    count: Int,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Count: $count",
            style = MaterialTheme.typography.headlineMedium
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onDecrement) { Text("-") }
            Button(onClick = onIncrement) { Text("+") }
        }
    }
}

// 拥有状态的有状态包装器
@Composable
fun CounterScreen() {
    var count by remember { mutableStateOf(0) }

    CounterDisplay(
        count = count,
        onIncrement = { count++ },
        onDecrement = { count-- }
    )
}
```

### rememberSaveable

使用 `rememberSaveable` 在配置更改（如屏幕旋转）之间保持状态：

```kotlin
@Composable
fun FormWithSavedState() {
    // 这会在配置更改后保留
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }

    Column(modifier = Modifier.padding(16.dp)) {
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name") }
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email") }
        )
    }
}

// 对于复杂对象，提供自定义 Saver
@Parcelize
data class UserProfile(
    val name: String,
    val age: Int
) : Parcelable

@Composable
fun ProfileEditor() {
    var profile by rememberSaveable {
        mutableStateOf(UserProfile("", 0))
    }
    // ...
}
```

### ViewModel 集成

对于更复杂的状态管理，与 ViewModel 集成：

```kotlin
class TaskViewModel : ViewModel() {
    private val _tasks = MutableStateFlow<List<Task>>(emptyList())
    val tasks: StateFlow<List<Task>> = _tasks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadTasks() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _tasks.value = repository.getTasks()
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addTask(task: Task) {
        viewModelScope.launch {
            _tasks.value = _tasks.value + task
            repository.saveTask(task)
        }
    }

    fun deleteTask(taskId: String) {
        viewModelScope.launch {
            _tasks.value = _tasks.value.filter { it.id != taskId }
            repository.deleteTask(taskId)
        }
    }
}

@Composable
fun TaskListScreen(
    viewModel: TaskViewModel = viewModel()
) {
    val tasks by viewModel.tasks.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoading.collectAsStateWithLifecycle()
    val error by viewModel.error.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        viewModel.loadTasks()
    }

    when {
        isLoading -> {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }
        error != null -> {
            ErrorMessage(
                message = error!!,
                onRetry = { viewModel.loadTasks() }
            )
        }
        else -> {
            TaskList(
                tasks = tasks,
                onDeleteTask = { viewModel.deleteTask(it.id) }
            )
        }
    }
}
```

### 派生状态

使用 `derivedStateOf` 从其他状态对象高效计算状态：

```kotlin
@Composable
fun SearchableProductList(products: List<Product>) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    // derivedStateOf 确保仅在依赖项更改时重新计算
    val filteredProducts by remember(products) {
        derivedStateOf {
            products.filter { product ->
                val matchesSearch = product.name.contains(searchQuery, ignoreCase = true)
                val matchesCategory = selectedCategory == null ||
                    product.category == selectedCategory
                matchesSearch && matchesCategory
            }
        }
    }

    val hasResults by remember {
        derivedStateOf { filteredProducts.isNotEmpty() }
    }

    Column {
        SearchBar(
            query = searchQuery,
            onQueryChange = { searchQuery = it }
        )

        CategoryFilter(
            selected = selectedCategory,
            onSelect = { selectedCategory = it }
        )

        if (hasResults) {
            ProductGrid(products = filteredProducts)
        } else {
            EmptyState(message = "No products found")
        }
    }
}
```

## 布局

Compose 提供灵活的布局 composable 来排列 UI 元素。

### Column、Row 和 Box

```kotlin
@Composable
fun LayoutBasics() {
    // Column：垂直排列
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Item 1")
        Text("Item 2")
        Text("Item 3")
    }

    // Row：水平排列
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("Left")
        Text("Center")
        Text("Right")
    }

    // Box：堆叠元素
    Box(
        modifier = Modifier
            .size(200.dp)
            .background(Color.LightGray)
    ) {
        Text(
            text = "Top Start",
            modifier = Modifier.align(Alignment.TopStart)
        )
        Text(
            text = "Center",
            modifier = Modifier.align(Alignment.Center)
        )
        Text(
            text = "Bottom End",
            modifier = Modifier.align(Alignment.BottomEnd)
        )
    }
}
```

### Arrangement 和 Alignment

```kotlin
@Composable
fun ArrangementDemo() {
    // 不同的水平排列
    val arrangements = listOf(
        "Start" to Arrangement.Start,
        "End" to Arrangement.End,
        "Center" to Arrangement.Center,
        "SpaceBetween" to Arrangement.SpaceBetween,
        "SpaceAround" to Arrangement.SpaceAround,
        "SpaceEvenly" to Arrangement.SpaceEvenly
    )

    Column {
        arrangements.forEach { (name, arrangement) ->
            Text(name, style = MaterialTheme.typography.labelMedium)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp)
                    .background(Color.LightGray),
                horizontalArrangement = arrangement
            ) {
                Box(modifier = Modifier.size(40.dp).background(Color.Red))
                Box(modifier = Modifier.size(40.dp).background(Color.Green))
                Box(modifier = Modifier.size(40.dp).background(Color.Blue))
            }
            Spacer(modifier = Modifier.height(8.dp))
        }
    }
}
```

### Constraint Layout

对于复杂布局，使用 ConstraintLayout：

```kotlin
@Composable
fun ProfileCard() {
    ConstraintLayout(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        val (avatar, name, bio, followButton, statsRow) = createRefs()

        Image(
            painter = painterResource(R.drawable.avatar),
            contentDescription = null,
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .constrainAs(avatar) {
                    top.linkTo(parent.top)
                    start.linkTo(parent.start)
                }
        )

        Text(
            text = "John Doe",
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.constrainAs(name) {
                top.linkTo(avatar.top)
                start.linkTo(avatar.end, margin = 16.dp)
            }
        )

        Text(
            text = "Android Developer",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.constrainAs(bio) {
                top.linkTo(name.bottom, margin = 4.dp)
                start.linkTo(name.start)
            }
        )

        Button(
            onClick = { },
            modifier = Modifier.constrainAs(followButton) {
                top.linkTo(avatar.top)
                end.linkTo(parent.end)
            }
        ) {
            Text("Follow")
        }

        Row(
            modifier = Modifier.constrainAs(statsRow) {
                top.linkTo(avatar.bottom, margin = 16.dp)
                start.linkTo(parent.start)
                end.linkTo(parent.end)
                width = Dimension.fillToConstraints
            },
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem("Posts", "142")
            StatItem("Followers", "10.5K")
            StatItem("Following", "234")
        }
    }
}

@Composable
fun StatItem(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.titleMedium)
        Text(label, style = MaterialTheme.typography.bodySmall)
    }
}
```

### Scaffold

Scaffold 提供基本的 Material Design 布局结构：

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScaffold() {
    var selectedTab by remember { mutableStateOf(0) }
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My App") },
                navigationIcon = {
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu")
                    }
                },
                actions = {
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.Search, contentDescription = "Search")
                    }
                    IconButton(onClick = { }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("Home") },
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Favorite, contentDescription = null) },
                    label = { Text("Favorites") },
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 }
                )
                NavigationBarItem(
                    icon = { Icon(Icons.Default.Person, contentDescription = null) },
                    label = { Text("Profile") },
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 }
                )
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    scope.launch {
                        snackbarHostState.showSnackbar("FAB clicked!")
                    }
                }
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add")
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        // 主内容
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                0 -> HomeContent()
                1 -> FavoritesContent()
                2 -> ProfileContent()
            }
        }
    }
}
```

## 修饰符

修饰符允许你装饰或增强 composable。它们可以改变大小、添加内边距、处理输入等等。

### 常用修饰符

```kotlin
@Composable
fun ModifierShowcase() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 尺寸修饰符
        Box(
            modifier = Modifier
                .size(100.dp)                    // 固定尺寸
                .background(Color.Red)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()                  // 填充父宽度
                .height(50.dp)                   // 固定高度
                .background(Color.Green)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)              // 父宽度的 50%
                .aspectRatio(16f / 9f)           // 宽高比
                .background(Color.Blue)
        )

        // 内边距和间距
        Text(
            text = "Padded text",
            modifier = Modifier
                .background(Color.Yellow)
                .padding(horizontal = 16.dp, vertical = 8.dp)
        )

        // 形状和边框
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Magenta)
                .border(2.dp, Color.Black, RoundedCornerShape(16.dp))
        )

        // 阴影和高度
        Surface(
            modifier = Modifier.size(100.dp),
            shadowElevation = 8.dp,
            shape = RoundedCornerShape(8.dp)
        ) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("Elevated")
            }
        }
    }
}
```

### 修饰符顺序很重要

修饰符的顺序显著影响结果：

```kotlin
@Composable
fun ModifierOrderDemo() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        // 先 padding 后 background：padding 在 background 内部
        Text(
            text = "A",
            modifier = Modifier
                .background(Color.Yellow)
                .padding(16.dp)
        )

        // 先 background 后 padding：padding 在 background 外部
        Text(
            text = "B",
            modifier = Modifier
                .padding(16.dp)
                .background(Color.Yellow)
        )

        // 点击区域差异
        Text(
            text = "C",
            modifier = Modifier
                .clickable { }
                .padding(16.dp)         // 点击区域包括 padding
                .background(Color.Cyan)
        )

        Text(
            text = "D",
            modifier = Modifier
                .padding(16.dp)
                .clickable { }          // 点击区域仅为文本
                .background(Color.Cyan)
        )
    }
}
```

### 输入修饰符

```kotlin
@Composable
fun InputModifiersDemo() {
    var clicks by remember { mutableStateOf(0) }
    var dragOffset by remember { mutableStateOf(Offset.Zero) }

    Column(modifier = Modifier.padding(16.dp)) {
        // 点击处理
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(Color.Blue)
                .clickable { clicks++ },
            contentAlignment = Alignment.Center
        ) {
            Text("Clicks: $clicks", color = Color.White)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 拖动处理
        Box(
            modifier = Modifier
                .offset { IntOffset(dragOffset.x.toInt(), dragOffset.y.toInt()) }
                .size(100.dp)
                .background(Color.Green)
                .pointerInput(Unit) {
                    detectDragGestures { change, dragAmount ->
                        change.consume()
                        dragOffset += dragAmount
                    }
                },
            contentAlignment = Alignment.Center
        ) {
            Text("Drag me", color = Color.White)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 长按
        var longPressed by remember { mutableStateOf(false) }
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(if (longPressed) Color.Red else Color.Gray)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onLongPress = { longPressed = !longPressed },
                        onDoubleTap = { /* 处理双击 */ }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Text("Long press", color = Color.White)
        }
    }
}
```

### 自定义修饰符

创建可重用的修饰符扩展：

```kotlin
// 简单扩展修饰符
fun Modifier.debugBorder(color: Color = Color.Red) = this.then(
    border(1.dp, color)
)

// Composed 修饰符（可以使用组合）
fun Modifier.shimmerEffect(): Modifier = composed {
    var size by remember { mutableStateOf(IntSize.Zero) }
    val transition = rememberInfiniteTransition(label = "shimmer")
    val startOffsetX by transition.animateFloat(
        initialValue = -2 * size.width.toFloat(),
        targetValue = 2 * size.width.toFloat(),
        animationSpec = infiniteRepeatable(
            animation = tween(1000)
        ),
        label = "shimmer offset"
    )

    background(
        brush = Brush.linearGradient(
            colors = listOf(
                Color.LightGray.copy(alpha = 0.6f),
                Color.LightGray.copy(alpha = 0.2f),
                Color.LightGray.copy(alpha = 0.6f),
            ),
            start = Offset(startOffsetX, 0f),
            end = Offset(startOffsetX + size.width.toFloat(), size.height.toFloat())
        )
    ).onGloballyPositioned {
        size = it.size
    }
}

// 条件修饰符
fun Modifier.conditional(
    condition: Boolean,
    modifier: Modifier.() -> Modifier
): Modifier = if (condition) then(modifier()) else this

// 用法
@Composable
fun CustomModifiersDemo() {
    val isLoading = true

    Box(
        modifier = Modifier
            .size(200.dp)
            .conditional(isLoading) { shimmerEffect() }
            .debugBorder()
    )
}
```

## 主题和 Material Design

Compose 与 Material Design 3 无缝集成，提供全面的主题系统。

### 定义配色方案

```kotlin
// 定义自定义颜色
private val LightColorScheme = lightColorScheme(
    primary = Color(0xFF1976D2),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFBBDEFB),
    onPrimaryContainer = Color(0xFF001F3F),
    secondary = Color(0xFF26A69A),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFB2DFDB),
    onSecondaryContainer = Color(0xFF00251A),
    tertiary = Color(0xFFFF7043),
    onTertiary = Color.White,
    background = Color(0xFFFAFAFA),
    onBackground = Color(0xFF1C1B1F),
    surface = Color.White,
    onSurface = Color(0xFF1C1B1F),
    surfaceVariant = Color(0xFFE7E0EC),
    onSurfaceVariant = Color(0xFF49454F),
    error = Color(0xFFBA1A1A),
    onError = Color.White,
    outline = Color(0xFF79747E)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF90CAF9),
    onPrimary = Color(0xFF003258),
    primaryContainer = Color(0xFF004880),
    onPrimaryContainer = Color(0xFFD1E4FF),
    secondary = Color(0xFF80CBC4),
    onSecondary = Color(0xFF00332D),
    secondaryContainer = Color(0xFF004D44),
    onSecondaryContainer = Color(0xFFA7F3EC),
    tertiary = Color(0xFFFFAB91),
    onTertiary = Color(0xFF5F1600),
    background = Color(0xFF1C1B1F),
    onBackground = Color(0xFFE6E1E5),
    surface = Color(0xFF1C1B1F),
    onSurface = Color(0xFFE6E1E5),
    surfaceVariant = Color(0xFF49454F),
    onSurfaceVariant = Color(0xFFCAC4D0),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    outline = Color(0xFF938F99)
)
```

### 字体配置

```kotlin
val AppTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    ),
    displayMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 45.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    )
)
```

### 完整主题设置

```kotlin
@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        // 在 Android 12+ 上使用动态颜色
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    // 更新系统栏颜色
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = Shapes(
            small = RoundedCornerShape(4.dp),
            medium = RoundedCornerShape(8.dp),
            large = RoundedCornerShape(16.dp)
        ),
        content = content
    )
}
```

### 使用主题值

```kotlin
@Composable
fun ThemedComponents() {
    Column(modifier = Modifier.padding(16.dp)) {
        // 使用配色方案
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer,
            shape = MaterialTheme.shapes.medium
        ) {
            Text(
                text = "Primary Container",
                color = MaterialTheme.colorScheme.onPrimaryContainer,
                modifier = Modifier.padding(16.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 使用字体
        Text(
            text = "Headline",
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "Body text with default style",
            style = MaterialTheme.typography.bodyLarge
        )
        Text(
            text = "Label",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 基于主题的自定义修改
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            shape = MaterialTheme.shapes.large
        ) {
            Text(
                text = "Card content",
                modifier = Modifier.padding(16.dp),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
```

## 导航

Navigation Compose 库为 Compose 应用程序提供导航支持。

### 基本导航设置

```kotlin
// 定义路由
sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Details : Screen("details/{itemId}") {
        fun createRoute(itemId: String) = "details/$itemId"
    }
    object Settings : Screen("settings")
    object Profile : Screen("profile?userId={userId}") {
        fun createRoute(userId: String? = null) =
            if (userId != null) "profile?userId=$userId" else "profile"
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        // 首页
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToDetails = { itemId ->
                    navController.navigate(Screen.Details.createRoute(itemId))
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                }
            )
        }

        // 详情页（带必需参数）
        composable(
            route = Screen.Details.route,
            arguments = listOf(
                navArgument("itemId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId") ?: ""
            DetailsScreen(
                itemId = itemId,
                onBack = { navController.navigateUp() }
            )
        }

        // 设置页
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.navigateUp() }
            )
        }

        // 个人资料页（带可选参数）
        composable(
            route = Screen.Profile.route,
            arguments = listOf(
                navArgument("userId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId")
            ProfileScreen(userId = userId)
        }
    }
}
```

### 带底部栏的导航

```kotlin
@Composable
fun MainScreenWithBottomNav() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    val bottomNavItems = listOf(
        BottomNavItem(Screen.Home.route, "Home", Icons.Default.Home),
        BottomNavItem(Screen.Search.route, "Search", Icons.Default.Search),
        BottomNavItem(Screen.Profile.route, "Profile", Icons.Default.Person)
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                bottomNavItems.forEach { item ->
                    NavigationBarItem(
                        icon = { Icon(item.icon, contentDescription = item.label) },
                        label = { Text(item.label) },
                        selected = currentDestination?.hierarchy?.any {
                            it.route == item.route
                        } == true,
                        onClick = {
                            navController.navigate(item.route) {
                                // 弹出到起始目的地以避免堆栈累积
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                // 避免同一目的地的多个副本
                                launchSingleTop = true
                                // 重新选择时恢复状态
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Home.route) { HomeScreen() }
            composable(Screen.Search.route) { SearchScreen() }
            composable(Screen.Profile.route) { ProfileScreen() }
        }
    }
}

data class BottomNavItem(
    val route: String,
    val label: String,
    val icon: ImageVector
)
```

### 类型安全导航

使用 Kotlin 序列化实现类型安全路由：

```kotlin
// 将路由定义为可序列化类
@Serializable
object HomeRoute

@Serializable
data class ProductRoute(val productId: String)

@Serializable
data class SearchRoute(
    val query: String = "",
    val category: String? = null
)

@Composable
fun TypeSafeNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = HomeRoute) {
        composable<HomeRoute> {
            HomeScreen(
                onProductClick = { productId ->
                    navController.navigate(ProductRoute(productId))
                }
            )
        }

        composable<ProductRoute> { backStackEntry ->
            val product = backStackEntry.toRoute<ProductRoute>()
            ProductDetailScreen(
                productId = product.productId,
                onBack = { navController.navigateUp() }
            )
        }

        composable<SearchRoute> { backStackEntry ->
            val search = backStackEntry.toRoute<SearchRoute>()
            SearchScreen(
                initialQuery = search.query,
                initialCategory = search.category
            )
        }
    }
}
```

### 深度链接

```kotlin
composable(
    route = Screen.Product.route,
    arguments = listOf(navArgument("productId") { type = NavType.StringType }),
    deepLinks = listOf(
        navDeepLink {
            uriPattern = "https://myapp.com/product/{productId}"
            action = Intent.ACTION_VIEW
        },
        navDeepLink {
            uriPattern = "myapp://product/{productId}"
        }
    )
) { backStackEntry ->
    val productId = backStackEntry.arguments?.getString("productId")
    ProductScreen(productId = productId)
}
```

## 列表和性能

Compose 提供懒加载布局来高效显示大型列表。

### LazyColumn 和 LazyRow

```kotlin
@Composable
fun ProductList(products: List<Product>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // 头部
        item {
            Text(
                text = "Products",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // 带 key 的项目以获得更好的性能
        items(
            items = products,
            key = { product -> product.id }
        ) { product ->
            ProductCard(product = product)
        }

        // 底部
        item {
            Text(
                text = "${products.size} items",
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 16.dp)
            )
        }
    }
}

@Composable
fun CategoriesRow(categories: List<Category>) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(categories, key = { it.id }) { category ->
            CategoryChip(category = category)
        }
    }
}
```

### LazyGrid

```kotlin
@Composable
fun PhotoGrid(photos: List<Photo>) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 128.dp),
        contentPadding = PaddingValues(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(photos, key = { it.id }) { photo ->
            PhotoCard(
                photo = photo,
                modifier = Modifier.aspectRatio(1f)
            )
        }
    }
}

// 固定列数
@Composable
fun ProductGrid(products: List<Product>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(products, key = { it.id }) { product ->
            ProductGridItem(product)
        }
    }
}
```

### 粘性头部

```kotlin
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ContactList(contacts: Map<Char, List<Contact>>) {
    LazyColumn {
        contacts.forEach { (initial, contactsForInitial) ->
            stickyHeader {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.surfaceVariant
                ) {
                    Text(
                        text = initial.toString(),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }

            items(contactsForInitial, key = { it.id }) { contact ->
                ContactItem(contact)
            }
        }
    }
}
```

### 使用 Paging 3 分页

```kotlin
@Composable
fun PaginatedList(
    viewModel: ArticleViewModel = viewModel()
) {
    val articles = viewModel.articles.collectAsLazyPagingItems()

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(
            count = articles.itemCount,
            key = articles.itemKey { it.id }
        ) { index ->
            val article = articles[index]
            if (article != null) {
                ArticleCard(article = article)
            } else {
                ArticlePlaceholder()
            }
        }

        // 加载状态
        when (articles.loadState.append) {
            is LoadState.Loading -> {
                item {
                    CircularProgressIndicator(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .wrapContentWidth(Alignment.CenterHorizontally)
                    )
                }
            }
            is LoadState.Error -> {
                item {
                    ErrorItem(
                        message = "Failed to load more",
                        onRetry = { articles.retry() }
                    )
                }
            }
            else -> {}
        }
    }
}
```

## 副作用

副作用是发生在 composable 函数作用域之外的操作。Compose 提供了 API 来安全地处理副作用。

### LaunchedEffect

在进入组合或 key 更改时运行挂起函数：

```kotlin
@Composable
fun UserProfile(userId: String) {
    var user by remember { mutableStateOf<User?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    // 当 userId 更改时运行
    LaunchedEffect(userId) {
        isLoading = true
        error = null
        try {
            user = fetchUser(userId)
        } catch (e: Exception) {
            error = e.message
        } finally {
            isLoading = false
        }
    }

    when {
        isLoading -> LoadingIndicator()
        error != null -> ErrorMessage(error!!)
        user != null -> UserContent(user!!)
    }
}

// 一次性效果（进入组合时运行一次）
@Composable
fun AnalyticsScreen(screenName: String) {
    LaunchedEffect(Unit) {
        Analytics.logScreenView(screenName)
    }
    // 屏幕内容...
}
```

### DisposableEffect

用于离开组合时需要清理的效果：

```kotlin
@Composable
fun LifecycleObserver(
    onResume: () -> Unit,
    onPause: () -> Unit
) {
    val lifecycleOwner = LocalLifecycleOwner.current

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> onResume()
                Lifecycle.Event.ON_PAUSE -> onPause()
                else -> {}
            }
        }

        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }
}

@Composable
fun BackHandler(enabled: Boolean = true, onBack: () -> Unit) {
    val backCallback = remember {
        object : OnBackPressedCallback(enabled) {
            override fun handleOnBackPressed() {
                onBack()
            }
        }
    }

    val backDispatcher = LocalOnBackPressedDispatcherOwner.current?.onBackPressedDispatcher

    DisposableEffect(backDispatcher) {
        backDispatcher?.addCallback(backCallback)
        onDispose {
            backCallback.remove()
        }
    }

    LaunchedEffect(enabled) {
        backCallback.isEnabled = enabled
    }
}
```

### rememberCoroutineScope

创建绑定到组合点的协程作用域：

```kotlin
@Composable
fun SnackbarDemo() {
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Column(modifier = Modifier.padding(padding)) {
            Button(
                onClick = {
                    scope.launch {
                        val result = snackbarHostState.showSnackbar(
                            message = "Item deleted",
                            actionLabel = "Undo",
                            duration = SnackbarDuration.Short
                        )
                        if (result == SnackbarResult.ActionPerformed) {
                            // 处理撤销
                        }
                    }
                }
            ) {
                Text("Show Snackbar")
            }
        }
    }
}
```

### produceState

将非 Compose 状态转换为 Compose 状态：

```kotlin
@Composable
fun NetworkImage(
    url: String,
    modifier: Modifier = Modifier
) {
    val imageState by produceState<ImageState>(
        initialValue = ImageState.Loading,
        key1 = url
    ) {
        value = try {
            val bitmap = loadImage(url)
            ImageState.Success(bitmap)
        } catch (e: Exception) {
            ImageState.Error(e.message ?: "Unknown error")
        }
    }

    when (val state = imageState) {
        is ImageState.Loading -> {
            CircularProgressIndicator(modifier = modifier)
        }
        is ImageState.Success -> {
            Image(
                bitmap = state.bitmap.asImageBitmap(),
                contentDescription = null,
                modifier = modifier
            )
        }
        is ImageState.Error -> {
            Icon(
                Icons.Default.BrokenImage,
                contentDescription = state.message,
                modifier = modifier
            )
        }
    }
}

sealed class ImageState {
    object Loading : ImageState()
    data class Success(val bitmap: Bitmap) : ImageState()
    data class Error(val message: String) : ImageState()
}
```

### rememberUpdatedState

捕获可能更改的值，对于效果中的回调很有用：

```kotlin
@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    // 确保即使 onTimeout 更改，我们也始终调用最新的
    val currentOnTimeout by rememberUpdatedState(onTimeout)

    LaunchedEffect(Unit) {
        delay(3000)
        currentOnTimeout()
    }

    // 启动画面 UI...
}
```

## 动画

Compose 提供丰富的动画 API，用于创建流畅、愉悦的用户体验。

### 简单动画

```kotlin
@Composable
fun AnimatedVisibilityDemo() {
    var visible by remember { mutableStateOf(true) }

    Column {
        Button(onClick = { visible = !visible }) {
            Text("Toggle")
        }

        AnimatedVisibility(
            visible = visible,
            enter = fadeIn() + slideInVertically(),
            exit = fadeOut() + slideOutVertically()
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text("Hello!", modifier = Modifier.padding(16.dp))
            }
        }
    }
}

@Composable
fun AnimatedContentDemo() {
    var count by remember { mutableStateOf(0) }

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        AnimatedContent(
            targetState = count,
            transitionSpec = {
                if (targetState > initialState) {
                    slideInVertically { -it } + fadeIn() togetherWith
                    slideOutVertically { it } + fadeOut()
                } else {
                    slideInVertically { it } + fadeIn() togetherWith
                    slideOutVertically { -it } + fadeOut()
                }.using(SizeTransform(clip = false))
            },
            label = "count animation"
        ) { targetCount ->
            Text(
                text = "$targetCount",
                style = MaterialTheme.typography.displayLarge
            )
        }

        Row {
            Button(onClick = { count-- }) { Text("-") }
            Spacer(modifier = Modifier.width(16.dp))
            Button(onClick = { count++ }) { Text("+") }
        }
    }
}
```

### animate*AsState

```kotlin
@Composable
fun AnimatedBox() {
    var expanded by remember { mutableStateOf(false) }

    val size by animateDpAsState(
        targetValue = if (expanded) 200.dp else 100.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioMediumBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "size"
    )

    val color by animateColorAsState(
        targetValue = if (expanded) Color.Blue else Color.Red,
        animationSpec = tween(durationMillis = 500),
        label = "color"
    )

    val rotation by animateFloatAsState(
        targetValue = if (expanded) 360f else 0f,
        animationSpec = tween(durationMillis = 1000),
        label = "rotation"
    )

    Box(
        modifier = Modifier
            .size(size)
            .rotate(rotation)
            .background(color)
            .clickable { expanded = !expanded }
    )
}
```

### Transition 动画

```kotlin
enum class BoxState { Collapsed, Expanded }

@Composable
fun TransitionDemo() {
    var currentState by remember { mutableStateOf(BoxState.Collapsed) }
    val transition = updateTransition(currentState, label = "box transition")

    val size by transition.animateDp(
        transitionSpec = { spring(stiffness = Spring.StiffnessLow) },
        label = "size"
    ) { state ->
        when (state) {
            BoxState.Collapsed -> 100.dp
            BoxState.Expanded -> 200.dp
        }
    }

    val color by transition.animateColor(
        transitionSpec = { tween(500) },
        label = "color"
    ) { state ->
        when (state) {
            BoxState.Collapsed -> Color.Gray
            BoxState.Expanded -> Color.Blue
        }
    }

    val borderWidth by transition.animateDp(
        label = "border width"
    ) { state ->
        when (state) {
            BoxState.Collapsed -> 1.dp
            BoxState.Expanded -> 4.dp
        }
    }

    Box(
        modifier = Modifier
            .size(size)
            .background(color)
            .border(borderWidth, Color.Black)
            .clickable {
                currentState = if (currentState == BoxState.Collapsed)
                    BoxState.Expanded else BoxState.Collapsed
            }
    )
}
```

### 无限动画

```kotlin
@Composable
fun PulsingCircle() {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")

    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    val alpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0.5f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )

    Box(
        modifier = Modifier
            .size(100.dp)
            .scale(scale)
            .alpha(alpha)
            .background(Color.Red, CircleShape)
    )
}
```

## 互操作性

Compose 可以与传统的 Android Views 一起工作。

### 在 Compose 中使用 Views

```kotlin
@Composable
fun AndroidViewDemo() {
    var mapView: MapView? by remember { mutableStateOf(null) }

    AndroidView(
        factory = { context ->
            MapView(context).apply {
                mapView = this
                onCreate(null)
            }
        },
        modifier = Modifier.fillMaxSize(),
        update = { view ->
            // 状态更改时更新视图
        }
    )

    DisposableEffect(Unit) {
        mapView?.onResume()
        onDispose {
            mapView?.onPause()
            mapView?.onDestroy()
        }
    }
}

// Compose 中的 WebView
@Composable
fun WebViewComposable(url: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
                settings.javaScriptEnabled = true
            }
        },
        update = { webView ->
            webView.loadUrl(url)
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

### 在 Views 中使用 Compose

```kotlin
// 在 Activity 或 Fragment 中
class MyFragment : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        return ComposeView(requireContext()).apply {
            setViewCompositionStrategy(
                ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
            )
            setContent {
                MyAppTheme {
                    MyComposableContent()
                }
            }
        }
    }
}

// 在 XML 布局中
// <androidx.compose.ui.platform.ComposeView
//     android:id="@+id/compose_view"
//     android:layout_width="match_parent"
//     android:layout_height="wrap_content" />

class MyActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_my)

        findViewById<ComposeView>(R.id.compose_view).apply {
            setContent {
                MyAppTheme {
                    MyComposableContent()
                }
            }
        }
    }
}
```

## 测试

Compose 提供用于编写 UI 测试的测试 API。

### 基本 UI 测试

```kotlin
class GreetingTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun greeting_displaysCorrectName() {
        composeTestRule.setContent {
            Greeting(name = "Test User")
        }

        composeTestRule
            .onNodeWithText("Hello Test User!")
            .assertIsDisplayed()
    }

    @Test
    fun counter_incrementsOnClick() {
        composeTestRule.setContent {
            Counter()
        }

        // 初始状态
        composeTestRule
            .onNodeWithText("Count: 0")
            .assertIsDisplayed()

        // 点击增加按钮
        composeTestRule
            .onNodeWithText("+")
            .performClick()

        // 验证已增加
        composeTestRule
            .onNodeWithText("Count: 1")
            .assertIsDisplayed()
    }
}
```

### 使用语义测试

```kotlin
@Composable
fun AccessibleButton(
    text: String,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier.semantics {
            contentDescription = "Action button: $text"
        }
    ) {
        Text(text)
    }
}

@Test
fun button_hasCorrectSemantics() {
    composeTestRule.setContent {
        AccessibleButton(text = "Submit", onClick = {})
    }

    composeTestRule
        .onNodeWithContentDescription("Action button: Submit")
        .assertIsDisplayed()
        .assertHasClickAction()
}

@Test
fun list_displaysAllItems() {
    val items = listOf("Item 1", "Item 2", "Item 3")

    composeTestRule.setContent {
        ItemList(items = items)
    }

    items.forEach { item ->
        composeTestRule
            .onNodeWithText(item)
            .assertIsDisplayed()
    }

    // 计数节点
    composeTestRule
        .onAllNodesWithTag("list_item")
        .assertCountEquals(3)
}
```

### 截图测试

```kotlin
@Test
fun card_matchesGolden() {
    composeTestRule.setContent {
        MyAppTheme {
            ProductCard(
                product = Product(
                    id = "1",
                    name = "Test Product",
                    price = 29.99
                )
            )
        }
    }

    composeTestRule
        .onNode(hasTestTag("product_card"))
        .captureToImage()
        .assertAgainstGolden(goldenIdentifier = "product_card_default")
}
```

## 最佳实践

### 保持 Composable 小而专注

```kotlin
// 不好：大型单一 composable
@Composable
fun UserProfileScreenBad(user: User, posts: List<Post>) {
    Column {
        // 500 行 UI 代码...
    }
}

// 好：拆分为较小的 composable
@Composable
fun UserProfileScreen(user: User, posts: List<Post>) {
    Column {
        ProfileHeader(user = user)
        ProfileStats(user = user)
        ProfileTabBar()
        PostList(posts = posts)
    }
}

@Composable
private fun ProfileHeader(user: User) { /* ... */ }

@Composable
private fun ProfileStats(user: User) { /* ... */ }

@Composable
private fun PostList(posts: List<Post>) { /* ... */ }
```

### 使用稳定类型以获得更好的性能

```kotlin
// 将类标记为稳定以优化重组
@Immutable
data class UserData(
    val id: String,
    val name: String,
    val email: String
)

@Stable
class UserState(
    val user: UserData,
    val isLoading: Boolean
)

// 对于列表，使用 kotlinx.collections.immutable 的 ImmutableList
@Composable
fun UserList(users: ImmutableList<UserData>) {
    LazyColumn {
        items(users, key = { it.id }) { user ->
            UserItem(user)
        }
    }
}
```

### 适当提升状态

```kotlin
// 将状态提升到适当的级别
@Composable
fun SearchScreen(viewModel: SearchViewModel = viewModel()) {
    val searchState by viewModel.searchState.collectAsStateWithLifecycle()

    SearchContent(
        query = searchState.query,
        results = searchState.results,
        onQueryChange = viewModel::updateQuery,
        onSearch = viewModel::performSearch
    )
}

@Composable
private fun SearchContent(
    query: String,
    results: List<SearchResult>,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit
) {
    Column {
        SearchBar(
            query = query,
            onQueryChange = onQueryChange,
            onSearch = onSearch
        )
        SearchResults(results = results)
    }
}
```

### 在列表中使用 Key

```kotlin
@Composable
fun ItemList(items: List<Item>) {
    LazyColumn {
        // 始终为列表项提供 key
        items(
            items = items,
            key = { item -> item.id }
        ) { item ->
            ItemRow(item = item)
        }
    }
}
```

### 避免在 Composable 中产生副作用

```kotlin
// 不好：直接在 composable 中产生副作用
@Composable
fun BadExample(userId: String) {
    // 这会在每次重组时运行！
    analytics.logScreenView("profile_$userId")
}

// 好：使用 LaunchedEffect
@Composable
fun GoodExample(userId: String) {
    LaunchedEffect(userId) {
        analytics.logScreenView("profile_$userId")
    }
}
```

### 使用适当的默认 Modifier

```kotlin
// 始终接受带默认值的 modifier 参数
@Composable
fun CustomCard(
    title: String,
    modifier: Modifier = Modifier // 默认 modifier
) {
    Card(
        modifier = modifier // 在根部应用
            .fillMaxWidth()
    ) {
        Text(title)
    }
}
```

### 性能优化技巧

```kotlin
// 对计算值使用 derivedStateOf
@Composable
fun OptimizedSearch(items: List<Item>) {
    var query by remember { mutableStateOf("") }

    val filteredItems by remember(items) {
        derivedStateOf {
            items.filter { it.name.contains(query, ignoreCase = true) }
        }
    }
}

// 对昂贵计算使用带 key 的 remember
@Composable
fun ExpensiveComposable(data: ComplexData) {
    val processedData = remember(data.id) {
        expensiveProcessing(data)
    }
}

// 对一次性操作使用 LaunchedEffect
@Composable
fun DataLoader(id: String) {
    LaunchedEffect(id) {
        // 仅在 id 更改时运行
        loadData(id)
    }
}
```

## 总结

Jetpack Compose 代表了 Android UI 开发的范式转变，提供了更直观、更强大、更可维护的构建用户界面的方法。关键要点包括：

- **声明式 UI**：根据状态描述 UI 应该是什么样子，而不是如何更新它
- **Composable 函数**：从小型、可重用的函数构建 UI
- **状态管理**：对不同的状态作用域使用 `remember`、`mutableStateOf` 和 ViewModel
- **布局和修饰符**：使用灵活的布局和可链式修饰符组合 UI
- **主题**：在整个应用程序中实现一致的 Material Design 3 主题
- **导航**：使用 Navigation Compose 库实现类型安全导航
- **性能**：利用懒加载布局、key 和派生状态获得最佳性能
- **副作用**：使用 LaunchedEffect、DisposableEffect 和其他 API 安全地处理副作用
- **互操作性**：通过 Views 和 Compose 协同工作逐步迁移现有应用程序

Jetpack Compose 持续发展，不断推出新功能和改进。请关注官方 [Jetpack Compose 文档](https://developer.android.com/jetpack/compose) 并探索 [Compose 示例](https://github.com/android/compose-samples) 以获取更多高级模式和最佳实践。
