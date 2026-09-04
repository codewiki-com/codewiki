---
title: Unreal Engine Blueprints Visual Scripting
description: "Master Unreal Engine Blueprint system: visual programming, event-driven design, and game logic"
track: gamedev
section: unreal
difficulty: beginner
tags:
  - Unreal
  - Blueprints
  - visual scripting
  - game logic
status: imported
origin: old/src/content/docs/gamedev/unreal-blueprints.en.md
divergence: 0.268
issues: []
legacy:
  category: GameDev
  subcategory: Unreal
  order: 7
  lastUpdated: 2026-01-07
---

Unreal Engine Blueprints is a powerful visual scripting system that enables developers to create game logic without writing traditional code. We cover everything from basic concepts to advanced techniques, including Blueprint-C++ integration.

## What Are Blueprints?

Blueprints are Unreal Engine's node-based visual scripting system. They allow you to create gameplay elements, define behaviors, and build interactive systems by connecting nodes in a graph editor rather than writing text-based code.

### Key Advantages

1. **Visual Approach**: See the flow of your logic as connected nodes
2. **Rapid Prototyping**: Quickly iterate on ideas without compilation wait times
3. **Designer-Friendly**: Accessible to non-programmers on the team
4. **Full Engine Access**: Nearly everything possible in C++ is available in Blueprints
5. **Debugging**: Visual debugging with breakpoints and execution flow visualization

### Blueprint Types

Unreal Engine provides several types of Blueprints for different purposes:

| Blueprint Type | Purpose |
|----------------|---------|
| **Blueprint Class** | Most common type for creating interactive objects |
| **Level Blueprint** | Scripts specific to a single level |
| **Blueprint Interface** | Defines shared function signatures across Blueprints |
| **Blueprint Macro Library** | Reusable macro collections |
| **Blueprint Function Library** | Static utility functions |
| **Animation Blueprint** | Controls character animation state machines |
| **Widget Blueprint** | Creates UI elements |

## Blueprint Editor Overview

The Blueprint Editor is your workspace for creating and editing Blueprints. Understanding its components is essential for productive development.

### Main Panels

```
+------------------------------------------+
|  Toolbar                                 |
+----------+-------------------+-----------+
|          |                   |           |
|Components|    Graph Editor   |  Details  |
|  Panel   |                   |   Panel   |
|          |                   |           |
+----------+-------------------+-----------+
|         My Blueprint Panel               |
+------------------------------------------+
```

- **Toolbar**: Compile, save, debug, and class settings
- **Components Panel**: Add and manage components (meshes, lights, triggers)
- **Graph Editor**: The main canvas for node-based scripting
- **Details Panel**: Edit properties of selected nodes or components
- **My Blueprint Panel**: Overview of variables, functions, macros, and graphs

## Event Graph Fundamentals

The Event Graph is the heart of Blueprint scripting. It responds to events and executes logic in response to gameplay situations.

### Common Events

Events are red nodes that trigger execution flow:

```
Event BeginPlay
    |
    +---> [Your Logic Here]

Event Tick
    |
    +---> [Per-Frame Logic]

Event ActorBeginOverlap
    |
    +---> [Collision Response]
```

### Core Event Types

**Initialization Events:**
- `Event BeginPlay`: Fires once when the actor starts playing
- `Event Construct`: Called when the object is constructed

**Per-Frame Events:**
- `Event Tick`: Called every frame (use sparingly for performance)

**Input Events:**
- `Input Action [ActionName]`: Responds to mapped input actions
- `Input Axis [AxisName]`: Handles continuous input like movement

**Collision Events:**
- `Event ActorBeginOverlap`: When another actor overlaps this one
- `Event ActorEndOverlap`: When overlap ends
- `Event Hit`: When a physics collision occurs

### Creating Your First Event Graph

A simple example that prints a message when the game starts:

```
[Event BeginPlay] --> [Print String]
                           |
                      "Hello, Unreal!"
```

**Step-by-step:**
1. Open your Blueprint's Event Graph
2. Right-click and search for "Event BeginPlay" (or use existing node)
3. Drag from the execution pin (white arrow)
4. Search for "Print String"
5. Enter your message in the "In String" field
6. Compile and test

## Variables and Data Types

Variables store data that your Blueprint can read, modify, and use throughout execution.

### Basic Data Types

| Type | Description | Example Values |
|------|-------------|----------------|
| **Boolean** | True/False values | `true`, `false` |
| **Integer** | Whole numbers | `-5`, `0`, `42` |
| **Float** | Decimal numbers | `3.14`, `-0.5` |
| **String** | Text | `"Hello World"` |
| **Name** | Optimized identifiers | `PlayerStart` |
| **Text** | Localizable text | Displayed UI text |
| **Vector** | 3D coordinates (X, Y, Z) | `(100, 0, 50)` |
| **Rotator** | Rotation (Pitch, Yaw, Roll) | `(0, 90, 0)` |
| **Transform** | Location + Rotation + Scale | Complete spatial data |

### Creating Variables

1. Click the **+** button in My Blueprint panel under Variables
2. Name your variable descriptively (e.g., `PlayerHealth`, `MovementSpeed`)
3. Select the appropriate type in the Details panel
4. Set the default value
5. Configure access:
   - **Instance Editable**: Exposed in the editor per-instance
   - **Blueprint Read Only**: Can only be read, not modified
   - **Expose on Spawn**: Set when spawning the actor

### Variable Categories

Organize variables into categories for better readability:

```
Variables
  +-- Health
  |     +-- CurrentHealth (Float)
  |     +-- MaxHealth (Float)
  |     +-- IsInvulnerable (Boolean)
  +-- Movement
  |     +-- WalkSpeed (Float)
  |     +-- RunSpeed (Float)
  +-- Combat
        +-- AttackDamage (Float)
        +-- AttackRange (Float)
```

### Working with Variables

**Get vs Set:**
```
[Get PlayerHealth] --> Returns the current value
                           |
                       Output: 100.0

[Set PlayerHealth] <-- Input: 75.0
    |
    Stores the new value
```

**Variable Operations:**
```
[Get CurrentHealth]
        |
        +---> [Float - Float] <--- Damage Amount
                    |
                    +---> [Set CurrentHealth]
```

### Arrays

Arrays store multiple values of the same type:

```
Inventory (Array of Strings):
  [0] "Sword"
  [1] "Shield"
  [2] "Potion"
```

**Common Array Operations:**
- `Add`: Append item to end
- `Insert`: Add item at specific index
- `Remove`: Delete item by value
- `Remove Index`: Delete item at index
- `Get`: Retrieve item at index
- `Length`: Get number of items
- `Contains`: Check if item exists
- `Find`: Get index of item

### Structs

Structs group related data together:

```cpp
// Conceptual struct definition
struct FWeaponData
{
    String Name;
    Float Damage;
    Float FireRate;
    Integer AmmoCapacity;
};
```

In Blueprint, create a struct:
1. Content Browser > Right-click > Blueprints > Structure
2. Add variables to define the struct
3. Use "Make [StructName]" and "Break [StructName]" nodes

## Functions

Functions are reusable blocks of logic that can accept inputs and return outputs.

### Creating Functions

1. Click **+** next to Functions in My Blueprint
2. Name the function (e.g., `CalculateDamage`)
3. Add inputs and outputs in the Details panel
4. Build the logic inside the function graph

### Function Example: Calculate Damage

```
Function: CalculateDamage
Inputs:
  - BaseDamage (Float)
  - CriticalHit (Boolean)
  - ArmorReduction (Float)
Outputs:
  - FinalDamage (Float)

Graph:
[Input BaseDamage]
        |
        +---> [Branch: CriticalHit?]
                |           |
              True        False
                |           |
        [Multiply x2]    [Pass]
                |           |
                +-----+-----+
                      |
              [Subtract ArmorReduction]
                      |
                [Clamp (Min: 0)]
                      |
              [Return: FinalDamage]
```

### Pure vs Impure Functions

**Pure Functions** (marked with checkbox):
- Have no side effects
- Only calculate and return values
- Can be called multiple times efficiently
- Display as compact nodes without execution pins

```
[Pure Function: GetHealthPercentage]
    CurrentHealth / MaxHealth
    Returns: Float
```

**Impure Functions:**
- May modify state
- Have execution pins (white arrows)
- Called once per execution flow

```
[Impure Function: TakeDamage]
    |
    Modifies: CurrentHealth
    Calls: PlayHitEffect
    May Call: Die
```

### Local Variables

Functions can have local variables scoped only within that function:
1. Inside the function graph, click **+** next to Local Variables
2. Use these for temporary calculations

## Macros

Macros are similar to functions but with key differences.

### Macros vs Functions

| Feature | Functions | Macros |
|---------|-----------|--------|
| Compiled | Yes, separate callable unit | No, expanded inline |
| Multiple Exec Outputs | No | Yes |
| Latent Nodes (Delay) | No | Yes |
| Overridable | Yes | No |
| Accessible from other Blueprints | Yes | Only via Macro Library |

### When to Use Macros

Use macros when you need:
- Multiple execution outputs
- Inline expansion for performance
- Latent actions inside reusable logic

### Macro Example: Safe Division

```
Macro: SafeDivide
Inputs:
  - A (Float)
  - B (Float)
Outputs (Exec):
  - Success
  - DivideByZero
Outputs (Data):
  - Result (Float)

Graph:
[Input A, B]
      |
[Branch: B != 0]
    |         |
  True      False
    |         |
[A / B]   [Set Result = 0]
    |         |
[Success] [DivideByZero]
```

## Flow Control

Control the execution path of your Blueprint logic.

### Branch (If Statement)

```
[Condition: Health <= 0]
        |
    [Branch]
    |       |
  True    False
    |       |
 [Die]  [Continue]
```

### Sequence

Execute multiple branches in order:

```
[Event BeginPlay]
        |
    [Sequence]
    |    |    |
  Then0 Then1 Then2
    |    |    |
 [Init] [Load] [Start]
```

### For Loop

```
[For Loop]
Start: 0
End: 10
    |
 [Loop Body] --> Executes 10 times with Index
    |
[Completed] --> After all iterations
```

### For Each Loop

```
[For Each Loop]
Array: Inventory Items
    |
[Array Element] --> Current item
[Array Index] --> Current index
    |
[Loop Body]
    |
[Completed]
```

### While Loop

```
[While Loop]
Condition: Ammo > 0
    |
[Loop Body]
    |
[Completed]
```

**Warning**: Ensure while loops have exit conditions to avoid infinite loops.

### Switch Statements

**Switch on Int:**
```
[Switch on Int]
Selection: CurrentWeaponIndex
    |
  0: Pistol Logic
  1: Rifle Logic
  2: Shotgun Logic
Default: Fists Logic
```

**Switch on Enum:**
```
[Switch on EWeaponType]
    |
  Melee: Close combat
  Ranged: Projectile
  Magic: Spell cast
```

### Gate

Controls whether execution can pass through:

```
[Open Gate] --> Allows flow
[Close Gate] --> Blocks flow
[Toggle Gate] --> Switches state

[Gate]
    |
Enter --> Exit (if open)
```

### Do Once

Execute logic only the first time:

```
[Event Tick]
     |
[Do Once]
     |
[Expensive Initialization] --> Runs only once
```

## Blueprint Communication

Blueprints often need to communicate with each other. Unreal provides several patterns for this.

### Direct Reference

Get a reference to another actor and call its functions:

```
[Get Actor of Class: BP_Enemy]
          |
    [Cast to BP_Enemy]
          |
    [Call Function: TakeDamage]
```

### Casting

Convert a generic reference to a specific type:

```
[On Component Begin Overlap]
        |
    Other Actor
        |
[Cast to BP_Player]
    |          |
 Success     Failed
    |
[Access Player-specific functions]
```

**Cast Performance Tip**: Cache cast results instead of casting every frame.

### Blueprint Interfaces

Interfaces define a contract that multiple Blueprints can implement.

**Creating an Interface:**
1. Content Browser > Blueprint Interface
2. Add function signatures (inputs/outputs only, no implementation)

**Implementing an Interface:**
1. Open your Blueprint
2. Class Settings > Interfaces > Add
3. Implement the interface functions

**Example Interface: IInteractable**
```
Interface: BPI_Interactable
Functions:
  - Interact(Interactor: Actor)
  - GetInteractionText() Returns: Text
```

**Calling Interface Functions:**
```
[Does Implement Interface: BPI_Interactable]
    |
  True
    |
[Interact (Message)]  --> Works on any implementing actor
```

### Event Dispatchers

Event Dispatchers allow Blueprints to broadcast events that others can subscribe to.

**Creating a Dispatcher:**
1. My Blueprint > Event Dispatchers > +
2. Name it (e.g., `OnHealthChanged`)
3. Add parameters if needed

**Broadcasting:**
```
[Set Health]
     |
[Call OnHealthChanged]
     |
Parameters: NewHealth, OldHealth
```

**Subscribing:**
```
[Get Reference to Actor]
     |
[Bind Event to OnHealthChanged]
     |
[Custom Event: HandleHealthChanged]
```

### Get All Actors of Class

Find all instances of a Blueprint class:

```
[Get All Actors of Class: BP_Collectible]
          |
    [For Each Loop]
          |
    [Process each collectible]
```

**Performance Note**: Use sparingly; prefer direct references when possible.

## Blueprint-C++ Interaction

Combining Blueprints with C++ gives you the best of both worlds: performance and flexibility.

### Exposing C++ to Blueprints

**UPROPERTY - Expose Variables:**

```cpp
UCLASS()
class AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Editable in Blueprint and Details panel
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Stats")
    float MaxHealth = 100.0f;

    // Read-only in Blueprint
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Stats")
    float CurrentHealth;

    // Not visible in editor, but accessible in Blueprint
    UPROPERTY(BlueprintReadWrite, Category = "Stats")
    bool bIsAlive = true;
};
```

**UPROPERTY Specifiers:**

| Specifier | Description |
|-----------|-------------|
| `EditAnywhere` | Editable in editor on any instance |
| `EditDefaultsOnly` | Editable only on the class default |
| `EditInstanceOnly` | Editable only on placed instances |
| `VisibleAnywhere` | Visible but not editable |
| `BlueprintReadWrite` | Get and Set in Blueprint |
| `BlueprintReadOnly` | Only Get in Blueprint |

**UFUNCTION - Expose Functions:**

```cpp
UCLASS()
class AMyCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Callable from Blueprint
    UFUNCTION(BlueprintCallable, Category = "Combat")
    void TakeDamage(float DamageAmount);

    // Pure function (no side effects)
    UFUNCTION(BlueprintPure, Category = "Stats")
    float GetHealthPercentage() const;

    // Implementable in Blueprint
    UFUNCTION(BlueprintImplementableEvent, Category = "Events")
    void OnDeath();

    // C++ implementation with Blueprint override option
    UFUNCTION(BlueprintNativeEvent, Category = "Events")
    void OnHit(AActor* HitBy);
    void OnHit_Implementation(AActor* HitBy);
};
```

**UFUNCTION Specifiers:**

| Specifier | Description |
|-----------|-------------|
| `BlueprintCallable` | Can be called from Blueprint |
| `BlueprintPure` | No side effects, no exec pins |
| `BlueprintImplementableEvent` | Defined in C++, implemented in Blueprint |
| `BlueprintNativeEvent` | C++ default, overridable in Blueprint |

### Creating Blueprint-Extendable Classes

```cpp
// MyProjectile.h
UCLASS(Blueprintable)
class MYGAME_API AMyProjectile : public AActor
{
    GENERATED_BODY()

public:
    AMyProjectile();

    // Components
    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    USphereComponent* CollisionComponent;

    UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
    UProjectileMovementComponent* MovementComponent;

    // Configurable properties
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Projectile")
    float Damage = 20.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Projectile")
    float Speed = 3000.0f;

protected:
    // Override in Blueprint for custom hit behavior
    UFUNCTION(BlueprintNativeEvent, Category = "Projectile")
    void OnProjectileHit(AActor* HitActor, const FHitResult& HitResult);
    virtual void OnProjectileHit_Implementation(AActor* HitActor, const FHitResult& HitResult);
};
```

```cpp
// MyProjectile.cpp
AMyProjectile::AMyProjectile()
{
    CollisionComponent = CreateDefaultSubobject<USphereComponent>(TEXT("CollisionComponent"));
    CollisionComponent->InitSphereRadius(15.0f);
    RootComponent = CollisionComponent;

    MovementComponent = CreateDefaultSubobject<UProjectileMovementComponent>(TEXT("MovementComponent"));
    MovementComponent->InitialSpeed = Speed;
    MovementComponent->MaxSpeed = Speed;
}

void AMyProjectile::OnProjectileHit_Implementation(AActor* HitActor, const FHitResult& HitResult)
{
    // Default C++ behavior
    if (HitActor)
    {
        UGameplayStatics::ApplyDamage(HitActor, Damage, GetInstigatorController(), this, nullptr);
    }
    Destroy();
}
```

### Blueprint Function Libraries

Create static functions accessible from any Blueprint:

```cpp
// MyBlueprintLibrary.h
UCLASS()
class MYGAME_API UMyBlueprintLibrary : public UBlueprintFunctionLibrary
{
    GENERATED_BODY()

public:
    // Format number with commas: 1234567 -> "1,234,567"
    UFUNCTION(BlueprintPure, Category = "Utilities|String")
    static FString FormatNumberWithCommas(int32 Number);

    // Get random point in navigable radius
    UFUNCTION(BlueprintCallable, Category = "Utilities|Navigation", meta = (WorldContext = "WorldContextObject"))
    static FVector GetRandomNavigablePoint(UObject* WorldContextObject, FVector Origin, float Radius);

    // Check if running in editor
    UFUNCTION(BlueprintPure, Category = "Utilities|Platform")
    static bool IsRunningInEditor();
};
```

### Calling Blueprint Functions from C++

```cpp
// Find and call a Blueprint-implemented function
void AMyActor::CallBlueprintFunction()
{
    // For BlueprintImplementableEvent
    OnDeath(); // Just call it directly

    // For BlueprintNativeEvent
    OnHit(SomeActor); // Calls _Implementation or Blueprint override
}
```

### Spawning Blueprint Classes from C++

```cpp
// In header
UPROPERTY(EditDefaultsOnly, Category = "Spawning")
TSubclassOf<AMyProjectile> ProjectileClass;

// In implementation
void AMyCharacter::FireProjectile()
{
    if (ProjectileClass)
    {
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        SpawnParams.Instigator = GetInstigator();

        AMyProjectile* Projectile = GetWorld()->SpawnActor<AMyProjectile>(
            ProjectileClass,
            GetActorLocation(),
            GetActorRotation(),
            SpawnParams
        );

        if (Projectile)
        {
            // Configure the spawned projectile
            Projectile->Damage = 50.0f;
        }
    }
}
```

## Best Practices

### Organization

1. **Use Folders**: Organize Blueprints by type (Characters, Items, UI, etc.)
2. **Naming Conventions**:
   - `BP_` prefix for Blueprint classes
   - `BPI_` prefix for Blueprint interfaces
   - `E` prefix for enums
   - `S_` or `F` prefix for structs
3. **Comment Your Graphs**: Use comment boxes to explain complex logic
4. **Collapse to Functions/Macros**: Keep graphs clean by extracting reusable logic

### Performance

1. **Avoid Tick When Possible**: Use timers or events instead of Event Tick
2. **Cache References**: Store frequently accessed references in variables
3. **Use C++ for Heavy Operations**: Move performance-critical code to C++
4. **Profile Your Blueprints**: Use Unreal's Blueprint profiler

```
// Instead of this (runs every frame):
[Event Tick]
     |
[Get All Actors of Class]
     |
[Heavy Processing]

// Do this (runs when needed):
[Event BeginPlay]
     |
[Get All Actors of Class]
     |
[Store in Array Variable]

[Custom Event: ProcessActors]
     |
[Use Cached Array]
```

### Debugging

1. **Use Print String**: Quick debugging output
2. **Breakpoints**: Right-click nodes to add breakpoints
3. **Watch Variables**: Monitor variable values during debugging
4. **Blueprint Debugger**: Step through execution flow

### Code Quality

1. **Single Responsibility**: Each function/macro should do one thing
2. **Meaningful Names**: Use descriptive names for everything
3. **Consistent Style**: Follow team conventions
4. **Documentation**: Add tooltips to public functions and variables

```cpp
// Good documentation in C++
UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Combat",
    meta = (ClampMin = "0.0", ClampMax = "1000.0",
    ToolTip = "Base damage dealt by this weapon before modifiers"))
float BaseDamage = 25.0f;
```

## Common Patterns

### Object Pooling

Reuse actors instead of constantly spawning/destroying:

```
Variables:
  - PooledProjectiles (Array of Projectile References)
  - PoolSize (Integer) = 20

Function: GetPooledProjectile
    |
[For Each: PooledProjectiles]
    |
[Branch: Is Hidden In Game?]
    |
  True --> Return this projectile
    |
  False --> Continue loop
    |
[Loop Complete] --> Spawn new if pool exhausted
```

### State Machines

Manage complex behaviors with states:

```
Enum: EEnemyState
  - Idle
  - Patrol
  - Chase
  - Attack

Variable: CurrentState (EEnemyState)

Function: UpdateState
    |
[Switch on EEnemyState]
    |
  Idle --> Check for player, maybe switch to Chase
  Patrol --> Follow waypoints, check for player
  Chase --> Move toward player, switch to Attack when close
  Attack --> Deal damage, return to Chase if player escapes
```

### Component-Based Design

Use components for modular, reusable functionality:

```
BP_HealthComponent:
  Variables: CurrentHealth, MaxHealth
  Events: OnDamaged, OnHealed, OnDeath
  Functions: TakeDamage, Heal, GetHealthPercentage

Usage:
  - Add to Player, Enemies, Destructibles
  - Each actor can respond to health events differently
```

## Summary

Blueprints are a powerful tool in Unreal Engine that democratizes game development while providing professional-grade capabilities. Key takeaways:

1. **Event Graph** is the core of Blueprint logic, responding to gameplay events
2. **Variables** store and manage your data with appropriate types
3. **Functions and Macros** create reusable logic blocks
4. **Communication patterns** (Interfaces, Dispatchers, Casting) connect Blueprints
5. **C++ integration** combines visual scripting with high-performance code
6. **Best practices** ensure maintainable, performant Blueprints

Whether you are prototyping a mechanic, building UI, or creating complete games, Blueprints provide the flexibility and power to bring your vision to life.

## Further Reading

### Official Resources

- [Unreal Engine Blueprint Documentation](https://docs.unrealengine.com/en-US/ProgrammingAndScripting/Blueprints/)
- [Blueprint Best Practices](https://docs.unrealengine.com/en-US/ProgrammingAndScripting/Blueprints/BestPractices/)
- [Blueprint Communication](https://docs.unrealengine.com/en-US/ProgrammingAndScripting/Blueprints/UserGuide/BlueprintComms/)

### Advanced Topics

- **Gameplay Ability System**: Data-driven ability framework
- **Animation Blueprints**: Advanced character animation
- **AI Blueprints**: Behavior trees and AI controllers
- **Niagara Blueprints**: Visual effects scripting
- **Material Blueprints**: Shader graph programming

### Related Tools

- **Blueprint Debugger**: Step-through execution analysis
- **Blueprint Profiler**: Performance measurement
- **Blueprint Diff Tool**: Compare Blueprint versions
- **Blueprint Nativization**: Convert Blueprints to C++ for shipping
