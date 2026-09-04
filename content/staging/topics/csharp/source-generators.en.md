---
title: C# Source Generators
description: "A comprehensive guide to understanding C# Source Generators: how they work, the differences between ISourceGenerator and IIncrementalGenerator, syntax analysis, semantic models, and how to build high-performance incremental source code generators"
track: csharp
section: types-linq
difficulty: advanced
tags:
  - C#
  - Source Generators
  - Roslyn
  - Code Generation
  - Compiler Extensions
status: imported
origin: old/src/content/docs/csharp/source-generators.en.md
divergence: 0.23
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: csharp
  subcategory: ""
  order: 35
  lastUpdated: 2026-01-07
---

Source Generators are a revolutionary feature introduced in C# 9.0 / .NET 5, allowing developers to examine user code during compilation and generate new C# source files. This technology is built on the Roslyn compiler platform and opens up new possibilities for metaprogramming, code automation, and performance optimization.

## Conceptual Overview

### What are Source Generators?

Source Generators are a compile-time code generation technique that runs as part of the compilation pipeline and can:

1. **Read all source code being compiled**: Access syntax trees and semantic models
2. **Generate new source code files**: These files are added to the compilation
3. **Cannot modify existing code**: Can only add new code, ensuring predictability

```
┌─────────────────────────────────────────────────────────────┐
│                      Compilation Pipeline                  │
├─────────────────────────────────────────────────────────────┤
│  Source Code (.cs) ─→ Lexical Analysis ─→ Semantic Analysis │
│                                           ─→ Source Generator │
│                                              │               │
│                                              ↓               │
│                                         Generated Code       │
│                                              │               │
│                                              ↓               │
│                              Merged Compilation ─→ Final    │
│                                          Assembly (.dll)     │
└─────────────────────────────────────────────────────────────┘
```

### Comparison with Other Code Generation Methods

| Method | Execution Time | Advantages | Disadvantages |
|--------|----------------|-----------|----------------|
| **T4 Templates** | Design Time | Flexible, visual | Requires manual trigger, not part of compilation |
| **Reflection + Emit** | Runtime | Highly dynamic | Performance overhead, AOT unfriendly |
| **Expression Trees** | Runtime | Type-safe | High complexity, difficult debugging |
| **Source Generators** | Compile Time | Zero runtime overhead, IDE support | Can only add code, more complex debugging |

### Historical Evolution

- **.NET 5 (2020)**: Introduced `ISourceGenerator` interface
- **.NET 6 (2021)**: Introduced `IIncrementalGenerator` incremental generator
- **.NET 9+ (2024)**: `ISourceGenerator` marked as obsolete, incremental generators recommended

> **Important Note**: Starting with Roslyn 4.10.0 / .NET 9, `ISourceGenerator` has been deprecated. New projects should always use `IIncrementalGenerator`.

## Core Principles

### Compiler Integration Architecture

Source Generators are deeply integrated into the Roslyn compiler and execute as a stage in the compilation pipeline:

```
┌────────────────────────────────────────────────────────────────┐
│                     Roslyn Compilation Pipeline               │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Lexical Analysis (Lexer)                                   │
│     ├─ Converts source code into Token stream                  │
│     └─ Output: SyntaxToken                                     │
│                                                                │
│  2. Syntax Analysis (Parser)                                   │
│     ├─ Constructs Syntax Tree                                  │
│     └─ Output: SyntaxNode, SyntaxTree                          │
│                                                                │
│  3. Semantic Analysis                                          │
│     ├─ Symbol resolution, type checking                        │
│     └─ Output: Compilation, SemanticModel, ISymbol            │
│                                                                │
│  4. Source Generator Execution  ← Intervenes here             │
│     ├─ Reads syntax tree and semantic model                    │
│     ├─ Generates new source code                              │
│     └─ New code added to compilation                          │
│                                                                │
│  5. IL Code Generation                                         │
│     └─ Output: Assembly (.dll/.exe)                            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Syntax Tree

The syntax tree is a structured representation of source code where each node is a derived class of `SyntaxNode`:

```csharp
// Example code
public class Person
{
    public string Name { get; set; }
}

// Corresponding syntax tree structure (simplified)
CompilationUnitSyntax
└── ClassDeclarationSyntax (Person)
    └── MemberDeclarationSyntax
        └── PropertyDeclarationSyntax (Name)
            ├── TypeSyntax (string)
            ├── IdentifierToken (Name)
            └── AccessorListSyntax
                ├── GetAccessorDeclarationSyntax
                └── SetAccessorDeclarationSyntax
```

**Key Characteristics**:
- **Immutability**: Syntax trees are immutable; any modification creates a new tree
- **Completeness**: Preserves all syntactic details, including whitespace and comments
- **Red-Green Trees**: Roslyn uses red-green trees to optimize memory usage

### Semantic Model

The semantic model provides semantic information about syntax nodes, including type resolution and symbol lookup:

```csharp
// Syntax level: only knows "string" is an identifier
// Semantic level: knows string is System.String type

// Getting semantic information
SemanticModel semanticModel = compilation.GetSemanticModel(syntaxTree);
ITypeSymbol typeSymbol = semanticModel.GetTypeInfo(typeSyntax).Type;

// typeSymbol contains complete type information:
// - Namespace: System
// - Name: String
// - Members: Length, Substring, ...
// - Base class: Object
// - Interfaces: IEnumerable<char>, IComparable<string>, ...
```

### Symbol System

Symbols represent various declaration entities in code:

```csharp
// Symbol hierarchy
ISymbol                          // Base interface
├── INamespaceSymbol             // Namespace
├── ITypeSymbol                  // Type
│   ├── INamedTypeSymbol         // Named types (class, struct, interface, enum)
│   ├── IArrayTypeSymbol         // Array types
│   ├── IPointerTypeSymbol       // Pointer types
│   └── ITypeParameterSymbol     // Generic type parameters
├── IMemberSymbol                // Members
│   ├── IFieldSymbol             // Fields
│   ├── IPropertySymbol          // Properties
│   ├── IMethodSymbol            // Methods
│   └── IEventSymbol             // Events
├── IParameterSymbol             // Parameters
└── ILocalSymbol                 // Local variables
```

### Incremental Generator Pipeline

Incremental generators (`IIncrementalGenerator`) use a dataflow pipeline model with the core concept of **caching and incremental updates**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Incremental Generator Pipeline               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Provider (Data Source)                                         │
│      │                                                          │
│      ↓                                                          │
│  Where (Filter) ─→ Remove irrelevant nodes                      │
│      │                                                          │
│      ↓                                                          │
│  Select (Transform) ─→ Extract needed data to simple models     │
│      │                                                          │
│      ↓                                                          │
│  Collect (Gather) ─→ Aggregate multiple values                  │
│      │                                                          │
│      ↓                                                          │
│  Combine (Merge) ─→ Combine with other data sources             │
│      │                                                          │
│      ↓                                                          │
│  RegisterSourceOutput ─→ Generate final code                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Key Optimizations:
- Output of each step is cached
- Only recompute when input changes
- Use value equality to determine if regeneration is needed
```

## Core Concepts

### ISourceGenerator vs IIncrementalGenerator

#### Traditional Generator (Deprecated)

```csharp
// Traditional ISourceGenerator - Deprecated, not recommended
[Generator]
public class LegacyGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context)
    {
        // Register syntax receiver
        context.RegisterForSyntaxNotifications(() => new SyntaxReceiver());
    }

    public void Execute(GeneratorExecutionContext context)
    {
        // Executes completely on every compilation
        // Performance issue: reruns even if code hasn't changed
    }
}
```

#### Incremental Generator (Recommended)

```csharp
// Modern IIncrementalGenerator - Recommended
[Generator]
public class ModernGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Build dataflow pipeline
        // Only regenerates when relevant code changes
    }
}
```

**Performance Comparison**:

| Feature | ISourceGenerator | IIncrementalGenerator |
|---------|------------------|----------------------|
| Execution Frequency | Complete execution every compilation | Executes only when input changes |
| IDE Response | May cause slowdown | Smooth editing experience |
| Memory Usage | May hold large amounts of objects | Timely release of unneeded objects |
| State Management | Stateless, recomputed each time | Caches intermediate results |

### Data Providers

Incremental generators obtain data through various providers:

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // 1. SyntaxProvider - Get syntax nodes
    var syntaxProvider = context.SyntaxProvider
        .CreateSyntaxProvider(
            predicate: (node, _) => node is ClassDeclarationSyntax,
            transform: (ctx, _) => (ClassDeclarationSyntax)ctx.Node
        );

    // 2. CompilationProvider - Get compilation information
    var compilationProvider = context.CompilationProvider;

    // 3. AdditionalTextsProvider - Get additional files
    var additionalTexts = context.AdditionalTextsProvider;

    // 4. AnalyzerConfigOptionsProvider - Get configuration options
    var configOptions = context.AnalyzerConfigOptionsProvider;

    // 5. MetadataReferencesProvider - Get metadata references
    var metadataRefs = context.MetadataReferencesProvider;
}
```

### Pipeline Operations

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // Where - Filter
    var filtered = provider.Where(x => x.Identifier.Text.StartsWith("I"));

    // Select - Transform
    var transformed = provider.Select((syntax, ct) => ExtractModel(syntax));

    // SelectMany - Flatten
    var flattened = provider.SelectMany((items, ct) => items);

    // Collect - Gather into immutable array
    var collected = provider.Collect();

    // Combine - Combine two providers
    var combined = provider1.Combine(provider2);

    // WithComparer - Custom comparer
    var withComparer = provider.WithComparer(new CustomComparer());
}
```

### Attribute-Driven Generator Pattern

The best practice is to use attributes to mark targets that need code generation:

```csharp
// 1. Define marker attribute
[AttributeUsage(AttributeTargets.Class)]
public class AutoNotifyAttribute : Attribute { }

// 2. User marks class with attribute
[AutoNotify]
public partial class Person
{
    private string _name;
    private int _age;
}

// 3. Generator detects attribute and generates code
// Generated code implements INotifyPropertyChanged
```

## Code Examples

### Project Structure

```
Solution/
├── MyGenerator/                    # Generator project
│   ├── MyGenerator.csproj
│   └── HelloWorldGenerator.cs
└── MyApplication/                  # Project using generator
    ├── MyApplication.csproj
    └── Program.cs
```

### Generator Project Configuration

```xml
<!-- MyGenerator.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <LangVersion>latest</LangVersion>

    <!-- Key configurations -->
    <EnforceExtendedAnalyzerRules>true</EnforceExtendedAnalyzerRules>
    <IsRoslynComponent>true</IsRoslynComponent>
  </PropertyGroup>

  <ItemGroup>
    <!-- Roslyn Analyzer/Generator API -->
    <PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.3.4">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp" Version="4.8.0" />
  </ItemGroup>
</Project>
```

### Project Using Generator Configuration

```xml
<!-- MyApplication.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <!-- Reference generator project -->
    <ProjectReference Include="..\MyGenerator\MyGenerator.csproj"
                      OutputItemType="Analyzer"
                      ReferenceOutputAssembly="false" />
  </ItemGroup>
</Project>
```

### Basic Incremental Generator Example

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// A simple Hello World incremental generator
/// Generates a SayHello method for each partial class
/// </summary>
[Generator]
public class HelloWorldGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Step 1: Create syntax provider, filter partial classes
        IncrementalValuesProvider<ClassDeclarationSyntax> classDeclarations =
            context.SyntaxProvider
                .CreateSyntaxProvider(
                    predicate: static (node, _) => IsCandidateClass(node),
                    transform: static (ctx, _) => GetClassDeclaration(ctx))
                .Where(static c => c is not null)!;

        // Step 2: Combine with compilation info
        IncrementalValueProvider<(Compilation, ImmutableArray<ClassDeclarationSyntax>)>
            compilationAndClasses = context.CompilationProvider
                .Combine(classDeclarations.Collect());

        // Step 3: Register output
        context.RegisterSourceOutput(
            compilationAndClasses,
            static (spc, source) => Execute(source.Item1, source.Item2, spc));
    }

    /// <summary>
    /// Quick syntax filter - should be as simple and fast as possible
    /// </summary>
    private static bool IsCandidateClass(SyntaxNode node)
    {
        return node is ClassDeclarationSyntax classDecl &&
               classDecl.Modifiers.Any(m => m.ValueText == "partial");
    }

    /// <summary>
    /// Get class declaration (can do more detailed checks here)
    /// </summary>
    private static ClassDeclarationSyntax? GetClassDeclaration(
        GeneratorSyntaxContext context)
    {
        var classDecl = (ClassDeclarationSyntax)context.Node;

        // Can use semantic model for more precise filtering here
        // var symbol = context.SemanticModel.GetDeclaredSymbol(classDecl);

        return classDecl;
    }

    /// <summary>
    /// Execute code generation
    /// </summary>
    private static void Execute(
        Compilation compilation,
        ImmutableArray<ClassDeclarationSyntax> classes,
        SourceProductionContext context)
    {
        if (classes.IsDefaultOrEmpty)
            return;

        foreach (var classDecl in classes.Distinct())
        {
            // Get semantic model
            var semanticModel = compilation.GetSemanticModel(classDecl.SyntaxTree);
            var classSymbol = semanticModel.GetDeclaredSymbol(classDecl);

            if (classSymbol is null)
                continue;

            // Generate code
            string namespaceName = classSymbol.ContainingNamespace.ToDisplayString();
            string className = classSymbol.Name;

            string source = GenerateSource(namespaceName, className);

            // Add to compilation
            context.AddSource(
                $"{className}.g.cs",
                SourceText.From(source, Encoding.UTF8));
        }
    }

    /// <summary>
    /// Generate source code string
    /// </summary>
    private static string GenerateSource(string namespaceName, string className)
    {
        return $$"""
            // <auto-generated/>
            #nullable enable

            namespace {{namespaceName}}
            {
                partial class {{className}}
                {
                    /// <summary>
                    /// Method automatically generated by Source Generator
                    /// </summary>
                    public static void SayHello()
                    {
                        System.Console.WriteLine($"Hello from {{className}}!");
                    }
                }
            }
            """;
    }
}
```

### Attribute-Based Generator

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// Generator that automatically implements INotifyPropertyChanged
/// </summary>
[Generator]
public class AutoNotifyGenerator : IIncrementalGenerator
{
    private const string AttributeSource = """
        // <auto-generated/>
        namespace AutoNotify
        {
            [System.AttributeUsage(System.AttributeTargets.Field)]
            public class AutoNotifyAttribute : System.Attribute { }
        }
        """;

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Inject marker attribute
        context.RegisterPostInitializationOutput(ctx =>
        {
            ctx.AddSource("AutoNotifyAttribute.g.cs",
                SourceText.From(AttributeSource, Encoding.UTF8));
        });

        // Find fields with [AutoNotify] attribute
        var fieldDeclarations = context.SyntaxProvider
            .ForAttributeWithMetadataName(
                "AutoNotify.AutoNotifyAttribute",
                predicate: static (node, _) => node is VariableDeclaratorSyntax,
                transform: static (ctx, _) => GetFieldInfo(ctx))
            .Where(static f => f is not null)
            .Collect();

        // Group by class and generate code
        context.RegisterSourceOutput(fieldDeclarations,
            static (spc, fields) => GenerateCode(fields!, spc));
    }

    /// <summary>
    /// Field info model - use record to ensure value equality
    /// </summary>
    private record FieldInfo(
        string Namespace,
        string ClassName,
        string FieldName,
        string PropertyName,
        string TypeName);

    private static FieldInfo? GetFieldInfo(GeneratorAttributeSyntaxContext context)
    {
        var variableDeclarator = (VariableDeclaratorSyntax)context.TargetNode;

        // Get field declaration
        if (variableDeclarator.Parent?.Parent is not FieldDeclarationSyntax fieldDecl)
            return null;

        // Get containing class
        if (fieldDecl.Parent is not ClassDeclarationSyntax classDecl)
            return null;

        var semanticModel = context.SemanticModel;
        var fieldSymbol = semanticModel.GetDeclaredSymbol(variableDeclarator) as IFieldSymbol;

        if (fieldSymbol is null)
            return null;

        var classSymbol = fieldSymbol.ContainingType;
        string fieldName = fieldSymbol.Name;

        // Convert _fieldName to FieldName
        string propertyName = GetPropertyName(fieldName);

        return new FieldInfo(
            Namespace: classSymbol.ContainingNamespace.ToDisplayString(),
            ClassName: classSymbol.Name,
            FieldName: fieldName,
            PropertyName: propertyName,
            TypeName: fieldSymbol.Type.ToDisplayString());
    }

    private static string GetPropertyName(string fieldName)
    {
        // _name -> Name, m_name -> Name, name -> Name
        if (fieldName.StartsWith("_"))
            fieldName = fieldName.Substring(1);
        else if (fieldName.StartsWith("m_"))
            fieldName = fieldName.Substring(2);

        if (string.IsNullOrEmpty(fieldName))
            return fieldName;

        return char.ToUpperInvariant(fieldName[0]) + fieldName.Substring(1);
    }

    private static void GenerateCode(
        ImmutableArray<FieldInfo?> fields,
        SourceProductionContext context)
    {
        if (fields.IsDefaultOrEmpty)
            return;

        // Group by class
        var groupedByClass = fields
            .Where(f => f is not null)
            .GroupBy(f => (f!.Namespace, f.ClassName));

        foreach (var group in groupedByClass)
        {
            var (ns, className) = group.Key;
            var classFields = group.ToList();

            var source = GenerateClassSource(ns, className, classFields!);
            context.AddSource($"{className}.AutoNotify.g.cs",
                SourceText.From(source, Encoding.UTF8));
        }
    }

    private static string GenerateClassSource(
        string ns,
        string className,
        List<FieldInfo> fields)
    {
        var sb = new StringBuilder();

        sb.AppendLine("// <auto-generated/>");
        sb.AppendLine("#nullable enable");
        sb.AppendLine();
        sb.AppendLine("using System.ComponentModel;");
        sb.AppendLine();
        sb.AppendLine($"namespace {ns}");
        sb.AppendLine("{");
        sb.AppendLine($"    partial class {className} : INotifyPropertyChanged");
        sb.AppendLine("    {");
        sb.AppendLine("        public event PropertyChangedEventHandler? PropertyChanged;");
        sb.AppendLine();
        sb.AppendLine("        private void OnPropertyChanged(string propertyName)");
        sb.AppendLine("        {");
        sb.AppendLine("            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));");
        sb.AppendLine("        }");

        foreach (var field in fields)
        {
            sb.AppendLine();
            sb.AppendLine($"        public {field.TypeName} {field.PropertyName}");
            sb.AppendLine("        {");
            sb.AppendLine($"            get => {field.FieldName};");
            sb.AppendLine("            set");
            sb.AppendLine("            {");
            sb.AppendLine($"                if (!Equals({field.FieldName}, value))");
            sb.AppendLine("                {");
            sb.AppendLine($"                    {field.FieldName} = value;");
            sb.AppendLine($"                    OnPropertyChanged(nameof({field.PropertyName}));");
            sb.AppendLine("                }");
            sb.AppendLine("            }");
            sb.AppendLine("        }");
        }

        sb.AppendLine("    }");
        sb.AppendLine("}");

        return sb.ToString();
    }
}
```

### Usage Example

```csharp
// User code
using AutoNotify;

namespace MyApp;

public partial class Person
{
    [AutoNotify]
    private string _name = "";

    [AutoNotify]
    private int _age;

    [AutoNotify]
    private string? _email;
}

// Using generated code
var person = new Person();
person.PropertyChanged += (sender, e) =>
{
    Console.WriteLine($"Property {e.PropertyName} changed");
};

person.Name = "John";  // Output: Property Name changed
person.Age = 25;       // Output: Property Age changed
```

### Advanced Example: JSON Serializer Generator

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// Generates high-performance JSON serialization code
/// </summary>
[Generator]
public class JsonSerializerGenerator : IIncrementalGenerator
{
    private const string AttributeSource = """
        // <auto-generated/>
        namespace JsonGen
        {
            [System.AttributeUsage(System.AttributeTargets.Class | System.AttributeTargets.Struct)]
            public class JsonSerializableAttribute : System.Attribute { }

            [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
            public class JsonPropertyNameAttribute : System.Attribute
            {
                public string Name { get; }
                public JsonPropertyNameAttribute(string name) => Name = name;
            }

            [System.AttributeUsage(System.AttributeTargets.Property | System.AttributeTargets.Field)]
            public class JsonIgnoreAttribute : System.Attribute { }
        }
        """;

    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // Inject attributes
        context.RegisterPostInitializationOutput(ctx =>
        {
            ctx.AddSource("JsonAttributes.g.cs",
                SourceText.From(AttributeSource, Encoding.UTF8));
        });

        // Find types with [JsonSerializable] attribute
        var typesToSerialize = context.SyntaxProvider
            .ForAttributeWithMetadataName(
                "JsonGen.JsonSerializableAttribute",
                predicate: static (node, _) => node is TypeDeclarationSyntax,
                transform: static (ctx, _) => GetTypeInfo(ctx))
            .Where(static t => t is not null);

        context.RegisterSourceOutput(typesToSerialize,
            static (spc, typeInfo) => GenerateSerializer(typeInfo!, spc));
    }

    private record PropertyInfo(string Name, string JsonName, string Type, bool IsNullable);

    private record TypeInfo(
        string Namespace,
        string TypeName,
        bool IsStruct,
        ImmutableArray<PropertyInfo> Properties);

    private static TypeInfo? GetTypeInfo(GeneratorAttributeSyntaxContext context)
    {
        var typeDecl = (TypeDeclarationSyntax)context.TargetNode;
        var semanticModel = context.SemanticModel;
        var typeSymbol = semanticModel.GetDeclaredSymbol(typeDecl) as INamedTypeSymbol;

        if (typeSymbol is null)
            return null;

        var properties = new List<PropertyInfo>();

        foreach (var member in typeSymbol.GetMembers())
        {
            if (member is not IPropertySymbol property)
                continue;

            // Check for JsonIgnore attribute
            if (HasAttribute(property, "JsonGen.JsonIgnoreAttribute"))
                continue;

            // Get JSON property name
            string jsonName = GetJsonPropertyName(property);

            properties.Add(new PropertyInfo(
                Name: property.Name,
                JsonName: jsonName,
                Type: property.Type.ToDisplayString(),
                IsNullable: property.Type.NullableAnnotation == NullableAnnotation.Annotated));
        }

        return new TypeInfo(
            Namespace: typeSymbol.ContainingNamespace.ToDisplayString(),
            TypeName: typeSymbol.Name,
            IsStruct: typeSymbol.IsValueType,
            Properties: properties.ToImmutableArray());
    }

    private static bool HasAttribute(ISymbol symbol, string attributeFullName)
    {
        return symbol.GetAttributes()
            .Any(a => a.AttributeClass?.ToDisplayString() == attributeFullName);
    }

    private static string GetJsonPropertyName(IPropertySymbol property)
    {
        var attr = property.GetAttributes()
            .FirstOrDefault(a => a.AttributeClass?.ToDisplayString() == "JsonGen.JsonPropertyNameAttribute");

        if (attr?.ConstructorArguments.Length > 0 &&
            attr.ConstructorArguments[0].Value is string name)
        {
            return name;
        }

        // Default to camelCase
        return char.ToLowerInvariant(property.Name[0]) + property.Name.Substring(1);
    }

    private static void GenerateSerializer(TypeInfo typeInfo, SourceProductionContext context)
    {
        var source = $$"""
            // <auto-generated/>
            #nullable enable
            using System.Text;
            using System.Text.Json;

            namespace {{typeInfo.Namespace}}
            {
                partial {{(typeInfo.IsStruct ? "struct" : "class")}} {{typeInfo.TypeName}}
                {
                    public string ToJson()
                    {
                        var sb = new StringBuilder();
                        sb.Append('{');
                        {{GeneratePropertySerialization(typeInfo.Properties)}}
                        sb.Append('}');
                        return sb.ToString();
                    }

                    public static {{typeInfo.TypeName}}{{(typeInfo.IsStruct ? "" : "?")}} FromJson(string json)
                    {
                        using var doc = JsonDocument.Parse(json);
                        var root = doc.RootElement;

                        return new {{typeInfo.TypeName}}
                        {
                            {{GeneratePropertyDeserialization(typeInfo.Properties)}}
                        };
                    }
                }
            }
            """;

        context.AddSource($"{typeInfo.TypeName}.JsonSerializer.g.cs",
            SourceText.From(source, Encoding.UTF8));
    }

    private static string GeneratePropertySerialization(ImmutableArray<PropertyInfo> properties)
    {
        var sb = new StringBuilder();
        bool first = true;

        foreach (var prop in properties)
        {
            if (!first)
                sb.AppendLine("sb.Append(',');");

            sb.AppendLine($"sb.Append(\"\\\"{prop.JsonName}\\\":\");");

            if (prop.Type == "string" || prop.Type == "string?")
            {
                if (prop.IsNullable)
                {
                    sb.AppendLine($"if ({prop.Name} is null) sb.Append(\"null\");");
                    sb.AppendLine($"else sb.Append($\"\\\"{{{prop.Name}}}\\\"\");");
                }
                else
                {
                    sb.AppendLine($"sb.Append($\"\\\"{{{prop.Name}}}\\\"\");");
                }
            }
            else if (prop.Type == "bool" || prop.Type == "bool?")
            {
                sb.AppendLine($"sb.Append({prop.Name}.ToString().ToLowerInvariant());");
            }
            else
            {
                sb.AppendLine($"sb.Append({prop.Name});");
            }

            first = false;
        }

        return sb.ToString();
    }

    private static string GeneratePropertyDeserialization(ImmutableArray<PropertyInfo> properties)
    {
        var sb = new StringBuilder();

        foreach (var prop in properties)
        {
            string getter = prop.Type switch
            {
                "string" => $"root.GetProperty(\"{prop.JsonName}\").GetString() ?? \"\"",
                "string?" => $"root.GetProperty(\"{prop.JsonName}\").GetString()",
                "int" => $"root.GetProperty(\"{prop.JsonName}\").GetInt32()",
                "long" => $"root.GetProperty(\"{prop.JsonName}\").GetInt64()",
                "double" => $"root.GetProperty(\"{prop.JsonName}\").GetDouble()",
                "bool" => $"root.GetProperty(\"{prop.JsonName}\").GetBoolean()",
                _ => $"default"
            };

            sb.AppendLine($"{prop.Name} = {getter},");
        }

        return sb.ToString();
    }
}
```

## Best Practices

### Use Incremental Generators

Always use `IIncrementalGenerator` instead of `ISourceGenerator`:

```csharp
// Correct
[Generator]
public class MyGenerator : IIncrementalGenerator { }

// Deprecated
[Generator]
public class MyGenerator : ISourceGenerator { }
```

### Filter Irrelevant Data Early

Filter out unneeded data in early pipeline stages to reduce subsequent processing:

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // Good practice: Quick filter in predicate
    var provider = context.SyntaxProvider.CreateSyntaxProvider(
        predicate: static (node, _) =>
        {
            // Quick syntax check
            if (node is not ClassDeclarationSyntax classDecl)
                return false;

            // Check for any attributes
            return classDecl.AttributeLists.Count > 0;
        },
        transform: static (ctx, _) =>
        {
            // More detailed semantic checks
            // ...
        });
}
```

### Use Value Types as Models

Incremental generators rely on value equality to determine regeneration. Use records or structs:

```csharp
// Good practice - record auto-implements value equality
private record ClassModel(
    string Namespace,
    string Name,
    ImmutableArray<PropertyModel> Properties);

private record PropertyModel(
    string Name,
    string Type);

// Bad practice - class defaults to reference equality
private class ClassModel
{
    public string Namespace { get; set; }
    public string Name { get; set; }
    // Even if values are equal, will be considered different
}
```

### Avoid Using Symbols in Models

`ISymbol` and derived types lack value equality and hold large amounts of memory:

```csharp
// Bad practice
private record Model(INamedTypeSymbol TypeSymbol);

// Good practice
private record Model(
    string Namespace,
    string TypeName,
    ImmutableArray<string> MemberNames);

// Extract needed info from Symbol
private static Model ExtractModel(INamedTypeSymbol symbol)
{
    return new Model(
        Namespace: symbol.ContainingNamespace.ToDisplayString(),
        TypeName: symbol.Name,
        MemberNames: symbol.GetMembers()
            .Select(m => m.Name)
            .ToImmutableArray());
}
```

### Use ForAttributeWithMetadataName

This is the most efficient way to find types with specific attributes:

```csharp
// Best approach
var provider = context.SyntaxProvider.ForAttributeWithMetadataName(
    "MyNamespace.MyAttribute",
    predicate: static (node, _) => node is ClassDeclarationSyntax,
    transform: static (ctx, _) => /* ... */);

// Less efficient
var provider = context.SyntaxProvider.CreateSyntaxProvider(
    predicate: static (node, _) =>
    {
        if (node is not ClassDeclarationSyntax classDecl)
            return false;
        // Need to manually check attribute names
        return classDecl.AttributeLists
            .SelectMany(al => al.Attributes)
            .Any(a => a.Name.ToString() == "MyAttribute");
    },
    transform: /* ... */);
```

### Generate Readable Code

Generated code should be readable for debugging:

```csharp
// Good practice
private static string GenerateCode(string className)
{
    return $$"""
        // <auto-generated/>
        // This code was automatically generated by MyGenerator
        // Generation time: {{DateTime.Now:yyyy-MM-dd HH:mm:ss}}

        #nullable enable

        namespace MyNamespace
        {
            /// <summary>
            /// Extension methods for {{className}}
            /// </summary>
            public static partial class {{className}}Extensions
            {
                // Generated methods
            }
        }
        """;
}
```

### Report Diagnostic Information

Use diagnostics API when encountering errors or needing to inform users:

```csharp
private static readonly DiagnosticDescriptor InvalidUsageWarning = new(
    id: "MYGEN001",
    title: "Invalid usage",
    messageFormat: "Type '{0}' must be a partial class",
    category: "MyGenerator",
    DiagnosticSeverity.Warning,
    isEnabledByDefault: true);

private static void GenerateCode(
    TypeInfo typeInfo,
    SourceProductionContext context)
{
    if (!typeInfo.IsPartial)
    {
        context.ReportDiagnostic(
            Diagnostic.Create(
                InvalidUsageWarning,
                Location.None,  // Or provide actual location
                typeInfo.TypeName));
        return;
    }

    // Continue code generation...
}
```

## Common Pitfalls

### Forgetting to Use Partial Classes

Source Generators can only add code, not modify existing code. Generated code must be merged with user code as the same class:

```csharp
// Wrong - not a partial class
public class Person { }

// Correct - partial class allows generator to add members
public partial class Person { }
```

### Complex Computation in Predicate

Predicate function may be called on every keystroke and must be lightweight:

```csharp
// Bad - predicate does too much work
predicate: static (node, _) =>
{
    if (node is not ClassDeclarationSyntax classDecl)
        return false;

    // These checks should be in transform
    var hasCorrectAttribute = /* complex attribute checking */;
    var implementsInterface = /* check interface implementation */;
    return hasCorrectAttribute && implementsInterface;
}

// Good - predicate does only basic checks
predicate: static (node, _) =>
    node is ClassDeclarationSyntax { AttributeLists.Count: > 0 }
```

### Generating Invalid C# Code

Ensure generated code has correct syntax:

```csharp
// Common mistake
private static string GenerateCode(string typeName)
{
    // If typeName contains special characters, generated code will be invalid
    return $"public class {typeName}Generated {{ }}";
}

// Correct approach
private static string GenerateCode(string typeName)
{
    // Validate identifier validity
    if (!SyntaxFacts.IsValidIdentifier(typeName))
    {
        throw new ArgumentException($"Invalid type name: {typeName}");
    }

    return $"public class {typeName}Generated {{ }}";
}
```

### Circular Dependencies

Generated code cannot depend on code generated by other generators:

```csharp
// Generator A generates
public partial class Foo
{
    public void MethodFromA() { }
}

// Generator B cannot assume MethodFromA exists
// because generator execution order is undefined
```

### Performance Issue: Not Using Cache

Not properly implementing value equality causes unnecessary regeneration:

```csharp
// Problem: Creates new List each time, never equals
transform: static (ctx, _) =>
{
    var list = new List<string>();  // New instance each time
    // ...
    return new Model(list);  // Model never equal
}

// Solution: Use immutable collections
transform: static (ctx, _) =>
{
    var builder = ImmutableArray.CreateBuilder<string>();
    // ...
    return new Model(builder.ToImmutable());
}
```

### Ignoring Cancellation Tokens

Long-running operations should check cancellation tokens:

```csharp
transform: static (ctx, cancellationToken) =>
{
    foreach (var item in largeCollection)
    {
        // Periodically check cancellation token
        cancellationToken.ThrowIfCancellationRequested();

        // Process item
    }

    return result;
}
```

## Performance Considerations

### Compile-Time Performance

Source Generators run at compile time, directly impacting development experience:

| Optimization Strategy | Description |
|---|---|
| **Use Incremental Generators** | Leverage caching to avoid redundant computation |
| **Filter Early** | Filter irrelevant data in early pipeline stages |
| **Avoid Allocations** | Minimize temporary object creation |
| **Use Span** | Use Span in string processing to reduce allocations |
| **Batch Processing** | Leverage Collect() for bulk processing |

### Runtime Performance

Generated code can be more efficient than reflection or dynamic code:

```csharp
// Reflection approach - runtime overhead
public object GetPropertyValue(object obj, string propertyName)
{
    return obj.GetType()
        .GetProperty(propertyName)
        ?.GetValue(obj);
}

// Generated code - zero runtime overhead
public static string GetName(Person person) => person.Name;
```

### Memory Usage Optimization

```csharp
// Bad: Extensive StringBuilder concatenation
var sb = new StringBuilder();
foreach (var item in items)
{
    sb.AppendLine($"public {item.Type} {item.Name} {{ get; set; }}");
}

// Good: Use raw string literals and interpolation
var source = $$"""
    public partial class {{className}}
    {
        {{string.Join("\n        ", items.Select(i =>
            $"public {i.Type} {i.Name} {{ get; set; }}"))}}
    }
    """;
```

### Performance Testing

```csharp
// Test generator performance with BenchmarkDotNet
[MemoryDiagnoser]
public class GeneratorBenchmarks
{
    private Compilation _compilation;

    [GlobalSetup]
    public void Setup()
    {
        // Prepare compilation environment
        _compilation = CreateCompilation(/* test code */);
    }

    [Benchmark]
    public void RunGenerator()
    {
        var generator = new MyGenerator();
        var driver = CSharpGeneratorDriver.Create(generator);
        driver.RunGenerators(_compilation);
    }
}
```

## Real-World Scenarios

### Scenario 1: DTO Mapper

Automatically generate mapping code between objects:

```csharp
// User definition
[MapTo(typeof(PersonDto))]
public partial class Person
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime BirthDate { get; set; }
}

public class PersonDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string BirthDateString { get; set; }
}

// Generated code
public partial class Person
{
    public PersonDto ToPersonDto()
    {
        return new PersonDto
        {
            Id = this.Id,
            Name = this.Name,
            BirthDateString = this.BirthDate.ToString("yyyy-MM-dd")
        };
    }
}
```

### Scenario 2: Dependency Injection Registration

Automatically scan and register services:

```csharp
// Mark interface
[AutoRegister(ServiceLifetime.Scoped)]
public interface IUserService { }

public class UserService : IUserService { }

// Generated extension method
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAutoRegisteredServices(
        this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        // ... other auto-discovered services
        return services;
    }
}
```

### Scenario 3: Validator Generation

Generate validation logic based on attributes:

```csharp
// User code
public partial class CreateUserRequest
{
    [Required]
    [MinLength(2)]
    [MaxLength(50)]
    public string Name { get; set; }

    [Required]
    [EmailAddress]
    public string Email { get; set; }

    [Range(18, 120)]
    public int Age { get; set; }
}

// Generated validation method
public partial class CreateUserRequest : IValidatable
{
    public ValidationResult Validate()
    {
        var errors = new List<ValidationError>();

        if (string.IsNullOrEmpty(Name))
            errors.Add(new("Name", "Name is required"));
        else if (Name.Length < 2)
            errors.Add(new("Name", "Name must be at least 2 characters"));
        else if (Name.Length > 50)
            errors.Add(new("Name", "Name must not exceed 50 characters"));

        // ... other validations

        return new ValidationResult(errors);
    }
}
```

### Scenario 4: API Client Generation

Generate HTTP clients from interface definitions:

```csharp
// User definition
[HttpClient("https://api.example.com")]
public interface IUserApi
{
    [Get("/users/{id}")]
    Task<User> GetUserAsync(int id);

    [Post("/users")]
    Task<User> CreateUserAsync([Body] CreateUserRequest request);

    [Delete("/users/{id}")]
    Task DeleteUserAsync(int id);
}

// Generated implementation
public class UserApiClient : IUserApi
{
    private readonly HttpClient _httpClient;

    public UserApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.example.com");
    }

    public async Task<User> GetUserAsync(int id)
    {
        var response = await _httpClient.GetAsync($"/users/{id}");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<User>();
    }

    // ... other methods
}
```

### Scenario 5: State Machine Generation

Generate type-safe state machines from enums:

```csharp
// User definition
[StateMachine]
public enum OrderState
{
    [InitialState]
    Created,

    [Transition(nameof(Pay), nameof(Paid))]
    [Transition(nameof(Cancel), nameof(Cancelled))]
    Pending,

    [Transition(nameof(Ship), nameof(Shipped))]
    Paid,

    [Transition(nameof(Deliver), nameof(Delivered))]
    Shipped,

    [FinalState]
    Delivered,

    [FinalState]
    Cancelled
}

// Generated state machine class
public partial class OrderStateMachine
{
    public OrderState CurrentState { get; private set; } = OrderState.Created;

    public bool CanPay() => CurrentState == OrderState.Pending;
    public void Pay()
    {
        if (!CanPay())
            throw new InvalidOperationException();
        CurrentState = OrderState.Paid;
    }

    // ... other state transitions
}
```

## Interview Questions

### Basic Questions

**Q1: What are Source Generators and how do they differ from reflection?**

Source Generators are compile-time code generation technology that analyzes source code during compilation and generates new code. Key differences from reflection:

| Feature | Source Generator | Reflection |
|---|---|---|
| Execution Time | Compile time | Runtime |
| Performance Overhead | Zero runtime overhead | Has reflection overhead |
| AOT Compatibility | Fully compatible | May have limitations |
| Type Safety | Compile-time checked | Runtime may fail |
| Debug Experience | Can view generated code | Dynamic code hard to debug |

**Q2: What's the difference between ISourceGenerator and IIncrementalGenerator?**

- `ISourceGenerator`: Traditional interface, completely re-executes on every compilation, poor performance, now deprecated
- `IIncrementalGenerator`: Incremental interface using pipeline model and caching, only regenerates when input changes, excellent performance

**Q3: Explain Roslyn's syntax tree and semantic model**

- **Syntax Tree**: Structured representation of source code containing all syntactic information (including whitespace and comments), immutable
- **Semantic Model**: Provides semantic information about syntax nodes such as type resolution, symbol lookup, type inference

### Advanced Questions

**Q4: Why do incremental generators require models to have value equality?**

Incremental generators compare outputs between runs to decide if regeneration is needed. If models use reference equality (default for classes), even identical data will be treated as different, causing unnecessary regeneration and wasting compilation resources.

**Q5: How to debug Source Generators?**

```csharp
// Method 1: Add Debugger.Launch()
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    #if DEBUG
    if (!Debugger.IsAttached)
    {
        Debugger.Launch();
    }
    #endif
}

// Method 2: Write to log file
File.AppendAllText("generator.log", $"Processing: {typeName}\n");

// Method 3: Use Visual Studio's Syntax Visualizer window
// View -> Other Windows -> Syntax Visualizer
```

**Q6: Can Source Generators modify existing code?**

No. Source Generators can only add new source files, not modify user code. This design decision ensures:
- Predictability: User code won't be unexpectedly modified
- Traceability: Generated code clearly separated from user code
- Safety: Prevents malicious code modification

### Advanced Questions

**Q7: How to handle generic types?**

```csharp
private static string GetFullTypeName(ITypeSymbol type)
{
    if (type is INamedTypeSymbol namedType && namedType.IsGenericType)
    {
        var typeArgs = string.Join(", ",
            namedType.TypeArguments.Select(GetFullTypeName));
        return $"{namedType.Name}<{typeArgs}>";
    }

    return type.ToDisplayString();
}
```

**Q8: How to handle types across assemblies?**

```csharp
// Check if type is from specific assembly
bool IsFromMyLibrary(ITypeSymbol type)
{
    return type.ContainingAssembly?.Name == "MyLibrary";
}

// Use fully qualified names to avoid ambiguity
string fullyQualifiedName = type.ToDisplayString(
    SymbolDisplayFormat.FullyQualifiedFormat);
```

**Q9: What pipeline operations are available in incremental generators?**

```csharp
// Common pipeline operations
provider
    .Where(x => /* filter */)
    .Select((x, ct) => /* transform */)
    .SelectMany((x, ct) => /* flatten */)
    .Collect()                    // Collect into ImmutableArray
    .Combine(otherProvider)       // Combine two providers
    .WithComparer(comparer)       // Custom comparer
    .WithTrackingName("name");    // Add tracking name for debugging
```

## Further Reading

### Official Documentation

- [Roslyn Source Generators Official Docs](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.zh.md)
- [Incremental Generators Documentation](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.md)
- [Incremental Generators Cookbook](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.cookbook.md)
- [Source Generators Cookbook](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)

### Learning Resources

- [RSCG Examples - 251 generator examples](https://github.com/ignatandrei/RSCG_Examples)
- [Roslyn Quoter - Syntax tree visualization tool](https://roslynquoter.azurewebsites.net/)
- [SharpLab - View generated code online](https://sharplab.io/)

### Excellent Open Source Generators

| Project | Purpose |
|---|---|
| [System.Text.Json](https://github.com/dotnet/runtime) | JSON serialization |
| [AutoMapper](https://github.com/AutoMapper/AutoMapper) | Object mapping |
| [Refit](https://github.com/reactiveui/refit) | REST client |
| [StronglyTypedId](https://github.com/andrewlock/StronglyTypedId) | Strongly-typed IDs |
| [Mapperly](https://github.com/riok/mapperly) | High-performance mapper |
| [Meziantou.Polyfill](https://github.com/meziantou/Meziantou.Polyfill) | API Polyfill |

### Tools and Debugging

- Visual Studio Syntax Visualizer: View -> Other Windows -> Syntax Visualizer
- Roslyn SDK: Provides syntax tree visualization and debugging tools
- Source Generator Playground: Test generators online

---

Source Generators are essential tools in modern C# development, shifting metaprogramming capabilities from runtime to compile time and providing zero-overhead code generation. Mastering this technology enables you to build more efficient, type-safe applications while reducing boilerplate code. As the .NET platform continues investing in AOT compilation, Source Generators will become increasingly important.
