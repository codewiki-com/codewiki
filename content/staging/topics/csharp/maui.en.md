---
title: ".NET MAUI: Cross-Platform Development"
description: Complete guide to .NET MAUI for building cross-platform mobile and desktop applications with C#
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - C#
  - MAUI
  - mobile
  - cross-platform
  - UI
status: imported
origin: old/src/content/docs/csharp/maui.en.md
divergence: 0.161
issues:
  - order-mismatch
legacy:
  category: CSharp
  subcategory: Cross-Platform Development
  order: 15
  lastUpdated: 2026-01-07
---

.NET MAUI (Multi-platform App UI) is a modern, open-source framework from Microsoft that enables developers to build native applications for iOS, Android, macOS, and Windows from a single C# codebase. MAUI is the spiritual successor to Xamarin.Forms, offering significant improvements in performance, design, and developer experience while maintaining the goal of code sharing across multiple platforms.

---

## Concept Explanation

### What is .NET MAUI?

.NET MAUI is a cross-platform UI framework that allows developers to create native applications for multiple platforms using a single .NET codebase. Instead of writing platform-specific code for iOS, Android, macOS, and Windows, developers write C# and XAML that automatically compiles to native code for each target platform.

### The Evolution from Xamarin

MAUI represents a significant evolution from Xamarin.Forms:

- **Xamarin.Forms**: Original cross-platform framework, required platform-specific code for some features
- **.NET MAUI**: Modern successor built for .NET 6+ with improved performance, single project support, and better integration with native APIs

### Key Characteristics

- **Single Project Structure**: Build for all platforms from one project instead of maintaining separate projects per platform
- **XAML-Based UI**: Declarative UI using XAML similar to WPF and UWP
- **Native Compilation**: Code compiles to native applications on each platform
- **Code Sharing**: Share business logic, models, and services across all platforms
- **Hot Reload**: Modify XAML or C# code and see changes instantly during development
- **Native Performance**: Direct access to native APIs for optimal performance

---

## Core Principles

### Single Codebase, Multiple Platforms

The fundamental principle of MAUI is writing code once and deploying to multiple platforms. This includes:

```csharp
// Shared business logic
public class DataService
{
    private readonly HttpClient _httpClient;

    public DataService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Item>> GetItemsAsync()
    {
        var response = await _httpClient.GetAsync("api/items");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<List<Item>>(json);
    }
}
```

This service works identically on iOS, Android, macOS, and Windows without modification.

### Platform Convergence

MAUI uses conditional compilation and runtime detection to handle platform-specific behavior:

```csharp
#if IOS
    // iOS-specific code
    var iosSpecificFeature = new iOSFeature();
#elif ANDROID
    // Android-specific code
    var androidFeature = new AndroidFeature();
#endif

// Runtime platform detection
if (DeviceInfo.Platform == DevicePlatform.iOS)
{
    // iOS-specific behavior
}
else if (DeviceInfo.Platform == DevicePlatform.Android)
{
    // Android-specific behavior
}
```

### MVVM Pattern Foundation

MAUI is built around the MVVM (Model-View-ViewModel) pattern:

- **Model**: Business logic and data
- **View**: UI (XAML markup)
- **ViewModel**: Presentation logic and state management

### Dependency Injection First

MAUI integrates dependency injection at the framework level:

```csharp
public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder()
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            })
            .ConfigureServices(services =>
            {
                services.AddScoped<IDataService, DataService>();
                services.AddScoped<MainPage>();
                services.AddScoped<MainViewModel>();
            });

        return builder.Build();
    }
}
```

### Native API Access

Direct access to native APIs when needed:

```csharp
// Access platform-specific APIs while maintaining shared logic
public class MediaService
{
    public async Task<FileResult> PickPhotoAsync()
    {
        var result = await FilePicker.Default.PickAsync(
            new PickOptions
            {
                FileTypes = FilePickerFileType.Images
            });

        return result;
    }

    public async Task<bool> RequestCameraPermissionAsync()
    {
        var status = await Permissions.CheckStatusAsync<Permissions.Camera>();
        if (status != PermissionStatus.Granted)
        {
            status = await Permissions.RequestAsync<Permissions.Camera>();
        }

        return status == PermissionStatus.Granted;
    }
}
```

---

## Key Points

### Development Experience

1. **Hot Reload**: Edit XAML or C# code and see changes without recompiling
2. **Single Project System**: All platform code in one project (`.csproj`)
3. **Visual Studio Integration**: Full IDE support in Visual Studio 2022
4. **XAML Previewer**: Preview XAML changes in real-time
5. **MVVM Toolkit**: Built-in support for MVVM patterns

### Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | Full | Minimum iOS 14 |
| Android | Full | Minimum API 21 (Android 5.0) |
| macOS | Supported | Desktop app support |
| Windows | Supported | Windows 10/11 with WinUI 3 |
| Tizen (Samsung) | Community Support | Maintained by community |

### Core Components

1. **Controls**: Button, Entry, Label, ListView, CollectionView, etc.
2. **Layouts**: Grid, StackLayout, AbsoluteLayout, FlexLayout
3. **Pages**: ContentPage, FlyoutPage, TabbedPage, NavigationPage
4. **Behaviors**: Reusable UI logic attachable to controls
5. **Effects**: Platform-specific visual customizations

### Performance Benefits Over Xamarin.Forms

- 30-50% faster startup times
- Improved XAML parsing performance
- Better memory management
- Native UI rendering on each platform
- Optimized layout calculation

---

## Architecture Overview

### MAUI Application Structure

```
MyApp/
├── Resources/
│   ├── Fonts/
│   ├── Images/
│   └── Styles/
├── Views/
│   ├── MainPage.xaml
│   └── MainPage.xaml.cs
├── ViewModels/
│   └── MainViewModel.cs
├── Models/
│   └── Item.cs
├── Services/
│   ├── IDataService.cs
│   └── DataService.cs
├── App.xaml
├── App.xaml.cs
├── AppShell.xaml
├── MauiProgram.cs
└── MyApp.csproj
```

### Rendering Pipeline

```
XAML/C# Code
    ↓
MAUI Controls
    ↓
Platform-Specific Renderer
    ↓
Native iOS/Android/macOS/Windows UI
    ↓
Device Display
```

---

## Code Examples

### Basic Page with Data Binding

**MainPage.xaml:**
```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="TodoApp.MainPage"
             Title="Todo App">

    <VerticalStackLayout Padding="20" Spacing="10">
        <!-- Entry for new todo -->
        <Entry x:Name="TodoEntry"
               Placeholder="Enter a new todo"
               Text="{Binding NewTodoText}"/>

        <!-- Button to add todo -->
        <Button Text="Add Todo"
                Command="{Binding AddTodoCommand}"
                BackgroundColor="#512BD4"/>

        <!-- List of todos -->
        <CollectionView ItemsSource="{Binding Todos}"
                       SelectionMode="Single"
                       SelectionChangedCommand="{Binding TodoSelectedCommand}"
                       SelectionChangedCommandParameter="{Binding SelectedItem, Source={RelativeSource Self}}">
            <CollectionView.ItemTemplate>
                <DataTemplate>
                    <StackLayout Padding="10" Spacing="5">
                        <Label Text="{Binding Title}"
                               FontSize="16"
                               FontAttributes="Bold"/>
                        <Label Text="{Binding Description}"
                               FontSize="12"/>
                        <Label Text="{Binding CreatedDate, StringFormat='{0:g}'}"
                               FontSize="10"/>
                    </StackLayout>
                </DataTemplate>
            </CollectionView.ItemTemplate>
        </CollectionView>
    </VerticalStackLayout>

</ContentPage>
```

**MainPage.xaml.cs:**
```csharp
using TodoApp.ViewModels;

namespace TodoApp;

public partial class MainPage : ContentPage
{
    private readonly MainViewModel _viewModel;

    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.LoadTodosAsync();
    }
}
```

### ViewModel with Commands

```csharp
using System.Collections.ObjectModel;
using System.Windows.Input;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using TodoApp.Models;
using TodoApp.Services;

namespace TodoApp.ViewModels;

public partial class MainViewModel : ObservableObject
{
    private readonly ITodoService _todoService;
    private readonly INotificationService _notificationService;

    [ObservableProperty]
    private string newTodoText;

    [ObservableProperty]
    private ObservableCollection<Todo> todos = new();

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private Todo selectedTodo;

    public MainViewModel(ITodoService todoService, INotificationService notificationService)
    {
        _todoService = todoService;
        _notificationService = notificationService;
    }

    [RelayCommand]
    public async Task LoadTodosAsync()
    {
        try
        {
            IsLoading = true;
            var todoList = await _todoService.GetTodosAsync();

            Todos.Clear();
            foreach (var todo in todoList)
            {
                Todos.Add(todo);
            }
        }
        catch (Exception ex)
        {
            await _notificationService.ShowErrorAsync("Failed to load todos", ex.Message);
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    public async Task AddTodoAsync()
    {
        if (string.IsNullOrWhiteSpace(NewTodoText))
        {
            await _notificationService.ShowWarningAsync("Empty Todo", "Please enter a todo");
            return;
        }

        try
        {
            var newTodo = new Todo
            {
                Title = NewTodoText,
                CreatedDate = DateTime.Now,
                IsCompleted = false
            };

            var savedTodo = await _todoService.CreateTodoAsync(newTodo);
            Todos.Add(savedTodo);
            NewTodoText = string.Empty;

            await _notificationService.ShowSuccessAsync("Success", "Todo added successfully");
        }
        catch (Exception ex)
        {
            await _notificationService.ShowErrorAsync("Error", ex.Message);
        }
    }

    [RelayCommand]
    public async Task TodoSelectedAsync(Todo todo)
    {
        if (todo == null) return;

        bool result = await Shell.Current.DisplayAlert(
            "Delete Todo?",
            $"Are you sure you want to delete '{todo.Title}'?",
            "Delete", "Cancel");

        if (result)
        {
            try
            {
                await _todoService.DeleteTodoAsync(todo.Id);
                Todos.Remove(todo);
                await _notificationService.ShowSuccessAsync("Success", "Todo deleted");
            }
            catch (Exception ex)
            {
                await _notificationService.ShowErrorAsync("Error", ex.Message);
            }
        }

        SelectedTodo = null;
    }

    [RelayCommand]
    public async Task ToggleTodoAsync(Todo todo)
    {
        try
        {
            todo.IsCompleted = !todo.IsCompleted;
            await _todoService.UpdateTodoAsync(todo);
        }
        catch (Exception ex)
        {
            todo.IsCompleted = !todo.IsCompleted; // Revert
            await _notificationService.ShowErrorAsync("Error", ex.Message);
        }
    }
}
```

### Service Layer with Dependency Injection

```csharp
// Service Interface
public interface ITodoService
{
    Task<List<Todo>> GetTodosAsync();
    Task<Todo> GetTodoAsync(int id);
    Task<Todo> CreateTodoAsync(Todo todo);
    Task<Todo> UpdateTodoAsync(Todo todo);
    Task DeleteTodoAsync(int id);
}

// Service Implementation
public class TodoService : ITodoService
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl = "https://api.example.com";

    public TodoService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Todo>> GetTodosAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_baseUrl}/todos");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Todo>>(json) ?? new List<Todo>();
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"HTTP Error: {ex.Message}");
            throw;
        }
    }

    public async Task<Todo> GetTodoAsync(int id)
    {
        var response = await _httpClient.GetAsync($"{_baseUrl}/todos/{id}");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<Todo>(json);
    }

    public async Task<Todo> CreateTodoAsync(Todo todo)
    {
        var json = JsonSerializer.Serialize(todo);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_baseUrl}/todos", content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<Todo>(responseJson);
    }

    public async Task<Todo> UpdateTodoAsync(Todo todo)
    {
        var json = JsonSerializer.Serialize(todo);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PutAsync($"{_baseUrl}/todos/{todo.Id}", content);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<Todo>(responseJson);
    }

    public async Task DeleteTodoAsync(int id)
    {
        var response = await _httpClient.DeleteAsync($"{_baseUrl}/todos/{id}");
        response.EnsureSuccessStatusCode();
    }
}
```

### App Shell and Navigation

```csharp
// AppShell.xaml
<?xml version="1.0" encoding="UTF-8" ?>
<Shell
    x:Class="TodoApp.AppShell"
    xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">

    <TabBar>
        <ShellContent
            Title="Todos"
            Icon="ic_todos.png"
            ContentTemplate="{DataTemplate local:MainPage}"
            Route="MainPage" />

        <ShellContent
            Title="Completed"
            Icon="ic_completed.png"
            ContentTemplate="{DataTemplate local:CompletedPage}"
            Route="CompletedPage" />

        <ShellContent
            Title="Settings"
            Icon="ic_settings.png"
            ContentTemplate="{DataTemplate local:SettingsPage}"
            Route="SettingsPage" />
    </TabBar>

</Shell>

// Navigation in ViewModel
[RelayCommand]
public async Task NavigateToDetailAsync(int todoId)
{
    await Shell.Current.GoToAsync($"detail?id={todoId}");
}

// Handle navigation with query parameters
[QueryProperty(nameof(TodoId), "id")]
public partial class DetailPage : ContentPage
{
    [ObservableProperty]
    private int todoId;

    partial void OnTodoIdChanged(int value)
    {
        // Load todo based on ID
        var viewModel = (DetailViewModel)BindingContext;
        viewModel.LoadTodoCommand.Execute(value);
    }
}
```

### Custom Controls and Styling

```csharp
// Custom Control
public partial class RatingControl : StackLayout
{
    public static readonly BindableProperty RatingProperty =
        BindableProperty.Create(
            nameof(Rating),
            typeof(int),
            typeof(RatingControl),
            defaultValue: 0,
            propertyChanged: OnRatingChanged);

    public int Rating
    {
        get => (int)GetValue(RatingProperty);
        set => SetValue(RatingProperty, value);
    }

    public RatingControl()
    {
        InitializeComponent();
        Orientation = StackOrientation.Horizontal;
        Spacing = 5;
        DrawRating();
    }

    private static void OnRatingChanged(BindableObject bindable, object oldValue, object newValue)
    {
        var control = (RatingControl)bindable;
        control.DrawRating();
    }

    private void DrawRating()
    {
        Children.Clear();
        for (int i = 0; i < 5; i++)
        {
            var star = new Label
            {
                Text = i < Rating ? "★" : "☆",
                FontSize = 24,
                TextColor = i < Rating ? Colors.Gold : Colors.Gray
            };

            var tapGesture = new TapGestureRecognizer
            {
                Command = new Command(() => Rating = i + 1)
            };
            star.GestureRecognizers.Add(tapGesture);

            Children.Add(star);
        }
    }
}

// Usage in XAML
<local:RatingControl Rating="{Binding CurrentRating, Mode=TwoWay}"/>

// Global Styles
<Application.Resources>
    <ResourceDictionary>
        <Style TargetType="Button">
            <Setter Property="BackgroundColor" Value="#512BD4"/>
            <Setter Property="TextColor" Value="White"/>
            <Setter Property="CornerRadius" Value="8"/>
            <Setter Property="Padding" Value="16,12"/>
        </Style>

        <Style TargetType="Label" x:Key="HeadingStyle">
            <Setter Property="FontSize" Value="24"/>
            <Setter Property="FontAttributes" Value="Bold"/>
            <Setter Property="TextColor" Value="#212121"/>
        </Style>

        <Color x:Key="PrimaryColor">#512BD4</Color>
        <Color x:Key="AccentColor">#DCC526</Color>
        <Color x:Key="BackgroundColor">#FFFFFF</Color>
    </ResourceDictionary>
</Application.Resources>
```

### Platform-Specific Code

```csharp
using TodoApp.Platforms;

namespace TodoApp.Services;

public interface IClipboardService
{
    Task<string> GetClipboardTextAsync();
    Task SetClipboardTextAsync(string text);
}

#if IOS
public partial class ClipboardService : IClipboardService
{
    public async Task<string> GetClipboardTextAsync()
    {
        return UIPasteboard.General.String ?? string.Empty;
    }

    public async Task SetClipboardTextAsync(string text)
    {
        UIPasteboard.General.String = text;
        await Task.CompletedTask;
    }
}
#elif ANDROID
public partial class ClipboardService : IClipboardService
{
    public async Task<string> GetClipboardTextAsync()
    {
        var clipboardManager = Platform.CurrentActivity?.GetSystemService(
            Android.Content.Context.ClipboardService) as Android.Content.ClipboardManager;

        return clipboardManager?.PrimaryClip?.GetItemAt(0)?.Text?.ToString() ?? string.Empty;
    }

    public async Task SetClipboardTextAsync(string text)
    {
        var clipboardManager = Platform.CurrentActivity?.GetSystemService(
            Android.Content.Context.ClipboardService) as Android.Content.ClipboardManager;

        var clip = Android.Content.ClipData.NewPlainText("Clipboard", text);
        clipboardManager?.PrimaryClip = clip;
        await Task.CompletedTask;
    }
}
#else
public partial class ClipboardService : IClipboardService
{
    public async Task<string> GetClipboardTextAsync()
    {
        return await Clipboard.Default.GetTextAsync() ?? string.Empty;
    }

    public async Task SetClipboardTextAsync(string text)
    {
        await Clipboard.Default.SetTextAsync(text);
    }
}
#endif
```

### MauiProgram Configuration

```csharp
using Microsoft.Maui;
using Microsoft.Maui.Hosting;
using CommunityToolkit.Mvvm;
using TodoApp.Views;
using TodoApp.ViewModels;
using TodoApp.Services;

namespace TodoApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            })
            .ConfigureServices(services =>
            {
                // Register Services
                services.AddSingleton<HttpClient>(new HttpClient
                {
                    BaseAddress = new Uri("https://api.example.com")
                });

                services.AddSingleton<ITodoService, TodoService>();
                services.AddSingleton<INotificationService, NotificationService>();
                services.AddSingleton<INavigationService, NavigationService>();
                services.AddSingleton<IClipboardService, ClipboardService>();

                // Register ViewModels
                services.AddSingleton<MainViewModel>();
                services.AddSingleton<DetailViewModel>();
                services.AddSingleton<SettingsViewModel>();

                // Register Views
                services.AddSingleton<MainPage>();
                services.AddSingleton<DetailPage>();
                services.AddSingleton<SettingsPage>();
            });

        return builder.Build();
    }
}
```

---

## Best Practices

### MVVM Pattern Adherence

Always separate concerns cleanly:

```csharp
// ViewModel
public partial class ItemListViewModel : ObservableObject
{
    private readonly IItemService _itemService;

    [ObservableProperty]
    private ObservableCollection<ItemViewModel> items;

    [RelayCommand]
    public async Task LoadItemsAsync()
    {
        var items = await _itemService.GetItemsAsync();
        var viewModels = items.Select(i => new ItemViewModel(i)).ToList();
        Items = new ObservableCollection<ItemViewModel>(viewModels);
    }
}

// Never put business logic in code-behind
public partial class ItemListPage : ContentPage
{
    public ItemListPage(ItemListViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await ((ItemListViewModel)BindingContext).LoadItemsAsync();
    }
}
```

### Proper Resource Management

Always dispose of resources properly:

```csharp
public partial class CameraViewModel : IAsyncDisposable
{
    private CameraSource _cameraSource;

    public async ValueTask DisposeAsync()
    {
        if (_cameraSource != null)
        {
            await _cameraSource.StopAsync();
            _cameraSource?.Dispose();
        }
    }
}
```

### Use MVVM Toolkit

Leverage the MVVM Community Toolkit for cleaner code:

```csharp
// With MVVM Toolkit
public partial class UserViewModel : ObservableObject
{
    [ObservableProperty]
    private string firstName;

    [ObservableProperty]
    private string lastName;

    [RelayCommand]
    private void SaveUser()
    {
        // Save logic
    }
}

// vs manual implementation
public class UserViewModel : INotifyPropertyChanged
{
    private string _firstName;
    public string FirstName
    {
        get => _firstName;
        set
        {
            if (_firstName != value)
            {
                _firstName = value;
                OnPropertyChanged();
            }
        }
    }

    public event PropertyChangedEventHandler PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}
```

### Async/Await Best Practices

Always use async properly:

```csharp
// Good
[RelayCommand]
public async Task LoadDataAsync()
{
    try
    {
        IsLoading = true;
        var data = await _service.FetchDataAsync();
        Items = data;
    }
    catch (Exception ex)
    {
        await DisplayErrorAsync(ex);
    }
    finally
    {
        IsLoading = false;
    }
}

// Avoid
[RelayCommand]
public void LoadData()
{
    // Don't block on async operations
    _service.FetchDataAsync().Wait(); // BAD
}
```

### Dependency Injection Configuration

Register services properly:

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppServices(this IServiceCollection services)
    {
        services.AddSingleton<HttpClient>();
        services.AddSingleton<IItemService, ItemService>();
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<INotificationService, NotificationService>();

        // ViewModels
        services.AddSingleton<MainViewModel>();
        services.AddTransient<DetailViewModel>();

        // Views
        services.AddSingleton<MainPage>();
        services.AddTransient<DetailPage>();

        return services;
    }
}

// Usage in MauiProgram
public static MauiApp CreateMauiApp()
{
    var builder = MauiApp.CreateBuilder()
        .UseMauiApp<App>()
        .ConfigureServices(services => services.AddAppServices());

    return builder.Build();
}
```

### Error Handling

Implement comprehensive error handling:

```csharp
public interface INotificationService
{
    Task ShowSuccessAsync(string title, string message);
    Task ShowErrorAsync(string title, string message);
    Task ShowWarningAsync(string title, string message);
    Task<bool> ConfirmAsync(string title, string message);
}

public class NotificationService : INotificationService
{
    public async Task ShowErrorAsync(string title, string message)
    {
        await Application.Current?.MainPage?.DisplayAlert(
            title, message, "OK");
    }

    public async Task<bool> ConfirmAsync(string title, string message)
    {
        return await Application.Current?.MainPage?.DisplayAlert(
            title, message, "Yes", "No") ?? false;
    }
}

// Usage
try
{
    await _service.DoWorkAsync();
    await _notificationService.ShowSuccessAsync("Success", "Operation completed");
}
catch (ValidationException ex)
{
    await _notificationService.ShowWarningAsync("Validation Error", ex.Message);
}
catch (HttpRequestException ex)
{
    await _notificationService.ShowErrorAsync("Network Error",
        "Failed to reach the server");
}
catch (Exception ex)
{
    Debug.WriteLine($"Unexpected error: {ex}");
    await _notificationService.ShowErrorAsync("Error", "An unexpected error occurred");
}
```

### Hot Reload Optimization

Structure code for effective hot reload:

```csharp
// Good - Can hot reload
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // Load data here
    }
}

// Avoid - Can't hot reload static references
public partial class MainPage : ContentPage
{
    public static MainPage Instance { get; set; }

    public MainPage()
    {
        InitializeComponent();
        Instance = this;
    }
}
```

---

## Common Pitfalls

### Blocking UI Thread

```csharp
// WRONG - Blocks UI
private void LoadData()
{
    var result = _service.GetDataAsync().Result;
    Items = result;
}

// CORRECT - Non-blocking
private async void LoadData()
{
    var result = await _service.GetDataAsync();
    Items = result;
}
```

### Memory Leaks from Event Handlers

```csharp
// WRONG - Can cause memory leak
public partial class MyPage : ContentPage
{
    private MyViewModel _viewModel;

    public MyPage()
    {
        InitializeComponent();
        _viewModel = new MyViewModel();
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;
    }

    private void ViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
    {
        // Handle change
    }
}

// CORRECT - Proper cleanup
public partial class MyPage : ContentPage, IDisposable
{
    private MyViewModel _viewModel;

    public MyPage()
    {
        InitializeComponent();
        _viewModel = new MyViewModel();
        _viewModel.PropertyChanged += ViewModel_PropertyChanged;
    }

    private void ViewModel_PropertyChanged(object sender, PropertyChangedEventArgs e)
    {
        // Handle change
    }

    public void Dispose()
    {
        if (_viewModel != null)
        {
            _viewModel.PropertyChanged -= ViewModel_PropertyChanged;
        }
    }
}
```

### Incorrect Binding Context

```csharp
// WRONG
public partial class DetailPage : ContentPage
{
    public DetailPage()
    {
        InitializeComponent();
        // BindingContext not set - bindings won't work
    }
}

// CORRECT
public partial class DetailPage : ContentPage
{
    public DetailPage(DetailViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
```

### Network Operations Without Error Handling

```csharp
// WRONG - No error handling
[RelayCommand]
public async Task LoadAsync()
{
    var data = await _service.FetchAsync();
    Items = data;
}

// CORRECT - Proper error handling
[RelayCommand]
public async Task LoadAsync()
{
    try
    {
        IsLoading = true;
        var data = await _service.FetchAsync();
        Items = new ObservableCollection<Item>(data);
        Error = null;
    }
    catch (HttpRequestException ex)
    {
        Error = "Network error. Please check your connection.";
        Debug.WriteLine($"HTTP Error: {ex}");
    }
    catch (Exception ex)
    {
        Error = "An unexpected error occurred.";
        Debug.WriteLine($"Error: {ex}");
    }
    finally
    {
        IsLoading = false;
    }
}
```

### Not Using Relative Binding

```csharp
// WRONG - Creates implicit binding
<Entry Text="{Binding MyProperty}"/>

// CORRECT - More explicit
<Entry Text="{Binding MyProperty, Source={RelativeSource Self}}"/>

// Or use proper BindingContext
<StackLayout BindingContext="{Binding SubViewModel}">
    <Entry Text="{Binding MyProperty}"/>
</StackLayout>
```

### Performance Issues with Large Collections

```csharp
// WRONG - Slow with many items
<ListView ItemsSource="{Binding Items}">
    <ListView.ItemTemplate>
        <DataTemplate>
            <StackLayout Padding="20">
                <!-- Complex layout -->
            </StackLayout>
        </DataTemplate>
    </ListView.ItemTemplate>
</ListView>

// CORRECT - Better performance
<CollectionView ItemsSource="{Binding Items}"
                SelectionMode="Single"
                SelectionChangedCommand="{Binding SelectCommand}">
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <StackLayout Padding="20">
                <!-- Simple, optimized layout -->
            </StackLayout>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

### Ignoring Lifecycle Events

```csharp
// INCOMPLETE - Missing lifecycle handling
public partial class MyPage : ContentPage
{
    private MyViewModel _viewModel;

    public MyPage(MyViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }
}

// COMPLETE - Proper lifecycle
public partial class MyPage : ContentPage
{
    private MyViewModel _viewModel;

    public MyPage(MyViewModel viewModel)
    {
        InitializeComponent();
        _viewModel = viewModel;
        BindingContext = _viewModel;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _viewModel.InitializeAsync();
    }

    protected override async void OnDisappearing()
    {
        base.OnDisappearing();
        await _viewModel.CleanupAsync();
    }
}
```

---

## Performance Considerations

### Minimize Layout Hierarchy

```xaml
<!-- INEFFICIENT - Too many nested layouts -->
<StackLayout>
    <StackLayout>
        <StackLayout>
            <Label Text="Text"/>
        </StackLayout>
    </StackLayout>
</StackLayout>

<!-- EFFICIENT - Flatter structure -->
<Grid RowDefinitions="Auto" ColumnDefinitions="*">
    <Label Text="Text" Grid.Row="0" Grid.Column="0"/>
</Grid>
```

### Use Virtual Collections

```csharp
// For large datasets, use virtualization
public partial class LargeListPage : ContentPage
{
    public LargeListPage()
    {
        InitializeComponent();

        var viewModel = new LargeListViewModel();
        // CollectionView automatically virtualizes items
        BindingContext = viewModel;
    }
}

// Consider pagination for very large datasets
[RelayCommand]
public async Task LoadMoreAsync()
{
    var nextPage = await _service.GetPageAsync(CurrentPage + 1);
    foreach (var item in nextPage)
    {
        Items.Add(item);
    }
    CurrentPage++;
}
```

### Image Optimization

```csharp
// Load images efficiently
<Image Source="large_image.png"
       Aspect="AspectFill"
       HeightRequest="200"
       WidthRequest="200"/>

// Or use caching
public class CachedImageService
{
    private readonly IImageCacheService _cacheService;

    public async Task<ImageSource> GetImageAsync(string url)
    {
        var cached = await _cacheService.GetAsync(url);
        if (cached != null)
            return cached;

        var image = ImageSource.FromUri(new Uri(url));
        await _cacheService.SetAsync(url, image);
        return image;
    }
}
```

### Lazy Loading

```csharp
// Defer initialization of expensive resources
public partial class DetailPage : ContentPage
{
    private DetailViewModel _viewModel;
    private bool _initialized = false;

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        if (!_initialized)
        {
            await _viewModel.LoadExpensiveDataAsync();
            _initialized = true;
        }
    }
}
```

### Binding Performance

```csharp
// Use INotifyCollectionChanged efficiently
[RelayCommand]
public async Task LoadItemsAsync()
{
    IsLoading = true;

    // Batch updates for better performance
    var itemsToAdd = await _service.GetItemsAsync();

    // Clear and repopulate in one go
    Items.Clear();
    foreach (var item in itemsToAdd)
    {
        Items.Add(item);
    }

    IsLoading = false;
}

// Don't rebind excessively
[RelayCommand]
public void UpdateBinding()
{
    // Instead of:
    // BindingContext = null;
    // BindingContext = _viewModel;

    // Use property notifications:
    OnPropertyChanged(nameof(MyProperty));
}
```

### Background Operations

```csharp
// Use background threads for heavy operations
[RelayCommand]
public async Task ProcessDataAsync()
{
    try
    {
        // Heavy processing on background thread
        var result = await Task.Run(() => ExpensiveOperation());

        // Update UI on main thread
        MainThread.BeginInvokeOnMainThread(() =>
        {
            Result = result;
        });
    }
    catch (Exception ex)
    {
        Debug.WriteLine($"Error: {ex}");
    }
}

private object ExpensiveOperation()
{
    // CPU-intensive work
    return new object();
}
```

---

## Real-world Scenarios

### Scenario 1: Building a Task Management App

```csharp
// Project structure
TaskManager/
├── Models/
│   ├── Task.cs
│   └── Project.cs
├── Services/
│   ├── ITaskService.cs
│   ├── TaskService.cs
│   ├── INotificationService.cs
│   └── NotificationService.cs
├── ViewModels/
│   ├── TaskListViewModel.cs
│   └── TaskDetailViewModel.cs
├── Views/
│   ├── TaskListPage.xaml
│   ├── TaskDetailPage.xaml
│   └── AppShell.xaml
└── MauiProgram.cs

// Model
public class Task
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public Priority Priority { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsCompleted { get; set; }
    public int ProjectId { get; set; }
}

// ViewModel
public partial class TaskListViewModel : ObservableObject
{
    private readonly ITaskService _taskService;
    private readonly INotificationService _notificationService;

    [ObservableProperty]
    private ObservableCollection<TaskItemViewModel> tasks;

    [ObservableProperty]
    private Priority selectedFilter = Priority.All;

    [RelayCommand]
    public async Task LoadTasksAsync()
    {
        try
        {
            var tasks = await _taskService.GetTasksAsync(SelectedFilter);
            Tasks = new ObservableCollection<TaskItemViewModel>(
                tasks.Select(t => new TaskItemViewModel(t)));
        }
        catch (Exception ex)
        {
            await _notificationService.ShowErrorAsync("Error loading tasks", ex.Message);
        }
    }

    [RelayCommand]
    public async Task CompleteTaskAsync(TaskItemViewModel task)
    {
        try
        {
            task.Task.IsCompleted = true;
            await _taskService.UpdateTaskAsync(task.Task);
            await LoadTasksAsync();
            await _notificationService.ShowSuccessAsync("Success", "Task completed");
        }
        catch (Exception ex)
        {
            await _notificationService.ShowErrorAsync("Error", ex.Message);
        }
    }

    [RelayCommand]
    public async Task NavigateToDetailAsync(int taskId)
    {
        await Shell.Current.GoToAsync($"taskdetail?id={taskId}");
    }
}
```

### Scenario 2: Integration with Backend API

```csharp
// Service for REST API integration
public class ApiTaskService : ITaskService
{
    private readonly HttpClient _httpClient;
    private readonly ISecureStorage _secureStorage;
    private const string ApiBaseUrl = "https://api.taskmanager.com";

    public ApiTaskService(HttpClient httpClient, ISecureStorage secureStorage)
    {
        _httpClient = httpClient;
        _secureStorage = secureStorage;
    }

    public async Task<List<Task>> GetTasksAsync(Priority filter)
    {
        try
        {
            var token = await _secureStorage.GetAsync("api_token");
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            var url = $"{ApiBaseUrl}/tasks";
            if (filter != Priority.All)
                url += $"?priority={filter}";

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<List<Task>>(json) ?? new();
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"API Error: {ex.Message}");
            throw;
        }
    }

    public async Task<bool> UpdateTaskAsync(Task task)
    {
        var json = JsonSerializer.Serialize(task);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await _httpClient.PutAsync(
            $"{ApiBaseUrl}/tasks/{task.Id}", content);

        return response.IsSuccessStatusCode;
    }
}
```

### Scenario 3: Offline-First Architecture

```csharp
// Hybrid service supporting offline operations
public class HybridTaskService : ITaskService
{
    private readonly ILocalDatabase _localDb;
    private readonly IApiTaskService _apiService;
    private readonly IConnectivityService _connectivity;
    private readonly ISyncService _syncService;

    public async Task<List<Task>> GetTasksAsync(Priority filter)
    {
        if (!await _connectivity.IsConnectedAsync())
        {
            // Load from local database when offline
            return await _localDb.GetTasksAsync(filter);
        }

        try
        {
            // Try to get fresh data from API
            var tasks = await _apiService.GetTasksAsync(filter);

            // Cache locally
            await _localDb.SaveTasksAsync(tasks);

            return tasks;
        }
        catch (HttpRequestException)
        {
            // Fall back to cached data
            return await _localDb.GetTasksAsync(filter);
        }
    }

    public async Task<bool> UpdateTaskAsync(Task task)
    {
        // Always save locally
        await _localDb.UpdateTaskAsync(task);

        if (await _connectivity.IsConnectedAsync())
        {
            try
            {
                // Sync to server
                var result = await _apiService.UpdateTaskAsync(task);
                if (result)
                {
                    // Mark as synced
                    task.IsSynced = true;
                    await _localDb.UpdateTaskAsync(task);
                }
                return result;
            }
            catch (HttpRequestException)
            {
                // Mark for later sync
                task.PendingSync = true;
                await _localDb.UpdateTaskAsync(task);
                return true;
            }
        }
        else
        {
            // Mark for sync when online
            task.PendingSync = true;
            await _localDb.UpdateTaskAsync(task);
            return true;
        }
    }
}
```

---

## Interview Points

### Q1: What's the difference between MAUI and Xamarin.Forms?

**Answer:**
MAUI is the modern successor to Xamarin.Forms with several key improvements:

- **Single Project System**: MAUI uses one project for all platforms, while Xamarin.Forms required separate projects
- **Performance**: MAUI is 30-50% faster with improved XAML parsing and native rendering
- **Modern Patterns**: Better MVVM support, built-in dependency injection, hot reload
- **Platform Convergence**: More unified API across platforms with less platform-specific code needed
- **.NET 6+ Integration**: Full integration with modern .NET features like top-level statements and records

### Q2: How does code sharing work in MAUI?

**Answer:**
Code sharing in MAUI happens at multiple levels:

1. **Business Logic**: Core services, models, and ViewModels are 100% shared
2. **UI Layer**: XAML markup is shared, with platform-specific styles applied via conditional compilation
3. **Platform-Specific Code**: Using conditional compilation directives and runtime platform detection for truly platform-specific features

### Q3: What are the best practices for MVVM in MAUI?

**Answer:**
Key MVVM practices in MAUI:

- Use `ObservableObject` from MVVM Toolkit for automatic property change notifications
- Use `RelayCommand` for command binding instead of manual ICommand implementation
- Keep Views as pure UI, all logic in ViewModels
- Use dependency injection to inject services into ViewModels
- Implement proper async/await patterns in commands
- Use data binding for all property updates

### Q4: How do you handle navigation in MAUI?

**Answer:**
MAUI provides shell-based navigation:

```csharp
// Define routes in AppShell.xaml
<Shell Route="detail" ContentTemplate="{DataTemplate local:DetailPage}"/>

// Navigate from ViewModel
await Shell.Current.GoToAsync($"detail?id={itemId}");

// Handle query parameters in Page
[QueryProperty(nameof(ItemId), "id")]
public partial class DetailPage : ContentPage
{
    [ObservableProperty]
    private int itemId;

    partial void OnItemIdChanged(int value)
    {
        // Load item data
    }
}
```

### Q5: What's the role of Hot Reload in MAUI development?

**Answer:**
Hot Reload allows developers to modify XAML and C# code without recompiling:

- **XAML Hot Reload**: Edit UI markup and see changes instantly
- **C# Hot Reload**: Modify method bodies and see changes without rebuilding
- **Increases Productivity**: Significantly speeds up development iteration
- **Requires Proper Structure**: Code should avoid static references and singletons for effective hot reload

### Q6: How do you optimize MAUI app performance?

**Answer:**
Key performance optimization strategies:

- **Minimize Layout Hierarchy**: Use flat layouts instead of deeply nested structures
- **Use CollectionView**: Better virtual­ization than ListView for large lists
- **Image Optimization**: Load images at appropriate sizes, implement caching
- **Lazy Loading**: Defer expensive operations until needed
- **Background Operations**: Use Task.Run for CPU-intensive work
- **Binding Efficiency**: Minimize property changes and avoid rebinding

### Q7: Describe error handling strategy in MAUI applications.

**Answer:**
A comprehensive error handling approach:

```csharp
try
{
    // Operation
}
catch (ValidationException ex)
{
    // Handle validation errors (user-facing)
    await _notificationService.ShowWarningAsync("Validation Error", ex.Message);
}
catch (HttpRequestException ex)
{
    // Handle network errors
    await _notificationService.ShowErrorAsync("Network Error",
        "Unable to reach the server");
}
catch (Exception ex)
{
    // Log unexpected errors
    Debug.WriteLine($"Unexpected error: {ex}");
    await _notificationService.ShowErrorAsync("Error",
        "An unexpected error occurred");
}
```

### Q8: What patterns support offline functionality in MAUI?

**Answer:**
Offline-first patterns include:

- **Local Database**: SQLite for storing data locally
- **Synchronization**: Sync local changes with server when online
- **Hybrid Services**: Services that use local data when offline, API when online
- **Conflict Resolution**: Handling conflicts between local and remote changes
- **User Feedback**: Notifying users about sync status

---

## Further Reading

### Official Documentation

- [Microsoft MAUI Documentation](https://learn.microsoft.com/en-us/dotnet/maui/)
- [MAUI GitHub Repository](https://github.com/dotnet/maui)
- [MAUI Release Notes](https://learn.microsoft.com/en-us/dotnet/maui/release-notes/)

### Community Resources

- [MAUI Community Toolkit](https://github.com/CommunityToolkit/Maui)
- [MVVM Community Toolkit](https://github.com/CommunityToolkit/dotnet)
- [MAUI Samples](https://github.com/dotnet/maui-samples)

### Related Topics

- [Blazor Web Development](/docs/csharp/blazor)
- [ASP.NET Core](/docs/csharp/aspnet-core)
- [Dependency Injection in .NET](/docs/csharp/dependency-injection)
- [Async/Await Patterns](/docs/csharp/async)
- [MVVM Design Pattern](/docs/architecture/mvvm)

### Books

- "MAUI in Action" by Javier Martin Garcia
- "Xamarin.Forms Projects" by Daniel Hindrikes (foundation concepts)
- "Pro C# with .NET" by Andrew Troelsen (C# fundamentals)

### Advanced Topics

- Custom Renderers for platform-specific behavior
- Plugin architecture with MAUI
- Testing MAUI applications with xUnit and Moq
- Building libraries for MAUI ecosystem
- Performance profiling and optimization
- Continuous integration/deployment for MAUI apps

---

## Summary

.NET MAUI represents a significant evolution in cross-platform mobile and desktop development. By leveraging C# and a single codebase, developers can build native applications for iOS, Android, macOS, and Windows with improved performance and developer experience compared to previous frameworks like Xamarin.Forms.

The framework emphasizes clean architecture through MVVM patterns, first-class dependency injection, and modern .NET features. Success with MAUI depends on understanding its core principles—code sharing, platform convergence, and proper separation of concerns—while avoiding common pitfalls like blocking the UI thread or ignoring lifecycle events.

Whether building productivity apps, content-focused applications, or enterprise solutions, MAUI provides the tools and patterns necessary to create efficient, maintainable, and native-feeling applications across multiple platforms without code duplication.
