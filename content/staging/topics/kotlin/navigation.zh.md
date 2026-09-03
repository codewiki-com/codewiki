---
title: Navigation 组件指南
description: Android Navigation 组件完全指南，涵盖 Fragment 导航、深度链接、Safe Args 以及构建现代导航模式
track: kotlin
section: android-multiplatform
difficulty: intermediate
tags:
  - Kotlin
  - Android
  - Navigation
  - Jetpack
  - Fragment
  - Deep Links
status: imported
origin: old/src/content/docs/kotlin/navigation.zh.md
divergence: 0.198
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Kotlin
  subcategory: ""
  order: 23
  lastUpdated: 2026-01-21
---

Navigation 组件是一个 Jetpack 库，简化了 Android 应用中导航的实现。它处理 Fragment 事务、向上和返回操作、深度链接，并提供导航流程的可视化编辑器。本指南将全面介绍从基础设置到高级导航模式的所有内容。

## 概念解释

Navigation 组件由三个关键部分协同工作组成：

1. **导航图（Navigation Graph）**：一个 XML 资源，在一个集中位置包含所有与导航相关的信息
2. **NavHost**：显示导航图中目的地的容器
3. **NavController**：在 NavHost 中管理应用导航的对象

### 为什么需要 Navigation 组件？

传统的 Fragment 导航存在几个问题：

```kotlin
// 传统 Fragment 导航 - 容易出错且冗长
class OldActivity : AppCompatActivity() {

    fun navigateToDetail(itemId: String) {
        val fragment = DetailFragment().apply {
            arguments = Bundle().apply {
                putString("ITEM_ID", itemId)
            }
        }

        supportFragmentManager.beginTransaction()
            .replace(R.id.fragment_container, fragment)
            .addToBackStack(null)
            .setTransition(FragmentTransaction.TRANSIT_FRAGMENT_FADE)
            .commit()
    }

    // 必须手动处理返回栈
    override fun onBackPressed() {
        if (supportFragmentManager.backStackEntryCount > 0) {
            supportFragmentManager.popBackStack()
        } else {
            super.onBackPressed()
        }
    }
}
```

使用 Navigation 组件：

```kotlin
// 现代导航 - 简洁且类型安全
class ModernActivity : AppCompatActivity() {

    private val navController by lazy {
        findNavController(R.id.nav_host_fragment)
    }

    fun navigateToDetail(itemId: String) {
        // 使用 Safe Args 进行类型安全导航
        val action = ListFragmentDirections.actionListToDetail(itemId)
        navController.navigate(action)
    }

    // 返回导航自动处理
}
```

### 配置依赖

在 `build.gradle.kts` 中添加 Navigation：

```kotlin
// 项目级 build.gradle.kts
plugins {
    id("androidx.navigation.safeargs.kotlin") version "2.7.6" apply false
}

// 应用级 build.gradle.kts
plugins {
    id("androidx.navigation.safeargs.kotlin")
}

dependencies {
    val navVersion = "2.7.6"

    // Navigation
    implementation("androidx.navigation:navigation-fragment-ktx:$navVersion")
    implementation("androidx.navigation:navigation-ui-ktx:$navVersion")

    // 功能模块支持
    implementation("androidx.navigation:navigation-dynamic-features-fragment:$navVersion")

    // 测试
    androidTestImplementation("androidx.navigation:navigation-testing:$navVersion")

    // Compose Navigation（如果使用 Compose）
    implementation("androidx.navigation:navigation-compose:$navVersion")
}
```

## 核心原理

### 导航图

导航图定义了应用中所有可能的路径：

```xml
<!-- res/navigation/nav_graph.xml -->
<?xml version="1.0" encoding="utf-8"?>
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/nav_graph"
    app:startDestination="@id/homeFragment">

    <fragment
        android:id="@+id/homeFragment"
        android:name="com.example.app.HomeFragment"
        android:label="首页"
        tools:layout="@layout/fragment_home">

        <action
            android:id="@+id/action_home_to_detail"
            app:destination="@id/detailFragment"
            app:enterAnim="@anim/slide_in_right"
            app:exitAnim="@anim/slide_out_left"
            app:popEnterAnim="@anim/slide_in_left"
            app:popExitAnim="@anim/slide_out_right" />

        <action
            android:id="@+id/action_home_to_settings"
            app:destination="@id/settingsFragment" />
    </fragment>

    <fragment
        android:id="@+id/detailFragment"
        android:name="com.example.app.DetailFragment"
        android:label="详情"
        tools:layout="@layout/fragment_detail">

        <argument
            android:name="itemId"
            app:argType="string" />

        <argument
            android:name="showExtra"
            app:argType="boolean"
            android:defaultValue="false" />
    </fragment>

    <fragment
        android:id="@+id/settingsFragment"
        android:name="com.example.app.SettingsFragment"
        android:label="设置"
        tools:layout="@layout/fragment_settings" />

</navigation>
```

### NavHost 设置

在 Activity 布局中添加 NavHost：

```xml
<!-- activity_main.xml -->
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <androidx.fragment.app.FragmentContainerView
        android:id="@+id/nav_host_fragment"
        android:name="androidx.navigation.fragment.NavHostFragment"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:defaultNavHost="true"
        app:navGraph="@navigation/nav_graph" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### NavController

获取和使用 NavController：

```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 获取 NavController
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        // 设置 ActionBar 与 NavController
        setupActionBarWithNavController(navController)

        // 监听导航变化
        navController.addOnDestinationChangedListener { _, destination, _ ->
            Log.d("Navigation", "导航到 ${destination.label}")
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp() || super.onSupportNavigateUp()
    }
}

// 在 Fragment 中
class HomeFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 从 Fragment 获取 NavController
        val navController = findNavController()

        button.setOnClickListener {
            navController.navigate(R.id.action_home_to_detail)
        }
    }
}
```

## 核心要点

### Safe Args

Safe Args 为导航参数生成类型安全的代码：

```xml
<!-- 在 nav_graph.xml 中 -->
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.app.DetailFragment">

    <argument
        android:name="itemId"
        app:argType="string" />

    <argument
        android:name="item"
        app:argType="com.example.app.Item"
        app:nullable="true" />

    <argument
        android:name="count"
        app:argType="integer"
        android:defaultValue="0" />
</fragment>
```

```kotlin
// 生成的 Directions 类用于导航
class HomeFragment : Fragment() {

    fun navigateToDetail(itemId: String, count: Int) {
        // 类型安全导航
        val action = HomeFragmentDirections.actionHomeToDetail(
            itemId = itemId,
            count = count
        )
        findNavController().navigate(action)
    }
}

// 生成的 Args 类用于接收参数
class DetailFragment : Fragment() {

    // 使用属性委托
    private val args: DetailFragmentArgs by navArgs()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val itemId = args.itemId
        val count = args.count

        // 使用参数
        textView.text = "项目: $itemId, 数量: $count"
    }
}
```

### 支持的参数类型

```xml
<!-- 基本类型 -->
<argument android:name="intArg" app:argType="integer" />
<argument android:name="floatArg" app:argType="float" />
<argument android:name="longArg" app:argType="long" />
<argument android:name="boolArg" app:argType="boolean" />
<argument android:name="stringArg" app:argType="string" />

<!-- 引用类型 -->
<argument android:name="resourceArg" app:argType="reference" />

<!-- 数组 -->
<argument android:name="intArrayArg" app:argType="integer[]" />
<argument android:name="stringArrayArg" app:argType="string[]" />

<!-- Parcelable -->
<argument
    android:name="parcelableArg"
    app:argType="com.example.app.MyParcelable" />

<!-- Serializable -->
<argument
    android:name="serializableArg"
    app:argType="com.example.app.MySerializable" />

<!-- 枚举 -->
<argument
    android:name="enumArg"
    app:argType="com.example.app.MyEnum" />
```

### 深度链接

启用到特定目的地的深度链接：

```xml
<!-- 在 nav_graph.xml 中 -->
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.app.DetailFragment">

    <!-- 显式深度链接 -->
    <deepLink
        android:id="@+id/deepLink"
        app:uri="https://www.example.com/item/{itemId}"
        app:action="android.intent.action.VIEW"
        app:mimeType="*/*" />

    <!-- 隐式深度链接 -->
    <deepLink app:uri="app://example.com/item/{itemId}" />

    <argument
        android:name="itemId"
        app:argType="string" />
</fragment>
```

```xml
<!-- AndroidManifest.xml -->
<activity android:name=".MainActivity">
    <nav-graph android:value="@navigation/nav_graph" />
</activity>
```

```kotlin
// 编程式深度链接导航
class MainActivity : AppCompatActivity() {

    fun handleDeepLink(itemId: String) {
        val deepLink = navController.createDeepLink()
            .setDestination(R.id.detailFragment)
            .setArguments(bundleOf("itemId" to itemId))
            .createPendingIntent()

        // 在通知中使用
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentIntent(deepLink)
            .build()
    }
}
```

### Navigation UI

与常见 UI 组件集成：

```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var navController: NavController
    private lateinit var appBarConfiguration: AppBarConfiguration

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        // 定义顶级目的地
        appBarConfiguration = AppBarConfiguration(
            topLevelDestinationIds = setOf(
                R.id.homeFragment,
                R.id.searchFragment,
                R.id.profileFragment
            ),
            drawerLayout = drawerLayout  // 可选抽屉
        )

        // 设置工具栏
        setSupportActionBar(toolbar)
        setupActionBarWithNavController(navController, appBarConfiguration)

        // 设置底部导航
        bottomNavView.setupWithNavController(navController)

        // 设置导航抽屉
        navView.setupWithNavController(navController)
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(appBarConfiguration) ||
            super.onSupportNavigateUp()
    }
}
```

## 代码示例

### 基础导航

```kotlin
class HomeFragment : Fragment(R.layout.fragment_home) {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val navController = findNavController()

        // 使用 action ID 导航
        buttonDetail.setOnClickListener {
            navController.navigate(R.id.action_home_to_detail)
        }

        // 使用 Safe Args 导航
        buttonDetailWithArgs.setOnClickListener {
            val action = HomeFragmentDirections.actionHomeToDetail(
                itemId = "item123",
                showExtra = true
            )
            navController.navigate(action)
        }

        // 使用目的地 ID 导航
        buttonSettings.setOnClickListener {
            navController.navigate(R.id.settingsFragment)
        }

        // 使用 NavOptions 导航
        buttonAnimated.setOnClickListener {
            val navOptions = NavOptions.Builder()
                .setEnterAnim(R.anim.slide_in_right)
                .setExitAnim(R.anim.slide_out_left)
                .setPopEnterAnim(R.anim.slide_in_left)
                .setPopExitAnim(R.anim.slide_out_right)
                .build()
            navController.navigate(R.id.detailFragment, null, navOptions)
        }
    }
}
```

### 嵌套导航图

```xml
<!-- res/navigation/nav_graph.xml -->
<navigation
    android:id="@+id/nav_graph"
    app:startDestination="@id/homeFragment">

    <fragment
        android:id="@+id/homeFragment"
        android:name="com.example.HomeFragment">

        <action
            android:id="@+id/action_home_to_auth"
            app:destination="@id/auth_graph" />
    </fragment>

    <!-- 认证流程的嵌套图 -->
    <navigation
        android:id="@+id/auth_graph"
        app:startDestination="@id/loginFragment">

        <fragment
            android:id="@+id/loginFragment"
            android:name="com.example.LoginFragment">

            <action
                android:id="@+id/action_login_to_register"
                app:destination="@id/registerFragment" />

            <action
                android:id="@+id/action_login_to_forgot"
                app:destination="@id/forgotPasswordFragment" />
        </fragment>

        <fragment
            android:id="@+id/registerFragment"
            android:name="com.example.RegisterFragment" />

        <fragment
            android:id="@+id/forgotPasswordFragment"
            android:name="com.example.ForgotPasswordFragment" />
    </navigation>

</navigation>
```

### 条件导航

```kotlin
class SplashFragment : Fragment() {

    private val viewModel: SplashViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.navigationEvent.collect { event ->
                when (event) {
                    NavigationEvent.ToHome -> {
                        findNavController().navigate(
                            R.id.action_splash_to_home,
                            null,
                            NavOptions.Builder()
                                .setPopUpTo(R.id.splashFragment, true)
                                .build()
                        )
                    }
                    NavigationEvent.ToLogin -> {
                        findNavController().navigate(
                            R.id.action_splash_to_login,
                            null,
                            NavOptions.Builder()
                                .setPopUpTo(R.id.splashFragment, true)
                                .build()
                        )
                    }
                    NavigationEvent.ToOnboarding -> {
                        findNavController().navigate(
                            R.id.action_splash_to_onboarding,
                            null,
                            NavOptions.Builder()
                                .setPopUpTo(R.id.splashFragment, true)
                                .build()
                        )
                    }
                }
            }
        }
    }
}

class SplashViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val preferencesRepository: PreferencesRepository
) : ViewModel() {

    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent: SharedFlow<NavigationEvent> = _navigationEvent.asSharedFlow()

    init {
        checkUserStatus()
    }

    private fun checkUserStatus() {
        viewModelScope.launch {
            val event = when {
                !preferencesRepository.hasSeenOnboarding() -> NavigationEvent.ToOnboarding
                !userRepository.isLoggedIn() -> NavigationEvent.ToLogin
                else -> NavigationEvent.ToHome
            }
            _navigationEvent.emit(event)
        }
    }

    sealed class NavigationEvent {
        object ToHome : NavigationEvent()
        object ToLogin : NavigationEvent()
        object ToOnboarding : NavigationEvent()
    }
}
```

### 共享 ViewModel 导航

```kotlin
// 用于多步骤流程的共享 ViewModel
class CheckoutViewModel : ViewModel() {

    private val _shippingAddress = MutableStateFlow<Address?>(null)
    val shippingAddress: StateFlow<Address?> = _shippingAddress.asStateFlow()

    private val _paymentMethod = MutableStateFlow<PaymentMethod?>(null)
    val paymentMethod: StateFlow<PaymentMethod?> = _paymentMethod.asStateFlow()

    fun setShippingAddress(address: Address) {
        _shippingAddress.value = address
    }

    fun setPaymentMethod(method: PaymentMethod) {
        _paymentMethod.value = method
    }

    fun submitOrder() {
        viewModelScope.launch {
            val address = _shippingAddress.value ?: return@launch
            val payment = _paymentMethod.value ?: return@launch
            repository.submitOrder(address, payment)
        }
    }
}

// 配送 Fragment
class ShippingFragment : Fragment() {

    // 作用域为导航图
    private val viewModel: CheckoutViewModel by navGraphViewModels(R.id.checkout_graph)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        continueButton.setOnClickListener {
            val address = collectAddressFromForm()
            viewModel.setShippingAddress(address)
            findNavController().navigate(R.id.action_shipping_to_payment)
        }
    }
}

// 支付 Fragment
class PaymentFragment : Fragment() {

    private val viewModel: CheckoutViewModel by navGraphViewModels(R.id.checkout_graph)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 显示配送地址
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.shippingAddress.collect { address ->
                addressSummary.text = address?.toString()
            }
        }

        confirmButton.setOnClickListener {
            val payment = collectPaymentFromForm()
            viewModel.setPaymentMethod(payment)
            findNavController().navigate(R.id.action_payment_to_confirmation)
        }
    }
}
```

### Navigation Result API

在目的地之间传递结果：

```kotlin
// 请求结果的 Fragment
class ListFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 设置结果监听器
        val navController = findNavController()
        navController.currentBackStackEntry?.savedStateHandle?.getLiveData<String>("selectedItem")
            ?.observe(viewLifecycleOwner) { result ->
                // 处理结果
                textView.text = "已选择: $result"
            }

        // 导航到选择界面
        selectButton.setOnClickListener {
            navController.navigate(R.id.action_list_to_selection)
        }
    }
}

// 返回结果的 Fragment
class SelectionFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView.adapter = ItemAdapter { item ->
            // 设置结果并返回
            findNavController().previousBackStackEntry?.savedStateHandle?.set("selectedItem", item.id)
            findNavController().popBackStack()
        }
    }
}
```

### 对话框目的地

```xml
<!-- 在 nav_graph.xml 中 -->
<dialog
    android:id="@+id/confirmationDialog"
    android:name="com.example.ConfirmationDialogFragment"
    android:label="确认">

    <argument
        android:name="message"
        app:argType="string" />
</dialog>
```

```kotlin
class ConfirmationDialogFragment : DialogFragment() {

    private val args: ConfirmationDialogFragmentArgs by navArgs()

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        return AlertDialog.Builder(requireContext())
            .setMessage(args.message)
            .setPositiveButton("确认") { _, _ ->
                setFragmentResult("confirmation", bundleOf("confirmed" to true))
                dismiss()
            }
            .setNegativeButton("取消") { _, _ ->
                setFragmentResult("confirmation", bundleOf("confirmed" to false))
                dismiss()
            }
            .create()
    }
}

// 导航到对话框
class OrderFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setFragmentResultListener("confirmation") { _, bundle ->
            val confirmed = bundle.getBoolean("confirmed")
            if (confirmed) {
                submitOrder()
            }
        }

        submitButton.setOnClickListener {
            val action = OrderFragmentDirections.actionOrderToConfirmation(
                message = "确定要提交此订单吗？"
            )
            findNavController().navigate(action)
        }
    }
}
```

### 底部导航与独立返回栈

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController

        // 为每个标签设置独立返回栈
        bottomNavView.setupWithNavController(navController)
    }
}
```

```xml
<!-- res/menu/bottom_nav_menu.xml -->
<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:id="@+id/homeFragment"
        android:icon="@drawable/ic_home"
        android:title="首页" />

    <item
        android:id="@+id/searchFragment"
        android:icon="@drawable/ic_search"
        android:title="搜索" />

    <item
        android:id="@+id/profileFragment"
        android:icon="@drawable/ic_profile"
        android:title="我的" />
</menu>
```

## 最佳实践

### 1. 使用 Safe Args 确保类型安全

```kotlin
// 错误：直接使用 Bundle
fun navigateWithBundle(itemId: String) {
    val bundle = Bundle().apply {
        putString("itemId", itemId)  // 容易出错的键
    }
    findNavController().navigate(R.id.detailFragment, bundle)
}

// 正确：使用 Safe Args
fun navigateWithSafeArgs(itemId: String) {
    val action = ListFragmentDirections.actionListToDetail(itemId)
    findNavController().navigate(action)
}
```

### 2. 从 ViewModel 处理导航

```kotlin
// 错误：直接从 ViewModel 导航
class BadViewModel : ViewModel() {
    lateinit var navController: NavController  // 不要存储！

    fun onItemClick(id: String) {
        navController.navigate(...)  // 生命周期问题
    }
}

// 正确：发射导航事件
class GoodViewModel : ViewModel() {

    private val _navigationEvent = MutableSharedFlow<NavigationEvent>()
    val navigationEvent: SharedFlow<NavigationEvent> = _navigationEvent.asSharedFlow()

    fun onItemClick(id: String) {
        viewModelScope.launch {
            _navigationEvent.emit(NavigationEvent.ToDetail(id))
        }
    }

    sealed class NavigationEvent {
        data class ToDetail(val id: String) : NavigationEvent()
        object Back : NavigationEvent()
    }
}

// Fragment 处理导航
class ListFragment : Fragment() {

    private val viewModel: GoodViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.navigationEvent.collect { event ->
                when (event) {
                    is NavigationEvent.ToDetail -> {
                        val action = ListFragmentDirections.actionListToDetail(event.id)
                        findNavController().navigate(action)
                    }
                    NavigationEvent.Back -> findNavController().popBackStack()
                }
            }
        }
    }
}
```

### 3. 避免深层导航层次

```kotlin
// 错误：深层嵌套
// 首页 -> 列表 -> 详情 -> 评论 -> 评论 -> 回复

// 正确：使用模态展示扁平化
// 首页 -> 列表 -> 详情（模态：评论对话框）
// 首页 -> 列表 -> 详情（底部弹出：添加评论）
```

### 4. 正确处理返回栈

```xml
<!-- 登录后导航到首页时清除返回栈 -->
<action
    android:id="@+id/action_login_to_home"
    app:destination="@id/homeFragment"
    app:popUpTo="@id/nav_graph"
    app:popUpToInclusive="true" />
```

### 5. 测试导航

```kotlin
@RunWith(AndroidJUnit4::class)
class NavigationTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    private lateinit var navController: TestNavHostController

    @Before
    fun setup() {
        navController = TestNavHostController(ApplicationProvider.getApplicationContext())
        navController.setGraph(R.navigation.nav_graph)
    }

    @Test
    fun testNavigationToDetail() {
        val scenario = launchFragmentInContainer<HomeFragment>()

        scenario.onFragment { fragment ->
            Navigation.setViewNavController(fragment.requireView(), navController)
        }

        onView(withId(R.id.buttonDetail)).perform(click())

        assertEquals(R.id.detailFragment, navController.currentDestination?.id)
    }
}
```

## 常见陷阱

### 1. 找不到 NavController

```kotlin
// 错误：过早查找 NavController
class MainActivity : AppCompatActivity() {

    // 崩溃 - NavHostFragment 尚未附加
    private val navController = findNavController(R.id.nav_host_fragment)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}

// 正确：在 setContentView 之后查找
class MainActivity : AppCompatActivity() {

    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController
    }
}
```

### 2. 多次导航调用

```kotlin
// 问题：双击导致崩溃
class ListFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        itemView.setOnClickListener {
            // 如果快速点击两次，第二次导航会失败
            findNavController().navigate(R.id.action_list_to_detail)
        }
    }
}

// 解决方案 1：检查当前目的地
itemView.setOnClickListener {
    val currentDestination = findNavController().currentDestination?.id
    if (currentDestination == R.id.listFragment) {
        findNavController().navigate(R.id.action_list_to_detail)
    }
}

// 解决方案 2：安全导航扩展
fun NavController.safeNavigate(action: NavDirections) {
    currentDestination?.getAction(action.actionId)?.let {
        navigate(action)
    }
}

// 解决方案 3：防抖点击
class SafeClickListener(
    private val interval: Long = 500L,
    private val onClick: (View) -> Unit
) : View.OnClickListener {
    private var lastClickTime = 0L

    override fun onClick(v: View) {
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastClickTime >= interval) {
            lastClickTime = currentTime
            onClick(v)
        }
    }
}
```

### 3. 配置更改后 Fragment 未找到

```kotlin
// 问题：使用错误的导航图 ID
<navigation
    android:id="@+id/mobile_navigation"  // 这个 ID
    app:startDestination="@id/homeFragment">

// 导航时
navController.navigate(R.id.homeFragment)  // 错误 - 使用了 fragment ID

// 应该使用 action
navController.navigate(R.id.action_to_home)
```

### 4. 配置更改时参数丢失

```kotlin
// 问题：参数丢失
class DetailFragment : Fragment() {

    private var itemId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 配置更改时丢失！
        itemId = arguments?.getString("itemId")
    }
}

// 解决方案：使用 Safe Args 和 navArgs 委托
class DetailFragment : Fragment() {

    private val args: DetailFragmentArgs by navArgs()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // 配置更改后保留
        val itemId = args.itemId
    }
}
```

### 5. 底部导航的返回栈问题

```kotlin
// 问题：从非首页标签按返回键退出应用
// 解决方案：正确配置 AppBarConfiguration

val appBarConfiguration = AppBarConfiguration(
    setOf(R.id.homeFragment, R.id.searchFragment, R.id.profileFragment)
)
```

## 性能考量

### 1. 延迟加载嵌套图

```xml
<!-- 包含动态功能模块的图 -->
<include-dynamic
    android:id="@+id/feature_nav_graph"
    app:moduleName="feature"
    app:graphResName="feature_nav_graph" />
```

### 2. 避免在目的地中执行繁重操作

```kotlin
class DetailFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // 不要用繁重操作阻塞导航
        viewLifecycleOwner.lifecycleScope.launch {
            // 导航完成后加载数据
            delay(100)
            loadData()
        }
    }
}
```

### 3. 复用 Fragment 实例

```xml
<!-- 启用 Fragment 复用 -->
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.DetailFragment">

    <!-- 使用带 saveState 的 popUpTo -->
    <action
        android:id="@+id/action_detail_to_home"
        app:destination="@id/homeFragment"
        app:popUpTo="@id/homeFragment"
        app:popUpToSaveState="true"
        app:restoreState="true" />
</fragment>
```

## 实战场景

### 场景 1：认证流程

```xml
<navigation
    android:id="@+id/main_nav_graph"
    app:startDestination="@id/splashFragment">

    <fragment android:id="@+id/splashFragment">
        <action
            android:id="@+id/action_splash_to_main"
            app:destination="@id/main_graph"
            app:popUpTo="@id/main_nav_graph"
            app:popUpToInclusive="true" />

        <action
            android:id="@+id/action_splash_to_auth"
            app:destination="@id/auth_graph"
            app:popUpTo="@id/main_nav_graph"
            app:popUpToInclusive="true" />
    </fragment>

    <navigation
        android:id="@+id/auth_graph"
        app:startDestination="@id/loginFragment">

        <fragment android:id="@+id/loginFragment">
            <action
                android:id="@+id/action_login_to_main"
                app:destination="@id/main_graph"
                app:popUpTo="@id/main_nav_graph"
                app:popUpToInclusive="true" />
        </fragment>
    </navigation>

    <navigation
        android:id="@+id/main_graph"
        app:startDestination="@id/homeFragment">

        <fragment android:id="@+id/homeFragment" />
    </navigation>

</navigation>
```

### 场景 2：多模块导航

```kotlin
// 功能模块导航
object FeatureNavigation {

    fun createDeepLink(context: Context, itemId: String): PendingIntent {
        return NavDeepLinkBuilder(context)
            .setGraph(R.navigation.feature_nav_graph)
            .setDestination(R.id.featureDetailFragment)
            .setArguments(bundleOf("itemId" to itemId))
            .createPendingIntent()
    }
}

// 主模块导航到功能模块
class MainFragment : Fragment() {

    fun navigateToFeature(itemId: String) {
        val uri = Uri.parse("app://example.com/feature/$itemId")
        findNavController().navigate(uri)
    }
}
```

## 面试要点

1. **Navigation 组件的主要组成部分是什么？**
   - 导航图（Navigation Graph）：定义目的地和操作的 XML 资源
   - NavHost：显示目的地的容器
   - NavController：管理目的地之间导航的对象

2. **什么是 Safe Args？**
   - Gradle 插件，为导航参数生成类型安全的类
   - 防止错误参数类型的运行时错误
   - 生成 Directions 和 Args 类

3. **Navigation 组件如何处理返回栈？**
   - 自动管理 Fragment 返回栈
   - 支持 popUpTo 和 popUpToInclusive 清除栈
   - 处理系统返回按钮

4. **navigate() 和 popBackStack() 有什么区别？**
   - navigate()：将目的地添加到返回栈
   - popBackStack()：从返回栈移除目的地

5. **如何在目的地之间传递数据？**
   - 使用 Safe Args 和参数
   - 使用 SavedStateHandle
   - 使用 Navigation Result API

6. **如何实现深度链接？**
   - 在导航图中定义 deepLink
   - 在 manifest 中添加 nav-graph
   - 处理隐式和显式深度链接

7. **什么是 navGraphViewModels？**
   - 作用域为导航图的 ViewModel
   - 在图中所有目的地之间共享
   - 当图从返回栈弹出时被清除

8. **如何测试导航？**
   - 使用 TestNavHostController
   - 在 Fragment 中 mock NavController
   - 验证导航操作和参数

## 延伸阅读

- [Navigation 组件概述](https://developer.android.com/guide/navigation)
- [使用 Safe Args 导航](https://developer.android.com/guide/navigation/navigation-pass-data)
- [深度链接](https://developer.android.com/guide/navigation/navigation-deep-link)
- [导航和返回栈](https://developer.android.com/guide/navigation/navigation-navigate)
- [多模块导航](https://developer.android.com/guide/navigation/navigation-multi-module)
- [导航测试](https://developer.android.com/guide/navigation/navigation-testing)
