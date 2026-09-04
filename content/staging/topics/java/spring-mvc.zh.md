---
title: Spring MVC 深入指南
description: 全面掌握 Spring MVC 框架的核心概念、请求处理机制、数据绑定与视图解析
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring MVC
  - Spring
  - Web框架
  - Controller
  - REST
status: imported
origin: old/src/content/docs/java/spring-mvc.zh.md
divergence: 0.174
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: Web框架
  order: 13
  lastUpdated: 2026-01-07
---

## 概念解释

Spring MVC 是 Spring Framework 中的 Web 模块，是一个基于 Java 的实现 MVC 设计模式的请求驱动型轻量级 Web 框架。它通过一套注解让 POJO 成为处理请求的控制器，无需实现任何接口。

### 什么是 MVC 模式？

MVC（Model-View-Controller）是一种软件架构模式，将应用程序分为三个核心组件：

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端请求                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DispatcherServlet                         │
│                     (前端控制器)                              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
│    Controller     │ │    Model      │ │      View         │
│   (处理请求逻辑)   │ │  (业务数据)   │ │   (视图渲染)       │
└───────────────────┘ └───────────────┘ └───────────────────┘
```

- **Model（模型）**：封装应用程序数据和业务逻辑
- **View（视图）**：负责数据展示和用户界面渲染
- **Controller（控制器）**：处理用户请求，协调 Model 和 View

### 为什么选择 Spring MVC？

Spring MVC 相比其他 Java Web 框架具有以下优势：

1. **与 Spring 生态深度集成**：无缝使用 Spring IoC、AOP、事务管理等特性
2. **灵活的 URL 映射**：支持 RESTful 风格和传统 URL 映射
3. **强大的数据绑定**：自动将请求参数绑定到 Java 对象
4. **多视图技术支持**：JSP、Thymeleaf、FreeMarker 等
5. **清晰的职责分离**：控制器、服务、数据访问层各司其职
6. **易于测试**：支持 Mock 测试和集成测试

### 历史背景

Spring MVC 诞生于 2003 年，作为 Spring Framework 1.0 的一部分发布。在 Struts、JSF 等框架盛行的年代，Spring MVC 以其简洁的设计和与 Spring 核心的无缝集成脱颖而出。随着 Spring Boot 的出现，Spring MVC 的配置更加简化，成为 Java Web 开发的首选框架。

---

## 核心原理

### DispatcherServlet 工作流程

DispatcherServlet 是 Spring MVC 的核心，它充当前端控制器（Front Controller），负责协调整个请求处理流程。

```
                           HTTP 请求
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      DispatcherServlet                        │
│                                                               │
│  1. 接收请求                                                  │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ HandlerMapping  │ ◄── 查找处理器（Controller + Method）    │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ HandlerAdapter  │ ◄── 调用处理器方法                       │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │   Controller    │ ◄── 执行业务逻辑，返回 ModelAndView      │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ ViewResolver    │ ◄── 解析视图名称为具体视图对象           │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │     View        │ ◄── 渲染视图，生成响应                   │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                          HTTP 响应
```

### 详细执行流程

1. **请求到达 DispatcherServlet**
   - 所有请求首先由 DispatcherServlet 接收
   - 它是整个 Spring MVC 的入口点

2. **HandlerMapping 查找处理器**
   - DispatcherServlet 调用 HandlerMapping 查找对应的 Handler
   - 返回 HandlerExecutionChain（包含 Handler 和拦截器）

3. **HandlerAdapter 调用处理器**
   - 根据 Handler 类型选择合适的 HandlerAdapter
   - 执行参数解析、数据绑定、验证等操作
   - 调用 Controller 方法

4. **Controller 处理请求**
   - 执行业务逻辑
   - 返回 ModelAndView 或直接返回数据（@ResponseBody）

5. **ViewResolver 解析视图**
   - 将逻辑视图名解析为具体的 View 对象
   - 支持多种视图技术

6. **View 渲染响应**
   - 将 Model 数据填充到视图模板
   - 生成最终的 HTTP 响应

### 核心组件解析

```java
// HandlerMapping - 请求映射
public interface HandlerMapping {
    HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception;
}

// HandlerAdapter - 处理器适配
public interface HandlerAdapter {
    boolean supports(Object handler);
    ModelAndView handle(HttpServletRequest request,
                       HttpServletResponse response,
                       Object handler) throws Exception;
}

// ViewResolver - 视图解析
public interface ViewResolver {
    View resolveViewName(String viewName, Locale locale) throws Exception;
}

// View - 视图渲染
public interface View {
    void render(Map<String, ?> model,
               HttpServletRequest request,
               HttpServletResponse response) throws Exception;
}
```

---

## 核心要点

### @Controller 和 @RestController

`@Controller` 用于标识一个类为 Spring MVC 控制器：

```java
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("message", "欢迎访问首页");
        return "home";  // 返回视图名称
    }
}
```

`@RestController` 是 `@Controller` + `@ResponseBody` 的组合，专门用于构建 RESTful API：

```java
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class ApiController {

    @GetMapping("/api/greeting")
    public Map<String, String> greeting() {
        return Map.of("message", "Hello, World!");  // 直接返回 JSON
    }
}
```

### @RequestMapping 及其变体

`@RequestMapping` 是最通用的请求映射注解：

```java
@Controller
@RequestMapping("/users")  // 类级别映射
public class UserController {

    // 完整形式
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    public String list() {
        return "user/list";
    }

    // 简化形式 - 推荐使用专用注解
    @GetMapping("/{id}")
    public String detail(@PathVariable Long id) {
        return "user/detail";
    }

    @PostMapping
    public String create(@RequestBody User user) {
        return "redirect:/users";
    }

    @PutMapping("/{id}")
    public String update(@PathVariable Long id, @RequestBody User user) {
        return "redirect:/users/" + id;
    }

    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        return "redirect:/users";
    }

    @PatchMapping("/{id}")
    public String partialUpdate(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        return "redirect:/users/" + id;
    }
}
```

### @PathVariable - 路径变量

从 URL 路径中提取变量：

```java
@RestController
@RequestMapping("/api")
public class PathVariableController {

    // 基本用法
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // 多个路径变量
    @GetMapping("/users/{userId}/orders/{orderId}")
    public Order getOrder(@PathVariable Long userId,
                          @PathVariable Long orderId) {
        return orderService.findByUserAndId(userId, orderId);
    }

    // 指定变量名（当参数名与路径变量名不同时）
    @GetMapping("/items/{item-id}")
    public Item getItem(@PathVariable("item-id") Long itemId) {
        return itemService.findById(itemId);
    }

    // 正则表达式约束
    @GetMapping("/files/{filename:.+}")
    public Resource getFile(@PathVariable String filename) {
        return fileService.load(filename);
    }

    // 可选路径变量（Spring 4.3.3+）
    @GetMapping({"/books", "/books/{id}"})
    public Object getBooks(@PathVariable(required = false) Long id) {
        if (id == null) {
            return bookService.findAll();
        }
        return bookService.findById(id);
    }
}
```

### @RequestParam - 请求参数

获取查询参数或表单参数：

```java
@RestController
@RequestMapping("/api")
public class RequestParamController {

    // 基本用法
    @GetMapping("/search")
    public List<Product> search(@RequestParam String keyword) {
        return productService.search(keyword);
    }

    // 指定参数名
    @GetMapping("/filter")
    public List<Product> filter(@RequestParam("q") String query) {
        return productService.filter(query);
    }

    // 可选参数与默认值
    @GetMapping("/products")
    public Page<Product> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        return productService.findAll(page, size, category);
    }

    // 多值参数
    @GetMapping("/multi")
    public List<Product> multiFilter(@RequestParam List<String> ids) {
        // GET /multi?ids=1&ids=2&ids=3
        return productService.findByIds(ids);
    }

    // 接收所有参数为 Map
    @GetMapping("/all-params")
    public Map<String, String> allParams(@RequestParam Map<String, String> params) {
        return params;
    }
}
```

### @RequestBody - 请求体绑定

将 HTTP 请求体绑定到 Java 对象：

```java
@RestController
@RequestMapping("/api/users")
public class RequestBodyController {

    // 绑定到对象
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.create(user);
    }

    // 结合验证
    @PostMapping("/validated")
    public User createValidatedUser(@Valid @RequestBody User user) {
        return userService.create(user);
    }

    // 绑定到 Map
    @PostMapping("/dynamic")
    public Map<String, Object> handleDynamic(@RequestBody Map<String, Object> payload) {
        return payload;
    }

    // 绑定到 List
    @PostMapping("/batch")
    public List<User> batchCreate(@RequestBody List<User> users) {
        return userService.batchCreate(users);
    }
}
```

### @ResponseBody - 响应体

将返回值直接写入 HTTP 响应体：

```java
@Controller
@RequestMapping("/api")
public class ResponseBodyController {

    @GetMapping("/user/{id}")
    @ResponseBody  // 返回 JSON 而非视图
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // ResponseEntity 提供更多控制
    @GetMapping("/user-entity/{id}")
    public ResponseEntity<User> getUserEntity(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .header("X-Custom-Header", "value")
                .body(user);
    }
}
```

### Model 和 ModelAndView

用于向视图传递数据：

```java
@Controller
public class ModelController {

    // 使用 Model
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("username", "张三");
        model.addAttribute("stats", getStats());
        return "dashboard";
    }

    // 使用 ModelMap
    @GetMapping("/profile")
    public String profile(ModelMap modelMap) {
        modelMap.addAttribute("user", getCurrentUser());
        return "profile";
    }

    // 使用 ModelAndView
    @GetMapping("/report")
    public ModelAndView report() {
        ModelAndView mav = new ModelAndView("report");
        mav.addObject("data", getReportData());
        mav.addObject("generatedAt", LocalDateTime.now());
        return mav;
    }

    // @ModelAttribute 方法 - 为所有请求添加公共数据
    @ModelAttribute("categories")
    public List<Category> populateCategories() {
        return categoryService.findAll();
    }
}
```

### 视图解析器（View Resolver）

配置视图解析器：

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Thymeleaf 视图解析器（Spring Boot 自动配置）
    @Bean
    public SpringResourceTemplateResolver templateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:/templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);  // 开发时禁用缓存
        return resolver;
    }

    // JSP 视图解析器
    @Bean
    public InternalResourceViewResolver jspViewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        resolver.setViewClass(JstlView.class);
        resolver.setOrder(2);  // 优先级
        return resolver;
    }

    // JSON 视图解析器（用于返回 JSON）
    @Bean
    public MappingJackson2JsonView jsonView() {
        return new MappingJackson2JsonView();
    }
}
```

### 数据绑定与类型转换

Spring MVC 自动进行数据绑定：

```java
// 实体类
public class User {
    private Long id;
    private String name;
    private String email;
    private LocalDate birthday;
    private Address address;  // 嵌套对象

    // getters and setters
}

public class Address {
    private String city;
    private String street;
    private String zipCode;

    // getters and setters
}

@Controller
@RequestMapping("/users")
public class UserFormController {

    // 表单数据自动绑定到对象
    @PostMapping
    public String createUser(User user) {
        // 请求参数: name=张三&email=test@example.com&birthday=2000-01-01
        //          &address.city=北京&address.street=中关村&address.zipCode=100000
        userService.save(user);
        return "redirect:/users";
    }

    // 自定义数据绑定
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        // 日期格式转换
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        dateFormat.setLenient(false);
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, true));

        // 字符串去除空白
        binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));

        // 禁止绑定敏感字段
        binder.setDisallowedFields("id", "password");
    }
}
```

### 自定义类型转换器

```java
// 自定义 Converter
@Component
public class StringToLocalDateConverter implements Converter<String, LocalDate> {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public LocalDate convert(String source) {
        if (source == null || source.isEmpty()) {
            return null;
        }
        return LocalDate.parse(source, FORMATTER);
    }
}

// 自定义 Formatter（支持 Locale）
@Component
public class LocalDateFormatter implements Formatter<LocalDate> {

    @Override
    public LocalDate parse(String text, Locale locale) throws ParseException {
        DateTimeFormatter formatter = DateTimeFormatter
                .ofLocalizedDate(FormatStyle.SHORT)
                .withLocale(locale);
        return LocalDate.parse(text, formatter);
    }

    @Override
    public String print(LocalDate object, Locale locale) {
        DateTimeFormatter formatter = DateTimeFormatter
                .ofLocalizedDate(FormatStyle.SHORT)
                .withLocale(locale);
        return formatter.format(object);
    }
}

// 注册转换器
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new StringToLocalDateConverter());
        registry.addFormatter(new LocalDateFormatter());
    }
}
```

---

## 代码示例

### 完整的 RESTful API 控制器

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import com.example.demo.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 获取用户列表（分页）
     * GET /api/v1/users?page=0&size=10&sort=name,asc
     */
    @GetMapping
    public ResponseEntity<Page<User>> getUsers(Pageable pageable) {
        Page<User> users = userService.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * 搜索用户
     * GET /api/v1/users/search?keyword=张&status=ACTIVE
     */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam String keyword,
            @RequestParam(required = false) String status) {
        List<User> users = userService.search(keyword, status);
        return ResponseEntity.ok(users);
    }

    /**
     * 获取单个用户
     * GET /api/v1/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return ResponseEntity.ok(user);
    }

    /**
     * 创建用户
     * POST /api/v1/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User savedUser = userService.save(user);

        // 构建资源 URI
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedUser.getId())
                .toUri();

        return ResponseEntity.created(location).body(savedUser);
    }

    /**
     * 更新用户（全量更新）
     * PUT /api/v1/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody User user) {
        if (!userService.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        user.setId(id);
        User updatedUser = userService.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 部分更新用户
     * PATCH /api/v1/users/{id}
     */
    @PatchMapping("/{id}")
    public ResponseEntity<User> partialUpdateUser(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        User updatedUser = userService.partialUpdate(user, updates);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * 删除用户
     * DELETE /api/v1/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userService.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        userService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 批量删除用户
     * DELETE /api/v1/users?ids=1,2,3
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteUsers(@RequestParam List<Long> ids) {
        userService.deleteByIds(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * 获取用户的订单列表
     * GET /api/v1/users/{userId}/orders
     */
    @GetMapping("/{userId}/orders")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {
        List<Order> orders = userService.findOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }
}
```

### 表单处理控制器

```java
package com.example.demo.controller;

import com.example.demo.dto.RegistrationForm;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/register")
public class RegistrationController {

    private final UserService userService;

    public RegistrationController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 显示注册表单
     */
    @GetMapping
    public String showRegistrationForm(Model model) {
        model.addAttribute("registrationForm", new RegistrationForm());
        return "register";
    }

    /**
     * 处理注册请求
     */
    @PostMapping
    public String processRegistration(
            @Valid @ModelAttribute("registrationForm") RegistrationForm form,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes) {

        // 验证失败，返回表单页面
        if (bindingResult.hasErrors()) {
            return "register";
        }

        // 检查邮箱是否已存在
        if (userService.emailExists(form.getEmail())) {
            bindingResult.rejectValue("email", "error.email", "该邮箱已被注册");
            return "register";
        }

        // 创建用户
        userService.register(form);

        // 添加成功消息
        redirectAttributes.addFlashAttribute("message", "注册成功，请登录！");

        return "redirect:/login";
    }
}
```

### 数据验证 DTO

```java
package com.example.demo.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class RegistrationForm {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20之间")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 100, message = "密码长度至少8位")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
             message = "密码必须包含大小写字母和数字")
    private String password;

    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "请输入有效的邮箱地址")
    private String email;

    @Past(message = "生日必须是过去的日期")
    private LocalDate birthday;

    @AssertTrue(message = "必须同意服务条款")
    private boolean agreeTerms;

    // 自定义验证：密码确认
    @AssertTrue(message = "两次输入的密码不一致")
    public boolean isPasswordConfirmed() {
        return password != null && password.equals(confirmPassword);
    }

    // getters and setters
}
```

### 全局异常处理

```java
package com.example.demo.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理资源未找到异常
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getDescription(false)
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * 处理验证异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation Failed");
        response.put("errors", errors);

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * 处理业务异常
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex, WebRequest request) {

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Business Error",
                ex.getMessage(),
                request.getDescription(false)
        );

        return ResponseEntity.badRequest().body(error);
    }

    /**
     * 处理所有未捕获的异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(
            Exception ex, WebRequest request) {

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "服务器内部错误，请稍后重试",
                request.getDescription(false)
        );

        // 记录详细错误日志
        log.error("Unexpected error occurred", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

// 错误响应 DTO
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {}
```

### 拦截器实现

```java
package com.example.demo.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RequestLoggingInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {
        // 记录请求开始时间
        request.setAttribute("startTime", System.currentTimeMillis());

        log.info("Request: {} {} from {}",
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr());

        return true;  // 返回 true 继续处理，false 中断请求
    }

    @Override
    public void postHandle(HttpServletRequest request,
                          HttpServletResponse response,
                          Object handler,
                          ModelAndView modelAndView) throws Exception {
        // 在控制器方法执行后、视图渲染前执行
        if (modelAndView != null) {
            log.info("View: {}", modelAndView.getViewName());
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                               HttpServletResponse response,
                               Object handler,
                               Exception ex) throws Exception {
        // 在整个请求完成后执行
        long startTime = (Long) request.getAttribute("startTime");
        long duration = System.currentTimeMillis() - startTime;

        log.info("Response: {} {} - {} - {}ms",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                duration);

        if (ex != null) {
            log.error("Request failed with exception", ex);
        }
    }
}

// 注册拦截器
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final RequestLoggingInterceptor loggingInterceptor;
    private final AuthenticationInterceptor authInterceptor;

    public WebConfig(RequestLoggingInterceptor loggingInterceptor,
                     AuthenticationInterceptor authInterceptor) {
        this.loggingInterceptor = loggingInterceptor;
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 全局日志拦截器
        registry.addInterceptor(loggingInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/static/**", "/error");

        // 认证拦截器
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/public/**", "/api/auth/**");
    }
}
```

### 文件上传处理

```java
package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * 单文件上传
     */
    @PostMapping("/upload")
    public ResponseEntity<FileResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("请选择要上传的文件");
        }

        // 生成唯一文件名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String newFilename = UUID.randomUUID().toString() + extension;

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/")
                    .path(newFilename)
                    .toUriString();

            return ResponseEntity.ok(new FileResponse(newFilename, fileUrl, file.getSize()));

        } catch (IOException e) {
            throw new BusinessException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 多文件上传
     */
    @PostMapping("/upload/multiple")
    public ResponseEntity<List<FileResponse>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files) {

        List<FileResponse> responses = new ArrayList<>();

        for (MultipartFile file : files) {
            ResponseEntity<FileResponse> response = uploadFile(file);
            responses.add(response.getBody());
        }

        return ResponseEntity.ok(responses);
    }

    /**
     * 文件下载
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new ResourceNotFoundException("文件不存在: " + filename);
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            throw new BusinessException("文件路径无效");
        } catch (IOException e) {
            throw new BusinessException("无法读取文件");
        }
    }
}

record FileResponse(String filename, String url, long size) {}
```

---

## 最佳实践

### 控制器设计原则

```java
// 好的做法：控制器保持简洁，业务逻辑放在 Service 层
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    // 构造器注入（推荐）
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        // 控制器只负责：接收请求、调用服务、返回响应
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}

// 避免：在控制器中写业务逻辑
@RestController
public class BadOrderController {

    @Autowired  // 不推荐字段注入
    private OrderRepository orderRepository;

    @PostMapping("/orders")
    public Order createOrder(@RequestBody Order order) {
        // 不好：业务逻辑写在控制器里
        order.setOrderNo(generateOrderNo());
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        // 不好：直接操作 Repository
        return orderRepository.save(order);
    }
}
```

### API 版本控制

```java
// 方式一：URL 路径版本控制（推荐）
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    // v1 版本 API
}

@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    // v2 版本 API
}

// 方式二：请求头版本控制
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(headers = "X-API-VERSION=1")
    public List<UserV1> getUsersV1() {
        // v1 版本
    }

    @GetMapping(headers = "X-API-VERSION=2")
    public List<UserV2> getUsersV2() {
        // v2 版本
    }
}

// 方式三：Accept 头版本控制
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(produces = "application/vnd.company.app-v1+json")
    public List<UserV1> getUsersV1() {
        // v1 版本
    }

    @GetMapping(produces = "application/vnd.company.app-v2+json")
    public List<UserV2> getUsersV2() {
        // v2 版本
    }
}
```

### 统一响应格式

```java
// 统一响应包装类
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    private ApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data);
    }

    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }

    // getters
}

// 控制器使用
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        return ApiResponse.success(user);
    }

    @PostMapping
    public ApiResponse<User> createUser(@Valid @RequestBody User user) {
        User saved = userService.save(user);
        return ApiResponse.success("用户创建成功", saved);
    }
}
```

### 请求参数校验

```java
// DTO 类验证
public class CreateUserRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 50, message = "用户名长度2-50字符")
    private String username;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotNull(message = "年龄不能为空")
    @Min(value = 0, message = "年龄不能为负数")
    @Max(value = 150, message = "年龄超出范围")
    private Integer age;

    @NotEmpty(message = "角色不能为空")
    private List<String> roles;

    // getters and setters
}

// 自定义验证注解
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
public @interface PhoneNumber {
    String message() default "手机号格式不正确";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PhoneNumberValidator implements ConstraintValidator<PhoneNumber, String> {

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^1[3-9]\\d{9}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;  // 空值由 @NotBlank 处理
        }
        return PHONE_PATTERN.matcher(value).matches();
    }
}

// 使用自定义注解
public class ContactInfo {

    @PhoneNumber
    private String phone;
}
```

### 分层架构

```
src/main/java/com/example/demo/
├── controller/          # 控制器层：处理 HTTP 请求
│   ├── UserController.java
│   └── OrderController.java
├── service/             # 服务层：业务逻辑
│   ├── UserService.java
│   ├── UserServiceImpl.java
│   └── OrderService.java
├── repository/          # 数据访问层
│   ├── UserRepository.java
│   └── OrderRepository.java
├── entity/              # 实体类
│   ├── User.java
│   └── Order.java
├── dto/                 # 数据传输对象
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── ApiResponse.java
├── mapper/              # 对象映射
│   └── UserMapper.java
├── exception/           # 异常处理
│   ├── GlobalExceptionHandler.java
│   ├── BusinessException.java
│   └── ResourceNotFoundException.java
├── config/              # 配置类
│   ├── WebConfig.java
│   └── SecurityConfig.java
├── interceptor/         # 拦截器
│   └── AuthInterceptor.java
├── filter/              # 过滤器
│   └── CorsFilter.java
└── util/                # 工具类
    └── DateUtils.java
```

---

## 常见陷阱

### 循环依赖

```java
// 错误：循环依赖
@Service
public class UserService {
    @Autowired
    private OrderService orderService;  // UserService -> OrderService
}

@Service
public class OrderService {
    @Autowired
    private UserService userService;  // OrderService -> UserService（循环！）
}

// 解决方案一：重构设计，提取公共服务
@Service
public class UserOrderService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OrderRepository orderRepository;

    // 处理用户和订单相关的业务
}

// 解决方案二：使用 @Lazy 延迟加载
@Service
public class OrderService {
    @Lazy
    @Autowired
    private UserService userService;
}

// 解决方案三：使用 Setter 注入
@Service
public class OrderService {
    private UserService userService;

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }
}
```

### @PathVariable 和 @RequestParam 混淆

```java
// URL: /users/123?status=active

// 错误用法
@GetMapping("/users/{id}")
public User getUser(@RequestParam Long id) {  // 错！这里获取的是查询参数
    return userService.findById(id);
}

// 正确用法
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id,      // 路径变量 123
                    @RequestParam String status) {  // 查询参数 active
    return userService.findByIdAndStatus(id, status);
}
```

### 忘记处理空值

```java
// 错误：可能抛出 NullPointerException
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userService.findById(id);  // 如果返回 null，客户端收到空响应
}

// 正确：使用 Optional 或抛出异常
@GetMapping("/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
    return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("用户不存在"));
}
```

### 事务注解失效

```java
// 错误：同一类内方法调用，事务不生效
@Service
public class UserService {

    public void createUserWithOrders(User user, List<Order> orders) {
        createUser(user);
        createOrders(orders);  // 同类调用，@Transactional 不生效
    }

    @Transactional
    public void createUser(User user) {
        userRepository.save(user);
    }

    @Transactional
    public void createOrders(List<Order> orders) {
        orderRepository.saveAll(orders);
    }
}

// 正确：将事务放在公开方法上，或使用 AOP 自调用
@Service
public class UserService {

    @Transactional
    public void createUserWithOrders(User user, List<Order> orders) {
        userRepository.save(user);
        orderRepository.saveAll(orders);
    }
}
```

### 日期格式处理

```java
// 问题：JSON 日期格式不正确

// 解决方案一：全局配置
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));
        return mapper;
    }
}

// 解决方案二：字段级别配置
public class User {

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;
}

// 解决方案三：application.yml 配置
// spring:
//   jackson:
//     date-format: yyyy-MM-dd HH:mm:ss
//     time-zone: GMT+8
//     serialization:
//       write-dates-as-timestamps: false
```

### 响应状态码使用不当

```java
// 错误：所有响应都返回 200
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userService.save(user);  // 创建成功应该返回 201
}

@DeleteMapping("/users/{id}")
public String deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return "删除成功";  // 删除成功应该返回 204 No Content
}

// 正确：使用恰当的状态码
@PostMapping("/users")
public ResponseEntity<User> createUser(@RequestBody User user) {
    User saved = userService.save(user);
    return ResponseEntity.status(HttpStatus.CREATED).body(saved);  // 201
}

@DeleteMapping("/users/{id}")
public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return ResponseEntity.noContent().build();  // 204
}
```

### 安全漏洞

```java
// 错误：直接使用用户输入构建路径（路径遍历攻击）
@GetMapping("/files")
public Resource getFile(@RequestParam String filename) {
    // 危险！用户可以输入 "../../../etc/passwd"
    Path path = Paths.get("/uploads/" + filename);
    return new FileSystemResource(path);
}

// 正确：验证和规范化路径
@GetMapping("/files")
public Resource getFile(@RequestParam String filename) {
    Path basePath = Paths.get("/uploads").toAbsolutePath().normalize();
    Path filePath = basePath.resolve(filename).normalize();

    // 确保文件在允许的目录内
    if (!filePath.startsWith(basePath)) {
        throw new SecurityException("访问被拒绝");
    }

    return new FileSystemResource(filePath);
}
```

---

## 性能考量

### 异步处理

```java
@RestController
@RequestMapping("/api")
public class AsyncController {

    @Autowired
    private AsyncTaskService asyncTaskService;

    /**
     * 使用 Callable 进行异步处理
     */
    @GetMapping("/async/callable")
    public Callable<String> asyncCallable() {
        return () -> {
            Thread.sleep(2000);  // 模拟耗时操作
            return "Callable 结果";
        };
    }

    /**
     * 使用 DeferredResult 进行异步处理
     */
    @GetMapping("/async/deferred")
    public DeferredResult<String> asyncDeferred() {
        DeferredResult<String> result = new DeferredResult<>(30000L);  // 30秒超时

        asyncTaskService.executeAsync()
                .thenAccept(result::setResult)
                .exceptionally(ex -> {
                    result.setErrorResult(ex);
                    return null;
                });

        return result;
    }

    /**
     * 使用 CompletableFuture 进行异步处理
     */
    @GetMapping("/async/completable")
    public CompletableFuture<String> asyncCompletable() {
        return CompletableFuture.supplyAsync(() -> {
            // 异步执行
            return "CompletableFuture 结果";
        });
    }

    /**
     * 流式响应（Server-Sent Events）
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(60000L);  // 60秒超时

        asyncTaskService.streamData(emitter);

        return emitter;
    }
}

@Service
public class AsyncTaskService {

    @Async
    public CompletableFuture<String> executeAsync() {
        // 异步执行业务逻辑
        return CompletableFuture.completedFuture("完成");
    }

    @Async
    public void streamData(SseEmitter emitter) {
        try {
            for (int i = 0; i < 10; i++) {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data("数据 " + i));
                Thread.sleep(1000);
            }
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }
}
```

### 缓存优化

```java
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }
}

@Service
public class UserService {

    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    @CachePut(value = "users", key = "#user.id")
    public User save(User user) {
        return userRepository.save(user);
    }

    @CacheEvict(value = "users", key = "#id")
    public void deleteById(Long id) {
        userRepository.deleteById(id);
    }

    @CacheEvict(value = "users", allEntries = true)
    public void clearAllCache() {
        // 清除所有缓存
    }
}

// HTTP 缓存控制
@RestController
public class CacheController {

    @GetMapping("/api/data")
    public ResponseEntity<Data> getData() {
        Data data = dataService.getData();

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                .eTag(String.valueOf(data.hashCode()))
                .body(data);
    }
}
```

### 响应压缩

```yaml
# application.yml
server:
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024  # 超过 1KB 才压缩
```

### 连接池配置

```yaml
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000
```

### JSON 序列化优化

```java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // 忽略未知属性
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // 空对象不抛异常
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        // 不序列化 null 值
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // 使用更高效的日期序列化
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
}
```

---

## 实战场景

### 场景一：用户认证系统

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Authentication authentication = authService.authenticate(
                request.getUsername(),
                request.getPassword()
        );

        String token = tokenProvider.generateToken(authentication);
        String refreshToken = tokenProvider.generateRefreshToken(authentication);

        return ResponseEntity.ok(new AuthResponse(token, refreshToken, "Bearer"));
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshTokenRequest request) {
        String newToken = tokenProvider.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(new AuthResponse(newToken, request.getRefreshToken(), "Bearer"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String token) {
        authService.logout(token);
        return ResponseEntity.ok().build();
    }
}
```

### 场景二：分页查询

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    /**
     * 分页查询商品
     * GET /api/products?page=0&size=10&sort=price,desc&sort=name,asc
     */
    @GetMapping
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        ProductSearchCriteria criteria = ProductSearchCriteria.builder()
                .keyword(keyword)
                .category(category)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .build();

        Page<Product> products = productService.search(criteria, pageable);

        return ResponseEntity.ok(products);
    }

    /**
     * 自定义分页响应
     */
    @GetMapping("/custom-page")
    public ResponseEntity<PageResponse<ProductDTO>> getProductsCustom(Pageable pageable) {
        Page<Product> page = productService.findAll(pageable);

        List<ProductDTO> content = page.getContent().stream()
                .map(this::toDTO)
                .toList();

        PageResponse<ProductDTO> response = new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );

        return ResponseEntity.ok(response);
    }
}

// 分页响应 DTO
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {}
```

### 场景三：API 限流

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;

    public RateLimitInterceptor() {
        // 每秒 100 个请求
        this.rateLimiter = RateLimiter.create(100);
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {
        if (!rateLimiter.tryAcquire()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"请求过于频繁，请稍后重试\"}");
            return false;
        }
        return true;
    }
}

// 基于用户的限流
@Aspect
@Component
public class UserRateLimitAspect {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();

    @Around("@annotation(rateLimit)")
    public Object rateLimit(ProceedingJoinPoint point, RateLimit rateLimit) throws Throwable {
        String key = getKey(point, rateLimit);

        RateLimiter limiter = limiters.computeIfAbsent(key,
                k -> RateLimiter.create(rateLimit.value()));

        if (!limiter.tryAcquire(rateLimit.timeout(), TimeUnit.MILLISECONDS)) {
            throw new RateLimitExceededException("请求过于频繁");
        }

        return point.proceed();
    }
}

// 自定义限流注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    double value() default 10;  // 每秒请求数
    long timeout() default 500;  // 等待超时（毫秒）
}
```

---

## 面试要点

### Spring MVC 的工作原理是什么？

**答案要点**：
- DispatcherServlet 作为前端控制器接收所有请求
- HandlerMapping 根据 URL 找到对应的 Controller 和方法
- HandlerAdapter 调用 Controller 方法处理请求
- ViewResolver 解析视图名称为具体视图
- View 渲染响应返回给客户端

### @Controller 和 @RestController 的区别？

**答案要点**：
- `@RestController` = `@Controller` + `@ResponseBody`
- `@Controller` 方法返回视图名称，需要视图解析器
- `@RestController` 方法返回值直接写入响应体（JSON/XML）

### @RequestMapping 的属性有哪些？

**答案要点**：
```java
@RequestMapping(
    value = "/path",           // URL 路径
    method = RequestMethod.GET, // HTTP 方法
    params = "id",              // 请求参数条件
    headers = "content-type=application/json", // 请求头条件
    consumes = "application/json", // 请求内容类型
    produces = "application/json"  // 响应内容类型
)
```

### 如何处理 Spring MVC 中的异常？

**答案要点**：
- `@ExceptionHandler`：在控制器内处理特定异常
- `@ControllerAdvice` + `@ExceptionHandler`：全局异常处理
- 实现 `HandlerExceptionResolver` 接口
- 使用 `@ResponseStatus` 注解异常类

### Spring MVC 拦截器和 Servlet 过滤器的区别？

**答案要点**：
| 特性 | 拦截器 | 过滤器 |
|------|--------|--------|
| 规范 | Spring MVC | Servlet |
| 执行时机 | DispatcherServlet 之后 | DispatcherServlet 之前 |
| 访问范围 | 可以访问 Spring 上下文 | 不能直接访问 |
| 粒度 | 可以精确到方法 | 只能精确到 URL |
| 异常处理 | 可以统一处理 | 需要单独处理 |

### 如何实现 Spring MVC 的文件上传？

**答案要点**：
- 配置 `MultipartResolver`
- 使用 `@RequestParam("file") MultipartFile file` 接收文件
- 处理文件大小限制和类型校验
- 安全考虑：文件名过滤、存储路径

### @PathVariable 和 @RequestParam 的区别？

**答案要点**：
- `@PathVariable`：从 URL 路径提取值（`/users/{id}`）
- `@RequestParam`：从查询字符串提取值（`/users?id=1`）
- `@PathVariable` 通常用于 RESTful 资源标识
- `@RequestParam` 用于可选参数和过滤条件

### Spring MVC 如何实现数据验证？

**答案要点**：
- 使用 JSR-303/JSR-380 注解（`@NotNull`, `@Size`, `@Email` 等）
- 在方法参数前使用 `@Valid` 或 `@Validated`
- 使用 `BindingResult` 获取验证结果
- 自定义验证器实现 `ConstraintValidator`

### 什么是 RESTful API？Spring MVC 如何支持？

**答案要点**：
- REST（表述性状态转移）是一种架构风格
- 使用 HTTP 动词表示操作：GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）
- URL 表示资源：`/users/{id}`
- Spring MVC 提供 `@GetMapping`, `@PostMapping` 等注解
- 使用 `@RestController` 返回 JSON/XML

### 如何优化 Spring MVC 应用性能？

**答案要点**：
- 启用响应压缩（Gzip）
- 使用缓存（Spring Cache, HTTP 缓存）
- 异步处理耗时请求（`@Async`, `DeferredResult`）
- 数据库连接池优化
- JSON 序列化优化
- 静态资源 CDN

---

## 延伸阅读

### 官方文档

- [Spring MVC 官方文档](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring Boot Web 文档](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html)
- [Spring Validation 文档](https://docs.spring.io/spring-framework/reference/core/validation.html)

### 推荐书籍

- 《Spring 实战》（第 5 版）- Craig Walls
- 《Spring Boot 编程思想》- 小马哥
- 《精通 Spring 4.x》- 陈雄华

### 进阶主题

- **Spring WebFlux**：响应式 Web 框架
- **GraphQL with Spring**：GraphQL API 开发
- **Spring HATEOAS**：超媒体 API
- **API Gateway**：微服务网关集成
- **OpenAPI/Swagger**：API 文档生成

### 相关技术栈

- **模板引擎**：Thymeleaf, FreeMarker
- **安全框架**：Spring Security, JWT
- **API 文档**：SpringDoc OpenAPI, Swagger
- **测试框架**：MockMvc, RestAssured
- **监控**：Spring Boot Actuator, Micrometer
