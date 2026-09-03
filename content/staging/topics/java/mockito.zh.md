---
title: Java Mockito 测试框架
description: 深入理解 Mockito 单元测试框架，掌握 Mock 对象创建、方法存根、验证行为和参数捕获等核心技术
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Mockito
  - 单元测试
  - Mock
  - TDD
  - JUnit
status: imported
origin: old/src/content/docs/java/mockito.zh.md
divergence: 0.207
issues: []
legacy:
  category: Java
  subcategory: 测试
  order: 31
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Mockito

Mockito 是 Java 生态中最流行的单元测试模拟框架。它允许开发者创建和配置 Mock 对象，以便在隔离环境中测试代码，而无需依赖真实的外部服务、数据库或其他组件。

### Mock 测试的核心思想

在单元测试中，我们希望测试的是被测类（SUT，System Under Test）的行为，而不是它的依赖项。Mock 对象就是这些依赖项的"替身"，它们：

- **模拟行为**：可以预设方法的返回值
- **验证交互**：可以验证方法是否被调用、调用次数、调用顺序
- **隔离测试**：使测试不受外部因素影响

```
┌─────────────────────────────────────────────────────────────┐
│                      单元测试架构                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ┌─────────────────┐                                      │
│    │   测试类 Test    │                                      │
│    └────────┬────────┘                                      │
│             │                                               │
│             ▼                                               │
│    ┌─────────────────┐      ┌─────────────────┐            │
│    │   被测类 SUT     │─────>│  Mock 依赖对象   │            │
│    │  (真实代码)      │      │  (模拟的替身)    │            │
│    └─────────────────┘      └─────────────────┘            │
│                                      │                      │
│                                      ▼                      │
│                             ┌─────────────────┐            │
│                             │  预设返回值      │            │
│                             │  验证调用行为    │            │
│                             └─────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mock vs Stub vs Spy

| 类型 | 描述 | 使用场景 |
|------|------|----------|
| **Mock** | 完全模拟的对象，所有方法默认返回空值 | 需要完全控制依赖行为 |
| **Stub** | 预设特定方法返回值的对象 | 只关心某些方法的返回值 |
| **Spy** | 部分模拟，保留真实方法实现 | 只想模拟部分方法 |

### 为什么选择 Mockito

1. **API 简洁优雅**：链式调用，代码可读性强
2. **功能强大**：支持参数匹配、验证、捕获等高级功能
3. **社区活跃**：文档完善，问题易于解决
4. **与 JUnit 无缝集成**：通过注解简化配置

## 核心原理

### Mockito 的工作机制

Mockito 底层使用了 **字节码生成技术**（基于 ByteBuddy 或 CGLIB）来动态创建 Mock 对象：

```
┌────────────────────────────────────────────────────────────────┐
│                    Mockito 内部架构                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   1. 创建 Mock 对象                                            │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│   │ @Mock 注解   │────>│ MockitoCore  │────>│ ByteBuddy    │  │
│   │ 或 mock()    │     │ 处理器       │     │ 字节码生成    │  │
│   └──────────────┘     └──────────────┘     └──────────────┘  │
│                                                    │           │
│                                                    ▼           │
│                                           ┌──────────────┐    │
│                                           │ 代理类实例    │    │
│                                           │ (Mock对象)    │    │
│                                           └──────────────┘    │
│                                                                │
│   2. 方法调用拦截                                              │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐  │
│   │ 调用Mock方法  │────>│ 拦截器       │────>│ 存根答案     │  │
│   │              │     │ Interceptor  │     │ (返回预设值)  │  │
│   └──────────────┘     └──────────────┘     └──────────────┘  │
│                              │                                 │
│                              ▼                                 │
│                        ┌──────────────┐                       │
│                        │ 调用记录     │                       │
│                        │ Invocations  │                       │
│                        └──────────────┘                       │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Mock 对象的生命周期

```java
// 1. 创建阶段：生成代理类实例
UserService mockService = mock(UserService.class);

// 2. 存根阶段：配置方法行为（Stubbing）
when(mockService.findById(1L)).thenReturn(new User("Alice"));

// 3. 执行阶段：被测代码调用 Mock 方法
User user = mockService.findById(1L);  // 返回预设的 User

// 4. 验证阶段：检查交互是否符合预期
verify(mockService).findById(1L);  // 验证方法被调用

// 5. 重置阶段（可选）：清除存根和验证记录
reset(mockService);
```

### 存根机制详解

当调用 `when(...).thenReturn(...)` 时，Mockito 内部发生了什么：

```java
// 1. when() 方法记录当前方法调用
// 2. thenReturn() 将返回值与该调用绑定
// 3. 后续匹配的调用将返回预设值

// 存根的匹配规则（按注册顺序）
when(service.getData("A")).thenReturn("Result A");
when(service.getData("B")).thenReturn("Result B");
when(service.getData(anyString())).thenReturn("Default");

// 调用时匹配最后注册的匹配项
service.getData("A");  // 返回 "Result A"（精确匹配优先）
service.getData("C");  // 返回 "Default"（anyString 匹配）
```

## 核心要点

### 依赖配置

```xml
<!-- Maven 依赖 -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.8.0</version>
    <scope>test</scope>
</dependency>

<!-- JUnit 5 扩展（推荐） -->
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.8.0</version>
    <scope>test</scope>
</dependency>
```

### 核心注解

| 注解 | 作用 | 说明 |
|------|------|------|
| `@Mock` | 创建 Mock 对象 | 所有方法返回默认值 |
| `@Spy` | 创建 Spy 对象 | 保留真实实现，可部分模拟 |
| `@InjectMocks` | 自动注入 Mock | 将 @Mock 对象注入被测类 |
| `@Captor` | 创建参数捕获器 | 用于捕获方法参数 |

### 存根方法

| 方法 | 作用 |
|------|------|
| `when().thenReturn()` | 返回指定值 |
| `when().thenThrow()` | 抛出异常 |
| `when().thenAnswer()` | 自定义返回逻辑 |
| `when().thenCallRealMethod()` | 调用真实方法 |
| `doReturn().when()` | 另一种存根方式（用于 spy） |

### 验证方法

| 方法 | 作用 |
|------|------|
| `verify(mock).method()` | 验证方法被调用一次 |
| `verify(mock, times(n))` | 验证调用次数 |
| `verify(mock, never())` | 验证从未调用 |
| `verify(mock, atLeast(n))` | 验证至少调用 n 次 |
| `verifyNoMoreInteractions()` | 验证无其他交互 |

### 参数匹配器

| 匹配器 | 作用 |
|--------|------|
| `any()` | 匹配任意对象 |
| `anyString()`, `anyInt()` | 匹配特定类型 |
| `eq(value)` | 精确匹配 |
| `argThat(predicate)` | 自定义匹配逻辑 |
| `isNull()`, `notNull()` | 空值匹配 |

## 代码示例

### 基础设置与 @Mock 注解

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// 业务类定义
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

// 测试类
@ExtendWith(MockitoExtension.class)  // 启用 Mockito 扩展
class UserServiceTest {

    @Mock
    private UserRepository userRepository;  // 创建 Mock 对象

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;  // 自动注入 Mock 对象

    @Test
    void shouldReturnUserWhenFound() {
        // Given（准备）
        User expectedUser = new User(1L, "Alice", "alice@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(expectedUser));

        // When（执行）
        User result = userService.getUserById(1L);

        // Then（验证）
        assertEquals("Alice", result.getName());
        verify(userRepository).findById(1L);  // 验证调用
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

### when/thenReturn 存根配置

```java
@Test
void demonstrateStubbing() {
    // 基本存根
    when(userRepository.findById(1L)).thenReturn(Optional.of(new User("Alice")));

    // 链式存根（多次调用返回不同值）
    when(userRepository.count())
        .thenReturn(1L)
        .thenReturn(2L)
        .thenReturn(3L);

    assertEquals(1L, userRepository.count());  // 第一次调用
    assertEquals(2L, userRepository.count());  // 第二次调用
    assertEquals(3L, userRepository.count());  // 第三次及之后
    assertEquals(3L, userRepository.count());  // 仍然返回 3L

    // 抛出异常
    when(userRepository.findById(-1L))
        .thenThrow(new IllegalArgumentException("Invalid ID"));

    assertThrows(IllegalArgumentException.class, () -> {
        userRepository.findById(-1L);
    });

    // 使用 thenAnswer 自定义返回逻辑
    when(userRepository.save(any(User.class)))
        .thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(System.currentTimeMillis());  // 模拟生成 ID
            return user;
        });

    User newUser = userRepository.save(new User("Bob"));
    assertNotNull(newUser.getId());
}

@Test
void demonstrateVoidMethodStubbing() {
    // void 方法不能使用 when().thenReturn()
    // 使用 doNothing(), doThrow() 等

    doNothing().when(emailService).sendWelcomeEmail(anyString());

    // 或者让 void 方法抛出异常
    doThrow(new EmailException("SMTP Error"))
        .when(emailService).sendWelcomeEmail("invalid@");

    // void 方法也可以使用 doAnswer
    doAnswer(invocation -> {
        String email = invocation.getArgument(0);
        System.out.println("Sending email to: " + email);
        return null;  // void 方法返回 null
    }).when(emailService).sendWelcomeEmail(anyString());
}
```

### verify 验证行为

```java
@Test
void demonstrateVerification() {
    // 准备和执行
    when(userRepository.findById(1L)).thenReturn(Optional.of(new User("Alice")));
    userService.getUserById(1L);
    userService.getUserById(1L);

    // 验证调用次数
    verify(userRepository, times(2)).findById(1L);
    verify(userRepository, atLeast(1)).findById(1L);
    verify(userRepository, atMost(3)).findById(1L);
    verify(userRepository, never()).delete(any());

    // 验证调用顺序
    InOrder inOrder = inOrder(userRepository, emailService);

    when(userRepository.save(any())).thenReturn(new User(1L, "Bob", "bob@test.com"));
    userService.createUser("Bob", "bob@test.com");

    inOrder.verify(userRepository).save(any());
    inOrder.verify(emailService).sendWelcomeEmail(anyString());

    // 验证没有其他交互
    verifyNoMoreInteractions(emailService);

    // 验证在指定时间内被调用（用于异步测试）
    verify(userRepository, timeout(1000).times(1)).findById(anyLong());
}

@Test
void demonstrateArgumentMatchers() {
    // 使用参数匹配器
    when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
    when(userRepository.findByEmail(eq("admin@test.com")))
        .thenReturn(Optional.of(new User("Admin")));

    // 注意：如果使用了参数匹配器，所有参数都必须使用匹配器
    // 错误示例：verify(mock).method(anyString(), "literal");  // 编译错误
    // 正确示例：verify(mock).method(anyString(), eq("literal"));

    // 自定义匹配器
    verify(userRepository).findByEmail(argThat(email ->
        email != null && email.contains("@")
    ));

    // 组合匹配器
    when(userRepository.findByNameAndAge(
        argThat(name -> name.length() > 2),
        intThat(age -> age >= 18)
    )).thenReturn(Optional.of(new User("Adult")));
}
```

### ArgumentCaptor 参数捕获

```java
@Test
void demonstrateArgumentCaptor() {
    // 方式一：使用 @Captor 注解
    @Captor
    ArgumentCaptor<User> userCaptor;

    // 方式二：手动创建
    ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);

    // 执行被测代码
    when(userRepository.save(any(User.class)))
        .thenReturn(new User(1L, "Alice", "alice@test.com"));
    userService.createUser("Alice", "alice@test.com");

    // 捕获参数
    verify(emailService).sendWelcomeEmail(emailCaptor.capture());

    // 验证捕获的参数
    String capturedEmail = emailCaptor.getValue();
    assertEquals("alice@test.com", capturedEmail);

    // 捕获多次调用的所有参数
    userService.createUser("Bob", "bob@test.com");
    userService.createUser("Charlie", "charlie@test.com");

    verify(emailService, times(3)).sendWelcomeEmail(emailCaptor.capture());
    List<String> allEmails = emailCaptor.getAllValues();
    assertEquals(3, allEmails.size());
    assertTrue(allEmails.contains("bob@test.com"));
}

@Test
void captureComplexArguments() {
    // 捕获复杂对象
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

### Spy 部分模拟

```java
@Test
void demonstrateSpy() {
    // 创建 Spy：保留真实行为，可选择性覆盖
    List<String> spyList = spy(new ArrayList<>());

    // 真实方法被调用
    spyList.add("one");
    spyList.add("two");
    assertEquals(2, spyList.size());  // 真实的 size()

    // 存根特定方法
    when(spyList.size()).thenReturn(100);
    assertEquals(100, spyList.size());  // 返回存根值
    assertEquals("one", spyList.get(0));  // 真实的 get()

    // 注意：对 spy 使用 when().thenReturn() 会先调用真实方法
    // 使用 doReturn().when() 避免这个问题
    doReturn("mocked").when(spyList).get(0);
    assertEquals("mocked", spyList.get(0));
}

@Test
void spyWithRealService() {
    // 使用 @Spy 注解
    @Spy
    private UserValidator userValidator = new UserValidator();

    @InjectMocks
    private UserService userService;

    // 只模拟特定方法，其他方法保持真实实现
    doReturn(true).when(userValidator).isEmailValid(anyString());

    // userValidator.isNameValid() 会执行真实逻辑
    // userValidator.isEmailValid() 返回模拟值
}
```

### 完整测试示例

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
    @DisplayName("成功创建订单时应扣减库存并发送通知")
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

        // 验证交互顺序
        InOrder inOrder = inOrder(inventoryService, paymentService,
                                  orderRepository, notificationService);
        inOrder.verify(inventoryService).checkStock(productId, quantity);
        inOrder.verify(paymentService).processPayment(any());
        inOrder.verify(inventoryService).deductStock(productId, quantity);
        inOrder.verify(orderRepository).save(any(Order.class));
        inOrder.verify(notificationService).sendOrderConfirmation(any());

        // 验证保存的订单内容
        verify(orderRepository).save(orderCaptor.capture());
        Order savedOrder = orderCaptor.getValue();
        assertEquals(userId, savedOrder.getUserId());
        assertEquals(new BigDecimal("199.98"), savedOrder.getTotalAmount());
    }

    @Test
    @DisplayName("库存不足时应抛出异常且不处理支付")
    void shouldThrowExceptionWhenStockInsufficient() {
        // Given
        when(inventoryService.checkStock(anyLong(), anyInt())).thenReturn(false);

        // When & Then
        assertThrows(InsufficientStockException.class, () -> {
            orderService.createOrder(1L, 100L, 5);
        });

        // 验证支付未被调用
        verify(paymentService, never()).processPayment(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("支付失败时应回滚库存")
    void shouldRollbackWhenPaymentFails() {
        // Given
        when(inventoryService.checkStock(anyLong(), anyInt())).thenReturn(true);
        when(paymentService.processPayment(any()))
            .thenReturn(PaymentResult.FAILED);

        // When & Then
        assertThrows(PaymentException.class, () -> {
            orderService.createOrder(1L, 100L, 2);
        });

        // 验证库存回滚
        verify(inventoryService).rollbackStock(anyLong(), anyInt());
        verify(orderRepository, never()).save(any());
    }
}
```

## 最佳实践

### 测试结构规范（AAA 模式）

```java
@Test
void shouldFollowAAAPattern() {
    // Arrange（准备）- 设置测试数据和 Mock 行为
    User user = new User("Alice");
    when(userRepository.findById(1L)).thenReturn(Optional.of(user));

    // Act（执行）- 调用被测方法
    User result = userService.getUserById(1L);

    // Assert（断言）- 验证结果和交互
    assertEquals("Alice", result.getName());
    verify(userRepository).findById(1L);
}
```

### 只 Mock 必要的依赖

```java
// 好的做法：只 Mock 外部依赖
@Mock
private UserRepository userRepository;  // 数据库访问

@Mock
private EmailService emailService;  // 外部服务

// 不要 Mock：值对象、工具类、被测类本身
// UserService userService = spy(new UserService(...));  // 避免
```

### 使用 BDD 风格提高可读性

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

### 合理使用严格模式

```java
@ExtendWith(MockitoExtension.class)
class StrictModeTest {
    // MockitoExtension 默认使用 STRICT_STUBS 模式
    // 会检测未使用的存根和参数匹配问题

    @Test
    void strictModeDetectsUnusedStubbing() {
        // 如果存根了但未使用，会报错
        when(mock.method()).thenReturn("value");
        // 如果不调用 mock.method()，测试会失败
    }
}

// 放宽严格模式（不推荐）
@MockitoSettings(strictness = Strictness.LENIENT)
class LenientTest {
    // 允许未使用的存根
}
```

### 避免过度验证

```java
// 不好的做法：验证每个调用
@Test
void overVerification() {
    userService.createUser("Alice", "alice@test.com");

    verify(userRepository).save(any());
    verify(emailService).sendWelcomeEmail(any());
    verify(userRepository, never()).delete(any());  // 过度验证
    verify(emailService, never()).sendGoodbyeEmail(any());  // 过度验证
    verifyNoMoreInteractions(userRepository, emailService);  // 过于严格
}

// 好的做法：只验证关键行为
@Test
void focusedVerification() {
    userService.createUser("Alice", "alice@test.com");

    verify(userRepository).save(any());  // 核心业务
    verify(emailService).sendWelcomeEmail("alice@test.com");  // 副作用
}
```

### 参数匹配器使用规范

```java
@Test
void argumentMatcherBestPractices() {
    // 优先使用精确匹配
    when(service.findById(1L)).thenReturn(result);

    // 需要灵活匹配时使用 any 系列
    when(service.findById(anyLong())).thenReturn(defaultResult);

    // 复杂条件使用 argThat
    when(service.save(argThat(user ->
        user.getName() != null && user.getAge() >= 18
    ))).thenReturn(savedUser);

    // 规则：混用时，所有参数都必须是匹配器
    // when(service.method(anyString(), "literal"));  // 错误！
    when(service.method(anyString(), eq("literal"))).thenReturn(result);
}
```

## 常见陷阱

### final 类和方法无法 Mock

```java
// 默认情况下，Mockito 无法 Mock final 类/方法

// 解决方案一：在 test/resources 下创建配置文件
// src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker
// 内容：mock-maker-inline

// 解决方案二：使用 mockito-inline 依赖（Mockito 5.x 默认支持）
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.8.0</version>  <!-- 5.x 默认支持 inline mock -->
</dependency>
```

### 静态方法 Mock

```java
// Mockito 3.4+ 支持静态方法 Mock
@Test
void mockStaticMethod() {
    try (MockedStatic<Utils> utilities = mockStatic(Utils.class)) {
        utilities.when(() -> Utils.generateId()).thenReturn("mock-id");

        assertEquals("mock-id", Utils.generateId());
    }
    // try 块外恢复原始行为
}
```

### Spy 的 when/doReturn 区别

```java
@Test
void spyStubbing() {
    List<String> spyList = spy(new ArrayList<>());

    // 危险：when() 会先调用真实方法！
    // when(spyList.get(0)).thenReturn("mock");  // 抛出 IndexOutOfBoundsException

    // 安全：doReturn 不调用真实方法
    doReturn("mock").when(spyList).get(0);
    assertEquals("mock", spyList.get(0));
}
```

### 参数匹配器作用域

```java
@Test
void argumentMatcherScope() {
    // 错误：参数匹配器必须在 verify/when 内使用
    // String captured = anyString();  // 错误！
    // verify(mock).method(captured);

    // 正确：直接在 verify/when 中使用
    verify(mock).method(anyString());

    // 正确：使用 ArgumentCaptor 获取参数
    ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
    verify(mock).method(captor.capture());
    String captured = captor.getValue();
}
```

### 避免在存根中修改参数

```java
@Test
void avoidMutatingArguments() {
    // 不好的做法：在 thenAnswer 中修改传入参数
    when(repository.save(any(User.class))).thenAnswer(inv -> {
        User user = inv.getArgument(0);
        user.setId(1L);  // 修改了原始对象
        return user;
    });

    // 更好的做法：返回新对象
    when(repository.save(any(User.class))).thenAnswer(inv -> {
        User user = inv.getArgument(0);
        return new User(1L, user.getName(), user.getEmail());
    });
}
```

### 注解未生效

```java
// 问题：忘记启用 Mockito 注解
class BrokenTest {
    @Mock
    private UserRepository repository;  // 是 null！
}

// 解决方案一：使用 JUnit 5 扩展
@ExtendWith(MockitoExtension.class)
class FixedTest {
    @Mock
    private UserRepository repository;  // 正常注入
}

// 解决方案二：手动初始化
class ManualInitTest {
    @Mock
    private UserRepository repository;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }
}
```

### 泛型类型擦除问题

```java
@Test
void genericTypeErasure() {
    // 问题：无法直接 Mock 泛型类型
    // List<String> mockList = mock(List<String>.class);  // 编译错误

    // 解决方案：使用原始类型并强制转换
    @SuppressWarnings("unchecked")
    List<String> mockList = mock(List.class);

    // 或使用 @Mock 注解
    @Mock
    List<String> annotatedMockList;  // 类型安全
}
```

## 性能考量

### Mock 对象创建开销

```java
// 避免在每个测试方法中创建 Mock
// 不好的做法
@Test
void test1() {
    UserRepository repo = mock(UserRepository.class);  // 每次创建
}

// 好的做法：使用字段级别 Mock
@Mock
private UserRepository userRepository;  // 复用

// 或使用 @BeforeEach 创建共享 Mock
@BeforeEach
void setUp() {
    reset(userRepository);  // 重置状态而非重新创建
}
```

### 避免不必要的验证

```java
// 验证有开销，只验证必要的交互
@Test
void efficientVerification() {
    // 只验证核心业务逻辑
    verify(orderRepository).save(any());

    // 避免：verifyNoMoreInteractions() 检查所有调用
    // 避免：verify(mock, times(0)).method() 等冗余验证
}
```

### 使用 Lenient 存根

```java
// 如果存根可能不被使用，使用 lenient 避免严格检查开销
@Test
void useLenientStubbing() {
    lenient().when(cache.get(anyString())).thenReturn(null);

    // 这个存根可能不会被调用，但不会导致测试失败
}
```

### Mock 数量控制

```java
// 测试中 Mock 太多是设计问题的信号
// 通常一个测试类不应该有超过 3-5 个 Mock

// 如果需要太多 Mock，考虑：
// 1. 被测类职责是否太多（违反单一职责原则）
// 2. 是否应该做集成测试而非单元测试
// 3. 是否可以使用真实的简单依赖（如值对象）
```

## 实战场景

### 场景一：测试 Controller 层

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

### 场景二：测试异步代码

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

### 场景三：测试事务回滚

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

        // 验证账户余额未改变（回滚）
        assertEquals(new BigDecimal("1000"), fromAccount.getBalance());
        assertEquals(new BigDecimal("500"), toAccount.getBalance());
    }
}
```

### 场景四：Mock 链式调用

```java
@Test
void shouldMockChainedCalls() {
    // 场景：repository.findById().map().orElseThrow()

    // 方式一：RETURNS_DEEP_STUBS
    UserRepository deepMock = mock(UserRepository.class, RETURNS_DEEP_STUBS);
    when(deepMock.findById(1L).orElseThrow()).thenReturn(new User("Alice"));

    // 方式二：逐层 Mock（更清晰）
    Optional<User> optionalUser = Optional.of(new User("Alice"));
    when(userRepository.findById(1L)).thenReturn(optionalUser);

    // 场景：Builder 模式
    QueryBuilder builderMock = mock(QueryBuilder.class, RETURNS_SELF);
    when(builderMock.select(anyString())).thenReturn(builderMock);
    when(builderMock.where(anyString())).thenReturn(builderMock);
    when(builderMock.execute()).thenReturn(results);
}
```

## 面试要点

### Mockito 的核心概念

**Q: 什么是 Mock 对象？为什么需要 Mock？**

A: Mock 对象是真实对象的模拟替身，用于：
- 隔离被测代码与外部依赖
- 控制测试环境的确定性
- 模拟难以触发的边界情况
- 提高测试执行速度

**Q: @Mock、@Spy、@InjectMocks 的区别？**

A:
- `@Mock`：创建完全模拟的对象，所有方法返回默认值
- `@Spy`：创建部分模拟的对象，保留真实方法实现，可选择性覆盖
- `@InjectMocks`：自动将 @Mock/@Spy 对象注入被测类

### 存根与验证

**Q: when().thenReturn() 和 doReturn().when() 的区别？**

A:
```java
// when().thenReturn() - 会调用真实方法（对 spy 有影响）
when(spy.get(0)).thenReturn("mock");  // 先调用 get(0)，可能抛异常

// doReturn().when() - 不调用真实方法
doReturn("mock").when(spy).get(0);  // 安全
```

**Q: verify() 的作用是什么？**

A: `verify()` 用于验证 Mock 对象的方法是否被调用、调用次数、调用参数等。它是行为验证的核心方法。

### 高级特性

**Q: ArgumentCaptor 的使用场景？**

A: 当需要验证传递给 Mock 方法的参数内容时使用：
```java
ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
verify(repository).save(captor.capture());
assertEquals("Alice", captor.getValue().getName());
```

**Q: 如何 Mock 静态方法和 final 类？**

A: Mockito 5.x 默认支持。3.4+ 需要使用 `mockStatic()` 和 mock-maker-inline 配置。

### 最佳实践

**Q: 单元测试应该 Mock 什么？**

A:
- **应该 Mock**：外部服务、数据库、网络调用、第三方 API
- **不应该 Mock**：值对象、工具类、被测类本身

**Q: 如何避免脆弱测试？**

A:
- 只验证关键行为，不过度验证
- 使用灵活的参数匹配器
- 关注行为而非实现细节
- 遵循 AAA 模式组织测试

## 延伸阅读

### 官方资源

- [Mockito 官方文档](https://site.mockito.org/)
- [Mockito GitHub 仓库](https://github.com/mockito/mockito)
- [Mockito Javadoc](https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html)

### 相关书籍

- *xUnit Test Patterns* - Gerard Meszaros
- *Growing Object-Oriented Software, Guided by Tests* - Steve Freeman, Nat Pryce
- *Effective Unit Testing* - Lasse Koskela

### 进阶主题

- **PowerMock**：用于 Mock 私有方法、构造函数等 Mockito 不支持的场景
- **WireMock**：用于 Mock HTTP 服务
- **Testcontainers**：用于集成测试的容器化依赖

### 相关工具

- **JUnit 5**：测试框架
- **AssertJ**：流畅的断言库
- **Spring Test**：Spring 应用测试支持
- **JaCoCo**：代码覆盖率工具

---

> 本文详细介绍了 Mockito 框架的核心概念和使用方法。掌握 Mock 测试技术对于编写高质量、可维护的单元测试至关重要。建议结合实际项目练习，逐步掌握各种 Mock 场景的处理技巧。
