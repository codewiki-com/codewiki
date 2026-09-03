---
title: Blazor
description: Complete guide to Blazor, building web applications, components, and state management with C#
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - Blazor
  - WebAssembly
  - Web
status: imported
origin: old/src/content/docs/csharp/blazor.en.md
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

Blazor is a revolutionary web framework from Microsoft that allows developers to build interactive web applications using C# and .NET without relying on JavaScript. We'll cover Blazor's core concepts, hosting models, component development, and practical applications.

## Introduction to Blazor

### What is Blazor?

Blazor is a framework for building interactive client-side web UI and is part of ASP.NET Core. The name "Blazor" comes from the combination of "Browser" and "Razor," indicating that it runs Razor components in the browser.

Core advantages of Blazor:

- **Unified Technology Stack**: Use C# and .NET for both frontend and backend
- **Code Reuse**: Share business logic between client and server
- **Rich Ecosystem**: Leverage existing .NET libraries and tools
- **Type Safety**: Compile-time checking reduces runtime errors
- **High Performance**: Near-native performance especially in WebAssembly mode

## Blazor Server vs Blazor WebAssembly

Blazor offers two main hosting models, each with its own use cases.

### Blazor Server

Blazor Server executes component logic on the server and communicates with the browser through a real-time SignalR connection.

```
┌─────────────────┐         SignalR          ┌─────────────────┐
│                 │ ◄─────────────────────► │                 │
│    Browser      │   Real-time bidirectional│    Server       │
│   (DOM Updates) │     communication        │(Component Logic)│
│                 │                          │                 │
└─────────────────┘                          └─────────────────┘
```

**Blazor Server Features:**

```csharp
// Program.cs - Blazor Server Configuration
var builder = WebApplication.CreateBuilder(args);

// Add Blazor Server services
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
```

**Pros:**
- Fast initial load (small download size)
- Can access server resources (databases, file systems, etc.)
- Supports older browsers
- Application code stays on the server

**Cons:**
- Requires persistent network connection
- Each user consumes server resources
- Network latency affects user experience
- Scalability limited by server resources

### Blazor WebAssembly

Blazor WebAssembly downloads the .NET runtime and application to the browser for execution.

```
┌─────────────────────────────────────┐
│            Browser                   │
│  ┌─────────────────────────────┐   │
│  │     WebAssembly Runtime      │   │
│  │  ┌───────────────────────┐  │   │
│  │  │    .NET Runtime        │  │   │
│  │  │  ┌─────────────────┐  │  │   │
│  │  │  │   Blazor App     │  │  │   │
│  │  │  └─────────────────┘  │  │   │
│  │  └───────────────────────┘  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Blazor WebAssembly Configuration:**

```csharp
// Program.cs - Blazor WebAssembly Configuration
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure HttpClient
builder.Services.AddScoped(sp =>
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

await builder.Build().RunAsync();
```

**Pros:**
- Offline work support
- No server resource consumption
- Can be deployed as static files
- True client-side execution

**Cons:**
- Larger initial load
- Browser must support WebAssembly
- Limited by browser sandbox

### Hosting Model Comparison Table

| Feature | Blazor Server | Blazor WebAssembly |
|---------|---------------|-------------------|
| Execution Location | Server | Client Browser |
| Initial Load | Fast | Slower |
| App Size | Small | Larger (~2-3 MB) |
| Runtime Performance | Network Latency | Near Native |
| Offline Support | No | Yes (PWA) |
| SEO Friendly | Yes | Requires Prerendering |
| Server Requirements | .NET Server | Static File Server |
| Scalability | Limited | Excellent |

### .NET 8+ Unified Hosting Model

Starting with .NET 8, Blazor introduced a unified hosting model that can mix Server and WebAssembly in the same application:

```csharp
// Program.cs - .NET 8+ Unified Mode
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

## Blazor Component Basics

### Component Structure

Blazor components are the basic building blocks of the UI, using the \ file extension:

```razor
@* Counter.razor *@
@page "/counter"

<PageTitle>Counter</PageTitle>

<h1>Counter</h1>

<p role="status">Current count: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">
    Click to increment
</button>

@code {
    private int currentCount = 0;

    private void IncrementCount()
    {
        currentCount++;
    }
}
```

### Component Parameters

Components can receive data through parameters:

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
    public string Title { get; set; } = "Notice";

    [Parameter]
    public RenderFragment? ChildContent { get; set; }

    // .NET 10+ supports required parameters
    [Parameter, EditorRequired]
    public string Message { get; set; } = default!;
}
```

Using the component:

```razor
<Alert Type="warning" Title="Warning!" Message="This is a required message">
    <p>This is warning content, please pay attention!</p>
</Alert>
```

### Cascading Parameters

Cascading parameters allow ancestor components to provide data to all descendant components:

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

@* Descendant component using cascading parameter *@
@code {
    [CascadingParameter(Name = "AppTheme")]
    public Theme? CurrentTheme { get; set; }
}
```

### Component Lifecycle

Blazor components have a complete set of lifecycle hooks:

```razor
@implements IDisposable
@implements IAsyncDisposable

@code {
    // 1. Component initialization (synchronous)
    protected override void OnInitialized()
    {
        Console.WriteLine("OnInitialized: Component initialized");
    }

    // 2. Component initialization (asynchronous)
    protected override async Task OnInitializedAsync()
    {
        Console.WriteLine("OnInitializedAsync: Async initialization started");
        await LoadDataAsync();
    }

    // 3. Called when parameters are set
    protected override void OnParametersSet()
    {
        Console.WriteLine("OnParametersSet: Parameters have been set");
    }

    // 4. Called when parameters are set (asynchronous)
    protected override async Task OnParametersSetAsync()
    {
        Console.WriteLine("OnParametersSetAsync: Async parameter processing");
        await Task.CompletedTask;
    }

    // 5. Whether to render
    protected override bool ShouldRender()
    {
        Console.WriteLine("ShouldRender: Checking if render is needed");
        return true; // Return false to skip rendering
    }

    // 6. Called after rendering
    protected override void OnAfterRender(bool firstRender)
    {
        if (firstRender)
        {
            Console.WriteLine("OnAfterRender: First render completed");
        }
    }

    // 7. Called after rendering (asynchronous)
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Initialize JS interop after first render
            await JSRuntime.InvokeVoidAsync("initializeComponent");
        }
    }

    // 8. Component disposal (synchronous)
    public void Dispose()
    {
        Console.WriteLine("Dispose: Synchronous resource cleanup");
    }

    // 9. Component disposal (asynchronous)
    public async ValueTask DisposeAsync()
    {
        Console.WriteLine("DisposeAsync: Asynchronous resource cleanup");
        await Task.CompletedTask;
    }

    private async Task LoadDataAsync()
    {
        await Task.Delay(100); // Simulate data loading
    }
}
```

#### Lifecycle Flow Diagram

```
Component Created
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
    │ (returns true)                  │ (returns false)
    ▼                                 │
BuildRenderTree                       │
    │                                 │
    ▼                                 │
OnAfterRender / OnAfterRenderAsync    │
    │                                 │
    ◄─────────────────────────────────┘
    │
    │ (parameter change)
    ▼
OnParametersSet / OnParametersSetAsync
    │
    ... (loop)
    │
    ▼
Dispose / DisposeAsync (when component is destroyed)
```

## Data Binding

### One-way Binding

Data flow from component state to UI:

```razor
<h1>Welcome, @userName!</h1>
<p>You have @messageCount unread messages</p>
<p>Current time: @DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")</p>

<ul>
    @foreach (var item in items)
    {
        <li>@item.Name - ¥@item.Price.ToString("F2")</li>
    }
</ul>

@code {
    private string userName = "John";
    private int messageCount = 5;
    private List<Product> items = new();
}
```

### Two-way Binding

Use \ for two-way data binding:

```razor
<h2>Two-way Binding Example</h2>

@* Basic text binding *@
<input @bind="userName" placeholder="Enter your name" />
<p>Hello, @userName</p>

@* Binding event control *@
<input @bind="searchText" @bind:event="oninput" placeholder="Real-time search..." />

@* Formatted binding *@
<input @bind="birthDate" @bind:format="yyyy-MM-dd" type="date" />

@* Binding to component parameter *@
<InputNumber @bind-Value="quantity" min="1" max="100" />

@code {
    private string userName = "";
    private string searchText = "";
    private DateTime birthDate = DateTime.Today;
    private int quantity = 1;
}
```

### Custom Two-way Binding Component

Create a custom component that supports two-way binding:

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

@* Using the custom component *@
<StarRating @bind-Value="userRating" MaxStars="5" />
<p>Your rating: @userRating stars</p>

@code {
    private int userRating = 3;
}
```

## Event Handling

### Basic Event Handling

```razor
@* Click events *@
<button @onclick="HandleClick">Click Me</button>
<button @onclick="@(() => HandleClickWithParam("parameter"))">Click with Parameter</button>
<button @onclick="HandleClickAsync">Async Handler</button>

@* Mouse events *@
<div @onmouseover="HandleMouseOver"
     @onmouseout="HandleMouseOut"
     class="hover-area">
    Mouse Hover Area
</div>

@* Keyboard events *@
<input @onkeydown="HandleKeyDown"
       @onkeyup="HandleKeyUp"
       placeholder="Key test" />

@* Form events *@
<input @onfocus="HandleFocus"
       @onblur="HandleBlur"
       @oninput="HandleInput" />

@code {
    private void HandleClick()
    {
        Console.WriteLine("Button clicked");
    }

    private void HandleClickWithParam(string param)
    {
        Console.WriteLine($"Received parameter: {param}");
    }

    private async Task HandleClickAsync()
    {
        await Task.Delay(100);
        Console.WriteLine("Async processing completed");
    }

    private void HandleKeyDown(KeyboardEventArgs e)
    {
        Console.WriteLine($"Key pressed: {e.Key}, Ctrl: {e.CtrlKey}");
    }

    private void HandleKeyUp(KeyboardEventArgs e)
    {
        Console.WriteLine($"Key released: {e.Key}");
    }

    private void HandleMouseOver(MouseEventArgs e)
    {
        Console.WriteLine($"Mouse entered, position: ({e.ClientX}, {e.ClientY})");
    }

    private void HandleMouseOut(MouseEventArgs e)
    {
        Console.WriteLine("Mouse left");
    }

    private void HandleFocus(FocusEventArgs e)
    {
        Console.WriteLine("Focus gained");
    }

    private void HandleBlur(FocusEventArgs e)
    {
        Console.WriteLine("Focus lost");
    }

    private void HandleInput(ChangeEventArgs e)
    {
        Console.WriteLine($"Input value: {e.Value}");
    }
}
```

### Event Modifiers

```razor
@* Prevent default behavior *@
<a href="https://example.com" @onclick="HandleLinkClick" @onclick:preventDefault>
    Click won't navigate
</a>

@* Stop event propagation *@
<div @onclick="HandleOuterClick">
    Outer
    <button @onclick="HandleInnerClick" @onclick:stopPropagation>
        Inner (no bubbling)
    </button>
</div>

@code {
    private void HandleLinkClick() => Console.WriteLine("Link clicked but not navigating");
    private void HandleOuterClick() => Console.WriteLine("Outer clicked");
    private void HandleInnerClick() => Console.WriteLine("Inner clicked");
}
```

### EventCallback

Used for parent-child component communication:

```razor
@* ChildComponent.razor *@
<button @onclick="NotifyParent">Notify Parent</button>

@code {
    [Parameter]
    public EventCallback<string> OnNotify { get; set; }

    private async Task NotifyParent()
    {
        await OnNotify.InvokeAsync("Message from child component");
    }
}

@* ParentComponent.razor *@
<ChildComponent OnNotify="HandleChildNotification" />
<p>Received message: @receivedMessage</p>

@code {
    private string receivedMessage = "";

    private void HandleChildNotification(string message)
    {
        receivedMessage = message;
    }
}
```

## Routing

### Basic Routing

```razor
@page "/products"
@page "/products/list"

<h1>Product List</h1>

@* Route parameters *@
@page "/product/{Id:int}"

<h1>Product Details: @Id</h1>

@code {
    [Parameter]
    public int Id { get; set; }
}

@* Optional route parameters *@
@page "/search/{Query?}"

@code {
    [Parameter]
    public string? Query { get; set; }
}

@* Route constraints *@
@page "/user/{UserId:guid}"
@page "/order/{OrderId:long}"
@page "/category/{Name:alpha}"
@page "/page/{PageNumber:int:min(1)}"
```

### Query String Parameters

```razor
@page "/search"

<h1>Search Results</h1>
<p>Keyword: @Keyword</p>
<p>Page: @Page</p>
<p>Sort: @Sort</p>

@code {
    [SupplyParameterFromQuery]
    public string? Keyword { get; set; }

    [SupplyParameterFromQuery]
    public int Page { get; set; } = 1;

    [SupplyParameterFromQuery(Name = "orderBy")]
    public string? Sort { get; set; }
}
```

### Programmatic Navigation

```razor
@inject NavigationManager Navigation

<button @onclick="NavigateToProduct">View Product</button>
<button @onclick="NavigateWithQuery">Search</button>

@code {
    private void NavigateToProduct()
    {
        Navigation.NavigateTo("/product/123");
    }

    private void NavigateWithQuery()
    {
        Navigation.NavigateTo("/search?keyword=blazor&page=1");
    }

    // Force load (full page refresh)
    private void ForceNavigate()
    {
        Navigation.NavigateTo("/external-page", forceLoad: true);
    }

    // Replace history entry
    private void ReplaceNavigation()
    {
        Navigation.NavigateTo("/new-page", replace: true);
    }
}
```

### Route Guards and Navigation Interception

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
                "confirm", "You have unsaved changes. Are you sure you want to leave?");

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

### NavLink Component

```razor
<nav class="navbar">
    <NavLink href="/" Match="NavLinkMatch.All">
        Home
    </NavLink>
    <NavLink href="/counter">
        Counter
    </NavLink>
    <NavLink href="/products">
        Products
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

## Forms and Validation

### EditForm Basics

```razor
@using System.ComponentModel.DataAnnotations

<EditForm Model="@user" OnValidSubmit="HandleValidSubmit" FormName="UserForm">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="mb-3">
        <label class="form-label">Username</label>
        <InputText @bind-Value="user.Username" class="form-control" />
        <ValidationMessage For="@(() => user.Username)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Email</label>
        <InputText @bind-Value="user.Email" class="form-control" type="email" />
        <ValidationMessage For="@(() => user.Email)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Age</label>
        <InputNumber @bind-Value="user.Age" class="form-control" />
        <ValidationMessage For="@(() => user.Age)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Birth Date</label>
        <InputDate @bind-Value="user.BirthDate" class="form-control" />
    </div>

    <div class="mb-3 form-check">
        <InputCheckbox @bind-Value="user.AcceptTerms" class="form-check-input" id="terms" />
        <label class="form-check-label" for="terms">Accept Terms</label>
        <ValidationMessage For="@(() => user.AcceptTerms)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Role</label>
        <InputSelect @bind-Value="user.Role" class="form-select">
            <option value="">Please select...</option>
            <option value="Admin">Administrator</option>
            <option value="User">Regular User</option>
            <option value="Guest">Guest</option>
        </InputSelect>
    </div>

    <div class="mb-3">
        <label class="form-label">Bio</label>
        <InputTextArea @bind-Value="user.Bio" class="form-control" rows="3" />
    </div>

    <button type="submit" class="btn btn-primary">Submit</button>
</EditForm>

@code {
    private UserModel user = new();

    private async Task HandleValidSubmit()
    {
        // Handle form submission
        Console.WriteLine($"User {user.Username} submitted successfully");
        await Task.CompletedTask;
    }

    public class UserModel
    {
        [Required(ErrorMessage = "Username is required")]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3-50 characters")]
        public string Username { get; set; } = "";

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public string Email { get; set; } = "";

        [Range(18, 120, ErrorMessage = "Age must be between 18-120")]
        public int Age { get; set; }

        public DateTime? BirthDate { get; set; }

        [Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the terms")]
        public bool AcceptTerms { get; set; }

        public string Role { get; set; } = "";

        [MaxLength(500, ErrorMessage = "Bio cannot exceed 500 characters")]
        public string Bio { get; set; } = "";
    }
}
```

### Custom Validation

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
                    "Password and confirm password do not match",
                    new[] { nameof(ConfirmPassword) });
            }
        }
    }
}
```

### Custom Validation Attribute

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
        return new ValidationResult(ErrorMessage ?? "Please enter a valid Chinese phone number");
    }
}

// Usage
public class ContactModel
{
    [ChinesePhone(ErrorMessage = "Invalid phone number format")]
    public string PhoneNumber { get; set; } = "";
}
```

### File Upload

```razor
<EditForm Model="@uploadModel" OnValidSubmit="HandleUpload">
    <div class="mb-3">
        <label class="form-label">Select Files</label>
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
            <span>Uploading...</span>
        }
        else
        {
            <span>Upload</span>
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
                Console.WriteLine($"File {file.Name} exceeds size limit");
                continue;
            }

            using var stream = file.OpenReadStream(MaxFileSize);
            // Save file or send to server
            var buffer = new byte[file.Size];
            await stream.ReadAsync(buffer);

            Console.WriteLine($"Uploaded: {file.Name}");
        }

        isUploading = false;
    }

    public class UploadModel
    {
        public string Description { get; set; } = "";
    }
}
```

## JavaScript Interop

### Calling JavaScript Functions

```razor
@inject IJSRuntime JSRuntime

<button @onclick="ShowAlert">Show Alert</button>
<button @onclick="GetWindowSize">Get Window Size</button>
<button @onclick="FocusElement">Focus Input</button>

<input @ref="inputElement" type="text" />

@code {
    private ElementReference inputElement;

    // Call JS function without return value
    private async Task ShowAlert()
    {
        await JSRuntime.InvokeVoidAsync("alert", "Greetings from Blazor!");
    }

    // Call JS function with return value
    private async Task GetWindowSize()
    {
        var width = await JSRuntime.InvokeAsync<int>("eval", "window.innerWidth");
        var height = await JSRuntime.InvokeAsync<int>("eval", "window.innerHeight");
        Console.WriteLine($"Window size: {width} x {height}");
    }

    // Manipulate DOM elements
    private async Task FocusElement()
    {
        await JSRuntime.InvokeVoidAsync("blazorHelpers.focusElement", inputElement);
    }
}
```

JavaScript side code:

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

### JavaScript Calling .NET Methods

```razor
@inject IJSRuntime JSRuntime

<button @onclick="SetupJSCallback">Setup JS Callback</button>

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
        Console.WriteLine($"Received message from JS: {message}");
        StateHasChanged();
    }

    [JSInvokable]
    public static Task<string> GetStaticMessage()
    {
        return Task.FromResult("This is the return value from a static method");
    }

    public void Dispose()
    {
        objRef?.Dispose();
    }
}
```

JavaScript side:

```javascript
window.setupDotNetCallback = function(dotNetHelper) {
    // Call instance method
    document.addEventListener('customEvent', function(e) {
        dotNetHelper.invokeMethodAsync('OnJSCallback', e.detail);
    });

    // Call static method
    DotNet.invokeMethodAsync('MyApp', 'GetStaticMessage')
        .then(result => console.log(result));
};
```

### JS Module Isolation

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

### Encapsulating JavaScript Interop Service

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

## State Management

### Component State

```razor
@code {
    // Simple state
    private int count = 0;
    private string message = "";
    private List<TodoItem> todos = new();

    // State updates automatically trigger UI re-render
    private void IncrementCount()
    {
        count++;
        // No need to call StateHasChanged()
    }

    // Manual refresh needed after async operations
    private async Task LoadDataAsync()
    {
        todos = await httpClient.GetFromJsonAsync<List<TodoItem>>("/api/todos") ?? new();
        // If on a non-UI thread, need to call StateHasChanged()
    }
}
```

### Cascading State

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

Using state:

```razor
@inject AppState State
@implements IDisposable

<p>Current user: @State.CurrentUser</p>

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

### Dependency Injection Service State Management

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

### Using Fluxor for State Management

```csharp
// Install: dotnet add package Fluxor.Blazor.Web

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

// Effects (side effects)
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

Using Fluxor:

```razor
@inherits Fluxor.Blazor.Web.Components.FluxorComponent
@inject IState<CounterState> CounterState
@inject IDispatcher Dispatcher

<h1>Counter: @CounterState.Value.Count</h1>

<button @onclick="Increment">+1</button>
<button @onclick="Decrement">-1</button>
<button @onclick="Reset">Reset</button>

@code {
    private void Increment() => Dispatcher.Dispatch(new IncrementCounterAction());
    private void Decrement() => Dispatcher.Dispatch(new DecrementCounterAction());
    private void Reset() => Dispatcher.Dispatch(new SetCounterAction(0));
}
```

## Dependency Injection

### Service Registration

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Singleton - Single instance shared across the entire application
builder.Services.AddSingleton<IConfigurationService, ConfigurationService>();

// Scoped - One instance per request/connection
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IShoppingCartService, ShoppingCartService>();

// Transient - New instance created each time requested
builder.Services.AddTransient<IEmailService, EmailService>();

// HttpClient factory
builder.Services.AddHttpClient<IApiClient, ApiClient>(client =>
{
    client.BaseAddress = new Uri("https://api.example.com");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Generic services
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
```

### Using in Components

```razor
@inject IUserService UserService
@inject ILogger<MyComponent> Logger
@inject NavigationManager Navigation
@inject HttpClient Http

<p>Current user: @user?.Name</p>

@code {
    private User? user;

    protected override async Task OnInitializedAsync()
    {
        try
        {
            user = await UserService.GetCurrentUserAsync();
            Logger.LogInformation("User information loaded successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Failed to load user information");
        }
    }
}
```

### Injection in Code

```razor
@code {
    [Inject]
    private IUserService UserService { get; set; } = default!;

    [Inject]
    private ILogger<MyComponent> Logger { get; set; } = default!;
}
```

## Error Handling

### Error Boundaries

```razor
@* ErrorBoundary usage *@
<ErrorBoundary @ref="errorBoundary">
    <ChildContent>
        <RiskyComponent />
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="alert alert-danger">
            <h4>Something went wrong!</h4>
            <p>@exception.Message</p>
            <button class="btn btn-secondary" @onclick="Recover">Retry</button>
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

### Global Error Handling

```csharp
// Custom error handling middleware
public class GlobalErrorHandler
{
    private readonly ILogger<GlobalErrorHandler> _logger;

    public GlobalErrorHandler(ILogger<GlobalErrorHandler> logger)
    {
        _logger = logger;
    }

    public void HandleError(Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred");
        // Send error report, display user-friendly error message, etc.
    }
}
```

### Async Error Handling

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
            errorMessage = "Network request failed, please check your connection";
            Logger.LogError(ex, "HTTP request failed");
        }
        catch (JsonException ex)
        {
            errorMessage = "Data format error";
            Logger.LogError(ex, "JSON parsing failed");
        }
        catch (Exception ex)
        {
            errorMessage = "An unknown error occurred, please try again later";
            Logger.LogError(ex, "Unknown error");
        }
        finally
        {
            isLoading = false;
        }
    }
}
```

## Performance Optimization

### Virtualizing Long Lists

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
            <div class="placeholder">Loading...</div>
        </Placeholder>
    </Virtualize>
</div>

@* Or use ItemsProvider for on-demand loading *@
<Virtualize ItemsProvider="LoadItems" Context="item">
    <div class="list-item">@item.Name</div>
</Virtualize>

@code {
    private List<Item> allItems = Enumerable.Range(1, 10000)
        .Select(i => new Item { Id = i, Name = $"Item {i}" })
        .ToList();

    private async ValueTask<ItemsProviderResult<Item>> LoadItems(
        ItemsProviderRequest request)
    {
        // Load data on-demand from server
        var items = await Api.GetItemsAsync(
            request.StartIndex,
            request.Count,
            request.CancellationToken);

        return new ItemsProviderResult<Item>(items, totalItemCount);
    }
}
```

### Avoiding Unnecessary Renders

```razor
@code {
    // Use ShouldRender to control rendering
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

@* Use @key to optimize list rendering *@
@foreach (var item in items)
{
    <ItemComponent @key="item.Id" Item="item" />
}
```

### Component Lazy Loading

```razor
@if (showHeavyComponent)
{
    <HeavyComponent />
}

<button @onclick="() => showHeavyComponent = true">Load Component</button>

@code {
    private bool showHeavyComponent = false;
}
```

### State Persistence

.NET 10 enhanced state persistence functionality, supporting session state recovery after reconnection:

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

## HTTP Requests and API Calls

### HttpClient Configuration

```csharp
// Program.cs (Blazor WebAssembly)
builder.Services.AddScoped(sp => new HttpClient
{
    BaseAddress = new Uri(builder.HostEnvironment.BaseAddress)
});

// Or use HttpClientFactory
builder.Services.AddHttpClient("API", client =>
{
    client.BaseAddress = new Uri("https://api.example.com/");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});
```

### Creating API Service

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
            _logger.LogError(ex, "Failed to get weather forecast");
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
            ?? throw new InvalidOperationException("Creation failed");
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

## Practical Example: Todo Application

The following complete todo application example combines various concepts introduced earlier:

```razor
@* TodoApp.razor *@
@page "/todos"
@inject ILocalStorageService LocalStorage
@inject IJSRuntime JSRuntime

<PageTitle>Todo List</PageTitle>

<div class="todo-app">
    <h1>Todo List</h1>

    <EditForm Model="@newTodo" OnValidSubmit="AddTodo" class="add-form">
        <div class="input-group mb-3">
            <InputText @bind-Value="newTodo.Title"
                       class="form-control"
                       placeholder="Add new task..." />
            <button type="submit" class="btn btn-primary">Add</button>
        </div>
    </EditForm>

    <div class="filters mb-3">
        <button class="btn @(filter == "all" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("all"))">
            All (@todos.Count)
        </button>
        <button class="btn @(filter == "active" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("active"))">
            Active (@todos.Count(t => !t.IsCompleted))
        </button>
        <button class="btn @(filter == "completed" ? "btn-primary" : "btn-outline-primary")"
                @onclick="@(() => SetFilter("completed"))">
            Completed (@todos.Count(t => t.IsCompleted))
        </button>
    </div>

    @if (!FilteredTodos.Any())
    {
        <div class="alert alert-info">
            @(filter == "all" ? "No todo items" :
              filter == "active" ? "No active tasks" : "No completed tasks")
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
                        Delete
                    </button>
                </li>
            }
        </ul>
    }

    @if (todos.Any(t => t.IsCompleted))
    {
        <button class="btn btn-outline-secondary mt-3" @onclick="ClearCompleted">
            Clear Completed
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

## .NET 10 Blazor New Features

.NET 10 brings numerous enhancements to Blazor:

### Security Enhancements

- Updated security samples with support for OpenID Connect, Microsoft Entra ID, and Windows Authentication
- Stricter Content Security Policy (CSP) support
- Dedicated reconnection UI component

### Developer Experience Improvements

- Blazor WebAssembly hot reload improvements
- Required component parameters (compile-time checking)
- New \ form component
- Enhanced validation functionality

### Performance Optimizations

- More efficient byte array transfer for JavaScript interop
- Improved WebAssembly diagnostics and profiling
- Session state recovery after reconnection

### New APIs

- Extended state persistence APIs
- New JavaScript interop APIs

## Best Practices

### Performance Optimization

```razor
@* Use @key to optimize list rendering *@
@foreach (var item in items)
{
    <div @key="item.Id">
        @item.Name
    </div>
}

@* Use ShouldRender to control rendering *@
@code {
    protected override bool ShouldRender()
    {
        // Only re-render when necessary
        return hasChanges;
    }
}

@* Virtualize large lists *@
<Virtualize Items="@largeList" Context="item">
    <div>@item.Name</div>
</Virtualize>
```

### Error Handling

```razor
<ErrorBoundary>
    <ChildContent>
        @* Normal content *@
        <MyComponent />
    </ChildContent>
    <ErrorContent Context="exception">
        <div class="alert alert-danger">
            <p>Error occurred: @exception.Message</p>
            <button @onclick="RecoverAsync">Recover</button>
        </div>
    </ErrorContent>
</ErrorBoundary>
```

### Code Organization

```
MyBlazorApp/
├── Components/          # Reusable components
│   ├── Shared/         # Shared components
│   └── Features/       # Feature-specific components
├── Pages/              # Routable pages
├── Services/           # Business logic services
├── Models/             # Data models
├── Store/              # State management
└── wwwroot/            # Static assets
```

### Dependency Injection Best Practices

```csharp
// Use interfaces
public interface IDataService { }
public class DataService : IDataService { }

// Choose correct registration based on lifecycle
builder.Services.AddSingleton<ISingletonService, SingletonService>();
builder.Services.AddScoped<IScopedService, ScopedService>();
builder.Services.AddTransient<ITransientService, TransientService>();

// Blazor Server: Use Scoped
// Blazor WebAssembly: Scoped is equivalent to Singleton
```

### Security Considerations

```razor
@* Use AuthorizeView to protect content *@
<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>Please log in first</p>
    </NotAuthorized>
</AuthorizeView>

@* Use [Authorize] attribute to protect pages *@
@page "/admin"
@attribute [Authorize(Roles = "Admin")]

@* Validate user input *@
@code {
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string UserInput { get; set; }
}
```

## Summary

Blazor is a powerful modern web development framework that enables .NET developers to build rich, interactive web applications using the familiar C# language. We have explored:

1. **Hosting Models**: Differences and choices between Blazor Server and Blazor WebAssembly
2. **Component Development**: Creating reusable UI components with parameters and cascading values
3. **Data Binding**: Implementing one-way and two-way data binding
4. **Event Handling**: Responding to user interactions and component communication
5. **Routing**: Building navigation systems for single-page applications
6. **Form Validation**: Creating robust form handling logic
7. **JavaScript Interop**: Integrating with the existing JavaScript ecosystem
8. **State Management**: Various approaches to managing application state
9. **Performance Optimization**: Best practices for building high-performance Blazor applications

With the release of .NET 10, Blazor has become a mature enterprise-grade framework suitable for building web applications of all sizes. Whether building internal tools, customer portals, or public websites, Blazor is a worthy choice to consider.

### Key Takeaways

1. **Choose the Right Hosting Model**: Select Server or WebAssembly based on application requirements
2. **Component-Based Design**: Build reusable components
3. **State Management**: Use appropriate state management strategies
4. **Performance Optimization**: Leverage virtualization, ShouldRender, and other techniques
5. **JavaScript Interop**: Seamlessly integrate JavaScript when needed
6. **Security**: Always validate user input and protect sensitive operations

## Reference Resources

- [ASP.NET Core in .NET 10 Official Documentation](https://www.infoq.com/news/2025/12/asp-net-core-10-release/)
- [Blazor in .NET 10 New Features](https://dev.to/mashrulhaque/blazor-in-net-10-the-features-that-actually-matter-nc1)
- [Blazor 2025 Outlook](https://medium.com/@reenbit/the-future-of-blazor-trends-use-cases-and-what-to-expect-beyond-2025-fd16823f8a93)
- [Blazor Production Readiness](https://codewithkazik.com/is-blazor-production-ready-in-2025-lets-find-out)
