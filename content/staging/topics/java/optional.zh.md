---
title: Java Optional for Null Safety
description: Learn to use Java Optional to elegantly handle null values and avoid NullPointerException
track: java
section: collections-streams
difficulty: intermediate
tags:
  - Java
  - Optional
  - null safety
  - functional
status: imported
origin: old/src/content/docs/java/optional.zh.md
divergence: 0.189
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Java
  subcategory: API
  order: 22
  lastUpdated: 2026-01-07
---

`Optional` 类是 Java 8 引入的一个容器对象，它可能包含也可能不包含非空值。它提供了一种类型安全的方式来处理可能缺失的值，帮助开发者避免困扰 Java 应用程序数十年的 `NullPointerException`。

## 空值的问题

Tony Hoare 于 1965 年发明了空引用，他将其称为自己的"十亿美元错误"。在 Java 中，空引用是无数 bug 和运行时异常的根源。

### 传统的空值处理

```java
public class UserService {

    public String getUserEmail(Long userId) {
        User user = userRepository.findById(userId);
        if (user != null) {
            Address address = user.getAddress();
            if (address != null) {
                ContactInfo contactInfo = address.getContactInfo();
                if (contactInfo != null) {
                    return contactInfo.getEmail();
                }
            }
        }
        return "default@example.com";
    }
}
```

这段代码存在几个问题：

- **嵌套的空值检查**：代码变得深度嵌套，难以阅读
- **容易遗漏检查**：漏掉一个空值检查就会导致 NullPointerException
- **意图不明确**：不清楚哪些值可能为空
- **代码冗长**：实际的业务逻辑被淹没在防御性检查中

### NullPointerException 陷阱

```java
// 这段代码看起来无害，但实际上是一颗定时炸弹
String city = user.getAddress().getCity().toUpperCase();

// 如果其中任何一个返回 null：
// - user.getAddress() 返回 null
// - getCity() 返回 null
// 应用程序就会崩溃并抛出 NullPointerException
```

## 什么是 Optional？

`Optional<T>` 是一个容器类，表示一个可选值：要么存在类型为 `T` 的值，要么为空（absent）。它强制开发者显式处理值可能不存在的情况。

### 主要特性

- **类型安全的缺失表示**：在类型系统中明确表达值可能缺失
- **强制处理**：开发者必须承认值可能不存在
- **函数式操作**：支持 map、filter、flatMap 操作
- **不可变性**：一旦创建，Optional 就不能被修改

### Optional 结构

```java
// 从概念上讲，Optional 类似于这样：
public final class Optional<T> {
    private final T value;  // 实际值（或 null）

    // 如果 value 为 null，这是一个空的 Optional
    // 如果 value 非空，这个 Optional 包含一个值
}
```

## 创建 Optional 对象

### Optional.of()

创建一个包含非空值的 Optional。如果值为 null，则抛出 `NullPointerException`。

```java
// 创建一个包含值的 Optional
Optional<String> optional = Optional.of("Hello");
System.out.println(optional.get());  // 输出：Hello

// 这会抛出 NullPointerException！
String nullValue = null;
Optional<String> invalid = Optional.of(nullValue);  // NullPointerException
```

当你确定值不为 null 时使用 `Optional.of()`。

### Optional.ofNullable()

创建一个可能包含也可能不包含值的 Optional。如果值为 null，返回一个空的 Optional。

```java
// 使用非空值
Optional<String> withValue = Optional.ofNullable("Hello");
System.out.println(withValue.isPresent());  // 输出：true

// 使用 null 值
Optional<String> withNull = Optional.ofNullable(null);
System.out.println(withNull.isPresent());   // 输出：false

// 常见模式：包装可能为空的值
String name = getUserName();  // 可能返回 null
Optional<String> optionalName = Optional.ofNullable(name);
```

当值可能为 null 时使用 `Optional.ofNullable()`。

### Optional.empty()

创建一个没有值的空 Optional。

```java
// 创建一个空的 Optional
Optional<String> empty = Optional.empty();
System.out.println(empty.isPresent());  // 输出：false

// 在方法返回中很有用
public Optional<User> findUserById(Long id) {
    User user = database.query(id);
    if (user == null) {
        return Optional.empty();
    }
    return Optional.of(user);
}

// 使用 ofNullable 更简洁
public Optional<User> findUserById(Long id) {
    return Optional.ofNullable(database.query(id));
}
```

## 检查和获取值

### isPresent() 和 isEmpty()

```java
Optional<String> optional = Optional.of("Hello");

// 检查值是否存在
if (optional.isPresent()) {
    System.out.println("值存在：" + optional.get());
}

// isEmpty() - Java 11+
Optional<String> empty = Optional.empty();
if (empty.isEmpty()) {
    System.out.println("没有值");
}
```

### get()

如果值存在则获取值。如果为空则抛出 `NoSuchElementException`。

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.get();  // 返回 "Hello"

Optional<String> empty = Optional.empty();
String value2 = empty.get();  // 抛出 NoSuchElementException！
```

**警告**：避免在没有先检查 `isPresent()` 的情况下使用 `get()`。存在更好的替代方法。

### ifPresent()

如果值存在则执行消费者函数。

```java
Optional<String> optional = Optional.of("Hello");

// 仅在值存在时执行
optional.ifPresent(value -> System.out.println("值：" + value));
// 输出：值：Hello

Optional<String> empty = Optional.empty();
empty.ifPresent(value -> System.out.println("值：" + value));
// 无输出 - 消费者不会被调用

// 常见用例：更新记录
findUserById(userId).ifPresent(user -> {
    user.setLastLoginTime(Instant.now());
    userRepository.save(user);
});
```

### ifPresentOrElse() (Java 9+)

如果值存在执行一个操作，如果缺失执行另一个操作。

```java
Optional<String> optional = Optional.of("Hello");

optional.ifPresentOrElse(
    value -> System.out.println("找到：" + value),
    () -> System.out.println("未找到")
);
// 输出：找到：Hello

Optional<String> empty = Optional.empty();
empty.ifPresentOrElse(
    value -> System.out.println("找到：" + value),
    () -> System.out.println("未找到")
);
// 输出：未找到

// 实际示例
findUserById(userId).ifPresentOrElse(
    user -> sendWelcomeEmail(user),
    () -> log.warn("用户未找到：{}", userId)
);
```

## 默认值

### orElse()

如果值存在则返回值，否则返回指定的默认值。

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.orElse("Default");
System.out.println(value);  // 输出：Hello

Optional<String> empty = Optional.empty();
String value2 = empty.orElse("Default");
System.out.println(value2);  // 输出：Default

// 常见用例
String username = findUsername(userId).orElse("Anonymous");
```

**重要**：默认值总是会被求值，即使 Optional 有值。

```java
// 这个方法总是会被调用，即使 Optional 有值
String result = optional.orElse(expensiveOperation());

// 如果 expensiveOperation() 开销很大，请改用 orElseGet()
```

### orElseGet()

如果值存在则返回值，否则调用供应者并返回其结果。

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.orElseGet(() -> "Default");
System.out.println(value);  // 输出：Hello

Optional<String> empty = Optional.empty();
String value2 = empty.orElseGet(() -> "Default");
System.out.println(value2);  // 输出：Default

// 供应者仅在 Optional 为空时被调用
String result = optional.orElseGet(() -> {
    System.out.println("计算默认值...");
    return computeExpensiveDefault();
});
```

**在以下情况下使用 `orElseGet()` 而非 `orElse()`**：
- 默认值计算开销很大
- 默认计算有副作用
- 默认值来自方法调用

```java
// 不好：expensiveComputation() 总是会运行
String name = optional.orElse(expensiveComputation());

// 好：expensiveComputation() 仅在 optional 为空时运行
String name = optional.orElseGet(() -> expensiveComputation());
```

### orElseThrow()

如果值存在则返回值，否则抛出异常。

```java
// 如果为空则抛出 NoSuchElementException（Java 10+）
String value = optional.orElseThrow();

// 使用自定义异常
String value2 = optional.orElseThrow(
    () -> new UserNotFoundException("用户未找到")
);

// 服务层的常见模式
public User getUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("用户未找到：" + id));
}

// 使用不同的异常类型
public Product getProduct(String sku) {
    return productRepository.findBySku(sku)
        .orElseThrow(() -> new ProductNotFoundException(sku));
}
```

### or() (Java 9+)

如果值存在则返回 Optional，否则返回由供应者产生的 Optional。

```java
Optional<String> optional = Optional.empty();

// 返回另一个 Optional
Optional<String> result = optional.or(() -> Optional.of("Fallback"));
System.out.println(result.get());  // 输出：Fallback

// 链接后备方案
Optional<User> user = findInCache(userId)
    .or(() -> findInDatabase(userId))
    .or(() -> findInExternalService(userId));

// 所有方法都返回 Optional<User>
public Optional<User> findInCache(Long id) { ... }
public Optional<User> findInDatabase(Long id) { ... }
public Optional<User> findInExternalService(Long id) { ... }
```

## 转换 Optional 值

### map()

使用函数转换 Optional 内部的值。

```java
Optional<String> optional = Optional.of("hello");

// 转换为大写
Optional<String> upper = optional.map(String::toUpperCase);
System.out.println(upper.get());  // 输出：HELLO

// 转换为长度
Optional<Integer> length = optional.map(String::length);
System.out.println(length.get());  // 输出：5

// 链接多个转换
Optional<String> result = optional
    .map(String::trim)
    .map(String::toUpperCase)
    .map(s -> s.replace(" ", "_"));

// 如果 Optional 为空，map 返回空
Optional<String> empty = Optional.empty();
Optional<String> mapped = empty.map(String::toUpperCase);
System.out.println(mapped.isPresent());  // 输出：false

// 实际示例
String cityName = findUser(userId)
    .map(User::getAddress)
    .map(Address::getCity)
    .map(String::toUpperCase)
    .orElse("UNKNOWN");
```

### flatMap()

类似于 `map()`，但映射函数返回 Optional。避免嵌套 Optional。

```java
// 当映射函数返回 Optional 时
public Optional<Address> getAddress(User user) {
    return Optional.ofNullable(user.getAddress());
}

Optional<User> user = Optional.of(new User("John"));

// 使用 map() 创建嵌套的 Optional<Optional<Address>>
Optional<Optional<Address>> nested = user.map(u -> getAddress(u));

// 使用 flatMap() 扁平化为 Optional<Address>
Optional<Address> address = user.flatMap(u -> getAddress(u));

// 为嵌套的 optional 链接 flatMap
Optional<String> email = findUser(userId)
    .flatMap(User::getOptionalAddress)
    .flatMap(Address::getOptionalContactInfo)
    .flatMap(ContactInfo::getOptionalEmail);

// 比较 map 与 flatMap
class User {
    Optional<Address> getOptionalAddress() { ... }  // 返回 Optional
    Address getAddress() { ... }  // 返回直接值
}

// 当 getter 返回 Optional 时使用 flatMap
user.flatMap(User::getOptionalAddress);

// 当 getter 返回直接值时使用 map
user.map(User::getAddress);
```

### map() 和 flatMap() 的区别

```java
// 返回直接值的方法
public String getUpperCase(String s) {
    return s.toUpperCase();
}

// 返回 Optional 的方法
public Optional<String> findUpperCase(String s) {
    return Optional.of(s.toUpperCase());
}

Optional<String> optional = Optional.of("hello");

// 使用直接值函数的 map()
Optional<String> result1 = optional.map(s -> getUpperCase(s));
// 结果：Optional["HELLO"]

// 使用返回 Optional 函数的 map()
Optional<Optional<String>> result2 = optional.map(s -> findUpperCase(s));
// 结果：Optional[Optional["HELLO"]] - 嵌套了！

// 使用返回 Optional 函数的 flatMap()
Optional<String> result3 = optional.flatMap(s -> findUpperCase(s));
// 结果：Optional["HELLO"] - 扁平化了！
```

## 过滤 Optional 值

### filter()

如果值匹配谓词则返回 Optional，否则返回空。

```java
Optional<Integer> number = Optional.of(10);

// 过滤偶数
Optional<Integer> evenNumber = number.filter(n -> n % 2 == 0);
System.out.println(evenNumber.isPresent());  // 输出：true

// 过滤大于 20 的数
Optional<Integer> largeNumber = number.filter(n -> n > 20);
System.out.println(largeNumber.isPresent());  // 输出：false

// 链接 filter 和 map
Optional<String> result = Optional.of("hello world")
    .filter(s -> s.length() > 5)
    .map(String::toUpperCase);
System.out.println(result.get());  // 输出：HELLO WORLD

// 实际示例：处理前验证
findUser(userId)
    .filter(User::isActive)
    .filter(user -> user.getAge() >= 18)
    .ifPresent(this::processAdultUser);

// 复杂过滤
Optional<Product> validProduct = findProduct(productId)
    .filter(Product::isInStock)
    .filter(p -> p.getPrice() > 0)
    .filter(p -> p.getExpirationDate().isAfter(LocalDate.now()));
```

## 组合多个 Optional

### 顺序依赖

当一个 Optional 依赖另一个时：

```java
public Optional<String> getUserEmail(Long userId) {
    return findUser(userId)
        .flatMap(user -> findAddress(user.getAddressId()))
        .flatMap(address -> findContactInfo(address.getContactId()))
        .map(ContactInfo::getEmail);
}
```

### 独立的 Optional

当你需要多个独立 Optional 的值时：

```java
Optional<User> userOpt = findUser(userId);
Optional<Department> deptOpt = findDepartment(deptId);

// 使用 flatMap 组合
Optional<String> result = userOpt.flatMap(user ->
    deptOpt.map(dept -> user.getName() + " 在 " + dept.getName() + " 工作")
);

// 或使用流（Java 9+）
Optional<String> result2 = userOpt
    .flatMap(user -> deptOpt.map(dept ->
        user.getName() + " 在 " + dept.getName() + " 工作"
    ));
```

### 将 Stream 与 Optional 配合使用 (Java 9+)

```java
// 将 Optional 转换为 Stream
Optional<String> optional = Optional.of("Hello");
Stream<String> stream = optional.stream();

// 从 Optional 列表中过滤存在的值
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("a"),
    Optional.empty(),
    Optional.of("b"),
    Optional.empty(),
    Optional.of("c")
);

// Java 8 方式
List<String> values = optionals.stream()
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(Collectors.toList());
// 结果：["a", "b", "c"]

// Java 9+ 使用 flatMap 的方式
List<String> values2 = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
// 结果：["a", "b", "c"]
```

## Optional 实践应用

### 仓库模式

```java
public interface UserRepository {
    // 为 findById 返回 Optional - 用户可能不存在
    Optional<User> findById(Long id);

    // 为 findByEmail 返回 Optional - 可能找不到匹配
    Optional<User> findByEmail(String email);

    // 为 findAll 返回 List - 如果没有找到则返回空列表
    List<User> findAll();

    // 直接返回保存的实体
    User save(User user);
}

// 实现
public class UserRepositoryImpl implements UserRepository {

    @Override
    public Optional<User> findById(Long id) {
        User user = entityManager.find(User.class, id);
        return Optional.ofNullable(user);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        try {
            User user = entityManager
                .createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                .setParameter("email", email)
                .getSingleResult();
            return Optional.of(user);
        } catch (NoResultException e) {
            return Optional.empty();
        }
    }
}
```

### 服务层

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserDTO getUser(Long id) {
        return userRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new UserNotFoundException("用户未找到：" + id));
    }

    public Optional<UserDTO> findUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .filter(User::isActive)
            .map(this::convertToDTO);
    }

    public void updateUserEmail(Long id, String newEmail) {
        userRepository.findById(id)
            .ifPresentOrElse(
                user -> {
                    user.setEmail(newEmail);
                    userRepository.save(user);
                },
                () -> { throw new UserNotFoundException("用户未找到：" + id); }
            );
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(user.getId(), user.getName(), user.getEmail());
    }
}
```

### REST 控制器

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) {
        return userService.findByEmail(email)
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
```

### 使用 Optional 的配置

```java
public class AppConfig {
    private final Properties properties;

    public Optional<String> getProperty(String key) {
        return Optional.ofNullable(properties.getProperty(key));
    }

    public String getPropertyOrDefault(String key, String defaultValue) {
        return getProperty(key).orElse(defaultValue);
    }

    public int getIntProperty(String key, int defaultValue) {
        return getProperty(key)
            .map(Integer::parseInt)
            .orElse(defaultValue);
    }

    public Duration getTimeout() {
        return getProperty("timeout.seconds")
            .map(Integer::parseInt)
            .map(Duration::ofSeconds)
            .orElse(Duration.ofSeconds(30));
    }
}

// 使用方式
AppConfig config = new AppConfig(properties);
String dbHost = config.getPropertyOrDefault("db.host", "localhost");
int dbPort = config.getIntProperty("db.port", 5432);
Duration timeout = config.getTimeout();
```

### 链接 Optional 操作

```java
public class OrderProcessor {

    public BigDecimal calculateDiscount(Long customerId) {
        return findCustomer(customerId)
            .filter(Customer::isPremium)
            .flatMap(this::findActiveSubscription)
            .map(Subscription::getDiscountPercentage)
            .orElse(BigDecimal.ZERO);
    }

    public String getOrderSummary(Long orderId) {
        return findOrder(orderId)
            .map(order -> String.format(
                "订单 #%d：%d 件商品，总计：$%.2f",
                order.getId(),
                order.getItems().size(),
                order.getTotal()
            ))
            .orElse("订单未找到");
    }

    public void processOrder(Long orderId) {
        findOrder(orderId)
            .filter(Order::isPending)
            .filter(order -> order.getTotal().compareTo(BigDecimal.ZERO) > 0)
            .ifPresentOrElse(
                this::executeOrder,
                () -> log.warn("无法处理订单：{}", orderId)
            );
    }
}
```

## 需要避免的反模式

### 不检查就使用 Optional.get()

```java
// 不好：可能抛出 NoSuchElementException
Optional<User> user = findUser(id);
String name = user.get().getName();  // 危险！

// 好：使用 orElse、orElseThrow 或 ifPresent
String name = findUser(id)
    .map(User::getName)
    .orElse("Unknown");
```

### 将 Optional 用作方法参数

```java
// 不好：强制调用者包装值
public void processUser(Optional<User> user) {
    user.ifPresent(u -> process(u));
}

// 好：使用重载方法或空值检查
public void processUser(User user) {
    if (user != null) {
        process(user);
    }
}

// 或提供空值安全版本
public void processUserIfPresent(@Nullable User user) {
    Optional.ofNullable(user).ifPresent(this::process);
}
```

### 将 Optional 用作字段类型

```java
// 不好：Optional 不可序列化且增加内存开销
public class User {
    private Optional<String> middleName;  // 不要这样做！
}

// 好：使用可空字段配合 Optional getter
public class User {
    private String middleName;  // null 表示没有中间名

    public Optional<String> getMiddleName() {
        return Optional.ofNullable(middleName);
    }
}
```

### 使用 isPresent() + get()

```java
// 不好：冗长且违背初衷
Optional<User> userOpt = findUser(id);
if (userOpt.isPresent()) {
    User user = userOpt.get();
    System.out.println(user.getName());
}

// 好：使用 ifPresent 或 map
findUser(id).ifPresent(user -> System.out.println(user.getName()));

// 或
String name = findUser(id)
    .map(User::getName)
    .orElse("Unknown");
```

### 从 Optional 创建 Optional

```java
// 不好：包装已经是 optional 的值
Optional<User> user = findUser(id);
Optional<Optional<User>> wrapped = Optional.of(user);  // 不要这样！

// 不好：对 Optional 使用 ofNullable
Optional<String> name = Optional.of("John");
Optional<String> wrapped = Optional.ofNullable(name.orElse(null));  // 不要这样！
```

### 在集合中使用 Optional

```java
// 不好：Optional 列表
List<Optional<User>> users;  // 不要这样做！

// 好：从列表中过滤空值
List<User> users = rawUsers.stream()
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// 或返回空列表而不是 Optional<List>
public List<User> findUsers() {
    // 返回空列表，而不是 Optional.empty()
    return users != null ? users : Collections.emptyList();
}
```

### 过度使用 Optional

```java
// 不好：null 不是有效情况时使用 Optional
public Optional<Integer> add(int a, int b) {
    return Optional.of(a + b);  // 结果总是有效的！
}

// 好：直接返回基本类型
public int add(int a, int b) {
    return a + b;
}

// 不好：布尔结果使用 Optional
public Optional<Boolean> isValid(String input) {
    return Optional.of(input != null && !input.isEmpty());
}

// 好：直接返回布尔值
public boolean isValid(String input) {
    return input != null && !input.isEmpty();
}
```

## 最佳实践

### 将 Optional 用于返回类型

```java
// 当方法可能找不到结果时
public Optional<User> findById(Long id);
public Optional<String> extractEmail(String text);

// 不用于应该总是返回值的方法
public User createUser(UserDTO dto);  // 总是返回创建的用户
public int calculateSum(List<Integer> numbers);  // 总是返回一个和
```

### 优先使用函数式方法而非 isPresent/get

```java
// 不要这样：
Optional<String> opt = getValue();
if (opt.isPresent()) {
    return opt.get().toUpperCase();
} else {
    return "DEFAULT";
}

// 应该这样：
return getValue()
    .map(String::toUpperCase)
    .orElse("DEFAULT");
```

### 对昂贵的默认值使用 orElseGet

```java
// orElse - 总是求值默认值
String value = optional.orElse(expensiveComputation());

// orElseGet - 仅在需要时求值
String value = optional.orElseGet(() -> expensiveComputation());
```

### 对必需值使用 orElseThrow

```java
public User getRequiredUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("用户未找到：" + id));
}
```

### 链接操作而非嵌套

```java
// 不要这样：
Optional<User> user = findUser(id);
if (user.isPresent()) {
    Optional<Address> address = user.get().getAddress();
    if (address.isPresent()) {
        return address.get().getCity();
    }
}
return "Unknown";

// 应该这样：
return findUser(id)
    .flatMap(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");
```

### 使用空集合而非 Optional 集合

```java
// 不好
public Optional<List<User>> findUsers();

// 好
public List<User> findUsers();  // 如果没有找到则返回空列表
```

### 用 Optional 记录空值行为

```java
public class UserService {
    /**
     * 通过 ID 查找用户。
     *
     * @param id 用户 ID
     * @return 如果找到则返回包含用户的 Optional，否则返回空
     */
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(repository.findById(id));
    }
}
```

## Optional 与空值检查对比

### 何时使用 Optional

- 方法返回类型中缺失是有效的、预期的结果
- 当你想对可能缺失的值链接操作时
- API 设计中你想明确表达缺失
- 当与 Stream 操作配合使用时

### 何时使用空值检查

- 私有或内部方法中 null 是异常情况
- 性能关键代码中 Optional 开销很重要
- 类中的字段（在 getter 中使用 Optional）
- 方法参数（使用 @Nullable 注解）

### 对比示例

```java
// 传统空值检查
public String getDisplayName(User user) {
    if (user == null) {
        return "Guest";
    }
    String name = user.getName();
    if (name == null || name.isEmpty()) {
        return "User #" + user.getId();
    }
    return name;
}

// 使用 Optional
public String getDisplayName(User user) {
    return Optional.ofNullable(user)
        .map(User::getName)
        .filter(name -> !name.isEmpty())
        .orElseGet(() -> user != null
            ? "User #" + user.getId()
            : "Guest");
}

// 更好：结合两种方式
public String getDisplayName(@Nullable User user) {
    if (user == null) {
        return "Guest";
    }
    return Optional.ofNullable(user.getName())
        .filter(name -> !name.isEmpty())
        .orElse("User #" + user.getId());
}
```

## 基本类型 Optional 类型

Java 为基本类型提供了专门的 Optional 类以避免装箱开销：

```java
// OptionalInt
OptionalInt optInt = OptionalInt.of(42);
int value = optInt.orElse(0);

// OptionalLong
OptionalLong optLong = OptionalLong.of(100L);
long value = optLong.orElseThrow();

// OptionalDouble
OptionalDouble optDouble = OptionalDouble.of(3.14);
optDouble.ifPresent(System.out::println);

// 从 Stream 转换
OptionalInt max = IntStream.of(1, 2, 3, 4, 5).max();
OptionalDouble average = IntStream.of(1, 2, 3, 4, 5).average();

// 在方法中使用
public OptionalInt findMaxAge(List<Person> people) {
    return people.stream()
        .mapToInt(Person::getAge)
        .max();
}
```

## 总结

Java Optional 是一个强大的工具，在正确使用时可以编写空值安全的代码。关键要点：

- **将 Optional 用于返回类型**，当缺失是有效结果时
- **避免将 Optional 用于参数和字段** - 使用 @Nullable 注解
- **优先使用函数式方法**（map、flatMap、orElse）而非 isPresent/get
- **对昂贵的默认值使用 orElseGet** 以避免不必要的计算
- **链接操作**而非嵌套 if 语句
- **不要过度使用 Optional** - 有时空值检查更合适

通过遵循这些指南，你可以显著减少代码库中的 NullPointerException，同时编写更具表达力和可维护性的代码。

## 延伸阅读

- [Java Optional 文档](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html)
- [Effective Java by Joshua Bloch - 第 55 条](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Oracle：厌倦了空指针异常？](https://www.oracle.com/technical-resources/articles/java/java8-optional.html)
- [Java 8 实战 - 第 11 章：使用 Optional](https://www.manning.com/books/java-8-in-action)
