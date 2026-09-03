---
title: Java Mockito Testing Framework
description: Deep dive into the Mockito unit testing framework, mastering Mock object creation, method stubbing, behavior verification, and argument capturing
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Mockito
  - Unit Testing
  - Mock
  - TDD
  - JUnit
status: imported
origin: old/src/content/docs/java/mockito.en.md
divergence: 0.207
issues: []
legacy:
  category: Java
  subcategory: Testing
  order: 31
  lastUpdated: 2026-01-07
---

## Concept Explanation

### What is Mockito

Mockito is the most popular unit testing mocking framework in the Java ecosystem. It allows developers to create and configure Mock objects to test code in an isolated environment without depending on real external services, databases, or other components.

### Core Philosophy of Mock Testing

In unit testing, we want to test the behavior of the System Under Test (SUT), not its dependencies. Mock objects are "stand-ins" for these dependencies that:

- **Simulate behavior**: Can preset method return values
- **Verify interactions**: Can verify if methods were called, call count, and call order
- **Isolate testing**: Make tests independent of external factors

```
+-------------------------------------------------------------+
|                    Unit Test Architecture                    |
+-------------------------------------------------------------+
|                                                             |
|    +------------------+                                     |
|    |   Test Class     |                                     |
|    +--------+---------+                                     |
|             |                                               |
|             v                                               |
|    +------------------+      +------------------+           |
|    |   SUT (System    |----->|  Mock Dependency |           |
|    |   Under Test)    |      |    Objects       |           |
|    |  (Real Code)     |      |  (Simulated)     |           |
|    +------------------+      +------------------+           |
|                                      |                      |
|                                      v                      |
|                             +------------------+            |
|                             |  Preset Returns  |            |
|                             |  Verify Calls    |            |
|                             +------------------+            |
|                                                             |
+-------------------------------------------------------------+
```

### Mock vs Stub vs Spy

| Type | Description | Use Case |
|------|-------------|----------|
| **Mock** | Fully simulated object, all methods return default values | Need complete control over dependency behavior |
| **Stub** | Object with preset specific method return values | Only care about certain method returns |
| **Spy** | Partial mock, preserves real method implementations | Only want to mock some methods |

### Why Choose Mockito

1. **Clean and elegant API**: Fluent interface with high code readability
2. **Powerful features**: Supports argument matching, verification, capturing, and other advanced features
3. **Active community**: Well-documented with easy problem resolution
4. **Seamless JUnit integration**: Simplified configuration through annotations

## Core Principles

### How Mockito Works

Mockito uses **bytecode generation technology** (based on ByteBuddy or CGLIB) to dynamically create Mock objects:

```
+----------------------------------------------------------------+
|                    Mockito Internal Architecture                |
+----------------------------------------------------------------+
|                                                                |
|   1. Create Mock Object                                        |
|   +--------------+     +--------------+     +--------------+  |
|   | @Mock anno   |---->| MockitoCore  |---->| ByteBuddy    |  |
|   | or mock()    |     | Handler      |     | Bytecode Gen |  |
|   +--------------+     +--------------+     +--------------+  |
|                                                    |           |
|                                                    v           |
|                                           +--------------+    |
|                                           | Proxy Class  |    |
|                                           | Instance     |    |
|                                           | (Mock Object)|    |
|                                           +--------------+    |
|                                                                |
|   2. Method Call Interception                                  |
|   +--------------+     +--------------+     +--------------+  |
|   | Call Mock    |---->| Interceptor  |---->| Stubbed      |  |
|   | Method       |     |              |     | Answer       |  |
|   +--------------+     +--------------+     +--------------+  |
|                              |                                 |
|                              v                                 |
|                        +--------------+                       |
|                        | Invocation   |                       |
|                        | Records      |                       |
|                        +--------------+                       |
|                                                                |
+----------------------------------------------------------------+
```

### Mock Object Lifecycle

```java
// 1. Creation phase: Generate proxy class instance
UserService mockService = mock(UserService.class);

// 2. Stubbing phase: Configure method behavior
when(mockService.findById(1L)).thenReturn(new User("Alice"));

// 3. Execution phase: Tested code calls Mock method
User user = mockService.findById(1L);  // Returns preset User

// 4. Verification phase: Check if interactions match expectations
verify(mockService).findById(1L);  // Verify method was called

// 5. Reset phase (optional): Clear stubs and verification records
reset(mockService);
```

### Stubbing Mechanism Explained

What happens internally when calling `when(...).thenReturn(...)`:

```java
// 1. when() method records the current method call
// 2. thenReturn() binds the return value to that call
// 3. Subsequent matching calls will return the preset value

// Stubbing matching rules (by registration order)
when(service.getData("A")).thenReturn("Result A");
when(service.getData("B")).thenReturn("Result B");
when(service.getData(anyString())).thenReturn("Default");

// When called, matches the last registered matcher
service.getData("A");  // Returns "Result A" (exact match takes priority)
service.getData("C");  // Returns "Default" (anyString matches)
```

## Key Points

### Dependency Configuration

```xml
<!-- Maven dependency -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.8.0</version>
    <scope>test</scope>
</dependency>

<!-- JUnit 5 extension (recommended) -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.8.0</version>
    <scope>test</scope>
</dependency>
```

### Core Annotations

| Annotation | Purpose | Description |
|------------|---------|-------------|
| `@Mock` | Create Mock object | All methods return default values |
| `@Spy` | Create Spy object | Preserves real implementation, can partially mock |
| `@InjectMocks` | Auto-inject Mocks | Injects @Mock objects into tested class |
| `@Captor` | Create argument captor | Used to capture method arguments |

### Stubbing Methods

| Method | Purpose |
|--------|---------|
| `when().thenReturn()` | Return specified value |
| `when().thenThrow()` | Throw exception |
| `when().thenAnswer()` | Custom return logic |
| `when().thenCallRealMethod()` | Call real method |
| `doReturn().when()` | Alternative stubbing (for spy) |

### Verification Methods

| Method | Purpose |
|--------|---------|
| `verify(mock).method()` | Verify method called once |
| `verify(mock, times(n))` | Verify call count |
| `verify(mock, never())` | Verify never called |
| `verify(mock, atLeast(n))` | Verify called at least n times |
| `verifyNoMoreInteractions()` | Verify no other interactions |

### Argument Matchers

| Matcher | Purpose |
|---------|---------|
| `any()` | Match any object |
| `anyString()`, `anyInt()` | Match specific types |
| `eq(value)` | Exact match |
| `argThat(predicate)` | Custom matching logic |
| `isNull()`, `notNull()` | Null value matching |

## Code Examples

### Basic Setup and @Mock Annotation

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// Business class definition
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
    }

    public User createUser(String name, String email) {
        User user = new User(name, email);
        User savedUser = userRepository.save(user);
        emailService.sendWelcomeEmail(savedUser.getEmail());
        return savedUser;
    }
}

// Test class
@ExtendWith(MockitoExtension.class)  // Enable Mockito extension
class UserServiceTest {

    @Mock
    private UserRepository userRepository;  // Create Mock object

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;  // Auto-inject Mock objects

    @Test
    void shouldReturnUserWhenFound() {
        // Given (Arrange)
        User expectedUser = new User(1L, "Alice", "alice@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(expectedUser));

        // When (Act)
        User result = userService.getUserById(1L);

        // Then (Assert)
        assertEquals("Alice", result.getName());
        verify(userRepository).findById(1L);  // Verify call
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Given
        when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

        // When & Then
        assertThrows(UserNotFoundException.class, () -> {
            userService.getUserById(999L);
        });
    }
}
```

### when/thenReturn Stubbing Configuration

```java
@Test
void demonstrateStubbing() {
    // Basic stubbing
    when(userRepository.findById(1L)).thenReturn(Optional.of(new User("Alice")));

    // Chained stubbing (different values for multiple calls)
    when(userRepository.count())
        .thenReturn(1L)
        .thenReturn(2L)
        .thenReturn(3L);

    assertEquals(1L, userRepository.count());  // First call
    assertEquals(2L, userRepository.count());  // Second call
    assertEquals(3L, userRepository.count());  // Third and subsequent
    assertEquals(3L, userRepository.count());  // Still returns 3L

    // Throw exception
    when(userRepository.findById(-1L))
        .thenThrow(new IllegalArgumentException("Invalid ID"));

    assertThrows(IllegalArgumentException.class, () -> {
        userRepository.findById(-1L);
    });

    // Use thenAnswer for custom return logic
    when(userRepository.save(any(User.class)))
        .thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(System.currentTimeMillis());  // Simulate ID generation
            return user;
        });

    User newUser = userRepository.save(new User("Bob"));
    assertNotNull(newUser.getId());
}

@Test
void demonstrateVoidMethodStubbing() {
    // void methods cannot use when().thenReturn()
    // Use doNothing(), doThrow() etc.

    doNothing().when(emailService).sendWelcomeEmail(anyString());

    // Or make void method throw exception
    doThrow(new EmailException("SMTP Error"))
        .when(emailService).sendWelcomeEmail("invalid@");

    // void methods can also use doAnswer
    doAnswer(invocation -> {
        String email = invocation.getArgument(0);
        System.out.println("Sending email to: " + email);
        return null;  // void method returns null
    }).when(emailService).sendWelcomeEmail(anyString());
}
```

### verify Behavior Verification

```java
@Test
void demonstrateVerification() {
    // Arrange and Act
    when(userRepository.findById(1L)).thenReturn(Optional.of(new User("Alice")));
    userService.getUserById(1L);
    userService.getUserById(1L);

    // Verify call count
    verify(userRepository, times(2)).findById(1L);
    verify(userRepository, atLeast(1)).findById(1L);
    verify(userRepository, atMost(3)).findById(1L);
    verify(userRepository, never()).delete(any());

    // Verify call order
    InOrder inOrder = inOrder(userRepository, emailService);

    when(userRepository.save(any())).thenReturn(new User(1L, "Bob", "bob@test.com"));
    userService.createUser("Bob", "bob@test.com");

    inOrder.verify(userRepository).save(any());
    inOrder.verify(emailService).sendWelcomeEmail(anyString());

    // Verify no other interactions
    verifyNoMoreInteractions(emailService);

    // Verify called within specified time (for async testing)
    verify(userRepository, timeout(1000).times(1)).findById(anyLong());
}

@Test
void demonstrateArgumentMatchers() {
    // Using argument matchers
    when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
    when(userRepository.findByEmail(eq("admin@test.com")))
        .thenReturn(Optional.of(new User("Admin")));

    // Note: If using argument matchers, all arguments must use matchers
    // Wrong: verify(mock).method(anyString(), "literal");  // Compile error
    // Correct: verify(mock).method(anyString(), eq("literal"));

    // Custom matcher
    verify(userRepository).findByEmail(argThat(email ->
        email != null && email.contains("@")
    ));

    // Combined matchers
    when(userRepository.findByNameAndAge(
        argThat(name -> name.length() > 2),
        intThat(age -> age >= 18)
    )).thenReturn(Optional.of(new User("Adult")));
}
```

### ArgumentCaptor Argument Capturing

```java
@Test
void demonstrateArgumentCaptor() {
    // Method 1: Use @Captor annotation
    @Captor
    ArgumentCaptor<User> userCaptor;

    // Method 2: Manual creation
    ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);

    // Execute tested code
    when(userRepository.save(any(User.class)))
        .thenReturn(new User(1L, "Alice", "alice@test.com"));
    userService.createUser("Alice", "alice@test.com");

    // Capture argument
    verify(emailService).sendWelcomeEmail(emailCaptor.capture());

    // Verify captured argument
    String capturedEmail = emailCaptor.getValue();
    assertEquals("alice@test.com", capturedEmail);

    // Capture all arguments from multiple calls
    userService.createUser("Bob", "bob@test.com");
    userService.createUser("Charlie", "charlie@test.com");

    verify(emailService, times(3)).sendWelcomeEmail(emailCaptor.capture());
    List<String> allEmails = emailCaptor.getAllValues();
    assertEquals(3, allEmails.size());
    assertTrue(allEmails.contains("bob@test.com"));
}

@Test
void captureComplexArguments() {
    // Capture complex objects
    ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);

    when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
        User user = invocation.getArgument(0);
        user.setId(100L);
        return user;
    });

    userService.createUser("TestUser", "test@example.com");

    verify(userRepository).save(userCaptor.capture());

    User capturedUser = userCaptor.getValue();
    assertEquals("TestUser", capturedUser.getName());
    assertEquals("test@example.com", capturedUser.getEmail());
}
```

### Spy Partial Mocking

```java
@Test
void demonstrateSpy() {
    // Create Spy: Preserves real behavior, can selectively override
    List<String> spyList = spy(new ArrayList<>());

    // Real method called
    spyList.add("one");
    spyList.add("two");
    assertEquals(2, spyList.size());  // Real size()

    // Stub specific method
    when(spyList.size()).thenReturn(100);
    assertEquals(100, spyList.size());  // Returns stubbed value
    assertEquals("one", spyList.get(0));  // Real get()

    // Note: Using when().thenReturn() on spy calls real method first
    // Use doReturn().when() to avoid this
    doReturn("mocked").when(spyList).get(0);
    assertEquals("mocked", spyList.get(0));
}

@Test
void spyWithRealService() {
    // Use @Spy annotation
    @Spy
    private UserValidator userValidator = new UserValidator();

    @InjectMocks
    private UserService userService;

    // Only mock specific method, other methods keep real implementation
    doReturn(true).when(userValidator).isEmailValid(anyString());

    // userValidator.isNameValid() executes real logic
    // userValidator.isEmailValid() returns mocked value
}
```

### Complete Test Example

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    @Captor
    private ArgumentCaptor<Order> orderCaptor;

    @Test
    @DisplayName("Should deduct inventory and send notification when order created successfully")
    void shouldCreateOrderSuccessfully() {
        // Given
        Long userId = 1L;
        Long productId = 100L;
        int quantity = 2;
        BigDecimal price = new BigDecimal("99.99");

        Product product = new Product(productId, "iPhone", price, 10);
        when(inventoryService.getProduct(productId)).thenReturn(product);
        when(inventoryService.checkStock(productId, quantity)).thenReturn(true);
        when(paymentService.processPayment(any())).thenReturn(PaymentResult.SUCCESS);
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order order = inv.getArgument(0);
            order.setId(1L);
            order.setStatus(OrderStatus.CONFIRMED);
            return order;
        });

        // When
        Order result = orderService.createOrder(userId, productId, quantity);

        // Then
        assertNotNull(result);
        assertEquals(OrderStatus.CONFIRMED, result.getStatus());

        // Verify interaction order
        InOrder inOrder = inOrder(inventoryService, paymentService,
                                  orderRepository, notificationService);
        inOrder.verify(inventoryService).checkStock(productId, quantity);
        inOrder.verify(paymentService).processPayment(any());
        inOrder.verify(inventoryService).deductStock(productId, quantity);
        inOrder.verify(orderRepository).save(any(Order.class));
        inOrder.verify(notificationService).sendOrderConfirmation(any());

        // Verify saved order content
        verify(orderRepository).save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertEquals(userId, savedOrder.getUserId());
        assertEquals(new BigDecimal("199.98"), savedOrder.getTotalAmount());
    }

    @Test
    @DisplayName("Should throw exception and not process payment when stock insufficient")
    void shouldThrowExceptionWhenStockInsufficient() {
        // Given
        when(inventoryService.checkStock(anyLong(), anyInt())).thenReturn(false);

        // When & Then
        assertThrows(InsufficientStockException.class, () -> {
            orderService.createOrder(1L, 100L, 5);
        });

        // Verify payment was not called
        verify(paymentService, never()).processPayment(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should rollback inventory when payment fails")
    void shouldRollbackWhenPaymentFails() {
        // Given
        when(inventoryService.checkStock(anyLong(), anyInt())).thenReturn(true);
        when(paymentService.processPayment(any()))
            .thenReturn(PaymentResult.FAILED);

        // When & Then
        assertThrows(PaymentException.class, () -> {
            orderService.createOrder(1L, 100L, 2);
        });

        // Verify inventory rollback
        verify(inventoryService).rollbackStock(anyLong(), anyInt());
        verify(orderRepository, never()).save(any());
    }
}
```

## Best Practices

### Test Structure Convention (AAA Pattern)

```java
@Test
void shouldFollowAAAPattern() {
    // Arrange - Set up test data and Mock behavior
    User user = new User("Alice");
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    // Act - Call the method under test
    User result = userService.getUserById(1L);

    // Assert - Verify results and interactions
    assertEquals("Alice", result.getName());
    verify(userRepository).findById(1L);
}
```

### Only Mock Necessary Dependencies

```java
// Good practice: Only Mock external dependencies
@Mock
private UserRepository userRepository;  // Database access

@Mock
private EmailService emailService;  // External service

// Don't Mock: Value objects, utility classes, the class under test itself
// UserService userService = spy(new UserService(...));  // Avoid
```

### Use BDD Style for Better Readability

```java
import static org.mockito.BDDMockito.*;

@Test
void shouldUseReadableBDDStyle() {
    // Given
    given(userRepository.findById(1L)).willReturn(Optional.of(new User("Alice")));

    // When
    User result = userService.getUserById(1L);

    // Then
    then(userRepository).should().findById(1L);
    then(userRepository).shouldHaveNoMoreInteractions();
}
```

### Use Strict Mode Appropriately

```java
@ExtendWith(MockitoExtension.class)
class StrictModeTest {
    // MockitoExtension uses STRICT_STUBS mode by default
    // Detects unused stubs and argument matching issues

    @Test
    void strictModeDetectsUnusedStubbing() {
        // If stubbed but not used, will throw error
        when(mock.method()).thenReturn("value");
        // Test will fail if mock.method() is not called
    }
}

// Relaxing strict mode (not recommended)
@MockitoSettings(strictness = Strictness.LENIENT)
class LenientTest {
    // Allows unused stubs
}
```

### Avoid Over-Verification

```java
// Bad practice: Verify every call
@Test
void overVerification() {
    userService.createUser("Alice", "alice@test.com");

    verify(userRepository).save(any());
    verify(emailService).sendWelcomeEmail(any());
    verify(userRepository, never()).delete(any());  // Over-verification
    verify(emailService, never()).sendGoodbyeEmail(any());  // Over-verification
    verifyNoMoreInteractions(userRepository, emailService);  // Too strict
}

// Good practice: Only verify key behaviors
@Test
void focusedVerification() {
    userService.createUser("Alice", "alice@test.com");

    verify(userRepository).save(any());  // Core business
    verify(emailService).sendWelcomeEmail("alice@test.com");  // Side effect
}
```

### Argument Matcher Best Practices

```java
@Test
void argumentMatcherBestPractices() {
    // Prefer exact matching
    when(service.findById(1L)).thenReturn(result);

    // Use any series when flexible matching is needed
    when(service.findById(anyLong())).thenReturn(defaultResult);

    // Use argThat for complex conditions
    when(service.save(argThat(user ->
        user.getName() != null && user.getAge() >= 18
    ))).thenReturn(savedUser);

    // Rule: When mixing, all arguments must be matchers
    // when(service.method(anyString(), "literal"));  // Wrong!
    when(service.method(anyString(), eq("literal"))).thenReturn(result);
}
```

## Common Pitfalls

### Cannot Mock final Classes and Methods

```java
// By default, Mockito cannot Mock final classes/methods

// Solution 1: Create config file in test/resources
// src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker
// Content: mock-maker-inline

// Solution 2: Use mockito-inline dependency (Mockito 5.x supports by default)
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.8.0</version>  <!-- 5.x supports inline mock by default -->
</dependency>
```

### Static Method Mocking

```java
// Mockito 3.4+ supports static method mocking
@Test
void mockStaticMethod() {
    try (MockedStatic<Utils> utilities = mockStatic(Utils.class)) {
        utilities.when(() -> Utils.generateId()).thenReturn("mock-id");

        assertEquals("mock-id", Utils.generateId());
    }
    // Original behavior restored outside try block
}
```

### Difference Between when/doReturn for Spy

```java
@Test
void spyStubbing() {
    List<String> spyList = spy(new ArrayList<>());

    // Dangerous: when() calls real method first!
    // when(spyList.get(0)).thenReturn("mock");  // Throws IndexOutOfBoundsException

    // Safe: doReturn doesn't call real method
    doReturn("mock").when(spyList).get(0);
    assertEquals("mock", spyList.get(0));
}
```

### Argument Matcher Scope

```java
@Test
void argumentMatcherScope() {
    // Wrong: Argument matchers must be used inside verify/when
    // String captured = anyString();  // Wrong!
    // verify(mock).method(captured);

    // Correct: Use directly in verify/when
    verify(mock).method(anyString());

    // Correct: Use ArgumentCaptor to get arguments
    ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
    verify(mock).method(captor.capture());
    String captured = captor.getValue();
}
```

### Avoid Mutating Arguments in Stubs

```java
@Test
void avoidMutatingArguments() {
    // Bad practice: Modifying passed argument in thenAnswer
    when(repository.save(any(User.class))).thenAnswer(inv -> {
        User user = inv.getArgument(0);
        user.setId(1L);  // Modifies original object
        return user;
    });

    // Better practice: Return new object
    when(repository.save(any(User.class))).thenAnswer(inv -> {
        User user = inv.getArgument(0);
        return new User(1L, user.getName(), user.getEmail());
    });
}
```

### Annotations Not Working

```java
// Problem: Forgot to enable Mockito annotations
class BrokenTest {
    @Mock
    private UserRepository repository;  // Is null!
}

// Solution 1: Use JUnit 5 extension
@ExtendWith(MockitoExtension.class)
class FixedTest {
    @Mock
    private UserRepository repository;  // Properly injected
}

// Solution 2: Manual initialization
class ManualInitTest {
    @Mock
    private UserRepository repository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
}
```

### Generic Type Erasure Issues

```java
@Test
void genericTypeErasure() {
    // Problem: Cannot directly Mock generic types
    // List<String> mockList = mock(List<String>.class);  // Compile error

    // Solution: Use raw type and cast
    @SuppressWarnings("unchecked")
    List<String> mockList = mock(List.class);

    // Or use @Mock annotation
    @Mock
    List<String> annotatedMockList;  // Type safe
}
```

## Performance Considerations

### Mock Object Creation Overhead

```java
// Avoid creating Mock in every test method
// Bad practice
@Test
void test1() {
    UserRepository repo = mock(UserRepository.class);  // Created each time
}

// Good practice: Use field-level Mock
@Mock
private UserRepository userRepository;  // Reused

// Or use @BeforeEach with shared Mock
@BeforeEach
void setUp() {
    reset(userRepository);  // Reset state instead of recreating
}
```

### Avoid Unnecessary Verification

```java
// Verification has overhead, only verify necessary interactions
@Test
void efficientVerification() {
    // Only verify core business logic
    verify(orderRepository).save(any());

    // Avoid: verifyNoMoreInteractions() checks all calls
    // Avoid: verify(mock, times(0)).method() redundant verification
}
```

### Use Lenient Stubbing

```java
// If stub might not be used, use lenient to avoid strict check overhead
@Test
void useLenientStubbing() {
    lenient().when(cache.get(anyString())).thenReturn(null);

    // This stub might not be called, but won't cause test failure
}
```

### Control Mock Count

```java
// Too many Mocks in a test is a sign of design problems
// Typically a test class should have no more than 3-5 Mocks

// If too many Mocks are needed, consider:
// 1. Does the tested class have too many responsibilities (violates SRP)
// 2. Should this be an integration test instead of unit test
// 3. Can simple dependencies (like value objects) be used as real objects
```

## Real-World Scenarios

### Scenario 1: Testing Controller Layer

```java
@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @Test
    void shouldReturnUserWhenFound() {
        // Given
        UserDTO expectedUser = new UserDTO(1L, "Alice", "alice@test.com");
        when(userService.getUserById(1L)).thenReturn(expectedUser);

        // When
        ResponseEntity<UserDTO> response = userController.getUser(1L);

        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Alice", response.getBody().getName());
    }

    @Test
    void shouldReturn404WhenUserNotFound() {
        // Given
        when(userService.getUserById(anyLong()))
            .thenThrow(new UserNotFoundException("User not found"));

        // When & Then
        assertThrows(UserNotFoundException.class, () -> {
            userController.getUser(999L);
        });
    }
}
```

### Scenario 2: Testing Async Code

```java
@ExtendWith(MockitoExtension.class)
class AsyncServiceTest {

    @Mock
    private ExternalApiClient apiClient;

    @InjectMocks
    private AsyncDataService asyncDataService;

    @Test
    void shouldHandleAsyncCalls() throws Exception {
        // Given
        CompletableFuture<String> futureResult =
            CompletableFuture.completedFuture("async result");
        when(apiClient.fetchDataAsync(anyString())).thenReturn(futureResult);

        // When
        CompletableFuture<String> result = asyncDataService.processAsync("input");

        // Then
        assertEquals("ASYNC RESULT", result.get(1, TimeUnit.SECONDS));
    }

    @Test
    void shouldHandleAsyncFailure() {
        // Given
        CompletableFuture<String> failedFuture = new CompletableFuture<>();
        failedFuture.completeExceptionally(new RuntimeException("API Error"));
        when(apiClient.fetchDataAsync(anyString())).thenReturn(failedFuture);

        // When
        CompletableFuture<String> result = asyncDataService.processAsync("input");

        // Then
        assertThrows(ExecutionException.class, () -> {
            result.get(1, TimeUnit.SECONDS);
        });
    }
}
```

### Scenario 3: Testing Transaction Rollback

```java
@ExtendWith(MockitoExtension.class)
class TransactionalServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private TransferService transferService;

    @Test
    void shouldRollbackOnFailure() {
        // Given
        Account fromAccount = new Account(1L, new BigDecimal("1000"));
        Account toAccount = new Account(2L, new BigDecimal("500"));

        when(accountRepository.findById(1L)).thenReturn(Optional.of(fromAccount));
        when(accountRepository.findById(2L)).thenReturn(Optional.of(toAccount));
        when(transactionRepository.save(any()))
            .thenThrow(new RuntimeException("DB Error"));

        // When & Then
        assertThrows(TransferException.class, () -> {
            transferService.transfer(1L, 2L, new BigDecimal("100"));
        });

        // Verify account balances unchanged (rolled back)
        assertEquals(new BigDecimal("1000"), fromAccount.getBalance());
        assertEquals(new BigDecimal("500"), toAccount.getBalance());
    }
}
```

### Scenario 4: Mocking Chained Calls

```java
@Test
void shouldMockChainedCalls() {
    // Scenario: repository.findById().map().orElseThrow()

    // Method 1: RETURNS_DEEP_STUBS
    UserRepository deepMock = mock(UserRepository.class, RETURNS_DEEP_STUBS);
    when(deepMock.findById(1L).orElseThrow()).thenReturn(new User("Alice"));

    // Method 2: Layer-by-layer Mock (clearer)
    Optional<User> optionalUser = Optional.of(new User("Alice"));
    when(userRepository.findById(1L)).thenReturn(optionalUser);

    // Scenario: Builder pattern
    QueryBuilder builderMock = mock(QueryBuilder.class, RETURNS_SELF);
    when(builderMock.select(anyString())).thenReturn(builderMock);
    when(builderMock.where(anyString())).thenReturn(builderMock);
    when(builderMock.execute()).thenReturn(results);
}
```

## Interview Points

### Core Concepts of Mockito

**Q: What is a Mock object? Why do we need Mocks?**

A: Mock objects are simulated stand-ins for real objects, used to:
- Isolate tested code from external dependencies
- Control test environment determinism
- Simulate hard-to-trigger edge cases
- Improve test execution speed

**Q: What's the difference between @Mock, @Spy, and @InjectMocks?**

A:
- `@Mock`: Creates fully mocked object, all methods return default values
- `@Spy`: Creates partially mocked object, preserves real method implementations, can selectively override
- `@InjectMocks`: Auto-injects @Mock/@Spy objects into tested class

### Stubbing and Verification

**Q: What's the difference between when().thenReturn() and doReturn().when()?**

A:
```java
// when().thenReturn() - calls real method (affects spy)
when(spy.get(0)).thenReturn("mock");  // Calls get(0) first, may throw exception

// doReturn().when() - doesn't call real method
doReturn("mock").when(spy).get(0);  // Safe
```

**Q: What is the purpose of verify()?**

A: `verify()` is used to verify whether Mock object methods were called, call count, call arguments, etc. It's the core method for behavior verification.

### Advanced Features

**Q: When to use ArgumentCaptor?**

A: Use when you need to verify the content of arguments passed to Mock methods:
```java
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
verify(repository).save(captor.capture());
assertEquals("Alice", captor.getValue().getName());
```

**Q: How to Mock static methods and final classes?**

A: Mockito 5.x supports by default. 3.4+ requires using `mockStatic()` and mock-maker-inline configuration.

### Best Practices

**Q: What should unit tests Mock?**

A:
- **Should Mock**: External services, databases, network calls, third-party APIs
- **Should not Mock**: Value objects, utility classes, the class under test itself

**Q: How to avoid brittle tests?**

A:
- Only verify key behaviors, don't over-verify
- Use flexible argument matchers
- Focus on behavior rather than implementation details
- Follow AAA pattern to organize tests

## Further Reading

### Official Resources

- [Mockito Official Documentation](https://site.mockito.org/)
- [Mockito GitHub Repository](https://github.com/mockito/mockito)
- [Mockito Javadoc](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)

### Related Books

- *xUnit Test Patterns* - Gerard Meszaros
- *Growing Object-Oriented Software, Guided by Tests* - Steve Freeman, Nat Pryce
- *Effective Unit Testing* - Lasse Koskela

### Advanced Topics

- **PowerMock**: For mocking private methods, constructors, and scenarios Mockito doesn't support
- **WireMock**: For mocking HTTP services
- **Testcontainers**: Containerized dependencies for integration testing

### Related Tools

- **JUnit 5**: Testing framework
- **AssertJ**: Fluent assertion library
- **Spring Test**: Spring application testing support
- **JaCoCo**: Code coverage tool

---

> We covered the core concepts and usage of the Mockito framework in detail. Mastering Mock testing techniques is crucial for writing high-quality, maintainable unit tests. It's recommended to practice with real projects to master handling various Mock scenarios.
