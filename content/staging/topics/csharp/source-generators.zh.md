---
title: C# Source Generators 源代码生成器
description: 深入理解 C# Source Generators 的工作原理、ISourceGenerator 与 IIncrementalGenerator 的区别、语法分析、语义模型，以及如何构建高性能的增量源代码生成器
track: csharp
section: types-linq
difficulty: advanced
tags:
  - C#
  - Source Generators
  - Roslyn
  - 代码生成
  - 编译器扩展
status: imported
origin: old/src/content/docs/csharp/source-generators.zh.md
divergence: 0.23
issues:
  - missing-subcategory-en
  - order-mismatch
  - category-casing
legacy:
  category: CSharp
  subcategory: 高级特性
  order: 35
  lastUpdated: 2026-01-07
---

Source Generators（源代码生成器）是 C# 9.0/.NET 5 引入的一项革命性特性，它允许开发者在编译时检查用户代码并生成新的 C# 源文件。这项技术基于 Roslyn 编译器平台，为元编程、代码自动化和性能优化开辟了全新的可能性。

## 概念解释

### 什么是 Source Generators？

Source Generators 是一种编译时代码生成技术，它作为编译管道的一部分运行，可以：

1. **读取编译中的所有源代码**：访问语法树和语义模型
2. **生成新的源代码文件**：这些文件会被添加到编译中
3. **不能修改现有代码**：只能添加新代码，保证了可预测性

```
┌─────────────────────────────────────────────────────────────┐
│                      编译管道                                │
├─────────────────────────────────────────────────────────────┤
│  源代码 (.cs) ─→ 语法分析 ─→ 语义分析 ─→ Source Generator   │
│                                              │               │
│                                              ↓               │
│                                         生成的代码           │
│                                              │               │
│                                              ↓               │
│                              合并编译 ─→ 最终程序集 (.dll)   │
└─────────────────────────────────────────────────────────────┘
```

### 与其他代码生成方式的对比

| 方式 | 运行时机 | 优点 | 缺点 |
|------|----------|------|------|
| **T4 模板** | 设计时 | 灵活、可视化 | 需要手动触发，不参与编译 |
| **反射 + Emit** | 运行时 | 动态性强 | 性能开销、AOT 不友好 |
| **Expression Trees** | 运行时 | 类型安全 | 复杂度高、调试困难 |
| **Source Generators** | 编译时 | 零运行时开销、IDE 支持 | 只能添加代码、调试较复杂 |

### 历史演进

- **.NET 5 (2020)**：引入 `ISourceGenerator` 接口
- **.NET 6 (2021)**：引入 `IIncrementalGenerator` 增量生成器
- **.NET 9+ (2024)**：`ISourceGenerator` 被标记为过时，推荐使用增量生成器

> **重要提示**：从 Roslyn 4.10.0/.NET 9 开始，`ISourceGenerator` 已被废弃。新项目应该始终使用 `IIncrementalGenerator`。

## 核心原理

### 编译器集成架构

Source Generators 深度集成在 Roslyn 编译器中，作为编译管道的一个阶段执行：

```
┌────────────────────────────────────────────────────────────────┐
│                     Roslyn 编译管道                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. 词法分析 (Lexer)                                           │
│     ├─ 将源代码转换为 Token 流                                  │
│     └─ 输出: SyntaxToken                                       │
│                                                                │
│  2. 语法分析 (Parser)                                          │
│     ├─ 构建语法树 (Syntax Tree)                                │
│     └─ 输出: SyntaxNode, SyntaxTree                            │
│                                                                │
│  3. 语义分析 (Semantic Analysis)                               │
│     ├─ 符号解析、类型检查                                       │
│     └─ 输出: Compilation, SemanticModel, ISymbol               │
│                                                                │
│  4. Source Generator 执行  ← 在此阶段介入                       │
│     ├─ 读取语法树和语义模型                                     │
│     ├─ 生成新的源代码                                          │
│     └─ 新代码加入编译                                          │
│                                                                │
│  5. IL 代码生成                                                │
│     └─ 输出: 程序集 (.dll/.exe)                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 语法树 (Syntax Tree)

语法树是源代码的结构化表示，每个节点都是 `SyntaxNode` 的派生类：

```csharp
// 示例代码
public class Person
{
    public string Name { get; set; }
}

// 对应的语法树结构 (简化)
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

**关键特性**：
- **不可变性**：语法树是不可变的，任何修改都会创建新的树
- **完整性**：保留所有语法细节，包括空白和注释
- **红绿树**：Roslyn 使用红绿树优化内存使用

### 语义模型 (Semantic Model)

语义模型提供了语法节点的语义信息，包括类型解析、符号查找等：

```csharp
// 语法层面：只知道 "string" 是一个标识符
// 语义层面：知道 string 是 System.String 类型

// 获取语义信息
SemanticModel semanticModel = compilation.GetSemanticModel(syntaxTree);
ITypeSymbol typeSymbol = semanticModel.GetTypeInfo(typeSyntax).Type;

// typeSymbol 包含完整的类型信息：
// - 命名空间: System
// - 名称: String
// - 成员: Length, Substring, ...
// - 基类: Object
// - 接口: IEnumerable<char>, IComparable<string>, ...
```

### 符号系统 (Symbol System)

符号代表代码中的各种声明实体：

```csharp
// 符号层次结构
ISymbol                          // 基接口
├── INamespaceSymbol             // 命名空间
├── ITypeSymbol                  // 类型
│   ├── INamedTypeSymbol         // 命名类型 (class, struct, interface, enum)
│   ├── IArrayTypeSymbol         // 数组类型
│   ├── IPointerTypeSymbol       // 指针类型
│   └── ITypeParameterSymbol     // 泛型类型参数
├── IMemberSymbol                // 成员
│   ├── IFieldSymbol             // 字段
│   ├── IPropertySymbol          // 属性
│   ├── IMethodSymbol            // 方法
│   └── IEventSymbol             // 事件
├── IParameterSymbol             // 参数
└── ILocalSymbol                 // 局部变量
```

### 增量生成器管道

增量生成器 (`IIncrementalGenerator`) 使用数据流管道模型，核心思想是**缓存和增量更新**：

```
┌─────────────────────────────────────────────────────────────────┐
│                    增量生成器管道                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Provider (数据源)                                              │
│      │                                                          │
│      ↓                                                          │
│  Where (过滤) ─→ 移除不相关的节点                                │
│      │                                                          │
│      ↓                                                          │
│  Select (转换) ─→ 提取需要的数据到简单模型                       │
│      │                                                          │
│      ↓                                                          │
│  Collect (收集) ─→ 聚合多个值                                    │
│      │                                                          │
│      ↓                                                          │
│  Combine (组合) ─→ 与其他数据源组合                              │
│      │                                                          │
│      ↓                                                          │
│  RegisterSourceOutput ─→ 生成最终代码                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

关键优化：
- 每个步骤的输出都被缓存
- 只有当输入变化时才重新计算
- 使用值相等性判断是否需要重新生成
```

## 核心要点

### ISourceGenerator vs IIncrementalGenerator

#### 传统生成器 (已废弃)

```csharp
// 传统的 ISourceGenerator - 已废弃，不推荐使用
[Generator]
public class LegacyGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context)
    {
        // 注册语法接收器
        context.RegisterForSyntaxNotifications(() => new SyntaxReceiver());
    }

    public void Execute(GeneratorExecutionContext context)
    {
        // 每次编译都会完整执行
        // 性能问题：即使代码没变化也会重新运行
    }
}
```

#### 增量生成器 (推荐)

```csharp
// 现代的 IIncrementalGenerator - 推荐使用
[Generator]
public class ModernGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 构建数据流管道
        // 只有当相关代码变化时才会重新生成
    }
}
```

**性能对比**：

| 特性 | ISourceGenerator | IIncrementalGenerator |
|------|------------------|----------------------|
| 执行频率 | 每次编译都完整执行 | 仅当输入变化时执行 |
| IDE 响应 | 可能造成卡顿 | 流畅的编辑体验 |
| 内存使用 | 可能持有大量对象 | 及时释放不需要的对象 |
| 状态管理 | 无状态，每次重新计算 | 缓存中间结果 |

### 数据提供者 (Providers)

增量生成器通过各种 Provider 获取数据：

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // 1. SyntaxProvider - 获取语法节点
    var syntaxProvider = context.SyntaxProvider
        .CreateSyntaxProvider(
            predicate: (node, _) => node is ClassDeclarationSyntax,
            transform: (ctx, _) => (ClassDeclarationSyntax)ctx.Node
        );

    // 2. CompilationProvider - 获取编译信息
    var compilationProvider = context.CompilationProvider;

    // 3. AdditionalTextsProvider - 获取附加文件
    var additionalTexts = context.AdditionalTextsProvider;

    // 4. AnalyzerConfigOptionsProvider - 获取配置选项
    var configOptions = context.AnalyzerConfigOptionsProvider;

    // 5. MetadataReferencesProvider - 获取元数据引用
    var metadataRefs = context.MetadataReferencesProvider;
}
```

### 管道操作

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // Where - 过滤
    var filtered = provider.Where(x => x.Identifier.Text.StartsWith("I"));

    // Select - 转换
    var transformed = provider.Select((syntax, ct) => ExtractModel(syntax));

    // SelectMany - 展平
    var flattened = provider.SelectMany((items, ct) => items);

    // Collect - 收集为不可变数组
    var collected = provider.Collect();

    // Combine - 组合两个提供者
    var combined = provider1.Combine(provider2);

    // WithComparer - 自定义比较器
    var withComparer = provider.WithComparer(new CustomComparer());
}
```

### 特性驱动的生成器模式

最佳实践是使用特性 (Attribute) 来标记需要生成代码的目标：

```csharp
// 1. 定义标记特性
[AttributeUsage(AttributeTargets.Class)]
public class AutoNotifyAttribute : Attribute { }

// 2. 用户使用特性标记类
[AutoNotify]
public partial class Person
{
    private string _name;
    private int _age;
}

// 3. 生成器检测特性并生成代码
// 生成的代码实现 INotifyPropertyChanged
```

## 代码示例

### 项目结构

```
Solution/
├── MyGenerator/                    # 生成器项目
│   ├── MyGenerator.csproj
│   └── HelloWorldGenerator.cs
└── MyApplication/                  # 使用生成器的项目
    ├── MyApplication.csproj
    └── Program.cs
```

### 生成器项目配置

```xml
<!-- MyGenerator.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <LangVersion>latest</LangVersion>

    <!-- 关键配置 -->
    <EnforceExtendedAnalyzerRules>true</EnforceExtendedAnalyzerRules>
    <IsRoslynComponent>true</IsRoslynComponent>
  </PropertyGroup>

  <ItemGroup>
    <!-- Roslyn 分析器/生成器 API -->
    <PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.3.4">
      <PrivateAssets>all</PrivateAssets>
      <IncludeAssets>runtime; build; native; contentfiles; analyzers</IncludeAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp" Version="4.8.0" />
  </ItemGroup>
</Project>
```

### 使用生成器的项目配置

```xml
<!-- MyApplication.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <!-- 引用生成器项目 -->
    <ProjectReference Include="..\MyGenerator\MyGenerator.csproj"
                      OutputItemType="Analyzer"
                      ReferenceOutputAssembly="false" />
  </ItemGroup>
</Project>
```

### 基础增量生成器示例

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// 一个简单的 Hello World 增量生成器
/// 为每个 partial class 生成一个 SayHello 方法
/// </summary>
[Generator]
public class HelloWorldGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        // 步骤 1: 创建语法提供者，筛选 partial class
        IncrementalValuesProvider<ClassDeclarationSyntax> classDeclarations =
            context.SyntaxProvider
                .CreateSyntaxProvider(
                    predicate: static (node, _) => IsCandidateClass(node),
                    transform: static (ctx, _) => GetClassDeclaration(ctx))
                .Where(static c => c is not null)!;

        // 步骤 2: 组合编译信息
        IncrementalValueProvider<(Compilation, ImmutableArray<ClassDeclarationSyntax>)>
            compilationAndClasses = context.CompilationProvider
                .Combine(classDeclarations.Collect());

        // 步骤 3: 注册输出
        context.RegisterSourceOutput(
            compilationAndClasses,
            static (spc, source) => Execute(source.Item1, source.Item2, spc));
    }

    /// <summary>
    /// 快速语法过滤 - 应该尽可能简单和快速
    /// </summary>
    private static bool IsCandidateClass(SyntaxNode node)
    {
        return node is ClassDeclarationSyntax classDecl &&
               classDecl.Modifiers.Any(m => m.ValueText == "partial");
    }

    /// <summary>
    /// 获取类声明（可以在这里做更详细的检查）
    /// </summary>
    private static ClassDeclarationSyntax? GetClassDeclaration(
        GeneratorSyntaxContext context)
    {
        var classDecl = (ClassDeclarationSyntax)context.Node;

        // 可以在这里使用语义模型进行更精确的过滤
        // var symbol = context.SemanticModel.GetDeclaredSymbol(classDecl);

        return classDecl;
    }

    /// <summary>
    /// 执行代码生成
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
            // 获取语义模型
            var semanticModel = compilation.GetSemanticModel(classDecl.SyntaxTree);
            var classSymbol = semanticModel.GetDeclaredSymbol(classDecl);

            if (classSymbol is null)
                continue;

            // 生成代码
            string namespaceName = classSymbol.ContainingNamespace.ToDisplayString();
            string className = classSymbol.Name;

            string source = GenerateSource(namespaceName, className);

            // 添加到编译
            context.AddSource(
                $"{className}.g.cs",
                SourceText.From(source, Encoding.UTF8));
        }
    }

    /// <summary>
    /// 生成源代码字符串
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
                    /// 由 Source Generator 自动生成的方法
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

### 基于特性的生成器

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// 自动实现 INotifyPropertyChanged 的生成器
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
        // 注入标记特性
        context.RegisterPostInitializationOutput(ctx =>
        {
            ctx.AddSource("AutoNotifyAttribute.g.cs",
                SourceText.From(AttributeSource, Encoding.UTF8));
        });

        // 查找带有 [AutoNotify] 特性的字段
        var fieldDeclarations = context.SyntaxProvider
            .ForAttributeWithMetadataName(
                "AutoNotify.AutoNotifyAttribute",
                predicate: static (node, _) => node is VariableDeclaratorSyntax,
                transform: static (ctx, _) => GetFieldInfo(ctx))
            .Where(static f => f is not null)
            .Collect();

        // 按类分组并生成代码
        context.RegisterSourceOutput(fieldDeclarations,
            static (spc, fields) => GenerateCode(fields!, spc));
    }

    /// <summary>
    /// 字段信息模型 - 使用 record 确保值相等性
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

        // 获取字段声明
        if (variableDeclarator.Parent?.Parent is not FieldDeclarationSyntax fieldDecl)
            return null;

        // 获取包含类
        if (fieldDecl.Parent is not ClassDeclarationSyntax classDecl)
            return null;

        var semanticModel = context.SemanticModel;
        var fieldSymbol = semanticModel.GetDeclaredSymbol(variableDeclarator) as IFieldSymbol;

        if (fieldSymbol is null)
            return null;

        var classSymbol = fieldSymbol.ContainingType;
        string fieldName = fieldSymbol.Name;

        // 将 _fieldName 转换为 FieldName
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

        // 按类分组
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

### 使用示例

```csharp
// 用户代码
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

// 使用生成的代码
var person = new Person();
person.PropertyChanged += (sender, e) =>
{
    Console.WriteLine($"属性 {e.PropertyName} 已更改");
};

person.Name = "张三";  // 输出: 属性 Name 已更改
person.Age = 25;       // 输出: 属性 Age 已更改
```

### 高级示例：JSON 序列化生成器

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Collections.Immutable;
using System.Text;

namespace MyGenerator;

/// <summary>
/// 生成高性能的 JSON 序列化代码
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
        // 注入特性
        context.RegisterPostInitializationOutput(ctx =>
        {
            ctx.AddSource("JsonAttributes.g.cs",
                SourceText.From(AttributeSource, Encoding.UTF8));
        });

        // 查找带有 [JsonSerializable] 的类型
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

            // 检查是否有 JsonIgnore 特性
            if (HasAttribute(property, "JsonGen.JsonIgnoreAttribute"))
                continue;

            // 获取 JSON 属性名
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

        // 默认使用 camelCase
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

## 最佳实践

### 使用增量生成器

始终使用 `IIncrementalGenerator` 而不是 `ISourceGenerator`：

```csharp
// 正确 ✓
[Generator]
public class MyGenerator : IIncrementalGenerator { }

// 已废弃 ✗
[Generator]
public class MyGenerator : ISourceGenerator { }
```

### 尽早过滤无关数据

在管道的早期阶段过滤掉不需要的数据，减少后续处理的负担：

```csharp
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // 好的做法：在 predicate 中快速过滤
    var provider = context.SyntaxProvider.CreateSyntaxProvider(
        predicate: static (node, _) =>
        {
            // 快速的语法检查
            if (node is not ClassDeclarationSyntax classDecl)
                return false;

            // 检查是否有任何特性
            return classDecl.AttributeLists.Count > 0;
        },
        transform: static (ctx, _) =>
        {
            // 更详细的语义检查
            // ...
        });
}
```

### 使用值类型作为模型

增量生成器依赖值相等性来判断是否需要重新生成。使用 record 或 struct：

```csharp
// 好的做法 ✓ - record 自动实现值相等性
private record ClassModel(
    string Namespace,
    string Name,
    ImmutableArray<PropertyModel> Properties);

private record PropertyModel(
    string Name,
    string Type);

// 不好的做法 ✗ - class 默认是引用相等
private class ClassModel
{
    public string Namespace { get; set; }
    public string Name { get; set; }
    // 即使值相同，也会被认为是不同的
}
```

### 避免在模型中使用 Symbol

`ISymbol` 及其派生类型不具有值相等性，且会持有大量内存：

```csharp
// 不好的做法 ✗
private record Model(INamedTypeSymbol TypeSymbol);

// 好的做法 ✓
private record Model(
    string Namespace,
    string TypeName,
    ImmutableArray<string> MemberNames);

// 从 Symbol 提取需要的信息
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

### 使用 ForAttributeWithMetadataName

这是查找带有特定特性的类型的最高效方式：

```csharp
// 最佳方式 ✓
var provider = context.SyntaxProvider.ForAttributeWithMetadataName(
    "MyNamespace.MyAttribute",
    predicate: static (node, _) => node is ClassDeclarationSyntax,
    transform: static (ctx, _) => /* ... */);

// 效率较低 ✗
var provider = context.SyntaxProvider.CreateSyntaxProvider(
    predicate: static (node, _) =>
    {
        if (node is not ClassDeclarationSyntax classDecl)
            return false;
        // 需要手动检查特性名称
        return classDecl.AttributeLists
            .SelectMany(al => al.Attributes)
            .Any(a => a.Name.ToString() == "MyAttribute");
    },
    transform: /* ... */);
```

### 生成可读的代码

生成的代码应该是可读的，便于调试：

```csharp
// 好的做法 ✓
private static string GenerateCode(string className)
{
    return $$"""
        // <auto-generated/>
        // 此代码由 MyGenerator 自动生成
        // 生成时间: {{DateTime.Now:yyyy-MM-dd HH:mm:ss}}

        #nullable enable

        namespace MyNamespace
        {
            /// <summary>
            /// {{className}} 的扩展方法
            /// </summary>
            public static partial class {{className}}Extensions
            {
                // 生成的方法
            }
        }
        """;
}
```

### 报告诊断信息

当遇到错误或需要提示用户时，使用诊断 API：

```csharp
private static readonly DiagnosticDescriptor InvalidUsageWarning = new(
    id: "MYGEN001",
    title: "无效的使用方式",
    messageFormat: "类型 '{0}' 必须是 partial 类",
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
                Location.None,  // 或者提供实际位置
                typeInfo.TypeName));
        return;
    }

    // 继续生成代码...
}
```

## 常见陷阱

### 忘记使用 partial 类

Source Generator 只能添加代码，不能修改现有代码。生成的代码必须与用户代码合并为同一个类：

```csharp
// 错误 ✗ - 不是 partial 类
public class Person { }

// 正确 ✓ - partial 类允许生成器添加成员
public partial class Person { }
```

### 在 predicate 中进行复杂计算

predicate 函数在每次按键时都可能被调用，必须保持轻量：

```csharp
// 不好 ✗ - predicate 中做了太多工作
predicate: static (node, _) =>
{
    if (node is not ClassDeclarationSyntax classDecl)
        return false;

    // 这些检查应该在 transform 中进行
    var hasCorrectAttribute = /* 复杂的特性检查 */;
    var implementsInterface = /* 检查接口实现 */;
    return hasCorrectAttribute && implementsInterface;
}

// 好 ✓ - predicate 只做最基本的检查
predicate: static (node, _) =>
    node is ClassDeclarationSyntax { AttributeLists.Count: > 0 }
```

### 生成无效的 C# 代码

确保生成的代码语法正确：

```csharp
// 常见错误
private static string GenerateCode(string typeName)
{
    // 如果 typeName 包含特殊字符，生成的代码将无效
    return $"public class {typeName}Generated {{ }}";
}

// 正确做法
private static string GenerateCode(string typeName)
{
    // 验证标识符有效性
    if (!SyntaxFacts.IsValidIdentifier(typeName))
    {
        throw new ArgumentException($"Invalid type name: {typeName}");
    }

    return $"public class {typeName}Generated {{ }}";
}
```

### 循环依赖

生成的代码不能依赖于其他生成器生成的代码：

```csharp
// 生成器 A 生成的代码
public partial class Foo
{
    public void MethodFromA() { }
}

// 生成器 B 不能假设 MethodFromA 存在
// 因为生成器的执行顺序不确定
```

### 性能问题：不使用缓存

没有正确实现值相等性会导致不必要的重新生成：

```csharp
// 问题：每次都创建新的 List，导致永远不相等
transform: static (ctx, _) =>
{
    var list = new List<string>();  // 每次都是新实例
    // ...
    return new Model(list);  // Model 永远不相等
}

// 解决：使用不可变集合
transform: static (ctx, _) =>
{
    var builder = ImmutableArray.CreateBuilder<string>();
    // ...
    return new Model(builder.ToImmutable());
}
```

### 忽略取消令牌

长时间运行的操作应该检查取消令牌：

```csharp
transform: static (ctx, cancellationToken) =>
{
    foreach (var item in largeCollection)
    {
        // 定期检查取消令牌
        cancellationToken.ThrowIfCancellationRequested();

        // 处理 item
    }

    return result;
}
```

## 性能考量

### 编译时性能

Source Generator 在编译时运行，其性能直接影响开发体验：

| 优化策略 | 说明 |
|---------|------|
| **使用增量生成器** | 利用缓存避免重复计算 |
| **尽早过滤** | 在管道早期阶段过滤不相关的数据 |
| **避免分配** | 减少临时对象的创建 |
| **使用 Span** | 在字符串处理中使用 Span 减少分配 |
| **并行处理** | 利用 Collect() 后的批量处理 |

### 运行时性能

生成的代码可以比反射或动态代码更高效：

```csharp
// 反射方式 - 运行时开销
public object GetPropertyValue(object obj, string propertyName)
{
    return obj.GetType()
        .GetProperty(propertyName)
        ?.GetValue(obj);
}

// 生成的代码 - 零运行时开销
public static string GetName(Person person) => person.Name;
```

### 内存使用优化

```csharp
// 不好：使用 StringBuilder 进行大量拼接
var sb = new StringBuilder();
foreach (var item in items)
{
    sb.AppendLine($"public {item.Type} {item.Name} {{ get; set; }}");
}

// 好：使用原始字符串字面量和插值
var source = $$"""
    public partial class {{className}}
    {
        {{string.Join("\n        ", items.Select(i =>
            $"public {i.Type} {i.Name} {{ get; set; }}"))}}
    }
    """;
```

### 性能测试

```csharp
// 使用 BenchmarkDotNet 测试生成器性能
[MemoryDiagnoser]
public class GeneratorBenchmarks
{
    private Compilation _compilation;

    [GlobalSetup]
    public void Setup()
    {
        // 准备编译环境
        _compilation = CreateCompilation(/* 测试代码 */);
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

## 实战场景

### 场景 1：DTO 映射器

自动生成对象之间的映射代码：

```csharp
// 用户定义
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

// 生成的代码
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

### 场景 2：依赖注入注册

自动扫描并注册服务：

```csharp
// 标记接口
[AutoRegister(ServiceLifetime.Scoped)]
public interface IUserService { }

public class UserService : IUserService { }

// 生成的扩展方法
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAutoRegisteredServices(
        this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        // ... 其他自动发现的服务
        return services;
    }
}
```

### 场景 3：验证器生成

基于特性生成验证逻辑：

```csharp
// 用户代码
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

// 生成的验证方法
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

        // ... 其他验证

        return new ValidationResult(errors);
    }
}
```

### 场景 4：API 客户端生成

从接口定义生成 HTTP 客户端：

```csharp
// 用户定义
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

// 生成的实现
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

    // ... 其他方法
}
```

### 场景 5：状态机生成

从枚举生成类型安全的状态机：

```csharp
// 用户定义
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

// 生成的状态机类
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

    // ... 其他状态转换
}
```

## 面试要点

### 基础问题

**Q1: 什么是 Source Generator？它与反射有什么区别？**

Source Generator 是编译时代码生成技术，在编译阶段分析源代码并生成新代码。与反射的区别：

| 特性 | Source Generator | 反射 |
|------|-----------------|------|
| 执行时机 | 编译时 | 运行时 |
| 性能开销 | 零运行时开销 | 有反射开销 |
| AOT 兼容 | 完全兼容 | 可能有限制 |
| 类型安全 | 编译时检查 | 运行时可能失败 |
| 调试体验 | 可以查看生成的代码 | 动态代码难以调试 |

**Q2: ISourceGenerator 和 IIncrementalGenerator 有什么区别？**

- `ISourceGenerator`：传统接口，每次编译都完整执行，性能较差，已被废弃
- `IIncrementalGenerator`：增量接口，使用管道模型和缓存，只在输入变化时重新生成，性能优秀

**Q3: 解释 Roslyn 的语法树和语义模型**

- **语法树 (Syntax Tree)**：源代码的结构化表示，包含所有语法信息（包括空白和注释），是不可变的
- **语义模型 (Semantic Model)**：提供语法节点的语义信息，如类型解析、符号查找、类型推断等

### 进阶问题

**Q4: 为什么增量生成器要求模型具有值相等性？**

增量生成器通过比较前后两次运行的输出来决定是否需要重新生成。如果模型使用引用相等（默认的 class 行为），即使数据相同也会被认为是不同的，导致不必要的重新生成，浪费编译资源。

**Q5: 如何调试 Source Generator？**

```csharp
// 方法 1：添加 Debugger.Launch()
public void Initialize(IncrementalGeneratorInitializationContext context)
{
    #if DEBUG
    if (!Debugger.IsAttached)
    {
        Debugger.Launch();
    }
    #endif
}

// 方法 2：写入日志文件
File.AppendAllText("generator.log", $"Processing: {typeName}\n");

// 方法 3：使用 Visual Studio 的 Syntax Visualizer 窗口
// View -> Other Windows -> Syntax Visualizer
```

**Q6: Source Generator 可以修改现有代码吗？**

不能。Source Generator 只能添加新的源文件，不能修改用户编写的代码。这是设计决策，确保了：
- 可预测性：用户代码不会被意外修改
- 可追溯性：生成的代码与用户代码清晰分离
- 安全性：防止恶意代码修改

### 高级问题

**Q7: 如何处理泛型类型？**

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

**Q8: 如何在生成器中处理跨程序集的类型？**

```csharp
// 检查类型是否来自特定程序集
bool IsFromMyLibrary(ITypeSymbol type)
{
    return type.ContainingAssembly?.Name == "MyLibrary";
}

// 使用完全限定名避免歧义
string fullyQualifiedName = type.ToDisplayString(
    SymbolDisplayFormat.FullyQualifiedFormat);
```

**Q9: 增量生成器的管道操作有哪些？**

```csharp
// 常用管道操作
provider
    .Where(x => /* 过滤 */)
    .Select((x, ct) => /* 转换 */)
    .SelectMany((x, ct) => /* 展平 */)
    .Collect()                    // 收集为 ImmutableArray
    .Combine(otherProvider)       // 组合两个提供者
    .WithComparer(comparer)       // 自定义比较器
    .WithTrackingName("name");    // 添加跟踪名称用于调试
```

## 延伸阅读

### 官方文档

- [Roslyn Source Generators 官方文档](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.zh.md)
- [增量生成器文档](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.md)
- [增量生成器 Cookbook](https://github.com/dotnet/roslyn/blob/main/docs/features/incremental-generators.cookbook.md)
- [Source Generators Cookbook](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)

### 学习资源

- [RSCG Examples - 251个生成器示例](https://github.com/ignatandrei/RSCG_Examples)
- [Roslyn Quoter - 语法树可视化工具](https://roslynquoter.azurewebsites.net/)
- [SharpLab - 在线查看生成的代码](https://sharplab.io/)

### 优秀的开源生成器

| 项目 | 用途 |
|------|------|
| [System.Text.Json](https://github.com/dotnet/runtime) | JSON 序列化 |
| [AutoMapper](https://github.com/AutoMapper/AutoMapper) | 对象映射 |
| [Refit](https://github.com/reactiveui/refit) | REST 客户端 |
| [StronglyTypedId](https://github.com/andrewlock/StronglyTypedId) | 强类型 ID |
| [Mapperly](https://github.com/riok/mapperly) | 高性能映射器 |
| [Meziantou.Polyfill](https://github.com/meziantou/Meziantou.Polyfill) | API Polyfill |

### 工具和调试

- Visual Studio Syntax Visualizer：View -> Other Windows -> Syntax Visualizer
- Roslyn SDK：提供语法树可视化和调试工具
- Source Generator Playground：在线测试生成器

---

Source Generator 是现代 C# 开发中的重要工具，它将元编程的能力从运行时转移到编译时，提供了零开销的代码生成能力。掌握这项技术可以帮助你构建更高效、更类型安全的应用程序，同时减少样板代码的编写。随着 .NET 平台对 AOT 编译的持续投入，Source Generator 的重要性将会越来越高。
