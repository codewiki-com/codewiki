---
title: Unreal Engine C++ Game Programming
description: "Master Unreal Engine C++ development: UObject system, reflection, GC, and gameplay framework"
track: gamedev
section: unreal
difficulty: advanced
tags:
  - Unreal
  - C++
  - game programming
  - UObject
status: imported
origin: old/src/content/docs/gamedev/unreal-cpp.en.md
divergence: 0.207
issues: []
legacy:
  category: GameDev
  subcategory: Unreal
  order: 8
  lastUpdated: 2026-01-07
---

## Introduction

Unreal Engine C++ programming represents one of the most powerful approaches to game development, offering direct access to the engine's core systems while maintaining high performance. Unlike Blueprint visual scripting, C++ provides fine-grained control over memory management, optimization, and low-level engine functionality.

### Why Use C++ in Unreal Engine?

While Unreal Engine's Blueprint system enables rapid prototyping, C++ remains essential for:

- **Performance-Critical Systems**: AI, physics simulations, and real-time calculations
- **Engine Extensions**: Custom rendering features, editor tools, and plugins
- **Memory Control**: Precise allocation strategies and optimization
- **Complex Algorithms**: Data structures and algorithms that would be unwieldy in Blueprints
- **Team Scalability**: Better version control, code review, and modular architecture

Unreal's C++ is not standard C++. It extends the language with macros, reflection, and garbage collection, creating what Epic Games calls "Unreal C++." Understanding these extensions is crucial for effective development.

## The UObject System

The UObject system forms the foundation of Unreal Engine's architecture. Every gameplay class, asset, and serializable object inherits from `UObject`, providing a consistent interface for the engine's core features.

### UObject Hierarchy

```cpp
// Base class hierarchy
UObject                     // Base for all objects with reflection
    UActorComponent         // Component attached to Actors
        USceneComponent     // Component with transform
        UPrimitiveComponent // Component with rendering
    AActor                  // Base for all placeable objects
        APawn               // Actor that can be possessed
            ACharacter      // Pawn with movement
        APlayerController   // Controls a Pawn
        AGameModeBase       // Game rules and logic
    USubsystem              // Engine-managed singleton-like objects
```

### Creating a UObject Class

```cpp
// MyObject.h
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

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Data")
    FString ObjectName;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Stats")
    int32 ObjectID;

    UFUNCTION(BlueprintCallable, Category = "Actions")
    void Initialize(const FString& Name, int32 ID);

    UFUNCTION(BlueprintPure, Category = "Getters")
    FString GetDisplayName() const;

protected:
    virtual void BeginDestroy() override;
};
```

```cpp
// MyObject.cpp
#include "MyObject.h"

UMyObject::UMyObject()
    : ObjectName(TEXT("Unnamed"))
    , ObjectID(0)
{
}

void UMyObject::Initialize(const FString& Name, int32 ID)
{
    ObjectName = Name;
    ObjectID = ID;
}

FString UMyObject::GetDisplayName() const
{
    return FString::Printf(TEXT("%s (ID: %d)"), *ObjectName, ObjectID);
}

void UMyObject::BeginDestroy()
{
    // Cleanup before garbage collection
    UE_LOG(LogTemp, Log, TEXT("UMyObject %s is being destroyed"), *ObjectName);
    Super::BeginDestroy();
}
```

### UObject Creation Patterns

Unlike standard C++, UObjects should not be created with `new`. Instead, use factory functions:

```cpp
// Creating UObjects
void AMyActor::CreateObjects()
{
    // For non-Actor UObjects, use NewObject
    UMyObject* MyObj = NewObject<UMyObject>(this, UMyObject::StaticClass());
    MyObj->Initialize(TEXT("RuntimeObject"), 1);

    // With a specific name
    UMyObject* NamedObj = NewObject<UMyObject>(
        this,                           // Outer object (owner)
        UMyObject::StaticClass(),       // Class to create
        FName(TEXT("SpecificName"))     // Object name
    );

    // Creating Actors requires spawning
    FActorSpawnParameters SpawnParams;
    SpawnParams.Owner = this;
    SpawnParams.SpawnCollisionHandlingOverride =
        ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

    AMyEnemy* Enemy = GetWorld()->SpawnActor<AMyEnemy>(
        AMyEnemy::StaticClass(),
        SpawnLocation,
        SpawnRotation,
        SpawnParams
    );

    // Creating components
    UStaticMeshComponent* MeshComp = CreateDefaultSubobject<UStaticMeshComponent>(
        TEXT("MeshComponent")
    );
}
```

## UPROPERTY and UFUNCTION Macros

The property and function macros are the bridge between C++ and Unreal's reflection system, enabling serialization, Blueprint access, replication, and editor integration.

### UPROPERTY Specifiers

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Editable in editor, readable/writable in Blueprints
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat")
    float MaxHealth = 100.0f;

    // Only visible in editor, read-only in Blueprints
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Combat")
    float CurrentHealth;

    // Only editable on instances, not in class defaults
    UPROPERTY(EditInstanceOnly, BlueprintReadWrite, Category = "Setup")
    AActor* PatrolTarget;

    // Only editable in class defaults, not on instances
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Config")
    TSubclassOf<UDamageType> DefaultDamageType;

    // Replicated property for multiplayer
    UPROPERTY(ReplicatedUsing = OnRep_Health, BlueprintReadOnly, Category = "Combat")
    float ReplicatedHealth;

    // Transient - not saved to disk
    UPROPERTY(Transient)
    float TemporaryValue;

    // Config - loaded from ini files
    UPROPERTY(Config)
    int32 DefaultDifficulty;

    // Meta specifiers for enhanced editor behavior
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat",
              meta = (ClampMin = "0.0", ClampMax = "100.0", UIMin = "0.0", UIMax = "100.0"))
    float DamageMultiplier = 1.0f;

    // ExposeOnSpawn - available when spawning from Blueprints
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Setup",
              meta = (ExposeOnSpawn = "true"))
    FName SpawnedEnemyType;

protected:
    // Private to C++, exposed to Blueprints
    UPROPERTY(BlueprintReadOnly, Category = "Internal")
    int32 InternalCounter;

private:
    // Saved but not exposed anywhere
    UPROPERTY(SaveGame)
    FVector LastCheckpointLocation;

    UFUNCTION()
    void OnRep_Health();
};
```

### UFUNCTION Specifiers

```cpp
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Callable from Blueprints
    UFUNCTION(BlueprintCallable, Category = "Combat")
    void TakeDamage(float DamageAmount, AActor* DamageCauser);

    // Pure function (no side effects, no execution pin in Blueprints)
    UFUNCTION(BlueprintPure, Category = "Combat")
    bool IsAlive() const;

    // Implementable in Blueprints, called from C++
    UFUNCTION(BlueprintImplementableEvent, Category = "Events")
    void OnLevelUp(int32 NewLevel);

    // Has C++ implementation, can be overridden in Blueprints
    UFUNCTION(BlueprintNativeEvent, Category = "Events")
    void OnDeath();
    virtual void OnDeath_Implementation();

    // Server RPC - called on client, executed on server
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerFireWeapon(FVector_NetQuantize AimLocation);
    void ServerFireWeapon_Implementation(FVector_NetQuantize AimLocation);
    bool ServerFireWeapon_Validate(FVector_NetQuantize AimLocation);

    // Client RPC - called on server, executed on owning client
    UFUNCTION(Client, Reliable)
    void ClientShowDamageNumber(float Damage, FVector Location);
    void ClientShowDamageNumber_Implementation(float Damage, FVector Location);

    // Multicast RPC - called on server, executed on all clients
    UFUNCTION(NetMulticast, Unreliable)
    void MulticastPlayHitEffect(FVector HitLocation, FRotator HitRotation);
    void MulticastPlayHitEffect_Implementation(FVector HitLocation, FRotator HitRotation);

    // Exec function - callable from console
    UFUNCTION(Exec)
    void GodMode();

protected:
    // Blueprint callable with custom display name
    UFUNCTION(BlueprintCallable, Category = "Inventory",
              meta = (DisplayName = "Add Item to Inventory"))
    bool AddItem(TSubclassOf<UItem> ItemClass, int32 Quantity = 1);

    // Function with return value and output parameters
    UFUNCTION(BlueprintCallable, Category = "Combat")
    bool FindNearestEnemy(float SearchRadius, AActor*& OutEnemy, float& OutDistance);
};
```

### Implementation Examples

```cpp
// MyCharacter.cpp

void AMyCharacter::TakeDamage(float DamageAmount, AActor* DamageCauser)
{
    if (!IsAlive()) return;

    CurrentHealth = FMath::Max(0.0f, CurrentHealth - DamageAmount);

    if (CurrentHealth <= 0.0f)
    {
        OnDeath();
    }
}

bool AMyCharacter::IsAlive() const
{
    return CurrentHealth > 0.0f;
}

void AMyCharacter::OnDeath_Implementation()
{
    // Default C++ implementation
    DisableInput(Cast<APlayerController>(GetController()));
    GetMesh()->SetSimulatePhysics(true);
    GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
}

void AMyCharacter::ServerFireWeapon_Implementation(FVector_NetQuantize AimLocation)
{
    // Execute weapon firing logic on server
    if (CurrentWeapon)
    {
        CurrentWeapon->Fire(AimLocation);
        MulticastPlayHitEffect(AimLocation, FRotationMatrix::MakeFromX(
            AimLocation - GetActorLocation()).Rotator());
    }
}

bool AMyCharacter::ServerFireWeapon_Validate(FVector_NetQuantize AimLocation)
{
    // Validate the RPC to prevent cheating
    return CurrentWeapon != nullptr && !IsDead();
}

void AMyCharacter::ClientShowDamageNumber_Implementation(float Damage, FVector Location)
{
    // Show damage number widget on owning client only
    if (DamageNumberWidgetClass)
    {
        UDamageNumberWidget* Widget = CreateWidget<UDamageNumberWidget>(
            GetWorld()->GetFirstPlayerController(),
            DamageNumberWidgetClass
        );
        Widget->SetDamage(Damage);
        Widget->SetWorldLocation(Location);
        Widget->AddToViewport();
    }
}
```

## Reflection System

Unreal's reflection system (also called the property system) provides runtime type information, enabling serialization, garbage collection, network replication, and Blueprint integration.

### How Reflection Works

The Unreal Header Tool (UHT) parses header files during compilation, generating reflection data in `*.generated.h` files. This data includes:

- Class hierarchies and inheritance
- Property types, offsets, and metadata
- Function signatures and parameters
- Enum values and flags

```cpp
// Accessing reflection data at runtime
void ExamineClass(UClass* Class)
{
    UE_LOG(LogTemp, Log, TEXT("Class: %s"), *Class->GetName());
    UE_LOG(LogTemp, Log, TEXT("Parent: %s"),
           Class->GetSuperClass() ? *Class->GetSuperClass()->GetName() : TEXT("None"));

    // Iterate over properties
    for (TFieldIterator<FProperty> PropIt(Class); PropIt; ++PropIt)
    {
        FProperty* Property = *PropIt;
        UE_LOG(LogTemp, Log, TEXT("  Property: %s (%s)"),
               *Property->GetName(),
               *Property->GetCPPType());
    }

    // Iterate over functions
    for (TFieldIterator<UFunction> FuncIt(Class); FuncIt; ++FuncIt)
    {
        UFunction* Function = *FuncIt;
        UE_LOG(LogTemp, Log, TEXT("  Function: %s"), *Function->GetName());
    }
}
```

### Dynamic Property Access

```cpp
void DynamicPropertyAccess(UObject* Object)
{
    UClass* Class = Object->GetClass();

    // Find a property by name
    FProperty* HealthProp = Class->FindPropertyByName(FName(TEXT("CurrentHealth")));
    if (HealthProp)
    {
        // Get property value
        float* HealthPtr = HealthProp->ContainerPtrToValuePtr<float>(Object);
        float CurrentValue = *HealthPtr;

        // Set property value
        *HealthPtr = 100.0f;
    }

    // Find and call a function by name
    UFunction* Function = Class->FindFunctionByName(FName(TEXT("TakeDamage")));
    if (Function)
    {
        // Prepare parameters
        struct
        {
            float DamageAmount;
            AActor* DamageCauser;
        } Params;
        Params.DamageAmount = 50.0f;
        Params.DamageCauser = nullptr;

        Object->ProcessEvent(Function, &Params);
    }
}
```

### Custom USTRUCT

```cpp
// CustomTypes.h
#pragma once

#include "CoreMinimal.h"
#include "CustomTypes.generated.h"

UENUM(BlueprintType)
enum class EItemRarity : uint8
{
    Common      UMETA(DisplayName = "Common"),
    Uncommon    UMETA(DisplayName = "Uncommon"),
    Rare        UMETA(DisplayName = "Rare"),
    Epic        UMETA(DisplayName = "Epic"),
    Legendary   UMETA(DisplayName = "Legendary")
};

USTRUCT(BlueprintType)
struct FItemData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    FName ItemID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    FText DisplayName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    FText Description;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    UTexture2D* Icon;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    EItemRarity Rarity = EItemRarity::Common;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item",
              meta = (ClampMin = "1"))
    int32 MaxStackSize = 1;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Item")
    TSubclassOf<AActor> WorldActorClass;

    // Default constructor
    FItemData()
        : ItemID(NAME_None)
        , Icon(nullptr)
    {}

    // Custom constructor
    FItemData(FName InID, FText InName)
        : ItemID(InID)
        , DisplayName(InName)
        , Icon(nullptr)
    {}

    // Comparison operator for TArray/TMap
    bool operator==(const FItemData& Other) const
    {
        return ItemID == Other.ItemID;
    }
};

// Make FItemData hashable for TSet/TMap
FORCEINLINE uint32 GetTypeHash(const FItemData& Item)
{
    return GetTypeHash(Item.ItemID);
}
```

## Garbage Collection

Unreal Engine uses automatic garbage collection for UObjects, eliminating manual memory management for most gameplay code. Understanding how GC works is essential for preventing memory leaks and crashes.

### GC Fundamentals

The garbage collector uses a mark-and-sweep algorithm:
1. **Mark Phase**: Starting from root objects, marks all reachable objects
2. **Sweep Phase**: Destroys unmarked objects

Root objects include:
- Objects referenced by `UPROPERTY` members
- Objects in the root set (added via `AddToRoot()`)
- Objects referenced by global structures

### Preventing Garbage Collection

```cpp
UCLASS()
class MYGAME_API AItemManager : public AActor
{
    GENERATED_BODY()

public:
    // UPROPERTY keeps the object alive
    UPROPERTY()
    UMyObject* ManagedObject;

    // Raw pointers are NOT tracked by GC - dangerous!
    UMyObject* DangerousPointer; // Can become dangling!

    // TArray with UPROPERTY is safe
    UPROPERTY()
    TArray<UMyObject*> SafeArray;

    // TArray without UPROPERTY - objects can be collected!
    TArray<UMyObject*> UnsafeArray; // Dangerous!

    // TMap with UPROPERTY
    UPROPERTY()
    TMap<FName, UMyObject*> ObjectMap;

    void CreateObjects()
    {
        // Safe: stored in UPROPERTY
        ManagedObject = NewObject<UMyObject>(this);

        // Dangerous: not stored in UPROPERTY
        DangerousPointer = NewObject<UMyObject>(this);
        // DangerousPointer may become invalid after GC!

        // Alternative: add to root set (must manually remove!)
        UMyObject* RootedObject = NewObject<UMyObject>();
        RootedObject->AddToRoot();
        // Later: RootedObject->RemoveFromRoot();
    }
};
```

### Weak Pointers

For references that should not prevent garbage collection:

```cpp
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    // Weak pointer - does not prevent GC
    TWeakObjectPtr<AActor> WeakTarget;

    // Soft pointer - for assets, loads on demand
    UPROPERTY(EditAnywhere, Category = "Assets")
    TSoftObjectPtr<UTexture2D> LazyTexture;

    // Soft class pointer
    UPROPERTY(EditAnywhere, Category = "Assets")
    TSoftClassPtr<AActor> LazyActorClass;

    void UseWeakPointer()
    {
        WeakTarget = GetWorld()->GetFirstPlayerController()->GetPawn();

        // Always check validity before use
        if (WeakTarget.IsValid())
        {
            AActor* Target = WeakTarget.Get();
            // Use Target...
        }
    }

    void UseSoftPointer()
    {
        // Check if loaded
        if (LazyTexture.IsValid())
        {
            UTexture2D* Texture = LazyTexture.Get();
        }
        else if (!LazyTexture.IsNull())
        {
            // Synchronous load (blocking)
            UTexture2D* Texture = LazyTexture.LoadSynchronous();

            // Or async load
            FStreamableManager& Streamable = UAssetManager::GetStreamableManager();
            Streamable.RequestAsyncLoad(
                LazyTexture.ToSoftObjectPath(),
                FStreamableDelegate::CreateUObject(this, &AMyActor::OnTextureLoaded)
            );
        }
    }

    void OnTextureLoaded()
    {
        if (LazyTexture.IsValid())
        {
            UTexture2D* Texture = LazyTexture.Get();
            // Use loaded texture
        }
    }
};
```

### GC Clusters

For performance, related objects can be grouped into clusters that are collected together:

```cpp
UCLASS()
class MYGAME_API UInventoryItem : public UObject
{
    GENERATED_BODY()

public:
    virtual void AddReferencedObjects(UObject* InThis,
                                       FReferenceCollector& Collector) override
    {
        UInventoryItem* This = CastChecked<UInventoryItem>(InThis);

        // Add custom references for GC to track
        Collector.AddReferencedObject(This->CustomReferencedObject);

        Super::AddReferencedObjects(InThis, Collector);
    }

private:
    UObject* CustomReferencedObject;
};
```

## Actor Lifecycle

Understanding Actor lifecycle is crucial for proper initialization, cleanup, and avoiding common bugs.

### Lifecycle Phases

```cpp
UCLASS()
class MYGAME_API AMyActor : public AActor
{
    GENERATED_BODY()

public:
    AMyActor();

    // Components should be created here
    // Called before any other initialization
    // Only called when object is first created, not loaded from disk

protected:
    // Called when actor is registered with the world
    virtual void PostRegisterAllComponents() override;

    // Called when all components are registered
    // Actor is in the world but not yet started
    virtual void PostInitializeComponents() override;

    // Called when game starts or actor is spawned
    // Safe to access other actors
    virtual void BeginPlay() override;

    // Called every frame
    virtual void Tick(float DeltaTime) override;

    // Called when actor is being removed from world
    virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

    // Called when actor is destroyed
    virtual void Destroyed() override;

    // Called during garbage collection
    virtual void BeginDestroy() override;
};
```

### Implementation

```cpp
// MyActor.cpp

AMyActor::AMyActor()
{
    // Set default values
    PrimaryActorTick.bCanEverTick = true;
    PrimaryActorTick.bStartWithTickEnabled = true;

    // Create components (in constructor only!)
    RootComponent = CreateDefaultSubobject<USceneComponent>(TEXT("Root"));

    MeshComponent = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("Mesh"));
    MeshComponent->SetupAttachment(RootComponent);

    // DO NOT access world, game mode, or other actors here!
    // GetWorld() returns nullptr in constructor
}

void AMyActor::PostInitializeComponents()
{
    Super::PostInitializeComponents();

    // Components are initialized
    // Can modify component properties
    // Still no guarantee other actors exist

    UE_LOG(LogTemp, Log, TEXT("%s: PostInitializeComponents"), *GetName());
}

void AMyActor::BeginPlay()
{
    Super::BeginPlay();

    // Safe to access world and other actors
    // Initialize gameplay logic here

    AGameModeBase* GameMode = GetWorld()->GetAuthGameMode();
    APlayerController* PC = GetWorld()->GetFirstPlayerController();

    // Start timers, bind delegates, etc.
    GetWorld()->GetTimerManager().SetTimer(
        UpdateTimerHandle,
        this,
        &AMyActor::OnTimerUpdate,
        1.0f,
        true
    );

    UE_LOG(LogTemp, Log, TEXT("%s: BeginPlay"), *GetName());
}

void AMyActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Called every frame
    // DeltaTime is time since last frame
}

void AMyActor::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
    // Clean up timers, delegates, etc.
    GetWorld()->GetTimerManager().ClearTimer(UpdateTimerHandle);

    // Log reason for ending play
    switch (EndPlayReason)
    {
    case EEndPlayReason::Destroyed:
        UE_LOG(LogTemp, Log, TEXT("%s: Destroyed"), *GetName());
        break;
    case EEndPlayReason::LevelTransition:
        UE_LOG(LogTemp, Log, TEXT("%s: Level Transition"), *GetName());
        break;
    case EEndPlayReason::EndPlayInEditor:
        UE_LOG(LogTemp, Log, TEXT("%s: Editor Ended"), *GetName());
        break;
    case EEndPlayReason::RemovedFromWorld:
        UE_LOG(LogTemp, Log, TEXT("%s: Removed from World"), *GetName());
        break;
    case EEndPlayReason::Quit:
        UE_LOG(LogTemp, Log, TEXT("%s: Quit"), *GetName());
        break;
    }

    Super::EndPlay(EndPlayReason);
}

void AMyActor::Destroyed()
{
    UE_LOG(LogTemp, Log, TEXT("%s: Destroyed callback"), *GetName());
    Super::Destroyed();
}
```

### Spawning vs Placing

Actors can enter the world in different ways:

```cpp
void ASpawnerActor::SpawnExamples()
{
    // 1. Placed in editor - constructor, then PostInitializeComponents, then BeginPlay

    // 2. SpawnActor - constructor, then PostInitializeComponents, then BeginPlay
    FActorSpawnParameters Params;
    Params.SpawnCollisionHandlingOverride =
        ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

    AMyActor* SpawnedActor = GetWorld()->SpawnActor<AMyActor>(
        AMyActor::StaticClass(),
        SpawnLocation,
        SpawnRotation,
        Params
    );

    // 3. Deferred spawn - constructor, then manually finish
    AMyActor* DeferredActor = GetWorld()->SpawnActorDeferred<AMyActor>(
        AMyActor::StaticClass(),
        FTransform(SpawnRotation, SpawnLocation)
    );

    // Configure actor before BeginPlay
    DeferredActor->SetCustomProperty(SomeValue);

    // Finish spawning - calls PostInitializeComponents and BeginPlay
    DeferredActor->FinishSpawning(FTransform(SpawnRotation, SpawnLocation));
}
```

## GameMode and GameState

GameMode and GameState form the backbone of Unreal's gameplay framework, managing rules, state, and player interaction.

### GameMode

GameMode exists only on the server and controls game rules:

```cpp
// MyGameMode.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "MyGameMode.generated.h"

UCLASS()
class MYGAME_API AMyGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    AMyGameMode();

    // Called when a player joins
    virtual void PostLogin(APlayerController* NewPlayer) override;

    // Called when a player leaves
    virtual void Logout(AController* Exiting) override;

    // Called to spawn the player's pawn
    virtual APawn* SpawnDefaultPawnFor_Implementation(
        AController* NewPlayer, AActor* StartSpot) override;

    // Called to find a spawn point
    virtual AActor* FindPlayerStart_Implementation(
        AController* Player, const FString& IncomingName) override;

    // Called when a player dies
    virtual void HandlePlayerDeath(APlayerController* DeadPlayer);

    // Respawn logic
    UFUNCTION(BlueprintCallable, Category = "Game")
    void RespawnPlayer(APlayerController* Player);

    // Match state management
    UFUNCTION(BlueprintCallable, Category = "Game")
    void StartMatch();

    UFUNCTION(BlueprintCallable, Category = "Game")
    void EndMatch(bool bTeamOneWins);

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaSeconds) override;

    UPROPERTY(EditDefaultsOnly, Category = "Game")
    float RespawnDelay = 5.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Game")
    int32 ScoreToWin = 10;

private:
    TMap<APlayerController*, FTimerHandle> RespawnTimers;
};
```

```cpp
// MyGameMode.cpp
#include "MyGameMode.h"
#include "MyGameState.h"
#include "MyPlayerController.h"
#include "MyCharacter.h"

AMyGameMode::AMyGameMode()
{
    // Set default classes
    DefaultPawnClass = AMyCharacter::StaticClass();
    PlayerControllerClass = AMyPlayerController::StaticClass();
    GameStateClass = AMyGameState::StaticClass();

    // Enable ticking
    PrimaryActorTick.bCanEverTick = true;
}

void AMyGameMode::PostLogin(APlayerController* NewPlayer)
{
    Super::PostLogin(NewPlayer);

    // Player has joined
    UE_LOG(LogTemp, Log, TEXT("Player joined: %s"), *NewPlayer->GetName());

    // Update game state
    AMyGameState* GS = GetGameState<AMyGameState>();
    if (GS)
    {
        GS->AddPlayer(NewPlayer);
    }
}

void AMyGameMode::Logout(AController* Exiting)
{
    // Clean up respawn timer
    APlayerController* PC = Cast<APlayerController>(Exiting);
    if (PC && RespawnTimers.Contains(PC))
    {
        GetWorld()->GetTimerManager().ClearTimer(RespawnTimers[PC]);
        RespawnTimers.Remove(PC);
    }

    Super::Logout(Exiting);
}

void AMyGameMode::HandlePlayerDeath(APlayerController* DeadPlayer)
{
    // Start respawn timer
    FTimerHandle& TimerHandle = RespawnTimers.FindOrAdd(DeadPlayer);

    GetWorld()->GetTimerManager().SetTimer(
        TimerHandle,
        [this, DeadPlayer]()
        {
            RespawnPlayer(DeadPlayer);
        },
        RespawnDelay,
        false
    );

    // Notify game state
    AMyGameState* GS = GetGameState<AMyGameState>();
    if (GS)
    {
        GS->OnPlayerDied(DeadPlayer);
    }
}

void AMyGameMode::RespawnPlayer(APlayerController* Player)
{
    if (!Player) return;

    // Find spawn point
    AActor* StartSpot = FindPlayerStart(Player);

    // Spawn new pawn
    APawn* NewPawn = SpawnDefaultPawnFor(Player, StartSpot);

    // Possess the new pawn
    Player->Possess(NewPawn);

    // Clear respawn timer
    RespawnTimers.Remove(Player);
}
```

### GameState

GameState replicates game-wide data to all clients:

```cpp
// MyGameState.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "MyGameState.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnScoreChanged, int32, Team, int32, NewScore);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMatchStateChanged, FName, NewState);

UCLASS()
class MYGAME_API AMyGameState : public AGameStateBase
{
    GENERATED_BODY()

public:
    AMyGameState();

    // Replication setup
    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // Score management
    UFUNCTION(BlueprintCallable, Category = "Score")
    void AddScore(int32 Team, int32 Points);

    UFUNCTION(BlueprintPure, Category = "Score")
    int32 GetTeamScore(int32 Team) const;

    // Match state
    UFUNCTION(BlueprintPure, Category = "Match")
    FName GetMatchState() const { return MatchState; }

    void SetMatchState(FName NewState);

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnScoreChanged OnScoreChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnMatchStateChanged OnMatchStateChanged;

    // Player tracking
    void AddPlayer(APlayerController* Player);
    void OnPlayerDied(APlayerController* Player);

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Players")
    int32 TotalPlayers;

protected:
    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_TeamScores, Category = "Score")
    TArray<int32> TeamScores;

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_MatchState, Category = "Match")
    FName MatchState;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Match")
    float MatchStartTime;

    UFUNCTION()
    void OnRep_TeamScores();

    UFUNCTION()
    void OnRep_MatchState();
};
```

```cpp
// MyGameState.cpp
#include "MyGameState.h"
#include "Net/UnrealNetwork.h"

AMyGameState::AMyGameState()
{
    // Initialize two teams
    TeamScores.SetNum(2);
    TeamScores[0] = 0;
    TeamScores[1] = 0;

    MatchState = FName(TEXT("WaitingToStart"));
    TotalPlayers = 0;
}

void AMyGameState::GetLifetimeReplicatedProps(
    TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(AMyGameState, TeamScores);
    DOREPLIFETIME(AMyGameState, MatchState);
    DOREPLIFETIME(AMyGameState, MatchStartTime);
    DOREPLIFETIME(AMyGameState, TotalPlayers);
}

void AMyGameState::AddScore(int32 Team, int32 Points)
{
    if (Team >= 0 && Team < TeamScores.Num())
    {
        TeamScores[Team] += Points;
        OnRep_TeamScores(); // Call locally on server
    }
}

int32 AMyGameState::GetTeamScore(int32 Team) const
{
    if (Team >= 0 && Team < TeamScores.Num())
    {
        return TeamScores[Team];
    }
    return 0;
}

void AMyGameState::SetMatchState(FName NewState)
{
    if (MatchState != NewState)
    {
        MatchState = NewState;

        if (NewState == FName(TEXT("InProgress")))
        {
            MatchStartTime = GetWorld()->GetTimeSeconds();
        }

        OnRep_MatchState(); // Call locally on server
    }
}

void AMyGameState::OnRep_TeamScores()
{
    // Called on clients when TeamScores replicates
    // Also called manually on server
    for (int32 i = 0; i < TeamScores.Num(); ++i)
    {
        OnScoreChanged.Broadcast(i, TeamScores[i]);
    }
}

void AMyGameState::OnRep_MatchState()
{
    OnMatchStateChanged.Broadcast(MatchState);
}
```

### PlayerState

PlayerState holds per-player data that replicates:

```cpp
// MyPlayerState.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerState.h"
#include "MyPlayerState.generated.h"

UCLASS()
class MYGAME_API AMyPlayerState : public APlayerState
{
    GENERATED_BODY()

public:
    AMyPlayerState();

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION(BlueprintCallable, Category = "Stats")
    void AddKill();

    UFUNCTION(BlueprintCallable, Category = "Stats")
    void AddDeath();

    UFUNCTION(BlueprintPure, Category = "Stats")
    int32 GetKills() const { return Kills; }

    UFUNCTION(BlueprintPure, Category = "Stats")
    int32 GetDeaths() const { return Deaths; }

    UFUNCTION(BlueprintPure, Category = "Stats")
    float GetKDRatio() const;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Team")
    int32 TeamID;

protected:
    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Stats")
    int32 Kills;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Stats")
    int32 Deaths;
};
```

## Network Replication

Unreal Engine provides a robust networking system for multiplayer games, using a server-authoritative model.

### Replication Setup

```cpp
// ReplicatedActor.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "ReplicatedActor.generated.h"

UCLASS()
class MYGAME_API AReplicatedActor : public AActor
{
    GENERATED_BODY()

public:
    AReplicatedActor();

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // Conditional replication
    virtual void PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker) override;

protected:
    // Always replicated
    UPROPERTY(Replicated, BlueprintReadOnly, Category = "State")
    int32 AlwaysReplicatedValue;

    // Replicated with callback
    UPROPERTY(ReplicatedUsing = OnRep_Health, BlueprintReadOnly, Category = "State")
    float Health;

    // Conditionally replicated
    UPROPERTY(BlueprintReadOnly, Category = "State")
    float SecretValue;

    // Replicated movement
    UPROPERTY(ReplicatedUsing = OnRep_ReplicatedTransform)
    FTransform ReplicatedTransform;

    UFUNCTION()
    void OnRep_Health(float OldHealth);

    UFUNCTION()
    void OnRep_ReplicatedTransform();

    // Custom replication condition
    bool bShouldReplicateSecret;
};
```

```cpp
// ReplicatedActor.cpp
#include "ReplicatedActor.h"
#include "Net/UnrealNetwork.h"

AReplicatedActor::AReplicatedActor()
{
    // Enable replication
    bReplicates = true;
    bAlwaysRelevant = false;
    NetUpdateFrequency = 10.0f; // Updates per second
    MinNetUpdateFrequency = 2.0f;
    NetPriority = 1.0f;

    // For movement replication
    SetReplicateMovement(true);
}

void AReplicatedActor::GetLifetimeReplicatedProps(
    TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // Simple replication
    DOREPLIFETIME(AReplicatedActor, AlwaysReplicatedValue);

    // Replicated with callback (notifies when value changes)
    DOREPLIFETIME(AReplicatedActor, Health);

    // Conditional replication
    DOREPLIFETIME_CONDITION(AReplicatedActor, SecretValue, COND_Custom);

    // Only replicate to owner
    DOREPLIFETIME_CONDITION(AReplicatedActor, ReplicatedTransform, COND_OwnerOnly);
}

void AReplicatedActor::PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker)
{
    Super::PreReplication(ChangedPropertyTracker);

    // Control custom replication conditions
    DOREPLIFETIME_ACTIVE_OVERRIDE(AReplicatedActor, SecretValue, bShouldReplicateSecret);
}

void AReplicatedActor::OnRep_Health(float OldHealth)
{
    // Called on clients when Health replicates
    float Damage = OldHealth - Health;
    if (Damage > 0)
    {
        // Show damage effect
        PlayHitEffect();
    }
    else if (Damage < 0)
    {
        // Show heal effect
        PlayHealEffect();
    }
}

void AReplicatedActor::OnRep_ReplicatedTransform()
{
    // Smooth movement on clients
    SetActorTransform(ReplicatedTransform);
}
```

### Remote Procedure Calls (RPCs)

```cpp
// NetworkedCharacter.h
UCLASS()
class MYGAME_API ANetworkedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Server RPC - Client calls, Server executes
    // Reliable: guaranteed delivery (use sparingly)
    // WithValidation: requires validation function
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerUseAbility(int32 AbilityIndex);

    // Unreliable Server RPC - for frequent, non-critical updates
    UFUNCTION(Server, Unreliable)
    void ServerUpdateAimRotation(FRotator AimRotation);

    // Client RPC - Server calls, specific Client executes
    UFUNCTION(Client, Reliable)
    void ClientReceiveMessage(const FString& Message);

    // Multicast RPC - Server calls, all Clients execute
    UFUNCTION(NetMulticast, Reliable)
    void MulticastPlayAbilityEffect(int32 AbilityIndex);

    // Unreliable Multicast - for cosmetic effects
    UFUNCTION(NetMulticast, Unreliable)
    void MulticastPlayFootstep(FVector Location);

protected:
    // Use ability on owning client (input handler)
    void UseAbility(int32 AbilityIndex);
};
```

```cpp
// NetworkedCharacter.cpp
void ANetworkedCharacter::UseAbility(int32 AbilityIndex)
{
    // Called on owning client from input
    if (IsLocallyControlled())
    {
        // Immediately show prediction locally
        PlayAbilityAnimation(AbilityIndex);

        // Send to server
        ServerUseAbility(AbilityIndex);
    }
}

void ANetworkedCharacter::ServerUseAbility_Implementation(int32 AbilityIndex)
{
    // Executes on server
    // Validate and apply ability
    if (CanUseAbility(AbilityIndex))
    {
        ApplyAbilityEffects(AbilityIndex);

        // Notify all clients
        MulticastPlayAbilityEffect(AbilityIndex);
    }
}

bool ANetworkedCharacter::ServerUseAbility_Validate(int32 AbilityIndex)
{
    // Validation to prevent cheating
    // Return false to disconnect the client
    return AbilityIndex >= 0 && AbilityIndex < MaxAbilities;
}

void ANetworkedCharacter::ClientReceiveMessage_Implementation(const FString& Message)
{
    // Executes on owning client only
    ShowMessageUI(Message);
}

void ANetworkedCharacter::MulticastPlayAbilityEffect_Implementation(int32 AbilityIndex)
{
    // Executes on all clients (and server)
    // Skip on owning client if already predicted
    if (!IsLocallyControlled())
    {
        PlayAbilityAnimation(AbilityIndex);
    }
    PlayAbilitySound(AbilityIndex);
    SpawnAbilityParticles(AbilityIndex);
}
```

### Network Role Checking

```cpp
void ANetworkedActor::ExampleNetworkChecks()
{
    // Check authority
    if (HasAuthority())
    {
        // This machine has authority over this actor
        // Usually means we're the server (for non-player-controlled actors)
    }

    // Check role
    ENetRole Role = GetLocalRole();
    switch (Role)
    {
    case ROLE_Authority:
        // We have full control (server)
        break;
    case ROLE_AutonomousProxy:
        // Locally controlled, replicated from server (client's own pawn)
        break;
    case ROLE_SimulatedProxy:
        // Replicated from server, not locally controlled (other players)
        break;
    case ROLE_None:
        // Not replicated
        break;
    }

    // For characters/pawns
    if (ACharacter* Char = Cast<ACharacter>(this))
    {
        if (Char->IsLocallyControlled())
        {
            // This is our local player's character
        }
    }

    // Check if we're server or client
    UWorld* World = GetWorld();
    if (World)
    {
        if (World->IsServer())
        {
            // Running on server (includes listen server)
        }
        if (World->GetNetMode() == NM_Client)
        {
            // Pure client
        }
        if (World->GetNetMode() == NM_ListenServer)
        {
            // Listen server (server + client)
        }
        if (World->GetNetMode() == NM_DedicatedServer)
        {
            // Dedicated server only
        }
    }
}
```

## Component Architecture

Components are modular pieces of functionality attached to Actors.

### Creating Custom Components

```cpp
// HealthComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "HealthComponent.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_FourParams(
    FOnHealthChanged,
    UHealthComponent*, HealthComponent,
    float, Health,
    float, Damage,
    AActor*, DamageCauser
);

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDeath, AActor*, KilledBy);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UHealthComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UHealthComponent();

    virtual void GetLifetimeReplicatedProps(
        TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // Apply damage
    UFUNCTION(BlueprintCallable, Category = "Health")
    void ApplyDamage(float Damage, AActor* DamageCauser = nullptr);

    // Heal
    UFUNCTION(BlueprintCallable, Category = "Health")
    void Heal(float Amount);

    // Getters
    UFUNCTION(BlueprintPure, Category = "Health")
    float GetHealth() const { return Health; }

    UFUNCTION(BlueprintPure, Category = "Health")
    float GetMaxHealth() const { return MaxHealth; }

    UFUNCTION(BlueprintPure, Category = "Health")
    float GetHealthPercent() const { return Health / MaxHealth; }

    UFUNCTION(BlueprintPure, Category = "Health")
    bool IsDead() const { return Health <= 0.0f; }

    // Events
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnHealthChanged OnHealthChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnDeath OnDeath;

protected:
    virtual void BeginPlay() override;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Health")
    float MaxHealth = 100.0f;

    UPROPERTY(ReplicatedUsing = OnRep_Health, BlueprintReadOnly, Category = "Health")
    float Health;

    UPROPERTY(EditDefaultsOnly, Category = "Health")
    bool bInvulnerable = false;

    UFUNCTION()
    void OnRep_Health(float OldHealth);
};
```

```cpp
// HealthComponent.cpp
#include "HealthComponent.h"
#include "Net/UnrealNetwork.h"

UHealthComponent::UHealthComponent()
{
    SetIsReplicatedByDefault(true);
}

void UHealthComponent::GetLifetimeReplicatedProps(
    TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UHealthComponent, Health);
}

void UHealthComponent::BeginPlay()
{
    Super::BeginPlay();
    Health = MaxHealth;
}

void UHealthComponent::ApplyDamage(float Damage, AActor* DamageCauser)
{
    if (bInvulnerable || IsDead() || Damage <= 0.0f) return;

    // Only server modifies health
    if (!GetOwner()->HasAuthority()) return;

    float OldHealth = Health;
    Health = FMath::Clamp(Health - Damage, 0.0f, MaxHealth);

    // Broadcast change (server-side, clients get via replication)
    OnHealthChanged.Broadcast(this, Health, Damage, DamageCauser);

    if (Health <= 0.0f)
    {
        OnDeath.Broadcast(DamageCauser);
    }
}

void UHealthComponent::Heal(float Amount)
{
    if (IsDead() || Amount <= 0.0f) return;
    if (!GetOwner()->HasAuthority()) return;

    float OldHealth = Health;
    Health = FMath::Clamp(Health + Amount, 0.0f, MaxHealth);

    OnHealthChanged.Broadcast(this, Health, -(Amount), nullptr);
}

void UHealthComponent::OnRep_Health(float OldHealth)
{
    float Damage = OldHealth - Health;
    OnHealthChanged.Broadcast(this, Health, Damage, nullptr);

    if (Health <= 0.0f && OldHealth > 0.0f)
    {
        OnDeath.Broadcast(nullptr);
    }
}
```

### Using Components

```cpp
// Character using the health component
UCLASS()
class MYGAME_API AMyGameCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    AMyGameCharacter();

protected:
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    UHealthComponent* HealthComponent;

    virtual void BeginPlay() override;

    UFUNCTION()
    void HandleDeath(AActor* KilledBy);
};

// Implementation
AMyGameCharacter::AMyGameCharacter()
{
    HealthComponent = CreateDefaultSubobject<UHealthComponent>(TEXT("HealthComponent"));
}

void AMyGameCharacter::BeginPlay()
{
    Super::BeginPlay();

    // Bind to death event
    if (HealthComponent)
    {
        HealthComponent->OnDeath.AddDynamic(this, &AMyGameCharacter::HandleDeath);
    }
}

void AMyGameCharacter::HandleDeath(AActor* KilledBy)
{
    // Handle death
    DisableInput(Cast<APlayerController>(GetController()));
    GetMesh()->SetSimulatePhysics(true);

    // Notify game mode
    if (AMyGameMode* GM = GetWorld()->GetAuthGameMode<AMyGameMode>())
    {
        GM->HandlePlayerDeath(Cast<APlayerController>(GetController()));
    }
}
```

## Delegates and Events

Delegates are type-safe function pointers that enable event-driven programming.

### Delegate Types

```cpp
// DelegateExamples.h
#pragma once

#include "CoreMinimal.h"
#include "DelegateExamples.generated.h"

// Single-cast delegate (one binding)
DECLARE_DELEGATE(FSimpleDelegate);
DECLARE_DELEGATE_OneParam(FOnValueChanged, int32);
DECLARE_DELEGATE_RetVal(bool, FValidationDelegate);
DECLARE_DELEGATE_RetVal_TwoParams(float, FCalculationDelegate, float, float);

// Multi-cast delegate (multiple bindings, no return value)
DECLARE_MULTICAST_DELEGATE(FSimpleMulticastDelegate);
DECLARE_MULTICAST_DELEGATE_TwoParams(FOnActorEvent, AActor*, FVector);

// Dynamic delegates (can be used with Blueprints)
DECLARE_DYNAMIC_DELEGATE(FDynamicSimpleDelegate);
DECLARE_DYNAMIC_DELEGATE_OneParam(FDynamicOnValueChanged, int32, NewValue);

// Dynamic multicast (Blueprint assignable events)
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FDynamicSimpleEvent);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDamageReceived, float, Damage, AActor*, Instigator);

UCLASS()
class MYGAME_API ADelegateExample : public AActor
{
    GENERATED_BODY()

public:
    // Single-cast delegates
    FSimpleDelegate OnSimpleEvent;
    FOnValueChanged OnValueChanged;

    // Multi-cast delegates
    FSimpleMulticastDelegate OnMulticastEvent;
    FOnActorEvent OnActorEvent;

    // Dynamic multicast (Blueprint compatible)
    UPROPERTY(BlueprintAssignable, Category = "Events")
    FDynamicSimpleEvent OnBlueprintEvent;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnDamageReceived OnDamageReceived;

    // Methods
    void DemonstrateBindings();
    void TriggerEvents();

private:
    void HandleSimpleEvent();
    void HandleValueChanged(int32 NewValue);
    void HandleActorEvent(AActor* Actor, FVector Location);
};
```

```cpp
// DelegateExamples.cpp
#include "DelegateExamples.h"

void ADelegateExample::DemonstrateBindings()
{
    // Bind to member function
    OnSimpleEvent.BindUObject(this, &ADelegateExample::HandleSimpleEvent);

    // Bind with parameters
    OnValueChanged.BindUObject(this, &ADelegateExample::HandleValueChanged);

    // Bind lambda
    OnSimpleEvent.BindLambda([]()
    {
        UE_LOG(LogTemp, Log, TEXT("Lambda executed"));
    });

    // Bind static function
    OnSimpleEvent.BindStatic(&ADelegateExample::StaticHandler);

    // Bind weak lambda (captures weak reference)
    TWeakObjectPtr<ADelegateExample> WeakThis(this);
    OnSimpleEvent.BindWeakLambda(this, [WeakThis]()
    {
        if (WeakThis.IsValid())
        {
            // Safe to use WeakThis
        }
    });

    // Multi-cast binding
    OnMulticastEvent.AddUObject(this, &ADelegateExample::HandleSimpleEvent);
    OnActorEvent.AddUObject(this, &ADelegateExample::HandleActorEvent);

    // Multi-cast with handle for removal
    FDelegateHandle Handle = OnMulticastEvent.AddLambda([]()
    {
        UE_LOG(LogTemp, Log, TEXT("Multicast lambda"));
    });

    // Remove specific binding
    OnMulticastEvent.Remove(Handle);

    // Remove all bindings from an object
    OnMulticastEvent.RemoveAll(this);

    // Dynamic delegate (for Blueprints)
    // Usually bound in Blueprints, but can bind in C++:
    FScriptDelegate ScriptDelegate;
    ScriptDelegate.BindUFunction(this, FName("HandleDynamicEvent"));
    OnBlueprintEvent.Add(ScriptDelegate);
}

void ADelegateExample::TriggerEvents()
{
    // Execute single-cast
    if (OnSimpleEvent.IsBound())
    {
        OnSimpleEvent.Execute();
    }

    // Execute or ignore if unbound
    OnValueChanged.ExecuteIfBound(42);

    // Broadcast multi-cast
    OnMulticastEvent.Broadcast();
    OnActorEvent.Broadcast(this, GetActorLocation());

    // Broadcast dynamic multicast
    OnBlueprintEvent.Broadcast();
    OnDamageReceived.Broadcast(50.0f, nullptr);
}

void ADelegateExample::HandleSimpleEvent()
{
    UE_LOG(LogTemp, Log, TEXT("Simple event handled"));
}

void ADelegateExample::HandleValueChanged(int32 NewValue)
{
    UE_LOG(LogTemp, Log, TEXT("Value changed to: %d"), NewValue);
}

void ADelegateExample::HandleActorEvent(AActor* Actor, FVector Location)
{
    UE_LOG(LogTemp, Log, TEXT("Actor event: %s at %s"),
           Actor ? *Actor->GetName() : TEXT("null"),
           *Location.ToString());
}
```

## Best Practices

### Memory Management

```cpp
// Good practices for memory management
class FMemoryBestPractices
{
public:
    // Use UPROPERTY for UObject references
    UPROPERTY()
    UMyObject* SafeReference;

    // Use TWeakObjectPtr for non-owning references
    TWeakObjectPtr<AActor> WeakReference;

    // Use TSharedPtr for non-UObject classes
    TSharedPtr<FMyData> SharedData;

    // Use TUniquePtr for exclusive ownership
    TUniquePtr<FMyResource> UniqueResource;

    // Avoid raw pointers to UObjects
    // UMyObject* DangerousReference; // DON'T DO THIS

    void ProperCreation()
    {
        // NewObject for UObjects
        SafeReference = NewObject<UMyObject>(GetTransientPackage());

        // MakeShared for shared pointers
        SharedData = MakeShared<FMyData>();

        // MakeUnique for unique pointers
        UniqueResource = MakeUnique<FMyResource>();
    }
};
```

### Performance Optimization

```cpp
// Performance best practices
UCLASS()
class MYGAME_API AOptimizedActor : public AActor
{
    GENERATED_BODY()

public:
    AOptimizedActor()
    {
        // Disable tick if not needed
        PrimaryActorTick.bCanEverTick = false;

        // Or use reduced tick rate
        // PrimaryActorTick.TickInterval = 0.1f; // Every 100ms
    }

    // Cache frequently accessed components
    virtual void BeginPlay() override
    {
        Super::BeginPlay();
        CachedMesh = FindComponentByClass<UStaticMeshComponent>();
    }

    // Use const reference for large structs
    void ProcessData(const FLargeStruct& Data) {}

    // Avoid FindComponentByClass in Tick
    virtual void Tick(float DeltaTime) override
    {
        // BAD: Finding component every frame
        // UStaticMeshComponent* Mesh = FindComponentByClass<UStaticMeshComponent>();

        // GOOD: Use cached reference
        if (CachedMesh)
        {
            // Use CachedMesh
        }
    }

    // Use async operations for heavy work
    void HeavyOperation()
    {
        AsyncTask(ENamedThreads::AnyBackgroundThreadNormalTask, [this]()
        {
            // Heavy computation here

            // Return to game thread for UObject operations
            AsyncTask(ENamedThreads::GameThread, [this]()
            {
                // Update UObject state here
            });
        });
    }

private:
    UPROPERTY()
    UStaticMeshComponent* CachedMesh;
};
```

### Code Organization

```cpp
// Header organization
#pragma once

// Engine includes first
#include "CoreMinimal.h"
#include "GameFramework/Character.h"

// Project includes
#include "Types/GameTypes.h"
#include "Interfaces/Damageable.h"

// Generated header last
#include "MyCharacter.generated.h"

// Forward declarations to reduce compile times
class UHealthComponent;
class UInventoryComponent;

// Class declaration
UCLASS()
class MYGAME_API AMyCharacter : public ACharacter, public IDamageable
{
    GENERATED_BODY()

public:
    // Constructor
    AMyCharacter();

    // AActor interface
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;

    // IDamageable interface
    virtual void ReceiveDamage(float Damage) override;

    // Public methods
    UFUNCTION(BlueprintCallable, Category = "Actions")
    void PerformAction();

protected:
    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Components")
    UHealthComponent* HealthComponent;

    // Properties
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Config")
    float MoveSpeed = 600.0f;

    // Protected methods
    virtual void HandleDeath();

private:
    // Private members
    bool bIsDead = false;

    // Private methods
    void UpdateInternals();
};
```

## Interview Topics

### Common Interview Questions

1. **What is the difference between UObject and AActor?**
   - UObject is the base class for all objects with reflection support
   - AActor adds world placement, component support, and lifecycle management
   - Actors can be spawned into levels; UObjects cannot

2. **How does Unreal's garbage collection work?**
   - Mark-and-sweep algorithm
   - Traces from root objects through UPROPERTY references
   - Objects not reachable are marked for deletion
   - Incremental collection to avoid hitches

3. **Explain UFUNCTION specifiers for networking.**
   - Server: Client calls, server executes
   - Client: Server calls, owning client executes
   - NetMulticast: Server calls, all clients execute
   - Reliable vs Unreliable: Guaranteed delivery vs best-effort

4. **What is the reflection system used for?**
   - Serialization (saving/loading)
   - Garbage collection (reference tracking)
   - Blueprint integration
   - Network replication
   - Editor property display

5. **How do you prevent an object from being garbage collected?**
   - Store in UPROPERTY member
   - AddToRoot() (must manually remove)
   - Reference from another rooted object
   - Store in TArray/TMap with UPROPERTY

### Code Challenge Examples

```cpp
// Challenge: Implement a simple ability system component
UCLASS()
class UAbilityComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable)
    bool TryActivateAbility(int32 AbilityIndex);

    UFUNCTION(Server, Reliable)
    void ServerActivateAbility(int32 AbilityIndex);

protected:
    UPROPERTY(EditAnywhere)
    TArray<TSubclassOf<UAbility>> Abilities;

    UPROPERTY(Replicated)
    TArray<float> Cooldowns;
};

// Challenge: Implement object pooling for projectiles
UCLASS()
class UProjectilePool : public UObject
{
    GENERATED_BODY()

public:
    AProjectile* GetProjectile();
    void ReturnProjectile(AProjectile* Projectile);

private:
    UPROPERTY()
    TArray<AProjectile*> AvailableProjectiles;

    UPROPERTY()
    TArray<AProjectile*> ActiveProjectiles;
};
```

## Further Reading

### Official Resources

- [Unreal Engine Documentation](https://docs.unrealengine.com/)
- [Unreal Engine C++ API Reference](https://docs.unrealengine.com/en-US/API/)
- [Unreal Engine Blog](https://www.unrealengine.com/blog)

### Learning Path

1. **Fundamentals**: UObject system, macros, reflection
2. **Gameplay Framework**: GameMode, GameState, PlayerController
3. **Networking**: Replication, RPCs, prediction
4. **Advanced**: Engine modification, Slate UI, custom modules

### Related Technologies

- **Blueprints**: Visual scripting, C++ integration
- **Slate**: Unreal's UI framework
- **Gameplay Ability System**: Epic's ability framework
- **Enhanced Input System**: Modern input handling
- **Mass Entity**: Large-scale entity simulation

### Community Resources

- [Unreal Engine Forums](https://forums.unrealengine.com/)
- [Unreal Slackers Discord](https://unrealslackers.org/)
- [Ben UI's Tutorials](https://benui.ca/)
- [Tom Looman's Blog](https://www.tomlooman.com/)

---

Mastering Unreal Engine C++ development requires understanding the unique extensions Epic Games has built on top of standard C++. The UObject system, reflection macros, and garbage collection form the foundation for all gameplay programming. By following the patterns and practices outlined in this guide, you will be equipped to build performant, maintainable, and scalable game systems. Continue exploring the official documentation and community resources to deepen your understanding of this powerful game development platform.
