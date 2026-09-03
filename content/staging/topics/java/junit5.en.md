---
title: Java JUnit 5 Testing Framework
description: Comprehensive guide to JUnit 5, covering the modern testing framework for Java with detailed explanations of annotations, lifecycle, assertions, parameterized tests, and best practices.
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - JUnit 5
  - Testing
  - Unit Testing
  - Mockito
  - Test Assertions
  - Parameterized Tests
status: imported
origin: old/src/content/docs/java/junit5.en.md
divergence: 0.227
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Java
  subcategory: ""
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Explanation

JUnit 5 (also known as Jupiter) is the next-generation testing framework for Java, released in 2017 as a major evolution from JUnit 4. It provides a modern, extensible platform for writing and running tests with clean, expressive syntax and powerful features designed for contemporary Java development.

### Historical Context

- **JUnit 4 (2006)**: Introduced annotations and simplified test writing
- **JUnit 5 (2017)**: Complete rewrite with modular architecture, better extensibility, and support for Java 8+ features
- **Architecture**: Three main components:
  - **JUnit Platform**: Foundation for launching tests
  - **JUnit Jupiter**: New programming model and extensions
  - **JUnit Vintage**: Backward compatibility with JUnit 3 and 4

### Problems It Solves

1. **Extensibility**: Pluggable extension model replaces static utility methods
2. **Flexibility**: Supports multiple test engines and custom runners
3. **Modern Java**: Leverages lambdas, streams, and newer language features
4. **Cleaner Code**: Refined annotation system with better naming conventions
5. **Better Lifecycle**: More granular control over test setup and teardown

---

## Core Principles

### **Separation of Concerns**

JUnit 5 separates the test discovery/execution engine (Platform) from the programming model (Jupiter). This allows:
- Multiple test frameworks on the same platform
- Custom test engines without modifying core code
- Independent evolution of different components

### **Modularity**

Components are organized as separate modules:
```
junit-platform-commons
junit-platform-engine
junit-platform-launcher
junit-jupiter-api
junit-jupiter-engine
junit-jupiter-params
```

### **Annotation-Driven Testing**

Modern annotations provide clear, semantic meaning:
- `@Test`: Marks test methods
- `@BeforeEach`, `@AfterEach`: Per-test lifecycle
- `@BeforeAll`, `@AfterAll`: Class-level lifecycle
- `@DisplayName`: Human-readable test names

### **Extensibility**

Flexible extension model through:
- Extension API
- Conditional test execution
- Parameter resolution
- Lifecycle callbacks

### **Backward Compatibility**

JUnit Vintage engine allows running JUnit 3 and 4 tests alongside Jupiter tests.

---

## Core Key Points

### Test Annotations

| Annotation | Purpose | Instance/Class |
|---|---|---|
| `@Test` | Marks executable test method | Per-test |
| `@ParameterizedTest` | Parameterized test method | Per-test |
| `@RepeatedTest` | Test repeated N times | Per-test |
| `@BeforeEach` | Runs before each test | Per-test |
| `@AfterEach` | Runs after each test | Per-test |
| `@BeforeAll` | Runs once before all tests | Static/Shared |
| `@AfterAll` | Runs once after all tests | Static/Shared |
| `@Disabled` | Disables test execution | - |
| `@DisplayName` | Custom test display name | - |
| `@Tag` | Logical grouping for filtering | - |
| `@Nested` | Nested test class | - |

### Assertion Methods

JUnit 5 provides comprehensive assertions:
- `assertEquals()`, `assertNotEquals()`
- `assertTrue()`, `assertFalse()`
- `assertNull()`, `assertNotNull()`
- `assertSame()`, `assertNotSame()`
- `assertArrayEquals()`
- `assertThrows()`, `assertDoesNotThrow()`
- `assertTimeout()`, `assertTimeoutPreemptively()`
- `assertAll()`
- `assertIterableEquals()`
- `assertLinesMatch()`

### Test Lifecycle

```
JUnit 5 Lifecycle:
1. Test Class Instantiation (for @BeforeAll/@AfterAll if not static)
2. @BeforeAll methods run (once)
3. For each test:
   a. Test instance created
   b. @BeforeEach methods run
   c. @Test method executes
   d. @AfterEach methods run
4. @AfterAll methods run (once)
```

### Extension Model

Five extension points:
1. **Parameter Resolution**: Provide test method parameters
2. **Conditional Test Execution**: Skip/enable tests dynamically
3. **Lifecycle Callbacks**: Hook into test lifecycle
4. **Test Instance Post-Processing**: Modify test instances
5. **Test Invocation Parameterization**: Customize test invocation

---

## Code Examples

### Basic Test Class

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Calculator Tests")
public class CalculatorTest {

    private Calculator calculator;

    // Runs before each test method
    @BeforeEach
    public void setUp() {
        calculator = new Calculator();
    }

    @Test
    @DisplayName("Should add two positive numbers correctly")
    public void testAddition() {
        int result = calculator.add(2, 3);
        assertEquals(5, result, "2 + 3 should equal 5");
    }

    @Test
    public void testDivisionByZero() {
        assertThrows(ArithmeticException.class,
            () -> calculator.divide(10, 0),
            "Division by zero should throw ArithmeticException");
    }

    @Test
    public void testTimeout() {
        assertTimeout(Duration.ofMillis(100),
            () -> calculator.expensiveOperation());
    }
}
```

### Parameterized Tests

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ArgumentsSource;

public class ParameterizedCalculatorTest {

    private Calculator calculator = new Calculator();

    // Simple value source
    @ParameterizedTest
    @ValueSource(ints = { 1, 2, 3, 4, 5 })
    public void testPositiveNumbers(int value) {
        assertTrue(calculator.isPositive(value));
    }

    // CSV source for multiple parameters
    @ParameterizedTest
    @CsvSource({
        "1, 1, 2",
        "2, 3, 5",
        "10, 20, 30"
    })
    public void testAdditionWithCSV(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    // Method source for complex data
    @ParameterizedTest
    @MethodSource("provideArithmeticData")
    public void testWithMethodSource(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }

    static Stream<Arguments> provideArithmeticData() {
        return Stream.of(
            arguments(0, 0, 0),
            arguments(5, 3, 8),
            arguments(-1, -1, -2)
        );
    }

    // Custom argument provider
    @ParameterizedTest
    @ArgumentsSource(CustomCalculatorProvider.class)
    public void testWithCustomProvider(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }
}

class CustomCalculatorProvider implements ArgumentsProvider {
    @Override
    public Stream<? extends Arguments> provideArguments(ExtensionContext context) {
        return Stream.of(
            arguments(10, 20, 30),
            arguments(5, 5, 10)
        );
    }
}
```

### Test Lifecycle and Setup/Teardown

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;

public class LifecycleTest {

    // Runs once before all tests - must be static
    @BeforeAll
    static void initializeDatabase() {
        System.out.println("Setting up shared resources...");
        // Initialize expensive resources (DB connection, etc.)
    }

    // Runs after all tests - must be static
    @AfterAll
    static void cleanupDatabase() {
        System.out.println("Cleaning up shared resources...");
        // Close DB connections, cleanup files, etc.
    }

    // Runs before each test method
    @BeforeEach
    void setUp() {
        System.out.println("Setup before test");
        // Initialize test-specific data
    }

    // Runs after each test method
    @AfterEach
    void tearDown() {
        System.out.println("Teardown after test");
        // Cleanup test-specific resources
    }

    @Test
    void firstTest() {
        System.out.println("Running first test");
    }

    @Test
    void secondTest() {
        System.out.println("Running second test");
    }

    // Output order:
    // initializeDatabase() [once]
    // setUp()
    // Running first test
    // tearDown()
    // setUp()
    // Running second test
    // tearDown()
    // cleanupDatabase() [once]
}
```

### Nested Tests

```java
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("Stack Tests")
public class StackTest {

    @Nested
    @DisplayName("When new")
    class WhenNew {
        Stack<Integer> stack;

        @BeforeEach
        void setUp() {
            stack = new Stack<>();
        }

        @Test
        @DisplayName("Is empty")
        void isEmpty() {
            assertTrue(stack.isEmpty());
        }

        @Test
        @DisplayName("Throws exception when popped")
        void throwsExceptionWhenPopped() {
            assertThrows(EmptyStackException.class, () -> stack.pop());
        }
    }

    @Nested
    @DisplayName("When not empty")
    class WhenNotEmpty {
        Stack<Integer> stack;

        @BeforeEach
        void setUp() {
            stack = new Stack<>();
            stack.push(1);
        }

        @Test
        @DisplayName("Is not empty")
        void isNotEmpty() {
            assertFalse(stack.isEmpty());
        }

        @Test
        @DisplayName("Returns element when popped")
        void returnsElementWhenPopped() {
            assertEquals(1, stack.pop());
        }
    }
}
```

### Advanced Assertions

```java
import static org.junit.jupiter.api.Assertions.*;

public class AssertionsTest {

    @Test
    public void testAssertAll() {
        // All assertions run; failures are accumulated
        assertAll("Person validation",
            () -> assertEquals("John", person.getFirstName()),
            () -> assertEquals("Doe", person.getLastName()),
            () -> assertTrue(person.getAge() > 0)
        );
    }

    @Test
    public void testArrayEquals() {
        int[] expected = {1, 2, 3};
        int[] actual = {1, 2, 3};
        assertArrayEquals(expected, actual);
    }

    @Test
    public void testIterableEquals() {
        Iterable<Integer> expected = asList(1, 2, 3);
        Iterable<Integer> actual = asList(1, 2, 3);
        assertIterableEquals(expected, actual);
    }

    @Test
    public void testLinesMatch() {
        List<String> expected = asList("foo", "bar");
        List<String> actual = asList("foo", "bar");
        assertLinesMatch(expected, actual);
    }

    @Test
    public void testThrowsAndGetException() {
        Exception exception = assertThrows(
            IllegalArgumentException.class,
            () -> {
                throw new IllegalArgumentException("Invalid value");
            }
        );
        assertEquals("Invalid value", exception.getMessage());
    }

    @Test
    public void testDoesNotThrow() {
        assertDoesNotThrow(() -> {
            // Code that should not throw
            int result = 5 / 2;
        });
    }
}
```

### Extensions and Custom Test Execution

```java
import org.junit.jupiter.api.extension.Extension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;

// Custom Extension
public class DatabaseExtension implements BeforeEachCallback {

    @Override
    public void beforeEach(ExtensionContext context) throws Exception {
        System.out.println("Initializing test database for: " +
            context.getDisplayName());
        // Initialize database
    }
}

// Using the extension
@ExtendWith(DatabaseExtension.class)
public class UserRepositoryTest {

    @Test
    public void testFindUserById() {
        // Database is automatically initialized before this test
        User user = userRepository.findById(1);
        assertNotNull(user);
    }
}

// Conditional test execution
public class ConditionalTest {

    @Test
    @EnabledOnOs(OS.WINDOWS)
    public void runOnlyOnWindows() {
        // This test only runs on Windows
    }

    @Test
    @DisabledIf("isCI")
    public void runLocally() {
        // Runs only if isCI() returns false
    }

    static boolean isCI() {
        return "true".equals(System.getenv("CI"));
    }
}
```

### Integration with Mockito

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void testGetUserById() {
        // Arrange
        User expectedUser = new User(1, "John");
        when(userRepository.findById(1)).thenReturn(expectedUser);

        // Act
        User actualUser = userService.getUserById(1);

        // Assert
        assertNotNull(actualUser);
        assertEquals("John", actualUser.getName());
        verify(userRepository, times(1)).findById(1);
    }
}
```

---

## Best Practices

### **Test Naming Conventions**

```java
// Good: Descriptive names indicating behavior
public void testAddingTwoPositiveNumbers() { }
public void testDivisionByZeroThrowsException() { }

// Better: Using @DisplayName for clarity
@Test
@DisplayName("should return true when comparing equal objects")
public void testEquals() { }
```

### **Arrange-Act-Assert Pattern**

```java
@Test
public void shouldCalculateCompoundInterest() {
    // Arrange - Setup
    double principal = 1000;
    double rate = 5.0;
    int years = 2;

    // Act - Execute
    double result = calculator.compoundInterest(principal, rate, years);

    // Assert - Verify
    assertEquals(1102.50, result, 0.01);
}
```

### **One Assertion Per Test (or assertAll)**

```java
// Avoid multiple independent assertions
@Test
public void badTest() {
    assertEquals(5, calculator.add(2, 3));
    assertEquals(1, calculator.subtract(3, 2));
    assertEquals(6, calculator.multiply(2, 3));
}

// Better: Separate tests
@Test
public void testAddition() {
    assertEquals(5, calculator.add(2, 3));
}

@Test
public void testSubtraction() {
    assertEquals(1, calculator.subtract(3, 2));
}

// Or use assertAll for related assertions
@Test
public void testCalculator() {
    assertAll(
        () -> assertEquals(5, calculator.add(2, 3)),
        () -> assertEquals(1, calculator.subtract(3, 2)),
        () -> assertEquals(6, calculator.multiply(2, 3))
    );
}
```

### **Meaningful Test Data**

```java
// Avoid magic numbers
@Test
public void badTest() {
    assertEquals(150, calculator.calculateTax(1000, 0.15));
}

// Better: Use named variables
@Test
public void shouldCalculateTaxCorrectly() {
    double amount = 1000.00;
    double taxRate = 0.15;
    double expectedTax = 150.00;

    double actualTax = calculator.calculateTax(amount, taxRate);
    assertEquals(expectedTax, actualTax);
}
```

### **Test Organization**

```java
@DisplayName("UserService")
public class UserServiceTest {

    @Nested
    @DisplayName("when creating a user")
    class CreationTests {

        @Test
        @DisplayName("should persist to database")
        void testPersistence() { }

        @Test
        @DisplayName("should validate email format")
        void testEmailValidation() { }
    }

    @Nested
    @DisplayName("when updating a user")
    class UpdateTests {

        @Test
        @DisplayName("should update all fields")
        void testFieldUpdate() { }
    }
}
```

### **Use Fixtures and Setup Methods**

```java
@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock
    private PaymentGateway paymentGateway;

    @InjectMocks
    private PaymentService paymentService;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        testUser = new User(1, "John Doe");
        testOrder = new Order(100, "USD");
    }

    @Test
    void shouldProcessPayment() {
        when(paymentGateway.charge(any())).thenReturn(true);

        boolean result = paymentService.processPayment(testUser, testOrder);

        assertTrue(result);
    }
}
```

### **Avoid Test Interdependence**

```java
// Bad: Tests depend on execution order
private static List<User> users;

@Test
void testAddUser() {
    users.add(new User(1, "Alice"));
}

@Test
void testUserCount() {
    assertEquals(1, users.size()); // Depends on testAddUser running first
}

// Good: Each test is independent
@Test
void testAddUser() {
    List<User> users = new ArrayList<>();
    users.add(new User(1, "Alice"));
    assertEquals(1, users.size());
}

@Test
void testRemoveUser() {
    List<User> users = new ArrayList<>();
    users.add(new User(1, "Alice"));
    users.remove(0);
    assertEquals(0, users.size());
}
```

### **Test Edge Cases**

```java
@DisplayName("Division Tests")
public class DivisionTest {

    @Test
    void dividingByPositiveNumber() {
        assertEquals(2, calculator.divide(6, 3));
    }

    @Test
    void dividingNegativeNumbers() {
        assertEquals(-2, calculator.divide(-6, 3));
    }

    @Test
    void dividingByZeroThrowsException() {
        assertThrows(ArithmeticException.class,
            () -> calculator.divide(10, 0));
    }

    @Test
    void dividingZeroByNumber() {
        assertEquals(0, calculator.divide(0, 5));
    }
}
```

---

## Common Pitfalls

### **Forgetting to Add JUnit Dependencies**

```xml
<!-- Maven pom.xml - REQUIRED -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-api</artifactId>
    <version>5.9.2</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter-engine</artifactId>
    <version>5.9.2</version>
    <scope>test</scope>
</dependency>
```

### **Using JUnit 4 Syntax in JUnit 5**

```java
// Wrong: JUnit 4 @RunWith annotation won't work with Jupiter
@RunWith(SpringRunner.class)
public class MyTest { }

// Correct: Use JUnit 5 @ExtendWith
@ExtendWith(SpringExtension.class)
public class MyTest { }
```

### **Mutable Test Data**

```java
// Bad: Shared mutable state
private List<String> list = new ArrayList<>();

@BeforeEach
void setup() {
    // list is never cleared, can cause test pollution
    list.add("item");
}

// Good: Create fresh instance
@BeforeEach
void setup() {
    list = new ArrayList<>();
    list.add("item");
}
```

### **Testing Implementation Details**

```java
// Bad: Testing private methods directly
@Test
void testPrivateMethod() {
    // Can't easily test private methods and shouldn't
}

// Good: Test through public interface
@Test
void testPublicBehavior() {
    // Test what the class is supposed to do
    result = publicMethod();
    assertExpectedBehavior(result);
}
```

### **Ignoring Test Failures**

```java
// Bad: Ignoring important test failures
@Disabled("Fix this later")
@Test
void criticalTest() { }

// Better: Remove @Disabled when fixing
@Test
void criticalTest() { }
```

### **Not Using Parameterized Tests**

```java
// Bad: Duplicated test logic
@Test void testWithOne() { assertEquals(true, isValid(1)); }
@Test void testWithTwo() { assertEquals(true, isValid(2)); }
@Test void testWithThree() { assertEquals(true, isValid(3)); }

// Good: Use @ParameterizedTest
@ParameterizedTest
@ValueSource(ints = {1, 2, 3})
void testValidNumbers(int value) {
    assertTrue(isValid(value));
}
```

### **Asserting on Exception Type Only**

```java
// Bad: Only checks exception type
@Test
void testException() {
    assertThrows(IllegalArgumentException.class, () -> {
        throw new IllegalArgumentException("Bad input");
    });
}

// Better: Verify exception message
@Test
void testException() {
    IllegalArgumentException ex = assertThrows(
        IllegalArgumentException.class,
        () -> { throw new IllegalArgumentException("Bad input"); }
    );
    assertEquals("Bad input", ex.getMessage());
}
```

### **Mixing Test Logic with Production Code**

```java
// Bad: Test code in production
public class Calculator {
    public int add(int a, int b) {
        if (a < 0 || b < 0) {
            return -1; // Special value for tests
        }
        return a + b;
    }
}

// Good: Keep production and test code separate
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}

public class CalculatorTest {
    @Test
    void negativeNumberTest() {
        assertEquals(-5, calculator.add(-2, -3));
    }
}
```

---

## Performance Considerations

### **Test Execution Time**

```java
@Test
@Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
public void shouldCompleteQuickly() {
    // Test must complete within 500ms
    computeResult();
}

// Preemptive timeout (interrupts if exceeded)
@Test
public void shouldNotTakeForever() {
    assertTimeoutPreemptively(Duration.ofSeconds(1), () -> {
        // This will be interrupted if it takes > 1 second
        sleepLongerThanTimeout();
    });
}
```

### **Reducing Setup Overhead**

```java
// Bad: Expensive operation repeated
@BeforeEach
void setup() {
    database = new DatabaseConnection(); // Slow
    loadLargeDataset(); // Slow
}

// Better: Use @BeforeAll for shared expensive resources
@BeforeAll
static void setUpClass() {
    // Initialize once for all tests
    sharedDatabase = new DatabaseConnection();
}

@BeforeEach
void setUp() {
    // Initialize only test-specific data
    testData = createSmallTestDataset();
}
```

### **Parallel Test Execution**

```java
// Enable in junit-platform.properties
junit.jupiter.execution.parallel.enabled=true
junit.jupiter.execution.parallel.mode.default=concurrent

// Or use annotations
@Execution(ExecutionMode.CONCURRENT)
public class ConcurrentTest {

    @Test
    void test1() { }

    @Test
    void test2() { }
}
```

### **Test Filtering and Selection**

```bash
# Run only tests matching a tag
mvn test -Dgroups=unit

# Run specific test class
mvn test -Dtest=CalculatorTest

# Run tests matching pattern
mvn test -Dtest=Calculator*Test
```

### **Caching Expensive Computations**

```java
@ExtendWith(DatabaseExtension.class)
public class RepositoryTest {

    private static Map<String, Object> cache;

    @BeforeAll
    static void initCache() {
        cache = new HashMap<>();
        cache.put("users", loadAllUsers()); // Load once
    }

    @Test
    void testFindUser() {
        User user = (User) cache.get("users");
        assertNotNull(user);
    }
}
```

---

## Real-world Scenarios

### Scenario 1: Testing a Spring Boot Service

```java
@SpringBootTest
@ExtendWith(MockitoExtension.class)
public class OrderServiceTest {

    @MockBean
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    private Order testOrder;

    @BeforeEach
    void setUp() {
        testOrder = new Order(1, "Widget", 99.99);
    }

    @Test
    void shouldCreateOrder() {
        when(orderRepository.save(any())).thenReturn(testOrder);

        Order result = orderService.createOrder("Widget", 99.99);

        assertNotNull(result);
        assertEquals("Widget", result.getProductName());
        verify(orderRepository).save(any());
    }

    @Test
    void shouldCalculateTotal() {
        Order order = new Order(1, "Widget", 99.99, 2);

        double total = orderService.calculateTotal(order);

        assertEquals(199.98, total, 0.01);
    }

    @ParameterizedTest
    @ValueSource(doubles = {10.0, 50.0, 100.0, 999.99})
    void shouldApplyDiscountCorrectly(double amount) {
        double discountedPrice = orderService.applyDiscount(amount, 0.1);

        assertTrue(discountedPrice < amount);
        assertEquals(amount * 0.9, discountedPrice, 0.01);
    }
}
```

### Scenario 2: Testing Database Operations

```java
@SpringBootTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TestEntityManager entityManager;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("john@example.com", "John Doe", 25);
        entityManager.persistAndFlush(testUser);
    }

    @Test
    void shouldFindUserByEmail() {
        User found = userRepository.findByEmail("john@example.com");

        assertNotNull(found);
        assertEquals("John Doe", found.getName());
    }

    @Test
    void shouldFindUsersByAge() {
        List<User> users = userRepository.findByAgeGreaterThan(20);

        assertFalse(users.isEmpty());
        assertTrue(users.stream()
            .allMatch(u -> u.getAge() > 20));
    }

    @Test
    void shouldDeleteUser() {
        userRepository.delete(testUser);

        User found = userRepository.findByEmail("john@example.com");
        assertNull(found);
    }

    @AfterEach
    void cleanUp() {
        entityManager.clear();
    }
}
```

### Scenario 3: Testing REST Controllers

```java
@SpringBootTest
@AutoConfigureMockMvc
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("GET /users/{id} returns user")
    void shouldGetUserById() throws Exception {
        User user = new User(1, "John Doe");
        when(userService.getUserById(1)).thenReturn(user);

        mockMvc.perform(get("/users/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("John Doe"))
            .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @DisplayName("POST /users creates new user")
    void shouldCreateUser() throws Exception {
        User newUser = new User("jane@example.com", "Jane Doe");
        when(userService.createUser(any())).thenReturn(newUser);

        mockMvc.perform(post("/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"jane@example.com\",\"name\":\"Jane Doe\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("jane@example.com"));
    }

    @Test
    @DisplayName("DELETE /users/{id} removes user")
    void shouldDeleteUser() throws Exception {
        doNothing().when(userService).deleteUser(1);

        mockMvc.perform(delete("/users/1"))
            .andExpect(status().isNoContent());

        verify(userService).deleteUser(1);
    }
}
```

### Scenario 4: Complex Parameterized Testing

```java
@DisplayName("Password Validation Tests")
public class PasswordValidatorTest {

    private PasswordValidator validator;

    @BeforeEach
    void setUp() {
        validator = new PasswordValidator();
    }

    @Nested
    @DisplayName("Valid passwords")
    class ValidPasswordTests {

        @ParameterizedTest
        @CsvSource({
            "MySecure123!,     true",
            "Pass@Word2024,     true",
            "Complex#Pass99,    true"
        })
        @DisplayName("should accept passwords meeting requirements")
        void testValidPasswords(String password, boolean expected) {
            assertTrue(validator.isValid(password));
        }
    }

    @Nested
    @DisplayName("Invalid passwords")
    class InvalidPasswordTests {

        @ParameterizedTest
        @CsvSource({
            "short,           true",
            "nouppercase123!,  true",
            "NOLOWERCASE123!,  true",
            "NoNumbers!,       true",
            "NoSpecial123,     true"
        })
        @DisplayName("should reject passwords not meeting requirements")
        void testInvalidPasswords(String password, boolean shouldFail) {
            assertFalse(validator.isValid(password));
        }
    }

    @Nested
    @DisplayName("Edge cases")
    class EdgeCaseTests {

        @ParameterizedTest
        @ValueSource(strings = {"", null, "   "})
        @DisplayName("should reject empty or null passwords")
        void testEmptyPasswords(String password) {
            assertFalse(validator.isValid(password));
        }
    }
}
```

---

## Interview Points

### Q1: What are the main differences between JUnit 4 and JUnit 5?

**Answer:**
- **Architecture**: JUnit 5 has modular design (Platform, Jupiter, Vintage) vs. JUnit 4's monolithic
- **Annotations**: `@BeforeClass`/`@AfterClass` → `@BeforeAll`/`@AfterAll`; `@Before`/`@After` → `@BeforeEach`/`@AfterEach`
- **Extensibility**: Jupiter's extension model replaces JUnit 4's RunWith/Rule
- **Java 8+**: Full support for lambdas and streams
- **Parameterized Tests**: Cleaner syntax with `@ParameterizedTest` vs. `@Parameters`
- **Backward Compatibility**: JUnit Vintage runs JUnit 3 and 4 tests

### Q2: How does the test lifecycle work in JUnit 5?

**Answer:**
For each test method:
1. Test class instantiated
2. `@BeforeAll` executes once per class
3. Per-test iteration:
   - `@BeforeEach` executes
   - `@Test` method executes
   - `@AfterEach` executes
4. `@AfterAll` executes once per class

### Q3: What is the difference between @BeforeEach and @BeforeAll?

**Answer:**
- `@BeforeAll`: Executes once per test class (must be static); use for expensive, shared setup
- `@BeforeEach`: Executes before each test method; use for test-specific setup
- `@BeforeAll` is better for database connections, static data loads
- `@BeforeEach` is better for resetting mocks, clearing collections

### Q4: How do parameterized tests work?

**Answer:**
Use `@ParameterizedTest` with parameter sources:
- `@ValueSource`: Simple values (int, String, etc.)
- `@CsvSource`: CSV formatted data
- `@MethodSource`: Data from static method
- `@ArgumentsSource`: Custom ArgumentsProvider implementation

### Q5: What is an Extension in JUnit 5?

**Answer:**
Extensions are reusable testing utilities that hook into the test lifecycle via:
- `ParameterResolver`: Provides test method parameters
- `TestInstancePostProcessor`: Modifies test instances
- `BeforeEachCallback`/`AfterEachCallback`: Lifecycle hooks
- `ConditionEvaluationExtension`: Conditional test execution
- `InvocationInterceptor`: Custom test invocation

### Q6: How do you handle expected exceptions?

**Answer:**
```java
// Verify exception type and message
IllegalArgumentException ex = assertThrows(
    IllegalArgumentException.class,
    () -> method.thatThrowsException()
);
assertEquals("Expected message", ex.getMessage());
```

### Q7: What's the purpose of @DisplayName?

**Answer:**
`@DisplayName` provides human-readable test names in reports and IDEs:
```java
@Test
@DisplayName("should calculate total correctly with discount")
void testCalculateTotal() { }
```

### Q8: How do you test asynchronous code?

**Answer:**
```java
@Test
void testAsyncOperation() {
    CompletableFuture<String> future = asyncMethod();

    String result = assertDoesNotThrow(() ->
        future.get(5, TimeUnit.SECONDS));

    assertEquals("expected", result);
}
```

### Q9: What are best practices for test isolation?

**Answer:**
- Each test should be independent
- Use `@BeforeEach` to create fresh fixtures
- Avoid static shared mutable state
- Don't depend on test execution order
- Use `@Nested` to organize related tests

### Q10: How does mocking integrate with JUnit 5?

**Answer:**
Using `MockitoExtension`:
```java
@ExtendWith(MockitoExtension.class)
public class MyTest {
    @Mock private Dependency dependency;
    @InjectMocks private Service service;
}
```

---

## Further Reading

### Official Documentation
- [JUnit 5 Official Documentation](https://junit.org/junit5/docs/current/user-guide/)
- [JUnit 5 API Javadoc](https://junit.org/junit5/docs/current/api/)
- [JUnit Platform Documentation](https://junit.org/junit5/docs/current/user-guide/#junit-platform)

### Extended Learning Resources
- [Mockito Documentation](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)
- [AssertJ - Fluent Assertions](https://assertj.github.io/assertj-core/)
- [Spring Boot Testing Guide](https://spring.io/guides/gs/testing-web/)
- [TestContainers - Integration Testing](https://www.testcontainers.org/)

### Books
- "JUnit in Action" (Third Edition) - Petar Tahchiev, Felipe Leme
- "Growing Object-Oriented Software, Guided by Tests" - Steve Freeman, Nat Pryce
- "Test-Driven Development: By Example" - Kent Beck

### Articles and Tutorials
- [Baeldung JUnit 5 Tutorials](https://www.baeldung.com/junit-5)
- [DZone JUnit 5 Best Practices](https://dzone.com/articles/best-practices-for-unit-testing-in-java)
- [Test-Driven Development Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

### Related Topics
- **Unit Testing Best Practices**: Arrange-Act-Assert, single responsibility
- **Test-Driven Development (TDD)**: Red-Green-Refactor cycle
- **Integration Testing**: Testing multiple components together
- **Performance Testing**: Load and stress testing with JMeter
- **Continuous Integration**: Automated testing in CI/CD pipelines

---

## Summary

JUnit 5 is a modern, extensible testing framework that provides:
- Clear, annotation-driven test definitions
- Flexible lifecycle management
- Powerful parameterization capabilities
- Rich assertion library
- Extensible architecture for custom behaviors
- Seamless integration with modern Java and frameworks

By following best practices—using descriptive names, organizing with `@Nested`, leveraging parameterized tests, and maintaining test independence—you can create robust, maintainable test suites that provide confidence in your code quality and serve as executable documentation of your system's behavior.
