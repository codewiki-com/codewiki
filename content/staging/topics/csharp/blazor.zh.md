---
title: Blazor
description: Blazor完全指南，C#构建Web应用、组件与状态管理
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - Blazor
  - WebAssembly
  - Web
status: imported
origin: old/src/content/docs/csharp/blazor.zh.md
divergence: 0.224
issues:
  - title-lang-zh
  - title-language
legacy:
  category: CSharp
  subcategory: Web开发
  order: 8
  lastUpdated: 2026-01-07
---

Blazor 是微软推出的一个革命性 Web 框架，允许开发者使用 C# 和 .NET 构建交互式 Web 应用程序，而无需依赖 JavaScript。本文将全面介绍 Blazor 的核心概念、托管模式、组件开发以及实际应用。

## Blazor 简介

### 什么是 Blazor？

Blazor 是一个用于构建交互式客户端 Web UI 的框架，它是 ASP.NET Core 的一部分。Blazor 的名称来源于 "Browser" 和 "Razor" 的组合，表明它在浏览器中运行 Razor 组件。

Blazor 的核心优势：

- **统一的技术栈**：前后端都使用 C# 和 .NET
- **代码复用**：在客户端和服务器端共享业务逻辑
- **丰富的生态系统**：利用现有的 .NET 库和工具
- **类型安全**：编译时检查，减少运行时错误
- **高性能**：特别是 WebAssembly 模式下接近原生性能

## Blazor Server vs Blazor WebAssembly

Blazor 提供两种主要的托管模式，各有其适用场景。

### Blazor Server

Blazor Server 在服务器端执行组件逻辑，通过 SignalR 实时连接与浏览器通信。

```
┌─────────────────┐         SignalR          ┌─────────────────┐
│                 │ ◄─────────────────────► │                 │
│    浏览器        │      实时双向通信         │    服务器        │
│   (DOM 更新)     │                          │  (组件逻辑执行)   │
│                 │                          │                 │
└─────────────────┘                          └─────────────────┘
```

**Blazor Server 特点：**

```csharp
// Program.cs - Blazor Server 配置
var builder = WebApplication.CreateBuilder(args);

// 添加 Blazor Server 服务
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
```

**优点：**
- 快速首次加载（下载量小）
- 可以访问服务器资源（数据库、文件系统等）
- 支持较老的浏览器
- 应用代码保留在服务器端

**缺点：**
- 需要持续的网络连接
- 每个用户消耗服务器资源
- 网络延迟影响用户体验
- 扩展性受限于服务器资源

### Blazor WebAssembly

Blazor WebAssembly 将 .NET 运行时和应用程序下载到浏览器中执行。

```
┌─────────────────────────────────────┐
│            浏览器                    │
│  ┌─────────────────────────────┐   │
│  │     WebAssembly 运行时       │   │
│  │  ┌───────────────────────┐  │   │
│  │  │    .NET 运行时         │  │   │
│  │  │  ┌─────────────────┐  │  │   │
│  │  │  │   Blazor 应用    │  │  │   │
│  │  │  └─────────────────┘  │  │   │
│  │  └───────────────────────┘  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Blazor WebAssembly 配置：**

```csharp
// Program.cs - Blazor WebAssembly 配置
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// 配置 HttpClient
builder.Services.AddScoped(sp =>
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

await builder.Build().RunAsync();
```

**优点：**
- 离线工作支持
- 无服务器资源消耗
- 可作为静态文件部署
- 真正的客户端执行

**缺点：**
- 首次加载较大
- 浏览器必须支持 WebAssembly
- 受浏览器沙箱限制

### 托管模型对比表

| 特性 | Blazor Server | Blazor WebAssembly |
|------|---------------|-------------------|
| 执行位置 | 服务器 | 客户端浏览器 |
| 初始加载 | 快 | 较慢 |
| 应用体积 | 小 | 较大（~2-3 MB） |
| 运行时性能 | 网络延迟 | 接近原生 |
| 离线支持 | 否 | 是（PWA） |
| SEO 友好 | 是 | 需要预渲染 |
| 服务器需求 | .NET 服务器 | 静态文件服务器 |
| 可扩展性 | 受限 | 极好 |

### .NET 8+ 统一托管模式

从 .NET 8 开始，Blazor 引入了统一的托管模式，可以在同一应用中混合使用 Server 和 WebAssembly：

```csharp
// Program.cs - .NET 8+ 统一模式
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents()
    .AddInteractiveWebAssemblyComponents();

var app = builder.Build();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode()
    .AddInteractiveWebAssemblyRenderMode();

app.Run();
```

## Blazor 组件基础

### 组件结构

Blazor 组件是 UI 的基本构建块，使用 `.razor` 文件扩展名：

```razor
@* Counter.razor *@
@page "/counter"

<PageTitle>计数器</PageTitle>

<h1>计数器</h1>

<p role="status">当前计数: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">
    点击增加
</button>

@code {
    private int currentCount = 0;

    private void IncrementCount()
    {
        currentCount++;
    }
}
```

### 组件参数

组件可以通过参数接收数据：

```razor
@* Alert.razor *@
<div class="alert alert-@Type" role="alert">
    <strong>@Title</strong>
    @ChildContent
</div>

@code {
    [Parameter]
    public string Type { get; set; } = "info";

    [Parameter]
    public string Title { get; set; } = "提示";

    [Parameter]
    public RenderFragment? ChildContent { get; set; }

    // .NET 10+ 支持必需参数
    [Parameter, EditorRequired]
    public string Message { get; set; } = default!;
}
```

使用组件：

```razor
<Alert Type="warning" Title="警告!" Message="这是必需的消息">
    <p>这是警告内容，请注意！</p>
</Alert>
```

### 级联参数

级联参数允许祖先组件向所有后代组件提供数据：

```razor
@* ThemeProvider.razor *@
<CascadingValue Value="@theme" Name="AppTheme">
    @ChildContent
</CascadingValue>

@code {
    private Theme theme = new Theme { PrimaryColor = "#007bff", IsDarkMode = false };

    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}

@* 后代组件使用级联参数 *@
@code {
    [CascadingParameter(Name = "AppTheme")]
    public Theme? CurrentTheme { get; set; }
}
```

### 组件生命周期

Blazor 组件有完整的生命周期钩子：

```razor
@implements IDisposable
@implements IAsyncDisposable

@code {
    // 1. 组件初始化（同步）
    protected override void OnInitialized()
    {
        Console.WriteLine("OnInitialized: 组件初始化");
    }

    // 2. 组件初始化（异步）
    protected override async Task OnInitializedAsync()
    {
        Console.WriteLine("OnInitializedAsync: 异步初始化开始");
        await LoadDataAsync();
    }

    // 3. 参数设置时调用
    protected override void OnParametersSet()
    {
        Console.WriteLine("OnParametersSet: 参数已设置");
    }

    // 4. 参数设置时调用（异步）
    protected override async Task OnParametersSetAsync()
    {
        Console.WriteLine("OnParametersSetAsync: 异步参数处理");
        await Task.CompletedTask;
    }

    // 5. 是否应该渲染
    protected override bool ShouldRender()
    {
        Console.WriteLine("ShouldRender: 检查是否需要渲染");
        return true; // 返回 false 可以跳过渲染
    }

    // 6. 渲染后调用
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Console.WriteLine("OnAfterRender: 首次渲染完成");
        }
    }

    // 7. 渲染后调用（异步）
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // 首次渲染后初始化 JS 互操作
            await JSRuntime.InvokeVoidAsync("initializeComponent");
        }
    }

    // 8. 组件销毁（同步）
    public void Dispose()
    {
        Console.WriteLine("Dispose: 同步清理资源");
    }

    // 9. 组件销毁（异步）
    public async ValueTask DisposeAsync()
    {
        Console.WriteLine("DisposeAsync: 异步清理资源");
        await Task.CompletedTask;
    }

    private async Task LoadDataAsync()
    {
        await Task.Delay(100); // 模拟数据加载
    }
}
```

#### 生命周期流程图

```
组件创建
    │
    ▼
OnInitialized / OnInitializedAsync
    │
    ▼
OnParametersSet / OnParametersSetAsync
    │
    ▼
ShouldRender ─────────────────────────┐
    │                                 │
    │ (返回 true)                     │ (返回 false)
    ▼                                 │
BuildRenderTree                       │
    │                                 │
    ▼                                 │
OnAfterRender / OnAfterRenderAsync    │
    │                                 │
    ◄─────────────────────────────────┘
    │
    │ (参数变化)
    ▼
OnParametersSet / OnParametersSetAsync
    │
    ... (循环)
    │
    ▼
Dispose / DisposeAsync (组件销毁时)
```

## 数据绑定

### 单向绑定

从组件状态到 UI 的数据流：

```razor
<h1>欢迎, @userName!</h1>
<p>您有 @messageCount 条未读消息</p>
<p>当前时间: @DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")</p>

<ul>
    @foreach (var item in items)
    {
        <li>@item.Name - ¥@item.Price.ToString("F2")</li>
    }
</ul>

@code {
    private string userName = "张三";
    private int messageCount = 5;
    private List<Product> items = new();
}
```

### 双向绑定

使用 `@bind` 实现双向数据绑定：

```razor
<h2>双向绑定示例</h2>

@* 基本文本绑定 *@
<input @bind="userName" placeholder="请输入姓名" />
<p>您好, @userName</p>

@* 绑定事件控制 *@
<input @bind="searchText" @bind:event="oninput" placeholder="实时搜索..." />

@* 格式化绑定 *@
<input @bind="birthDate" @bind:format="yyyy-MM-dd" type="date" />

@* 绑定到组件参数 *@
<InputNumber @bind-Value="quantity" min="1" max="100" />

@code {
    private string userName = "";
    private string searchText = "";
    private DateTime birthDate = DateTime.Today;
    private int quantity = 1;
}
```

### 自定义双向绑定组件

创建支持双向绑定的自定义组件：

```razor
@* StarRating.razor *@
<div class="star-rating">
    @for (int i = 1; i <= MaxStars; i++)
    {
        var starIndex = i;
        <span class="star @(i <= Value ? "filled" : "")"
              @onclick="() => SetRating(starIndex)">
            ★
        </span>
    }
</div>

@code {
    [Parameter]
    public int Value { get; set; }

    [Parameter]
    public EventCallback<int> ValueChanged { get; set; }

    [Parameter]
    public int MaxStars { get; set; } = 5;

    private async Task SetRating(int rating)
    {
        Value = rating;
        await ValueChanged.InvokeAsync(rating);
    }
}

@* 使用自定义组件 *@
<StarRating @bind-Value="userRating" MaxStars="5" />
<p>您的评分: @userRating 星</p>

@code {
    private int userRating = 3;
}
```

## 事件处理

### 基本事件处理

```razor
@* 点击事件 *@
<button @onclick="HandleClick">点击我</button>
<button @onclick="@(() => HandleClickWithParam("参数"))">带参数点击</button>
<button @onclick="HandleClickAsync">异步处理</button>

@* 鼠标事件 *@
<div @onmouseover="HandleMouseOver"
     @onmouseout="HandleMouseOut"
     class="hover-area">
    鼠标悬停区域
</div>

@* 键盘事件 *@
<input @onkeydown="HandleKeyDown"
       @onkeyup="HandleKeyUp"
       placeholder="按键测试" />

@* 表单事件 *@
<input @onfocus="HandleFocus"
       @onblur="HandleBlur"
       @oninput="HandleInput" />

@code {
    private void HandleClick()
    {
        Console.WriteLine("按钮被点击");
    }

    private void HandleClickWithParam(string param)
    {
        Console.WriteLine($"收到参数: {param}");
    }

    private async Task HandleClickAsync()
    {
        await Task.Delay(100);
        Console.WriteLine("异步处理完成");
    }

    private void HandleKeyDown(KeyboardEventArgs e)
    {
        Console.WriteLine($"按下按键: {e.Key}, Ctrl: {e.CtrlKey}");
    }

    private void HandleKeyUp(KeyboardEventArgs e)
    {
        Console.WriteLine($"释放按键: {e.Key}");
    }

    private void HandleMouseOver(MouseEventArgs e)
    {
        Console.WriteLine($"鼠标进入，位置: ({e.ClientX}, {e.ClientY})");
    }

    private void HandleMouseOut(MouseEventArgs e)
    {
        Console.WriteLine("鼠标离开");
    }

    private void HandleFocus(FocusEventArgs e)
    {
        Console.WriteLine("获得焦点");
    }

    private void HandleBlur(FocusEventArgs e)
    {
        Console.WriteLine("失去焦点");
    }

    private void HandleInput(ChangeEventArgs e)
    {
        Console.WriteLine($"输入值: {e.Value}");
    }
}
```

### 事件修饰符

```razor
@* 阻止默认行为 *@
<a href="https://example.com" @onclick="HandleLinkClick" @onclick:preventDefault>
    点击不会跳转
</a>

@* 阻止事件冒泡 *@
<div @onclick="HandleOuterClick">
    外层
    <button @onclick="HandleInnerClick" @onclick:stopPropagation>
        内层（不冒泡）
    </button>
</div>

@code {
    private void HandleLinkClick() => Console.WriteLine("链接被点击但不跳转");
    private void HandleOuterClick() => Console.WriteLine("外层被点击");
    private void HandleInnerClick() => Console.WriteLine("内层被点击");
}
```

### EventCallback

用于父子组件通信：

```razor
@* ChildComponent.razor *@
<button @onclick="NotifyParent">通知父组件</button>

@code {
    [Parameter]
    public EventCallback<string> OnNotify { get; set; }

    private async Task NotifyParent()
    {
        await OnNotify.InvokeAsync("来自子组件的消息");
    }
}

@* ParentComponent.razor *@
<ChildComponent OnNotify="HandleChildNotification" />
<p>收到消息: @receivedMessage</p>

@code {
    private string receivedMessage = "";

    private void HandleChildNotification(string message)
    {
        receivedMessage = message;
    }
}
```

## 路由

### 基本路由

```razor
@page "/products"
@page "/products/list"

<h1>产品列表</h1>

@* 路由参数 *@
@page "/product/{Id:int}"

<h1>产品详情: @Id</h1>

@code {
    [Parameter]
    public int Id { get; set; }
}

@* 可选路由参数 *@
@page "/search/{Query?}"

@code {
    [Parameter]
    public string? Query { get; set; }
}

@* 路由约束 *@
@page "/user/{UserId:guid}"
@page "/order/{OrderId:long}"
@page "/category/{Name:alpha}"
@page "/page/{PageNumber:int:min(1)}"
```

### 查询字符串参数

```razor
@page "/search"

<h1>搜索结果</h1>
<p>关键词: @Keyword</p>
<p>页码: @Page</p>
<p>排序: @Sort</p>

@code {
    [SupplyParameterFromQuery]
    public string? Keyword { get; set; }

    [SupplyParameterFromQuery]
    public int Page { get; set; } = 1;

    [SupplyParameterFromQuery(Name = "orderBy")]
    public string? Sort { get; set; }
}
```

### 编程式导航

```razor
@inject NavigationManager Navigation

<button @onclick="NavigateToProduct">查看产品</button>
<button @onclick="NavigateWithQuery">搜索</button>

@code {
    private void NavigateToProduct()
    {
        Navigation.NavigateTo("/product/123");
    }

    private void NavigateWithQuery()
    {
        Navigation.NavigateTo("/search?keyword=blazor&page=1");
    }

    // 强制加载（完整页面刷新）
    private void ForceNavigate()
    {
        Navigation.NavigateTo("/external-page", forceLoad: true);
    }

    // 替换历史记录
    private void ReplaceNavigation()
    {
        Navigation.NavigateTo("/new-page", replace: true);
    }
}
```

### 路由守卫和导航拦截

```razor
@implements IDisposable
@inject NavigationManager Navigation

@code {
    private IDisposable? registration;

    protected override void OnInitialized()
    {
        registration = Navigation.RegisterLocationChangingHandler(OnLocationChanging);
    }

    private async ValueTask OnLocationChanging(LocationChangingContext context)
    {
        if (hasUnsavedChanges)
        {
            var confirmed = await JSRuntime.InvokeAsync<bool>(
                "confirm", "您有未保存的更改，确定要离开吗？");

            if (!confirmed)
            {
                context.PreventNavigation();
            }
        }
    }

    public void Dispose()
    {
        registration?.Dispose();
    }
}
```

### NavLink 组件

```razor
<nav class="navbar">
    <NavLink href="/" Match="NavLinkMatch.All">
        首页
    </NavLink>
    <NavLink href="/counter">
        计数器
    </NavLink>
    <NavLink href="/products">
        产品
    </NavLink>
</nav>

<style>
    .navbar a {
        color: blue;
    }
    .navbar a.active {
        color: red;
        font-weight: bold;
    }
</style>
```

## 表单和验证

### EditForm 基础

```razor
@using System.ComponentModel.DataAnnotations

<EditForm Model="@user" OnValidSubmit="HandleValidSubmit" FormName="UserForm">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="mb-3">
        <label class="form-label">用户名</label>
        <InputText @bind-Value="user.Username" class="form-control" />
        <ValidationMessage For="@(() => user.Username)" />
    </div>

    <div class="mb-3">
        <label class="form-label">邮箱</label>
        <InputText @bind-Value="user.Email" class="form-control" type="email" />
        <ValidationMessage For="@(() => user.Email)" />
    </div>

    <div class="mb-3">
        <label class="form-label">年龄</label>
        <InputNumber @bind-Value="user.Age" class="form-control" />
        <ValidationMessage For="@(() => user.Age)" />
    </div>

    <div class="mb-3">
        <label class="form-label">出生日期</label>
        <InputDate @bind-Value="user.BirthDate" class="form-control" />
    </div>

    <div class="mb-3 form-check">
        <InputCheckbox @bind-Value="user.AcceptTerms" class="form-check-input" id="terms" />
        <label class="form-check-label" for="terms">接受条款</label>
        <ValidationMessage For="@(() => user.AcceptTerms)" />
    </div>

    <div class="mb-3">
        <label class="form-label">角色</label>
        <InputSelect @bind-Value="user.Role" class="form-select">
            <option value="">请选择...</option>
            <option value="Admin">管理员</option>
            <option value="User">普通用户</option>
            <option value="Guest">访客</option>
        </InputSelect>
    </div>

    <div class="mb-3">
        <label class="form-label">简介</label>
        <InputTextArea @bind-Value="user.Bio" class="form-control" rows="3" />
    </div>

    <button type="submit" class="btn btn-primary">提交</button>
</EditForm>

@code {
    private UserModel user = new();

    private async Task HandleValidSubmit()
    {
        // 处理表单提交
        Console.WriteLine($"用户 {user.Username} 提交成功");
        await Task.CompletedTask;
    }

    public class UserModel
    {
        [Required(ErrorMessage = "用户名是必需的")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "用户名长度必须在3-50个字符之间")]
        public string Username { get; set; } = "";

        [Required(ErrorMessage = "邮箱是必需的")]
        [EmailAddress(ErrorMessage = "请输入有效的邮箱地址")]
        public string Email { get; set; } = "";

        [Range(18, 120, ErrorMessage = "年龄必须在18-120之间")]
        public int Age { get; set; }

        public DateTime? BirthDate { get; set; }

        [Range(typeof(bool), "true", "true", ErrorMessage = "必须接受条款")]
        public bool AcceptTerms { get; set; }

        public string Role { get; set; } = "";

        [MaxLength(500, ErrorMessage = "简介不能超过500个字符")]
        public string Bio { get; set; } = "";
    }
}
```

### 自定义验证

```razor
@code {
    public class UserModel : IValidatableObject
    {
        [Required]
        public string Password { get; set; } = "";

        [Required]
        public string ConfirmPassword { get; set; } = "";

        public IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            if (Password != ConfirmPassword)
            {
                yield return new ValidationResult(
                    "密码和确认密码不匹配",
                    new[] { nameof(ConfirmPassword) });
            }
        }
    }
}
```

### 自定义验证特性

```csharp
public class ChinesePhoneAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        if (value is string phone)
        {
            if (System.Text.RegularExpressions.Regex.IsMatch(phone, @"^1[3-9]\d{9}$"))
            {
                return ValidationResult.Success;
            }
        }
        return new ValidationResult(ErrorMessage ?? "请输入有效的中国手机号码");
    }
}

// 使用
public class ContactModel
{
    [ChinesePhone(ErrorMessage = "手机号格式不正确")]
    public string PhoneNumber { get; set; } = "";
}
```

### 文件上传

```razor
<EditForm Model="@uploadModel" OnValidSubmit="HandleUpload">
    <div class="mb-3">
        <label class="form-label">选择文件</label>
        <InputFile OnChange="HandleFileSelected"
                   multiple
                   accept=".jpg,.png,.pdf"
                   class="form-control" />
    </div>

    @if (selectedFiles.Any())
    {
        <ul>
            @foreach (var file in selectedFiles)
            {
                <li>@file.Name (@(file.Size / 1024) KB)</li>
            }
        </ul>
    }

    <button type="submit" class="btn btn-primary" disabled="@isUploading">
        @if (isUploading)
        {
            <span class="spinner-border spinner-border-sm"></span>
            <span>上传中...</span>
        }
        else
        {
            <span>上传</span>
        }
    </button>
</EditForm>

@code {
    private UploadModel uploadModel = new();
    private List<IBrowserFile> selectedFiles = new();
    private bool isUploading = false;
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    private void HandleFileSelected(InputFileChangeEventArgs e)
    {
        selectedFiles = e.GetMultipleFiles(maximumFileCount: 10).ToList();
    }

    private async Task HandleUpload()
    {
        isUploading = true;

        foreach (var file in selectedFiles)
        {
            if (file.Size > MaxFileSize)
            {
                Console.WriteLine($"文件 {file.Name} 超过大小限制");
                continue;
            }

            using var stream = file.OpenReadStream(MaxFileSize);
            // 保存文件或发送到服务器
            var buffer = new byte[file.Size];
            await stream.ReadAsync(buffer);

            Console.WriteLine($"已上传: {file.Name}");
        }

        isUploading = false;
    }

    public class UploadModel
    {
        public string Description { get; set; } = "";
    }
}
```

## JavaScript 互操作

### 调用 JavaScript 函数

```razor
@inject IJSRuntime JSRuntime

<button @onclick="ShowAlert">显示警告</button>
<button @onclick="GetWindowSize">获取窗口大小</button>
<button @onclick="FocusElement">聚焦输入框</button>

<input @ref="inputElement" type="text" />

@code {
    private ElementReference inputElement;

    // 调用无返回值的 JS 函数
    private async Task ShowAlert()
    {
        await JSRuntime.InvokeVoidAsync("alert", "来自 Blazor 的问候!");
    }

    // 调用有返回值的 JS 函数
    private async Task GetWindowSize()
    {
        var width = await JSRuntime.InvokeAsync<int>("eval", "window.innerWidth");
        var height = await JSRuntime.InvokeAsync<int>("eval", "window.innerHeight");
        Console.WriteLine($"窗口大小: {width} x {height}");
    }

    // 操作 DOM 元素
    private async Task FocusElement()
    {
        await JSRuntime.InvokeVoidAsync("blazorHelpers.focusElement", inputElement);
    }
}
```

JavaScript 端代码：

```javascript
// wwwroot/js/blazor-helpers.js
window.blazorHelpers = {
    focusElement: function(element) {
        element.focus();
    },

    getLocalStorage: function(key) {
        return localStorage.getItem(key);
    },

    setLocalStorage: function(key, value) {
        localStorage.setItem(key, value);
    },

    downloadFile: function(filename, contentType, content) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }
};
```

### JavaScript 调用 .NET 方法

```razor
@inject IJSRuntime JSRuntime

<button @onclick="SetupJSCallback">设置 JS 回调</button>

@code {
    private DotNetObjectReference<CallbackExample>? objRef;

    protected override void OnInitialized()
    {
        objRef = DotNetObjectReference.Create(this);
    }

    private async Task SetupJSCallback()
    {
        await JSRuntime.InvokeVoidAsync("setupDotNetCallback", objRef);
    }

    [JSInvokable]
    public void OnJSCallback(string message)
    {
        Console.WriteLine($"从 JS 收到消息: {message}");
        StateHasChanged();
    }

    [JSInvokable]
    public static Task<string> GetStaticMessage()
    {
        return Task.FromResult("这是静态方法的返回值");
    }

    public void Dispose()
    {
        objRef?.Dispose();
    }
}
```

JavaScript 端：

```javascript
window.setupDotNetCallback = function(dotNetHelper) {
    // 调用实例方法
    document.addEventListener('customEvent', function(e) {
        dotNetHelper.invokeMethodAsync('OnJSCallback', e.detail);
    });

    // 调用静态方法
    DotNet.invokeMethodAsync('MyApp', 'GetStaticMessage')
        .then(result => console.log(result));
};
```

### JS 模块隔离

```razor
@inject IJSRuntime JSRuntime
@implements IAsyncDisposable

@code {
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            module = await JSRuntime.InvokeAsync<IJSObjectReference>(
                "import", "./js/myModule.js");
        }
    }

    private async Task CallModuleFunction()
    {
        if (module != null)
        {
            await module.InvokeVoidAsync("showMessage", "Hello from module!");
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (module != null)
        {
            await module.DisposeAsync();
        }
    }
}
```

### 封装 JavaScript 互操作服务

```csharp
// Services/IJsInteropService.cs
public interface IJsInteropService
{
    Task<bool> ShowConfirmAsync(string message);
    Task SetPageTitleAsync(string title);
    Task ScrollToElementAsync(string elementId);
    Task<ElementBounds> GetElementBoundsAsync(ElementReference element);
    Task DownloadFileAsync(string filename, string content);
    Task<bool> CopyToClipboardAsync(string text);
}

public class JsInteropService : IJsInteropService
{
    private readonly IJSRuntime _jsRuntime;

    public JsInteropService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    public async Task<bool> ShowConfirmAsync(string message)
    {
        return await _jsRuntime.InvokeAsync<bool>("blazorInterop.showConfirm", message);
    }

    public async Task SetPageTitleAsync(string title)
    {
        await _jsRuntime.InvokeVoidAsync("blazorInterop.setTitle", title);
    }

    public async Task ScrollToElementAsync(string elementId)
    {
        await _jsRuntime.InvokeVoidAsync("blazorInterop.scrollToElement", elementId);
    }

    public async Task<ElementBounds> GetElementBoundsAsync(ElementReference element)
    {
        return await _jsRuntime.InvokeAsync<ElementBounds>(
            "blazorInterop.getElementBounds", element);
    }

    public async Task DownloadFileAsync(string filename, string content)
    {
        await _jsRuntime.InvokeVoidAsync("blazorInterop.downloadFile", filename, content);
    }

    public async Task<bool> CopyToClipboardAsync(string text)
    {
        return await _jsRuntime.InvokeAsync<bool>("blazorInterop.copyToClipboard", text);
    }
}

public class ElementBounds
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Width { get; set; }
    public double Height { get; set; }
}
```

## 状态管理

### 组件状态

```razor
@code {
    // 简单状态
    private int count = 0;
    private string message = "";
    private List<TodoItem> todos = new();

    // 状态更新会自动触发 UI 重新渲染
    private void IncrementCount()
    {
        count++;
        // 不需要手动调用 StateHasChanged()
    }

    // 异步操作后需要手动刷新
    private async Task LoadDataAsync()
    {
        todos = await httpClient.GetFromJsonAsync<List<TodoItem>>("/api/todos") ?? new();
        // 如果在非 UI 线程中，需要调用 StateHasChanged()
    }
}
```

### 级联状态

```csharp
// AppState.cs
public class AppState
{
    public string CurrentUser { get; private set; } = "";
    public bool IsAuthenticated => !string.IsNullOrEmpty(CurrentUser);

    public event Action? OnChange;

    public void SetUser(string username)
    {
        CurrentUser = username;
        NotifyStateChanged();
    }

    public void Logout()
    {
        CurrentUser = "";
        NotifyStateChanged();
    }

    private void NotifyStateChanged() => OnChange?.Invoke();
}

// Program.cs
builder.Services.AddScoped<AppState>();
```

使用状态：

```razor
@inject AppState State
@implements IDisposable

<p>当前用户: @State.CurrentUser</p>

@code {
    protected override void OnInitialized()
    {
        State.OnChange += StateHasChanged;
    }

    public void Dispose()
    {
        State.OnChange -= StateHasChanged;
    }
}
```

### 依赖注入服务状态管理

```csharp
// Services/StateService.cs
public interface IStateService
{
    event Action? OnStateChanged;
    List<TodoItem> Todos { get; }
    void AddTodo(string title);
    void ToggleTodo(int id);
    void RemoveTodo(int id);
}

public class StateService : IStateService
{
    private List<TodoItem> _todos = new();
    public List<TodoItem> Todos => _todos;

    public event Action? OnStateChanged;

    public void AddTodo(string title)
    {
        _todos.Add(new TodoItem
        {
            Id = _todos.Count + 1,
            Title = title,
            IsCompleted = false
        });
        NotifyStateChanged();
    }

    public void ToggleTodo(int id)
    {
        var todo = _todos.FirstOrDefault(t => t.Id == id);
        if (todo != null)
        {
            todo.IsCompleted = !todo.IsCompleted;
            NotifyStateChanged();
        }
    }

    public void RemoveTodo(int id)
    {
        _todos.RemoveAll(t => t.Id == id);
        NotifyStateChanged();
    }

    private void NotifyStateChanged() => OnStateChanged?.Invoke();
}
```

### 使用 Fluxor 进行状态管理

```csharp
// 安装: dotnet add package Fluxor.Blazor.Web

// State
public record CounterState(int Count);

public class CounterFeature : Feature<CounterState>
{
    public override string GetName() => "Counter";
    protected override CounterState GetInitialState() => new(0);
}

// Actions
public record IncrementCounterAction();
public record DecrementCounterAction();
public record SetCounterAction(int Value);

// Reducers
public static class CounterReducers
{
    [ReducerMethod]
    public static CounterState OnIncrement(CounterState state, IncrementCounterAction action)
        => state with { Count = state.Count + 1 };

    [ReducerMethod]
    public static CounterState OnDecrement(CounterState state, DecrementCounterAction action)
        => state with { Count = state.Count - 1 };

    [ReducerMethod]
    public static CounterState OnSet(CounterState state, SetCounterAction action)
        => state with { Count = action.Value };
}

// Effects (副作用)
public class CounterEffects
{
    private readonly ILogger<CounterEffects> _logger;

    public CounterEffects(ILogger<CounterEffects> logger)
    {
        _logger = logger;
    }

    [EffectMethod]
    public Task HandleIncrement(IncrementCounterAction action, IDispatcher dispatcher)
    {
        _logger.LogInformation("Counter incremented");
        return Task.CompletedTask;
    }
}
```

使用 Fluxor：

```razor
@inherits Fluxor.Blazor.Web.Components.FluxorComponent
@inject IState<CounterState> CounterState
@inject IDispatcher Dispatcher

<h1>计数器: @CounterState.Value.Count</h1>

<button @onclick="Increment">+1</button>
<button @onclick="Decrement">-1</button>
<button @onclick="Reset">重置</button>

@code {
    private void Increment() => Dispatcher.Dispatch(new IncrementCounterAction());
    private void Decrement() => Dispatcher.Dispatch(new DecrementCounterAction());
    private void Reset() => Dispatcher.Dispatch(new SetCounterAction(0));
}
```

## 依赖注入

### 服务注册

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// 单例 - 整个应用共享一个实例
builder.Services.AddSingleton<IConfigurationService, ConfigurationService>();

// 作用域 - 每个请求/连接一个实例
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IShoppingCartService, ShoppingCartService>();

// 瞬态 - 每次请求都创建新实例
builder.Services.AddTransient<IEmailService, EmailService>();

// HttpClient 工厂
builder.Services.AddHttpClient<IApiClient, ApiClient>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// 泛型服务
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
```

### 在组件中使用

```razor
@inject IUserService UserService
@inject ILogger<MyComponent> Logger
@inject NavigationManager Navigation
@inject HttpClient Http

<p>当前用户: @user?.Name</p>

@code {
    private User? user;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            user = await UserService.GetCurrentUserAsync();
            Logger.LogInformation("用户信息加载成功");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "加载用户信息失败");
        }
    }
}
```

### 代码中注入

```razor
@code {
    [Inject]
    private IUserService UserService { get; set; } = default!;

    [Inject]
    private ILogger<MyComponent> Logger { get; set; } = default!;
}
```

## 错误处理

### 错误边界

```razor
@* ErrorBoundary 使用 *@
<ErrorBoundary @ref="errorBoundary">
    <ChildContent>
        <RiskyComponent />
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="alert alert-danger">
            <h4>出错了!</h4>
            <p>@exception.Message</p>
            <button class="btn btn-secondary" @onclick="Recover">重试</button>
        </div>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? errorBoundary;

    private void Recover()
    {
        errorBoundary?.Recover();
    }
}
```

### 全局错误处理

```csharp
// 自定义错误处理中间件
public class GlobalErrorHandler
{
    private readonly ILogger<GlobalErrorHandler> _logger;

    public GlobalErrorHandler(ILogger<GlobalErrorHandler> logger)
    {
        _logger = logger;
    }

    public void HandleError(Exception exception)
    {
        _logger.LogError(exception, "发生未处理的异常");
        // 发送错误报告、显示用户友好的错误消息等
    }
}
```

### 异步错误处理

```razor
@code {
    private string? errorMessage;
    private bool isLoading;

    private async Task LoadDataAsync()
    {
        isLoading = true;
        errorMessage = null;

        try
        {
            await SomeAsyncOperation();
        }
        catch (HttpRequestException ex)
        {
            errorMessage = "网络请求失败，请检查网络连接";
            Logger.LogError(ex, "HTTP 请求失败");
        }
        catch (JsonException ex)
        {
            errorMessage = "数据格式错误";
            Logger.LogError(ex, "JSON 解析失败");
        }
        catch (Exception ex)
        {
            errorMessage = "发生未知错误，请稍后重试";
            Logger.LogError(ex, "未知错误");
        }
        finally
        {
            isLoading = false;
        }
    }
}
```

## 性能优化

### 虚拟化长列表

```razor
@using Microsoft.AspNetCore.Components.Web.Virtualization

<div style="height: 500px; overflow-y: auto;">
    <Virtualize Items="@allItems" Context="item" ItemSize="50">
        <ItemContent>
            <div class="list-item" style="height: 50px;">
                @item.Name - @item.Description
            </div>
        </ItemContent>
        <Placeholder>
            <div class="placeholder">加载中...</div>
        </Placeholder>
    </Virtualize>
</div>

@* 或者使用 ItemsProvider 进行按需加载 *@
<Virtualize ItemsProvider="LoadItems" Context="item">
    <div class="list-item">@item.Name</div>
</Virtualize>

@code {
    private List<Item> allItems = Enumerable.Range(1, 10000)
        .Select(i => new Item { Id = i, Name = $"项目 {i}" })
        .ToList();

    private async ValueTask<ItemsProviderResult<Item>> LoadItems(
        ItemsProviderRequest request)
    {
        // 从服务器按需加载数据
        var items = await Api.GetItemsAsync(
            request.StartIndex,
            request.Count,
            request.CancellationToken);

        return new ItemsProviderResult<Item>(items, totalItemCount);
    }
}
```

### 避免不必要的渲染

```razor
@code {
    // 使用 ShouldRender 控制渲染
    private bool shouldRender = true;

    protected override bool ShouldRender()
    {
        return shouldRender;
    }

    private void PreventNextRender()
    {
        shouldRender = false;
    }
}

@* 使用 @key 优化列表渲染 *@
@foreach (var item in items)
{
    <ItemComponent @key="item.Id" Item="item" />
}
```

### 组件懒加载

```razor
@if (showHeavyComponent)
{
    <HeavyComponent />
}

<button @onclick="() => showHeavyComponent = true">加载组件</button>

@code {
    private bool showHeavyComponent = false;
}
```

### 状态持久化

.NET 10 增强了状态持久化功能，支持断线重连时恢复会话状态：

```razor
@inject PersistentComponentState ApplicationState

@code {
    private string? data;
    private PersistingComponentStateSubscription persistingSubscription;

    protected override async Task OnInitializedAsync()
    {
        persistingSubscription = ApplicationState.RegisterOnPersisting(PersistData);

        if (!ApplicationState.TryTakeFromJson<string>("myData", out var restored))
        {
            data = await LoadDataAsync();
        }
        else
        {
            data = restored;
        }
    }

    private Task PersistData()
    {
        ApplicationState.PersistAsJson("myData", data);
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        persistingSubscription.Dispose();
    }
}
```

## HTTP 请求与 API 调用

### HttpClient 配置

```csharp
// Program.cs (Blazor WebAssembly)
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// 或使用 HttpClientFactory
builder.Services.AddHttpClient("API", client =>
{
    client.BaseAddress = new Uri("https://api.example.com/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});
```

### 创建 API 服务

```csharp
// Services/IWeatherService.cs
public interface IWeatherService
{
    Task<List<WeatherForecast>> GetForecastsAsync();
    Task<WeatherForecast?> GetForecastByIdAsync(int id);
    Task<WeatherForecast> CreateForecastAsync(WeatherForecast forecast);
    Task UpdateForecastAsync(int id, WeatherForecast forecast);
    Task DeleteForecastAsync(int id);
}

public class WeatherService : IWeatherService
{
    private readonly HttpClient _http;
    private readonly ILogger<WeatherService> _logger;

    public WeatherService(HttpClient http, ILogger<WeatherService> logger)
    {
        _http = http;
        _logger = logger;
    }

    public async Task<List<WeatherForecast>> GetForecastsAsync()
    {
        try
        {
            var forecasts = await _http.GetFromJsonAsync<List<WeatherForecast>>(
                "api/weather");
            return forecasts ?? new List<WeatherForecast>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "获取天气预报失败");
            throw;
        }
    }

    public async Task<WeatherForecast?> GetForecastByIdAsync(int id)
    {
        try
        {
            return await _http.GetFromJsonAsync<WeatherForecast>($"api/weather/{id}");
        }
        catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<WeatherForecast> CreateForecastAsync(WeatherForecast forecast)
    {
        var response = await _http.PostAsJsonAsync("api/weather", forecast);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<WeatherForecast>()
            ?? throw new InvalidOperationException("创建失败");
    }

    public async Task UpdateForecastAsync(int id, WeatherForecast forecast)
    {
        var response = await _http.PutAsJsonAsync($"api/weather/{id}", forecast);
        response.EnsureSuccessStatusCode();
    }

    public async Task DeleteForecastAsync(int id)
    {
        var response = await _http.DeleteAsync($"api/weather/{id}");
        response.EnsureSuccessStatusCode();
    }
}
```

## 实际案例：待办事项应用

下面是一个完整的待办事项应用示例，综合运用了前面介绍的各种概念：

```razor
@* TodoApp.razor *@
@page "/todos"
@inject ILocalStorageService LocalStorage
@inject IJSRuntime JSRuntime

<PageTitle>待办事项</PageTitle>

<div class="todo-app">
    <h1>待办事项</h1>

    <EditForm Model="@newTodo" OnValidSubmit="AddTodo" class="add-form">
        <div class="input-group mb-3">
            <InputText @bind-Value="newTodo.Title"
                       class="form-control"
                       placeholder="添加新任务..." />
            <button type="submit" class="btn btn-primary">添加</button>
        </div>
    </EditForm>

    <div class="filters mb-3">
        <button class="btn @(filter == "all" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("all"))">
            全部 (@todos.Count)
        </button>
        <button class="btn @(filter == "active" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("active"))">
            未完成 (@todos.Count(t => !t.IsCompleted))
        </button>
        <button class="btn @(filter == "completed" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("completed"))">
            已完成 (@todos.Count(t => t.IsCompleted))
        </button>
    </div>

    @if (!FilteredTodos.Any())
    {
        <div class="alert alert-info">
            @(filter == "all" ? "暂无待办事项" :
              filter == "active" ? "没有未完成的任务" : "没有已完成的任务")
        </div>
    }
    else
    {
        <ul class="todo-list list-group">
            @foreach (var todo in FilteredTodos)
            {
                <li @key="todo.Id" class="list-group-item d-flex align-items-center">
                    <input type="checkbox"
                           checked="@todo.IsCompleted"
                           @onchange="@(() => ToggleTodo(todo))"
                           class="form-check-input me-2" />

                    @if (editingTodoId == todo.Id)
                    {
                        <input @bind="todo.Title"
                               @onblur="@(() => StopEditing())"
                               @onkeydown="@(e => HandleEditKeyDown(e, todo))"
                               class="form-control" />
                    }
                    else
                    {
                        <span class="@(todo.IsCompleted ? "text-decoration-line-through text-muted" : "")"
                              @ondblclick="@(() => StartEditing(todo))">
                            @todo.Title
                        </span>
                    }

                    <button class="btn btn-sm btn-outline-danger ms-auto"
                            @onclick="@(() => DeleteTodo(todo))">
                        删除
                    </button>
                </li>
            }
        </ul>
    }

    @if (todos.Any(t => t.IsCompleted))
    {
        <button class="btn btn-outline-secondary mt-3" @onclick="ClearCompleted">
            清除已完成
        </button>
    }
</div>

@code {
    private List<TodoItem> todos = new();
    private TodoItem newTodo = new();
    private string filter = "all";
    private Guid? editingTodoId;

    private IEnumerable<TodoItem> FilteredTodos => filter switch
    {
        "active" => todos.Where(t => !t.IsCompleted),
        "completed" => todos.Where(t => t.IsCompleted),
        _ => todos
    };

    protected override async Task OnInitializedAsync()
    {
        await LoadTodos();
    }

    private async Task LoadTodos()
    {
        var saved = await LocalStorage.GetItemAsync<List<TodoItem>>("todos");
        if (saved != null)
        {
            todos = saved;
        }
    }

    private async Task SaveTodos()
    {
        await LocalStorage.SetItemAsync("todos", todos);
    }

    private async Task AddTodo()
    {
        if (!string.IsNullOrWhiteSpace(newTodo.Title))
        {
            todos.Add(new TodoItem
            {
                Id = Guid.NewGuid(),
                Title = newTodo.Title,
                CreatedAt = DateTime.Now
            });
            newTodo = new();
            await SaveTodos();
        }
    }

    private async Task ToggleTodo(TodoItem todo)
    {
        todo.IsCompleted = !todo.IsCompleted;
        todo.CompletedAt = todo.IsCompleted ? DateTime.Now : null;
        await SaveTodos();
    }

    private async Task DeleteTodo(TodoItem todo)
    {
        todos.Remove(todo);
        await SaveTodos();
    }

    private async Task ClearCompleted()
    {
        todos.RemoveAll(t => t.IsCompleted);
        await SaveTodos();
    }

    private void SetFilter(string newFilter)
    {
        filter = newFilter;
    }

    private void StartEditing(TodoItem todo)
    {
        editingTodoId = todo.Id;
    }

    private async Task StopEditing()
    {
        editingTodoId = null;
        await SaveTodos();
    }

    private async Task HandleEditKeyDown(KeyboardEventArgs e, TodoItem todo)
    {
        if (e.Key == "Enter")
        {
            await StopEditing();
        }
        else if (e.Key == "Escape")
        {
            editingTodoId = null;
        }
    }

    public class TodoItem
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = "";
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
```

## .NET 10 Blazor 新特性

.NET 10 为 Blazor 带来了大量增强功能：

### 安全性增强

- 更新的安全示例，支持 OpenID Connect、Microsoft Entra ID 和 Windows 认证
- 更严格的内容安全策略（CSP）支持
- 专用的重连 UI 组件

### 开发体验改进

- Blazor WebAssembly 热重载改进
- 必需组件参数（编译时检查）
- 新增 `InputHidden` 表单组件
- 增强的验证功能

### 性能优化

- 更高效的字节数组传输用于 JavaScript 互操作
- 改进的 WebAssembly 诊断和性能分析
- 断线重连后的会话状态恢复

### 新增 API

- 扩展的状态持久化 API
- 新的 JavaScript 互操作 API

## 最佳实践

### 性能优化

```razor
@* 使用 @key 优化列表渲染 *@
@foreach (var item in items)
{
    <div @key="item.Id">
        @item.Name
    </div>
}

@* 使用 ShouldRender 控制渲染 *@
@code {
    protected override bool ShouldRender()
    {
        // 只在必要时重新渲染
        return hasChanges;
    }
}

@* 虚拟化大列表 *@
<Virtualize Items="@largeList" Context="item">
    <div>@item.Name</div>
</Virtualize>
```

### 错误处理

```razor
<ErrorBoundary>
    <ChildContent>
        @* 正常内容 *@
        <MyComponent />
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="alert alert-danger">
            <p>发生错误：@exception.Message</p>
            <button @onclick="RecoverAsync">恢复</button>
        </div>
    </ErrorContent>
</ErrorBoundary>
```

### 代码组织

```
MyBlazorApp/
├── Components/          # 可复用组件
│   ├── Shared/         # 共享组件
│   └── Features/       # 功能特定组件
├── Pages/              # 路由页面
├── Services/           # 业务逻辑服务
├── Models/             # 数据模型
├── Store/              # 状态管理
└── wwwroot/            # 静态资源
```

### 依赖注入最佳实践

```csharp
// 使用接口
public interface IDataService { }
public class DataService : IDataService { }

// 根据生命周期选择正确的注册方式
builder.Services.AddSingleton<ISingletonService, SingletonService>();
builder.Services.AddScoped<IScopedService, ScopedService>();
builder.Services.AddTransient<ITransientService, TransientService>();

// Blazor Server: 使用 Scoped
// Blazor WebAssembly: Scoped 等同于 Singleton
```

### 安全性考虑

```razor
@* 使用 AuthorizeView 保护内容 *@
<AuthorizeView>
    <Authorized>
        <p>欢迎, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>请先登录</p>
    </NotAuthorized>
</AuthorizeView>

@* 使用 [Authorize] 特性保护页面 *@
@page "/admin"
@attribute [Authorize(Roles = "Admin")]

@* 验证用户输入 *@
@code {
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string UserInput { get; set; }
}
```

## 总结

Blazor 是一个功能强大的现代 Web 开发框架，它让 .NET 开发者能够使用熟悉的 C# 语言构建丰富的交互式 Web 应用程序。通过本文，我们深入了解了：

1. **托管模式**：Blazor Server 和 Blazor WebAssembly 的区别与选择
2. **组件开发**：创建可复用的 UI 组件，使用参数和级联值
3. **数据绑定**：单向和双向数据绑定的实现
4. **事件处理**：响应用户交互和组件通信
5. **路由**：构建单页应用的导航系统
6. **表单验证**：创建健壮的表单处理逻辑
7. **JavaScript 互操作**：与现有 JavaScript 生态系统集成
8. **状态管理**：管理应用程序状态的多种方式
9. **性能优化**：构建高性能 Blazor 应用的最佳实践

随着 .NET 10 的发布，Blazor 已经成为一个成熟的企业级框架，适合构建各种规模的 Web 应用程序。无论是构建内部工具、客户门户还是公共网站，Blazor 都是一个值得考虑的选择。

### 关键要点

1. **选择合适的托管模型**：根据应用需求选择 Server 或 WebAssembly
2. **组件化设计**：构建可复用的组件
3. **状态管理**：使用适当的状态管理策略
4. **性能优化**：利用虚拟化、ShouldRender 等技术
5. **JavaScript 互操作**：在需要时无缝集成 JavaScript
6. **安全性**：始终验证用户输入并保护敏感操作

## 参考资源

- [ASP.NET Core in .NET 10 官方文档](https://www.infoq.com/news/2025/12/asp-net-core-10-release/)
- [Blazor in .NET 10 新特性](https://dev.to/mashrulhaque/blazor-in-net-10-the-features-that-actually-matter-nc1)
- [Blazor 2025 展望](https://medium.com/@reenbit/the-future-of-blazor-trends-use-cases-and-what-to-expect-beyond-2025-fd16823f8a93)
- [Blazor 生产就绪状态](https://codewithkazik.com/is-blazor-production-ready-in-2025-lets-find-out)
