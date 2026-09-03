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
origin: old/src/content/docs/java/exceptions.zh.md
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

异常处理是 Java 中最关键的机制之一，它使程序能够优雅地处理运行时错误和异常情况。Java 提供了一种结构化的方法来检测、报告和恢复错误，而不是让程序意外崩溃，从而使应用程序更加健壮和用户友好。

## 什么是异常？

异常是一个打断程序正常执行流程的事件。当方法内发生错误时，该方法会创建一个异常对象，其中包含有关错误的信息，包括错误类型、程序状态和堆栈跟踪。然后，该方法将此对象交给运行时系统，这个过程称为"抛出异常"。

运行时系统随后会在调用栈中搜索包含能够处理该异常的代码的方法（异常处理器）。如果找到，异常将传递给该处理器。如果没有找到合适的处理器，程序将终止。

```java
public class ExceptionBasics {
    public static void main(String[] args) {
        int[] numbers = {1, 2, 3};

        // 这将抛出 ArrayIndexOutOfBoundsException
        System.out.println(numbers[5]);

        // 这行代码永远不会执行
        System.out.println("Program completed");
    }
}
```

## 异常层次结构

Java 的异常层次结构建立在以 `java.lang.Throwable` 为根的良好定义的类结构之上。理解这个层次结构对于有效的异常处理至关重要。

```
java.lang.Object
    └── java.lang.Throwable
            ├── java.lang.Error
            │       ├── OutOfMemoryError
            │       ├── StackOverflowError
            │       ├── VirtualMachineError
            │       └── ...（其他错误）
            │
            └── java.lang.Exception
                    ├── java.lang.RuntimeException（非检查型）
                    │       ├── NullPointerException
                    │       ├── ArrayIndexOutOfBoundsException
                    │       ├── ArithmeticException
                    │       ├── IllegalArgumentException
                    │       ├── ClassCastException
                    │       └── ...（其他运行时异常）
                    │
                    └── 检查型异常
                            ├── IOException
                            ├── SQLException
                            ├── ClassNotFoundException
                            ├── InterruptedException
                            └── ...（其他检查型异常）
```

### 层次结构中的关键类

#### Throwable

`Throwable` 类是 Java 中所有错误和异常的超类。它提供了异常处理的基本方法：

```java
public class ThrowableMethodsDemo {
    public static void main(String[] args) {
        try {
            throw new Exception("Something went wrong");
        } catch (Exception e) {
            // 获取错误消息
            System.out.println("Message: " + e.getMessage());

            // 获取本地化消息
            System.out.println("Localized: " + e.getLocalizedMessage());

            // 获取原因（如果有）
            System.out.println("Cause: " + e.getCause());

            // 打印堆栈跟踪
            e.printStackTrace();

            // 以数组形式获取堆栈跟踪
            StackTraceElement[] stackTrace = e.getStackTrace();
            for (StackTraceElement element : stackTrace) {
                System.out.println("  at " + element);
            }
        }
    }
}
```

#### Error

`Error` 表示应用程序不应尝试捕获的严重问题。这些通常表示超出应用程序控制范围的系统级问题。

```java
public class ErrorExamples {
    // StackOverflowError - 无限递归
    public static void infiniteRecursion() {
        infiniteRecursion(); // 永远不要这样做！
    }

    // OutOfMemoryError - 内存耗尽
    public static void exhaustMemory() {
        List<byte[]> list = new ArrayList<>();
        while (true) {
            list.add(new byte[1024 * 1024]); // 1MB 块
        }
    }

    public static void main(String[] args) {
        // 这些演示了错误 - 不要在生产环境中运行！
        // infiniteRecursion();  // 导致 StackOverflowError
        // exhaustMemory();       // 导致 OutOfMemoryError
    }
}
```

常见的错误包括：
- `OutOfMemoryError`：JVM 无法分配内存
- `StackOverflowError`：栈空间耗尽（通常由无限递归引起）
- `VirtualMachineError`：JVM 损坏或资源耗尽
- `NoClassDefFoundError`：运行时找不到类定义

#### Exception

`Exception` 表示应用程序应该捕获和处理的情况。它分为两类：检查型异常和非检查型异常。

## 检查型异常与非检查型异常

理解检查型异常和非检查型异常之间的区别是 Java 异常处理的基础。

### 检查型异常

检查型异常是编译器强制你处理的异常。它们表示编写良好的应用程序应该预见并处理的可恢复条件。

```java
import java.io.*;

public class CheckedExceptionExample {
    // 方法必须声明 throws 或处理异常
    public static String readFile(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        try {
            return reader.readLine();
        } finally {
            reader.close();
        }
    }

    public static void main(String[] args) {
        // 选项1：使用 try-catch 处理
        try {
            String content = readFile("data.txt");
            System.out.println(content);
        } catch (IOException e) {
            System.err.println("Error reading file: " + e.getMessage());
        }

        // 选项2：在 throws 子句中声明（传播给调用者）
        // public static void main(String[] args) throws IOException {
        //     String content = readFile("data.txt");
        // }
    }
}
```

常见的检查型异常：
- `IOException`：I/O 操作失败
- `SQLException`：数据库访问错误
- `ClassNotFoundException`：反射时找不到类
- `InterruptedException`：线程等待时被中断
- `FileNotFoundException`：文件不存在
- `ParseException`：解析数据时出错

### 非检查型异常（运行时异常）

非检查型异常继承自 `RuntimeException`，不需要显式处理。它们通常表示应该在代码中修复的编程错误，而不是在运行时捕获。

```java
public class UncheckedExceptionExamples {
    public static void main(String[] args) {
        // NullPointerException
        String str = null;
        // str.length(); // 会抛出 NullPointerException

        // ArrayIndexOutOfBoundsException
        int[] arr = {1, 2, 3};
        // int val = arr[10]; // 会抛出 ArrayIndexOutOfBoundsException

        // ArithmeticException
        // int result = 10 / 0; // 会抛出 ArithmeticException

        // NumberFormatException
        // int num = Integer.parseInt("abc"); // 会抛出 NumberFormatException

        // ClassCastException
        Object obj = "Hello";
        // Integer num = (Integer) obj; // 会抛出 ClassCastException

        // IllegalArgumentException
        // Thread.sleep(-1000); // 会抛出 IllegalArgumentException
    }
}
```

常见的非检查型异常：
- `NullPointerException`：使用了空引用
- `ArrayIndexOutOfBoundsException`：无效的数组索引
- `ArithmeticException`：非法的算术运算
- `NumberFormatException`：无效的数字字符串
- `ClassCastException`：无效的类型转换
- `IllegalArgumentException`：无效的方法参数
- `IllegalStateException`：对象处于无效状态

### 何时使用每种类型

| 方面 | 检查型异常 | 非检查型异常 |
|--------|------------------|---------------------|
| 恢复性 | 调用者可以合理恢复 | 通常表示 bug |
| 处理 | 必须捕获或声明 | 可选处理 |
| 示例 | 文件未找到、网络错误 | 空指针、数组越界 |
| 适用于 | 外部故障 | 编程错误 |

## Try-Catch-Finally 代码块

`try-catch-finally` 代码块是 Java 中处理异常的基本结构。

### 基本语法

```java
try {
    // 可能抛出异常的代码
} catch (ExceptionType1 e) {
    // 处理 ExceptionType1
} catch (ExceptionType2 e) {
    // 处理 ExceptionType2
} finally {
    // 始终执行，无论是否发生异常
    // 用于清理操作
}
```

### 完整的 Try-Catch 示例

```java
import java.io.*;
import java.util.*;

public class TryCatchComprehensive {
    public static void main(String[] args) {
        // 示例1：基本的 try-catch
        try {
            int result = divide(10, 0);
            System.out.println("Result: " + result);
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero: " + e.getMessage());
        }

        // 示例2：多个 catch 块（顺序很重要！）
        try {
            processFile("nonexistent.txt");
        } catch (FileNotFoundException e) {
            System.out.println("File not found: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("IO error: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("Unexpected error: " + e.getMessage());
        }

        // 示例3：嵌套的 try-catch
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

### 多重捕获（Java 7+）

Java 7 引入了使用管道符（`|`）在单个 catch 块中捕获多种异常类型的能力。

```java
public class MultiCatchExample {
    public static void process(String input, String filename) {
        try {
            // 可能抛出不同异常的多个操作
            int number = Integer.parseInt(input);
            FileReader reader = new FileReader(filename);

            // 使用反射
            Class<?> clazz = Class.forName("com.example.MyClass");

        } catch (NumberFormatException | FileNotFoundException e) {
            // 以相同方式处理两种异常
            System.out.println("Input error: " + e.getMessage());

        } catch (ClassNotFoundException e) {
            // 单独处理
            System.out.println("Class not found: " + e.getMessage());
        }
    }

    // 注意：在多重捕获中，异常变量实际上是 final 的
    public static void multiCatchDetails() {
        try {
            throw new IllegalArgumentException("Test");
        } catch (IllegalArgumentException | IllegalStateException e) {
            // e 实际上是 final 的 - 无法重新赋值
            // e = new IllegalArgumentException("new"); // 编译错误！

            System.out.println("Exception type: " + e.getClass().getSimpleName());
        }
    }
}
```

### Finally 代码块

`finally` 代码块无论是否抛出异常都会执行。它对于清理操作至关重要。

```java
import java.io.*;
import java.sql.*;

public class FinallyBlockExamples {

    // 示例1：资源清理
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
            // 清理：关闭 reader
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

    // 示例2：带 return 语句的 finally
    public static int demonstrateFinallyWithReturn() {
        try {
            System.out.println("In try block");
            return 1;
        } finally {
            System.out.println("Finally block executed before return");
            // 注意：从 finally 返回是不推荐的，因为它会覆盖 try 的返回值
            // return 2; // 这会使方法返回 2 而不是 1
        }
    }

    // 示例3：带异常的 finally
    public static void finallyWithException() {
        try {
            System.out.println("In try block");
            throw new RuntimeException("Exception in try");
        } catch (RuntimeException e) {
            System.out.println("In catch block");
            throw e; // 重新抛出
        } finally {
            System.out.println("Finally block still executes!");
        }
    }

    // 示例4：finally 不执行的情况
    public static void finallyMayNotExecute() {
        try {
            System.out.println("Exiting JVM...");
            System.exit(0); // 在此之后 finally 不会执行
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

### 重要的 Finally 代码块行为

1. **在 try/catch 之后执行**：始终在 try 和任何 catch 块之后运行
2. **即使有 return 也执行**：在方法返回之前运行
3. **即使有异常也执行**：即使抛出未被捕获的异常也会运行
4. **不执行的情况**：
   - 调用 `System.exit()`
   - JVM 崩溃
   - 线程以某些方式被终止或中断

## Try-With-Resources（Java 7+）

try-with-resources 语句自动管理实现 `AutoCloseable` 或 `Closeable` 的资源。这消除了显式 finally 块进行清理的需要，并防止资源泄漏。

### 基本语法

```java
try (Resource resource = new Resource()) {
    // 使用资源
} catch (Exception e) {
    // 处理异常
}
// 资源在这里自动关闭
```

### 单个资源

```java
import java.io.*;

public class TryWithResourcesSingle {
    public static String readFirstLine(String path) throws IOException {
        // BufferedReader 在 try 块之后自动关闭
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            return reader.readLine();
        }
        // 不需要 finally 块！
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

### 多个资源

当使用多个资源时，它们按创建的相反顺序关闭。

```java
import java.io.*;

public class TryWithResourcesMultiple {
    public static void copyFile(String source, String destination) throws IOException {
        // 资源按相反顺序关闭：bw, br, fw, fr
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

### 有效 final 变量（Java 9+）

Java 9 允许在 try-with-resources 中使用有效 final 变量。

```java
import java.io.*;

public class TryWithResourcesJava9 {
    public static void processReader(BufferedReader reader) throws IOException {
        // 在 Java 9+ 中，有效 final 变量可以直接使用
        try (reader) {  // 不需要创建新变量
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
    }

    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader("test.txt"));
        processReader(reader);
        // reader 在 processReader 返回后关闭
    }
}
```

### 创建自定义 AutoCloseable 资源

任何实现 `AutoCloseable` 的类都可以与 try-with-resources 一起使用。

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

// 数据库连接示例
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

### 被抑制的异常

当 try 块和 close() 方法都抛出异常时，来自 close() 方法的异常会被抑制（附加到主异常）。

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
            r1.doWork(); // 这会抛出异常
        } catch (Exception e) {
            System.out.println("Primary exception: " + e.getMessage());

            // 获取被抑制的异常
            Throwable[] suppressed = e.getSuppressed();
            System.out.println("Number of suppressed: " + suppressed.length);

            for (Throwable t : suppressed) {
                System.out.println("  Suppressed: " + t.getMessage());
            }
        }
    }
}
```

输出：
```
Primary exception: Error in doWork() for Resource1
Number of suppressed: 2
  Suppressed: Error in close() for Resource2
  Suppressed: Error in close() for Resource1
```

## Throws 和 Throw 关键字

### throw 关键字

`throw` 关键字用于从代码中显式抛出异常。

```java
public class ThrowKeywordExamples {

    // 抛出内置异常
    public static void validateAge(int age) {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative: " + age);
        }
        if (age > 150) {
            throw new IllegalArgumentException("Age is unrealistic: " + age);
        }
        System.out.println("Valid age: " + age);
    }

    // 带条件抛出
    public static double divide(double a, double b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero is not allowed");
        }
        return a / b;
    }

    // 重新抛出异常
    public static void processData(String data) {
        try {
            int value = Integer.parseInt(data);
            System.out.println("Processed: " + value);
        } catch (NumberFormatException e) {
            System.out.println("Logging: Invalid data format");
            throw e; // 重新抛出相同的异常
        }
    }

    // 包装并重新抛出
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

### throws 关键字

`throws` 关键字用于方法签名中，声明该方法可能抛出一个或多个异常。

```java
import java.io.*;
import java.sql.*;

public class ThrowsKeywordExamples {

    // 单个异常
    public static String readFile(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        return reader.readLine();
    }

    // 多个异常
    public static void processDatabase(String path, String query)
            throws IOException, SQLException {
        // 读取配置
        String config = readFile(path);

        // 执行查询（模拟）
        if (query.isEmpty()) {
            throw new SQLException("Query cannot be empty");
        }
    }

    // 通过调用链传播异常
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
        // 必须处理或声明异常
        try {
            level1();
        } catch (IOException e) {
            System.out.println("Caught at main: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

### Throw 与 Throws 对比

| 方面 | throw | throws |
|--------|-------|--------|
| 位置 | 在方法体内 | 在方法签名中 |
| 用途 | 创建并抛出异常 | 声明可能的异常 |
| 数量 | 一次一个异常 | 多个异常用逗号分隔 |
| 后跟 | 异常实例 | 异常类名 |

```java
public class ThrowVsThrows {
    // 'throws' 声明可能抛出什么异常
    public void method1() throws IOException, SQLException {
        // 'throw' 实际抛出异常
        throw new IOException("Something went wrong");
    }

    // 可以声明比实际抛出更多的异常
    public void method2() throws IOException {
        // 可能抛出也可能不抛出 IOException
        if (Math.random() > 0.5) {
            throw new IOException("Random failure");
        }
    }

    // 非检查型异常不需要 throws 声明
    public void method3() {
        throw new RuntimeException("No throws needed");
    }
}
```

## 自定义异常

创建自定义异常允许你定义具有有意义名称和附加上下文的领域特定错误条件。

### 创建自定义检查型异常

```java
// 基本的自定义检查型异常
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

// 使用自定义异常
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

### 创建自定义非检查型异常

```java
// 带有丰富上下文的自定义非检查型异常
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

// 使用示例
class UserRegistration {
    public void registerUser(String username, String email, int age) {
        // 验证用户名
        if (username == null || username.trim().isEmpty()) {
            throw new ValidationException("username", username, "must not be empty");
        }
        if (username.length() < 3) {
            throw new ValidationException("username", username, "minimum length is 3");
        }

        // 验证邮箱
        if (email == null || !email.contains("@")) {
            throw new ValidationException("email", email, "must be a valid email");
        }

        // 验证年龄
        if (age < 18 || age > 120) {
            throw new ValidationException("age", age, "must be between 18 and 120");
        }

        System.out.println("User registered successfully: " + username);
    }
}
```

### 应用程序的异常层次结构

为应用程序创建异常层次结构可以提供更好的组织和处理能力。

```java
// 基础应用程序异常
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

// 特定的异常类型
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

// 使用异常层次结构的服务
class OrderService {
    public void placeOrder(String userId, String productId, int quantity)
            throws ApplicationException {

        // 检查认证
        if (userId == null) {
            throw new AuthenticationException("User must be logged in");
        }

        // 检查授权
        if (!hasPermission(userId, "PLACE_ORDER")) {
            throw new AuthorizationException("User lacks permission to place orders");
        }

        // 检查业务规则
        if (quantity <= 0) {
            throw new BusinessRuleException("Quantity must be positive");
        }

        // 数据访问
        try {
            saveOrder(userId, productId, quantity);
        } catch (Exception e) {
            throw new DataAccessException("Failed to save order", e);
        }
    }

    private boolean hasPermission(String userId, String permission) {
        return true; // 简化
    }

    private void saveOrder(String userId, String productId, int quantity) {
        // 数据库操作
    }
}

// 使用异常类型的处理器
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

## 异常链

异常链允许你将低级异常包装在高级异常中，同时保留原始原因。

```java
import java.io.*;
import java.sql.*;

public class ExceptionChainingDemo {

    // 低级异常
    static class ConfigurationException extends Exception {
        public ConfigurationException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    // 高级异常
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

            // 遍历异常链
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

## 最佳实践

### 捕获特定异常

尽可能捕获最具体的异常类型。捕获通用的 `Exception` 或 `Throwable` 可能会隐藏 bug 并使调试变得困难。

```java
// 不好：太通用
try {
    processFile(filename);
} catch (Exception e) {
    System.out.println("Something went wrong");
}

// 好：特定异常
try {
    processFile(filename);
} catch (FileNotFoundException e) {
    System.out.println("File not found: " + filename);
    // 可以提供创建文件或选择其他文件的选项
} catch (PermissionException e) {
    System.out.println("Cannot access file: " + e.getMessage());
    // 可以请求提升权限
} catch (IOException e) {
    System.out.println("Error reading file: " + e.getMessage());
    // 通用 IO 错误处理
}
```

### 永远不要吞掉异常

空的 catch 块会隐藏错误，使调试变得极其困难。

```java
// 不好：吞掉异常
try {
    riskyOperation();
} catch (Exception e) {
    // 静默失败 - 很糟糕！
}

// 好：至少记录异常
try {
    riskyOperation();
} catch (Exception e) {
    logger.error("Operation failed", e);
    // 或者至少：
    e.printStackTrace();
}

// 更好：适当处理
try {
    riskyOperation();
} catch (SpecificException e) {
    logger.error("Operation failed: {}", e.getMessage(), e);
    notifyUser("Operation failed. Please try again.");
    metrics.incrementCounter("operation.failures");
}
```

### 使用 Try-With-Resources 进行清理

始终优先使用 try-with-resources 而不是 try-finally 来管理资源。

```java
// 不好：手动资源管理
BufferedReader reader = null;
try {
    reader = new BufferedReader(new FileReader(path));
    return reader.readLine();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            // 嵌套的 try-catch 用于清理 - 很丑陋！
        }
    }
}

// 好：Try-with-resources
try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
    return reader.readLine();
}
```

### 提供有意义的异常消息

包含有助于调试的上下文信息。

```java
// 不好：无用的消息
throw new IllegalArgumentException("Invalid value");

// 好：有上下文的消息
throw new IllegalArgumentException(
    String.format("User age must be between %d and %d, but was: %d",
        MIN_AGE, MAX_AGE, age)
);

// 好：对于自定义异常，包含结构化数据
throw new OrderValidationException(orderId, "quantity", quantity,
    "Quantity must be positive");
```

### 不要将异常用于流程控制

异常应该表示异常情况，而不是常规的控制流。

```java
// 不好：使用异常进行流程控制
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

// 好：正确的循环控制
public int findIndex(int[] array, int value) {
    for (int i = 0; i < array.length; i++) {
        if (array[i] == value) return i;
    }
    return -1;
}
```

### 在异常情况下清理资源

确保即使发生异常也能正确清理资源。

```java
// 好：使用 try-with-resources
public void processFiles(List<String> paths) {
    for (String path : paths) {
        try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
            processReader(reader);
        } catch (IOException e) {
            logger.warn("Failed to process {}: {}", path, e.getMessage());
            // 继续处理下一个文件
        }
    }
}

// 好：事务回滚模式
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

### 文档化异常

使用 Javadoc 记录方法可能抛出的异常及其条件。

```java
/**
 * 从此账户提取指定金额。
 *
 * @param amount 要提取的金额，必须为正数
 * @return 提取后的新余额
 * @throws IllegalArgumentException 如果金额为负数或零
 * @throws InsufficientFundsException 如果账户余额小于金额
 * @throws AccountLockedException 如果账户因可疑活动被锁定
 */
public double withdraw(double amount)
        throws InsufficientFundsException, AccountLockedException {
    if (amount <= 0) {
        throw new IllegalArgumentException("Amount must be positive: " + amount);
    }
    // ... 实现
}
```

### 快速失败

尽早验证输入并立即失败，而不是使用无效数据进行处理。

```java
// 好：快速失败验证
public void processOrder(Order order) {
    // 在开始时验证
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

    // 现在可以确信数据是有效的
    saveOrder(order);
    notifyWarehouse(order);
    chargeCustomer(order);
}
```

### 考虑使用 Optional 代替异常

对于预期的"未找到"场景，`Optional` 可能比异常更清晰。

```java
// 选项1：基于异常
public User findUserById(String id) throws UserNotFoundException {
    User user = database.lookup(id);
    if (user == null) {
        throw new UserNotFoundException(id);
    }
    return user;
}

// 选项2：基于 Optional（通常更适合"未找到"场景）
public Optional<User> findUserById(String id) {
    return Optional.ofNullable(database.lookup(id));
}

// 使用方式
findUserById("123")
    .ifPresentOrElse(
        user -> System.out.println("Found: " + user.getName()),
        () -> System.out.println("User not found")
    );
```

### 保留原始异常

包装异常时，始终将原始异常作为原因包含在内。

```java
// 不好：丢失原始异常
try {
    readConfiguration();
} catch (IOException e) {
    throw new ConfigException("Failed to read config");  // 原因丢失！
}

// 好：保留原因
try {
    readConfiguration();
} catch (IOException e) {
    throw new ConfigException("Failed to read config", e);  // 保留原因
}
```

## 常见异常模式

### 重试模式

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

### 断路器模式

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

### 层间异常转换

```java
// 仓储层
public class UserRepository {
    public User findById(String id) throws DataAccessException {
        try {
            // 数据库操作
            return database.query("SELECT * FROM users WHERE id = ?", id);
        } catch (SQLException e) {
            throw new DataAccessException("Failed to find user: " + id, e);
        }
    }
}

// 服务层
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

// 控制器层
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

## 总结

异常处理是 Java 开发人员的关键技能。以下是主要要点：

1. **异常层次结构**：理解 `Error`、检查型异常和非检查型异常之间的区别。针对不同情况使用适当的类型。

2. **Try-Catch-Finally**：掌握处理异常的基本结构。当 try-with-resources 不适用时，使用 finally 进行清理。

3. **Try-With-Resources**：始终优先使用这种现代方法来管理实现 `AutoCloseable` 的资源。它消除了资源泄漏并简化了代码。

4. **自定义异常**：创建领域特定的异常以提供有意义的错误信息并实现精确的错误处理。

5. **异常链**：包装异常时保留原始原因，以维护完整的调试信息。

6. **最佳实践**：
   - 捕获特定异常
   - 永远不要吞掉异常
   - 提供有意义的消息
   - 文档化抛出的异常
   - 仅对异常情况使用异常
   - 通过验证快速失败

通过遵循这些原则和模式，你可以构建健壮的 Java 应用程序，优雅地处理错误，并在出现问题时提供清晰的反馈。
