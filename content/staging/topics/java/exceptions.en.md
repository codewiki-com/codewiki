---
title: Exception Handling
description: Complete guide to Java exception handling, exception hierarchy, try-catch-finally and best practices
track: java
section: basics
difficulty: intermediate
tags:
  - Java
  - Exceptions
  - Error Handling
  - try-catch
status: imported
origin: old/src/content/docs/java/exceptions.en.md
divergence: 0.218
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: Core Concepts
  order: 10
  lastUpdated: 2026-01-07
---

Exception handling is one of the most critical mechanisms in Java that enables programs to gracefully handle runtime errors and exceptional conditions. Rather than allowing the program to crash unexpectedly, Java provides a structured approach to detect, report, and recover from errors, making applications more robust and user-friendly.

## What is an Exception?

An exception is an event that disrupts the normal flow of a program's execution. When an error occurs within a method, the method creates an exception object containing information about the error, including its type, the state of the program, and a stack trace. The method then hands this object off to the runtime system, a process called "throwing an exception."

The runtime system then searches the call stack for a method containing code that can handle the exception (an exception handler). If found, the exception is passed to that handler. If no appropriate handler is found, the program terminates.

```java
public class ExceptionBasics {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3};

        // This will throw an ArrayIndexOutOfBoundsException
        System.out.println(numbers[5]);

        // This line will never execute
        System.out.println("Program completed");
    }
}
```

## Exception Hierarchy

Java's exception hierarchy is built on a well-defined class structure rooted in `java.lang.Throwable`. Understanding this hierarchy is essential for effective exception handling.

```
java.lang.Object
    └── java.lang.Throwable
            ├── java.lang.Error
            │       ├── OutOfMemoryError
            │       ├── StackOverflowError
            │       ├── VirtualMachineError
            │       └── ... (other errors)
            │
            └── java.lang.Exception
                    ├── java.lang.RuntimeException (Unchecked)
                    │       ├── NullPointerException
                    │       ├── ArrayIndexOutOfBoundsException
                    │       ├── ArithmeticException
                    │       ├── IllegalArgumentException
                    │       ├── ClassCastException
                    │       └── ... (other runtime exceptions)
                    │
                    └── Checked Exceptions
                            ├── IOException
                            ├── SQLException
                            ├── ClassNotFoundException
                            ├── InterruptedException
                            └── ... (other checked exceptions)
```

### Key Classes in the Hierarchy

#### Throwable

The `Throwable` class is the superclass of all errors and exceptions in Java. It provides essential methods for exception handling:

```java
public class ThrowableMethodsDemo {
    public static void main(String[] args) {
        try {
            throw new Exception("Something went wrong");
        } catch (Exception e) {
            // Get the error message
            System.out.println("Message: " + e.getMessage());

            // Get the localized message
            System.out.println("Localized: " + e.getLocalizedMessage());

            // Get the cause (if any)
            System.out.println("Cause: " + e.getCause());

            // Print the stack trace
            e.printStackTrace();

            // Get stack trace as array
            StackTraceElement[] stackTrace = e.getStackTrace();
            for (StackTraceElement element : stackTrace) {
                System.out.println("  at " + element);
            }
        }
    }
}
```

#### Error

`Error` represents serious problems that applications should not attempt to catch. These typically indicate system-level issues beyond the application's control.

```java
public class ErrorExamples {
    // StackOverflowError - infinite recursion
    public static void infiniteRecursion() {
        infiniteRecursion(); // Never do this!
    }

    // OutOfMemoryError - memory exhaustion
    public static void exhaustMemory() {
        List<byte[]> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]); // 1MB chunks
        }
    }

    public static void main(String[] args) {
        // These demonstrate errors - don't run in production!
        // infiniteRecursion();  // Causes StackOverflowError
        // exhaustMemory();       // Causes OutOfMemoryError
    }
}
```

Common errors include:
- `OutOfMemoryError`: JVM cannot allocate memory
- `StackOverflowError`: Stack space exhausted (usually from infinite recursion)
- `VirtualMachineError`: JVM is broken or has run out of resources
- `NoClassDefFoundError`: Class definition not found at runtime

#### Exception

`Exception` represents conditions that applications should catch and handle. It is divided into two categories: checked and unchecked exceptions.

## Checked vs Unchecked Exceptions

Understanding the difference between checked and unchecked exceptions is fundamental to Java exception handling.

### Checked Exceptions

Checked exceptions are exceptions that the compiler forces you to handle. They represent recoverable conditions that a well-written application should anticipate and handle.

```java
import java.io.*;

public class CheckedExceptionExample {
    // Method must declare throws or handle the exception
    public static String readFile(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        try {
            return reader.readLine();
        } finally {
            reader.close();
        }
    }

    public static void main(String[] args) {
        // Option 1: Handle with try-catch
        try {
            String content = readFile("data.txt");
            System.out.println(content);
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
        }

        // Option 2: Declare in throws clause (propagate to caller)
        // public static void main(String[] args) throws IOException {
        //     String content = readFile("data.txt");
        // }
    }
}
```

Common checked exceptions:
- `IOException`: I/O operations failure
- `SQLException`: Database access error
- `ClassNotFoundException`: Class not found during reflection
- `InterruptedException`: Thread interrupted while waiting
- `FileNotFoundException`: File does not exist
- `ParseException`: Error parsing data

### Unchecked Exceptions (Runtime Exceptions)

Unchecked exceptions extend `RuntimeException` and do not require explicit handling. They typically indicate programming errors that should be fixed in code rather than caught at runtime.

```java
public class UncheckedExceptionExamples {
    public static void main(String[] args) {
        // NullPointerException
        String str = null;
        // str.length(); // Would throw NullPointerException

        // ArrayIndexOutOfBoundsException
        int[] arr = {1, 2, 3};
        // int val = arr[10]; // Would throw ArrayIndexOutOfBoundsException

        // ArithmeticException
        // int result = 10 / 0; // Would throw ArithmeticException

        // NumberFormatException
        // int num = Integer.parseInt("abc"); // Would throw NumberFormatException

        // ClassCastException
        Object obj = "Hello";
        // Integer num = (Integer) obj; // Would throw ClassCastException

        // IllegalArgumentException
        // Thread.sleep(-1000); // Would throw IllegalArgumentException
    }
}
```

Common unchecked exceptions:
- `NullPointerException`: Null reference used
- `ArrayIndexOutOfBoundsException`: Invalid array index
- `ArithmeticException`: Illegal arithmetic operation
- `NumberFormatException`: Invalid number string
- `ClassCastException`: Invalid type cast
- `IllegalArgumentException`: Invalid method argument
- `IllegalStateException`: Object in invalid state

### When to Use Each Type

| Aspect | Checked Exception | Unchecked Exception |
|--------|------------------|---------------------|
| Recovery | Caller can reasonably recover | Usually indicates a bug |
| Handling | Must be caught or declared | Optional to handle |
| Examples | File not found, network error | Null pointer, array bounds |
| Best for | External failures | Programming errors |

## Try-Catch-Finally Block

The `try-catch-finally` block is the fundamental structure for handling exceptions in Java.

### Basic Syntax

```java
try {
    // Code that might throw an exception
} catch (ExceptionType1 e) {
    // Handle ExceptionType1
} catch (ExceptionType2 e) {
    // Handle ExceptionType2
} finally {
    // Always executed, regardless of exception
    // Used for cleanup operations
}
```

### Comprehensive Try-Catch Example

```java
import java.io.*;
import java.util.*;

public class TryCatchComprehensive {
    public static void main(String[] args) {
        // Example 1: Basic try-catch
        try {
            int result = divide(10, 0);
            System.out.println("Result: " + result);
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero: " + e.getMessage());
        }

        // Example 2: Multiple catch blocks (order matters!)
        try {
            processFile("nonexistent.txt");
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("IO error: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("Unexpected error: " + e.getMessage());
        }

        // Example 3: Nested try-catch
        try {
            try {
                int[] arr = new int[5];
                arr[10] = 50; // ArrayIndexOutOfBoundsException
            } catch (ArrayIndexOutOfBoundsException e) {
                System.out.println("Array error handled in inner block");
                throw new RuntimeException("Wrapped exception", e);
            }
        } catch (RuntimeException e) {
            System.out.println("Runtime error in outer block: " + e.getMessage());
        }
    }

    public static int divide(int a, int b) {
        return a / b;
    }

    public static void processFile(String filename) throws IOException {
        FileReader reader = new FileReader(filename);
        reader.close();
    }
}
```

### Multi-Catch (Java 7+)

Java 7 introduced the ability to catch multiple exception types in a single catch block using the pipe (`|`) operator.

```java
public class MultiCatchExample {
    public static void process(String input, String filename) {
        try {
            // Multiple operations that can throw different exceptions
            int number = Integer.parseInt(input);
            FileReader reader = new FileReader(filename);

            // Use reflection
            Class<?> clazz = Class.forName("com.example.MyClass");

        } catch (NumberFormatException | FileNotFoundException e) {
            // Handle both exceptions the same way
            System.out.println("Input error: " + e.getMessage());

        } catch (ClassNotFoundException e) {
            // Handle separately
            System.out.println("Class not found: " + e.getMessage());
        }
    }

    // Note: In multi-catch, the exception variable is effectively final
    public static void multiCatchDetails() {
        try {
            throw new IllegalArgumentException("Test");
        } catch (IllegalArgumentException | IllegalStateException e) {
            // e is effectively final - cannot reassign
            // e = new IllegalArgumentException("new"); // Compile error!

            System.out.println("Exception type: " + e.getClass().getSimpleName());
        }
    }
}
```

### Finally Block

The `finally` block always executes regardless of whether an exception is thrown. It is essential for cleanup operations.

```java
import java.io.*;
import java.sql.*;

public class FinallyBlockExamples {

    // Example 1: Resource cleanup
    public static void readFileWithFinally(String path) {
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new FileReader(path));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
        } finally {
            // Cleanup: close the reader
            if (reader != null) {
                try {
                    reader.close();
                    System.out.println("Reader closed successfully");
                } catch (IOException e) {
                    System.err.println("Error closing reader: " + e.getMessage());
                }
            }
        }
    }

    // Example 2: Finally with return statements
    public static int demonstrateFinallyWithReturn() {
        try {
            System.out.println("In try block");
            return 1;
        } finally {
            System.out.println("Finally block executed before return");
            // Note: Returning from finally is discouraged as it overrides try's return
            // return 2; // This would make the method return 2 instead of 1
        }
    }

    // Example 3: Finally with exception
    public static void finallyWithException() {
        try {
            System.out.println("In try block");
            throw new RuntimeException("Exception in try");
        } catch (RuntimeException e) {
            System.out.println("In catch block");
            throw e; // Re-throw
        } finally {
            System.out.println("Finally block still executes!");
        }
    }

    // Example 4: When finally does NOT execute
    public static void finallyMayNotExecute() {
        try {
            System.out.println("Exiting JVM...");
            System.exit(0); // Finally won't execute after this
        } finally {
            System.out.println("This will never print");
        }
    }

    public static void main(String[] args) {
        int result = demonstrateFinallyWithReturn();
        System.out.println("Return value: " + result);

        try {
            finallyWithException();
        } catch (RuntimeException e) {
            System.out.println("Caught in main: " + e.getMessage());
        }
    }
}
```

### Important Finally Block Behaviors

1. **Executes after try/catch**: Always runs after try and any catch blocks
2. **Executes even with return**: Runs before the method returns
3. **Executes even with exception**: Runs even if an exception is thrown and not caught
4. **Does NOT execute when**:
   - `System.exit()` is called
   - JVM crashes
   - Thread is killed or interrupted in certain ways

## Try-With-Resources (Java 7+)

The try-with-resources statement automatically manages resources that implement `AutoCloseable` or `Closeable`. This eliminates the need for explicit finally blocks for cleanup and prevents resource leaks.

### Basic Syntax

```java
try (Resource resource = new Resource()) {
    // Use the resource
} catch (Exception e) {
    // Handle exception
}
// Resource is automatically closed here
```

### Single Resource

```java
import java.io.*;

public class TryWithResourcesSingle {
    public static String readFirstLine(String path) throws IOException {
        // BufferedReader is automatically closed after the try block
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
        // No finally block needed!
    }

    public static void writeToFile(String path, String content) throws IOException {
        try (FileWriter writer = new FileWriter(path);
             BufferedWriter buffered = new BufferedWriter(writer)) {
            buffered.write(content);
            buffered.newLine();
        }
    }

    public static void main(String[] args) {
        try {
            writeToFile("test.txt", "Hello, World!");
            String line = readFirstLine("test.txt");
            System.out.println("Read: " + line);
        } catch (IOException e) {
            System.err.println("Error: " + e.getMessage());
        }
    }
}
```

### Multiple Resources

When using multiple resources, they are closed in reverse order of creation.

```java
import java.io.*;

public class TryWithResourcesMultiple {
    public static void copyFile(String source, String destination) throws IOException {
        // Resources are closed in reverse order: bw, br, fw, fr
        try (
            FileReader fr = new FileReader(source);
            BufferedReader br = new BufferedReader(fr);
            FileWriter fw = new FileWriter(destination);
            BufferedWriter bw = new BufferedWriter(fw)
        ) {
            String line;
            while ((line = br.readLine()) != null) {
                bw.write(line);
                bw.newLine();
            }
            System.out.println("File copied successfully");
        }
    }

    public static void main(String[] args) {
        try {
            copyFile("source.txt", "destination.txt");
        } catch (IOException e) {
            System.err.println("Copy failed: " + e.getMessage());
        }
    }
}
```

### Effectively Final Variables (Java 9+)

Java 9 allows using effectively final variables in try-with-resources.

```java
import java.io.*;

public class TryWithResourcesJava9 {
    public static void processReader(BufferedReader reader) throws IOException {
        // In Java 9+, effectively final variables can be used directly
        try (reader) {  // No need to create a new variable
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader("test.txt"));
        processReader(reader);
        // reader is closed after processReader returns
    }
}
```

### Creating Custom AutoCloseable Resources

Any class implementing `AutoCloseable` can be used with try-with-resources.

```java
public class CustomAutoCloseable implements AutoCloseable {
    private final String name;
    private boolean closed = false;

    public CustomAutoCloseable(String name) {
        this.name = name;
        System.out.println("Resource '" + name + "' opened");
    }

    public void doWork() {
        if (closed) {
            throw new IllegalStateException("Resource is closed");
        }
        System.out.println("Working with resource '" + name + "'");
    }

    @Override
    public void close() {
        if (!closed) {
            closed = true;
            System.out.println("Resource '" + name + "' closed");
        }
    }
}

// Database connection example
class DatabaseConnection implements AutoCloseable {
    private final String connectionString;
    private boolean connected = false;

    public DatabaseConnection(String connectionString) {
        this.connectionString = connectionString;
        connect();
    }

    private void connect() {
        System.out.println("Connecting to: " + connectionString);
        connected = true;
    }

    public void executeQuery(String sql) {
        if (!connected) {
            throw new IllegalStateException("Not connected");
        }
        System.out.println("Executing: " + sql);
    }

    @Override
    public void close() {
        if (connected) {
            System.out.println("Closing connection");
            connected = false;
        }
    }
}

public class CustomAutoCloseableDemo {
    public static void main(String[] args) {
        try (
            CustomAutoCloseable resource1 = new CustomAutoCloseable("First");
            CustomAutoCloseable resource2 = new CustomAutoCloseable("Second")
        ) {
            resource1.doWork();
            resource2.doWork();
        }

        System.out.println();

        try (DatabaseConnection db = new DatabaseConnection("jdbc:mysql://localhost/mydb")) {
            db.executeQuery("SELECT * FROM users");
            db.executeQuery("SELECT * FROM orders");
        }
    }
}
```

### Suppressed Exceptions

When both the try block and the close() method throw exceptions, the exception from the close() method is suppressed (attached to the primary exception).

```java
public class SuppressedExceptionDemo {
    static class ProblematicResource implements AutoCloseable {
        private final String name;

        public ProblematicResource(String name) {
            this.name = name;
        }

        public void doWork() throws Exception {
            throw new Exception("Error in doWork() for " + name);
        }

        @Override
        public void close() throws Exception {
            throw new Exception("Error in close() for " + name);
        }
    }

    public static void main(String[] args) {
        try (
            ProblematicResource r1 = new ProblematicResource("Resource1");
            ProblematicResource r2 = new ProblematicResource("Resource2")
        ) {
            r1.doWork(); // This throws an exception
        } catch (Exception e) {
            System.out.println("Primary exception: " + e.getMessage());

            // Get suppressed exceptions
            Throwable[] suppressed = e.getSuppressed();
            System.out.println("Number of suppressed: " + suppressed.length);

            for (Throwable t : suppressed) {
                System.out.println("  Suppressed: " + t.getMessage());
            }
        }
    }
}
```

Output:
```
Primary exception: Error in doWork() for Resource1
Number of suppressed: 2
  Suppressed: Error in close() for Resource2
  Suppressed: Error in close() for Resource1
```

## Throws and Throw Keywords

### The throw Keyword

The `throw` keyword is used to explicitly throw an exception from code.

```java
public class ThrowKeywordExamples {

    // Throwing built-in exceptions
    public static void validateAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative: " + age);
        }
        if (age > 150) {
            throw new IllegalArgumentException("Age is unrealistic: " + age);
        }
        System.out.println("Valid age: " + age);
    }

    // Throwing with condition
    public static double divide(double a, double b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero is not allowed");
        }
        return a / b;
    }

    // Re-throwing an exception
    public static void processData(String data) {
        try {
            int value = Integer.parseInt(data);
            System.out.println("Processed: " + value);
        } catch (NumberFormatException e) {
            System.out.println("Logging: Invalid data format");
            throw e; // Re-throw the same exception
        }
    }

    // Wrapping and re-throwing
    public static void processDataWrapped(String data) {
        try {
            int value = Integer.parseInt(data);
            System.out.println("Processed: " + value);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Failed to process data: " + data, e);
        }
    }

    public static void main(String[] args) {
        try {
            validateAge(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("Validation error: " + e.getMessage());
        }

        try {
            processDataWrapped("not-a-number");
        } catch (RuntimeException e) {
            System.out.println("Error: " + e.getMessage());
            System.out.println("Cause: " + e.getCause().getMessage());
        }
    }
}
```

### The throws Keyword

The `throws` keyword is used in a method signature to declare that the method might throw one or more exceptions.

```java
import java.io.*;
import java.sql.*;

public class ThrowsKeywordExamples {

    // Single exception
    public static String readFile(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        return reader.readLine();
    }

    // Multiple exceptions
    public static void processDatabase(String path, String query)
            throws IOException, SQLException {
        // Read configuration
        String config = readFile(path);

        // Execute query (simulated)
        if (query.isEmpty()) {
            throw new SQLException("Query cannot be empty");
        }
    }

    // Propagating exceptions through call chain
    public static void level1() throws IOException {
        level2();
    }

    public static void level2() throws IOException {
        level3();
    }

    public static void level3() throws IOException {
        throw new IOException("Error at level 3");
    }

    public static void main(String[] args) {
        // Must handle or declare the exception
        try {
            level1();
        } catch (IOException e) {
            System.out.println("Caught at main: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

### Throw vs Throws Comparison

| Aspect | throw | throws |
|--------|-------|--------|
| Location | Inside method body | In method signature |
| Purpose | Creates and throws an exception | Declares possible exceptions |
| Count | One exception at a time | Multiple exceptions comma-separated |
| Followed by | Exception instance | Exception class name(s) |

```java
public class ThrowVsThrows {
    // 'throws' declares what exceptions may be thrown
    public void method1() throws IOException, SQLException {
        // 'throw' actually throws an exception
        throw new IOException("Something went wrong");
    }

    // Can declare more than you throw
    public void method2() throws IOException {
        // May or may not throw IOException
        if (Math.random() > 0.5) {
            throw new IOException("Random failure");
        }
    }

    // Unchecked exceptions don't need throws declaration
    public void method3() {
        throw new RuntimeException("No throws needed");
    }
}
```

## Custom Exceptions

Creating custom exceptions allows you to define domain-specific error conditions with meaningful names and additional context.

### Creating Custom Checked Exceptions

```java
// Basic custom checked exception
public class InsufficientFundsException extends Exception {
    private final double requiredAmount;
    private final double availableBalance;

    public InsufficientFundsException(double required, double available) {
        super(String.format(
            "Insufficient funds: required $%.2f, available $%.2f",
            required, available
        ));
        this.requiredAmount = required;
        this.availableBalance = available;
    }

    public InsufficientFundsException(String message, double required, double available) {
        super(message);
        this.requiredAmount = required;
        this.availableBalance = available;
    }

    public double getRequiredAmount() {
        return requiredAmount;
    }

    public double getAvailableBalance() {
        return availableBalance;
    }

    public double getShortfall() {
        return requiredAmount - availableBalance;
    }
}

// Using the custom exception
class BankAccount {
    private String accountNumber;
    private double balance;

    public BankAccount(String accountNumber, double initialBalance) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
    }

    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(amount, balance);
        }
        balance -= amount;
        System.out.printf("Withdrawal successful. New balance: $%.2f%n", balance);
    }

    public double getBalance() {
        return balance;
    }
}

public class CustomCheckedExceptionDemo {
    public static void main(String[] args) {
        BankAccount account = new BankAccount("ACC-001", 500.00);

        try {
            account.withdraw(750.00);
        } catch (InsufficientFundsException e) {
            System.out.println("Transaction failed: " + e.getMessage());
            System.out.printf("You need $%.2f more%n", e.getShortfall());
        }
    }
}
```

### Creating Custom Unchecked Exceptions

```java
// Custom unchecked exception with rich context
public class ValidationException extends RuntimeException {
    private final String fieldName;
    private final Object invalidValue;
    private final String constraint;

    public ValidationException(String fieldName, Object invalidValue, String constraint) {
        super(String.format(
            "Validation failed for '%s': value '%s' violates constraint '%s'",
            fieldName, invalidValue, constraint
        ));
        this.fieldName = fieldName;
        this.invalidValue = invalidValue;
        this.constraint = constraint;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getInvalidValue() {
        return invalidValue;
    }

    public String getConstraint() {
        return constraint;
    }
}

// Usage example
class UserRegistration {
    public void registerUser(String username, String email, int age) {
        // Validate username
        if (username == null || username.trim().isEmpty()) {
            throw new ValidationException("username", username, "must not be empty");
        }
        if (username.length() < 3) {
            throw new ValidationException("username", username, "minimum length is 3");
        }

        // Validate email
        if (email == null || !email.contains("@")) {
            throw new ValidationException("email", email, "must be a valid email");
        }

        // Validate age
        if (age < 18 || age > 120) {
            throw new ValidationException("age", age, "must be between 18 and 120");
        }

        System.out.println("User registered successfully: " + username);
    }
}
```

### Exception Hierarchy for Applications

Creating a hierarchy of custom exceptions provides better organization and handling.

```java
// Base application exception
public abstract class ApplicationException extends Exception {
    private final String errorCode;

    protected ApplicationException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    protected ApplicationException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

// Specific exception types
class DataAccessException extends ApplicationException {
    public DataAccessException(String message) {
        super("DB_ERROR", message);
    }

    public DataAccessException(String message, Throwable cause) {
        super("DB_ERROR", message, cause);
    }
}

class BusinessRuleException extends ApplicationException {
    public BusinessRuleException(String message) {
        super("BIZ_RULE", message);
    }
}

class AuthenticationException extends ApplicationException {
    public AuthenticationException(String message) {
        super("AUTH_ERROR", message);
    }
}

class AuthorizationException extends ApplicationException {
    public AuthorizationException(String message) {
        super("AUTHZ_ERROR", message);
    }
}

// Service using the exception hierarchy
class OrderService {
    public void placeOrder(String userId, String productId, int quantity)
            throws ApplicationException {

        // Check authentication
        if (userId == null) {
            throw new AuthenticationException("User must be logged in");
        }

        // Check authorization
        if (!hasPermission(userId, "PLACE_ORDER")) {
            throw new AuthorizationException("User lacks permission to place orders");
        }

        // Check business rules
        if (quantity <= 0) {
            throw new BusinessRuleException("Quantity must be positive");
        }

        // Data access
        try {
            saveOrder(userId, productId, quantity);
        } catch (Exception e) {
            throw new DataAccessException("Failed to save order", e);
        }
    }

    private boolean hasPermission(String userId, String permission) {
        return true; // Simplified
    }

    private void saveOrder(String userId, String productId, int quantity) {
        // Database operation
    }
}

// Handler that uses exception types
public class ExceptionHierarchyDemo {
    public static void main(String[] args) {
        OrderService service = new OrderService();

        try {
            service.placeOrder(null, "PROD-001", 5);
        } catch (AuthenticationException e) {
            System.out.println("Please log in: " + e.getMessage());
        } catch (AuthorizationException e) {
            System.out.println("Access denied: " + e.getMessage());
        } catch (BusinessRuleException e) {
            System.out.println("Invalid request: " + e.getMessage());
        } catch (DataAccessException e) {
            System.out.println("System error, please try again: " + e.getErrorCode());
        } catch (ApplicationException e) {
            System.out.println("Error [" + e.getErrorCode() + "]: " + e.getMessage());
        }
    }
}
```

## Exception Chaining

Exception chaining allows you to wrap low-level exceptions in higher-level exceptions while preserving the original cause.

```java
import java.io.*;
import java.sql.*;

public class ExceptionChainingDemo {

    // Low-level exception
    static class ConfigurationException extends Exception {
        public ConfigurationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    // Higher-level exception
    static class ServiceInitializationException extends Exception {
        public ServiceInitializationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static Properties loadConfig(String path) throws ConfigurationException {
        try {
            FileInputStream fis = new FileInputStream(path);
            Properties props = new Properties();
            props.load(fis);
            return props;
        } catch (IOException e) {
            throw new ConfigurationException("Failed to load config from: " + path, e);
        }
    }

    public static void initializeService(String configPath)
            throws ServiceInitializationException {
        try {
            Properties config = loadConfig(configPath);
            System.out.println("Service initialized with: " + config);
        } catch (ConfigurationException e) {
            throw new ServiceInitializationException(
                "Could not initialize service due to configuration error", e
            );
        }
    }

    public static void main(String[] args) {
        try {
            initializeService("nonexistent.properties");
        } catch (ServiceInitializationException e) {
            System.out.println("Error: " + e.getMessage());

            // Walk the exception chain
            Throwable cause = e.getCause();
            while (cause != null) {
                System.out.println("  Caused by: " + cause.getClass().getSimpleName()
                    + " - " + cause.getMessage());
                cause = cause.getCause();
            }

            System.out.println("\nFull stack trace:");
            e.printStackTrace();
        }
    }
}
```

## Best Practices

### Catch Specific Exceptions

Catch the most specific exception type possible. Catching generic `Exception` or `Throwable` can hide bugs and make debugging difficult.

```java
// BAD: Too generic
try {
    processFile(filename);
} catch (Exception e) {
    System.out.println("Something went wrong");
}

// GOOD: Specific exceptions
try {
    processFile(filename);
} catch (FileNotFoundException e) {
    System.out.println("File not found: " + filename);
    // Can offer to create file or select different one
} catch (PermissionException e) {
    System.out.println("Cannot access file: " + e.getMessage());
    // Can request elevated permissions
} catch (IOException e) {
    System.out.println("Error reading file: " + e.getMessage());
    // Generic IO error handling
}
```

### Never Swallow Exceptions

Empty catch blocks hide errors and make debugging extremely difficult.

```java
// BAD: Swallowing exception
try {
    riskyOperation();
} catch (Exception e) {
    // Silent failure - terrible!
}

// GOOD: At minimum, log the exception
try {
    riskyOperation();
} catch (Exception e) {
    logger.error("Operation failed", e);
    // Or at least:
    e.printStackTrace();
}

// BETTER: Handle appropriately
try {
    riskyOperation();
} catch (SpecificException e) {
    logger.error("Operation failed: {}", e.getMessage(), e);
    notifyUser("Operation failed. Please try again.");
    metrics.incrementCounter("operation.failures");
}
```

### Use Try-With-Resources for Cleanup

Always prefer try-with-resources over try-finally for managing resources.

```java
// BAD: Manual resource management
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader(path));
    return reader.readLine();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            // Nested try-catch for cleanup - ugly!
        }
    }
}

// GOOD: Try-with-resources
try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
    return reader.readLine();
}
```

### Provide Meaningful Exception Messages

Include context that helps with debugging.

```java
// BAD: Unhelpful message
throw new IllegalArgumentException("Invalid value");

// GOOD: Contextual message
throw new IllegalArgumentException(
    String.format("User age must be between %d and %d, but was: %d",
        MIN_AGE, MAX_AGE, age)
);

// GOOD: For custom exceptions, include structured data
throw new OrderValidationException(orderId, "quantity", quantity,
    "Quantity must be positive");
```

### Don't Use Exceptions for Flow Control

Exceptions should represent exceptional conditions, not regular control flow.

```java
// BAD: Using exception for flow control
public int findIndex(int[] array, int value) {
    try {
        int i = 0;
        while (true) {
            if (array[i] == value) return i;
            i++;
        }
    } catch (ArrayIndexOutOfBoundsException e) {
        return -1;
    }
}

// GOOD: Proper loop control
public int findIndex(int[] array, int value) {
    for (int i = 0; i < array.length; i++) {
        if (array[i] == value) return i;
    }
    return -1;
}
```

### Clean Up Resources in Case of Exceptions

Ensure resources are properly cleaned up even when exceptions occur.

```java
// GOOD: Using try-with-resources
public void processFiles(List<String> paths) {
    for (String path : paths) {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            processReader(reader);
        } catch (IOException e) {
            logger.warn("Failed to process {}: {}", path, e.getMessage());
            // Continue with next file
        }
    }
}

// GOOD: Transaction rollback pattern
public void transferFunds(Account from, Account to, double amount)
        throws TransferException {
    Transaction tx = beginTransaction();
    try {
        from.debit(amount);
        to.credit(amount);
        tx.commit();
    } catch (Exception e) {
        tx.rollback();
        throw new TransferException("Transfer failed", e);
    }
}
```

### Document Exceptions

Use Javadoc to document what exceptions a method can throw and under what conditions.

```java
/**
 * Withdraws the specified amount from this account.
 *
 * @param amount the amount to withdraw, must be positive
 * @return the new balance after withdrawal
 * @throws IllegalArgumentException if amount is negative or zero
 * @throws InsufficientFundsException if the account balance is less than amount
 * @throws AccountLockedException if the account is locked due to suspicious activity
 */
public double withdraw(double amount)
        throws InsufficientFundsException, AccountLockedException {
    if (amount <= 0) {
        throw new IllegalArgumentException("Amount must be positive: " + amount);
    }
    // ... implementation
}
```

### Fail Fast

Validate inputs early and fail immediately rather than processing with invalid data.

```java
// GOOD: Fail fast with validation
public void processOrder(Order order) {
    // Validate at the start
    Objects.requireNonNull(order, "Order cannot be null");
    Objects.requireNonNull(order.getCustomerId(), "Customer ID required");

    if (order.getItems().isEmpty()) {
        throw new IllegalArgumentException("Order must have at least one item");
    }

    for (OrderItem item : order.getItems()) {
        if (item.getQuantity() <= 0) {
            throw new IllegalArgumentException(
                "Invalid quantity for item " + item.getProductId()
            );
        }
    }

    // Now process with confidence that data is valid
    saveOrder(order);
    notifyWarehouse(order);
    chargeCustomer(order);
}
```

### Consider Using Optional Instead of Exceptions

For expected "not found" scenarios, `Optional` may be clearer than exceptions.

```java
// Option 1: Exception-based
public User findUserById(String id) throws UserNotFoundException {
    User user = database.lookup(id);
    if (user == null) {
        throw new UserNotFoundException(id);
    }
    return user;
}

// Option 2: Optional-based (often preferred for "not found")
public Optional<User> findUserById(String id) {
    return Optional.ofNullable(database.lookup(id));
}

// Usage
findUserById("123")
    .ifPresentOrElse(
        user -> System.out.println("Found: " + user.getName()),
        () -> System.out.println("User not found")
    );
```

### Preserve the Original Exception

When wrapping exceptions, always include the original as the cause.

```java
// BAD: Losing the original exception
try {
    readConfiguration();
} catch (IOException e) {
    throw new ConfigException("Failed to read config");  // Cause lost!
}

// GOOD: Preserving the cause
try {
    readConfiguration();
} catch (IOException e) {
    throw new ConfigException("Failed to read config", e);  // Cause preserved
}
```

## Common Exception Patterns

### Retry Pattern

```java
public class RetryPattern {
    public static <T> T executeWithRetry(
            Callable<T> operation,
            int maxAttempts,
            long delayMs) throws Exception {

        Exception lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return operation.call();
            } catch (Exception e) {
                lastException = e;
                System.out.printf("Attempt %d failed: %s%n", attempt, e.getMessage());

                if (attempt < maxAttempts) {
                    Thread.sleep(delayMs);
                }
            }
        }

        throw new Exception("All " + maxAttempts + " attempts failed", lastException);
    }

    public static void main(String[] args) {
        try {
            String result = executeWithRetry(
                () -> fetchFromServer(),
                3,
                1000
            );
            System.out.println("Result: " + result);
        } catch (Exception e) {
            System.out.println("Operation failed after retries: " + e.getMessage());
        }
    }

    private static String fetchFromServer() throws IOException {
        if (Math.random() < 0.7) {
            throw new IOException("Connection timeout");
        }
        return "Success!";
    }
}
```

### Circuit Breaker Pattern

```java
public class CircuitBreaker {
    private enum State { CLOSED, OPEN, HALF_OPEN }

    private State state = State.CLOSED;
    private int failureCount = 0;
    private final int threshold;
    private long lastFailureTime;
    private final long resetTimeout;

    public CircuitBreaker(int threshold, long resetTimeoutMs) {
        this.threshold = threshold;
        this.resetTimeout = resetTimeoutMs;
    }

    public <T> T execute(Callable<T> operation) throws Exception {
        if (state == State.OPEN) {
            if (System.currentTimeMillis() - lastFailureTime > resetTimeout) {
                state = State.HALF_OPEN;
            } else {
                throw new CircuitBreakerOpenException("Circuit is open");
            }
        }

        try {
            T result = operation.call();
            reset();
            return result;
        } catch (Exception e) {
            recordFailure();
            throw e;
        }
    }

    private void reset() {
        failureCount = 0;
        state = State.CLOSED;
    }

    private void recordFailure() {
        failureCount++;
        lastFailureTime = System.currentTimeMillis();
        if (failureCount >= threshold) {
            state = State.OPEN;
        }
    }

    static class CircuitBreakerOpenException extends Exception {
        public CircuitBreakerOpenException(String message) {
            super(message);
        }
    }
}
```

### Exception Translation in Layers

```java
// Repository layer
public class UserRepository {
    public User findById(String id) throws DataAccessException {
        try {
            // Database operation
            return database.query("SELECT * FROM users WHERE id = ?", id);
        } catch (SQLException e) {
            throw new DataAccessException("Failed to find user: " + id, e);
        }
    }
}

// Service layer
public class UserService {
    private final UserRepository repository;

    public User getUser(String id) throws UserNotFoundException, ServiceException {
        try {
            User user = repository.findById(id);
            if (user == null) {
                throw new UserNotFoundException(id);
            }
            return user;
        } catch (DataAccessException e) {
            throw new ServiceException("Error retrieving user", e);
        }
    }
}

// Controller layer
@RestController
public class UserController {
    private final UserService service;

    @GetMapping("/users/{id}")
    public ResponseEntity<User> getUser(@PathVariable String id) {
        try {
            User user = service.getUser(id);
            return ResponseEntity.ok(user);
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (ServiceException e) {
            logger.error("Error getting user", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
```

## Summary

Exception handling is a critical skill for Java developers. Here are the key takeaways:

1. **Exception Hierarchy**: Understand the difference between `Error`, checked exceptions, and unchecked exceptions. Use appropriate types for different situations.

2. **Try-Catch-Finally**: Master the fundamental structure for handling exceptions. Use finally for cleanup when try-with-resources is not applicable.

3. **Try-With-Resources**: Always prefer this modern approach for managing resources that implement `AutoCloseable`. It eliminates resource leaks and simplifies code.

4. **Custom Exceptions**: Create domain-specific exceptions to provide meaningful error information and enable precise error handling.

5. **Exception Chaining**: Preserve the original cause when wrapping exceptions to maintain full debugging information.

6. **Best Practices**:
   - Catch specific exceptions
   - Never swallow exceptions
   - Provide meaningful messages
   - Document thrown exceptions
   - Use exceptions for exceptional conditions only
   - Fail fast with validation

By following these principles and patterns, you can build robust Java applications that handle errors gracefully and provide clear feedback when things go wrong.
