---
title: 跨平台游戏开发
description: 实现一次开发多平台发布：PC、主机和移动端适配策略
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - 跨平台
  - 移植
  - 适配
  - 发布
status: imported
origin: old/src/content/docs/gamedev/cross-platform-games.zh.md
divergence: 0.305
issues: []
legacy:
  category: GameDev
  subcategory: Tools
  order: 39
  lastUpdated: 2026-01-07
---

跨平台游戏开发是现代游戏产业的核心竞争力之一。通过一套代码库实现多平台发布，不仅能够大幅降低开发成本，还能最大化游戏的市场覆盖率。本文将深入探讨跨平台架构设计、平台抽象层实现、输入适配、分辨率适配、性能缩放、平台特定功能处理、主机认证要求以及移动端优化等核心主题。

## 概念解释：为什么需要跨平台开发

### 游戏市场的多平台现实

当今游戏市场已经高度碎片化，玩家分布在各种平台上：

| 平台类别 | 代表平台 | 市场特点 |
|---------|---------|---------|
| PC | Windows, macOS, Linux, Steam Deck | 高性能硬件，键鼠/手柄输入，开放生态 |
| 主机 | PlayStation 5, Xbox Series X/S, Nintendo Switch | 封闭生态，统一硬件，严格认证 |
| 移动端 | iOS, Android | 触控输入，碎片化硬件，性能受限 |
| 云游戏 | GeForce Now, Xbox Cloud | 流媒体传输，低延迟要求 |
| VR/AR | Meta Quest, PlayStation VR2, Apple Vision Pro | 沉浸式体验，特殊输入方式 |

### 跨平台开发的核心挑战

```
┌─────────────────────────────────────────────────────────────────┐
│                    跨平台开发挑战全景                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  硬件差异          软件环境          用户体验         商业要求    │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐     ┌─────────┐ │
│  │ CPU架构  │      │ 图形API │      │ 输入方式 │     │ 平台认证 │ │
│  │ GPU能力  │      │ 音频系统 │      │ 屏幕尺寸 │     │ 分成比例 │ │
│  │ 内存限制 │      │ 文件系统 │      │ 帧率期望 │     │ 更新审核 │ │
│  │ 存储速度 │      │ 网络栈   │      │ 控制习惯 │     │ 区域限制 │ │
│  └─────────┘      └─────────┘      └─────────┘     └─────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 一次开发、多平台发布的价值

1. **降低开发成本**：避免为每个平台重写代码
2. **缩短上市时间**：同步或近同步多平台发布
3. **统一代码维护**：Bug修复和功能更新一次性完成
4. **最大化市场覆盖**：触达所有潜在玩家群体
5. **跨平台联机**：实现不同平台玩家的互联互通

## 跨平台架构设计

### 分层架构模式

跨平台游戏的核心是建立清晰的分层架构，将平台相关代码与游戏逻辑彻底分离：

```
┌─────────────────────────────────────────────────────────────────┐
│                        游戏逻辑层                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  游戏玩法 │ AI系统 │ 物理模拟 │ 动画系统 │ UI逻辑        │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        引擎抽象层                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  渲染接口 │ 音频接口 │ 输入接口 │ 存储接口 │ 网络接口     │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        平台适配层                                │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐       │
│  │Windows│  │ macOS │  │ Linux │  │  PS5  │  │ Xbox  │       │
│  └───────┘  └───────┘  └───────┘  └───────┘  └───────┘       │
│  ┌───────┐  ┌───────┐  ┌───────┐  ┌───────┐                  │
│  │Switch │  │  iOS  │  │Android│  │ Quest │                  │
│  └───────┘  └───────┘  └───────┘  └───────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### 代码组织结构

```
game-project/
├── src/
│   ├── core/                    # 核心游戏逻辑（平台无关）
│   │   ├── gameplay/
│   │   ├── ai/
│   │   ├── physics/
│   │   └── animation/
│   │
│   ├── engine/                  # 引擎抽象层
│   │   ├── graphics/
│   │   │   ├── IRenderer.h      # 渲染接口
│   │   │   ├── ITexture.h
│   │   │   └── IShader.h
│   │   ├── audio/
│   │   │   ├── IAudioEngine.h   # 音频接口
│   │   │   └── IAudioSource.h
│   │   ├── input/
│   │   │   ├── IInputManager.h  # 输入接口
│   │   │   └── InputTypes.h
│   │   ├── storage/
│   │   │   └── IFileSystem.h    # 文件系统接口
│   │   └── network/
│   │       └── INetworkManager.h
│   │
│   └── platform/                # 平台实现层
│       ├── windows/
│       │   ├── WindowsRenderer.cpp
│       │   ├── WindowsAudio.cpp
│       │   └── WindowsInput.cpp
│       ├── playstation/
│       │   ├── PS5Renderer.cpp
│       │   ├── PS5Audio.cpp
│       │   └── PS5Input.cpp
│       ├── xbox/
│       ├── switch/
│       ├── ios/
│       └── android/
│
├── assets/                      # 资源文件
│   ├── common/                  # 通用资源
│   └── platform/                # 平台特定资源
│       ├── high/                # 高配平台
│       ├── medium/              # 中配平台
│       └── low/                 # 低配平台
│
└── build/                       # 构建脚本
    ├── windows/
    ├── playstation/
    └── ...
```

### 依赖注入与工厂模式

使用工厂模式创建平台特定的实现：

```cpp
// engine/graphics/IRenderer.h - 渲染器抽象接口
class IRenderer {
public:
    virtual ~IRenderer() = default;

    virtual bool Initialize(const RendererConfig& config) = 0;
    virtual void BeginFrame() = 0;
    virtual void EndFrame() = 0;
    virtual void Present() = 0;

    virtual TextureHandle CreateTexture(const TextureDesc& desc) = 0;
    virtual void DestroyTexture(TextureHandle handle) = 0;

    virtual ShaderHandle CreateShader(const ShaderDesc& desc) = 0;
    virtual void BindShader(ShaderHandle handle) = 0;

    virtual void DrawMesh(const MeshData& mesh, const Material& material) = 0;
    virtual void DrawInstanced(const MeshData& mesh, const Material& material,
                               const std::vector<InstanceData>& instances) = 0;

    // 平台能力查询
    virtual RendererCapabilities GetCapabilities() const = 0;
};

// engine/PlatformFactory.h - 平台工厂
class PlatformFactory {
public:
    static std::unique_ptr<IRenderer> CreateRenderer();
    static std::unique_ptr<IAudioEngine> CreateAudioEngine();
    static std::unique_ptr<IInputManager> CreateInputManager();
    static std::unique_ptr<IFileSystem> CreateFileSystem();
    static std::unique_ptr<INetworkManager> CreateNetworkManager();

    // 获取当前平台信息
    static PlatformInfo GetPlatformInfo();
};

// platform/windows/WindowsFactory.cpp
#ifdef PLATFORM_WINDOWS

std::unique_ptr<IRenderer> PlatformFactory::CreateRenderer() {
    #if defined(USE_DX12)
        return std::make_unique<DX12Renderer>();
    #elif defined(USE_VULKAN)
        return std::make_unique<VulkanRenderer>();
    #else
        return std::make_unique<DX11Renderer>();
    #endif
}

std::unique_ptr<IAudioEngine> PlatformFactory::CreateAudioEngine() {
    return std::make_unique<XAudio2Engine>();
}

std::unique_ptr<IInputManager> PlatformFactory::CreateInputManager() {
    return std::make_unique<WindowsInputManager>();
}

#endif

// platform/playstation/PS5Factory.cpp
#ifdef PLATFORM_PS5

std::unique_ptr<IRenderer> PlatformFactory::CreateRenderer() {
    return std::make_unique<GNMRenderer>();  // PlayStation专用图形API
}

std::unique_ptr<IAudioEngine> PlatformFactory::CreateAudioEngine() {
    return std::make_unique<TempestAudioEngine>();  // PS5 3D音频
}

std::unique_ptr<IInputManager> PlatformFactory::CreateInputManager() {
    return std::make_unique<DualSenseInputManager>();
}

#endif
```

### 游戏引擎初始化

```cpp
// core/GameEngine.cpp
class GameEngine {
private:
    std::unique_ptr<IRenderer> m_renderer;
    std::unique_ptr<IAudioEngine> m_audio;
    std::unique_ptr<IInputManager> m_input;
    std::unique_ptr<IFileSystem> m_fileSystem;
    std::unique_ptr<INetworkManager> m_network;

public:
    bool Initialize() {
        // 通过工厂创建平台实现
        m_renderer = PlatformFactory::CreateRenderer();
        m_audio = PlatformFactory::CreateAudioEngine();
        m_input = PlatformFactory::CreateInputManager();
        m_fileSystem = PlatformFactory::CreateFileSystem();
        m_network = PlatformFactory::CreateNetworkManager();

        // 获取平台信息并配置
        PlatformInfo platformInfo = PlatformFactory::GetPlatformInfo();

        RendererConfig renderConfig;
        renderConfig.width = platformInfo.defaultResolution.width;
        renderConfig.height = platformInfo.defaultResolution.height;
        renderConfig.vsync = platformInfo.defaultVSync;

        if (!m_renderer->Initialize(renderConfig)) {
            LogError("Failed to initialize renderer");
            return false;
        }

        // 根据平台能力调整配置
        auto capabilities = m_renderer->GetCapabilities();
        ConfigureQualitySettings(capabilities);

        return true;
    }

    void ConfigureQualitySettings(const RendererCapabilities& caps) {
        QualitySettings quality;

        if (caps.maxTextureSize >= 4096 && caps.availableVRAM >= 8 * GB) {
            quality = QualityPresets::Ultra;
        } else if (caps.maxTextureSize >= 2048 && caps.availableVRAM >= 4 * GB) {
            quality = QualityPresets::High;
        } else if (caps.availableVRAM >= 2 * GB) {
            quality = QualityPresets::Medium;
        } else {
            quality = QualityPresets::Low;
        }

        ApplyQualitySettings(quality);
    }
};
```

## 平台抽象层

### 图形API抽象

不同平台使用不同的图形API，需要统一抽象：

```cpp
// engine/graphics/GraphicsTypes.h
// 平台无关的图形类型定义

enum class TextureFormat {
    R8G8B8A8_UNORM,
    R8G8B8A8_SRGB,
    R16G16B16A16_FLOAT,
    R32G32B32A32_FLOAT,
    BC1_UNORM,          // DXT1
    BC3_UNORM,          // DXT5
    BC7_UNORM,
    ASTC_4x4,           // 移动端常用
    ASTC_6x6,
    ETC2_RGB8,
    // ... 更多格式
};

enum class ShaderStage {
    Vertex,
    Fragment,
    Geometry,
    TessControl,
    TessEval,
    Compute,
    Mesh,               // 现代GPU支持
    Amplification,
};

struct ShaderDesc {
    ShaderStage stage;
    std::vector<uint8_t> bytecode;
    std::string entryPoint;

    // 平台特定的着色器数据
    // 在编译时根据目标平台生成不同格式
};

// 着色器跨平台编译工具链
class ShaderCompiler {
public:
    // 从HLSL/GLSL源码编译为目标平台格式
    static ShaderDesc CompileFromSource(
        const std::string& source,
        ShaderStage stage,
        TargetPlatform platform
    ) {
        ShaderDesc desc;
        desc.stage = stage;

        switch (platform) {
            case TargetPlatform::Windows_DX12:
                // 使用DXC编译为DXIL
                desc.bytecode = CompileToDXIL(source, stage);
                break;

            case TargetPlatform::Windows_Vulkan:
            case TargetPlatform::Linux:
            case TargetPlatform::Android:
                // 使用glslc/shaderc编译为SPIR-V
                desc.bytecode = CompileToSPIRV(source, stage);
                break;

            case TargetPlatform::PS5:
                // 使用PlayStation着色器编译器
                desc.bytecode = CompileToPSSL(source, stage);
                break;

            case TargetPlatform::Switch:
                // 使用Nintendo着色器编译器
                desc.bytecode = CompileToNVN(source, stage);
                break;

            case TargetPlatform::iOS:
            case TargetPlatform::macOS:
                // 使用Metal着色器编译器
                desc.bytecode = CompileToMetalIR(source, stage);
                break;
        }

        return desc;
    }
};
```

### 音频系统抽象

```cpp
// engine/audio/IAudioEngine.h
class IAudioEngine {
public:
    virtual ~IAudioEngine() = default;

    virtual bool Initialize(const AudioConfig& config) = 0;
    virtual void Shutdown() = 0;

    // 音频资源管理
    virtual AudioClipHandle LoadClip(const std::string& path) = 0;
    virtual void UnloadClip(AudioClipHandle handle) = 0;

    // 播放控制
    virtual AudioSourceHandle PlaySound(AudioClipHandle clip,
                                        const AudioPlayParams& params) = 0;
    virtual void StopSound(AudioSourceHandle source) = 0;
    virtual void SetSourcePosition(AudioSourceHandle source,
                                   const Vector3& position) = 0;

    // 3D音频
    virtual void SetListenerPosition(const Vector3& position,
                                     const Vector3& forward,
                                     const Vector3& up) = 0;

    // 平台特定功能查询
    virtual bool Supports3DAudio() const = 0;
    virtual bool SupportsHapticFeedback() const = 0;
    virtual int GetMaxSimultaneousSources() const = 0;
};

// platform/playstation/TempestAudioEngine.cpp
// PS5 Tempest 3D Audio实现
class TempestAudioEngine : public IAudioEngine {
private:
    SceAudioOut m_audioOut;
    SceTempest3dContext m_tempestContext;

public:
    bool Initialize(const AudioConfig& config) override {
        // 初始化PS5 Tempest引擎
        SceTempest3dConfig tempestConfig = {};
        tempestConfig.mode = SCE_TEMPEST_3D_MODE_OBJECT;
        tempestConfig.maxObjects = 128;

        int result = sceTempest3dInitialize(&m_tempestContext, &tempestConfig);
        if (result != SCE_OK) {
            return false;
        }

        // 启用HRTF（头部相关传输函数）进行3D定位
        sceTempest3dSetHRTFEnabled(m_tempestContext, true);

        return true;
    }

    void SetListenerPosition(const Vector3& position,
                            const Vector3& forward,
                            const Vector3& up) override {
        SceTempest3dListenerAttributes listener = {};
        listener.position = {position.x, position.y, position.z};
        listener.forward = {forward.x, forward.y, forward.z};
        listener.up = {up.x, up.y, up.z};

        sceTempest3dSetListenerAttributes(m_tempestContext, &listener);
    }

    bool Supports3DAudio() const override { return true; }
    bool SupportsHapticFeedback() const override { return true; }  // DualSense
    int GetMaxSimultaneousSources() const override { return 128; }
};
```

### 文件系统抽象

```cpp
// engine/storage/IFileSystem.h
class IFileSystem {
public:
    virtual ~IFileSystem() = default;

    // 基础文件操作
    virtual bool FileExists(const std::string& path) = 0;
    virtual std::vector<uint8_t> ReadFile(const std::string& path) = 0;
    virtual bool WriteFile(const std::string& path,
                          const std::vector<uint8_t>& data) = 0;

    // 异步文件操作（现代平台推荐）
    virtual AsyncFileHandle ReadFileAsync(const std::string& path,
                                          FileReadCallback callback) = 0;
    virtual void CancelAsyncOperation(AsyncFileHandle handle) = 0;

    // 路径管理
    virtual std::string GetSaveDataPath() = 0;      // 存档路径
    virtual std::string GetCachePath() = 0;         // 缓存路径
    virtual std::string GetAssetPath() = 0;         // 资源路径

    // 存储空间查询
    virtual uint64_t GetAvailableSpace() = 0;
    virtual uint64_t GetTotalSpace() = 0;
};

// platform/switch/SwitchFileSystem.cpp
class SwitchFileSystem : public IFileSystem {
private:
    nn::fs::FileSystem* m_romFs;
    nn::fs::FileSystem* m_saveFs;

public:
    bool Initialize() {
        // 挂载ROM文件系统（游戏资源）
        nn::fs::MountRom("rom");

        // 挂载存档文件系统
        nn::fs::MountSaveData("save");

        return true;
    }

    std::string GetSaveDataPath() override {
        // Switch存档路径
        return "save:/";
    }

    std::string GetAssetPath() override {
        // Switch ROM资源路径
        return "rom:/assets/";
    }

    std::vector<uint8_t> ReadFile(const std::string& path) override {
        nn::fs::FileHandle handle;
        nn::Result result = nn::fs::OpenFile(&handle, path.c_str(),
                                             nn::fs::OpenMode_Read);

        if (result.IsFailure()) {
            return {};
        }

        int64_t size;
        nn::fs::GetFileSize(&size, handle);

        std::vector<uint8_t> data(size);
        nn::fs::ReadFile(handle, 0, data.data(), size);
        nn::fs::CloseFile(handle);

        return data;
    }
};

// platform/ios/IOSFileSystem.cpp
class IOSFileSystem : public IFileSystem {
public:
    std::string GetSaveDataPath() override {
        // iOS Documents目录（会被iCloud备份）
        NSArray* paths = NSSearchPathForDirectoriesInDomains(
            NSDocumentDirectory, NSUserDomainMask, YES);
        NSString* documentsPath = [paths objectAtIndex:0];
        return [documentsPath UTF8String];
    }

    std::string GetCachePath() override {
        // iOS Caches目录（不会被备份，可能被系统清理）
        NSArray* paths = NSSearchPathForDirectoriesInDomains(
            NSCachesDirectory, NSUserDomainMask, YES);
        NSString* cachePath = [paths objectAtIndex:0];
        return [cachePath UTF8String];
    }

    std::string GetAssetPath() override {
        // iOS应用Bundle资源路径
        NSString* bundlePath = [[NSBundle mainBundle] resourcePath];
        return [[bundlePath stringByAppendingPathComponent:@"assets"] UTF8String];
    }
};
```

## 输入适配

### 统一输入抽象

不同平台有完全不同的输入设备，需要建立统一的输入抽象层：

```cpp
// engine/input/InputTypes.h

// 虚拟按键定义（平台无关）
enum class GameAction {
    // 通用动作
    Confirm,
    Cancel,
    Pause,

    // 移动
    MoveUp,
    MoveDown,
    MoveLeft,
    MoveRight,

    // 战斗
    Attack,
    Block,
    Dodge,
    UseItem,

    // UI
    UINavigateUp,
    UINavigateDown,
    UINavigateLeft,
    UINavigateRight,
    UIConfirm,
    UICancel,

    // 特殊
    Screenshot,
    QuickSave,
    QuickLoad,

    Count
};

// 输入类型
enum class InputDeviceType {
    Keyboard,
    Mouse,
    Gamepad,
    Touch,
    Motion,          // 体感
    VRController,
};

// 输入状态
struct InputState {
    // 按键状态
    std::array<bool, static_cast<size_t>(GameAction::Count)> actions;
    std::array<bool, static_cast<size_t>(GameAction::Count)> actionsPressed;   // 本帧按下
    std::array<bool, static_cast<size_t>(GameAction::Count)> actionsReleased;  // 本帧释放

    // 模拟输入（摇杆/触摸）
    Vector2 moveAxis;       // 移动方向 (-1 to 1)
    Vector2 lookAxis;       // 视角方向 (-1 to 1)

    // 触摸输入
    std::vector<TouchPoint> touches;

    // 当前活跃的输入设备
    InputDeviceType activeDevice;
};

// engine/input/IInputManager.h
class IInputManager {
public:
    virtual ~IInputManager() = default;

    virtual void Update() = 0;
    virtual const InputState& GetInputState() const = 0;

    // 输入映射
    virtual void SetActionMapping(GameAction action,
                                  const InputBinding& binding) = 0;
    virtual InputBinding GetActionMapping(GameAction action) const = 0;

    // 振动反馈
    virtual void SetVibration(int playerIndex, float leftMotor, float rightMotor,
                              float duration = 0.0f) = 0;
    virtual void StopVibration(int playerIndex) = 0;

    // 高级触觉反馈（DualSense/Switch HD Rumble）
    virtual bool SupportsAdvancedHaptics() const = 0;
    virtual void PlayHapticEffect(int playerIndex,
                                  const HapticEffect& effect) = 0;

    // 自适应扳机（DualSense）
    virtual bool SupportsAdaptiveTriggers() const = 0;
    virtual void SetTriggerEffect(int playerIndex, TriggerSide side,
                                  const TriggerEffect& effect) = 0;

    // 体感输入
    virtual bool SupportsMotionInput() const = 0;
    virtual MotionData GetMotionData(int playerIndex) const = 0;

    // 设备检测
    virtual std::vector<InputDeviceInfo> GetConnectedDevices() const = 0;
    virtual void SetDeviceChangeCallback(DeviceChangeCallback callback) = 0;
};
```

### 平台特定输入实现

```cpp
// platform/playstation/DualSenseInputManager.cpp
class DualSenseInputManager : public IInputManager {
private:
    ScePadHandle m_padHandle;
    ScePadData m_padData;
    InputState m_state;

    // DualSense特有功能
    ScePadTriggerEffectParam m_leftTriggerEffect;
    ScePadTriggerEffectParam m_rightTriggerEffect;

public:
    void Update() override {
        // 读取DualSense状态
        scePadReadState(m_padHandle, &m_padData);

        // 更新按键状态
        UpdateButtonState(m_padData.buttons);

        // 更新摇杆
        m_state.moveAxis.x = NormalizeStick(m_padData.leftStick.x);
        m_state.moveAxis.y = NormalizeStick(m_padData.leftStick.y);
        m_state.lookAxis.x = NormalizeStick(m_padData.rightStick.x);
        m_state.lookAxis.y = NormalizeStick(m_padData.rightStick.y);

        // 读取触摸板
        if (m_padData.touchData.touchNum > 0) {
            UpdateTouchData(m_padData.touchData);
        }

        // 读取陀螺仪/加速度计
        UpdateMotionData(m_padData.orientation, m_padData.acceleration);
    }

    bool SupportsAdvancedHaptics() const override { return true; }

    void PlayHapticEffect(int playerIndex, const HapticEffect& effect) override {
        ScePadVibrationParam vibration = {};

        // DualSense支持更精细的触觉控制
        // 转换通用触觉效果为DualSense格式
        vibration.largeMotor = static_cast<uint8_t>(effect.lowFrequency * 255);
        vibration.smallMotor = static_cast<uint8_t>(effect.highFrequency * 255);

        scePadSetVibration(m_padHandle, &vibration);
    }

    bool SupportsAdaptiveTriggers() const override { return true; }

    void SetTriggerEffect(int playerIndex, TriggerSide side,
                         const TriggerEffect& effect) override {
        ScePadTriggerEffectParam* param =
            (side == TriggerSide::Left) ? &m_leftTriggerEffect : &m_rightTriggerEffect;

        switch (effect.type) {
            case TriggerEffectType::Resistance:
                // 阻力效果：模拟拉弓、按压等
                param->triggerMask = SCE_PAD_TRIGGER_EFFECT_TRIGGER_MASK_R2;
                param->command[0].mode = SCE_PAD_TRIGGER_EFFECT_MODE_RESISTANCE;
                param->command[0].resistance.startPosition =
                    static_cast<uint8_t>(effect.startPosition * 255);
                param->command[0].resistance.force =
                    static_cast<uint8_t>(effect.force * 255);
                break;

            case TriggerEffectType::Vibration:
                // 振动效果：模拟枪械后坐力
                param->triggerMask = SCE_PAD_TRIGGER_EFFECT_TRIGGER_MASK_R2;
                param->command[0].mode = SCE_PAD_TRIGGER_EFFECT_MODE_VIBRATION;
                param->command[0].vibration.frequency = effect.frequency;
                param->command[0].vibration.amplitude =
                    static_cast<uint8_t>(effect.amplitude * 255);
                break;

            case TriggerEffectType::Weapon:
                // 武器效果：模拟扳机卡住然后释放
                param->triggerMask = SCE_PAD_TRIGGER_EFFECT_TRIGGER_MASK_R2;
                param->command[0].mode = SCE_PAD_TRIGGER_EFFECT_MODE_WEAPON;
                param->command[0].weapon.startPosition = 20;
                param->command[0].weapon.endPosition = 140;
                param->command[0].weapon.strength = 8;
                break;
        }

        scePadSetTriggerEffect(m_padHandle, param);
    }
};

// platform/switch/SwitchInputManager.cpp
class SwitchInputManager : public IInputManager {
private:
    nn::hid::NpadIdType m_npadIds[2];  // 支持双Joy-Con
    nn::hid::NpadState m_npadState;
    nn::hid::SixAxisSensorState m_sixAxisState;

public:
    void Update() override {
        // 检测控制器连接模式
        nn::hid::NpadStyleTag style = nn::hid::GetNpadStyleSet(m_npadIds[0]);

        if (style & nn::hid::NpadStyleFullKey) {
            // Pro手柄模式
            nn::hid::GetNpadState(&m_npadState, m_npadIds[0]);
        } else if (style & nn::hid::NpadStyleJoyDual) {
            // 双Joy-Con模式
            nn::hid::GetNpadState(&m_npadState, m_npadIds[0]);
        } else if (style & nn::hid::NpadStyleHandheld) {
            // 掌机模式
            nn::hid::GetNpadState(&m_npadState, nn::hid::NpadIdType_Handheld);
        }

        UpdateInputState();

        // Switch HD Rumble陀螺仪
        if (nn::hid::IsSixAxisSensorActive(m_npadIds[0])) {
            nn::hid::GetSixAxisSensorState(&m_sixAxisState, m_npadIds[0]);
        }
    }

    bool SupportsAdvancedHaptics() const override {
        return true;  // HD Rumble
    }

    void PlayHapticEffect(int playerIndex, const HapticEffect& effect) override {
        // Switch HD Rumble支持非常精细的振动控制
        nn::hid::VibrationValue vibration = {};

        // HD Rumble使用频率和振幅
        vibration.amplitudeLow = effect.lowFrequency;
        vibration.frequencyLow = 160.0f;  // Hz
        vibration.amplitudeHigh = effect.highFrequency;
        vibration.frequencyHigh = 320.0f; // Hz

        nn::hid::SendVibrationValue(m_npadIds[playerIndex], vibration);
    }

    bool SupportsMotionInput() const override { return true; }

    MotionData GetMotionData(int playerIndex) const override {
        MotionData data;
        data.acceleration = Vector3(
            m_sixAxisState.acceleration.x,
            m_sixAxisState.acceleration.y,
            m_sixAxisState.acceleration.z
        );
        data.angularVelocity = Vector3(
            m_sixAxisState.angularVelocity.x,
            m_sixAxisState.angularVelocity.y,
            m_sixAxisState.angularVelocity.z
        );
        return data;
    }
};

// platform/mobile/TouchInputManager.cpp
class TouchInputManager : public IInputManager {
private:
    InputState m_state;
    std::vector<TouchPoint> m_touches;

    // 虚拟摇杆区域
    Rect m_leftJoystickArea;
    Rect m_rightJoystickArea;
    Vector2 m_leftJoystickCenter;
    Vector2 m_rightJoystickCenter;
    float m_joystickRadius;

public:
    void Update() override {
        m_state.touches.clear();

        // 从平台获取触摸点
        UpdateTouchPoints();

        // 处理虚拟摇杆
        ProcessVirtualJoysticks();

        // 处理手势
        ProcessGestures();
    }

    void ProcessVirtualJoysticks() {
        m_state.moveAxis = Vector2::Zero;
        m_state.lookAxis = Vector2::Zero;

        for (const auto& touch : m_touches) {
            if (m_leftJoystickArea.Contains(touch.startPosition)) {
                // 左摇杆：移动
                Vector2 delta = touch.position - m_leftJoystickCenter;
                float distance = delta.Length();

                if (distance > m_joystickRadius) {
                    delta = delta.Normalized() * m_joystickRadius;
                }

                m_state.moveAxis = delta / m_joystickRadius;
            }
            else if (m_rightJoystickArea.Contains(touch.startPosition)) {
                // 右摇杆：视角
                Vector2 delta = touch.position - m_rightJoystickCenter;
                float distance = delta.Length();

                if (distance > m_joystickRadius) {
                    delta = delta.Normalized() * m_joystickRadius;
                }

                m_state.lookAxis = delta / m_joystickRadius;
            }
        }
    }

    void ProcessGestures() {
        // 双击检测
        if (DetectDoubleTap()) {
            m_state.actionsPressed[static_cast<int>(GameAction::Attack)] = true;
        }

        // 滑动检测
        SwipeDirection swipe = DetectSwipe();
        if (swipe == SwipeDirection::Right) {
            m_state.actionsPressed[static_cast<int>(GameAction::Dodge)] = true;
        }

        // 捏合缩放
        float pinchDelta = DetectPinch();
        if (std::abs(pinchDelta) > 0.01f) {
            // 用于相机缩放等
        }
    }
};
```

### 输入映射配置

```cpp
// engine/input/InputMapper.cpp
class InputMapper {
private:
    std::unordered_map<GameAction, std::vector<InputBinding>> m_mappings;

public:
    void LoadDefaultMappings(InputDeviceType deviceType) {
        switch (deviceType) {
            case InputDeviceType::Keyboard:
                LoadKeyboardDefaults();
                break;
            case InputDeviceType::Gamepad:
                LoadGamepadDefaults();
                break;
            case InputDeviceType::Touch:
                LoadTouchDefaults();
                break;
        }
    }

    void LoadKeyboardDefaults() {
        // PC键鼠默认映射
        Map(GameAction::MoveUp, Key::W);
        Map(GameAction::MoveDown, Key::S);
        Map(GameAction::MoveLeft, Key::A);
        Map(GameAction::MoveRight, Key::D);
        Map(GameAction::Attack, MouseButton::Left);
        Map(GameAction::Block, MouseButton::Right);
        Map(GameAction::Dodge, Key::Space);
        Map(GameAction::UseItem, Key::E);
        Map(GameAction::Confirm, Key::Enter);
        Map(GameAction::Cancel, Key::Escape);
        Map(GameAction::Pause, Key::Escape);
    }

    void LoadGamepadDefaults() {
        // 手柄默认映射
        Map(GameAction::MoveUp, GamepadButton::LeftStickUp);
        Map(GameAction::MoveDown, GamepadButton::LeftStickDown);
        Map(GameAction::MoveLeft, GamepadButton::LeftStickLeft);
        Map(GameAction::MoveRight, GamepadButton::LeftStickRight);
        Map(GameAction::Attack, GamepadButton::RightTrigger);
        Map(GameAction::Block, GamepadButton::LeftTrigger);
        Map(GameAction::Dodge, GamepadButton::A);  // Xbox布局
        Map(GameAction::UseItem, GamepadButton::X);
        Map(GameAction::Confirm, GamepadButton::A);
        Map(GameAction::Cancel, GamepadButton::B);
        Map(GameAction::Pause, GamepadButton::Start);
    }

    // 支持玩家自定义映射
    void SaveCustomMappings(const std::string& profileName) {
        // 保存到用户配置文件
    }

    void LoadCustomMappings(const std::string& profileName) {
        // 从用户配置文件加载
    }
};
```

## 分辨率适配

### 分辨率管理系统

```cpp
// engine/graphics/ResolutionManager.h
struct DisplayMode {
    int width;
    int height;
    int refreshRate;
    bool isHDR;
    bool isFullscreen;
};

class ResolutionManager {
private:
    DisplayMode m_currentMode;
    DisplayMode m_nativeMode;
    float m_renderScale;

    // 动态分辨率参数
    bool m_dynamicResolutionEnabled;
    float m_minRenderScale;
    float m_maxRenderScale;
    float m_targetFrameTime;

public:
    void Initialize() {
        // 获取原生显示分辨率
        m_nativeMode = GetNativeDisplayMode();

        // 根据平台设置默认渲染分辨率
        switch (PlatformFactory::GetPlatformInfo().type) {
            case PlatformType::PC:
                // PC使用用户设置或原生分辨率
                m_currentMode = LoadUserSettings().displayMode;
                break;

            case PlatformType::PS5:
            case PlatformType::XboxSeriesX:
                // 主机默认4K
                m_currentMode = {3840, 2160, 60, true, true};
                break;

            case PlatformType::Switch:
                // Switch根据模式选择
                if (IsDockedMode()) {
                    m_currentMode = {1920, 1080, 60, false, true};
                } else {
                    m_currentMode = {1280, 720, 60, false, true};
                }
                break;

            case PlatformType::Mobile:
                // 移动端使用屏幕分辨率，可能降采样
                m_currentMode = m_nativeMode;
                m_renderScale = DetermineOptimalRenderScale();
                break;
        }
    }

    float DetermineOptimalRenderScale() {
        auto caps = PlatformFactory::GetPlatformInfo();

        // 根据GPU能力确定渲染比例
        if (caps.gpuTier == GPUTier::High) {
            return 1.0f;  // 100%
        } else if (caps.gpuTier == GPUTier::Medium) {
            return 0.75f; // 75%
        } else {
            return 0.5f;  // 50%
        }
    }

    // 动态分辨率调整
    void UpdateDynamicResolution(float lastFrameTime) {
        if (!m_dynamicResolutionEnabled) return;

        // 根据帧时间调整渲染比例
        if (lastFrameTime > m_targetFrameTime * 1.1f) {
            // 帧时间过长，降低分辨率
            m_renderScale = std::max(m_minRenderScale,
                                     m_renderScale - 0.05f);
        } else if (lastFrameTime < m_targetFrameTime * 0.9f) {
            // 帧时间充裕，提高分辨率
            m_renderScale = std::min(m_maxRenderScale,
                                     m_renderScale + 0.02f);
        }
    }

    int GetRenderWidth() const {
        return static_cast<int>(m_currentMode.width * m_renderScale);
    }

    int GetRenderHeight() const {
        return static_cast<int>(m_currentMode.height * m_renderScale);
    }
};
```

### UI自适应布局

```cpp
// engine/ui/UIScaling.h
class UIScalingManager {
private:
    float m_dpiScale;
    float m_uiScale;
    Vector2 m_referenceResolution;  // UI设计参考分辨率
    Vector2 m_currentResolution;

public:
    void Initialize() {
        // 设置UI参考分辨率（通常是1920x1080）
        m_referenceResolution = Vector2(1920, 1080);

        // 获取当前分辨率
        m_currentResolution = Vector2(
            ResolutionManager::Get()->GetRenderWidth(),
            ResolutionManager::Get()->GetRenderHeight()
        );

        // 计算DPI缩放
        m_dpiScale = CalculateDPIScale();

        // 计算UI缩放因子
        CalculateUIScale();
    }

    float CalculateDPIScale() {
        auto platformInfo = PlatformFactory::GetPlatformInfo();

        switch (platformInfo.type) {
            case PlatformType::Mobile:
                // 移动设备通常有高DPI
                return platformInfo.screenDPI / 160.0f;  // 160是Android的基准DPI

            case PlatformType::PC:
                // Windows DPI缩放
                return platformInfo.dpiScaling;

            default:
                // 主机和掌机通常是1:1
                return 1.0f;
        }
    }

    void CalculateUIScale() {
        // 使用 "Canvas Scaler" 风格的缩放策略
        float widthRatio = m_currentResolution.x / m_referenceResolution.x;
        float heightRatio = m_currentResolution.y / m_referenceResolution.y;

        // 可选策略：
        // 1. 适应宽度
        // m_uiScale = widthRatio;

        // 2. 适应高度
        // m_uiScale = heightRatio;

        // 3. 取较小值（确保UI完全可见）
        m_uiScale = std::min(widthRatio, heightRatio);

        // 4. 混合（推荐）
        // m_uiScale = std::pow(widthRatio, 0.5f) * std::pow(heightRatio, 0.5f);

        // 应用DPI缩放
        m_uiScale *= m_dpiScale;

        // 限制缩放范围
        m_uiScale = std::clamp(m_uiScale, 0.5f, 2.0f);
    }

    // 将设计坐标转换为屏幕坐标
    Vector2 DesignToScreen(const Vector2& designPos) const {
        return designPos * m_uiScale;
    }

    // 将设计尺寸转换为屏幕尺寸
    float DesignToScreen(float designSize) const {
        return designSize * m_uiScale;
    }

    // 安全区域（处理刘海屏、圆角等）
    Rect GetSafeArea() const {
        auto platformInfo = PlatformFactory::GetPlatformInfo();

        if (platformInfo.type == PlatformType::Mobile) {
            // 获取移动设备安全区域
            return platformInfo.safeAreaInsets;
        }

        // 其他平台通常没有安全区域限制
        return Rect(0, 0, m_currentResolution.x, m_currentResolution.y);
    }
};
```

### 宽高比适配

```cpp
// engine/graphics/AspectRatioHandler.cpp
class AspectRatioHandler {
private:
    float m_targetAspect;      // 目标宽高比
    float m_currentAspect;     // 当前宽高比
    Rect m_viewport;           // 实际渲染区域
    LetterboxMode m_mode;

public:
    enum class LetterboxMode {
        None,           // 拉伸（可能变形）
        Pillarbox,      // 左右黑边（屏幕比目标宽）
        Letterbox,      // 上下黑边（屏幕比目标高）
        Auto,           // 自动选择
        Expand,         // 扩展视野（不裁剪）
    };

    void Initialize(float targetAspect, LetterboxMode mode = LetterboxMode::Auto) {
        m_targetAspect = targetAspect;
        m_mode = mode;
        UpdateViewport();
    }

    void UpdateViewport() {
        int screenWidth = ResolutionManager::Get()->GetRenderWidth();
        int screenHeight = ResolutionManager::Get()->GetRenderHeight();
        m_currentAspect = static_cast<float>(screenWidth) / screenHeight;

        if (m_mode == LetterboxMode::None) {
            m_viewport = Rect(0, 0, screenWidth, screenHeight);
            return;
        }

        if (m_mode == LetterboxMode::Expand) {
            // 扩展模式：使用完整屏幕，调整相机FOV
            m_viewport = Rect(0, 0, screenWidth, screenHeight);
            return;
        }

        // 计算黑边
        if (m_currentAspect > m_targetAspect) {
            // 屏幕比目标宽，需要左右黑边（Pillarbox）
            int viewportWidth = static_cast<int>(screenHeight * m_targetAspect);
            int offsetX = (screenWidth - viewportWidth) / 2;
            m_viewport = Rect(offsetX, 0, viewportWidth, screenHeight);
        } else {
            // 屏幕比目标高，需要上下黑边（Letterbox）
            int viewportHeight = static_cast<int>(screenWidth / m_targetAspect);
            int offsetY = (screenHeight - viewportHeight) / 2;
            m_viewport = Rect(0, offsetY, screenWidth, viewportHeight);
        }
    }

    // 获取调整后的相机FOV（用于Expand模式）
    float GetAdjustedFOV(float baseFOV) const {
        if (m_mode != LetterboxMode::Expand) {
            return baseFOV;
        }

        // 根据宽高比差异调整FOV
        if (m_currentAspect > m_targetAspect) {
            // 更宽的屏幕，增加水平FOV
            float ratio = m_currentAspect / m_targetAspect;
            return baseFOV * ratio;
        }

        return baseFOV;
    }

    const Rect& GetViewport() const { return m_viewport; }
};
```

## 性能缩放

### 质量等级系统

```cpp
// engine/graphics/QualitySettings.h
struct QualityLevel {
    std::string name;

    // 渲染质量
    float renderScale;                  // 渲染分辨率比例
    int shadowMapResolution;            // 阴影贴图分辨率
    int shadowCascades;                 // 阴影级联数
    bool shadowsEnabled;

    // 后处理
    bool ambientOcclusionEnabled;
    bool bloomEnabled;
    bool motionBlurEnabled;
    bool depthOfFieldEnabled;
    AntiAliasingMode antiAliasing;      // None, FXAA, SMAA, TAA, MSAA

    // 细节层次
    float lodBias;                      // LOD偏移
    float drawDistance;                 // 绘制距离
    float vegetationDensity;            // 植被密度
    float particleDensity;              // 粒子密度

    // 纹理
    int textureQuality;                 // 0=Low, 1=Medium, 2=High, 3=Ultra
    bool anisotropicFiltering;
    int anisotropicLevel;

    // 光照
    int maxDynamicLights;
    bool volumetricLightingEnabled;
    bool globalIlluminationEnabled;

    // 帧率目标
    int targetFrameRate;
    bool vsyncEnabled;
};

class QualityManager {
private:
    std::vector<QualityLevel> m_presets;
    QualityLevel m_currentSettings;
    int m_currentPresetIndex;

public:
    void Initialize() {
        // 定义质量预设
        m_presets = {
            CreateLowPreset(),
            CreateMediumPreset(),
            CreateHighPreset(),
            CreateUltraPreset()
        };

        // 根据平台自动选择
        AutoSelectQuality();
    }

    QualityLevel CreateLowPreset() {
        return QualityLevel{
            .name = "Low",
            .renderScale = 0.5f,
            .shadowMapResolution = 512,
            .shadowCascades = 1,
            .shadowsEnabled = true,
            .ambientOcclusionEnabled = false,
            .bloomEnabled = false,
            .motionBlurEnabled = false,
            .depthOfFieldEnabled = false,
            .antiAliasing = AntiAliasingMode::FXAA,
            .lodBias = 2.0f,
            .drawDistance = 500.0f,
            .vegetationDensity = 0.25f,
            .particleDensity = 0.25f,
            .textureQuality = 0,
            .anisotropicFiltering = false,
            .anisotropicLevel = 1,
            .maxDynamicLights = 2,
            .volumetricLightingEnabled = false,
            .globalIlluminationEnabled = false,
            .targetFrameRate = 30,
            .vsyncEnabled = true
        };
    }

    QualityLevel CreateUltraPreset() {
        return QualityLevel{
            .name = "Ultra",
            .renderScale = 1.0f,
            .shadowMapResolution = 4096,
            .shadowCascades = 4,
            .shadowsEnabled = true,
            .ambientOcclusionEnabled = true,
            .bloomEnabled = true,
            .motionBlurEnabled = true,
            .depthOfFieldEnabled = true,
            .antiAliasing = AntiAliasingMode::TAA,
            .lodBias = 0.0f,
            .drawDistance = 2000.0f,
            .vegetationDensity = 1.0f,
            .particleDensity = 1.0f,
            .textureQuality = 3,
            .anisotropicFiltering = true,
            .anisotropicLevel = 16,
            .maxDynamicLights = 16,
            .volumetricLightingEnabled = true,
            .globalIlluminationEnabled = true,
            .targetFrameRate = 60,
            .vsyncEnabled = true
        };
    }

    void AutoSelectQuality() {
        auto platformInfo = PlatformFactory::GetPlatformInfo();

        switch (platformInfo.type) {
            case PlatformType::PS5:
            case PlatformType::XboxSeriesX:
                // 次世代主机默认Ultra
                SetQualityPreset(3);  // Ultra
                break;

            case PlatformType::XboxSeriesS:
                // Series S使用High
                SetQualityPreset(2);  // High
                break;

            case PlatformType::Switch:
                // Switch使用Low
                SetQualityPreset(0);  // Low
                // 但针对Switch优化特定设置
                m_currentSettings.targetFrameRate = IsDockedMode() ? 30 : 30;
                break;

            case PlatformType::PC:
                // PC根据硬件自动检测
                AutoDetectPCQuality();
                break;

            case PlatformType::Mobile:
                // 移动端根据芯片选择
                AutoDetectMobileQuality(platformInfo);
                break;
        }
    }

    void AutoDetectPCQuality() {
        // 获取GPU信息
        auto gpuInfo = GetGPUInfo();

        // 简化的GPU性能分级
        if (gpuInfo.dedicatedVRAM >= 8 * GB && gpuInfo.benchmarkScore > 15000) {
            SetQualityPreset(3);  // Ultra
        } else if (gpuInfo.dedicatedVRAM >= 4 * GB && gpuInfo.benchmarkScore > 8000) {
            SetQualityPreset(2);  // High
        } else if (gpuInfo.dedicatedVRAM >= 2 * GB && gpuInfo.benchmarkScore > 4000) {
            SetQualityPreset(1);  // Medium
        } else {
            SetQualityPreset(0);  // Low
        }
    }

    void AutoDetectMobileQuality(const PlatformInfo& info) {
        // 根据芯片型号选择质量
        if (info.chipset.Contains("A17") || info.chipset.Contains("A16") ||
            info.chipset.Contains("Snapdragon 8 Gen 3")) {
            SetQualityPreset(2);  // High
        } else if (info.chipset.Contains("A15") || info.chipset.Contains("A14") ||
                   info.chipset.Contains("Snapdragon 8 Gen 1")) {
            SetQualityPreset(1);  // Medium
        } else {
            SetQualityPreset(0);  // Low
        }

        // 移动端额外考虑散热
        m_currentSettings.targetFrameRate = 30;  // 降低功耗
    }
};
```

### 动态性能调节

```cpp
// engine/performance/DynamicPerformanceScaler.cpp
class DynamicPerformanceScaler {
private:
    // 性能指标
    float m_targetFrameTime;            // 目标帧时间
    float m_averageFrameTime;           // 平均帧时间
    std::deque<float> m_frameTimeHistory;
    size_t m_historySize;

    // 可调节参数
    float m_currentRenderScale;
    int m_currentShadowResolution;
    float m_currentDrawDistance;

    // 调节阈值
    float m_scaleDownThreshold;         // 降质量阈值
    float m_scaleUpThreshold;           // 升质量阈值
    float m_adjustmentCooldown;         // 调节冷却时间
    float m_lastAdjustmentTime;

public:
    void Initialize(int targetFPS) {
        m_targetFrameTime = 1000.0f / targetFPS;  // 毫秒
        m_scaleDownThreshold = m_targetFrameTime * 1.15f;  // 超过15%降质量
        m_scaleUpThreshold = m_targetFrameTime * 0.85f;    // 低于85%升质量
        m_adjustmentCooldown = 1.0f;  // 1秒冷却
        m_historySize = 30;

        m_currentRenderScale = 1.0f;
        m_currentShadowResolution = 2048;
        m_currentDrawDistance = 1000.0f;
    }

    void Update(float frameTime) {
        // 更新帧时间历史
        m_frameTimeHistory.push_back(frameTime);
        if (m_frameTimeHistory.size() > m_historySize) {
            m_frameTimeHistory.pop_front();
        }

        // 计算平均帧时间
        m_averageFrameTime = 0;
        for (float ft : m_frameTimeHistory) {
            m_averageFrameTime += ft;
        }
        m_averageFrameTime /= m_frameTimeHistory.size();

        // 检查是否需要调节
        float currentTime = GetTime();
        if (currentTime - m_lastAdjustmentTime < m_adjustmentCooldown) {
            return;
        }

        if (m_averageFrameTime > m_scaleDownThreshold) {
            // 性能不足，降低质量
            ScaleDown();
            m_lastAdjustmentTime = currentTime;
        } else if (m_averageFrameTime < m_scaleUpThreshold) {
            // 性能充裕，提高质量
            ScaleUp();
            m_lastAdjustmentTime = currentTime;
        }
    }

    void ScaleDown() {
        // 按优先级降低质量
        // 1. 首先降低渲染分辨率
        if (m_currentRenderScale > 0.5f) {
            m_currentRenderScale -= 0.1f;
            ResolutionManager::Get()->SetRenderScale(m_currentRenderScale);
            return;
        }

        // 2. 降低阴影质量
        if (m_currentShadowResolution > 512) {
            m_currentShadowResolution /= 2;
            QualityManager::Get()->SetShadowResolution(m_currentShadowResolution);
            return;
        }

        // 3. 降低绘制距离
        if (m_currentDrawDistance > 300.0f) {
            m_currentDrawDistance *= 0.8f;
            QualityManager::Get()->SetDrawDistance(m_currentDrawDistance);
            return;
        }

        // 4. 关闭后处理效果
        DisableNonEssentialPostProcessing();
    }

    void ScaleUp() {
        // 逆向恢复质量
        // 1. 首先恢复后处理
        if (EnableNextPostProcessingEffect()) {
            return;
        }

        // 2. 恢复绘制距离
        float maxDrawDistance = QualityManager::Get()->GetMaxDrawDistance();
        if (m_currentDrawDistance < maxDrawDistance) {
            m_currentDrawDistance = std::min(m_currentDrawDistance * 1.1f,
                                              maxDrawDistance);
            QualityManager::Get()->SetDrawDistance(m_currentDrawDistance);
            return;
        }

        // 3. 恢复阴影质量
        int maxShadowRes = QualityManager::Get()->GetMaxShadowResolution();
        if (m_currentShadowResolution < maxShadowRes) {
            m_currentShadowResolution *= 2;
            QualityManager::Get()->SetShadowResolution(m_currentShadowResolution);
            return;
        }

        // 4. 恢复渲染分辨率
        if (m_currentRenderScale < 1.0f) {
            m_currentRenderScale = std::min(m_currentRenderScale + 0.05f, 1.0f);
            ResolutionManager::Get()->SetRenderScale(m_currentRenderScale);
        }
    }
};
```

### LOD系统

```cpp
// engine/graphics/LODSystem.h
class LODManager {
private:
    struct LODLevel {
        float maxDistance;
        float transitionRange;
        int meshIndex;
    };

    std::unordered_map<MeshId, std::vector<LODLevel>> m_lodGroups;
    float m_globalLODBias;

public:
    void RegisterLODGroup(MeshId baseMesh, const std::vector<LODLevel>& levels) {
        m_lodGroups[baseMesh] = levels;
    }

    int SelectLOD(MeshId meshId, float distanceToCamera) {
        auto it = m_lodGroups.find(meshId);
        if (it == m_lodGroups.end()) {
            return 0;  // 无LOD，使用原始网格
        }

        // 应用LOD偏移
        float adjustedDistance = distanceToCamera / (1.0f + m_globalLODBias);

        const auto& levels = it->second;
        for (size_t i = 0; i < levels.size(); i++) {
            if (adjustedDistance < levels[i].maxDistance) {
                return levels[i].meshIndex;
            }
        }

        // 超出所有LOD范围，剔除
        return -1;
    }

    // 计算LOD过渡（用于淡入淡出）
    float CalculateLODTransition(MeshId meshId, float distance, int& currentLOD,
                                  int& nextLOD) {
        auto it = m_lodGroups.find(meshId);
        if (it == m_lodGroups.end()) {
            currentLOD = 0;
            nextLOD = 0;
            return 0.0f;
        }

        const auto& levels = it->second;
        for (size_t i = 0; i < levels.size(); i++) {
            float transitionStart = levels[i].maxDistance - levels[i].transitionRange;
            float transitionEnd = levels[i].maxDistance;

            if (distance < transitionStart) {
                currentLOD = levels[i].meshIndex;
                nextLOD = levels[i].meshIndex;
                return 0.0f;
            }

            if (distance < transitionEnd) {
                currentLOD = levels[i].meshIndex;
                nextLOD = (i + 1 < levels.size()) ? levels[i + 1].meshIndex : -1;
                // 返回过渡进度
                return (distance - transitionStart) / levels[i].transitionRange;
            }
        }

        currentLOD = -1;
        nextLOD = -1;
        return 1.0f;
    }

    void SetGlobalLODBias(float bias) {
        // 正值=使用更低质量LOD，负值=使用更高质量LOD
        m_globalLODBias = std::clamp(bias, -2.0f, 2.0f);
    }
};
```

## 平台特定功能

### 主机成就/奖杯系统

```cpp
// engine/platform/IAchievementSystem.h
class IAchievementSystem {
public:
    virtual ~IAchievementSystem() = default;

    virtual void Initialize() = 0;
    virtual void UnlockAchievement(const std::string& achievementId) = 0;
    virtual void SetAchievementProgress(const std::string& achievementId,
                                         float progress) = 0;
    virtual bool IsAchievementUnlocked(const std::string& achievementId) = 0;
    virtual void ShowAchievementUI() = 0;
};

// platform/playstation/PS5TrophySystem.cpp
class PS5TrophySystem : public IAchievementSystem {
private:
    SceNpTrophyContext m_context;
    SceNpTrophyHandle m_handle;

public:
    void Initialize() override {
        // 初始化PS5奖杯系统
        sceNpTrophyCreateContext(&m_context, 0, 0, 0);
        sceNpTrophyCreateHandle(&m_handle);

        // 注册奖杯包
        sceNpTrophyRegisterContext(m_context, m_handle, 0);
    }

    void UnlockAchievement(const std::string& achievementId) override {
        // PS5奖杯使用数字ID
        SceNpTrophyId trophyId = GetTrophyId(achievementId);

        SceNpTrophyDetails details;
        SceNpTrophyData data;

        int result = sceNpTrophyUnlockTrophy(m_context, m_handle,
                                              trophyId, &details, &data);

        if (result == SCE_NP_TROPHY_ERROR_TROPHY_ALREADY_UNLOCKED) {
            // 奖杯已解锁
        }
    }

    void SetAchievementProgress(const std::string& achievementId,
                                float progress) override {
        // PS5支持奖杯进度显示
        SceNpTrophyId trophyId = GetTrophyId(achievementId);
        int32_t progressPercent = static_cast<int32_t>(progress * 100);

        sceNpTrophySetTrophyProgress(m_context, m_handle, trophyId, progressPercent);
    }
};

// platform/xbox/XboxAchievementSystem.cpp
class XboxAchievementSystem : public IAchievementSystem {
private:
    XTaskQueueHandle m_queue;
    XblContextHandle m_xblContext;

public:
    void Initialize() override {
        // 初始化Xbox Live
        XTaskQueueCreate(XTaskQueueDispatchMode::ThreadPool,
                        XTaskQueueDispatchMode::ThreadPool,
                        &m_queue);
    }

    void UnlockAchievement(const std::string& achievementId) override {
        XblAchievementsUpdateAchievementAsync(
            m_xblContext,
            m_xuid,
            achievementId.c_str(),
            100,  // 100% 完成
            &m_asyncBlock
        );
    }

    void SetAchievementProgress(const std::string& achievementId,
                                float progress) override {
        XblAchievementsUpdateAchievementAsync(
            m_xblContext,
            m_xuid,
            achievementId.c_str(),
            static_cast<uint32_t>(progress * 100),
            &m_asyncBlock
        );
    }
};

// platform/steam/SteamAchievementSystem.cpp
class SteamAchievementSystem : public IAchievementSystem {
public:
    void Initialize() override {
        if (!SteamAPI_Init()) {
            LogError("Failed to initialize Steam API");
            return;
        }
    }

    void UnlockAchievement(const std::string& achievementId) override {
        SteamUserStats()->SetAchievement(achievementId.c_str());
        SteamUserStats()->StoreStats();  // 同步到服务器
    }

    void SetAchievementProgress(const std::string& achievementId,
                                float progress) override {
        // Steam成就使用关联的Stat来显示进度
        std::string statName = achievementId + "_progress";
        SteamUserStats()->SetStat(statName.c_str(), progress);
        SteamUserStats()->StoreStats();
    }

    void ShowAchievementUI() override {
        SteamFriends()->ActivateGameOverlay("achievements");
    }
};
```

### 云存档系统

```cpp
// engine/platform/ICloudSaveSystem.h
class ICloudSaveSystem {
public:
    virtual ~ICloudSaveSystem() = default;

    virtual bool IsCloudSaveAvailable() = 0;
    virtual void UploadSave(const std::string& slotName,
                           const std::vector<uint8_t>& data,
                           SaveCallback callback) = 0;
    virtual void DownloadSave(const std::string& slotName,
                             LoadCallback callback) = 0;
    virtual void ListSaves(ListCallback callback) = 0;
    virtual void DeleteSave(const std::string& slotName,
                           DeleteCallback callback) = 0;

    // 冲突解决
    virtual void ResolveConflict(const std::string& slotName,
                                 ConflictResolution resolution) = 0;
};

// platform/playstation/PS5CloudSave.cpp
class PS5CloudSave : public ICloudSaveSystem {
private:
    SceSaveDataMount m_mount;

public:
    bool IsCloudSaveAvailable() override {
        // 检查PS Plus订阅状态
        SceNpCheckPlusResult result;
        sceNpCheckPlus(&result);
        return result.authorized;
    }

    void UploadSave(const std::string& slotName,
                    const std::vector<uint8_t>& data,
                    SaveCallback callback) override {
        // PS5存档自动同步到云端（如果用户启用）
        SceSaveDataMount mount;
        SceSaveDataMountPoint mp;

        SceSaveDataMountParams params = {};
        params.dirName = slotName.c_str();
        params.blocks = CalculateRequiredBlocks(data.size());
        params.mountMode = SCE_SAVE_DATA_MOUNT_MODE_RDWR |
                          SCE_SAVE_DATA_MOUNT_MODE_CREATE;

        int result = sceSaveDataMount(&params, &mp);
        if (result >= 0) {
            // 写入存档数据
            std::string filePath = std::string(mp.data) + "/save.dat";
            WriteFile(filePath, data);

            // 卸载（会触发云同步）
            sceSaveDataUmount(&mp);

            callback(true, "");
        } else {
            callback(false, "Mount failed");
        }
    }
};

// 统一的存档管理器
class SaveManager {
private:
    std::unique_ptr<ICloudSaveSystem> m_cloudSave;
    std::unique_ptr<IFileSystem> m_localFS;

public:
    void SaveGame(const std::string& slotName, const GameSaveData& saveData) {
        // 序列化存档
        std::vector<uint8_t> data = SerializeSave(saveData);

        // 首先保存到本地
        std::string localPath = m_localFS->GetSaveDataPath() + "/" + slotName;
        m_localFS->WriteFile(localPath, data);

        // 然后尝试云同步
        if (m_cloudSave && m_cloudSave->IsCloudSaveAvailable()) {
            m_cloudSave->UploadSave(slotName, data, [](bool success,
                                                        const std::string& error) {
                if (!success) {
                    LogWarning("Cloud save failed: " + error);
                    // 云同步失败不影响本地存档
                }
            });
        }
    }

    void LoadGame(const std::string& slotName, LoadGameCallback callback) {
        // 检查云存档是否更新
        if (m_cloudSave && m_cloudSave->IsCloudSaveAvailable()) {
            m_cloudSave->DownloadSave(slotName, [this, slotName, callback]
                                      (bool success, const std::vector<uint8_t>& cloudData) {
                std::string localPath = m_localFS->GetSaveDataPath() + "/" + slotName;
                auto localData = m_localFS->ReadFile(localPath);

                if (success && !cloudData.empty()) {
                    // 比较云存档和本地存档
                    if (IsCloudNewer(cloudData, localData)) {
                        callback(DeserializeSave(cloudData));
                    } else if (IsLocalNewer(cloudData, localData)) {
                        // 显示冲突解决UI
                        ShowConflictResolutionUI(cloudData, localData, callback);
                    } else {
                        callback(DeserializeSave(localData));
                    }
                } else {
                    // 使用本地存档
                    callback(DeserializeSave(localData));
                }
            });
        } else {
            // 只使用本地存档
            std::string localPath = m_localFS->GetSaveDataPath() + "/" + slotName;
            auto data = m_localFS->ReadFile(localPath);
            callback(DeserializeSave(data));
        }
    }
};
```

### 平台特定UI元素

```cpp
// engine/ui/PlatformUIHelper.h
class PlatformUIHelper {
public:
    // 获取确认/取消按钮图标
    static std::string GetConfirmButtonIcon() {
        switch (GetCurrentPlatform()) {
            case Platform::PlayStation:
                // PlayStation在日本区域X是确认，其他区域是O
                return IsJapanRegion() ? "icon_cross" : "icon_circle";
            case Platform::Xbox:
                return "icon_a";
            case Platform::Switch:
                return IsJapanRegion() ? "icon_a" : "icon_b";  // Switch也有区域差异
            case Platform::PC:
                return GetActiveController() == Controller::PlayStation
                    ? GetConfirmButtonIcon()  // 递归使用PS布局
                    : "icon_enter";
            default:
                return "icon_confirm";
        }
    }

    static std::string GetCancelButtonIcon() {
        switch (GetCurrentPlatform()) {
            case Platform::PlayStation:
                return IsJapanRegion() ? "icon_circle" : "icon_cross";
            case Platform::Xbox:
                return "icon_b";
            case Platform::Switch:
                return IsJapanRegion() ? "icon_b" : "icon_a";
            case Platform::PC:
                return "icon_escape";
            default:
                return "icon_cancel";
        }
    }

    // 获取按键提示文本
    static std::string GetButtonPrompt(GameAction action) {
        InputBinding binding = InputMapper::Get()->GetActionMapping(action);

        std::string prompt;
        switch (binding.type) {
            case BindingType::Keyboard:
                prompt = GetKeyName(binding.keyCode);
                break;
            case BindingType::Gamepad:
                prompt = GetGamepadButtonName(binding.button);
                break;
            case BindingType::Touch:
                prompt = GetTouchGestureName(binding.gesture);
                break;
        }

        return prompt;
    }

    // 动态更新按键提示
    static void UpdateButtonPrompts(UIElement* promptContainer) {
        InputDeviceType activeDevice = InputManager::Get()->GetActiveDeviceType();

        for (auto* prompt : promptContainer->GetChildren()) {
            GameAction action = prompt->GetAssociatedAction();
            std::string icon = GetButtonIcon(action, activeDevice);
            prompt->SetIcon(icon);
        }
    }
};
```

## 主机认证要求

### 认证要求概览

各主机平台都有严格的技术要求检查（TRC/TCR/Lotcheck）：

```
┌─────────────────────────────────────────────────────────────────┐
│                     主机认证要求对比                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PlayStation TRC          Xbox TCR              Nintendo Lotcheck│
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐│
│  │ 账户管理        │    │ Xbox Live集成   │    │ 用户账户        ││
│  │ 奖杯系统        │    │ 成就系统        │    │ 存档管理        ││
│  │ 存档处理        │    │ 云存储          │    │ 睡眠/恢复       ││
│  │ 网络功能        │    │ 网络要求        │    │ 控制器处理      ││
│  │ 错误处理        │    │ 错误处理        │    │ 错误显示        ││
│  │ 内容分级        │    │ 内容限制        │    │ 家长控制        ││
│  │ 辅助功能        │    │ 辅助功能        │    │ 辅助功能        ││
│  │ Activity支持   │    │ Smart Delivery  │    │ 多语言支持      ││
│  └─────────────────┘    └─────────────────┘    └─────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 用户账户管理

```cpp
// engine/platform/IUserManager.h
class IUserManager {
public:
    virtual ~IUserManager() = default;

    // 用户切换检测
    virtual void SetUserChangedCallback(UserChangedCallback callback) = 0;
    virtual UserInfo GetCurrentUser() = 0;
    virtual bool IsUserSignedIn() = 0;

    // 多用户支持
    virtual std::vector<UserInfo> GetAllUsers() = 0;
    virtual void SelectUser(SelectUserCallback callback) = 0;

    // 网络状态
    virtual bool IsOnline() = 0;
    virtual void SetConnectivityChangedCallback(ConnectivityCallback callback) = 0;
};

// platform/playstation/PS5UserManager.cpp
class PS5UserManager : public IUserManager {
private:
    SceUserServiceUserId m_currentUser;
    std::function<void(SceUserServiceUserId)> m_userChangedCallback;

public:
    void Initialize() {
        // 获取初始用户
        sceUserServiceGetInitialUser(&m_currentUser);

        // 注册用户切换事件
        sceUserServiceRegisterEventCallback(
            [](SceUserServiceEvent* event, void* userData) {
                auto* self = static_cast<PS5UserManager*>(userData);

                switch (event->eventType) {
                    case SCE_USER_SERVICE_EVENT_TYPE_LOGIN:
                        // 用户登录
                        self->OnUserLogin(event->userId);
                        break;

                    case SCE_USER_SERVICE_EVENT_TYPE_LOGOUT:
                        // 用户登出 - TRC要求必须正确处理
                        self->OnUserLogout(event->userId);
                        break;
                }
            },
            this
        );
    }

    void OnUserLogout(SceUserServiceUserId userId) {
        if (userId == m_currentUser) {
            // 当前用户登出，必须：
            // 1. 保存游戏进度
            SaveManager::Get()->SaveGameImmediately();

            // 2. 返回标题画面或暂停游戏
            GameStateManager::Get()->ReturnToTitle();

            // 3. 通知用户
            ShowSystemMessage("User signed out. Returning to title screen.");
        }
    }

    // TRC要求：游戏必须在任何时候都能响应用户切换
    void SetUserChangedCallback(UserChangedCallback callback) override {
        m_userChangedCallback = callback;
    }
};
```

### 存档处理要求

```cpp
// engine/save/SaveSystemTRC.cpp
class TRCCompliantSaveSystem {
private:
    std::atomic<bool> m_isSaving;

public:
    // TRC要求：存档过程中必须显示保存指示器
    void SaveGameWithIndicator(const std::string& slotName,
                               const GameSaveData& data) {
        if (m_isSaving.exchange(true)) {
            // 已经在保存中，拒绝新的保存请求
            return;
        }

        // 显示保存图标（TRC要求）
        UI::ShowSaveIndicator();

        // 异步保存
        AsyncTask::Run([this, slotName, data]() {
            bool success = PerformSave(slotName, data);

            // 回到主线程更新UI
            MainThread::Run([this, success]() {
                UI::HideSaveIndicator();
                m_isSaving = false;

                if (!success) {
                    // TRC要求：必须通知用户保存失败
                    ShowSaveErrorDialog();
                }
            });
        });
    }

    bool PerformSave(const std::string& slotName, const GameSaveData& data) {
        // 检查存储空间
        uint64_t required = CalculateRequiredSpace(data);
        uint64_t available = FileSystem::Get()->GetAvailableSpace();

        if (available < required) {
            // TRC要求：空间不足时必须提示用户
            MainThread::Run([required]() {
                ShowStorageFullDialog(required);
            });
            return false;
        }

        // 使用临时文件+重命名确保原子性
        std::string tempPath = slotName + ".tmp";
        std::string finalPath = slotName + ".sav";
        std::string backupPath = slotName + ".bak";

        // 写入临时文件
        if (!WriteToFile(tempPath, SerializeSave(data))) {
            return false;
        }

        // 备份现有存档
        if (FileExists(finalPath)) {
            RenameFile(finalPath, backupPath);
        }

        // 原子重命名
        if (!RenameFile(tempPath, finalPath)) {
            // 恢复备份
            if (FileExists(backupPath)) {
                RenameFile(backupPath, finalPath);
            }
            return false;
        }

        // 删除备份
        DeleteFile(backupPath);

        return true;
    }

    // TRC要求：存档损坏时的处理
    GameSaveData LoadGameWithRecovery(const std::string& slotName) {
        std::string finalPath = slotName + ".sav";
        std::string backupPath = slotName + ".bak";

        // 尝试加载主存档
        auto data = TryLoadSave(finalPath);
        if (data.has_value()) {
            return data.value();
        }

        // 主存档损坏，尝试备份
        if (FileExists(backupPath)) {
            data = TryLoadSave(backupPath);
            if (data.has_value()) {
                // 通知用户使用了备份
                ShowMessage("Save data was corrupted. Loaded backup save.");

                // 恢复备份为主存档
                CopyFile(backupPath, finalPath);

                return data.value();
            }
        }

        // 完全损坏
        ShowCorruptedSaveDialog();
        return GameSaveData{};  // 返回空数据
    }
};
```

### 暂停/恢复处理

```cpp
// engine/platform/SuspendResumeHandler.h
class SuspendResumeHandler {
private:
    std::atomic<bool> m_isSuspended;
    std::function<void()> m_onSuspend;
    std::function<void()> m_onResume;

public:
    void Initialize() {
        // 注册系统事件
        #ifdef PLATFORM_PS5
        sceSystemServiceRegisterCallback(
            SCE_SYSTEM_SERVICE_EVENT_GAME_SUSPEND,
            OnSuspendCallback, this);
        sceSystemServiceRegisterCallback(
            SCE_SYSTEM_SERVICE_EVENT_GAME_RESUME,
            OnResumeCallback, this);
        #endif

        #ifdef PLATFORM_SWITCH
        nn::oe::SetFocusStateChangedCallback(
            [](void* userData) {
                auto* self = static_cast<SuspendResumeHandler*>(userData);
                nn::oe::FocusState state = nn::oe::GetCurrentFocusState();
                if (state == nn::oe::FocusState_InFocus) {
                    self->OnResume();
                } else {
                    self->OnSuspend();
                }
            },
            this
        );
        #endif
    }

    void OnSuspend() {
        m_isSuspended = true;

        // TRC/Lotcheck要求：暂停时必须执行的操作

        // 1. 暂停游戏逻辑
        GameStateManager::Get()->Pause();

        // 2. 保存游戏状态（快速保存）
        SaveManager::Get()->QuickSave();

        // 3. 暂停音频
        AudioEngine::Get()->Pause();

        // 4. 释放不必要的资源
        ResourceManager::Get()->ReleaseNonEssential();

        // 5. 断开网络连接（某些平台要求）
        NetworkManager::Get()->Disconnect();

        if (m_onSuspend) {
            m_onSuspend();
        }
    }

    void OnResume() {
        m_isSuspended = false;

        // 恢复操作

        // 1. 重新连接网络
        NetworkManager::Get()->Reconnect();

        // 2. 验证用户会话
        if (!UserManager::Get()->ValidateSession()) {
            // 会话过期，返回标题
            GameStateManager::Get()->ReturnToTitle();
            return;
        }

        // 3. 恢复音频
        AudioEngine::Get()->Resume();

        // 4. 重新加载必要资源
        ResourceManager::Get()->ReloadEssential();

        // 5. 显示恢复画面（某些平台要求）
        UI::ShowResumeOverlay(1.0f);  // 1秒淡入

        if (m_onResume) {
            m_onResume();
        }
    }
};
```

### 辅助功能支持

```cpp
// engine/accessibility/AccessibilityManager.h
class AccessibilityManager {
public:
    struct AccessibilitySettings {
        // 视觉辅助
        bool highContrastMode;
        float textScale;
        bool colorBlindMode;
        ColorBlindType colorBlindType;  // Protanopia, Deuteranopia, Tritanopia
        bool screenReaderEnabled;
        bool subtitlesEnabled;
        float subtitleScale;
        bool speakerLabels;

        // 听觉辅助
        bool visualCuesForAudio;
        bool hapticFeedbackForAudio;

        // 运动辅助
        bool reducedMotion;
        bool autoAim;
        float autoAimStrength;
        bool holdToToggle;  // 将长按改为切换
        float inputSensitivity;
        bool singleStickMode;

        // 认知辅助
        bool simplifiedUI;
        bool extendedTimers;
        float timerMultiplier;
        bool skipQTE;  // 跳过快速时间事件
    };

private:
    AccessibilitySettings m_settings;

public:
    void Initialize() {
        // 从系统读取辅助功能设置
        LoadSystemAccessibilitySettings();

        // 加载用户自定义设置
        LoadUserSettings();
    }

    void LoadSystemAccessibilitySettings() {
        #ifdef PLATFORM_PS5
        // PS5系统级辅助功能
        SceSystemServiceParamAccessibility params;
        sceSystemServiceGetParamAccessibility(&params);

        m_settings.textScale = params.textSize;
        m_settings.highContrastMode = params.highContrast;
        m_settings.screenReaderEnabled = params.screenReader;
        #endif

        #ifdef PLATFORM_XBOX
        // Xbox辅助功能
        XAccessibilitySettings xSettings;
        XAccessibilityGetSettings(&xSettings);

        m_settings.highContrastMode = xSettings.highContrastEnabled;
        m_settings.textScale = xSettings.textScalingFactor;
        #endif
    }

    // 应用色盲模式
    void ApplyColorBlindFilter(RenderTarget* target) {
        if (!m_settings.colorBlindMode) return;

        // 使用后处理着色器进行颜色校正
        ColorCorrectionShader* shader = GetColorBlindShader(m_settings.colorBlindType);
        PostProcessManager::Get()->ApplyFilter(target, shader);
    }

    // 生成音频的视觉提示
    void OnAudioEvent(const AudioEvent& event) {
        if (!m_settings.visualCuesForAudio) return;

        // 在屏幕边缘显示方向指示器
        Vector2 screenPos = WorldToScreen(event.position);
        VisualCue cue;
        cue.position = GetEdgePosition(screenPos);
        cue.icon = GetAudioTypeIcon(event.type);
        cue.duration = event.duration;

        UI::ShowVisualCue(cue);

        // 触觉反馈
        if (m_settings.hapticFeedbackForAudio) {
            InputManager::Get()->PlayHapticEffect(0,
                GetHapticForAudioEvent(event));
        }
    }

    // 字幕处理
    void ShowSubtitle(const SubtitleData& data) {
        if (!m_settings.subtitlesEnabled) return;

        SubtitleDisplay display;
        display.text = data.text;
        display.scale = m_settings.subtitleScale;
        display.showSpeakerName = m_settings.speakerLabels;

        if (m_settings.speakerLabels) {
            display.speakerName = data.speaker;
            display.speakerColor = GetSpeakerColor(data.speaker);
        }

        // 背景对比度
        if (m_settings.highContrastMode) {
            display.backgroundColor = Color::Black;
            display.backgroundOpacity = 0.9f;
        }

        UI::ShowSubtitle(display);
    }
};
```

## 移动端优化

### 电池与散热管理

```cpp
// platform/mobile/PowerManager.h
class MobilePowerManager {
private:
    PowerMode m_currentMode;
    float m_batteryLevel;
    bool m_isCharging;
    float m_thermalState;

public:
    enum class PowerMode {
        Performance,    // 最高性能，快速耗电
        Balanced,       // 平衡模式
        PowerSaver,     // 省电模式
        Thermal         // 散热模式（设备过热时）
    };

    void Update() {
        // 更新电池状态
        UpdateBatteryState();

        // 更新热量状态
        UpdateThermalState();

        // 自动调整模式
        AutoAdjustMode();
    }

    void UpdateBatteryState() {
        #ifdef PLATFORM_IOS
        UIDevice* device = [UIDevice currentDevice];
        device.batteryMonitoringEnabled = YES;
        m_batteryLevel = device.batteryLevel;
        m_isCharging = device.batteryState == UIDeviceBatteryStateCharging ||
                       device.batteryState == UIDeviceBatteryStateFull;
        #endif

        #ifdef PLATFORM_ANDROID
        // 通过JNI获取电池信息
        m_batteryLevel = GetAndroidBatteryLevel();
        m_isCharging = IsAndroidCharging();
        #endif
    }

    void UpdateThermalState() {
        #ifdef PLATFORM_IOS
        // iOS热量状态API
        NSProcessInfo* processInfo = [NSProcessInfo processInfo];
        switch (processInfo.thermalState) {
            case NSProcessInfoThermalStateNominal:
                m_thermalState = 0.0f;
                break;
            case NSProcessInfoThermalStateFair:
                m_thermalState = 0.33f;
                break;
            case NSProcessInfoThermalStateSerious:
                m_thermalState = 0.66f;
                break;
            case NSProcessInfoThermalStateCritical:
                m_thermalState = 1.0f;
                break;
        }
        #endif
    }

    void AutoAdjustMode() {
        // 过热时强制降低性能
        if (m_thermalState > 0.8f) {
            SetPowerMode(PowerMode::Thermal);
            return;
        }

        // 低电量且未充电时省电
        if (m_batteryLevel < 0.2f && !m_isCharging) {
            SetPowerMode(PowerMode::PowerSaver);
            return;
        }

        // 充电时可以提高性能
        if (m_isCharging) {
            SetPowerMode(PowerMode::Performance);
            return;
        }

        SetPowerMode(PowerMode::Balanced);
    }

    void SetPowerMode(PowerMode mode) {
        if (mode == m_currentMode) return;
        m_currentMode = mode;

        switch (mode) {
            case PowerMode::Performance:
                QualityManager::Get()->SetTargetFrameRate(60);
                QualityManager::Get()->SetQualityPreset(2);  // High
                break;

            case PowerMode::Balanced:
                QualityManager::Get()->SetTargetFrameRate(30);
                QualityManager::Get()->SetQualityPreset(1);  // Medium
                break;

            case PowerMode::PowerSaver:
            case PowerMode::Thermal:
                QualityManager::Get()->SetTargetFrameRate(30);
                QualityManager::Get()->SetQualityPreset(0);  // Low
                // 禁用后处理
                PostProcessManager::Get()->DisableAll();
                break;
        }
    }
};
```

### 内存管理

```cpp
// platform/mobile/MobileMemoryManager.h
class MobileMemoryManager {
private:
    size_t m_memoryBudget;
    size_t m_currentUsage;
    float m_memoryPressure;

public:
    void Initialize() {
        // 确定内存预算
        #ifdef PLATFORM_IOS
        // iOS内存管理
        size_t totalMemory = [NSProcessInfo processInfo].physicalMemory;
        // iOS应用通常只能使用总内存的一部分
        m_memoryBudget = totalMemory * 0.5;  // 保守估计

        // 注册内存警告
        [[NSNotificationCenter defaultCenter]
            addObserverForName:UIApplicationDidReceiveMemoryWarningNotification
            object:nil
            queue:nil
            usingBlock:^(NSNotification* note) {
                OnMemoryWarning();
            }];
        #endif

        #ifdef PLATFORM_ANDROID
        // Android内存管理
        ActivityManager am = GetActivityManager();
        ActivityManager.MemoryInfo mi = new ActivityManager.MemoryInfo();
        am.getMemoryInfo(mi);
        m_memoryBudget = mi.totalMem * 0.4;  // Android更保守
        #endif
    }

    void OnMemoryWarning() {
        // 收到内存警告，立即释放资源
        LogWarning("Memory warning received, releasing non-essential resources");

        // 1. 清理纹理缓存
        TextureCache::Get()->ReleaseUnused();

        // 2. 清理音频缓存
        AudioCache::Get()->ReleaseUnused();

        // 3. 降低纹理质量
        QualityManager::Get()->ReduceTextureQuality();

        // 4. 释放预加载的关卡资源
        LevelManager::Get()->UnloadNonCurrentLevels();

        // 5. 强制GC（如果使用托管代码）
        ForceGarbageCollection();

        // 6. 压缩池化内存
        MemoryPoolManager::Get()->Compact();
    }

    // 资源加载前检查
    bool CanAllocate(size_t size) {
        UpdateMemoryUsage();

        if (m_currentUsage + size > m_memoryBudget * 0.9f) {
            // 接近限制，尝试释放
            OnMemoryWarning();
            UpdateMemoryUsage();
        }

        return m_currentUsage + size < m_memoryBudget;
    }

    void UpdateMemoryUsage() {
        #ifdef PLATFORM_IOS
        struct task_basic_info info;
        mach_msg_type_number_t size = TASK_BASIC_INFO_COUNT;
        task_info(mach_task_self(), TASK_BASIC_INFO,
                  (task_info_t)&info, &size);
        m_currentUsage = info.resident_size;
        #endif
    }
};
```

### 触控优化

```cpp
// platform/mobile/TouchOptimization.h
class TouchOptimizer {
private:
    // 触控配置
    float m_tapThreshold;          // 点击阈值（像素）
    float m_swipeThreshold;        // 滑动阈值（像素）
    float m_holdDuration;          // 长按时间（秒）
    float m_doubleTapInterval;     // 双击间隔（秒）

    // 触控区域放大
    float m_touchTargetMinSize;    // 最小触控目标尺寸

public:
    void Initialize() {
        // 根据屏幕DPI调整阈值
        float dpi = GetScreenDPI();
        float densityScale = dpi / 160.0f;

        m_tapThreshold = 10.0f * densityScale;
        m_swipeThreshold = 50.0f * densityScale;

        // Apple HIG推荐最小44pt，Android推荐48dp
        #ifdef PLATFORM_IOS
        m_touchTargetMinSize = 44.0f * densityScale;
        #else
        m_touchTargetMinSize = 48.0f * densityScale;
        #endif
    }

    // 扩展触控区域
    Rect ExpandTouchTarget(const Rect& visualRect) {
        float width = std::max(visualRect.width, m_touchTargetMinSize);
        float height = std::max(visualRect.height, m_touchTargetMinSize);

        float expandX = (width - visualRect.width) / 2.0f;
        float expandY = (height - visualRect.height) / 2.0f;

        return Rect(
            visualRect.x - expandX,
            visualRect.y - expandY,
            width,
            height
        );
    }

    // 预测触控位置（减少延迟感）
    Vector2 PredictTouchPosition(const std::vector<TouchPoint>& history) {
        if (history.size() < 2) {
            return history.back().position;
        }

        // 使用最近几个点进行线性预测
        const auto& p1 = history[history.size() - 2];
        const auto& p2 = history[history.size() - 1];

        float dt = p2.timestamp - p1.timestamp;
        if (dt <= 0) {
            return p2.position;
        }

        Vector2 velocity = (p2.position - p1.position) / dt;
        float predictTime = 0.016f;  // 预测1帧

        return p2.position + velocity * predictTime;
    }

    // 手势消歧
    GestureType ResolveGesture(const std::vector<TouchPoint>& points) {
        if (points.empty()) return GestureType::None;

        const auto& start = points.front();
        const auto& end = points.back();
        float distance = (end.position - start.position).Length();
        float duration = end.timestamp - start.timestamp;

        if (distance < m_tapThreshold) {
            if (duration < m_holdDuration) {
                return GestureType::Tap;
            } else {
                return GestureType::LongPress;
            }
        }

        if (distance >= m_swipeThreshold) {
            Vector2 direction = (end.position - start.position).Normalized();

            if (std::abs(direction.x) > std::abs(direction.y)) {
                return direction.x > 0 ? GestureType::SwipeRight : GestureType::SwipeLeft;
            } else {
                return direction.y > 0 ? GestureType::SwipeDown : GestureType::SwipeUp;
            }
        }

        return GestureType::None;
    }
};
```

### 应用生命周期

```cpp
// platform/mobile/AppLifecycle.h
class MobileAppLifecycle {
public:
    enum class AppState {
        Active,         // 前台运行
        Inactive,       // 即将进入后台
        Background,     // 后台运行
        Suspended,      // 挂起
        Terminating     // 即将终止
    };

private:
    AppState m_state;
    std::function<void(AppState)> m_stateChangedCallback;

public:
    void Initialize() {
        #ifdef PLATFORM_IOS
        // iOS生命周期通知
        [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationWillResignActiveNotification
            object:nil queue:nil usingBlock:^(NSNotification* note) {
                OnStateChanged(AppState::Inactive);
            }];

        [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidEnterBackgroundNotification
            object:nil queue:nil usingBlock:^(NSNotification* note) {
                OnStateChanged(AppState::Background);
            }];

        [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationWillEnterForegroundNotification
            object:nil queue:nil usingBlock:^(NSNotification* note) {
                OnStateChanged(AppState::Inactive);
            }];

        [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationDidBecomeActiveNotification
            object:nil queue:nil usingBlock:^(NSNotification* note) {
                OnStateChanged(AppState::Active);
            }];

        [[NSNotificationCenter defaultCenter] addObserverForName:UIApplicationWillTerminateNotification
            object:nil queue:nil usingBlock:^(NSNotification* note) {
                OnStateChanged(AppState::Terminating);
            }];
        #endif
    }

    void OnStateChanged(AppState newState) {
        AppState oldState = m_state;
        m_state = newState;

        switch (newState) {
            case AppState::Inactive:
                // 即将失去焦点
                // 暂停游戏
                GameStateManager::Get()->Pause();
                break;

            case AppState::Background:
                // 进入后台
                // 快速保存
                SaveManager::Get()->QuickSave();
                // 暂停音频
                AudioEngine::Get()->Pause();
                // 释放图形资源
                GraphicsResourceManager::Get()->ReleaseBackgroundResources();
                break;

            case AppState::Active:
                // 恢复前台
                if (oldState == AppState::Background) {
                    // 从后台恢复
                    GraphicsResourceManager::Get()->RestoreResources();
                    AudioEngine::Get()->Resume();

                    // 验证会话
                    if (!NetworkManager::Get()->ValidateSession()) {
                        ShowReconnectDialog();
                    }
                }
                break;

            case AppState::Terminating:
                // 应用即将终止
                // 紧急保存
                SaveManager::Get()->EmergencySave();
                // 清理资源
                Shutdown();
                break;
        }

        if (m_stateChangedCallback) {
            m_stateChangedCallback(newState);
        }
    }
};
```

## 面试要点

### 高频面试问题

#### 如何设计跨平台游戏引擎架构？

**答案要点**：
- 使用分层架构：游戏逻辑层、引擎抽象层、平台适配层
- 抽象接口定义平台无关的API
- 工厂模式创建平台特定实现
- 编译时平台宏隔离平台代码
- 资源管线支持多平台格式

#### 不同平台的图形API有哪些？如何统一？

**答案要点**：
- DirectX 11/12（Windows/Xbox）
- Metal（iOS/macOS）
- Vulkan（跨平台）
- OpenGL/ES（旧系统/WebGL）
- 主机专用API（GNM、NVN）
- 使用RHI（渲染硬件接口）统一抽象

#### 如何处理不同平台的输入差异？

**答案要点**：
- 定义虚拟输入动作
- 输入映射系统
- 支持运行时切换输入设备
- 平台特定功能（触觉反馈、体感等）可选支持
- UI按键提示动态更新

#### 主机平台认证有哪些关键要求？

**答案要点**：
- 用户账户管理（登录/登出处理）
- 存档系统（保存指示器、错误处理、云同步）
- 暂停/恢复处理
- 网络中断处理
- 辅助功能支持
- 内容分级和家长控制

#### 移动端游戏有哪些特殊优化需求？

**答案要点**：
- 电池和散热管理
- 内存限制（处理内存警告）
- 触控输入优化
- 应用生命周期处理
- 动态性能缩放
- 网络不稳定处理

#### 如何实现跨平台的性能缩放？

**答案要点**：
- 质量预设系统
- 动态分辨率缩放
- LOD系统
- 可调节的后处理管线
- 根据硬件能力自动选择配置
- 运行时性能监控和调节

### 系统设计题示例

**题目**：设计一个跨平台联机游戏的网络架构

**参考回答框架**：

1. **需求分析**：
   - 支持PC、PS5、Xbox、Switch、手机
   - 跨平台联机
   - 低延迟实时同步
   - 断线重连

2. **架构设计**：
   - 使用专用游戏服务器
   - 平台抽象的网络层
   - 统一的玩家ID系统
   - 跨平台好友和匹配

3. **关键技术**：
   - 帧同步或状态同步
   - UDP可靠传输
   - 预测和回滚
   - 延迟补偿

4. **平台整合**：
   - 各平台在线服务对接（PSN、Xbox Live、Nintendo Online）
   - 统一后端账号系统
   - 跨平台好友邀请

## 延伸阅读

### 经典书籍

1. **《Game Engine Architecture》** - Jason Gregory
   - 游戏引擎架构圣经，包含跨平台设计

2. **《Cross-Platform Development in C++》** - Syd Logan
   - C++跨平台开发实践

3. **《Real-Time Rendering》** - Akenine-Moller等
   - 图形渲染技术，包含多平台考虑

### 官方文档

- [PlayStation Partners文档](https://partners.playstation.com/)（需开发者账号）
- [Xbox开发者文档](https://developer.microsoft.com/xbox)
- [Nintendo开发者门户](https://developer.nintendo.com/)（需开发者账号）
- [Apple游戏开发](https://developer.apple.com/games/)
- [Android游戏开发](https://developer.android.com/games)

### 游戏引擎资源

- [Unity跨平台开发](https://docs.unity3d.com/Manual/PlatformSpecific.html)
- [Unreal Engine平台开发](https://docs.unrealengine.com/platforms/)
- [Godot导出指南](https://docs.godotengine.org/en/stable/tutorials/export/)

### 优质文章

- [GDC Vault](https://gdcvault.com/) - 大量跨平台开发分享
- [Gamasutra/Game Developer](https://www.gamedeveloper.com/) - 游戏开发技术文章
- [Insomniac Games技术博客](https://www.insomniac.games/category/tech/) - 3A工作室实践

## 总结

跨平台游戏开发是一项复杂的系统工程，需要在多个层面进行精心设计：

1. **架构设计**：清晰的分层和抽象是基础
2. **输入适配**：统一的输入模型，支持各类输入设备
3. **性能缩放**：动态调节质量，适应不同硬件
4. **平台特性**：利用平台独特功能，提升体验
5. **认证要求**：遵守各平台的技术规范
6. **持续优化**：移动端尤其需要关注电量和内存

通过本文的学习，你应该能够：

1. 设计清晰的跨平台引擎架构
2. 实现平台无关的核心游戏逻辑
3. 正确处理各平台的输入、存储、网络差异
4. 满足主机平台的认证要求
5. 针对移动平台进行专项优化

记住，优秀的跨平台游戏不是简单的"移植"，而是在每个平台上都提供最佳体验的精心打磨。
