---
title: 游戏开发流程与工具链
description: 构建高效的游戏开发流程：版本控制、资产管理和构建自动化
track: gamedev
section: gameplay-systems
difficulty: beginner
tags:
  - 开发流程
  - 版本控制
  - 资产管理
  - 构建
status: imported
origin: old/src/content/docs/gamedev/game-dev-pipeline.zh.md
divergence: 0.219
issues: []
legacy:
  category: GameDev
  subcategory: Tools
  order: 38
  lastUpdated: 2026-01-07
---

游戏开发是一个复杂的创作过程，涉及程序员、美术、策划、音效等多个角色的紧密协作。一个高效的开发流程和工具链对于项目的成功至关重要。本文将深入介绍游戏开发的完整流程，以及各个阶段所需的工具和最佳实践。

## 游戏开发周期

### 开发阶段概述

一个完整的游戏开发周期通常包含以下阶段：

```
概念阶段 → 预制作 → 制作 → Alpha → Beta → Gold → 上线运营
   │         │        │       │       │       │        │
 2-4周    1-3个月   6-24个月  2-4周   4-8周   1-2周   持续
```

### 概念阶段（Concept Phase）

在这个阶段，团队确定游戏的核心愿景：

- **核心玩法**：游戏最核心的乐趣是什么
- **目标受众**：谁会玩这个游戏
- **市场定位**：竞品分析和差异化策略
- **技术可行性**：初步的技术评估

产出物：
- 概念文档（Concept Document）
- 原型演示（Prototype）
- 风格参考（Mood Board）

### 预制作阶段（Pre-Production）

在正式生产前验证核心玩法和建立开发流程：

```
核心团队任务:
├── 技术验证
│   ├── 引擎选择与评估
│   ├── 技术原型开发
│   └── 性能基准测试
├── 美术方向
│   ├── 视觉风格定义
│   ├── 角色/场景概念设计
│   └── UI/UX 设计规范
└── 流程建设
    ├── 版本控制策略
    ├── 资产管理流程
    └── 持续集成环境
```

### 制作阶段（Production）

正式的内容制作阶段，是最长的开发阶段：

- 程序开发各个游戏系统
- 美术制作场景、角色、动画等资产
- 策划设计关卡和数值
- 持续的功能迭代和 bug 修复

### Alpha 阶段

- 所有核心功能完成
- 游戏可以从头玩到尾
- 开始内部测试
- 专注于 bug 修复和平衡性调整

### Beta 阶段

- 内容锁定（Content Lock）
- 大规模测试（内测/公测）
- 性能优化
- 最终打磨

### Gold 阶段

- 提交最终版本
- 平台认证
- 准备发布

## Git 与 Git LFS

### 为什么游戏项目需要特殊的版本控制策略

游戏项目与传统软件项目有显著区别：

| 特征 | 传统软件 | 游戏项目 |
|------|----------|----------|
| 文件类型 | 主要是文本文件 | 大量二进制文件 |
| 仓库大小 | 通常 < 1GB | 可达数十 GB 甚至更大 |
| 协作模式 | 主要是程序员 | 多角色协作 |
| 文件冲突 | 可合并 | 二进制无法合并 |

### Git LFS 配置与使用

Git LFS（Large File Storage）是处理大文件的解决方案：

```bash
# 安装 Git LFS
# Windows (通过 Git for Windows 自带)
# macOS
brew install git-lfs

# Linux
sudo apt install git-lfs

# 初始化 Git LFS
git lfs install
```

#### 配置 .gitattributes

为游戏项目配置 LFS 跟踪规则：

```gitattributes
# .gitattributes - Unity 项目示例

# 图片资源
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.tif filter=lfs diff=lfs merge=lfs -text
*.exr filter=lfs diff=lfs merge=lfs -text
*.hdr filter=lfs diff=lfs merge=lfs -text

# 3D 模型
*.fbx filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text
*.max filter=lfs diff=lfs merge=lfs -text
*.ma filter=lfs diff=lfs merge=lfs -text
*.mb filter=lfs diff=lfs merge=lfs -text

# 音频
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.aif filter=lfs diff=lfs merge=lfs -text

# 视频
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text

# Unity 特定
*.unity filter=lfs diff=lfs merge=lfs -text
*.prefab filter=lfs diff=lfs merge=lfs -text
*.asset filter=lfs diff=lfs merge=lfs -text
*.controller filter=lfs diff=lfs merge=lfs -text
*.anim filter=lfs diff=lfs merge=lfs -text
*.cubemap filter=lfs diff=lfs merge=lfs -text
*.unitypackage filter=lfs diff=lfs merge=lfs -text

# Unreal 特定
*.uasset filter=lfs diff=lfs merge=lfs -text
*.umap filter=lfs diff=lfs merge=lfs -text

# 编译产物
*.dll filter=lfs diff=lfs merge=lfs -text
*.so filter=lfs diff=lfs merge=lfs -text
*.a filter=lfs diff=lfs merge=lfs -text

# 压缩包
*.zip filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text
*.rar filter=lfs diff=lfs merge=lfs -text
```

#### Git LFS 常用命令

```bash
# 查看 LFS 跟踪的文件类型
git lfs track

# 查看当前跟踪的文件
git lfs ls-files

# 查看 LFS 状态
git lfs status

# 拉取 LFS 文件
git lfs pull

# 获取而不检出
git lfs fetch

# 迁移现有文件到 LFS
git lfs migrate import --include="*.psd,*.png" --everything

# 清理旧的 LFS 缓存
git lfs prune
```

### 游戏项目的分支策略

推荐使用改进的 Git Flow：

```
main ─────●────────────●────────────●──▶ (发布版本)
          │            ↑            ↑
          │         release/1.0  release/1.1
          ▼            ↑            ↑
develop ──●────●───●───●────●───●───●──▶ (开发主线)
               │   ↑        │   ↑
               ▼   │        ▼   │
        feature/   │  feature/   │
        combat ────┘  inventory ─┘
```

#### 分支类型说明

```bash
# 功能分支 - 新功能开发
git checkout -b feature/player-movement develop

# 发布分支 - 版本发布准备
git checkout -b release/1.0.0 develop

# 热修复分支 - 紧急 bug 修复
git checkout -b hotfix/crash-fix main

# 资产分支 - 大型资产更新
git checkout -b assets/new-character develop
```

### 文件锁定机制

对于无法合并的二进制文件，需要使用文件锁定：

```bash
# Git LFS 文件锁定
git lfs lock "Assets/Characters/Hero.fbx"

# 查看已锁定的文件
git lfs locks

# 解锁文件
git lfs unlock "Assets/Characters/Hero.fbx"

# 强制解锁（管理员）
git lfs unlock --force "Assets/Characters/Hero.fbx"
```

#### 配合 Unity 的锁定策略

```yaml
# .gitconfig 或项目配置
[lfs]
    locksverify = true

# 在 Unity 中启用协作模式
# Edit → Project Settings → Version Control
# Mode: Visible Meta Files
# Asset Serialization: Force Text
```

## 资产管理工具

### 资产管理的核心挑战

游戏项目的资产管理面临以下挑战：

- **文件数量巨大**：一个中型项目可能有数万个文件
- **格式多样**：不同工具产出不同格式
- **依赖复杂**：资产之间存在复杂的引用关系
- **版本追踪**：需要追踪每个资产的修改历史
- **协作冲突**：多人同时修改同一资产

### 资产管理流程

```
原始资产          源文件              引擎资产
(Raw Assets)  →  (Source Files)  →  (Engine Assets)
   │                  │                   │
 PSD文件           PNG/TGA           Texture2D
 Maya场景          FBX导出             Prefab
 Pro Tools         WAV文件           AudioClip
```

### Perforce（P4）介绍

Perforce 是游戏行业广泛使用的版本控制系统：

```bash
# Perforce 基本命令

# 连接到服务器
p4 set P4PORT=ssl:perforce.company.com:1666
p4 set P4USER=username
p4 set P4CLIENT=workspace-name

# 获取最新文件
p4 sync

# 检出文件（锁定）
p4 edit "//depot/Assets/character.fbx"

# 添加新文件
p4 add "//depot/Assets/new_texture.png"

# 提交更改
p4 submit -d "Added new character texture"

# 查看文件状态
p4 opened

# 放弃更改
p4 revert "//depot/Assets/character.fbx"
```

#### Perforce vs Git LFS 对比

| 功能 | Perforce | Git LFS |
|------|----------|---------|
| 锁定机制 | 原生强制锁定 | 可选锁定 |
| 大文件处理 | 原生支持 | 需要 LFS 扩展 |
| 分支成本 | 较高 | 极低 |
| 离线工作 | 受限 | 完全支持 |
| 学习曲线 | 中等 | 较低 |
| 成本 | 商业授权 | 开源/托管费用 |
| 适合规模 | 大型团队 | 中小型团队 |

### 资产命名规范

建立一致的命名规范对资产管理至关重要：

```
[类型前缀]_[资产名称]_[变体]_[编号].[扩展名]

示例：
T_Brick_Wall_01.png        # 纹理
M_Character_Hero.mat       # 材质
SK_Character_Hero.fbx      # 骨骼网格
SM_Prop_Barrel.fbx         # 静态网格
A_Footsteps_Grass.wav      # 音频
FX_Explosion_Fire.prefab   # 特效
UI_Button_Primary.png      # UI元素
```

#### 常用前缀规范

```
前缀    类型           示例
───────────────────────────────────
T_      纹理          T_Wood_Diffuse
M_      材质          M_Wood_Standard
SM_     静态网格      SM_Tree_Oak
SK_     骨骼网格      SK_Character
A_      音频          A_BGM_Forest
FX_     特效          FX_Fire_Loop
UI_     UI资产        UI_HealthBar
BP_     蓝图(UE)      BP_Enemy_Zombie
```

### 资产目录结构

推荐的 Unity 项目目录结构：

```
Assets/
├── _Project/                    # 项目核心资产
│   ├── Art/
│   │   ├── Characters/
│   │   │   ├── Hero/
│   │   │   │   ├── Meshes/
│   │   │   │   ├── Textures/
│   │   │   │   ├── Animations/
│   │   │   │   └── Materials/
│   │   │   └── Enemies/
│   │   ├── Environment/
│   │   │   ├── Props/
│   │   │   ├── Architecture/
│   │   │   └── Nature/
│   │   ├── UI/
│   │   │   ├── Icons/
│   │   │   ├── Fonts/
│   │   │   └── Screens/
│   │   └── VFX/
│   │
│   ├── Audio/
│   │   ├── Music/
│   │   ├── SFX/
│   │   └── Voice/
│   │
│   ├── Prefabs/
│   │   ├── Characters/
│   │   ├── Props/
│   │   ├── UI/
│   │   └── Systems/
│   │
│   ├── Scenes/
│   │   ├── Levels/
│   │   ├── UI/
│   │   └── Test/
│   │
│   ├── Scripts/
│   │   ├── Core/
│   │   ├── Gameplay/
│   │   ├── UI/
│   │   └── Utils/
│   │
│   └── ScriptableObjects/
│       ├── Items/
│       ├── Characters/
│       └── Config/
│
├── ThirdParty/                  # 第三方资产
│   ├── TextMeshPro/
│   └── DOTween/
│
└── Plugins/                     # 原生插件
    ├── iOS/
    └── Android/
```

推荐的 Unreal 项目目录结构：

```
Content/
├── Characters/
│   ├── Hero/
│   │   ├── Meshes/
│   │   ├── Textures/
│   │   ├── Animations/
│   │   │   ├── AnimBP/
│   │   │   └── Sequences/
│   │   └── Blueprints/
│   └── Enemies/
│
├── Environment/
│   ├── Props/
│   ├── Architecture/
│   └── Landscape/
│
├── Audio/
│   ├── Music/
│   ├── SFX/
│   └── Dialogue/
│
├── UI/
│   ├── Widgets/
│   ├── Textures/
│   └── Fonts/
│
├── VFX/
│   ├── Particles/
│   └── Materials/
│
├── Maps/
│   ├── Levels/
│   └── SubLevels/
│
├── Blueprints/
│   ├── Core/
│   ├── Gameplay/
│   └── UI/
│
└── Data/
    ├── DataTables/
    └── Curves/
```

### 资产导入工作流

```python
# Unity 编辑器脚本示例 - 自动资产处理
# Assets/Editor/AssetPostprocessor.cs

using UnityEditor;
using UnityEngine;

public class GameAssetPostprocessor : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        TextureImporter importer = assetImporter as TextureImporter;

        // 根据路径自动设置导入配置
        if (assetPath.Contains("/UI/"))
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.mipmapEnabled = false;
        }
        else if (assetPath.Contains("/Characters/"))
        {
            importer.textureType = TextureImporterType.Default;
            importer.maxTextureSize = 2048;
            importer.textureCompression = TextureImporterCompression.Compressed;
        }
    }

    void OnPreprocessModel()
    {
        ModelImporter importer = assetImporter as ModelImporter;

        if (assetPath.Contains("/Characters/"))
        {
            importer.animationType = ModelImporterAnimationType.Human;
            importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
        }
        else if (assetPath.Contains("/Props/"))
        {
            importer.animationType = ModelImporterAnimationType.None;
            importer.generateColliders = true;
        }
    }

    void OnPostprocessAudio(AudioClip clip)
    {
        AudioImporter importer = assetImporter as AudioImporter;
        AudioImporterSampleSettings settings = importer.defaultSampleSettings;

        if (assetPath.Contains("/Music/"))
        {
            settings.loadType = AudioClipLoadType.Streaming;
            settings.compressionFormat = AudioCompressionFormat.Vorbis;
            settings.quality = 0.7f;
        }
        else if (assetPath.Contains("/SFX/"))
        {
            settings.loadType = AudioClipLoadType.DecompressOnLoad;
            settings.compressionFormat = AudioCompressionFormat.ADPCM;
        }

        importer.defaultSampleSettings = settings;
    }
}
```

## 构建自动化

### 为什么需要构建自动化

手动构建存在以下问题：

- **耗时且易出错**：复杂的构建步骤容易遗漏
- **不可重复**：不同人构建结果可能不同
- **阻塞开发**：开发者需要等待构建完成
- **难以追溯**：出问题时难以定位原因

### 游戏构建的特殊需求

```
游戏构建流程:
├── 代码编译
├── 资产处理
│   ├── 纹理压缩
│   ├── 光照烘焙
│   ├── 音频压缩
│   └── 资源打包
├── 多平台构建
│   ├── Windows
│   ├── macOS
│   ├── iOS
│   ├── Android
│   ├── PlayStation
│   ├── Xbox
│   └── Switch
└── 后处理
    ├── 符号文件提取
    ├── 版本号标记
    └── 发布包签名
```

### Unity 命令行构建

```bash
# Unity 命令行构建脚本
#!/bin/bash

UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.10f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="/path/to/project"
BUILD_PATH="/path/to/builds"
LOG_PATH="/path/to/logs"

# 构建 Windows 平台
$UNITY_PATH \
    -quit \
    -batchmode \
    -nographics \
    -projectPath "$PROJECT_PATH" \
    -executeMethod BuildScript.BuildWindows \
    -buildTarget Win64 \
    -logFile "$LOG_PATH/build_windows.log"

# 构建 Android 平台
$UNITY_PATH \
    -quit \
    -batchmode \
    -nographics \
    -projectPath "$PROJECT_PATH" \
    -executeMethod BuildScript.BuildAndroid \
    -buildTarget Android \
    -logFile "$LOG_PATH/build_android.log"
```

#### Unity 构建脚本

```csharp
// Assets/Editor/BuildScript.cs
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;
using System;
using System.Linq;

public class BuildScript
{
    static string[] GetScenes()
    {
        return EditorBuildSettings.scenes
            .Where(s => s.enabled)
            .Select(s => s.path)
            .ToArray();
    }

    static string GetBuildPath(string platform, string extension)
    {
        string buildNumber = Environment.GetEnvironmentVariable("BUILD_NUMBER") ?? "local";
        string version = PlayerSettings.bundleVersion;
        return $"Builds/{platform}/Game_{version}_{buildNumber}{extension}";
    }

    static void ConfigureBuildSettings()
    {
        // 从环境变量读取版本号
        string version = Environment.GetEnvironmentVariable("VERSION");
        if (!string.IsNullOrEmpty(version))
        {
            PlayerSettings.bundleVersion = version;
        }

        // 配置 Android 版本号
        string buildNumber = Environment.GetEnvironmentVariable("BUILD_NUMBER");
        if (!string.IsNullOrEmpty(buildNumber))
        {
            PlayerSettings.Android.bundleVersionCode = int.Parse(buildNumber);
            PlayerSettings.iOS.buildNumber = buildNumber;
        }
    }

    [MenuItem("Build/Build Windows")]
    public static void BuildWindows()
    {
        ConfigureBuildSettings();

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = GetScenes(),
            locationPathName = GetBuildPath("Windows", "/Game.exe"),
            target = BuildTarget.StandaloneWindows64,
            options = BuildOptions.None
        };

        BuildAndReport(options);
    }

    [MenuItem("Build/Build macOS")]
    public static void BuildMacOS()
    {
        ConfigureBuildSettings();

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = GetScenes(),
            locationPathName = GetBuildPath("macOS", ".app"),
            target = BuildTarget.StandaloneOSX,
            options = BuildOptions.None
        };

        BuildAndReport(options);
    }

    [MenuItem("Build/Build Android")]
    public static void BuildAndroid()
    {
        ConfigureBuildSettings();

        // 配置 Android 特定设置
        PlayerSettings.Android.useCustomKeystore = true;
        PlayerSettings.Android.keystoreName = Environment.GetEnvironmentVariable("ANDROID_KEYSTORE_PATH");
        PlayerSettings.Android.keystorePass = Environment.GetEnvironmentVariable("ANDROID_KEYSTORE_PASSWORD");
        PlayerSettings.Android.keyaliasName = Environment.GetEnvironmentVariable("ANDROID_KEY_ALIAS");
        PlayerSettings.Android.keyaliasPass = Environment.GetEnvironmentVariable("ANDROID_KEY_PASSWORD");

        EditorUserBuildSettings.buildAppBundle = true; // 构建 AAB

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = GetScenes(),
            locationPathName = GetBuildPath("Android", ".aab"),
            target = BuildTarget.Android,
            options = BuildOptions.None
        };

        BuildAndReport(options);
    }

    [MenuItem("Build/Build iOS")]
    public static void BuildiOS()
    {
        ConfigureBuildSettings();

        BuildPlayerOptions options = new BuildPlayerOptions
        {
            scenes = GetScenes(),
            locationPathName = GetBuildPath("iOS", ""),
            target = BuildTarget.iOS,
            options = BuildOptions.None
        };

        BuildAndReport(options);
    }

    static void BuildAndReport(BuildPlayerOptions options)
    {
        BuildReport report = BuildPipeline.BuildPlayer(options);
        BuildSummary summary = report.summary;

        if (summary.result == BuildResult.Succeeded)
        {
            Debug.Log($"Build succeeded: {summary.totalSize} bytes");
            Debug.Log($"Build time: {summary.totalTime}");
        }
        else if (summary.result == BuildResult.Failed)
        {
            Debug.LogError("Build failed!");

            // 输出错误信息
            foreach (var step in report.steps)
            {
                foreach (var message in step.messages)
                {
                    if (message.type == LogType.Error)
                    {
                        Debug.LogError(message.content);
                    }
                }
            }

            EditorApplication.Exit(1);
        }
    }
}
```

### Unreal 命令行构建

```bash
# Unreal Engine 构建脚本
#!/bin/bash

UE_PATH="/path/to/UnrealEngine"
PROJECT_PATH="/path/to/MyGame/MyGame.uproject"
OUTPUT_PATH="/path/to/builds"

# 构建 Windows 发布版
"$UE_PATH/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun \
    -project="$PROJECT_PATH" \
    -noP4 \
    -platform=Win64 \
    -clientconfig=Shipping \
    -serverconfig=Shipping \
    -cook \
    -allmaps \
    -build \
    -stage \
    -pak \
    -archive \
    -archivedirectory="$OUTPUT_PATH/Windows"

# 构建 Linux 服务器
"$UE_PATH/Engine/Build/BatchFiles/RunUAT.sh" BuildCookRun \
    -project="$PROJECT_PATH" \
    -noP4 \
    -platform=Linux \
    -clientconfig=Shipping \
    -serverconfig=Shipping \
    -cook \
    -server \
    -noclient \
    -build \
    -stage \
    -pak \
    -archive \
    -archivedirectory="$OUTPUT_PATH/LinuxServer"
```

## Unity Cloud Build

### 什么是 Unity Cloud Build

Unity Cloud Build 是 Unity 提供的云端构建服务，它可以：

- 自动化构建流程
- 支持多平台同时构建
- 自动版本管理
- 与 Git/SVN/Perforce 集成
- 构建分发和测试

### 配置 Unity Cloud Build

1. **在 Unity Dashboard 创建项目**

```yaml
# 或使用配置文件 .cloudbuild.yaml
build:
  # 基础配置
  Unity:
    version: 2022.3.10f1

  # 构建目标
  targets:
    - name: Windows 64
      platform: standalonewindows64
      scripting backend: IL2CPP

    - name: Android
      platform: android
      scripting backend: IL2CPP
      android:
        targetSdkVersion: 33
        minSdkVersion: 24
        buildAppBundle: true

    - name: iOS
      platform: ios
      scripting backend: IL2CPP
```

2. **配置构建钩子**

```csharp
// Assets/Editor/CloudBuildHelper.cs
using UnityEditor;
using UnityEngine;

public class CloudBuildHelper
{
    // Unity Cloud Build 构建前调用
    public static void PreExport(UnityEngine.CloudBuild.BuildManifestObject manifest)
    {
        // 设置版本号
        string buildNumber = manifest.GetValue<string>("buildNumber");
        PlayerSettings.bundleVersion = $"1.0.{buildNumber}";
        PlayerSettings.Android.bundleVersionCode = int.Parse(buildNumber);

        // 设置其他配置
        PlayerSettings.SetScriptingBackend(
            BuildTargetGroup.Android,
            ScriptingImplementation.IL2CPP
        );

        Debug.Log($"Cloud Build #{buildNumber} starting...");
    }

    // 构建后调用
    public static void PostExport(string exportPath)
    {
        Debug.Log($"Build exported to: {exportPath}");

        // 可以在这里执行额外的后处理
        // 例如：上传符号文件、通知团队等
    }
}
```

### 构建通知集成

```csharp
// 发送构建通知到 Slack
using UnityEngine.Networking;
using System.Collections;

public class BuildNotification
{
    public static IEnumerator SendSlackNotification(string status, string buildUrl)
    {
        var payload = new
        {
            text = $"Unity Cloud Build {status}",
            attachments = new[]
            {
                new
                {
                    color = status == "Success" ? "good" : "danger",
                    fields = new[]
                    {
                        new { title = "Project", value = "MyGame", @short = true },
                        new { title = "Platform", value = "Android", @short = true },
                        new { title = "Build URL", value = buildUrl }
                    }
                }
            }
        };

        string json = JsonUtility.ToJson(payload);

        using (UnityWebRequest request = new UnityWebRequest("YOUR_SLACK_WEBHOOK_URL", "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(json);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            yield return request.SendWebRequest();
        }
    }
}
```

## CI/CD for Games

### GitHub Actions 游戏项目配置

```yaml
# .github/workflows/game-ci.yml
name: Game CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      buildPlatform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - Windows
          - Android
          - iOS

env:
  UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
  UNITY_VERSION: 2022.3.10f1

jobs:
  # 代码质量检查
  lint:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - name: Check C# formatting
        run: dotnet format --verify-no-changes

      - name: Run static analysis
        run: |
          dotnet tool install --global dotnet-sonarscanner
          dotnet sonarscanner begin /k:"MyGame" /d:sonar.host.url="${{ secrets.SONAR_HOST }}"
          dotnet build
          dotnet sonarscanner end

  # 单元测试
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-test-runner@v4
        id: tests
        env:
          UNITY_LICENSE: ${{ env.UNITY_LICENSE }}
        with:
          unityVersion: ${{ env.UNITY_VERSION }}
          testMode: playmode
          artifactsPath: TestResults

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: Test Results
          path: TestResults

  # Windows 构建
  build-windows:
    name: Build Windows
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.event.inputs.buildPlatform == 'all' || github.event.inputs.buildPlatform == 'Windows'
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ env.UNITY_LICENSE }}
        with:
          unityVersion: ${{ env.UNITY_VERSION }}
          targetPlatform: StandaloneWindows64
          buildName: MyGame
          versioning: Semantic

      - uses: actions/upload-artifact@v4
        with:
          name: Build-Windows
          path: build/StandaloneWindows64

  # Android 构建
  build-android:
    name: Build Android
    needs: [lint, test]
    runs-on: ubuntu-latest
    if: github.event.inputs.buildPlatform == 'all' || github.event.inputs.buildPlatform == 'Android'
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ env.UNITY_LICENSE }}
        with:
          unityVersion: ${{ env.UNITY_VERSION }}
          targetPlatform: Android
          androidExportType: androidAppBundle
          androidKeystoreName: keystore.keystore
          androidKeystoreBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          androidKeystorePass: ${{ secrets.ANDROID_KEYSTORE_PASS }}
          androidKeyaliasName: ${{ secrets.ANDROID_KEYALIAS_NAME }}
          androidKeyaliasPass: ${{ secrets.ANDROID_KEYALIAS_PASS }}

      - uses: actions/upload-artifact@v4
        with:
          name: Build-Android
          path: build/Android

  # iOS 构建
  build-ios:
    name: Build iOS
    needs: [lint, test]
    runs-on: macos-latest
    if: github.event.inputs.buildPlatform == 'all' || github.event.inputs.buildPlatform == 'iOS'
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ env.UNITY_LICENSE }}
        with:
          unityVersion: ${{ env.UNITY_VERSION }}
          targetPlatform: iOS

      - name: Build Xcode Project
        uses: apple-actions/build-xcode-project@v1
        with:
          project-path: build/iOS/Unity-iPhone.xcodeproj
          scheme: Unity-iPhone

      - uses: actions/upload-artifact@v4
        with:
          name: Build-iOS
          path: build/iOS

  # 部署到测试环境
  deploy-staging:
    name: Deploy to Staging
    needs: [build-windows, build-android]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: Build-Android

      - name: Upload to Firebase App Distribution
        uses: wzieba/Firebase-Distribution-Github-Action@v1
        with:
          appId: ${{ secrets.FIREBASE_APP_ID }}
          serviceCredentialsFileContent: ${{ secrets.FIREBASE_CREDENTIALS }}
          groups: internal-testers
          file: Android/MyGame.aab

  # 发布到商店
  deploy-production:
    name: Deploy to Production
    needs: [build-windows, build-android, build-ios]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: Build-Android

      - name: Upload to Google Play
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.company.mygame
          releaseFiles: Android/MyGame.aab
          track: internal
          status: completed
```

### Jenkins 游戏构建流水线

```groovy
// Jenkinsfile
pipeline {
    agent none

    environment {
        UNITY_VERSION = '2022.3.10f1'
        UNITY_PATH = '/Applications/Unity/Hub/Editor/2022.3.10f1/Unity.app/Contents/MacOS/Unity'
    }

    parameters {
        choice(
            name: 'BUILD_PLATFORM',
            choices: ['All', 'Windows', 'macOS', 'Android', 'iOS'],
            description: 'Select build platform'
        )
        booleanParam(
            name: 'CLEAN_BUILD',
            defaultValue: false,
            description: 'Perform clean build'
        )
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    extensions: [
                        [$class: 'GitLFSPull'],
                        [$class: 'CleanBeforeCheckout']
                    ],
                    userRemoteConfigs: [[
                        url: 'https://github.com/company/game.git',
                        credentialsId: 'github-credentials'
                    ]]
                ])
            }
        }

        stage('Test') {
            agent { label 'unity' }
            steps {
                sh '''
                    ${UNITY_PATH} \
                        -batchmode \
                        -nographics \
                        -projectPath . \
                        -runTests \
                        -testPlatform PlayMode \
                        -testResults TestResults/results.xml
                '''
            }
            post {
                always {
                    junit 'TestResults/results.xml'
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Windows') {
                    when {
                        expression {
                            params.BUILD_PLATFORM == 'All' ||
                            params.BUILD_PLATFORM == 'Windows'
                        }
                    }
                    agent { label 'windows' }
                    steps {
                        bat '''
                            "C:\\Program Files\\Unity\\Hub\\Editor\\2022.3.10f1\\Editor\\Unity.exe" ^
                                -batchmode ^
                                -nographics ^
                                -projectPath . ^
                                -executeMethod BuildScript.BuildWindows ^
                                -logFile build_windows.log ^
                                -quit
                        '''
                    }
                    post {
                        success {
                            archiveArtifacts artifacts: 'Builds/Windows/**/*'
                        }
                    }
                }

                stage('Android') {
                    when {
                        expression {
                            params.BUILD_PLATFORM == 'All' ||
                            params.BUILD_PLATFORM == 'Android'
                        }
                    }
                    agent { label 'unity-android' }
                    environment {
                        ANDROID_KEYSTORE_PATH = credentials('android-keystore')
                        ANDROID_KEYSTORE_PASSWORD = credentials('android-keystore-password')
                    }
                    steps {
                        sh '''
                            ${UNITY_PATH} \
                                -batchmode \
                                -nographics \
                                -projectPath . \
                                -executeMethod BuildScript.BuildAndroid \
                                -logFile build_android.log \
                                -quit
                        '''
                    }
                    post {
                        success {
                            archiveArtifacts artifacts: 'Builds/Android/**/*'
                        }
                    }
                }

                stage('iOS') {
                    when {
                        expression {
                            params.BUILD_PLATFORM == 'All' ||
                            params.BUILD_PLATFORM == 'iOS'
                        }
                    }
                    agent { label 'macos' }
                    steps {
                        sh '''
                            ${UNITY_PATH} \
                                -batchmode \
                                -nographics \
                                -projectPath . \
                                -executeMethod BuildScript.BuildiOS \
                                -logFile build_ios.log \
                                -quit
                        '''

                        // 构建 Xcode 项目
                        sh '''
                            cd Builds/iOS
                            xcodebuild -project Unity-iPhone.xcodeproj \
                                -scheme Unity-iPhone \
                                -configuration Release \
                                -archivePath MyGame.xcarchive \
                                archive

                            xcodebuild -exportArchive \
                                -archivePath MyGame.xcarchive \
                                -exportPath Export \
                                -exportOptionsPlist ExportOptions.plist
                        '''
                    }
                    post {
                        success {
                            archiveArtifacts artifacts: 'Builds/iOS/Export/**/*'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            agent any
            steps {
                script {
                    // 部署到分发平台
                    sh './scripts/deploy.sh'
                }
            }
        }
    }

    post {
        success {
            slackSend(
                color: 'good',
                message: "Build #${BUILD_NUMBER} succeeded! :tada:"
            )
        }
        failure {
            slackSend(
                color: 'danger',
                message: "Build #${BUILD_NUMBER} failed! :x:"
            )
        }
    }
}
```

## 测试策略

### 游戏测试金字塔

```
                /\
               /  \          玩家测试
              /    \         (User Testing)
             /──────\
            /        \       QA 测试
           /          \      (Manual Testing)
          /────────────\
         /              \    集成测试
        /                \   (Integration Tests)
       /──────────────────\
      /                    \ 单元测试
     /                      \ (Unit Tests)
    /──────────────────────────\
```

### 单元测试

```csharp
// Unity Test Framework 示例
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

[TestFixture]
public class PlayerHealthTests
{
    private PlayerHealth playerHealth;

    [SetUp]
    public void Setup()
    {
        var gameObject = new GameObject();
        playerHealth = gameObject.AddComponent<PlayerHealth>();
        playerHealth.Initialize(100); // 初始生命值 100
    }

    [TearDown]
    public void TearDown()
    {
        Object.DestroyImmediate(playerHealth.gameObject);
    }

    [Test]
    public void TakeDamage_ReducesHealth()
    {
        // Arrange
        int initialHealth = playerHealth.CurrentHealth;
        int damage = 30;

        // Act
        playerHealth.TakeDamage(damage);

        // Assert
        Assert.AreEqual(initialHealth - damage, playerHealth.CurrentHealth);
    }

    [Test]
    public void TakeDamage_CannotGoBelowZero()
    {
        // Arrange
        int massiveDamage = 999;

        // Act
        playerHealth.TakeDamage(massiveDamage);

        // Assert
        Assert.AreEqual(0, playerHealth.CurrentHealth);
        Assert.IsTrue(playerHealth.IsDead);
    }

    [Test]
    public void Heal_RestoresHealth()
    {
        // Arrange
        playerHealth.TakeDamage(50);
        int healthBeforeHeal = playerHealth.CurrentHealth;

        // Act
        playerHealth.Heal(20);

        // Assert
        Assert.AreEqual(healthBeforeHeal + 20, playerHealth.CurrentHealth);
    }

    [Test]
    public void Heal_CannotExceedMaxHealth()
    {
        // Arrange
        playerHealth.TakeDamage(10);

        // Act
        playerHealth.Heal(100);

        // Assert
        Assert.AreEqual(100, playerHealth.CurrentHealth); // 最大值 100
    }

    [UnityTest]
    public IEnumerator TakeDamage_TriggersInvulnerabilityFrames()
    {
        // Arrange
        playerHealth.TakeDamage(10);

        // Act - 在无敌帧期间再次受到伤害
        playerHealth.TakeDamage(10);

        // Assert - 应该只受到第一次伤害
        Assert.AreEqual(90, playerHealth.CurrentHealth);

        // 等待无敌帧结束
        yield return new WaitForSeconds(1f);

        // 现在应该可以再次受到伤害
        playerHealth.TakeDamage(10);
        Assert.AreEqual(80, playerHealth.CurrentHealth);
    }
}
```

### 集成测试

```csharp
// 战斗系统集成测试
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using System.Collections;

[TestFixture]
public class CombatSystemTests
{
    private GameObject playerObject;
    private GameObject enemyObject;
    private CombatSystem combatSystem;

    [UnitySetUp]
    public IEnumerator Setup()
    {
        // 加载测试场景
        var loadOperation = UnityEngine.SceneManagement.SceneManager
            .LoadSceneAsync("TestScene", UnityEngine.SceneManagement.LoadSceneMode.Single);

        while (!loadOperation.isDone)
            yield return null;

        // 实例化玩家和敌人
        playerObject = Object.Instantiate(Resources.Load<GameObject>("Prefabs/Player"));
        enemyObject = Object.Instantiate(Resources.Load<GameObject>("Prefabs/Enemy"));

        combatSystem = Object.FindObjectOfType<CombatSystem>();

        yield return new WaitForSeconds(0.1f);
    }

    [UnityTearDown]
    public IEnumerator TearDown()
    {
        Object.Destroy(playerObject);
        Object.Destroy(enemyObject);
        yield return null;
    }

    [UnityTest]
    public IEnumerator PlayerAttack_DamagesEnemy()
    {
        // Arrange
        var playerCombat = playerObject.GetComponent<PlayerCombat>();
        var enemyHealth = enemyObject.GetComponent<EnemyHealth>();
        int initialHealth = enemyHealth.CurrentHealth;

        // 移动玩家到敌人附近
        playerObject.transform.position = enemyObject.transform.position + Vector3.left * 2;

        yield return new WaitForSeconds(0.1f);

        // Act - 执行攻击
        playerCombat.Attack();

        yield return new WaitForSeconds(0.5f);

        // Assert
        Assert.Less(enemyHealth.CurrentHealth, initialHealth);
    }

    [UnityTest]
    public IEnumerator EnemyDeath_DropsLoot()
    {
        // Arrange
        var enemyHealth = enemyObject.GetComponent<EnemyHealth>();

        // Act - 杀死敌人
        enemyHealth.TakeDamage(9999);

        yield return new WaitForSeconds(1f);

        // Assert - 检查是否生成了掉落物
        var lootItems = Object.FindObjectsOfType<LootItem>();
        Assert.Greater(lootItems.Length, 0);
    }
}
```

### 性能测试

```csharp
// Unity Performance Testing Package
using NUnit.Framework;
using Unity.PerformanceTesting;
using UnityEngine;

[TestFixture]
public class PerformanceTests
{
    [Test, Performance]
    public void MeasureInstantiationTime()
    {
        var prefab = Resources.Load<GameObject>("Prefabs/Enemy");

        Measure.Method(() =>
        {
            var instance = Object.Instantiate(prefab);
            Object.DestroyImmediate(instance);
        })
        .WarmupCount(10)
        .MeasurementCount(100)
        .Run();
    }

    [Test, Performance]
    public void MeasurePhysicsUpdate()
    {
        // 创建大量物理对象
        var objects = new GameObject[100];
        for (int i = 0; i < 100; i++)
        {
            objects[i] = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            objects[i].AddComponent<Rigidbody>();
            objects[i].transform.position = Random.insideUnitSphere * 50;
        }

        Measure.Method(() =>
        {
            Physics.Simulate(Time.fixedDeltaTime);
        })
        .WarmupCount(5)
        .MeasurementCount(50)
        .Run();

        // 清理
        foreach (var obj in objects)
        {
            Object.DestroyImmediate(obj);
        }
    }

    [Test, Performance]
    public void MeasureSceneLoadTime()
    {
        Measure.Method(() =>
        {
            UnityEngine.SceneManagement.SceneManager.LoadScene("MainMenu",
                UnityEngine.SceneManagement.LoadSceneMode.Single);
        })
        .MeasurementCount(5)
        .Run();
    }
}
```

### 自动化播放测试

```csharp
// 自动化游戏流程测试
using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

[TestFixture]
public class GameplayTests
{
    [UnityTest]
    public IEnumerator FullGameplayLoop_CompletesWithoutErrors()
    {
        // 加载主菜单
        yield return LoadScene("MainMenu");

        // 点击开始按钮
        yield return ClickButton("StartButton");

        // 等待游戏场景加载
        yield return WaitForScene("GameScene");

        // 模拟玩家输入
        for (int i = 0; i < 100; i++)
        {
            SimulatePlayerInput();
            yield return new WaitForSeconds(0.1f);
        }

        // 验证没有错误
        LogAssert.NoUnexpectedReceived();
    }

    private IEnumerator LoadScene(string sceneName)
    {
        var operation = UnityEngine.SceneManagement.SceneManager
            .LoadSceneAsync(sceneName);
        while (!operation.isDone)
            yield return null;
    }

    private IEnumerator ClickButton(string buttonName)
    {
        var button = GameObject.Find(buttonName)?.GetComponent<UnityEngine.UI.Button>();
        Assert.IsNotNull(button, $"Button '{buttonName}' not found");
        button.onClick.Invoke();
        yield return new WaitForSeconds(0.5f);
    }

    private IEnumerator WaitForScene(string sceneName)
    {
        float timeout = 10f;
        while (UnityEngine.SceneManagement.SceneManager.GetActiveScene().name != sceneName)
        {
            timeout -= Time.deltaTime;
            if (timeout <= 0)
                Assert.Fail($"Scene '{sceneName}' did not load in time");
            yield return null;
        }
    }

    private void SimulatePlayerInput()
    {
        // 模拟随机输入
        var player = Object.FindObjectOfType<PlayerController>();
        if (player != null)
        {
            player.Move(new Vector2(Random.Range(-1f, 1f), Random.Range(-1f, 1f)));

            if (Random.value > 0.7f)
                player.Attack();
        }
    }
}
```

## 团队协作

### 多角色协作流程

```
策划 (Designer)     美术 (Artist)      程序 (Programmer)
     │                    │                    │
     ▼                    ▼                    ▼
 设计文档            资产制作              系统开发
     │                    │                    │
     └────────────────────┼────────────────────┘
                          ▼
                    版本控制系统
                          │
     ┌────────────────────┼────────────────────┐
     ▼                    ▼                    ▼
 关卡编辑            资产集成              功能集成
     │                    │                    │
     └────────────────────┼────────────────────┘
                          ▼
                      测试验证
                          │
                          ▼
                      发布构建
```

### 任务管理与追踪

推荐使用以下工具组合：

**项目管理工具**：

- **Jira**：适合大型团队，强大的自定义能力
- **Notion**：灵活的文档和数据库管理
- **Trello**：简单直观的看板管理
- **Linear**：现代化的问题追踪

**文档协作**：

- **Confluence**：与 Jira 集成良好
- **Google Docs**：实时协作
- **Notion**：集成文档和任务管理

**沟通工具**：

- **Slack**：团队即时通讯
- **Discord**：游戏行业广泛使用
- **Microsoft Teams**：企业级解决方案

### 代码审查规范

```markdown
## 代码审查清单

### 功能性
- [ ] 代码实现了预期功能
- [ ] 边界条件已处理
- [ ] 错误处理完善

### 性能
- [ ] 避免不必要的内存分配
- [ ] 避免在 Update 中进行昂贵操作
- [ ] 对象池使用得当

### 可维护性
- [ ] 代码可读性良好
- [ ] 命名规范一致
- [ ] 适当的注释

### 测试
- [ ] 单元测试已添加
- [ ] 在编辑器中测试通过
- [ ] 在目标平台测试通过
```

### 分支保护规则

```yaml
# GitHub 分支保护配置示例
branches:
  main:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 2
        dismiss_stale_reviews: true
        require_code_owner_reviews: true
      required_status_checks:
        strict: true
        contexts:
          - "Unit Tests"
          - "Build / Windows"
          - "Build / Android"
      enforce_admins: true
      required_linear_history: true

  develop:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
      required_status_checks:
        contexts:
          - "Unit Tests"
```

## 常见陷阱

### Git LFS 配置遗漏

**问题**：团队成员克隆仓库后无法正确获取大文件

**解决方案**：

```bash
# 确保所有成员安装 Git LFS
git lfs install

# 检查 LFS 状态
git lfs env

# 克隆时包含 LFS 文件
git clone --recurse-submodules URL
git lfs pull
```

### 构建机器配置不一致

**问题**：本地构建成功但 CI 失败

**解决方案**：

```yaml
# 使用 Docker 确保环境一致
# Dockerfile
FROM unityci/editor:ubuntu-2022.3.10f1-android-1

# 安装项目依赖
RUN apt-get update && apt-get install -y \
    android-sdk \
    openjdk-11-jdk

# 设置环境变量
ENV ANDROID_HOME=/opt/android-sdk
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

### 资产引用丢失

**问题**：合并分支后资产引用被破坏

**解决方案**：

```csharp
// 使用 GUID 而不是路径引用
// Unity 会自动维护 .meta 文件中的 GUID

// 不要这样做
// public Sprite mySprite; // 在 Inspector 中手动拖拽

// 推荐使用 Addressables 或 Resources
public AssetReference myAssetReference;
// 或
Addressables.LoadAssetAsync<Sprite>("path/to/sprite");
```

### 场景合并冲突

**问题**：多人同时编辑场景导致无法合并

**解决方案**：

```
推荐做法:
1. 使用 Prefab 嵌套减少场景修改
2. 场景按区域拆分为多个子场景
3. 使用 Unity 的 Scene 锁定功能
4. 建立场景修改预约机制
```

### 构建时间过长

**问题**：每次构建需要数小时

**解决方案**：

```yaml
# 增量构建配置
build:
  cache:
    - Library/           # Unity 库缓存
    - Temp/              # 临时文件
    - obj/               # C# 编译缓存

# 使用并行构建
jobs:
  - build-windows: parallel
  - build-android: parallel
  - build-ios: parallel

# 资产按需导入
# 使用 Addressables 实现按需加载
```

## 面试要点

### 常见面试问题

**1. 为什么游戏项目不适合直接使用 Git？**

游戏项目包含大量二进制文件（模型、纹理、音频等），这些文件：
- 无法进行文本合并
- 占用大量存储空间
- 频繁修改会使仓库快速膨胀

解决方案是使用 Git LFS 或 Perforce 等支持大文件的版本控制系统。

**2. 如何处理游戏资产的版本控制？**

- 使用 Git LFS 跟踪大文件
- 实施文件锁定机制防止并发编辑
- 建立资产命名规范和目录结构
- 使用 .gitattributes 配置文件处理规则

**3. 描述你参与过的游戏 CI/CD 流程**

关键点：
- 自动化构建流程（使用 Jenkins、GitHub Actions 等）
- 多平台构建支持
- 自动化测试（单元测试、集成测试）
- 版本号管理
- 构建产物分发

**4. 如何优化游戏项目的构建时间？**

- 使用增量构建
- 配置构建缓存
- 并行化构建任务
- 使用分布式构建系统
- 优化资产导入设置

**5. 如何在团队中推行代码审查？**

- 建立明确的审查标准和检查清单
- 使用分支保护规则强制要求审查
- 培养积极的审查文化
- 使用自动化工具进行初步检查

**6. 游戏测试策略应该如何制定？**

- 单元测试覆盖核心逻辑
- 集成测试验证系统交互
- 自动化播放测试检测回归
- 性能测试监控关键指标
- 手动 QA 测试游戏体验

## 实战场景

### 场景一：新成员加入项目

```bash
# 新成员环境配置流程

# 安装必要工具
# - Unity Hub 和对应版本
# - Git 和 Git LFS
# - IDE (VS Code / Rider)

# 配置 Git LFS
git lfs install

# 克隆项目
git clone --recurse-submodules https://github.com/company/game.git
cd game
git lfs pull

# 配置 Unity 项目
# - 打开 Unity Hub
# - 添加项目并使用正确的 Unity 版本

# 验证项目
# - 确保没有编译错误
# - 运行测试套件
# - 构建测试
```

### 场景二：紧急修复线上问题

```bash
# 热修复流程

# 从 main 创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/critical-crash

# 修复问题并测试
# ... 修改代码 ...
git add .
git commit -m "Fix: 修复关键崩溃问题 #123"

# 推送并创建 PR
git push origin hotfix/critical-crash
# 创建 PR 到 main，触发紧急审查

# 合并后自动触发构建
# CI/CD 自动构建并部署到热更新服务器

# 同步到 develop 分支
git checkout develop
git merge hotfix/critical-crash
git push origin develop
```

### 场景三：大版本发布准备

```bash
# 版本发布流程

# 创建 release 分支
git checkout develop
git checkout -b release/1.2.0

# 更新版本号
# 修改 ProjectSettings 中的版本号
# 更新 CHANGELOG.md

# 发布分支测试
# - 运行完整测试套件
# - 进行内部测试
# - 修复发现的问题

# 合并到 main
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# 同步回 develop
git checkout develop
git merge release/1.2.0

# 推送所有更改
git push origin main develop --tags

# 触发发布构建
# CI 检测到 tag 自动构建发布版本
```

## 延伸阅读

### 官方文档

- [Unity 版本控制最佳实践](https://docs.unity3d.com/Manual/BestPracticeGuides.html)
- [Unreal Engine 版本控制](https://docs.unrealengine.com/5.0/en-US/version-control-in-unreal-engine/)
- [Git LFS 官方文档](https://git-lfs.github.com/)
- [Perforce Helix Core 文档](https://www.perforce.com/manuals/p4guide/Content/P4Guide/Home-p4guide.html)

### 推荐书籍

- 《游戏开发项目管理》- Clinton Keith
- 《敏捷游戏开发》- Clinton Keith
- 《游戏开发流程与实践》- Heather Maxwell Chandler
- 《持续交付》- Jez Humble & David Farley

### 优质资源

- [Game CI](https://game.ci/) - Unity/Unreal 的 CI/CD 工具集
- [Unity Test Framework](https://docs.unity3d.com/Packages/com.unity.test-framework@latest) - Unity 官方测试框架
- [GameCI GitHub Actions](https://github.com/game-ci) - 游戏项目 CI/CD 模板
- [GDC Vault](https://gdcvault.com/) - 游戏开发者大会资源

### 社区与论坛

- [Unity 官方论坛](https://forum.unity.com/)
- [Unreal Engine 官方论坛](https://forums.unrealengine.com/)
- [GameDev.net](https://www.gamedev.net/)
- [r/gamedev](https://www.reddit.com/r/gamedev/)

## 总结

游戏开发流程与工具链是游戏项目成功的基础设施。一个高效的开发流程应该：

1. **版本控制**：使用 Git LFS 或 Perforce 处理大文件，建立合理的分支策略
2. **资产管理**：规范命名和目录结构，自动化导入流程
3. **构建自动化**：实现多平台自动构建，缩短迭代周期
4. **持续集成**：自动化测试和代码质量检查，尽早发现问题
5. **团队协作**：明确的工作流程和沟通机制

关键要点：

- 在项目初期就建立好工具链和流程，后期修改成本很高
- 根据团队规模和项目特点选择合适的工具
- 自动化一切可以自动化的流程
- 持续优化构建和测试效率
- 保持团队成员对流程的共识和遵守

一个好的开发流程能让团队专注于创作本身，而不是被技术问题所困扰。
