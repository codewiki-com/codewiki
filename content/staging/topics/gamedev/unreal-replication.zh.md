---
title: 虚幻引擎复制系统深度剖析
description: 全面解析虚幻引擎的网络复制系统，涵盖属性复制、RPC、相关性及高级多人游戏模式
track: gamedev
section: unreal
difficulty: intermediate
tags: []
status: imported
origin: old/src/content/docs/gamedev/unreal-replication.zh.md
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

虚幻引擎的复制系统是UE4/UE5多人游戏开发的基础。它提供了一个健壮、经过实战检验的框架，用于在网络客户端之间同步游戏状态，采用基于权威的架构。理解复制系统对于构建可扩展、高性能的多人游戏体验至关重要。

## 概念解释

### 什么是复制？

虚幻引擎中的复制是指将Actor状态从服务器同步到已连接客户端的过程。这是一种单向数据流，权威服务器将状态更改推送给客户端，确保所有游戏实例的一致性。

### 客户端-服务器模型

虚幻使用严格的客户端-服务器架构：

```
┌─────────────────────────────────────────────────────────────┐
│                        权威服务器                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     游戏状态                         │    │
│  │  - 所有Actor的位置、生命值、物品栏                    │    │
│  │  - 物理模拟（权威）                                  │    │
│  │  - 游戏规则和验证                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                           │                                  │
│              复制（属性更新 + RPC）                          │
│                           ▼                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ 客户端1  │    │ 客户端2  │    │ 客户端3  │              │
│  │ （代理） │    │ （代理） │    │ （代理） │              │
│  └──────────┘    └──────────┘    └──────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 关键术语

| 术语 | 描述 |
|------|------|
| **Authority（权威）** | 拥有Actor确定性状态的实例（通常是服务器） |
| **Autonomous Proxy（自主代理）** | 客户端对自己Pawn的表示（可以本地预测） |
| **Simulated Proxy（模拟代理）** | 客户端对其他玩家Pawn的表示 |
| **Net Role（网络角色）** | 定义Actor的网络行为（Authority、AutonomousProxy、SimulatedProxy） |
| **Relevancy（相关性）** | 决定哪些Actor应该复制到哪些客户端 |
| **Net Priority（网络优先级）** | Actor相对于带宽分配的重要性 |

### 为什么复制很重要

```cpp
// 没有正确理解复制，你可能会写：
void AMyCharacter::TakeDamage(float Damage)
{
    Health -= Damage;  // 只在一台机器上改变！
    if (Health <= 0)
    {
        Die();  // 其他玩家看不到这个
    }
}

// 正确的复制方式：
void AMyCharacter::TakeDamage(float Damage)
{
    if (HasAuthority())  // 只有服务器修改生命值
    {
        Health -= Damage;  // 被复制的属性
        if (Health <= 0)
        {
            MulticastDie();  // 所有客户端都看到死亡
        }
    }
}
```

## 核心原理

### 1. 服务器权威

服务器是游戏状态的唯一真相来源：

```cpp
UCLASS()
class AGameCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // 服务器权威的生命值
    UPROPERTY(ReplicatedUsing = OnRep_Health)
    float Health;

    void ApplyDamage(float Damage)
    {
        // 关键：在修改复制状态之前始终检查权威
        if (!HasAuthority())
        {
            return;  // 客户端不能直接修改
        }

        Health = FMath::Max(0.0f, Health - Damage);
        // OnRep_Health 会在客户端自动调用
    }

    UFUNCTION()
    void OnRep_Health()
    {
        // 当Health复制时在客户端调用
        UpdateHealthBar();

        if (Health <= 0)
        {
            PlayDeathEffects();  // 仅视觉反馈
        }
    }
};
```

### 2. 属性复制流程

```
┌─────────────────────────────────────────────────────────────┐
│                       复制管线                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. 服务器标记属性为脏                                        │
│     └── Health = 50.0f;                                     │
│                                                              │
│  2. 复制驱动器收集脏属性                                      │
│     └── 在网络tick期间，收集已更改的复制属性                   │
│                                                              │
│  3. 相关性检查                                               │
│     └── 这个Actor与这个客户端相关吗？                         │
│                                                              │
│  4. 优先级排序                                               │
│     └── 更高优先级的Actor先复制                               │
│                                                              │
│  5. 带宽分配                                                 │
│     └── 在可用带宽内适配更新                                  │
│                                                              │
│  6. 序列化和传输                                              │
│     └── 打包数据并通过网络发送                                │
│                                                              │
│  7. 客户端接收并反序列化                                      │
│     └── 解包属性值                                           │
│                                                              │
│  8. OnRep 回调（如果定义了）                                  │
│     └── 使用新值调用 OnRep_Health()                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. 网络角色

理解角色对于正确的复制逻辑至关重要：

```cpp
void AMyActor::DebugNetworkRole()
{
    ENetRole LocalRole = GetLocalRole();
    ENetRole RemoteRole = GetRemoteRole();

    // LocalRole 告诉你这个Actor在这台机器上是什么
    // RemoteRole 告诉你它在另一端是什么

    switch (LocalRole)
    {
    case ROLE_Authority:
        // 这台机器拥有这个Actor（通常是服务器）
        // 可以修改复制属性
        UE_LOG(LogNet, Log, TEXT("我是权威"));
        break;

    case ROLE_AutonomousProxy:
        // 这是拥有客户端的Pawn
        // 可以执行客户端预测
        UE_LOG(LogNet, Log, TEXT("我是自主代理（我的Pawn）"));
        break;

    case ROLE_SimulatedProxy:
        // 这是我客户端上的另一个玩家的Pawn
        // 只接收复制状态
        UE_LOG(LogNet, Log, TEXT("我是模拟代理（其他玩家）"));
        break;

    case ROLE_None:
        // 不复制
        UE_LOG(LogNet, Log, TEXT("不是网络Actor"));
        break;
    }
}
```

### 4. 条件复制

并非所有属性都需要发送给所有客户端：

```cpp
// 在头文件中
UPROPERTY(Replicated)
float PublicScore;  // 每个人都能看到

UPROPERTY(Replicated)
int32 SecretAmmo;   // 只有拥有者应该看到

// 在 GetLifetimeReplicatedProps 中
void AMyCharacter::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // 复制给所有人
    DOREPLIFETIME(AMyCharacter, PublicScore);

    // 只复制给拥有者（防止作弊）
    DOREPLIFETIME_CONDITION(AMyCharacter, SecretAmmo, COND_OwnerOnly);
}
```

### 5. 复制条件

```cpp
// 可用条件：
COND_None               // 复制给所有人
COND_InitialOnly        // 仅在初始复制时
COND_OwnerOnly          // 仅给Actor的拥有者
COND_SkipOwner          // 给除拥有者外的所有人
COND_SimulatedOnly      // 仅给模拟代理
COND_AutonomousOnly     // 仅给自主代理
COND_SimulatedOrPhysics // 模拟或启用物理
COND_InitialOrOwner     // 初始复制或拥有者
COND_Custom             // 通过回调自定义条件
COND_ReplayOrOwner      // 回放或拥有者
COND_ReplayOnly         // 仅回放系统
COND_SimulatedOnlyNoReplay  // 模拟，无回放
COND_SkipReplay         // 跳过回放系统
COND_Never              // 从不复制（文档用途）
```

## 核心概念

### 属性复制

状态同步的基础：

```cpp
UCLASS()
class ANetworkedActor : public AActor
{
    GENERATED_BODY()

public:
    ANetworkedActor()
    {
        // 为这个Actor启用复制
        bReplicates = true;

        // 检查复制的频率（以秒为单位）
        NetUpdateFrequency = 100.0f;  // 每秒检查100次

        // 复制之间的最小时间
        MinNetUpdateFrequency = 2.0f;  // 至少每0.5秒

        // 即使最近未渲染也始终复制
        bAlwaysRelevant = false;
    }

    // 基本复制属性
    UPROPERTY(Replicated)
    int32 SimpleCounter;

    // 带通知回调的复制
    UPROPERTY(ReplicatedUsing = OnRep_TeamColor)
    FLinearColor TeamColor;

    // 复制结构体
    UPROPERTY(Replicated)
    FCharacterStats Stats;

protected:
    UFUNCTION()
    void OnRep_TeamColor()
    {
        // 当团队颜色改变时更新材质
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

### 远程过程调用（RPC）

RPC 使服务器和客户端之间的通信成为可能：

```cpp
UCLASS()
class ANetworkedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ═══════════════════════════════════════════════════════════
    // 服务器 RPC - 在客户端调用，在服务器执行
    // ═══════════════════════════════════════════════════════════

    // 可靠：保证投递，有序
    UFUNCTION(Server, Reliable, WithValidation)
    void ServerRequestAbility(int32 AbilityID);

    void ServerRequestAbility_Implementation(int32 AbilityID)
    {
        // 在服务器上验证并执行
        if (CanUseAbility(AbilityID))
        {
            ExecuteAbility(AbilityID);
            // 通知所有客户端
            MulticastPlayAbilityEffects(AbilityID);
        }
    }

    bool ServerRequestAbility_Validate(int32 AbilityID)
    {
        // 返回false会断开作弊客户端的连接
        return AbilityID >= 0 && AbilityID < MaxAbilities;
    }

    // 不可靠：可能被丢弃，更快
    UFUNCTION(Server, Unreliable)
    void ServerUpdateAimRotation(FRotator AimRotation);

    void ServerUpdateAimRotation_Implementation(FRotator AimRotation)
    {
        // 更新瞄准让其他客户端看到
        CurrentAimRotation = AimRotation;
    }

    // ═══════════════════════════════════════════════════════════
    // 客户端 RPC - 在服务器调用，在拥有客户端执行
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void ClientReceiveMessage(const FString& Message);

    void ClientReceiveMessage_Implementation(const FString& Message)
    {
        // 在拥有客户端的HUD上显示消息
        if (APlayerController* PC = Cast<APlayerController>(GetController()))
        {
            // 显示消息
        }
    }

    UFUNCTION(Client, Unreliable)
    void ClientPlayHitReaction(FVector HitLocation, float Damage);

    void ClientPlayHitReaction_Implementation(FVector HitLocation, float Damage)
    {
        // 播放屏幕震动、闪烁等
        PlayHitEffects(HitLocation, Damage);
    }

    // ═══════════════════════════════════════════════════════════
    // 多播 RPC - 在服务器调用，在所有客户端执行
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(NetMulticast, Reliable)
    void MulticastPlayAbilityEffects(int32 AbilityID);

    void MulticastPlayAbilityEffects_Implementation(int32 AbilityID)
    {
        // 在所有机器上播放VFX/SFX
        SpawnAbilityParticles(AbilityID);
        PlayAbilitySound(AbilityID);
    }

    UFUNCTION(NetMulticast, Unreliable)
    void MulticastPlayFootstep(FVector Location);

    void MulticastPlayFootstep_Implementation(FVector Location)
    {
        // 次要效果，不可靠即可
        PlayFootstepSound(Location);
    }
};
```

### Actor 所有权

所有权决定RPC路由和复制过滤：

```cpp
// 设置所有权
void AMyGameMode::SpawnPlayerCharacter(APlayerController* PC)
{
    FActorSpawnParameters SpawnParams;
    SpawnParams.Owner = PC;  // PC拥有角色

    AMyCharacter* Character = GetWorld()->SpawnActor<AMyCharacter>(
        CharacterClass,
        SpawnLocation,
        SpawnRotation,
        SpawnParams
    );

    // 替代方案：在生成后设置所有者
    Character->SetOwner(PC);

    // 对于Pawn，使用Possess来处理所有权
    PC->Possess(Character);
}

// 检查所有权
void AMyCharacter::CheckOwnership()
{
    // 获取拥有连接
    if (AActor* Owner = GetOwner())
    {
        if (APlayerController* PC = Cast<APlayerController>(Owner))
        {
            // 这个角色由一个玩家拥有
        }
    }

    // 检查本地玩家是否拥有这个
    if (IsLocallyControlled())
    {
        // 这是我们的Pawn
    }

    // 检查这台机器是否有权威
    if (HasAuthority())
    {
        // 我们是服务器或这是一个非复制Actor
    }
}
```

### Actor 通道和连接

```cpp
// 理解Actor通道
void DebugActorChannel(AActor* Actor)
{
    if (UNetDriver* NetDriver = Actor->GetWorld()->GetNetDriver())
    {
        for (UNetConnection* Connection : NetDriver->ClientConnections)
        {
            UActorChannel* Channel = Connection->FindActorChannelRef(Actor);
            if (Channel)
            {
                UE_LOG(LogNet, Log, TEXT("Actor %s 有通道连接到 %s"),
                    *Actor->GetName(),
                    *Connection->LowLevelGetRemoteAddress());
            }
        }
    }
}
```

### 相关性系统

控制哪些Actor复制到哪些客户端：

```cpp
UCLASS()
class ARelevancyControlledActor : public AActor
{
    GENERATED_BODY()

public:
    // 重写相关性判断
    virtual bool IsNetRelevantFor(
        const AActor* RealViewer,
        const AActor* ViewTarget,
        const FVector& SrcLocation) const override
    {
        // 始终与拥有者相关
        if (RealViewer == GetOwner())
        {
            return true;
        }

        // 基于距离的相关性
        float DistSq = FVector::DistSquared(GetActorLocation(), SrcLocation);

        // 自定义相关性半径
        if (DistSq > FMath::Square(RelevancyRadius))
        {
            return false;
        }

        // 潜行游戏的视线检查
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
                return false;  // 被阻挡，不相关
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

### 网络优先级

基于重要性的带宽分配：

```cpp
UCLASS()
class APrioritizedActor : public AActor
{
    GENERATED_BODY()

public:
    APrioritizedActor()
    {
        // 基础优先级（1.0是默认值）
        NetPriority = 2.0f;  // 比默认重要两倍
    }

    // 基于游戏状态的动态优先级
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

        // 战斗中增加优先级
        if (bInCombat)
        {
            Priority *= 2.0f;
        }

        // 如果最近未更新则增加优先级
        if (Time > 0.5f)
        {
            Priority *= (1.0f + Time);
        }

        // 降低远距离Actor的优先级
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

## 代码示例

### 完整的多人角色

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
    // 公共接口
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

    // 由伤害系统调用
    void ReceiveDamage(float Damage, AController* InstigatorController, AActor* DamageCauser);

protected:
    // ═══════════════════════════════════════════════════════════
    // 复制属性
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_CharacterState)
    FCharacterState CharacterState;

    UPROPERTY(Replicated)
    FRotator AimRotation;

    UPROPERTY(ReplicatedUsing = OnRep_CurrentWeapon)
    TSubclassOf<class AWeapon> CurrentWeaponClass;

    // ═══════════════════════════════════════════════════════════
    // 复制回调
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_CharacterState();

    UFUNCTION()
    void OnRep_CurrentWeapon();

    // ═══════════════════════════════════════════════════════════
    // 服务器 RPC
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
    // 客户端 RPC
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void Client_OnDamageReceived(float Damage, FVector HitLocation);
    void Client_OnDamageReceived_Implementation(float Damage, FVector HitLocation);

    UFUNCTION(Client, Reliable)
    void Client_OnDeath(AController* KillerController);
    void Client_OnDeath_Implementation(AController* KillerController);

    // ═══════════════════════════════════════════════════════════
    // 多播 RPC
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
    // 内部辅助函数
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

    // 复制给所有人
    DOREPLIFETIME(ANetworkedCharacter, AimRotation);
    DOREPLIFETIME(ANetworkedCharacter, CurrentWeaponClass);

    // 生命值/状态只给拥有者（反作弊）
    DOREPLIFETIME_CONDITION(ANetworkedCharacter, CharacterState, COND_OwnerOnly);
}

void ANetworkedCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // 向服务器发送瞄准更新（仅自主代理）
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
// 公共接口
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::RequestAttack()
{
    if (IsDead()) return;

    float CurrentTime = GetWorld()->GetTimeSeconds();
    if (CurrentTime - LastAttackTime < AttackCooldown) return;

    // 获取瞄准位置
    FVector AimLocation = GetActorLocation() + GetControlRotation().Vector() * 10000.0f;

    if (HasAuthority())
    {
        // 服务器 - 直接执行
        PerformAttack(AimLocation);
    }
    else
    {
        // 客户端 - 请求服务器
        Server_RequestAttack(AimLocation);

        // 本地预测以提高响应性
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
        // 本地预测
        GetCharacterMovement()->MaxWalkSpeed = bSprint ? 1200.0f : 600.0f;
    }
}

void ANetworkedCharacter::ReceiveDamage(float Damage, AController* InstigatorController, AActor* DamageCauser)
{
    // 只有服务器处理伤害
    if (!HasAuthority()) return;

    // 应用护甲减免
    float ActualDamage = Damage;
    if (CharacterState.Armor > 0)
    {
        float ArmorAbsorb = FMath::Min(CharacterState.Armor, Damage * 0.5f);
        CharacterState.Armor -= ArmorAbsorb;
        ActualDamage = Damage - ArmorAbsorb;
    }

    CharacterState.Health = FMath::Max(0.0f, CharacterState.Health - ActualDamage);

    // 通知拥有客户端
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        FVector HitLocation = DamageCauser ? DamageCauser->GetActorLocation() : GetActorLocation();
        Client_OnDamageReceived(ActualDamage, HitLocation);
    }

    // 检查死亡
    if (CharacterState.Health <= 0.0f)
    {
        Die(InstigatorController);
    }
}

// ═══════════════════════════════════════════════════════════════
// 复制回调
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::OnRep_CharacterState()
{
    UpdateHealthUI();
    UpdateAmmoUI();

    // 根据冲刺状态更新移动速度
    if (GetCharacterMovement())
    {
        GetCharacterMovement()->MaxWalkSpeed = CharacterState.bIsSprinting ? 1200.0f : 600.0f;
    }
}

void ANetworkedCharacter::OnRep_CurrentWeapon()
{
    // 生成/更新武器视觉效果
    if (CurrentWeaponClass && !CurrentWeaponActor)
    {
        // 生成装饰性武器Actor
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
// 服务器 RPC 实现
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
    // 基本验证 - 瞄准位置应该合理
    float Distance = FVector::Dist(GetActorLocation(), AimLocation);
    return Distance < 50000.0f;  // 最大500米
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
// 客户端 RPC 实现
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::Client_OnDamageReceived_Implementation(float Damage, FVector HitLocation)
{
    // 播放受击指示器、屏幕震动等
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        PC->ClientStartCameraShake(DamageShakeClass);

        // 显示伤害方向指示器
        FVector Direction = (HitLocation - GetActorLocation()).GetSafeNormal();
        // 更新HUD方向
    }
}

void ANetworkedCharacter::Client_OnDeath_Implementation(AController* KillerController)
{
    // 显示死亡画面、击杀者信息等
    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        // 显示重生UI
    }
}

// ═══════════════════════════════════════════════════════════════
// 多播 RPC 实现
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::Multicast_PlayAttackEffects_Implementation(FVector MuzzleLocation, FRotator MuzzleRotation)
{
    // 如果是专用服务器则跳过
    if (IsNetMode(NM_DedicatedServer)) return;

    // 播放枪口闪光
    UGameplayStatics::SpawnEmitterAtLocation(GetWorld(), MuzzleFlashParticle, MuzzleLocation, MuzzleRotation);

    // 播放声音
    UGameplayStatics::PlaySoundAtLocation(GetWorld(), AttackSound, MuzzleLocation);

    // 播放动画
    if (GetMesh() && AttackMontage)
    {
        GetMesh()->GetAnimInstance()->Montage_Play(AttackMontage);
    }
}

void ANetworkedCharacter::Multicast_OnDeath_Implementation()
{
    // 专用服务器跳过
    if (IsNetMode(NM_DedicatedServer)) return;

    // 播放死亡动画
    if (GetMesh() && DeathMontage)
    {
        GetMesh()->GetAnimInstance()->Montage_Play(DeathMontage);
    }

    // 布娃娃
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
// 内部辅助函数
// ═══════════════════════════════════════════════════════════════

void ANetworkedCharacter::PerformAttack(FVector AimLocation)
{
    check(HasAuthority());

    if (CharacterState.Ammo <= 0) return;

    CharacterState.Ammo--;

    // 执行射线检测
    FHitResult Hit;
    FCollisionQueryParams Params;
    Params.AddIgnoredActor(this);

    FVector Start = GetActorLocation() + FVector(0, 0, 50);  // 眼睛高度

    if (GetWorld()->LineTraceSingleByChannel(Hit, Start, AimLocation, ECC_GameTraceChannel1, Params))
    {
        if (ANetworkedCharacter* HitCharacter = Cast<ANetworkedCharacter>(Hit.GetActor()))
        {
            HitCharacter->ReceiveDamage(25.0f, GetController(), this);
        }
    }

    // 通知所有客户端关于攻击
    Multicast_PlayAttackEffects(Start, (AimLocation - Start).Rotation());
}

void ANetworkedCharacter::PerformReload()
{
    check(HasAuthority());

    CharacterState.Ammo = 30;  // 满弹匣
    Multicast_PlayReloadAnimation();
}

void ANetworkedCharacter::Die(AController* KillerController)
{
    check(HasAuthority());

    // 通知拥有客户端
    Client_OnDeath(KillerController);

    // 通知所有客户端播放死亡效果
    Multicast_OnDeath();

    // 禁用碰撞
    SetActorEnableCollision(false);

    // 重生计时器（由游戏模式处理）
    if (AGameModeBase* GM = GetWorld()->GetAuthGameMode())
    {
        // GM->HandlePlayerDeath(this, KillerController);
    }
}

void ANetworkedCharacter::UpdateHealthUI()
{
    // 更新本地HUD
}

void ANetworkedCharacter::UpdateAmmoUI()
{
    // 更新本地HUD
}
```

### 复制物品栏系统

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
    // 公共接口
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
    // 复制状态
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_Items)
    TArray<FInventoryItem> Items;

    UPROPERTY(EditAnywhere, Category = "Inventory")
    int32 MaxSlots = 20;

    // ═══════════════════════════════════════════════════════════
    // 复制回调
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_Items();

    // ═══════════════════════════════════════════════════════════
    // 服务器 RPC
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
```

### 网络预测示例

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
    // 服务器权威状态
    UPROPERTY(ReplicatedUsing = OnRep_ServerState)
    FPredictedMove ServerState;

    UFUNCTION()
    void OnRep_ServerState();

    UFUNCTION(Server, Unreliable)
    void Server_SendMove(FPredictedMove Move);
    void Server_SendMove_Implementation(FPredictedMove Move);

private:
    // 客户端预测
    TArray<FPredictedMove> PendingMoves;
    float LastMoveTimestamp = 0.0f;

    FVector SimulateMove(const FPredictedMove& Move, float DeltaTime);
    void ReconcileWithServer();
    void ReplayPendingMoves();
};

// PredictedMovementComponent.cpp
void UPredictedMovementComponent::ReconcileWithServer()
{
    // 找到与服务器时间戳匹配的移动
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
        return;  // 未找到移动
    }

    // 检查我们的预测是否正确
    FVector PredictedPosition = PendingMoves[AcknowledgedMoveIndex].ResultingPosition;
    FVector ServerPosition = ServerState.ResultingPosition;
    float Error = FVector::Dist(PredictedPosition, ServerPosition);

    // 移除已确认的和更旧的移动
    PendingMoves.RemoveAt(0, AcknowledgedMoveIndex + 1);

    if (Error > 1.0f)  // 纠正阈值
    {
        UE_LOG(LogNet, Log, TEXT("预测误差: %f，正在纠正"), Error);

        // 吸附到服务器位置
        GetOwner()->SetActorLocation(ServerPosition);

        // 重放剩余的待处理移动
        ReplayPendingMoves();
    }
}
```

## 最佳实践

### 1. 最小化复制数据

```cpp
// 错误：复制过多数据
UPROPERTY(Replicated)
TArray<FComplexStruct> HugeArray;  // 任何更改都会复制整个数组

UPROPERTY(Replicated)
FString PlayerBiography;  // 很少需要的大字符串

// 正确：只复制必要的
UPROPERTY(Replicated)
int32 Score;  // 小，经常更改

UPROPERTY(Replicated)
uint8 TeamID;  // 使用最小的适当类型

// 对大数组使用 FFastArraySerializer
UPROPERTY(Replicated)
FInventoryArray Inventory;  // 只复制更改
```

### 2. 使用适当的RPC类型

```cpp
// 可靠 vs 不可靠决策矩阵：
//
// 使用可靠（RELIABLE）：
// - 关键游戏状态更改（死亡、技能激活）
// - 必须发生的一次性事件
// - UI通知
// - 交易（购买、贸易）
//
// 使用不可靠（UNRELIABLE）：
// - 频繁更新（位置、旋转）
// - 非关键反馈（脚步声、次要效果）
// - 将很快被取代的数据
// - 每秒调用超过几次的任何东西

// 可靠：玩家死亡必须被所有人看到
UFUNCTION(NetMulticast, Reliable)
void Multicast_OnPlayerDeath(APlayerState* DeadPlayer, APlayerState* Killer);

// 不可靠：脚步声可以在不影响游戏性的情况下错过
UFUNCTION(NetMulticast, Unreliable)
void Multicast_PlayFootstep(FVector Location, USoundBase* Sound);
```

### 3. 验证所有客户端输入

```cpp
UFUNCTION(Server, Reliable, WithValidation)
void Server_UseAbility(int32 AbilityIndex, FVector TargetLocation);

bool Server_UseAbility_Validate(int32 AbilityIndex, FVector TargetLocation)
{
    // 验证技能索引
    if (AbilityIndex < 0 || AbilityIndex >= Abilities.Num())
    {
        return false;
    }

    // 验证目标位置是合理的
    float Distance = FVector::Dist(GetActorLocation(), TargetLocation);
    if (Distance > Abilities[AbilityIndex].MaxRange * 1.1f)  // 10%容差
    {
        return false;
    }

    // 验证冷却时间没有被篡改
    // （服务器跟踪实际冷却时间）

    return true;
}
```

### 4. 组织复制逻辑

```cpp
// 清晰的关注点分离
UCLASS()
class AOrganizedCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    // ═══════════════════════════════════════════════════════════
    // 公共接口 - 由游戏系统调用
    // ═══════════════════════════════════════════════════════════

    void TakeDamage(float Amount);
    void UseAbility(int32 Index);
    void PickupItem(AActor* Item);

protected:
    // ═══════════════════════════════════════════════════════════
    // 复制属性 - 客户端需要的状态
    // ═══════════════════════════════════════════════════════════

    UPROPERTY(ReplicatedUsing = OnRep_Health)
    float Health;

    // ═══════════════════════════════════════════════════════════
    // 复制通知 - 响应复制状态更改
    // ═══════════════════════════════════════════════════════════

    UFUNCTION()
    void OnRep_Health();

    // ═══════════════════════════════════════════════════════════
    // 服务器 RPC - 客户端请求到服务器
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Server, Reliable, WithValidation)
    void Server_UseAbility(int32 Index);

    // ═══════════════════════════════════════════════════════════
    // 客户端 RPC - 服务器通知到特定客户端
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(Client, Reliable)
    void Client_OnDamageReceived(float Amount);

    // ═══════════════════════════════════════════════════════════
    // 多播 RPC - 服务器通知到所有客户端
    // ═══════════════════════════════════════════════════════════

    UFUNCTION(NetMulticast, Unreliable)
    void Multicast_PlayEffect(UParticleSystem* Effect, FVector Location);

private:
    // ═══════════════════════════════════════════════════════════
    // 内部 - 非复制的实现细节
    // ═══════════════════════════════════════════════════════════

    void Internal_ApplyDamage(float Amount);
    void Internal_ExecuteAbility(int32 Index);
};
```

### 5. 处理网络条件

```cpp
// 考虑延迟和丢包
void ANetAwareCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (APlayerController* PC = Cast<APlayerController>(GetController()))
    {
        if (UNetConnection* Connection = PC->GetNetConnection())
        {
            // 获取平均延迟
            float AvgPing = Connection->AvgLag * 1000.0f;  // 转换为毫秒

            // 根据延迟调整预测/插值
            if (AvgPing > 150.0f)
            {
                // 高延迟 - 增加插值缓冲
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
```

## 常见陷阱

### 1. 在客户端修改复制属性

```cpp
// 错误：客户端修改复制属性
void AMyCharacter::TakeDamageLocally(float Damage)
{
    Health -= Damage;  // 这不会复制给任何人！
    // 其他客户端不会看到伤害
    // 服务器会覆盖这个更改
}

// 正确：从服务器请求更改
void AMyCharacter::TakeDamage(float Damage)
{
    if (HasAuthority())
    {
        // 服务器：直接修改
        Health -= Damage;
    }
    else
    {
        // 客户端：这不应该发生在伤害上
        // 伤害应该来自服务器
        UE_LOG(LogNet, Warning, TEXT("客户端试图本地应用伤害"));
    }
}
```

### 2. 忘记复制设置

```cpp
// 错误：属性不会复制
UPROPERTY()  // 缺少Replicated说明符！
float Health;

// 也是错误的：缺少GetLifetimeReplicatedProps
void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    // 忘记添加：DOREPLIFETIME(AMyActor, Health);
}

// 正确：完整的复制设置
UPROPERTY(Replicated)
float Health;

void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMyActor, Health);
}
```

### 3. 从错误的上下文调用RPC

```cpp
// 错误：从服务器调用服务器RPC
void AMyCharacter::DoSomething()
{
    // 这是浪费 - 已经在服务器上了！
    Server_DoSomething();
}

// 错误：从客户端调用客户端RPC
void AMyCharacter::ShowMessage(const FString& Msg)
{
    // 这不会工作 - 客户端RPC是从服务器到客户端
    Client_ShowMessage(Msg);
}

// 正确：在调用RPC之前检查上下文
void AMyCharacter::RequestAction()
{
    if (HasAuthority())
    {
        // 已经在服务器上，直接执行
        PerformAction();
    }
    else
    {
        // 在客户端上，请求服务器
        Server_RequestAction();
    }
}
```

### 4. 不处理Actor生成顺序

```cpp
// 错误：假设组件在复制时存在
void AMyActor::OnRep_WeaponClass()
{
    // WeaponComponent可能还没有复制！
    WeaponComponent->SetWeapon(WeaponClass);
}

// 正确：验证依赖项是否存在
void AMyActor::OnRep_WeaponClass()
{
    if (WeaponComponent)
    {
        WeaponComponent->SetWeapon(WeaponClass);
    }
    else
    {
        // 存储以供稍后使用
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

### 5. 无限RPC循环

```cpp
// 错误：可能导致无限循环
void AMyActor::Server_SetValue_Implementation(int32 NewValue)
{
    Value = NewValue;
    Client_NotifyValueChanged(Value);  // 发送到客户端
}

void AMyActor::Client_NotifyValueChanged_Implementation(int32 NewValue)
{
    Server_SetValue(NewValue);  // 发送回服务器 - 循环！
}

// 正确：打破循环
void AMyActor::Server_SetValue_Implementation(int32 NewValue)
{
    if (Value != NewValue)
    {
        Value = NewValue;
        // 使用复制属性代替客户端RPC
        // 或使用标志防止重新触发
    }
}
```

### 6. 不考虑相关性

```cpp
// 错误：假设Actor始终相关
void AMyActor::Multicast_PlayImportantEffect_Implementation()
{
    // 如果Actor变得不相关然后又变得相关，
    // 客户端错过了这个多播！
    PlayEffect();
}

// 正确：对重要事件使用复制状态
UPROPERTY(ReplicatedUsing = OnRep_EffectState)
bool bEffectActive;

void AMyActor::OnRep_EffectState()
{
    if (bEffectActive)
    {
        StartEffect();  // 即使我们刚刚变得相关也会触发
    }
    else
    {
        StopEffect();
    }
}
```

## 性能考虑

### 1. 网络更新频率

```cpp
AMyActor::AMyActor()
{
    // 快速移动的重要Actor使用高频率
    NetUpdateFrequency = 100.0f;

    // 慢速/静态Actor使用较低频率
    // NetUpdateFrequency = 10.0f;

    // 最小频率确保最终更新
    MinNetUpdateFrequency = 2.0f;
}

// 基于游戏状态的动态频率调整
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

### 2. 属性量化

```cpp
// 使用量化减少带宽
UPROPERTY(Replicated)
FVector_NetQuantize Position;  // 量化到1位小数

UPROPERTY(Replicated)
FVector_NetQuantize10 PrecisePosition;  // 量化到0.1

UPROPERTY(Replicated)
FVector_NetQuantize100 VeryPrecisePosition;  // 量化到0.01

UPROPERTY(Replicated)
FRotator_NetQuantize Rotation;  // 量化旋转

// 特定需求的自定义量化
UPROPERTY(Replicated, meta = (ClampMin = "0", ClampMax = "100"))
uint8 HealthPercent;  // 0-100适合1字节而不是4字节浮点数
```

### 3. 条件复制

```cpp
void AMyActor::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    // 只在Actor相关时复制
    DOREPLIFETIME_CONDITION(AMyActor, DetailedState, COND_SimulatedOnly);

    // 只在生成时复制一次
    DOREPLIFETIME_CONDITION(AMyActor, StaticConfig, COND_InitialOnly);

    // 自定义条件
    DOREPLIFETIME_CONDITION(AMyActor, SecretData, COND_Custom);
}

void AMyActor::PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker)
{
    Super::PreReplication(ChangedPropertyTracker);

    // 自定义条件：只复制给队友
    DOREPLIFETIME_ACTIVE_OVERRIDE(AMyActor, SecretData,
        ShouldReplicateSecretData(ChangedPropertyTracker));
}
```

### 4. 快速数组序列化

```cpp
// 对于频繁更改的大数组，使用FFastArraySerializer
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

// 在Actor中
UPROPERTY(Replicated)
FInventoryArray Inventory;
```

### 5. 带宽监控

```cpp
// 调试网络使用
void AMyGameMode::DebugNetworkBandwidth()
{
    if (UNetDriver* NetDriver = GetWorld()->GetNetDriver())
    {
        for (UNetConnection* Connection : NetDriver->ClientConnections)
        {
            // 发送/接收字节
            UE_LOG(LogNet, Log, TEXT("连接 %s: 入=%d 出=%d"),
                *Connection->LowLevelGetRemoteAddress(),
                Connection->InBytesPerSecond,
                Connection->OutBytesPerSecond);

            // 丢包
            UE_LOG(LogNet, Log, TEXT("  丢包: 入=%.2f%% 出=%.2f%%"),
                Connection->InPacketsLost * 100.0f / FMath::Max(1, Connection->InPackets),
                Connection->OutPacketsLost * 100.0f / FMath::Max(1, Connection->OutPackets));
        }
    }
}
```

## 真实场景

### 竞技射击游戏网络代码

```cpp
// 命中注册的延迟补偿
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
        // 验证时间戳不是太久以前
        float ServerTime = GetWorld()->GetTimeSeconds();
        float Latency = ServerTime - ClientTimestamp;

        if (Latency > MaxLagCompensation)
        {
            Latency = MaxLagCompensation;
            ClientTimestamp = ServerTime - MaxLagCompensation;
        }

        // 将所有玩家倒带到客户端感知的时间
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

        // 执行命中扫描
        FHitResult Hit;
        FVector End = MuzzleLocation + AimDirection * WeaponRange;

        FCollisionQueryParams Params;
        Params.AddIgnoredActor(GetOwner());

        bool bHit = GetWorld()->LineTraceSingleByChannel(Hit, MuzzleLocation, End, ECC_Pawn, Params);

        // 恢复所有玩家
        int32 Index = 0;
        for (ACharacter* Player : AllPlayers)
        {
            Player->SetActorTransform(OriginalTransforms[Index++]);
        }

        // 如果命中则应用伤害
        if (bHit)
        {
            if (ACharacter* HitCharacter = Cast<ACharacter>(Hit.GetActor()))
            {
                // 应用伤害
                float Damage = CalculateDamage(Hit);
                UGameplayStatics::ApplyDamage(HitCharacter, Damage, GetOwner()->GetInstigatorController(), this, nullptr);
            }
        }

        // 将射击复制给所有客户端
        Multicast_OnWeaponFired(MuzzleLocation, AimDirection, Hit.Location, bHit);
    }

private:
    float MaxLagCompensation = 0.2f;  // 最大200ms
    float WeaponRange = 10000.0f;
};
```

### MMO风格区域过渡

```cpp
// 区域之间的无缝旅行
UCLASS()
class AZoneManager : public AActor
{
    GENERATED_BODY()

public:
    void RequestZoneTransition(APlayerController* PC, FName TargetZone)
    {
        if (!HasAuthority()) return;

        // 保存玩家状态
        if (AMyPlayerState* PS = PC->GetPlayerState<AMyPlayerState>())
        {
            FPlayerSaveData SaveData;
            SaveData.Health = PS->GetHealth();
            SaveData.Inventory = PS->GetInventory();
            SaveData.Position = PC->GetPawn()->GetActorLocation();

            // 存储在游戏实例或持久存储中
            SavePlayerData(PC, SaveData);
        }

        // 通知客户端准备过渡
        Client_PrepareForZoneTransition(PC, TargetZone);

        // 启动无缝旅行
        FString TravelURL = GetTravelURL(TargetZone);
        PC->ClientTravel(TravelURL, TRAVEL_Absolute, true);
    }

    UFUNCTION(Client, Reliable)
    void Client_PrepareForZoneTransition(APlayerController* PC, FName TargetZone)
    {
        // 显示加载画面
        // 禁用输入
        // 播放过渡效果
    }
};
```

### 实时策略单位同步

```cpp
// 多单位的高效复制
UCLASS()
class ARTSUnit : public APawn
{
    GENERATED_BODY()

public:
    ARTSUnit()
    {
        bReplicates = true;

        // RTS单位更新频率较低
        NetUpdateFrequency = 20.0f;
        MinNetUpdateFrequency = 5.0f;

        // 基于选择/可见性的优先级
        NetPriority = 1.0f;
    }

    virtual float GetNetPriority(const FVector& ViewPos, const FVector& ViewDir,
                                 AActor* Viewer, AActor* ViewTarget,
                                 UActorChannel* InChannel, float Time,
                                 bool bLowBandwidth) override
    {
        float Priority = Super::GetNetPriority(ViewPos, ViewDir, Viewer, ViewTarget, InChannel, Time, bLowBandwidth);

        // 增加选中单位的优先级
        if (bIsSelected)
        {
            Priority *= 3.0f;
        }

        // 增加战斗中单位的优先级
        if (bInCombat)
        {
            Priority *= 2.0f;
        }

        // 降低远离摄像机的单位的优先级
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
        // 单位基于战争迷雾判断相关性
        if (ARTSPlayerController* RTSPC = Cast<ARTSPlayerController>(RealViewer))
        {
            return RTSPC->CanSeeLocation(GetActorLocation());
        }
        return Super::IsNetRelevantFor(RealViewer, ViewTarget, SrcLocation);
    }
};
```

## 面试要点

### 基础问题

1. **属性复制和RPC之间有什么区别？**
   - 属性复制：从服务器到客户端的自动状态同步。自动检测并发送更改。适合持久状态。
   - RPC：跨网络的显式函数调用。可以任何方向（Server、Client、Multicast）。适合事件和命令。

2. **解释虚幻中的三种网络角色。**
   - Authority（权威）：拥有确定性状态（通常是服务器）。可以修改复制属性。
   - Autonomous Proxy（自主代理）：客户端自己的Pawn。可以本地预测。
   - Simulated Proxy（模拟代理）：客户端上其他玩家的Pawn。只接收状态。

3. **什么时候应该使用可靠vs不可靠的RPC？**
   - 可靠：必须接收的关键事件（死亡、技能激活、购买）。保证投递，有序。
   - 不可靠：频繁更新（位置）、装饰效果。可能被丢弃但更快。

4. **什么是相关性，为什么它很重要？**
   - 相关性决定哪些Actor复制到哪些客户端
   - 通过不发送关于远距离/隐藏Actor的数据来节省带宽
   - 对大规模游戏至关重要

### 高级问题

5. **射击游戏中的延迟补偿如何工作？**
   - 服务器存储所有玩家的位置历史
   - 处理射击时，将玩家倒带到客户端感知的时间
   - 对历史位置执行命中检测
   - 恢复位置并应用结果

6. **解释网络预测系统。**
   - 客户端本地预测移动以提高响应性
   - 向服务器发送输入
   - 服务器模拟并发送权威状态
   - 客户端协调：如果预测错误，吸附到服务器并重放待处理输入

7. **如何为100+玩家优化复制？**
   - 使用相关性限制复制的Actor
   - 为远距离/不活跃的Actor降低NetUpdateFrequency
   - 使用属性条件（COND_OwnerOnly等）
   - 量化向量和旋转
   - 对大数组使用FFastArraySerializer
   - 实现兴趣管理/兴趣区域系统

8. **网络中存在哪些安全考虑？**
   - 永远不要信任客户端数据 - 始终验证
   - 使用_Validate函数检测作弊者
   - 在服务器上保持权威状态
   - 不要向不应该看到的客户端发送敏感数据
   - 实现服务器端冷却和速率限制

## 延伸阅读

### 官方文档
- [虚幻引擎网络概述](https://docs.unrealengine.com/zh-CN/InteractiveExperiences/Networking/Overview/)
- [Actor复制](https://docs.unrealengine.com/zh-CN/InteractiveExperiences/Networking/Actors/)
- [RPC和复制](https://docs.unrealengine.com/zh-CN/InteractiveExperiences/Networking/Actors/RPCs/)
- [网络技巧和窍门](https://docs.unrealengine.com/zh-CN/InteractiveExperiences/Networking/Tips/)

### 高级资源
- [虚幻引擎网络纲要](https://cedric-neukirchen.net/Downloads/Compendium/UE4_Network_Compendium_by_Cedric_eXi_Neukirchen.pdf)
- [Gaffer On Games - 网络物理](https://gafferongames.com/categories/networked-physics/)
- [Gabriel Gambetta - 快节奏多人游戏](https://www.gabrielgambetta.com/client-server-game-architecture.html)

### 源代码学习
- `Engine/Source/Runtime/Engine/Classes/GameFramework/Actor.h` - 复制设置
- `Engine/Source/Runtime/Engine/Private/Actor.cpp` - GetLifetimeReplicatedProps
- `Engine/Source/Runtime/Engine/Private/NetDriver.cpp` - 网络驱动实现
- `Engine/Source/Runtime/Engine/Classes/Engine/NetSerialization.h` - 网络序列化工具

### 视频资源
- 虚幻引擎 - 多人框架深入剖析
- GDC关于网络编程的演讲
- Unreal Slackers Discord - 网络频道

### 相关主题
- 角色移动网络预测
- 游戏技能系统网络
- 专用服务器架构
- Steam/EOS在线子系统
