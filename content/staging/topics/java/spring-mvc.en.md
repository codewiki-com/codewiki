---
title: Spring MVC In-Depth Guide
description: Master the core concepts of Spring MVC framework, request handling mechanisms, data binding, and view resolution
track: java
section: spring-tooling
difficulty: intermediate
tags:
  - Java
  - Spring MVC
  - Spring
  - Web Framework
  - Controller
  - REST
  - DispatcherServlet
status: imported
origin: old/src/content/docs/java/spring-mvc.en.md
divergence: 0.174
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Java
  subcategory: ""
  order: 13
  lastUpdated: 2026-01-07
---

## Concepts Explained

Spring MVC is the Web module in the Spring Framework, a lightweight, request-driven Web framework based on Java that implements the MVC design pattern. Through a set of annotations, it transforms POJOs into request handlers without implementing any interfaces.

### What is the MVC Pattern?

MVC (Model-View-Controller) is a software architecture pattern that divides an application into three core components:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DispatcherServlet                         │
│                   (Front Controller)                         │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
│    Controller     │ │    Model      │ │      View         │
│ (Handle Requests) │ │ (Business Data)│ │  (Render Views)  │
└───────────────────┘ └───────────────┘ └───────────────────┘
```

- **Model**: Encapsulates application data and business logic
- **View**: Responsible for data presentation and user interface rendering
- **Controller**: Handles user requests and coordinates Model and View

### Why Choose Spring MVC?

Spring MVC offers the following advantages over other Java Web frameworks:

1. **Deep Integration with Spring Ecosystem**: Seamless use of Spring IoC, AOP, transaction management, and other features
2. **Flexible URL Mapping**: Supports RESTful style and traditional URL mapping
3. **Powerful Data Binding**: Automatically binds request parameters to Java objects
4. **Multiple View Technology Support**: JSP, Thymeleaf, FreeMarker, etc.
5. **Clear Separation of Concerns**: Controllers, services, and data access layers each have their own responsibilities
6. **Easy to Test**: Supports mock testing and integration testing

### Historical Background

Spring MVC was born in 2003 as part of Spring Framework 1.0 release. During the era when Struts and JSF were prevalent, Spring MVC stood out with its simple design and seamless integration with the Spring core. As Spring Boot emerged, Spring MVC configuration became even simpler, making it the go-to framework for Java Web development.

---

## Core Principles

### DispatcherServlet Workflow

DispatcherServlet is the core of Spring MVC, acting as the Front Controller, responsible for coordinating the entire request processing flow.

```
                           HTTP Request
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                      DispatcherServlet                        │
│                                                               │
│  1. Receive Request                                           │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ HandlerMapping  │ ◄── Find Handler (Controller + Method)  │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ HandlerAdapter  │ ◄── Invoke Handler Method               │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │   Controller    │ ◄── Execute Business Logic, Return MAV  │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │ ViewResolver    │ ◄── Resolve View Name to View Object   │
│  └─────────────────┘                                         │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────┐                                         │
│  │     View        │ ◄── Render View, Generate Response      │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                          HTTP Response
```

### Detailed Execution Flow

1. **Request Arrives at DispatcherServlet**
   - All requests are first received by DispatcherServlet
   - It serves as the entry point for the entire Spring MVC

2. **HandlerMapping Finds the Handler**
   - DispatcherServlet calls HandlerMapping to find the corresponding Handler
   - Returns HandlerExecutionChain (containing Handler and interceptors)

3. **HandlerAdapter Invokes the Handler**
   - Selects the appropriate HandlerAdapter based on Handler type
   - Performs parameter parsing, data binding, and validation
   - Invokes the Controller method

4. **Controller Processes the Request**
   - Executes business logic
   - Returns ModelAndView or data directly (@ResponseBody)

5. **ViewResolver Resolves the View**
   - Resolves logical view names to concrete View objects
   - Supports multiple view technologies

6. **View Renders the Response**
   - Fills Model data into the view template
   - Generates the final HTTP response

### Core Component Analysis

```java
// HandlerMapping - Request Mapping
public interface HandlerMapping {
    HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception;
}

// HandlerAdapter - Handler Adaptation
public interface HandlerAdapter {
    boolean supports(Object handler);
    ModelAndView handle(HttpServletRequest request,
                       HttpServletResponse response,
                       Object handler) throws Exception;
}

// ViewResolver - View Resolution
public interface ViewResolver {
    View resolveViewName(String viewName, Locale locale) throws Exception;
}

// View - View Rendering
public interface View {
    void render(Map<String, ?> model,
               HttpServletRequest request,
               HttpServletResponse response) throws Exception;
}
```

---

## Key Concepts

### @Controller and @RestController

`@Controller` is used to identify a class as a Spring MVC controller:

```java
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("message", "Welcome to Home");
        return "home";  // Return view name
    }
}
```

`@RestController` is a combination of `@Controller` + `@ResponseBody`, specifically designed for building RESTful APIs:

```java
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class ApiController {

    @GetMapping("/api/greeting")
    public Map<String, String> greeting() {
        return Map.of("message", "Hello, World!");  // Return JSON directly
    }
}
```

### @RequestMapping and Its Variants

`@RequestMapping` is the most versatile request mapping annotation:

```java
@Controller
@RequestMapping("/users")  // Class-level mapping
public class UserController {

    // Full form
    @RequestMapping(value = "/list", method = RequestMethod.GET)
    public String list() {
        return "user/list";
    }

    // Simplified form - recommended to use specialized annotations
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

### @PathVariable - Path Variables

Extract variables from URL paths:

```java
@RestController
@RequestMapping("/api")
public class PathVariableController {

    // Basic usage
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // Multiple path variables
    @GetMapping("/users/{userId}/orders/{orderId}")
    public Order getOrder(@PathVariable Long userId,
                          @PathVariable Long orderId) {
        return orderService.findByUserAndId(userId, orderId);
    }

    // Specify variable name (when parameter name differs from path variable name)
    @GetMapping("/items/{item-id}")
    public Item getItem(@PathVariable("item-id") Long itemId) {
        return itemService.findById(itemId);
    }

    // Regular expression constraints
    @GetMapping("/files/{filename:.+}")
    public Resource getFile(@PathVariable String filename) {
        return fileService.load(filename);
    }

    // Optional path variables (Spring 4.3.3+)
    @GetMapping({"/books", "/books/{id}"})
    public Object getBooks(@PathVariable(required = false) Long id) {
        if (id == null) {
            return bookService.findAll();
        }
        return bookService.findById(id);
    }
}
```

### @RequestParam - Request Parameters

Get query parameters or form parameters:

```java
@RestController
@RequestMapping("/api")
public class RequestParamController {

    // Basic usage
    @GetMapping("/search")
    public List<Product> search(@RequestParam String keyword) {
        return productService.search(keyword);
    }

    // Specify parameter name
    @GetMapping("/filter")
    public List<Product> filter(@RequestParam("q") String query) {
        return productService.filter(query);
    }

    // Optional parameters with default values
    @GetMapping("/products")
    public Page<Product> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category) {
        return productService.findAll(page, size, category);
    }

    // Multi-value parameters
    @GetMapping("/multi")
    public List<Product> multiFilter(@RequestParam List<String> ids) {
        // GET /multi?ids=1&ids=2&ids=3
        return productService.findByIds(ids);
    }

    // Receive all parameters as Map
    @GetMapping("/all-params")
    public Map<String, String> allParams(@RequestParam Map<String, String> params) {
        return params;
    }
}
```

### @RequestBody - Request Body Binding

Bind HTTP request body to Java objects:

```java
@RestController
@RequestMapping("/api/users")
public class RequestBodyController {

    // Bind to object
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.create(user);
    }

    // Combined with validation
    @PostMapping("/validated")
    public User createValidatedUser(@Valid @RequestBody User user) {
        return userService.create(user);
    }

    // Bind to Map
    @PostMapping("/dynamic")
    public Map<String, Object> handleDynamic(@RequestBody Map<String, Object> payload) {
        return payload;
    }

    // Bind to List
    @PostMapping("/batch")
    public List<User> batchCreate(@RequestBody List<User> users) {
        return userService.batchCreate(users);
    }
}
```

### @ResponseBody - Response Body

Write return values directly to HTTP response body:

```java
@Controller
@RequestMapping("/api")
public class ResponseBodyController {

    @GetMapping("/user/{id}")
    @ResponseBody  // Return JSON instead of view
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // ResponseEntity provides more control
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

### Model and ModelAndView

Used to pass data to views:

```java
@Controller
public class ModelController {

    // Using Model
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("username", "John Doe");
        model.addAttribute("stats", getStats());
        return "dashboard";
    }

    // Using ModelMap
    @GetMapping("/profile")
    public String profile(ModelMap modelMap) {
        modelMap.addAttribute("user", getCurrentUser());
        return "profile";
    }

    // Using ModelAndView
    @GetMapping("/report")
    public ModelAndView report() {
        ModelAndView mav = new ModelAndView("report");
        mav.addObject("data", getReportData());
        mav.addObject("generatedAt", LocalDateTime.now());
        return mav;
    }

    // @ModelAttribute method - add common data for all requests
    @ModelAttribute("categories")
    public List<Category> populateCategories() {
        return categoryService.findAll();
    }
}
```

### View Resolver (View Resolver)

Configure view resolvers:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    // Thymeleaf view resolver (auto-configured in Spring Boot)
    @Bean
    public SpringResourceTemplateResolver templateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:/templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);  // Disable cache during development
        return resolver;
    }

    // JSP view resolver
    @Bean
    public InternalResourceViewResolver jspViewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        resolver.setViewClass(JstlView.class);
        resolver.setOrder(2);  // Priority
        return resolver;
    }

    // JSON view resolver (for returning JSON)
    @Bean
    public MappingJackson2JsonView jsonView() {
        return new MappingJackson2JsonView();
    }
}
```

### Data Binding and Type Conversion

Spring MVC performs automatic data binding:

```java
// Entity class
public class User {
    private Long id;
    private String name;
    private String email;
    private LocalDate birthday;
    private Address address;  // Nested object

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

    // Form data automatically binds to object
    @PostMapping
    public String createUser(User user) {
        // Request parameters: name=John&email=test@example.com&birthday=2000-01-01
        //                     &address.city=NewYork&address.street=5thAve&address.zipCode=10001
        userService.save(user);
        return "redirect:/users";
    }

    // Custom data binding
    @InitBinder
    public void initBinder(WebDataBinder binder) {
        // Date format conversion
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        dateFormat.setLenient(false);
        binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, true));

        // String trim whitespace
        binder.registerCustomEditor(String.class, new StringTrimmerEditor(true));

        // Disallow binding sensitive fields
        binder.setDisallowedFields("id", "password");
    }
}
```

### Custom Type Converters

```java
// Custom Converter
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

// Custom Formatter (supports Locale)
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

// Register converters
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

## Code Examples

### Complete RESTful API Controller

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
     * Get user list (with pagination)
     * GET /api/v1/users?page=0&size=10&sort=name,asc
     */
    @GetMapping
    public ResponseEntity<Page<User>> getUsers(Pageable pageable) {
        Page<User> users = userService.findAll(pageable);
        return ResponseEntity.ok(users);
    }

    /**
     * Search users
     * GET /api/v1/users/search?keyword=john&status=ACTIVE
     */
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam String keyword,
            @RequestParam(required = false) String status) {
        List<User> users = userService.search(keyword, status);
        return ResponseEntity.ok(users);
    }

    /**
     * Get single user
     * GET /api/v1/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return ResponseEntity.ok(user);
    }

    /**
     * Create user
     * POST /api/v1/users
     */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User savedUser = userService.save(user);

        // Build resource URI
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedUser.getId())
                .toUri();

        return ResponseEntity.created(location).body(savedUser);
    }

    /**
     * Update user (full update)
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
     * Partial update user
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
     * Delete user
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
     * Batch delete users
     * DELETE /api/v1/users?ids=1,2,3
     */
    @DeleteMapping
    public ResponseEntity<Void> deleteUsers(@RequestParam List<Long> ids) {
        userService.deleteByIds(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get user's order list
     * GET /api/v1/users/{userId}/orders
     */
    @GetMapping("/{userId}/orders")
    public ResponseEntity<List<Order>> getUserOrders(@PathVariable Long userId) {
        List<Order> orders = userService.findOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }
}
```

### Form Processing Controller

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
     * Display registration form
     */
    @GetMapping
    public String showRegistrationForm(Model model) {
        model.addAttribute("registrationForm", new RegistrationForm());
        return "register";
    }

    /**
     * Process registration request
     */
    @PostMapping
    public String processRegistration(
            @Valid @ModelAttribute("registrationForm") RegistrationForm form,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes) {

        // Validation failed, return form page
        if (bindingResult.hasErrors()) {
            return "register";
        }

        // Check if email already exists
        if (userService.emailExists(form.getEmail())) {
            bindingResult.rejectValue("email", "error.email", "This email is already registered");
            return "register";
        }

        // Create user
        userService.register(form);

        // Add success message
        redirectAttributes.addFlashAttribute("message", "Registration successful, please login!");

        return "redirect:/login";
    }
}
```

### Data Validation DTO

```java
package com.example.demo.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class RegistrationForm {

    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 20, message = "Username length must be between 3-20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username can only contain letters, numbers and underscores")
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$",
             message = "Password must contain uppercase and lowercase letters and numbers")
    private String password;

    @NotBlank(message = "Confirm password cannot be empty")
    private String confirmPassword;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Please enter a valid email address")
    private String email;

    @Past(message = "Birthday must be a past date")
    private LocalDate birthday;

    @AssertTrue(message = "You must agree to the terms of service")
    private boolean agreeTerms;

    // Custom validation: password confirmation
    @AssertTrue(message = "The two passwords do not match")
    public boolean isPasswordConfirmed() {
        return password != null && password.equals(confirmPassword);
    }

    // getters and setters
}
```

### Global Exception Handling

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
     * Handle resource not found exception
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
     * Handle validation exception
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
     * Handle business exception
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
     * Handle all uncaught exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllExceptions(
            Exception ex, WebRequest request) {

        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An internal server error occurred, please try again later",
                request.getDescription(false)
        );

        // Log detailed error
        log.error("Unexpected error occurred", ex);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}

// Error response DTO
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
) {}
```

### Interceptor Implementation

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
        // Record request start time
        request.setAttribute("startTime", System.currentTimeMillis());

        log.info("Request: {} {} from {}",
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr());

        return true;  // Return true to continue processing, false to interrupt request
    }

    @Override
    public void postHandle(HttpServletRequest request,
                          HttpServletResponse response,
                          Object handler,
                          ModelAndView modelAndView) throws Exception {
        // Execute after controller method, before view rendering
        if (modelAndView != null) {
            log.info("View: {}", modelAndView.getViewName());
        }
    }

    @Override
    public void afterCompletion(HttpServletRequest request,
                               HttpServletResponse response,
                               Object handler,
                               Exception ex) throws Exception {
        // Execute after entire request completes
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

// Register interceptor
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
        // Global logging interceptor
        registry.addInterceptor(loggingInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns("/static/**", "/error");

        // Authentication interceptor
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/public/**", "/api/auth/**");
    }
}
```

### File Upload Handling

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
     * Single file upload
     */
    @PostMapping("/upload")
    public ResponseEntity<FileResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException("Please select a file to upload");
        }

        // Generate unique filename
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
            throw new BusinessException("File upload failed: " + e.getMessage());
        }
    }

    /**
     * Multiple file upload
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
     * File download
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new ResourceNotFoundException("File not found: " + filename);
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
            throw new BusinessException("Invalid file path");
        } catch (IOException e) {
            throw new BusinessException("Cannot read file");
        }
    }
}

record FileResponse(String filename, String url, long size) {}
```

---

## Best Practices

### Controller Design Principles

```java
// Good practice: Keep controller simple, put business logic in Service layer
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    // Constructor injection (recommended)
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<Order> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        // Controller only handles: receive request, call service, return response
        Order order = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}

// Avoid: Writing business logic in controller
@RestController
public class BadOrderController {

    @Autowired  // Field injection not recommended
    private OrderRepository orderRepository;

    @PostMapping("/orders")
    public Order createOrder(@RequestBody Order order) {
        // Bad: Business logic in controller
        order.setOrderNo(generateOrderNo());
        order.setStatus(OrderStatus.PENDING);
        order.setCreatedAt(LocalDateTime.now());

        // Bad: Direct repository access
        return orderRepository.save(order);
    }
}
```

### API Versioning

```java
// Method 1: URL path versioning (recommended)
@RestController
@RequestMapping("/api/v1/users")
public class UserControllerV1 {
    // v1 API
}

@RestController
@RequestMapping("/api/v2/users")
public class UserControllerV2 {
    // v2 API
}

// Method 2: Request header versioning
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(headers = "X-API-VERSION=1")
    public List<UserV1> getUsersV1() {
        // v1 version
    }

    @GetMapping(headers = "X-API-VERSION=2")
    public List<UserV2> getUsersV2() {
        // v2 version
    }
}

// Method 3: Accept header versioning
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping(produces = "application/vnd.company.app-v1+json")
    public List<UserV1> getUsersV1() {
        // v1 version
    }

    @GetMapping(produces = "application/vnd.company.app-v2+json")
    public List<UserV2> getUsersV2() {
        // v2 version
    }
}
```

### Unified Response Format

```java
// Unified response wrapper class
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

// Controller usage
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
        return ApiResponse.success("User created successfully", saved);
    }
}
```

### Request Parameter Validation

```java
// DTO class validation
public class CreateUserRequest {

    @NotBlank(message = "Username cannot be empty")
    @Size(min = 2, max = 50, message = "Username length 2-50 characters")
    private String username;

    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Email format is incorrect")
    private String email;

    @NotNull(message = "Age cannot be empty")
    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 150, message = "Age is out of range")
    private Integer age;

    @NotEmpty(message = "Roles cannot be empty")
    private List<String> roles;

    // getters and setters
}

// Custom validation annotation
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PhoneNumberValidator.class)
public @interface PhoneNumber {
    String message() default "Phone number format is incorrect";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class PhoneNumberValidator implements ConstraintValidator<PhoneNumber, String> {

    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^1[3-9]\\d{9}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isEmpty()) {
            return true;  // Empty value handled by @NotBlank
        }
        return PHONE_PATTERN.matcher(value).matches();
    }
}

// Use custom annotation
public class ContactInfo {

    @PhoneNumber
    private String phone;
}
```

### Layered Architecture

```
src/main/java/com/example/demo/
├── controller/          # Controller layer: handle HTTP requests
│   ├── UserController.java
│   └── OrderController.java
├── service/             # Service layer: business logic
│   ├── UserService.java
│   ├── UserServiceImpl.java
│   └── OrderService.java
├── repository/          # Data access layer
│   ├── UserRepository.java
│   └── OrderRepository.java
├── entity/              # Entity classes
│   ├── User.java
│   └── Order.java
├── dto/                 # Data transfer objects
│   ├── request/
│   │   ├── CreateUserRequest.java
│   │   └── UpdateUserRequest.java
│   └── response/
│       ├── UserResponse.java
│       └── ApiResponse.java
├── mapper/              # Object mapping
│   └── UserMapper.java
├── exception/           # Exception handling
│   ├── GlobalExceptionHandler.java
│   ├── BusinessException.java
│   └── ResourceNotFoundException.java
├── config/              # Configuration classes
│   ├── WebConfig.java
│   └── SecurityConfig.java
├── interceptor/         # Interceptors
│   └── AuthInterceptor.java
├── filter/              # Filters
│   └── CorsFilter.java
└── util/                # Utilities
    └── DateUtils.java
```

---

## Common Pitfalls

### Circular Dependency

```java
// Error: Circular dependency
@Service
public class UserService {
    @Autowired
    private OrderService orderService;  // UserService -> OrderService
}

@Service
public class OrderService {
    @Autowired
    private UserService userService;  // OrderService -> UserService (circular!)
}

// Solution 1: Refactor design, extract common service
@Service
public class UserOrderService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private OrderRepository orderRepository;

    // Handle user and order related business
}

// Solution 2: Use @Lazy for lazy loading
@Service
public class OrderService {
    @Lazy
    @Autowired
    private UserService userService;
}

// Solution 3: Use setter injection
@Service
public class OrderService {
    private UserService userService;

    @Autowired
    public void setUserService(UserService userService) {
        this.userService = userService;
    }
}
```

### Confusing @PathVariable and @RequestParam

```java
// URL: /users/123?status=active

// Wrong usage
@GetMapping("/users/{id}")
public User getUser(@RequestParam Long id) {  // Wrong! Gets query parameter
    return userService.findById(id);
}

// Correct usage
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id,      // Path variable 123
                    @RequestParam String status) {  // Query parameter active
    return userService.findByIdAndStatus(id, status);
}
```

### Forgetting to Handle Null Values

```java
// Error: May throw NullPointerException
@GetMapping("/users/{id}")
public User getUser(@PathVariable Long id) {
    return userService.findById(id);  // If returns null, client gets empty response
}

// Correct: Use Optional or throw exception
@GetMapping("/users/{id}")
public ResponseEntity<User> getUser(@PathVariable Long id) {
    return userService.findById(id)
            .map(ResponseEntity::ok)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
}
```

### @Transactional Annotation Ineffective

```java
// Error: Same class method call, @Transactional ineffective
@Service
public class UserService {

    public void createUserWithOrders(User user, List<Order> orders) {
        createUser(user);
        createOrders(orders);  // Same class call, @Transactional ineffective
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

// Correct: Put transaction on public method or use AOP self-invocation
@Service
public class UserService {

    @Transactional
    public void createUserWithOrders(User user, List<Order> orders) {
        userRepository.save(user);
        orderRepository.saveAll(orders);
    }
}
```

### Date Format Handling

```java
// Problem: JSON date format incorrect

// Solution 1: Global configuration
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

// Solution 2: Field-level configuration
public class User {

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthday;
}

// Solution 3: application.yml configuration
// spring:
//   jackson:
//     date-format: yyyy-MM-dd HH:mm:ss
//     time-zone: GMT+8
//     serialization:
//       write-dates-as-timestamps: false
```

### Improper HTTP Status Code Usage

```java
// Error: All responses return 200
@PostMapping("/users")
public User createUser(@RequestBody User user) {
    return userService.save(user);  // Creation success should return 201
}

@DeleteMapping("/users/{id}")
public String deleteUser(@PathVariable Long id) {
    userService.delete(id);
    return "Deleted successfully";  // Deletion success should return 204 No Content
}

// Correct: Use appropriate status codes
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

### Security Vulnerabilities

```java
// Error: Direct use of user input for path construction (path traversal attack)
@GetMapping("/files")
public Resource getFile(@RequestParam String filename) {
    // Dangerous! User can input "../../../etc/passwd"
    Path path = Paths.get("/uploads/" + filename);
    return new FileSystemResource(path);
}

// Correct: Validate and normalize path
@GetMapping("/files")
public Resource getFile(@RequestParam String filename) {
    Path basePath = Paths.get("/uploads").toAbsolutePath().normalize();
    Path filePath = basePath.resolve(filename).normalize();

    // Ensure file is within allowed directory
    if (!filePath.startsWith(basePath)) {
        throw new SecurityException("Access denied");
    }

    return new FileSystemResource(filePath);
}
```

---

## Performance Considerations

### Asynchronous Processing

```java
@RestController
@RequestMapping("/api")
public class AsyncController {

    @Autowired
    private AsyncTaskService asyncTaskService;

    /**
     * Asynchronous processing using Callable
     */
    @GetMapping("/async/callable")
    public Callable<String> asyncCallable() {
        return () -> {
            Thread.sleep(2000);  // Simulate time-consuming operation
            return "Callable result";
        };
    }

    /**
     * Asynchronous processing using DeferredResult
     */
    @GetMapping("/async/deferred")
    public DeferredResult<String> asyncDeferred() {
        DeferredResult<String> result = new DeferredResult<>(30000L);  // 30 second timeout

        asyncTaskService.executeAsync()
                .thenAccept(result::setResult)
                .exceptionally(ex -> {
                    result.setErrorResult(ex);
                    return null;
                });

        return result;
    }

    /**
     * Asynchronous processing using CompletableFuture
     */
    @GetMapping("/async/completable")
    public CompletableFuture<String> asyncCompletable() {
        return CompletableFuture.supplyAsync(() -> {
            // Asynchronous execution
            return "CompletableFuture result";
        });
    }

    /**
     * Streaming response (Server-Sent Events)
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        SseEmitter emitter = new SseEmitter(60000L);  // 60 second timeout

        asyncTaskService.streamData(emitter);

        return emitter;
    }
}

@Service
public class AsyncTaskService {

    @Async
    public CompletableFuture<String> executeAsync() {
        // Asynchronous business logic execution
        return CompletableFuture.completedFuture("Complete");
    }

    @Async
    public void streamData(SseEmitter emitter) {
        try {
            for (int i = 0; i < 10; i++) {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data("Data " + i));
                Thread.sleep(1000);
            }
            emitter.complete();
        } catch (Exception e) {
            emitter.completeWithError(e);
        }
    }
}
```

### Cache Optimization

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
        // Clear all cache
    }
}

// HTTP cache control
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

### Response Compression

```yaml
# application.yml
server:
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain
    min-response-size: 1024  # Only compress responses over 1KB
```

### Connection Pool Configuration

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

### JSON Serialization Optimization

```java
@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Ignore unknown properties
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        // Don't throw exception on empty beans
        mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);

        // Don't serialize null values
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);

        // Use more efficient date serialization
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return mapper;
    }
}
```

---

## Real-World Scenarios

### Scenario 1: User Authentication System

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

### Scenario 2: Pagination Query

```java
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    /**
     * Paginate products
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
     * Custom pagination response
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

// Pagination response DTO
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

### Scenario 3: API Rate Limiting

```java
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiter rateLimiter;

    public RateLimitInterceptor() {
        // 100 requests per second
        this.rateLimiter = RateLimiter.create(100);
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                            HttpServletResponse response,
                            Object handler) throws Exception {
        if (!rateLimiter.tryAcquire()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Too many requests, please try again later\"}");
            return false;
        }
        return true;
    }
}

// User-based rate limiting
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
            throw new RateLimitExceededException("Too many requests");
        }

        return point.proceed();
    }
}

// Custom rate limit annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    double value() default 10;  // Requests per second
    long timeout() default 500;  // Wait timeout (milliseconds)
}
```

---

## Interview Questions

### What is the working principle of Spring MVC?

**Key Points to Cover**:
- DispatcherServlet acts as the front controller receiving all requests
- HandlerMapping finds the corresponding Controller and method based on URL
- HandlerAdapter calls the Controller method to process the request
- ViewResolver resolves view names to concrete views
- View renders the response and returns it to the client

### What is the difference between @Controller and @RestController?

**Key Points to Cover**:
- `@RestController` = `@Controller` + `@ResponseBody`
- `@Controller` methods return view names, requiring a view resolver
- `@RestController` methods return values written directly to response body (JSON/XML)

### What are the attributes of @RequestMapping?

**Key Points to Cover**:
```java
@RequestMapping(
    value = "/path",           // URL path
    method = RequestMethod.GET, // HTTP method
    params = "id",              // Request parameter condition
    headers = "content-type=application/json", // Request header condition
    consumes = "application/json", // Request content type
    produces = "application/json"  // Response content type
)
```

### How do you handle exceptions in Spring MVC?

**Key Points to Cover**:
- `@ExceptionHandler`: Handle specific exceptions in controller
- `@ControllerAdvice` + `@ExceptionHandler`: Global exception handling
- Implement `HandlerExceptionResolver` interface
- Use `@ResponseStatus` annotation on exception classes

### What is the difference between Spring MVC Interceptors and Servlet Filters?

**Key Points to Cover**:

| Feature | Interceptor | Filter |
|---------|------------|--------|
| Specification | Spring MVC | Servlet |
| Execution Timing | After DispatcherServlet | Before DispatcherServlet |
| Access Scope | Can access Spring context | Cannot directly access |
| Granularity | Can be precise to method | Only to URL |
| Exception Handling | Unified handling | Separate handling |

### How do you implement file upload in Spring MVC?

**Key Points to Cover**:
- Configure `MultipartResolver`
- Use `@RequestParam("file") MultipartFile file` to receive file
- Handle file size limits and type validation
- Security considerations: filename filtering, storage path

### What is the difference between @PathVariable and @RequestParam?

**Key Points to Cover**:
- `@PathVariable`: Extract values from URL path (`/users/{id}`)
- `@RequestParam`: Extract values from query string (`/users?id=1`)
- `@PathVariable` typically used for RESTful resource identification
- `@RequestParam` used for optional parameters and filters

### How does Spring MVC implement data validation?

**Key Points to Cover**:
- Use JSR-303/JSR-380 annotations (`@NotNull`, `@Size`, `@Email`, etc.)
- Use `@Valid` or `@Validated` before method parameters
- Use `BindingResult` to get validation results
- Implement custom validators with `ConstraintValidator`

### What is a RESTful API? How does Spring MVC support it?

**Key Points to Cover**:
- REST (Representational State Transfer) is an architectural style
- Use HTTP verbs to represent operations: GET (query), POST (create), PUT (update), DELETE (delete)
- URLs represent resources: `/users/{id}`
- Spring MVC provides `@GetMapping`, `@PostMapping` annotations
- Use `@RestController` to return JSON/XML

### How do you optimize Spring MVC application performance?

**Key Points to Cover**:
- Enable response compression (Gzip)
- Use caching (Spring Cache, HTTP caching)
- Asynchronous handling of time-consuming requests (`@Async`, `DeferredResult`)
- Database connection pool optimization
- JSON serialization optimization
- Static resource CDN

---

## Further Reading

### Official Documentation

- [Spring MVC Official Documentation](https://docs.spring.io/spring-framework/reference/web/webmvc.html)
- [Spring Boot Web Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html)
- [Spring Validation Documentation](https://docs.spring.io/spring-framework/reference/core/validation.html)

### Recommended Books

- "Spring in Action" (5th Edition) - Craig Walls
- "Spring Boot Programming Ideas" - Xiaoma
- "Mastering Spring 4.x" - Chen Xionghua

### Advanced Topics

- **Spring WebFlux**: Reactive Web framework
- **GraphQL with Spring**: GraphQL API development
- **Spring HATEOAS**: Hypermedia APIs
- **API Gateway**: Microservices gateway integration
- **OpenAPI/Swagger**: API documentation generation

### Related Technology Stack

- **Template Engines**: Thymeleaf, FreeMarker
- **Security Frameworks**: Spring Security, JWT
- **API Documentation**: SpringDoc OpenAPI, Swagger
- **Testing Frameworks**: MockMvc, RestAssured
- **Monitoring**: Spring Boot Actuator, Micrometer
