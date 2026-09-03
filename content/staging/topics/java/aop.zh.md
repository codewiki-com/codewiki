---
title: Spring AOP 面向切面编程详解
description: 深入理解Spring AOP的核心概念、代理机制、切点表达式和最佳实践，掌握企业级横切关注点的优雅解决方案
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Spring
  - AOP
  - 切面编程
  - 代理模式
  - 横切关注点
status: imported
origin: old/src/content/docs/java/aop.zh.md
divergence: 0.213
issues:
  - title-lang-en
  - title-language
legacy:
  category: Java
  subcategory: Spring Framework
  order: 30
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 AOP

AOP（Aspect-Oriented Programming，面向切面编程）是一种编程范式，它通过将横切关注点（Cross-Cutting Concerns）从业务逻辑中分离出来，实现代码的模块化和解耦。

在传统的面向对象编程中，我们通过类和对象来组织代码。但有些功能（如日志记录、事务管理、安全检查、性能监控）会散布在多个类中，形成所谓的"横切关注点"。这些代码难以维护，违反了单一职责原则。

```
传统 OOP 的问题：横切关注点散布在各处
┌─────────────────────────────────────────────────────────────┐
│  UserService          OrderService         ProductService   │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐   │
│  │ 日志记录  │        │ 日志记录  │        │ 日志记录  │   │
│  │ 权限检查  │        │ 权限检查  │        │ 权限检查  │   │
│  │ 事务管理  │        │ 事务管理  │        │ 事务管理  │   │
│  │ ──────── │        │ ──────── │        │ ──────── │   │
│  │ 业务逻辑  │        │ 业务逻辑  │        │ 业务逻辑  │   │
│  │ ──────── │        │ ──────── │        │ ──────── │   │
│  │ 日志记录  │        │ 日志记录  │        │ 日志记录  │   │
│  └───────────┘        └───────────┘        └───────────┘   │
└─────────────────────────────────────────────────────────────┘

AOP 的解决方案：横切关注点集中管理
┌─────────────────────────────────────────────────────────────┐
│                    横切关注点 (Aspects)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 日志切面 │ │ 安全切面 │ │ 事务切面 │ │ 监控切面 │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UserService    OrderService    ProductService        │  │
│  │  ┌─────────┐    ┌─────────┐     ┌─────────┐          │  │
│  │  │业务逻辑 │    │业务逻辑 │     │业务逻辑 │          │  │
│  │  └─────────┘    └─────────┘     └─────────┘          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### AOP 核心术语

理解 AOP 需要掌握以下核心概念：

| 术语 | 英文 | 说明 |
|------|------|------|
| 切面 | Aspect | 封装横切关注点的模块，包含通知和切点 |
| 连接点 | JoinPoint | 程序执行过程中的特定点，如方法调用、异常抛出 |
| 切点 | Pointcut | 定义哪些连接点会被拦截的表达式 |
| 通知 | Advice | 在连接点执行的动作（前置、后置、环绕等） |
| 织入 | Weaving | 将切面应用到目标对象的过程 |
| 目标对象 | Target | 被代理的原始对象 |
| 代理 | Proxy | AOP 创建的对象，包含了目标对象和增强逻辑 |

### Spring AOP vs AspectJ

```
┌─────────────────────────────────────────────────────────────┐
│                    AOP 实现方式对比                          │
├──────────────────────┬──────────────────────────────────────┤
│     Spring AOP       │            AspectJ                   │
├──────────────────────┼──────────────────────────────────────┤
│ 运行时织入（动态代理）│ 编译时/加载时织入                    │
│ 仅支持方法级连接点    │ 支持字段、构造器、静态初始化等       │
│ 仅代理 Spring Bean   │ 可代理任何 Java 类                   │
│ 配置简单，开箱即用    │ 需要特殊编译器或代理                 │
│ 性能略低             │ 性能更好                             │
│ 适合大多数企业应用    │ 适合需要细粒度控制的场景             │
└──────────────────────┴──────────────────────────────────────┘
```

## 核心原理

### 代理模式基础

Spring AOP 基于代理模式实现，主要有两种代理方式：

#### JDK 动态代理（基于接口）

```java
// 目标接口
public interface UserService {
    void createUser(String username);
    User findUser(Long id);
}

// 目标实现
public class UserServiceImpl implements UserService {
    @Override
    public void createUser(String username) {
        System.out.println("创建用户: " + username);
    }

    @Override
    public User findUser(Long id) {
        return new User(id, "test");
    }
}

// JDK 动态代理实现
public class JdkDynamicProxyDemo {

    public static void main(String[] args) {
        UserService target = new UserServiceImpl();

        UserService proxy = (UserService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args)
                        throws Throwable {
                    System.out.println("【前置】方法调用: " + method.getName());
                    long start = System.currentTimeMillis();

                    try {
                        Object result = method.invoke(target, args);
                        System.out.println("【后置】执行成功");
                        return result;
                    } catch (Exception e) {
                        System.out.println("【异常】" + e.getMessage());
                        throw e;
                    } finally {
                        long duration = System.currentTimeMillis() - start;
                        System.out.println("【耗时】" + duration + "ms");
                    }
                }
            }
        );

        proxy.createUser("张三");
    }
}
```

#### CGLIB 代理（基于继承）

```java
// 目标类（无需实现接口）
public class OrderService {
    public void createOrder(String orderId) {
        System.out.println("创建订单: " + orderId);
    }

    // final 方法无法被代理
    public final void cancelOrder(String orderId) {
        System.out.println("取消订单: " + orderId);
    }
}

// CGLIB 代理实现
public class CglibProxyDemo {

    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(OrderService.class);
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object obj, Method method, Object[] args,
                    MethodProxy proxy) throws Throwable {
                System.out.println("【前置】方法调用: " + method.getName());

                // 调用父类（目标类）的方法
                Object result = proxy.invokeSuper(obj, args);

                System.out.println("【后置】执行完成");
                return result;
            }
        });

        OrderService proxy = (OrderService) enhancer.create();
        proxy.createOrder("ORD-001");
    }
}
```

### Spring AOP 代理选择策略

```java
/**
 * Spring AOP 代理选择逻辑：
 * 1. 如果目标对象实现了接口 → 默认使用 JDK 动态代理
 * 2. 如果目标对象没有实现接口 → 使用 CGLIB 代理
 * 3. 可以强制使用 CGLIB：proxyTargetClass = true
 */
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true) // 强制使用 CGLIB
public class AopConfig {
}

// 或在 application.properties 中配置
// spring.aop.proxy-target-class=true
```

### 织入过程详解

```
Spring AOP 织入时机：运行时（Bean 创建时）

┌─────────────────────────────────────────────────────────────┐
│                   Spring 容器启动过程                        │
├─────────────────────────────────────────────────────────────┤
│  1. 扫描 Bean 定义                                          │
│     ↓                                                       │
│  2. 创建 Bean 实例                                          │
│     ↓                                                       │
│  3. 属性注入                                                │
│     ↓                                                       │
│  4. 初始化                                                  │
│     ↓                                                       │
│  5. ★ BeanPostProcessor 后置处理 ★                         │
│     │                                                       │
│     ├─→ AnnotationAwareAspectJAutoProxyCreator             │
│     │   (检查是否需要创建代理)                              │
│     │                                                       │
│     ├─→ 匹配切点表达式                                     │
│     │                                                       │
│     └─→ 创建代理对象替换原始 Bean                          │
│     ↓                                                       │
│  6. 返回代理对象（或原始对象）                              │
└─────────────────────────────────────────────────────────────┘
```

## 核心要点

### 五种通知类型

```java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    /**
     * 1. @Before - 前置通知
     * 在目标方法执行之前执行
     */
    @Before("execution(* com.example.service.*.*(..))")
    public void beforeAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        log.info("【Before】准备执行方法: {}, 参数: {}", methodName, Arrays.toString(args));
    }

    /**
     * 2. @After - 后置通知（finally）
     * 无论方法是否成功执行，都会执行
     */
    @After("execution(* com.example.service.*.*(..))")
    public void afterAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        log.info("【After】方法执行完成: {}", methodName);
    }

    /**
     * 3. @AfterReturning - 返回通知
     * 在目标方法成功返回后执行，可以获取返回值
     */
    @AfterReturning(
        pointcut = "execution(* com.example.service.*.*(..))",
        returning = "result"
    )
    public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        log.info("【AfterReturning】方法 {} 返回: {}", methodName, result);
    }

    /**
     * 4. @AfterThrowing - 异常通知
     * 在目标方法抛出异常后执行
     */
    @AfterThrowing(
        pointcut = "execution(* com.example.service.*.*(..))",
        throwing = "ex"
    )
    public void afterThrowingAdvice(JoinPoint joinPoint, Exception ex) {
        String methodName = joinPoint.getSignature().getName();
        log.error("【AfterThrowing】方法 {} 抛出异常: {}", methodName, ex.getMessage());
    }

    /**
     * 5. @Around - 环绕通知（最强大）
     * 可以完全控制方法执行，包括是否执行、修改参数、修改返回值
     */
    @Around("execution(* com.example.service.*.*(..))")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        long startTime = System.currentTimeMillis();

        log.info("【Around-Before】开始执行: {}", methodName);

        try {
            // 执行目标方法（必须调用，否则目标方法不会执行）
            Object result = pjp.proceed();

            log.info("【Around-After】执行成功: {}", methodName);
            return result;

        } catch (Throwable t) {
            log.error("【Around-Exception】执行失败: {}", t.getMessage());
            throw t;

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            log.info("【Around-Finally】耗时: {}ms", duration);
        }
    }
}
```

### 通知执行顺序

```
正常执行时：
┌─────────────────────────────────────────────────────────────┐
│  @Around (前半部分)                                         │
│    ↓                                                        │
│  @Before                                                    │
│    ↓                                                        │
│  ★ 目标方法执行 ★                                          │
│    ↓                                                        │
│  @AfterReturning                                            │
│    ↓                                                        │
│  @After                                                     │
│    ↓                                                        │
│  @Around (后半部分)                                         │
└─────────────────────────────────────────────────────────────┘

异常执行时：
┌─────────────────────────────────────────────────────────────┐
│  @Around (前半部分)                                         │
│    ↓                                                        │
│  @Before                                                    │
│    ↓                                                        │
│  ★ 目标方法抛出异常 ★                                      │
│    ↓                                                        │
│  @AfterThrowing                                             │
│    ↓                                                        │
│  @After                                                     │
│    ↓                                                        │
│  @Around (catch 块)                                         │
└─────────────────────────────────────────────────────────────┘
```

### 切点表达式详解

```java
@Aspect
@Component
public class PointcutExamples {

    // ================== execution 表达式 ==================

    // 匹配 UserService 的所有方法
    @Pointcut("execution(* com.example.service.UserService.*(..))")
    public void userServiceMethods() {}

    // 匹配 service 包下所有类的所有方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayerMethods() {}

    // 匹配 service 包及其子包下所有类的所有方法
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void serviceAndSubPackageMethods() {}

    // 匹配所有 public 方法
    @Pointcut("execution(public * *(..))")
    public void publicMethods() {}

    // 匹配返回 void 的方法
    @Pointcut("execution(void *(..))")
    public void voidMethods() {}

    // 匹配方法名以 find 开头的方法
    @Pointcut("execution(* find*(..))")
    public void findMethods() {}

    // 匹配接收 String 参数的方法
    @Pointcut("execution(* *(String))")
    public void methodsWithStringArg() {}

    // 匹配接收两个参数，第一个是 String 的方法
    @Pointcut("execution(* *(String, ..))")
    public void methodsStartingWithStringArg() {}

    // ================== within 表达式 ==================

    // 匹配 UserService 类内的所有方法
    @Pointcut("within(com.example.service.UserService)")
    public void withinUserService() {}

    // 匹配 service 包下所有类的方法
    @Pointcut("within(com.example.service.*)")
    public void withinServicePackage() {}

    // 匹配 service 包及子包下所有类的方法
    @Pointcut("within(com.example.service..*)")
    public void withinServiceAndSubPackages() {}

    // ================== @annotation 表达式 ==================

    // 匹配带有 @Transactional 注解的方法
    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void transactionalMethods() {}

    // 匹配带有自定义 @Loggable 注解的方法
    @Pointcut("@annotation(com.example.annotation.Loggable)")
    public void loggableMethods() {}

    // ================== @within 表达式 ==================

    // 匹配带有 @Service 注解的类中的所有方法
    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void serviceAnnotatedClasses() {}

    // ================== bean 表达式 ==================

    // 匹配名为 userService 的 Bean 的所有方法
    @Pointcut("bean(userService)")
    public void userServiceBean() {}

    // 匹配名称以 Service 结尾的所有 Bean
    @Pointcut("bean(*Service)")
    public void allServiceBeans() {}

    // ================== args 表达式 ==================

    // 匹配接收 Long 类型参数的方法
    @Pointcut("args(Long)")
    public void methodsWithLongArg() {}

    // 匹配接收任意数量 String 参数的方法
    @Pointcut("args(String, ..)")
    public void methodsWithStringArgs() {}

    // ================== this 和 target 表达式 ==================

    // 匹配代理对象是 UserService 类型的方法
    @Pointcut("this(com.example.service.UserService)")
    public void proxyIsUserService() {}

    // 匹配目标对象是 UserService 类型的方法
    @Pointcut("target(com.example.service.UserService)")
    public void targetIsUserService() {}

    // ================== 组合表达式 ==================

    // AND 组合
    @Pointcut("execution(* com.example.service.*.*(..)) && @annotation(Loggable)")
    public void loggableServiceMethods() {}

    // OR 组合
    @Pointcut("execution(* com.example.service.*.*(..)) || execution(* com.example.controller.*.*(..))")
    public void serviceOrControllerMethods() {}

    // NOT 组合
    @Pointcut("execution(* com.example.service.*.*(..)) && !execution(* *.internal*(..))")
    public void publicServiceMethods() {}
}
```

### 切点表达式语法详解

```
execution 表达式语法：
execution(modifiers-pattern? ret-type-pattern declaring-type-pattern?
          name-pattern(param-pattern) throws-pattern?)

┌──────────────────────────────────────────────────────────────────┐
│  execution(public String com.example.service.UserService.       │
│            findByName(String) throws NotFoundException)          │
│  ────────── ────── ─────────────────────────── ────────────────  │
│      │        │              │                      │            │
│  修饰符    返回类型       类型模式.方法名(参数)   异常模式       │
│  (可选)    (必需)         (可选).(必需)(必需)     (可选)         │
└──────────────────────────────────────────────────────────────────┘

通配符说明：
- *        匹配任意字符（不含包分隔符）
- ..       匹配任意数量的参数，或任意数量的包
- +        匹配指定类型的子类型

示例：
execution(* *(..))                    - 匹配所有方法
execution(* set*(..))                 - 匹配所有 set 开头的方法
execution(* com.example..*.*(..))     - 匹配 com.example 包及子包下所有方法
execution(* com.example..*Service.*(..)) - 匹配所有 Service 结尾的类的方法
```

### JoinPoint 详解

```java
@Aspect
@Component
public class JoinPointDemo {

    @Before("execution(* com.example.service.*.*(..))")
    public void demonstrateJoinPoint(JoinPoint joinPoint) {

        // 获取方法签名
        Signature signature = joinPoint.getSignature();
        String methodName = signature.getName();
        String declaringTypeName = signature.getDeclaringTypeName();

        // 获取方法签名的详细信息（需要转换）
        if (signature instanceof MethodSignature) {
            MethodSignature methodSignature = (MethodSignature) signature;
            Method method = methodSignature.getMethod();
            Class<?> returnType = methodSignature.getReturnType();
            String[] parameterNames = methodSignature.getParameterNames();
            Class<?>[] parameterTypes = methodSignature.getParameterTypes();
        }

        // 获取目标对象
        Object target = joinPoint.getTarget();

        // 获取代理对象
        Object proxy = joinPoint.getThis();

        // 获取方法参数
        Object[] args = joinPoint.getArgs();

        // 获取连接点类型（如 "method-execution"）
        String kind = joinPoint.getKind();

        // 获取源代码位置
        SourceLocation sourceLocation = joinPoint.getSourceLocation();
    }

    @Around("execution(* com.example.service.*.*(..))")
    public Object demonstrateProceedingJoinPoint(ProceedingJoinPoint pjp)
            throws Throwable {

        // ProceedingJoinPoint 是 JoinPoint 的子接口，仅用于 @Around

        // 正常执行目标方法
        Object result = pjp.proceed();

        // 使用新参数执行目标方法
        Object[] newArgs = modifyArgs(pjp.getArgs());
        Object resultWithNewArgs = pjp.proceed(newArgs);

        return result;
    }

    private Object[] modifyArgs(Object[] args) {
        // 修改参数的逻辑
        return args;
    }
}
```

## 代码示例

### 示例1：日志切面

```java
/**
 * 通用日志切面
 * 自动记录方法的入参、出参、执行时间和异常信息
 */
@Aspect
@Component
@Order(1) // 切面优先级，数字越小优先级越高
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void serviceMethods() {}

    @Pointcut("@within(org.springframework.web.bind.annotation.RestController)")
    public void controllerMethods() {}

    @Around("serviceMethods() || controllerMethods()")
    public Object logMethodExecution(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String className = signature.getDeclaringType().getSimpleName();
        String methodName = signature.getName();
        String fullMethod = className + "." + methodName;

        // 入参日志
        if (log.isDebugEnabled()) {
            log.debug(">>> {} 入参: {}", fullMethod, formatArgs(pjp.getArgs()));
        }

        long startTime = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();

            long duration = System.currentTimeMillis() - startTime;

            // 出参和耗时日志
            if (log.isDebugEnabled()) {
                log.debug("<<< {} 出参: {}, 耗时: {}ms",
                    fullMethod, formatResult(result), duration);
            }

            // 慢方法告警
            if (duration > 1000) {
                log.warn("慢方法告警: {} 执行耗时 {}ms", fullMethod, duration);
            }

            return result;

        } catch (Throwable t) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("!!! {} 执行异常, 耗时: {}ms, 异常: {}",
                fullMethod, duration, t.getMessage(), t);
            throw t;
        }
    }

    private String formatArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        return Arrays.stream(args)
            .map(this::safeToString)
            .collect(Collectors.joining(", ", "[", "]"));
    }

    private String formatResult(Object result) {
        return safeToString(result);
    }

    private String safeToString(Object obj) {
        if (obj == null) {
            return "null";
        }
        try {
            String str = obj.toString();
            // 限制长度，避免日志过长
            return str.length() > 500 ? str.substring(0, 500) + "..." : str;
        } catch (Exception e) {
            return obj.getClass().getSimpleName() + "@" +
                   Integer.toHexString(obj.hashCode());
        }
    }
}
```

### 示例2：自定义注解 + 切面

```java
/**
 * 自定义方法级别的日志注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Loggable {

    /**
     * 日志描述
     */
    String value() default "";

    /**
     * 是否记录入参
     */
    boolean logArgs() default true;

    /**
     * 是否记录出参
     */
    boolean logResult() default true;

    /**
     * 慢方法阈值（毫秒），超过则告警
     */
    long slowThreshold() default 1000;
}

/**
 * 处理 @Loggable 注解的切面
 */
@Aspect
@Component
public class LoggableAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggableAspect.class);

    @Around("@annotation(loggable)")
    public Object handleLoggable(ProceedingJoinPoint pjp, Loggable loggable)
            throws Throwable {

        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String methodName = signature.getDeclaringType().getSimpleName() +
                           "." + signature.getName();
        String description = loggable.value().isEmpty() ?
                            methodName : loggable.value();

        // 入参日志
        if (loggable.logArgs()) {
            log.info("[{}] 开始执行, 参数: {}", description,
                    Arrays.toString(pjp.getArgs()));
        } else {
            log.info("[{}] 开始执行", description);
        }

        long startTime = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();

            long duration = System.currentTimeMillis() - startTime;

            // 出参日志
            if (loggable.logResult()) {
                log.info("[{}] 执行成功, 结果: {}, 耗时: {}ms",
                        description, result, duration);
            } else {
                log.info("[{}] 执行成功, 耗时: {}ms", description, duration);
            }

            // 慢方法告警
            if (duration > loggable.slowThreshold()) {
                log.warn("[{}] 方法执行过慢! 耗时: {}ms, 阈值: {}ms",
                        description, duration, loggable.slowThreshold());
            }

            return result;

        } catch (Throwable t) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[{}] 执行失败, 耗时: {}ms, 异常: {}",
                     description, duration, t.getMessage(), t);
            throw t;
        }
    }
}

// 使用示例
@Service
public class UserService {

    @Loggable("用户注册")
    public User register(String username, String email) {
        // 业务逻辑
        return new User(username, email);
    }

    @Loggable(value = "用户查询", logResult = false, slowThreshold = 500)
    public List<User> findAllUsers() {
        // 业务逻辑
        return userRepository.findAll();
    }
}
```

### 示例3：权限校验切面

```java
/**
 * 权限校验注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {

    /**
     * 需要的权限列表
     */
    String[] value();

    /**
     * 权限校验逻辑：AND（需要所有权限）或 OR（需要任一权限）
     */
    Logic logic() default Logic.AND;

    enum Logic {
        AND, OR
    }
}

/**
 * 角色校验注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String[] value();
}

/**
 * 安全校验切面
 */
@Aspect
@Component
@Order(0) // 最高优先级，先于其他切面执行
public class SecurityAspect {

    private static final Logger log = LoggerFactory.getLogger(SecurityAspect.class);

    @Autowired
    private SecurityContext securityContext; // 假设的安全上下文

    @Before("@annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        User currentUser = securityContext.getCurrentUser();

        if (currentUser == null) {
            throw new UnauthorizedException("用户未登录");
        }

        String[] requiredPermissions = requirePermission.value();
        Set<String> userPermissions = currentUser.getPermissions();

        boolean hasPermission;
        if (requirePermission.logic() == RequirePermission.Logic.AND) {
            hasPermission = userPermissions.containsAll(Arrays.asList(requiredPermissions));
        } else {
            hasPermission = Arrays.stream(requiredPermissions)
                    .anyMatch(userPermissions::contains);
        }

        if (!hasPermission) {
            log.warn("权限校验失败: 用户 {} 缺少权限 {}",
                    currentUser.getUsername(), Arrays.toString(requiredPermissions));
            throw new ForbiddenException("权限不足");
        }

        log.debug("权限校验通过: 用户 {} 访问 {}",
                 currentUser.getUsername(), joinPoint.getSignature().getName());
    }

    @Before("@annotation(requireRole)")
    public void checkRole(JoinPoint joinPoint, RequireRole requireRole) {
        User currentUser = securityContext.getCurrentUser();

        if (currentUser == null) {
            throw new UnauthorizedException("用户未登录");
        }

        String[] requiredRoles = requireRole.value();
        Set<String> userRoles = currentUser.getRoles();

        boolean hasRole = Arrays.stream(requiredRoles)
                .anyMatch(userRoles::contains);

        if (!hasRole) {
            log.warn("角色校验失败: 用户 {} 缺少角色 {}",
                    currentUser.getUsername(), Arrays.toString(requiredRoles));
            throw new ForbiddenException("角色权限不足");
        }
    }
}

// 使用示例
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @RequireRole({"ADMIN", "SUPER_ADMIN"})
    @RequirePermission(value = {"user:read", "user:write"}, logic = RequirePermission.Logic.AND)
    @PostMapping("/users")
    public User createUser(@RequestBody CreateUserRequest request) {
        // 业务逻辑
        return userService.create(request);
    }
}
```

### 示例4：重试机制切面

```java
/**
 * 重试注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Retryable {

    /**
     * 最大重试次数
     */
    int maxAttempts() default 3;

    /**
     * 重试延迟（毫秒）
     */
    long delay() default 1000;

    /**
     * 延迟倍数（用于指数退避）
     */
    double multiplier() default 1.5;

    /**
     * 需要重试的异常类型
     */
    Class<? extends Throwable>[] retryOn() default {Exception.class};

    /**
     * 不需要重试的异常类型
     */
    Class<? extends Throwable>[] noRetryOn() default {};
}

/**
 * 重试切面
 */
@Aspect
@Component
public class RetryAspect {

    private static final Logger log = LoggerFactory.getLogger(RetryAspect.class);

    @Around("@annotation(retryable)")
    public Object retry(ProceedingJoinPoint pjp, Retryable retryable) throws Throwable {
        int maxAttempts = retryable.maxAttempts();
        long delay = retryable.delay();
        double multiplier = retryable.multiplier();

        String methodName = pjp.getSignature().toShortString();
        Throwable lastException = null;

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                if (attempt > 1) {
                    log.info("第 {} 次重试: {}", attempt, methodName);
                }
                return pjp.proceed();

            } catch (Throwable t) {
                lastException = t;

                // 检查是否应该重试
                if (!shouldRetry(t, retryable)) {
                    log.warn("异常不可重试: {} - {}", methodName, t.getMessage());
                    throw t;
                }

                if (attempt < maxAttempts) {
                    log.warn("执行失败，准备重试: {} - {}", methodName, t.getMessage());

                    // 计算下次延迟时间（指数退避）
                    long currentDelay = (long) (delay * Math.pow(multiplier, attempt - 1));
                    Thread.sleep(currentDelay);
                }
            }
        }

        log.error("重试次数已耗尽: {} 共尝试 {} 次", methodName, maxAttempts);
        throw lastException;
    }

    private boolean shouldRetry(Throwable t, Retryable retryable) {
        // 检查是否在不重试列表中
        for (Class<? extends Throwable> noRetry : retryable.noRetryOn()) {
            if (noRetry.isInstance(t)) {
                return false;
            }
        }

        // 检查是否在重试列表中
        for (Class<? extends Throwable> retry : retryable.retryOn()) {
            if (retry.isInstance(t)) {
                return true;
            }
        }

        return false;
    }
}

// 使用示例
@Service
public class ExternalApiService {

    @Retryable(
        maxAttempts = 3,
        delay = 1000,
        multiplier = 2.0,
        retryOn = {IOException.class, TimeoutException.class},
        noRetryOn = {IllegalArgumentException.class}
    )
    public String callExternalApi(String url) throws IOException {
        // 调用外部 API
        return restTemplate.getForObject(url, String.class);
    }
}
```

### 示例5：缓存切面

```java
/**
 * 缓存注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cacheable {

    /**
     * 缓存名称
     */
    String value();

    /**
     * 缓存 key，支持 SpEL 表达式
     */
    String key() default "";

    /**
     * 过期时间（秒）
     */
    int ttl() default 3600;

    /**
     * 是否缓存 null 值
     */
    boolean cacheNull() default false;
}

/**
 * 缓存失效注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CacheEvict {
    String value();
    String key() default "";
    boolean allEntries() default false;
}

/**
 * 缓存切面
 */
@Aspect
@Component
public class CacheAspect {

    private static final Logger log = LoggerFactory.getLogger(CacheAspect.class);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private SpelExpressionParser parser;

    @Around("@annotation(cacheable)")
    public Object handleCacheable(ProceedingJoinPoint pjp, Cacheable cacheable)
            throws Throwable {

        String cacheKey = buildCacheKey(cacheable.value(), cacheable.key(), pjp);

        // 尝试从缓存获取
        Object cachedValue = redisTemplate.opsForValue().get(cacheKey);

        if (cachedValue != null) {
            log.debug("缓存命中: {}", cacheKey);
            return cachedValue;
        }

        // 缓存未命中，执行方法
        log.debug("缓存未命中: {}", cacheKey);
        Object result = pjp.proceed();

        // 存入缓存
        if (result != null || cacheable.cacheNull()) {
            redisTemplate.opsForValue().set(
                cacheKey,
                result,
                cacheable.ttl(),
                TimeUnit.SECONDS
            );
            log.debug("写入缓存: {}, TTL: {}s", cacheKey, cacheable.ttl());
        }

        return result;
    }

    @Around("@annotation(cacheEvict)")
    public Object handleCacheEvict(ProceedingJoinPoint pjp, CacheEvict cacheEvict)
            throws Throwable {

        Object result = pjp.proceed();

        if (cacheEvict.allEntries()) {
            // 清除所有缓存
            Set<String> keys = redisTemplate.keys(cacheEvict.value() + ":*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("清除缓存: {} 共 {} 个", cacheEvict.value(), keys.size());
            }
        } else {
            // 清除指定缓存
            String cacheKey = buildCacheKey(cacheEvict.value(), cacheEvict.key(), pjp);
            redisTemplate.delete(cacheKey);
            log.debug("清除缓存: {}", cacheKey);
        }

        return result;
    }

    private String buildCacheKey(String cacheName, String keyExpression,
            ProceedingJoinPoint pjp) {

        if (keyExpression.isEmpty()) {
            // 默认使用方法名 + 参数哈希
            return cacheName + ":" + pjp.getSignature().getName() + ":" +
                   Arrays.hashCode(pjp.getArgs());
        }

        // 解析 SpEL 表达式
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = pjp.getArgs();

        StandardEvaluationContext context = new StandardEvaluationContext();
        for (int i = 0; i < paramNames.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }

        Expression expression = parser.parseExpression(keyExpression);
        String key = expression.getValue(context, String.class);

        return cacheName + ":" + key;
    }
}

// 使用示例
@Service
public class ProductService {

    @Cacheable(value = "product", key = "#id", ttl = 1800)
    public Product findById(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "products", key = "#category + ':' + #page", ttl = 600)
    public List<Product> findByCategory(String category, int page) {
        return productRepository.findByCategory(category, PageRequest.of(page, 20));
    }

    @CacheEvict(value = "product", key = "#product.id")
    public Product update(Product product) {
        return productRepository.save(product);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void refreshAllProducts() {
        // 刷新操作
    }
}
```

### 示例6：分布式锁切面

```java
/**
 * 分布式锁注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {

    /**
     * 锁的 key，支持 SpEL
     */
    String key();

    /**
     * 锁前缀
     */
    String prefix() default "lock:";

    /**
     * 等待获取锁的超时时间（秒）
     */
    int waitTime() default 5;

    /**
     * 锁的持有时间（秒）
     */
    int leaseTime() default 30;

    /**
     * 获取锁失败时的处理策略
     */
    FailStrategy onFail() default FailStrategy.EXCEPTION;

    enum FailStrategy {
        EXCEPTION,  // 抛出异常
        RETURN_NULL // 返回 null
    }
}

/**
 * 分布式锁切面
 */
@Aspect
@Component
public class DistributedLockAspect {

    private static final Logger log = LoggerFactory.getLogger(DistributedLockAspect.class);

    @Autowired
    private RedissonClient redissonClient;

    @Autowired
    private SpelExpressionParser parser;

    @Around("@annotation(lock)")
    public Object handleLock(ProceedingJoinPoint pjp, DistributedLock lock)
            throws Throwable {

        String lockKey = buildLockKey(lock.prefix(), lock.key(), pjp);
        RLock rLock = redissonClient.getLock(lockKey);

        boolean acquired = false;

        try {
            // 尝试获取锁
            acquired = rLock.tryLock(lock.waitTime(), lock.leaseTime(), TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("获取分布式锁失败: {}", lockKey);

                if (lock.onFail() == DistributedLock.FailStrategy.EXCEPTION) {
                    throw new LockAcquisitionException("无法获取锁: " + lockKey);
                } else {
                    return null;
                }
            }

            log.debug("获取分布式锁成功: {}", lockKey);
            return pjp.proceed();

        } finally {
            if (acquired && rLock.isHeldByCurrentThread()) {
                rLock.unlock();
                log.debug("释放分布式锁: {}", lockKey);
            }
        }
    }

    private String buildLockKey(String prefix, String keyExpression,
            ProceedingJoinPoint pjp) {
        MethodSignature signature = (MethodSignature) pjp.getSignature();
        String[] paramNames = signature.getParameterNames();
        Object[] args = pjp.getArgs();

        StandardEvaluationContext context = new StandardEvaluationContext();
        for (int i = 0; i < paramNames.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }

        Expression expression = parser.parseExpression(keyExpression);
        String key = expression.getValue(context, String.class);

        return prefix + key;
    }
}

// 使用示例
@Service
public class OrderService {

    @DistributedLock(key = "'order:' + #userId", waitTime = 10, leaseTime = 60)
    public Order createOrder(Long userId, CreateOrderRequest request) {
        // 防止同一用户重复下单
        return doCreateOrder(userId, request);
    }

    @DistributedLock(
        key = "'inventory:' + #productId",
        onFail = DistributedLock.FailStrategy.EXCEPTION
    )
    public void deductInventory(Long productId, int quantity) {
        // 扣减库存，需要加锁防止超卖
        inventoryRepository.deduct(productId, quantity);
    }
}
```

## 最佳实践

### 切面设计原则

```java
/**
 * 最佳实践：单一职责
 * 每个切面只处理一种横切关注点
 */

// 好的设计：每个切面职责单一
@Aspect
@Component
public class LoggingAspect { /* 只负责日志 */ }

@Aspect
@Component
public class SecurityAspect { /* 只负责安全 */ }

@Aspect
@Component
public class PerformanceAspect { /* 只负责性能监控 */ }

// 不好的设计：切面职责过多
@Aspect
@Component
public class GodAspect {
    // 日志 + 安全 + 性能 + 缓存 + ... 混在一起
}
```

### 切面优先级管理

```java
/**
 * 使用 @Order 控制切面执行顺序
 * 数字越小，优先级越高
 */
@Aspect
@Component
@Order(0) // 最先执行
public class SecurityAspect {
    // 安全检查应该最先执行
}

@Aspect
@Component
@Order(1)
public class LoggingAspect {
    // 日志记录
}

@Aspect
@Component
@Order(2)
public class PerformanceAspect {
    // 性能监控
}

/*
 * 执行顺序（进入时）：Security → Logging → Performance → 目标方法
 * 执行顺序（返回时）：目标方法 → Performance → Logging → Security
 */
```

### 精确的切点表达式

```java
/**
 * 最佳实践：切点表达式要精确
 */

// 不推荐：过于宽泛，可能影响不需要的类
@Pointcut("execution(* *(..))")
public void tooGeneral() {}

// 推荐：精确匹配需要的包和类
@Pointcut("execution(* com.example.service..*Service.*(..))")
public void serviceLayerOperations() {}

// 推荐：组合使用，提高可读性
@Pointcut("within(com.example.service..*)")
public void inServiceLayer() {}

@Pointcut("execution(public * *(..))")
public void publicMethod() {}

@Pointcut("inServiceLayer() && publicMethod()")
public void publicServiceMethods() {}
```

### 避免切面间的循环依赖

```java
/**
 * 注意：切面中注入的 Bean 可能也被代理
 * 这可能导致循环依赖或意外行为
 */

// 可能有问题
@Aspect
@Component
public class ProblematicAspect {

    @Autowired
    private UserService userService; // UserService 也被 AOP 代理

    @Before("execution(* com.example.service.*.*(..))")
    public void advice(JoinPoint jp) {
        // 调用 userService 可能触发递归代理
        userService.getCurrentUser();
    }
}

// 更好的方式：延迟获取或使用 Provider
@Aspect
@Component
public class BetterAspect {

    @Autowired
    private ApplicationContext context;

    @Before("execution(* com.example.service.*.*(..)) && !target(com.example.service.UserService)")
    public void advice(JoinPoint jp) {
        // 排除 UserService，避免递归
        UserService userService = context.getBean(UserService.class);
        userService.getCurrentUser();
    }
}
```

### 环绕通知的正确使用

```java
/**
 * @Around 使用注意事项
 */
@Aspect
@Component
public class AroundAdviceGuide {

    // 错误：忘记调用 proceed()
    @Around("execution(* com.example.service.*.*(..))")
    public Object wrongAdvice(ProceedingJoinPoint pjp) throws Throwable {
        log.info("Before");
        // 没有调用 proceed()，目标方法不会执行！
        log.info("After");
        return null;
    }

    // 错误：忘记返回结果
    @Around("execution(* com.example.service.*.*(..))")
    public Object anotherWrongAdvice(ProceedingJoinPoint pjp) throws Throwable {
        Object result = pjp.proceed();
        log.info("Result: {}", result);
        // 没有返回 result，调用者得到 null！
    }

    // 正确的写法
    @Around("execution(* com.example.service.*.*(..))")
    public Object correctAdvice(ProceedingJoinPoint pjp) throws Throwable {
        log.info("Before");
        try {
            Object result = pjp.proceed();
            log.info("After returning: {}", result);
            return result; // 必须返回
        } catch (Throwable t) {
            log.error("After throwing: {}", t.getMessage());
            throw t; // 必须重新抛出或处理
        }
    }
}
```

### 合理使用通知类型

```java
/**
 * 选择合适的通知类型
 */

// 只需要在方法执行前做点事情 → @Before
@Before("...")
public void logMethodEntry(JoinPoint jp) {
    log.info("Entering: {}", jp.getSignature().getName());
}

// 只需要在方法成功后获取返回值 → @AfterReturning
@AfterReturning(pointcut = "...", returning = "result")
public void logMethodReturn(JoinPoint jp, Object result) {
    log.info("Returned: {}", result);
}

// 只需要在方法异常时处理 → @AfterThrowing
@AfterThrowing(pointcut = "...", throwing = "ex")
public void logMethodException(JoinPoint jp, Exception ex) {
    log.error("Exception: {}", ex.getMessage());
}

// 需要控制方法执行（如：修改参数、修改返回值、决定是否执行）→ @Around
@Around("...")
public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
    // 可以完全控制方法执行
    return pjp.proceed();
}
```

## 常见陷阱

### 自调用问题

```java
/**
 * 陷阱：同一类中的方法自调用不会触发 AOP
 * 因为自调用使用的是 this 引用，而不是代理对象
 */
@Service
public class UserService {

    @Transactional
    public void createUser(User user) {
        // 保存用户
        userRepository.save(user);

        // 自调用 - @Async 不会生效！
        this.sendWelcomeEmail(user);
    }

    @Async
    public void sendWelcomeEmail(User user) {
        // 这个方法不会异步执行，因为是通过 this 调用的
        emailService.send(user.getEmail(), "Welcome!");
    }
}

/**
 * 解决方案1：注入自身的代理
 */
@Service
public class UserService {

    @Autowired
    private UserService self; // 注入自身的代理

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
        self.sendWelcomeEmail(user); // 通过代理调用
    }

    @Async
    public void sendWelcomeEmail(User user) {
        emailService.send(user.getEmail(), "Welcome!");
    }
}

/**
 * 解决方案2：使用 AopContext（需要开启 exposeProxy）
 */
@Configuration
@EnableAspectJAutoProxy(exposeProxy = true)
public class AopConfig {
}

@Service
public class UserService {

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);

        // 获取当前代理对象
        UserService proxy = (UserService) AopContext.currentProxy();
        proxy.sendWelcomeEmail(user);
    }
}

/**
 * 解决方案3：拆分到不同的类
 */
@Service
public class UserService {

    @Autowired
    private EmailService emailService;

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
        emailService.sendWelcomeEmail(user); // 调用其他 Bean
    }
}

@Service
public class EmailService {

    @Async
    public void sendWelcomeEmail(User user) {
        // 现在异步会生效
    }
}
```

### private/final 方法不被代理

```java
/**
 * 陷阱：private 和 final 方法无法被代理
 */
@Service
public class ProductService {

    // private 方法不会被代理
    @Transactional
    private void privateMethod() {
        // @Transactional 不会生效
    }

    // final 方法不会被 CGLIB 代理
    @Cacheable("products")
    public final List<Product> finalMethod() {
        // @Cacheable 不会生效
        return productRepository.findAll();
    }

    // 正确：使用 public 非 final 方法
    @Transactional
    public void correctMethod() {
        // 正常工作
    }
}
```

### 切点表达式匹配不准确

```java
/**
 * 陷阱：切点表达式需要精确匹配
 */
@Aspect
@Component
public class PointcutPitfalls {

    // 陷阱1：忘记 .. 导致只匹配直接子包
    // 只匹配 com.example.service 包，不匹配 com.example.service.impl
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void onlyDirectPackage() {}

    // 正确：使用 .. 匹配所有子包
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void includeSubPackages() {}

    // 陷阱2：参数匹配过于宽泛
    // 匹配所有方法
    @Pointcut("execution(* *(..))")
    public void allMethods() {}

    // 陷阱3：忘记返回值类型
    // 这是语法错误
    // @Pointcut("execution(com.example.service.*.*(..))")

    // 正确：必须指定返回值类型
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void correct() {}
}
```

### 异常处理不当

```java
/**
 * 陷阱：在切面中吞掉异常
 */
@Aspect
@Component
public class ExceptionHandlingPitfall {

    // 错误：吞掉了异常，调用者不知道发生了错误
    @Around("execution(* com.example.service.*.*(..))")
    public Object wrongExceptionHandling(ProceedingJoinPoint pjp) {
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            log.error("Error", t);
            return null; // 吞掉异常，返回 null
        }
    }

    // 正确：记录后重新抛出
    @Around("execution(* com.example.service.*.*(..))")
    public Object correctExceptionHandling(ProceedingJoinPoint pjp)
            throws Throwable {
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            log.error("Error in {}: {}",
                pjp.getSignature().getName(), t.getMessage());
            throw t; // 重新抛出
        }
    }
}
```

### 循环依赖

```java
/**
 * 陷阱：切面与 Bean 之间的循环依赖
 */
@Aspect
@Component
public class CircularDependencyPitfall {

    // 可能导致循环依赖
    @Autowired
    private UserService userService; // 而 UserService 又被这个切面代理

    @Before("execution(* com.example.service.UserService.*(..))")
    public void beforeUserService(JoinPoint jp) {
        // 使用 userService 可能导致问题
    }
}

/**
 * 解决方案：使用 @Lazy 延迟加载
 */
@Aspect
@Component
public class FixedCircularDependency {

    @Autowired
    @Lazy
    private UserService userService;

    // 或者使用 ObjectProvider
    @Autowired
    private ObjectProvider<UserService> userServiceProvider;

    @Before("execution(* com.example.service.OrderService.*(..))")
    public void beforeOrderService(JoinPoint jp) {
        UserService service = userServiceProvider.getIfAvailable();
        if (service != null) {
            // 安全使用
        }
    }
}
```

## 性能考量

### AOP 性能开销

```java
/**
 * AOP 的性能开销来源：
 * 1. 代理对象创建（启动时，一次性）
 * 2. 方法调用的拦截和分发
 * 3. 参数包装和解包
 * 4. 切点表达式匹配
 */

// 性能测试示例
@SpringBootTest
public class AopPerformanceTest {

    @Autowired
    private UserService userService; // 被代理的服务

    @Autowired
    private UserService rawService; // 原始服务（未代理）

    @Test
    public void comparePerformance() {
        int iterations = 100000;

        // 预热
        for (int i = 0; i < 1000; i++) {
            userService.simpleMethod();
        }

        // 测试代理方法
        long start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            userService.simpleMethod();
        }
        long proxyTime = System.nanoTime() - start;

        System.out.printf("代理方法: %.2f ns/call%n",
            (double) proxyTime / iterations);

        // 结论：简单方法的代理开销约 100-500ns
        // 对于业务逻辑较重的方法，这个开销可以忽略不计
    }
}
```

### 切点表达式优化

```java
/**
 * 切点表达式的性能优化
 */
@Aspect
@Component
public class OptimizedPointcuts {

    // 慢：每次都要进行复杂的模式匹配
    @Pointcut("execution(* com.example..*.*(..)) && " +
              "@annotation(org.springframework.transaction.annotation.Transactional)")
    public void slowPointcut() {}

    // 快：使用更具体的包路径
    @Pointcut("execution(* com.example.service.impl.*ServiceImpl.*(..))")
    public void fasterPointcut() {}

    // 更快：使用 within 限制范围
    @Pointcut("within(com.example.service.impl.*) && " +
              "execution(public * *(..))")
    public void fastestPointcut() {}

    // 最佳实践：组合使用，先用 within 缩小范围
    @Pointcut("within(com.example.service..*)")
    private void inServiceLayer() {}

    @Pointcut("execution(public * *(..)) && inServiceLayer()")
    public void optimizedPointcut() {}
}
```

### 减少不必要的通知

```java
/**
 * 避免过度使用 AOP
 */

// 不推荐：对所有方法都应用复杂的日志切面
@Around("execution(* com.example..*.*(..))")
public Object heavyLogging(ProceedingJoinPoint pjp) throws Throwable {
    // 序列化参数、计算耗时、记录堆栈等
    // 对高频调用的方法会有显著影响
}

// 推荐：只对需要的方法应用
@Around("@annotation(com.example.annotation.DetailedLog)")
public Object selectiveLogging(ProceedingJoinPoint pjp) throws Throwable {
    // 只有标注了 @DetailedLog 的方法才会被拦截
}
```

### 编译时织入（AspectJ）

```java
/**
 * 对于性能敏感的场景，考虑使用 AspectJ 编译时织入
 * 可以消除运行时代理的开销
 */

// pom.xml 配置
/*
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>aspectj-maven-plugin</artifactId>
    <version>1.14.0</version>
    <configuration>
        <complianceLevel>17</complianceLevel>
        <source>17</source>
        <target>17</target>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>compile</goal>
            </goals>
        </execution>
    </executions>
</plugin>
*/
```

## 实战场景

### 场景1：统一异常处理

```java
/**
 * 统一异常处理切面
 * 将底层异常转换为业务友好的异常
 */
@Aspect
@Component
@Order(Integer.MIN_VALUE) // 最先执行，确保能捕获所有异常
public class ExceptionTranslationAspect {

    private static final Logger log =
        LoggerFactory.getLogger(ExceptionTranslationAspect.class);

    @Around("@within(org.springframework.stereotype.Service)")
    public Object translateException(ProceedingJoinPoint pjp) throws Throwable {
        try {
            return pjp.proceed();
        } catch (DataAccessException e) {
            log.error("数据访问异常", e);
            throw new BusinessException("数据操作失败，请稍后重试", e);
        } catch (OptimisticLockingFailureException e) {
            log.warn("乐观锁冲突", e);
            throw new BusinessException("数据已被修改，请刷新后重试", e);
        } catch (ConstraintViolationException e) {
            log.warn("数据校验失败", e);
            throw new ValidationException(extractValidationMessage(e), e);
        } catch (BusinessException e) {
            throw e; // 业务异常直接抛出
        } catch (Exception e) {
            log.error("未知异常", e);
            throw new BusinessException("系统繁忙，请稍后重试", e);
        }
    }

    private String extractValidationMessage(ConstraintViolationException e) {
        return e.getConstraintViolations().stream()
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.joining("; "));
    }
}
```

### 场景2：审计日志

```java
/**
 * 操作审计切面
 * 记录关键业务操作的审计日志
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();
    String resourceType();
}

@Aspect
@Component
public class AuditAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private SecurityContext securityContext;

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp, Auditable auditable)
            throws Throwable {

        User currentUser = securityContext.getCurrentUser();
        String action = auditable.action();
        String resourceType = auditable.resourceType();

        AuditLog auditLog = new AuditLog();
        auditLog.setUserId(currentUser != null ? currentUser.getId() : null);
        auditLog.setUsername(currentUser != null ? currentUser.getUsername() : "anonymous");
        auditLog.setAction(action);
        auditLog.setResourceType(resourceType);
        auditLog.setMethod(pjp.getSignature().toShortString());
        auditLog.setArgs(serializeArgs(pjp.getArgs()));
        auditLog.setTimestamp(LocalDateTime.now());
        auditLog.setIpAddress(getClientIp());

        try {
            Object result = pjp.proceed();

            auditLog.setStatus("SUCCESS");
            auditLog.setResourceId(extractResourceId(result));

            return result;

        } catch (Throwable t) {
            auditLog.setStatus("FAILURE");
            auditLog.setErrorMessage(t.getMessage());
            throw t;

        } finally {
            auditLogRepository.save(auditLog);
        }
    }

    private String serializeArgs(Object[] args) {
        // 序列化参数，注意脱敏
        return Arrays.stream(args)
            .map(this::sanitize)
            .collect(Collectors.joining(", "));
    }

    private String sanitize(Object arg) {
        // 脱敏处理敏感信息
        if (arg == null) return "null";
        String str = arg.toString();
        // 隐藏密码等敏感信息
        return str.replaceAll("password=\\S+", "password=***");
    }
}

// 使用
@Service
public class UserService {

    @Auditable(action = "CREATE", resourceType = "USER")
    public User createUser(CreateUserRequest request) {
        return userRepository.save(new User(request));
    }

    @Auditable(action = "DELETE", resourceType = "USER")
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}
```

### 场景3：限流切面

```java
/**
 * 接口限流注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    /**
     * 限流 key，支持 SpEL
     */
    String key() default "";

    /**
     * 每秒允许的请求数
     */
    double permitsPerSecond() default 10;

    /**
     * 获取令牌的等待时间（毫秒）
     */
    long timeout() default 0;
}

/**
 * 限流切面（基于 Guava RateLimiter）
 */
@Aspect
@Component
public class RateLimitAspect {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();

    @Around("@annotation(rateLimited)")
    public Object rateLimit(ProceedingJoinPoint pjp, RateLimited rateLimited)
            throws Throwable {

        String key = buildKey(rateLimited.key(), pjp);
        double permitsPerSecond = rateLimited.permitsPerSecond();
        long timeout = rateLimited.timeout();

        RateLimiter limiter = limiters.computeIfAbsent(key,
            k -> RateLimiter.create(permitsPerSecond));

        boolean acquired;
        if (timeout > 0) {
            acquired = limiter.tryAcquire(timeout, TimeUnit.MILLISECONDS);
        } else {
            acquired = limiter.tryAcquire();
        }

        if (!acquired) {
            throw new RateLimitExceededException(
                "请求过于频繁，请稍后重试");
        }

        return pjp.proceed();
    }

    private String buildKey(String keyExpression, ProceedingJoinPoint pjp) {
        if (keyExpression.isEmpty()) {
            return pjp.getSignature().toShortString();
        }
        // 解析 SpEL 表达式
        // ...
        return keyExpression;
    }
}

// 使用
@RestController
@RequestMapping("/api")
public class ApiController {

    @RateLimited(permitsPerSecond = 5, timeout = 1000)
    @GetMapping("/search")
    public List<Result> search(@RequestParam String keyword) {
        return searchService.search(keyword);
    }

    @RateLimited(key = "'user:' + #userId", permitsPerSecond = 1)
    @PostMapping("/users/{userId}/orders")
    public Order createOrder(@PathVariable Long userId,
                            @RequestBody OrderRequest request) {
        return orderService.create(userId, request);
    }
}
```

### 场景4：数据脱敏

```java
/**
 * 数据脱敏注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DesensitizeResult {
}

@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Sensitive {
    SensitiveType type();
}

public enum SensitiveType {
    PHONE,      // 手机号：138****1234
    ID_CARD,    // 身份证：110***********1234
    EMAIL,      // 邮箱：a***@example.com
    BANK_CARD,  // 银行卡：6222***********1234
    NAME        // 姓名：张*
}

/**
 * 数据脱敏切面
 */
@Aspect
@Component
public class DesensitizationAspect {

    @AfterReturning(
        pointcut = "@annotation(desensitizeResult)",
        returning = "result"
    )
    public void desensitize(JoinPoint jp, DesensitizeResult desensitizeResult,
            Object result) {

        if (result == null) return;

        if (result instanceof Collection) {
            ((Collection<?>) result).forEach(this::desensitizeObject);
        } else {
            desensitizeObject(result);
        }
    }

    private void desensitizeObject(Object obj) {
        if (obj == null) return;

        for (Field field : obj.getClass().getDeclaredFields()) {
            Sensitive sensitive = field.getAnnotation(Sensitive.class);
            if (sensitive == null) continue;

            try {
                field.setAccessible(true);
                Object value = field.get(obj);
                if (value instanceof String) {
                    String masked = mask((String) value, sensitive.type());
                    field.set(obj, masked);
                }
            } catch (IllegalAccessException e) {
                // 忽略
            }
        }
    }

    private String mask(String value, SensitiveType type) {
        if (value == null || value.isEmpty()) return value;

        return switch (type) {
            case PHONE -> value.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
            case ID_CARD -> value.replaceAll("(\\d{3})\\d{11}(\\d{4})", "$1***********$2");
            case EMAIL -> value.replaceAll("(.).*?(@.*)", "$1***$2");
            case BANK_CARD -> value.replaceAll("(\\d{4})\\d*(\\d{4})", "$1***********$2");
            case NAME -> value.charAt(0) + "*".repeat(value.length() - 1);
        };
    }
}

// 实体类
public class User {
    private Long id;

    @Sensitive(type = SensitiveType.NAME)
    private String name;

    @Sensitive(type = SensitiveType.PHONE)
    private String phone;

    @Sensitive(type = SensitiveType.ID_CARD)
    private String idCard;

    @Sensitive(type = SensitiveType.EMAIL)
    private String email;
}

// 使用
@RestController
public class UserController {

    @DesensitizeResult
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
        // 返回的 User 对象中的敏感字段会被自动脱敏
    }
}
```

## 面试要点

### 基础问题

**Q1: 什么是 AOP？它解决了什么问题？**

AOP（面向切面编程）是一种编程范式，用于将横切关注点（如日志、事务、安全）从业务逻辑中分离出来。它解决了代码重复和耦合的问题，提高了代码的模块化程度。

**Q2: Spring AOP 和 AspectJ 有什么区别？**

| 对比项 | Spring AOP | AspectJ |
|-------|-----------|---------|
| 织入时机 | 运行时（动态代理） | 编译时/加载时 |
| 连接点 | 仅方法执行 | 方法、字段、构造器等 |
| 代理方式 | JDK/CGLIB | 无需代理，直接修改字节码 |
| 性能 | 略有开销 | 性能更好 |
| 使用难度 | 简单 | 较复杂 |

**Q3: JDK 动态代理和 CGLIB 代理有什么区别？**

- **JDK 动态代理**：基于接口，目标类必须实现接口，使用 `java.lang.reflect.Proxy`
- **CGLIB 代理**：基于继承，目标类不能是 final，通过生成子类实现
- **Spring 的选择**：默认情况下，有接口用 JDK，无接口用 CGLIB；可以通过 `proxyTargetClass=true` 强制使用 CGLIB

### 进阶问题

**Q4: 请解释 Spring AOP 的五种通知类型及其执行顺序**

```
通知类型：
1. @Before：方法执行前
2. @After：方法执行后（finally，无论成功与否）
3. @AfterReturning：方法成功返回后
4. @AfterThrowing：方法抛出异常后
5. @Around：环绕通知，完全控制方法执行

正常执行顺序：Around前 → Before → 方法 → AfterReturning → After → Around后
异常执行顺序：Around前 → Before → 方法(异常) → AfterThrowing → After → Around(catch)
```

**Q5: 为什么同一个类中的方法自调用不会触发 AOP？**

因为 Spring AOP 基于代理实现，自调用使用的是 `this` 引用（原始对象），而不是代理对象。代理只拦截通过代理对象的调用。

解决方案：
1. 注入自身的代理（`@Autowired` 自己）
2. 使用 `AopContext.currentProxy()` 获取代理
3. 将方法拆分到不同的类中

**Q6: 如何自定义一个注解来实现 AOP 功能？**

```java
// 1. 定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {
    String value() default "";
}

// 2. 定义切面
@Aspect
@Component
public class MyAspect {

    @Around("@annotation(myAnnotation)")
    public Object handle(ProceedingJoinPoint pjp, MyAnnotation myAnnotation)
            throws Throwable {
        // 前置处理
        Object result = pjp.proceed();
        // 后置处理
        return result;
    }
}

// 3. 使用注解
@MyAnnotation("test")
public void myMethod() { }
```

### 实战问题

**Q7: 如何控制多个切面的执行顺序？**

使用 `@Order` 注解或实现 `Ordered` 接口。数字越小，优先级越高。

```java
@Aspect
@Order(1) // 先执行
public class SecurityAspect { }

@Aspect
@Order(2) // 后执行
public class LoggingAspect { }
```

**Q8: AOP 有哪些常见的应用场景？**

1. 日志记录
2. 事务管理（`@Transactional`）
3. 权限校验
4. 缓存处理（`@Cacheable`）
5. 性能监控
6. 异常处理
7. 限流控制
8. 审计追踪
9. 数据校验
10. 重试机制

**Q9: @Transactional 的实现原理是什么？**

`@Transactional` 是基于 AOP 实现的：

1. Spring 通过 `TransactionInterceptor` 切面拦截带有 `@Transactional` 的方法
2. 在方法执行前，根据事务传播属性开启/加入事务
3. 执行目标方法
4. 如果方法正常返回，提交事务
5. 如果抛出异常（默认是 RuntimeException），回滚事务
6. 内部自调用不会触发事务，因为没有经过代理

## 延伸阅读

### 官方文档
- [Spring AOP 官方文档](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [AspectJ 官方网站](https://www.eclipse.org/aspectj/)
- [Spring Framework Reference](https://docs.spring.io/spring-framework/docs/current/reference/html/)

### 深入学习
- 《Spring 揭秘》- 王福强
- 《Spring 源码深度解析》- 郝佳
- 《精通 Spring 4.x：企业应用开发实战》- 陈雄华

### 相关主题
- [Spring 事务管理](/java/spring-transaction)
- [Java 动态代理](/java/dynamic-proxy)
- [设计模式：代理模式](/architecture/proxy-pattern)
- [Spring IoC 容器](/java/spring-ioc)

### 源码阅读
- `org.springframework.aop.framework.ProxyFactory`
- `org.springframework.aop.framework.JdkDynamicAopProxy`
- `org.springframework.aop.framework.CglibAopProxy`
- `org.springframework.aop.aspectj.annotation.AnnotationAwareAspectJAutoProxyCreator`
