---
title: ViewModel 详解
description: Android ViewModel 架构组件完全指南，涵盖生命周期感知、状态管理以及构建健壮 Android 应用的最佳实践
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - ViewModel
  - Architecture
  - Jetpack
  - MVVM
status: imported
origin: old/src/content/docs/kotlin/viewmodel.zh.md
divergence: 0.207
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 21
  lastUpdated: 2026-01-21
---

ViewModel 是 Android 开发中最重要的架构组件之一。它旨在以生命周期感知的方式存储和管理 UI 相关数据，使数据能够在配置更改（如屏幕旋转）时得以保留。本指南将全面介绍从基础概念到高级模式的所有内容。

## 概念解释

ViewModel 是一个用于保存和管理 UI 相关数据的类。ViewModel 背后的核心理念是：Activity 和 Fragment 等 UI 控制器负责将数据绘制到屏幕上并响应用户操作，而准备 UI 数据的逻辑应该放在单独的类中。

### 为什么需要 ViewModel？

传统 Android 开发面临一个重大挑战：Activity 和 Fragment 在配置更改期间会频繁被销毁和重建。这导致：

```kotlin
// 不使用 ViewModel - 数据在旋转时丢失
class OldActivity : AppCompatActivity() {
    private var userData: User? = null
    private var isLoading = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 每次旋转都会触发新的网络请求
        loadUser()
    }

    private fun loadUser() {
        isLoading = true
        api.fetchUser { user ->
            userData = user  // 旋转时丢失！
            isLoading = false
            updateUI()
        }
    }
}
```

使用 ViewModel 后，数据可以在配置更改时保留：

```kotlin
// 使用 ViewModel - 数据在旋转时保留
class ModernActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 观察现有数据，无需重复网络请求
        viewModel.user.observe(this) { user ->
            updateUI(user)
        }
    }
}

class UserViewModel : ViewModel() {
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user

    init {
        loadUser()  // 只调用一次
    }

    private fun loadUser() {
        viewModelScope.launch {
            _user.value = repository.fetchUser()
        }
    }
}
```

### 配置依赖

在 `build.gradle.kts` 中添加 ViewModel：

```kotlin
dependencies {
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // 用于 Compose 的 ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // SavedStateHandle
    implementation("androidx.lifecycle:lifecycle-viewmodel-savedstate:2.7.0")

    // Activity KTX 用于 by viewModels()
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Fragment KTX 用于 by viewModels() 和 by activityViewModels()
    implementation("androidx.fragment:fragment-ktx:1.6.2")
}
```

## 核心原理

### ViewModel 生命周期

ViewModel 的生命周期比其关联的 UI 控制器更长：

```
Activity/Fragment 生命周期:
onCreate -> onStart -> onResume -> [配置更改] -> onDestroy
                                          |
                                          v
onCreate -> onStart -> onResume -> onDestroy

ViewModel 生命周期:
Created ---------------------------------> onCleared()
        (配置更改时保留)                        |
                                          (Activity 结束)
```

```kotlin
class MyViewModel : ViewModel() {

    init {
        Log.d("ViewModel", "ViewModel 已创建")
    }

    override fun onCleared() {
        super.onCleared()
        // 在此清理资源
        Log.d("ViewModel", "ViewModel 已清除")
    }
}
```

### ViewModel 作用域

每个 ViewModel 都作用于一个 `ViewModelStoreOwner`：

```kotlin
class MainActivity : AppCompatActivity() {
    // 作用域为当前 Activity
    private val activityViewModel: MainViewModel by viewModels()
}

class MyFragment : Fragment() {
    // 作用域为当前 Fragment
    private val fragmentViewModel: FragmentViewModel by viewModels()

    // 作用域为父 Activity - 在 Fragment 之间共享
    private val sharedViewModel: SharedViewModel by activityViewModels()
}
```

### ViewModel Factory

当 ViewModel 需要构造函数参数时，使用工厂：

```kotlin
class UserViewModel(
    private val userId: String,
    private val repository: UserRepository
) : ViewModel() {
    // ...
}

class UserViewModelFactory(
    private val userId: String,
    private val repository: UserRepository
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(UserViewModel::class.java)) {
            return UserViewModel(userId, repository) as T
        }
        throw IllegalArgumentException("未知的 ViewModel 类")
    }
}

// 使用方式
class UserActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels {
        UserViewModelFactory(
            userId = intent.getStringExtra("USER_ID") ?: "",
            repository = UserRepository()
        )
    }
}
```

## 核心要点

### ViewModelProvider

获取 ViewModel 的标准方式：

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 传统方式
        val viewModel = ViewModelProvider(this)[MainViewModel::class.java]

        // 使用工厂
        val factory = MainViewModelFactory(repository)
        val viewModel2 = ViewModelProvider(this, factory)[MainViewModel::class.java]
    }
}
```

### 属性委托

Kotlin 扩展使 ViewModel 创建更简洁：

```kotlin
// Activity
class MainActivity : AppCompatActivity() {
    private val viewModel: MainViewModel by viewModels()

    // 使用工厂
    private val userViewModel: UserViewModel by viewModels {
        UserViewModelFactory(repository)
    }
}

// Fragment
class MyFragment : Fragment() {
    // Fragment 作用域
    private val viewModel: MyViewModel by viewModels()

    // Activity 作用域（共享）
    private val sharedViewModel: SharedViewModel by activityViewModels()

    // 父 Fragment 作用域
    private val parentViewModel: ParentViewModel by viewModels(
        ownerProducer = { requireParentFragment() }
    )
}
```

### SavedStateHandle

SavedStateHandle 允许 ViewModel 访问和保存能够在进程死亡后恢复的状态：

```kotlin
class SearchViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // 自动保存和恢复
    var searchQuery: String?
        get() = savedStateHandle["query"]
        set(value) { savedStateHandle["query"] = value }

    // 由 SavedStateHandle 支持的 LiveData
    val searchQueryLiveData: MutableLiveData<String> =
        savedStateHandle.getLiveData("query", "")

    // 由 SavedStateHandle 支持的 StateFlow
    val searchQueryFlow: StateFlow<String> =
        savedStateHandle.getStateFlow("query", "")
}

// 使用默认工厂（无需额外设置）
class SearchActivity : AppCompatActivity() {
    private val viewModel: SearchViewModel by viewModels()
}
```

### viewModelScope

与 ViewModel 生命周期绑定的协程作用域：

```kotlin
class DataViewModel : ViewModel() {

    private val _data = MutableStateFlow<UiState>(UiState.Loading)
    val data: StateFlow<UiState> = _data.asStateFlow()

    fun loadData() {
        // 当 ViewModel 被清除时自动取消
        viewModelScope.launch {
            _data.value = UiState.Loading
            try {
                val result = repository.fetchData()
                _data.value = UiState.Success(result)
            } catch (e: Exception) {
                _data.value = UiState.Error(e.message)
            }
        }
    }

    fun loadMultipleDataSources() {
        viewModelScope.launch {
            // 并行加载
            val users = async { repository.fetchUsers() }
            val posts = async { repository.fetchPosts() }

            _data.value = UiState.Success(
                CombinedData(users.await(), posts.await())
            )
        }
    }
}
```

## 代码示例

### 基础 ViewModel

```kotlin
class CounterViewModel : ViewModel() {

    private val _count = MutableStateFlow(0)
    val count: StateFlow<Int> = _count.asStateFlow()

    fun increment() {
        _count.update { it + 1 }
    }

    fun decrement() {
        _count.update { it - 1 }
    }

    fun reset() {
        _count.value = 0
    }
}

class CounterActivity : AppCompatActivity() {

    private val viewModel: CounterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_counter)

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.count.collect { count ->
                    counterTextView.text = count.toString()
                }
            }
        }

        incrementButton.setOnClickListener { viewModel.increment() }
        decrementButton.setOnClickListener { viewModel.decrement() }
        resetButton.setOnClickListener { viewModel.reset() }
    }
}
```

### 带 Repository 的 ViewModel

```kotlin
class UserRepository(
    private val api: UserApi,
    private val database: UserDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun getUser(id: String): User = withContext(dispatcher) {
        // 优先尝试缓存
        database.getUser(id)?.let { return@withContext it }

        // 从网络获取
        val user = api.fetchUser(id)
        database.insertUser(user)
        user
    }

    fun observeUser(id: String): Flow<User?> = database.observeUser(id)
}

class UserProfileViewModel(
    private val userId: String,
    private val repository: UserRepository
) : ViewModel() {

    sealed class UiState {
        object Loading : UiState()
        data class Success(val user: User) : UiState()
        data class Error(val message: String) : UiState()
    }

    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    init {
        loadUser()
        observeUserChanges()
    }

    private fun loadUser() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            try {
                val user = repository.getUser(userId)
                _uiState.value = UiState.Success(user)
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "未知错误")
            }
        }
    }

    private fun observeUserChanges() {
        viewModelScope.launch {
            repository.observeUser(userId).collect { user ->
                user?.let {
                    _uiState.value = UiState.Success(it)
                }
            }
        }
    }

    fun refresh() {
        loadUser()
    }
}
```

### Fragment 间共享 ViewModel

```kotlin
// 用于主从模式的共享 ViewModel
class ProductListViewModel : ViewModel() {

    private val _products = MutableStateFlow<List<Product>>(emptyList())
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _selectedProduct = MutableStateFlow<Product?>(null)
    val selectedProduct: StateFlow<Product?> = _selectedProduct.asStateFlow()

    init {
        loadProducts()
    }

    private fun loadProducts() {
        viewModelScope.launch {
            _products.value = repository.fetchProducts()
        }
    }

    fun selectProduct(product: Product) {
        _selectedProduct.value = product
    }

    fun clearSelection() {
        _selectedProduct.value = null
    }
}

// 列表 Fragment
class ProductListFragment : Fragment() {

    // 作用域为 Activity - 共享
    private val viewModel: ProductListViewModel by activityViewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.products.collect { products ->
                    adapter.submitList(products)
                }
            }
        }

        adapter.onItemClick = { product ->
            viewModel.selectProduct(product)
        }
    }
}

// 详情 Fragment
class ProductDetailFragment : Fragment() {

    // 同一个 ViewModel 实例
    private val viewModel: ProductListViewModel by activityViewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.selectedProduct.collect { product ->
                    product?.let { displayProduct(it) }
                }
            }
        }
    }
}
```

### 使用 Hilt 依赖注入的 ViewModel

```kotlin
@HiltViewModel
class ArticleViewModel @Inject constructor(
    private val repository: ArticleRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val articleId: String = savedStateHandle["articleId"] ?: ""

    private val _article = MutableStateFlow<Article?>(null)
    val article: StateFlow<Article?> = _article.asStateFlow()

    init {
        loadArticle()
    }

    private fun loadArticle() {
        viewModelScope.launch {
            _article.value = repository.getArticle(articleId)
        }
    }
}

// 在 Activity/Fragment 中使用
@AndroidEntryPoint
class ArticleActivity : AppCompatActivity() {

    private val viewModel: ArticleViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ViewModel 自动注入依赖
    }
}
```

### 与 Compose 配合使用的 ViewModel

```kotlin
@HiltViewModel
class TodoViewModel @Inject constructor(
    private val repository: TodoRepository
) : ViewModel() {

    private val _todos = MutableStateFlow<List<Todo>>(emptyList())
    val todos: StateFlow<List<Todo>> = _todos.asStateFlow()

    private val _newTodoText = MutableStateFlow("")
    val newTodoText: StateFlow<String> = _newTodoText.asStateFlow()

    init {
        loadTodos()
    }

    private fun loadTodos() {
        viewModelScope.launch {
            repository.observeTodos().collect {
                _todos.value = it
            }
        }
    }

    fun onNewTodoTextChanged(text: String) {
        _newTodoText.value = text
    }

    fun addTodo() {
        val text = _newTodoText.value.trim()
        if (text.isNotEmpty()) {
            viewModelScope.launch {
                repository.addTodo(Todo(text = text))
                _newTodoText.value = ""
            }
        }
    }

    fun toggleTodo(todo: Todo) {
        viewModelScope.launch {
            repository.updateTodo(todo.copy(completed = !todo.completed))
        }
    }

    fun deleteTodo(todo: Todo) {
        viewModelScope.launch {
            repository.deleteTodo(todo)
        }
    }
}

@Composable
fun TodoScreen(
    viewModel: TodoViewModel = hiltViewModel()
) {
    val todos by viewModel.todos.collectAsStateWithLifecycle()
    val newTodoText by viewModel.newTodoText.collectAsStateWithLifecycle()

    Column(modifier = Modifier.padding(16.dp)) {
        Row {
            TextField(
                value = newTodoText,
                onValueChange = viewModel::onNewTodoTextChanged,
                modifier = Modifier.weight(1f)
            )
            Button(onClick = viewModel::addTodo) {
                Text("添加")
            }
        }

        LazyColumn {
            items(todos, key = { it.id }) { todo ->
                TodoItem(
                    todo = todo,
                    onToggle = { viewModel.toggleTodo(todo) },
                    onDelete = { viewModel.deleteTodo(todo) }
                )
            }
        }
    }
}
```

## 最佳实践

### 1. 保持 ViewModel 与 UI 无关

```kotlin
// 错误：ViewModel 知道 Android UI
class BadViewModel : ViewModel() {
    fun showToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
}

// 正确：ViewModel 暴露事件，UI 处理展示
class GoodViewModel : ViewModel() {
    private val _events = MutableSharedFlow<UiEvent>()
    val events: SharedFlow<UiEvent> = _events.asSharedFlow()

    sealed class UiEvent {
        data class ShowMessage(val message: String) : UiEvent()
        object NavigateBack : UiEvent()
    }

    fun onError(message: String) {
        viewModelScope.launch {
            _events.emit(UiEvent.ShowMessage(message))
        }
    }
}
```

### 2. 使用不可变状态

```kotlin
// 错误：暴露可变状态
class BadViewModel : ViewModel() {
    val items = mutableListOf<Item>()

    fun addItem(item: Item) {
        items.add(item)  // UI 不会收到通知！
    }
}

// 正确：使用 StateFlow 的不可变状态
class GoodViewModel : ViewModel() {
    private val _items = MutableStateFlow<List<Item>>(emptyList())
    val items: StateFlow<List<Item>> = _items.asStateFlow()

    fun addItem(item: Item) {
        _items.update { currentList -> currentList + item }
    }
}
```

### 3. 单一数据源

```kotlin
class FormViewModel : ViewModel() {

    // 所有表单状态集中在一处
    data class FormState(
        val email: String = "",
        val password: String = "",
        val emailError: String? = null,
        val passwordError: String? = null,
        val isLoading: Boolean = false,
        val isSubmitEnabled: Boolean = false
    )

    private val _formState = MutableStateFlow(FormState())
    val formState: StateFlow<FormState> = _formState.asStateFlow()

    fun onEmailChanged(email: String) {
        _formState.update { state ->
            state.copy(
                email = email,
                emailError = validateEmail(email),
                isSubmitEnabled = isFormValid(email, state.password)
            )
        }
    }

    fun onPasswordChanged(password: String) {
        _formState.update { state ->
            state.copy(
                password = password,
                passwordError = validatePassword(password),
                isSubmitEnabled = isFormValid(state.email, password)
            )
        }
    }
}
```

### 4. 正确处理一次性事件

```kotlin
class NavigationViewModel : ViewModel() {

    // 错误：使用 StateFlow 处理一次性事件（事件可能被多次消费）
    // private val _navigateToDetail = MutableStateFlow<String?>(null)

    // 正确：使用 SharedFlow 处理一次性事件
    private val _navigationEvents = MutableSharedFlow<NavigationEvent>()
    val navigationEvents: SharedFlow<NavigationEvent> = _navigationEvents.asSharedFlow()

    sealed class NavigationEvent {
        data class ToDetail(val id: String) : NavigationEvent()
        object Back : NavigationEvent()
    }

    fun navigateToDetail(id: String) {
        viewModelScope.launch {
            _navigationEvents.emit(NavigationEvent.ToDetail(id))
        }
    }
}

// 替代方案：使用 Channel 保证事件传递
class EventViewModel : ViewModel() {

    private val _events = Channel<Event>(Channel.BUFFERED)
    val events: Flow<Event> = _events.receiveAsFlow()

    fun sendEvent(event: Event) {
        viewModelScope.launch {
            _events.send(event)
        }
    }
}
```

### 5. 注入 Dispatcher 以便测试

```kotlin
class TestableViewModel(
    private val repository: Repository,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : ViewModel() {

    private val _data = MutableStateFlow<Data?>(null)
    val data: StateFlow<Data?> = _data.asStateFlow()

    fun loadData() {
        viewModelScope.launch {
            val result = withContext(dispatcher) {
                repository.fetchData()
            }
            _data.value = result
        }
    }
}

// 测试
@Test
fun `loadData 使用获取的数据更新状态`() = runTest {
    val testDispatcher = StandardTestDispatcher(testScheduler)
    val mockRepository = mockk<Repository> {
        coEvery { fetchData() } returns testData
    }

    val viewModel = TestableViewModel(mockRepository, testDispatcher)
    viewModel.loadData()

    advanceUntilIdle()

    assertEquals(testData, viewModel.data.value)
}
```

## 常见陷阱

### 1. 泄漏 Activity/Fragment 引用

```kotlin
// 错误：将 Activity 传递给 ViewModel
class BadViewModel(private val activity: MainActivity) : ViewModel() {
    // Activity 引用比 Activity 生命周期更长 = 内存泄漏！
}

// 错误：传递 Context
class AlsoBadViewModel(private val context: Context) : ViewModel() {
    // 如果是 Activity context = 内存泄漏！
}

// 正确：如果需要，使用 Application context
class GoodViewModel(application: Application) : AndroidViewModel(application) {
    private val appContext = application.applicationContext
    // Application context 是安全的
}

// 更好：完全避免 context，使用 Repository
class BetterViewModel(private val repository: Repository) : ViewModel() {
    // Repository 内部处理 context
}
```

### 2. 错误地收集 Flow

```kotlin
// 错误：在 ViewModel init 中收集而没有取消机制
class BadViewModel : ViewModel() {
    init {
        // 当 ViewModel 被清除时不会取消！
        GlobalScope.launch {
            repository.dataFlow.collect { }
        }
    }
}

// 正确：使用 viewModelScope
class GoodViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            repository.dataFlow.collect { }
        }
    }
}
```

### 3. 在 Fragment 中不使用 viewLifecycleOwner

```kotlin
// 在 Fragment 中错误的做法
class BadFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // 使用 Fragment 生命周期 - 可能导致问题
        lifecycleScope.launch {
            viewModel.data.collect { updateUI(it) }
        }
    }
}

// 正确做法
class GoodFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // 使用 View 生命周期
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { updateUI(it) }
            }
        }
    }
}
```

### 4. 在 ViewModel 中放置 View 逻辑

```kotlin
// 错误：ViewModel 处理 View 操作
class BadViewModel : ViewModel() {
    fun onButtonClick(button: Button) {
        button.isEnabled = false  // 不要引用 View！
        loadData()
    }
}

// 正确：ViewModel 管理状态，View 观察
class GoodViewModel : ViewModel() {
    private val _isButtonEnabled = MutableStateFlow(true)
    val isButtonEnabled: StateFlow<Boolean> = _isButtonEnabled.asStateFlow()

    fun onButtonClick() {
        _isButtonEnabled.value = false
        loadData()
    }
}
```

### 5. 创建多个 ViewModel 实例

```kotlin
// 错误：每次都创建新实例
class BadActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 每次配置更改都会创建新实例！
        val viewModel = MyViewModel()
    }
}

// 正确：使用 ViewModelProvider 或委托
class GoodActivity : AppCompatActivity() {
    // 同一实例在配置更改时保留
    private val viewModel: MyViewModel by viewModels()
}
```

## 性能考量

### 1. 避免在初始化时执行繁重操作

```kotlin
// 错误：在 init 中执行繁重工作
class SlowViewModel : ViewModel() {
    init {
        // 阻塞主线程！
        val data = heavyComputation()
        processData(data)
    }
}

// 正确：延迟到协程中执行
class FastViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            val data = withContext(Dispatchers.Default) {
                heavyComputation()
            }
            processData(data)
        }
    }
}
```

### 2. 合理使用 StateFlow

```kotlin
class EfficientViewModel : ViewModel() {

    // 高效地组合多个状态
    private val _searchQuery = MutableStateFlow("")
    private val _filterType = MutableStateFlow(FilterType.ALL)
    private val _items = MutableStateFlow<List<Item>>(emptyList())

    // 派生状态 - 仅当依赖项更改时才计算
    val filteredItems: StateFlow<List<Item>> = combine(
        _items,
        _searchQuery,
        _filterType
    ) { items, query, filter ->
        items.filter { item ->
            item.matchesQuery(query) && item.matchesFilter(filter)
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )
}
```

### 3. 取消不必要的工作

```kotlin
class SearchViewModel : ViewModel() {

    private var searchJob: Job? = null

    fun search(query: String) {
        // 取消之前的搜索
        searchJob?.cancel()

        searchJob = viewModelScope.launch {
            delay(300) // 防抖
            val results = repository.search(query)
            _results.value = results
        }
    }
}
```

## 实战场景

### 场景 1：分页加载

```kotlin
class PaginatedListViewModel(
    private val repository: ItemRepository
) : ViewModel() {

    private val _items = MutableStateFlow<List<Item>>(emptyList())
    val items: StateFlow<List<Item>> = _items.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _hasMore = MutableStateFlow(true)
    val hasMore: StateFlow<Boolean> = _hasMore.asStateFlow()

    private var currentPage = 0
    private val pageSize = 20

    init {
        loadNextPage()
    }

    fun loadNextPage() {
        if (_isLoading.value || !_hasMore.value) return

        viewModelScope.launch {
            _isLoading.value = true
            try {
                val newItems = repository.getItems(currentPage, pageSize)
                _items.update { it + newItems }
                _hasMore.value = newItems.size == pageSize
                currentPage++
            } catch (e: Exception) {
                // 处理错误
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun refresh() {
        currentPage = 0
        _hasMore.value = true
        _items.value = emptyList()
        loadNextPage()
    }
}
```

### 场景 2：表单验证

```kotlin
class RegistrationViewModel : ViewModel() {

    data class RegistrationState(
        val email: String = "",
        val password: String = "",
        val confirmPassword: String = "",
        val emailError: Int? = null,
        val passwordError: Int? = null,
        val confirmPasswordError: Int? = null,
        val isLoading: Boolean = false,
        val registrationComplete: Boolean = false
    ) {
        val isValid: Boolean
            get() = email.isNotBlank() &&
                    password.isNotBlank() &&
                    confirmPassword.isNotBlank() &&
                    emailError == null &&
                    passwordError == null &&
                    confirmPasswordError == null
    }

    private val _state = MutableStateFlow(RegistrationState())
    val state: StateFlow<RegistrationState> = _state.asStateFlow()

    fun onEmailChanged(email: String) {
        _state.update { it.copy(
            email = email,
            emailError = validateEmail(email)
        )}
    }

    fun onPasswordChanged(password: String) {
        _state.update {
            it.copy(
                password = password,
                passwordError = validatePassword(password),
                confirmPasswordError = if (it.confirmPassword.isNotEmpty())
                    validateConfirmPassword(password, it.confirmPassword) else null
            )
        }
    }

    fun onConfirmPasswordChanged(confirmPassword: String) {
        _state.update { it.copy(
            confirmPassword = confirmPassword,
            confirmPasswordError = validateConfirmPassword(it.password, confirmPassword)
        )}
    }

    fun register() {
        if (!_state.value.isValid) return

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            try {
                repository.register(_state.value.email, _state.value.password)
                _state.update { it.copy(registrationComplete = true) }
            } catch (e: Exception) {
                // 处理错误
            } finally {
                _state.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun validateEmail(email: String): Int? = when {
        email.isBlank() -> R.string.error_email_required
        !email.isValidEmail() -> R.string.error_email_invalid
        else -> null
    }

    private fun validatePassword(password: String): Int? = when {
        password.isBlank() -> R.string.error_password_required
        password.length < 8 -> R.string.error_password_too_short
        else -> null
    }

    private fun validateConfirmPassword(password: String, confirm: String): Int? = when {
        confirm != password -> R.string.error_passwords_dont_match
        else -> null
    }
}
```

### 场景 3：多步骤向导

```kotlin
class WizardViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    enum class Step { PERSONAL_INFO, ADDRESS, PAYMENT, CONFIRMATION }

    data class WizardState(
        val currentStep: Step = Step.PERSONAL_INFO,
        val personalInfo: PersonalInfo? = null,
        val address: Address? = null,
        val paymentInfo: PaymentInfo? = null,
        val isSubmitting: Boolean = false,
        val isComplete: Boolean = false
    )

    private val _state = MutableStateFlow(
        savedStateHandle.get<WizardState>("state") ?: WizardState()
    )
    val state: StateFlow<WizardState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            _state.collect { state ->
                savedStateHandle["state"] = state
            }
        }
    }

    fun submitPersonalInfo(info: PersonalInfo) {
        _state.update { it.copy(
            personalInfo = info,
            currentStep = Step.ADDRESS
        )}
    }

    fun submitAddress(address: Address) {
        _state.update { it.copy(
            address = address,
            currentStep = Step.PAYMENT
        )}
    }

    fun submitPayment(payment: PaymentInfo) {
        _state.update { it.copy(
            paymentInfo = payment,
            currentStep = Step.CONFIRMATION
        )}
    }

    fun goBack() {
        _state.update { state ->
            val previousStep = when (state.currentStep) {
                Step.PERSONAL_INFO -> Step.PERSONAL_INFO
                Step.ADDRESS -> Step.PERSONAL_INFO
                Step.PAYMENT -> Step.ADDRESS
                Step.CONFIRMATION -> Step.PAYMENT
            }
            state.copy(currentStep = previousStep)
        }
    }

    fun submit() {
        val currentState = _state.value
        if (currentState.personalInfo == null ||
            currentState.address == null ||
            currentState.paymentInfo == null) return

        viewModelScope.launch {
            _state.update { it.copy(isSubmitting = true) }
            try {
                repository.submitOrder(
                    currentState.personalInfo,
                    currentState.address,
                    currentState.paymentInfo
                )
                _state.update { it.copy(isComplete = true) }
            } catch (e: Exception) {
                // 处理错误
            } finally {
                _state.update { it.copy(isSubmitting = false) }
            }
        }
    }
}
```

## 面试要点

1. **什么是 ViewModel，为什么要使用它？**
   - 存储 UI 相关数据，在配置更改时保留
   - 将 UI 逻辑与 UI 控制器分离
   - 提供生命周期感知的数据管理
   - 通过不持有 View 引用来防止内存泄漏

2. **ViewModel 如何在配置更改时保留？**
   - ViewModelStore 由 Activity/Fragment 保留
   - ViewModelProvider 从存储中检索现有 ViewModel
   - 仅当 Activity 结束或 Fragment 永久分离时，ViewModel 才会被清除

3. **ViewModel 和 AndroidViewModel 有什么区别？**
   - ViewModel 没有依赖
   - AndroidViewModel 提供 Application context
   - 优先使用带依赖注入的 ViewModel 而不是 AndroidViewModel

4. **什么是 SavedStateHandle？**
   - 允许 ViewModel 访问保存的状态
   - 在进程死亡后恢复（与普通 ViewModel 状态不同）
   - 与 Activity/Fragment 保存状态机制集成

5. **如何在 Fragment 之间共享 ViewModel？**
   - 使用 `activityViewModels()` 将 ViewModel 作用域设为 Activity
   - 两个 Fragment 获得同一个 ViewModel 实例
   - 适用于主从模式

6. **什么是 viewModelScope？**
   - 与 ViewModel 生命周期绑定的协程作用域
   - 当 ViewModel 被清除时自动取消
   - 默认运行在 Main 调度器上

7. **如何测试 ViewModel？**
   - 注入依赖项包括调度器
   - 使用 `StandardTestDispatcher` 进行协程测试
   - Mock Repository 层
   - 测试状态变化和数据发射

8. **常见的 ViewModel 反模式有哪些？**
   - 持有 View/Activity/Fragment 引用
   - 使用 GlobalScope 而不是 viewModelScope
   - 在 ViewModel 中放置 View 逻辑
   - 不使用不可变状态

## 延伸阅读

- [ViewModel 概述](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [ViewModel 保存状态](https://developer.android.com/topic/libraries/architecture/viewmodel-savedstate)
- [生命周期感知组件](https://developer.android.com/topic/libraries/architecture/lifecycle)
- [StateFlow 和 SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [Android 上的协程测试](https://developer.android.com/kotlin/coroutines/test)
- [应用架构指南](https://developer.android.com/topic/architecture)
