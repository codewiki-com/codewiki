---
title: Annotations
description: Complete guide to Java annotations, built-in annotations, custom annotations and annotation processors
track: java
section: oop-generics
difficulty: advanced
tags:
  - Java
  - Annotations
  - Metaprogramming
status: imported
origin: old/src/content/docs/java/annotations.en.md
divergence: 0.202
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: Advanced Features
  order: 9
  lastUpdated: 2026-01-07
---

Java Annotations, introduced in Java 5, provide a powerful mechanism for adding metadata to your code. They allow you to embed supplemental information directly in your source code, which can be processed at compile-time or runtime to generate code, validate constraints, configure frameworks, and much more.

## Introduction to Annotations

Annotations are a form of metadata that provide data about a program but are not part of the program itself. They have no direct effect on the operation of the code they annotate, but they can be used by:

- **The compiler**: To detect errors or suppress warnings
- **Compile-time processors**: To generate code, XML files, or other artifacts
- **Runtime processors**: To examine and modify behavior through reflection

### Basic Syntax

Annotations begin with the `@` symbol followed by the annotation name:

```java
@Override
public String toString() {
    return "Example";
}

@Deprecated
public void oldMethod() {
    // This method is deprecated
}

@SuppressWarnings("unchecked")
public void methodWithWarning() {
    List list = new ArrayList(); // Raw type warning suppressed
}
```

### Annotations with Elements

Annotations can have elements (parameters) that provide additional information:

```java
// Single element - can omit the element name if it's "value"
@SuppressWarnings("deprecation")

// Multiple elements
@Author(name = "John Doe", date = "2024-01-15")
public class MyClass {
}

// Array values
@SuppressWarnings({"unchecked", "deprecation"})
public void multipleWarnings() {
}
```

## Built-in Annotations

Java provides several built-in annotations in the `java.lang` and `java.lang.annotation` packages.

### @Override

Indicates that a method is intended to override a method in a superclass. The compiler generates an error if the method does not actually override anything.

```java
public class Animal {
    public void makeSound() {
        System.out.println("Some sound");
    }
}

public class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Bark!");
    }

    // @Override
    // public void makeSounds() { } // Compile error - typo in method name!
}
```

### @Deprecated

Marks a program element as deprecated, indicating it should no longer be used:

```java
public class LegacyAPI {
    /**
     * @deprecated Use {@link #newMethod()} instead.
     */
    @Deprecated
    public void oldMethod() {
        // Old implementation
    }

    public void newMethod() {
        // New implementation
    }
}

// Using deprecated method generates a warning
LegacyAPI api = new LegacyAPI();
api.oldMethod(); // Warning: oldMethod() is deprecated
```

Since Java 9, `@Deprecated` has additional elements:

```java
@Deprecated(since = "9", forRemoval = true)
public void legacyMethod() {
    // Will be removed in a future version
}
```

### @SuppressWarnings

Instructs the compiler to suppress specific warnings:

```java
public class SuppressWarningsExample {

    @SuppressWarnings("deprecation")
    public void useDeprecatedMethod() {
        new LegacyAPI().oldMethod(); // No warning
    }

    @SuppressWarnings("unchecked")
    public void useRawTypes() {
        List list = new ArrayList(); // No warning
        list.add("item");
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public void multipleSuppressed() {
        Map map = new HashMap(); // No warnings
    }
}
```

Common warning types:
- `deprecation` - Using deprecated elements
- `unchecked` - Unchecked type operations
- `rawtypes` - Using raw types
- `unused` - Unused variables, methods, etc.
- `serial` - Missing serialVersionUID
- `fallthrough` - Fall-through in switch statements

### @SafeVarargs

Asserts that the code does not perform potentially unsafe operations on its varargs parameter:

```java
public class SafeVarargsExample {

    // Without @SafeVarargs, this would generate a warning
    @SafeVarargs
    public static <T> List<T> asList(T... elements) {
        return Arrays.asList(elements);
    }

    @SafeVarargs
    public final <T> void process(T... items) {
        for (T item : items) {
            System.out.println(item);
        }
    }
}
```

Note: `@SafeVarargs` can only be applied to methods that cannot be overridden (static, final, or private methods, and constructors).

### @FunctionalInterface

Indicates that an interface is intended to be a functional interface (having exactly one abstract method):

```java
@FunctionalInterface
public interface Processor<T, R> {
    R process(T input);

    // Default methods are allowed
    default void log(T input) {
        System.out.println("Processing: " + input);
    }

    // Static methods are allowed
    static <T> Processor<T, T> identity() {
        return t -> t;
    }

    // Cannot add another abstract method
    // void anotherMethod(); // Compile error!
}

// Usage with lambda
Processor<String, Integer> lengthProcessor = String::length;
```

## Meta-Annotations

Meta-annotations are annotations that apply to other annotations. They define how custom annotations behave.

### @Retention

Specifies how long annotations are to be retained:

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

// Only in source code, discarded by compiler
@Retention(RetentionPolicy.SOURCE)
public @interface SourceOnly {
}

// Recorded in class file, not available at runtime
@Retention(RetentionPolicy.CLASS)
public @interface ClassOnly {
}

// Available at runtime through reflection
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeAvailable {
}
```

### @Target

Specifies which program elements can be annotated:

```java
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

// Can only be applied to methods
@Target(ElementType.METHOD)
public @interface MethodAnnotation {
}

// Can be applied to multiple element types
@Target({ElementType.TYPE, ElementType.METHOD, ElementType.FIELD})
public @interface MultiTarget {
}

// All element types
@Target({
    ElementType.TYPE,           // Class, interface, enum, annotation
    ElementType.FIELD,          // Field (including enum constants)
    ElementType.METHOD,         // Method
    ElementType.PARAMETER,      // Formal parameter
    ElementType.CONSTRUCTOR,    // Constructor
    ElementType.LOCAL_VARIABLE, // Local variable
    ElementType.ANNOTATION_TYPE,// Annotation type
    ElementType.PACKAGE,        // Package declaration
    ElementType.TYPE_PARAMETER, // Type parameter (Java 8+)
    ElementType.TYPE_USE,       // Use of a type (Java 8+)
    ElementType.MODULE,         // Module (Java 9+)
    ElementType.RECORD_COMPONENT// Record component (Java 16+)
})
public @interface Universal {
}
```

### @Documented

Indicates that annotations should be documented by javadoc:

```java
import java.lang.annotation.Documented;

@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ApiEndpoint {
    String value();
}

public class UserController {
    /**
     * Gets user by ID.
     */
    @ApiEndpoint("/users/{id}")
    public User getUser(long id) {
        // Implementation
        return null;
    }
}
// The @ApiEndpoint annotation will appear in generated javadoc
```

### @Inherited

Indicates that an annotation type is automatically inherited by subclasses:

```java
import java.lang.annotation.Inherited;

@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Entity {
    String table() default "";
}

@Entity(table = "base_entities")
public class BaseEntity {
}

// Inherits @Entity annotation from BaseEntity
public class User extends BaseEntity {
}

// Verify inheritance
Class<?> clazz = User.class;
Entity entity = clazz.getAnnotation(Entity.class);
System.out.println(entity.table()); // "base_entities"
```

Note: `@Inherited` only works with class inheritance, not interface implementation.

## Custom Annotations

Creating custom annotations allows you to define your own metadata for specific purposes.

### Basic Custom Annotation

```java
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
}

// Usage
public class MyTests {
    @Test
    public void testAddition() {
        assert 2 + 2 == 4;
    }

    @Test
    public void testSubtraction() {
        assert 5 - 3 == 2;
    }
}
```

### Annotation with Elements

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
    // Element with default value
    boolean enabled() default true;

    // Required element (no default)
    String description();

    // Array element
    String[] tags() default {};

    // Enum element
    Priority priority() default Priority.MEDIUM;

    // Annotation element
    Author author() default @Author(name = "Unknown");
}

public enum Priority {
    LOW, MEDIUM, HIGH, CRITICAL
}

@Retention(RetentionPolicy.RUNTIME)
@Target({})
public @interface Author {
    String name();
    String email() default "";
}

// Usage
public class TestSuite {

    @Test(
        description = "Tests user creation",
        tags = {"user", "create"},
        priority = Priority.HIGH,
        author = @Author(name = "John Doe", email = "john@example.com")
    )
    public void testCreateUser() {
        // Test implementation
    }

    @Test(description = "Tests basic math", enabled = false)
    public void testDisabled() {
        // This test won't run
    }
}
```

### The Special "value" Element

When an annotation has a single element named `value`, you can omit the element name:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Component {
    String value() default "";
}

// Both are equivalent
@Component("userService")
public class UserService {
}

@Component(value = "orderService")
public class OrderService {
}
```

### Annotation Element Types

Annotation elements can only be of the following types:

- Primitive types (int, long, double, etc.)
- String
- Class
- Enum
- Another annotation
- Arrays of any of the above

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Configuration {
    // Primitive
    int maxConnections() default 10;

    // String
    String name() default "";

    // Class
    Class<?> handler() default Object.class;

    // Enum
    Level logLevel() default Level.INFO;

    // Annotation
    Property[] properties() default {};

    // Array of primitives
    int[] ports() default {8080, 8443};

    // Array of strings
    String[] profiles() default {};
}

public enum Level {
    DEBUG, INFO, WARN, ERROR
}

@Retention(RetentionPolicy.RUNTIME)
@Target({})
public @interface Property {
    String key();
    String value();
}

// Usage
@Configuration(
    name = "AppConfig",
    maxConnections = 50,
    logLevel = Level.DEBUG,
    properties = {
        @Property(key = "db.host", value = "localhost"),
        @Property(key = "db.port", value = "5432")
    },
    profiles = {"dev", "test"}
)
public class AppConfiguration {
}
```

## Retention Policies

The retention policy determines at which point an annotation is discarded:

### SOURCE

Annotations are discarded by the compiler and not included in class files:

```java
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.METHOD)
public @interface Todo {
    String value();
    Priority priority() default Priority.MEDIUM;
}

// Use case: Development notes
public class TodoExample {

    @Todo(value = "Implement caching", priority = Priority.HIGH)
    public Data getData() {
        // Implementation pending
        return null;
    }
}
```

Common use cases for SOURCE retention:
- IDE hints and markers
- Code generation tools that process source files
- Static analysis tools
- Documentation annotations

### CLASS

Annotations are recorded in class files but not available at runtime (this is the default):

```java
@Retention(RetentionPolicy.CLASS)
@Target(ElementType.METHOD)
public @interface CompileTimeOnly {
    String reason() default "";
}

// Use case: Bytecode analysis tools
public class BytecodeExample {

    @CompileTimeOnly(reason = "Used for bytecode analysis")
    public void trackedMethod() {
        // Implementation
    }
}
```

Common use cases for CLASS retention:
- Bytecode manipulation tools
- Class file analysis
- Compile-time code generation

### RUNTIME

Annotations are available at runtime through reflection:

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Service {
    String name() default "";
}

@Service(name = "userService")
public class UserService {
}

// Reading annotation at runtime
public class AnnotationReader {
    public static void main(String[] args) {
        Class<?> clazz = UserService.class;
        if (clazz.isAnnotationPresent(Service.class)) {
            Service service = clazz.getAnnotation(Service.class);
            System.out.println("Service name: " + service.name());
        }
    }
}
```

Common use cases for RUNTIME retention:
- Dependency injection frameworks
- ORM mapping
- Web frameworks
- Testing frameworks
- Validation frameworks

## Target Element Types

Java 8 introduced additional element types, and Java 9+ added more:

### Traditional Targets

```java
// TYPE - Classes, interfaces, enums, annotations
@Target(ElementType.TYPE)
public @interface Entity {}

@Entity
public class User {}

// FIELD - Fields and enum constants
@Target(ElementType.FIELD)
public @interface Column {}

public class User {
    @Column
    private String name;
}

// METHOD - Methods
@Target(ElementType.METHOD)
public @interface Transactional {}

public class UserService {
    @Transactional
    public void saveUser(User user) {}
}

// PARAMETER - Method parameters
@Target(ElementType.PARAMETER)
public @interface NotNull {}

public void process(@NotNull String data) {}

// CONSTRUCTOR - Constructors
@Target(ElementType.CONSTRUCTOR)
public @interface Inject {}

public class UserService {
    @Inject
    public UserService(UserRepository repo) {}
}

// LOCAL_VARIABLE - Local variables
@Target(ElementType.LOCAL_VARIABLE)
public @interface Cleanup {}

public void process() {
    @Cleanup
    Resource resource = new Resource();
}

// ANNOTATION_TYPE - Annotation declarations
@Target(ElementType.ANNOTATION_TYPE)
public @interface Qualifier {}

@Qualifier
public @interface Primary {}

// PACKAGE - Package declarations (in package-info.java)
@Target(ElementType.PACKAGE)
public @interface PackageInfo {}

// In package-info.java:
@PackageInfo
package com.example.domain;
```

### Java 8+ Type Annotations

```java
// TYPE_PARAMETER - Type parameters
@Target(ElementType.TYPE_PARAMETER)
public @interface TypeConstraint {}

public class Container<@TypeConstraint T> {}

// TYPE_USE - Any use of a type
@Target(ElementType.TYPE_USE)
public @interface NonNull {}

// Various uses of @NonNull
public @NonNull String getName() {
    return "";
}

public void process(List<@NonNull String> items) {}

public String convert() throws @NonNull Exception {
    return "";
}

@NonNull String name = "test";
String text = (@NonNull String) object;
```

### Java 9+ Module Annotations

```java
@Target(ElementType.MODULE)
public @interface ModuleInfo {
    String version();
}

// In module-info.java:
@ModuleInfo(version = "1.0")
module com.example.app {
    requires java.base;
}
```

### Java 16+ Record Component Annotations

```java
@Target(ElementType.RECORD_COMPONENT)
public @interface Validated {}

public record User(
    @Validated String name,
    @Validated String email
) {}
```

## Reading Annotations at Runtime

Use Java Reflection API to read annotations with RUNTIME retention.

### Reading Class Annotations

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Table {
    String name();
    String schema() default "public";
}

@Table(name = "users", schema = "app")
public class User {
    private Long id;
    private String name;
}

public class AnnotationProcessor {
    public static void processTableAnnotation(Class<?> clazz) {
        if (clazz.isAnnotationPresent(Table.class)) {
            Table table = clazz.getAnnotation(Table.class);
            System.out.println("Table: " + table.schema() + "." + table.name());
        }

        // Get all annotations
        Annotation[] annotations = clazz.getAnnotations();
        for (Annotation annotation : annotations) {
            System.out.println("Found: " + annotation.annotationType().getName());
        }
    }

    public static void main(String[] args) {
        processTableAnnotation(User.class);
        // Output: Table: app.users
    }
}
```

### Reading Method Annotations

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface RequestMapping {
    String path();
    String method() default "GET";
}

public class UserController {

    @RequestMapping(path = "/users", method = "GET")
    public List<User> getAllUsers() {
        return Collections.emptyList();
    }

    @RequestMapping(path = "/users", method = "POST")
    public User createUser(User user) {
        return user;
    }
}

public class RequestMappingProcessor {
    public static void processController(Class<?> controllerClass) {
        for (Method method : controllerClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(RequestMapping.class)) {
                RequestMapping mapping = method.getAnnotation(RequestMapping.class);
                System.out.printf("%s %s -> %s()%n",
                    mapping.method(),
                    mapping.path(),
                    method.getName());
            }
        }
    }

    public static void main(String[] args) {
        processController(UserController.class);
        // Output:
        // GET /users -> getAllUsers()
        // POST /users -> createUser()
    }
}
```

### Reading Field Annotations

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Column {
    String name() default "";
    boolean nullable() default true;
    int length() default 255;
}

public class User {
    @Column(name = "user_id", nullable = false)
    private Long id;

    @Column(name = "user_name", length = 100)
    private String name;

    @Column(name = "email_address", nullable = false, length = 200)
    private String email;
}

public class ColumnProcessor {
    public static void processColumns(Class<?> clazz) {
        for (Field field : clazz.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column != null) {
                String columnName = column.name().isEmpty()
                    ? field.getName()
                    : column.name();
                System.out.printf("Field: %s -> Column: %s (nullable=%b, length=%d)%n",
                    field.getName(),
                    columnName,
                    column.nullable(),
                    column.length());
            }
        }
    }

    public static void main(String[] args) {
        processColumns(User.class);
    }
}
```

### Reading Parameter Annotations

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface PathVariable {
    String value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface RequestBody {
}

public class UserController {
    public User getUser(
            @PathVariable("id") Long userId,
            @RequestBody UserRequest request) {
        return null;
    }
}

public class ParameterProcessor {
    public static void processParameters(Method method) {
        Parameter[] parameters = method.getParameters();
        Annotation[][] paramAnnotations = method.getParameterAnnotations();

        for (int i = 0; i < parameters.length; i++) {
            Parameter param = parameters[i];
            System.out.printf("Parameter: %s %s%n",
                param.getType().getSimpleName(),
                param.getName());

            for (Annotation annotation : paramAnnotations[i]) {
                if (annotation instanceof PathVariable pv) {
                    System.out.println("  @PathVariable: " + pv.value());
                } else if (annotation instanceof RequestBody) {
                    System.out.println("  @RequestBody");
                }
            }
        }
    }

    public static void main(String[] args) throws NoSuchMethodException {
        Method method = UserController.class.getMethod(
            "getUser", Long.class, UserRequest.class);
        processParameters(method);
    }
}
```

## Annotation Processors

Annotation processors are compile-time tools that process annotations to generate code, validate constraints, or produce other artifacts.

### Creating an Annotation Processor

```java
// 1. Define the annotation
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface Builder {
}

// 2. Create the processor
import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.*;
import javax.tools.Diagnostic;
import javax.tools.JavaFileObject;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Set;

@SupportedAnnotationTypes("com.example.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                          RoundEnvironment roundEnv) {

        for (Element element : roundEnv.getElementsAnnotatedWith(Builder.class)) {
            if (element.getKind() != ElementKind.CLASS) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.ERROR,
                    "@Builder can only be applied to classes",
                    element);
                return true;
            }

            TypeElement typeElement = (TypeElement) element;
            try {
                generateBuilder(typeElement);
            } catch (IOException e) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.ERROR,
                    "Failed to generate builder: " + e.getMessage(),
                    element);
            }
        }
        return true;
    }

    private void generateBuilder(TypeElement typeElement) throws IOException {
        String className = typeElement.getSimpleName().toString();
        String packageName = processingEnv.getElementUtils()
            .getPackageOf(typeElement).getQualifiedName().toString();
        String builderClassName = className + "Builder";

        JavaFileObject builderFile = processingEnv.getFiler()
            .createSourceFile(packageName + "." + builderClassName);

        try (PrintWriter out = new PrintWriter(builderFile.openWriter())) {
            out.println("package " + packageName + ";");
            out.println();
            out.println("public class " + builderClassName + " {");

            // Generate fields and methods for each field in the original class
            for (Element enclosed : typeElement.getEnclosedElements()) {
                if (enclosed.getKind() == ElementKind.FIELD) {
                    VariableElement field = (VariableElement) enclosed;
                    String fieldName = field.getSimpleName().toString();
                    String fieldType = field.asType().toString();

                    out.printf("    private %s %s;%n", fieldType, fieldName);
                    out.println();
                    out.printf("    public %s %s(%s %s) {%n",
                        builderClassName, fieldName, fieldType, fieldName);
                    out.printf("        this.%s = %s;%n", fieldName, fieldName);
                    out.println("        return this;");
                    out.println("    }");
                    out.println();
                }
            }

            // Generate build method
            out.printf("    public %s build() {%n", className);
            out.printf("        %s instance = new %s();%n", className, className);

            for (Element enclosed : typeElement.getEnclosedElements()) {
                if (enclosed.getKind() == ElementKind.FIELD) {
                    String fieldName = enclosed.getSimpleName().toString();
                    out.printf("        instance.%s = this.%s;%n",
                        fieldName, fieldName);
                }
            }

            out.println("        return instance;");
            out.println("    }");
            out.println("}");
        }
    }
}
```

### Registering the Processor

Create a file `META-INF/services/javax.annotation.processing.Processor` containing:

```
com.example.BuilderProcessor
```

Or use the `@AutoService` annotation from Google Auto Service:

```java
@AutoService(Processor.class)
@SupportedAnnotationTypes("com.example.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {
    // ...
}
```

### Using the Generated Code

```java
@Builder
public class User {
    String name;
    String email;
    int age;
}

// After compilation, you can use:
User user = new UserBuilder()
    .name("John")
    .email("john@example.com")
    .age(30)
    .build();
```

### Compile-Time Validation

```java
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface Singleton {
}

@SupportedAnnotationTypes("com.example.Singleton")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class SingletonProcessor extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                          RoundEnvironment roundEnv) {

        for (Element element : roundEnv.getElementsAnnotatedWith(Singleton.class)) {
            TypeElement typeElement = (TypeElement) element;

            // Validate: must have private constructor
            boolean hasPrivateConstructor = false;
            for (Element enclosed : typeElement.getEnclosedElements()) {
                if (enclosed.getKind() == ElementKind.CONSTRUCTOR) {
                    if (enclosed.getModifiers().contains(Modifier.PRIVATE)) {
                        hasPrivateConstructor = true;
                        break;
                    }
                }
            }

            if (!hasPrivateConstructor) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.ERROR,
                    "@Singleton class must have a private constructor",
                    element);
            }

            // Validate: must have static getInstance method
            boolean hasGetInstance = typeElement.getEnclosedElements().stream()
                .filter(e -> e.getKind() == ElementKind.METHOD)
                .filter(e -> e.getSimpleName().toString().equals("getInstance"))
                .anyMatch(e -> e.getModifiers().contains(Modifier.STATIC));

            if (!hasGetInstance) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.WARNING,
                    "@Singleton class should have a static getInstance() method",
                    element);
            }
        }
        return true;
    }
}
```

## Repeatable Annotations

Java 8 introduced repeatable annotations, allowing the same annotation to be applied multiple times.

### Defining Repeatable Annotations

```java
// The repeatable annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(Schedules.class)
public @interface Schedule {
    String dayOfWeek();
    String time();
}

// The container annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Schedules {
    Schedule[] value();
}
```

### Using Repeatable Annotations

```java
public class TaskScheduler {

    @Schedule(dayOfWeek = "Monday", time = "09:00")
    @Schedule(dayOfWeek = "Wednesday", time = "14:00")
    @Schedule(dayOfWeek = "Friday", time = "17:00")
    public void sendWeeklyReport() {
        // Implementation
    }

    // Equivalent to using the container directly
    @Schedules({
        @Schedule(dayOfWeek = "Tuesday", time = "10:00"),
        @Schedule(dayOfWeek = "Thursday", time = "16:00")
    })
    public void processData() {
        // Implementation
    }
}
```

### Reading Repeatable Annotations

```java
public class ScheduleProcessor {

    public static void processSchedules(Class<?> clazz) {
        for (Method method : clazz.getDeclaredMethods()) {
            // Method 1: Get individual annotations
            Schedule[] schedules = method.getAnnotationsByType(Schedule.class);
            if (schedules.length > 0) {
                System.out.println("Method: " + method.getName());
                for (Schedule schedule : schedules) {
                    System.out.printf("  %s at %s%n",
                        schedule.dayOfWeek(), schedule.time());
                }
            }

            // Method 2: Get container annotation
            Schedules container = method.getAnnotation(Schedules.class);
            if (container != null) {
                for (Schedule schedule : container.value()) {
                    // Process each schedule
                }
            }
        }
    }

    public static void main(String[] args) {
        processSchedules(TaskScheduler.class);
    }
}
```

### Real-World Example: Multiple Validators

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@Repeatable(Validations.class)
public @interface Validate {
    String regex() default "";
    int minLength() default 0;
    int maxLength() default Integer.MAX_VALUE;
    String message();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Validations {
    Validate[] value();
}

public class User {
    @Validate(minLength = 3, message = "Username must be at least 3 characters")
    @Validate(maxLength = 20, message = "Username cannot exceed 20 characters")
    @Validate(regex = "^[a-zA-Z0-9_]+$", message = "Username can only contain alphanumeric characters")
    private String username;

    @Validate(regex = "^[\\w.-]+@[\\w.-]+\\.\\w+$", message = "Invalid email format")
    private String email;
}

public class Validator {
    public static List<String> validate(Object obj) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();

        for (Field field : obj.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(obj);
            String strValue = value != null ? value.toString() : "";

            for (Validate validation : field.getAnnotationsByType(Validate.class)) {
                if (strValue.length() < validation.minLength()) {
                    errors.add(validation.message());
                }
                if (strValue.length() > validation.maxLength()) {
                    errors.add(validation.message());
                }
                if (!validation.regex().isEmpty() &&
                    !strValue.matches(validation.regex())) {
                    errors.add(validation.message());
                }
            }
        }
        return errors;
    }
}
```

## Type Annotations

Java 8 introduced type annotations (`ElementType.TYPE_USE`), which can be applied anywhere a type is used.

### Type Annotation Examples

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface NonNull {
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface Nullable {
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface Immutable {
}

public class TypeAnnotationExamples {

    // On return type
    public @NonNull String getName() {
        return "name";
    }

    // On parameter type
    public void setName(@NonNull String name) {
    }

    // On generic type arguments
    private List<@NonNull String> items = new ArrayList<>();

    // On type in cast
    public String convert(Object obj) {
        return (@NonNull String) obj;
    }

    // On exception types
    public void process() throws @NonNull Exception {
    }

    // On array element type
    private @NonNull String @Nullable [] names;

    // On nested types
    private Map.@Immutable Entry<String, String> entry;

    // On constructor call
    public void create() {
        List<String> list = new @Immutable ArrayList<>();
    }

    // On instanceof
    public boolean check(Object obj) {
        return obj instanceof @NonNull String;
    }

    // On extends/implements
    public class MyList extends @Immutable ArrayList<@NonNull String> {
    }
}
```

### Type Annotations with Generics

```java
// Type parameter bounds
public class Container<@NonNull T extends @NonNull Comparable<T>> {
    private T value;
}

// Wildcard bounds
public void process(List<? extends @NonNull Number> numbers) {
}

// Multiple bounds
public <T extends @NonNull Comparable<T> & @NonNull Serializable> void sort(List<T> list) {
}
```

### Processing Type Annotations

```java
import java.lang.reflect.AnnotatedType;
import java.lang.reflect.AnnotatedParameterizedType;
import java.lang.reflect.Method;

public class TypeAnnotationReader {

    public static void readTypeAnnotations(Method method) {
        // Return type annotations
        AnnotatedType returnType = method.getAnnotatedReturnType();
        System.out.println("Return type: " + returnType.getType());
        for (var annotation : returnType.getAnnotations()) {
            System.out.println("  Annotation: " + annotation);
        }

        // Parameter type annotations
        for (AnnotatedType paramType : method.getAnnotatedParameterTypes()) {
            System.out.println("Parameter type: " + paramType.getType());
            for (var annotation : paramType.getAnnotations()) {
                System.out.println("  Annotation: " + annotation);
            }

            // For parameterized types (like List<@NonNull String>)
            if (paramType instanceof AnnotatedParameterizedType apt) {
                for (AnnotatedType typeArg : apt.getAnnotatedActualTypeArguments()) {
                    System.out.println("  Type argument: " + typeArg.getType());
                    for (var ann : typeArg.getAnnotations()) {
                        System.out.println("    Annotation: " + ann);
                    }
                }
            }
        }
    }
}
```

## Real-World Use Cases

### Dependency Injection Framework

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Component {
    String name() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD, ElementType.CONSTRUCTOR, ElementType.METHOD})
public @interface Inject {
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Scope {
    ScopeType value() default ScopeType.SINGLETON;
}

public enum ScopeType {
    SINGLETON, PROTOTYPE, REQUEST, SESSION
}

// Usage
@Component(name = "userService")
@Scope(ScopeType.SINGLETON)
public class UserService {

    @Inject
    private UserRepository userRepository;

    @Inject
    public UserService(UserRepository repository) {
        this.userRepository = repository;
    }
}

// Simple container implementation
public class DIContainer {
    private final Map<Class<?>, Object> singletons = new HashMap<>();

    public <T> T getInstance(Class<T> type) throws Exception {
        Component component = type.getAnnotation(Component.class);
        if (component == null) {
            throw new IllegalArgumentException("Not a component: " + type);
        }

        Scope scope = type.getAnnotation(Scope.class);
        if (scope != null && scope.value() == ScopeType.SINGLETON) {
            return type.cast(singletons.computeIfAbsent(type, this::createInstance));
        }

        return createInstance(type);
    }

    private <T> T createInstance(Class<T> type) {
        try {
            // Find constructor with @Inject or default constructor
            for (Constructor<?> constructor : type.getConstructors()) {
                if (constructor.isAnnotationPresent(Inject.class)) {
                    Object[] args = resolveConstructorArgs(constructor);
                    return type.cast(constructor.newInstance(args));
                }
            }
            return type.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create instance", e);
        }
    }

    private Object[] resolveConstructorArgs(Constructor<?> constructor) throws Exception {
        Class<?>[] paramTypes = constructor.getParameterTypes();
        Object[] args = new Object[paramTypes.length];
        for (int i = 0; i < paramTypes.length; i++) {
            args[i] = getInstance(paramTypes[i]);
        }
        return args;
    }
}
```

### ORM Mapping

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Entity {
    String table() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Id {
    GenerationType strategy() default GenerationType.AUTO;
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Column {
    String name() default "";
    boolean nullable() default true;
    int length() default 255;
    boolean unique() default false;
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface OneToMany {
    Class<?> targetEntity();
    String mappedBy() default "";
    CascadeType[] cascade() default {};
}

public enum GenerationType {
    AUTO, IDENTITY, SEQUENCE, TABLE
}

public enum CascadeType {
    ALL, PERSIST, MERGE, REMOVE, REFRESH
}

// Entity class
@Entity(table = "users")
public class User {

    @Id(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "user_name", nullable = false, length = 100)
    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @OneToMany(targetEntity = Order.class, mappedBy = "user",
               cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<Order> orders;

    // Getters and setters
}

// Simple SQL generator based on annotations
public class SqlGenerator {

    public static String generateCreateTable(Class<?> entityClass) {
        Entity entity = entityClass.getAnnotation(Entity.class);
        if (entity == null) {
            throw new IllegalArgumentException("Not an entity class");
        }

        String tableName = entity.table().isEmpty()
            ? entityClass.getSimpleName().toLowerCase()
            : entity.table();

        StringBuilder sql = new StringBuilder("CREATE TABLE ");
        sql.append(tableName).append(" (\n");

        List<String> columns = new ArrayList<>();
        String primaryKey = null;

        for (Field field : entityClass.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column != null || field.isAnnotationPresent(Id.class)) {
                String columnName = (column != null && !column.name().isEmpty())
                    ? column.name()
                    : field.getName();

                String columnDef = "  " + columnName + " " + getSqlType(field, column);

                if (column != null) {
                    if (!column.nullable()) {
                        columnDef += " NOT NULL";
                    }
                    if (column.unique()) {
                        columnDef += " UNIQUE";
                    }
                }

                if (field.isAnnotationPresent(Id.class)) {
                    primaryKey = columnName;
                    Id id = field.getAnnotation(Id.class);
                    if (id.strategy() == GenerationType.IDENTITY) {
                        columnDef += " AUTO_INCREMENT";
                    }
                }

                columns.add(columnDef);
            }
        }

        sql.append(String.join(",\n", columns));

        if (primaryKey != null) {
            sql.append(",\n  PRIMARY KEY (").append(primaryKey).append(")");
        }

        sql.append("\n);");
        return sql.toString();
    }

    private static String getSqlType(Field field, Column column) {
        Class<?> type = field.getType();
        if (type == Long.class || type == long.class) {
            return "BIGINT";
        } else if (type == Integer.class || type == int.class) {
            return "INT";
        } else if (type == String.class) {
            int length = column != null ? column.length() : 255;
            return "VARCHAR(" + length + ")";
        } else if (type == Boolean.class || type == boolean.class) {
            return "BOOLEAN";
        }
        return "VARCHAR(255)";
    }
}
```

### Web Framework Routing

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Controller {
    String path() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface GetMapping {
    String value() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface PostMapping {
    String value() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface PathVariable {
    String value() default "";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
public @interface RequestParam {
    String value() default "";
    boolean required() default true;
    String defaultValue() default "";
}

// Controller implementation
@Controller(path = "/api/users")
public class UserController {

    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable("id") Long id) {
        return userService.findById(id);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }

    @GetMapping("/search")
    public List<User> searchUsers(
            @RequestParam("name") String name,
            @RequestParam(value = "limit", required = false, defaultValue = "10") int limit) {
        return userService.search(name, limit);
    }
}

// Route registration
public class RouteRegistry {
    private final Map<String, RouteHandler> routes = new HashMap<>();

    public void registerController(Class<?> controllerClass) throws Exception {
        Controller controller = controllerClass.getAnnotation(Controller.class);
        if (controller == null) return;

        String basePath = controller.path();
        Object instance = controllerClass.getDeclaredConstructor().newInstance();

        for (Method method : controllerClass.getDeclaredMethods()) {
            GetMapping get = method.getAnnotation(GetMapping.class);
            if (get != null) {
                String path = basePath + get.value();
                routes.put("GET:" + path, new RouteHandler(instance, method));
            }

            PostMapping post = method.getAnnotation(PostMapping.class);
            if (post != null) {
                String path = basePath + post.value();
                routes.put("POST:" + path, new RouteHandler(instance, method));
            }
        }
    }

    public Object handle(String httpMethod, String path, Map<String, String> params)
            throws Exception {
        RouteHandler handler = routes.get(httpMethod + ":" + path);
        if (handler == null) {
            throw new NotFoundException("Route not found: " + path);
        }
        return handler.invoke(params);
    }
}
```

### Validation Framework

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface NotNull {
    String message() default "Field cannot be null";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Size {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "Size must be between {min} and {max}";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Email {
    String message() default "Invalid email format";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Pattern {
    String regexp();
    String message() default "Value does not match pattern";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Range {
    long min() default Long.MIN_VALUE;
    long max() default Long.MAX_VALUE;
    String message() default "Value must be between {min} and {max}";
}

// Model with validations
public class UserRegistration {

    @NotNull
    @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
    private String username;

    @NotNull
    @Email
    private String email;

    @NotNull
    @Size(min = 8, message = "Password must be at least 8 characters")
    @Pattern(regexp = ".*[A-Z].*", message = "Password must contain uppercase letter")
    @Pattern(regexp = ".*[0-9].*", message = "Password must contain a digit")
    private String password;

    @Range(min = 18, max = 120, message = "Age must be between 18 and 120")
    private int age;
}

// Validator implementation
public class BeanValidator {
    private static final String EMAIL_REGEX =
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";

    public static List<ValidationError> validate(Object obj) {
        List<ValidationError> errors = new ArrayList<>();

        for (Field field : obj.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            try {
                Object value = field.get(obj);
                validateField(field, value, errors);
            } catch (IllegalAccessException e) {
                throw new RuntimeException(e);
            }
        }

        return errors;
    }

    private static void validateField(Field field, Object value,
                                       List<ValidationError> errors) {
        // @NotNull
        if (field.isAnnotationPresent(NotNull.class) && value == null) {
            NotNull ann = field.getAnnotation(NotNull.class);
            errors.add(new ValidationError(field.getName(), ann.message()));
            return; // Skip other validations if null
        }

        if (value == null) return;

        // @Size
        if (field.isAnnotationPresent(Size.class)) {
            Size ann = field.getAnnotation(Size.class);
            int length = value.toString().length();
            if (length < ann.min() || length > ann.max()) {
                errors.add(new ValidationError(field.getName(),
                    ann.message()
                        .replace("{min}", String.valueOf(ann.min()))
                        .replace("{max}", String.valueOf(ann.max()))));
            }
        }

        // @Email
        if (field.isAnnotationPresent(Email.class)) {
            Email ann = field.getAnnotation(Email.class);
            if (!value.toString().matches(EMAIL_REGEX)) {
                errors.add(new ValidationError(field.getName(), ann.message()));
            }
        }

        // @Pattern (repeatable)
        for (Pattern ann : field.getAnnotationsByType(Pattern.class)) {
            if (!value.toString().matches(ann.regexp())) {
                errors.add(new ValidationError(field.getName(), ann.message()));
            }
        }

        // @Range
        if (field.isAnnotationPresent(Range.class)) {
            Range ann = field.getAnnotation(Range.class);
            long numValue = ((Number) value).longValue();
            if (numValue < ann.min() || numValue > ann.max()) {
                errors.add(new ValidationError(field.getName(),
                    ann.message()
                        .replace("{min}", String.valueOf(ann.min()))
                        .replace("{max}", String.valueOf(ann.max()))));
            }
        }
    }

    public record ValidationError(String field, String message) {}
}
```

## Best Practices

### Choose the Right Retention Policy

```java
// SOURCE: For compile-time tools only
@Retention(RetentionPolicy.SOURCE)
public @interface Todo {} // IDE/build tool hints

// CLASS: For bytecode processing
@Retention(RetentionPolicy.CLASS)
public @interface BytecodeMarker {} // Bytecode manipulation

// RUNTIME: When reflection is needed
@Retention(RetentionPolicy.RUNTIME)
public @interface Service {} // DI frameworks, ORM
```

### Always Specify Target

```java
// BAD: Can be applied anywhere, might cause confusion
public @interface Marker {}

// GOOD: Clear about where it can be used
@Target(ElementType.METHOD)
public @interface Marker {}
```

### Provide Sensible Defaults

```java
// GOOD: Most common values as defaults
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Column {
    String name() default ""; // Empty means use field name
    boolean nullable() default true; // Most fields are nullable
    int length() default 255; // Standard varchar length
}
```

### Use @Documented for Public APIs

```java
// GOOD: Annotation appears in Javadoc
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface PublicApi {
    String since() default "";
}
```

### Consider Making Annotations Repeatable

```java
// GOOD: Allows multiple configurations
@Repeatable(Profiles.class)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Profile {
    String value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Profiles {
    Profile[] value();
}

// Usage
@Profile("dev")
@Profile("test")
public class DevTestConfiguration {}
```

### Validate Annotation Usage with Processors

```java
@SupportedAnnotationTypes("com.example.Singleton")
public class SingletonValidator extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                          RoundEnvironment roundEnv) {
        for (Element element : roundEnv.getElementsAnnotatedWith(Singleton.class)) {
            // Enforce constraints at compile time
            validateSingletonPattern(element);
        }
        return true;
    }

    private void validateSingletonPattern(Element element) {
        // Check for private constructor, static getInstance, etc.
    }
}
```

### Combine Annotations with Meta-Annotations

```java
// Create composed annotations for common combinations
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
@Scope(ScopeType.SINGLETON)
@Transactional
public @interface Service {
    String name() default "";
}

// Instead of applying multiple annotations:
// @Component @Scope(SINGLETON) @Transactional
// Just use:
@Service(name = "userService")
public class UserService {}
```

### Document Annotation Semantics

```java
/**
 * Marks a method as a scheduled task that runs periodically.
 *
 * <p>The annotated method must have no parameters and return void.
 * Multiple {@code @Schedule} annotations can be applied to run
 * at different times.</p>
 *
 * <p>Example:</p>
 * <pre>
 * {@code @Schedule(cron = "0 0 * * * *")}
 * public void hourlyTask() {
 *     // Runs every hour
 * }
 * </pre>
 *
 * @see Schedules
 * @since 1.0
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(Schedules.class)
public @interface Schedule {
    /**
     * Cron expression defining when the task should run.
     * @return the cron expression
     */
    String cron();

    /**
     * Timezone for the cron expression.
     * @return the timezone ID (default: system timezone)
     */
    String timezone() default "";
}
```

### Handle Missing Annotations Gracefully

```java
public class AnnotationUtils {

    public static <A extends Annotation> A findAnnotation(
            Class<?> clazz, Class<A> annotationType) {

        // Check direct annotation
        A annotation = clazz.getAnnotation(annotationType);
        if (annotation != null) {
            return annotation;
        }

        // Check meta-annotations
        for (Annotation ann : clazz.getAnnotations()) {
            annotation = ann.annotationType().getAnnotation(annotationType);
            if (annotation != null) {
                return annotation;
            }
        }

        // Check superclass
        Class<?> superclass = clazz.getSuperclass();
        if (superclass != null && superclass != Object.class) {
            return findAnnotation(superclass, annotationType);
        }

        return null;
    }
}
```

### Use Type Annotations for Better Null Safety

```java
// Define null-safety annotations
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface NonNull {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface Nullable {}

// Use consistently throughout codebase
public class UserService {

    public @NonNull User findById(@NonNull Long id) {
        // Implementation
    }

    public @Nullable User findByEmail(@NonNull String email) {
        // May return null if not found
    }

    public List<@NonNull User> findAll() {
        // Returns list with no null elements
    }
}
```

## Summary

Java Annotations are a powerful metaprogramming feature that enables:

1. **Compile-time processing**: Generate code, validate constraints, produce configuration files
2. **Runtime reflection**: Configure frameworks, implement DI, map objects to databases
3. **Documentation**: Provide metadata that can be included in generated documentation
4. **Code quality**: Enforce patterns, suppress warnings, mark deprecated elements

**Key Takeaways:**

- Use **built-in annotations** (`@Override`, `@Deprecated`, `@SuppressWarnings`) to improve code quality
- Apply **meta-annotations** (`@Retention`, `@Target`, `@Documented`, `@Inherited`) to configure custom annotations
- Choose the appropriate **retention policy** based on when the annotation needs to be available
- Leverage **annotation processors** for compile-time code generation and validation
- Use **repeatable annotations** when the same annotation needs to be applied multiple times
- Apply **type annotations** (Java 8+) for enhanced type checking and null safety
- Follow **best practices** for creating maintainable and well-documented annotations

Annotations are extensively used in modern Java frameworks like Spring, Hibernate, JUnit, and Jakarta EE. Understanding how to create and process annotations is essential for framework development and for taking full advantage of these powerful tools in your applications.
