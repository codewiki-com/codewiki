---
title: Unreal Engine Replication System Deep Dive
description: Comprehensive guide to Unreal Engine's network replication system, covering property replication, RPCs, relevancy, and advanced multiplayer patterns
track: gamedev
section: unreal
difficulty: intermediate
tags: []
status: imported
origin: old/src/content/docs/gamedev/unreal-replication.en.md
divergence: 0.235
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
  - category-casing
  - h1-in-body
  - difficulty-defaulted
legacy:
  category: ""
  subcategory: ""
  order: null
  lastUpdated: null
---

Unreal Engine's replication system is the foundation of multiplayer game development in UE4/UE5. It provides a robust, battle-tested framework for synchronizing game state across networked clients with authority-based architecture. Understanding replication is essential for building scalable, performant multiplayer experiences.

## Concept Explanation

### What is Replication?

Replication in Unreal Engine refers to the process of synchronizing actor state from the server to connected clients. It's a one-way data flow where the authoritative server pushes state changes to clients, ensuring consistency across all game instances.

### The Client-Server Model

Unreal uses a strict client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                      AUTHORITATIVE SERVER                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Game State                         │    │
│  │  - All Actor positions, health, inventory           │    │
│  │  - Physics simulation (authority)                   │    │
│  │  - Game rules and validation                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│              Replication (Property Updates + RPCs)           │
│                           ▼                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Client 1 │    │ Client 2 │    │ Client 3 │              │
│  │ (Proxy)  │    │ (Proxy)  │    │ (Proxy)  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Key Terminology

| Term | Description |
|------|-------------|
| **Authority** | The instance that owns the definitive state of an actor (usually server) |
| **Autonomous Proxy** | Client's representation of their own pawn (can predict locally) |
| **Simulated Proxy** | Client's representation of other players' pawns |
| **Net Role** | Defines an actor's network behavior (Authority, AutonomousProxy, SimulatedProxy) |
| **Relevancy** | Determines which actors should replicate to which clients |
| **Net Priority** | Relative importance of an actor for bandwidth allocation |

### Why Replication Matters

```cpp
// Without proper replication understanding, you might write:
void AMyCharacter::TakeDamage(float Damage)
{
    Health -= Damage;  // Only changes on one machine!
    if (Health <= 0)
    {
        Die();  // Other players won't see this
    }
}

// With proper replication:
void AMyCharacter::TakeDamage(float Damage)
{
    if (HasAuthority())  // Only server modifies health
    {
        Health -= Damage;  // Replicated property
        if (Health <= 0)
        {
            MulticastDie();  // All clients see death
        }
    }
}
```

## Core Principles

### 1. Server Authority

The server is the single source of truth for game state:

```cpp
UCLASS()
class AGameCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // Server-authoritative health
    UPROPERTY(ReplicatedUsing = OnRep_Health)
    float Health;

    void ApplyDamage(float Damage)
    {
        // CRITICAL: Always check authority before modifying replicated state
        if (!HasAuthority())
        {
            return;  // Clients cannot modify directly
        }

        Health = FMath::Max(0.0f, Health - Damage);
        // OnRep_Health will be called on clients automatically
    }

    UFUNCTION()
    void OnRep_Health()
    {
        // Called on clients when Health replicates
        UpdateHealthBar();

        if (Health <= 0)
        {
            PlayDeathEffects();  // Visual feedback only
        }
    }
};
```

### 2. Property Replication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REPLICATION PIPELINE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Server marks property dirty                              │
│     └── Health = 50.0f;                                     │
│                                                              │
│  2. Replication driver collects dirty properties             │
│     └── During net tick, gather changed replicated props    │
│                                                              │
│  3. Relevancy check                                          │
│     └── Is this actor relevant to this client?              │
│                                                              │
│  4. Priority sorting                                         │
│     └── Higher priority actors replicate first              │
│                                                              │
│  5. Bandwidth allocation                                     │
│     └── Fit updates within available bandwidth              │
│                                                              │
│  6. Serialization & transmission                             │
│     └── Pack data and send over network                     │
│                                                              │
│  7. Client receives and deserializes                         │
│     └── Unpack property values                              │
│                                                              │
│  8. OnRep callback (if defined)                              │
│     └── OnRep_Health() called with new value                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Network Roles

Understanding roles is crucial for proper replication logic:

```cpp
void AMyActor::DebugNetworkRole()
{
    ENetRole LocalRole = GetLocalRole();
    ENetRole RemoteRole = GetRemoteRole();

    // LocalRole tells you what this actor is on THIS machine
    // RemoteRole tells you what it is on the OTHER end

    switch (LocalRole)
    {
    case ROLE_Authority:
        // This machine owns the actor (usually server)
        // Can modify replicated properties
        UE_LOG(LogNet, Log, TEXT("I am the authority"));
        break;

    case ROLE_AutonomousProxy:
        // This is the owning client's pawn
        // Can perform client-side prediction
        UE_LOG(LogNet, Log, TEXT("I am the autonomous proxy (my pawn)"));
        break;

    case ROLE_SimulatedProxy:
        // This is another player's pawn on my client
        // Only receives replicated state
        UE_LOG(LogNet, Log, TEXT("I am a simulated proxy (other player)"));
        break;

    case ROLE_None:
        // Not replicated
        UE_LOG(LogNet, Log, TEXT("Not a networked actor"));
        break;
    }
}
```

### 4. Conditional Replication

Not all properties need to go to all clients:

```cpp
// In header
UPROPERTY(Replicated)
float PublicScore;  // Everyone sees this

UPROPERTY(Replicated)
int32 SecretAmmo;   // Only owner should see

// In GetLifetimeReplicatedProps
void AMyCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // Replicate to everyone
    DOREPLIFETIME(AMyCharacter, PublicScore);

    // Only replicate to owner (prevents cheating)
    DOREPLIFETIME_CONDITION(AMyCharacter, SecretAmmo, COND_OwnerOnly);
}
```

### 5. Replication Conditions

```cpp
// Available conditions:
COND_None               // Replicate to all
COND_InitialOnly        // Only on initial replication
COND_OwnerOnly          // Only to actor's owner
COND_SkipOwner          // To everyone except owner
COND_SimulatedOnly      // Only to simulated proxies
COND_AutonomousOnly     // Only to autonomous proxy
COND_SimulatedOrPhysics // Simulated OR physics-enabled
COND_InitialOrOwner     // Initial replication OR owner
COND_Custom             // Custom condition via callback
COND_ReplayOrOwner      // Replay OR owner
COND_ReplayOnly         // Replay system only
COND_SimulatedOnlyNoReplay  // Simulated, no replay
COND_SkipReplay         // Skip replay system
COND_Never              // Never replicate (documentation)
```

## Core Concepts

### Property Replication

The foundation of state synchronization:

```cpp
UCLASS()
class ANetworkedActor : public AActor
{
    GENERATED_BODY()

public:
    ANetworkedActor()
    {
        // Enable replication for this actor
        bReplicates = true;

        // How often to check for replication (in seconds)
        NetUpdateFrequency = 100.0f;  // Check 100 times per second

        // Minimum time between replications
        MinNetUpdateFrequency = 2.0f;  // At least every 0.5 seconds

        // Always replicate even when not recently rendered
        bAlwaysRelevant = false;
    }

    // Basic replicated property
    UPROPERTY(Replicated)
    int32 SimpleCounter;

    // Replicated with notification callback
    UPROPERTY(ReplicatedUsing = OnRep_TeamColor)
    FLinearColor TeamColor;

    // Replicated struct
    UPROPERTY(Replicated)
    FCharacterStats Stats;

protected:
    UFUNCTION()
    void OnRep_TeamColor()
    {
        // Update material when team color changes
        if (MeshComponent)
        {
            UMaterialInstanceDynamic* DynMat = MeshComponent->CreateDynamicMaterialInstance(0);
            DynMat->SetVectorParameterValue(TEXT("TeamColor"), TeamColor);
        }
    }

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override
    {
        Super::GetLifetimeReplicatedProps(OutLifetimeProps);

        DOREPLIFETIME(ANetworkedActor, SimpleCounter);
        DOREPLIFETIME(ANetworkedActor, TeamColor);
        DOREPLIFETIME(ANetworkedActor, Stats);
    }
};
```

### Remote Procedure Calls (RPCs)

RPCs enable communication between server and clients:

```cpp
UCLASS()
class ANetworkedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ═══════════════════════════════════════════════════════════
    // SERVER RPCs - Called on client, executed on server
    // ═══════════════════════════════════════════════════════════

    // Reliable: Guaranteed delivery, ordered
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerRequestAbility(int32 AbilityID);

    void ServerRequestAbility_Implementation(int32 AbilityID)
    {
        // Validate and execute on server
        if (CanUseAbility(AbilityID))
        {
            ExecuteAbility(AbilityID);
            // Notify all clients
            MulticastPlayAbilityEffects(AbilityID);
        }
    }

    bool ServerRequestAbility_Validate(int32 AbilityID)
    {
        // Return false to disconnect cheating clients
        return AbilityID >= 0 && AbilityID < MaxAbilities;
    }

    // Unreliable: May be dropped, faster
    UFUNCTION(Server, Unreliable)
    void ServerUpdateAimRotation(FRotator AimRotation);

    void ServerUpdateAimRotation_Implementation(FRotator AimRotation)
    {
        // Update aim for other clients to see
        CurrentAimRotation = AimRotation;
    }

    // ═══════════════════════════════════════════════════════════
    // CLIENT RPCs - Called on server, executed on owning client
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void ClientReceiveMessage(const FString& Message);

    void ClientReceiveMessage_Implementation(const FString& Message)
    {
        // Show message on owning client's HUD
        if (APlayerController* PC = Cast<APlayerController>(GetController()))
        {
            // Display message
        }
    }

    UFUNCTION(Client, Unreliable)
    void ClientPlayHitReaction(FVector HitLocation, float Damage);

    void ClientPlayHitReaction_Implementation(FVector HitLocation, float Damage)
    {
        // Play screen shake, flash, etc.
        PlayHitEffects(HitLocation, Damage);
    }

    // ═══════════════════════════════════════════════════════════
    // MULTICAST RPCs - Called on server, executed on ALL clients
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(NetMulticast, Reliable)
    void MulticastPlayAbilityEffects(int32 AbilityID);

    void MulticastPlayAbilityEffects_Implementation(int32 AbilityID)
    {
        // Play VFX/SFX on all machines
        SpawnAbilityParticles(AbilityID);
        PlayAbilitySound(AbilityID);
    }

    UFUNCTION(NetMulticast, Unreliable)
    void MulticastPlayFootstep(FVector Location);

    void MulticastPlayFootstep_Implementation(FVector Location)
    {
        // Minor effect, unreliable is fine
        PlayFootstepSound(Location);
    }
};
```

### Actor Ownership

Ownership determines RPC routing and replication filtering:

```cpp
// Setting ownership
void AMyGameMode::SpawnPlayerCharacter(APlayerController* PC)
{
    FActorSpawnParameters SpawnParams;
    SpawnParams.Owner = PC;  // PC owns the character

    AMyCharacter* Character = GetWorld()->SpawnActor<AMyCharacter>(
        CharacterClass,
        SpawnLocation,
        SpawnRotation,
        SpawnParams
    );

    // Alternative: Set owner after spawn
    Character->SetOwner(PC);

    // For pawns, use Possess which handles ownership
    PC->Possess(Character);
}

// Checking ownership
void AMyCharacter::CheckOwnership()
{
    // Get owning connection
    if (AActor* Owner = GetOwner())
    {
        if (APlayerController* PC = Cast<APlayerController>(Owner))
        {
            // This character is owned by a player
        }
    }

    // Check if local player owns this
    if (IsLocallyControlled())
    {
        // This is our pawn
    }

    // Check if this machine has authority
    if (HasAuthority())
    {
        // We are the server or this is a non-replicated actor
    }
}
```

### Actor Channels and Connection

```cpp
// Understanding actor channels
void DebugActorChannel(AActor* Actor)
{
    if (UNetDriver* NetDriver = Actor->GetWorld()->GetNetDriver())
    {
        for (UNetConnection* Connection : NetDriver->ClientConnections)
        {
            UActorChannel* Channel = Connection->FindActorChannelRef(Actor);
            if (Channel)
            {
                UE_LOG(LogNet, Log, TEXT("Actor %s has channel to %s"),
                    *Actor->GetName(),
                    *Connection->LowLevelGetRemoteAddress());
            }
        }
    }
}
```

### Relevancy System

Controls which actors replicate to which clients:

```cpp
UCLASS()
class ARelevancyControlledActor : public AActor
{
    GENERATED_BODY()

public:
    // Override relevancy determination
    virtual bool IsNetRelevantFor(
        const AActor* RealViewer,
        const AActor* ViewTarget,
        const FVector& SrcLocation) const override
    {
        // Always relevant to owner
        if (RealViewer == GetOwner())
        {
            return true;
        }

        // Distance-based relevancy
        float DistSq = FVector::DistSquared(GetActorLocation(), SrcLocation);

        // Custom relevancy radius
        if (DistSq > FMath::Square(RelevancyRadius))
        {
            return false;
        }

        // Line of sight check for stealth gameplay
        if (bRequireLineOfSight)
        {
            FHitResult Hit;
            FCollisionQueryParams Params;
            Params.AddIgnoredActor(this);
            Params.AddIgnoredActor(ViewTarget);

            if (GetWorld()->LineTraceSingleByChannel(
                Hit,
                SrcLocation,
                GetActorLocation(),
                ECC_Visibility,
                Params))
            {
                return false;  // Blocked, not relevant
            }
        }

        return true;
    }

protected:
    UPROPERTY(EditAnywhere, Category = "Network")
    float RelevancyRadius = 5000.0f;

    UPROPERTY(EditAnywhere, Category = "Network")
    bool bRequireLineOfSight = false;
};
```

### Net Priority

Bandwidth allocation based on importance:

```cpp
UCLASS()
class APrioritizedActor : public AActor
{
    GENERATED_BODY()

public:
    APrioritizedActor()
    {
        // Base priority (1.0 is default)
        NetPriority = 2.0f;  // Twice as important as default
    }

    // Dynamic priority based on game state
    virtual float GetNetPriority(
        const FVector& ViewPos,
        const FVector& ViewDir,
        AActor* Viewer,
        AActor* ViewTarget,
        UActorChannel* InChannel,
        float Time,
        bool bLowBandwidth) override
    {
        float Priority = Super::GetNetPriority(ViewPos, ViewDir, Viewer, ViewTarget, InChannel, Time, bLowBandwidth);

        // Increase priority when in combat
        if (bInCombat)
        {
            Priority *= 2.0f;
        }

        // Increase priority if not updated recently
        if (Time > 0.5f)
        {
            Priority *= (1.0f + Time);
        }

        // Decrease priority for distant actors
        float Distance = FVector::Dist(GetActorLocation(), ViewPos);
        if (Distance > 1000.0f)
        {
            Priority /= (Distance / 1000.0f);
        }

        return Priority;
    }

protected:
    bool bInCombat = false;
};
```

## Code Examples

### Complete Multiplayer Character

```cpp
// NetworkedCharacter.h
#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "NetworkedCharacter.generated.h"

USTRUCT(BlueprintType)
struct FCharacterState
{
    GENERATED_BODY()

    UPROPERTY()
    float Health = 100.0f;

    UPROPERTY()
    float Armor = 0.0f;

    UPROPERTY()
    int32 Ammo = 30;

    UPROPERTY()
    bool bIsSprinting = false;
};

UCLASS()
class MYGAME_API ANetworkedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ANetworkedCharacter();

    virtual void Tick(float DeltaTime) override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // ═══════════════════════════════════════════════════════════
    // PUBLIC INTERFACE
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void RequestAttack();

    UFUNCTION(BlueprintCallable, Category = "Combat")
    void RequestReload();

    UFUNCTION(BlueprintCallable, Category = "Movement")
    void SetSprinting(bool bSprint);

    UFUNCTION(BlueprintPure, Category = "State")
    float GetHealth() const { return CharacterState.Health; }

    UFUNCTION(BlueprintPure, Category = "State")
    bool IsDead() const { return CharacterState.Health <= 0.0f; }

    // Called by damage system
    void ReceiveDamage(float Damage, AController* InstigatorController, AActor* DamageCauser);

protected:
    // ═══════════════════════════════════════════════════════════
    // REPLICATED PROPERTIES
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_CharacterState)
    FCharacterState CharacterState;

    UPROPERTY(Replicated)
    FRotator AimRotation;

    UPROPERTY(ReplicatedUsing = OnRep_CurrentWeapon)
    TSubclassOf<class AWeapon> CurrentWeaponClass;

    // ═══════════════════════════════════════════════════════════
    // REPLICATION CALLBACKS
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_CharacterState();

    UFUNCTION()
    void OnRep_CurrentWeapon();

    // ═══════════════════════════════════════════════════════════
    // SERVER RPCs
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_RequestAttack(FVector_NetQuantize AimLocation);
    void Server_RequestAttack_Implementation(FVector_NetQuantize AimLocation);
    bool Server_RequestAttack_Validate(FVector_NetQuantize AimLocation);

    UFUNCTION(Server, Reliable)
    void Server_RequestReload();
    void Server_RequestReload_Implementation();

    UFUNCTION(Server, Unreliable)
    void Server_UpdateAimRotation(FRotator NewAimRotation);
    void Server_UpdateAimRotation_Implementation(FRotator NewAimRotation);

    UFUNCTION(Server, Reliable)
    void Server_SetSprinting(bool bSprint);
    void Server_SetSprinting_Implementation(bool bSprint);

    // ═══════════════════════════════════════════════════════════
    // CLIENT RPCs
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void Client_OnDamageReceived(float Damage, FVector HitLocation);
    void Client_OnDamageReceived_Implementation(float Damage, FVector HitLocation);

    UFUNCTION(Client, Reliable)
    void Client_OnDeath(AController* KillerController);
    void Client_OnDeath_Implementation(AController* KillerController);

    // ═══════════════════════════════════════════════════════════
    // MULTICAST RPCs
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(NetMulticast, Unreliable)
    void Multicast_PlayAttackEffects(FVector MuzzleLocation, FRotator MuzzleRotation);
    void Multicast_PlayAttackEffects_Implementation(FVector MuzzleLocation, FRotator MuzzleRotation);

    UFUNCTION(NetMulticast, Reliable)
    void Multicast_OnDeath();
    void Multicast_OnDeath_Implementation();

    UFUNCTION(NetMulticast, Unreliable)
    void Multicast_PlayReloadAnimation();
    void Multicast_PlayReloadAnimation_Implementation();

private:
    // ═══════════════════════════════════════════════════════════
    // INTERNAL HELPERS
    // ═══════════════════════════════════════════════════════════

    void PerformAttack(FVector AimLocation);
    void PerformReload();
    void Die(AController* KillerController);
    void UpdateHealthUI();
    void UpdateAmmoUI();

    UPROPERTY()
    class AWeapon* CurrentWeaponActor;

    float LastAttackTime = 0.0f;
    float AttackCooldown = 0.1f;
};

// NetworkedCharacter.cpp
#include "NetworkedCharacter.h"
#include "Net/UnrealNetwork.h"

ANetworkedCharacter::ANetworkedCharacter()
{
    bReplicates = true;
    NetUpdateFrequency = 100.0f;
    MinNetUpdateFrequency = 33.0f;
}

void ANetworkedCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // Replicate to all
    DOREPLIFETIME(ANetworkedCharacter, AimRotation);
    DOREPLIFETIME(ANetworkedCharacter, CurrentWeaponClass);

    // Health/state only to owner (anti-cheat)
    DOREPLIFETIME_CONDITION(ANetworkedCharacter, CharacterState, COND_OwnerOnly);
}

void ANetworkedCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // Send aim updates to server (autonomous proxy only)
    if (IsLocallyControlled() && !HasAuthority())
    {
        FRotator CurrentAim = GetControlRotation();
        if (!CurrentAim.Equals(AimRotation, 1.0f))
        {
            Server_UpdateAimRotation(CurrentAim);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// PUBLIC INTERFACE
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::RequestAttack()
{
    if (IsDead()) return;

    float CurrentTime = GetWorld()->GetTimeSeconds();
    if (CurrentTime - LastAttackTime < AttackCooldown) return;

    // Get aim location
    FVector AimLocation = GetActorLocation() + GetControlRotation().Vector() * 10000.0f;

    if (HasAuthority())
    {
        // Server - execute directly
        PerformAttack(AimLocation);
    }
    else
    {
        // Client - request from server
        Server_RequestAttack(AimLocation);

        // Predict locally for responsiveness
        Multicast_PlayAttackEffects_Implementation(GetActorLocation(), GetControlRotation());
    }

    LastAttackTime = CurrentTime;
}

void ANetworkedCharacter::RequestReload()
{
    if (IsDead()) return;

    if (HasAuthority())
    {
        PerformReload();
    }
    else
    {
        Server_RequestReload();
    }
}

void ANetworkedCharacter::SetSprinting(bool bSprint)
{
    if (HasAuthority())
    {
        CharacterState.bIsSprinting = bSprint;
        GetCharacterMovement()->MaxWalkSpeed = bSprint ? 1200.0f : 600.0f;
    }
    else
    {
        Server_SetSprinting(bSprint);
        // Predict locally
        GetCharacterMovement()->MaxWalkSpeed = bSprint ? 1200.0f : 600.0f;
    }
}

void ANetworkedCharacter::ReceiveDamage(float Damage, AController* InstigatorController, AActor* DamageCauser)
{
    // Only server processes damage
    if (!HasAuthority()) return;

    // Apply armor reduction
    float ActualDamage = Damage;
    if (CharacterState.Armor > 0)
    {
        float ArmorAbsorb = FMath::Min(CharacterState.Armor, Damage * 0.5f);
        CharacterState.Armor -= ArmorAbsorb;
        ActualDamage = Damage - ArmorAbsorb;
    }

    CharacterState.Health = FMath::Max(0.0f, CharacterState.Health - ActualDamage);

    // Notify owning client
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        FVector HitLocation = DamageCauser ? DamageCauser->GetActorLocation() : GetActorLocation();
        Client_OnDamageReceived(ActualDamage, HitLocation);
    }

    // Check for death
    if (CharacterState.Health <= 0.0f)
    {
        Die(InstigatorController);
    }
}

// ═══════════════════════════════════════════════════════════════
// REPLICATION CALLBACKS
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::OnRep_CharacterState()
{
    UpdateHealthUI();
    UpdateAmmoUI();

    // Update movement speed based on sprinting state
    if (GetCharacterMovement())
    {
        GetCharacterMovement()->MaxWalkSpeed = CharacterState.bIsSprinting ? 1200.0f : 600.0f;
    }
}

void ANetworkedCharacter::OnRep_CurrentWeapon()
{
    // Spawn/update weapon visual
    if (CurrentWeaponClass && !CurrentWeaponActor)
    {
        // Spawn cosmetic weapon actor
        FActorSpawnParameters SpawnParams;
        SpawnParams.Owner = this;
        CurrentWeaponActor = GetWorld()->SpawnActor<AWeapon>(CurrentWeaponClass, SpawnParams);
        if (CurrentWeaponActor)
        {
            CurrentWeaponActor->AttachToComponent(GetMesh(), FAttachmentTransformRules::SnapToTargetNotIncludingScale, TEXT("weapon_socket"));
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// SERVER RPC IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::Server_RequestAttack_Implementation(FVector_NetQuantize AimLocation)
{
    if (IsDead()) return;

    float CurrentTime = GetWorld()->GetTimeSeconds();
    if (CurrentTime - LastAttackTime < AttackCooldown) return;

    PerformAttack(AimLocation);
    LastAttackTime = CurrentTime;
}

bool ANetworkedCharacter::Server_RequestAttack_Validate(FVector_NetQuantize AimLocation)
{
    // Basic validation - aim location should be reasonable
    float Distance = FVector::Dist(GetActorLocation(), AimLocation);
    return Distance < 50000.0f;  // Max 500 meters
}

void ANetworkedCharacter::Server_RequestReload_Implementation()
{
    if (IsDead()) return;
    PerformReload();
}

void ANetworkedCharacter::Server_UpdateAimRotation_Implementation(FRotator NewAimRotation)
{
    AimRotation = NewAimRotation;
}

void ANetworkedCharacter::Server_SetSprinting_Implementation(bool bSprint)
{
    CharacterState.bIsSprinting = bSprint;
    GetCharacterMovement()->MaxWalkSpeed = bSprint ? 1200.0f : 600.0f;
}

// ═══════════════════════════════════════════════════════════════
// CLIENT RPC IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::Client_OnDamageReceived_Implementation(float Damage, FVector HitLocation)
{
    // Play hit indicator, screen shake, etc.
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        PC->ClientStartCameraShake(DamageShakeClass);

        // Show damage direction indicator
        FVector Direction = (HitLocation - GetActorLocation()).GetSafeNormal();
        // Update HUD with direction
    }
}

void ANetworkedCharacter::Client_OnDeath_Implementation(AController* KillerController)
{
    // Show death screen, killer info, etc.
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        // Show respawn UI
    }
}

// ═══════════════════════════════════════════════════════════════
// MULTICAST RPC IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::Multicast_PlayAttackEffects_Implementation(FVector MuzzleLocation, FRotator MuzzleRotation)
{
    // Skip on server if we're a dedicated server
    if (IsNetMode(NM_DedicatedServer)) return;

    // Play muzzle flash
    UGameplayStatics::SpawnEmitterAtLocation(GetWorld(), MuzzleFlashParticle, MuzzleLocation, MuzzleRotation);

    // Play sound
    UGameplayStatics::PlaySoundAtLocation(GetWorld(), AttackSound, MuzzleLocation);

    // Play animation
    if (GetMesh() && AttackMontage)
    {
        GetMesh()->GetAnimInstance()->Montage_Play(AttackMontage);
    }
}

void ANetworkedCharacter::Multicast_OnDeath_Implementation()
{
    // Skip on dedicated server
    if (IsNetMode(NM_DedicatedServer)) return;

    // Play death animation
    if (GetMesh() && DeathMontage)
    {
        GetMesh()->GetAnimInstance()->Montage_Play(DeathMontage);
    }

    // Ragdoll
    GetMesh()->SetSimulatePhysics(true);
    GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);
}

void ANetworkedCharacter::Multicast_PlayReloadAnimation_Implementation()
{
    if (IsNetMode(NM_DedicatedServer)) return;

    if (GetMesh() && ReloadMontage)
    {
        GetMesh()->GetAnimInstance()->Montage_Play(ReloadMontage);
    }
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::PerformAttack(FVector AimLocation)
{
    check(HasAuthority());

    if (CharacterState.Ammo <= 0) return;

    CharacterState.Ammo--;

    // Perform line trace
    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    FVector Start = GetActorLocation() + FVector(0, 0, 50);  // Eye height

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, AimLocation, ECC_GameTraceChannel1, Params))
    {
        if (ANetworkedCharacter* HitCharacter = Cast<ANetworkedCharacter>(Hit.GetActor()))
        {
            HitCharacter->ReceiveDamage(25.0f, GetController(), this);
        }
    }

    // Notify all clients about the attack
    Multicast_PlayAttackEffects(Start, (AimLocation - Start).Rotation());
}

void ANetworkedCharacter::PerformReload()
{
    check(HasAuthority());

    CharacterState.Ammo = 30;  // Full magazine
    Multicast_PlayReloadAnimation();
}

void ANetworkedCharacter::Die(AController* KillerController)
{
    check(HasAuthority());

    // Notify owning client
    Client_OnDeath(KillerController);

    // Notify all clients to play death effects
    Multicast_OnDeath();

    // Disable collision
    SetActorEnableCollision(false);

    // Respawn timer (handled by game mode)
    if (AGameModeBase* GM = GetWorld()->GetAuthGameMode())
    {
        // GM->HandlePlayerDeath(this, KillerController);
    }
}

void ANetworkedCharacter::UpdateHealthUI()
{
    // Update local HUD
}

void ANetworkedCharacter::UpdateAmmoUI()
{
    // Update local HUD
}
```

### Replicated Inventory System

```cpp
// InventoryComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "InventoryComponent.generated.h"

USTRUCT(BlueprintType)
struct FInventoryItem
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 ItemID = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 Quantity = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite)
    int32 SlotIndex = -1;

    bool operator==(const FInventoryItem& Other) const
    {
        return ItemID == Other.ItemID && SlotIndex == Other.SlotIndex;
    }
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnInventoryChanged, const TArray<FInventoryItem>&, Items);

UCLASS(ClassGroup=(Custom), meta=(BlueprintSpawnableComponent))
class MYGAME_API UInventoryComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UInventoryComponent();

    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    // ═══════════════════════════════════════════════════════════
    // PUBLIC INTERFACE
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    bool AddItem(int32 ItemID, int32 Quantity);

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    bool RemoveItem(int32 ItemID, int32 Quantity);

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    void MoveItem(int32 FromSlot, int32 ToSlot);

    UFUNCTION(BlueprintCallable, Category = "Inventory")
    void DropItem(int32 SlotIndex);

    UFUNCTION(BlueprintPure, Category = "Inventory")
    int32 GetItemCount(int32 ItemID) const;

    UFUNCTION(BlueprintPure, Category = "Inventory")
    const TArray<FInventoryItem>& GetItems() const { return Items; }

    UPROPERTY(BlueprintAssignable)
    FOnInventoryChanged OnInventoryChanged;

protected:
    // ═══════════════════════════════════════════════════════════
    // REPLICATED STATE
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_Items)
    TArray<FInventoryItem> Items;

    UPROPERTY(EditAnywhere, Category = "Inventory")
    int32 MaxSlots = 20;

    // ═══════════════════════════════════════════════════════════
    // REPLICATION CALLBACKS
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_Items();

    // ═══════════════════════════════════════════════════════════
    // SERVER RPCs
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_MoveItem(int32 FromSlot, int32 ToSlot);

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_DropItem(int32 SlotIndex);

private:
    int32 FindEmptySlot() const;
    int32 FindItemSlot(int32 ItemID) const;
    bool CanStackItem(int32 ItemID) const;
    int32 GetMaxStackSize(int32 ItemID) const;
};

// InventoryComponent.cpp
#include "InventoryComponent.h"
#include "Net/UnrealNetwork.h"

UInventoryComponent::UInventoryComponent()
{
    SetIsReplicatedByDefault(true);
}

void UInventoryComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // Only replicate to owner - other players shouldn't see your inventory
    DOREPLIFETIME_CONDITION(UInventoryComponent, Items, COND_OwnerOnly);
}

bool UInventoryComponent::AddItem(int32 ItemID, int32 Quantity)
{
    // Only server can add items
    if (!GetOwner()->HasAuthority())
    {
        return false;
    }

    // Try to stack with existing item
    if (CanStackItem(ItemID))
    {
        int32 ExistingSlot = FindItemSlot(ItemID);
        if (ExistingSlot >= 0)
        {
            int32 MaxStack = GetMaxStackSize(ItemID);
            for (FInventoryItem& Item : Items)
            {
                if (Item.SlotIndex == ExistingSlot)
                {
                    int32 CanAdd = MaxStack - Item.Quantity;
                    int32 ToAdd = FMath::Min(CanAdd, Quantity);
                    Item.Quantity += ToAdd;
                    Quantity -= ToAdd;
                    break;
                }
            }
        }
    }

    // Add remaining as new stack
    while (Quantity > 0)
    {
        int32 EmptySlot = FindEmptySlot();
        if (EmptySlot < 0)
        {
            return false;  // Inventory full
        }

        FInventoryItem NewItem;
        NewItem.ItemID = ItemID;
        NewItem.SlotIndex = EmptySlot;
        NewItem.Quantity = FMath::Min(Quantity, GetMaxStackSize(ItemID));
        Items.Add(NewItem);

        Quantity -= NewItem.Quantity;
    }

    // Force replication
    GetOwner()->ForceNetUpdate();

    return true;
}

bool UInventoryComponent::RemoveItem(int32 ItemID, int32 Quantity)
{
    if (!GetOwner()->HasAuthority())
    {
        return false;
    }

    int32 RemainingToRemove = Quantity;

    for (int32 i = Items.Num() - 1; i >= 0 && RemainingToRemove > 0; --i)
    {
        if (Items[i].ItemID == ItemID)
        {
            int32 ToRemove = FMath::Min(Items[i].Quantity, RemainingToRemove);
            Items[i].Quantity -= ToRemove;
            RemainingToRemove -= ToRemove;

            if (Items[i].Quantity <= 0)
            {
                Items.RemoveAt(i);
            }
        }
    }

    GetOwner()->ForceNetUpdate();

    return RemainingToRemove == 0;
}

void UInventoryComponent::MoveItem(int32 FromSlot, int32 ToSlot)
{
    if (GetOwner()->HasAuthority())
    {
        Server_MoveItem_Implementation(FromSlot, ToSlot);
    }
    else
    {
        Server_MoveItem(FromSlot, ToSlot);
    }
}

void UInventoryComponent::DropItem(int32 SlotIndex)
{
    if (GetOwner()->HasAuthority())
    {
        Server_DropItem_Implementation(SlotIndex);
    }
    else
    {
        Server_DropItem(SlotIndex);
    }
}

int32 UInventoryComponent::GetItemCount(int32 ItemID) const
{
    int32 Count = 0;
    for (const FInventoryItem& Item : Items)
    {
        if (Item.ItemID == ItemID)
        {
            Count += Item.Quantity;
        }
    }
    return Count;
}

void UInventoryComponent::OnRep_Items()
{
    // Notify UI
    OnInventoryChanged.Broadcast(Items);
}

void UInventoryComponent::Server_MoveItem_Implementation(int32 FromSlot, int32 ToSlot)
{
    if (FromSlot == ToSlot || FromSlot < 0 || ToSlot < 0 || ToSlot >= MaxSlots)
    {
        return;
    }

    FInventoryItem* FromItem = nullptr;
    FInventoryItem* ToItem = nullptr;

    for (FInventoryItem& Item : Items)
    {
        if (Item.SlotIndex == FromSlot) FromItem = &Item;
        if (Item.SlotIndex == ToSlot) ToItem = &Item;
    }

    if (!FromItem)
    {
        return;  // Nothing to move
    }

    if (ToItem)
    {
        // Swap
        ToItem->SlotIndex = FromSlot;
    }

    FromItem->SlotIndex = ToSlot;
    GetOwner()->ForceNetUpdate();
}

bool UInventoryComponent::Server_MoveItem_Validate(int32 FromSlot, int32 ToSlot)
{
    return FromSlot >= 0 && FromSlot < MaxSlots && ToSlot >= 0 && ToSlot < MaxSlots;
}

void UInventoryComponent::Server_DropItem_Implementation(int32 SlotIndex)
{
    for (int32 i = 0; i < Items.Num(); ++i)
    {
        if (Items[i].SlotIndex == SlotIndex)
        {
            // Spawn dropped item in world
            if (AActor* Owner = GetOwner())
            {
                FVector DropLocation = Owner->GetActorLocation() + Owner->GetActorForwardVector() * 100.0f;
                // Spawn pickup actor with Items[i].ItemID and Items[i].Quantity
            }

            Items.RemoveAt(i);
            GetOwner()->ForceNetUpdate();
            return;
        }
    }
}

bool UInventoryComponent::Server_DropItem_Validate(int32 SlotIndex)
{
    return SlotIndex >= 0 && SlotIndex < MaxSlots;
}

int32 UInventoryComponent::FindEmptySlot() const
{
    TSet<int32> UsedSlots;
    for (const FInventoryItem& Item : Items)
    {
        UsedSlots.Add(Item.SlotIndex);
    }

    for (int32 i = 0; i < MaxSlots; ++i)
    {
        if (!UsedSlots.Contains(i))
        {
            return i;
        }
    }

    return -1;
}

int32 UInventoryComponent::FindItemSlot(int32 ItemID) const
{
    for (const FInventoryItem& Item : Items)
    {
        if (Item.ItemID == ItemID && Item.Quantity < GetMaxStackSize(ItemID))
        {
            return Item.SlotIndex;
        }
    }
    return -1;
}

bool UInventoryComponent::CanStackItem(int32 ItemID) const
{
    // Check item data for stackability
    return true;  // Simplified
}

int32 UInventoryComponent::GetMaxStackSize(int32 ItemID) const
{
    return 99;  // Simplified
}
```

### Network Prediction Example

```cpp
// PredictedMovementComponent.h
#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "PredictedMovementComponent.generated.h"

USTRUCT()
struct FPredictedMove
{
    GENERATED_BODY()

    float Timestamp = 0.0f;
    FVector InputDirection = FVector::ZeroVector;
    bool bJumping = false;
    FVector ResultingPosition = FVector::ZeroVector;
    FVector ResultingVelocity = FVector::ZeroVector;
};

UCLASS()
class MYGAME_API UPredictedMovementComponent : public UActorComponent
{
    GENERATED_BODY()

public:
    UPredictedMovementComponent();

    virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    void ProcessInput(FVector InputDirection, bool bJump);

protected:
    // Server authoritative state
    UPROPERTY(ReplicatedUsing = OnRep_ServerState)
    FPredictedMove ServerState;

    UFUNCTION()
    void OnRep_ServerState();

    UFUNCTION(Server, Unreliable)
    void Server_SendMove(FPredictedMove Move);
    void Server_SendMove_Implementation(FPredictedMove Move);

private:
    // Client-side prediction
    TArray<FPredictedMove> PendingMoves;
    float LastMoveTimestamp = 0.0f;

    FVector SimulateMove(const FPredictedMove& Move, float DeltaTime);
    void ReconcileWithServer();
    void ReplayPendingMoves();
};

// PredictedMovementComponent.cpp
#include "PredictedMovementComponent.h"
#include "Net/UnrealNetwork.h"

UPredictedMovementComponent::UPredictedMovementComponent()
{
    SetIsReplicatedByDefault(true);
    PrimaryComponentTick.bCanEverTick = true;
}

void UPredictedMovementComponent::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(UPredictedMovementComponent, ServerState);
}

void UPredictedMovementComponent::ProcessInput(FVector InputDirection, bool bJump)
{
    float CurrentTime = GetWorld()->GetTimeSeconds();

    FPredictedMove NewMove;
    NewMove.Timestamp = CurrentTime;
    NewMove.InputDirection = InputDirection;
    NewMove.bJumping = bJump;

    // Simulate locally
    FVector NewPosition = SimulateMove(NewMove, GetWorld()->GetDeltaSeconds());
    NewMove.ResultingPosition = NewPosition;

    // Apply immediately for responsive feel
    GetOwner()->SetActorLocation(NewPosition);

    if (!GetOwner()->HasAuthority())
    {
        // Client: send to server and store for potential replay
        PendingMoves.Add(NewMove);
        Server_SendMove(NewMove);

        // Limit pending moves to prevent memory issues
        while (PendingMoves.Num() > 60)
        {
            PendingMoves.RemoveAt(0);
        }
    }
}

void UPredictedMovementComponent::Server_SendMove_Implementation(FPredictedMove Move)
{
    // Validate move (anti-cheat)
    float Speed = Move.InputDirection.Size();
    if (Speed > 1.1f)  // Allow small tolerance
    {
        UE_LOG(LogNet, Warning, TEXT("Invalid move speed: %f"), Speed);
        return;
    }

    // Simulate the move on server
    FVector NewPosition = SimulateMove(Move, GetWorld()->GetDeltaSeconds());

    // Update authoritative state
    ServerState = Move;
    ServerState.ResultingPosition = NewPosition;

    // Apply on server
    GetOwner()->SetActorLocation(NewPosition);
}

void UPredictedMovementComponent::OnRep_ServerState()
{
    // When we receive server state, reconcile with our predictions
    ReconcileWithServer();
}

void UPredictedMovementComponent::ReconcileWithServer()
{
    // Find the move that matches server's timestamp
    int32 AcknowledgedMoveIndex = -1;
    for (int32 i = 0; i < PendingMoves.Num(); ++i)
    {
        if (FMath::IsNearlyEqual(PendingMoves[i].Timestamp, ServerState.Timestamp, 0.001f))
        {
            AcknowledgedMoveIndex = i;
            break;
        }
    }

    if (AcknowledgedMoveIndex < 0)
    {
        return;  // Move not found
    }

    // Check if our prediction was correct
    FVector PredictedPosition = PendingMoves[AcknowledgedMoveIndex].ResultingPosition;
    FVector ServerPosition = ServerState.ResultingPosition;
    float Error = FVector::Dist(PredictedPosition, ServerPosition);

    // Remove acknowledged and older moves
    PendingMoves.RemoveAt(0, AcknowledgedMoveIndex + 1);

    if (Error > 1.0f)  // Threshold for correction
    {
        UE_LOG(LogNet, Log, TEXT("Prediction error: %f, correcting"), Error);

        // Snap to server position
        GetOwner()->SetActorLocation(ServerPosition);

        // Replay remaining pending moves
        ReplayPendingMoves();
    }
}

void UPredictedMovementComponent::ReplayPendingMoves()
{
    for (FPredictedMove& Move : PendingMoves)
    {
        FVector NewPosition = SimulateMove(Move, GetWorld()->GetDeltaSeconds());
        Move.ResultingPosition = NewPosition;
    }

    if (PendingMoves.Num() > 0)
    {
        GetOwner()->SetActorLocation(PendingMoves.Last().ResultingPosition);
    }
}

FVector UPredictedMovementComponent::SimulateMove(const FPredictedMove& Move, float DeltaTime)
{
    FVector CurrentPosition = GetOwner()->GetActorLocation();
    float MoveSpeed = 600.0f;

    FVector NewPosition = CurrentPosition + Move.InputDirection * MoveSpeed * DeltaTime;

    // Add physics, collision, etc.

    return NewPosition;
}
```

## Best Practices

### 1. Minimize Replicated Data

```cpp
// BAD: Replicating too much data
UPROPERTY(Replicated)
TArray<FComplexStruct> HugeArray;  // Replicates entire array on any change

UPROPERTY(Replicated)
FString PlayerBiography;  // Large string rarely needed

// GOOD: Only replicate what's necessary
UPROPERTY(Replicated)
int32 Score;  // Small, frequently changing

UPROPERTY(Replicated)
uint8 TeamID;  // Use smallest appropriate type

// Use FFastArraySerializer for large arrays
UPROPERTY(Replicated)
FInventoryArray Inventory;  // Only replicates changes
```

### 2. Use Appropriate RPC Types

```cpp
// Reliable vs Unreliable decision matrix:
//
// Use RELIABLE for:
// - Critical game state changes (death, ability activation)
// - One-time events that must occur
// - UI notifications
// - Transactions (purchases, trades)
//
// Use UNRELIABLE for:
// - Frequent updates (position, rotation)
// - Non-critical feedback (footsteps, minor effects)
// - Data that will be superseded quickly
// - Anything called more than a few times per second

// RELIABLE: Player death must be seen by everyone
UFUNCTION(NetMulticast, Reliable)
void Multicast_OnPlayerDeath(APlayerState* DeadPlayer, APlayerState* Killer);

// UNRELIABLE: Footsteps can be missed without gameplay impact
UFUNCTION(NetMulticast, Unreliable)
void Multicast_PlayFootstep(FVector Location, USoundBase* Sound);
```

### 3. Validate All Client Input

```cpp
UFUNCTION(Server, Reliable, WithValidation)
void Server_UseAbility(int32 AbilityIndex, FVector TargetLocation);

bool Server_UseAbility_Validate(int32 AbilityIndex, FVector TargetLocation)
{
    // Validate ability index
    if (AbilityIndex < 0 || AbilityIndex >= Abilities.Num())
    {
        return false;
    }

    // Validate target location is reasonable
    float Distance = FVector::Dist(GetActorLocation(), TargetLocation);
    if (Distance > Abilities[AbilityIndex].MaxRange * 1.1f)  // 10% tolerance
    {
        return false;
    }

    // Validate cooldown hasn't been tampered with
    // (server tracks actual cooldown)

    return true;
}

void Server_UseAbility_Implementation(int32 AbilityIndex, FVector TargetLocation)
{
    // Additional server-side validation
    if (!CanUseAbility(AbilityIndex))
    {
        return;
    }

    // Execute ability
    ExecuteAbility(AbilityIndex, TargetLocation);
}
```

### 4. Organize Replication Logic

```cpp
// Clear separation of concerns
UCLASS()
class AOrganizedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ═══════════════════════════════════════════════════════════
    // PUBLIC INTERFACE - Called by gameplay systems
    // ═══════════════════════════════════════════════════════════

    void TakeDamage(float Amount);
    void UseAbility(int32 Index);
    void PickupItem(AActor* Item);

protected:
    // ═══════════════════════════════════════════════════════════
    // REPLICATED PROPERTIES - State that clients need
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_Health)
    float Health;

    // ═══════════════════════════════════════════════════════════
    // REP NOTIFIES - React to replicated state changes
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_Health();

    // ═══════════════════════════════════════════════════════════
    // SERVER RPCs - Client requests to server
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_UseAbility(int32 Index);

    // ═══════════════════════════════════════════════════════════
    // CLIENT RPCs - Server notifications to specific client
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void Client_OnDamageReceived(float Amount);

    // ═══════════════════════════════════════════════════════════
    // MULTICAST RPCs - Server notifications to all clients
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(NetMulticast, Unreliable)
    void Multicast_PlayEffect(UParticleSystem* Effect, FVector Location);

private:
    // ═══════════════════════════════════════════════════════════
    // INTERNAL - Non-replicated implementation details
    // ═══════════════════════════════════════════════════════════

    void Internal_ApplyDamage(float Amount);
    void Internal_ExecuteAbility(int32 Index);
};
```

### 5. Handle Network Conditions

```cpp
// Account for latency and packet loss
void ANetAwareCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        if (UNetConnection* Connection = PC->GetNetConnection())
        {
            // Get average ping
            float AvgPing = Connection->AvgLag * 1000.0f;  // Convert to ms

            // Adjust prediction/interpolation based on latency
            if (AvgPing > 150.0f)
            {
                // High latency - increase interpolation buffer
                InterpolationBuffer = 0.2f;
            }
            else if (AvgPing > 80.0f)
            {
                InterpolationBuffer = 0.1f;
            }
            else
            {
                InterpolationBuffer = 0.05f;
            }
        }
    }
}

// Implement lag compensation for hit detection
bool AWeapon::ServerPerformHitScan(FVector Start, FVector End, float ClientTimestamp)
{
    // Calculate how far back to rewind
    float CurrentTime = GetWorld()->GetTimeSeconds();
    float Latency = CurrentTime - ClientTimestamp;
    Latency = FMath::Clamp(Latency, 0.0f, MaxLagCompensation);

    // Rewind other players to where they were
    for (ACharacter* OtherPlayer : OtherPlayers)
    {
        if (UPositionHistoryComponent* History = OtherPlayer->FindComponentByClass<UPositionHistoryComponent>())
        {
            History->RewindTo(ClientTimestamp);
        }
    }

    // Perform trace
    FHitResult Hit;
    bool bHit = GetWorld()->LineTraceSingleByChannel(Hit, Start, End, ECC_Pawn);

    // Restore positions
    for (ACharacter* OtherPlayer : OtherPlayers)
    {
        if (UPositionHistoryComponent* History = OtherPlayer->FindComponentByClass<UPositionHistoryComponent>())
        {
            History->RestorePosition();
        }
    }

    return bHit;
}
```

## Common Pitfalls

### 1. Modifying Replicated Properties on Clients

```cpp
// WRONG: Client modifying replicated property
void AMyCharacter::TakeDamageLocally(float Damage)
{
    Health -= Damage;  // This won't replicate to anyone!
    // Other clients won't see the damage
    // Server will overwrite this change
}

// CORRECT: Request change from server
void AMyCharacter::TakeDamage(float Damage)
{
    if (HasAuthority())
    {
        // Server: modify directly
        Health -= Damage;
    }
    else
    {
        // Client: this shouldn't happen for damage
        // Damage should come from server
        UE_LOG(LogNet, Warning, TEXT("Client tried to apply damage locally"));
    }
}
```

### 2. Forgetting Replication Setup

```cpp
// WRONG: Property won't replicate
UPROPERTY()  // Missing Replicated specifier!
float Health;

// Also wrong: Missing GetLifetimeReplicatedProps
void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    // Forgot to add: DOREPLIFETIME(AMyActor, Health);
}

// CORRECT: Full replication setup
UPROPERTY(Replicated)
float Health;

void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMyActor, Health);
}
```

### 3. Calling RPCs from Wrong Context

```cpp
// WRONG: Calling Server RPC from server
void AMyCharacter::DoSomething()
{
    // This is wasteful - already on server!
    Server_DoSomething();
}

// WRONG: Calling Client RPC from client
void AMyCharacter::ShowMessage(const FString& Msg)
{
    // This won't work - Client RPCs go FROM server TO client
    Client_ShowMessage(Msg);
}

// CORRECT: Check context before calling RPCs
void AMyCharacter::RequestAction()
{
    if (HasAuthority())
    {
        // Already on server, execute directly
        PerformAction();
    }
    else
    {
        // On client, request from server
        Server_RequestAction();
    }
}
```

### 4. Not Handling Actor Spawn Order

```cpp
// WRONG: Assuming components exist on replication
void AMyActor::OnRep_WeaponClass()
{
    // WeaponComponent might not be replicated yet!
    WeaponComponent->SetWeapon(WeaponClass);
}

// CORRECT: Verify dependencies exist
void AMyActor::OnRep_WeaponClass()
{
    if (WeaponComponent)
    {
        WeaponComponent->SetWeapon(WeaponClass);
    }
    else
    {
        // Store for later
        PendingWeaponClass = WeaponClass;
    }
}

void AMyActor::OnRep_WeaponComponent()
{
    if (PendingWeaponClass)
    {
        WeaponComponent->SetWeapon(PendingWeaponClass);
        PendingWeaponClass = nullptr;
    }
}
```

### 5. Infinite RPC Loops

```cpp
// WRONG: Can cause infinite loop
void AMyActor::Server_SetValue_Implementation(int32 NewValue)
{
    Value = NewValue;
    Client_NotifyValueChanged(Value);  // Sends to client
}

void AMyActor::Client_NotifyValueChanged_Implementation(int32 NewValue)
{
    Server_SetValue(NewValue);  // Sends back to server - LOOP!
}

// CORRECT: Break the cycle
void AMyActor::Server_SetValue_Implementation(int32 NewValue)
{
    if (Value != NewValue)
    {
        Value = NewValue;
        // Use replicated property instead of Client RPC
        // Or use flag to prevent re-triggering
    }
}
```

### 6. Not Accounting for Relevancy

```cpp
// WRONG: Assuming actor is always relevant
void AMyActor::Multicast_PlayImportantEffect_Implementation()
{
    // If actor becomes irrelevant and then relevant again,
    // the client missed this multicast!
    PlayEffect();
}

// CORRECT: Use replicated state for important events
UPROPERTY(ReplicatedUsing = OnRep_EffectState)
bool bEffectActive;

void AMyActor::OnRep_EffectState()
{
    if (bEffectActive)
    {
        StartEffect();  // Will trigger even if we just became relevant
    }
    else
    {
        StopEffect();
    }
}
```

## Performance Considerations

### 1. Network Update Frequency

```cpp
AMyActor::AMyActor()
{
    // High frequency for fast-moving important actors
    NetUpdateFrequency = 100.0f;

    // Lower for slow/static actors
    // NetUpdateFrequency = 10.0f;

    // Minimum frequency ensures eventual updates
    MinNetUpdateFrequency = 2.0f;
}

// Dynamic frequency adjustment
void AMyActor::AdjustNetUpdateFrequency()
{
    if (IsMovingFast())
    {
        NetUpdateFrequency = 100.0f;
    }
    else if (IsIdle())
    {
        NetUpdateFrequency = 10.0f;
    }
}
```

### 2. Property Quantization

```cpp
// Reduce bandwidth with quantization
UPROPERTY(Replicated)
FVector_NetQuantize Position;  // Quantized to 1 decimal place

UPROPERTY(Replicated)
FVector_NetQuantize10 PrecisePosition;  // Quantized to 0.1

UPROPERTY(Replicated)
FVector_NetQuantize100 VeryPrecisePosition;  // Quantized to 0.01

UPROPERTY(Replicated)
FRotator_NetQuantize Rotation;  // Quantized rotation

// Custom quantization for specific needs
UPROPERTY(Replicated, meta = (ClampMin = "0", ClampMax = "100"))
uint8 HealthPercent;  // 0-100 fits in 1 byte instead of 4-byte float
```

### 3. Conditional Replication

```cpp
void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // Only replicate when actor is relevant
    DOREPLIFETIME_CONDITION(AMyActor, DetailedState, COND_SimulatedOnly);

    // Only replicate once on spawn
    DOREPLIFETIME_CONDITION(AMyActor, StaticConfig, COND_InitialOnly);

    // Custom condition
    DOREPLIFETIME_CONDITION(AMyActor, SecretData, COND_Custom);
}

void AMyActor::PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker)
{
    Super::PreReplication(ChangedPropertyTracker);

    // Custom condition: only replicate to teammates
    DOREPLIFETIME_ACTIVE_OVERRIDE(AMyActor, SecretData,
        ShouldReplicateSecretData(ChangedPropertyTracker));
}

bool AMyActor::ShouldReplicateSecretData(IRepChangedPropertyTracker& ChangedPropertyTracker)
{
    // Only replicate to teammates
    if (APawn* ViewerPawn = Cast<APawn>(GetNetConnection()->OwningActor))
    {
        return GetTeamID() == ViewerPawn->GetTeamID();
    }
    return false;
}
```

### 4. Fast Array Serialization

```cpp
// For large arrays that change frequently, use FFastArraySerializer
USTRUCT()
struct FInventoryItem : public FFastArraySerializerItem
{
    GENERATED_BODY()

    UPROPERTY()
    int32 ItemID;

    UPROPERTY()
    int32 Quantity;

    void PreReplicatedRemove(const FInventoryArray& Array);
    void PostReplicatedAdd(const FInventoryArray& Array);
    void PostReplicatedChange(const FInventoryArray& Array);
};

USTRUCT()
struct FInventoryArray : public FFastArraySerializer
{
    GENERATED_BODY()

    UPROPERTY()
    TArray<FInventoryItem> Items;

    bool NetDeltaSerialize(FNetDeltaSerializeInfo& DeltaParms)
    {
        return FFastArraySerializer::FastArrayDeltaSerialize<FInventoryItem, FInventoryArray>(
            Items, DeltaParms, *this);
    }
};

// In actor
UPROPERTY(Replicated)
FInventoryArray Inventory;
```

### 5. Bandwidth Monitoring

```cpp
// Debug network usage
void AMyGameMode::DebugNetworkBandwidth()
{
    if (UNetDriver* NetDriver = GetWorld()->GetNetDriver())
    {
        for (UNetConnection* Connection : NetDriver->ClientConnections)
        {
            // Bytes sent/received
            UE_LOG(LogNet, Log, TEXT("Connection %s: In=%d Out=%d"),
                *Connection->LowLevelGetRemoteAddress(),
                Connection->InBytesPerSecond,
                Connection->OutBytesPerSecond);

            // Packet loss
            UE_LOG(LogNet, Log, TEXT("  Packet Loss: In=%.2f%% Out=%.2f%%"),
                Connection->InPacketsLost * 100.0f / FMath::Max(1, Connection->InPackets),
                Connection->OutPacketsLost * 100.0f / FMath::Max(1, Connection->OutPackets));
        }
    }
}
```

## Real-World Scenarios

### Competitive Shooter Netcode

```cpp
// Lag compensation for hit registration
UCLASS()
class ACompetitiveWeapon : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(Server, Reliable, WithValidation)
    void Server_FireWeapon(FVector_NetQuantize MuzzleLocation,
                           FVector_NetQuantize AimDirection,
                           float ClientTimestamp);

protected:
    void Server_FireWeapon_Implementation(FVector_NetQuantize MuzzleLocation,
                                          FVector_NetQuantize AimDirection,
                                          float ClientTimestamp)
    {
        // Validate timestamp isn't too far in the past
        float ServerTime = GetWorld()->GetTimeSeconds();
        float Latency = ServerTime - ClientTimestamp;

        if (Latency > MaxLagCompensation)
        {
            Latency = MaxLagCompensation;
            ClientTimestamp = ServerTime - MaxLagCompensation;
        }

        // Rewind all players to client's perceived time
        TArray<FTransform> OriginalTransforms;
        for (ACharacter* Player : AllPlayers)
        {
            OriginalTransforms.Add(Player->GetActorTransform());

            if (ULagCompensationComponent* LagComp = Player->FindComponentByClass<ULagCompensationComponent>())
            {
                FTransform HistoricalTransform = LagComp->GetTransformAtTime(ClientTimestamp);
                Player->SetActorTransform(HistoricalTransform);
            }
        }

        // Perform hit scan
        FHitResult Hit;
        FVector End = MuzzleLocation + AimDirection * WeaponRange;

        FCollisionQueryParams Params;
        Params.AddIgnoredActor(GetOwner());

        bool bHit = GetWorld()->LineTraceSingleByChannel(Hit, MuzzleLocation, End, ECC_Pawn, Params);

        // Restore all players
        int32 Index = 0;
        for (ACharacter* Player : AllPlayers)
        {
            Player->SetActorTransform(OriginalTransforms[Index++]);
        }

        // Apply damage if hit
        if (bHit)
        {
            if (ACharacter* HitCharacter = Cast<ACharacter>(Hit.GetActor()))
            {
                // Apply damage
                float Damage = CalculateDamage(Hit);
                UGameplayStatics::ApplyDamage(HitCharacter, Damage, GetOwner()->GetInstigatorController(), this, nullptr);
            }
        }

        // Replicate the shot to all clients
        Multicast_OnWeaponFired(MuzzleLocation, AimDirection, Hit.Location, bHit);
    }

    bool Server_FireWeapon_Validate(FVector_NetQuantize MuzzleLocation,
                                    FVector_NetQuantize AimDirection,
                                    float ClientTimestamp)
    {
        // Validate muzzle location is near owner
        if (FVector::DistSquared(GetOwner()->GetActorLocation(), MuzzleLocation) > FMath::Square(200.0f))
        {
            return false;  // Suspicious - disconnect client
        }

        // Validate direction is normalized
        if (!AimDirection.IsNormalized())
        {
            return false;
        }

        return true;
    }

    UFUNCTION(NetMulticast, Unreliable)
    void Multicast_OnWeaponFired(FVector_NetQuantize MuzzleLocation,
                                 FVector_NetQuantize AimDirection,
                                 FVector_NetQuantize HitLocation,
                                 bool bHit);

private:
    float MaxLagCompensation = 0.2f;  // 200ms max
    float WeaponRange = 10000.0f;
};
```

### MMO-Style Zone Transitions

```cpp
// Seamless travel between zones
UCLASS()
class AZoneManager : public AActor
{
    GENERATED_BODY()

public:
    void RequestZoneTransition(APlayerController* PC, FName TargetZone)
    {
        if (!HasAuthority()) return;

        // Save player state
        if (AMyPlayerState* PS = PC->GetPlayerState<AMyPlayerState>())
        {
            FPlayerSaveData SaveData;
            SaveData.Health = PS->GetHealth();
            SaveData.Inventory = PS->GetInventory();
            SaveData.Position = PC->GetPawn()->GetActorLocation();

            // Store in game instance or persistent storage
            SavePlayerData(PC, SaveData);
        }

        // Notify client to prepare for transition
        Client_PrepareForZoneTransition(PC, TargetZone);

        // Initiate seamless travel
        FString TravelURL = GetTravelURL(TargetZone);
        PC->ClientTravel(TravelURL, TRAVEL_Absolute, true);
    }

    UFUNCTION(Client, Reliable)
    void Client_PrepareForZoneTransition(APlayerController* PC, FName TargetZone)
    {
        // Show loading screen
        // Disable input
        // Play transition effect
    }

    void RestorePlayerInZone(APlayerController* PC)
    {
        if (!HasAuthority()) return;

        // Retrieve saved data
        FPlayerSaveData SaveData = LoadPlayerData(PC);

        // Apply to player state
        if (AMyPlayerState* PS = PC->GetPlayerState<AMyPlayerState>())
        {
            PS->SetHealth(SaveData.Health);
            PS->SetInventory(SaveData.Inventory);
        }

        // Spawn at appropriate location
        FVector SpawnLocation = GetZoneEntryPoint(CurrentZone);
        if (APawn* Pawn = PC->GetPawn())
        {
            Pawn->SetActorLocation(SpawnLocation);
        }

        // Notify client transition complete
        Client_ZoneTransitionComplete(PC);
    }

    UFUNCTION(Client, Reliable)
    void Client_ZoneTransitionComplete(APlayerController* PC)
    {
        // Hide loading screen
        // Re-enable input
    }
};
```

### Real-Time Strategy Unit Synchronization

```cpp
// Efficient replication for many units
UCLASS()
class ARTSUnit : public APawn
{
    GENERATED_BODY()

public:
    ARTSUnit()
    {
        bReplicates = true;

        // RTS units update less frequently
        NetUpdateFrequency = 20.0f;
        MinNetUpdateFrequency = 5.0f;

        // Priority based on selection/visibility
        NetPriority = 1.0f;
    }

    virtual float GetNetPriority(const FVector& ViewPos, const FVector& ViewDir,
                                 AActor* Viewer, AActor* ViewTarget,
                                 UActorChannel* InChannel, float Time,
                                 bool bLowBandwidth) override
    {
        float Priority = Super::GetNetPriority(ViewPos, ViewDir, Viewer, ViewTarget, InChannel, Time, bLowBandwidth);

        // Increase priority for selected units
        if (bIsSelected)
        {
            Priority *= 3.0f;
        }

        // Increase priority for units in combat
        if (bInCombat)
        {
            Priority *= 2.0f;
        }

        // Decrease priority for units far from camera
        float Distance = FVector::Dist(GetActorLocation(), ViewPos);
        if (Distance > 5000.0f)
        {
            Priority *= 0.5f;
        }

        return Priority;
    }

    virtual bool IsNetRelevantFor(const AActor* RealViewer, const AActor* ViewTarget,
                                  const FVector& SrcLocation) const override
    {
        // Units are relevant based on fog of war
        if (ARTSPlayerController* RTSPC = Cast<ARTSPlayerController>(RealViewer))
        {
            return RTSPC->CanSeeLocation(GetActorLocation());
        }
        return Super::IsNetRelevantFor(RealViewer, ViewTarget, SrcLocation);
    }

protected:
    UPROPERTY(Replicated)
    bool bIsSelected;

    UPROPERTY(Replicated)
    bool bInCombat;

    // Use command queue replication for orders
    UPROPERTY(ReplicatedUsing = OnRep_CommandQueue)
    TArray<FUnitCommand> CommandQueue;

    UFUNCTION()
    void OnRep_CommandQueue()
    {
        // Execute commands locally
        ProcessCommandQueue();
    }
};

// Batch command system for multiple units
UCLASS()
class ARTSPlayerController : public APlayerController
{
    GENERATED_BODY()

public:
    void IssueCommandToUnits(const TArray<ARTSUnit*>& Units, const FUnitCommand& Command)
    {
        // Send single RPC with all unit IDs instead of per-unit RPCs
        TArray<int32> UnitIDs;
        for (ARTSUnit* Unit : Units)
        {
            UnitIDs.Add(Unit->GetUniqueID());
        }

        Server_BatchCommand(UnitIDs, Command);
    }

    UFUNCTION(Server, Reliable)
    void Server_BatchCommand(const TArray<int32>& UnitIDs, FUnitCommand Command)
    {
        for (int32 UnitID : UnitIDs)
        {
            if (ARTSUnit* Unit = FindUnitByID(UnitID))
            {
                if (OwnsUnit(Unit))
                {
                    Unit->AddCommand(Command);
                }
            }
        }
    }
};
```

## Interview Key Points

### Fundamental Questions

1. **What is the difference between Property Replication and RPCs?**
   - Property replication: Automatic state synchronization from server to clients. Changes are detected and sent automatically. Good for persistent state.
   - RPCs: Explicit function calls across the network. Can go in any direction (Server, Client, Multicast). Good for events and commands.

2. **Explain the three network roles in Unreal.**
   - Authority: Owns the definitive state (usually server). Can modify replicated properties.
   - Autonomous Proxy: Client's own pawn. Can predict locally.
   - Simulated Proxy: Other players' pawns on client. Only receives state.

3. **When should you use Reliable vs Unreliable RPCs?**
   - Reliable: Critical events that must be received (death, ability activation, purchases). Guaranteed delivery, ordered.
   - Unreliable: Frequent updates (position), cosmetic effects. May be dropped but faster.

4. **What is relevancy and why is it important?**
   - Relevancy determines which actors replicate to which clients
   - Saves bandwidth by not sending data about distant/hidden actors
   - Critical for large-scale games

### Advanced Questions

5. **How does lag compensation work in shooters?**
   - Server stores position history for all players
   - When processing a shot, rewind players to client's perceived time
   - Perform hit detection against historical positions
   - Restore positions and apply results

6. **Explain the Network Prediction system.**
   - Client predicts movement locally for responsiveness
   - Sends inputs to server
   - Server simulates and sends authoritative state
   - Client reconciles: if prediction was wrong, snap to server and replay pending inputs

7. **How would you optimize replication for 100+ players?**
   - Use relevancy to limit replicated actors
   - Reduce NetUpdateFrequency for distant/inactive actors
   - Use property conditions (COND_OwnerOnly, etc.)
   - Quantize vectors and rotations
   - Use FFastArraySerializer for large arrays
   - Implement interest management/area of interest systems

8. **What security considerations exist in networking?**
   - Never trust client data - always validate
   - Use _Validate functions to detect cheaters
   - Keep authoritative state on server
   - Don't send sensitive data to clients who shouldn't see it
   - Implement server-side cooldowns and rate limiting

## Further Reading

### Official Documentation
- [Unreal Engine Networking Overview](https://docs.unrealengine.com/en-US/InteractiveExperiences/Networking/Overview/)
- [Actor Replication](https://docs.unrealengine.com/en-US/InteractiveExperiences/Networking/Actors/)
- [RPCs and Replication](https://docs.unrealengine.com/en-US/InteractiveExperiences/Networking/Actors/RPCs/)
- [Network Tips and Tricks](https://docs.unrealengine.com/en-US/InteractiveExperiences/Networking/Tips/)

### Advanced Resources
- [Unreal Engine Network Compendium](https://cedric-neukirchen.net/Downloads/Compendium/UE4_Network_Compendium_by_Cedric_eXi_Neukirchen.pdf)
- [Gaffer On Games - Networked Physics](https://gafferongames.com/categories/networked-physics/)
- [Gabriel Gambetta - Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)

### Source Code Study
- `Engine/Source/Runtime/Engine/Classes/GameFramework/Actor.h` - Replication setup
- `Engine/Source/Runtime/Engine/Private/Actor.cpp` - GetLifetimeReplicatedProps
- `Engine/Source/Runtime/Engine/Private/NetDriver.cpp` - Network driver implementation
- `Engine/Source/Runtime/Engine/Classes/Engine/NetSerialization.h` - Net serialization utilities

### Video Resources
- Unreal Engine - Multiplayer Framework Deep Dive
- GDC Talks on Network Programming
- Unreal Slackers Discord - Networking channel

### Related Topics
- Character Movement Network Prediction
- Gameplay Ability System Networking
- Dedicated Server Architecture
- Steam/EOS Online Subsystems
