---
title: 特性 (Attributes)
description: C#特性完全指南，元数据标记、内置特性、自定义特性与反射读取
track: csharp
section: types-linq
difficulty: intermediate
tags:
  - C#
  - 特性
  - Attributes
  - 元数据
  - 反射
status: imported
origin: old/src/content/docs/csharp/attributes.en.md
divergence: 0.197
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 高级特性
  order: 11
  lastUpdated: 2026-01-07
---

Attributes are a powerful metadata mechanism in C# that allows you to add declarative information to various program elements (classes, methods, properties, fields, etc.). This information is embedded in the assembly at compile time and can be read and processed at runtime through reflection.

## Concept Explanation

### What Are Attributes

Attributes are special classes that inherit from the `System.Attribute` base class. They are used to add metadata (data that describes data) to code. This metadata can affect compiler behavior, runtime processing, or provide configuration information for tools and frameworks.

```csharp
using System;

// Using built-in attributes
[Obsolete("This method is obsolete, please use NewMethod instead")]
public void OldMethod()
{
    // Old implementation
}

// Using multiple attributes
[Serializable]
[Obsolete("Please use NewClass")]
public class LegacyClass
{
    // Class implementation
}

// Attributes can also be written on the same line
[Serializable, Obsolete("Please use NewClass")]
public class AnotherLegacyClass
{
    // Class implementation
}
```

### Historical Background of Attributes

The concept of attributes originated from the pursuit of "declarative programming." When C# 1.0 was released (2002), attributes were already one of the core features of the language. Its design was inspired by Java Annotations and the concept of properties in COM.

As the .NET framework evolved, attributes have become increasingly widely used:
- ASP.NET uses attributes for route configuration and validation
- Entity Framework uses attributes to define database mappings
- xUnit/NUnit uses attributes to mark test methods
- Serialization frameworks use attributes to control serialization behavior

### Problems Solved by Attributes

1. **Separation of Concerns**: Separates metadata from business logic
2. **Configuration Simplification**: Replaces complex configuration files with declarative code
3. **Code as Documentation**: Attributes themselves serve as self-describing documentation
4. **Framework Extension**: Provides flexible extension mechanisms for frameworks
5. **AOP Support**: Infrastructure for Aspect-Oriented Programming

## Core Principles

### Attribute Compilation Process

When the compiler encounters an attribute, it:

1. Verifies that the attribute class exists and inherits from `System.Attribute`
2. Checks the attribute's constructor parameters and named parameters
3. Serializes the attribute information into the assembly's metadata

```csharp
// Code before compilation
[MyAttribute("parameter value", NamedParam = 42)]
public class MyClass { }

// After compilation, attribute information is stored in assembly metadata
// Can be viewed using IL DASM or dnSpy
```

### The AttributeUsage Attribute

`AttributeUsage` is a meta-attribute (an attribute for attributes) that controls how custom attributes can be used:

```csharp
[AttributeUsage(
    AttributeTargets.Class | AttributeTargets.Method,  // Valid targets
    AllowMultiple = true,                              // Whether multiple applications are allowed
    Inherited = true                                   // Whether inherited by derived classes
)]
public class MyCustomAttribute : Attribute
{
    // Attribute implementation
}
```

### The AttributeTargets Enumeration

`AttributeTargets` defines the code elements to which attributes can be applied:

```csharp
[Flags]
public enum AttributeTargets
{
    Assembly = 1,           // Assembly
    Module = 2,             // Module
    Class = 4,              // Class
    Struct = 8,             // Struct
    Enum = 16,              // Enum
    Constructor = 32,       // Constructor
    Method = 64,            // Method
    Property = 128,         // Property
    Field = 256,            // Field
    Event = 512,            // Event
    Interface = 1024,       // Interface
    Parameter = 2048,       // Parameter
    Delegate = 4096,        // Delegate
    ReturnValue = 8192,     // Return value
    GenericParameter = 16384, // Generic parameter
    All = 32767             // All targets
}
```

### Attribute Storage Mechanism

Attribute information is stored in the assembly's metadata tables, primarily involving:

- **CustomAttribute Table**: Stores attribute instances
- **Blob Heap**: Stores attribute constructor parameter and named parameter values

```csharp
// Reading raw metadata using System.Reflection.Metadata
using System.Reflection.Metadata;
using System.Reflection.PortableExecutable;

public void ReadMetadata(string assemblyPath)
{
    using var stream = File.OpenRead(assemblyPath);
    using var peReader = new PEReader(stream);
    var metadataReader = peReader.GetMetadataReader();

    foreach (var attrHandle in metadataReader.CustomAttributes)
    {
        var attr = metadataReader.GetCustomAttribute(attrHandle);
        // Process attribute metadata
    }
}
```

## Key Points

### Attribute Syntax Rules

```csharp
// 1. Basic syntax: square brackets + attribute name
[Serializable]
public class Data { }

// 2. The "Attribute" suffix can be omitted
[Obsolete]  // Equivalent to [ObsoleteAttribute]
public void OldMethod() { }

// 3. Attributes with parameters
[Obsolete("This method is deprecated", true)]  // Positional parameters
public void VeryOldMethod() { }

// 4. Named parameters
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
public static extern int MessageBox(IntPtr hWnd, string text, string caption, int type);

// 5. Multiple attributes
[Serializable]
[Obsolete]
public class LegacyData { }

// Or written on one line
[Serializable, Obsolete]
public class LegacyData2 { }

// 6. Attribute target specifiers
[assembly: AssemblyVersion("1.0.0.0")]        // Assembly level
[module: SuppressMessage("StyleCop", "SA1000")]  // Module level

// 7. Return value and parameter attributes
[return: MarshalAs(UnmanagedType.Bool)]
public static extern bool SomeFunction([In] int param);
```

### Common Built-in Attributes

#### Compiler Attributes

```csharp
// Obsolete - Mark deprecated code
[Obsolete("Please use NewMethod")]  // Warning
[Obsolete("This method has been removed", true)]  // Error

// Conditional - Conditional compilation
[Conditional("DEBUG")]
public void DebugLog(string message)
{
    Console.WriteLine(message);
}

// CallerInfo - Caller information
public void Log(string message,
    [CallerMemberName] string memberName = "",
    [CallerFilePath] string filePath = "",
    [CallerLineNumber] int lineNumber = 0)
{
    Console.WriteLine($"[{memberName}] {message} ({filePath}:{lineNumber})");
}

// MethodImpl - Method implementation options
[MethodImpl(MethodImplOptions.AggressiveInlining)]
public int FastAdd(int a, int b) => a + b;

[MethodImpl(MethodImplOptions.Synchronized)]
public void ThreadSafeMethod() { }

[MethodImpl(MethodImplOptions.NoInlining)]
public void NeverInline() { }
```

#### Serialization Attributes

```csharp
// Serializable - Mark class as serializable
[Serializable]
public class SerializableData
{
    public string Name { get; set; }

    [NonSerialized]
    private int _cacheValue;  // Not included in serialization
}

// JSON serialization attributes (System.Text.Json)
public class JsonExample
{
    [JsonPropertyName("user_name")]
    public string UserName { get; set; }

    [JsonIgnore]
    public string Password { get; set; }

    [JsonInclude]
    private string _internalField;

    [JsonConverter(typeof(DateTimeConverter))]
    public DateTime CreatedAt { get; set; }
}

// XML serialization attributes
[XmlRoot("Person")]
public class XmlPerson
{
    [XmlAttribute("id")]
    public int Id { get; set; }

    [XmlElement("FullName")]
    public string Name { get; set; }

    [XmlIgnore]
    public int Age { get; set; }

    [XmlArray("Hobbies")]
    [XmlArrayItem("Hobby")]
    public List<string> Hobbies { get; set; }
}
```

#### Interop Attributes

```csharp
// DllImport - P/Invoke
[DllImport("kernel32.dll", SetLastError = true)]
public static extern IntPtr GetCurrentProcess();

[DllImport("user32.dll", CharSet = CharSet.Unicode)]
public static extern int MessageBox(
    IntPtr hWnd,
    string text,
    string caption,
    uint type);

// StructLayout - Struct layout
[StructLayout(LayoutKind.Sequential, Pack = 1)]
public struct PackedStruct
{
    public byte A;
    public int B;
    public short C;
}

[StructLayout(LayoutKind.Explicit)]
public struct UnionStruct
{
    [FieldOffset(0)] public int IntValue;
    [FieldOffset(0)] public float FloatValue;
}

// MarshalAs - Type marshaling
[DllImport("native.dll")]
public static extern void ProcessString(
    [MarshalAs(UnmanagedType.LPWStr)] string str);
```

#### Data Validation Attributes (System.ComponentModel.DataAnnotations)

```csharp
public class UserModel
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username length must be between 3 and 50")]
    public string Username { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; }

    [Range(0, 150, ErrorMessage = "Age must be between 0 and 150")]
    public int Age { get; set; }

    [RegularExpression(@"^\d{11}$", ErrorMessage = "Phone number must be 11 digits")]
    public string Phone { get; set; }

    [Compare("Password", ErrorMessage = "Passwords do not match")]
    public string ConfirmPassword { get; set; }

    [Url(ErrorMessage = "Invalid URL format")]
    public string Website { get; set; }

    [CreditCard(ErrorMessage = "Invalid credit card number format")]
    public string CreditCardNumber { get; set; }
}

// Custom validation attribute
public class MinAgeAttribute : ValidationAttribute
{
    private readonly int _minAge;

    public MinAgeAttribute(int minAge)
    {
        _minAge = minAge;
        ErrorMessage = $"Age must be at least {minAge} years old";
    }

    protected override ValidationResult IsValid(object value, ValidationContext context)
    {
        if (value is DateTime birthDate)
        {
            int age = DateTime.Today.Year - birthDate.Year;
            if (birthDate.Date > DateTime.Today.AddYears(-age)) age--;

            if (age >= _minAge)
                return ValidationResult.Success;
        }

        return new ValidationResult(ErrorMessage);
    }
}
```

## Code Examples

### Creating Custom Attributes

```csharp
using System;
using System.Reflection;

// Basic custom attribute
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorAttribute : Attribute
{
    public string Name { get; }
    public string Email { get; set; }
    public string Version { get; set; } = "1.0";

    public AuthorAttribute(string name)
    {
        Name = name;
    }
}

// Using custom attribute
[Author("John Smith", Email = "john@example.com", Version = "2.0")]
public class MyService
{
    [Author("Jane Doe")]
    public void DoWork()
    {
        Console.WriteLine("Performing work");
    }
}
```

### Attributes Allowing Multiple Applications

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class TagAttribute : Attribute
{
    public string Name { get; }
    public string Description { get; set; }

    public TagAttribute(string name)
    {
        Name = name;
    }
}

// Multiple applications
[Tag("Important", Description = "Critical functionality")]
[Tag("Performance Sensitive")]
[Tag("Needs Testing")]
public class CriticalService
{
    // Implementation
}
```

### Attributes with Validation

```csharp
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class RangeAttribute : Attribute
{
    public int Minimum { get; }
    public int Maximum { get; }
    public string ErrorMessage { get; set; }

    public RangeAttribute(int minimum, int maximum)
    {
        if (minimum > maximum)
            throw new ArgumentException("Minimum cannot be greater than maximum");

        Minimum = minimum;
        Maximum = maximum;
        ErrorMessage = $"Value must be between {minimum} and {maximum}";
    }

    public bool IsValid(int value)
    {
        return value >= Minimum && value <= Maximum;
    }
}

// String length validation attribute
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class StringLengthAttribute : Attribute
{
    public int MaximumLength { get; }
    public int MinimumLength { get; set; }

    public StringLengthAttribute(int maximumLength)
    {
        MaximumLength = maximumLength;
    }

    public bool IsValid(string value)
    {
        if (value == null) return MinimumLength == 0;
        return value.Length >= MinimumLength && value.Length <= MaximumLength;
    }
}

// Required field attribute
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class RequiredAttribute : Attribute
{
    public string ErrorMessage { get; set; } = "This field is required";
    public bool AllowEmptyStrings { get; set; }

    public bool IsValid(object value)
    {
        if (value == null) return false;
        if (value is string str && !AllowEmptyStrings)
            return !string.IsNullOrWhiteSpace(str);
        return true;
    }
}
```

### Reading Attributes via Reflection

```csharp
using System;
using System.Reflection;
using System.Linq;

public class AttributeReader
{
    // Read attributes on a class
    public static void ReadClassAttributes<T>()
    {
        Type type = typeof(T);
        Console.WriteLine($"Attributes on class {type.Name}:");

        // Get all attributes
        object[] attributes = type.GetCustomAttributes(true);
        foreach (var attr in attributes)
        {
            Console.WriteLine($"  - {attr.GetType().Name}");

            // Read attribute properties
            foreach (var prop in attr.GetType().GetProperties())
            {
                var value = prop.GetValue(attr);
                Console.WriteLine($"      {prop.Name}: {value}");
            }
        }
    }

    // Get a specific type of attribute
    public static TAttribute GetAttribute<TAttribute>(Type type) where TAttribute : Attribute
    {
        return type.GetCustomAttribute<TAttribute>();
    }

    // Check if an attribute exists
    public static bool HasAttribute<TAttribute>(MemberInfo member) where TAttribute : Attribute
    {
        return member.GetCustomAttribute<TAttribute>() != null;
    }

    // Read method attributes
    public static void ReadMethodAttributes(Type type)
    {
        Console.WriteLine($"\nMethod attributes of class {type.Name}:");

        foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        {
            var attributes = method.GetCustomAttributes(true);
            if (attributes.Length > 0)
            {
                Console.WriteLine($"  Method {method.Name}:");
                foreach (var attr in attributes)
                {
                    Console.WriteLine($"    - {attr.GetType().Name}");
                }
            }
        }
    }

    // Read property attributes
    public static void ReadPropertyAttributes(Type type)
    {
        Console.WriteLine($"\nProperty attributes of class {type.Name}:");

        foreach (var prop in type.GetProperties())
        {
            var attributes = prop.GetCustomAttributes(true);
            if (attributes.Length > 0)
            {
                Console.WriteLine($"  Property {prop.Name}:");
                foreach (var attr in attributes)
                {
                    Console.WriteLine($"    - {attr.GetType().Name}");
                }
            }
        }
    }
}

// Usage example
[Author("John Smith", Email = "john@example.com")]
[Tag("Service Class")]
public class UserService
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }

    [Author("Jane Doe")]
    public void CreateUser()
    {
        // Implementation
    }
}

// Invocation
AttributeReader.ReadClassAttributes<UserService>();
AttributeReader.ReadMethodAttributes(typeof(UserService));
AttributeReader.ReadPropertyAttributes(typeof(UserService));
```

### Complete Validation Framework Implementation

```csharp
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;

// Validation result
public class ValidationResult
{
    public bool IsValid { get; set; } = true;
    public List<string> Errors { get; set; } = new List<string>();

    public void AddError(string error)
    {
        IsValid = false;
        Errors.Add(error);
    }
}

// Validator
public static class Validator
{
    public static ValidationResult Validate<T>(T obj) where T : class
    {
        var result = new ValidationResult();
        if (obj == null)
        {
            result.AddError("Object cannot be null");
            return result;
        }

        Type type = typeof(T);

        foreach (var prop in type.GetProperties())
        {
            object value = prop.GetValue(obj);

            // Check Required
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null && !required.IsValid(value))
            {
                result.AddError($"{prop.Name}: {required.ErrorMessage}");
                continue;
            }

            // Check StringLength
            var stringLength = prop.GetCustomAttribute<StringLengthAttribute>();
            if (stringLength != null && value is string str)
            {
                if (!stringLength.IsValid(str))
                {
                    result.AddError($"{prop.Name}: Length must be between {stringLength.MinimumLength} and {stringLength.MaximumLength}");
                }
            }

            // Check Range
            var range = prop.GetCustomAttribute<RangeAttribute>();
            if (range != null && value is int intValue)
            {
                if (!range.IsValid(intValue))
                {
                    result.AddError($"{prop.Name}: {range.ErrorMessage}");
                }
            }
        }

        return result;
    }
}

// Usage example
public class User
{
    [Required(ErrorMessage = "Username cannot be empty")]
    [StringLength(50, MinimumLength = 2)]
    public string Username { get; set; }

    [Required]
    public string Email { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}

// Validation
var user = new User { Username = "A", Age = 200 };
var result = Validator.Validate(user);

Console.WriteLine($"Validation result: {(result.IsValid ? "Passed" : "Failed")}");
foreach (var error in result.Errors)
{
    Console.WriteLine($"  - {error}");
}
// Output:
// Validation result: Failed
//   - Username: Length must be between 2 and 50
//   - Email: This field is required
//   - Age: Value must be between 0 and 150
```

### Attribute-Based Dependency Injection

```csharp
// Service lifetime attribute
public enum ServiceLifetime
{
    Transient,
    Scoped,
    Singleton
}

[AttributeUsage(AttributeTargets.Class)]
public class ServiceAttribute : Attribute
{
    public Type ServiceType { get; }
    public ServiceLifetime Lifetime { get; set; } = ServiceLifetime.Transient;

    public ServiceAttribute(Type serviceType)
    {
        ServiceType = serviceType;
    }
}

// Auto-inject attribute
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class InjectAttribute : Attribute { }

// Simple DI container
public class SimpleContainer
{
    private readonly Dictionary<Type, Func<object>> _registrations = new();
    private readonly Dictionary<Type, object> _singletons = new();

    // Scan assembly and register classes with ServiceAttribute
    public void RegisterFromAssembly(Assembly assembly)
    {
        var serviceTypes = assembly.GetTypes()
            .Where(t => t.GetCustomAttribute<ServiceAttribute>() != null);

        foreach (var type in serviceTypes)
        {
            var attr = type.GetCustomAttribute<ServiceAttribute>();
            Register(attr.ServiceType, type, attr.Lifetime);
        }
    }

    public void Register(Type serviceType, Type implementationType, ServiceLifetime lifetime)
    {
        Func<object> factory = () => CreateInstance(implementationType);

        if (lifetime == ServiceLifetime.Singleton)
        {
            _registrations[serviceType] = () =>
            {
                if (!_singletons.ContainsKey(serviceType))
                {
                    _singletons[serviceType] = factory();
                }
                return _singletons[serviceType];
            };
        }
        else
        {
            _registrations[serviceType] = factory;
        }
    }

    private object CreateInstance(Type type)
    {
        // Get constructor
        var ctor = type.GetConstructors().FirstOrDefault();
        if (ctor == null)
            return Activator.CreateInstance(type);

        // Resolve constructor parameters
        var parameters = ctor.GetParameters()
            .Select(p => Resolve(p.ParameterType))
            .ToArray();

        var instance = ctor.Invoke(parameters);

        // Inject properties
        InjectProperties(instance);

        return instance;
    }

    private void InjectProperties(object instance)
    {
        var properties = instance.GetType().GetProperties()
            .Where(p => p.GetCustomAttribute<InjectAttribute>() != null);

        foreach (var prop in properties)
        {
            if (prop.CanWrite)
            {
                var value = Resolve(prop.PropertyType);
                prop.SetValue(instance, value);
            }
        }
    }

    public T Resolve<T>() => (T)Resolve(typeof(T));

    public object Resolve(Type serviceType)
    {
        if (_registrations.TryGetValue(serviceType, out var factory))
        {
            return factory();
        }
        throw new InvalidOperationException($"Service {serviceType.Name} is not registered");
    }
}

// Usage example
public interface ILogger
{
    void Log(string message);
}

[Service(typeof(ILogger), Lifetime = ServiceLifetime.Singleton)]
public class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine($"[LOG] {message}");
}

public interface IUserRepository
{
    void Save(string user);
}

[Service(typeof(IUserRepository))]
public class UserRepository : IUserRepository
{
    [Inject]
    public ILogger Logger { get; set; }

    public void Save(string user)
    {
        Logger?.Log($"Saving user: {user}");
    }
}

// Usage
var container = new SimpleContainer();
container.RegisterFromAssembly(Assembly.GetExecutingAssembly());

var repo = container.Resolve<IUserRepository>();
repo.Save("John"); // Output: [LOG] Saving user: John
```

### Attribute-Based Web API Routing

```csharp
// Route attribute
[AttributeUsage(AttributeTargets.Class)]
public class RouteAttribute : Attribute
{
    public string Template { get; }

    public RouteAttribute(string template)
    {
        Template = template;
    }
}

// HTTP method attributes
[AttributeUsage(AttributeTargets.Method)]
public class HttpMethodAttribute : Attribute
{
    public string Method { get; }
    public string Template { get; }

    protected HttpMethodAttribute(string method, string template = "")
    {
        Method = method;
        Template = template;
    }
}

public class HttpGetAttribute : HttpMethodAttribute
{
    public HttpGetAttribute(string template = "") : base("GET", template) { }
}

public class HttpPostAttribute : HttpMethodAttribute
{
    public HttpPostAttribute(string template = "") : base("POST", template) { }
}

public class HttpPutAttribute : HttpMethodAttribute
{
    public HttpPutAttribute(string template = "") : base("PUT", template) { }
}

public class HttpDeleteAttribute : HttpMethodAttribute
{
    public HttpDeleteAttribute(string template = "") : base("DELETE", template) { }
}

// Controller example
[Route("api/users")]
public class UserController
{
    [HttpGet]
    public string GetAll() => "Get all users";

    [HttpGet("{id}")]
    public string GetById(int id) => $"Get user {id}";

    [HttpPost]
    public string Create() => "Create user";

    [HttpPut("{id}")]
    public string Update(int id) => $"Update user {id}";

    [HttpDelete("{id}")]
    public string Delete(int id) => $"Delete user {id}";
}

// Route scanner
public class RouteScanner
{
    public static void ScanRoutes(Type controllerType)
    {
        var routeAttr = controllerType.GetCustomAttribute<RouteAttribute>();
        string baseRoute = routeAttr?.Template ?? "";

        Console.WriteLine($"Controller: {controllerType.Name}");
        Console.WriteLine($"Base route: {baseRoute}");
        Console.WriteLine("Endpoints:");

        foreach (var method in controllerType.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        {
            var httpAttr = method.GetCustomAttribute<HttpMethodAttribute>();
            if (httpAttr != null)
            {
                string fullRoute = string.IsNullOrEmpty(httpAttr.Template)
                    ? baseRoute
                    : $"{baseRoute}/{httpAttr.Template}";

                Console.WriteLine($"  {httpAttr.Method,-8} {fullRoute,-20} -> {method.Name}");
            }
        }
    }
}

// Usage
RouteScanner.ScanRoutes(typeof(UserController));
// Output:
// Controller: UserController
// Base route: api/users
// Endpoints:
//   GET      api/users            -> GetAll
//   GET      api/users/{id}       -> GetById
//   POST     api/users            -> Create
//   PUT      api/users/{id}       -> Update
//   DELETE   api/users/{id}       -> Delete
```

## Best Practices

### Design Clear Attribute APIs

```csharp
// Good design: Clear parameter semantics
[Cache(Duration = 3600, Key = "user_{id}")]
public User GetUser(int id) { }

// Avoid: Ambiguous parameter meaning
[Cache(3600, "user_{id}")]
public User GetUser(int id) { }

// Good design: Use enums instead of magic strings
[Authorize(Roles = UserRole.Admin | UserRole.Manager)]
public void AdminAction() { }

// Avoid: Using strings
[Authorize(Roles = "Admin,Manager")]
public void AdminAction() { }
```

### Use AttributeUsage Appropriately

```csharp
// Clearly specify valid targets
[AttributeUsage(AttributeTargets.Method, Inherited = false)]
public class TransactionAttribute : Attribute { }

// Allow multiple applications (when needed)
[AttributeUsage(AttributeTargets.Class, AllowMultiple = true)]
public class ImplementsAttribute : Attribute
{
    public Type InterfaceType { get; }
    public ImplementsAttribute(Type interfaceType) => InterfaceType = interfaceType;
}

[Implements(typeof(IDisposable))]
[Implements(typeof(ICloneable))]
public class MultiInterfaceClass { }
```

### Provide Reasonable Default Values

```csharp
[AttributeUsage(AttributeTargets.Property)]
public class DisplayAttribute : Attribute
{
    public string Name { get; set; }
    public string Description { get; set; } = "";  // Default empty string
    public int Order { get; set; } = 0;            // Default order
    public bool Visible { get; set; } = true;      // Default visible

    public DisplayAttribute(string name)
    {
        Name = name;
    }
}

// Only specify required parameters when using
[Display("Username")]
public string Username { get; set; }

// Or specify additional parameters
[Display("Password", Visible = false)]
public string Password { get; set; }
```

### Combine Attributes with Constants

```csharp
// Define constants class
public static class CacheKeys
{
    public const string UserById = "user_{id}";
    public const string UserList = "users_all";
    public const string ProductById = "product_{id}";
}

public static class CacheDurations
{
    public const int Short = 60;
    public const int Medium = 300;
    public const int Long = 3600;
}

// Use constants
[Cache(CacheDurations.Medium, CacheKeys.UserById)]
public User GetUser(int id) { }
```

### Inheritance and Composition

```csharp
// Base validation attribute
public abstract class ValidationAttribute : Attribute
{
    public string ErrorMessage { get; set; }
    public abstract bool IsValid(object value);
}

// Derived attributes
public class NotEmptyAttribute : ValidationAttribute
{
    public override bool IsValid(object value)
    {
        if (value == null) return false;
        if (value is string str) return !string.IsNullOrWhiteSpace(str);
        if (value is ICollection col) return col.Count > 0;
        return true;
    }
}

// Compose multiple validation logic
public class EmailAttribute : ValidationAttribute
{
    private static readonly Regex EmailRegex =
        new Regex(@"^[\w\.-]+@[\w\.-]+\.\w+$", RegexOptions.Compiled);

    public override bool IsValid(object value)
    {
        if (value == null) return true; // null is handled by Required
        return value is string str && EmailRegex.IsMatch(str);
    }
}
```

## Common Pitfalls

### Attribute Parameter Limitations

```csharp
// Error: Attribute parameters can only be compile-time constants
[MyAttribute(new int[] { 1, 2, 3 })]  // Error!
[MyAttribute(DateTime.Now)]           // Error!
[MyAttribute(new MyClass())]          // Error!

// Correct: Use compile-time constants
[MyAttribute(42)]                     // int constant
[MyAttribute("hello")]                // string constant
[MyAttribute(typeof(MyClass))]        // Type
[MyAttribute(DayOfWeek.Monday)]       // enum
[MyAttribute(new int[] { 1, 2, 3 })]  // array literal (in some cases)

// Allowed types for attribute parameters:
// - Primitive types (bool, byte, char, short, int, long, float, double)
// - string
// - Type
// - enum
// - One-dimensional arrays of the above types
// - object (can only be assigned values of the above types)
```

### Reflection Performance Issues

```csharp
// Wrong: Reflection on every call
public void ProcessItem<T>(T item)
{
    // Reflection on every call, poor performance
    var attr = typeof(T).GetCustomAttribute<MyAttribute>();
    // Process...
}

// Correct: Cache reflection results
private static readonly ConcurrentDictionary<Type, MyAttribute> _attributeCache = new();

public void ProcessItemOptimized<T>(T item)
{
    var attr = _attributeCache.GetOrAdd(typeof(T),
        t => t.GetCustomAttribute<MyAttribute>());
    // Process...
}
```

### Misunderstanding the Inherited Parameter

```csharp
[AttributeUsage(AttributeTargets.Class, Inherited = true)]
public class InheritedAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public class NotInheritedAttribute : Attribute { }

[InheritedAttribute]
[NotInheritedAttribute]
public class BaseClass { }

public class DerivedClass : BaseClass { }

// Check
var inheritedOnDerived = typeof(DerivedClass)
    .GetCustomAttribute<InheritedAttribute>(true);  // Not null

var notInheritedOnDerived = typeof(DerivedClass)
    .GetCustomAttribute<NotInheritedAttribute>(true);  // Null
```

### Impact of GetCustomAttributes Parameters

```csharp
// Impact of the inherit parameter
var attrs1 = type.GetCustomAttributes(false);  // Only get directly declared attributes
var attrs2 = type.GetCustomAttributes(true);   // Include inherited attributes

// Note: For methods, inherit=true searches overridden method attributes
public class Base
{
    [MyAttribute]
    public virtual void Method() { }
}

public class Derived : Base
{
    public override void Method() { }
}

// Derived.Method() doesn't directly have MyAttribute
// But GetCustomAttribute<MyAttribute>(true) will return the attribute from Base.Method()
```

### Attribute Instantiation Timing

```csharp
// Attributes are only instantiated when accessed via reflection
[MyAttribute("test")]  // Attribute not instantiated at this point
public class MyClass { }

// Instance is created when GetCustomAttribute is called
var attr = typeof(MyClass).GetCustomAttribute<MyAttribute>();  // Instantiated now

// Each call may create a new instance (depending on implementation)
var attr1 = typeof(MyClass).GetCustomAttribute<MyAttribute>();
var attr2 = typeof(MyClass).GetCustomAttribute<MyAttribute>();
// attr1 and attr2 may be different instances
```

## Performance Considerations

### Reflection Overhead

```csharp
// Performance comparison test
public class PerformanceComparison
{
    private static readonly Type _type = typeof(TestClass);
    private static readonly MyAttribute _cachedAttr;

    static PerformanceComparison()
    {
        _cachedAttr = _type.GetCustomAttribute<MyAttribute>();
    }

    // Slow: Reflection on each call
    public MyAttribute GetAttributeSlow()
    {
        return typeof(TestClass).GetCustomAttribute<MyAttribute>();
    }

    // Fast: Using cache
    public MyAttribute GetAttributeFast()
    {
        return _cachedAttr;
    }
}

// Benchmark results example (for reference only):
// GetAttributeSlow: ~500ns
// GetAttributeFast: ~1ns
// Difference can be up to 500x
```

### Caching Strategies

```csharp
// Use generic static class for type-level caching
public static class AttributeCache<TType, TAttribute> where TAttribute : Attribute
{
    public static readonly TAttribute Value;
    public static readonly bool HasAttribute;

    static AttributeCache()
    {
        Value = typeof(TType).GetCustomAttribute<TAttribute>();
        HasAttribute = Value != null;
    }
}

// Usage
var hasAttr = AttributeCache<MyClass, SerializableAttribute>.HasAttribute;

// Property-level caching
public static class PropertyAttributeCache<T>
{
    public static readonly Dictionary<string, Attribute[]> Attributes;

    static PropertyAttributeCache()
    {
        Attributes = typeof(T).GetProperties()
            .ToDictionary(
                p => p.Name,
                p => p.GetCustomAttributes().ToArray()
            );
    }
}
```

### Optimization Using Delegates

```csharp
// For frequently accessed attribute validation, use compiled delegates
public class OptimizedValidator<T>
{
    private static readonly Func<T, ValidationResult> _validator;

    static OptimizedValidator()
    {
        _validator = CompileValidator();
    }

    private static Func<T, ValidationResult> CompileValidator()
    {
        var param = Expression.Parameter(typeof(T), "obj");
        var resultVar = Expression.Variable(typeof(ValidationResult), "result");
        var statements = new List<Expression>();

        // Initialize result
        statements.Add(Expression.Assign(resultVar,
            Expression.New(typeof(ValidationResult))));

        foreach (var prop in typeof(T).GetProperties())
        {
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null)
            {
                // Generate validation code...
            }
        }

        statements.Add(resultVar);

        var body = Expression.Block(new[] { resultVar }, statements);
        return Expression.Lambda<Func<T, ValidationResult>>(body, param).Compile();
    }

    public static ValidationResult Validate(T obj) => _validator(obj);
}
```

### Source Generator Alternative

Starting with .NET 5, you can use Source Generators to generate code at compile time, completely avoiding runtime reflection:

```csharp
// Define generator marker attribute
[AttributeUsage(AttributeTargets.Class)]
public class GenerateValidatorAttribute : Attribute { }

// Mark class
[GenerateValidator]
public partial class User
{
    [Required]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}

// Source Generator will generate similar code at compile time:
public partial class User
{
    public static ValidationResult Validate(User obj)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(obj.Name))
            result.AddError("Name: This field is required");

        if (obj.Age < 0 || obj.Age > 150)
            result.AddError("Age: Value must be between 0 and 150");

        return result;
    }
}
```

## Real-World Scenarios

### ORM Mapping

```csharp
// Table mapping attribute
[AttributeUsage(AttributeTargets.Class)]
public class TableAttribute : Attribute
{
    public string Name { get; }
    public string Schema { get; set; } = "dbo";

    public TableAttribute(string name) => Name = name;
}

// Column mapping attribute
[AttributeUsage(AttributeTargets.Property)]
public class ColumnAttribute : Attribute
{
    public string Name { get; }
    public bool IsPrimaryKey { get; set; }
    public bool IsAutoIncrement { get; set; }
    public bool IsNullable { get; set; } = true;
    public int MaxLength { get; set; }

    public ColumnAttribute(string name) => Name = name;
}

// Foreign key attribute
[AttributeUsage(AttributeTargets.Property)]
public class ForeignKeyAttribute : Attribute
{
    public string ColumnName { get; }
    public Type ReferenceType { get; }

    public ForeignKeyAttribute(string columnName, Type referenceType)
    {
        ColumnName = columnName;
        ReferenceType = referenceType;
    }
}

// Entity definition
[Table("Users", Schema = "app")]
public class User
{
    [Column("user_id", IsPrimaryKey = true, IsAutoIncrement = true)]
    public int Id { get; set; }

    [Column("user_name", MaxLength = 100, IsNullable = false)]
    public string Name { get; set; }

    [Column("email", MaxLength = 200)]
    public string Email { get; set; }

    [Column("department_id")]
    [ForeignKey("department_id", typeof(Department))]
    public int DepartmentId { get; set; }
}

// SQL generator
public class SqlGenerator
{
    public static string GenerateCreateTable<T>()
    {
        var type = typeof(T);
        var table = type.GetCustomAttribute<TableAttribute>();
        var tableName = table != null ? $"{table.Schema}.{table.Name}" : type.Name;

        var columns = new List<string>();
        var primaryKey = "";

        foreach (var prop in type.GetProperties())
        {
            var column = prop.GetCustomAttribute<ColumnAttribute>();
            if (column == null) continue;

            var sqlType = GetSqlType(prop.PropertyType, column.MaxLength);
            var nullable = column.IsNullable ? "NULL" : "NOT NULL";
            var identity = column.IsAutoIncrement ? "IDENTITY(1,1)" : "";

            columns.Add($"    [{column.Name}] {sqlType} {identity} {nullable}");

            if (column.IsPrimaryKey)
                primaryKey = column.Name;
        }

        var sql = $"CREATE TABLE {tableName} (\n{string.Join(",\n", columns)}";
        if (!string.IsNullOrEmpty(primaryKey))
            sql += $",\n    CONSTRAINT PK_{table?.Name ?? type.Name} PRIMARY KEY ([{primaryKey}])";
        sql += "\n)";

        return sql;
    }

    private static string GetSqlType(Type type, int maxLength)
    {
        if (type == typeof(int)) return "INT";
        if (type == typeof(long)) return "BIGINT";
        if (type == typeof(string)) return maxLength > 0 ? $"NVARCHAR({maxLength})" : "NVARCHAR(MAX)";
        if (type == typeof(DateTime)) return "DATETIME2";
        if (type == typeof(bool)) return "BIT";
        if (type == typeof(decimal)) return "DECIMAL(18,2)";
        return "NVARCHAR(MAX)";
    }
}

// Usage
var sql = SqlGenerator.GenerateCreateTable<User>();
Console.WriteLine(sql);
// Output:
// CREATE TABLE app.Users (
//     [user_id] INT IDENTITY(1,1) NOT NULL,
//     [user_name] NVARCHAR(100)  NOT NULL,
//     [email] NVARCHAR(200)  NULL,
//     [department_id] INT  NULL,
//     CONSTRAINT PK_Users PRIMARY KEY ([user_id])
// )
```

### Unit Testing Framework

```csharp
// Test attributes
[AttributeUsage(AttributeTargets.Method)]
public class TestAttribute : Attribute
{
    public string Description { get; set; }
}

[AttributeUsage(AttributeTargets.Method)]
public class SetUpAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Method)]
public class TearDownAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Method)]
public class ExpectedExceptionAttribute : Attribute
{
    public Type ExceptionType { get; }
    public ExpectedExceptionAttribute(Type exceptionType) => ExceptionType = exceptionType;
}

[AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
public class TestCaseAttribute : Attribute
{
    public object[] Arguments { get; }
    public object ExpectedResult { get; set; }

    public TestCaseAttribute(params object[] arguments) => Arguments = arguments;
}

// Test runner
public class TestRunner
{
    public static void RunTests(Type testClass)
    {
        Console.WriteLine($"Running test class: {testClass.Name}\n");

        var instance = Activator.CreateInstance(testClass);
        var setUp = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<SetUpAttribute>() != null);
        var tearDown = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<TearDownAttribute>() != null);

        int passed = 0, failed = 0;

        foreach (var method in testClass.GetMethods())
        {
            var testAttr = method.GetCustomAttribute<TestAttribute>();
            var testCases = method.GetCustomAttributes<TestCaseAttribute>().ToList();

            if (testAttr == null && testCases.Count == 0) continue;

            if (testCases.Count > 0)
            {
                // Parameterized tests
                foreach (var testCase in testCases)
                {
                    var result = RunSingleTest(instance, method, setUp, tearDown, testCase.Arguments);
                    if (result) passed++; else failed++;
                }
            }
            else
            {
                // Normal test
                var result = RunSingleTest(instance, method, setUp, tearDown, null);
                if (result) passed++; else failed++;
            }
        }

        Console.WriteLine($"\nResults: {passed} passed, {failed} failed");
    }

    private static bool RunSingleTest(object instance, MethodInfo method,
        MethodInfo setUp, MethodInfo tearDown, object[] args)
    {
        var testName = args != null
            ? $"{method.Name}({string.Join(", ", args)})"
            : method.Name;

        try
        {
            setUp?.Invoke(instance, null);

            var expectedEx = method.GetCustomAttribute<ExpectedExceptionAttribute>();

            try
            {
                method.Invoke(instance, args);

                if (expectedEx != null)
                {
                    Console.WriteLine($"  [FAILED] {testName}: Expected {expectedEx.ExceptionType.Name} to be thrown");
                    return false;
                }

                Console.WriteLine($"  [PASSED] {testName}");
                return true;
            }
            catch (TargetInvocationException ex)
            {
                if (expectedEx != null && expectedEx.ExceptionType == ex.InnerException?.GetType())
                {
                    Console.WriteLine($"  [PASSED] {testName}");
                    return true;
                }
                throw;
            }
        }
        catch (Exception ex)
        {
            var inner = ex is TargetInvocationException tie ? tie.InnerException : ex;
            Console.WriteLine($"  [FAILED] {testName}: {inner?.Message}");
            return false;
        }
        finally
        {
            tearDown?.Invoke(instance, null);
        }
    }
}

// Test class example
public class CalculatorTests
{
    private Calculator _calc;

    [SetUp]
    public void Setup()
    {
        _calc = new Calculator();
    }

    [Test(Description = "Test addition")]
    public void TestAdd()
    {
        Assert.AreEqual(5, _calc.Add(2, 3));
    }

    [TestCase(1, 1, ExpectedResult = 2)]
    [TestCase(0, 0, ExpectedResult = 0)]
    [TestCase(-1, 1, ExpectedResult = 0)]
    public int TestAddParameterized(int a, int b)
    {
        return _calc.Add(a, b);
    }

    [Test]
    [ExpectedException(typeof(DivideByZeroException))]
    public void TestDivideByZero()
    {
        _calc.Divide(1, 0);
    }
}
```

### Configuration Binding

```csharp
// Configuration attributes
[AttributeUsage(AttributeTargets.Class)]
public class ConfigurationSectionAttribute : Attribute
{
    public string SectionName { get; }
    public ConfigurationSectionAttribute(string sectionName) => SectionName = sectionName;
}

[AttributeUsage(AttributeTargets.Property)]
public class ConfigurationKeyAttribute : Attribute
{
    public string Key { get; }
    public object DefaultValue { get; set; }
    public bool Required { get; set; }

    public ConfigurationKeyAttribute(string key) => Key = key;
}

// Configuration class
[ConfigurationSection("Database")]
public class DatabaseConfig
{
    [ConfigurationKey("ConnectionString", Required = true)]
    public string ConnectionString { get; set; }

    [ConfigurationKey("CommandTimeout", DefaultValue = 30)]
    public int CommandTimeout { get; set; }

    [ConfigurationKey("EnablePooling", DefaultValue = true)]
    public bool EnablePooling { get; set; }

    [ConfigurationKey("MaxPoolSize", DefaultValue = 100)]
    public int MaxPoolSize { get; set; }
}

// Configuration binder
public class ConfigurationBinder
{
    private readonly Dictionary<string, Dictionary<string, string>> _config;

    public ConfigurationBinder(Dictionary<string, Dictionary<string, string>> config)
    {
        _config = config;
    }

    public T Bind<T>() where T : new()
    {
        var type = typeof(T);
        var sectionAttr = type.GetCustomAttribute<ConfigurationSectionAttribute>();
        var sectionName = sectionAttr?.SectionName ?? type.Name;

        if (!_config.TryGetValue(sectionName, out var section))
        {
            section = new Dictionary<string, string>();
        }

        var instance = new T();

        foreach (var prop in type.GetProperties())
        {
            var keyAttr = prop.GetCustomAttribute<ConfigurationKeyAttribute>();
            if (keyAttr == null) continue;

            if (section.TryGetValue(keyAttr.Key, out var value))
            {
                prop.SetValue(instance, Convert.ChangeType(value, prop.PropertyType));
            }
            else if (keyAttr.Required)
            {
                throw new InvalidOperationException($"Required configuration {sectionName}:{keyAttr.Key} not found");
            }
            else if (keyAttr.DefaultValue != null)
            {
                prop.SetValue(instance, keyAttr.DefaultValue);
            }
        }

        return instance;
    }
}

// Usage
var config = new Dictionary<string, Dictionary<string, string>>
{
    ["Database"] = new Dictionary<string, string>
    {
        ["ConnectionString"] = "Server=localhost;Database=MyDb;",
        ["CommandTimeout"] = "60"
    }
};

var binder = new ConfigurationBinder(config);
var dbConfig = binder.Bind<DatabaseConfig>();

Console.WriteLine($"Connection string: {dbConfig.ConnectionString}");
Console.WriteLine($"Command timeout: {dbConfig.CommandTimeout}");  // 60 (from config)
Console.WriteLine($"Enable pooling: {dbConfig.EnablePooling}");    // true (default value)
Console.WriteLine($"Max pool size: {dbConfig.MaxPoolSize}");       // 100 (default value)
```

## Interview Key Points

### Basic Questions

**Q1: What are C# attributes? How are they different from comments?**

Attributes are declarative information added to program elements that are compiled into the assembly's metadata and can be read at runtime through reflection. Comments, on the other hand, are just text for developers and are not compiled.

**Q2: How do you create a custom attribute?**

```csharp
// 1. Inherit from System.Attribute
// 2. Use AttributeUsage to specify usage scope
// 3. Define constructors and properties

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class MyAttribute : Attribute
{
    public string Name { get; }
    public int Priority { get; set; }

    public MyAttribute(string name)
    {
        Name = name;
    }
}
```

**Q3: What are the three parameters of AttributeUsage and what do they do?**

- `ValidOn` (AttributeTargets): Specifies which code elements the attribute can be applied to
- `AllowMultiple`: Whether multiple applications on the same element are allowed
- `Inherited`: Whether derived classes or overriding methods inherit this attribute

### Intermediate Questions

**Q4: Explain the difference between positional parameters and named parameters.**

```csharp
// Positional parameters: Defined via constructor, must be provided in order
public MyAttribute(string name, int value) { }
[MyAttribute("test", 42)]

// Named parameters: Defined via public properties, optional and order-independent
public int Priority { get; set; }
[MyAttribute("test", 42, Priority = 1)]
```

**Q5: What types can attribute parameters be?**

- Primitive types (bool, byte, char, short, int, long, float, double)
- string
- Type
- enum
- One-dimensional arrays of the above types
- object (can only be assigned values of the above types)

**Q6: How do you read attribute information?**

```csharp
// Using reflection
Type type = typeof(MyClass);

// Get class attributes
var classAttr = type.GetCustomAttribute<MyAttribute>();
var allAttrs = type.GetCustomAttributes(true);

// Get method attributes
var method = type.GetMethod("MyMethod");
var methodAttr = method.GetCustomAttribute<MyAttribute>();

// Get property attributes
var prop = type.GetProperty("MyProperty");
var propAttr = prop.GetCustomAttribute<MyAttribute>();
```

### Advanced Questions

**Q7: What does the inherit parameter of GetCustomAttributes do?**

When `inherit = true`, it searches the inheritance chain for attributes. For classes, it looks for attributes on base classes; for methods, it looks for attributes on overridden virtual methods.

**Q8: When are attributes instantiated?**

Attribute information is stored in metadata at compile time, but the actual attribute object is only instantiated when accessed via reflection.

**Q9: How can you optimize attribute reflection performance?**

```csharp
// 1. Cache reflection results
private static readonly ConcurrentDictionary<Type, MyAttribute> _cache = new();

// 2. Use generic static classes
public static class AttrCache<T> where T : Attribute
{
    public static readonly T Value = typeof(T).GetCustomAttribute<T>();
}

// 3. Use Source Generators to generate code at compile time
// 4. Use expression trees to compile delegates
```

**Q10: How does the Conditional attribute work?**

A method marked with `[Conditional("DEBUG")]`, if the DEBUG symbol is not defined at compile time, will have calls to that method removed by the compiler (the method itself still exists). This is different from `#if DEBUG`, which completely removes the code block.

## Further Reading

### Official Documentation

- [Microsoft Docs - Attributes](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/attributes/)
- [Microsoft Docs - Creating Custom Attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/writing-custom-attributes)
- [Microsoft Docs - Retrieving Information Stored in Attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/retrieving-information-stored-in-attributes)
- [Microsoft Docs - AttributeUsage](https://docs.microsoft.com/en-us/dotnet/api/system.attributeusageattribute)

### Recommended Books

- "C# in Depth" by Jon Skeet - Deep dive into attribute mechanisms
- "CLR via C#" by Jeffrey Richter - Detailed coverage of metadata and reflection
- "Pro C# 10 with .NET 6" by Andrew Troelsen - Comprehensive C# attribute guide

### Related Technologies

- **Source Generators**: Compile-time code generation that can replace runtime reflection for reading attributes
- **System.Reflection.Emit**: Dynamic IL code generation
- **Expression Trees**: For building dynamic code
- **Roslyn Analyzers**: Roslyn-based code analyzers that can analyze attributes at compile time

### Attribute Usage in Frameworks

- **ASP.NET Core**: `[Route]`, `[HttpGet]`, `[Authorize]`, `[FromBody]`
- **Entity Framework Core**: `[Table]`, `[Column]`, `[Key]`, `[ForeignKey]`
- **xUnit/NUnit**: `[Fact]`, `[Theory]`, `[Test]`, `[TestCase]`
- **System.Text.Json**: `[JsonPropertyName]`, `[JsonIgnore]`, `[JsonConverter]`
- **AutoMapper**: `[AutoMap]`, `[Ignore]`
