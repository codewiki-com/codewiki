---
title: Game Development Pipeline and Toolchain
description: "Building efficient game development pipelines: version control, asset management, and build automation"
track: gamedev
section: gameplay-systems
difficulty: beginner
tags:
  - development pipeline
  - version control
  - asset management
  - builds
status: imported
origin: old/src/content/docs/gamedev/game-dev-pipeline.en.md
divergence: 0.219
issues: []
legacy:
  category: GameDev
  subcategory: Tools
  order: 38
  lastUpdated: 2026-01-07
---

Game development is a complex creative process involving close collaboration between programmers, artists, designers, sound engineers, and other roles. An efficient development pipeline and toolchain is crucial for project success. We introduce the complete game development process, as well as the tools and best practices needed at each stage.

## Game Development Cycle

### Development Phases Overview

A complete game development cycle typically includes the following phases:

```
Concept Phase → Pre-Production → Production → Alpha → Beta → Gold → Live Operations
      │              │             │           │       │      │         │
   2-4 weeks     1-3 months    6-24 months   2-4    4-8    1-2     Ongoing
                                             weeks  weeks  weeks
```

### Concept Phase

During this phase, the team establishes the core vision of the game:

- **Core Gameplay**: What is the most fundamental fun of the game
- **Target Audience**: Who will play this game
- **Market Positioning**: Competitive analysis and differentiation strategy
- **Technical Feasibility**: Initial technical assessment

Deliverables:
- Concept Document
- Prototype
- Mood Board

### Pre-Production Phase

Validate core gameplay and establish development processes before full production:

```
Core Team Tasks:
├── Technical Validation
│   ├── Engine Selection and Evaluation
│   ├── Technical Prototype Development
│   └── Performance Benchmarking
├── Art Direction
│   ├── Visual Style Definition
│   ├── Character/Environment Concept Design
│   └── UI/UX Design Guidelines
└── Process Development
    ├── Version Control Strategy
    ├── Asset Management Workflow
    └── Continuous Integration Environment
```

### Production Phase

The formal content production phase, the longest development stage:

- Programmers develop various game systems
- Artists create scenes, characters, animations, and other assets
- Designers create levels and balance values
- Continuous feature iteration and bug fixing

### Alpha Phase

- All core features completed
- Game playable from start to finish
- Internal testing begins
- Focus on bug fixes and balance adjustments

### Beta Phase

- Content Lock
- Large-scale testing (closed/open beta)
- Performance optimization
- Final polish

### Gold Phase

- Submit final version
- Platform certification
- Prepare for release

## Git and Git LFS

### Why Game Projects Need Special Version Control Strategies

Game projects differ significantly from traditional software projects:

| Characteristic | Traditional Software | Game Projects |
|---------------|---------------------|---------------|
| File Types | Mainly text files | Large binary files |
| Repository Size | Usually < 1GB | Can reach tens of GB or more |
| Collaboration Mode | Mainly programmers | Multi-role collaboration |
| File Conflicts | Mergeable | Binary cannot be merged |

### Git LFS Configuration and Usage

Git LFS (Large File Storage) is the solution for handling large files:

```bash
# Install Git LFS
# Windows (included with Git for Windows)
# macOS
brew install git-lfs

# Linux
sudo apt install git-lfs

# Initialize Git LFS
git lfs install
```

#### Configuring .gitattributes

Configure LFS tracking rules for game projects:

```gitattributes
# .gitattributes - Unity Project Example

# Image assets
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.tif filter=lfs diff=lfs merge=lfs -text
*.exr filter=lfs diff=lfs merge=lfs -text
*.hdr filter=lfs diff=lfs merge=lfs -text

# 3D models
*.fbx filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text
*.max filter=lfs diff=lfs merge=lfs -text
*.ma filter=lfs diff=lfs merge=lfs -text
*.mb filter=lfs diff=lfs merge=lfs -text

# Audio
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.aif filter=lfs diff=lfs merge=lfs -text

# Video
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text
*.avi filter=lfs diff=lfs merge=lfs -text

# Unity specific
*.unity filter=lfs diff=lfs merge=lfs -text
*.prefab filter=lfs diff=lfs merge=lfs -text
*.asset filter=lfs diff=lfs merge=lfs -text
*.controller filter=lfs diff=lfs merge=lfs -text
*.anim filter=lfs diff=lfs merge=lfs -text
*.cubemap filter=lfs diff=lfs merge=lfs -text
*.unitypackage filter=lfs diff=lfs merge=lfs -text

# Unreal specific
*.uasset filter=lfs diff=lfs merge=lfs -text
*.umap filter=lfs diff=lfs merge=lfs -text

# Build artifacts
*.dll filter=lfs diff=lfs merge=lfs -text
*.so filter=lfs diff=lfs merge=lfs -text
*.a filter=lfs diff=lfs merge=lfs -text

# Archives
*.zip filter=lfs diff=lfs merge=lfs -text
*.7z filter=lfs diff=lfs merge=lfs -text
*.rar filter=lfs diff=lfs merge=lfs -text
```

#### Common Git LFS Commands

```bash
# View LFS tracked file types
git lfs track

# View currently tracked files
git lfs ls-files

# View LFS status
git lfs status

# Pull LFS files
git lfs pull

# Fetch without checkout
git lfs fetch

# Migrate existing files to LFS
git lfs migrate import --include="*.psd,*.png" --everything

# Clean old LFS cache
git lfs prune
```

### Branching Strategy for Game Projects

Recommended modified Git Flow:

```
main ─────●────────────●────────────●──▶ (release versions)
          │            ↑            ↑
          │         release/1.0  release/1.1
          ▼            ↑            ↑
develop ──●────●───●───●────●───●───●──▶ (development mainline)
               │   ↑        │   ↑
               ▼   │        ▼   │
        feature/   │  feature/   │
        combat ────┘  inventory ─┘
```

#### Branch Type Descriptions

```bash
# Feature branch - new feature development
git checkout -b feature/player-movement develop

# Release branch - version release preparation
git checkout -b release/1.0.0 develop

# Hotfix branch - emergency bug fixes
git checkout -b hotfix/crash-fix main

# Asset branch - large asset updates
git checkout -b assets/new-character develop
```

### File Locking Mechanism

For binary files that cannot be merged, file locking is needed:

```bash
# Git LFS file locking
git lfs lock "Assets/Characters/Hero.fbx"

# View locked files
git lfs locks

# Unlock file
git lfs unlock "Assets/Characters/Hero.fbx"

# Force unlock (admin)
git lfs unlock --force "Assets/Characters/Hero.fbx"
```

#### Locking Strategy with Unity

```yaml
# .gitconfig or project configuration
[lfs]
    locksverify = true

# Enable collaboration mode in Unity
# Edit → Project Settings → Version Control
# Mode: Visible Meta Files
# Asset Serialization: Force Text
```

## Asset Management Tools

### Core Challenges of Asset Management

Game project asset management faces these challenges:

- **Massive File Count**: A medium project may have tens of thousands of files
- **Diverse Formats**: Different tools produce different formats
- **Complex Dependencies**: Complex reference relationships between assets
- **Version Tracking**: Need to track modification history of each asset
- **Collaboration Conflicts**: Multiple people modifying the same asset simultaneously

### Asset Management Workflow

```
Raw Assets          Source Files         Engine Assets
(Raw Assets)   →   (Source Files)   →   (Engine Assets)
    │                   │                     │
 PSD files          PNG/TGA              Texture2D
 Maya scenes        FBX exports           Prefab
 Pro Tools          WAV files            AudioClip
```

### Perforce (P4) Introduction

Perforce is a widely used version control system in the game industry:

```bash
# Perforce basic commands

# Connect to server
p4 set P4PORT=ssl:perforce.company.com:1666
p4 set P4USER=username
p4 set P4CLIENT=workspace-name

# Get latest files
p4 sync

# Check out file (lock)
p4 edit "//depot/Assets/character.fbx"

# Add new file
p4 add "//depot/Assets/new_texture.png"

# Submit changes
p4 submit -d "Added new character texture"

# View file status
p4 opened

# Discard changes
p4 revert "//depot/Assets/character.fbx"
```

#### Perforce vs Git LFS Comparison

| Feature | Perforce | Git LFS |
|---------|----------|---------|
| Locking Mechanism | Native enforced locking | Optional locking |
| Large File Handling | Native support | Requires LFS extension |
| Branching Cost | Higher | Very low |
| Offline Work | Limited | Fully supported |
| Learning Curve | Medium | Lower |
| Cost | Commercial license | Open source/hosting fees |
| Suitable Scale | Large teams | Small to medium teams |

### Asset Naming Conventions

Establishing consistent naming conventions is crucial for asset management:

```
[TypePrefix]_[AssetName]_[Variant]_[Number].[Extension]

Examples:
T_Brick_Wall_01.png        # Texture
M_Character_Hero.mat       # Material
SK_Character_Hero.fbx      # Skeletal mesh
SM_Prop_Barrel.fbx         # Static mesh
A_Footsteps_Grass.wav      # Audio
FX_Explosion_Fire.prefab   # VFX
UI_Button_Primary.png      # UI element
```

#### Common Prefix Standards

```
Prefix  Type            Example
───────────────────────────────────
T_      Texture         T_Wood_Diffuse
M_      Material        M_Wood_Standard
SM_     Static Mesh     SM_Tree_Oak
SK_     Skeletal Mesh   SK_Character
A_      Audio           A_BGM_Forest
FX_     VFX             FX_Fire_Loop
UI_     UI Asset        UI_HealthBar
BP_     Blueprint (UE)  BP_Enemy_Zombie
```

### Asset Directory Structure

Recommended Unity project directory structure:

```
Assets/
├── _Project/                    # Project core assets
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
├── ThirdParty/                  # Third-party assets
│   ├── TextMeshPro/
│   └── DOTween/
│
└── Plugins/                     # Native plugins
    ├── iOS/
    └── Android/
```

Recommended Unreal project directory structure:

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

### Asset Import Workflow

```python
# Unity Editor Script Example - Automatic Asset Processing
# Assets/Editor/AssetPostprocessor.cs

using UnityEditor;
using UnityEngine;

public class GameAssetPostprocessor : AssetPostprocessor
{
    void OnPreprocessTexture()
    {
        TextureImporter importer = assetImporter as TextureImporter;

        // Automatically set import configuration based on path
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

## Build Automation

### Why Build Automation Is Needed

Manual builds have these problems:

- **Time-consuming and error-prone**: Complex build steps are easy to miss
- **Not repeatable**: Different people may get different build results
- **Blocks development**: Developers need to wait for builds to complete
- **Difficult to trace**: Hard to identify causes when problems occur

### Special Requirements for Game Builds

```
Game Build Process:
├── Code Compilation
├── Asset Processing
│   ├── Texture Compression
│   ├── Lightmap Baking
│   ├── Audio Compression
│   └── Resource Packaging
├── Multi-platform Builds
│   ├── Windows
│   ├── macOS
│   ├── iOS
│   ├── Android
│   ├── PlayStation
│   ├── Xbox
│   └── Switch
└── Post-processing
    ├── Symbol File Extraction
    ├── Version Number Tagging
    └── Release Package Signing
```

### Unity Command Line Build

```bash
# Unity command line build script
#!/bin/bash

UNITY_PATH="/Applications/Unity/Hub/Editor/2022.3.10f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="/path/to/project"
BUILD_PATH="/path/to/builds"
LOG_PATH="/path/to/logs"

# Build Windows platform
$UNITY_PATH \
    -quit \
    -batchmode \
    -nographics \
    -projectPath "$PROJECT_PATH" \
    -executeMethod BuildScript.BuildWindows \
    -buildTarget Win64 \
    -logFile "$LOG_PATH/build_windows.log"

# Build Android platform
$UNITY_PATH \
    -quit \
    -batchmode \
    -nographics \
    -projectPath "$PROJECT_PATH" \
    -executeMethod BuildScript.BuildAndroid \
    -buildTarget Android \
    -logFile "$LOG_PATH/build_android.log"
```

#### Unity Build Script

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
        // Read version from environment variable
        string version = Environment.GetEnvironmentVariable("VERSION");
        if (!string.IsNullOrEmpty(version))
        {
            PlayerSettings.bundleVersion = version;
        }

        // Configure Android version number
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

        // Configure Android specific settings
        PlayerSettings.Android.useCustomKeystore = true;
        PlayerSettings.Android.keystoreName = Environment.GetEnvironmentVariable("ANDROID_KEYSTORE_PATH");
        PlayerSettings.Android.keystorePass = Environment.GetEnvironmentVariable("ANDROID_KEYSTORE_PASSWORD");
        PlayerSettings.Android.keyaliasName = Environment.GetEnvironmentVariable("ANDROID_KEY_ALIAS");
        PlayerSettings.Android.keyaliasPass = Environment.GetEnvironmentVariable("ANDROID_KEY_PASSWORD");

        EditorUserBuildSettings.buildAppBundle = true; // Build AAB

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

            // Output error messages
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

### Unreal Command Line Build

```bash
# Unreal Engine build script
#!/bin/bash

UE_PATH="/path/to/UnrealEngine"
PROJECT_PATH="/path/to/MyGame/MyGame.uproject"
OUTPUT_PATH="/path/to/builds"

# Build Windows shipping version
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

# Build Linux server
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

### What Is Unity Cloud Build

Unity Cloud Build is a cloud-based build service provided by Unity that can:

- Automate the build process
- Support multi-platform simultaneous builds
- Automatic version management
- Integration with Git/SVN/Perforce
- Build distribution and testing

### Configuring Unity Cloud Build

1. **Create Project in Unity Dashboard**

```yaml
# Or use configuration file .cloudbuild.yaml
build:
  # Base configuration
  Unity:
    version: 2022.3.10f1

  # Build targets
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

2. **Configure Build Hooks**

```csharp
// Assets/Editor/CloudBuildHelper.cs
using UnityEditor;
using UnityEngine;

public class CloudBuildHelper
{
    // Called before Unity Cloud Build
    public static void PreExport(UnityEngine.CloudBuild.BuildManifestObject manifest)
    {
        // Set version number
        string buildNumber = manifest.GetValue<string>("buildNumber");
        PlayerSettings.bundleVersion = $"1.0.{buildNumber}";
        PlayerSettings.Android.bundleVersionCode = int.Parse(buildNumber);

        // Set other configurations
        PlayerSettings.SetScriptingBackend(
            BuildTargetGroup.Android,
            ScriptingImplementation.IL2CPP
        );

        Debug.Log($"Cloud Build #{buildNumber} starting...");
    }

    // Called after build
    public static void PostExport(string exportPath)
    {
        Debug.Log($"Build exported to: {exportPath}");

        // Can perform additional post-processing here
        // For example: upload symbol files, notify team, etc.
    }
}
```

### Build Notification Integration

```csharp
// Send build notification to Slack
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

### GitHub Actions Game Project Configuration

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
  # Code quality checks
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

  # Unit tests
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

  # Windows build
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

  # Android build
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

  # iOS build
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

  # Deploy to staging
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

  # Deploy to production
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

### Jenkins Game Build Pipeline

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

                        // Build Xcode project
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
                    // Deploy to distribution platform
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

## Testing Strategy

### Game Testing Pyramid

```
                /\
               /  \          Player Testing
              /    \         (User Testing)
             /──────\
            /        \       QA Testing
           /          \      (Manual Testing)
          /────────────\
         /              \    Integration Tests
        /                \   (Integration Tests)
       /──────────────────\
      /                    \ Unit Tests
     /                      \ (Unit Tests)
    /──────────────────────────\
```

### Unit Tests

```csharp
// Unity Test Framework Example
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
        playerHealth.Initialize(100); // Initial health 100
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
        Assert.AreEqual(100, playerHealth.CurrentHealth); // Max is 100
    }

    [UnityTest]
    public IEnumerator TakeDamage_TriggersInvulnerabilityFrames()
    {
        // Arrange
        playerHealth.TakeDamage(10);

        // Act - take damage again during invulnerability frames
        playerHealth.TakeDamage(10);

        // Assert - should only take damage from first hit
        Assert.AreEqual(90, playerHealth.CurrentHealth);

        // Wait for invulnerability frames to end
        yield return new WaitForSeconds(1f);

        // Now should be able to take damage again
        playerHealth.TakeDamage(10);
        Assert.AreEqual(80, playerHealth.CurrentHealth);
    }
}
```

### Integration Tests

```csharp
// Combat System Integration Tests
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
        // Load test scene
        var loadOperation = UnityEngine.SceneManagement.SceneManager
            .LoadSceneAsync("TestScene", UnityEngine.SceneManagement.LoadSceneMode.Single);

        while (!loadOperation.isDone)
            yield return null;

        // Instantiate player and enemy
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

        // Move player near enemy
        playerObject.transform.position = enemyObject.transform.position + Vector3.left * 2;

        yield return new WaitForSeconds(0.1f);

        // Act - execute attack
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

        // Act - kill enemy
        enemyHealth.TakeDamage(9999);

        yield return new WaitForSeconds(1f);

        // Assert - check if loot was spawned
        var lootItems = Object.FindObjectsOfType<LootItem>();
        Assert.Greater(lootItems.Length, 0);
    }
}
```

### Performance Tests

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
        // Create many physics objects
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

        // Cleanup
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

### Automated Playthrough Tests

```csharp
// Automated Gameplay Flow Tests
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
        // Load main menu
        yield return LoadScene("MainMenu");

        // Click start button
        yield return ClickButton("StartButton");

        // Wait for game scene to load
        yield return WaitForScene("GameScene");

        // Simulate player input
        for (int i = 0; i < 100; i++)
        {
            SimulatePlayerInput();
            yield return new WaitForSeconds(0.1f);
        }

        // Verify no errors
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
        // Simulate random input
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

## Team Collaboration

### Multi-Role Collaboration Workflow

```
Designer              Artist               Programmer
    │                    │                    │
    ▼                    ▼                    ▼
Design Docs          Asset Creation       System Development
    │                    │                    │
    └────────────────────┼────────────────────┘
                         ▼
                  Version Control System
                         │
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
Level Editing       Asset Integration    Feature Integration
    │                    │                    │
    └────────────────────┼────────────────────┘
                         ▼
                    Test Validation
                         │
                         ▼
                    Release Build
```

### Task Management and Tracking

Recommended tool combinations:

**Project Management Tools**:

- **Jira**: Suitable for large teams, powerful customization capabilities
- **Notion**: Flexible document and database management
- **Trello**: Simple and intuitive kanban management
- **Linear**: Modern issue tracking

**Document Collaboration**:

- **Confluence**: Integrates well with Jira
- **Google Docs**: Real-time collaboration
- **Notion**: Integrated document and task management

**Communication Tools**:

- **Slack**: Team instant messaging
- **Discord**: Widely used in the game industry
- **Microsoft Teams**: Enterprise-level solution

### Code Review Guidelines

```markdown
## Code Review Checklist

### Functionality
- [ ] Code implements expected functionality
- [ ] Edge cases are handled
- [ ] Error handling is complete

### Performance
- [ ] Avoid unnecessary memory allocations
- [ ] Avoid expensive operations in Update
- [ ] Object pooling used appropriately

### Maintainability
- [ ] Code readability is good
- [ ] Naming conventions are consistent
- [ ] Appropriate comments

### Testing
- [ ] Unit tests added
- [ ] Tested in editor
- [ ] Tested on target platform
```

### Branch Protection Rules

```yaml
# GitHub branch protection configuration example
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

## Common Pitfalls

### Git LFS Configuration Omission

**Problem**: Team members cannot correctly fetch large files after cloning repository

**Solution**:

```bash
# Ensure all members install Git LFS
git lfs install

# Check LFS status
git lfs env

# Include LFS files when cloning
git clone --recurse-submodules URL
git lfs pull
```

### Inconsistent Build Machine Configuration

**Problem**: Local build succeeds but CI fails

**Solution**:

```yaml
# Use Docker to ensure environment consistency
# Dockerfile
FROM unityci/editor:ubuntu-2022.3.10f1-android-1

# Install project dependencies
RUN apt-get update && apt-get install -y \
    android-sdk \
    openjdk-11-jdk

# Set environment variables
ENV ANDROID_HOME=/opt/android-sdk
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

### Asset Reference Loss

**Problem**: Asset references broken after merging branches

**Solution**:

```csharp
// Use GUIDs instead of path references
// Unity automatically maintains GUIDs in .meta files

// Don't do this
// public Sprite mySprite; // Manually drag in Inspector

// Recommend using Addressables or Resources
public AssetReference myAssetReference;
// Or
Addressables.LoadAssetAsync<Sprite>("path/to/sprite");
```

### Scene Merge Conflicts

**Problem**: Multiple people editing scenes simultaneously leads to unmerge-able conflicts

**Solution**:

```
Recommended practices:
1. Use Prefab nesting to reduce scene modifications
2. Split scenes into multiple sub-scenes by area
3. Use Unity's Scene locking feature
4. Establish scene modification reservation mechanism
```

### Build Time Too Long

**Problem**: Each build takes hours

**Solution**:

```yaml
# Incremental build configuration
build:
  cache:
    - Library/           # Unity library cache
    - Temp/              # Temporary files
    - obj/               # C# compilation cache

# Use parallel builds
jobs:
  - build-windows: parallel
  - build-android: parallel
  - build-ios: parallel

# On-demand asset importing
# Use Addressables for on-demand loading
```

## Interview Key Points

### Common Interview Questions

**1. Why aren't game projects suitable for using Git directly?**

Game projects contain large amounts of binary files (models, textures, audio, etc.), these files:
- Cannot be text-merged
- Take up large storage space
- Frequent modifications cause repository to grow rapidly

Solution is to use Git LFS or Perforce and other version control systems that support large files.

**2. How to handle version control for game assets?**

- Use Git LFS to track large files
- Implement file locking mechanism to prevent concurrent editing
- Establish asset naming conventions and directory structure
- Use .gitattributes to configure file handling rules

**3. Describe a game CI/CD process you participated in**

Key points:
- Automated build process (using Jenkins, GitHub Actions, etc.)
- Multi-platform build support
- Automated testing (unit tests, integration tests)
- Version number management
- Build artifact distribution

**4. How to optimize game project build time?**

- Use incremental builds
- Configure build cache
- Parallelize build tasks
- Use distributed build systems
- Optimize asset import settings

**5. How to promote code review within a team?**

- Establish clear review standards and checklists
- Use branch protection rules to require reviews
- Cultivate positive review culture
- Use automation tools for initial checks

**6. How should game testing strategy be developed?**

- Unit tests cover core logic
- Integration tests verify system interactions
- Automated playthrough tests detect regressions
- Performance tests monitor key metrics
- Manual QA tests game experience

## Practical Scenarios

### Scenario One: New Member Joins Project

```bash
# New member environment setup process

# Install necessary tools
# - Unity Hub and corresponding version
# - Git and Git LFS
# - IDE (VS Code / Rider)

# Configure Git LFS
git lfs install

# Clone project
git clone --recurse-submodules https://github.com/company/game.git
cd game
git lfs pull

# Configure Unity project
# - Open Unity Hub
# - Add project and use correct Unity version

# Verify project
# - Ensure no compilation errors
# - Run test suite
# - Test build
```

### Scenario Two: Emergency Fix for Live Issue

```bash
# Hotfix process

# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-crash

# Fix issue and test
# ... modify code ...
git add .
git commit -m "Fix: Fix critical crash issue #123"

# Push and create PR
git push origin hotfix/critical-crash
# Create PR to main, trigger emergency review

# Auto-trigger build after merge
# CI/CD automatically builds and deploys to hot update server

# Sync to develop branch
git checkout develop
git merge hotfix/critical-crash
git push origin develop
```

### Scenario Three: Major Version Release Preparation

```bash
# Version release process

# Create release branch
git checkout develop
git checkout -b release/1.2.0

# Update version number
# Modify version number in ProjectSettings
# Update CHANGELOG.md

# Release branch testing
# - Run complete test suite
# - Conduct internal testing
# - Fix discovered issues

# Merge to main
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# Sync back to develop
git checkout develop
git merge release/1.2.0

# Push all changes
git push origin main develop --tags

# Trigger release build
# CI detects tag and automatically builds release version
```

## Further Reading

### Official Documentation

- [Unity Version Control Best Practices](https://docs.unity3d.com/Manual/BestPracticeGuides.html)
- [Unreal Engine Version Control](https://docs.unrealengine.com/5.0/en-US/version-control-in-unreal-engine/)
- [Git LFS Official Documentation](https://git-lfs.github.com/)
- [Perforce Helix Core Documentation](https://www.perforce.com/manuals/p4guide/Content/P4Guide/Home-p4guide.html)

### Recommended Books

- "Agile Game Development with Scrum" - Clinton Keith
- "Game Development and Production" - Erik Bethke
- "Game Development Essentials: Game Project Management" - Heather Maxwell Chandler
- "Continuous Delivery" - Jez Humble & David Farley

### Quality Resources

- [Game CI](https://game.ci/) - CI/CD toolkit for Unity/Unreal
- [Unity Test Framework](https://docs.unity3d.com/Packages/com.unity.test-framework@latest) - Unity official test framework
- [GameCI GitHub Actions](https://github.com/game-ci) - CI/CD templates for game projects
- [GDC Vault](https://gdcvault.com/) - Game Developers Conference resources

### Community and Forums

- [Unity Official Forum](https://forum.unity.com/)
- [Unreal Engine Official Forum](https://forums.unrealengine.com/)
- [GameDev.net](https://www.gamedev.net/)
- [r/gamedev](https://www.reddit.com/r/gamedev/)

## Summary

Game development pipeline and toolchain is the foundation infrastructure for game project success. An efficient development pipeline should:

1. **Version Control**: Use Git LFS or Perforce to handle large files, establish reasonable branching strategy
2. **Asset Management**: Standardize naming and directory structure, automate import workflow
3. **Build Automation**: Implement multi-platform automated builds, shorten iteration cycles
4. **Continuous Integration**: Automated testing and code quality checks, discover issues early
5. **Team Collaboration**: Clear workflow and communication mechanisms

Key points:

- Establish toolchain and processes early in the project, modification costs are high later
- Choose appropriate tools based on team size and project characteristics
- Automate everything that can be automated
- Continuously optimize build and test efficiency
- Maintain team consensus and compliance with processes

A good development pipeline allows the team to focus on creation itself, rather than being troubled by technical issues.
