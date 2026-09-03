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
origin: old/src/content/docs/java/optional.en.md
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

The `Optional` class, introduced in Java 8, is a container object that may or may not contain a non-null value. It provides a type-safe way to handle potentially absent values, helping developers avoid the notorious `NullPointerException` that has plagued Java applications for decades.

## The Problem with Null

Tony Hoare, who invented the null reference in 1965, famously called it his "billion-dollar mistake." In Java, null references are the source of countless bugs and runtime exceptions.

### Traditional Null Handling

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

This code suffers from several problems:

- **Nested null checks**: Code becomes deeply nested and hard to read
- **Easy to forget checks**: Missing a single null check causes a NullPointerException
- **Unclear intent**: It's not obvious which values can be null
- **Verbose code**: The actual business logic is buried in defensive checks

### The NullPointerException Trap

```java
// This code looks innocent but is a ticking time bomb
String city = user.getAddress().getCity().toUpperCase();

// If any of these returns null:
// - user.getAddress() returns null
// - getCity() returns null
// The application crashes with NullPointerException
```

## What is Optional?

`Optional<T>` is a container class that represents an optional value: either a value of type `T` is present, or it is absent (empty). It forces developers to explicitly handle the case where a value might not exist.

### Key Characteristics

- **Type-safe absence**: Makes the possibility of absence explicit in the type system
- **Forces handling**: Developers must acknowledge that a value might be absent
- **Functional operations**: Supports map, filter, flatMap operations
- **Immutable**: Once created, an Optional cannot be changed

### Optional Structure

```java
// Conceptually, Optional is like this:
public final class Optional<T> {
    private final T value;  // The actual value (or null)

    // If value is null, this is an empty Optional
    // If value is non-null, this Optional contains a value
}
```

## Creating Optional Objects

### Optional.of()

Creates an Optional containing a non-null value. Throws `NullPointerException` if the value is null.

```java
// Create an Optional with a value
Optional<String> optional = Optional.of("Hello");
System.out.println(optional.get());  // Output: Hello

// This throws NullPointerException!
String nullValue = null;
Optional<String> invalid = Optional.of(nullValue);  // NullPointerException
```

Use `Optional.of()` when you are certain the value is not null.

### Optional.ofNullable()

Creates an Optional that may or may not contain a value. If the value is null, returns an empty Optional.

```java
// With non-null value
Optional<String> withValue = Optional.ofNullable("Hello");
System.out.println(withValue.isPresent());  // Output: true

// With null value
Optional<String> withNull = Optional.ofNullable(null);
System.out.println(withNull.isPresent());   // Output: false

// Common pattern: wrapping potentially null values
String name = getUserName();  // might return null
Optional<String> optionalName = Optional.ofNullable(name);
```

Use `Optional.ofNullable()` when the value might be null.

### Optional.empty()

Creates an empty Optional with no value.

```java
// Create an empty Optional
Optional<String> empty = Optional.empty();
System.out.println(empty.isPresent());  // Output: false

// Useful in method returns
public Optional<User> findUserById(Long id) {
    User user = database.query(id);
    if (user == null) {
        return Optional.empty();
    }
    return Optional.of(user);
}

// Cleaner with ofNullable
public Optional<User> findUserById(Long id) {
    return Optional.ofNullable(database.query(id));
}
```

## Checking and Retrieving Values

### isPresent() and isEmpty()

```java
Optional<String> optional = Optional.of("Hello");

// Check if value is present
if (optional.isPresent()) {
    System.out.println("Value exists: " + optional.get());
}

// isEmpty() - Java 11+
Optional<String> empty = Optional.empty();
if (empty.isEmpty()) {
    System.out.println("No value");
}
```

### get()

Retrieves the value if present. Throws `NoSuchElementException` if empty.

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.get();  // Returns "Hello"

Optional<String> empty = Optional.empty();
String value2 = empty.get();  // Throws NoSuchElementException!
```

**Warning**: Avoid using `get()` without first checking `isPresent()`. Better alternatives exist.

### ifPresent()

Executes a consumer function if a value is present.

```java
Optional<String> optional = Optional.of("Hello");

// Only executes if value is present
optional.ifPresent(value -> System.out.println("Value: " + value));
// Output: Value: Hello

Optional<String> empty = Optional.empty();
empty.ifPresent(value -> System.out.println("Value: " + value));
// No output - consumer is not called

// Common use case: updating a record
findUserById(userId).ifPresent(user -> {
    user.setLastLoginTime(Instant.now());
    userRepository.save(user);
});
```

### ifPresentOrElse() (Java 9+)

Executes one action if value is present, another if absent.

```java
Optional<String> optional = Optional.of("Hello");

optional.ifPresentOrElse(
    value -> System.out.println("Found: " + value),
    () -> System.out.println("Not found")
);
// Output: Found: Hello

Optional<String> empty = Optional.empty();
empty.ifPresentOrElse(
    value -> System.out.println("Found: " + value),
    () -> System.out.println("Not found")
);
// Output: Not found

// Practical example
findUserById(userId).ifPresentOrElse(
    user -> sendWelcomeEmail(user),
    () -> log.warn("User not found: {}", userId)
);
```

## Default Values

### orElse()

Returns the value if present, otherwise returns the specified default.

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.orElse("Default");
System.out.println(value);  // Output: Hello

Optional<String> empty = Optional.empty();
String value2 = empty.orElse("Default");
System.out.println(value2);  // Output: Default

// Common use case
String username = findUsername(userId).orElse("Anonymous");
```

**Important**: The default value is always evaluated, even if the Optional has a value.

```java
// This method is ALWAYS called, even when Optional has a value
String result = optional.orElse(expensiveOperation());

// If expensiveOperation() is costly, use orElseGet() instead
```

### orElseGet()

Returns the value if present, otherwise invokes the supplier and returns its result.

```java
Optional<String> optional = Optional.of("Hello");
String value = optional.orElseGet(() -> "Default");
System.out.println(value);  // Output: Hello

Optional<String> empty = Optional.empty();
String value2 = empty.orElseGet(() -> "Default");
System.out.println(value2);  // Output: Default

// Supplier is only called when Optional is empty
String result = optional.orElseGet(() -> {
    System.out.println("Computing default...");
    return computeExpensiveDefault();
});
```

**Use `orElseGet()` instead of `orElse()` when**:
- The default value is expensive to compute
- The default computation has side effects
- The default value comes from a method call

```java
// BAD: expensiveComputation() always runs
String name = optional.orElse(expensiveComputation());

// GOOD: expensiveComputation() only runs if optional is empty
String name = optional.orElseGet(() -> expensiveComputation());
```

### orElseThrow()

Returns the value if present, otherwise throws an exception.

```java
// Throws NoSuchElementException if empty (Java 10+)
String value = optional.orElseThrow();

// With custom exception
String value2 = optional.orElseThrow(
    () -> new UserNotFoundException("User not found")
);

// Common pattern in service layer
public User getUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
}

// With different exception types
public Product getProduct(String sku) {
    return productRepository.findBySku(sku)
        .orElseThrow(() -> new ProductNotFoundException(sku));
}
```

### or() (Java 9+)

Returns the Optional if value is present, otherwise returns an Optional produced by the supplier.

```java
Optional<String> optional = Optional.empty();

// Returns another Optional
Optional<String> result = optional.or(() -> Optional.of("Fallback"));
System.out.println(result.get());  // Output: Fallback

// Chaining fallbacks
Optional<User> user = findInCache(userId)
    .or(() -> findInDatabase(userId))
    .or(() -> findInExternalService(userId));

// All methods return Optional<User>
public Optional<User> findInCache(Long id) { ... }
public Optional<User> findInDatabase(Long id) { ... }
public Optional<User> findInExternalService(Long id) { ... }
```

## Transforming Optional Values

### map()

Transforms the value inside an Optional using a function.

```java
Optional<String> optional = Optional.of("hello");

// Transform to uppercase
Optional<String> upper = optional.map(String::toUpperCase);
System.out.println(upper.get());  // Output: HELLO

// Transform to length
Optional<Integer> length = optional.map(String::length);
System.out.println(length.get());  // Output: 5

// Chain multiple transformations
Optional<String> result = optional
    .map(String::trim)
    .map(String::toUpperCase)
    .map(s -> s.replace(" ", "_"));

// If Optional is empty, map returns empty
Optional<String> empty = Optional.empty();
Optional<String> mapped = empty.map(String::toUpperCase);
System.out.println(mapped.isPresent());  // Output: false

// Practical example
String cityName = findUser(userId)
    .map(User::getAddress)
    .map(Address::getCity)
    .map(String::toUpperCase)
    .orElse("UNKNOWN");
```

### flatMap()

Similar to `map()`, but the mapping function returns an Optional. Prevents nested Optionals.

```java
// When the mapper function returns an Optional
public Optional<Address> getAddress(User user) {
    return Optional.ofNullable(user.getAddress());
}

Optional<User> user = Optional.of(new User("John"));

// Using map() creates nested Optional<Optional<Address>>
Optional<Optional<Address>> nested = user.map(u -> getAddress(u));

// Using flatMap() flattens to Optional<Address>
Optional<Address> address = user.flatMap(u -> getAddress(u));

// Chain of flatMap for nested optionals
Optional<String> email = findUser(userId)
    .flatMap(User::getOptionalAddress)
    .flatMap(Address::getOptionalContactInfo)
    .flatMap(ContactInfo::getOptionalEmail);

// Compare map vs flatMap
class User {
    Optional<Address> getOptionalAddress() { ... }  // Returns Optional
    Address getAddress() { ... }  // Returns direct value
}

// Use flatMap when getter returns Optional
user.flatMap(User::getOptionalAddress);

// Use map when getter returns direct value
user.map(User::getAddress);
```

### Difference Between map() and flatMap()

```java
// Method that returns a direct value
public String getUpperCase(String s) {
    return s.toUpperCase();
}

// Method that returns an Optional
public Optional<String> findUpperCase(String s) {
    return Optional.of(s.toUpperCase());
}

Optional<String> optional = Optional.of("hello");

// map() with direct value function
Optional<String> result1 = optional.map(s -> getUpperCase(s));
// Result: Optional["HELLO"]

// map() with Optional-returning function
Optional<Optional<String>> result2 = optional.map(s -> findUpperCase(s));
// Result: Optional[Optional["HELLO"]] - nested!

// flatMap() with Optional-returning function
Optional<String> result3 = optional.flatMap(s -> findUpperCase(s));
// Result: Optional["HELLO"] - flattened!
```

## Filtering Optional Values

### filter()

Returns the Optional if the value matches the predicate, otherwise returns empty.

```java
Optional<Integer> number = Optional.of(10);

// Filter for even numbers
Optional<Integer> evenNumber = number.filter(n -> n % 2 == 0);
System.out.println(evenNumber.isPresent());  // Output: true

// Filter for numbers > 20
Optional<Integer> largeNumber = number.filter(n -> n > 20);
System.out.println(largeNumber.isPresent());  // Output: false

// Chaining filter with map
Optional<String> result = Optional.of("hello world")
    .filter(s -> s.length() > 5)
    .map(String::toUpperCase);
System.out.println(result.get());  // Output: HELLO WORLD

// Practical example: validate before processing
findUser(userId)
    .filter(User::isActive)
    .filter(user -> user.getAge() >= 18)
    .ifPresent(this::processAdultUser);

// Complex filtering
Optional<Product> validProduct = findProduct(productId)
    .filter(Product::isInStock)
    .filter(p -> p.getPrice() > 0)
    .filter(p -> p.getExpirationDate().isAfter(LocalDate.now()));
```

## Combining Multiple Optionals

### Sequential Dependency

When one Optional depends on another:

```java
public Optional<String> getUserEmail(Long userId) {
    return findUser(userId)
        .flatMap(user -> findAddress(user.getAddressId()))
        .flatMap(address -> findContactInfo(address.getContactId()))
        .map(ContactInfo::getEmail);
}
```

### Independent Optionals

When you need values from multiple independent Optionals:

```java
Optional<User> userOpt = findUser(userId);
Optional<Department> deptOpt = findDepartment(deptId);

// Combine using flatMap
Optional<String> result = userOpt.flatMap(user ->
    deptOpt.map(dept -> user.getName() + " works in " + dept.getName())
);

// Or using streams (Java 9+)
Optional<String> result2 = userOpt
    .flatMap(user -> deptOpt.map(dept ->
        user.getName() + " works in " + dept.getName()
    ));
```

### Using Stream with Optional (Java 9+)

```java
// Convert Optional to Stream
Optional<String> optional = Optional.of("Hello");
Stream<String> stream = optional.stream();

// Filter present values from a list of Optionals
List<Optional<String>> optionals = Arrays.asList(
    Optional.of("a"),
    Optional.empty(),
    Optional.of("b"),
    Optional.empty(),
    Optional.of("c")
);

// Java 8 approach
List<String> values = optionals.stream()
    .filter(Optional::isPresent)
    .map(Optional::get)
    .collect(Collectors.toList());
// Result: ["a", "b", "c"]

// Java 9+ approach using flatMap
List<String> values2 = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
// Result: ["a", "b", "c"]
```

## Optional in Practice

### Repository Pattern

```java
public interface UserRepository {
    // Return Optional for findById - user may not exist
    Optional<User> findById(Long id);

    // Return Optional for findByEmail - may not find a match
    Optional<User> findByEmail(String email);

    // Return List for findAll - empty list if none found
    List<User> findAll();

    // Return the saved entity directly
    User save(User user);
}

// Implementation
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

### Service Layer

```java
@Service
public class UserService {

    private final UserRepository userRepository;

    public UserDTO getUser(Long id) {
        return userRepository.findById(id)
            .map(this::convertToDTO)
            .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
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
                () -> { throw new UserNotFoundException("User not found: " + id); }
            );
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(user.getId(), user.getName(), user.getEmail());
    }
}
```

### REST Controller

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

### Configuration with Optional

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

// Usage
AppConfig config = new AppConfig(properties);
String dbHost = config.getPropertyOrDefault("db.host", "localhost");
int dbPort = config.getIntProperty("db.port", 5432);
Duration timeout = config.getTimeout();
```

### Chaining Optional Operations

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
                "Order #%d: %d items, Total: $%.2f",
                order.getId(),
                order.getItems().size(),
                order.getTotal()
            ))
            .orElse("Order not found");
    }

    public void processOrder(Long orderId) {
        findOrder(orderId)
            .filter(Order::isPending)
            .filter(order -> order.getTotal().compareTo(BigDecimal.ZERO) > 0)
            .ifPresentOrElse(
                this::executeOrder,
                () -> log.warn("Cannot process order: {}", orderId)
            );
    }
}
```

## Anti-Patterns to Avoid

### Using Optional.get() Without Checking

```java
// BAD: May throw NoSuchElementException
Optional<User> user = findUser(id);
String name = user.get().getName();  // Dangerous!

// GOOD: Use orElse, orElseThrow, or ifPresent
String name = findUser(id)
    .map(User::getName)
    .orElse("Unknown");
```

### Using Optional as Method Parameter

```java
// BAD: Forces caller to wrap values
public void processUser(Optional<User> user) {
    user.ifPresent(u -> process(u));
}

// GOOD: Use overloaded methods or null check
public void processUser(User user) {
    if (user != null) {
        process(user);
    }
}

// Or provide a null-safe version
public void processUserIfPresent(@Nullable User user) {
    Optional.ofNullable(user).ifPresent(this::process);
}
```

### Using Optional as Field Type

```java
// BAD: Optional is not serializable and adds memory overhead
public class User {
    private Optional<String> middleName;  // Don't do this!
}

// GOOD: Use nullable fields with Optional getter
public class User {
    private String middleName;  // null means no middle name

    public Optional<String> getMiddleName() {
        return Optional.ofNullable(middleName);
    }
}
```

### Using isPresent() + get()

```java
// BAD: Verbose and defeats the purpose
Optional<User> userOpt = findUser(id);
if (userOpt.isPresent()) {
    User user = userOpt.get();
    System.out.println(user.getName());
}

// GOOD: Use ifPresent or map
findUser(id).ifPresent(user -> System.out.println(user.getName()));

// Or
String name = findUser(id)
    .map(User::getName)
    .orElse("Unknown");
```

### Creating Optional from Optional

```java
// BAD: Wrapping already optional value
Optional<User> user = findUser(id);
Optional<Optional<User>> wrapped = Optional.of(user);  // Don't!

// BAD: Using ofNullable with Optional
Optional<String> name = Optional.of("John");
Optional<String> wrapped = Optional.ofNullable(name.orElse(null));  // Don't!
```

### Using Optional in Collections

```java
// BAD: List of Optionals
List<Optional<User>> users;  // Don't do this!

// GOOD: Filter nulls from the list
List<User> users = rawUsers.stream()
    .filter(Objects::nonNull)
    .collect(Collectors.toList());

// Or return empty list instead of Optional<List>
public List<User> findUsers() {
    // Return empty list, not Optional.empty()
    return users != null ? users : Collections.emptyList();
}
```

### Overusing Optional

```java
// BAD: Optional where null is not a valid case
public Optional<Integer> add(int a, int b) {
    return Optional.of(a + b);  // Result is always valid!
}

// GOOD: Return primitive directly
public int add(int a, int b) {
    return a + b;
}

// BAD: Optional for boolean results
public Optional<Boolean> isValid(String input) {
    return Optional.of(input != null && !input.isEmpty());
}

// GOOD: Return boolean directly
public boolean isValid(String input) {
    return input != null && !input.isEmpty();
}
```

## Best Practices

### Use Optional for Return Types

```java
// When a method might not find a result
public Optional<User> findById(Long id);
public Optional<String> extractEmail(String text);

// Not for methods that should always return a value
public User createUser(UserDTO dto);  // Always returns the created user
public int calculateSum(List<Integer> numbers);  // Always returns a sum
```

### Prefer Functional Methods Over isPresent/get

```java
// Instead of:
Optional<String> opt = getValue();
if (opt.isPresent()) {
    return opt.get().toUpperCase();
} else {
    return "DEFAULT";
}

// Use:
return getValue()
    .map(String::toUpperCase)
    .orElse("DEFAULT");
```

### Use orElseGet for Expensive Defaults

```java
// orElse - always evaluates the default
String value = optional.orElse(expensiveComputation());

// orElseGet - only evaluates if needed
String value = optional.orElseGet(() -> expensiveComputation());
```

### Use orElseThrow for Required Values

```java
public User getRequiredUser(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new UserNotFoundException("User not found: " + id));
}
```

### Chain Operations Instead of Nesting

```java
// Instead of:
Optional<User> user = findUser(id);
if (user.isPresent()) {
    Optional<Address> address = user.get().getAddress();
    if (address.isPresent()) {
        return address.get().getCity();
    }
}
return "Unknown";

// Use:
return findUser(id)
    .flatMap(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");
```

### Use Empty Collections Instead of Optional Collections

```java
// BAD
public Optional<List<User>> findUsers();

// GOOD
public List<User> findUsers();  // Returns empty list if none found
```

### Document Null Behavior with Optional

```java
public class UserService {
    /**
     * Finds a user by their ID.
     *
     * @param id the user ID
     * @return an Optional containing the user if found, empty otherwise
     */
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(repository.findById(id));
    }
}
```

## Optional vs Null Checks

### When to Use Optional

- Method return types where absence is a valid, expected outcome
- When you want to chain operations on potentially absent values
- API design where you want to make absence explicit
- When working with Stream operations

### When to Use Null Checks

- Private or internal methods where null is exceptional
- Performance-critical code where Optional overhead matters
- Fields in classes (use Optional in getters instead)
- Method parameters (use @Nullable annotation instead)

### Comparison Example

```java
// Traditional null checks
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

// Using Optional
public String getDisplayName(User user) {
    return Optional.ofNullable(user)
        .map(User::getName)
        .filter(name -> !name.isEmpty())
        .orElseGet(() -> user != null
            ? "User #" + user.getId()
            : "Guest");
}

// Better: Combine both approaches
public String getDisplayName(@Nullable User user) {
    if (user == null) {
        return "Guest";
    }
    return Optional.ofNullable(user.getName())
        .filter(name -> !name.isEmpty())
        .orElse("User #" + user.getId());
}
```

## Primitive Optional Types

Java provides specialized Optional classes for primitive types to avoid boxing overhead:

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

// Converting from Stream
OptionalInt max = IntStream.of(1, 2, 3, 4, 5).max();
OptionalDouble average = IntStream.of(1, 2, 3, 4, 5).average();

// Usage in methods
public OptionalInt findMaxAge(List<Person> people) {
    return people.stream()
        .mapToInt(Person::getAge)
        .max();
}
```

## Conclusion

Java Optional is a powerful tool for writing null-safe code when used correctly. Key takeaways:

- **Use Optional for return types** where absence is a valid outcome
- **Avoid Optional for parameters and fields** - use nullable annotations instead
- **Prefer functional methods** (map, flatMap, orElse) over isPresent/get
- **Use orElseGet for expensive defaults** to avoid unnecessary computation
- **Chain operations** instead of nested if-statements
- **Don't overuse Optional** - sometimes null checks are more appropriate

By following these guidelines, you can significantly reduce NullPointerExceptions in your codebase while writing more expressive and maintainable code.

## Further Reading

- [Java Optional Documentation](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Optional.html)
- [Effective Java by Joshua Bloch - Item 55](https://www.oreilly.com/library/view/effective-java/9780134686097/)
- [Oracle: Tired of Null Pointer Exceptions?](https://www.oracle.com/technical-resources/articles/java/java8-optional.html)
- [Java 8 in Action - Chapter 11: Using Optional](https://www.manning.com/books/java-8-in-action)
