---
title: Java JUnit 5 Testing
description: Master JUnit 5 for Java unit testing including assertions, lifecycle, parameterized tests and extensions
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - JUnit
  - testing
  - TDD
status: imported
origin: old/src/content/docs/java/junit.en.md
divergence: 0.333
issues: []
legacy:
  category: Java
  subcategory: Testing
  order: 23
  lastUpdated: 2026-01-07
---

JUnit 5 is the next generation of the most popular Java testing framework. It provides a modern foundation for developer-side testing on the JVM, featuring a flexible architecture, rich set of annotations, powerful assertions, and an extensible extension model.

## Overview

JUnit 5 is composed of three main modules:

- **JUnit Platform**: Foundation for launching testing frameworks on the JVM
- **JUnit Jupiter**: New programming model and extension model for JUnit 5
- **JUnit Vintage**: Provides backward compatibility with JUnit 3 and JUnit 4

### Key Features

- **Modern annotations**: `@Test`, `@BeforeEach`, `@AfterEach`, `@DisplayName`, etc.
- **Assertions**: Comprehensive assertion library with lambda support
- **Parameterized tests**: Run tests with different inputs
- **Nested tests**: Better organization of test classes
- **Extensions**: Powerful extension model replacing JUnit 4 runners and rules
- **Conditional test execution**: Enable/disable tests based on conditions

## Getting Started

### Maven Dependencies

```xml
<dependencies>
    <!-- JUnit 5 API -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-api</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>

    <!-- JUnit 5 Engine -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-engine</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>

    <!-- Parameterized Tests -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter-params</artifactId>
        <version>5.10.2</version>
        <scope>test</scope>
    </dependency>
</dependencies>

<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-surefire-plugin</artifactId>
            <version>3.2.5</version>
        </plugin>
    </plugins>
</build>
```

### Gradle Dependencies

```groovy
plugins {
    id 'java'
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.2'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

test {
    useJUnitPlatform()
}
```

### First Test

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Calculator Tests")
class CalculatorTest {

    private final Calculator calculator = new Calculator();

    @Test
    @DisplayName("Should add two positive numbers correctly")
    void shouldAddTwoPositiveNumbers() {
        // Arrange
        int a = 5;
        int b = 3;

        // Act
        int result = calculator.add(a, b);

        // Assert
        assertEquals(8, result, "5 + 3 should equal 8");
    }

    @Test
    @DisplayName("Should subtract correctly")
    void shouldSubtract() {
        assertEquals(2, calculator.subtract(5, 3));
    }

    @Test
    @DisplayName("Should throw exception when dividing by zero")
    void shouldThrowExceptionWhenDividingByZero() {
        assertThrows(ArithmeticException.class,
            () -> calculator.divide(10, 0));
    }
}

// Calculator class
class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public int subtract(int a, int b) {
        return a - b;
    }

    public int multiply(int a, int b) {
        return a * b;
    }

    public int divide(int a, int b) {
        if (b == 0) {
            throw new ArithmeticException("Cannot divide by zero");
        }
        return a / b;
    }
}
```

## Basic Annotations

### Test Method Annotations

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class BasicAnnotationsTest {

    @Test
    @DisplayName("A simple test")
    void simpleTest() {
        assertTrue(true);
    }

    @Test
    @Disabled("Disabled until bug #42 is fixed")
    void disabledTest() {
        fail("This test is disabled and should not run");
    }

    @Test
    @Tag("slow")
    @Tag("integration")
    void taggedTest() {
        // Test with tags for filtering
    }

    @RepeatedTest(value = 3, name = "{displayName} - repetition {currentRepetition}/{totalRepetitions}")
    @DisplayName("Repeated test")
    void repeatedTest(RepetitionInfo repetitionInfo) {
        System.out.println("Execution #" + repetitionInfo.getCurrentRepetition());
        assertTrue(repetitionInfo.getCurrentRepetition() <= 3);
    }

    @Test
    @Timeout(value = 500, unit = java.util.concurrent.TimeUnit.MILLISECONDS)
    void testWithTimeout() throws InterruptedException {
        // This test will fail if it takes more than 500ms
        Thread.sleep(100);
    }
}
```

### Conditional Test Execution

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.*;
import static org.junit.jupiter.api.Assertions.*;

class ConditionalExecutionTest {

    // Operating System Conditions
    @Test
    @EnabledOnOs(OS.MAC)
    void onlyOnMac() {
        System.out.println("Running on Mac");
    }

    @Test
    @EnabledOnOs({OS.LINUX, OS.MAC})
    void onLinuxOrMac() {
        System.out.println("Running on Linux or Mac");
    }

    @Test
    @DisabledOnOs(OS.WINDOWS)
    void notOnWindows() {
        System.out.println("Not running on Windows");
    }

    // Java Runtime Version Conditions
    @Test
    @EnabledOnJre(JRE.JAVA_17)
    void onlyOnJava17() {
        System.out.println("Running on Java 17");
    }

    @Test
    @EnabledForJreRange(min = JRE.JAVA_11, max = JRE.JAVA_21)
    void fromJava11To21() {
        System.out.println("Running on Java 11-21");
    }

    // System Property Conditions
    @Test
    @EnabledIfSystemProperty(named = "os.arch", matches = ".*64.*")
    void onlyOn64BitArchitecture() {
        System.out.println("Running on 64-bit architecture");
    }

    // Environment Variable Conditions
    @Test
    @EnabledIfEnvironmentVariable(named = "ENV", matches = "staging|production")
    void onlyOnStagingOrProduction() {
        System.out.println("Running on staging or production");
    }

    // Custom Conditions
    @Test
    @EnabledIf("customCondition")
    void enabledIfCustomCondition() {
        System.out.println("Custom condition met");
    }

    boolean customCondition() {
        return System.getProperty("java.version").startsWith("17");
    }

    // Script-based Conditions (deprecated in newer versions)
    @Test
    @DisabledIf("Math.random() < 0.5")
    void sometimesDisabled() {
        System.out.println("This test runs sometimes");
    }
}
```

## Assertions

### Basic Assertions

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BasicAssertionsTest {

    @Test
    void standardAssertions() {
        // assertEquals
        assertEquals(4, 2 + 2);
        assertEquals(4, 2 + 2, "2 + 2 should equal 4");
        assertEquals(4.0, 4.0001, 0.001, "Floating point with delta");

        // assertNotEquals
        assertNotEquals(3, 2 + 2);

        // assertTrue / assertFalse
        assertTrue(5 > 4);
        assertTrue(() -> 5 > 4, "5 should be greater than 4");
        assertFalse(4 > 5);

        // assertNull / assertNotNull
        String nullString = null;
        String notNullString = "Hello";
        assertNull(nullString);
        assertNotNull(notNullString);

        // assertSame / assertNotSame (reference equality)
        String str1 = "Hello";
        String str2 = str1;
        String str3 = new String("Hello");
        assertSame(str1, str2);
        assertNotSame(str1, str3);

        // assertArrayEquals
        int[] expected = {1, 2, 3};
        int[] actual = {1, 2, 3};
        assertArrayEquals(expected, actual);

        // assertIterableEquals
        java.util.List<String> expectedList = java.util.Arrays.asList("A", "B", "C");
        java.util.List<String> actualList = java.util.Arrays.asList("A", "B", "C");
        assertIterableEquals(expectedList, actualList);
    }

    @Test
    void assertAllExample() {
        // assertAll groups multiple assertions
        // All assertions are executed, even if some fail
        String firstName = "John";
        String lastName = "Doe";
        int age = 30;

        assertAll("Person attributes",
            () -> assertEquals("John", firstName),
            () -> assertEquals("Doe", lastName),
            () -> assertTrue(age > 0),
            () -> assertTrue(age < 150)
        );
    }

    @Test
    void assertThrowsExample() {
        // Test for expected exceptions
        ArithmeticException exception = assertThrows(
            ArithmeticException.class,
            () -> divideByZero()
        );

        assertEquals("/ by zero", exception.getMessage());

        // assertThrowsExactly - must be exact exception type
        assertThrowsExactly(
            ArithmeticException.class,
            () -> divideByZero()
        );

        // assertDoesNotThrow
        assertDoesNotThrow(() -> {
            int result = 10 / 2;
        });
    }

    @Test
    void assertTimeoutExample() {
        // Test must complete within given duration
        assertTimeout(java.time.Duration.ofMillis(100), () -> {
            // This should complete quickly
            Thread.sleep(50);
        });

        // assertTimeoutPreemptively - aborts execution if timeout exceeded
        String result = assertTimeoutPreemptively(
            java.time.Duration.ofSeconds(1),
            () -> {
                Thread.sleep(100);
                return "completed";
            }
        );
        assertEquals("completed", result);
    }

    @Test
    void assertInstanceOfExample() {
        Object value = "Hello";

        // assertInstanceOf (JUnit 5.8+)
        String result = assertInstanceOf(String.class, value);
        assertEquals("Hello", result);
    }

    private int divideByZero() {
        return 1 / 0;
    }
}
```

### Advanced Assertions

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class AdvancedAssertionsTest {

    @Test
    void assertLinesMatchExample() {
        // assertLinesMatch for comparing lists of strings
        java.util.List<String> expected = java.util.Arrays.asList(
            "First line",
            ">> skip >>",       // Skip multiple lines
            ".*pattern.*",      // Regular expression
            "Last line"
        );

        java.util.List<String> actual = java.util.Arrays.asList(
            "First line",
            "Skipped line 1",
            "Skipped line 2",
            "This matches pattern here",
            "Last line"
        );

        assertLinesMatch(expected, actual);
    }

    @Test
    void lazyMessageEvaluation() {
        // Use lambda for expensive message generation
        Object heavyObject = new Object();

        assertNotNull(
            heavyObject,
            () -> "This message is only computed if assertion fails: " +
                  computeExpensiveDebugInfo()
        );
    }

    @Test
    void failExplicitly() {
        String status = "UNKNOWN";

        switch (status) {
            case "ACTIVE":
                // handle active
                break;
            case "INACTIVE":
                // handle inactive
                break;
            default:
                fail("Unexpected status: " + status);
        }
    }

    private String computeExpensiveDebugInfo() {
        // Simulate expensive operation
        return "Debug information";
    }
}
```

### Third-Party Assertion Libraries

```java
import org.junit.jupiter.api.Test;

// AssertJ - Fluent assertions
import static org.assertj.core.api.Assertions.*;

// Hamcrest matchers
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

class ThirdPartyAssertionsTest {

    @Test
    void assertJExample() {
        // AssertJ provides fluent, readable assertions
        String name = "John Doe";

        assertThat(name)
            .isNotNull()
            .startsWith("John")
            .endsWith("Doe")
            .contains(" ")
            .hasSize(8);

        // Collection assertions
        java.util.List<String> names = java.util.Arrays.asList("John", "Jane", "Bob");

        assertThat(names)
            .hasSize(3)
            .contains("John", "Jane")
            .doesNotContain("Alice")
            .containsExactly("John", "Jane", "Bob")
            .containsExactlyInAnyOrder("Bob", "John", "Jane");

        // Exception assertions
        assertThatThrownBy(() -> {
            throw new IllegalArgumentException("Invalid argument");
        })
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid argument")
            .hasMessageContaining("Invalid");

        // Object assertions
        Person person = new Person("John", 30);

        assertThat(person)
            .extracting(Person::getName, Person::getAge)
            .containsExactly("John", 30);
    }

    @Test
    void hamcrestExample() {
        // Hamcrest provides matcher-based assertions
        String greeting = "Hello, World!";

        assertThat(greeting, is("Hello, World!"));
        assertThat(greeting, startsWith("Hello"));
        assertThat(greeting, endsWith("World!"));
        assertThat(greeting, containsString("World"));
        assertThat(greeting, not(emptyString()));

        // Number matchers
        int value = 42;
        assertThat(value, is(equalTo(42)));
        assertThat(value, greaterThan(40));
        assertThat(value, lessThanOrEqualTo(50));
        assertThat(value, allOf(greaterThan(40), lessThan(50)));

        // Collection matchers
        java.util.List<Integer> numbers = java.util.Arrays.asList(1, 2, 3, 4, 5);

        assertThat(numbers, hasSize(5));
        assertThat(numbers, hasItem(3));
        assertThat(numbers, hasItems(1, 2, 3));
        assertThat(numbers, everyItem(greaterThan(0)));
        assertThat(numbers, not(hasItem(6)));
    }

    static class Person {
        private final String name;
        private final int age;

        Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() { return name; }
        public int getAge() { return age; }
    }
}
```

## Test Lifecycle

### Lifecycle Methods

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@TestInstance(TestInstance.Lifecycle.PER_CLASS)  // Share instance across tests
class LifecycleTest {

    private static java.sql.Connection connection;
    private java.util.List<String> testData;

    @BeforeAll
    static void setUpClass() {
        System.out.println("@BeforeAll - Run once before all tests");
        // Initialize expensive resources
        // connection = DriverManager.getConnection(...);
    }

    @AfterAll
    static void tearDownClass() {
        System.out.println("@AfterAll - Run once after all tests");
        // Clean up expensive resources
        // connection.close();
    }

    @BeforeEach
    void setUp() {
        System.out.println("@BeforeEach - Run before each test");
        testData = new java.util.ArrayList<>();
        testData.add("Initial data");
    }

    @AfterEach
    void tearDown() {
        System.out.println("@AfterEach - Run after each test");
        testData.clear();
    }

    @Test
    void firstTest() {
        System.out.println("First test running");
        testData.add("First");
        assertEquals(2, testData.size());
    }

    @Test
    void secondTest() {
        System.out.println("Second test running");
        testData.add("Second");
        assertEquals(2, testData.size());  // Still 2, not 3
    }
}
```

### Test Execution Order

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.MethodOrderer.*;

// Order by method name
@TestMethodOrder(MethodName.class)
class OrderedByNameTest {
    @Test void a_firstTest() { }
    @Test void b_secondTest() { }
    @Test void c_thirdTest() { }
}

// Order by @Order annotation
@TestMethodOrder(OrderAnnotation.class)
class OrderedByAnnotationTest {
    @Test @Order(3) void thirdTest() { }
    @Test @Order(1) void firstTest() { }
    @Test @Order(2) void secondTest() { }
}

// Random order
@TestMethodOrder(Random.class)
class RandomOrderTest {
    @Test void testA() { }
    @Test void testB() { }
    @Test void testC() { }
}

// Custom order
@TestMethodOrder(DisplayName.class)
class OrderedByDisplayNameTest {
    @Test @DisplayName("C - Third") void testC() { }
    @Test @DisplayName("A - First") void testA() { }
    @Test @DisplayName("B - Second") void testB() { }
}
```

### Test Instance Lifecycle

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

// Default: New instance for each test method
class DefaultLifecycleTest {
    private int counter = 0;

    @Test
    void test1() {
        counter++;
        assertEquals(1, counter);  // Always starts at 1
    }

    @Test
    void test2() {
        counter++;
        assertEquals(1, counter);  // Always starts at 1
    }
}

// PER_CLASS: Same instance for all test methods
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class PerClassLifecycleTest {
    private int counter = 0;

    @Test
    @Order(1)
    void test1() {
        counter++;
        assertEquals(1, counter);
    }

    @Test
    @Order(2)
    void test2() {
        counter++;
        assertEquals(2, counter);  // Counter persists
    }

    // With PER_CLASS, @BeforeAll and @AfterAll can be non-static
    @BeforeAll
    void beforeAll() {
        System.out.println("Non-static @BeforeAll");
    }
}
```

## Nested Tests

Nested tests allow better organization of test classes, especially for behavior-driven testing.

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("A Stack")
class StackTest {

    private java.util.Stack<String> stack;

    @Nested
    @DisplayName("when new")
    class WhenNew {

        @BeforeEach
        void createNewStack() {
            stack = new java.util.Stack<>();
        }

        @Test
        @DisplayName("is empty")
        void isEmpty() {
            assertTrue(stack.isEmpty());
        }

        @Test
        @DisplayName("throws EmptyStackException when popped")
        void throwsExceptionWhenPopped() {
            assertThrows(java.util.EmptyStackException.class, () -> stack.pop());
        }

        @Test
        @DisplayName("throws EmptyStackException when peeked")
        void throwsExceptionWhenPeeked() {
            assertThrows(java.util.EmptyStackException.class, () -> stack.peek());
        }

        @Nested
        @DisplayName("after pushing an element")
        class AfterPushing {

            private String element = "element";

            @BeforeEach
            void pushElement() {
                stack.push(element);
            }

            @Test
            @DisplayName("is no longer empty")
            void isNotEmpty() {
                assertFalse(stack.isEmpty());
            }

            @Test
            @DisplayName("returns the element when popped")
            void returnElementWhenPopped() {
                assertEquals(element, stack.pop());
            }

            @Test
            @DisplayName("returns the element when peeked but remains non-empty")
            void returnElementWhenPeeked() {
                assertEquals(element, stack.peek());
                assertFalse(stack.isEmpty());
            }

            @Nested
            @DisplayName("after pushing another element")
            class AfterPushingAnother {

                private String anotherElement = "another";

                @BeforeEach
                void pushAnother() {
                    stack.push(anotherElement);
                }

                @Test
                @DisplayName("returns the second element when popped")
                void returnsSecondElementWhenPopped() {
                    assertEquals(anotherElement, stack.pop());
                }

                @Test
                @DisplayName("has size of 2")
                void hasSizeOfTwo() {
                    assertEquals(2, stack.size());
                }
            }
        }
    }
}
```

## Parameterized Tests

Parameterized tests allow running the same test with different arguments.

### Basic Parameterized Tests

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;

class ParameterizedTestsTest {

    // @ValueSource - Simple values
    @ParameterizedTest
    @ValueSource(strings = {"racecar", "radar", "level", "rotor"})
    void palindromesTest(String candidate) {
        assertTrue(isPalindrome(candidate));
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5})
    void positiveNumbers(int number) {
        assertTrue(number > 0);
    }

    @ParameterizedTest
    @ValueSource(doubles = {1.0, 2.0, 3.14, 100.0})
    void doubleValues(double value) {
        assertTrue(value > 0);
    }

    // @NullSource, @EmptySource, @NullAndEmptySource
    @ParameterizedTest
    @NullSource
    void nullStrings(String text) {
        assertNull(text);
    }

    @ParameterizedTest
    @EmptySource
    void emptyStrings(String text) {
        assertTrue(text.isEmpty());
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t", "\n"})
    void nullEmptyAndBlankStrings(String text) {
        assertTrue(text == null || text.trim().isEmpty());
    }

    // @EnumSource
    @ParameterizedTest
    @EnumSource(java.time.Month.class)
    void allMonths(java.time.Month month) {
        assertNotNull(month);
    }

    @ParameterizedTest
    @EnumSource(value = java.time.Month.class, names = {"JANUARY", "FEBRUARY", "MARCH"})
    void firstQuarterMonths(java.time.Month month) {
        int monthValue = month.getValue();
        assertTrue(monthValue >= 1 && monthValue <= 3);
    }

    @ParameterizedTest
    @EnumSource(value = java.time.Month.class, mode = EnumSource.Mode.EXCLUDE,
                names = {"JANUARY", "FEBRUARY"})
    void excludeFirstTwoMonths(java.time.Month month) {
        assertTrue(month.getValue() > 2);
    }

    @ParameterizedTest
    @EnumSource(value = java.time.Month.class, mode = EnumSource.Mode.MATCH_ALL,
                names = "^.*BER$")
    void monthsEndingWithBer(java.time.Month month) {
        assertTrue(month.name().endsWith("BER"));
    }

    private boolean isPalindrome(String text) {
        return text.equals(new StringBuilder(text).reverse().toString());
    }
}
```

### Complex Parameterized Tests

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.stream.Stream;

class ComplexParameterizedTestsTest {

    // @CsvSource - Multiple parameters in CSV format
    @ParameterizedTest
    @CsvSource({
        "apple, 5",
        "banana, 6",
        "cherry, 6"
    })
    void csvSourceTest(String fruit, int length) {
        assertEquals(length, fruit.length());
    }

    @ParameterizedTest
    @CsvSource({
        "1, 2, 3",
        "10, 20, 30",
        "100, 200, 300"
    })
    void additionTest(int a, int b, int expected) {
        assertEquals(expected, a + b);
    }

    @ParameterizedTest
    @CsvSource(value = {
        "apple | APPLE",
        "banana | BANANA",
        "Cherry | CHERRY"
    }, delimiter = '|')
    void upperCaseTest(String input, String expected) {
        assertEquals(expected, input.toUpperCase());
    }

    @ParameterizedTest
    @CsvSource(value = {
        "'Hello, World!', 13",
        "NULL, 0",
        "'', 0"
    }, nullValues = "NULL")
    void stringLengthTest(String text, int expectedLength) {
        int length = text == null ? 0 : text.length();
        assertEquals(expectedLength, length);
    }

    // @CsvFileSource - Read from CSV file
    @ParameterizedTest
    @CsvFileSource(resources = "/test-data.csv", numLinesToSkip = 1)
    void csvFileTest(String input, int expected) {
        assertEquals(expected, input.length());
    }

    // @MethodSource - Method provides arguments
    @ParameterizedTest
    @MethodSource("stringProvider")
    void methodSourceTest(String argument) {
        assertNotNull(argument);
    }

    static Stream<String> stringProvider() {
        return Stream.of("apple", "banana", "cherry");
    }

    @ParameterizedTest
    @MethodSource("argumentsProvider")
    void multipleArgumentsTest(String input, int length, boolean notEmpty) {
        assertEquals(length, input.length());
        assertEquals(notEmpty, !input.isEmpty());
    }

    static Stream<Arguments> argumentsProvider() {
        return Stream.of(
            Arguments.of("apple", 5, true),
            Arguments.of("", 0, false),
            Arguments.of("hello world", 11, true)
        );
    }

    // External method source
    @ParameterizedTest
    @MethodSource("com.example.ExternalProvider#provideStrings")
    void externalMethodSource(String argument) {
        assertNotNull(argument);
    }

    // @ArgumentsSource - Custom ArgumentsProvider
    @ParameterizedTest
    @ArgumentsSource(CustomArgumentsProvider.class)
    void customArgumentsSourceTest(String argument, int length) {
        assertEquals(length, argument.length());
    }

    static class CustomArgumentsProvider implements ArgumentsProvider {
        @Override
        public Stream<? extends Arguments> provideArguments(
                org.junit.jupiter.api.extension.ExtensionContext context) {
            return Stream.of(
                Arguments.of("hello", 5),
                Arguments.of("world", 5),
                Arguments.of("test", 4)
            );
        }
    }
}
```

### Parameterized Test Display Names

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;

class ParameterizedDisplayNameTest {

    @ParameterizedTest(name = "{index} => input={0}, expected={1}")
    @CsvSource({
        "racecar, true",
        "hello, false",
        "level, true"
    })
    void customDisplayName(String input, boolean expected) {
        assertEquals(expected, isPalindrome(input));
    }

    @ParameterizedTest(name = "Test #{index}: {0} squared equals {1}")
    @CsvSource({
        "1, 1",
        "2, 4",
        "3, 9",
        "4, 16"
    })
    void squareTest(int input, int expected) {
        assertEquals(expected, input * input);
    }

    // Available placeholders:
    // {displayName} - display name of the @ParameterizedTest
    // {index} - current invocation index (1-based)
    // {arguments} - complete comma-separated list of arguments
    // {argumentsWithNames} - complete list with parameter names
    // {0}, {1}, ... - individual arguments

    @ParameterizedTest(name = "[{index}] {displayName} with {argumentsWithNames}")
    @DisplayName("Calculator addition")
    @CsvSource({
        "1, 1, 2",
        "2, 3, 5",
        "10, 20, 30"
    })
    void additionWithDetailedName(int a, int b, int sum) {
        assertEquals(sum, a + b);
    }

    private boolean isPalindrome(String text) {
        return text.equals(new StringBuilder(text).reverse().toString());
    }
}
```

### Argument Conversion

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;
import org.junit.jupiter.params.converter.*;
import static org.junit.jupiter.api.Assertions.*;
import java.time.*;

class ArgumentConversionTest {

    // Implicit conversion
    @ParameterizedTest
    @ValueSource(strings = {"JANUARY", "FEBRUARY", "MARCH"})
    void implicitEnumConversion(java.time.Month month) {
        assertNotNull(month);
    }

    @ParameterizedTest
    @ValueSource(strings = {"2023-01-15", "2023-06-20", "2023-12-31"})
    void implicitDateConversion(LocalDate date) {
        assertNotNull(date);
    }

    @ParameterizedTest
    @ValueSource(strings = {"true", "false"})
    void implicitBooleanConversion(boolean value) {
        assertTrue(value || !value);
    }

    // Explicit conversion with @ConvertWith
    @ParameterizedTest
    @ValueSource(strings = {"100", "200", "300"})
    void explicitConversion(@ConvertWith(ToIntegerConverter.class) Integer value) {
        assertTrue(value >= 100);
    }

    static class ToIntegerConverter extends SimpleArgumentConverter {
        @Override
        protected Object convert(Object source, Class<?> targetType) {
            assertEquals(Integer.class, targetType);
            return Integer.parseInt(source.toString());
        }
    }

    // TypedArgumentConverter for type-specific conversion
    @ParameterizedTest
    @ValueSource(strings = {"2023-01-15", "2023-06-20"})
    void typedConversion(@ConvertWith(StringToDateConverter.class) LocalDate date) {
        assertNotNull(date);
    }

    static class StringToDateConverter extends TypedArgumentConverter<String, LocalDate> {
        protected StringToDateConverter() {
            super(String.class, LocalDate.class);
        }

        @Override
        protected LocalDate convert(String source) {
            return LocalDate.parse(source);
        }
    }

    // Aggregator for multiple arguments
    @ParameterizedTest
    @CsvSource({
        "John, Doe, 30",
        "Jane, Smith, 25",
        "Bob, Johnson, 40"
    })
    void aggregatorTest(@AggregateWith(PersonAggregator.class) Person person) {
        assertNotNull(person);
        assertTrue(person.getAge() > 0);
    }

    static class PersonAggregator implements ArgumentsAggregator {
        @Override
        public Person aggregateArguments(ArgumentsAccessor accessor,
                ParameterContext context) {
            return new Person(
                accessor.getString(0),
                accessor.getString(1),
                accessor.getInteger(2)
            );
        }
    }

    static class Person {
        private final String firstName;
        private final String lastName;
        private final int age;

        Person(String firstName, String lastName, int age) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.age = age;
        }

        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public int getAge() { return age; }
    }
}
```

## Dynamic Tests

Dynamic tests are generated at runtime, allowing more flexibility than parameterized tests.

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.DynamicTest.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.DynamicContainer.dynamicContainer;
import static org.junit.jupiter.api.DynamicTest.dynamicTest;
import java.util.*;
import java.util.stream.*;

class DynamicTestsTest {

    @TestFactory
    Collection<DynamicTest> dynamicTestsFromCollection() {
        return Arrays.asList(
            dynamicTest("1st dynamic test", () -> assertTrue(true)),
            dynamicTest("2nd dynamic test", () -> assertEquals(4, 2 * 2))
        );
    }

    @TestFactory
    Iterable<DynamicTest> dynamicTestsFromIterable() {
        List<String> inputs = Arrays.asList("racecar", "radar", "level");

        return inputs.stream()
            .map(input -> dynamicTest(
                "Palindrome test: " + input,
                () -> assertTrue(isPalindrome(input))
            ))
            .collect(Collectors.toList());
    }

    @TestFactory
    Stream<DynamicTest> dynamicTestsFromStream() {
        return IntStream.range(1, 6)
            .mapToObj(n -> dynamicTest(
                "Test #" + n,
                () -> assertTrue(n > 0)
            ));
    }

    @TestFactory
    Stream<DynamicTest> dynamicTestsWithLambda() {
        int[][] testCases = {
            {1, 1, 2},
            {2, 3, 5},
            {5, 5, 10}
        };

        return Arrays.stream(testCases)
            .map(tc -> dynamicTest(
                String.format("%d + %d = %d", tc[0], tc[1], tc[2]),
                () -> assertEquals(tc[2], tc[0] + tc[1])
            ));
    }

    // Dynamic containers for grouping
    @TestFactory
    Stream<DynamicContainer> dynamicContainers() {
        return Stream.of(
            dynamicContainer("Addition tests",
                Stream.of(
                    dynamicTest("1 + 1 = 2", () -> assertEquals(2, 1 + 1)),
                    dynamicTest("2 + 2 = 4", () -> assertEquals(4, 2 + 2))
                )
            ),
            dynamicContainer("Subtraction tests",
                Stream.of(
                    dynamicTest("5 - 3 = 2", () -> assertEquals(2, 5 - 3)),
                    dynamicTest("10 - 4 = 6", () -> assertEquals(6, 10 - 4))
                )
            )
        );
    }

    // Nested dynamic containers
    @TestFactory
    DynamicNode dynamicNodeSingleTest() {
        return dynamicTest("Single test", () -> assertTrue(true));
    }

    @TestFactory
    DynamicNode dynamicNodeSingleContainer() {
        return dynamicContainer("Container",
            Stream.of(
                dynamicTest("Nested test", () -> assertTrue(true)),
                dynamicContainer("Nested container",
                    Stream.of(
                        dynamicTest("Deeply nested test", () -> assertTrue(true))
                    )
                )
            )
        );
    }

    // Generate tests from external data source
    @TestFactory
    Stream<DynamicTest> testsFromExternalData() {
        // Simulate reading from database or file
        List<Map<String, Object>> testData = Arrays.asList(
            Map.of("input", "hello", "expected", 5),
            Map.of("input", "world", "expected", 5),
            Map.of("input", "JUnit", "expected", 5)
        );

        return testData.stream()
            .map(data -> dynamicTest(
                "Length of '" + data.get("input") + "'",
                () -> assertEquals(
                    data.get("expected"),
                    ((String) data.get("input")).length()
                )
            ));
    }

    private boolean isPalindrome(String text) {
        return text.equals(new StringBuilder(text).reverse().toString());
    }
}
```

## Extensions

JUnit 5 extensions replace the runners and rules from JUnit 4, providing a more flexible and powerful extension mechanism.

### Built-in Extensions

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import static org.junit.jupiter.api.Assertions.*;
import java.io.*;

class BuiltInExtensionsTest {

    // Temporary directory extension
    @Test
    void testWithTempDirectory(@TempDir java.nio.file.Path tempDir) throws IOException {
        java.nio.file.Path file = tempDir.resolve("test.txt");
        java.nio.file.Files.writeString(file, "Hello, World!");

        assertTrue(java.nio.file.Files.exists(file));
        assertEquals("Hello, World!", java.nio.file.Files.readString(file));
    }

    @TempDir
    java.nio.file.Path sharedTempDir;

    @Test
    void testWithSharedTempDirectory() throws IOException {
        java.nio.file.Path file = sharedTempDir.resolve("shared-test.txt");
        java.nio.file.Files.writeString(file, "Shared temp dir");

        assertTrue(java.nio.file.Files.exists(file));
    }
}
```

### Custom Extensions

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.annotation.*;

// Custom extension that logs test execution time
class TimingExtension implements BeforeTestExecutionCallback, AfterTestExecutionCallback {

    private static final String START_TIME = "start_time";

    @Override
    public void beforeTestExecution(ExtensionContext context) {
        getStore(context).put(START_TIME, System.currentTimeMillis());
    }

    @Override
    public void afterTestExecution(ExtensionContext context) {
        long startTime = getStore(context).remove(START_TIME, long.class);
        long duration = System.currentTimeMillis() - startTime;

        System.out.printf("Test '%s' took %d ms%n",
            context.getDisplayName(), duration);
    }

    private ExtensionContext.Store getStore(ExtensionContext context) {
        return context.getStore(ExtensionContext.Namespace.create(
            getClass(), context.getRequiredTestMethod()));
    }
}

// Using the extension
@ExtendWith(TimingExtension.class)
class TimingExtensionTest {

    @Test
    void fastTest() {
        // Quick test
    }

    @Test
    void slowTest() throws InterruptedException {
        Thread.sleep(100);
    }
}

// Custom annotation with extension
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(TimingExtension.class)
@interface Timed {
}

@Timed
class AnnotatedTimingTest {
    @Test
    void timedTest() {
        // Automatically timed
    }
}
```

### Lifecycle Callback Extensions

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import static org.junit.jupiter.api.Assertions.*;

class DatabaseExtension implements
        BeforeAllCallback, AfterAllCallback,
        BeforeEachCallback, AfterEachCallback,
        TestInstancePostProcessor {

    @Override
    public void beforeAll(ExtensionContext context) {
        System.out.println("Setting up database connection pool");
        // Initialize connection pool
    }

    @Override
    public void afterAll(ExtensionContext context) {
        System.out.println("Closing database connection pool");
        // Close connection pool
    }

    @Override
    public void beforeEach(ExtensionContext context) {
        System.out.println("Beginning transaction");
        // Begin transaction
    }

    @Override
    public void afterEach(ExtensionContext context) {
        System.out.println("Rolling back transaction");
        // Rollback transaction
    }

    @Override
    public void postProcessTestInstance(Object testInstance,
            ExtensionContext context) {
        System.out.println("Injecting dependencies into test instance");
        // Inject database connection or repository
    }
}

@ExtendWith(DatabaseExtension.class)
class DatabaseTest {

    @Test
    void testDatabaseOperation() {
        // Test runs within a transaction that gets rolled back
    }
}
```

### Parameter Resolution Extension

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.annotation.*;
import java.util.Random;

// Custom annotation for random values
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
@interface RandomInt {
    int min() default 0;
    int max() default 100;
}

// Parameter resolver extension
class RandomIntParameterResolver implements ParameterResolver {

    private final Random random = new Random();

    @Override
    public boolean supportsParameter(ParameterContext parameterContext,
            ExtensionContext extensionContext) {
        return parameterContext.isAnnotated(RandomInt.class);
    }

    @Override
    public Object resolveParameter(ParameterContext parameterContext,
            ExtensionContext extensionContext) {
        RandomInt annotation = parameterContext.findAnnotation(RandomInt.class).get();
        return random.nextInt(annotation.max() - annotation.min()) + annotation.min();
    }
}

@ExtendWith(RandomIntParameterResolver.class)
class RandomIntTest {

    @Test
    void testWithRandomInt(@RandomInt int value) {
        assertTrue(value >= 0 && value < 100);
    }

    @Test
    void testWithCustomRange(@RandomInt(min = 50, max = 100) int value) {
        assertTrue(value >= 50 && value < 100);
    }
}
```

### Exception Handling Extension

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@interface IgnoreIOException {
}

class IgnoreIOExceptionExtension implements TestExecutionExceptionHandler {

    @Override
    public void handleTestExecutionException(ExtensionContext context,
            Throwable throwable) throws Throwable {

        if (throwable instanceof java.io.IOException &&
            context.getElement()
                   .map(el -> el.isAnnotationPresent(IgnoreIOException.class))
                   .orElse(false)) {

            System.out.println("IOException ignored: " + throwable.getMessage());
            return; // Swallow the exception
        }

        throw throwable; // Re-throw other exceptions
    }
}

@ExtendWith(IgnoreIOExceptionExtension.class)
class ExceptionHandlingTest {

    @Test
    @IgnoreIOException
    void testThatMayThrowIOException() throws java.io.IOException {
        throw new java.io.IOException("Simulated IO error");
        // Test passes because exception is ignored
    }

    @Test
    void testThatShouldNotIgnoreException() {
        // This test would fail if IOException is thrown
        assertDoesNotThrow(() -> {
            // Normal operation
        });
    }
}
```

### Combining Multiple Extensions

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import java.lang.annotation.*;

// Composed annotation combining multiple extensions
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(TimingExtension.class)
@ExtendWith(DatabaseExtension.class)
@ExtendWith(LoggingExtension.class)
@interface IntegrationTest {
}

class LoggingExtension implements BeforeEachCallback, AfterEachCallback {
    @Override
    public void beforeEach(ExtensionContext context) {
        System.out.println(">>> Starting: " + context.getDisplayName());
    }

    @Override
    public void afterEach(ExtensionContext context) {
        System.out.println("<<< Finished: " + context.getDisplayName());
    }
}

@IntegrationTest
class ComposedExtensionTest {

    @Test
    void integrationTest() {
        // All extensions are active
    }
}

// Programmatic extension registration
class ProgrammaticExtensionTest {

    @RegisterExtension
    static TimingExtension timingExtension = new TimingExtension();

    @RegisterExtension
    LoggingExtension loggingExtension = new LoggingExtension();

    @Test
    void testWithProgrammaticExtensions() {
        // Extensions registered programmatically
    }
}
```

## Mocking with Mockito

Mockito is the most popular mocking framework for Java, and it integrates seamlessly with JUnit 5.

### Basic Mockito Usage

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import org.mockito.*;
import org.mockito.junit.jupiter.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// Enable Mockito annotations
@ExtendWith(MockitoExtension.class)
class MockitoBasicsTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldCreateUser() {
        // Arrange
        User user = new User("john@example.com", "John Doe");
        when(userRepository.save(any(User.class))).thenReturn(user);

        // Act
        User createdUser = userService.createUser("john@example.com", "John Doe");

        // Assert
        assertNotNull(createdUser);
        assertEquals("john@example.com", createdUser.getEmail());

        // Verify interactions
        verify(userRepository).save(any(User.class));
        verify(emailService).sendWelcomeEmail(eq("john@example.com"));
    }

    @Test
    void shouldFindUserById() {
        // Arrange
        User expectedUser = new User("jane@example.com", "Jane Doe");
        when(userRepository.findById(1L)).thenReturn(java.util.Optional.of(expectedUser));

        // Act
        java.util.Optional<User> result = userService.findById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals("Jane Doe", result.get().getName());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Arrange
        when(userRepository.findById(anyLong())).thenReturn(java.util.Optional.empty());

        // Act & Assert
        assertThrows(UserNotFoundException.class,
            () -> userService.getUserOrThrow(999L));
    }

    // Sample classes for mocking
    static class User {
        private String email;
        private String name;

        User(String email, String name) {
            this.email = email;
            this.name = name;
        }

        public String getEmail() { return email; }
        public String getName() { return name; }
    }

    interface UserRepository {
        User save(User user);
        java.util.Optional<User> findById(Long id);
    }

    interface EmailService {
        void sendWelcomeEmail(String email);
    }

    static class UserNotFoundException extends RuntimeException {
        UserNotFoundException(String message) {
            super(message);
        }
    }

    static class UserService {
        private final UserRepository userRepository;
        private final EmailService emailService;

        UserService(UserRepository userRepository, EmailService emailService) {
            this.userRepository = userRepository;
            this.emailService = emailService;
        }

        User createUser(String email, String name) {
            User user = userRepository.save(new User(email, name));
            emailService.sendWelcomeEmail(email);
            return user;
        }

        java.util.Optional<User> findById(Long id) {
            return userRepository.findById(id);
        }

        User getUserOrThrow(Long id) {
            return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
        }
    }
}
```

### Advanced Mockito Features

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import org.mockito.*;
import org.mockito.junit.jupiter.*;
import static org.mockito.Mockito.*;
import static org.mockito.BDDMockito.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;

@ExtendWith(MockitoExtension.class)
class AdvancedMockitoTest {

    @Mock
    private DataService dataService;

    @Spy
    private List<String> spiedList = new ArrayList<>();

    @Captor
    private ArgumentCaptor<String> stringCaptor;

    // Stubbing consecutive calls
    @Test
    void consecutiveCalls() {
        when(dataService.getData())
            .thenReturn("First")
            .thenReturn("Second")
            .thenReturn("Third");

        assertEquals("First", dataService.getData());
        assertEquals("Second", dataService.getData());
        assertEquals("Third", dataService.getData());
        assertEquals("Third", dataService.getData()); // Repeats last
    }

    // Stubbing with callbacks
    @Test
    void stubWithAnswer() {
        when(dataService.processData(anyString()))
            .thenAnswer(invocation -> {
                String arg = invocation.getArgument(0);
                return arg.toUpperCase();
            });

        assertEquals("HELLO", dataService.processData("hello"));
        assertEquals("WORLD", dataService.processData("world"));
    }

    // Throwing exceptions
    @Test
    void stubThrowException() {
        when(dataService.getData())
            .thenThrow(new RuntimeException("Error"));

        assertThrows(RuntimeException.class, () -> dataService.getData());
    }

    // Spying on real objects
    @Test
    void spyTest() {
        spiedList.add("one");
        spiedList.add("two");

        verify(spiedList).add("one");
        verify(spiedList).add("two");

        assertEquals(2, spiedList.size());

        // Stub specific method
        doReturn(100).when(spiedList).size();
        assertEquals(100, spiedList.size());
    }

    // Argument captors
    @Test
    void argumentCaptorTest() {
        dataService.processData("test1");
        dataService.processData("test2");

        verify(dataService, times(2)).processData(stringCaptor.capture());

        List<String> capturedValues = stringCaptor.getAllValues();
        assertEquals(2, capturedValues.size());
        assertEquals("test1", capturedValues.get(0));
        assertEquals("test2", capturedValues.get(1));
    }

    // Verification modes
    @Test
    void verificationModes() {
        dataService.getData();
        dataService.getData();
        dataService.getData();

        verify(dataService, times(3)).getData();
        verify(dataService, atLeast(2)).getData();
        verify(dataService, atMost(5)).getData();
        verify(dataService, atLeastOnce()).getData();
        verify(dataService, never()).processData(anyString());
    }

    // Verification order
    @Test
    void verificationOrder() {
        dataService.getData();
        dataService.processData("test");

        InOrder inOrder = inOrder(dataService);
        inOrder.verify(dataService).getData();
        inOrder.verify(dataService).processData("test");
    }

    // BDD style with Mockito
    @Test
    void bddStyleTest() {
        // Given
        given(dataService.getData()).willReturn("BDD Data");

        // When
        String result = dataService.getData();

        // Then
        then(dataService).should().getData();
        assertThat(result).isEqualTo("BDD Data");
    }

    // Mocking static methods (requires mockito-inline)
    @Test
    void mockStaticMethod() {
        try (MockedStatic<UUID> mockedUUID = mockStatic(UUID.class)) {
            UUID fixedUUID = UUID.fromString("12345678-1234-1234-1234-123456789012");
            mockedUUID.when(UUID::randomUUID).thenReturn(fixedUUID);

            assertEquals(fixedUUID, UUID.randomUUID());
        }
    }

    interface DataService {
        String getData();
        String processData(String input);
    }

    // AssertJ for fluent assertions
    private static org.assertj.core.api.AbstractStringAssert<?> assertThat(String actual) {
        return org.assertj.core.api.Assertions.assertThat(actual);
    }
}
```

### Mockito with Annotations Best Practices

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.*;
import org.mockito.*;
import org.mockito.junit.jupiter.*;
import org.mockito.quality.Strictness;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// Strict stubbing mode (recommended)
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.STRICT_STUBS)
class MockitoSettingsTest {

    @Mock(lenient = true)
    private Service lenientMock;

    @Mock
    private Service strictMock;

    @Test
    void testWithStrictMock() {
        // Must use all stubbed methods, otherwise test fails
        when(strictMock.getData()).thenReturn("data");

        String result = strictMock.getData();
        assertEquals("data", result);
    }

    @Test
    void testWithLenientMock() {
        // Unused stubbing won't cause test failure
        when(lenientMock.getData()).thenReturn("data");
        when(lenientMock.process("input")).thenReturn("output");

        // Only using one stubbed method
        assertEquals("data", lenientMock.getData());
    }

    interface Service {
        String getData();
        String process(String input);
    }
}

// Reset mocks between tests
@ExtendWith(MockitoExtension.class)
class MockResetTest {

    @Mock
    private Calculator calculator;

    @BeforeEach
    void setUp() {
        // Mockito extension automatically resets mocks
    }

    @Test
    void testOne() {
        when(calculator.add(1, 2)).thenReturn(3);
        assertEquals(3, calculator.add(1, 2));
    }

    @Test
    void testTwo() {
        // Mock is reset, previous stubbing doesn't exist
        when(calculator.add(1, 2)).thenReturn(100);
        assertEquals(100, calculator.add(1, 2));
    }

    interface Calculator {
        int add(int a, int b);
    }
}
```

## Best Practices

### Test Naming Conventions

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class NamingConventionsTest {

    // Method naming: should[ExpectedBehavior]When[Condition]
    @Test
    void shouldReturnTrueWhenUserIsAdmin() {
        User admin = new User("admin", Role.ADMIN);
        assertTrue(admin.isAdmin());
    }

    @Test
    void shouldThrowExceptionWhenEmailIsNull() {
        assertThrows(IllegalArgumentException.class,
            () -> new User(null, Role.USER));
    }

    // Alternative: given[Precondition]When[Action]Then[ExpectedResult]
    @Test
    void givenAdminUser_whenCheckingPermissions_thenHasFullAccess() {
        User admin = new User("admin", Role.ADMIN);
        assertTrue(admin.hasPermission(Permission.READ));
        assertTrue(admin.hasPermission(Permission.WRITE));
        assertTrue(admin.hasPermission(Permission.DELETE));
    }

    // Use @DisplayName for readable test names
    @Test
    @DisplayName("User with ADMIN role should have all permissions")
    void adminPermissions() {
        User admin = new User("admin", Role.ADMIN);
        assertTrue(admin.hasAllPermissions());
    }

    enum Role { USER, ADMIN }
    enum Permission { READ, WRITE, DELETE }

    static class User {
        private final String name;
        private final Role role;

        User(String name, Role role) {
            if (name == null) throw new IllegalArgumentException("Name cannot be null");
            this.name = name;
            this.role = role;
        }

        boolean isAdmin() { return role == Role.ADMIN; }
        boolean hasPermission(Permission p) { return role == Role.ADMIN; }
        boolean hasAllPermissions() { return role == Role.ADMIN; }
    }
}
```

### AAA Pattern (Arrange-Act-Assert)

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;

class AAAPatternTest {

    @Test
    void shouldCalculateCartTotal() {
        // Arrange - Set up test data and preconditions
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("Book", 29.99));
        cart.addItem(new Item("Pen", 4.99));
        cart.addItem(new Item("Notebook", 12.50));

        // Act - Execute the code under test
        double total = cart.calculateTotal();

        // Assert - Verify the results
        assertEquals(47.48, total, 0.01);
    }

    @Test
    void shouldApplyDiscountToCart() {
        // Arrange
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("Product", 100.00));
        Discount discount = new Discount(10); // 10% discount

        // Act
        cart.applyDiscount(discount);
        double total = cart.calculateTotal();

        // Assert
        assertEquals(90.00, total, 0.01);
    }

    static class Item {
        String name;
        double price;

        Item(String name, double price) {
            this.name = name;
            this.price = price;
        }
    }

    static class Discount {
        int percentage;

        Discount(int percentage) {
            this.percentage = percentage;
        }
    }

    static class ShoppingCart {
        private List<Item> items = new ArrayList<>();
        private Discount discount;

        void addItem(Item item) { items.add(item); }
        void applyDiscount(Discount discount) { this.discount = discount; }

        double calculateTotal() {
            double total = items.stream()
                .mapToDouble(i -> i.price)
                .sum();
            if (discount != null) {
                total = total * (100 - discount.percentage) / 100;
            }
            return total;
        }
    }
}
```

### Test Isolation

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.util.*;

class TestIsolationTest {

    // BAD: Shared mutable state
    // private static List<String> sharedList = new ArrayList<>();

    // GOOD: Each test has its own instance
    private List<String> testList;

    @BeforeEach
    void setUp() {
        testList = new ArrayList<>();
    }

    @Test
    void testOne() {
        testList.add("item1");
        assertEquals(1, testList.size());
    }

    @Test
    void testTwo() {
        // testList is fresh, not affected by testOne
        assertEquals(0, testList.size());
        testList.add("item2");
        assertEquals(1, testList.size());
    }

    // For expensive resources, use @TestInstance(Lifecycle.PER_CLASS)
    // with proper cleanup
}

// Testing with database
class DatabaseTestIsolationTest {

    // Each test runs in a transaction that gets rolled back
    // @Transactional
    // @Rollback

    @Test
    void testCreateUser() {
        // Create user in database
        // Changes are rolled back after test
    }

    @Test
    void testUpdateUser() {
        // Database is clean, user from previous test doesn't exist
    }
}
```

### Testing Edge Cases

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.*;
import org.junit.jupiter.params.provider.*;
import static org.junit.jupiter.api.Assertions.*;

class EdgeCasesTest {

    private StringUtils stringUtils = new StringUtils();

    @Test
    void shouldHandleNullInput() {
        assertNull(stringUtils.reverse(null));
    }

    @Test
    void shouldHandleEmptyString() {
        assertEquals("", stringUtils.reverse(""));
    }

    @Test
    void shouldHandleSingleCharacter() {
        assertEquals("a", stringUtils.reverse("a"));
    }

    @Test
    void shouldHandleWhitespace() {
        assertEquals("   ", stringUtils.reverse("   "));
    }

    @Test
    void shouldHandleSpecialCharacters() {
        assertEquals("!@#$%", stringUtils.reverse("%$#@!"));
    }

    @Test
    void shouldHandleUnicodeCharacters() {
        assertEquals("界世", stringUtils.reverse("世界"));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"  ", "\t", "\n"})
    void shouldHandleBlankStrings(String input) {
        assertTrue(stringUtils.isBlank(input));
    }

    // Boundary value testing
    @Test
    void shouldHandleBoundaryValues() {
        Calculator calc = new Calculator();

        // Test at boundaries
        assertEquals(Integer.MAX_VALUE, calc.add(Integer.MAX_VALUE, 0));
        assertEquals(Integer.MIN_VALUE, calc.add(Integer.MIN_VALUE, 0));

        // Test overflow behavior
        assertThrows(ArithmeticException.class,
            () -> calc.addExact(Integer.MAX_VALUE, 1));
    }

    static class StringUtils {
        String reverse(String input) {
            if (input == null) return null;
            return new StringBuilder(input).reverse().toString();
        }

        boolean isBlank(String input) {
            return input == null || input.trim().isEmpty();
        }
    }

    static class Calculator {
        int add(int a, int b) { return a + b; }
        int addExact(int a, int b) { return Math.addExact(a, b); }
    }
}
```

### Test Documentation

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Order Processing Service")
class OrderProcessingServiceTest {

    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderService();
    }

    @Nested
    @DisplayName("When creating a new order")
    class CreateOrder {

        @Test
        @DisplayName("should create order with valid items")
        void createWithValidItems() {
            // Test implementation
        }

        @Test
        @DisplayName("should reject order with empty cart")
        void rejectEmptyCart() {
            // Test implementation
        }

        @Test
        @DisplayName("should calculate correct total including tax")
        void calculateTotalWithTax() {
            // Test implementation
        }
    }

    @Nested
    @DisplayName("When processing payment")
    class ProcessPayment {

        @Test
        @DisplayName("should process credit card payment successfully")
        void processCreditCard() {
            // Test implementation
        }

        @Test
        @DisplayName("should handle declined payment gracefully")
        void handleDeclinedPayment() {
            // Test implementation
        }
    }

    @Nested
    @DisplayName("When fulfilling order")
    class FulfillOrder {

        @Test
        @DisplayName("should update inventory after fulfillment")
        void updateInventory() {
            // Test implementation
        }

        @Test
        @DisplayName("should send confirmation email to customer")
        void sendConfirmationEmail() {
            // Test implementation
        }
    }

    static class OrderService {
        // Service implementation
    }
}
```

### Performance Testing

```java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import java.util.*;

class PerformanceTest {

    @Test
    @Timeout(value = 100, unit = java.util.concurrent.TimeUnit.MILLISECONDS)
    void shouldCompleteWithinTimeLimit() {
        // This test fails if it takes more than 100ms
        List<Integer> numbers = new ArrayList<>();
        for (int i = 0; i < 10000; i++) {
            numbers.add(i);
        }
    }

    @Test
    void measureExecutionTime() {
        Instant start = Instant.now();

        // Code to measure
        heavyComputation();

        Instant end = Instant.now();
        Duration duration = Duration.between(start, end);

        assertTrue(duration.toMillis() < 1000,
            "Execution took too long: " + duration.toMillis() + "ms");
    }

    @RepeatedTest(value = 5, name = "Performance test run {currentRepetition}/{totalRepetitions}")
    void consistentPerformance(RepetitionInfo info) {
        long startTime = System.nanoTime();

        // Code to test
        quickOperation();

        long duration = System.nanoTime() - startTime;

        // Log or assert performance
        System.out.printf("Run %d: %d ns%n", info.getCurrentRepetition(), duration);
        assertTrue(duration < 1_000_000, "Operation took too long");
    }

    private void heavyComputation() {
        // Simulate heavy computation
        double result = 0;
        for (int i = 0; i < 100000; i++) {
            result += Math.sqrt(i);
        }
    }

    private void quickOperation() {
        // Quick operation
        String result = "Hello" + " " + "World";
    }
}
```

## Summary

JUnit 5 is a powerful and flexible testing framework that provides everything needed for modern Java testing. Key takeaways:

1. **Modern Architecture**: JUnit 5 consists of three modules (Platform, Jupiter, Vintage) providing flexibility and backward compatibility

2. **Rich Annotations**: Use `@Test`, `@BeforeEach`, `@AfterEach`, `@DisplayName`, `@Nested`, `@ParameterizedTest` for expressive tests

3. **Comprehensive Assertions**: Built-in assertions cover most needs, with support for third-party libraries like AssertJ and Hamcrest

4. **Parameterized Tests**: Test multiple scenarios with `@ValueSource`, `@CsvSource`, `@MethodSource`, and custom argument providers

5. **Dynamic Tests**: Generate tests at runtime using `@TestFactory` for data-driven testing scenarios

6. **Powerful Extensions**: Replace JUnit 4 runners and rules with a unified extension model for custom test behavior

7. **Mockito Integration**: Seamlessly integrate with Mockito for mocking dependencies in unit tests

8. **Best Practices**:
   - Follow the AAA pattern (Arrange-Act-Assert)
   - Use meaningful test names and `@DisplayName`
   - Keep tests isolated and independent
   - Test edge cases and boundary conditions
   - Organize tests with `@Nested` classes

9. **Conditional Execution**: Enable or disable tests based on OS, JRE version, system properties, or custom conditions

10. **Lifecycle Management**: Understand and properly use `@BeforeAll`, `@AfterAll`, `@BeforeEach`, `@AfterEach` for test setup and cleanup

Mastering JUnit 5 is essential for any Java developer. Well-written tests serve as documentation, catch bugs early, and enable confident refactoring. Combined with practices like TDD (Test-Driven Development), JUnit 5 helps deliver high-quality, maintainable Java applications.
