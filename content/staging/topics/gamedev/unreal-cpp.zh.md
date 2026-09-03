---
title: Unreal Engine C++ 游戏编程
description: 深入掌握Unreal Engine C++开发：UObject系统、反射、GC和游戏框架
track: gamedev
section: unreal
difficulty: advanced
tags:
  - Unreal
  - C++
  - 游戏编程
  - UObject
status: imported
origin: old/src/content/docs/gamedev/unreal-cpp.zh.md
divergence: 0.207
issues: []
legacy:
  category: GameDev
  subcategory: Unreal
  order: 8
  lastUpdated: 2026-01-07
---

## 概念解释：Unreal Engine C++ 开发

Unreal Engine（虚幻引擎）是由 Epic Games 开发的世界顶级游戏引擎，广泛应用于 AAA 级游戏、影视制作和虚拟现实领域。虽然 Blueprint 可视化脚本降低了开发门槛，但 C++ 仍然是实现高性能游戏逻辑和底层系统的首选语言。

### 为什么选择 C++

Unreal Engine C++ 开发相比纯 Blueprint 具有以下优势：

- **性能优势**：C++ 代码执行效率远高于 Blueprint，适合性能敏感的游戏逻辑
- **完整的引擎访问**：可以访问引擎的所有底层功能和系统
- **代码复用**：便于创建可复用的游戏框架和工具
- **版本控制友好**：文本文件比二进制 Blueprint 更易于进行版本控制和代码审查
- **团队协作**：大型项目中 C++ 代码更易于分工和管理

### Unreal C++ 的特殊性

Unreal Engine 使用的并非标准 C++，而是扩展了大量宏和约定：

```
1. 使用 UObject 系统管理对象生命周期
2. 通过宏实现反射系统（UPROPERTY、UFUNCTION 等）
3. 自动垃圾回收（GC）替代手动内存管理
4. 使用 Unreal 专有的容器类（TArray、TMap 等）
5. 特殊的命名约定（U 前缀、A 前缀、F 前缀等）
```

## UObject 系统

### UObject 基础

UObject 是 Unreal Engine 中所有托管对象的基类，提供了反射、序列化、网络复制和垃圾回收等核心功能。

```cpp
// 创建一个简单的 UObject 派生类
#pragma once

#include "CoreMinimal.h"
#include "UObject/NoExportTypes.h"
#include "MyObject.generated.h"

UCLASS(Blueprintable, BlueprintType)
class MYGAME_API UMyObject : public UObject
{
    GENERATED_BODY()

public:
    UMyObject();

    // 带反射的属性
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    FString ObjectName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    int32 ObjectValue;

    // 带反射的函数
    UFUNCTION(BlueprintCallable, Category = "Actions")
    void PerformAction();

    UFUNCTION(BlueprintPure, Category = "Getters")
    FString GetDescription() const;
};
```

```cpp
// MyObject.cpp
#include "MyObject.h"

UMyObject::UMyObject()
    : ObjectName(TEXT("DefaultName"))
    , ObjectValue(0)
{
}

void UMyObject::PerformAction()
{
    UE_LOG(LogTemp, Log, TEXT("Performing action on %s"), *ObjectName);
    ObjectValue++;
}

FString UMyObject::GetDescription() const
{
    return FString::Printf(TEXT("%s: Value = %d"), *ObjectName, ObjectValue);
}
```

### 对象创建与销毁

UObject 的创建必须通过特定的工厂函数，不能使用 `new` 关键字：

```cpp
// 创建 UObject 派生类实例
void AMyActor::CreateObjects()
{
    // 方式1：NewObject - 最常用的创建方式
    UMyObject* MyObj = NewObject<UMyObject>(this);

    // 方式2：指定类和外部对象
    UMyObject* MyObj2 = NewObject<UMyObject>(
        this,                    // Outer - 外部对象，影响生命周期
        UMyObject::StaticClass(), // Class - 要创建的类
        FName("MyObjectInstance") // Name - 实例名称
    );

    // 方式3：使用模板创建（基于已有对象）
    UMyObject* Template = GetDefault<UMyObject>();
    UMyObject* MyObj3 = NewObject<UMyObject>(this, NAME_None, RF_NoFlags, Template);

    // 方式4：创建默认子对象（用于组件）
    // 通常在构造函数中使用
    // USceneComponent* Root = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));

    // 错误示例 - 不要这样做！
    // UMyObject* BadObj = new UMyObject(); // 编译错误或运行时崩溃
}

// 获取 CDO（Class Default Object）
void AMyActor::GetClassDefaults()
{
    // 获取类的默认对象
    const UMyObject* DefaultObj = GetDefault<UMyObject>();

    // 获取可修改的默认对象（谨慎使用）
    UMyObject* MutableDefault = GetMutableDefault<UMyObject>();

    UE_LOG(LogTemp, Log, TEXT("Default ObjectName: %s"), *DefaultObj->ObjectName);
}
```

### 对象查找与遍历

```cpp
// 查找对象的各种方式
void FindObjects()
{
    // 按名称查找对象
    UMyObject* Found = FindObject<UMyObject>(
        GetTransientPackage(),
        TEXT("MyObjectInstance")
    );

    // 查找或加载对象
    UMyObject* LoadedObj = FindObject<UMyObject>(
        nullptr,
        TEXT("/Game/Data/MyObject.MyObject")
    );

    // 遍历所有特定类型的对象
    for (TObjectIterator<UMyObject> It; It; ++It)
    {
        UMyObject* Obj = *It;
        UE_LOG(LogTemp, Log, TEXT("Found: %s"), *Obj->GetName());
    }

    // 遍历特定 Outer 下的对象
    TArray<UObject*> ChildObjects;
    GetObjectsWithOuter(this, ChildObjects, true);

    for (UObject* Child : ChildObjects)
    {
        if (UMyObject* MyChild = Cast<UMyObject>(Child))
        {
            UE_LOG(LogTemp, Log, TEXT("Child: %s"), *MyChild->GetName());
        }
    }
}
```

## UPROPERTY 和 UFUNCTION 宏

### UPROPERTY 详解

UPROPERTY 宏用于将类成员变量暴露给 Unreal 的反射系统：

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ============ 访问控制 ============

    // 编辑器可见，蓝图可读写
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Character")
    float Health;

    // 仅在实例上可编辑（非类默认值）
    UPROPERTY(EditInstanceOnly, BlueprintReadOnly, Category = "Character")
    FString CharacterName;

    // 仅在类默认值可编辑
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Character")
    float MaxHealth;

    // 编辑器只读，运行时可修改
    UPROPERTY(VisibleAnywhere, BlueprintReadWrite, Category = "Character")
    int32 CurrentLevel;

    // ============ 网络复制 ============

    // 服务器到客户端复制
    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Network")
    int32 Score;

    // 带回调的复制
    UPROPERTY(ReplicatedUsing = OnRep_Armor, BlueprintReadOnly, Category = "Network")
    float Armor;

    UFUNCTION()
    void OnRep_Armor();

    // ============ 元数据 ============

    // 带范围限制
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats",
              meta = (ClampMin = "0.0", ClampMax = "100.0", UIMin = "0.0", UIMax = "100.0"))
    float Stamina;

    // 带工具提示
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats",
              meta = (ToolTip = "角色的移动速度倍率"))
    float SpeedMultiplier;

    // 条件显示
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    bool bCanAttack;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat",
              meta = (EditCondition = "bCanAttack"))
    float AttackDamage;

    // ============ 资源引用 ============

    // 软引用（不立即加载）
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Assets")
    TSoftObjectPtr<UTexture2D> CharacterIcon;

    // 软类引用
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Assets")
    TSoftClassPtr<AActor> SpawnableClass;

    // 硬引用（立即加载）
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Assets")
    TSubclassOf<UDamageType> DamageTypeClass;

    // ============ 容器类型 ============

    // 数组
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
    TArray<FString> InventoryItems;

    // 映射
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
    TMap<FString, int32> ItemCounts;

    // 集合
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Inventory")
    TSet<FName> UnlockedAbilities;

protected:
    // ============ 组件引用 ============

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components",
              meta = (AllowPrivateAccess = "true"))
    UStaticMeshComponent* WeaponMesh;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    UCameraComponent* FollowCamera;
};
```

### UFUNCTION 详解

UFUNCTION 宏用于将成员函数暴露给反射系统：

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ============ 蓝图调用 ============

    // 普通蓝图可调用函数
    UFUNCTION(BlueprintCallable, Category = "Combat")
    void Attack();

    // 纯函数（无副作用，蓝图中显示为绿色节点）
    UFUNCTION(BlueprintPure, Category = "Stats")
    float GetHealthPercent() const;

    // 可在蓝图中实现的函数
    UFUNCTION(BlueprintImplementableEvent, Category = "Events")
    void OnLevelUp(int32 NewLevel);

    // C++ 提供默认实现，蓝图可覆盖
    UFUNCTION(BlueprintNativeEvent, Category = "Events")
    void OnDamageReceived(float Damage, AActor* DamageCauser);
    virtual void OnDamageReceived_Implementation(float Damage, AActor* DamageCauser);

    // ============ 网络 RPC ============

    // 服务器执行（从客户端调用）
    UFUNCTION(Server, Reliable, WithValidation, Category = "Network")
    void ServerPerformAction(FVector TargetLocation);
    void ServerPerformAction_Implementation(FVector TargetLocation);
    bool ServerPerformAction_Validate(FVector TargetLocation);

    // 客户端执行（从服务器调用）
    UFUNCTION(Client, Reliable, Category = "Network")
    void ClientShowDamageNumber(float Damage, FVector Location);
    void ClientShowDamageNumber_Implementation(float Damage, FVector Location);

    // 多播（所有客户端执行）
    UFUNCTION(NetMulticast, Unreliable, Category = "Network")
    void MulticastPlayHitEffect(FVector HitLocation, FRotator HitRotation);
    void MulticastPlayHitEffect_Implementation(FVector HitLocation, FRotator HitRotation);

    // ============ 执行控制 ============

    // 仅在编辑器调用
    UFUNCTION(CallInEditor, Category = "Debug")
    void DebugResetStats();

    // 控制台命令
    UFUNCTION(Exec)
    void GodMode();

    // ============ 参数修饰 ============

    // 输出参数
    UFUNCTION(BlueprintCallable, Category = "Stats")
    void GetCharacterStats(
        UPARAM(DisplayName = "Health") float& OutHealth,
        UPARAM(DisplayName = "Armor") float& OutArmor,
        UPARAM(DisplayName = "Level") int32& OutLevel
    );

    // 带默认值的参数
    UFUNCTION(BlueprintCallable, Category = "Combat",
              meta = (AdvancedDisplay = "bPlaySound, SoundVolume"))
    void DealDamage(
        AActor* Target,
        float BaseDamage,
        bool bPlaySound = true,
        float SoundVolume = 1.0f
    );

    // 世界上下文对象（用于静态蓝图函数库）
    UFUNCTION(BlueprintCallable, Category = "Utility",
              meta = (WorldContext = "WorldContextObject"))
    static void SpawnEffectAtLocation(
        const UObject* WorldContextObject,
        UParticleSystem* Effect,
        FVector Location
    );
};
```

## 反射系统

### 反射系统原理

Unreal 的反射系统通过 Unreal Header Tool（UHT）在编译时生成元数据：

```cpp
// 使用反射系统获取类信息
void ExploreReflection()
{
    // 获取类的 UClass 对象
    UClass* MyClass = AMyCharacter::StaticClass();

    // 获取类名
    FString ClassName = MyClass->GetName();
    UE_LOG(LogTemp, Log, TEXT("Class: %s"), *ClassName);

    // 遍历所有属性
    for (TFieldIterator<FProperty> PropIt(MyClass); PropIt; ++PropIt)
    {
        FProperty* Property = *PropIt;
        FString PropName = Property->GetName();
        FString PropType = Property->GetCPPType();

        UE_LOG(LogTemp, Log, TEXT("Property: %s (%s)"), *PropName, *PropType);

        // 检查属性标志
        if (Property->HasAnyPropertyFlags(CPF_BlueprintVisible))
        {
            UE_LOG(LogTemp, Log, TEXT("  - Blueprint Visible"));
        }
        if (Property->HasAnyPropertyFlags(CPF_Net))
        {
            UE_LOG(LogTemp, Log, TEXT("  - Replicated"));
        }
    }

    // 遍历所有函数
    for (TFieldIterator<UFunction> FuncIt(MyClass); FuncIt; ++FuncIt)
    {
        UFunction* Function = *FuncIt;
        FString FuncName = Function->GetName();

        UE_LOG(LogTemp, Log, TEXT("Function: %s"), *FuncName);

        // 检查函数标志
        if (Function->HasAnyFunctionFlags(FUNC_BlueprintCallable))
        {
            UE_LOG(LogTemp, Log, TEXT("  - Blueprint Callable"));
        }
        if (Function->HasAnyFunctionFlags(FUNC_Net))
        {
            UE_LOG(LogTemp, Log, TEXT("  - Network Function"));
        }
    }
}
```

### 动态属性访问

```cpp
// 通过反射动态访问和修改属性
void DynamicPropertyAccess(UObject* Object)
{
    if (!Object) return;

    UClass* Class = Object->GetClass();

    // 查找特定属性
    FProperty* HealthProp = Class->FindPropertyByName(FName("Health"));
    if (HealthProp)
    {
        // 获取属性值
        float* HealthPtr = HealthProp->ContainerPtrToValuePtr<float>(Object);
        if (HealthPtr)
        {
            float CurrentHealth = *HealthPtr;
            UE_LOG(LogTemp, Log, TEXT("Current Health: %f"), CurrentHealth);

            // 修改属性值
            *HealthPtr = 100.0f;
        }
    }

    // 使用更安全的方式
    FFloatProperty* FloatProp = CastField<FFloatProperty>(HealthProp);
    if (FloatProp)
    {
        float Value = FloatProp->GetPropertyValue_InContainer(Object);
        FloatProp->SetPropertyValue_InContainer(Object, 100.0f);
    }

    // 处理字符串属性
    FProperty* NameProp = Class->FindPropertyByName(FName("CharacterName"));
    if (FStrProperty* StrProp = CastField<FStrProperty>(NameProp))
    {
        FString Name = StrProp->GetPropertyValue_InContainer(Object);
        StrProp->SetPropertyValue_InContainer(Object, TEXT("NewName"));
    }
}
```

### 动态函数调用

```cpp
// 通过反射动态调用函数
void DynamicFunctionCall(UObject* Object)
{
    if (!Object) return;

    UClass* Class = Object->GetClass();

    // 查找函数
    UFunction* AttackFunc = Class->FindFunctionByName(FName("Attack"));
    if (AttackFunc)
    {
        // 无参数函数调用
        Object->ProcessEvent(AttackFunc, nullptr);
    }

    // 带参数的函数调用
    UFunction* DamageFunc = Class->FindFunctionByName(FName("DealDamage"));
    if (DamageFunc)
    {
        // 准备参数结构体
        struct
        {
            AActor* Target;
            float BaseDamage;
            bool bPlaySound;
            float SoundVolume;
        } Params;

        Params.Target = nullptr;
        Params.BaseDamage = 50.0f;
        Params.bPlaySound = true;
        Params.SoundVolume = 1.0f;

        Object->ProcessEvent(DamageFunc, &Params);
    }

    // 带返回值的函数调用
    UFunction* GetHealthFunc = Class->FindFunctionByName(FName("GetHealthPercent"));
    if (GetHealthFunc)
    {
        struct
        {
            float ReturnValue;
        } Params;

        Object->ProcessEvent(GetHealthFunc, &Params);

        UE_LOG(LogTemp, Log, TEXT("Health Percent: %f"), Params.ReturnValue);
    }
}
```

## 垃圾回收（GC）

### GC 工作原理

Unreal Engine 使用标记-清除（Mark-Sweep）垃圾回收算法：

```
GC 工作流程：
1. 标记阶段：从根对象（Root Set）开始遍历所有可达对象
2. 清除阶段：销毁所有未被标记的对象
3. 根对象包括：
   - 全局 UObject 数组
   - 被 AddToRoot() 标记的对象
   - 被 UPROPERTY() 引用的对象
   - 被 TStrongObjectPtr 持有的对象
```

### 保持对象存活

```cpp
UCLASS()
class MYGAME_API AMyManager : public AActor
{
    GENERATED_BODY()

public:
    // 方式1：使用 UPROPERTY - 最推荐
    UPROPERTY()
    UMyObject* ManagedObject;

    // 方式2：使用 TArray 存储
    UPROPERTY()
    TArray<UMyObject*> ObjectPool;

    // 方式3：使用 TMap
    UPROPERTY()
    TMap<FName, UMyObject*> ObjectMap;

private:
    // 注意：原始指针不会防止 GC！
    UMyObject* RawPointer; // 危险！可能被 GC 回收

    // 使用 TWeakObjectPtr 保存弱引用
    TWeakObjectPtr<UMyObject> WeakReference;

    // 使用 TStrongObjectPtr 在非 UPROPERTY 情况下保持引用
    TStrongObjectPtr<UMyObject> StrongReference;

public:
    void CreateAndManageObjects()
    {
        // 安全：通过 UPROPERTY 引用
        ManagedObject = NewObject<UMyObject>(this);

        // 安全：添加到 UPROPERTY 数组
        UMyObject* PoolObj = NewObject<UMyObject>(this);
        ObjectPool.Add(PoolObj);

        // 危险：原始指针引用
        RawPointer = NewObject<UMyObject>(this);
        // 下次 GC 后 RawPointer 可能指向已销毁的对象！

        // 解决方案1：使用 AddToRoot（需要手动 RemoveFromRoot）
        RawPointer->AddToRoot();
        // ... 使用对象 ...
        // 完成后：RawPointer->RemoveFromRoot();

        // 解决方案2：使用 TStrongObjectPtr
        StrongReference = TStrongObjectPtr<UMyObject>(NewObject<UMyObject>(this));

        // 弱引用：不阻止 GC，但可以安全检查有效性
        WeakReference = ManagedObject;
        if (WeakReference.IsValid())
        {
            WeakReference->PerformAction();
        }
    }

    // 强制触发垃圾回收（慎用，会造成卡顿）
    void ForceGarbageCollection()
    {
        // 仅清理无引用对象
        GEngine->ForceGarbageCollection(false);

        // 完整 GC（包括清理 Actor）
        GEngine->ForceGarbageCollection(true);

        // 更精细的控制
        CollectGarbage(GARBAGE_COLLECTION_KEEPFLAGS);
    }
};
```

### 常见 GC 陷阱

```cpp
// 陷阱1：Lambda 捕获
void AMyActor::SetupTimer()
{
    // 错误：this 指针可能在 Lambda 执行时已失效
    GetWorld()->GetTimerManager().SetTimer(
        TimerHandle,
        [this]()
        {
            // 危险！Actor 可能已被销毁
            DoSomething();
        },
        1.0f,
        false
    );

    // 正确：使用弱引用
    TWeakObjectPtr<AMyActor> WeakThis(this);
    GetWorld()->GetTimerManager().SetTimer(
        TimerHandle,
        [WeakThis]()
        {
            if (WeakThis.IsValid())
            {
                WeakThis->DoSomething();
            }
        },
        1.0f,
        false
    );
}

// 陷阱2：异步操作中的对象引用
void AMyActor::AsyncOperation()
{
    // 错误：异步任务完成时对象可能已销毁
    AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [this]()
    {
        // 危险！
        ProcessData();
    });

    // 正确：使用弱引用和主线程回调
    TWeakObjectPtr<AMyActor> WeakThis(this);
    AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [WeakThis]()
    {
        // 在后台线程处理数据
        TArray<int32> ProcessedData = ProcessDataStatic();

        // 回到游戏线程使用结果
        AsyncTask(ENamedThreads::GameThread, [WeakThis, ProcessedData]()
        {
            if (WeakThis.IsValid())
            {
                WeakThis->UseProcessedData(ProcessedData);
            }
        });
    });
}

// 陷阱3：结构体中的 UObject 指针
struct FMyStruct
{
    // 错误：结构体中的原始指针不受 GC 追踪
    UMyObject* RawPointer;

    // 正确：使用 TWeakObjectPtr
    TWeakObjectPtr<UMyObject> WeakPointer;

    // 或者：如果结构体用于 UPROPERTY，使用 USTRUCT
};

USTRUCT(BlueprintType)
struct FMyReflectedStruct
{
    GENERATED_BODY()

    // 正确：USTRUCT 中的 UPROPERTY 指针会被 GC 追踪
    UPROPERTY()
    UMyObject* SafePointer;
};
```

## Actor 生命周期

### Actor 创建流程

```
Actor 创建的完整流程：
1. SpawnActor() 或 SpawnActorDeferred() 调用
2. 内存分配和构造函数执行
3. PostActorCreated() - 仅新创建时调用
4. PostInitializeComponents() - 组件初始化后
5. BeginPlay() - 游戏开始时调用

关键区别：
- 构造函数：设置默认值，创建组件
- PostInitializeComponents：组件已就绪，可以设置组件间关系
- BeginPlay：游戏逻辑开始，可以访问其他 Actor
```

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // 构造函数 - 设置默认值和创建组件
    AMyCharacter()
    {
        PrimaryActorTick.bCanEverTick = true;

        // 创建组件
        CameraComponent = CreateDefaultSubobject<UCameraComponent>(TEXT("Camera"));
        CameraComponent->SetupAttachment(GetRootComponent());

        // 设置默认值
        Health = 100.0f;
        MaxHealth = 100.0f;

        // 注意：不要在构造函数中访问 World 或其他 Actor！
        // GetWorld() 在这里可能返回 nullptr
    }

protected:
    // PostActorCreated - 仅在新创建 Actor 时调用（不包括加载）
    virtual void PostActorCreated() override
    {
        Super::PostActorCreated();
        UE_LOG(LogTemp, Log, TEXT("Actor Created: %s"), *GetName());
    }

    // OnConstruction - 编辑器中移动或属性改变时调用
    virtual void OnConstruction(const FTransform& Transform) override
    {
        Super::OnConstruction(Transform);
        // 用于编辑器预览或程序化生成
    }

    // PostInitializeComponents - 所有组件初始化完成后
    virtual void PostInitializeComponents() override
    {
        Super::PostInitializeComponents();

        // 可以安全设置组件间的引用关系
        if (CameraComponent && GetMesh())
        {
            CameraComponent->AttachToComponent(
                GetMesh(),
                FAttachmentTransformRules::KeepRelativeTransform,
                FName("head")
            );
        }
    }

    // BeginPlay - 游戏开始，所有初始化完成
    virtual void BeginPlay() override
    {
        Super::BeginPlay();

        // 可以安全访问 World 和其他 Actor
        if (UWorld* World = GetWorld())
        {
            // 查找其他 Actor
            AGameModeBase* GameMode = World->GetAuthGameMode();

            // 设置定时器
            GetWorldTimerManager().SetTimer(
                RegenTimerHandle,
                this,
                &AMyCharacter::RegenerateHealth,
                1.0f,
                true
            );
        }

        // 绑定输入
        if (APlayerController* PC = Cast<APlayerController>(GetController()))
        {
            if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
                ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PC->GetLocalPlayer()))
            {
                Subsystem->AddMappingContext(InputMappingContext, 0);
            }
        }
    }

    // Tick - 每帧调用
    virtual void Tick(float DeltaTime) override
    {
        Super::Tick(DeltaTime);

        // 帧更新逻辑
        UpdateCharacterState(DeltaTime);
    }

private:
    UPROPERTY(VisibleAnywhere)
    UCameraComponent* CameraComponent;

    UPROPERTY(EditDefaultsOnly)
    float Health;

    UPROPERTY(EditDefaultsOnly)
    float MaxHealth;

    FTimerHandle RegenTimerHandle;

    UPROPERTY(EditDefaultsOnly)
    UInputMappingContext* InputMappingContext;

    void RegenerateHealth();
    void UpdateCharacterState(float DeltaTime);
};
```

### Actor 销毁流程

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

protected:
    // EndPlay - Actor 即将从世界移除
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override
    {
        // 清理资源
        GetWorldTimerManager().ClearTimer(RegenTimerHandle);

        // 解绑委托
        if (OnDamageDelegate.IsBound())
        {
            OnDamageDelegate.Unbind();
        }

        // 记录原因
        switch (EndPlayReason)
        {
        case EEndPlayReason::Destroyed:
            UE_LOG(LogTemp, Log, TEXT("Actor Destroyed"));
            break;
        case EEndPlayReason::LevelTransition:
            UE_LOG(LogTemp, Log, TEXT("Level Transition"));
            break;
        case EEndPlayReason::EndPlayInEditor:
            UE_LOG(LogTemp, Log, TEXT("Stopped in Editor"));
            break;
        case EEndPlayReason::RemovedFromWorld:
            UE_LOG(LogTemp, Log, TEXT("Removed from World"));
            break;
        case EEndPlayReason::Quit:
            UE_LOG(LogTemp, Log, TEXT("Game Quit"));
            break;
        }

        Super::EndPlay(EndPlayReason);
    }

    // Destroyed - Actor 被销毁时（EndPlay 之后）
    virtual void Destroyed() override
    {
        // 最后的清理机会
        UE_LOG(LogTemp, Log, TEXT("Actor Final Destruction: %s"), *GetName());

        Super::Destroyed();
    }

    // BeginDestroy - UObject 级别的销毁开始
    virtual void BeginDestroy() override
    {
        // 清理非托管资源
        if (NativeResource)
        {
            delete NativeResource;
            NativeResource = nullptr;
        }

        Super::BeginDestroy();
    }

public:
    // 销毁 Actor 的方法
    void DestroyThisActor()
    {
        // 方式1：立即销毁
        Destroy();

        // 方式2：延迟销毁
        SetLifeSpan(5.0f); // 5秒后销毁

        // 方式3：由 World 销毁
        // GetWorld()->DestroyActor(this);
    }

private:
    FTimerHandle RegenTimerHandle;
    FOnDamageDelegate OnDamageDelegate;
    void* NativeResource = nullptr;
};
```

### Deferred Spawn

```cpp
// 延迟生成 - 可以在 BeginPlay 前设置属性
void AMySpawner::SpawnWithDeferred()
{
    FActorSpawnParameters SpawnParams;
    SpawnParams.SpawnCollisionHandlingOverride =
        ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    // 延迟生成
    AMyCharacter* NewCharacter = GetWorld()->SpawnActorDeferred<AMyCharacter>(
        CharacterClass,
        FTransform::Identity,
        this,
        nullptr,
        ESpawnActorCollisionHandlingMethod::AlwaysSpawn
    );

    if (NewCharacter)
    {
        // 在 BeginPlay 之前设置属性
        NewCharacter->Health = 200.0f;
        NewCharacter->CharacterName = TEXT("SpawnedCharacter");

        // 设置位置
        FVector SpawnLocation = GetActorLocation() + FVector(0, 0, 100);
        NewCharacter->SetActorLocation(SpawnLocation);

        // 完成生成（触发 BeginPlay）
        NewCharacter->FinishSpawning(FTransform(SpawnLocation));
    }
}
```

## GameMode 和 GameState

### GameMode 详解

GameMode 定义游戏规则，仅存在于服务器端：

```cpp
// MyGameMode.h
UCLASS()
class MYGAME_API AMyGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AMyGameMode();

    // ============ 游戏流程控制 ============

    // 游戏开始
    virtual void StartPlay() override;

    // 处理玩家登录
    virtual void PreLogin(
        const FString& Options,
        const FString& Address,
        const FUniqueNetIdRepl& UniqueId,
        FString& ErrorMessage
    ) override;

    virtual FString InitNewPlayer(
        APlayerController* NewPlayerController,
        const FUniqueNetIdRepl& UniqueId,
        const FString& Options,
        const FString& Portal
    ) override;

    virtual void PostLogin(APlayerController* NewPlayer) override;

    virtual void Logout(AController* Exiting) override;

    // ============ 生成控制 ============

    // 选择 Pawn 类
    virtual UClass* GetDefaultPawnClassForController_Implementation(
        AController* InController
    ) override;

    // 选择出生点
    virtual AActor* ChoosePlayerStart_Implementation(AController* Player) override;

    // 处理玩家重生
    virtual void RestartPlayer(AController* NewPlayer) override;

    // ============ 游戏规则 ============

    UFUNCTION(BlueprintCallable, Category = "Game")
    void StartMatch();

    UFUNCTION(BlueprintCallable, Category = "Game")
    void EndMatch(bool bWon);

    UFUNCTION(BlueprintCallable, Category = "Game")
    void OnPlayerKilled(APlayerController* Killer, APlayerController* Victim);

    // ============ 配置 ============

    UPROPERTY(EditDefaultsOnly, Category = "Classes")
    TSubclassOf<APlayerController> PlayerControllerClass;

    UPROPERTY(EditDefaultsOnly, Category = "Classes")
    TSubclassOf<APawn> DefaultPawnClass;

    UPROPERTY(EditDefaultsOnly, Category = "Classes")
    TSubclassOf<AMyGameState> GameStateClass;

    UPROPERTY(EditDefaultsOnly, Category = "Rules")
    int32 ScoreToWin;

    UPROPERTY(EditDefaultsOnly, Category = "Rules")
    float MatchTimeLimit;

protected:
    // 检查胜利条件
    void CheckWinCondition();

    FTimerHandle MatchTimerHandle;
};

// MyGameMode.cpp
AMyGameMode::AMyGameMode()
{
    // 设置默认类
    PlayerControllerClass = AMyPlayerController::StaticClass();
    DefaultPawnClass = AMyCharacter::StaticClass();
    GameStateClass = AMyGameState::StaticClass();

    // 游戏规则
    ScoreToWin = 10;
    MatchTimeLimit = 600.0f; // 10分钟

    // 允许无缝旅行
    bUseSeamlessTravel = true;
}

void AMyGameMode::StartPlay()
{
    Super::StartPlay();

    UE_LOG(LogTemp, Log, TEXT("Game Mode: StartPlay"));

    // 设置比赛计时器
    GetWorldTimerManager().SetTimer(
        MatchTimerHandle,
        [this]() { EndMatch(false); },
        MatchTimeLimit,
        false
    );
}

void AMyGameMode::PostLogin(APlayerController* NewPlayer)
{
    Super::PostLogin(NewPlayer);

    // 通知 GameState 玩家加入
    if (AMyGameState* GS = GetGameState<AMyGameState>())
    {
        GS->OnPlayerJoined(NewPlayer);
    }

    UE_LOG(LogTemp, Log, TEXT("Player Logged In: %s"), *NewPlayer->GetName());
}

void AMyGameMode::OnPlayerKilled(APlayerController* Killer, APlayerController* Victim)
{
    if (!Killer || !Victim) return;

    // 更新分数
    if (AMyPlayerState* KillerState = Killer->GetPlayerState<AMyPlayerState>())
    {
        KillerState->AddScore(1);

        // 检查胜利条件
        if (KillerState->GetScore() >= ScoreToWin)
        {
            EndMatch(true);
        }
    }

    // 安排重生
    FTimerHandle RespawnHandle;
    FTimerDelegate RespawnDelegate;
    RespawnDelegate.BindUFunction(this, FName("RestartPlayer"), Victim);
    GetWorldTimerManager().SetTimer(RespawnHandle, RespawnDelegate, 3.0f, false);
}

AActor* AMyGameMode::ChoosePlayerStart_Implementation(AController* Player)
{
    // 自定义出生点选择逻辑
    TArray<APlayerStart*> AllStarts;
    for (TActorIterator<APlayerStart> It(GetWorld()); It; ++It)
    {
        AllStarts.Add(*It);
    }

    if (AllStarts.Num() > 0)
    {
        // 选择距离其他玩家最远的出生点
        APlayerStart* BestStart = nullptr;
        float BestMinDistance = 0.0f;

        for (APlayerStart* Start : AllStarts)
        {
            float MinDistanceToPlayers = MAX_FLT;

            for (FConstPlayerControllerIterator It = GetWorld()->GetPlayerControllerIterator(); It; ++It)
            {
                if (APawn* Pawn = (*It)->GetPawn())
                {
                    float Distance = FVector::Dist(Start->GetActorLocation(), Pawn->GetActorLocation());
                    MinDistanceToPlayers = FMath::Min(MinDistanceToPlayers, Distance);
                }
            }

            if (MinDistanceToPlayers > BestMinDistance)
            {
                BestMinDistance = MinDistanceToPlayers;
                BestStart = Start;
            }
        }

        if (BestStart)
        {
            return BestStart;
        }
    }

    return Super::ChoosePlayerStart_Implementation(Player);
}
```

### GameState 详解

GameState 存储游戏状态，会复制到所有客户端：

```cpp
// MyGameState.h
UCLASS()
class MYGAME_API AMyGameState : public AGameStateBase
{
    GENERATED_BODY()

public:
    AMyGameState();

    // ============ 复制的游戏状态 ============

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Match")
    EMatchState CurrentMatchState;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Match")
    float MatchTimeRemaining;

    UPROPERTY(ReplicatedUsing = OnRep_WinningTeam, BlueprintReadOnly, Category = "Match")
    int32 WinningTeam;

    // ============ 方法 ============

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintCallable, Category = "Match")
    void SetMatchState(EMatchState NewState);

    UFUNCTION(BlueprintPure, Category = "Match")
    bool IsMatchInProgress() const;

    // 玩家管理
    void OnPlayerJoined(APlayerController* NewPlayer);
    void OnPlayerLeft(APlayerController* ExitingPlayer);

    UFUNCTION(BlueprintPure, Category = "Players")
    int32 GetNumPlayers() const;

    UFUNCTION(BlueprintCallable, Category = "Players")
    TArray<AMyPlayerState*> GetAllPlayerStates() const;

protected:
    UFUNCTION()
    void OnRep_WinningTeam();

    virtual void Tick(float DeltaSeconds) override;
};

// MyGameState.cpp
#include "Net/UnrealNetwork.h"

AMyGameState::AMyGameState()
{
    PrimaryActorTick.bCanEverTick = true;
    CurrentMatchState = EMatchState::WaitingToStart;
    MatchTimeRemaining = 0.0f;
    WinningTeam = -1;
}

void AMyGameState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // 定义复制规则
    DOREPLIFETIME(AMyGameState, CurrentMatchState);
    DOREPLIFETIME(AMyGameState, MatchTimeRemaining);
    DOREPLIFETIME(AMyGameState, WinningTeam);
}

void AMyGameState::OnRep_WinningTeam()
{
    // 在客户端上响应获胜团队变化
    if (WinningTeam >= 0)
    {
        // 显示获胜 UI
        if (APlayerController* LocalPC = GetWorld()->GetFirstPlayerController())
        {
            if (AMyPlayerController* MyPC = Cast<AMyPlayerController>(LocalPC))
            {
                MyPC->ShowMatchEndUI(WinningTeam);
            }
        }
    }
}

void AMyGameState::Tick(float DeltaSeconds)
{
    Super::Tick(DeltaSeconds);

    // 只在服务器更新时间
    if (HasAuthority() && CurrentMatchState == EMatchState::InProgress)
    {
        MatchTimeRemaining -= DeltaSeconds;
        if (MatchTimeRemaining <= 0.0f)
        {
            MatchTimeRemaining = 0.0f;
            // 通知 GameMode 时间到
            if (AMyGameMode* GM = GetWorld()->GetAuthGameMode<AMyGameMode>())
            {
                GM->OnMatchTimeExpired();
            }
        }
    }
}

TArray<AMyPlayerState*> AMyGameState::GetAllPlayerStates() const
{
    TArray<AMyPlayerState*> Result;

    for (APlayerState* PS : PlayerArray)
    {
        if (AMyPlayerState* MyPS = Cast<AMyPlayerState>(PS))
        {
            Result.Add(MyPS);
        }
    }

    return Result;
}
```

### PlayerState 详解

PlayerState 存储单个玩家的状态：

```cpp
// MyPlayerState.h
UCLASS()
class MYGAME_API AMyPlayerState : public APlayerState
{
    GENERATED_BODY()

public:
    AMyPlayerState();

    // ============ 复制属性 ============

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    int32 Kills;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    int32 Deaths;

    UPROPERTY(ReplicatedUsing = OnRep_TeamId, BlueprintReadOnly, Category = "Team")
    int32 TeamId;

    UPROPERTY(Replicated, BlueprintReadOnly, Category = "Stats")
    bool bIsReady;

    // ============ 方法 ============

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintCallable, Category = "Stats")
    void AddScore(int32 ScoreDelta);

    UFUNCTION(BlueprintCallable, Category = "Stats")
    void AddKill();

    UFUNCTION(BlueprintCallable, Category = "Stats")
    void AddDeath();

    UFUNCTION(BlueprintPure, Category = "Stats")
    float GetKDRatio() const;

    UFUNCTION(BlueprintCallable, Category = "Team")
    void SetTeamId(int32 NewTeamId);

    // 复制时序列化额外数据
    virtual void CopyProperties(APlayerState* PlayerState) override;

protected:
    UFUNCTION()
    void OnRep_TeamId();

    // 当分数改变时调用的委托
    DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnScoreChanged, AMyPlayerState*, PlayerState, int32, NewScore);

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnScoreChanged OnScoreChanged;
};

// MyPlayerState.cpp
AMyPlayerState::AMyPlayerState()
{
    Kills = 0;
    Deaths = 0;
    TeamId = -1;
    bIsReady = false;
}

void AMyPlayerState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(AMyPlayerState, Kills);
    DOREPLIFETIME(AMyPlayerState, Deaths);
    DOREPLIFETIME(AMyPlayerState, TeamId);
    DOREPLIFETIME(AMyPlayerState, bIsReady);
}

void AMyPlayerState::AddScore(int32 ScoreDelta)
{
    if (HasAuthority())
    {
        SetScore(GetScore() + ScoreDelta);
        OnScoreChanged.Broadcast(this, GetScore());
    }
}

float AMyPlayerState::GetKDRatio() const
{
    if (Deaths == 0)
    {
        return static_cast<float>(Kills);
    }
    return static_cast<float>(Kills) / static_cast<float>(Deaths);
}

void AMyPlayerState::OnRep_TeamId()
{
    // 更新玩家颜色或标识
    if (APawn* Pawn = GetPawn())
    {
        if (AMyCharacter* Character = Cast<AMyCharacter>(Pawn))
        {
            Character->UpdateTeamColors(TeamId);
        }
    }
}
```

## 网络复制

### 属性复制

```cpp
UCLASS()
class MYGAME_API AMyNetworkActor : public AActor
{
    GENERATED_BODY()

public:
    AMyNetworkActor();

    // ============ 基本复制 ============

    // 简单复制
    UPROPERTY(Replicated)
    float Health;

    // 带回调的复制
    UPROPERTY(ReplicatedUsing = OnRep_Armor)
    float Armor;

    UFUNCTION()
    void OnRep_Armor();

    // ============ 条件复制 ============

    // 仅复制到拥有者
    UPROPERTY(Replicated)
    int32 Ammo; // 配合 COND_OwnerOnly

    // 初始化后只复制一次
    UPROPERTY(Replicated)
    FString CharacterName; // 配合 COND_InitialOnly

    // 仅复制给模拟代理
    UPROPERTY(Replicated)
    FVector SimulatedVelocity; // 配合 COND_SimulatedOnly

    // ============ 复杂类型复制 ============

    UPROPERTY(Replicated)
    TArray<FInventoryItem> Inventory;

    // 必须声明 GetLifetimeReplicatedProps
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // 支持网络复制
    virtual bool IsSupportedForNetworking() const override { return true; }

protected:
    virtual void BeginPlay() override;
};

// 实现文件
#include "Net/UnrealNetwork.h"

AMyNetworkActor::AMyNetworkActor()
{
    // 启用复制
    bReplicates = true;

    // 设置网络更新频率
    NetUpdateFrequency = 100.0f;
    MinNetUpdateFrequency = 33.0f;

    // 设置网络优先级
    NetPriority = 3.0f;
}

void AMyNetworkActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // 始终复制
    DOREPLIFETIME(AMyNetworkActor, Health);
    DOREPLIFETIME(AMyNetworkActor, Armor);
    DOREPLIFETIME(AMyNetworkActor, Inventory);

    // 条件复制
    DOREPLIFETIME_CONDITION(AMyNetworkActor, Ammo, COND_OwnerOnly);
    DOREPLIFETIME_CONDITION(AMyNetworkActor, CharacterName, COND_InitialOnly);
    DOREPLIFETIME_CONDITION(AMyNetworkActor, SimulatedVelocity, COND_SimulatedOnly);
}

void AMyNetworkActor::OnRep_Armor()
{
    // 在客户端上处理护甲变化
    UE_LOG(LogTemp, Log, TEXT("Armor changed to: %f"), Armor);

    // 更新 UI
    UpdateArmorUI();
}
```

### RPC（远程过程调用）

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ============ Server RPC ============
    // 客户端调用，服务器执行

    // 可靠传输（保证送达）
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerFire(FVector TargetLocation);

    // 实现函数
    void ServerFire_Implementation(FVector TargetLocation);

    // 验证函数（防作弊）
    bool ServerFire_Validate(FVector TargetLocation);

    // 不可靠传输（可能丢失）
    UFUNCTION(Server, Unreliable)
    void ServerUpdateAimRotation(FRotator AimRotation);
    void ServerUpdateAimRotation_Implementation(FRotator AimRotation);

    // ============ Client RPC ============
    // 服务器调用，拥有客户端执行

    UFUNCTION(Client, Reliable)
    void ClientShowDamageIndicator(FVector DamageDirection, float DamageAmount);
    void ClientShowDamageIndicator_Implementation(FVector DamageDirection, float DamageAmount);

    UFUNCTION(Client, Reliable)
    void ClientPlayLocalSound(USoundBase* Sound);
    void ClientPlayLocalSound_Implementation(USoundBase* Sound);

    // ============ Multicast RPC ============
    // 服务器调用，所有客户端（包括服务器）执行

    UFUNCTION(NetMulticast, Reliable)
    void MulticastPlayDeathAnimation();
    void MulticastPlayDeathAnimation_Implementation();

    UFUNCTION(NetMulticast, Unreliable)
    void MulticastPlayHitEffect(FVector HitLocation, FVector HitNormal);
    void MulticastPlayHitEffect_Implementation(FVector HitLocation, FVector HitNormal);

protected:
    // 输入处理
    void OnFirePressed();

    // 伤害处理
    virtual float TakeDamage(
        float DamageAmount,
        FDamageEvent const& DamageEvent,
        AController* EventInstigator,
        AActor* DamageCauser
    ) override;
};

// 实现文件
void AMyCharacter::OnFirePressed()
{
    FVector TargetLocation = GetAimTargetLocation();

    // 检查是否是本地控制
    if (IsLocallyControlled())
    {
        // 本地预测（立即播放效果）
        PlayFireMontage();
        SpawnMuzzleFlash();

        // 发送到服务器
        if (!HasAuthority())
        {
            ServerFire(TargetLocation);
        }
        else
        {
            // 已经在服务器上，直接执行
            PerformFire(TargetLocation);
        }
    }
}

void AMyCharacter::ServerFire_Implementation(FVector TargetLocation)
{
    // 服务器端执行实际射击逻辑
    PerformFire(TargetLocation);

    // 多播效果到所有客户端
    MulticastPlayFireEffect(TargetLocation);
}

bool AMyCharacter::ServerFire_Validate(FVector TargetLocation)
{
    // 验证射击是否合法

    // 检查目标位置是否在合理范围内
    float Distance = FVector::Dist(GetActorLocation(), TargetLocation);
    if (Distance > MaxFireRange)
    {
        return false; // 可能是作弊
    }

    // 检查冷却时间
    if (GetWorld()->GetTimeSeconds() - LastFireTime < FireCooldown)
    {
        return false;
    }

    return true;
}

void AMyCharacter::ClientShowDamageIndicator_Implementation(FVector DamageDirection, float DamageAmount)
{
    // 仅在拥有客户端执行
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        if (AMyHUD* HUD = Cast<AMyHUD>(PC->GetHUD()))
        {
            HUD->ShowDamageIndicator(DamageDirection, DamageAmount);
        }
    }
}

void AMyCharacter::MulticastPlayHitEffect_Implementation(FVector HitLocation, FVector HitNormal)
{
    // 所有客户端播放命中效果
    if (HitParticle)
    {
        UGameplayStatics::SpawnEmitterAtLocation(
            GetWorld(),
            HitParticle,
            HitLocation,
            HitNormal.Rotation()
        );
    }

    if (HitSound)
    {
        UGameplayStatics::PlaySoundAtLocation(
            GetWorld(),
            HitSound,
            HitLocation
        );
    }
}
```

### 网络角色

```cpp
void AMyCharacter::HandleNetworkRole()
{
    // 获取网络角色
    ENetRole LocalRole = GetLocalRole();
    ENetRole RemoteRole = GetRemoteRole();

    switch (LocalRole)
    {
    case ROLE_Authority:
        // 服务器上的权威版本
        // 执行所有游戏逻辑
        UE_LOG(LogTemp, Log, TEXT("Authority"));
        break;

    case ROLE_AutonomousProxy:
        // 拥有此 Actor 的客户端
        // 可以进行本地预测
        UE_LOG(LogTemp, Log, TEXT("Autonomous Proxy (Local Player)"));
        break;

    case ROLE_SimulatedProxy:
        // 其他客户端上的模拟版本
        // 通过复制接收数据
        UE_LOG(LogTemp, Log, TEXT("Simulated Proxy (Remote Player)"));
        break;

    case ROLE_None:
        // 不参与网络
        UE_LOG(LogTemp, Log, TEXT("None"));
        break;
    }

    // 常用检查
    if (HasAuthority())
    {
        // 在服务器上
    }

    if (IsLocallyControlled())
    {
        // 本地控制的 Pawn
    }

    if (GetNetMode() == NM_Client)
    {
        // 在客户端
    }

    if (GetNetMode() == NM_DedicatedServer)
    {
        // 在专用服务器
    }

    if (GetNetMode() == NM_ListenServer)
    {
        // 在监听服务器
    }
}
```

## Unreal 容器类

### TArray

```cpp
void ArrayExamples()
{
    // 创建数组
    TArray<int32> Numbers;
    TArray<FString> Names;
    TArray<AActor*> Actors;

    // 添加元素
    Numbers.Add(1);
    Numbers.Add(2);
    Numbers.Emplace(3); // 直接构造，避免拷贝
    Numbers.AddUnique(1); // 仅在不存在时添加

    // 插入元素
    Numbers.Insert(0, 0); // 在索引0插入值0

    // 初始化
    TArray<int32> InitArray = {1, 2, 3, 4, 5};
    TArray<int32> SizedArray;
    SizedArray.SetNum(10); // 设置大小为10，元素初始化为0
    SizedArray.Init(42, 10); // 10个42

    // 访问元素
    int32 First = Numbers[0];
    int32 Last = Numbers.Last();
    int32 Top = Numbers.Top(); // 同 Last()

    // 安全访问
    if (Numbers.IsValidIndex(5))
    {
        int32 Value = Numbers[5];
    }

    // 查找
    int32 Index = Numbers.Find(2); // 返回索引或 INDEX_NONE
    int32* FoundPtr = Numbers.FindByKey(2); // 返回指针或 nullptr
    bool bContains = Numbers.Contains(2);

    // 条件查找
    int32* Found = Numbers.FindByPredicate([](int32 Num) { return Num > 5; });

    // 过滤
    TArray<int32> Filtered = Numbers.FilterByPredicate([](int32 Num) { return Num % 2 == 0; });

    // 删除
    Numbers.Remove(2); // 删除第一个匹配项
    Numbers.RemoveAt(0); // 删除指定索引
    Numbers.RemoveAll([](int32 Num) { return Num < 0; }); // 删除所有匹配项
    Numbers.RemoveSingle(3); // 删除单个匹配项
    Numbers.RemoveSwap(1); // 快速删除（不保持顺序）

    // 排序
    Numbers.Sort(); // 默认升序
    Numbers.Sort([](int32 A, int32 B) { return A > B; }); // 降序
    Numbers.StableSort(); // 稳定排序

    // 遍历
    for (int32 Num : Numbers)
    {
        UE_LOG(LogTemp, Log, TEXT("Number: %d"), Num);
    }

    for (int32 i = 0; i < Numbers.Num(); ++i)
    {
        UE_LOG(LogTemp, Log, TEXT("Numbers[%d] = %d"), i, Numbers[i]);
    }

    // 转换
    TArray<FString> NumberStrings;
    Algo::Transform(Numbers, NumberStrings, [](int32 Num) { return FString::FromInt(Num); });

    // 聚合
    int32 Sum = Algo::Accumulate(Numbers, 0);

    // 清空
    Numbers.Empty(); // 清空并释放内存
    Numbers.Reset(); // 清空但保留内存
}
```

### TMap

```cpp
void MapExamples()
{
    // 创建映射
    TMap<FString, int32> NameToScore;
    TMap<int32, AActor*> IdToActor;

    // 添加元素
    NameToScore.Add(TEXT("Alice"), 100);
    NameToScore.Add(TEXT("Bob"), 85);
    NameToScore.Emplace(TEXT("Charlie"), 90);

    // 使用 FindOrAdd
    int32& AliceScore = NameToScore.FindOrAdd(TEXT("Alice")); // 如果不存在则创建
    AliceScore += 10;

    // 访问元素
    int32* Score = NameToScore.Find(TEXT("Alice"));
    if (Score)
    {
        UE_LOG(LogTemp, Log, TEXT("Alice's Score: %d"), *Score);
    }

    // 使用 FindRef（返回值的副本）
    int32 BobScore = NameToScore.FindRef(TEXT("Bob")); // 不存在返回0

    // 检查存在
    bool bHasAlice = NameToScore.Contains(TEXT("Alice"));

    // 删除
    NameToScore.Remove(TEXT("Bob"));

    // 遍历
    for (const auto& Pair : NameToScore)
    {
        UE_LOG(LogTemp, Log, TEXT("%s: %d"), *Pair.Key, Pair.Value);
    }

    for (auto It = NameToScore.CreateIterator(); It; ++It)
    {
        UE_LOG(LogTemp, Log, TEXT("%s: %d"), *It.Key(), It.Value());
    }

    // 获取所有键或值
    TArray<FString> AllNames;
    TArray<int32> AllScores;
    NameToScore.GenerateKeyArray(AllNames);
    NameToScore.GenerateValueArray(AllScores);

    // 条件查找
    const FString* TopScorer = NameToScore.FindKey(100); // 通过值查找键

    // TMultiMap（允许重复键）
    TMultiMap<FString, FString> TagToValues;
    TagToValues.Add(TEXT("Color"), TEXT("Red"));
    TagToValues.Add(TEXT("Color"), TEXT("Blue"));

    TArray<FString> Colors;
    TagToValues.MultiFind(TEXT("Color"), Colors);
}
```

### TSet

```cpp
void SetExamples()
{
    // 创建集合
    TSet<int32> Numbers;
    TSet<FString> UniqueNames;

    // 添加元素
    Numbers.Add(1);
    Numbers.Add(2);
    Numbers.Add(1); // 重复，不会添加

    bool bWasAlreadyInSet;
    Numbers.Add(3, &bWasAlreadyInSet);

    // 批量添加
    Numbers.Append({4, 5, 6});

    // 检查存在
    bool bContains = Numbers.Contains(2);

    // 查找
    int32* Found = Numbers.Find(2);

    // 删除
    Numbers.Remove(1);

    // 集合运算
    TSet<int32> SetA = {1, 2, 3};
    TSet<int32> SetB = {2, 3, 4};

    TSet<int32> Union = SetA.Union(SetB); // {1, 2, 3, 4}
    TSet<int32> Intersection = SetA.Intersect(SetB); // {2, 3}
    TSet<int32> Difference = SetA.Difference(SetB); // {1}

    // 遍历
    for (int32 Num : Numbers)
    {
        UE_LOG(LogTemp, Log, TEXT("Number: %d"), Num);
    }

    // 转换为数组
    TArray<int32> NumberArray = Numbers.Array();
}
```

### 智能指针

```cpp
void SmartPointerExamples()
{
    // TSharedPtr - 共享所有权
    TSharedPtr<FMyStruct> Shared1 = MakeShared<FMyStruct>();
    TSharedPtr<FMyStruct> Shared2 = Shared1; // 引用计数 +1

    // 检查有效性
    if (Shared1.IsValid())
    {
        Shared1->DoSomething();
    }

    // TWeakPtr - 弱引用
    TWeakPtr<FMyStruct> Weak = Shared1;

    // 使用弱指针
    if (TSharedPtr<FMyStruct> Pinned = Weak.Pin())
    {
        Pinned->DoSomething();
    }

    // TUniquePtr - 独占所有权
    TUniquePtr<FMyStruct> Unique = MakeUnique<FMyStruct>();

    // 转移所有权
    TUniquePtr<FMyStruct> NewOwner = MoveTemp(Unique);
    // Unique 现在为空

    // TSharedRef - 非空共享引用
    TSharedRef<FMyStruct> SharedRef = MakeShared<FMyStruct>();
    // 总是有效，不需要检查
    SharedRef->DoSomething();

    // 从 SharedPtr 转换（需要检查）
    if (Shared1.IsValid())
    {
        TSharedRef<FMyStruct> RefFromPtr = Shared1.ToSharedRef();
    }

    // UObject 指针
    // 使用 TWeakObjectPtr
    TWeakObjectPtr<AActor> WeakActor = SomeActor;
    if (WeakActor.IsValid())
    {
        WeakActor->DoSomething();
    }

    // 使用 TStrongObjectPtr（阻止 GC）
    TStrongObjectPtr<UMyObject> StrongObj = TStrongObjectPtr<UMyObject>(NewObject<UMyObject>());

    // TSoftObjectPtr（软引用，延迟加载）
    TSoftObjectPtr<UTexture2D> SoftTexture;
    if (SoftTexture.IsValid())
    {
        UTexture2D* Texture = SoftTexture.Get();
    }
    else if (!SoftTexture.IsNull())
    {
        // 异步加载
        SoftTexture.LoadSynchronous();
    }
}
```

## 面试要点

### 核心概念题

**1. 解释 UObject 的作用和特点？**

UObject 是 Unreal Engine 所有托管对象的基类，提供以下核心功能：
- 反射：通过 UPROPERTY/UFUNCTION 宏暴露成员给编辑器和蓝图
- 垃圾回收：自动管理对象生命周期
- 序列化：支持保存/加载和资产管理
- 网络复制：支持多人游戏中的数据同步
- CDO（Class Default Object）：类的默认值模板

**2. UPROPERTY 的 Replicated 和 ReplicatedUsing 有什么区别？**

- `Replicated`：属性值从服务器复制到客户端，客户端被动接收更新
- `ReplicatedUsing=FunctionName`：除了复制属性值，还会在客户端值改变时调用指定的回调函数，常用于触发视觉效果或更新 UI

**3. 什么情况下使用 Server、Client、NetMulticast RPC？**

- `Server`：客户端请求服务器执行操作（如射击、使用技能），必须经过服务器验证
- `Client`：服务器向特定客户端发送消息（如显示伤害数字、播放本地音效）
- `NetMulticast`：服务器向所有客户端广播（如播放死亡动画、爆炸效果）

### 实践编码题

```cpp
// 实现一个简单的伤害系统
UCLASS()
class MYGAME_API UDamageComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UDamageComponent();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float MaxHealth;

    UPROPERTY(ReplicatedUsing = OnRep_CurrentHealth, BlueprintReadOnly, Category = "Health")
    float CurrentHealth;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChangedSignature OnHealthChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnDeathSignature OnDeath;

    UFUNCTION(BlueprintCallable, Category = "Damage")
    void ApplyDamage(float DamageAmount, AActor* DamageCauser, AController* InstigatorController);

    UFUNCTION(BlueprintCallable, Category = "Damage")
    void Heal(float HealAmount);

    UFUNCTION(BlueprintPure, Category = "Health")
    bool IsAlive() const { return CurrentHealth > 0.0f; }

    UFUNCTION(BlueprintPure, Category = "Health")
    float GetHealthPercent() const { return MaxHealth > 0 ? CurrentHealth / MaxHealth : 0.0f; }

protected:
    virtual void BeginPlay() override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION()
    void OnRep_CurrentHealth(float OldHealth);

private:
    bool bIsDead;
};

// 实现
UDamageComponent::UDamageComponent()
{
    SetIsReplicatedByDefault(true);
    MaxHealth = 100.0f;
    CurrentHealth = MaxHealth;
    bIsDead = false;
}

void UDamageComponent::BeginPlay()
{
    Super::BeginPlay();
    CurrentHealth = MaxHealth;
}

void UDamageComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UDamageComponent, CurrentHealth);
}

void UDamageComponent::ApplyDamage(float DamageAmount, AActor* DamageCauser, AController* InstigatorController)
{
    if (!GetOwner()->HasAuthority() || bIsDead || DamageAmount <= 0.0f)
    {
        return;
    }

    float OldHealth = CurrentHealth;
    CurrentHealth = FMath::Max(0.0f, CurrentHealth - DamageAmount);

    OnHealthChanged.Broadcast(OldHealth, CurrentHealth, DamageAmount);

    if (CurrentHealth <= 0.0f && !bIsDead)
    {
        bIsDead = true;
        OnDeath.Broadcast(DamageCauser, InstigatorController);
    }
}

void UDamageComponent::Heal(float HealAmount)
{
    if (!GetOwner()->HasAuthority() || bIsDead || HealAmount <= 0.0f)
    {
        return;
    }

    float OldHealth = CurrentHealth;
    CurrentHealth = FMath::Min(MaxHealth, CurrentHealth + HealAmount);

    if (CurrentHealth != OldHealth)
    {
        OnHealthChanged.Broadcast(OldHealth, CurrentHealth, -HealAmount);
    }
}

void UDamageComponent::OnRep_CurrentHealth(float OldHealth)
{
    OnHealthChanged.Broadcast(OldHealth, CurrentHealth, OldHealth - CurrentHealth);

    if (CurrentHealth <= 0.0f && !bIsDead)
    {
        bIsDead = true;
        OnDeath.Broadcast(nullptr, nullptr);
    }
}
```

### 性能优化技巧

1. **减少网络带宽**：使用条件复制（COND_OwnerOnly、COND_InitialOnly），降低 NetUpdateFrequency
2. **优化 Tick**：禁用不需要的 Actor Tick，使用定时器替代高频 Tick
3. **合理使用 UPROPERTY**：避免不必要的反射，减少编辑器开销
4. **对象池化**：复用频繁创建销毁的对象，减少 GC 压力
5. **使用 Deferred Spawn**：批量生成 Actor 时使用延迟生成
6. **软引用**：使用 TSoftObjectPtr 延迟加载资源

## 延伸阅读

### 官方资源

- [Unreal Engine 官方文档](https://docs.unrealengine.com/)
- [Unreal Engine C++ API 参考](https://docs.unrealengine.com/5.0/en-US/API/)
- [Unreal Engine 学习门户](https://dev.epicgames.com/community/learning)

### 进阶主题

- **Gameplay Ability System (GAS)**：Epic 官方的技能系统框架
- **Enhanced Input System**：新一代输入处理系统
- **Mass Entity System**：大规模实体处理框架
- **Chaos Physics**：物理模拟系统
- **Niagara**：高级粒子系统

### 推荐学习路径

1. **基础阶段**：掌握 UObject、Actor、Component 概念
2. **游戏框架**：理解 GameMode、GameState、PlayerController 关系
3. **网络编程**：学习属性复制和 RPC 机制
4. **高级特性**：探索 GAS、Animation、AI 系统

### 调试工具

- **Unreal Insights**：性能分析和追踪工具
- **Visual Logger**：可视化日志系统
- **Network Profiler**：网络性能分析
- **Memory Profiler**：内存使用分析
- **Console Commands**：stat net、stat game、stat memory 等

---

> 本文涵盖了 Unreal Engine C++ 开发的核心概念和实践要点。掌握 UObject 系统、反射机制和网络复制是成为专业 Unreal 开发者的关键。建议读者结合实际项目练习，逐步深入理解引擎的设计理念和最佳实践。
