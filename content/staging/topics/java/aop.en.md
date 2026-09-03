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
origin: old/src/content/docs/java/aop.en.md
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

## Concept Explanation

### What is AOP

AOP (Aspect-Oriented Programming) is a programming paradigm that achieves code modularization and decoupling by separating cross-cutting concerns from business logic.

In traditional object-oriented programming, we organize code through classes and objects. However, some functionalities (such as logging, transaction management, security checks, and performance monitoring) are scattered across multiple classes, forming so-called "cross-cutting concerns." Such code is difficult to maintain and violates the single responsibility principle.

```
Traditional OOP Problem: Cross-cutting concerns scattered everywhere
┌─────────────────────────────────────────────────────────────┐
│  UserService          OrderService         ProductService   │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐   │
│  │ Logging   │        │ Logging   │        │ Logging   │   │
│  │ Security  │        │ Security  │        │ Security  │   │
│  │ Txn Mgmt  │        │ Txn Mgmt  │        │ Txn Mgmt  │   │
│  │ ──────── │        │ ──────── │        │ ──────── │   │
│  │ Business  │        │ Business  │        │ Business  │   │
│  │ ──────── │        │ ──────── │        │ ──────── │   │
│  │ Logging   │        │ Logging   │        │ Logging   │   │
│  └───────────┘        └───────────┘        └───────────┘   │
└─────────────────────────────────────────────────────────────┘

AOP Solution: Centralized management of cross-cutting concerns
┌─────────────────────────────────────────────────────────────┐
│                    Cross-Cutting Concerns (Aspects)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Logging  │ │ Security │ │   Txn    │ │Monitoring│       │
│  │  Aspect  │ │  Aspect  │ │  Aspect  │ │  Aspect  │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  UserService    OrderService    ProductService        │  │
│  │  ┌─────────┐    ┌─────────┐     ┌─────────┐          │  │
│  │  │Business │    │Business │     │Business │          │  │
│  │  │ Logic   │    │ Logic   │     │ Logic   │          │  │
│  │  └─────────┘    └─────────┘     └─────────┘          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### AOP Core Terminology

Understanding AOP requires mastering the following core concepts:

| Term | Description |
|------|-------------|
| Aspect | A module that encapsulates cross-cutting concerns, containing advice and pointcuts |
| JoinPoint | A specific point during program execution, such as method invocation or exception throwing |
| Pointcut | An expression that defines which join points will be intercepted |
| Advice | The action executed at a join point (before, after, around, etc.) |
| Weaving | The process of applying aspects to target objects |
| Target | The original object being proxied |
| Proxy | The object created by AOP that contains both the target object and enhancement logic |

### Spring AOP vs AspectJ

```
┌─────────────────────────────────────────────────────────────┐
│                   AOP Implementation Comparison              │
├──────────────────────┬──────────────────────────────────────┤
│     Spring AOP       │            AspectJ                   │
├──────────────────────┼──────────────────────────────────────┤
│ Runtime weaving      │ Compile-time/Load-time weaving       │
│ (dynamic proxy)      │                                      │
│ Method-level only    │ Supports fields, constructors,       │
│                      │ static initializers, etc.            │
│ Proxies Spring       │ Can proxy any Java class             │
│ Beans only           │                                      │
│ Simple configuration │ Requires special compiler or agent   │
│ out of the box       │                                      │
│ Slightly lower       │ Better performance                   │
│ performance          │                                      │
│ Suitable for most    │ Suitable for fine-grained control    │
│ enterprise apps      │ scenarios                            │
└──────────────────────┴──────────────────────────────────────┘
```

## Core Principles

### Proxy Pattern Basics

Spring AOP is implemented based on the proxy pattern, with two main proxy approaches:

#### JDK Dynamic Proxy (Interface-based)

```java
// Target interface
public interface UserService {
    void createUser(String username);
    User findUser(Long id);
}

// Target implementation
public class UserServiceImpl implements UserService {
    @Override
    public void createUser(String username) {
        System.out.println("Creating user: " + username);
    }

    @Override
    public User findUser(Long id) {
        return new User(id, "test");
    }
}

// JDK Dynamic Proxy implementation
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
                    System.out.println("[Before] Method call: " + method.getName());
                    long start = System.currentTimeMillis();

                    try {
                        Object result = method.invoke(target, args);
                        System.out.println("[After] Execution successful");
                        return result;
                    } catch (Exception e) {
                        System.out.println("[Exception] " + e.getMessage());
                        throw e;
                    } finally {
                        long duration = System.currentTimeMillis() - start;
                        System.out.println("[Duration] " + duration + "ms");
                    }
                }
            }
        );

        proxy.createUser("John");
    }
}
```

#### CGLIB Proxy (Inheritance-based)

```java
// Target class (no interface required)
public class OrderService {
    public void createOrder(String orderId) {
        System.out.println("Creating order: " + orderId);
    }

    // final methods cannot be proxied
    public final void cancelOrder(String orderId) {
        System.out.println("Cancelling order: " + orderId);
    }
}

// CGLIB Proxy implementation
public class CglibProxyDemo {

    public static void main(String[] args) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(OrderService.class);
        enhancer.setCallback(new MethodInterceptor() {
            @Override
            public Object intercept(Object obj, Method method, Object[] args,
                    MethodProxy proxy) throws Throwable {
                System.out.println("[Before] Method call: " + method.getName());

                // Call the parent class (target class) method
                Object result = proxy.invokeSuper(obj, args);

                System.out.println("[After] Execution completed");
                return result;
            }
        });

        OrderService proxy = (OrderService) enhancer.create();
        proxy.createOrder("ORD-001");
    }
}
```

### Spring AOP Proxy Selection Strategy

```java
/**
 * Spring AOP Proxy Selection Logic:
 * 1. If target object implements an interface -> Default to JDK dynamic proxy
 * 2. If target object does not implement an interface -> Use CGLIB proxy
 * 3. Can force CGLIB usage: proxyTargetClass = true
 */
@Configuration
@EnableAspectJAutoProxy(proxyTargetClass = true) // Force CGLIB
public class AopConfig {
}

// Or configure in application.properties
// spring.aop.proxy-target-class=true
```

### Weaving Process Explained

```
Spring AOP Weaving Timing: Runtime (during Bean creation)

┌─────────────────────────────────────────────────────────────┐
│                   Spring Container Startup Process          │
├─────────────────────────────────────────────────────────────┤
│  1. Scan Bean definitions                                   │
│     ↓                                                       │
│  2. Create Bean instances                                   │
│     ↓                                                       │
│  3. Property injection                                      │
│     ↓                                                       │
│  4. Initialization                                          │
│     ↓                                                       │
│  5. ★ BeanPostProcessor post-processing ★                   │
│     │                                                       │
│     ├─→ AnnotationAwareAspectJAutoProxyCreator             │
│     │   (Check if proxy creation is needed)                 │
│     │                                                       │
│     ├─→ Match pointcut expressions                          │
│     │                                                       │
│     └─→ Create proxy object to replace original Bean        │
│     ↓                                                       │
│  6. Return proxy object (or original object)                │
└─────────────────────────────────────────────────────────────┘
```

## Core Concepts

### Five Types of Advice

```java
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    /**
     * 1. @Before - Before advice
     * Executes before the target method
     */
    @Before("execution(* com.example.service.*.*(..))")
    public void beforeAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        log.info("[Before] Preparing to execute method: {}, Args: {}", methodName, Arrays.toString(args));
    }

    /**
     * 2. @After - After advice (finally)
     * Executes regardless of whether the method succeeds or fails
     */
    @After("execution(* com.example.service.*.*(..))")
    public void afterAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        log.info("[After] Method execution completed: {}", methodName);
    }

    /**
     * 3. @AfterReturning - After returning advice
     * Executes after the target method returns successfully, can access return value
     */
    @AfterReturning(
        pointcut = "execution(* com.example.service.*.*(..))",
        returning = "result"
    )
    public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
        String methodName = joinPoint.getSignature().getName();
        log.info("[AfterReturning] Method {} returned: {}", methodName, result);
    }

    /**
     * 4. @AfterThrowing - After throwing advice
     * Executes after the target method throws an exception
     */
    @AfterThrowing(
        pointcut = "execution(* com.example.service.*.*(..))",
        throwing = "ex"
    )
    public void afterThrowingAdvice(JoinPoint joinPoint, Exception ex) {
        String methodName = joinPoint.getSignature().getName();
        log.error("[AfterThrowing] Method {} threw exception: {}", methodName, ex.getMessage());
    }

    /**
     * 5. @Around - Around advice (most powerful)
     * Can completely control method execution, including whether to execute,
     * modify parameters, modify return value
     */
    @Around("execution(* com.example.service.*.*(..))")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        long startTime = System.currentTimeMillis();

        log.info("[Around-Before] Starting execution: {}", methodName);

        try {
            // Execute target method (must be called, otherwise target method won't execute)
            Object result = pjp.proceed();

            log.info("[Around-After] Execution successful: {}", methodName);
            return result;

        } catch (Throwable t) {
            log.error("[Around-Exception] Execution failed: {}", t.getMessage());
            throw t;

        } finally {
            long duration = System.currentTimeMillis() - startTime;
            log.info("[Around-Finally] Duration: {}ms", duration);
        }
    }
}
```

### Advice Execution Order

```
Normal execution:
┌─────────────────────────────────────────────────────────────┐
│  @Around (first half)                                       │
│    ↓                                                        │
│  @Before                                                    │
│    ↓                                                        │
│  ★ Target method execution ★                                │
│    ↓                                                        │
│  @AfterReturning                                            │
│    ↓                                                        │
│  @After                                                     │
│    ↓                                                        │
│  @Around (second half)                                      │
└─────────────────────────────────────────────────────────────┘

Exception execution:
┌─────────────────────────────────────────────────────────────┐
│  @Around (first half)                                       │
│    ↓                                                        │
│  @Before                                                    │
│    ↓                                                        │
│  ★ Target method throws exception ★                         │
│    ↓                                                        │
│  @AfterThrowing                                             │
│    ↓                                                        │
│  @After                                                     │
│    ↓                                                        │
│  @Around (catch block)                                      │
└─────────────────────────────────────────────────────────────┘
```

### Pointcut Expressions Explained

```java
@Aspect
@Component
public class PointcutExamples {

    // ================== execution expressions ==================

    // Match all methods of UserService
    @Pointcut("execution(* com.example.service.UserService.*(..))")
    public void userServiceMethods() {}

    // Match all methods of all classes in service package
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayerMethods() {}

    // Match all methods of all classes in service package and sub-packages
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void serviceAndSubPackageMethods() {}

    // Match all public methods
    @Pointcut("execution(public * *(..))")
    public void publicMethods() {}

    // Match methods returning void
    @Pointcut("execution(void *(..))")
    public void voidMethods() {}

    // Match methods starting with find
    @Pointcut("execution(* find*(..))")
    public void findMethods() {}

    // Match methods accepting a String parameter
    @Pointcut("execution(* *(String))")
    public void methodsWithStringArg() {}

    // Match methods with two parameters where first is String
    @Pointcut("execution(* *(String, ..))")
    public void methodsStartingWithStringArg() {}

    // ================== within expressions ==================

    // Match all methods within UserService class
    @Pointcut("within(com.example.service.UserService)")
    public void withinUserService() {}

    // Match methods of all classes in service package
    @Pointcut("within(com.example.service.*)")
    public void withinServicePackage() {}

    // Match methods of all classes in service package and sub-packages
    @Pointcut("within(com.example.service..*)")
    public void withinServiceAndSubPackages() {}

    // ================== @annotation expressions ==================

    // Match methods with @Transactional annotation
    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    public void transactionalMethods() {}

    // Match methods with custom @Loggable annotation
    @Pointcut("@annotation(com.example.annotation.Loggable)")
    public void loggableMethods() {}

    // ================== @within expressions ==================

    // Match all methods in classes with @Service annotation
    @Pointcut("@within(org.springframework.stereotype.Service)")
    public void serviceAnnotatedClasses() {}

    // ================== bean expressions ==================

    // Match all methods of Bean named userService
    @Pointcut("bean(userService)")
    public void userServiceBean() {}

    // Match all Beans with names ending in Service
    @Pointcut("bean(*Service)")
    public void allServiceBeans() {}

    // ================== args expressions ==================

    // Match methods accepting Long type parameter
    @Pointcut("args(Long)")
    public void methodsWithLongArg() {}

    // Match methods accepting any number of String parameters
    @Pointcut("args(String, ..)")
    public void methodsWithStringArgs() {}

    // ================== this and target expressions ==================

    // Match methods where proxy object is UserService type
    @Pointcut("this(com.example.service.UserService)")
    public void proxyIsUserService() {}

    // Match methods where target object is UserService type
    @Pointcut("target(com.example.service.UserService)")
    public void targetIsUserService() {}

    // ================== Combined expressions ==================

    // AND combination
    @Pointcut("execution(* com.example.service.*.*(..)) && @annotation(Loggable)")
    public void loggableServiceMethods() {}

    // OR combination
    @Pointcut("execution(* com.example.service.*.*(..)) || execution(* com.example.controller.*.*(..))")
    public void serviceOrControllerMethods() {}

    // NOT combination
    @Pointcut("execution(* com.example.service.*.*(..)) && !execution(* *.internal*(..))")
    public void publicServiceMethods() {}
}
```

### Pointcut Expression Syntax Explained

```
execution expression syntax:
execution(modifiers-pattern? ret-type-pattern declaring-type-pattern?
          name-pattern(param-pattern) throws-pattern?)

┌──────────────────────────────────────────────────────────────────┐
│  execution(public String com.example.service.UserService.       │
│            findByName(String) throws NotFoundException)          │
│  ────────── ────── ─────────────────────────── ────────────────  │
│      │        │              │                      │            │
│  Modifiers  Return      Type pattern.method(params) Exception    │
│  (optional)  type       (optional).(required)(req)  pattern      │
│             (required)                              (optional)   │
└──────────────────────────────────────────────────────────────────┘

Wildcard explanations:
- *        Matches any characters (excluding package separator)
- ..       Matches any number of parameters, or any number of packages
- +        Matches subtypes of specified type

Examples:
execution(* *(..))                    - Match all methods
execution(* set*(..))                 - Match all methods starting with set
execution(* com.example..*.*(..))     - Match all methods in com.example package and sub-packages
execution(* com.example..*Service.*(..)) - Match all methods of classes ending with Service
```

### JoinPoint Explained

```java
@Aspect
@Component
public class JoinPointDemo {

    @Before("execution(* com.example.service.*.*(..))")
    public void demonstrateJoinPoint(JoinPoint joinPoint) {

        // Get method signature
        Signature signature = joinPoint.getSignature();
        String methodName = signature.getName();
        String declaringTypeName = signature.getDeclaringTypeName();

        // Get detailed method signature information (requires casting)
        if (signature instanceof MethodSignature) {
            MethodSignature methodSignature = (MethodSignature) signature;
            Method method = methodSignature.getMethod();
            Class<?> returnType = methodSignature.getReturnType();
            String[] parameterNames = methodSignature.getParameterNames();
            Class<?>[] parameterTypes = methodSignature.getParameterTypes();
        }

        // Get target object
        Object target = joinPoint.getTarget();

        // Get proxy object
        Object proxy = joinPoint.getThis();

        // Get method arguments
        Object[] args = joinPoint.getArgs();

        // Get join point kind (e.g., "method-execution")
        String kind = joinPoint.getKind();

        // Get source location
        SourceLocation sourceLocation = joinPoint.getSourceLocation();
    }

    @Around("execution(* com.example.service.*.*(..))")
    public Object demonstrateProceedingJoinPoint(ProceedingJoinPoint pjp)
            throws Throwable {

        // ProceedingJoinPoint is a subinterface of JoinPoint, only for @Around

        // Execute target method normally
        Object result = pjp.proceed();

        // Execute target method with new arguments
        Object[] newArgs = modifyArgs(pjp.getArgs());
        Object resultWithNewArgs = pjp.proceed(newArgs);

        return result;
    }

    private Object[] modifyArgs(Object[] args) {
        // Logic to modify arguments
        return args;
    }
}
```

## Code Examples

### Example 1: Logging Aspect

```java
/**
 * Generic logging aspect
 * Automatically logs method input, output, execution time, and exception information
 */
@Aspect
@Component
@Order(1) // Aspect priority, smaller number = higher priority
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

        // Input logging
        if (log.isDebugEnabled()) {
            log.debug(">>> {} Input: {}", fullMethod, formatArgs(pjp.getArgs()));
        }

        long startTime = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();

            long duration = System.currentTimeMillis() - startTime;

            // Output and duration logging
            if (log.isDebugEnabled()) {
                log.debug("<<< {} Output: {}, Duration: {}ms",
                    fullMethod, formatResult(result), duration);
            }

            // Slow method warning
            if (duration > 1000) {
                log.warn("Slow method warning: {} took {}ms", fullMethod, duration);
            }

            return result;

        } catch (Throwable t) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("!!! {} Execution exception, Duration: {}ms, Exception: {}",
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
            // Limit length to avoid overly long logs
            return str.length() > 500 ? str.substring(0, 500) + "..." : str;
        } catch (Exception e) {
            return obj.getClass().getSimpleName() + "@" +
                   Integer.toHexString(obj.hashCode());
        }
    }
}
```

### Example 2: Custom Annotation + Aspect

```java
/**
 * Custom method-level logging annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Loggable {

    /**
     * Log description
     */
    String value() default "";

    /**
     * Whether to log input parameters
     */
    boolean logArgs() default true;

    /**
     * Whether to log return value
     */
    boolean logResult() default true;

    /**
     * Slow method threshold (milliseconds), warn if exceeded
     */
    long slowThreshold() default 1000;
}

/**
 * Aspect handling @Loggable annotation
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

        // Input logging
        if (loggable.logArgs()) {
            log.info("[{}] Starting execution, Args: {}", description,
                    Arrays.toString(pjp.getArgs()));
        } else {
            log.info("[{}] Starting execution", description);
        }

        long startTime = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();

            long duration = System.currentTimeMillis() - startTime;

            // Output logging
            if (loggable.logResult()) {
                log.info("[{}] Execution successful, Result: {}, Duration: {}ms",
                        description, result, duration);
            } else {
                log.info("[{}] Execution successful, Duration: {}ms", description, duration);
            }

            // Slow method warning
            if (duration > loggable.slowThreshold()) {
                log.warn("[{}] Method executed too slowly! Duration: {}ms, Threshold: {}ms",
                        description, duration, loggable.slowThreshold());
            }

            return result;

        } catch (Throwable t) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[{}] Execution failed, Duration: {}ms, Exception: {}",
                     description, duration, t.getMessage(), t);
            throw t;
        }
    }
}

// Usage example
@Service
public class UserService {

    @Loggable("User Registration")
    public User register(String username, String email) {
        // Business logic
        return new User(username, email);
    }

    @Loggable(value = "User Query", logResult = false, slowThreshold = 500)
    public List<User> findAllUsers() {
        // Business logic
        return userRepository.findAll();
    }
}
```

### Example 3: Permission Verification Aspect

```java
/**
 * Permission verification annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {

    /**
     * Required permissions list
     */
    String[] value();

    /**
     * Permission verification logic: AND (require all) or OR (require any)
     */
    Logic logic() default Logic.AND;

    enum Logic {
        AND, OR
    }
}

/**
 * Role verification annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    String[] value();
}

/**
 * Security verification aspect
 */
@Aspect
@Component
@Order(0) // Highest priority, executes before other aspects
public class SecurityAspect {

    private static final Logger log = LoggerFactory.getLogger(SecurityAspect.class);

    @Autowired
    private SecurityContext securityContext; // Assumed security context

    @Before("@annotation(requirePermission)")
    public void checkPermission(JoinPoint joinPoint, RequirePermission requirePermission) {
        User currentUser = securityContext.getCurrentUser();

        if (currentUser == null) {
            throw new UnauthorizedException("User not logged in");
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
            log.warn("Permission check failed: User {} lacks permissions {}",
                    currentUser.getUsername(), Arrays.toString(requiredPermissions));
            throw new ForbiddenException("Insufficient permissions");
        }

        log.debug("Permission check passed: User {} accessing {}",
                 currentUser.getUsername(), joinPoint.getSignature().getName());
    }

    @Before("@annotation(requireRole)")
    public void checkRole(JoinPoint joinPoint, RequireRole requireRole) {
        User currentUser = securityContext.getCurrentUser();

        if (currentUser == null) {
            throw new UnauthorizedException("User not logged in");
        }

        String[] requiredRoles = requireRole.value();
        Set<String> userRoles = currentUser.getRoles();

        boolean hasRole = Arrays.stream(requiredRoles)
                .anyMatch(userRoles::contains);

        if (!hasRole) {
            log.warn("Role check failed: User {} lacks roles {}",
                    currentUser.getUsername(), Arrays.toString(requiredRoles));
            throw new ForbiddenException("Insufficient role permissions");
        }
    }
}

// Usage example
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @RequireRole({"ADMIN", "SUPER_ADMIN"})
    @RequirePermission(value = {"user:read", "user:write"}, logic = RequirePermission.Logic.AND)
    @PostMapping("/users")
    public User createUser(@RequestBody CreateUserRequest request) {
        // Business logic
        return userService.create(request);
    }
}
```

### Example 4: Retry Mechanism Aspect

```java
/**
 * Retry annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Retryable {

    /**
     * Maximum retry attempts
     */
    int maxAttempts() default 3;

    /**
     * Retry delay (milliseconds)
     */
    long delay() default 1000;

    /**
     * Delay multiplier (for exponential backoff)
     */
    double multiplier() default 1.5;

    /**
     * Exception types that should trigger retry
     */
    Class<? extends Throwable>[] retryOn() default {Exception.class};

    /**
     * Exception types that should not trigger retry
     */
    Class<? extends Throwable>[] noRetryOn() default {};
}

/**
 * Retry aspect
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
                    log.info("Retry attempt {}: {}", attempt, methodName);
                }
                return pjp.proceed();

            } catch (Throwable t) {
                lastException = t;

                // Check if should retry
                if (!shouldRetry(t, retryable)) {
                    log.warn("Exception not retryable: {} - {}", methodName, t.getMessage());
                    throw t;
                }

                if (attempt < maxAttempts) {
                    log.warn("Execution failed, preparing retry: {} - {}", methodName, t.getMessage());

                    // Calculate next delay (exponential backoff)
                    long currentDelay = (long) (delay * Math.pow(multiplier, attempt - 1));
                    Thread.sleep(currentDelay);
                }
            }
        }

        log.error("Retry attempts exhausted: {} total {} attempts", methodName, maxAttempts);
        throw lastException;
    }

    private boolean shouldRetry(Throwable t, Retryable retryable) {
        // Check if in no-retry list
        for (Class<? extends Throwable> noRetry : retryable.noRetryOn()) {
            if (noRetry.isInstance(t)) {
                return false;
            }
        }

        // Check if in retry list
        for (Class<? extends Throwable> retry : retryable.retryOn()) {
            if (retry.isInstance(t)) {
                return true;
            }
        }

        return false;
    }
}

// Usage example
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
        // Call external API
        return restTemplate.getForObject(url, String.class);
    }
}
```

### Example 5: Caching Aspect

```java
/**
 * Caching annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Cacheable {

    /**
     * Cache name
     */
    String value();

    /**
     * Cache key, supports SpEL expressions
     */
    String key() default "";

    /**
     * Time to live (seconds)
     */
    int ttl() default 3600;

    /**
     * Whether to cache null values
     */
    boolean cacheNull() default false;
}

/**
 * Cache eviction annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface CacheEvict {
    String value();
    String key() default "";
    boolean allEntries() default false;
}

/**
 * Caching aspect
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

        // Try to get from cache
        Object cachedValue = redisTemplate.opsForValue().get(cacheKey);

        if (cachedValue != null) {
            log.debug("Cache hit: {}", cacheKey);
            return cachedValue;
        }

        // Cache miss, execute method
        log.debug("Cache miss: {}", cacheKey);
        Object result = pjp.proceed();

        // Store in cache
        if (result != null || cacheable.cacheNull()) {
            redisTemplate.opsForValue().set(
                cacheKey,
                result,
                cacheable.ttl(),
                TimeUnit.SECONDS
            );
            log.debug("Written to cache: {}, TTL: {}s", cacheKey, cacheable.ttl());
        }

        return result;
    }

    @Around("@annotation(cacheEvict)")
    public Object handleCacheEvict(ProceedingJoinPoint pjp, CacheEvict cacheEvict)
            throws Throwable {

        Object result = pjp.proceed();

        if (cacheEvict.allEntries()) {
            // Clear all cache entries
            Set<String> keys = redisTemplate.keys(cacheEvict.value() + ":*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("Cache cleared: {} total {} entries", cacheEvict.value(), keys.size());
            }
        } else {
            // Clear specific cache entry
            String cacheKey = buildCacheKey(cacheEvict.value(), cacheEvict.key(), pjp);
            redisTemplate.delete(cacheKey);
            log.debug("Cache cleared: {}", cacheKey);
        }

        return result;
    }

    private String buildCacheKey(String cacheName, String keyExpression,
            ProceedingJoinPoint pjp) {

        if (keyExpression.isEmpty()) {
            // Default to method name + argument hash
            return cacheName + ":" + pjp.getSignature().getName() + ":" +
                   Arrays.hashCode(pjp.getArgs());
        }

        // Parse SpEL expression
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

// Usage example
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
        // Refresh operation
    }
}
```

### Example 6: Distributed Lock Aspect

```java
/**
 * Distributed lock annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DistributedLock {

    /**
     * Lock key, supports SpEL
     */
    String key();

    /**
     * Lock prefix
     */
    String prefix() default "lock:";

    /**
     * Timeout for waiting to acquire lock (seconds)
     */
    int waitTime() default 5;

    /**
     * Lock hold time (seconds)
     */
    int leaseTime() default 30;

    /**
     * Strategy when lock acquisition fails
     */
    FailStrategy onFail() default FailStrategy.EXCEPTION;

    enum FailStrategy {
        EXCEPTION,  // Throw exception
        RETURN_NULL // Return null
    }
}

/**
 * Distributed lock aspect
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
            // Try to acquire lock
            acquired = rLock.tryLock(lock.waitTime(), lock.leaseTime(), TimeUnit.SECONDS);

            if (!acquired) {
                log.warn("Failed to acquire distributed lock: {}", lockKey);

                if (lock.onFail() == DistributedLock.FailStrategy.EXCEPTION) {
                    throw new LockAcquisitionException("Unable to acquire lock: " + lockKey);
                } else {
                    return null;
                }
            }

            log.debug("Successfully acquired distributed lock: {}", lockKey);
            return pjp.proceed();

        } finally {
            if (acquired && rLock.isHeldByCurrentThread()) {
                rLock.unlock();
                log.debug("Released distributed lock: {}", lockKey);
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

// Usage example
@Service
public class OrderService {

    @DistributedLock(key = "'order:' + #userId", waitTime = 10, leaseTime = 60)
    public Order createOrder(Long userId, CreateOrderRequest request) {
        // Prevent duplicate orders from the same user
        return doCreateOrder(userId, request);
    }

    @DistributedLock(
        key = "'inventory:' + #productId",
        onFail = DistributedLock.FailStrategy.EXCEPTION
    )
    public void deductInventory(Long productId, int quantity) {
        // Deduct inventory, requires lock to prevent overselling
        inventoryRepository.deduct(productId, quantity);
    }
}
```

## Best Practices

### Aspect Design Principles

```java
/**
 * Best Practice: Single Responsibility
 * Each aspect should handle only one type of cross-cutting concern
 */

// Good design: Each aspect has a single responsibility
@Aspect
@Component
public class LoggingAspect { /* Only handles logging */ }

@Aspect
@Component
public class SecurityAspect { /* Only handles security */ }

@Aspect
@Component
public class PerformanceAspect { /* Only handles performance monitoring */ }

// Bad design: Aspect has too many responsibilities
@Aspect
@Component
public class GodAspect {
    // Logging + Security + Performance + Caching + ... all mixed together
}
```

### Aspect Priority Management

```java
/**
 * Use @Order to control aspect execution order
 * Smaller number = higher priority
 */
@Aspect
@Component
@Order(0) // Executes first
public class SecurityAspect {
    // Security checks should execute first
}

@Aspect
@Component
@Order(1)
public class LoggingAspect {
    // Logging
}

@Aspect
@Component
@Order(2)
public class PerformanceAspect {
    // Performance monitoring
}

/*
 * Execution order (entering): Security -> Logging -> Performance -> Target method
 * Execution order (returning): Target method -> Performance -> Logging -> Security
 */
```

### Precise Pointcut Expressions

```java
/**
 * Best Practice: Pointcut expressions should be precise
 */

// Not recommended: Too broad, may affect unintended classes
@Pointcut("execution(* *(..))")
public void tooGeneral() {}

// Recommended: Precisely match needed packages and classes
@Pointcut("execution(* com.example.service..*Service.*(..))")
public void serviceLayerOperations() {}

// Recommended: Combine for better readability
@Pointcut("within(com.example.service..*)")
public void inServiceLayer() {}

@Pointcut("execution(public * *(..))")
public void publicMethod() {}

@Pointcut("inServiceLayer() && publicMethod()")
public void publicServiceMethods() {}
```

### Avoid Circular Dependencies Between Aspects

```java
/**
 * Note: Beans injected into aspects may also be proxied
 * This can lead to circular dependencies or unexpected behavior
 */

// Potentially problematic
@Aspect
@Component
public class ProblematicAspect {

    @Autowired
    private UserService userService; // UserService is also proxied by AOP

    @Before("execution(* com.example.service.*.*(..))")
    public void advice(JoinPoint jp) {
        // Calling userService may trigger recursive proxy
        userService.getCurrentUser();
    }
}

// Better approach: Lazy loading or using Provider
@Aspect
@Component
public class BetterAspect {

    @Autowired
    private ApplicationContext context;

    @Before("execution(* com.example.service.*.*(..)) && !target(com.example.service.UserService)")
    public void advice(JoinPoint jp) {
        // Exclude UserService to avoid recursion
        UserService userService = context.getBean(UserService.class);
        userService.getCurrentUser();
    }
}
```

### Correct Usage of Around Advice

```java
/**
 * @Around usage considerations
 */
@Aspect
@Component
public class AroundAdviceGuide {

    // Wrong: Forgot to call proceed()
    @Around("execution(* com.example.service.*.*(..))")
    public Object wrongAdvice(ProceedingJoinPoint pjp) throws Throwable {
        log.info("Before");
        // Didn't call proceed(), target method won't execute!
        log.info("After");
        return null;
    }

    // Wrong: Forgot to return result
    @Around("execution(* com.example.service.*.*(..))")
    public Object anotherWrongAdvice(ProceedingJoinPoint pjp) throws Throwable {
        Object result = pjp.proceed();
        log.info("Result: {}", result);
        // Didn't return result, caller gets null!
    }

    // Correct approach
    @Around("execution(* com.example.service.*.*(..))")
    public Object correctAdvice(ProceedingJoinPoint pjp) throws Throwable {
        log.info("Before");
        try {
            Object result = pjp.proceed();
            log.info("After returning: {}", result);
            return result; // Must return
        } catch (Throwable t) {
            log.error("After throwing: {}", t.getMessage());
            throw t; // Must rethrow or handle
        }
    }
}
```

### Appropriate Use of Advice Types

```java
/**
 * Choose the appropriate advice type
 */

// Only need to do something before method execution -> @Before
@Before("...")
public void logMethodEntry(JoinPoint jp) {
    log.info("Entering: {}", jp.getSignature().getName());
}

// Only need to get return value after successful execution -> @AfterReturning
@AfterReturning(pointcut = "...", returning = "result")
public void logMethodReturn(JoinPoint jp, Object result) {
    log.info("Returned: {}", result);
}

// Only need to handle exceptions -> @AfterThrowing
@AfterThrowing(pointcut = "...", throwing = "ex")
public void logMethodException(JoinPoint jp, Exception ex) {
    log.error("Exception: {}", ex.getMessage());
}

// Need to control method execution (e.g., modify params, modify return, decide whether to execute) -> @Around
@Around("...")
public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
    // Can completely control method execution
    return pjp.proceed();
}
```

## Common Pitfalls

### Self-Invocation Problem

```java
/**
 * Pitfall: Method self-invocation within the same class won't trigger AOP
 * Because self-invocation uses the 'this' reference, not the proxy object
 */
@Service
public class UserService {

    @Transactional
    public void createUser(User user) {
        // Save user
        userRepository.save(user);

        // Self-invocation - @Async won't work!
        this.sendWelcomeEmail(user);
    }

    @Async
    public void sendWelcomeEmail(User user) {
        // This method won't execute asynchronously because it's called via 'this'
        emailService.send(user.getEmail(), "Welcome!");
    }
}

/**
 * Solution 1: Inject self proxy
 */
@Service
public class UserService {

    @Autowired
    private UserService self; // Inject self proxy

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
        self.sendWelcomeEmail(user); // Call through proxy
    }

    @Async
    public void sendWelcomeEmail(User user) {
        emailService.send(user.getEmail(), "Welcome!");
    }
}

/**
 * Solution 2: Use AopContext (requires enabling exposeProxy)
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

        // Get current proxy object
        UserService proxy = (UserService) AopContext.currentProxy();
        proxy.sendWelcomeEmail(user);
    }
}

/**
 * Solution 3: Split into different classes
 */
@Service
public class UserService {

    @Autowired
    private EmailService emailService;

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
        emailService.sendWelcomeEmail(user); // Call other Bean
    }
}

@Service
public class EmailService {

    @Async
    public void sendWelcomeEmail(User user) {
        // Now async will work
    }
}
```

### private/final Methods Cannot Be Proxied

```java
/**
 * Pitfall: private and final methods cannot be proxied
 */
@Service
public class ProductService {

    // private methods won't be proxied
    @Transactional
    private void privateMethod() {
        // @Transactional won't work
    }

    // final methods won't be proxied by CGLIB
    @Cacheable("products")
    public final List<Product> finalMethod() {
        // @Cacheable won't work
        return productRepository.findAll();
    }

    // Correct: Use public non-final methods
    @Transactional
    public void correctMethod() {
        // Works normally
    }
}
```

### Inaccurate Pointcut Expression Matching

```java
/**
 * Pitfall: Pointcut expressions need precise matching
 */
@Aspect
@Component
public class PointcutPitfalls {

    // Pitfall 1: Forgot .. causing only direct sub-packages to match
    // Only matches com.example.service package, not com.example.service.impl
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void onlyDirectPackage() {}

    // Correct: Use .. to match all sub-packages
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void includeSubPackages() {}

    // Pitfall 2: Parameter matching too broad
    // Matches all methods
    @Pointcut("execution(* *(..))")
    public void allMethods() {}

    // Pitfall 3: Forgot return type
    // This is a syntax error
    // @Pointcut("execution(com.example.service.*.*(..))")

    // Correct: Must specify return type
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void correct() {}
}
```

### Improper Exception Handling

```java
/**
 * Pitfall: Swallowing exceptions in aspects
 */
@Aspect
@Component
public class ExceptionHandlingPitfall {

    // Wrong: Swallowed the exception, caller doesn't know an error occurred
    @Around("execution(* com.example.service.*.*(..))")
    public Object wrongExceptionHandling(ProceedingJoinPoint pjp) {
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            log.error("Error", t);
            return null; // Swallowed exception, returned null
        }
    }

    // Correct: Log and rethrow
    @Around("execution(* com.example.service.*.*(..))")
    public Object correctExceptionHandling(ProceedingJoinPoint pjp)
            throws Throwable {
        try {
            return pjp.proceed();
        } catch (Throwable t) {
            log.error("Error in {}: {}",
                pjp.getSignature().getName(), t.getMessage());
            throw t; // Rethrow
        }
    }
}
```

### Circular Dependencies

```java
/**
 * Pitfall: Circular dependencies between aspects and Beans
 */
@Aspect
@Component
public class CircularDependencyPitfall {

    // May cause circular dependency
    @Autowired
    private UserService userService; // While UserService is proxied by this aspect

    @Before("execution(* com.example.service.UserService.*(..))")
    public void beforeUserService(JoinPoint jp) {
        // Using userService may cause problems
    }
}

/**
 * Solution: Use @Lazy for lazy loading
 */
@Aspect
@Component
public class FixedCircularDependency {

    @Autowired
    @Lazy
    private UserService userService;

    // Or use ObjectProvider
    @Autowired
    private ObjectProvider<UserService> userServiceProvider;

    @Before("execution(* com.example.service.OrderService.*(..))")
    public void beforeOrderService(JoinPoint jp) {
        UserService service = userServiceProvider.getIfAvailable();
        if (service != null) {
            // Safe to use
        }
    }
}
```

## Performance Considerations

### AOP Performance Overhead

```java
/**
 * Sources of AOP performance overhead:
 * 1. Proxy object creation (at startup, one-time)
 * 2. Method call interception and dispatch
 * 3. Parameter wrapping and unwrapping
 * 4. Pointcut expression matching
 */

// Performance test example
@SpringBootTest
public class AopPerformanceTest {

    @Autowired
    private UserService userService; // Proxied service

    @Autowired
    private UserService rawService; // Raw service (not proxied)

    @Test
    public void comparePerformance() {
        int iterations = 100000;

        // Warm up
        for (int i = 0; i < 1000; i++) {
            userService.simpleMethod();
        }

        // Test proxied method
        long start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            userService.simpleMethod();
        }
        long proxyTime = System.nanoTime() - start;

        System.out.printf("Proxied method: %.2f ns/call%n",
            (double) proxyTime / iterations);

        // Conclusion: Proxy overhead for simple methods is about 100-500ns
        // For methods with heavy business logic, this overhead is negligible
    }
}
```

### Pointcut Expression Optimization

```java
/**
 * Performance optimization for pointcut expressions
 */
@Aspect
@Component
public class OptimizedPointcuts {

    // Slow: Complex pattern matching every time
    @Pointcut("execution(* com.example..*.*(..)) && " +
              "@annotation(org.springframework.transaction.annotation.Transactional)")
    public void slowPointcut() {}

    // Faster: Use more specific package path
    @Pointcut("execution(* com.example.service.impl.*ServiceImpl.*(..))")
    public void fasterPointcut() {}

    // Even faster: Use within to limit scope
    @Pointcut("within(com.example.service.impl.*) && " +
              "execution(public * *(..))")
    public void fastestPointcut() {}

    // Best practice: Combine, use within first to narrow scope
    @Pointcut("within(com.example.service..*)")
    private void inServiceLayer() {}

    @Pointcut("execution(public * *(..)) && inServiceLayer()")
    public void optimizedPointcut() {}
}
```

### Reduce Unnecessary Advice

```java
/**
 * Avoid overusing AOP
 */

// Not recommended: Apply complex logging aspect to all methods
@Around("execution(* com.example..*.*(..))")
public Object heavyLogging(ProceedingJoinPoint pjp) throws Throwable {
    // Serializing parameters, calculating duration, recording stack traces, etc.
    // Has significant impact on frequently called methods
}

// Recommended: Apply only to methods that need it
@Around("@annotation(com.example.annotation.DetailedLog)")
public Object selectiveLogging(ProceedingJoinPoint pjp) throws Throwable {
    // Only methods annotated with @DetailedLog will be intercepted
}
```

### Compile-Time Weaving (AspectJ)

```java
/**
 * For performance-sensitive scenarios, consider using AspectJ compile-time weaving
 * Eliminates runtime proxy overhead
 */

// pom.xml configuration
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

## Practical Scenarios

### Scenario 1: Unified Exception Handling

```java
/**
 * Unified exception handling aspect
 * Converts low-level exceptions to business-friendly exceptions
 */
@Aspect
@Component
@Order(Integer.MIN_VALUE) // Execute first to catch all exceptions
public class ExceptionTranslationAspect {

    private static final Logger log =
        LoggerFactory.getLogger(ExceptionTranslationAspect.class);

    @Around("@within(org.springframework.stereotype.Service)")
    public Object translateException(ProceedingJoinPoint pjp) throws Throwable {
        try {
            return pjp.proceed();
        } catch (DataAccessException e) {
            log.error("Data access exception", e);
            throw new BusinessException("Data operation failed, please try again later", e);
        } catch (OptimisticLockingFailureException e) {
            log.warn("Optimistic lock conflict", e);
            throw new BusinessException("Data has been modified, please refresh and retry", e);
        } catch (ConstraintViolationException e) {
            log.warn("Data validation failed", e);
            throw new ValidationException(extractValidationMessage(e), e);
        } catch (BusinessException e) {
            throw e; // Business exceptions pass through
        } catch (Exception e) {
            log.error("Unknown exception", e);
            throw new BusinessException("System busy, please try again later", e);
        }
    }

    private String extractValidationMessage(ConstraintViolationException e) {
        return e.getConstraintViolations().stream()
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.joining("; "));
    }
}
```

### Scenario 2: Audit Logging

```java
/**
 * Operation audit aspect
 * Records audit logs for critical business operations
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
        // Serialize arguments, be careful with sensitive data
        return Arrays.stream(args)
            .map(this::sanitize)
            .collect(Collectors.joining(", "));
    }

    private String sanitize(Object arg) {
        // Sanitize sensitive information
        if (arg == null) return "null";
        String str = arg.toString();
        // Mask passwords and other sensitive data
        return str.replaceAll("password=\\S+", "password=***");
    }
}

// Usage
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

### Scenario 3: Rate Limiting Aspect

```java
/**
 * API rate limiting annotation
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimited {

    /**
     * Rate limiting key, supports SpEL
     */
    String key() default "";

    /**
     * Requests allowed per second
     */
    double permitsPerSecond() default 10;

    /**
     * Wait time for acquiring permit (milliseconds)
     */
    long timeout() default 0;
}

/**
 * Rate limiting aspect (based on Guava RateLimiter)
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
                "Too many requests, please try again later");
        }

        return pjp.proceed();
    }

    private String buildKey(String keyExpression, ProceedingJoinPoint pjp) {
        if (keyExpression.isEmpty()) {
            return pjp.getSignature().toShortString();
        }
        // Parse SpEL expression
        // ...
        return keyExpression;
    }
}

// Usage
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

### Scenario 4: Data Masking

```java
/**
 * Data masking annotation
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
    PHONE,      // Phone: 138****1234
    ID_CARD,    // ID card: 110***********1234
    EMAIL,      // Email: a***@example.com
    BANK_CARD,  // Bank card: 6222***********1234
    NAME        // Name: J***
}

/**
 * Data masking aspect
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
                // Ignore
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

// Entity class
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

// Usage
@RestController
public class UserController {

    @DesensitizeResult
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
        // Sensitive fields in returned User object will be automatically masked
    }
}
```

## Interview Key Points

### Basic Questions

**Q1: What is AOP? What problems does it solve?**

AOP (Aspect-Oriented Programming) is a programming paradigm used to separate cross-cutting concerns (such as logging, transactions, security) from business logic. It solves problems of code duplication and coupling, improving code modularization.

**Q2: What are the differences between Spring AOP and AspectJ?**

| Comparison | Spring AOP | AspectJ |
|------------|-----------|---------|
| Weaving time | Runtime (dynamic proxy) | Compile-time/Load-time |
| Join points | Method execution only | Methods, fields, constructors, etc. |
| Proxy method | JDK/CGLIB | No proxy needed, modifies bytecode directly |
| Performance | Slight overhead | Better performance |
| Difficulty | Simple | More complex |

**Q3: What are the differences between JDK dynamic proxy and CGLIB proxy?**

- **JDK Dynamic Proxy**: Interface-based, target class must implement an interface, uses `java.lang.reflect.Proxy`
- **CGLIB Proxy**: Inheritance-based, target class cannot be final, implemented by generating subclass
- **Spring's Choice**: By default, uses JDK if interface exists, CGLIB if not; can force CGLIB with `proxyTargetClass=true`

### Advanced Questions

**Q4: Explain the five types of advice in Spring AOP and their execution order**

```
Advice types:
1. @Before: Before method execution
2. @After: After method execution (finally, regardless of success or failure)
3. @AfterReturning: After method returns successfully
4. @AfterThrowing: After method throws exception
5. @Around: Around advice, complete control over method execution

Normal execution order: Around(before) -> Before -> Method -> AfterReturning -> After -> Around(after)
Exception execution order: Around(before) -> Before -> Method(exception) -> AfterThrowing -> After -> Around(catch)
```

**Q5: Why doesn't self-invocation within the same class trigger AOP?**

Because Spring AOP is proxy-based, self-invocation uses the `this` reference (original object), not the proxy object. Proxies only intercept calls made through the proxy object.

Solutions:
1. Inject the self proxy (`@Autowired` self)
2. Use `AopContext.currentProxy()` to get the proxy
3. Split methods into different classes

**Q6: How to implement AOP functionality with a custom annotation?**

```java
// 1. Define annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface MyAnnotation {
    String value() default "";
}

// 2. Define aspect
@Aspect
@Component
public class MyAspect {

    @Around("@annotation(myAnnotation)")
    public Object handle(ProceedingJoinPoint pjp, MyAnnotation myAnnotation)
            throws Throwable {
        // Pre-processing
        Object result = pjp.proceed();
        // Post-processing
        return result;
    }
}

// 3. Use annotation
@MyAnnotation("test")
public void myMethod() { }
```

### Practical Questions

**Q7: How to control the execution order of multiple aspects?**

Use the `@Order` annotation or implement the `Ordered` interface. Smaller number = higher priority.

```java
@Aspect
@Order(1) // Executes first
public class SecurityAspect { }

@Aspect
@Order(2) // Executes second
public class LoggingAspect { }
```

**Q8: What are common application scenarios for AOP?**

1. Logging
2. Transaction management (`@Transactional`)
3. Permission verification
4. Cache handling (`@Cacheable`)
5. Performance monitoring
6. Exception handling
7. Rate limiting
8. Audit tracking
9. Data validation
10. Retry mechanisms

**Q9: What is the implementation principle of @Transactional?**

`@Transactional` is implemented based on AOP:

1. Spring intercepts methods annotated with `@Transactional` through the `TransactionInterceptor` aspect
2. Before method execution, starts/joins a transaction based on propagation behavior
3. Executes target method
4. If method returns normally, commits transaction
5. If exception is thrown (default is RuntimeException), rolls back transaction
6. Internal self-invocation won't trigger transaction because it doesn't go through the proxy

## Further Reading

### Official Documentation
- [Spring AOP Official Documentation](https://docs.spring.io/spring-framework/reference/core/aop.html)
- [AspectJ Official Website](https://www.eclipse.org/aspectj/)
- [Spring Framework Reference](https://docs.spring.io/spring-framework/docs/current/reference/html/)

### Deep Dive Learning
- "Spring Revealed" - Wang Fuqiang
- "Spring Source Code Deep Analysis" - Hao Jia
- "Mastering Spring 4.x: Enterprise Application Development in Practice" - Chen Xionghua

### Related Topics
- [Spring Transaction Management](/java/spring-transaction)
- [Java Dynamic Proxy](/java/dynamic-proxy)
- [Design Pattern: Proxy Pattern](/architecture/proxy-pattern)
- [Spring IoC Container](/java/spring-ioc)

### Source Code Reading
- `org.springframework.aop.framework.ProxyFactory`
- `org.springframework.aop.framework.JdkDynamicAopProxy`
- `org.springframework.aop.framework.CglibAopProxy`
- `org.springframework.aop.aspectj.annotation.AnnotationAwareAspectJAutoProxyCreator`
