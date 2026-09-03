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
origin: old/src/content/docs/csharp/attributes.zh.md
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

特性（Attributes）是 C# 中一种强大的元数据机制，它允许你向程序的各种元素（类、方法、属性、字段等）添加声明性信息。这些信息在编译时嵌入到程序集中，并可以在运行时通过反射读取和处理。

## 概念解释

### 什么是特性

特性是一种特殊的类，继承自 `System.Attribute` 基类。它们用于在代码中添加元数据（描述数据的数据），这些元数据可以影响编译器的行为、运行时的处理方式，或者为工具和框架提供配置信息。

```csharp
using System;

// 使用内置特性
[Obsolete("此方法已过时，请使用 NewMethod 代替")]
public void OldMethod()
{
    // 旧的实现
}

// 使用多个特性
[Serializable]
[Obsolete("请使用 NewClass")]
public class LegacyClass
{
    // 类实现
}

// 特性也可以写在同一行
[Serializable, Obsolete("请使用 NewClass")]
public class AnotherLegacyClass
{
    // 类实现
}
```

### 特性的历史背景

特性的概念源于对"声明式编程"的追求。在 C# 1.0 发布时（2002年），特性就是语言的核心特性之一。它的设计灵感来自于 Java 的注解（Annotations）和 COM 中的属性概念。

随着 .NET 框架的发展，特性的应用越来越广泛：
- ASP.NET 使用特性进行路由配置和验证
- Entity Framework 使用特性定义数据库映射
- xUnit/NUnit 使用特性标记测试方法
- 序列化框架使用特性控制序列化行为

### 特性解决的问题

1. **关注点分离**：将元数据与业务逻辑分离
2. **配置简化**：用声明式代码替代复杂的配置文件
3. **代码即文档**：特性本身就是一种自描述的文档
4. **框架扩展**：为框架提供灵活的扩展机制
5. **AOP 支持**：面向切面编程的基础设施

## 核心原理

### 特性的编译过程

当编译器遇到特性时，它会：

1. 验证特性类是否存在且继承自 `System.Attribute`
2. 检查特性的构造函数参数和命名参数
3. 将特性信息序列化到程序集的元数据中

```csharp
// 编译前的代码
[MyAttribute("参数值", NamedParam = 42)]
public class MyClass { }

// 编译后，特性信息存储在程序集元数据中
// 可以通过 IL DASM 或 dnSpy 查看元数据
```

### AttributeUsage 特性

`AttributeUsage` 是一个元特性（用于特性的特性），它控制自定义特性的使用方式：

```csharp
[AttributeUsage(
    AttributeTargets.Class | AttributeTargets.Method,  // 可应用的目标
    AllowMultiple = true,                              // 是否允许多次应用
    Inherited = true                                   // 是否被派生类继承
)]
public class MyCustomAttribute : Attribute
{
    // 特性实现
}
```

### AttributeTargets 枚举

`AttributeTargets` 定义了特性可以应用的代码元素：

```csharp
[Flags]
public enum AttributeTargets
{
    Assembly = 1,           // 程序集
    Module = 2,             // 模块
    Class = 4,              // 类
    Struct = 8,             // 结构体
    Enum = 16,              // 枚举
    Constructor = 32,       // 构造函数
    Method = 64,            // 方法
    Property = 128,         // 属性
    Field = 256,            // 字段
    Event = 512,            // 事件
    Interface = 1024,       // 接口
    Parameter = 2048,       // 参数
    Delegate = 4096,        // 委托
    ReturnValue = 8192,     // 返回值
    GenericParameter = 16384, // 泛型参数
    All = 32767             // 所有目标
}
```

### 特性的存储机制

特性信息存储在程序集的元数据表中，主要涉及以下表：

- **CustomAttribute 表**：存储特性实例
- **Blob 堆**：存储特性构造函数参数和命名参数的值

```csharp
// 使用 System.Reflection.Metadata 读取原始元数据
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
        // 处理特性元数据
    }
}
```

## 核心要点

### 特性的语法规则

```csharp
// 1. 基本语法：方括号 + 特性名称
[Serializable]
public class Data { }

// 2. 特性可以省略 "Attribute" 后缀
[Obsolete]  // 等同于 [ObsoleteAttribute]
public void OldMethod() { }

// 3. 带参数的特性
[Obsolete("此方法已弃用", true)]  // 位置参数
public void VeryOldMethod() { }

// 4. 命名参数
[DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
public static extern int MessageBox(IntPtr hWnd, string text, string caption, int type);

// 5. 多个特性
[Serializable]
[Obsolete]
public class LegacyData { }

// 或写在一行
[Serializable, Obsolete]
public class LegacyData2 { }

// 6. 特性目标说明符
[assembly: AssemblyVersion("1.0.0.0")]        // 程序集级别
[module: SuppressMessage("StyleCop", "SA1000")]  // 模块级别

// 7. 返回值和参数的特性
[return: MarshalAs(UnmanagedType.Bool)]
public static extern bool SomeFunction([In] int param);
```

### 常用内置特性

#### 编译器特性

```csharp
// Obsolete - 标记过时的代码
[Obsolete("请使用 NewMethod")]  // 警告
[Obsolete("此方法已删除", true)]  // 错误

// Conditional - 条件编译
[Conditional("DEBUG")]
public void DebugLog(string message)
{
    Console.WriteLine(message);
}

// CallerInfo - 调用者信息
public void Log(string message,
    [CallerMemberName] string memberName = "",
    [CallerFilePath] string filePath = "",
    [CallerLineNumber] int lineNumber = 0)
{
    Console.WriteLine($"[{memberName}] {message} ({filePath}:{lineNumber})");
}

// MethodImpl - 方法实现选项
[MethodImpl(MethodImplOptions.AggressiveInlining)]
public int FastAdd(int a, int b) => a + b;

[MethodImpl(MethodImplOptions.Synchronized)]
public void ThreadSafeMethod() { }

[MethodImpl(MethodImplOptions.NoInlining)]
public void NeverInline() { }
```

#### 序列化特性

```csharp
// Serializable - 标记类可序列化
[Serializable]
public class SerializableData
{
    public string Name { get; set; }

    [NonSerialized]
    private int _cacheValue;  // 不参与序列化
}

// JSON 序列化特性 (System.Text.Json)
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

// XML 序列化特性
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

#### 互操作特性

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

// StructLayout - 结构体布局
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

// MarshalAs - 类型封送
[DllImport("native.dll")]
public static extern void ProcessString(
    [MarshalAs(UnmanagedType.LPWStr)] string str);
```

#### 数据验证特性 (System.ComponentModel.DataAnnotations)

```csharp
public class UserModel
{
    [Required(ErrorMessage = "用户名是必需的")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50之间")]
    public string Username { get; set; }

    [Required]
    [EmailAddress(ErrorMessage = "邮箱格式不正确")]
    public string Email { get; set; }

    [Range(0, 150, ErrorMessage = "年龄必须在0-150之间")]
    public int Age { get; set; }

    [RegularExpression(@"^\d{11}$", ErrorMessage = "手机号必须是11位数字")]
    public string Phone { get; set; }

    [Compare("Password", ErrorMessage = "两次输入的密码不一致")]
    public string ConfirmPassword { get; set; }

    [Url(ErrorMessage = "URL格式不正确")]
    public string Website { get; set; }

    [CreditCard(ErrorMessage = "信用卡号格式不正确")]
    public string CreditCardNumber { get; set; }
}

// 自定义验证特性
public class MinAgeAttribute : ValidationAttribute
{
    private readonly int _minAge;

    public MinAgeAttribute(int minAge)
    {
        _minAge = minAge;
        ErrorMessage = $"年龄必须大于等于 {minAge} 岁";
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

## 代码示例

### 创建自定义特性

```csharp
using System;
using System.Reflection;

// 基本的自定义特性
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

// 使用自定义特性
[Author("张三", Email = "zhangsan@example.com", Version = "2.0")]
public class MyService
{
    [Author("李四")]
    public void DoWork()
    {
        Console.WriteLine("执行工作");
    }
}
```

### 允许多次应用的特性

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

// 多次应用
[Tag("重要", Description = "关键功能")]
[Tag("性能敏感")]
[Tag("需要测试")]
public class CriticalService
{
    // 实现
}
```

### 带验证的特性

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
            throw new ArgumentException("最小值不能大于最大值");

        Minimum = minimum;
        Maximum = maximum;
        ErrorMessage = $"值必须在 {minimum} 和 {maximum} 之间";
    }

    public bool IsValid(int value)
    {
        return value >= Minimum && value <= Maximum;
    }
}

// 字符串长度验证特性
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

// 必填字段特性
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class RequiredAttribute : Attribute
{
    public string ErrorMessage { get; set; } = "此字段是必需的";
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

### 通过反射读取特性

```csharp
using System;
using System.Reflection;
using System.Linq;

public class AttributeReader
{
    // 读取类上的特性
    public static void ReadClassAttributes<T>()
    {
        Type type = typeof(T);
        Console.WriteLine($"类 {type.Name} 的特性:");

        // 获取所有特性
        object[] attributes = type.GetCustomAttributes(true);
        foreach (var attr in attributes)
        {
            Console.WriteLine($"  - {attr.GetType().Name}");

            // 读取特性属性
            foreach (var prop in attr.GetType().GetProperties())
            {
                var value = prop.GetValue(attr);
                Console.WriteLine($"      {prop.Name}: {value}");
            }
        }
    }

    // 读取特定类型的特性
    public static TAttribute GetAttribute<TAttribute>(Type type) where TAttribute : Attribute
    {
        return type.GetCustomAttribute<TAttribute>();
    }

    // 检查是否存在特性
    public static bool HasAttribute<TAttribute>(MemberInfo member) where TAttribute : Attribute
    {
        return member.GetCustomAttribute<TAttribute>() != null;
    }

    // 读取方法特性
    public static void ReadMethodAttributes(Type type)
    {
        Console.WriteLine($"\n类 {type.Name} 的方法特性:");

        foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly))
        {
            var attributes = method.GetCustomAttributes(true);
            if (attributes.Length > 0)
            {
                Console.WriteLine($"  方法 {method.Name}:");
                foreach (var attr in attributes)
                {
                    Console.WriteLine($"    - {attr.GetType().Name}");
                }
            }
        }
    }

    // 读取属性上的特性
    public static void ReadPropertyAttributes(Type type)
    {
        Console.WriteLine($"\n类 {type.Name} 的属性特性:");

        foreach (var prop in type.GetProperties())
        {
            var attributes = prop.GetCustomAttributes(true);
            if (attributes.Length > 0)
            {
                Console.WriteLine($"  属性 {prop.Name}:");
                foreach (var attr in attributes)
                {
                    Console.WriteLine($"    - {attr.GetType().Name}");
                }
            }
        }
    }
}

// 使用示例
[Author("张三", Email = "zhangsan@example.com")]
[Tag("服务类")]
public class UserService
{
    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }

    [Author("李四")]
    public void CreateUser()
    {
        // 实现
    }
}

// 调用
AttributeReader.ReadClassAttributes<UserService>();
AttributeReader.ReadMethodAttributes(typeof(UserService));
AttributeReader.ReadPropertyAttributes(typeof(UserService));
```

### 完整的验证框架实现

```csharp
using System;
using System.Collections.Generic;
using System.Reflection;
using System.Linq;

// 验证结果
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

// 验证器
public static class Validator
{
    public static ValidationResult Validate<T>(T obj) where T : class
    {
        var result = new ValidationResult();
        if (obj == null)
        {
            result.AddError("对象不能为空");
            return result;
        }

        Type type = typeof(T);

        foreach (var prop in type.GetProperties())
        {
            object value = prop.GetValue(obj);

            // 检查 Required
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null && !required.IsValid(value))
            {
                result.AddError($"{prop.Name}: {required.ErrorMessage}");
                continue;
            }

            // 检查 StringLength
            var stringLength = prop.GetCustomAttribute<StringLengthAttribute>();
            if (stringLength != null && value is string str)
            {
                if (!stringLength.IsValid(str))
                {
                    result.AddError($"{prop.Name}: 长度必须在 {stringLength.MinimumLength} 到 {stringLength.MaximumLength} 之间");
                }
            }

            // 检查 Range
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

// 使用示例
public class User
{
    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinimumLength = 2)]
    public string Username { get; set; }

    [Required]
    public string Email { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}

// 验证
var user = new User { Username = "A", Age = 200 };
var result = Validator.Validate(user);

Console.WriteLine($"验证结果: {(result.IsValid ? "通过" : "失败")}");
foreach (var error in result.Errors)
{
    Console.WriteLine($"  - {error}");
}
// 输出:
// 验证结果: 失败
//   - Username: 长度必须在 2 到 50 之间
//   - Email: 此字段是必需的
//   - Age: 值必须在 0 和 150 之间
```

### 基于特性的依赖注入

```csharp
// 服务生命周期特性
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

// 自动注入特性
[AttributeUsage(AttributeTargets.Property | AttributeTargets.Field)]
public class InjectAttribute : Attribute { }

// 简单的 DI 容器
public class SimpleContainer
{
    private readonly Dictionary<Type, Func<object>> _registrations = new();
    private readonly Dictionary<Type, object> _singletons = new();

    // 扫描程序集并注册带有 ServiceAttribute 的类
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
        // 获取构造函数
        var ctor = type.GetConstructors().FirstOrDefault();
        if (ctor == null)
            return Activator.CreateInstance(type);

        // 解析构造函数参数
        var parameters = ctor.GetParameters()
            .Select(p => Resolve(p.ParameterType))
            .ToArray();

        var instance = ctor.Invoke(parameters);

        // 注入属性
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
        throw new InvalidOperationException($"服务 {serviceType.Name} 未注册");
    }
}

// 使用示例
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
        Logger?.Log($"保存用户: {user}");
    }
}

// 使用
var container = new SimpleContainer();
container.RegisterFromAssembly(Assembly.GetExecutingAssembly());

var repo = container.Resolve<IUserRepository>();
repo.Save("张三"); // 输出: [LOG] 保存用户: 张三
```

### 基于特性的 Web API 路由

```csharp
// 路由特性
[AttributeUsage(AttributeTargets.Class)]
public class RouteAttribute : Attribute
{
    public string Template { get; }

    public RouteAttribute(string template)
    {
        Template = template;
    }
}

// HTTP 方法特性
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

// 控制器示例
[Route("api/users")]
public class UserController
{
    [HttpGet]
    public string GetAll() => "获取所有用户";

    [HttpGet("{id}")]
    public string GetById(int id) => $"获取用户 {id}";

    [HttpPost]
    public string Create() => "创建用户";

    [HttpPut("{id}")]
    public string Update(int id) => $"更新用户 {id}";

    [HttpDelete("{id}")]
    public string Delete(int id) => $"删除用户 {id}";
}

// 路由扫描器
public class RouteScanner
{
    public static void ScanRoutes(Type controllerType)
    {
        var routeAttr = controllerType.GetCustomAttribute<RouteAttribute>();
        string baseRoute = routeAttr?.Template ?? "";

        Console.WriteLine($"控制器: {controllerType.Name}");
        Console.WriteLine($"基础路由: {baseRoute}");
        Console.WriteLine("端点:");

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

// 使用
RouteScanner.ScanRoutes(typeof(UserController));
// 输出:
// 控制器: UserController
// 基础路由: api/users
// 端点:
//   GET      api/users            -> GetAll
//   GET      api/users/{id}       -> GetById
//   POST     api/users            -> Create
//   PUT      api/users/{id}       -> Update
//   DELETE   api/users/{id}       -> Delete
```

## 最佳实践

### 设计清晰的特性 API

```csharp
// 好的设计：参数语义清晰
[Cache(Duration = 3600, Key = "user_{id}")]
public User GetUser(int id) { }

// 避免：参数含义模糊
[Cache(3600, "user_{id}")]
public User GetUser(int id) { }

// 好的设计：使用枚举而不是魔法字符串
[Authorize(Roles = UserRole.Admin | UserRole.Manager)]
public void AdminAction() { }

// 避免：使用字符串
[Authorize(Roles = "Admin,Manager")]
public void AdminAction() { }
```

### 合理使用 AttributeUsage

```csharp
// 明确指定可应用的目标
[AttributeUsage(AttributeTargets.Method, Inherited = false)]
public class TransactionAttribute : Attribute { }

// 允许多次应用（当需要时）
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

### 提供合理的默认值

```csharp
[AttributeUsage(AttributeTargets.Property)]
public class DisplayAttribute : Attribute
{
    public string Name { get; set; }
    public string Description { get; set; } = "";  // 默认空字符串
    public int Order { get; set; } = 0;            // 默认排序
    public bool Visible { get; set; } = true;      // 默认可见

    public DisplayAttribute(string name)
    {
        Name = name;
    }
}

// 使用时可以只指定必要的参数
[Display("用户名")]
public string Username { get; set; }

// 或指定额外参数
[Display("密码", Visible = false)]
public string Password { get; set; }
```

### 特性与常量结合使用

```csharp
// 定义常量类
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

// 使用常量
[Cache(CacheDurations.Medium, CacheKeys.UserById)]
public User GetUser(int id) { }
```

### 继承与组合

```csharp
// 基础验证特性
public abstract class ValidationAttribute : Attribute
{
    public string ErrorMessage { get; set; }
    public abstract bool IsValid(object value);
}

// 派生特性
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

// 组合多个验证逻辑
public class EmailAttribute : ValidationAttribute
{
    private static readonly Regex EmailRegex =
        new Regex(@"^[\w\.-]+@[\w\.-]+\.\w+$", RegexOptions.Compiled);

    public override bool IsValid(object value)
    {
        if (value == null) return true; // null 由 Required 处理
        return value is string str && EmailRegex.IsMatch(str);
    }
}
```

## 常见陷阱

### 特性参数的限制

```csharp
// 错误：特性参数只能是编译时常量
[MyAttribute(new int[] { 1, 2, 3 })]  // 错误！
[MyAttribute(DateTime.Now)]           // 错误！
[MyAttribute(new MyClass())]          // 错误！

// 正确：使用编译时常量
[MyAttribute(42)]                     // int 常量
[MyAttribute("hello")]                // string 常量
[MyAttribute(typeof(MyClass))]        // Type
[MyAttribute(DayOfWeek.Monday)]       // 枚举
[MyAttribute(new int[] { 1, 2, 3 })]  // 数组字面量（某些情况下）

// 特性参数允许的类型：
// - 基本类型 (bool, byte, char, short, int, long, float, double)
// - string
// - Type
// - 枚举
// - 以上类型的一维数组
// - object（只能赋值上述类型）
```

### 反射性能问题

```csharp
// 错误：每次调用都进行反射
public void ProcessItem<T>(T item)
{
    // 每次调用都会反射，性能差
    var attr = typeof(T).GetCustomAttribute<MyAttribute>();
    // 处理...
}

// 正确：缓存反射结果
private static readonly ConcurrentDictionary<Type, MyAttribute> _attributeCache = new();

public void ProcessItemOptimized<T>(T item)
{
    var attr = _attributeCache.GetOrAdd(typeof(T),
        t => t.GetCustomAttribute<MyAttribute>());
    // 处理...
}
```

### Inherited 参数的误解

```csharp
[AttributeUsage(AttributeTargets.Class, Inherited = true)]
public class InheritedAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public class NotInheritedAttribute : Attribute { }

[InheritedAttribute]
[NotInheritedAttribute]
public class BaseClass { }

public class DerivedClass : BaseClass { }

// 检查
var inheritedOnDerived = typeof(DerivedClass)
    .GetCustomAttribute<InheritedAttribute>(true);  // 不为 null

var notInheritedOnDerived = typeof(DerivedClass)
    .GetCustomAttribute<NotInheritedAttribute>(true);  // 为 null
```

### GetCustomAttributes 参数的影响

```csharp
// inherit 参数的影响
var attrs1 = type.GetCustomAttributes(false);  // 只获取直接声明的特性
var attrs2 = type.GetCustomAttributes(true);   // 包含继承的特性

// 注意：对于方法，inherit=true 会查找被重写的方法的特性
public class Base
{
    [MyAttribute]
    public virtual void Method() { }
}

public class Derived : Base
{
    public override void Method() { }
}

// Derived.Method() 上直接没有 MyAttribute
// 但 GetCustomAttribute<MyAttribute>(true) 会返回 Base.Method() 上的特性
```

### 特性实例化时机

```csharp
// 特性只在通过反射访问时才实例化
[MyAttribute("test")]  // 此时特性未实例化
public class MyClass { }

// 当调用 GetCustomAttribute 时才创建实例
var attr = typeof(MyClass).GetCustomAttribute<MyAttribute>();  // 此时实例化

// 每次调用都可能创建新实例（取决于实现）
var attr1 = typeof(MyClass).GetCustomAttribute<MyAttribute>();
var attr2 = typeof(MyClass).GetCustomAttribute<MyAttribute>();
// attr1 和 attr2 可能是不同的实例
```

## 性能考量

### 反射开销

```csharp
// 性能测试对比
public class PerformanceComparison
{
    private static readonly Type _type = typeof(TestClass);
    private static readonly MyAttribute _cachedAttr;

    static PerformanceComparison()
    {
        _cachedAttr = _type.GetCustomAttribute<MyAttribute>();
    }

    // 慢：每次反射
    public MyAttribute GetAttributeSlow()
    {
        return typeof(TestClass).GetCustomAttribute<MyAttribute>();
    }

    // 快：使用缓存
    public MyAttribute GetAttributeFast()
    {
        return _cachedAttr;
    }
}

// 基准测试结果示例（仅供参考）：
// GetAttributeSlow: ~500ns
// GetAttributeFast: ~1ns
// 差异可达 500 倍
```

### 缓存策略

```csharp
// 使用泛型静态类进行类型级缓存
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

// 使用
var hasAttr = AttributeCache<MyClass, SerializableAttribute>.HasAttribute;

// 属性级缓存
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

### 使用委托优化

```csharp
// 对于频繁访问的特性验证，使用编译后的委托
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

        // 初始化 result
        statements.Add(Expression.Assign(resultVar,
            Expression.New(typeof(ValidationResult))));

        foreach (var prop in typeof(T).GetProperties())
        {
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null)
            {
                // 生成验证代码...
            }
        }

        statements.Add(resultVar);

        var body = Expression.Block(new[] { resultVar }, statements);
        return Expression.Lambda<Func<T, ValidationResult>>(body, param).Compile();
    }

    public static ValidationResult Validate(T obj) => _validator(obj);
}
```

### Source Generator 替代方案

从 .NET 5 开始，可以使用 Source Generator 在编译时生成代码，完全避免运行时反射：

```csharp
// 定义生成器标记特性
[AttributeUsage(AttributeTargets.Class)]
public class GenerateValidatorAttribute : Attribute { }

// 标记类
[GenerateValidator]
public partial class User
{
    [Required]
    public string Name { get; set; }

    [Range(0, 150)]
    public int Age { get; set; }
}

// Source Generator 会在编译时生成类似以下代码：
public partial class User
{
    public static ValidationResult Validate(User obj)
    {
        var result = new ValidationResult();

        if (string.IsNullOrWhiteSpace(obj.Name))
            result.AddError("Name: 此字段是必需的");

        if (obj.Age < 0 || obj.Age > 150)
            result.AddError("Age: 值必须在 0 和 150 之间");

        return result;
    }
}
```

## 实战场景

### ORM 映射

```csharp
// 表映射特性
[AttributeUsage(AttributeTargets.Class)]
public class TableAttribute : Attribute
{
    public string Name { get; }
    public string Schema { get; set; } = "dbo";

    public TableAttribute(string name) => Name = name;
}

// 列映射特性
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

// 外键特性
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

// 实体定义
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

// SQL 生成器
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

// 使用
var sql = SqlGenerator.GenerateCreateTable<User>();
Console.WriteLine(sql);
// 输出:
// CREATE TABLE app.Users (
//     [user_id] INT IDENTITY(1,1) NOT NULL,
//     [user_name] NVARCHAR(100)  NOT NULL,
//     [email] NVARCHAR(200)  NULL,
//     [department_id] INT  NULL,
//     CONSTRAINT PK_Users PRIMARY KEY ([user_id])
// )
```

### 单元测试框架

```csharp
// 测试特性
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

// 测试运行器
public class TestRunner
{
    public static void RunTests(Type testClass)
    {
        Console.WriteLine($"运行测试类: {testClass.Name}\n");

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
                // 参数化测试
                foreach (var testCase in testCases)
                {
                    var result = RunSingleTest(instance, method, setUp, tearDown, testCase.Arguments);
                    if (result) passed++; else failed++;
                }
            }
            else
            {
                // 普通测试
                var result = RunSingleTest(instance, method, setUp, tearDown, null);
                if (result) passed++; else failed++;
            }
        }

        Console.WriteLine($"\n结果: {passed} 通过, {failed} 失败");
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
                    Console.WriteLine($"  [失败] {testName}: 期望抛出 {expectedEx.ExceptionType.Name}");
                    return false;
                }

                Console.WriteLine($"  [通过] {testName}");
                return true;
            }
            catch (TargetInvocationException ex)
            {
                if (expectedEx != null && expectedEx.ExceptionType == ex.InnerException?.GetType())
                {
                    Console.WriteLine($"  [通过] {testName}");
                    return true;
                }
                throw;
            }
        }
        catch (Exception ex)
        {
            var inner = ex is TargetInvocationException tie ? tie.InnerException : ex;
            Console.WriteLine($"  [失败] {testName}: {inner?.Message}");
            return false;
        }
        finally
        {
            tearDown?.Invoke(instance, null);
        }
    }
}

// 测试类示例
public class CalculatorTests
{
    private Calculator _calc;

    [SetUp]
    public void Setup()
    {
        _calc = new Calculator();
    }

    [Test(Description = "测试加法")]
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

### 配置绑定

```csharp
// 配置特性
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

// 配置类
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

// 配置绑定器
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
                throw new InvalidOperationException($"必需的配置项 {sectionName}:{keyAttr.Key} 未找到");
            }
            else if (keyAttr.DefaultValue != null)
            {
                prop.SetValue(instance, keyAttr.DefaultValue);
            }
        }

        return instance;
    }
}

// 使用
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

Console.WriteLine($"连接字符串: {dbConfig.ConnectionString}");
Console.WriteLine($"命令超时: {dbConfig.CommandTimeout}");  // 60（从配置读取）
Console.WriteLine($"启用池: {dbConfig.EnablePooling}");    // true（默认值）
Console.WriteLine($"最大池大小: {dbConfig.MaxPoolSize}");  // 100（默认值）
```

## 面试要点

### 基础问题

**Q1: 什么是 C# 特性？它与注释有什么区别？**

特性是一种添加到程序元素的声明性信息，这些信息会被编译到程序集的元数据中，可以在运行时通过反射读取。而注释只是给开发者看的文本，不会被编译。

**Q2: 如何创建自定义特性？**

```csharp
// 1. 继承 System.Attribute
// 2. 使用 AttributeUsage 指定使用范围
// 3. 定义构造函数和属性

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

**Q3: AttributeUsage 的三个参数分别是什么作用？**

- `ValidOn`（AttributeTargets）：指定特性可以应用的代码元素
- `AllowMultiple`：是否允许在同一元素上多次应用
- `Inherited`：派生类或重写方法是否继承此特性

### 进阶问题

**Q4: 解释位置参数和命名参数的区别。**

```csharp
// 位置参数：通过构造函数定义，必须按顺序提供
public MyAttribute(string name, int value) { }
[MyAttribute("test", 42)]

// 命名参数：通过公共属性定义，可选且顺序无关
public int Priority { get; set; }
[MyAttribute("test", 42, Priority = 1)]
```

**Q5: 特性参数可以是哪些类型？**

- 基本类型（bool, byte, char, short, int, long, float, double）
- string
- Type
- 枚举
- 以上类型的一维数组
- object（只能赋值上述类型的值）

**Q6: 如何读取特性信息？**

```csharp
// 使用反射
Type type = typeof(MyClass);

// 获取类上的特性
var classAttr = type.GetCustomAttribute<MyAttribute>();
var allAttrs = type.GetCustomAttributes(true);

// 获取方法上的特性
var method = type.GetMethod("MyMethod");
var methodAttr = method.GetCustomAttribute<MyAttribute>();

// 获取属性上的特性
var prop = type.GetProperty("MyProperty");
var propAttr = prop.GetCustomAttribute<MyAttribute>();
```

### 高级问题

**Q7: GetCustomAttributes 的 inherit 参数有什么作用？**

当 `inherit = true` 时，会搜索继承链查找特性。对于类，会查找基类上的特性；对于方法，会查找被重写的虚方法上的特性。

**Q8: 特性是什么时候实例化的？**

特性在编译时会将其信息存储在元数据中，但实际的特性对象只有在通过反射访问时才会被实例化。

**Q9: 如何优化特性反射的性能？**

```csharp
// 1. 缓存反射结果
private static readonly ConcurrentDictionary<Type, MyAttribute> _cache = new();

// 2. 使用泛型静态类
public static class AttrCache<T> where T : Attribute
{
    public static readonly T Value = typeof(T).GetCustomAttribute<T>();
}

// 3. 使用 Source Generator 在编译时生成代码
// 4. 使用表达式树编译委托
```

**Q10: Conditional 特性是如何工作的？**

`[Conditional("DEBUG")]` 标记的方法，如果编译时未定义 DEBUG 符号，则对该方法的调用会被编译器移除（方法本身仍存在）。这与 `#if DEBUG` 不同，后者会完全移除代码块。

## 延伸阅读

### 官方文档

- [Microsoft Docs - Attributes](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/attributes/)
- [Microsoft Docs - Creating Custom Attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/writing-custom-attributes)
- [Microsoft Docs - Retrieving Information Stored in Attributes](https://docs.microsoft.com/en-us/dotnet/standard/attributes/retrieving-information-stored-in-attributes)
- [Microsoft Docs - AttributeUsage](https://docs.microsoft.com/en-us/dotnet/api/system.attributeusageattribute)

### 书籍推荐

- 《C# in Depth》 by Jon Skeet - 深入讲解特性机制
- 《CLR via C#》 by Jeffrey Richter - 详细介绍元数据和反射
- 《Pro C# 10 with .NET 6》 by Andrew Troelsen - 全面的 C# 特性指南

### 相关技术

- **Source Generators**：编译时代码生成，可以替代运行时反射读取特性
- **System.Reflection.Emit**：动态生成 IL 代码
- **Expression Trees**：表达式树，用于构建动态代码
- **Roslyn Analyzers**：基于 Roslyn 的代码分析器，可以在编译时分析特性

### 框架中的特性应用

- **ASP.NET Core**：`[Route]`, `[HttpGet]`, `[Authorize]`, `[FromBody]`
- **Entity Framework Core**：`[Table]`, `[Column]`, `[Key]`, `[ForeignKey]`
- **xUnit/NUnit**：`[Fact]`, `[Theory]`, `[Test]`, `[TestCase]`
- **System.Text.Json**：`[JsonPropertyName]`, `[JsonIgnore]`, `[JsonConverter]`
- **AutoMapper**：`[AutoMap]`, `[Ignore]`
