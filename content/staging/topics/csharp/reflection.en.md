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
origin: old/src/content/docs/csharp/reflection.en.md
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

Reflection is one of the most powerful metaprogramming features in .NET, allowing programs to inspect, access, and modify their own metadata at runtime. Through reflection, we can dynamically create objects, invoke methods, access properties, and even generate new types at runtime.

## What is Reflection

Reflection is a mechanism that allows programs at runtime to:

- Retrieve type metadata (class names, properties, methods, fields, etc.)
- Dynamically create object instances
- Invoke methods and access properties
- Read and apply attributes
- Load and inspect assemblies

```csharp
using System;
using System.Reflection;

// Simple reflection example
Type stringType = typeof(string);
Console.WriteLine($"Type name: {stringType.Name}");
Console.WriteLine($"Full name: {stringType.FullName}");
Console.WriteLine($"Assembly: {stringType.Assembly.GetName().Name}");
Console.WriteLine($"Is class: {stringType.IsClass}");
Console.WriteLine($"Is sealed: {stringType.IsSealed}");

// Get all public methods
MethodInfo[] methods = stringType.GetMethods(BindingFlags.Public | BindingFlags.Instance);
Console.WriteLine($"\nstring type has {methods.Length} public instance methods");
```

## The Type Class Explained

The `Type` class is the core of reflection, representing type declarations: class types, interface types, array types, value types, enumeration types, type parameters, generic type definitions, and open or closed constructed generic types.

### Getting Type Objects

There are multiple ways to obtain a `Type` object:

```csharp
// Method 1: Using the typeof operator (compile-time determined)
Type type1 = typeof(string);
Type type2 = typeof(List<int>);
Type type3 = typeof(Dictionary<,>); // Open generic type

// Method 2: Using an object's GetType() method (runtime determined)
string str = "Hello";
Type type4 = str.GetType();

object obj = 42;
Type type5 = obj.GetType(); // System.Int32, not System.Object

// Method 3: Using the Type.GetType() static method (by name)
Type type6 = Type.GetType("System.String");
Type type7 = Type.GetType("System.Collections.Generic.List`1[[System.Int32]]");

// Method 4: Getting from an assembly
Assembly assembly = Assembly.GetExecutingAssembly();
Type type8 = assembly.GetType("MyNamespace.MyClass");

// Comparing Type objects
Console.WriteLine(type1 == type4); // True
Console.WriteLine(type1.Equals(type4)); // True
Console.WriteLine(ReferenceEquals(type1, type4)); // True (Type objects are cached)
```

### Important Properties of Type

```csharp
public class TypeProperties
{
    public static void InspectType(Type type)
    {
        Console.WriteLine($"=== {type.Name} ===");

        // Basic information
        Console.WriteLine($"Name: {type.Name}");
        Console.WriteLine($"FullName: {type.FullName}");
        Console.WriteLine($"Namespace: {type.Namespace}");
        Console.WriteLine($"AssemblyQualifiedName: {type.AssemblyQualifiedName}");

        // Type classification
        Console.WriteLine($"IsClass: {type.IsClass}");
        Console.WriteLine($"IsInterface: {type.IsInterface}");
        Console.WriteLine($"IsAbstract: {type.IsAbstract}");
        Console.WriteLine($"IsSealed: {type.IsSealed}");
        Console.WriteLine($"IsValueType: {type.IsValueType}");
        Console.WriteLine($"IsEnum: {type.IsEnum}");
        Console.WriteLine($"IsArray: {type.IsArray}");
        Console.WriteLine($"IsPrimitive: {type.IsPrimitive}");

        // Generic information
        Console.WriteLine($"IsGenericType: {type.IsGenericType}");
        Console.WriteLine($"IsGenericTypeDefinition: {type.IsGenericTypeDefinition}");
        Console.WriteLine($"IsConstructedGenericType: {type.IsConstructedGenericType}");

        // Inheritance relationships
        Console.WriteLine($"BaseType: {type.BaseType?.Name ?? "null"}");
        Console.WriteLine($"Implemented interfaces: {string.Join(", ", type.GetInterfaces().Select(i => i.Name))}");

        // Accessibility
        Console.WriteLine($"IsPublic: {type.IsPublic}");
        Console.WriteLine($"IsNotPublic: {type.IsNotPublic}");
        Console.WriteLine($"IsNested: {type.IsNested}");
    }
}

// Usage examples
TypeProperties.InspectType(typeof(List<string>));
TypeProperties.InspectType(typeof(IEnumerable<>));
TypeProperties.InspectType(typeof(int));
TypeProperties.InspectType(typeof(DayOfWeek));
```

### Type Inheritance and Implementation Checking

```csharp
public class TypeHierarchy
{
    // Check if a type can be assigned to another type
    public static void CheckAssignability()
    {
        Type stringType = typeof(string);
        Type objectType = typeof(object);
        Type iEnumerableType = typeof(IEnumerable<char>);

        // IsAssignableFrom - Check if assignment from another type is possible
        Console.WriteLine(objectType.IsAssignableFrom(stringType));     // True
        Console.WriteLine(iEnumerableType.IsAssignableFrom(stringType)); // True
        Console.WriteLine(stringType.IsAssignableFrom(objectType));     // False

        // IsSubclassOf - Check if it's a subclass (excludes interfaces)
        Console.WriteLine(stringType.IsSubclassOf(objectType));         // True
        Console.WriteLine(stringType.IsSubclassOf(iEnumerableType));    // False (interfaces don't count)

        // IsInstanceOfType - Check if an object is an instance of the type
        object str = "Hello";
        Console.WriteLine(stringType.IsInstanceOfType(str));            // True
        Console.WriteLine(objectType.IsInstanceOfType(str));            // True
    }

    // Get type hierarchy
    public static IEnumerable<Type> GetTypeHierarchy(Type type)
    {
        Type current = type;
        while (current != null)
        {
            yield return current;
            current = current.BaseType;
        }
    }

    // Get all implemented interfaces (including inherited ones)
    public static Type[] GetAllInterfaces(Type type)
    {
        return type.GetInterfaces();
    }
}

// Usage
foreach (Type t in TypeHierarchy.GetTypeHierarchy(typeof(List<int>)))
{
    Console.WriteLine(t.FullName);
}
// Output:
// System.Collections.Generic.List`1[[System.Int32, ...]]
// System.Object
```

## MethodInfo - Method Reflection

The `MethodInfo` class provides complete information about methods and allows dynamic method invocation.

### Getting Method Information

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

        // Get all public methods (including inherited)
        MethodInfo[] publicMethods = type.GetMethods();

        // Get public methods declared on this type (excluding inherited)
        MethodInfo[] declaredPublicMethods = type.GetMethods(
            BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

        // Get all methods (including private and static)
        MethodInfo[] allMethods = type.GetMethods(
            BindingFlags.Public | BindingFlags.NonPublic |
            BindingFlags.Instance | BindingFlags.Static);

        // Get a specific method
        MethodInfo method = type.GetMethod("MethodWithParams");

        // Get a method with specific parameter types (handling overloads)
        MethodInfo specificMethod = type.GetMethod("MethodWithParams",
            new Type[] { typeof(string), typeof(int) });

        // Inspect method information
        if (method != null)
        {
            Console.WriteLine($"Method name: {method.Name}");
            Console.WriteLine($"Return type: {method.ReturnType.Name}");
            Console.WriteLine($"Is static: {method.IsStatic}");
            Console.WriteLine($"Is virtual: {method.IsVirtual}");
            Console.WriteLine($"Is abstract: {method.IsAbstract}");
            Console.WriteLine($"Is generic method: {method.IsGenericMethod}");

            // Get parameter information
            ParameterInfo[] parameters = method.GetParameters();
            foreach (var param in parameters)
            {
                Console.WriteLine($"  Parameter: {param.Name}, Type: {param.ParameterType.Name}, " +
                                  $"Position: {param.Position}, Is optional: {param.IsOptional}");
            }
        }
    }
}
```

### Dynamic Method Invocation

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

        // Invoke instance method
        MethodInfo addMethod = calcType.GetMethod("Add");
        object result1 = addMethod.Invoke(calc, new object[] { 10, 20 });
        Console.WriteLine($"Add(10, 20) = {result1}"); // 30

        // Invoke static method
        MethodInfo multiplyMethod = calcType.GetMethod("Multiply");
        object result2 = multiplyMethod.Invoke(null, new object[] { 5, 6 });
        Console.WriteLine($"Multiply(5, 6) = {result2}"); // 30

        // Invoke generic method
        MethodInfo echoMethod = calcType.GetMethod("Echo");
        MethodInfo echoString = echoMethod.MakeGenericMethod(typeof(string));
        object result3 = echoString.Invoke(calc, new object[] { "Hello" });
        Console.WriteLine($"Echo<string>(\"Hello\") = {result3}"); // Hello

        // Invoke method with default parameters
        MethodInfo divideMethod = calcType.GetMethod("Divide");
        // Use Type.Missing to indicate default value
        object result4 = divideMethod.Invoke(calc, new object[] { 100, Type.Missing });
        Console.WriteLine($"Divide(100) = {result4}"); // 100

        // Using dynamically created delegate (better performance)
        var addDelegate = (Func<int, int, int>)Delegate.CreateDelegate(
            typeof(Func<int, int, int>), calc, addMethod);
        int result5 = addDelegate(15, 25);
        Console.WriteLine($"Invoke Add(15, 25) via delegate = {result5}"); // 40
    }
}
```

### Handling Method Invocation Exceptions

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
            // TargetInvocationException wraps the actual thrown exception
            Console.WriteLine($"Internal method exception: {ex.InnerException?.Message}");
            throw ex.InnerException ?? ex;
        }
        catch (ArgumentException ex)
        {
            Console.WriteLine($"Argument error: {ex.Message}");
            throw;
        }
        catch (TargetParameterCountException ex)
        {
            Console.WriteLine($"Parameter count error: {ex.Message}");
            throw;
        }
    }
}
```

## PropertyInfo - Property Reflection

The `PropertyInfo` class is used to access property metadata and dynamically manipulate property values.

### Getting Property Information

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

        // Get all public properties
        PropertyInfo[] properties = personType.GetProperties();

        // Get a specific property
        PropertyInfo nameProperty = personType.GetProperty("Name");

        // Get static property
        PropertyInfo countProperty = personType.GetProperty("Count",
            BindingFlags.Public | BindingFlags.Static);

        foreach (PropertyInfo prop in properties)
        {
            Console.WriteLine($"Property: {prop.Name}");
            Console.WriteLine($"  Type: {prop.PropertyType.Name}");
            Console.WriteLine($"  Can read: {prop.CanRead}");
            Console.WriteLine($"  Can write: {prop.CanWrite}");

            // Get accessor information
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

            // Check for indexer
            ParameterInfo[] indexParams = prop.GetIndexParameters();
            if (indexParams.Length > 0)
            {
                Console.WriteLine($"  Is indexer, parameter count: {indexParams.Length}");
            }

            Console.WriteLine();
        }
    }
}
```

### Dynamic Property Access

```csharp
public class PropertyAccess
{
    public static void DemoPropertyAccess()
    {
        Person person = new Person(25) { Name = "Zhang San" };
        Type personType = typeof(Person);

        // Read property value
        PropertyInfo nameProperty = personType.GetProperty("Name");
        string name = (string)nameProperty.GetValue(person);
        Console.WriteLine($"Name = {name}"); // Zhang San

        // Set property value
        nameProperty.SetValue(person, "Li Si");
        Console.WriteLine($"After modification Name = {person.Name}"); // Li Si

        // Access read-only property
        PropertyInfo ageProperty = personType.GetProperty("Age");
        int age = (int)ageProperty.GetValue(person);
        Console.WriteLine($"Age = {age}"); // 25

        // Attempt to set read-only property (will throw exception)
        try
        {
            ageProperty.SetValue(person, 30);
        }
        catch (ArgumentException)
        {
            Console.WriteLine("Cannot set read-only property");
        }

        // Set property using private setter (requires special handling)
        MethodInfo privateSetter = ageProperty.GetSetMethod(true);
        if (privateSetter != null)
        {
            privateSetter.Invoke(person, new object[] { 30 });
            Console.WriteLine($"After modification via private setter Age = {person.Age}"); // 30
        }

        // Access static property
        PropertyInfo countProperty = personType.GetProperty("Count",
            BindingFlags.Public | BindingFlags.Static);
        countProperty.SetValue(null, 100);
        int count = (int)countProperty.GetValue(null);
        Console.WriteLine($"Count = {count}"); // 100
    }
}
```

### Batch Property Operations

```csharp
public static class ObjectMapper
{
    // Simple object copy
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

    // Object to dictionary
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

    // Create object from dictionary
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

## FieldInfo - Field Reflection

The `FieldInfo` class is used to access metadata of fields (member variables).

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

        // Get all fields (including private)
        FieldInfo[] allFields = type.GetFields(
            BindingFlags.Public | BindingFlags.NonPublic |
            BindingFlags.Instance | BindingFlags.Static);

        foreach (FieldInfo field in allFields)
        {
            Console.WriteLine($"Field: {field.Name}");
            Console.WriteLine($"  Type: {field.FieldType.Name}");
            Console.WriteLine($"  Is public: {field.IsPublic}");
            Console.WriteLine($"  Is private: {field.IsPrivate}");
            Console.WriteLine($"  Is static: {field.IsStatic}");
            Console.WriteLine($"  Is readonly: {field.IsInitOnly}");
            Console.WriteLine($"  Is constant: {field.IsLiteral}");
            Console.WriteLine();
        }
    }

    public static void AccessFields()
    {
        FieldExample obj = new FieldExample();
        Type type = typeof(FieldExample);

        // Access public field
        FieldInfo publicField = type.GetField("PublicField");
        string publicValue = (string)publicField.GetValue(obj);
        Console.WriteLine($"PublicField = {publicValue}");

        // Modify public field
        publicField.SetValue(obj, "modified");
        Console.WriteLine($"After modification PublicField = {obj.PublicField}");

        // Access private field
        FieldInfo privateField = type.GetField("_privateField",
            BindingFlags.NonPublic | BindingFlags.Instance);
        int privateValue = (int)privateField.GetValue(obj);
        Console.WriteLine($"_privateField = {privateValue}");

        // Modify private field
        privateField.SetValue(obj, 100);
        Console.WriteLine($"After modification _privateField = {(int)privateField.GetValue(obj)}");

        // Access static field
        FieldInfo staticField = type.GetField("StaticField",
            BindingFlags.Public | BindingFlags.Static);
        staticField.SetValue(null, "new static value");
        Console.WriteLine($"StaticField = {FieldExample.StaticField}");

        // Access constant field
        FieldInfo constField = type.GetField("ConstField");
        Console.WriteLine($"ConstField = {constField.GetRawConstantValue()}");

        // Modify readonly field (not recommended, but technically possible)
        FieldInfo readonlyField = type.GetField("ReadonlyField");
        readonlyField.SetValue(obj, "no longer readonly");
        Console.WriteLine($"ReadonlyField = {obj.ReadonlyField}");
    }
}
```

## ConstructorInfo - Constructor Reflection

The `ConstructorInfo` class is used to get constructor information and dynamically create objects.

```csharp
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }

    // Parameterless constructor
    public Product()
    {
        Console.WriteLine("Parameterless constructor called");
    }

    // Constructor with parameter
    public Product(string name) : this()
    {
        Name = name;
        Console.WriteLine($"Product(string) called: {name}");
    }

    // Multiple parameter constructor
    public Product(int id, string name, decimal price)
    {
        Id = id;
        Name = name;
        Price = price;
        Console.WriteLine($"Product(int, string, decimal) called");
    }

    // Private constructor
    private Product(bool dummy)
    {
        Console.WriteLine("Private constructor called");
    }
}

public class ConstructorInspector
{
    public static void InspectConstructors()
    {
        Type productType = typeof(Product);

        // Get all public constructors
        ConstructorInfo[] publicCtors = productType.GetConstructors();

        // Get all constructors (including private)
        ConstructorInfo[] allCtors = productType.GetConstructors(
            BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);

        Console.WriteLine($"Public constructor count: {publicCtors.Length}");
        Console.WriteLine($"All constructor count: {allCtors.Length}");

        foreach (ConstructorInfo ctor in allCtors)
        {
            ParameterInfo[] parameters = ctor.GetParameters();
            string paramList = string.Join(", ",
                parameters.Select(p => $"{p.ParameterType.Name} {p.Name}"));
            Console.WriteLine($"Constructor: ({paramList})");
            Console.WriteLine($"  Is public: {ctor.IsPublic}");
            Console.WriteLine($"  Is private: {ctor.IsPrivate}");
        }
    }

    public static void CreateInstances()
    {
        Type productType = typeof(Product);

        // Method 1: Using Activator.CreateInstance (parameterless constructor)
        Product p1 = (Product)Activator.CreateInstance(productType);

        // Method 2: Using Activator.CreateInstance (with parameters)
        Product p2 = (Product)Activator.CreateInstance(productType, "Laptop");

        // Method 3: Using ConstructorInfo.Invoke
        ConstructorInfo ctor = productType.GetConstructor(
            new Type[] { typeof(int), typeof(string), typeof(decimal) });
        Product p3 = (Product)ctor.Invoke(new object[] { 1, "Phone", 5999.99m });
        Console.WriteLine($"p3: Id={p3.Id}, Name={p3.Name}, Price={p3.Price}");

        // Method 4: Calling private constructor
        ConstructorInfo privateCtor = productType.GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance,
            null, new Type[] { typeof(bool) }, null);
        Product p4 = (Product)privateCtor.Invoke(new object[] { true });

        // Method 5: Efficient approach using generic constraint
        Product p5 = CreateInstance<Product>();
    }

    public static T CreateInstance<T>() where T : new()
    {
        return new T(); // Compiler optimized, faster than reflection
    }
}
```

## Attributes and Reflection

Attributes are metadata markers in .NET, and reflection can read and process these attributes.

### Defining and Using Custom Attributes

```csharp
// Define custom attribute
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
    public string ErrorMessage { get; set; } = "This field is required";
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
        ErrorMessage = $"Value must be between {min} and {max}";
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

// Using attributes
[Validation("User entity validation", Priority = 1)]
public class User
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Username cannot be empty")]
    [StringLength(50, MinLength = 3)]
    public string Username { get; set; }

    [Required]
    [StringLength(100)]
    public string Email { get; set; }

    [Range(0, 150, ErrorMessage = "Age must be between 0 and 150")]
    public int Age { get; set; }
}
```

### Reading Attribute Information

```csharp
public class AttributeReader
{
    public static void ReadClassAttributes<T>()
    {
        Type type = typeof(T);

        // Get all attributes on the class
        object[] attributes = type.GetCustomAttributes(true);
        Console.WriteLine($"Attributes on {type.Name} class:");
        foreach (object attr in attributes)
        {
            Console.WriteLine($"  {attr.GetType().Name}");
        }

        // Get specific type of attribute
        if (type.GetCustomAttribute<ValidationAttribute>() is ValidationAttribute validation)
        {
            Console.WriteLine($"  Validation message: {validation.Message}");
            Console.WriteLine($"  Priority: {validation.Priority}");
        }
    }

    public static void ReadPropertyAttributes<T>()
    {
        Type type = typeof(T);

        foreach (PropertyInfo prop in type.GetProperties())
        {
            Console.WriteLine($"\nProperty: {prop.Name}");

            // Check Required attribute
            if (prop.GetCustomAttribute<RequiredAttribute>() is RequiredAttribute required)
            {
                Console.WriteLine($"  [Required] {required.ErrorMessage}");
            }

            // Check StringLength attribute
            if (prop.GetCustomAttribute<StringLengthAttribute>() is StringLengthAttribute length)
            {
                Console.WriteLine($"  [StringLength] Min={length.MinLength}, Max={length.MaxLength}");
            }

            // Check Range attribute
            if (prop.GetCustomAttribute<RangeAttribute>() is RangeAttribute range)
            {
                Console.WriteLine($"  [Range] Min={range.Min}, Max={range.Max}");
            }
        }
    }
}

// Usage
AttributeReader.ReadClassAttributes<User>();
AttributeReader.ReadPropertyAttributes<User>();
```

### Attribute-Based Validator

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

            // Validate Required
            var required = prop.GetCustomAttribute<RequiredAttribute>();
            if (required != null)
            {
                if (value == null || (value is string s && string.IsNullOrWhiteSpace(s)))
                {
                    result.IsValid = false;
                    result.Errors.Add($"{prop.Name}: {required.ErrorMessage}");
                }
            }

            // Validate StringLength
            var stringLength = prop.GetCustomAttribute<StringLengthAttribute>();
            if (stringLength != null && value is string str)
            {
                if (str.Length > stringLength.MaxLength || str.Length < stringLength.MinLength)
                {
                    result.IsValid = false;
                    result.Errors.Add($"{prop.Name}: Length must be between {stringLength.MinLength} and {stringLength.MaxLength}");
                }
            }

            // Validate Range
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

// Usage
var user = new User
{
    Id = 1,
    Username = "ab",  // Too short
    Email = null,     // Required
    Age = 200        // Out of range
};

var result = AttributeValidator.Validate(user);
Console.WriteLine($"Validation result: {(result.IsValid ? "Passed" : "Failed")}");
foreach (string error in result.Errors)
{
    Console.WriteLine($"  - {error}");
}
```

## Assembly Loading and Inspection

The `Assembly` class is used to load, inspect, and manipulate assemblies.

### Loading Assemblies

```csharp
public class AssemblyLoader
{
    public static void LoadAssemblies()
    {
        // Get currently executing assembly
        Assembly executingAssembly = Assembly.GetExecutingAssembly();
        Console.WriteLine($"Executing assembly: {executingAssembly.GetName().Name}");

        // Get entry assembly
        Assembly entryAssembly = Assembly.GetEntryAssembly();
        Console.WriteLine($"Entry assembly: {entryAssembly?.GetName().Name}");

        // Get calling assembly
        Assembly callingAssembly = Assembly.GetCallingAssembly();
        Console.WriteLine($"Calling assembly: {callingAssembly.GetName().Name}");

        // Load assembly by name
        try
        {
            Assembly loaded = Assembly.Load("System.Text.Json");
            Console.WriteLine($"Loaded assembly: {loaded.GetName().Name}");
        }
        catch (FileNotFoundException ex)
        {
            Console.WriteLine($"Assembly not found: {ex.Message}");
        }

        // Load from file path
        string path = @"C:\path\to\MyLibrary.dll";
        if (File.Exists(path))
        {
            Assembly fromFile = Assembly.LoadFrom(path);
            Console.WriteLine($"Loaded from file: {fromFile.GetName().Name}");
        }

        // Load assembly without locking file (for plugin scenarios)
        if (File.Exists(path))
        {
            byte[] assemblyBytes = File.ReadAllBytes(path);
            Assembly fromBytes = Assembly.Load(assemblyBytes);
        }
    }
}
```

### Inspecting Assembly Information

```csharp
public class AssemblyInspector
{
    public static void InspectAssembly(Assembly assembly)
    {
        // Basic information
        AssemblyName name = assembly.GetName();
        Console.WriteLine($"Name: {name.Name}");
        Console.WriteLine($"Version: {name.Version}");
        Console.WriteLine($"Culture: {name.CultureInfo?.Name ?? "neutral"}");
        Console.WriteLine($"Public key token: {BitConverter.ToString(name.GetPublicKeyToken() ?? Array.Empty<byte>())}");
        Console.WriteLine($"Location: {assembly.Location}");
        Console.WriteLine($"Is dynamic: {assembly.IsDynamic}");

        // Get all types
        Type[] types = assembly.GetTypes();
        Console.WriteLine($"\nType count: {types.Length}");

        // Get public types
        Type[] publicTypes = assembly.GetExportedTypes();
        Console.WriteLine($"Public type count: {publicTypes.Length}");

        // Get assembly attributes
        Console.WriteLine("\nAssembly attributes:");
        foreach (Attribute attr in assembly.GetCustomAttributes())
        {
            Console.WriteLine($"  {attr.GetType().Name}");
        }

        // Get referenced assemblies
        Console.WriteLine("\nReferenced assemblies:");
        foreach (AssemblyName refName in assembly.GetReferencedAssemblies())
        {
            Console.WriteLine($"  {refName.Name} v{refName.Version}");
        }

        // Get embedded resources
        Console.WriteLine("\nEmbedded resources:");
        foreach (string resourceName in assembly.GetManifestResourceNames())
        {
            Console.WriteLine($"  {resourceName}");
        }
    }
}

// Usage
AssemblyInspector.InspectAssembly(Assembly.GetExecutingAssembly());
```

### Plugin System Implementation

```csharp
// Plugin interface
public interface IPlugin
{
    string Name { get; }
    string Version { get; }
    void Initialize();
    void Execute();
}

// Plugin loader
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
            Console.WriteLine($"Plugin directory does not exist: {_pluginDirectory}");
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
                Console.WriteLine($"Failed to load plugin {Path.GetFileName(dllPath)}: {ex.Message}");
            }
        }
    }

    private void LoadPluginFromFile(string dllPath)
    {
        // Use AssemblyLoadContext for unloadable plugins (.NET Core/.NET 5+)
        Assembly assembly = Assembly.LoadFrom(dllPath);

        // Find types implementing IPlugin interface
        Type pluginInterface = typeof(IPlugin);

        foreach (Type type in assembly.GetExportedTypes())
        {
            if (pluginInterface.IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
            {
                IPlugin plugin = (IPlugin)Activator.CreateInstance(type);
                _plugins.Add(plugin);
                Console.WriteLine($"Loaded plugin: {plugin.Name} v{plugin.Version}");
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
                Console.WriteLine($"Initialized plugin: {plugin.Name}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize plugin {plugin.Name}: {ex.Message}");
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
                Console.WriteLine($"Failed to execute plugin {plugin.Name}: {ex.Message}");
            }
        }
    }

    public IReadOnlyList<IPlugin> Plugins => _plugins.AsReadOnly();
}
```

## Dynamic Object Creation

### Using Activator

```csharp
public class DynamicCreation
{
    public static void CreateWithActivator()
    {
        // Create object with parameterless constructor
        object list = Activator.CreateInstance(typeof(List<int>));

        // Create object with parameterized constructor
        object str = Activator.CreateInstance(typeof(string), new object[] { 'a', 5 });
        Console.WriteLine(str); // "aaaaa"

        // Create by type name
        object dateTime = Activator.CreateInstance(
            "mscorlib", "System.DateTime")?.Unwrap();

        // Generic method creation
        List<string> stringList = Activator.CreateInstance<List<string>>();

        // Create array
        int[] array = (int[])Activator.CreateInstance(typeof(int[]), 10);
        Console.WriteLine($"Array length: {array.Length}"); // 10

        // Create multidimensional array
        int[,] matrix = (int[,])Activator.CreateInstance(typeof(int[,]), 3, 4);
        Console.WriteLine($"Matrix dimensions: {matrix.GetLength(0)}x{matrix.GetLength(1)}"); // 3x4
    }
}
```

### High-Performance Object Creation

```csharp
public static class FastActivator
{
    // Cache constructor delegates
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
            throw new InvalidOperationException($"Type {type.Name} has no parameterless constructor");
        }

        // Use expression tree to create delegate
        NewExpression newExp = Expression.New(constructor);
        LambdaExpression lambda = Expression.Lambda<Func<object>>(
            Expression.Convert(newExp, typeof(object)));

        return (Func<object>)lambda.Compile();
    }

    // Use generic static class for caching
    private static class InstanceCreator<T> where T : new()
    {
        public static readonly Func<T> Create = Expression.Lambda<Func<T>>(
            Expression.New(typeof(T))).Compile();
    }
}

// Performance test
public class PerformanceTest
{
    public static void CompareCreationMethods()
    {
        const int iterations = 1_000_000;
        Type type = typeof(List<int>);

        // Method 1: new keyword
        var sw1 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = new List<int>();
        }
        sw1.Stop();
        Console.WriteLine($"new keyword: {sw1.ElapsedMilliseconds}ms");

        // Method 2: Activator.CreateInstance
        var sw2 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = Activator.CreateInstance<List<int>>();
        }
        sw2.Stop();
        Console.WriteLine($"Activator.CreateInstance<T>: {sw2.ElapsedMilliseconds}ms");

        // Method 3: Activator.CreateInstance(Type)
        var sw3 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = Activator.CreateInstance(type);
        }
        sw3.Stop();
        Console.WriteLine($"Activator.CreateInstance(Type): {sw3.ElapsedMilliseconds}ms");

        // Method 4: Cached delegate
        var sw4 = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var list = FastActivator.CreateInstance<List<int>>();
        }
        sw4.Stop();
        Console.WriteLine($"Cached delegate: {sw4.ElapsedMilliseconds}ms");
    }
}
```

## Reflection Performance Optimization

Reflection is typically 10-100 times slower than direct invocation. Here are some optimization strategies:

### Cache Reflection Results

```csharp
public class ReflectionCache
{
    // Cache Type objects
    private static readonly ConcurrentDictionary<string, Type> _typeCache = new();

    // Cache PropertyInfo
    private static readonly ConcurrentDictionary<(Type, string), PropertyInfo> _propertyCache = new();

    // Cache MethodInfo
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

### Use Delegates Instead of Invoke

```csharp
public class DelegateOptimization
{
    public static void OptimizedPropertyAccess()
    {
        Type type = typeof(Person);
        PropertyInfo prop = type.GetProperty("Name");

        // Slow: Reflection overhead on each call
        Person person = new Person { Name = "Zhang San" };
        string name1 = (string)prop.GetValue(person);

        // Fast: Create delegate and reuse
        var getter = (Func<Person, string>)Delegate.CreateDelegate(
            typeof(Func<Person, string>), prop.GetGetMethod());
        string name2 = getter(person);

        // More generic approach: Using expression trees
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

        // Slow: Using Invoke
        object result1 = method.Invoke(calc, new object[] { 1, 2 });

        // Fast: Create delegate
        var addDelegate = (Func<int, int, int>)Delegate.CreateDelegate(
            typeof(Func<int, int, int>), calc, method);
        int result2 = addDelegate(1, 2);
    }
}
```

### Use DynamicMethod to Generate IL

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

        // Load instance (if instance method)
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

        // Load parameters
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

        // Call method
        il.Emit(method.IsVirtual ? OpCodes.Callvirt : OpCodes.Call, method);

        // Handle return value
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

### Use Source Generators (Compile-Time Generation)

Starting from .NET 5, you can use Source Generators to generate code at compile time, completely avoiding runtime reflection:

```csharp
// This is a conceptual example; actual implementation requires a separate Source Generator project

[AttributeUsage(AttributeTargets.Class)]
public class GenerateMapperAttribute : Attribute { }

// Mark class that needs mapper generation
[GenerateMapper]
public partial class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
}

// Source Generator will automatically generate code like this:
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

## Practical Application Scenarios

### Dependency Injection Container

```csharp
public class SimpleContainer
{
    private readonly Dictionary<Type, Type> _registrations = new();
    private readonly Dictionary<Type, object> _singletons = new();
    private readonly Dictionary<Type, Func<object>> _factories = new();

    // Register type
    public void Register<TService, TImplementation>() where TImplementation : TService
    {
        _registrations[typeof(TService)] = typeof(TImplementation);
    }

    // Register singleton
    public void RegisterSingleton<TService, TImplementation>() where TImplementation : TService
    {
        _registrations[typeof(TService)] = typeof(TImplementation);
        _singletons[typeof(TService)] = null; // Mark as singleton
    }

    // Register factory
    public void RegisterFactory<TService>(Func<TService> factory)
    {
        _factories[typeof(TService)] = () => factory();
    }

    // Resolve type
    public TService Resolve<TService>()
    {
        return (TService)Resolve(typeof(TService));
    }

    public object Resolve(Type serviceType)
    {
        // Check factory
        if (_factories.TryGetValue(serviceType, out var factory))
        {
            return factory();
        }

        // Check singleton
        if (_singletons.TryGetValue(serviceType, out var singleton))
        {
            if (singleton != null) return singleton;

            // Create singleton
            singleton = CreateInstance(serviceType);
            _singletons[serviceType] = singleton;
            return singleton;
        }

        // Normal resolution
        return CreateInstance(serviceType);
    }

    private object CreateInstance(Type serviceType)
    {
        // Get implementation type
        Type implementationType = _registrations.TryGetValue(serviceType, out var regType)
            ? regType
            : serviceType;

        // Get constructor
        ConstructorInfo[] constructors = implementationType.GetConstructors();
        ConstructorInfo constructor = constructors
            .OrderByDescending(c => c.GetParameters().Length)
            .First();

        // Resolve constructor parameters
        ParameterInfo[] parameters = constructor.GetParameters();
        object[] args = new object[parameters.Length];

        for (int i = 0; i < parameters.Length; i++)
        {
            args[i] = Resolve(parameters[i].ParameterType);
        }

        // Create instance
        return constructor.Invoke(args);
    }
}

// Usage
var container = new SimpleContainer();
container.Register<ILogger, ConsoleLogger>();
container.RegisterSingleton<IDatabase, SqlDatabase>();
container.Register<IUserService, UserService>();

var userService = container.Resolve<IUserService>();
```

### Object-Relational Mapping (ORM)

```csharp
public class SimpleORM
{
    private readonly string _connectionString;

    public SimpleORM(string connectionString)
    {
        _connectionString = connectionString;
    }

    // Map from data reader to object
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
                    // Type conversion
                    Type targetType = Nullable.GetUnderlyingType(property.PropertyType)
                        ?? property.PropertyType;
                    value = Convert.ChangeType(value, targetType);
                }

                property.SetValue(obj, value);
            }
        }

        return obj;
    }

    // Generate INSERT statement
    public string GenerateInsertSql<T>(T entity)
    {
        Type type = typeof(T);
        string tableName = type.Name;

        // Check table name attribute
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

// Attribute definitions
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

### Serializer

```csharp
public class SimpleJsonSerializer
{
    public string Serialize(object obj)
    {
        if (obj == null) return "null";

        Type type = obj.GetType();

        // Handle primitive types
        if (type == typeof(string))
            return $"\"{EscapeString((string)obj)}\"";
        if (type.IsPrimitive || type == typeof(decimal))
            return obj.ToString();
        if (type == typeof(DateTime))
            return $"\"{((DateTime)obj):O}\"";

        // Handle collections
        if (obj is IEnumerable enumerable && type != typeof(string))
        {
            var items = enumerable.Cast<object>().Select(Serialize);
            return $"[{string.Join(",", items)}]";
        }

        // Handle objects
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
        // Simplified implementation; actual requires full JSON parser
        T obj = new T();
        Type type = typeof(T);

        // JSON parsing logic needs to be implemented here
        // Parse JSON string and set property values

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

### Unit Testing Framework

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
        Console.WriteLine($"Running test class: {testClass.Name}");
        Console.WriteLine(new string('-', 50));

        // Create test class instance
        object instance = Activator.CreateInstance(testClass);

        // Find Setup method
        MethodInfo setupMethod = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<SetupAttribute>() != null);

        // Find Teardown method
        MethodInfo teardownMethod = testClass.GetMethods()
            .FirstOrDefault(m => m.GetCustomAttribute<TeardownAttribute>() != null);

        // Find all test methods
        var testMethods = testClass.GetMethods()
            .Where(m => m.GetCustomAttribute<TestAttribute>() != null);

        int passed = 0, failed = 0;

        foreach (MethodInfo testMethod in testMethods)
        {
            try
            {
                // Run Setup
                setupMethod?.Invoke(instance, null);

                // Run test
                testMethod.Invoke(instance, null);

                // Run Teardown
                teardownMethod?.Invoke(instance, null);

                Console.WriteLine($"  [PASSED] {testMethod.Name}");
                passed++;
            }
            catch (TargetInvocationException ex)
            {
                Console.WriteLine($"  [FAILED] {testMethod.Name}: {ex.InnerException?.Message}");
                failed++;
            }
        }

        Console.WriteLine(new string('-', 50));
        Console.WriteLine($"Results: {passed} passed, {failed} failed");
    }
}

// Usage example
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
            throw new Exception($"Expected 5, got {result}");
    }

    [Test]
    public void TestMultiply()
    {
        int result = _calculator.Multiply(4, 5);
        if (result != 20)
            throw new Exception($"Expected 20, got {result}");
    }

    [Teardown]
    public void Teardown()
    {
        _calculator = null;
    }
}

// Run tests
var runner = new TestRunner();
runner.RunTests(typeof(CalculatorTests));
```

## Security Considerations

### Access Control

```csharp
public class SecurityConsiderations
{
    public void DemonstrateSecurityRisks()
    {
        // Reflection can bypass access modifiers
        Type type = typeof(SecureClass);
        object instance = Activator.CreateInstance(type);

        // Access private field
        FieldInfo privateField = type.GetField("_secretData",
            BindingFlags.NonPublic | BindingFlags.Instance);
        string secret = (string)privateField.GetValue(instance);
        Console.WriteLine($"Private data: {secret}"); // Can be read!

        // Call private method
        MethodInfo privateMethod = type.GetMethod("SecretMethod",
            BindingFlags.NonPublic | BindingFlags.Instance);
        privateMethod.Invoke(instance, null); // Can be called!
    }
}

public class SecureClass
{
    private string _secretData = "Confidential information";

    private void SecretMethod()
    {
        Console.WriteLine("This is a private method");
    }
}
```

### Using Code Access Security (CAS)

In .NET Framework, you can use CAS to restrict reflection permissions (deprecated in .NET Core/5+):

```csharp
// Security check in .NET Framework
public class ReflectionSecurityDemo
{
    public void RestrictReflection()
    {
        // In partial trust environments, certain reflection operations are restricted
        // For example, accessing non-public members requires ReflectionPermission

        // Manual security check
        var permission = new ReflectionPermission(
            ReflectionPermissionFlag.MemberAccess);
        permission.Demand(); // Throws exception if no permission
    }
}
```

### Security Best Practices

```csharp
public class SafeReflection
{
    // 1. Validate type source
    public static bool IsTypeSafe(Type type)
    {
        // Only allow types from known assemblies
        string[] allowedAssemblies = { "MyApp", "MyApp.Core", "MyApp.Plugins" };
        return allowedAssemblies.Contains(type.Assembly.GetName().Name);
    }

    // 2. Restrict callable methods
    public static bool IsMethodAllowed(MethodInfo method)
    {
        // Blacklisted methods
        string[] blockedMethods = { "Delete", "Drop", "Truncate", "Execute" };
        return !blockedMethods.Any(m =>
            method.Name.Contains(m, StringComparison.OrdinalIgnoreCase));
    }

    // 3. Safe dynamic invocation
    public static object SafeInvoke(object target, string methodName, object[] args)
    {
        Type type = target.GetType();

        if (!IsTypeSafe(type))
        {
            throw new SecurityException($"Type {type.Name} is not in the allowed list");
        }

        MethodInfo method = type.GetMethod(methodName);
        if (method == null)
        {
            throw new MissingMethodException($"Method {methodName} does not exist");
        }

        if (!IsMethodAllowed(method))
        {
            throw new SecurityException($"Method {methodName} is forbidden");
        }

        return method.Invoke(target, args);
    }
}
```

## Common Problems and Solutions

### Handling Generic Types

```csharp
public class GenericReflection
{
    // Check if it's a specific generic type
    public static bool IsGenericListOfType(Type type, Type elementType)
    {
        if (!type.IsGenericType)
            return false;

        if (type.GetGenericTypeDefinition() != typeof(List<>))
            return false;

        return type.GetGenericArguments()[0] == elementType;
    }

    // Create generic type instance
    public static object CreateGenericList(Type elementType)
    {
        Type listType = typeof(List<>).MakeGenericType(elementType);
        return Activator.CreateInstance(listType);
    }

    // Invoke generic method
    public static void InvokeGenericMethod(object target, string methodName,
        Type[] typeArgs, object[] parameters)
    {
        MethodInfo method = target.GetType().GetMethod(methodName);
        MethodInfo genericMethod = method.MakeGenericMethod(typeArgs);
        genericMethod.Invoke(target, parameters);
    }

    // Get generic interface type arguments
    public static Type[] GetGenericInterfaceArguments(Type type, Type genericInterface)
    {
        var implementedInterface = type.GetInterfaces()
            .FirstOrDefault(i => i.IsGenericType &&
                                 i.GetGenericTypeDefinition() == genericInterface);

        return implementedInterface?.GetGenericArguments();
    }
}
```

### Handling Nullable Types

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

### Handling Array Types

```csharp
public class ArrayReflection
{
    public static void HandleArrayTypes()
    {
        // Create array types
        Type intArrayType = typeof(int[]);
        Type stringArrayType = typeof(string).MakeArrayType();
        Type int2DArrayType = typeof(int).MakeArrayType(2); // int[,]
        Type jaggedArrayType = typeof(int[]).MakeArrayType(); // int[][]

        Console.WriteLine($"int[]: {intArrayType.Name}");
        Console.WriteLine($"string[]: {stringArrayType.Name}");
        Console.WriteLine($"int[,]: {int2DArrayType.Name}");
        Console.WriteLine($"int[][]: {jaggedArrayType.Name}");

        // Check if array
        Console.WriteLine($"IsArray: {intArrayType.IsArray}");

        // Get element type
        Console.WriteLine($"Element type: {intArrayType.GetElementType().Name}");

        // Get array dimensions
        Console.WriteLine($"Dimensions: {int2DArrayType.GetArrayRank()}");

        // Dynamically create array
        Array array = Array.CreateInstance(typeof(int), 5);
        array.SetValue(42, 2);
        Console.WriteLine($"array[2] = {array.GetValue(2)}");

        // Create multidimensional array
        Array matrix = Array.CreateInstance(typeof(int), 3, 4);
        matrix.SetValue(100, 1, 2);
        Console.WriteLine($"matrix[1,2] = {matrix.GetValue(1, 2)}");
    }
}
```

## Summary

Reflection is a powerful metaprogramming tool in C# that provides:

**Core Capabilities**
- Runtime type inspection and metadata access
- Dynamic object creation and method invocation
- Attribute reading and processing
- Assembly loading and inspection

**Typical Application Scenarios**
- Dependency injection containers
- ORM frameworks
- Serialization/deserialization
- Plugin systems
- Unit testing frameworks
- Code generators

**Performance Considerations**
- Reflection is 10-100 times slower than direct invocation
- Reflection results should be cached (Type, MethodInfo, etc.)
- Use delegates or expression trees to optimize hot paths
- Consider using Source Generators instead of runtime reflection

**Security**
- Reflection can bypass access modifiers
- Type sources and method calls should be validated
- Restrict reflection permissions in untrusted environments

Mastering reflection requires understanding the underlying mechanisms of the .NET type system. Proper use of reflection enables building flexible, extensible applications, but performance and security trade-offs must be considered. In modern .NET development, Source Generators provide a compile-time code generation alternative that maintains flexibility while achieving better performance.
