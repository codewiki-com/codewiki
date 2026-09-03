---
title: Jetpack Compose
description: Complete guide to Jetpack Compose, declarative UI, Composable functions and state management
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Jetpack Compose
  - Android
  - UI
status: imported
origin: old/src/content/docs/kotlin/jetpack-compose.en.md
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

Jetpack Compose is Android's modern toolkit for building native user interfaces. It simplifies and accelerates UI development on Android by using a declarative approach with Kotlin. Instead of imperatively manipulating view hierarchies, you describe what your UI should look like, and Compose takes care of updating the screen when data changes.

## Introduction to Declarative UI

### The Paradigm Shift

Traditional Android development uses an imperative approach where you manually find views and update them:

```kotlin
// Imperative approach (Traditional Android Views)
val textView = findViewById<TextView>(R.id.greeting)
val button = findViewById<Button>(R.id.button)

button.setOnClickListener {
    textView.text = "Hello, World!"
    textView.setTextColor(Color.BLUE)
    textView.visibility = View.VISIBLE
}
```

Jetpack Compose uses a declarative approach where you describe the UI based on the current state:

```kotlin
// Declarative approach (Jetpack Compose)
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

### Benefits of Declarative UI

1. **Less code**: Write less boilerplate and focus on describing UI
2. **Intuitive**: UI automatically updates when state changes
3. **Accelerated development**: Live previews and hot reload
4. **Powerful**: Full access to Kotlin language features
5. **Compatible**: Works alongside existing Views

## Getting Started

### Project Setup

Add the following dependencies to your `build.gradle.kts`:

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

    // Core Compose libraries
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")

    // Activity integration
    implementation("androidx.activity:activity-compose:1.8.2")

    // ViewModel integration
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Debug tooling
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### First Compose Activity

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

## Composable Functions

Composable functions are the fundamental building blocks of Compose UI. They are annotated with `@Composable` and describe a piece of UI.

### Basic Composable Structure

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

### Composable Rules

1. **Can only be called from other composables**: Composable functions must be called from within a composable context
2. **Can call other composables**: Build complex UI by composing smaller functions
3. **No return value for UI**: Composables emit UI rather than return it
4. **Order-independent execution**: Compose may execute composables in any order

### Built-in Composables

Compose provides many ready-to-use composables:

```kotlin
@Composable
fun CommonComposablesDemo() {
    Column(modifier = Modifier.padding(16.dp)) {
        // Text display
        Text(
            text = "Hello Compose",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Button
        Button(
            onClick = { /* action */ },
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary
            )
        ) {
            Icon(Icons.Default.Add, contentDescription = null)
            Spacer(modifier = Modifier.width(4.dp))
            Text("Add Item")
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Text field
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

        // Image
        Image(
            painter = painterResource(id = R.drawable.sample_image),
            contentDescription = "Sample image",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .size(100.dp)
                .clip(CircleShape)
        )

        // Checkbox
        var checked by remember { mutableStateOf(false) }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Checkbox(
                checked = checked,
                onCheckedChange = { checked = it }
            )
            Text("Accept terms")
        }

        // Switch
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

### Preview Annotations

Compose provides powerful preview capabilities:

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

// Interactive preview
@Preview(showBackground = true)
@Composable
fun InteractivePreview() {
    var count by remember { mutableStateOf(0) }
    Button(onClick = { count++ }) {
        Text("Clicked $count times")
    }
}
```

## State Management

State in Compose determines what is displayed in the UI. When state changes, Compose automatically recomposes the affected parts of the UI tree.

### remember and mutableStateOf

The most basic form of state management uses `remember` to preserve state across recompositions and `mutableStateOf` to create observable state:

```kotlin
@Composable
fun Counter() {
    // remember preserves state across recompositions
    // mutableStateOf creates observable state that triggers recomposition
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

### State Hoisting

State hoisting is the pattern of moving state up to make composables stateless and reusable:

```kotlin
// Stateless composable (preferred for reusability and testing)
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

// Stateful wrapper that owns the state
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

Use `rememberSaveable` to preserve state across configuration changes (like screen rotation):

```kotlin
@Composable
fun FormWithSavedState() {
    // This survives configuration changes
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

// For complex objects, provide a custom Saver
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

### ViewModel Integration

For more complex state management, integrate with ViewModel:

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

### Derived State

Use `derivedStateOf` to compute state from other state objects efficiently:

```kotlin
@Composable
fun SearchableProductList(products: List<Product>) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }

    // derivedStateOf ensures this only recomputes when dependencies change
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

## Layouts

Compose provides flexible layout composables for arranging UI elements.

### Column, Row, and Box

```kotlin
@Composable
fun LayoutBasics() {
    // Column: Vertical arrangement
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

    // Row: Horizontal arrangement
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

    // Box: Stacking elements
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

### Arrangement and Alignment

```kotlin
@Composable
fun ArrangementDemo() {
    // Different horizontal arrangements
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

For complex layouts, use ConstraintLayout:

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

Scaffold provides the basic Material Design layout structure:

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
        // Main content
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

## Modifiers

Modifiers allow you to decorate or augment composables. They can change size, add padding, handle input, and much more.

### Common Modifiers

```kotlin
@Composable
fun ModifierShowcase() {
    Column(modifier = Modifier.padding(16.dp)) {
        // Size modifiers
        Box(
            modifier = Modifier
                .size(100.dp)                    // Fixed size
                .background(Color.Red)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth()                  // Fill parent width
                .height(50.dp)                   // Fixed height
                .background(Color.Green)
        )

        Box(
            modifier = Modifier
                .fillMaxWidth(0.5f)              // 50% of parent width
                .aspectRatio(16f / 9f)           // Aspect ratio
                .background(Color.Blue)
        )

        // Padding and spacing
        Text(
            text = "Padded text",
            modifier = Modifier
                .background(Color.Yellow)
                .padding(horizontal = 16.dp, vertical = 8.dp)
        )

        // Shape and border
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.Magenta)
                .border(2.dp, Color.Black, RoundedCornerShape(16.dp))
        )

        // Shadow and elevation
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

### Modifier Order Matters

The order of modifiers significantly affects the result:

```kotlin
@Composable
fun ModifierOrderDemo() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        // Padding then background: padding is inside background
        Text(
            text = "A",
            modifier = Modifier
                .background(Color.Yellow)
                .padding(16.dp)
        )

        // Background then padding: padding is outside background
        Text(
            text = "B",
            modifier = Modifier
                .padding(16.dp)
                .background(Color.Yellow)
        )

        // Clickable area difference
        Text(
            text = "C",
            modifier = Modifier
                .clickable { }
                .padding(16.dp)         // Click area includes padding
                .background(Color.Cyan)
        )

        Text(
            text = "D",
            modifier = Modifier
                .padding(16.dp)
                .clickable { }          // Click area is just the text
                .background(Color.Cyan)
        )
    }
}
```

### Input Modifiers

```kotlin
@Composable
fun InputModifiersDemo() {
    var clicks by remember { mutableStateOf(0) }
    var dragOffset by remember { mutableStateOf(Offset.Zero) }

    Column(modifier = Modifier.padding(16.dp)) {
        // Click handling
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

        // Drag handling
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

        // Long press
        var longPressed by remember { mutableStateOf(false) }
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(if (longPressed) Color.Red else Color.Gray)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onLongPress = { longPressed = !longPressed },
                        onDoubleTap = { /* handle double tap */ }
                    )
                },
            contentAlignment = Alignment.Center
        ) {
            Text("Long press", color = Color.White)
        }
    }
}
```

### Custom Modifiers

Create reusable modifier extensions:

```kotlin
// Simple extension modifier
fun Modifier.debugBorder(color: Color = Color.Red) = this.then(
    border(1.dp, color)
)

// Composed modifier (can use composition)
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

// Conditional modifier
fun Modifier.conditional(
    condition: Boolean,
    modifier: Modifier.() -> Modifier
): Modifier = if (condition) then(modifier()) else this

// Usage
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

## Theming and Material Design

Compose integrates seamlessly with Material Design 3, providing a comprehensive theming system.

### Defining a Color Scheme

```kotlin
// Define custom colors
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

### Typography Configuration

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

### Complete Theme Setup

```kotlin
@Composable
fun MyAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        // Use dynamic color on Android 12+
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    // Update system bar colors
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

### Using Theme Values

```kotlin
@Composable
fun ThemedComponents() {
    Column(modifier = Modifier.padding(16.dp)) {
        // Using color scheme
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

        // Using typography
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

        // Custom modifications based on theme
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

## Navigation

The Navigation Compose library provides navigation support for Compose applications.

### Basic Navigation Setup

```kotlin
// Define routes
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
        // Home screen
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

        // Details screen with required argument
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

        // Settings screen
        composable(Screen.Settings.route) {
            SettingsScreen(
                onBack = { navController.navigateUp() }
            )
        }

        // Profile with optional argument
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

### Navigation with Bottom Bar

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
                                // Pop up to start destination to avoid building up stack
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                // Avoid multiple copies of same destination
                                launchSingleTop = true
                                // Restore state when reselecting
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

### Type-Safe Navigation

Using Kotlin Serialization for type-safe routes:

```kotlin
// Define routes as serializable classes
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

### Deep Links

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

## Lists and Performance

Compose provides lazy layouts for efficiently displaying large lists.

### LazyColumn and LazyRow

```kotlin
@Composable
fun ProductList(products: List<Product>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Header
        item {
            Text(
                text = "Products",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
        }

        // Items with keys for better performance
        items(
            items = products,
            key = { product -> product.id }
        ) { product ->
            ProductCard(product = product)
        }

        // Footer
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

// Fixed columns
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

### Sticky Headers

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

### Pagination with Paging 3

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

        // Loading state
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

## Side Effects

Side effects are operations that occur outside the scope of a composable function. Compose provides APIs to handle side effects safely.

### LaunchedEffect

Runs a suspend function when entering composition or when keys change:

```kotlin
@Composable
fun UserProfile(userId: String) {
    var user by remember { mutableStateOf<User?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    // Runs when userId changes
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

// One-time effect (runs once on enter composition)
@Composable
fun AnalyticsScreen(screenName: String) {
    LaunchedEffect(Unit) {
        Analytics.logScreenView(screenName)
    }
    // Screen content...
}
```

### DisposableEffect

For effects that need cleanup when leaving composition:

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

Creates a coroutine scope bound to the composition point:

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
                            // Handle undo
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

Converts non-Compose state into Compose state:

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

Captures a value that can change, useful for callbacks in effects:

```kotlin
@Composable
fun SplashScreen(onTimeout: () -> Unit) {
    // Ensure we always call the latest onTimeout even if it changes
    val currentOnTimeout by rememberUpdatedState(onTimeout)

    LaunchedEffect(Unit) {
        delay(3000)
        currentOnTimeout()
    }

    // Splash screen UI...
}
```

## Animation

Compose provides a rich set of animation APIs for creating smooth, delightful user experiences.

### Simple Animations

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

### Transition Animations

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

### Infinite Animations

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

## Interoperability

Compose can work alongside traditional Android Views.

### Using Views in Compose

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
            // Update view when state changes
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

// WebView in Compose
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

### Using Compose in Views

```kotlin
// In an Activity or Fragment
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

// In XML layout
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

## Testing

Compose provides testing APIs for writing UI tests.

### Basic UI Tests

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

        // Initial state
        composeTestRule
            .onNodeWithText("Count: 0")
            .assertIsDisplayed()

        // Click increment button
        composeTestRule
            .onNodeWithText("+")
            .performClick()

        // Verify incremented
        composeTestRule
            .onNodeWithText("Count: 1")
            .assertIsDisplayed()
    }
}
```

### Testing with Semantics

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

    // Count nodes
    composeTestRule
        .onAllNodesWithTag("list_item")
        .assertCountEquals(3)
}
```

### Screenshot Testing

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

## Best Practices

### Keep Composables Small and Focused

```kotlin
// Bad: Large monolithic composable
@Composable
fun UserProfileScreenBad(user: User, posts: List<Post>) {
    Column {
        // 500 lines of UI code...
    }
}

// Good: Break into smaller composables
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

### Use Stable Types for Better Performance

```kotlin
// Mark classes as stable for recomposition optimization
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

// For lists, use ImmutableList from kotlinx.collections.immutable
@Composable
fun UserList(users: ImmutableList<UserData>) {
    LazyColumn {
        items(users, key = { it.id }) { user ->
            UserItem(user)
        }
    }
}
```

### Hoist State Appropriately

```kotlin
// Hoist state to the appropriate level
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

### Use Keys in Lists

```kotlin
@Composable
fun ItemList(items: List<Item>) {
    LazyColumn {
        // Always provide keys for list items
        items(
            items = items,
            key = { item -> item.id }
        ) { item ->
            ItemRow(item = item)
        }
    }
}
```

### Avoid Side Effects in Composables

```kotlin
// Bad: Side effect directly in composable
@Composable
fun BadExample(userId: String) {
    // This runs on every recomposition!
    analytics.logScreenView("profile_$userId")
}

// Good: Use LaunchedEffect
@Composable
fun GoodExample(userId: String) {
    LaunchedEffect(userId) {
        analytics.logScreenView("profile_$userId")
    }
}
```

### Use Appropriate Default Modifier

```kotlin
// Always accept a modifier parameter with a default
@Composable
fun CustomCard(
    title: String,
    modifier: Modifier = Modifier // Default modifier
) {
    Card(
        modifier = modifier // Apply at the root
            .fillMaxWidth()
    ) {
        Text(title)
    }
}
```

### Performance Optimization Tips

```kotlin
// Use derivedStateOf for computed values
@Composable
fun OptimizedSearch(items: List<Item>) {
    var query by remember { mutableStateOf("") }

    val filteredItems by remember(items) {
        derivedStateOf {
            items.filter { it.name.contains(query, ignoreCase = true) }
        }
    }
}

// Use remember with keys for expensive calculations
@Composable
fun ExpensiveComposable(data: ComplexData) {
    val processedData = remember(data.id) {
        expensiveProcessing(data)
    }
}

// Use LaunchedEffect for one-time operations
@Composable
fun DataLoader(id: String) {
    LaunchedEffect(id) {
        // Only runs when id changes
        loadData(id)
    }
}
```

## Conclusion

Jetpack Compose represents a paradigm shift in Android UI development, offering a more intuitive, powerful, and maintainable approach to building user interfaces. Key takeaways include:

- **Declarative UI**: Describe what the UI should look like based on state, not how to update it
- **Composable functions**: Build UIs from small, reusable functions
- **State management**: Use `remember`, `mutableStateOf`, and ViewModel for different state scopes
- **Layouts and modifiers**: Compose UI with flexible layouts and chainable modifiers
- **Theming**: Implement consistent Material Design 3 themes across your app
- **Navigation**: Use type-safe navigation with the Navigation Compose library
- **Performance**: Leverage lazy layouts, keys, and derived state for optimal performance
- **Side effects**: Handle side effects safely with LaunchedEffect, DisposableEffect, and other APIs
- **Interoperability**: Gradually migrate existing apps with Views and Compose working together

Jetpack Compose continues to evolve with new features and improvements. Stay updated with the official [Jetpack Compose documentation](https://developer.android.com/jetpack/compose) and explore the [Compose samples](https://github.com/android/compose-samples) for more advanced patterns and best practices.
