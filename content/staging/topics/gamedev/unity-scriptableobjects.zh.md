---
title: Unity ScriptableObjects 完全指南
description: 精通 Unity ScriptableObjects - 数据容器、架构模式、事件系统和可扩展游戏开发的最佳实践
track: gamedev
section: unity
difficulty: intermediate
tags:
  - Unity
  - ScriptableObjects
  - 游戏架构
  - C#
  - 数据管理
  - 设计模式
status: imported
origin: old/src/content/docs/gamedev/unity-scriptableobjects.zh.md
divergence: 0.264
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: GameDev
  subcategory: ""
  order: 3
  lastUpdated: 2026-01-21
---

ScriptableObjects 是 Unity 最通用但未被充分利用的功能之一。它们作为存在于场景之外的数据容器，能够实现更清晰的架构、更好的性能和更易维护的代码。本综合指南涵盖了从基本用法到高级架构模式的所有内容。

## 概念解释

### 什么是 ScriptableObjects？

**ScriptableObject** 是一种数据容器，允许你存储大量独立于脚本实例的共享数据。与必须附加到场景中 GameObjects 的 MonoBehaviours 不同，ScriptableObjects 作为项目中的资源存在，可以被多个对象引用。

```csharp
// ScriptableObject 定义
[CreateAssetMenu(fileName = "NewWeapon", menuName = "Game/Weapon Data")]
public class WeaponData : ScriptableObject
{
    public string weaponName;
    public int damage;
    public float fireRate;
    public Sprite icon;
}

// 在 MonoBehaviour 中使用
public class Weapon : MonoBehaviour
{
    [SerializeField] private WeaponData data; // 引用 SO 资源

    void Attack()
    {
        // 所有实例共享相同的数据
        DealDamage(data.damage);
    }
}
```

关键点是 ScriptableObjects 是**资源**，而不是**场景对象**。它们在场景加载时保持不变，并且可以被任意数量的 GameObjects 共享。

### 历史与演进

| 版本 | 功能 | 影响 |
|-----|------|------|
| Unity 3.x | 引入 ScriptableObject | 基本数据存储 |
| Unity 4.0 | CreateAssetMenu 属性 | 更方便创建资源 |
| Unity 5.0 | 改进序列化 | 更好的编辑器工作流 |
| Unity 2017 | Addressables 支持 | 异步加载 |
| Unity 2019 | 更快的序列化 | 性能改进 |
| Unity 2021 | SerializeReference | 多态序列化 |

### ScriptableObjects 解决什么问题？

1. **内存效率**：跨实例共享数据而非复制
2. **解耦**：分离数据和行为
3. **设计师友好**：非程序员可以调整值
4. **场景独立**：数据跨场景持久化
5. **版本控制友好**：更改隔离到资源文件
6. **运行时修改**：在播放时更改值以进行测试

### ScriptableObjects vs 替代方案

```
┌───────────────────┬──────────────────────────────────────────────────────┐
│ 方案              │ 使用场景                                              │
├───────────────────┼──────────────────────────────────────────────────────┤
│ 硬编码值          │ 快速原型，但不易维护                                   │
│ Prefab 值         │ 每实例数据，在内存中重复                               │
│ JSON/XML 文件     │ 外部编辑，但无 Unity 集成                              │
│ ScriptableObjects │ 共享数据，Unity 集成，编辑器工作流                     │
│ Addressables      │ 动态加载，内存管理                                     │
│ 数据库            │ 大型数据集，复杂查询                                   │
└───────────────────┴──────────────────────────────────────────────────────┘
```

## 核心原理

### 内存模型

```
不使用 ScriptableObjects：
┌─────────────────────────────────────────────────────────────────────┐
│  场景                                                               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ Enemy 1       │ │ Enemy 2       │ │ Enemy 3       │             │
│  │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │             │
│  │ │ HP: 100   │ │ │ │ HP: 100   │ │ │ │ HP: 100   │ │ ← 重复的   │
│  │ │ DMG: 10   │ │ │ │ DMG: 10   │ │ │ │ DMG: 10   │ │   数据      │
│  │ │ Speed: 5  │ │ │ │ Speed: 5  │ │ │ │ Speed: 5  │ │             │
│  │ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

使用 ScriptableObjects：
┌─────────────────────────────────────────────────────────────────────┐
│  项目资源                          场景                            │
│  ┌───────────────┐                ┌───────────────┐                │
│  │ EnemyStats.SO │                │ Enemy 1       │                │
│  │ ┌───────────┐ │ ◄──引用────────│ [EnemyStats]  │                │
│  │ │ HP: 100   │ │                └───────────────┘                │
│  │ │ DMG: 10   │ │ ◄──引用────────┌───────────────┐                │
│  │ │ Speed: 5  │ │                │ Enemy 2       │ ← 共享         │
│  │ └───────────┘ │                │ [EnemyStats]  │   引用         │
│  └───────────────┘ ◄──引用────────└───────────────┘                │
│                                   ┌───────────────┐                │
│                    ◄──引用────────│ Enemy 3       │                │
│                                   │ [EnemyStats]  │                │
│                                   └───────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### 生命周期

ScriptableObjects 与 MonoBehaviours 有不同的生命周期：

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SCRIPTABLEOBJECT 生命周期                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  资源创建（编辑器）                                                  │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐                                               │
│  │ Awake()          │  ◄── 资源加载到内存时调用                      │
│  └────────┬─────────┘      （编辑器：首次引用时）                    │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnEnable()       │  ◄── Awake 之后，启用时调用                    │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnValidate()     │  ◄── 仅编辑器：值更改时                        │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ 资源使用中       │  ◄── 被场景/其他资源引用                       │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnDisable()      │  ◄── 卸载前（域重载、退出）                    │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnDestroy()      │  ◄── 资源被销毁/卸载时                         │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 序列化

ScriptableObjects 支持 Unity 的序列化系统：

```csharp
[CreateAssetMenu]
public class GameSettings : ScriptableObject
{
    // 序列化的（保存到资源）
    public int maxPlayers = 4;
    public float masterVolume = 1f;
    [SerializeField] private string secretKey;

    // 不序列化的
    [NonSerialized] public int runtimeScore;
    private System.Action callback; // 委托不序列化

    // 序列化的自定义类（必须有 [Serializable]）
    public PlayerDefaults playerDefaults;

    // 序列化的集合
    public List<string> availableLevels;
    public Dictionary<string, int> highScores; // 不会序列化！
}

[Serializable]
public class PlayerDefaults
{
    public string name = "Player";
    public Color color = Color.blue;
    public int startingHealth = 100;
}
```

## 核心要点

### 创建 ScriptableObjects

#### 使用 CreateAssetMenu

```csharp
// 创建菜单项：Assets > Create > Game > Character Stats
[CreateAssetMenu(fileName = "NewCharacterStats", menuName = "Game/Character Stats", order = 1)]
public class CharacterStats : ScriptableObject
{
    [Header("基本信息")]
    public string characterName;
    public Sprite portrait;

    [Header("战斗属性")]
    [Range(1, 100)] public int health = 100;
    [Range(1, 50)] public int attack = 10;
    [Range(1, 50)] public int defense = 5;

    [Header("移动")]
    public float moveSpeed = 5f;
    public float jumpHeight = 2f;

    [TextArea(3, 5)]
    public string description;
}
```

#### 程序化创建

```csharp
public class DataGenerator : MonoBehaviour
{
    void CreateAssetAtRuntime()
    {
        // 创建实例
        CharacterStats newStats = ScriptableObject.CreateInstance<CharacterStats>();
        newStats.characterName = "生成的英雄";
        newStats.health = 150;

        // 在编辑器中：保存为资源
        #if UNITY_EDITOR
        UnityEditor.AssetDatabase.CreateAsset(newStats, "Assets/Data/GeneratedHero.asset");
        UnityEditor.AssetDatabase.SaveAssets();
        #endif
    }

    void CreateRuntimeOnlyInstance()
    {
        // 仅运行时实例（不保存）
        CharacterStats tempStats = ScriptableObject.CreateInstance<CharacterStats>();
        tempStats.characterName = "临时角色";

        // 使用它...

        // 完成后清理
        Destroy(tempStats);
    }
}
```

### 数据容器

#### 基本数据容器

```csharp
[CreateAssetMenu(menuName = "Inventory/Item")]
public class ItemData : ScriptableObject
{
    [Header("基本信息")]
    public string itemName;
    public string itemID;
    public Sprite icon;
    [TextArea] public string description;

    [Header("属性")]
    public ItemType type;
    public ItemRarity rarity;
    public int maxStackSize = 99;
    public bool isConsumable;

    [Header("价值")]
    public int buyPrice;
    public int sellPrice;

    public enum ItemType { Weapon, Armor, Consumable, Material, Quest }
    public enum ItemRarity { Common, Uncommon, Rare, Epic, Legendary }
}

// 使用
public class InventorySlot : MonoBehaviour
{
    [SerializeField] private ItemData item;
    [SerializeField] private int quantity;

    public void DisplayItem()
    {
        Debug.Log($"{item.itemName} x{quantity}");
        Debug.Log($"价值：{item.sellPrice * quantity} 金币");
    }
}
```

#### 带继承的嵌套数据

```csharp
// 基类
public abstract class AbilityData : ScriptableObject
{
    public string abilityName;
    public Sprite icon;
    public float cooldown;
    public int manaCost;

    public abstract void Execute(Character caster, Character target);
}

// 派生类
[CreateAssetMenu(menuName = "Abilities/Damage Ability")]
public class DamageAbilityData : AbilityData
{
    public int baseDamage;
    public DamageType damageType;
    public GameObject effectPrefab;

    public override void Execute(Character caster, Character target)
    {
        int finalDamage = baseDamage + caster.Stats.attack;
        target.TakeDamage(finalDamage, damageType);

        if (effectPrefab != null)
        {
            Instantiate(effectPrefab, target.transform.position, Quaternion.identity);
        }
    }

    public enum DamageType { Physical, Magical, True }
}

[CreateAssetMenu(menuName = "Abilities/Heal Ability")]
public class HealAbilityData : AbilityData
{
    public int baseHeal;
    public bool healOverTime;
    public float duration;

    public override void Execute(Character caster, Character target)
    {
        if (healOverTime)
        {
            target.StartCoroutine(HealOverTime(target));
        }
        else
        {
            target.Heal(baseHeal);
        }
    }

    private IEnumerator HealOverTime(Character target)
    {
        float elapsed = 0f;
        int healPerTick = baseHeal / Mathf.CeilToInt(duration);

        while (elapsed < duration)
        {
            target.Heal(healPerTick);
            yield return new WaitForSeconds(1f);
            elapsed += 1f;
        }
    }
}
```

### 使用 ScriptableObjects 的事件系统

```csharp
// 游戏事件 - 作为通道
[CreateAssetMenu(menuName = "Events/Game Event")]
public class GameEvent : ScriptableObject
{
    private readonly List<GameEventListener> listeners = new List<GameEventListener>();

    public void Raise()
    {
        // 反向迭代以防监听器移除自己
        for (int i = listeners.Count - 1; i >= 0; i--)
        {
            listeners[i].OnEventRaised();
        }
    }

    public void RegisterListener(GameEventListener listener)
    {
        if (!listeners.Contains(listener))
        {
            listeners.Add(listener);
        }
    }

    public void UnregisterListener(GameEventListener listener)
    {
        listeners.Remove(listener);
    }
}

// 监听器组件
public class GameEventListener : MonoBehaviour
{
    [SerializeField] private GameEvent gameEvent;
    [SerializeField] private UnityEvent response;

    private void OnEnable()
    {
        gameEvent.RegisterListener(this);
    }

    private void OnDisable()
    {
        gameEvent.UnregisterListener(this);
    }

    public void OnEventRaised()
    {
        response?.Invoke();
    }
}

// 带数据的泛型事件
[CreateAssetMenu(menuName = "Events/Int Event")]
public class IntEvent : ScriptableObject
{
    private readonly List<IntEventListener> listeners = new List<IntEventListener>();

    public void Raise(int value)
    {
        for (int i = listeners.Count - 1; i >= 0; i--)
        {
            listeners[i].OnEventRaised(value);
        }
    }

    public void RegisterListener(IntEventListener listener) => listeners.Add(listener);
    public void UnregisterListener(IntEventListener listener) => listeners.Remove(listener);
}

public class IntEventListener : MonoBehaviour
{
    [SerializeField] private IntEvent gameEvent;
    [SerializeField] private UnityEvent<int> response;

    private void OnEnable() => gameEvent.RegisterListener(this);
    private void OnDisable() => gameEvent.UnregisterListener(this);

    public void OnEventRaised(int value) => response?.Invoke(value);
}
```

### 变量系统

```csharp
// Float 变量
[CreateAssetMenu(menuName = "Variables/Float Variable")]
public class FloatVariable : ScriptableObject
{
    [SerializeField] private float initialValue;
    [NonSerialized] private float runtimeValue;

    public float Value
    {
        get => runtimeValue;
        set
        {
            runtimeValue = value;
            OnValueChanged?.Invoke(runtimeValue);
        }
    }

    public event System.Action<float> OnValueChanged;

    private void OnEnable()
    {
        runtimeValue = initialValue;
    }

    public void Add(float amount) => Value += amount;
    public void Multiply(float factor) => Value *= factor;
    public void Reset() => Value = initialValue;
}

// 可使用变量或常量的引用
[Serializable]
public class FloatReference
{
    public bool useConstant = true;
    public float constantValue;
    public FloatVariable variable;

    public float Value
    {
        get => useConstant ? constantValue : variable.Value;
        set
        {
            if (useConstant)
                constantValue = value;
            else
                variable.Value = value;
        }
    }

    public static implicit operator float(FloatReference reference) => reference.Value;
}

// FloatReference 的自定义属性绘制器
#if UNITY_EDITOR
[CustomPropertyDrawer(typeof(FloatReference))]
public class FloatReferenceDrawer : PropertyDrawer
{
    public override void OnGUI(Rect position, SerializedProperty property, GUIContent label)
    {
        EditorGUI.BeginProperty(position, label, property);

        var useConstant = property.FindPropertyRelative("useConstant");
        var constantValue = property.FindPropertyRelative("constantValue");
        var variable = property.FindPropertyRelative("variable");

        position = EditorGUI.PrefixLabel(position, label);

        var buttonRect = new Rect(position.x, position.y, 20, position.height);
        var valueRect = new Rect(position.x + 22, position.y, position.width - 22, position.height);

        if (GUI.Button(buttonRect, useConstant.boolValue ? "C" : "V", EditorStyles.miniButton))
        {
            useConstant.boolValue = !useConstant.boolValue;
        }

        if (useConstant.boolValue)
        {
            EditorGUI.PropertyField(valueRect, constantValue, GUIContent.none);
        }
        else
        {
            EditorGUI.PropertyField(valueRect, variable, GUIContent.none);
        }

        EditorGUI.EndProperty();
    }
}
#endif

// 使用
public class Player : MonoBehaviour
{
    [SerializeField] private FloatReference maxHealth;
    [SerializeField] private FloatReference moveSpeed;

    private float currentHealth;

    void Start()
    {
        currentHealth = maxHealth.Value;
    }

    void Update()
    {
        transform.Translate(Vector3.forward * moveSpeed * Time.deltaTime);
    }
}
```

### 运行时集合

```csharp
// 运行时集合 - 跟踪活动实例
[CreateAssetMenu(menuName = "Runtime/Runtime Set")]
public class RuntimeSet<T> : ScriptableObject
{
    [NonSerialized] private readonly List<T> items = new List<T>();

    public IReadOnlyList<T> Items => items;
    public int Count => items.Count;

    public event System.Action<T> OnItemAdded;
    public event System.Action<T> OnItemRemoved;

    public void Add(T item)
    {
        if (!items.Contains(item))
        {
            items.Add(item);
            OnItemAdded?.Invoke(item);
        }
    }

    public void Remove(T item)
    {
        if (items.Remove(item))
        {
            OnItemRemoved?.Invoke(item);
        }
    }

    public void Clear()
    {
        items.Clear();
    }

    private void OnDisable()
    {
        items.Clear();
    }
}

// 敌人的具体实现
[CreateAssetMenu(menuName = "Runtime/Enemy Set")]
public class EnemyRuntimeSet : RuntimeSet<Enemy> { }

// 敌人自动注册自己
public class Enemy : MonoBehaviour
{
    [SerializeField] private EnemyRuntimeSet enemySet;

    private void OnEnable()
    {
        enemySet.Add(this);
    }

    private void OnDisable()
    {
        enemySet.Remove(this);
    }
}

// 游戏系统可以查询集合
public class EnemyManager : MonoBehaviour
{
    [SerializeField] private EnemyRuntimeSet allEnemies;

    public void DamageAllEnemies(int damage)
    {
        foreach (var enemy in allEnemies.Items)
        {
            enemy.TakeDamage(damage);
        }
    }

    public Enemy GetClosestEnemy(Vector3 position)
    {
        Enemy closest = null;
        float closestDistance = float.MaxValue;

        foreach (var enemy in allEnemies.Items)
        {
            float distance = Vector3.Distance(position, enemy.transform.position);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closest = enemy;
            }
        }

        return closest;
    }
}
```

## 代码示例

### 完整物品系统

```csharp
using UnityEngine;
using System.Collections.Generic;

// 物品数据库
[CreateAssetMenu(menuName = "Inventory/Item Database")]
public class ItemDatabase : ScriptableObject
{
    [SerializeField] private List<ItemData> allItems = new List<ItemData>();
    private Dictionary<string, ItemData> itemLookup;

    public void Initialize()
    {
        itemLookup = new Dictionary<string, ItemData>();
        foreach (var item in allItems)
        {
            if (!string.IsNullOrEmpty(item.itemID))
            {
                itemLookup[item.itemID] = item;
            }
        }
    }

    public ItemData GetItem(string id)
    {
        if (itemLookup == null) Initialize();
        return itemLookup.TryGetValue(id, out var item) ? item : null;
    }

    public List<ItemData> GetItemsByType(ItemData.ItemType type)
    {
        return allItems.FindAll(i => i.type == type);
    }

    #if UNITY_EDITOR
    [ContextMenu("从文件夹填充")]
    private void PopulateFromFolder()
    {
        allItems.Clear();
        string[] guids = UnityEditor.AssetDatabase.FindAssets("t:ItemData");
        foreach (string guid in guids)
        {
            string path = UnityEditor.AssetDatabase.GUIDToAssetPath(guid);
            ItemData item = UnityEditor.AssetDatabase.LoadAssetAtPath<ItemData>(path);
            if (item != null)
            {
                allItems.Add(item);
            }
        }
        UnityEditor.EditorUtility.SetDirty(this);
    }
    #endif
}

// 装备数据扩展自 ItemData
[CreateAssetMenu(menuName = "Inventory/Equipment")]
public class EquipmentData : ItemData
{
    [Header("装备")]
    public EquipmentSlot slot;
    public int strengthBonus;
    public int agilityBonus;
    public int intelligenceBonus;
    public int armorBonus;

    [Header("需求")]
    public int requiredLevel;
    public CharacterClass requiredClass;

    public enum EquipmentSlot { Head, Chest, Legs, Feet, MainHand, OffHand, Accessory }
    public enum CharacterClass { Any, Warrior, Mage, Rogue }
}

// 消耗品数据
[CreateAssetMenu(menuName = "Inventory/Consumable")]
public class ConsumableData : ItemData
{
    [Header("效果")]
    public ConsumableEffect[] effects;

    [Serializable]
    public class ConsumableEffect
    {
        public EffectType type;
        public float value;
        public float duration;
    }

    public enum EffectType { HealHealth, RestoreMana, BuffStrength, BuffSpeed, RemoveDebuff }

    public void Use(Character character)
    {
        foreach (var effect in effects)
        {
            ApplyEffect(character, effect);
        }
    }

    private void ApplyEffect(Character character, ConsumableEffect effect)
    {
        switch (effect.type)
        {
            case EffectType.HealHealth:
                character.Heal((int)effect.value);
                break;
            case EffectType.RestoreMana:
                character.RestoreMana((int)effect.value);
                break;
            case EffectType.BuffStrength:
                character.ApplyBuff(BuffType.Strength, effect.value, effect.duration);
                break;
            // ... 其他效果
        }
    }
}

// 背包系统
public class Inventory : MonoBehaviour
{
    [SerializeField] private ItemDatabase database;
    [SerializeField] private int maxSlots = 20;

    private List<InventoryEntry> items = new List<InventoryEntry>();

    public event System.Action<InventoryEntry> OnItemAdded;
    public event System.Action<InventoryEntry> OnItemRemoved;
    public event System.Action OnInventoryChanged;

    [Serializable]
    public class InventoryEntry
    {
        public ItemData item;
        public int quantity;
    }

    public bool AddItem(ItemData item, int quantity = 1)
    {
        // 尝试堆叠
        if (item.maxStackSize > 1)
        {
            var existing = items.Find(e => e.item == item && e.quantity < item.maxStackSize);
            if (existing != null)
            {
                int canAdd = Mathf.Min(quantity, item.maxStackSize - existing.quantity);
                existing.quantity += canAdd;
                quantity -= canAdd;
                OnInventoryChanged?.Invoke();

                if (quantity <= 0) return true;
            }
        }

        // 添加新堆叠
        while (quantity > 0 && items.Count < maxSlots)
        {
            int stackSize = Mathf.Min(quantity, item.maxStackSize);
            var entry = new InventoryEntry { item = item, quantity = stackSize };
            items.Add(entry);
            OnItemAdded?.Invoke(entry);
            quantity -= stackSize;
        }

        OnInventoryChanged?.Invoke();
        return quantity <= 0;
    }

    public bool RemoveItem(ItemData item, int quantity = 1)
    {
        int remaining = quantity;

        for (int i = items.Count - 1; i >= 0 && remaining > 0; i--)
        {
            if (items[i].item == item)
            {
                int toRemove = Mathf.Min(remaining, items[i].quantity);
                items[i].quantity -= toRemove;
                remaining -= toRemove;

                if (items[i].quantity <= 0)
                {
                    var removed = items[i];
                    items.RemoveAt(i);
                    OnItemRemoved?.Invoke(removed);
                }
            }
        }

        if (remaining < quantity)
        {
            OnInventoryChanged?.Invoke();
        }

        return remaining <= 0;
    }

    public int GetItemCount(ItemData item)
    {
        int count = 0;
        foreach (var entry in items)
        {
            if (entry.item == item)
            {
                count += entry.quantity;
            }
        }
        return count;
    }

    // 保存/加载
    public InventorySaveData GetSaveData()
    {
        var saveData = new InventorySaveData();
        saveData.items = new List<InventorySaveData.ItemEntry>();

        foreach (var entry in items)
        {
            saveData.items.Add(new InventorySaveData.ItemEntry
            {
                itemID = entry.item.itemID,
                quantity = entry.quantity
            });
        }

        return saveData;
    }

    public void LoadSaveData(InventorySaveData saveData)
    {
        items.Clear();

        foreach (var entry in saveData.items)
        {
            var item = database.GetItem(entry.itemID);
            if (item != null)
            {
                items.Add(new InventoryEntry
                {
                    item = item,
                    quantity = entry.quantity
                });
            }
        }

        OnInventoryChanged?.Invoke();
    }
}

[Serializable]
public class InventorySaveData
{
    public List<ItemEntry> items;

    [Serializable]
    public class ItemEntry
    {
        public string itemID;
        public int quantity;
    }
}
```

### 使用 ScriptableObjects 的状态机

```csharp
using UnityEngine;

// 基础状态
public abstract class State : ScriptableObject
{
    public abstract void OnEnter(StateMachine stateMachine);
    public abstract void OnUpdate(StateMachine stateMachine);
    public abstract void OnExit(StateMachine stateMachine);
}

// 状态机
public class StateMachine : MonoBehaviour
{
    [SerializeField] private State initialState;

    public State CurrentState { get; private set; }

    private void Start()
    {
        TransitionTo(initialState);
    }

    private void Update()
    {
        CurrentState?.OnUpdate(this);
    }

    public void TransitionTo(State newState)
    {
        CurrentState?.OnExit(this);
        CurrentState = newState;
        CurrentState?.OnEnter(this);
    }
}

// 具体状态
[CreateAssetMenu(menuName = "AI/States/Idle State")]
public class IdleState : State
{
    public float idleDuration = 2f;
    public State patrolState;

    private float timer;

    public override void OnEnter(StateMachine stateMachine)
    {
        timer = 0f;
        Debug.Log("进入待机状态");
    }

    public override void OnUpdate(StateMachine stateMachine)
    {
        timer += Time.deltaTime;

        if (timer >= idleDuration)
        {
            stateMachine.TransitionTo(patrolState);
        }
    }

    public override void OnExit(StateMachine stateMachine)
    {
        Debug.Log("退出待机状态");
    }
}

[CreateAssetMenu(menuName = "AI/States/Chase State")]
public class ChaseState : State
{
    public float chaseSpeed = 5f;
    public float attackRange = 2f;
    public float loseDistance = 15f;
    public State attackState;
    public State patrolState;

    public override void OnEnter(StateMachine stateMachine)
    {
        Debug.Log("进入追逐状态");
    }

    public override void OnUpdate(StateMachine stateMachine)
    {
        var enemy = stateMachine.GetComponent<Enemy>();
        Transform player = enemy.GetPlayerTransform();

        if (player == null)
        {
            stateMachine.TransitionTo(patrolState);
            return;
        }

        float distance = Vector3.Distance(stateMachine.transform.position, player.position);

        // 丢失玩家
        if (distance > loseDistance || !enemy.CanSeePlayer())
        {
            stateMachine.TransitionTo(patrolState);
            return;
        }

        // 在攻击范围内
        if (distance < attackRange)
        {
            stateMachine.TransitionTo(attackState);
            return;
        }

        // 追逐
        Vector3 direction = (player.position - stateMachine.transform.position).normalized;
        stateMachine.transform.Translate(direction * chaseSpeed * Time.deltaTime);
    }

    public override void OnExit(StateMachine stateMachine)
    {
        Debug.Log("退出追逐状态");
    }
}
```

## 最佳实践

### 1. 使用文件夹组织

```
Assets/
├── Data/
│   ├── Characters/
│   │   ├── HeroStats.asset
│   │   └── EnemyStats.asset
│   ├── Items/
│   │   ├── Weapons/
│   │   ├── Armor/
│   │   └── Consumables/
│   ├── Audio/
│   │   ├── Music/
│   │   └── SFX/
│   └── Events/
│       ├── GameEvents/
│       └── UIEvents/
```

### 2. 使用接口增加灵活性

```csharp
public interface IDamageable
{
    void TakeDamage(int amount);
}

public interface IInteractable
{
    void Interact(Character character);
    string GetInteractionPrompt();
}

// 定义行为的 ScriptableObject
[CreateAssetMenu(menuName = "Interactions/Chest")]
public class ChestInteraction : ScriptableObject, IInteractable
{
    public ItemData[] possibleLoot;
    public int minItems = 1;
    public int maxItems = 5;

    public void Interact(Character character)
    {
        int itemCount = Random.Range(minItems, maxItems + 1);
        for (int i = 0; i < itemCount; i++)
        {
            var item = possibleLoot[Random.Range(0, possibleLoot.Length)];
            character.Inventory.AddItem(item);
        }
    }

    public string GetInteractionPrompt() => "打开宝箱";
}
```

### 3. 正确重置运行时数据

```csharp
[CreateAssetMenu]
public class RuntimeGameData : ScriptableObject
{
    [Header("持久化（保存）")]
    public int highScore;

    [Header("运行时（每次会话重置）")]
    [NonSerialized] public int currentScore;
    [NonSerialized] public int currentLevel;
    [NonSerialized] public List<string> collectedItems = new List<string>();

    private void OnEnable()
    {
        // 资源加载时重置运行时数据
        ResetRuntimeData();
    }

    public void ResetRuntimeData()
    {
        currentScore = 0;
        currentLevel = 1;
        collectedItems = new List<string>();
    }

    #if UNITY_EDITOR
    // 退出播放模式时也重置
    private void OnDisable()
    {
        if (!Application.isPlaying)
        {
            ResetRuntimeData();
        }
    }
    #endif
}
```

### 4. 在编辑器中验证数据

```csharp
[CreateAssetMenu]
public class EnemyConfig : ScriptableObject
{
    public string enemyName;
    [Range(1, 1000)] public int maxHealth = 100;
    [Range(0, 100)] public int armor = 0;
    public GameObject prefab;
    public ItemData[] dropTable;
    [Range(0, 1)] public float dropChance = 0.5f;

    private void OnValidate()
    {
        // 验证名称
        if (string.IsNullOrEmpty(enemyName))
        {
            Debug.LogWarning($"敌人配置 {name} 没有设置名称！", this);
        }

        // 验证预制体
        if (prefab == null)
        {
            Debug.LogError($"敌人配置 {name} 没有预制体！", this);
        }

        // 验证掉落表
        if (dropTable != null)
        {
            foreach (var item in dropTable)
            {
                if (item == null)
                {
                    Debug.LogWarning($"敌人配置 {name} 掉落表中有空物品！", this);
                }
            }
        }
    }
}
```

## 常见陷阱

### 1. 在运行时修改 ScriptableObject 数据

```csharp
// 问题：更改在编辑器中播放模式结束后仍然存在！
[CreateAssetMenu]
public class PlayerStats : ScriptableObject
{
    public int currentHealth = 100; // 此更改会持久化！

    public void TakeDamage(int damage)
    {
        currentHealth -= damage; // 糟糕：修改了资源
    }
}

// 解决方案1：对运行时数据使用 NonSerialized
[CreateAssetMenu]
public class PlayerStatsSafe : ScriptableObject
{
    public int maxHealth = 100;

    [NonSerialized] private int currentHealth;

    public int CurrentHealth => currentHealth;

    private void OnEnable()
    {
        currentHealth = maxHealth;
    }

    public void TakeDamage(int damage)
    {
        currentHealth -= damage; // 正确：不序列化
    }
}

// 解决方案2：创建运行时副本
public class PlayerWithCopy : MonoBehaviour
{
    [SerializeField] private PlayerStats baseStats;
    private PlayerStats runtimeStats;

    void Start()
    {
        // 创建运行时副本
        runtimeStats = Instantiate(baseStats);
    }

    void TakeDamage(int damage)
    {
        runtimeStats.TakeDamage(damage); // 只修改副本
    }

    void OnDestroy()
    {
        // 清理副本
        if (runtimeStats != null)
        {
            Destroy(runtimeStats);
        }
    }
}
```

### 2. 场景加载后空引用

```csharp
// 问题：场景重新加载后引用可能变为空
public class GameManager : MonoBehaviour
{
    [SerializeField] private PlayerRuntimeSet playerSet;

    void OnLevelLoaded()
    {
        // 如果玩家被销毁，playerSet.Items 可能过时
        foreach (var player in playerSet.Items) // NullReferenceException！
        {
            player.Reset();
        }
    }
}

// 解决方案：验证引用并处理清理
[CreateAssetMenu]
public class PlayerRuntimeSetSafe : ScriptableObject
{
    [NonSerialized] private List<Player> players = new List<Player>();

    public IReadOnlyList<Player> Players => players;

    public void Add(Player player)
    {
        if (player != null && !players.Contains(player))
        {
            players.Add(player);
        }
    }

    public void Remove(Player player)
    {
        players.Remove(player);
    }

    // 场景切换时调用
    public void ValidateReferences()
    {
        players.RemoveAll(p => p == null);
    }

    private void OnEnable()
    {
        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        players.Clear();
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        ValidateReferences();
    }
}
```

### 3. Dictionary 序列化

```csharp
// 问题：Dictionary 不会被序列化！
[CreateAssetMenu]
public class LocalizationData : ScriptableObject
{
    // 这不会被保存！
    public Dictionary<string, string> translations = new Dictionary<string, string>();
}

// 解决方案：使用可序列化的包装器
[CreateAssetMenu]
public class LocalizationDataFixed : ScriptableObject
{
    [SerializeField] private List<TranslationEntry> entries = new List<TranslationEntry>();

    [NonSerialized] private Dictionary<string, string> lookup;

    [Serializable]
    public class TranslationEntry
    {
        public string key;
        public string value;
    }

    public void Initialize()
    {
        lookup = new Dictionary<string, string>();
        foreach (var entry in entries)
        {
            lookup[entry.key] = entry.value;
        }
    }

    public string GetTranslation(string key)
    {
        if (lookup == null) Initialize();
        return lookup.TryGetValue(key, out var value) ? value : key;
    }
}
```

## 性能考量

### 内存效率

```csharp
// 对比：1000 个带属性的敌人

// 不使用 ScriptableObjects：约 100KB 重复数据
// 每个敌人在内存中有自己的属性副本

// 使用 ScriptableObjects：约 100 字节引用 + 约 100 字节共享数据
// 所有敌人共享一个属性资源
```

### 加载模式

```csharp
public class AssetLoader : MonoBehaviour
{
    // 直接引用：立即加载
    [SerializeField] private ItemData directReference;

    // Addressables：按需加载
    [SerializeField] private AssetReference itemReference;

    private ItemData loadedItem;

    async void LoadOnDemand()
    {
        var handle = Addressables.LoadAssetAsync<ItemData>(itemReference);
        loadedItem = await handle.Task;
    }

    void UnloadWhenDone()
    {
        Addressables.Release(loadedItem);
    }
}
```

### 查找优化

```csharp
[CreateAssetMenu]
public class OptimizedItemDatabase : ScriptableObject
{
    [SerializeField] private ItemData[] items;

    // 延迟加载的查找表
    private Dictionary<string, ItemData> idLookup;
    private Dictionary<ItemData.ItemType, List<ItemData>> typeLookup;

    public ItemData GetByID(string id)
    {
        EnsureLookupInitialized();
        return idLookup.TryGetValue(id, out var item) ? item : null;
    }

    public IReadOnlyList<ItemData> GetByType(ItemData.ItemType type)
    {
        EnsureLookupInitialized();
        return typeLookup.TryGetValue(type, out var list) ? list : new List<ItemData>();
    }

    private void EnsureLookupInitialized()
    {
        if (idLookup != null) return;

        idLookup = new Dictionary<string, ItemData>();
        typeLookup = new Dictionary<ItemData.ItemType, List<ItemData>>();

        foreach (var item in items)
        {
            idLookup[item.itemID] = item;

            if (!typeLookup.ContainsKey(item.type))
            {
                typeLookup[item.type] = new List<ItemData>();
            }
            typeLookup[item.type].Add(item);
        }
    }
}
```

## 面试要点

### 核心问题

**Q1: 什么是 ScriptableObject，什么时候应该使用它？**

ScriptableObject 是一种数据容器，作为项目中的资源存在，独立于场景。使用场景：
- 共享配置数据（敌人属性、物品定义）
- 事件系统（解耦通信）
- 运行时集合（跟踪活动实例）
- 可插拔系统（可交换的行为）

**Q2: ScriptableObjects 如何改善内存使用？**

不是每个预制体实例都有自己的数据副本（消耗内存），而是所有实例引用同一个 ScriptableObject 资源。对于1000个敌人，每个有100字节属性，这可以节省约99.9KB内存。

**Q3: 运行时修改 ScriptableObject 数据会发生什么？**

在编辑器中，更改在播放模式结束后仍然存在（危险！）。在构建版本中，应用程序关闭时更改会丢失。解决方案：对运行时数据使用 `[NonSerialized]` 或用 `Instantiate()` 创建运行时副本。

### 实践问题

**Q4: 如何使用 ScriptableObjects 创建事件？**

创建一个维护监听器列表的 ScriptableObject。对象在 OnEnable/OnDisable 中注册/注销。当事件触发时，它通知所有监听器。这将发布者与订阅者解耦。

**Q5: 如何用 ScriptableObjects 处理保存/加载？**

ScriptableObjects 定义模式（存在什么数据），但运行时值应该单独保存。在保存文件中使用 ID 引用 ScriptableObjects，然后在加载时重建运行时状态。

**Q6: ScriptableObjects 有什么限制？**

- 无法序列化 Dictionary（需要变通方法）
- 运行时修改在编辑器中持久化
- 没有 Update/FixedUpdate（没有每帧逻辑）
- 无法直接引用场景对象

### 高级问题

**Q7: 解释 ScriptableObject 的生命周期。**

1. OnEnable：资源加载时调用（编辑器：首次引用时，构建：如果被引用则在启动时）
2. OnValidate：仅编辑器，值更改时调用
3. OnDisable：卸载前调用
4. OnDestroy：销毁时调用

**Q8: 如何使用 ScriptableObjects 实现可插拔的 AI 系统？**

为行为/状态创建抽象 ScriptableObject 基类。具体实现定义特定行为。AI 组件引用这些资源，可以在运行时交换行为。这允许设计师创建新的 AI 变体而无需更改代码。

## 延伸阅读

### 官方文档

- [Unity 手册：ScriptableObject](https://docs.unity3d.com/Manual/class-ScriptableObject.html)
- [Unity 脚本 API：ScriptableObject](https://docs.unity3d.com/ScriptReference/ScriptableObject.html)
- [Unity 手册：自定义编辑器](https://docs.unity3d.com/Manual/editor-CustomEditors.html)

### 进阶主题

- **Addressables**：ScriptableObject 资源的异步加载
- **SerializeReference**：多态序列化
- **Odin Inspector**：ScriptableObjects 的增强编辑器
- **UniRx**：与 ScriptableObjects 的响应式编程

### GDC 演讲

- "Overthrowing the MonoBehaviour Tyranny" - Ryan Hipple, Unite 2017
- "Game Architecture with ScriptableObjects" - Unity Technologies

### 书籍和文章

- 《游戏编程模式》 - Robert Nystrom
- Unity 博客：ScriptableObject 最佳实践

---

ScriptableObjects 是创建可扩展、可维护 Unity 项目的基础工具。通过分离数据和行为、启用设计师友好的工作流程以及提供内存高效的共享数据，它们解决了许多常见的游戏开发挑战。掌握这些模式，你将编写更清晰、更灵活的代码，更容易迭代和测试。
