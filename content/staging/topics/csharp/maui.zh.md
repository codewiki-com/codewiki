---
title: .NET MAUI 跨平台开发
description: 掌握 .NET MAUI：从 UI 设计到跨平台部署的完整指南
track: csharp
section: dotnet
difficulty: intermediate
tags:
  - MAUI
  - 跨平台
  - 移动开发
  - 跨平台UI
  - C#
status: imported
origin: old/src/content/docs/csharp/maui.zh.md
divergence: 0.161
issues:
  - order-mismatch
legacy:
  category: CSharp
  subcategory: 跨平台开发
  order: 15
  lastUpdated: 2026-01-07
---

.NET MAUI（Multi-platform App UI）是微软推出的现代跨平台 UI 框架，允许开发者使用单一的 C# 代码库为 iOS、Android、macOS 和 Windows 构建原生应用。本文将深入探讨 MAUI 的核心概念、原理、最佳实践和实战应用。

## 概念解释

### 什么是 .NET MAUI？

.NET MAUI 是 Xamarin.Forms 的演进版本，提供了一个统一的框架来为多个操作系统平台构建原生应用。使用 MAUI，开发者可以：

- **共享代码**：使用单一的 C# 代码库
- **跨平台支持**：iOS、Android、macOS 和 Windows
- **原生性能**：调用平台特定的 API
- **声明式 UI**：使用 XAML 定义用户界面

### MAUI 的核心组件

1. **控制层 (Controls)**：如 Button、Entry、ListView 等
2. **布局层 (Layouts)**：StackLayout、Grid、FlexLayout 等
3. **页面层 (Pages)**：ContentPage、NavigationPage、TabbedPage 等
4. **数据绑定 (Data Binding)**：MVVM 支持
5. **导航系统 (Navigation)**：支持复杂的应用导航流程

### MAUI vs Xamarin.Forms

| 特性 | MAUI | Xamarin.Forms |
|------|------|---------------|
| 支持的平台 | iOS, Android, macOS, Windows | iOS, Android, UWP |
| .NET 版本 | .NET 6+ | 不支持 .NET Core |
| 性能 | 更优 | 相对较低 |
| API 访问 | 更便捷 | 需要平台特定代码 |
| 维护状态 | 主动维护 | 已停止 |

## 核心原理

### MAUI 架构设计

```
┌─────────────────────────────────────┐
│   应用层 (C# 代码 + XAML)           │
├─────────────────────────────────────┤
│   MAUI 框架层                       │
│  ┌──────────────┬──────────────┐   │
│  │  控制层      │  导航系统    │   │
│  │  数据绑定    │  资源管理    │   │
│  └──────────────┴──────────────┘   │
├─────────────────────────────────────┤
│   平台适配层 (Handler)              │
│  ┌──────────────────────────────┐  │
│  │ iOS | Android | macOS | Win  │  │
│  └──────────────────────────────┘  │
├─────────────────────────────────────┤
│   原生 API 层                       │
└─────────────────────────────────────┘
```

### Handler 模式

MAUI 使用 Handler 模式实现跨平台适配。每个 MAUI 控制都对应一个 Handler，负责将 MAUI 属性映射到原生控制的属性：

```
MAUI 控制 (Button)
    ↓
Handler (ButtonHandler)
    ↓
原生控制 (UIButton on iOS, Android.Widget.Button on Android)
```

### 数据绑定流程

```
模型对象 (实现 INotifyPropertyChanged)
    ↓
绑定引擎 (识别属性变化)
    ↓
更新 UI 控制
    ↓
用户交互 (返回命令或事件)
```

### 依赖注入与服务容器

MAUI 内置依赖注入容器，允许在应用启动时配置服务：

```csharp
MauiApp app = MauiApp.CreateBuilder()
    .UseMauiApp<App>()
    .Services
    .AddSingleton<MainPage>()
    .AddSingleton<MainViewModel>()
    .AddSingleton<IApiService, ApiService>()
    .BuildServiceProvider();
```

## 核心要点

### 单一代码库的优势

- **减少代码重复**：跨平台共享业务逻辑
- **降低维护成本**：统一的更新和修复
- **加快开发速度**：一次编写，多平台运行

### XAML 声明式 UI

XAML (eXtensible Application Markup Language) 允许声明式定义 UI：

```xaml
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui">
    <VerticalStackLayout Padding="20">
        <Label Text="欢迎使用 MAUI!" FontSize="24" HorizontalOptions="Center"/>
        <Entry Placeholder="输入用户名" x:Name="UsernameEntry"/>
        <Button Text="登录" Clicked="OnLoginClicked"/>
    </VerticalStackLayout>
</ContentPage>
```

### 数据绑定和 MVVM 模式

MAUI 完全支持 MVVM（Model-View-ViewModel）架构：

```csharp
// ViewModel
public class LoginViewModel : INotifyPropertyChanged
{
    private string username;
    public string Username
    {
        get => username;
        set => SetProperty(ref username, value);
    }

    public ICommand LoginCommand { get; }

    public LoginViewModel()
    {
        LoginCommand = new Command(OnLogin);
    }

    private void OnLogin()
    {
        // 登录逻辑
    }
}
```

### 资源和样式

MAUI 支持全局资源和样式定义：

```xaml
<Application.Resources>
    <ResourceDictionary>
        <Color x:Key="PrimaryColor">#512BD4</Color>
        <Style x:Key="LabelStyle" TargetType="Label">
            <Setter Property="TextColor" Value="{StaticResource PrimaryColor}"/>
            <Setter Property="FontSize" Value="16"/>
        </Style>
    </ResourceDictionary>
</Application.Resources>
```

### 导航系统

MAUI 提供灵活的导航支持：

- **路由导航**：基于字符串的导航
- **对象导航**：传递对象参数
- **模态页面**：弹出式页面显示
- **选项卡导航**：TabbedPage 支持

## 代码示例

### 示例 1：基本的计数器应用

```csharp
// 项目文件 (.csproj)
<Project Sdk="Microsoft.Maui.Sdk">
    <PropertyGroup>
        <TargetFrameworks>net8.0-android;net8.0-ios;net8.0-maccatalyst;net8.0-windows10.0.19041.0</TargetFrameworks>
        <OutputType>Exe</OutputType>
        <UseMaui>true</UseMaui>
        <SingleProject>true</SingleProject>
    </PropertyGroup>
</Project>
```

```csharp
// MauiProgram.cs - 应用配置
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
            });

        return builder.Build();
    }
}
```

```csharp
// CounterViewModel.cs
public class CounterViewModel : INotifyPropertyChanged
{
    private int count = 0;

    public int Count
    {
        get => count;
        set => SetProperty(ref count, value);
    }

    public ICommand IncrementCommand { get; }

    public CounterViewModel()
    {
        IncrementCommand = new Command(OnIncrement);
    }

    private void OnIncrement()
    {
        Count++;
    }

    protected bool SetProperty<T>(ref T backingStore, T value, [CallerMemberName] string propertyName = "")
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return false;

        backingStore = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
```

```xaml
<!-- MainPage.xaml -->
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="CounterApp.MainPage"
             Title="计数器">

    <VerticalStackLayout Padding="30" Spacing="20">
        <Label
            Text="欢迎使用 MAUI 计数器应用"
            FontSize="24"
            FontAttributes="Bold"
            HorizontalOptions="Center"/>

        <Frame BorderColor="#512BD4" CornerRadius="10" Padding="20">
            <Label
                Text="{Binding Count, StringFormat='当前计数: {0}'}"
                FontSize="36"
                HorizontalOptions="Center"
                TextColor="#512BD4"/>
        </Frame>

        <Button
            Text="递增"
            Command="{Binding IncrementCommand}"
            BackgroundColor="#512BD4"
            TextColor="White"
            FontSize="18"
            Padding="20,10"/>

        <Button
            Text="重置"
            Clicked="OnResetClicked"
            BackgroundColor="#6C757D"
            TextColor="White"
            FontSize="18"
            Padding="20,10"/>
    </VerticalStackLayout>
</ContentPage>
```

```csharp
// MainPage.xaml.cs
public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        BindingContext = new CounterViewModel();
    }

    private void OnResetClicked(object sender, EventArgs e)
    {
        if (BindingContext is CounterViewModel vm)
        {
            vm.Count = 0;
        }
    }
}
```

### 示例 2：TODO 应用（列表和导航）

```csharp
// Models
public class TodoItem
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime CreatedDate { get; set; }
}

// Services
public interface ITodoService
{
    Task<List<TodoItem>> GetTodosAsync();
    Task<TodoItem> GetTodoAsync(int id);
    Task SaveTodoAsync(TodoItem todo);
    Task DeleteTodoAsync(int id);
}

public class TodoService : ITodoService
{
    private List<TodoItem> todos = new();

    public Task<List<TodoItem>> GetTodosAsync()
    {
        return Task.FromResult(todos);
    }

    public Task<TodoItem> GetTodoAsync(int id)
    {
        return Task.FromResult(todos.FirstOrDefault(t => t.Id == id));
    }

    public Task SaveTodoAsync(TodoItem todo)
    {
        var existing = todos.FirstOrDefault(t => t.Id == todo.Id);
        if (existing != null)
        {
            todos.Remove(existing);
        }
        todos.Add(todo);
        return Task.CompletedTask;
    }

    public Task DeleteTodoAsync(int id)
    {
        var todo = todos.FirstOrDefault(t => t.Id == id);
        if (todo != null)
            todos.Remove(todo);
        return Task.CompletedTask;
    }
}

// ViewModel
public class TodoListViewModel : INotifyPropertyChanged
{
    private readonly ITodoService todoService;
    private ObservableCollection<TodoItem> todos;
    private bool isLoading;

    public ObservableCollection<TodoItem> Todos
    {
        get => todos;
        set => SetProperty(ref todos, value);
    }

    public bool IsLoading
    {
        get => isLoading;
        set => SetProperty(ref isLoading, value);
    }

    public ICommand LoadTodosCommand { get; }
    public ICommand AddTodoCommand { get; }
    public ICommand DeleteTodoCommand { get; }
    public ICommand SelectTodoCommand { get; }

    public TodoListViewModel(ITodoService todoService)
    {
        this.todoService = todoService;
        Todos = new ObservableCollection<TodoItem>();

        LoadTodosCommand = new Command(async () => await LoadTodos());
        AddTodoCommand = new Command(async () => await AddTodo());
        DeleteTodoCommand = new Command<TodoItem>(async (item) => await DeleteTodo(item));
        SelectTodoCommand = new Command<TodoItem>(async (item) => await SelectTodo(item));
    }

    private async Task LoadTodos()
    {
        IsLoading = true;
        try
        {
            var todoList = await todoService.GetTodosAsync();
            Todos = new ObservableCollection<TodoItem>(todoList);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task AddTodo()
    {
        await Shell.Current.GoToAsync("addtodo");
    }

    private async Task DeleteTodo(TodoItem item)
    {
        bool confirm = await Shell.Current.DisplayAlert(
            "确认删除",
            $"确定要删除 '{item.Title}' 吗？",
            "是",
            "否");

        if (confirm)
        {
            await todoService.DeleteTodoAsync(item.Id);
            Todos.Remove(item);
        }
    }

    private async Task SelectTodo(TodoItem item)
    {
        await Shell.Current.GoToAsync($"todo/{item.Id}");
    }

    protected bool SetProperty<T>(ref T backingStore, T value, [CallerMemberName] string propertyName = "")
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return false;

        backingStore = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
```

```xaml
<!-- TodoListPage.xaml -->
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="TodoApp.TodoListPage"
             Title="我的待办事项">

    <Grid RowDefinitions="*,Auto" Padding="10">
        <!-- 加载指示器 -->
        <ActivityIndicator
            IsRunning="{Binding IsLoading}"
            IsVisible="{Binding IsLoading}"
            Color="#512BD4"/>

        <!-- 待办事项列表 -->
        <CollectionView
            ItemsSource="{Binding Todos}"
            SelectionMode="Single"
            SelectionChangedCommand="{Binding SelectTodoCommand}"
            SelectionChangedCommandParameter="{Binding SelectedItem, Source={RelativeSource Self}}"
            IsVisible="{Binding IsLoading, Converter={StaticResource InvertedBoolConverter}}">
            <CollectionView.ItemTemplate>
                <DataTemplate>
                    <StackLayout Padding="10" Spacing="5">
                        <Frame BorderColor="#E0E0E0" CornerRadius="8" Padding="10" HasShadow="True">
                            <Grid ColumnDefinitions="*,Auto">
                                <StackLayout Spacing="5" Grid.Column="0">
                                    <Label
                                        Text="{Binding Title}"
                                        FontSize="18"
                                        FontAttributes="Bold"/>
                                    <Label
                                        Text="{Binding Description}"
                                        FontSize="14"
                                        Opacity="0.7"/>
                                    <Label
                                        Text="{Binding CreatedDate, StringFormat='{0:yyyy-MM-dd HH:mm}'}"
                                        FontSize="12"
                                        TextColor="#999999"/>
                                </StackLayout>

                                <Button
                                    Grid.Column="1"
                                    Text="删除"
                                    Command="{Binding Source={RelativeSource AncestorType={x:Type ContentPage}}, Path=BindingContext.DeleteTodoCommand}"
                                    CommandParameter="{Binding .}"
                                    BackgroundColor="#DC3545"
                                    TextColor="White"
                                    FontSize="12"
                                    Padding="10,5"
                                    CornerRadius="5"/>
                            </Grid>
                        </Frame>
                    </StackLayout>
                </DataTemplate>
            </CollectionView.ItemTemplate>
        </CollectionView>

        <!-- 添加按钮 -->
        <Button
            Grid.Row="1"
            Text="+ 添加待办事项"
            Command="{Binding AddTodoCommand}"
            BackgroundColor="#512BD4"
            TextColor="White"
            Padding="20,15"
            CornerRadius="25"
            Margin="10"/>
    </Grid>
</ContentPage>
```

### 示例 3：API 集成与网络请求

```csharp
// API 服务接口
public interface IWeatherService
{
    Task<WeatherData> GetWeatherAsync(string city);
}

// 模型
public class WeatherData
{
    public string City { get; set; }
    public double Temperature { get; set; }
    public string Condition { get; set; }
    public double Humidity { get; set; }
}

// API 服务实现
public class WeatherService : IWeatherService
{
    private readonly HttpClient httpClient;
    private const string BaseUrl = "https://api.weather.example.com";

    public WeatherService()
    {
        httpClient = new HttpClient();
    }

    public async Task<WeatherData> GetWeatherAsync(string city)
    {
        try
        {
            var response = await httpClient.GetAsync($"{BaseUrl}/weather?city={city}");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            var weather = JsonSerializer.Deserialize<WeatherData>(content);
            return weather;
        }
        catch (HttpRequestException ex)
        {
            Debug.WriteLine($"API 请求失败: {ex.Message}");
            throw;
        }
    }
}

// ViewModel
public class WeatherViewModel : INotifyPropertyChanged
{
    private readonly IWeatherService weatherService;
    private WeatherData currentWeather;
    private bool isLoading;
    private string errorMessage;

    public WeatherData CurrentWeather
    {
        get => currentWeather;
        set => SetProperty(ref currentWeather, value);
    }

    public bool IsLoading
    {
        get => isLoading;
        set => SetProperty(ref isLoading, value);
    }

    public string ErrorMessage
    {
        get => errorMessage;
        set => SetProperty(ref errorMessage, value);
    }

    public ICommand GetWeatherCommand { get; }

    public WeatherViewModel(IWeatherService weatherService)
    {
        this.weatherService = weatherService;
        GetWeatherCommand = new Command<string>(async (city) => await FetchWeather(city));
    }

    private async Task FetchWeather(string city)
    {
        if (string.IsNullOrWhiteSpace(city))
        {
            ErrorMessage = "请输入城市名称";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            CurrentWeather = await weatherService.GetWeatherAsync(city);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"获取天气信息失败: {ex.Message}";
            CurrentWeather = null;
        }
        finally
        {
            IsLoading = false;
        }
    }

    protected bool SetProperty<T>(ref T backingStore, T value, [CallerMemberName] string propertyName = "")
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return false;

        backingStore = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

// 配置服务
public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .Services
            .AddSingleton<IWeatherService, WeatherService>()
            .AddSingleton<WeatherViewModel>();

        return builder.Build();
    }
}
```

### 示例 4：平台特定代码

```csharp
// 使用条件编译
public class PlatformService
{
#if __IOS__
    public void OpenSettings()
    {
        UIApplication.SharedApplication.OpenUrl(new NSUrl("app-settings:"));
    }
#elif __ANDROID__
    public void OpenSettings()
    {
        var intent = new Android.Content.Intent(
            Android.Provider.Settings.ActionApplicationDetailsSettings,
            Android.Net.Uri.Parse("package:" + Application.Current.PackageName));
        Platform.CurrentActivity.StartActivity(intent);
    }
#else
    public void OpenSettings()
    {
        MainThread.BeginInvokeOnMainThread(() =>
        {
            Shell.Current.DisplayAlert("提示", "此功能仅在移动平台上可用", "确定");
        });
    }
#endif
}

// 使用 MAUI 的 AppInfo 和 Launcher
public class PlatformServiceModern
{
    public async Task OpenAppSettings()
    {
        await AppInfo.ShowSettingsUI();
    }

    public async Task OpenBrowser(string url)
    {
        try
        {
            await Launcher.OpenAsync(new Uri(url));
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("错误", $"无法打开浏览器: {ex.Message}", "确定");
        }
    }

    public async Task MakePhoneCall(string phoneNumber)
    {
        try
        {
            if (PhoneDialer.Default.IsSupported)
            {
                PhoneDialer.Default.Open(phoneNumber);
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("错误", $"无法拨打电话: {ex.Message}", "确定");
        }
    }
}
```

## 最佳实践

### 遵循 MVVM 架构

```csharp
// 创建基础 ViewModel 类
public abstract class BaseViewModel : INotifyPropertyChanged
{
    private bool isBusy;

    public bool IsBusy
    {
        get => isBusy;
        set => SetProperty(ref isBusy, value);
    }

    protected bool SetProperty<T>(
        ref T backingStore,
        T value,
        [CallerMemberName] string propertyName = "")
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return false;

        backingStore = value;
        OnPropertyChanged(propertyName);
        return true;
    }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string propertyName = "")
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

// 使用基础类
public class ProductViewModel : BaseViewModel
{
    private ObservableCollection<Product> products;

    public ObservableCollection<Product> Products
    {
        get => products;
        set => SetProperty(ref products, value);
    }

    public async Task LoadProducts()
    {
        IsBusy = true;
        try
        {
            // 加载产品逻辑
        }
        finally
        {
            IsBusy = false;
        }
    }
}
```

### 有效使用资源和主题

```xaml
<!-- AppShell.xaml -->
<Shell>
    <Shell.Resources>
        <ResourceDictionary>
            <!-- 颜色 -->
            <Color x:Key="Primary">#512BD4</Color>
            <Color x:Key="Secondary">#DFD8F7</Color>
            <Color x:Key="Tertiary">#2B0599</Color>
            <Color x:Key="White">White</Color>
            <Color x:Key="Gray100">#F3F3F3</Color>
            <Color x:Key="Gray200">#E8E8E8</Color>
            <Color x:Key="Gray300">#D3D3D3</Color>
            <Color x:Key="Gray400">#949494</Color>
            <Color x:Key="Gray500">#6C6C6C</Color>
            <Color x:Key="Gray600">#404040</Color>

            <!-- 字体大小 -->
            <x:Double x:Key="FontSizeBody">14</x:Double>
            <x:Double x:Key="FontSizeSubtitle">16</x:Double>
            <x:Double x:Key="FontSizeHeading">24</x:Double>

            <!-- 样式 -->
            <Style x:Key="LargeLabel" TargetType="Label">
                <Setter Property="FontSize" Value="{StaticResource FontSizeHeading}"/>
                <Setter Property="TextColor" Value="{StaticResource Gray600}"/>
            </Style>

            <Style x:Key="MediumLabel" TargetType="Label">
                <Setter Property="FontSize" Value="{StaticResource FontSizeSubtitle}"/>
                <Setter Property="TextColor" Value="{StaticResource Gray500}"/>
            </Style>

            <Style x:Key="SmallLabel" TargetType="Label">
                <Setter Property="FontSize" Value="{StaticResource FontSizeBody}"/>
                <Setter Property="TextColor" Value="{StaticResource Gray400}"/>
            </Style>

            <Style x:Key="PrimaryButton" TargetType="Button">
                <Setter Property="BackgroundColor" Value="{StaticResource Primary}"/>
                <Setter Property="TextColor" Value="{StaticResource White}"/>
                <Setter Property="FontSize" Value="18"/>
                <Setter Property="Padding" Value="30,10"/>
                <Setter Property="CornerRadius" Value="8"/>
            </Style>
        </ResourceDictionary>
    </Shell.Resources>
</Shell>
```

### 处理应用生命周期

```csharp
// App.xaml.cs
public partial class App : Application
{
    public App()
    {
        InitializeComponent();
        MainPage = new AppShell();
    }

    protected override void OnStart()
    {
        // 应用启动
        Debug.WriteLine("应用已启动");
    }

    protected override void OnResume()
    {
        // 应用从后台恢复
        Debug.WriteLine("应用已恢复");
    }

    protected override void OnSleep()
    {
        // 应用进入后台
        Debug.WriteLine("应用已进入后台");
        SaveState();
    }

    private void SaveState()
    {
        // 保存应用状态
        SecureStorage.SetAsync("last_user", "username");
    }
}
```

### 错误处理和日志记录

```csharp
public interface ILogger
{
    void LogDebug(string message);
    void LogInfo(string message);
    void LogWarning(string message);
    void LogError(string message, Exception ex = null);
}

public class Logger : ILogger
{
    public void LogDebug(string message) => Debug.WriteLine($"[DEBUG] {message}");
    public void LogInfo(string message) => Debug.WriteLine($"[INFO] {message}");
    public void LogWarning(string message) => Debug.WriteLine($"[WARN] {message}");
    public void LogError(string message, Exception ex = null)
    {
        Debug.WriteLine($"[ERROR] {message}");
        if (ex != null)
            Debug.WriteLine($"Exception: {ex}");
    }
}

// 在 ViewModel 中使用
public class DataViewModel : BaseViewModel
{
    private readonly IApiService apiService;
    private readonly ILogger logger;

    public DataViewModel(IApiService apiService, ILogger logger)
    {
        this.apiService = apiService;
        this.logger = logger;
    }

    public async Task LoadData()
    {
        try
        {
            logger.LogInfo("开始加载数据");
            var data = await apiService.GetDataAsync();
            logger.LogInfo($"成功加载 {data.Count} 条数据");
        }
        catch (Exception ex)
        {
            logger.LogError("加载数据失败", ex);
            await Shell.Current.DisplayAlert("错误", "加载数据失败，请重试", "确定");
        }
    }
}
```

### 内存管理和资源释放

```csharp
public class ImageViewModel : IDisposable
{
    private HttpClient httpClient;
    private CancellationTokenSource cancellationTokenSource;

    public ImageViewModel()
    {
        httpClient = new HttpClient();
        cancellationTokenSource = new CancellationTokenSource();
    }

    public async Task<ImageSource> LoadImageAsync(string url)
    {
        try
        {
            var response = await httpClient.GetAsync(url, cancellationTokenSource.Token);
            response.EnsureSuccessStatusCode();
            var stream = await response.Content.ReadAsStreamAsync();
            return ImageSource.FromStream(() => stream);
        }
        catch (OperationCanceledException)
        {
            Debug.WriteLine("图片加载已取消");
            return null;
        }
    }

    public void Dispose()
    {
        cancellationTokenSource?.Cancel();
        cancellationTokenSource?.Dispose();
        httpClient?.Dispose();
    }
}
```

## 常见陷阱

### 阻塞主线程

**错误做法**：
```csharp
// 不要这样做！会导致 UI 冻结
public void LoadData()
{
    var data = apiService.GetData();  // 同步调用，阻塞主线程
    UpdateUI(data);
}
```

**正确做法**：
```csharp
// 使用异步操作
public async Task LoadData()
{
    var data = await apiService.GetDataAsync();  // 异步调用
    UpdateUI(data);
}
```

### 不处理集合更新通知

**错误做法**：
```csharp
// 不要直接使用 List<T>
private List<Item> items = new List<Item>();

// 这不会触发 UI 更新
items.Add(new Item());
```

**正确做法**：
```csharp
// 使用 ObservableCollection<T>
private ObservableCollection<Item> items = new();

// 这会自动触发 UI 更新
items.Add(new Item());
```

### 内存泄漏 - 事件订阅未取消

**错误做法**：
```csharp
public class MyViewModel
{
    public MyViewModel()
    {
        Connectivity.ConnectivityChanged += OnConnectivityChanged;  // 未取消订阅
    }

    private void OnConnectivityChanged(object sender, ConnectivityChangedEventArgs e)
    {
        // 处理连接变化
    }
}
```

**正确做法**：
```csharp
public class MyViewModel : IDisposable
{
    public MyViewModel()
    {
        Connectivity.ConnectivityChanged += OnConnectivityChanged;
    }

    private void OnConnectivityChanged(object sender, ConnectivityChangedEventArgs e)
    {
        // 处理连接变化
    }

    public void Dispose()
    {
        Connectivity.ConnectivityChanged -= OnConnectivityChanged;
    }
}
```

### 绑定路径错误

**错误做法**：
```xaml
<!-- 属性名拼写错误，绑定失败 -->
<Label Text="{Binding UserName}"/>  <!-- 但 ViewModel 中是 Username -->
```

**正确做法**：
```xaml
<!-- 确保属性名称匹配 -->
<Label Text="{Binding Username}"/>
```

### 在后台线程中更新 UI

**错误做法**：
```csharp
public async Task LoadData()
{
    var data = await Task.Run(async () =>
    {
        return await apiService.GetDataAsync();
    });

    // 错误：在非 UI 线程中更新 UI
    MyLabel.Text = data.Title;
}
```

**正确做法**：
```csharp
public async Task LoadData()
{
    var data = await apiService.GetDataAsync();

    // 在主线程中更新 UI
    MainThread.BeginInvokeOnMainThread(() =>
    {
        MyLabel.Text = data.Title;
    });
}

// 或者使用数据绑定（推荐）
private string title;
public string Title
{
    get => title;
    set => SetProperty(ref title, value);
}

public async Task LoadData()
{
    var data = await apiService.GetDataAsync();
    Title = data.Title;  // 自动在主线程中更新
}
```

## 性能考量

### 虚拟化列表

对于大量数据，使用 CollectionView 替代 ListView，并启用虚拟化：

```xaml
<CollectionView ItemsSource="{Binding Items}"
                SelectionMode="Single"
                SelectionChangedCommand="{Binding SelectCommand}"
                SelectionChangedCommandParameter="{Binding SelectedItem, Source={RelativeSource Self}}">
    <CollectionView.ItemsLayout>
        <LinearItemsLayout Orientation="Vertical" ItemSpacing="10"/>
    </CollectionView.ItemsLayout>
    <CollectionView.ItemTemplate>
        <DataTemplate>
            <!-- 简化的项模板以提高性能 -->
            <StackLayout Padding="10">
                <Label Text="{Binding Title}" FontSize="16"/>
            </StackLayout>
        </DataTemplate>
    </CollectionView.ItemTemplate>
</CollectionView>
```

### 延迟加载图片

```csharp
public class ImageLoadingViewModel : INotifyPropertyChanged
{
    private ImageSource imageSource;
    public ImageSource ImageSource
    {
        get => imageSource;
        set => SetProperty(ref imageSource, value);
    }

    public async Task LoadImageAsync(string url)
    {
        try
        {
            // 在后台线程加载
            var source = await Task.Run(async () =>
            {
                using (var httpClient = new HttpClient())
                {
                    var response = await httpClient.GetAsync(url);
                    var stream = await response.Content.ReadAsStreamAsync();
                    return ImageSource.FromStream(() => stream);
                }
            });

            MainThread.BeginInvokeOnMainThread(() =>
            {
                ImageSource = source;
            });
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"图片加载失败: {ex.Message}");
        }
    }
}
```

### 减少布局嵌套

**效率低**：
```xaml
<StackLayout>
    <StackLayout>
        <StackLayout>
            <Label Text="深层嵌套"/>
        </StackLayout>
    </StackLayout>
</StackLayout>
```

**更优化**：
```xaml
<StackLayout Padding="10" Spacing="5">
    <Label Text="简洁结构"/>
</StackLayout>
```

### 使用编译的绑定

在 XAML 中启用编译的绑定以提高性能：

```xaml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="MyApp.MainPage"
             x:DataType="local:MainViewModel">

    <Label Text="{Binding Title}"/>
</ContentPage>
```

```csharp
// MainPage.xaml.cs
public partial class MainPage : ContentPage
{
    public MainPage(MainViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}
```

## 实战场景

### 场景 1：电商应用

```csharp
// 数据模型
public class Product
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Price { get; set; }
    public string ImageUrl { get; set; }
    public string Description { get; set; }
}

public class CartItem
{
    public Product Product { get; set; }
    public int Quantity { get; set; }
    public decimal Subtotal => Product.Price * Quantity;
}

// 购物车服务
public interface ICartService
{
    ObservableCollection<CartItem> Items { get; }
    void AddItem(Product product, int quantity = 1);
    void RemoveItem(CartItem item);
    decimal GetTotal();
}

public class CartService : ICartService
{
    public ObservableCollection<CartItem> Items { get; } = new();

    public void AddItem(Product product, int quantity = 1)
    {
        var existing = Items.FirstOrDefault(x => x.Product.Id == product.Id);
        if (existing != null)
        {
            existing.Quantity += quantity;
        }
        else
        {
            Items.Add(new CartItem { Product = product, Quantity = quantity });
        }
    }

    public void RemoveItem(CartItem item)
    {
        Items.Remove(item);
    }

    public decimal GetTotal()
    {
        return Items.Sum(x => x.Subtotal);
    }
}

// 购物车 ViewModel
public class ShoppingCartViewModel : BaseViewModel
{
    private readonly ICartService cartService;
    private decimal total;

    public ObservableCollection<CartItem> Items => cartService.Items;

    public decimal Total
    {
        get => total;
        set => SetProperty(ref total, value);
    }

    public ICommand RemoveItemCommand { get; }
    public ICommand CheckoutCommand { get; }

    public ShoppingCartViewModel(ICartService cartService)
    {
        this.cartService = cartService;
        RemoveItemCommand = new Command<CartItem>(RemoveItem);
        CheckoutCommand = new Command(Checkout);

        cartService.Items.CollectionChanged += (s, e) => UpdateTotal();
        UpdateTotal();
    }

    private void RemoveItem(CartItem item)
    {
        cartService.RemoveItem(item);
        UpdateTotal();
    }

    private void UpdateTotal()
    {
        Total = cartService.GetTotal();
    }

    private async Task Checkout()
    {
        if (Items.Count == 0)
        {
            await Shell.Current.DisplayAlert("提示", "购物车为空", "确定");
            return;
        }

        await Shell.Current.GoToAsync("checkout");
    }
}
```

### 场景 2：社交媒体应用

```csharp
// 数据模型
public class Post
{
    public int Id { get; set; }
    public string AuthorName { get; set; }
    public string AuthorAvatar { get; set; }
    public string Content { get; set; }
    public string[] Images { get; set; }
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsLikedByMe { get; set; }
}

// 社交服务
public interface ISocialService
{
    Task<List<Post>> GetFeedAsync();
    Task<bool> LikePostAsync(int postId);
    Task<bool> UnlikePostAsync(int postId);
    Task<List<Post>> SearchPostsAsync(string query);
}

// Feed ViewModel
public class FeedViewModel : BaseViewModel
{
    private readonly ISocialService socialService;
    private ObservableCollection<Post> posts;
    private string searchQuery;

    public ObservableCollection<Post> Posts
    {
        get => posts;
        set => SetProperty(ref posts, value);
    }

    public string SearchQuery
    {
        get => searchQuery;
        set
        {
            if (SetProperty(ref searchQuery, value))
            {
                SearchCommand.Execute(value);
            }
        }
    }

    public ICommand LoadFeedCommand { get; }
    public ICommand LikeCommand { get; }
    public ICommand SearchCommand { get; }
    public ICommand RefreshCommand { get; }

    public FeedViewModel(ISocialService socialService)
    {
        this.socialService = socialService;
        Posts = new ObservableCollection<Post>();

        LoadFeedCommand = new Command(async () => await LoadFeed());
        LikeCommand = new Command<Post>(async (post) => await LikePost(post));
        SearchCommand = new Command<string>(async (query) => await SearchPosts(query));
        RefreshCommand = new Command(async () => await LoadFeed());
    }

    private async Task LoadFeed()
    {
        IsBusy = true;
        try
        {
            var postList = await socialService.GetFeedAsync();
            Posts = new ObservableCollection<Post>(postList);
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("错误", $"加载动态失败: {ex.Message}", "确定");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task LikePost(Post post)
    {
        try
        {
            if (post.IsLikedByMe)
            {
                await socialService.UnlikePostAsync(post.Id);
                post.LikeCount--;
                post.IsLikedByMe = false;
            }
            else
            {
                await socialService.LikePostAsync(post.Id);
                post.LikeCount++;
                post.IsLikedByMe = true;
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("错误", $"操作失败: {ex.Message}", "确定");
        }
    }

    private async Task SearchPosts(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            await LoadFeed();
            return;
        }

        IsBusy = true;
        try
        {
            var results = await socialService.SearchPostsAsync(query);
            Posts = new ObservableCollection<Post>(results);
        }
        finally
        {
            IsBusy = false;
        }
    }
}
```

### 场景 3：天气应用

```csharp
// 数据模型
public class WeatherForecast
{
    public string City { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public CurrentWeather Current { get; set; }
    public List<DailyForecast> Daily { get; set; }
}

public class CurrentWeather
{
    public double Temperature { get; set; }
    public string Condition { get; set; }
    public string IconUrl { get; set; }
    public double Humidity { get; set; }
    public double WindSpeed { get; set; }
}

public class DailyForecast
{
    public DateTime Date { get; set; }
    public double HighTemp { get; set; }
    public double LowTemp { get; set; }
    public string Condition { get; set; }
    public string IconUrl { get; set; }
}

// 天气服务
public interface IWeatherApiService
{
    Task<WeatherForecast> GetWeatherAsync(double latitude, double longitude);
    Task<List<Location>> SearchLocationsAsync(string query);
}

// 天气 ViewModel
public class WeatherViewModel : BaseViewModel
{
    private readonly IWeatherApiService weatherService;
    private readonly IGeolocation geolocation;
    private WeatherForecast weatherData;
    private string selectedCity;

    public WeatherForecast WeatherData
    {
        get => weatherData;
        set => SetProperty(ref weatherData, value);
    }

    public string SelectedCity
    {
        get => selectedCity;
        set => SetProperty(ref selectedCity, value);
    }

    public ICommand GetCurrentLocationWeatherCommand { get; }
    public ICommand SearchWeatherCommand { get; }

    public WeatherViewModel(IWeatherApiService weatherService)
    {
        this.weatherService = weatherService;
        this.geolocation = Geolocation.Default;

        GetCurrentLocationWeatherCommand = new Command(async () => await GetCurrentLocationWeather());
        SearchWeatherCommand = new Command<string>(async (city) => await SearchWeather(city));
    }

    private async Task GetCurrentLocationWeather()
    {
        IsBusy = true;
        try
        {
            var location = await geolocation.GetLocationAsync(new GeolocationRequest
            {
                DesiredAccuracy = GeolocationAccuracy.Best,
                Timeout = TimeSpan.FromSeconds(30)
            });

            if (location != null)
            {
                WeatherData = await weatherService.GetWeatherAsync(
                    location.Latitude,
                    location.Longitude);
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("错误", $"获取位置失败: {ex.Message}", "确定");
        }
        finally
        {
            IsBusy = false;
        }
    }

    private async Task SearchWeather(string city)
    {
        if (string.IsNullOrWhiteSpace(city))
            return;

        IsBusy = true;
        try
        {
            var locations = await weatherService.SearchLocationsAsync(city);
            if (locations.Any())
            {
                var location = locations.First();
                WeatherData = await weatherService.GetWeatherAsync(
                    location.Latitude,
                    location.Longitude);
                SelectedCity = city;
            }
        }
        finally
        {
            IsBusy = false;
        }
    }
}
```

## 面试要点

### MAUI 和 Xamarin.Forms 的区别

**回答要点**：
- MAUI 是 Xamarin.Forms 的现代化继承者
- MAUI 支持 .NET 6+ 和更多平台
- MAUI 的性能更优
- MAUI 提供了改进的 API 和工具链

### MAUI 中的数据绑定机制

**回答要点**：
```csharp
// 数据绑定的三个步骤：
// 1. 源对象实现 INotifyPropertyChanged
public class ViewModel : INotifyPropertyChanged
{
    private string name;
    public string Name
    {
        get => name;
        set
        {
            if (name != value)
            {
                name = value;
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Name)));
            }
        }
    }

    public event PropertyChangedEventHandler PropertyChanged;
}

// 2. 在 XAML 中定义绑定
// <Entry Text="{Binding Name}"/>

// 3. 在代码中设置 BindingContext
BindingContext = new ViewModel();
```

### MAUI 中的导航系统

**回答要点**：
- Shell 导航：基于路由的现代导航
- NavigationPage：传统的堆栈导航
- TabbedPage：选项卡导航
- 支持传递参数和查询字符串

### 如何处理平台特定代码

**回答要点**：
```csharp
// 方式 1：条件编译
#if __IOS__
    // iOS 特定代码
#elif __ANDROID__
    // Android 特定代码
#endif

// 方式 2：使用 MAUI 的跨平台 API
await AppInfo.ShowSettingsUI();

// 方式 3：使用依赖注入和接口
public interface IPlatformService { }

#if __IOS__
public class iOSPlatformService : IPlatformService { }
#elif __ANDROID__
public class AndroidPlatformService : IPlatformService { }
#endif
```

### MAUI 性能优化建议

**回答要点**：
- 使用 ObservableCollection 而非 List
- 启用 XAML 编译
- 使用虚拟化的 CollectionView
- 在后台线程加载数据
- 避免在主线程进行耗时操作
- 正确处理图片加载和缓存
- 及时释放资源

### 如何实现 MVVM 模式

**回答要点**：
- Model：数据模型
- View：XAML 页面
- ViewModel：业务逻辑和命令

### MAUI 中的资源和样式管理

**回答要点**：
- 应用级别资源：App.xaml
- 页面级别资源：页面 XAML
- 样式继承和重写
- 主题支持

### 如何测试 MAUI 应用

**回答要点**：
- 单元测试：使用 xUnit 测试 ViewModel
- UI 测试：使用 Appium 或 MAUI TestCloud
- 集成测试：测试页面和 ViewModel 交互

## 延伸阅读

### 官方资源

- [Microsoft MAUI 官方文档](https://learn.microsoft.com/dotnet/maui/)
- [MAUI GitHub 仓库](https://github.com/dotnet/maui)
- [MAUI 示例应用](https://github.com/dotnet/maui-samples)

### 相关技术

- **XAML**：学习声明式 UI 定义
- **.NET 异步编程**：深入理解 async/await
- **依赖注入**：了解 Microsoft.Extensions.DependencyInjection
- **MVVM 工具包**：使用 CommunityToolkit.MVVM 简化代码

### 推荐实践

1. 始终使用 MVVM 架构
2. 充分利用依赖注入
3. 正确处理异步操作
4. 遵循命名约定
5. 定期性能分析和优化
6. 使用版本控制和 CI/CD
7. 编写可测试的代码

### 常见问题解决

1. **旧版本 Xamarin.Forms 迁移到 MAUI**：
   - 重新审视 UI 层设计
   - 更新 API 调用
   - 利用 MAUI 的新功能

2. **平台特定功能实现**：
   - 使用 MAUI 的跨平台 API
   - 必要时使用条件编译
   - 创建平台特定的实现类

3. **性能问题排查**：
   - 使用 Profiler 分析
   - 减少布局嵌套
   - 优化列表虚拟化
   - 缓存 HTTP 请求

---

**总结**：.NET MAUI 提供了一个强大且灵活的跨平台开发框架。通过遵循 MVVM 模式、正确处理异步操作、优化性能和正确管理资源，开发者可以构建高效、可维护的跨平台应用。持续学习新特性和最佳实践将使你成为更出色的 MAUI 开发者。
