---
title: ViewModel Deep Dive
description: Complete guide to Android ViewModel architecture component, lifecycle awareness, state management, and best practices for robust Android apps
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
origin: old/src/content/docs/kotlin/viewmodel.en.md
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

ViewModel is one of the most important architecture components in Android development. It's designed to store and manage UI-related data in a lifecycle-conscious way, allowing data to survive configuration changes like screen rotations. This comprehensive guide covers everything from basic concepts to advanced patterns.

## Concept Explanation

ViewModel is a class designed to hold and manage UI-related data. The key insight behind ViewModel is that UI controllers like Activities and Fragments are responsible for drawing data to the screen and responding to user actions, while the logic of preparing data for the UI should live in a separate class.

### Why ViewModel?

Traditional Android development faced a significant challenge: Activities and Fragments are frequently destroyed and recreated during configuration changes. This leads to:

```kotlin
// Without ViewModel - Data lost on rotation
class OldActivity : AppCompatActivity() {
    private var userData: User? = null
    private var isLoading = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Every rotation triggers a new network call
        loadUser()
    }

    private fun loadUser() {
        isLoading = true
        api.fetchUser { user ->
            userData = user  // Lost on rotation!
            isLoading = false
            updateUI()
        }
    }
}
```

With ViewModel, data survives configuration changes:

```kotlin
// With ViewModel - Data survives rotation
class ModernActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Observes existing data, no redundant network calls
        viewModel.user.observe(this) { user ->
            updateUI(user)
        }
    }
}

class UserViewModel : ViewModel() {
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user

    init {
        loadUser()  // Only called once
    }

    private fun loadUser() {
        viewModelScope.launch {
            _user.value = repository.fetchUser()
        }
    }
}
```

### Setup and Dependencies

Add ViewModel to your project in `build.gradle.kts`:

```kotlin
dependencies {
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

    // ViewModel for Compose
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")

    // SavedStateHandle
    implementation("androidx.lifecycle:lifecycle-viewmodel-savedstate:2.7.0")

    // Activity KTX for by viewModels()
    implementation("androidx.activity:activity-ktx:1.8.2")

    // Fragment KTX for by viewModels() and by activityViewModels()
    implementation("androidx.fragment:fragment-ktx:1.6.2")
}
```

## Core Principles

### ViewModel Lifecycle

ViewModel has a longer lifespan than its associated UI controller:

```
Activity/Fragment lifecycle:
onCreate -> onStart -> onResume -> [Config Change] -> onDestroy
                                          |
                                          v
onCreate -> onStart -> onResume -> onDestroy

ViewModel lifecycle:
Created ---------------------------------> onCleared()
        (survives config changes)              |
                                          (Activity finished)
```

```kotlin
class MyViewModel : ViewModel() {

    init {
        Log.d("ViewModel", "ViewModel created")
    }

    override fun onCleared() {
        super.onCleared()
        // Clean up resources here
        Log.d("ViewModel", "ViewModel cleared")
    }
}
```

### ViewModel Scope

Each ViewModel is scoped to a `ViewModelStoreOwner`:

```kotlin
class MainActivity : AppCompatActivity() {
    // Scoped to this Activity
    private val activityViewModel: MainViewModel by viewModels()
}

class MyFragment : Fragment() {
    // Scoped to this Fragment
    private val fragmentViewModel: FragmentViewModel by viewModels()

    // Scoped to parent Activity - shared between fragments
    private val sharedViewModel: SharedViewModel by activityViewModels()
}
```

### ViewModel Factory

When ViewModel needs constructor parameters, use a factory:

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
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

// Usage
class UserActivity : AppCompatActivity() {
    private val viewModel: UserViewModel by viewModels {
        UserViewModelFactory(
            userId = intent.getStringExtra("USER_ID") ?: "",
            repository = UserRepository()
        )
    }
}
```

## Key Concepts

### ViewModelProvider

The standard way to obtain a ViewModel:

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Traditional way
        val viewModel = ViewModelProvider(this)[MainViewModel::class.java]

        // With factory
        val factory = MainViewModelFactory(repository)
        val viewModel2 = ViewModelProvider(this, factory)[MainViewModel::class.java]
    }
}
```

### Property Delegate

The Kotlin extension makes ViewModel creation cleaner:

```kotlin
// Activity
class MainActivity : AppCompatActivity() {
    private val viewModel: MainViewModel by viewModels()

    // With factory
    private val userViewModel: UserViewModel by viewModels {
        UserViewModelFactory(repository)
    }
}

// Fragment
class MyFragment : Fragment() {
    // Fragment-scoped
    private val viewModel: MyViewModel by viewModels()

    // Activity-scoped (shared)
    private val sharedViewModel: SharedViewModel by activityViewModels()

    // Parent Fragment-scoped
    private val parentViewModel: ParentViewModel by viewModels(
        ownerProducer = { requireParentFragment() }
    )
}
```

### SavedStateHandle

SavedStateHandle allows ViewModel to access and save state that survives process death:

```kotlin
class SearchViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    // Automatically saved and restored
    var searchQuery: String?
        get() = savedStateHandle["query"]
        set(value) { savedStateHandle["query"] = value }

    // LiveData backed by SavedStateHandle
    val searchQueryLiveData: MutableLiveData<String> =
        savedStateHandle.getLiveData("query", "")

    // StateFlow backed by SavedStateHandle
    val searchQueryFlow: StateFlow<String> =
        savedStateHandle.getStateFlow("query", "")
}

// Usage with default factory (no additional setup needed)
class SearchActivity : AppCompatActivity() {
    private val viewModel: SearchViewModel by viewModels()
}
```

### viewModelScope

Coroutine scope tied to ViewModel lifecycle:

```kotlin
class DataViewModel : ViewModel() {

    private val _data = MutableStateFlow<UiState>(UiState.Loading)
    val data: StateFlow<UiState> = _data.asStateFlow()

    fun loadData() {
        // Automatically cancelled when ViewModel is cleared
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
            // Parallel loading
            val users = async { repository.fetchUsers() }
            val posts = async { repository.fetchPosts() }

            _data.value = UiState.Success(
                CombinedData(users.await(), posts.await())
            )
        }
    }
}
```

## Code Examples

### Basic ViewModel

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

### ViewModel with Repository

```kotlin
class UserRepository(
    private val api: UserApi,
    private val database: UserDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    suspend fun getUser(id: String): User = withContext(dispatcher) {
        // Try cache first
        database.getUser(id)?.let { return@withContext it }

        // Fetch from network
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
                _uiState.value = UiState.Error(e.message ?: "Unknown error")
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

### Shared ViewModel Between Fragments

```kotlin
// Shared ViewModel for master-detail pattern
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

// List Fragment
class ProductListFragment : Fragment() {

    // Scoped to Activity - shared
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

// Detail Fragment
class ProductDetailFragment : Fragment() {

    // Same ViewModel instance
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

### ViewModel with Hilt Dependency Injection

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

// Usage in Activity/Fragment
@AndroidEntryPoint
class ArticleActivity : AppCompatActivity() {

    private val viewModel: ArticleViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // ViewModel is automatically injected with dependencies
    }
}
```

### ViewModel with Compose

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
                Text("Add")
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

## Best Practices

### 1. Keep ViewModel UI-Agnostic

```kotlin
// Bad: ViewModel knows about Android UI
class BadViewModel : ViewModel() {
    fun showToast(context: Context, message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
}

// Good: ViewModel exposes events, UI handles presentation
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

### 2. Use Immutable State

```kotlin
// Bad: Mutable state exposed
class BadViewModel : ViewModel() {
    val items = mutableListOf<Item>()

    fun addItem(item: Item) {
        items.add(item)  // UI won't be notified!
    }
}

// Good: Immutable state with StateFlow
class GoodViewModel : ViewModel() {
    private val _items = MutableStateFlow<List<Item>>(emptyList())
    val items: StateFlow<List<Item>> = _items.asStateFlow()

    fun addItem(item: Item) {
        _items.update { currentList -> currentList + item }
    }
}
```

### 3. Single Source of Truth

```kotlin
class FormViewModel : ViewModel() {

    // All form state in one place
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

### 4. Handle One-Time Events Properly

```kotlin
class NavigationViewModel : ViewModel() {

    // Bad: Using StateFlow for one-time events (event can be consumed multiple times)
    // private val _navigateToDetail = MutableStateFlow<String?>(null)

    // Good: Using SharedFlow for one-time events
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

// Alternative: Channel for guaranteed delivery
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

### 5. Inject Dispatchers for Testing

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

// Test
@Test
fun `loadData updates state with fetched data`() = runTest {
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

## Common Pitfalls

### 1. Leaking Activity/Fragment References

```kotlin
// Wrong: Passing Activity to ViewModel
class BadViewModel(private val activity: MainActivity) : ViewModel() {
    // Activity reference outlives Activity lifecycle = MEMORY LEAK!
}

// Wrong: Passing Context
class AlsoBadViewModel(private val context: Context) : ViewModel() {
    // If this is Activity context = MEMORY LEAK!
}

// Correct: Use Application context if needed
class GoodViewModel(application: Application) : AndroidViewModel(application) {
    private val appContext = application.applicationContext
    // Application context is safe
}

// Better: Avoid context entirely, use Repository
class BetterViewModel(private val repository: Repository) : ViewModel() {
    // Repository handles context internally
}
```

### 2. Collecting Flow Incorrectly

```kotlin
// Wrong: Collecting in ViewModel init without cancellation
class BadViewModel : ViewModel() {
    init {
        // This won't be cancelled when ViewModel is cleared!
        GlobalScope.launch {
            repository.dataFlow.collect { }
        }
    }
}

// Correct: Use viewModelScope
class GoodViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            repository.dataFlow.collect { }
        }
    }
}
```

### 3. Not Using viewLifecycleOwner in Fragments

```kotlin
// Wrong in Fragment
class BadFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // Uses Fragment lifecycle - can cause issues
        lifecycleScope.launch {
            viewModel.data.collect { updateUI(it) }
        }
    }
}

// Correct
class GoodFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        // Uses View lifecycle
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.data.collect { updateUI(it) }
            }
        }
    }
}
```

### 4. Putting View Logic in ViewModel

```kotlin
// Wrong: ViewModel handles View operations
class BadViewModel : ViewModel() {
    fun onButtonClick(button: Button) {
        button.isEnabled = false  // Don't reference Views!
        loadData()
    }
}

// Correct: ViewModel manages state, View observes
class GoodViewModel : ViewModel() {
    private val _isButtonEnabled = MutableStateFlow(true)
    val isButtonEnabled: StateFlow<Boolean> = _isButtonEnabled.asStateFlow()

    fun onButtonClick() {
        _isButtonEnabled.value = false
        loadData()
    }
}
```

### 5. Creating Multiple ViewModel Instances

```kotlin
// Wrong: Creating new instance each time
class BadActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // New instance on every configuration change!
        val viewModel = MyViewModel()
    }
}

// Correct: Use ViewModelProvider or delegate
class GoodActivity : AppCompatActivity() {
    // Same instance survives configuration changes
    private val viewModel: MyViewModel by viewModels()
}
```

## Performance Considerations

### 1. Avoid Heavy Initialization

```kotlin
// Bad: Heavy work in init
class SlowViewModel : ViewModel() {
    init {
        // Blocks main thread!
        val data = heavyComputation()
        processData(data)
    }
}

// Good: Defer to coroutine
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

### 2. Use StateFlow Wisely

```kotlin
class EfficientViewModel : ViewModel() {

    // Combine multiple states efficiently
    private val _searchQuery = MutableStateFlow("")
    private val _filterType = MutableStateFlow(FilterType.ALL)
    private val _items = MutableStateFlow<List<Item>>(emptyList())

    // Derived state - computed only when dependencies change
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

### 3. Cancel Unnecessary Work

```kotlin
class SearchViewModel : ViewModel() {

    private var searchJob: Job? = null

    fun search(query: String) {
        // Cancel previous search
        searchJob?.cancel()

        searchJob = viewModelScope.launch {
            delay(300) // Debounce
            val results = repository.search(query)
            _results.value = results
        }
    }
}
```

## Real-World Scenarios

### Scenario 1: Pagination

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
                // Handle error
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

### Scenario 2: Form Validation

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
                // Handle error
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

### Scenario 3: Multi-Step Wizard

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
                // Handle error
            } finally {
                _state.update { it.copy(isSubmitting = false) }
            }
        }
    }
}
```

## Interview Key Points

1. **What is ViewModel and why use it?**
   - Stores UI-related data that survives configuration changes
   - Separates UI logic from UI controllers
   - Provides lifecycle-aware data management
   - Prevents memory leaks by not holding View references

2. **How does ViewModel survive configuration changes?**
   - ViewModelStore is retained by the Activity/Fragment
   - ViewModelProvider retrieves existing ViewModel from store
   - ViewModel is only cleared when Activity finishes or Fragment is detached permanently

3. **What is the difference between ViewModel and AndroidViewModel?**
   - ViewModel has no dependencies
   - AndroidViewModel provides Application context
   - Prefer ViewModel with dependency injection over AndroidViewModel

4. **What is SavedStateHandle?**
   - Allows ViewModel to access saved state
   - Survives process death (unlike regular ViewModel state)
   - Integrates with Activity/Fragment saved state mechanism

5. **How to share ViewModel between Fragments?**
   - Use `activityViewModels()` to scope ViewModel to Activity
   - Both Fragments get same ViewModel instance
   - Useful for master-detail patterns

6. **What is viewModelScope?**
   - CoroutineScope tied to ViewModel lifecycle
   - Automatically cancelled when ViewModel is cleared
   - Runs on Main dispatcher by default

7. **How to test ViewModel?**
   - Inject dependencies including dispatchers
   - Use `StandardTestDispatcher` for coroutine testing
   - Mock repository layer
   - Test state changes and emissions

8. **What are common ViewModel anti-patterns?**
   - Holding View/Activity/Fragment references
   - Using GlobalScope instead of viewModelScope
   - Putting View logic in ViewModel
   - Not using immutable state

## Further Reading

- [ViewModel Overview](https://developer.android.com/topic/libraries/architecture/viewmodel)
- [ViewModel Saved State](https://developer.android.com/topic/libraries/architecture/viewmodel-savedstate)
- [Lifecycle-aware Components](https://developer.android.com/topic/libraries/architecture/lifecycle)
- [StateFlow and SharedFlow](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [Testing Coroutines on Android](https://developer.android.com/kotlin/coroutines/test)
- [Guide to App Architecture](https://developer.android.com/topic/architecture)
