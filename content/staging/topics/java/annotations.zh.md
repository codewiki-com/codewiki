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
origin: old/src/content/docs/java/annotations.zh.md
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

Java 注解于 Java 5 引入，提供了一种强大的机制来为代码添加元数据。它允许你直接在源代码中嵌入补充信息，这些信息可以在编译时或运行时被处理，用于生成代码、验证约束、配置框架等多种用途。

## 注解简介

注解是一种元数据形式，它提供关于程序的数据，但本身并不是程序的一部分。注解对其标注的代码没有直接影响，但可以被以下工具使用：

- **编译器**：用于检测错误或抑制警告
- **编译时处理器**：用于生成代码、XML 文件或其他产物
- **运行时处理器**：通过反射来检查和修改行为

### 基本语法

注解以 `@` 符号开头，后跟注解名称：

```java
@Override
public String toString() {
    return "Example";
}

@Deprecated
public void oldMethod() {
    // 此方法已过时
}

@SuppressWarnings("unchecked")
public void methodWithWarning() {
    List list = new ArrayList(); // 原始类型警告被抑制
}
```

### 带元素的注解

注解可以包含元素（参数）来提供附加信息：

```java
// 单个元素 - 如果元素名为 "value"，可以省略元素名
@SuppressWarnings("deprecation")

// 多个元素
@Author(name = "John Doe", date = "2024-01-15")
public class MyClass {
}

// 数组值
@SuppressWarnings({"unchecked", "deprecation"})
public void multipleWarnings() {
}
```

## 内置注解

Java 在 `java.lang` 和 `java.lang.annotation` 包中提供了多个内置注解。

### @Override

指示一个方法意图覆盖父类中的方法。如果该方法实际上没有覆盖任何方法，编译器会生成错误。

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
    // public void makeSounds() { } // 编译错误 - 方法名拼写错误！
}
```

### @Deprecated

标记程序元素为已过时，表示不应再使用：

```java
public class LegacyAPI {
    /**
     * @deprecated 请使用 {@link #newMethod()} 代替。
     */
    @Deprecated
    public void oldMethod() {
        // 旧实现
    }

    public void newMethod() {
        // 新实现
    }
}

// 使用已过时的方法会生成警告
LegacyAPI api = new LegacyAPI();
api.oldMethod(); // 警告：oldMethod() 已过时
```

从 Java 9 开始，`@Deprecated` 有了额外的元素：

```java
@Deprecated(since = "9", forRemoval = true)
public void legacyMethod() {
    // 将在未来版本中移除
}
```

### @SuppressWarnings

指示编译器抑制特定警告：

```java
public class SuppressWarningsExample {

    @SuppressWarnings("deprecation")
    public void useDeprecatedMethod() {
        new LegacyAPI().oldMethod(); // 无警告
    }

    @SuppressWarnings("unchecked")
    public void useRawTypes() {
        List list = new ArrayList(); // 无警告
        list.add("item");
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public void multipleSuppressed() {
        Map map = new HashMap(); // 无警告
    }
}
```

常见警告类型：
- `deprecation` - 使用已过时的元素
- `unchecked` - 未检查的类型操作
- `rawtypes` - 使用原始类型
- `unused` - 未使用的变量、方法等
- `serial` - 缺少 serialVersionUID
- `fallthrough` - switch 语句中的 fall-through

### @SafeVarargs

断言代码不会对其可变参数执行潜在不安全的操作：

```java
public class SafeVarargsExample {

    // 没有 @SafeVarargs，这会生成警告
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

注意：`@SafeVarargs` 只能应用于不能被覆盖的方法（static、final 或 private 方法以及构造函数）。

### @FunctionalInterface

指示一个接口是函数式接口（只有一个抽象方法）：

```java
@FunctionalInterface
public interface Processor<T, R> {
    R process(T input);

    // 允许默认方法
    default void log(T input) {
        System.out.println("Processing: " + input);
    }

    // 允许静态方法
    static <T> Processor<T, T> identity() {
        return t -> t;
    }

    // 不能添加另一个抽象方法
    // void anotherMethod(); // 编译错误！
}

// 使用 lambda 表达式
Processor<String, Integer> lengthProcessor = String::length;
```

## 元注解

元注解是应用于其他注解的注解。它们定义了自定义注解的行为方式。

### @Retention

指定注解的保留时长：

```java
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

// 只存在于源代码中，被编译器丢弃
@Retention(RetentionPolicy.SOURCE)
public @interface SourceOnly {
}

// 记录在类文件中，运行时不可用
@Retention(RetentionPolicy.CLASS)
public @interface ClassOnly {
}

// 运行时可通过反射获取
@Retention(RetentionPolicy.RUNTIME)
public @interface RuntimeAvailable {
}
```

### @Target

指定可以标注哪些程序元素：

```java
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

// 只能应用于方法
@Target(ElementType.METHOD)
public @interface MethodAnnotation {
}

// 可应用于多种元素类型
@Target({ElementType.TYPE, ElementType.METHOD, ElementType.FIELD})
public @interface MultiTarget {
}

// 所有元素类型
@Target({
    ElementType.TYPE,           // 类、接口、枚举、注解
    ElementType.FIELD,          // 字段（包括枚举常量）
    ElementType.METHOD,         // 方法
    ElementType.PARAMETER,      // 形式参数
    ElementType.CONSTRUCTOR,    // 构造函数
    ElementType.LOCAL_VARIABLE, // 局部变量
    ElementType.ANNOTATION_TYPE,// 注解类型
    ElementType.PACKAGE,        // 包声明
    ElementType.TYPE_PARAMETER, // 类型参数（Java 8+）
    ElementType.TYPE_USE,       // 类型使用（Java 8+）
    ElementType.MODULE,         // 模块（Java 9+）
    ElementType.RECORD_COMPONENT// 记录组件（Java 16+）
})
public @interface Universal {
}
```

### @Documented

指示注解应被 javadoc 记录：

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
     * 根据 ID 获取用户。
     */
    @ApiEndpoint("/users/{id}")
    public User getUser(long id) {
        // 实现
        return null;
    }
}
// @ApiEndpoint 注解将出现在生成的 javadoc 中
```

### @Inherited

指示注解类型可被子类自动继承：

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

// 从 BaseEntity 继承 @Entity 注解
public class User extends BaseEntity {
}

// 验证继承
Class<?> clazz = User.class;
Entity entity = clazz.getAnnotation(Entity.class);
System.out.println(entity.table()); // "base_entities"
```

注意：`@Inherited` 只对类继承有效，对接口实现无效。

## 自定义注解

创建自定义注解允许你为特定目的定义自己的元数据。

### 基本自定义注解

```java
import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
}

// 使用
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

### 带元素的注解

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Test {
    // 带默认值的元素
    boolean enabled() default true;

    // 必需元素（无默认值）
    String description();

    // 数组元素
    String[] tags() default {};

    // 枚举元素
    Priority priority() default Priority.MEDIUM;

    // 注解元素
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

// 使用
public class TestSuite {

    @Test(
        description = "测试用户创建",
        tags = {"user", "create"},
        priority = Priority.HIGH,
        author = @Author(name = "John Doe", email = "john@example.com")
    )
    public void testCreateUser() {
        // 测试实现
    }

    @Test(description = "测试基本数学运算", enabled = false)
    public void testDisabled() {
        // 此测试不会运行
    }
}
```

### 特殊的 "value" 元素

当注解只有一个名为 `value` 的元素时，可以省略元素名：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Component {
    String value() default "";
}

// 两种写法等价
@Component("userService")
public class UserService {
}

@Component(value = "orderService")
public class OrderService {
}
```

### 注解元素类型

注解元素只能是以下类型：

- 基本类型（int、long、double 等）
- String
- Class
- 枚举
- 另一个注解
- 以上任意类型的数组

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Configuration {
    // 基本类型
    int maxConnections() default 10;

    // String
    String name() default "";

    // Class
    Class<?> handler() default Object.class;

    // 枚举
    Level logLevel() default Level.INFO;

    // 注解
    Property[] properties() default {};

    // 基本类型数组
    int[] ports() default {8080, 8443};

    // String 数组
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

// 使用
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

## 保留策略

保留策略决定注解在什么时候被丢弃：

### SOURCE

注解被编译器丢弃，不包含在类文件中：

```java
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.METHOD)
public @interface Todo {
    String value();
    Priority priority() default Priority.MEDIUM;
}

// 用例：开发备注
public class TodoExample {

    @Todo(value = "实现缓存", priority = Priority.HIGH)
    public Data getData() {
        // 待实现
        return null;
    }
}
```

SOURCE 保留的常见用例：
- IDE 提示和标记
- 处理源文件的代码生成工具
- 静态分析工具
- 文档注解

### CLASS

注解记录在类文件中，但运行时不可用（这是默认值）：

```java
@Retention(RetentionPolicy.CLASS)
@Target(ElementType.METHOD)
public @interface CompileTimeOnly {
    String reason() default "";
}

// 用例：字节码分析工具
public class BytecodeExample {

    @CompileTimeOnly(reason = "用于字节码分析")
    public void trackedMethod() {
        // 实现
    }
}
```

CLASS 保留的常见用例：
- 字节码操作工具
- 类文件分析
- 编译时代码生成

### RUNTIME

注解在运行时可通过反射获取：

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Service {
    String name() default "";
}

@Service(name = "userService")
public class UserService {
}

// 运行时读取注解
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

RUNTIME 保留的常见用例：
- 依赖注入框架
- ORM 映射
- Web 框架
- 测试框架
- 验证框架

## 目标元素类型

Java 8 引入了额外的元素类型，Java 9+ 又添加了更多：

### 传统目标

```java
// TYPE - 类、接口、枚举、注解
@Target(ElementType.TYPE)
public @interface Entity {}

@Entity
public class User {}

// FIELD - 字段和枚举常量
@Target(ElementType.FIELD)
public @interface Column {}

public class User {
    @Column
    private String name;
}

// METHOD - 方法
@Target(ElementType.METHOD)
public @interface Transactional {}

public class UserService {
    @Transactional
    public void saveUser(User user) {}
}

// PARAMETER - 方法参数
@Target(ElementType.PARAMETER)
public @interface NotNull {}

public void process(@NotNull String data) {}

// CONSTRUCTOR - 构造函数
@Target(ElementType.CONSTRUCTOR)
public @interface Inject {}

public class UserService {
    @Inject
    public UserService(UserRepository repo) {}
}

// LOCAL_VARIABLE - 局部变量
@Target(ElementType.LOCAL_VARIABLE)
public @interface Cleanup {}

public void process() {
    @Cleanup
    Resource resource = new Resource();
}

// ANNOTATION_TYPE - 注解声明
@Target(ElementType.ANNOTATION_TYPE)
public @interface Qualifier {}

@Qualifier
public @interface Primary {}

// PACKAGE - 包声明（在 package-info.java 中）
@Target(ElementType.PACKAGE)
public @interface PackageInfo {}

// 在 package-info.java 中：
@PackageInfo
package com.example.domain;
```

### Java 8+ 类型注解

```java
// TYPE_PARAMETER - 类型参数
@Target(ElementType.TYPE_PARAMETER)
public @interface TypeConstraint {}

public class Container<@TypeConstraint T> {}

// TYPE_USE - 任何类型使用处
@Target(ElementType.TYPE_USE)
public @interface NonNull {}

// @NonNull 的各种使用
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

### Java 9+ 模块注解

```java
@Target(ElementType.MODULE)
public @interface ModuleInfo {
    String version();
}

// 在 module-info.java 中：
@ModuleInfo(version = "1.0")
module com.example.app {
    requires java.base;
}
```

### Java 16+ 记录组件注解

```java
@Target(ElementType.RECORD_COMPONENT)
public @interface Validated {}

public record User(
    @Validated String name,
    @Validated String email
) {}
```

## 运行时读取注解

使用 Java 反射 API 读取 RUNTIME 保留的注解。

### 读取类注解

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

        // 获取所有注解
        Annotation[] annotations = clazz.getAnnotations();
        for (Annotation annotation : annotations) {
            System.out.println("Found: " + annotation.annotationType().getName());
        }
    }

    public static void main(String[] args) {
        processTableAnnotation(User.class);
        // 输出：Table: app.users
    }
}
```

### 读取方法注解

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
        // 输出：
        // GET /users -> getAllUsers()
        // POST /users -> createUser()
    }
}
```

### 读取字段注解

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

### 读取参数注解

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

## 注解处理器

注解处理器是编译时工具，用于处理注解以生成代码、验证约束或产生其他产物。

### 创建注解处理器

```java
// 1. 定义注解
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.TYPE)
public @interface Builder {
}

// 2. 创建处理器
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
                    "@Builder 只能应用于类",
                    element);
                return true;
            }

            TypeElement typeElement = (TypeElement) element;
            try {
                generateBuilder(typeElement);
            } catch (IOException e) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.ERROR,
                    "生成 builder 失败：" + e.getMessage(),
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

            // 为原始类中的每个字段生成字段和方法
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

            // 生成 build 方法
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

### 注册处理器

创建文件 `META-INF/services/javax.annotation.processing.Processor`，内容为：

```
com.example.BuilderProcessor
```

或使用 Google Auto Service 的 `@AutoService` 注解：

```java
@AutoService(Processor.class)
@SupportedAnnotationTypes("com.example.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {
    // ...
}
```

### 使用生成的代码

```java
@Builder
public class User {
    String name;
    String email;
    int age;
}

// 编译后，你可以使用：
User user = new UserBuilder()
    .name("John")
    .email("john@example.com")
    .age(30)
    .build();
```

### 编译时验证

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

            // 验证：必须有私有构造函数
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
                    "@Singleton 类必须有私有构造函数",
                    element);
            }

            // 验证：必须有静态 getInstance 方法
            boolean hasGetInstance = typeElement.getEnclosedElements().stream()
                .filter(e -> e.getKind() == ElementKind.METHOD)
                .filter(e -> e.getSimpleName().toString().equals("getInstance"))
                .anyMatch(e -> e.getModifiers().contains(Modifier.STATIC));

            if (!hasGetInstance) {
                processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.WARNING,
                    "@Singleton 类应该有静态 getInstance() 方法",
                    element);
            }
        }
        return true;
    }
}
```

## 可重复注解

Java 8 引入了可重复注解，允许同一注解被多次应用。

### 定义可重复注解

```java
// 可重复注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(Schedules.class)
public @interface Schedule {
    String dayOfWeek();
    String time();
}

// 容器注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Schedules {
    Schedule[] value();
}
```

### 使用可重复注解

```java
public class TaskScheduler {

    @Schedule(dayOfWeek = "Monday", time = "09:00")
    @Schedule(dayOfWeek = "Wednesday", time = "14:00")
    @Schedule(dayOfWeek = "Friday", time = "17:00")
    public void sendWeeklyReport() {
        // 实现
    }

    // 等价于直接使用容器
    @Schedules({
        @Schedule(dayOfWeek = "Tuesday", time = "10:00"),
        @Schedule(dayOfWeek = "Thursday", time = "16:00")
    })
    public void processData() {
        // 实现
    }
}
```

### 读取可重复注解

```java
public class ScheduleProcessor {

    public static void processSchedules(Class<?> clazz) {
        for (Method method : clazz.getDeclaredMethods()) {
            // 方法1：获取单独的注解
            Schedule[] schedules = method.getAnnotationsByType(Schedule.class);
            if (schedules.length > 0) {
                System.out.println("Method: " + method.getName());
                for (Schedule schedule : schedules) {
                    System.out.printf("  %s at %s%n",
                        schedule.dayOfWeek(), schedule.time());
                }
            }

            // 方法2：获取容器注解
            Schedules container = method.getAnnotation(Schedules.class);
            if (container != null) {
                for (Schedule schedule : container.value()) {
                    // 处理每个 schedule
                }
            }
        }
    }

    public static void main(String[] args) {
        processSchedules(TaskScheduler.class);
    }
}
```

### 实际示例：多个验证器

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
    @Validate(minLength = 3, message = "用户名至少3个字符")
    @Validate(maxLength = 20, message = "用户名不能超过20个字符")
    @Validate(regex = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母数字字符")
    private String username;

    @Validate(regex = "^[\\w.-]+@[\\w.-]+\\.\\w+$", message = "邮箱格式无效")
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

## 类型注解

Java 8 引入了类型注解（`ElementType.TYPE_USE`），可以应用在任何使用类型的地方。

### 类型注解示例

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

    // 在返回类型上
    public @NonNull String getName() {
        return "name";
    }

    // 在参数类型上
    public void setName(@NonNull String name) {
    }

    // 在泛型类型参数上
    private List<@NonNull String> items = new ArrayList<>();

    // 在类型转换中
    public String convert(Object obj) {
        return (@NonNull String) obj;
    }

    // 在异常类型上
    public void process() throws @NonNull Exception {
    }

    // 在数组元素类型上
    private @NonNull String @Nullable [] names;

    // 在嵌套类型上
    private Map.@Immutable Entry<String, String> entry;

    // 在构造函数调用上
    public void create() {
        List<String> list = new @Immutable ArrayList<>();
    }

    // 在 instanceof 上
    public boolean check(Object obj) {
        return obj instanceof @NonNull String;
    }

    // 在 extends/implements 上
    public class MyList extends @Immutable ArrayList<@NonNull String> {
    }
}
```

### 泛型中的类型注解

```java
// 类型参数边界
public class Container<@NonNull T extends @NonNull Comparable<T>> {
    private T value;
}

// 通配符边界
public void process(List<? extends @NonNull Number> numbers) {
}

// 多重边界
public <T extends @NonNull Comparable<T> & @NonNull Serializable> void sort(List<T> list) {
}
```

### 处理类型注解

```java
import java.lang.reflect.AnnotatedType;
import java.lang.reflect.AnnotatedParameterizedType;
import java.lang.reflect.Method;

public class TypeAnnotationReader {

    public static void readTypeAnnotations(Method method) {
        // 返回类型注解
        AnnotatedType returnType = method.getAnnotatedReturnType();
        System.out.println("Return type: " + returnType.getType());
        for (var annotation : returnType.getAnnotations()) {
            System.out.println("  Annotation: " + annotation);
        }

        // 参数类型注解
        for (AnnotatedType paramType : method.getAnnotatedParameterTypes()) {
            System.out.println("Parameter type: " + paramType.getType());
            for (var annotation : paramType.getAnnotations()) {
                System.out.println("  Annotation: " + annotation);
            }

            // 对于参数化类型（如 List<@NonNull String>）
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

## 实际应用场景

### 依赖注入框架

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

// 使用
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

// 简单容器实现
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
            // 查找带 @Inject 的构造函数或默认构造函数
            for (Constructor<?> constructor : type.getConstructors()) {
                if (constructor.isAnnotationPresent(Inject.class)) {
                    Object[] args = resolveConstructorArgs(constructor);
                    return type.cast(constructor.newInstance(args));
                }
            }
            return type.getDeclaredConstructor().newInstance();
        } catch (Exception e) {
            throw new RuntimeException("创建实例失败", e);
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

### ORM 映射

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

// 实体类
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

    // Getter 和 Setter
}

// 基于注解的简单 SQL 生成器
public class SqlGenerator {

    public static String generateCreateTable(Class<?> entityClass) {
        Entity entity = entityClass.getAnnotation(Entity.class);
        if (entity == null) {
            throw new IllegalArgumentException("不是实体类");
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

### Web 框架路由

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

// 控制器实现
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

// 路由注册
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

### 验证框架

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface NotNull {
    String message() default "字段不能为空";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Size {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "大小必须在 {min} 和 {max} 之间";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Email {
    String message() default "邮箱格式无效";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Pattern {
    String regexp();
    String message() default "值不匹配模式";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Range {
    long min() default Long.MIN_VALUE;
    long max() default Long.MAX_VALUE;
    String message() default "值必须在 {min} 和 {max} 之间";
}

// 带验证的模型
public class UserRegistration {

    @NotNull
    @Size(min = 3, max = 50, message = "用户名必须是3-50个字符")
    private String username;

    @NotNull
    @Email
    private String email;

    @NotNull
    @Size(min = 8, message = "密码至少8个字符")
    @Pattern(regexp = ".*[A-Z].*", message = "密码必须包含大写字母")
    @Pattern(regexp = ".*[0-9].*", message = "密码必须包含数字")
    private String password;

    @Range(min = 18, max = 120, message = "年龄必须在18到120之间")
    private int age;
}

// 验证器实现
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
            return; // 如果为 null，跳过其他验证
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

        // @Pattern（可重复）
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

## 最佳实践

### 选择正确的保留策略

```java
// SOURCE：仅用于编译时工具
@Retention(RetentionPolicy.SOURCE)
public @interface Todo {} // IDE/构建工具提示

// CLASS：用于字节码处理
@Retention(RetentionPolicy.CLASS)
public @interface BytecodeMarker {} // 字节码操作

// RUNTIME：需要反射时使用
@Retention(RetentionPolicy.RUNTIME)
public @interface Service {} // DI 框架、ORM
```

### 始终指定 Target

```java
// 不好：可以应用在任何地方，可能造成混淆
public @interface Marker {}

// 好：明确可以使用的位置
@Target(ElementType.METHOD)
public @interface Marker {}
```

### 提供合理的默认值

```java
// 好：最常用的值作为默认值
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Column {
    String name() default ""; // 空表示使用字段名
    boolean nullable() default true; // 大多数字段可为空
    int length() default 255; // 标准 varchar 长度
}
```

### 为公共 API 使用 @Documented

```java
// 好：注解出现在 Javadoc 中
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface PublicApi {
    String since() default "";
}
```

### 考虑使注解可重复

```java
// 好：允许多个配置
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

// 使用
@Profile("dev")
@Profile("test")
public class DevTestConfiguration {}
```

### 使用处理器验证注解使用

```java
@SupportedAnnotationTypes("com.example.Singleton")
public class SingletonValidator extends AbstractProcessor {

    @Override
    public boolean process(Set<? extends TypeElement> annotations,
                          RoundEnvironment roundEnv) {
        for (Element element : roundEnv.getElementsAnnotatedWith(Singleton.class)) {
            // 在编译时强制约束
            validateSingletonPattern(element);
        }
        return true;
    }

    private void validateSingletonPattern(Element element) {
        // 检查私有构造函数、静态 getInstance 等
    }
}
```

### 使用元注解组合注解

```java
// 为常见组合创建组合注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Component
@Scope(ScopeType.SINGLETON)
@Transactional
public @interface Service {
    String name() default "";
}

// 不用应用多个注解：
// @Component @Scope(SINGLETON) @Transactional
// 只需使用：
@Service(name = "userService")
public class UserService {}
```

### 记录注解语义

```java
/**
 * 标记一个方法为定期运行的计划任务。
 *
 * <p>标注的方法必须无参数且返回 void。
 * 可以应用多个 {@code @Schedule} 注解来在不同时间运行。</p>
 *
 * <p>示例：</p>
 * <pre>
 * {@code @Schedule(cron = "0 0 * * * *")}
 * public void hourlyTask() {
 *     // 每小时运行
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
     * 定义任务运行时间的 Cron 表达式。
     * @return cron 表达式
     */
    String cron();

    /**
     * cron 表达式的时区。
     * @return 时区 ID（默认：系统时区）
     */
    String timezone() default "";
}
```

### 优雅处理缺失的注解

```java
public class AnnotationUtils {

    public static <A extends Annotation> A findAnnotation(
            Class<?> clazz, Class<A> annotationType) {

        // 检查直接注解
        A annotation = clazz.getAnnotation(annotationType);
        if (annotation != null) {
            return annotation;
        }

        // 检查元注解
        for (Annotation ann : clazz.getAnnotations()) {
            annotation = ann.annotationType().getAnnotation(annotationType);
            if (annotation != null) {
                return annotation;
            }
        }

        // 检查父类
        Class<?> superclass = clazz.getSuperclass();
        if (superclass != null && superclass != Object.class) {
            return findAnnotation(superclass, annotationType);
        }

        return null;
    }
}
```

### 使用类型注解提高空安全性

```java
// 定义空安全注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface NonNull {}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE_USE)
public @interface Nullable {}

// 在整个代码库中一致使用
public class UserService {

    public @NonNull User findById(@NonNull Long id) {
        // 实现
    }

    public @Nullable User findByEmail(@NonNull String email) {
        // 如果未找到可能返回 null
    }

    public List<@NonNull User> findAll() {
        // 返回不包含 null 元素的列表
    }
}
```

## 总结

Java 注解是一个强大的元编程特性，可用于：

1. **编译时处理**：生成代码、验证约束、生成配置文件
2. **运行时反射**：配置框架、实现 DI、将对象映射到数据库
3. **文档**：提供可包含在生成文档中的元数据
4. **代码质量**：强制模式、抑制警告、标记过时元素

**关键要点：**

- 使用**内置注解**（`@Override`、`@Deprecated`、`@SuppressWarnings`）提高代码质量
- 应用**元注解**（`@Retention`、`@Target`、`@Documented`、`@Inherited`）配置自定义注解
- 根据注解需要可用的时机选择适当的**保留策略**
- 利用**注解处理器**进行编译时代码生成和验证
- 当需要多次应用同一注解时使用**可重复注解**
- 应用**类型注解**（Java 8+）增强类型检查和空安全性
- 遵循**最佳实践**创建可维护且文档完善的注解

注解在现代 Java 框架如 Spring、Hibernate、JUnit 和 Jakarta EE 中被广泛使用。了解如何创建和处理注解对于框架开发以及充分利用这些强大工具至关重要。
