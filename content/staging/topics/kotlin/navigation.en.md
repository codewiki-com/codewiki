---
title: Navigation Component Guide
description: Complete guide to Android Navigation Component for fragment navigation, deep links, safe args, and building modern navigation patterns
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
origin: old/src/content/docs/kotlin/navigation.en.md
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

The Navigation Component is a Jetpack library that simplifies implementing navigation in Android apps. It handles fragment transactions, up and back actions, deep linking, and provides a visual editor for navigation flows. This comprehensive guide covers everything from basic setup to advanced navigation patterns.

## Concept Explanation

The Navigation Component consists of three key parts working together:

1. **Navigation Graph**: An XML resource that contains all navigation-related information in one centralized location
2. **NavHost**: A container that displays destinations from your navigation graph
3. **NavController**: An object that manages app navigation within a NavHost

### Why Navigation Component?

Traditional fragment navigation had several problems:

```kotlin
// Traditional fragment navigation - error-prone and verbose
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

    // Must handle back stack manually
    override fun onBackPressed() {
        if (supportFragmentManager.backStackEntryCount > 0) {
            supportFragmentManager.popBackStack()
        } else {
            super.onBackPressed()
        }
    }
}
```

With Navigation Component:

```kotlin
// Modern navigation - clean and type-safe
class ModernActivity : AppCompatActivity() {

    private val navController by lazy {
        findNavController(R.id.nav_host_fragment)
    }

    fun navigateToDetail(itemId: String) {
        // Type-safe navigation with Safe Args
        val action = ListFragmentDirections.actionListToDetail(itemId)
        navController.navigate(action)
    }

    // Back navigation handled automatically
}
```

### Setup and Dependencies

Add Navigation to your project in `build.gradle.kts`:

```kotlin
// Project-level build.gradle.kts
plugins {
    id("androidx.navigation.safeargs.kotlin") version "2.7.6" apply false
}

// App-level build.gradle.kts
plugins {
    id("androidx.navigation.safeargs.kotlin")
}

dependencies {
    val navVersion = "2.7.6"

    // Navigation
    implementation("androidx.navigation:navigation-fragment-ktx:$navVersion")
    implementation("androidx.navigation:navigation-ui-ktx:$navVersion")

    // Feature module support
    implementation("androidx.navigation:navigation-dynamic-features-fragment:$navVersion")

    // Testing
    androidTestImplementation("androidx.navigation:navigation-testing:$navVersion")

    // Compose Navigation (if using Compose)
    implementation("androidx.navigation:navigation-compose:$navVersion")
}
```

## Core Principles

### Navigation Graph

The navigation graph defines all possible paths through your app:

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
        android:label="Home"
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
        android:label="Detail"
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
        android:label="Settings"
        tools:layout="@layout/fragment_settings" />

</navigation>
```

### NavHost Setup

Add NavHost to your activity layout:

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

Get and use the NavController:

```kotlin
class MainActivity : AppCompatActivity() {

    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Get NavController
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController

        // Setup ActionBar with NavController
        setupActionBarWithNavController(navController)

        // Listen to navigation changes
        navController.addOnDestinationChangedListener { _, destination, _ ->
            Log.d("Navigation", "Navigated to ${destination.label}")
        }
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp() || super.onSupportNavigateUp()
    }
}

// In Fragment
class HomeFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Get NavController from Fragment
        val navController = findNavController()

        button.setOnClickListener {
            navController.navigate(R.id.action_home_to_detail)
        }
    }
}
```

## Key Concepts

### Safe Args

Safe Args generates type-safe code for navigation arguments:

```xml
<!-- In nav_graph.xml -->
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
// Generated Directions class for navigation
class HomeFragment : Fragment() {

    fun navigateToDetail(itemId: String, count: Int) {
        // Type-safe navigation
        val action = HomeFragmentDirections.actionHomeToDetail(
            itemId = itemId,
            count = count
        )
        findNavController().navigate(action)
    }
}

// Generated Args class for receiving arguments
class DetailFragment : Fragment() {

    // Using property delegate
    private val args: DetailFragmentArgs by navArgs()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val itemId = args.itemId
        val count = args.count

        // Use arguments
        textView.text = "Item: $itemId, Count: $count"
    }
}
```

### Supported Argument Types

```xml
<!-- Primitive types -->
<argument android:name="intArg" app:argType="integer" />
<argument android:name="floatArg" app:argType="float" />
<argument android:name="longArg" app:argType="long" />
<argument android:name="boolArg" app:argType="boolean" />
<argument android:name="stringArg" app:argType="string" />

<!-- Reference types -->
<argument android:name="resourceArg" app:argType="reference" />

<!-- Arrays -->
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

<!-- Enum -->
<argument
    android:name="enumArg"
    app:argType="com.example.app.MyEnum" />
```

### Deep Links

Enable deep linking to specific destinations:

```xml
<!-- In nav_graph.xml -->
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.app.DetailFragment">

    <!-- Explicit deep link -->
    <deepLink
        android:id="@+id/deepLink"
        app:uri="https://www.example.com/item/{itemId}"
        app:action="android.intent.action.VIEW"
        app:mimeType="*/*" />

    <!-- Implicit deep link -->
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
// Programmatic deep link navigation
class MainActivity : AppCompatActivity() {

    fun handleDeepLink(itemId: String) {
        val deepLink = navController.createDeepLink()
            .setDestination(R.id.detailFragment)
            .setArguments(bundleOf("itemId" to itemId))
            .createPendingIntent()

        // Use in notification
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentIntent(deepLink)
            .build()
    }
}
```

### Navigation UI

Integrate with common UI components:

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

        // Define top-level destinations
        appBarConfiguration = AppBarConfiguration(
            topLevelDestinationIds = setOf(
                R.id.homeFragment,
                R.id.searchFragment,
                R.id.profileFragment
            ),
            drawerLayout = drawerLayout  // Optional drawer
        )

        // Setup toolbar
        setSupportActionBar(toolbar)
        setupActionBarWithNavController(navController, appBarConfiguration)

        // Setup bottom navigation
        bottomNavView.setupWithNavController(navController)

        // Setup navigation drawer
        navView.setupWithNavController(navController)
    }

    override fun onSupportNavigateUp(): Boolean {
        return navController.navigateUp(appBarConfiguration) ||
            super.onSupportNavigateUp()
    }
}
```

## Code Examples

### Basic Navigation

```kotlin
class HomeFragment : Fragment(R.layout.fragment_home) {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val navController = findNavController()

        // Navigate using action ID
        buttonDetail.setOnClickListener {
            navController.navigate(R.id.action_home_to_detail)
        }

        // Navigate using Safe Args
        buttonDetailWithArgs.setOnClickListener {
            val action = HomeFragmentDirections.actionHomeToDetail(
                itemId = "item123",
                showExtra = true
            )
            navController.navigate(action)
        }

        // Navigate using destination ID
        buttonSettings.setOnClickListener {
            navController.navigate(R.id.settingsFragment)
        }

        // Navigate with NavOptions
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

### Nested Navigation Graphs

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

    <!-- Nested graph for authentication flow -->
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

### Conditional Navigation

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

### Shared ViewModel Navigation

```kotlin
// Shared ViewModel for multi-step flow
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

// Shipping Fragment
class ShippingFragment : Fragment() {

    // Scoped to navigation graph
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

// Payment Fragment
class PaymentFragment : Fragment() {

    private val viewModel: CheckoutViewModel by navGraphViewModels(R.id.checkout_graph)

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Display shipping address
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

Pass results back between destinations:

```kotlin
// Fragment requesting result
class ListFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set result listener
        val navController = findNavController()
        navController.currentBackStackEntry?.savedStateHandle?.getLiveData<String>("selectedItem")
            ?.observe(viewLifecycleOwner) { result ->
                // Handle result
                textView.text = "Selected: $result"
            }

        // Navigate to selection screen
        selectButton.setOnClickListener {
            navController.navigate(R.id.action_list_to_selection)
        }
    }
}

// Fragment returning result
class SelectionFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        recyclerView.adapter = ItemAdapter { item ->
            // Set result and navigate back
            findNavController().previousBackStackEntry?.savedStateHandle?.set("selectedItem", item.id)
            findNavController().popBackStack()
        }
    }
}
```

### Dialog Destination

```xml
<!-- In nav_graph.xml -->
<dialog
    android:id="@+id/confirmationDialog"
    android:name="com.example.ConfirmationDialogFragment"
    android:label="Confirmation">

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
            .setPositiveButton("Confirm") { _, _ ->
                setFragmentResult("confirmation", bundleOf("confirmed" to true))
                dismiss()
            }
            .setNegativeButton("Cancel") { _, _ ->
                setFragmentResult("confirmation", bundleOf("confirmed" to false))
                dismiss()
            }
            .create()
    }
}

// Navigate to dialog
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
                message = "Are you sure you want to submit this order?"
            )
            findNavController().navigate(action)
        }
    }
}
```

### Bottom Navigation with Separate Back Stacks

```kotlin
class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        val navController = navHostFragment.navController

        // Setup with separate back stacks for each tab
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
        android:title="Home" />

    <item
        android:id="@+id/searchFragment"
        android:icon="@drawable/ic_search"
        android:title="Search" />

    <item
        android:id="@+id/profileFragment"
        android:icon="@drawable/ic_profile"
        android:title="Profile" />
</menu>
```

## Best Practices

### 1. Use Safe Args for Type Safety

```kotlin
// Bad: Using Bundle directly
fun navigateWithBundle(itemId: String) {
    val bundle = Bundle().apply {
        putString("itemId", itemId)  // Error-prone key
    }
    findNavController().navigate(R.id.detailFragment, bundle)
}

// Good: Using Safe Args
fun navigateWithSafeArgs(itemId: String) {
    val action = ListFragmentDirections.actionListToDetail(itemId)
    findNavController().navigate(action)
}
```

### 2. Handle Navigation from ViewModel

```kotlin
// Bad: Navigating directly from ViewModel
class BadViewModel : ViewModel() {
    lateinit var navController: NavController  // Don't store!

    fun onItemClick(id: String) {
        navController.navigate(...)  // Lifecycle issues
    }
}

// Good: Emit navigation events
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

// Fragment handles navigation
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

### 3. Avoid Deep Navigation Hierarchies

```kotlin
// Bad: Deep nesting
// Home -> List -> Detail -> Comments -> Comment -> Reply

// Good: Flatten with modal presentations
// Home -> List -> Detail (modal: Comments dialog)
// Home -> List -> Detail (bottom sheet: Add comment)
```

### 4. Handle Back Stack Properly

```xml
<!-- Clear back stack when navigating to home after login -->
<action
    android:id="@+id/action_login_to_home"
    app:destination="@id/homeFragment"
    app:popUpTo="@id/nav_graph"
    app:popUpToInclusive="true" />
```

### 5. Test Navigation

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

## Common Pitfalls

### 1. NavController Not Found

```kotlin
// Wrong: Finding NavController too early
class MainActivity : AppCompatActivity() {

    // Crashes - NavHostFragment not yet attached
    private val navController = findNavController(R.id.nav_host_fragment)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
    }
}

// Correct: Find after setContentView
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

### 2. Multiple Navigation Calls

```kotlin
// Problem: Double-clicking causes crash
class ListFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        itemView.setOnClickListener {
            // If clicked twice quickly, second navigation fails
            findNavController().navigate(R.id.action_list_to_detail)
        }
    }
}

// Solution 1: Check current destination
itemView.setOnClickListener {
    val currentDestination = findNavController().currentDestination?.id
    if (currentDestination == R.id.listFragment) {
        findNavController().navigate(R.id.action_list_to_detail)
    }
}

// Solution 2: Safe navigation extension
fun NavController.safeNavigate(action: NavDirections) {
    currentDestination?.getAction(action.actionId)?.let {
        navigate(action)
    }
}

// Solution 3: Debounce clicks
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

### 3. Fragment Not Found After Configuration Change

```kotlin
// Problem: Using wrong navigation graph ID
<navigation
    android:id="@+id/mobile_navigation"  // This ID
    app:startDestination="@id/homeFragment">

// When navigating
navController.navigate(R.id.homeFragment)  // Wrong - uses fragment ID

// Should use action
navController.navigate(R.id.action_to_home)
```

### 4. Lost Arguments on Configuration Change

```kotlin
// Problem: Arguments lost
class DetailFragment : Fragment() {

    private var itemId: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Lost on configuration change!
        itemId = arguments?.getString("itemId")
    }
}

// Solution: Use Safe Args with navArgs delegate
class DetailFragment : Fragment() {

    private val args: DetailFragmentArgs by navArgs()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // Survives configuration changes
        val itemId = args.itemId
    }
}
```

### 5. Back Stack Issues with Bottom Navigation

```kotlin
// Problem: Back button exits app from non-home tab
// Solution: Configure AppBarConfiguration properly

val appBarConfiguration = AppBarConfiguration(
    setOf(R.id.homeFragment, R.id.searchFragment, R.id.profileFragment)
)
```

## Performance Considerations

### 1. Lazy Loading Nested Graphs

```xml
<!-- Include graph for dynamic feature module -->
<include-dynamic
    android:id="@+id/feature_nav_graph"
    app:moduleName="feature"
    app:graphResName="feature_nav_graph" />
```

### 2. Avoid Heavy Operations in Destinations

```kotlin
class DetailFragment : Fragment() {

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Don't block navigation with heavy operations
        viewLifecycleOwner.lifecycleScope.launch {
            // Load data after navigation completes
            delay(100)
            loadData()
        }
    }
}
```

### 3. Reuse Fragment Instances

```xml
<!-- Enable fragment reuse -->
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.DetailFragment">

    <!-- Use popUpTo with saveState -->
    <action
        android:id="@+id/action_detail_to_home"
        app:destination="@id/homeFragment"
        app:popUpTo="@id/homeFragment"
        app:popUpToSaveState="true"
        app:restoreState="true" />
</fragment>
```

## Real-World Scenarios

### Scenario 1: Authentication Flow

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

### Scenario 2: Multi-Module Navigation

```kotlin
// Feature module navigation
object FeatureNavigation {

    fun createDeepLink(context: Context, itemId: String): PendingIntent {
        return NavDeepLinkBuilder(context)
            .setGraph(R.navigation.feature_nav_graph)
            .setDestination(R.id.featureDetailFragment)
            .setArguments(bundleOf("itemId" to itemId))
            .createPendingIntent()
    }
}

// App module navigating to feature
class MainFragment : Fragment() {

    fun navigateToFeature(itemId: String) {
        val uri = Uri.parse("app://example.com/feature/$itemId")
        findNavController().navigate(uri)
    }
}
```

## Interview Key Points

1. **What are the main components of Navigation Component?**
   - Navigation Graph: XML resource defining destinations and actions
   - NavHost: Container displaying destinations
   - NavController: Manages navigation between destinations

2. **What is Safe Args?**
   - Gradle plugin generating type-safe classes for navigation arguments
   - Prevents runtime errors from wrong argument types
   - Generates Directions and Args classes

3. **How does Navigation Component handle the back stack?**
   - Automatically manages Fragment back stack
   - Supports popUpTo and popUpToInclusive for clearing stack
   - Handles system back button

4. **What is the difference between navigate() and popBackStack()?**
   - navigate(): Adds destination to back stack
   - popBackStack(): Removes destinations from back stack

5. **How to pass data between destinations?**
   - Using Safe Args with arguments
   - Using SavedStateHandle
   - Using Navigation Result API

6. **How to implement deep links?**
   - Define deepLink in navigation graph
   - Add nav-graph to manifest
   - Handle implicit and explicit deep links

7. **What is navGraphViewModels?**
   - ViewModel scoped to navigation graph
   - Shared across all destinations in the graph
   - Cleared when graph is popped from back stack

8. **How to test navigation?**
   - Use TestNavHostController
   - Mock NavController in fragments
   - Verify navigation actions and arguments

## Further Reading

- [Navigation Component Overview](https://developer.android.com/guide/navigation)
- [Navigation with Safe Args](https://developer.android.com/guide/navigation/navigation-pass-data)
- [Deep Links](https://developer.android.com/guide/navigation/navigation-deep-link)
- [Navigation and the Back Stack](https://developer.android.com/guide/navigation/navigation-navigate)
- [Multi-Module Navigation](https://developer.android.com/guide/navigation/navigation-multi-module)
- [Navigation Testing](https://developer.android.com/guide/navigation/navigation-testing)
