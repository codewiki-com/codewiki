---
title: 反射
description: C#反射完全指南，运行时类型信息、动态调用与元数据
track: csharp
section: types-linq
difficulty: advanced
tags:
  - C#
  - 反射
  - Type
  - 元编程
status: imported
origin: old/src/content/docs/csharp/reflection.zh.md
divergence: 0.22
issues:
  - title-lang-en
  - title-language
legacy:
  category: CSharp
  subcategory: 高级特性
  order: 10
  lastUpdated: 2026-01-07
---

反射（Reflection）是 .NET 中最强大的元编程特性之一，它允许程序在运行时检查、访问和修改自身的元数据。通过反射，我们可以动态地创建对象、调用方法、访问属性，甚至可以在运行时生成新的类型。

## 什么是反射

反射是一种机制，允许程序在运行时：

- 获取类型的元数据（类名、属性、方法、字段等）
- 动态创建对象实例
- 调用方法和访问属性
- 读取和应用特性（Attributes）
- 加载和检查程序集

```csharp
using System;
using System.Reflection;

// 简单的反射示例
Type stringType = typeof(string);
Console.WriteLine($"类型名称: {stringType.Name}");
Console.WriteLine($"完整名称: {stringType.FullName}");
Console.WriteLine($"程序集: {stringType.Assembly.GetName().Name}");
Console.WriteLine($"是否为类: {stringType.IsClass}");
Console.WriteLine($"是否密封: {stringType.IsSealed}");

// 获取所有公共方法
MethodInfo[] methods = stringType.GetMethods(BindingFlags.Public | BindingFlags.Instance);
Console.WriteLine($"\nstring 类型有 {methods.Length} 个公共实例方法");
```

## Type 类详解

`Type` 类是反射的核心，它表示类型声明：类类型、接口类型、数组类型、值类型、枚举类型、类型参数、泛型类型定义以及开放或封闭构造的泛型类型。

### 获取 Type 对象

有多种方式可以获取 `Type` 对象：

```csharp
// 方式1：使用 typeof 运算符（编译时确定）
Type type1 = typeof(string);
Type type2 = typeof(List<int>);
Type type3 = typeof(Dictionary<,>); // 开放泛型类型

// 方式2：使用对象的 GetType() 方法（运行时确定）
string str = "Hello";
Type type4 = str.GetType();

object obj = 42;
Type type5 = obj.GetType(); // System.Int32，不是 System.Object

// 方式3：使用 Type.GetType() 静态方法（通过名称）
Type type6 = Type.GetType("System.String");
Type type7 = Type.GetType("System.Collections.Generic.List`1[[System.Int32]]");

// 方式4：从程序集获取
Assembly assembly = Assembly.GetExecutingAssembly();
Type type8 = assembly.GetType("MyNamespace.MyClass");

// 比较 Type 对象
Console.WriteLine(type1 == type4); // True
Console.WriteLine(type1.Equals(type4)); // True
Console.WriteLine(ReferenceEquals(type1, type4)); // True（Type 对象是缓存的）
```

### Type 的重要属性

```csharp
public class TypeProperties
{
    public static void InspectType(Type type)
    {
        Console.WriteLine($"=== {type.Name} ===");

        // 基本信息
        Console.WriteLine($"Name: {type.Name}");
        Console.WriteLine($"FullName: {type.FullName}");
        Console.WriteLine($"Namespace: {type.Namespace}");
        Console.WriteLine($"AssemblyQualifiedName: {type.AssemblyQualifiedName}");

        // 类型分类
        Console.WriteLine($"IsClass: {type.IsClass}");
        Console.WriteLine($"IsInterface: {type.IsInterface}");
        Console.WriteLine($"IsAbstract: {type.IsAbstract}");
        Console.WriteLine($"IsSealed: {type.IsSealed}");
        Console.WriteLine($"IsValueType: {type.IsValueType}");
        Console.WriteLine($"IsEnum: {type.IsEnum}");
        Console.WriteLine($"IsArray: {type.IsArray}");
        Console.WriteLine($"IsPrimitive: {type.IsPrimitive}");

        // 泛型信息
        Console.WriteLine($"IsGenericType: {type.IsGenericType}");
        Console.WriteLine($"IsGenericTypeDefinition: {type.IsGenericTypeDefinition}");
        Console.WriteLine($"IsConstructedGenericType: {type.IsConstructedGenericType}");

        // 继承关系
        Console.WriteLine($"BaseType: {type.BaseType?.Name ?? "null"}");
        Console.WriteLine($"实现的接口: {string.Join(", ", type.GetInterfaces().Select(i => i.Name))}");

        // 可访问性
        Console.WriteLine($"IsPublic: {type.IsPublic}");
        Console.WriteLine($"IsNotPublic: {type.IsNotPublic}");
        Console.WriteLine($"IsNested: {type.IsNested}");
    }
}

// 使用示例
TypeProperties.InspectType(typeof(List<string>));
TypeProperties.InspectType(typeof(IEnumerable<>));
TypeProperties.InspectType(typeof(int));
TypeProperties.InspectType(typeof(DayOfWeek));
```

### 类型继承和实现检查

```csharp
public class TypeHierarchy
{
    // 检查类型是否可以赋值给另一个类型
    public static void CheckAssignability()
    {
        Type stringType = typeof(string);
        Type objectType = typeof(object);
        Type iEnumerableType = typeof(IEnumerable<char>);

        // IsAssignableFrom - 检查是否可以从另一个类型赋值
        Console.WriteLine(objectType.IsAssignableFrom(stringType));     // True
        Console.WriteLine(iEnumerableType.IsAssignableFrom(stringType)); // True
        Console.WriteLine(stringType.IsAssignableFrom(objectType));     // False

        // IsSubclassOf - 检查是否是子类（不包括接口）
        Console.WriteLine(stringType.IsSubclassOf(objectType));         // True
        Console.WriteLine(stringType.IsSubclassOf(iEnumerableType));    // False（接口不算）

        // IsInstanceOfType - 检查对象是否是该类型的实例
        object str = "Hello";
        Console.WriteLine(stringType.IsInstanceOfType(str));            // True
        Console.WriteLine(objectType.IsInstanceOfType(str));            // True
    }

    // 获取类型层次结构
    public static IEnumerable<Type> GetTypeHierarchy(Type type)
    {
        Type current = type;
        while (current != null)
        {
            yield return current;
            current = current.BaseType;
        }
    }

    // 获取所有实现的接口（包括继承的）
    public static Type[] GetAllInterfaces(Type type)
    {
        return type.GetInterfaces();
    }
}

// 使用
foreach (Type t in TypeHierarchy.GetTypeHierarchy(typeof(List<int>)))
{
    Console.WriteLine(t.FullName);
}
// 输出:
// System.Collections.Generic.List`1[[System.Int32, ...]]
// System.Object
```

## MethodInfo - 方法反射

`MethodInfo` 类提供了关于方法的完整信息，并允许动态调用方法。

### 获取方法信息

```csharp
public class MethodReflection
{
    public void InstanceMethod() { }
    public static void StaticMethod() { }
    public int MethodWithReturn() => 42;
    public void MethodWithParams(string name, int age) { }
    public T GenericMethod<T>(T value) => value;
    private void PrivateMethod() { }
    protected virtual void VirtualMethod() { }
}

public class MethodInspector
{
    public static void InspectMethods()
    {
        Type type = typeof(MethodReflection);

        // 获取所有公共方法（包括继承的）
        MethodInfo[] publicMethods = type.GetMethods();

        // 获取声明在该类型上的公共方法（不包括继承的）
        MethodInfo[] declaredPublicMethods = type.GetMethods(
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

        // 获取所有方法（包括私有和静态）
        MethodInfo[] allMethods = type.GetMethods(
            BindingFlags.Public | BindingFlags.NonPublic |
            BindingFlags.Instance | BindingFlags.Static);

        // 获取特定方法
        MethodInfo method = type.GetMethod("MethodWithParams");

        // 获取具有特定参数类型的方法（处理重载）
        MethodInfo specificMethod = type.GetMethod("MethodWithParams",
            new Type[] { typeof(string), typeof(int) });

        // 检查方法信息
        if (method != null)
        {
            Console.WriteLine($"方法名: {method.Name}");
            Console.WriteLine($"返回类型: {method.ReturnType.Name}");
            Console.WriteLine($"是否静态: {method.IsStatic}");
            Console.WriteLine($"是否虚方法: {method.IsVirtual}");
            Console.WriteLine($"是否抽象: {method.IsAbstract}");
            Console.WriteLine($"是否泛型方法: {method.IsGenericMethod}");

            // 获取参数信息
            ParameterInfo[] parameters = method.GetParameters();
            foreach (var param in parameters)
            {
                Console.WriteLine($"  参数: {param.Name}, 类型: {param.ParameterType.Name}, " +
                                  $"位置: {param.Position}, 是否可选: {param.IsOptional}");
            }
        }
    }
}
```

### 动态调用方法

```csharp
public class Calculator
{
    public int Add(int a, int b) => a + b;
    public static int Multiply(int a, int b) => a * b;
    public T Echo<T>(T value) => value;
    public int Divide(int a, int b = 1) => a / b;
}

public class MethodInvocation
{
    public static void DemoInvocation()
    {
        Type calcType = typeof(Calculator);
        Calculator calc = new Calculator();

        // 调用实例方法
        MethodInfo addMethod = calcType.GetMethod("Add");
        object result1 = addMethod.Invoke(calc, new object[] { 10, 20 });
        Console.WriteLine($"Add(10, 20) = {result1}"); // 30

        // 调用静态方法
        MethodInfo multiplyMethod = calcType.GetMethod("Multiply");
        object result2 = multiplyMethod.Invoke(null, new object[] { 5, 6 });
        Console.WriteLine($"Multiply(5, 6) = {result2}"); // 30

        // 调用泛型方法
        MethodInfo echoMethod = calcType.GetMethod("Echo");
        MethodInfo echoString = echoMethod.MakeGenericMethod(typeof(string));
        object result3 = echoString.Invoke(calc, new object[] { "Hello" });
        Console.WriteLine($"Echo<string>(\"Hello\") = {result3}"); // Hello

        // 调用带默认参数的方法
        MethodInfo divideMethod = calcType.GetMethod("Divide");
        // 使用 Type.Missing 表示使用默认值
        object result4 = divideMethod.Invoke(calc, new object[] { 100, Type.Missing });
        Console.WriteLine($"Divide(100) = {result4}"); // 100

        // 使用动态创建的委托（性能更好）
        var addDelegate = (Func<int, int, int>)Delegate.CreateDelegate(
            typeof(Func<int, int, int>), calc, addMethod);
        int result5 = addDelegate(15, 25);
        Console.WriteLine($"通过委托调用 Add(15, 25) = {result5}"); // 40
    }
}
```

### 处理方法调用异常

```csharp
public class SafeMethodInvocation
{
    public static object SafeInvoke(MethodInfo method, object instance, object[] parameters)
    {
        try
        {
            return method.Invoke(instance, parameters);
        }
        catch (TargetInvocationException ex)
        {
            // TargetInvocationException 包装了实际抛出的异常
            Console.WriteLine($"方法内部异常: {ex.InnerException?.Message}");
            throw ex.InnerException ?? ex;
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"参数错误: {ex.Message}");
            throw;
        }
        catch (TargetParameterCountException ex)
        {
            Console.WriteLine($"参数数量错误: {ex.Message}");
            throw;
        }
    }
}
```

## PropertyInfo - 属性反射

`PropertyInfo` 类用于访问属性的元数据和动态操作属性值。

### 获取属性信息

```csharp
public class Person
{
    public string Name { get; set; }
    public int Age { get; private set; }
    public DateTime BirthDate { get; init; }
    public string FullName => $"{Name} ({Age})";
    public static int Count { get; set; }

    [Obsolete("Use FullName instead")]
    public string DisplayName => Name;

    public Person(int age) => Age = age;
}

public class PropertyInspector
{
    public static void InspectProperties()
    {
        Type personType = typeof(Person);

        // 获取所有公共属性
        PropertyInfo[] properties = personType.GetProperties();

        // 获取特定属性
        PropertyInfo nameProperty = personType.GetProperty("Name");

        // 获取静态属性
        PropertyInfo countProperty = personType.GetProperty("Count",
            BindingFlags.Public | BindingFlags.Static);

        foreach (PropertyInfo prop in properties)
        {
            Console.WriteLine($"属性: {prop.Name}");
            Console.WriteLine($"  类型: {prop.PropertyType.Name}");
            Console.WriteLine($"  可读: {prop.CanRead}");
            Console.WriteLine($"  可写: {prop.CanWrite}");

            // 获取访问器信息
            MethodInfo getter = prop.GetGetMethod(true);
            MethodInfo setter = prop.GetSetMethod(true);

            if (getter != null)
            {
                Console.WriteLine($"  Getter: {(getter.IsPublic ? "public" : "private")}");
            }
            if (setter != null)
            {
                Console.WriteLine($"  Setter: {(setter.IsPublic ? "public" : "private")}");
            }

            // 检查索引器
            ParameterInfo[] indexParams = prop.GetIndexParameters();
            if (indexParams.Length > 0)
            {
                Console.WriteLine($"  是索引器，参数数量: {indexParams.Length}");
            }

            Console.WriteLine();
        }
    }
}
```

### 动态访问属性

```csharp
public class PropertyAccess
{
    public static void DemoPropertyAccess()
    {
        Person person = new Person(25) { Name = "张三" };
        Type personType = typeof(Person);

        // 读取属性值
        PropertyInfo nameProperty = personType.GetProperty("Name");
        string name = (string)nameProperty.GetValue(person);
        Console.WriteLine($"Name = {name}"); // 张三

        // 设置属性值
        nameProperty.SetValue(person, "李四");
        Console.WriteLine($"修改后 Name = {person.Name}"); // 李四

        // 访问只读属性
        PropertyInfo ageProperty = personType.GetProperty("Age");
        int age = (int)ageProperty.GetValue(person);
        Console.WriteLine($"Age = {age}"); // 25

        // 尝试设置只读属性（会抛出异常）
        try
        {
            ageProperty.SetValue(person, 30);
        }
        catch (ArgumentException)
        {
            Console.WriteLine("无法设置只读属性");
        }

        // 使用私有 setter 设置属性（需要特殊处理）
        MethodInfo privateSetter = ageProperty.GetSetMethod(true);
        if (privateSetter != null)
        {
            privateSetter.Invoke(person, new object[] { 30 });
            Console.WriteLine($"通过私有 setter 修改后 Age = {person.Age}"); // 30
        }

        // 访问静态属性
        PropertyInfo countProperty = personType.GetProperty("Count",
            BindingFlags.Public | BindingFlags.Static);
        countProperty.SetValue(null, 100);
        int count = (int)countProperty.GetValue(null);
        Console.WriteLine($"Count = {count}"); // 100
    }
}
```

### 批量属性操作

```csharp
public static class ObjectMapper
{
    // 简单的对象复制
    public static T ShallowCopy<T>(T source) where T : new()
    {
        T target = new T();
        Type type = typeof(T);

        foreach (PropertyInfo prop in type.GetProperties())
        {
            if (prop.CanRead && prop.CanWrite)
            {
                object value = prop.GetValue(source);
                prop.SetValue(target, value);
            }
        }

        return target;
    }

    // 对象转字典
    public static Dictionary<string, object> ToDictionary(object obj)
    {
        var dict = new Dictionary<string, object>();
        Type type = obj.GetType();

        foreach (PropertyInfo prop in type.GetProperties())
        {
            if (prop.CanRead)
            {
                dict[prop.Name] = prop.GetValue(obj);
            }
        }

        return dict;
    }

    // 从字典创建对象
    public static T FromDictionary<T>(Dictionary<string, object> dict) where T : new()
    {
        T obj = new T();
        Type type = typeof(T);

        foreach (var kvp in dict)
        {
            PropertyInfo prop = type.GetProperty(kvp.Key);
            if (prop != null && prop.CanWrite)
            {
                object value = Convert.ChangeType(kvp.Value, prop.PropertyType);
                prop.SetValue(obj, value);
            }
        }

        return obj;
    }
}
```

## FieldInfo - 字段反射

`FieldInfo` 类用于访问字段（成员变量）的元数据。

```csharp
public class FieldExample
{
    public string PublicField = "public";
    private int _privateField = 42;
    protected bool _protectedField;
    internal double _internalField;
    public readonly string ReadonlyField = "readonly";
    public const int ConstField = 100;
    public static string StaticField = "static";
}

public class FieldInspector
{
    public static void InspectFields()
    {
        Type type = typeof(FieldExample);

        // 获取所有字段（包括私有）
        FieldInfo[] allFields = type.GetFields(
            BindingFlags.Public | BindingFlags.NonPublic |
            BindingFlags.Instance | BindingFlags.Static);

        foreach (FieldInfo field in allFields)
        {
            Console.WriteLine($"字段: {field.Name}");
            Console.WriteLine($"  类型: {field.FieldType.Name}");
            Console.WriteLine($"  是否公共: {field.IsPublic}");
            Console.WriteLine($"  是否私有: {field.IsPrivate}");
            Console.WriteLine($"  是否静态: {field.IsStatic}");
            Console.WriteLine($"  是否只读: {field.IsInitOnly}");
            Console.WriteLine($"  是否常量: {field.IsLiteral}");
            Console.WriteLine();
        }
    }

    public static void AccessFields()
    {
        FieldExample obj = new FieldExample();
        Type type = typeof(FieldExample);

        // 访问公共字段
        FieldInfo publicField = type.GetField("PublicField");
        string publicValue = (string)publicField.GetValue(obj);
        Console.WriteLine($"PublicField = {publicValue}");

        // 修改公共字段
        publicField.SetValue(obj, "modified");
        Console.WriteLine($"修改后 PublicField = {obj.PublicField}");

        // 访问私有字段
        FieldInfo privateField = type.GetField("_privateField",
            BindingFlags.NonPublic | BindingFlags.Instance);
        int privateValue = (int)privateField.GetValue(obj);
        Console.WriteLine($"_privateField = {privateValue}");

        // 修改私有字段
        privateField.SetValue(obj, 100);
        Console.WriteLine($"修改后 _privateField = {(int)privateField.GetValue(obj)}");

        // 访问静态字段
        FieldInfo staticField = type.GetField("StaticField",
            BindingFlags.Public | BindingFlags.Static);
        staticField.SetValue(null, "new static value");
        Console.WriteLine($"StaticField = {FieldExample.StaticField}");

        // 访问常量字段
        FieldInfo constField = type.GetField("ConstField");
        Console.WriteLine($"ConstField = {constField.GetRawConstantValue()}");

        // 修改只读字段（不推荐，但技术上可行）
        FieldInfo readonlyField = type.GetField("ReadonlyField");
        readonlyField.SetValue(obj, "no longer readonly");
        Console.WriteLine($"ReadonlyField = {obj.ReadonlyField}");
    }
}
```

## ConstructorInfo - 构造函数反射

`ConstructorInfo` 类用于获取构造函数信息并动态创建对象。

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }

    // 无参构造函数
    public Product()
    {
        Console.WriteLine("无参构造函数被调用");
    }

    // 带参数的构造函数
    public Product(string name) : this()
    {
        Name = name;
        Console.WriteLine($"Product(string) 被调用: {name}");
    }

    // 多参数构造函数
    public Product(int id, string name, decimal price)
    {
        Id = id;
        Name = name;
        Price = price;
        Console.WriteLine($"Product(int, string, decimal) 被调用");
    }

    // 私有构造函数
    private Product(bool dummy)
    {
        Console.WriteLine("私有构造函数被调用");
    }
}

public class ConstructorInspector
{
    public static void InspectConstructors()
    {
        Type productType = typeof(Product);

        // 获取所有公共构造函数
        ConstructorInfo[] publicCtors = productType.GetConstructors();

        // 获取所有构造函数（包括私有）
        ConstructorInfo[] allCtors = productType.GetConstructors(
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        Console.WriteLine($"公共构造函数数量: {publicCtors.Length}");
        Console.WriteLine($"所有构造函数数量: {allCtors.Length}");

        foreach (ConstructorInfo ctor in allCtors)
        {
            ParameterInfo[] parameters = ctor.GetParameters();
            string paramList = string.Join(", ",
                parameters.Select(p => $"{p.ParameterType.Name} {p.Name}"));
            Console.WriteLine($"构造函数: ({paramList})");
            Console.WriteLine($"  是否公共: {ctor.IsPublic}");
            Console.WriteLine($"  是否私有: {ctor.IsPrivate}");
        }
    }

    public static void CreateInstances()
    {
        Type productType = typeof(Product);

        // 方式1：使用 Activator.CreateInstance（无参构造函数）
        Product p1 = (Product)Activator.CreateInstance(productType);

        // 方式2：使用 Activator.CreateInstance（带参数）
        Product p2 = (Product)Activator.CreateInstance(productType, "笔记本电脑");

        // 方式3：使用 ConstructorInfo.Invoke
        ConstructorInfo ctor = productType.GetConstructor(
            new Type[] { typeof(int), typeof(string), typeof(decimal) });
        Product p3 = (Product)ctor.Invoke(new object[] { 1, "手机", 5999.99m });
        Console.WriteLine($"p3: Id={p3.Id}, Name={p3.Name}, Price={p3.Price}");

        // 方式4：调用私有构造函数
        ConstructorInfo privateCtor = productType.GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            null, new Type[] { typeof(bool) }, null);
        Product p4 = (Product)privateCtor.Invoke(new object[] { true });

        // 方式5：使用泛型约束的高效方式
        Product p5 = CreateInstance<Product>();
    }

    public static T CreateInstance<T>() where T : new()
    {
        return new T(); // 编译器优化，比反射更快
    }
}
```

## 特性（Attributes）与反射

特性是 .NET 中的元数据标记，反射可以读取和处理这些特性。

### 定义和使用自定义特性

```csharp
// 定义自定义特性
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method | AttributeTargets.Property,
    AllowMultiple = true, Inherited = true)]
public class ValidationAttribute : Attribute
{
    public string Message { get; }
    public int Priority { get; set; }

    public ValidationAttribute(string message)
    {
        Message = message;
    }
}

[AttributeUsage(AttributeTargets.Property)]
public class RequiredAttribute : Attribute
{
    public string ErrorMessage { get; set; } = "此字段是必需的";
}

[AttributeUsage(AttributeTargets.Property)]
public class RangeAttribute : Attribute
{
    public int Min { get; }
    public int Max { get; }
    public string ErrorMessage { get; set; }

    public RangeAttribute(int min, int max)
    {
        Min = min;
        Max = max;
        ErrorMessage = $"值必须在 {min} 和 {max} 之间";
    }
}

[AttributeUsage(AttributeTargets.Property)]
public class StringLengthAttribute : Attribute
{
    public int MaxLength { get; }
    public int MinLength { get; set; }

    public StringLengthAttribute(int maxLength)
    {
        MaxLength = maxLength;
    }
}

// 使用特性
[Validation("用户实体验证", Priority = 1)]
public class User
{
    public int Id { get; set; }

    [Required(ErrorMessage = "用户名不能为空")]
    [StringLength(50, MinLength = 3)]
    public string Username { get; set; }

    [Required]
    [StringLength(100)]
    public string Email { get; set; }

    [Range(0, 150, ErrorMessage = "年龄必须在 0 到 150 之间")]
    public int Age { get; set; }
}
```

### 读取特性信息

```csharp
public class AttributeReader
{
    public static void ReadClassAttributes<T>()
    {
        Type type = typeof(T);

        // 获取类上的所有特性
        object[] attributes = type.GetCustomAttributes(true);
        Console.WriteLine($"{type.Name} 类的特性:");
        foreach (object attr in attributes)
        {
            Console.WriteLine($"  {attr.GetType().Name}");
        }

        // 获取特定类型的特性
        if (type.GetCustomAttribute<ValidationAttribute>() is ValidationAttribute validation)
        {
            Console.WriteLine($"  验证消息: {validation.Message}");
            Console.WriteLine($"  优先级: {validation.Priority}");
        }
    }

    public static void ReadPropertyAttributes<T>()
    {
        Type type = typeof(T);

        foreach (PropertyInfo prop in type.GetProperties())
        {
            Console.WriteLine($"\n属性: {prop.Name}");

            // 检查 Required 特性
            if (prop.GetCustomAttribute<RequiredAttribute>() is RequiredAttribute required)
            {
                Console.WriteLine($"  [Required] {required.ErrorMessage}");
            }

            // 检查 StringLength 特性
            if (prop.GetCustomAttribute<StringLengthAttribute>() is StringLengthAttribute length)
            {
                Console.WriteLine($"  [StringLength] Min={length.MinLength}, Max={length.MaxLength}");
            }

            // 检查 Range 特性
            if (prop.GetCustomAttribute<RangeAttribute>() is RangeAttribute range)
            {
                Console.WriteLine($"  [Range] Min={range.Min}, Max={range.Max}");
            }
        }
    }
}

// 使用
AttributeReader.ReadClassAttributes<User>();
AttributeReader.ReadPropertyAttributes<User>();
```

### 基于特性的验证器

```csharp
public class ValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new List<string>();
}

public class AttributeValidator
{
    public static ValidationResult Validate<T>(T obj)
    {
        var result = new ValidationResult { IsValid = true };
        Type type = typeof(T);

        foreach (PropertyInfo prop in type.GetProperties())
        {
            object value = prop.GetValue(obj);

            // 验证 Required
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null)
            {
                if (value == null || (value is string s && string.IsNullOrWhiteSpace(s)))
                {
                    result.IsValid = false;
                    result.Errors.Add($"{prop.Name}: {required.ErrorMessage}");
                }
            }

            // 验证 StringLength
            var stringLength = prop.GetCustomAttribute<StringLengthAttribute>();
            if (stringLength != null && value is string str)
            {
                if (str.Length > stringLength.MaxLength || str.Length < stringLength.MinLength)
                {
                    result.IsValid = false;
                    result.Errors.Add($"{prop.Name}: 长度必须在 {stringLength.MinLength} 到 {stringLength.MaxLength} 之间");
                }
            }

            // 验证 Range
            var range = prop.GetCustomAttribute<RangeAttribute>();
            if (range != null && value is int intValue)
            {
                if (intValue < range.Min || intValue > range.Max)
                {
                    result.IsValid = false;
                    result.Errors.Add($"{prop.Name}: {range.ErrorMessage}");
                }
            }
        }

        return result;
    }
}

// 使用
var user = new User
{
    Id = 1,
    Username = "ab",  // 太短
    Email = null,     // 必需
    Age = 200        // 超出范围
};

var result = AttributeValidator.Validate(user);
Console.WriteLine($"验证结果: {(result.IsValid ? "通过" : "失败")}");
foreach (string error in result.Errors)
{
    Console.WriteLine($"  - {error}");
}
```

## 程序集加载与检查

`Assembly` 类用于加载、检查和操作程序集。

### 加载程序集

```csharp
public class AssemblyLoader
{
    public static void LoadAssemblies()
    {
        // 获取当前执行的程序集
        Assembly executingAssembly = Assembly.GetExecutingAssembly();
        Console.WriteLine($"执行程序集: {executingAssembly.GetName().Name}");

        // 获取入口程序集
        Assembly entryAssembly = Assembly.GetEntryAssembly();
        Console.WriteLine($"入口程序集: {entryAssembly?.GetName().Name}");

        // 获取调用方所在的程序集
        Assembly callingAssembly = Assembly.GetCallingAssembly();
        Console.WriteLine($"调用程序集: {callingAssembly.GetName().Name}");

        // 通过名称加载程序集
        try
        {
            Assembly loaded = Assembly.Load("System.Text.Json");
            Console.WriteLine($"加载的程序集: {loaded.GetName().Name}");
        }
        catch (FileNotFoundException ex)
        {
            Console.WriteLine($"程序集未找到: {ex.Message}");
        }

        // 从文件路径加载
        string path = @"C:\path\to\MyLibrary.dll";
        if (File.Exists(path))
        {
            Assembly fromFile = Assembly.LoadFrom(path);
            Console.WriteLine($"从文件加载: {fromFile.GetName().Name}");
        }

        // 加载程序集但不锁定文件（用于插件场景）
        if (File.Exists(path))
        {
            byte[] assemblyBytes = File.ReadAllBytes(path);
            Assembly fromBytes = Assembly.Load(assemblyBytes);
        }
    }
}
```

### 检查程序集信息

```csharp
public class AssemblyInspector
{
    public static void InspectAssembly(Assembly assembly)
    {
        // 基本信息
        AssemblyName name = assembly.GetName();
        Console.WriteLine($"名称: {name.Name}");
        Console.WriteLine($"版本: {name.Version}");
        Console.WriteLine($"文化: {name.CultureInfo?.Name ?? "neutral"}");
        Console.WriteLine($"公钥令牌: {BitConverter.ToString(name.GetPublicKeyToken() ?? Array.Empty<byte>())}");
        Console.WriteLine($"位置: {assembly.Location}");
        Console.WriteLine($"是否动态: {assembly.IsDynamic}");

        // 获取所有类型
        Type[] types = assembly.GetTypes();
        Console.WriteLine($"\n类型数量: {types.Length}");

        // 获取公共类型
        Type[] publicTypes = assembly.GetExportedTypes();
        Console.WriteLine($"公共类型数量: {publicTypes.Length}");

        // 获取程序集的特性
        Console.WriteLine("\n程序集特性:");
        foreach (Attribute attr in assembly.GetCustomAttributes())
        {
            Console.WriteLine($"  {attr.GetType().Name}");
        }

        // 获取引用的程序集
        Console.WriteLine("\n引用的程序集:");
        foreach (AssemblyName refName in assembly.GetReferencedAssemblies())
        {
            Console.WriteLine($"  {refName.Name} v{refName.Version}");
        }

        // 获取嵌入的资源
        Console.WriteLine("\n嵌入的资源:");
        foreach (string resourceName in assembly.GetManifestResourceNames())
        {
            Console.WriteLine($"  {resourceName}");
        }
    }
}

// 使用
AssemblyInspector.InspectAssembly(Assembly.GetExecutingAssembly());
```

### 插件系统实现

```csharp
// 插件接口
public interface IPlugin
{
    string Name { get; }
    string Version { get; }
    void Initialize();
    void Execute();
}

// 插件加载器
public class PluginLoader
{
    private readonly List<IPlugin> _plugins = new List<IPlugin>();
    private readonly string _pluginDirectory;

    public PluginLoader(string pluginDirectory)
    {
        _pluginDirectory = pluginDirectory;
    }

    public void LoadPlugins()
    {
        if (!Directory.Exists(_pluginDirectory))
        {
            Console.WriteLine($"插件目录不存在: {_pluginDirectory}");
            return;
        }

        string[] dllFiles = Directory.GetFiles(_pluginDirectory, "*.dll");

        foreach (string dllPath in dllFiles)
        {
            try
            {
                LoadPluginFromFile(dllPath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"加载插件失败 {Path.GetFileName(dllPath)}: {ex.Message}");
            }
        }
    }

    private void LoadPluginFromFile(string dllPath)
    {
        // 使用 AssemblyLoadContext 实现可卸载的插件（.NET Core/.NET 5+）
        Assembly assembly = Assembly.LoadFrom(dllPath);

        // 查找实现 IPlugin 接口的类型
        Type pluginInterface = typeof(IPlugin);

        foreach (Type type in assembly.GetExportedTypes())
        {
            if (pluginInterface.IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
            {
                IPlugin plugin = (IPlugin)Activator.CreateInstance(type);
                _plugins.Add(plugin);
                Console.WriteLine($"已加载插件: {plugin.Name} v{plugin.Version}");
            }
        }
    }

    public void InitializePlugins()
    {
        foreach (IPlugin plugin in _plugins)
        {
            try
            {
                plugin.Initialize();
                Console.WriteLine($"已初始化插件: {plugin.Name}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"初始化插件失败 {plugin.Name}: {ex.Message}");
            }
        }
    }

    public void ExecutePlugins()
    {
        foreach (IPlugin plugin in _plugins)
        {
            try
            {
                plugin.Execute();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"执行插件失败 {plugin.Name}: {ex.Message}");
            }
        }
    }

    public IReadOnlyList<IPlugin> Plugins => _plugins.AsReadOnly();
}
```

## 动态对象创建

### 使用 Activator

```csharp
public class DynamicCreation
{
    public static void CreateWithActivator()
    {
        // 创建无参构造的对象
        object list = Activator.CreateInstance(typeof(List<int>));

        // 创建带参数构造的对象
        object str = Activator.CreateInstance(typeof(string), new object[] { 'a', 5 });
        Console.WriteLine(str); // "aaaaa"

        // 通过类型名称创建
        object dateTime = Activator.CreateInstance(
            "mscorlib", "System.DateTime")?.Unwrap();

        // 泛型方法创建
        List<string> stringList = Activator.CreateInstance<List<string>>();

        // 创建数组
        int[] array = (int[])Activator.CreateInstance(typeof(int[]), 10);
        Console.WriteLine($"数组长度: {array.Length}"); // 10

        // 创建多维数组
        int[,] matrix = (int[,])Activator.CreateInstance(typeof(int[,]), 3, 4);
        Console.WriteLine($"矩阵维度: {matrix.GetLength(0)}x{matrix.GetLength(1)}"); // 3x4
    }
}
```

### 高性能对象创建

```csharp
public static class FastActivator
{
    // 缓存构造函数委托
    private static readonly ConcurrentDictionary<Type, Func<object>> _constructorCache
        = new ConcurrentDictionary<Type, Func<object>>();

    public static object CreateInstance(Type type)
    {
        return _constructorCache.GetOrAdd(type, CreateActivator)();
    }

    public static T CreateInstance<T>() where T : new()
    {
        return InstanceCreator<T>.Create();
    }

    private static Func<object> CreateActivator(Type type)
    {
        ConstructorInfo constructor = type.GetConstructor(Type.EmptyTypes);

        if (constructor == null)
        {
            throw new InvalidOperationException($"类型 {type.Name} 没有无参构造函数");
        }

        // 使用表达式树创建委托
        NewExpression newExp = Expression.New(constructor);
        LambdaExpression lambda = Expression.Lambda<Func<object>>(
            Expression.Convert(newExp, typeof(object)));

        return (Func<object>)lambda.Compile();
    }

    // 使用泛型静态类缓存
    private static class InstanceCreator<T> where T : new()
    {
        public static readonly Func<T> Create = Expression.Lambda<Func<T>>(
            Expression.New(typeof(T))).Compile();
    }
}

// 性能测试
public class PerformanceTest
{
    public static void CompareCreationMethods()
    {
        const int iterations = 1_000_000;
        Type type = typeof(List<int>);

        // 方式1：new 关键字
        var sw1 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = new List<int>();
        }
        sw1.Stop();
        Console.WriteLine($"new 关键字: {sw1.ElapsedMilliseconds}ms");

        // 方式2：Activator.CreateInstance
        var sw2 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = Activator.CreateInstance<List<int>>();
        }
        sw2.Stop();
        Console.WriteLine($"Activator.CreateInstance<T>: {sw2.ElapsedMilliseconds}ms");

        // 方式3：Activator.CreateInstance(Type)
        var sw3 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = Activator.CreateInstance(type);
        }
        sw3.Stop();
        Console.WriteLine($"Activator.CreateInstance(Type): {sw3.ElapsedMilliseconds}ms");

        // 方式4：缓存的委托
        var sw4 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = FastActivator.CreateInstance<List<int>>();
        }
        sw4.Stop();
        Console.WriteLine($"缓存委托: {sw4.ElapsedMilliseconds}ms");
    }
}
```

## 反射性能优化

反射的性能通常比直接调用慢10-100倍。以下是一些优化策略：

### 缓存反射结果

```csharp
public class ReflectionCache
{
    // 缓存 Type 对象
    private static readonly ConcurrentDictionary<string, Type> _typeCache = new();

    // 缓存 PropertyInfo
    private static readonly ConcurrentDictionary<(Type, string), PropertyInfo> _propertyCache = new();

    // 缓存 MethodInfo
    private static readonly ConcurrentDictionary<(Type, string, Type[]), MethodInfo> _methodCache = new();

    public static Type GetType(string typeName)
    {
        return _typeCache.GetOrAdd(typeName, name => Type.GetType(name));
    }

    public static PropertyInfo GetProperty(Type type, string propertyName)
    {
        return _propertyCache.GetOrAdd((type, propertyName),
            key => key.Item1.GetProperty(key.Item2));
    }

    public static MethodInfo GetMethod(Type type, string methodName, params Type[] parameterTypes)
    {
        return _methodCache.GetOrAdd((type, methodName, parameterTypes),
            key => key.Item1.GetMethod(key.Item2, key.Item3));
    }
}
```

### 使用委托替代 Invoke

```csharp
public class DelegateOptimization
{
    public static void OptimizedPropertyAccess()
    {
        Type type = typeof(Person);
        PropertyInfo prop = type.GetProperty("Name");

        // 慢：每次调用都有反射开销
        Person person = new Person { Name = "张三" };
        string name1 = (string)prop.GetValue(person);

        // 快：创建委托并复用
        var getter = (Func<Person, string>)Delegate.CreateDelegate(
            typeof(Func<Person, string>), prop.GetGetMethod());
        string name2 = getter(person);

        // 更通用的方式：使用表达式树
        var parameter = Expression.Parameter(typeof(Person), "p");
        var propertyAccess = Expression.Property(parameter, prop);
        var lambda = Expression.Lambda<Func<Person, string>>(propertyAccess, parameter);
        var compiledGetter = lambda.Compile();
        string name3 = compiledGetter(person);
    }

    public static void OptimizedMethodCall()
    {
        Type type = typeof(Calculator);
        MethodInfo method = type.GetMethod("Add");
        Calculator calc = new Calculator();

        // 慢：使用 Invoke
        object result1 = method.Invoke(calc, new object[] { 1, 2 });

        // 快：创建委托
        var addDelegate = (Func<int, int, int>)Delegate.CreateDelegate(
            typeof(Func<int, int, int>), calc, method);
        int result2 = addDelegate(1, 2);
    }
}
```

### 使用 DynamicMethod 生成 IL

```csharp
public static class ILGenerator
{
    public static Func<object, object[], object> CreateMethodInvoker(MethodInfo method)
    {
        DynamicMethod dynamicMethod = new DynamicMethod(
            "FastInvoke_" + method.Name,
            typeof(object),
            new[] { typeof(object), typeof(object[]) },
            method.DeclaringType.Module,
            true);

        ILGenerator il = dynamicMethod.GetILGenerator();

        ParameterInfo[] parameters = method.GetParameters();

        // 加载实例（如果是实例方法）
        if (!method.IsStatic)
        {
            il.Emit(OpCodes.Ldarg_0);
            if (method.DeclaringType.IsValueType)
            {
                il.Emit(OpCodes.Unbox, method.DeclaringType);
            }
            else
            {
                il.Emit(OpCodes.Castclass, method.DeclaringType);
            }
        }

        // 加载参数
        for (int i = 0; i < parameters.Length; i++)
        {
            il.Emit(OpCodes.Ldarg_1);
            il.Emit(OpCodes.Ldc_I4, i);
            il.Emit(OpCodes.Ldelem_Ref);

            Type paramType = parameters[i].ParameterType;
            if (paramType.IsValueType)
            {
                il.Emit(OpCodes.Unbox_Any, paramType);
            }
            else
            {
                il.Emit(OpCodes.Castclass, paramType);
            }
        }

        // 调用方法
        il.Emit(method.IsVirtual ? OpCodes.Callvirt : OpCodes.Call, method);

        // 处理返回值
        if (method.ReturnType == typeof(void))
        {
            il.Emit(OpCodes.Ldnull);
        }
        else if (method.ReturnType.IsValueType)
        {
            il.Emit(OpCodes.Box, method.ReturnType);
        }

        il.Emit(OpCodes.Ret);

        return (Func<object, object[], object>)dynamicMethod.CreateDelegate(
            typeof(Func<object, object[], object>));
    }
}
```

### 使用 Source Generators（编译时生成）

从 .NET 5 开始，可以使用 Source Generators 在编译时生成代码，完全避免运行时反射：

```csharp
// 这是一个概念示例，实际实现需要创建独立的 Source Generator 项目

[AttributeUsage(AttributeTargets.Class)]
public class GenerateMapperAttribute : Attribute { }

// 标记需要生成映射器的类
[GenerateMapper]
public partial class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

// Source Generator 会自动生成类似这样的代码：
public partial class UserDto
{
    public static UserDto FromEntity(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name
        };
    }

    public User ToEntity()
    {
        return new User
        {
            Id = this.Id,
            Name = this.Name
        };
    }
}
```

## 实际应用场景

### 依赖注入容器

```csharp
public class SimpleContainer
{
    private readonly Dictionary<Type, Type> _registrations = new();
    private readonly Dictionary<Type, object> _singletons = new();
    private readonly Dictionary<Type, Func<object>> _factories = new();

    // 注册类型
    public void Register<TService, TImplementation>() where TImplementation : TService
    {
        _registrations[typeof(TService)] = typeof(TImplementation);
    }

    // 注册单例
    public void RegisterSingleton<TService, TImplementation>() where TImplementation : TService
    {
        _registrations[typeof(TService)] = typeof(TImplementation);
        _singletons[typeof(TService)] = null; // 标记为单例
    }

    // 注册工厂
    public void RegisterFactory<TService>(Func<TService> factory)
    {
        _factories[typeof(TService)] = () => factory();
    }

    // 解析类型
    public TService Resolve<TService>()
    {
        return (TService)Resolve(typeof(TService));
    }

    public object Resolve(Type serviceType)
    {
        // 检查工厂
        if (_factories.TryGetValue(serviceType, out var factory))
        {
            return factory();
        }

        // 检查单例
        if (_singletons.TryGetValue(serviceType, out var singleton))
        {
            if (singleton != null) return singleton;

            // 创建单例
            singleton = CreateInstance(serviceType);
            _singletons[serviceType] = singleton;
            return singleton;
        }

        // 普通解析
        return CreateInstance(serviceType);
    }

    private object CreateInstance(Type serviceType)
    {
        // 获取实现类型
        Type implementationType = _registrations.TryGetValue(serviceType, out var regType)
            ? regType
            : serviceType;

        // 获取构造函数
        ConstructorInfo[] constructors = implementationType.GetConstructors();
        ConstructorInfo constructor = constructors
            .OrderByDescending(c => c.GetParameters().Length)
            .First();

        // 解析构造函数参数
        ParameterInfo[] parameters = constructor.GetParameters();
        object[] args = new object[parameters.Length];

        for (int i = 0; i < parameters.Length; i++)
        {
            args[i] = Resolve(parameters[i].ParameterType);
        }

        // 创建实例
        return constructor.Invoke(args);
    }
}

// 使用
var container = new SimpleContainer();
container.Register<ILogger, ConsoleLogger>();
container.RegisterSingleton<IDatabase, SqlDatabase>();
container.Register<IUserService, UserService>();

var userService = container.Resolve<IUserService>();
```

### 对象关系映射（ORM）

```csharp
public class SimpleORM
{
    private readonly string _connectionString;

    public SimpleORM(string connectionString)
    {
        _connectionString = connectionString;
    }

    // 从数据读取器映射到对象
    public T MapToObject<T>(IDataReader reader) where T : new()
    {
        T obj = new T();
        Type type = typeof(T);

        for (int i = 0; i < reader.FieldCount; i++)
        {
            string columnName = reader.GetName(i);
            PropertyInfo property = type.GetProperty(columnName,
                BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);

            if (property != null && property.CanWrite)
            {
                object value = reader.IsDBNull(i) ? null : reader.GetValue(i);

                if (value != null)
                {
                    // 类型转换
                    Type targetType = Nullable.GetUnderlyingType(property.PropertyType)
                        ?? property.PropertyType;
                    value = Convert.ChangeType(value, targetType);
                }

                property.SetValue(obj, value);
            }
        }

        return obj;
    }

    // 生成 INSERT 语句
    public string GenerateInsertSql<T>(T entity)
    {
        Type type = typeof(T);
        string tableName = type.Name;

        // 检查表名特性
        var tableAttr = type.GetCustomAttribute<TableAttribute>();
        if (tableAttr != null)
        {
            tableName = tableAttr.Name;
        }

        var properties = type.GetProperties()
            .Where(p => p.CanRead && !IsAutoGenerated(p))
            .ToList();

        string columns = string.Join(", ", properties.Select(p => GetColumnName(p)));
        string values = string.Join(", ", properties.Select(p => $"@{p.Name}"));

        return $"INSERT INTO {tableName} ({columns}) VALUES ({values})";
    }

    private string GetColumnName(PropertyInfo property)
    {
        var columnAttr = property.GetCustomAttribute<ColumnAttribute>();
        return columnAttr?.Name ?? property.Name;
    }

    private bool IsAutoGenerated(PropertyInfo property)
    {
        return property.GetCustomAttribute<DatabaseGeneratedAttribute>() != null;
    }
}

// 特性定义
[AttributeUsage(AttributeTargets.Class)]
public class TableAttribute : Attribute
{
    public string Name { get; }
    public TableAttribute(string name) => Name = name;
}

[AttributeUsage(AttributeTargets.Property)]
public class ColumnAttribute : Attribute
{
    public string Name { get; }
    public ColumnAttribute(string name) => Name = name;
}

[AttributeUsage(AttributeTargets.Property)]
public class DatabaseGeneratedAttribute : Attribute { }
```

### 序列化器

```csharp
public class SimpleJsonSerializer
{
    public string Serialize(object obj)
    {
        if (obj == null) return "null";

        Type type = obj.GetType();

        // 处理基本类型
        if (type == typeof(string))
            return $"\"{EscapeString((string)obj)}\"";
        if (type.IsPrimitive || type == typeof(decimal))
            return obj.ToString();
        if (type == typeof(DateTime))
            return $"\"{((DateTime)obj):O}\"";

        // 处理集合
        if (obj is IEnumerable enumerable && type != typeof(string))
        {
            var items = enumerable.Cast<object>().Select(Serialize);
            return $"[{string.Join(",", items)}]";
        }

        // 处理对象
        var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead);

        var members = properties.Select(p =>
        {
            object value = p.GetValue(obj);
            string serializedValue = Serialize(value);
            return $"\"{p.Name}\":{serializedValue}";
        });

        return $"{{{string.Join(",", members)}}}";
    }

    public T Deserialize<T>(string json) where T : new()
    {
        // 简化实现，实际需要完整的 JSON 解析器
        T obj = new T();
        Type type = typeof(T);

        // 这里需要实现 JSON 解析逻辑
        // 解析 JSON 字符串并设置属性值

        return obj;
    }

    private string EscapeString(string str)
    {
        return str
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\n", "\\n")
            .Replace("\r", "\\r")
            .Replace("\t", "\\t");
    }
}
```

### 单元测试框架

```csharp
[AttributeUsage(AttributeTargets.Method)]
public class TestAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Method)]
public class SetupAttribute : Attribute { }

[AttributeUsage(AttributeTargets.Method)]
public class TeardownAttribute : Attribute { }

public class TestRunner
{
    public void RunTests(Type testClass)
    {
        Console.WriteLine($"运行测试类: {testClass.Name}");
        Console.WriteLine(new string('-', 50));

        // 创建测试类实例
        object instance = Activator.CreateInstance(testClass);

        // 查找 Setup 方法
        MethodInfo setupMethod = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<SetupAttribute>() != null);

        // 查找 Teardown 方法
        MethodInfo teardownMethod = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<TeardownAttribute>() != null);

        // 查找所有测试方法
        var testMethods = testClass.GetMethods()
            .Where(m => m.GetCustomAttribute<TestAttribute>() != null);

        int passed = 0, failed = 0;

        foreach (MethodInfo testMethod in testMethods)
        {
            try
            {
                // 运行 Setup
                setupMethod?.Invoke(instance, null);

                // 运行测试
                testMethod.Invoke(instance, null);

                // 运行 Teardown
                teardownMethod?.Invoke(instance, null);

                Console.WriteLine($"  [通过] {testMethod.Name}");
                passed++;
            }
            catch (TargetInvocationException ex)
            {
                Console.WriteLine($"  [失败] {testMethod.Name}: {ex.InnerException?.Message}");
                failed++;
            }
        }

        Console.WriteLine(new string('-', 50));
        Console.WriteLine($"结果: {passed} 通过, {failed} 失败");
    }
}

// 使用示例
public class CalculatorTests
{
    private Calculator _calculator;

    [Setup]
    public void Setup()
    {
        _calculator = new Calculator();
    }

    [Test]
    public void TestAdd()
    {
        int result = _calculator.Add(2, 3);
        if (result != 5)
            throw new Exception($"期望 5，实际 {result}");
    }

    [Test]
    public void TestMultiply()
    {
        int result = _calculator.Multiply(4, 5);
        if (result != 20)
            throw new Exception($"期望 20，实际 {result}");
    }

    [Teardown]
    public void Teardown()
    {
        _calculator = null;
    }
}

// 运行测试
var runner = new TestRunner();
runner.RunTests(typeof(CalculatorTests));
```

## 安全性考虑

### 访问控制

```csharp
public class SecurityConsiderations
{
    public void DemonstrateSecurityRisks()
    {
        // 反射可以绕过访问修饰符
        Type type = typeof(SecureClass);
        object instance = Activator.CreateInstance(type);

        // 访问私有字段
        FieldInfo privateField = type.GetField("_secretData",
            BindingFlags.NonPublic | BindingFlags.Instance);
        string secret = (string)privateField.GetValue(instance);
        Console.WriteLine($"私有数据: {secret}"); // 可以读取！

        // 调用私有方法
        MethodInfo privateMethod = type.GetMethod("SecretMethod",
            BindingFlags.NonPublic | BindingFlags.Instance);
        privateMethod.Invoke(instance, null); // 可以调用！
    }
}

public class SecureClass
{
    private string _secretData = "机密信息";

    private void SecretMethod()
    {
        Console.WriteLine("这是私有方法");
    }
}
```

### 使用 Code Access Security（CAS）

在 .NET Framework 中可以使用 CAS 限制反射权限（.NET Core/5+ 已弃用）：

```csharp
// .NET Framework 中的安全检查
public class ReflectionSecurityDemo
{
    public void RestrictReflection()
    {
        // 在部分信任环境中，某些反射操作会被限制
        // 例如访问非公共成员需要 ReflectionPermission

        // 手动安全检查
        var permission = new ReflectionPermission(
            ReflectionPermissionFlag.MemberAccess);
        permission.Demand(); // 如果没有权限会抛出异常
    }
}
```

### 最佳安全实践

```csharp
public class SafeReflection
{
    // 1. 验证类型来源
    public static bool IsTypeSafe(Type type)
    {
        // 只允许来自已知程序集的类型
        string[] allowedAssemblies = { "MyApp", "MyApp.Core", "MyApp.Plugins" };
        return allowedAssemblies.Contains(type.Assembly.GetName().Name);
    }

    // 2. 限制可调用的方法
    public static bool IsMethodAllowed(MethodInfo method)
    {
        // 黑名单方法
        string[] blockedMethods = { "Delete", "Drop", "Truncate", "Execute" };
        return !blockedMethods.Any(m =>
            method.Name.Contains(m, StringComparison.OrdinalIgnoreCase));
    }

    // 3. 安全的动态调用
    public static object SafeInvoke(object target, string methodName, object[] args)
    {
        Type type = target.GetType();

        if (!IsTypeSafe(type))
        {
            throw new SecurityException($"类型 {type.Name} 不在允许列表中");
        }

        MethodInfo method = type.GetMethod(methodName);
        if (method == null)
        {
            throw new MissingMethodException($"方法 {methodName} 不存在");
        }

        if (!IsMethodAllowed(method))
        {
            throw new SecurityException($"方法 {methodName} 被禁止调用");
        }

        return method.Invoke(target, args);
    }
}
```

## 常见问题与解决方案

### 处理泛型类型

```csharp
public class GenericReflection
{
    // 检查是否是特定泛型类型
    public static bool IsGenericListOfType(Type type, Type elementType)
    {
        if (!type.IsGenericType)
            return false;

        if (type.GetGenericTypeDefinition() != typeof(List<>))
            return false;

        return type.GetGenericArguments()[0] == elementType;
    }

    // 创建泛型类型实例
    public static object CreateGenericList(Type elementType)
    {
        Type listType = typeof(List<>).MakeGenericType(elementType);
        return Activator.CreateInstance(listType);
    }

    // 调用泛型方法
    public static void InvokeGenericMethod(object target, string methodName,
        Type[] typeArgs, object[] parameters)
    {
        MethodInfo method = target.GetType().GetMethod(methodName);
        MethodInfo genericMethod = method.MakeGenericMethod(typeArgs);
        genericMethod.Invoke(target, parameters);
    }

    // 获取泛型接口的类型参数
    public static Type[] GetGenericInterfaceArguments(Type type, Type genericInterface)
    {
        var implementedInterface = type.GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType &&
                                 i.GetGenericTypeDefinition() == genericInterface);

        return implementedInterface?.GetGenericArguments();
    }
}
```

### 处理可空类型

```csharp
public class NullableReflection
{
    public static bool IsNullableType(Type type)
    {
        return Nullable.GetUnderlyingType(type) != null;
    }

    public static Type GetUnderlyingType(Type type)
    {
        return Nullable.GetUnderlyingType(type) ?? type;
    }

    public static object ConvertToNullable(object value, Type targetType)
    {
        if (value == null)
            return null;

        Type underlyingType = Nullable.GetUnderlyingType(targetType);
        if (underlyingType != null)
        {
            return Convert.ChangeType(value, underlyingType);
        }

        return Convert.ChangeType(value, targetType);
    }
}
```

### 处理数组类型

```csharp
public class ArrayReflection
{
    public static void HandleArrayTypes()
    {
        // 创建数组类型
        Type intArrayType = typeof(int[]);
        Type stringArrayType = typeof(string).MakeArrayType();
        Type int2DArrayType = typeof(int).MakeArrayType(2); // int[,]
        Type jaggedArrayType = typeof(int[]).MakeArrayType(); // int[][]

        Console.WriteLine($"int[]: {intArrayType.Name}");
        Console.WriteLine($"string[]: {stringArrayType.Name}");
        Console.WriteLine($"int[,]: {int2DArrayType.Name}");
        Console.WriteLine($"int[][]: {jaggedArrayType.Name}");

        // 检查是否是数组
        Console.WriteLine($"IsArray: {intArrayType.IsArray}");

        // 获取元素类型
        Console.WriteLine($"元素类型: {intArrayType.GetElementType().Name}");

        // 获取数组维度
        Console.WriteLine($"维度: {int2DArrayType.GetArrayRank()}");

        // 动态创建数组
        Array array = Array.CreateInstance(typeof(int), 5);
        array.SetValue(42, 2);
        Console.WriteLine($"array[2] = {array.GetValue(2)}");

        // 创建多维数组
        Array matrix = Array.CreateInstance(typeof(int), 3, 4);
        matrix.SetValue(100, 1, 2);
        Console.WriteLine($"matrix[1,2] = {matrix.GetValue(1, 2)}");
    }
}
```

## 总结

反射是 C# 中强大的元编程工具，它提供了：

**核心能力**
- 运行时类型检查和元数据访问
- 动态对象创建和方法调用
- 特性读取和处理
- 程序集加载和检查

**典型应用场景**
- 依赖注入容器
- ORM 框架
- 序列化/反序列化
- 插件系统
- 单元测试框架
- 代码生成器

**性能考虑**
- 反射比直接调用慢 10-100 倍
- 应该缓存反射结果（Type、MethodInfo 等）
- 可以使用委托或表达式树优化热路径
- 考虑使用 Source Generators 替代运行时反射

**安全性**
- 反射可以绕过访问修饰符
- 应验证类型来源和方法调用
- 在不信任的环境中限制反射权限

掌握反射需要理解 .NET 类型系统的底层机制，合理使用反射可以构建灵活、可扩展的应用程序，但也要注意性能和安全性的权衡。在现代 .NET 开发中，Source Generators 提供了一种编译时代码生成的替代方案，可以在保持灵活性的同时获得更好的性能。
