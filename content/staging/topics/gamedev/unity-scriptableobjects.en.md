---
title: Unity ScriptableObjects Complete Guide
description: Master Unity ScriptableObjects - data containers, architectural patterns, event systems, and best practices for scalable game development
track: gamedev
section: unity
difficulty: intermediate
tags:
  - Unity
  - ScriptableObjects
  - Game Architecture
  - C#
  - Data Management
  - Design Patterns
status: imported
origin: old/src/content/docs/gamedev/unity-scriptableobjects.en.md
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

ScriptableObjects are one of Unity's most versatile yet underutilized features. They serve as data containers that exist outside of scenes, enabling cleaner architecture, better performance, and more maintainable code. This comprehensive guide covers everything from basic usage to advanced architectural patterns.

## Concept Explanation

### What Are ScriptableObjects?

A **ScriptableObject** is a data container that allows you to store large amounts of shared data independent from script instances. Unlike MonoBehaviours which must be attached to GameObjects in scenes, ScriptableObjects exist as assets in your project and can be referenced by multiple objects.

```csharp
// ScriptableObject definition
[CreateAssetMenu(fileName = "NewWeapon", menuName = "Game/Weapon Data")]
public class WeaponData : ScriptableObject
{
    public string weaponName;
    public int damage;
    public float fireRate;
    public Sprite icon;
}

// Usage in MonoBehaviour
public class Weapon : MonoBehaviour
{
    [SerializeField] private WeaponData data; // Reference to SO asset

    void Attack()
    {
        // All instances share the same data
        DealDamage(data.damage);
    }
}
```

The key insight is that ScriptableObjects are **assets**, not **scene objects**. They persist across scene loads and can be shared across any number of GameObjects.

### History and Evolution

| Version | Feature | Impact |
|---------|---------|--------|
| Unity 3.x | ScriptableObject introduced | Basic data storage |
| Unity 4.0 | CreateAssetMenu attribute | Easier asset creation |
| Unity 5.0 | Improved serialization | Better editor workflow |
| Unity 2017 | Addressables support | Async loading |
| Unity 2019 | Faster serialization | Performance improvements |
| Unity 2021 | SerializeReference | Polymorphic serialization |

### What Problems Do ScriptableObjects Solve?

1. **Memory efficiency**: Share data across instances instead of duplicating
2. **Decoupling**: Separate data from behavior
3. **Designer-friendly**: Non-programmers can tweak values
4. **Scene independence**: Data persists across scenes
5. **Version control friendly**: Changes are isolated to asset files
6. **Runtime modification**: Change values during play for testing

### ScriptableObjects vs Alternatives

```
┌───────────────────┬──────────────────────────────────────────────────────┐
│ Approach          │ Use Case                                              │
├───────────────────┼──────────────────────────────────────────────────────┤
│ Hard-coded values │ Quick prototyping, but not maintainable              │
│ Prefab values     │ Per-instance data, duplicated in memory              │
│ JSON/XML files    │ External editing, but no Unity integration           │
│ ScriptableObjects │ Shared data, Unity integration, editor workflow      │
│ Addressables      │ Dynamic loading, memory management                   │
│ Database          │ Large datasets, complex queries                      │
└───────────────────┴──────────────────────────────────────────────────────┘
```

## Core Principles

### Memory Model

```
Without ScriptableObjects:
┌─────────────────────────────────────────────────────────────────────┐
│  Scene                                                               │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ Enemy 1       │ │ Enemy 2       │ │ Enemy 3       │             │
│  │ ┌───────────┐ │ │ ┌───────────┐ │ │ ┌───────────┐ │             │
│  │ │ HP: 100   │ │ │ │ HP: 100   │ │ │ │ HP: 100   │ │ ← Duplicated│
│  │ │ DMG: 10   │ │ │ │ DMG: 10   │ │ │ │ DMG: 10   │ │   Data      │
│  │ │ Speed: 5  │ │ │ │ Speed: 5  │ │ │ │ Speed: 5  │ │             │
│  │ └───────────┘ │ │ └───────────┘ │ │ └───────────┘ │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
└─────────────────────────────────────────────────────────────────────┘

With ScriptableObjects:
┌─────────────────────────────────────────────────────────────────────┐
│  Project Assets                    Scene                            │
│  ┌───────────────┐                ┌───────────────┐                │
│  │ EnemyStats.SO │                │ Enemy 1       │                │
│  │ ┌───────────┐ │ ◄──Reference───│ [EnemyStats]  │                │
│  │ │ HP: 100   │ │                └───────────────┘                │
│  │ │ DMG: 10   │ │ ◄──Reference───┌───────────────┐                │
│  │ │ Speed: 5  │ │                │ Enemy 2       │ ← Shared       │
│  │ └───────────┘ │                │ [EnemyStats]  │   Reference    │
│  └───────────────┘ ◄──Reference───└───────────────┘                │
│                                   ┌───────────────┐                │
│                    ◄──Reference───│ Enemy 3       │                │
│                                   │ [EnemyStats]  │                │
│                                   └───────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

### Lifecycle

ScriptableObjects have a different lifecycle than MonoBehaviours:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   SCRIPTABLEOBJECT LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Asset Created (Editor)                                             │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐                                               │
│  │ Awake()          │  ◄── Called when asset loads into memory      │
│  └────────┬─────────┘      (Editor: on first reference)             │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnEnable()       │  ◄── Called after Awake, when enabled         │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnValidate()     │  ◄── Editor only: when values change          │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ Asset in use     │  ◄── Referenced by scenes/other assets        │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnDisable()      │  ◄── Before unload (domain reload, quit)      │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ OnDestroy()      │  ◄── When asset is destroyed/unloaded         │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Serialization

ScriptableObjects support Unity's serialization system:

```csharp
[CreateAssetMenu]
public class GameSettings : ScriptableObject
{
    // Serialized (saved to asset)
    public int maxPlayers = 4;
    public float masterVolume = 1f;
    [SerializeField] private string secretKey;

    // Not serialized
    [NonSerialized] public int runtimeScore;
    private System.Action callback; // Delegates not serialized

    // Serialized custom class (must be [Serializable])
    public PlayerDefaults playerDefaults;

    // Serialized collections
    public List<string> availableLevels;
    public Dictionary<string, int> highScores; // NOT serialized!
}

[Serializable]
public class PlayerDefaults
{
    public string name = "Player";
    public Color color = Color.blue;
    public int startingHealth = 100;
}
```

## Core Concepts

### Creating ScriptableObjects

#### Using CreateAssetMenu

```csharp
// Creates menu item: Assets > Create > Game > Character Stats
[CreateAssetMenu(fileName = "NewCharacterStats", menuName = "Game/Character Stats", order = 1)]
public class CharacterStats : ScriptableObject
{
    [Header("Basic Info")]
    public string characterName;
    public Sprite portrait;

    [Header("Combat Stats")]
    [Range(1, 100)] public int health = 100;
    [Range(1, 50)] public int attack = 10;
    [Range(1, 50)] public int defense = 5;

    [Header("Movement")]
    public float moveSpeed = 5f;
    public float jumpHeight = 2f;

    [TextArea(3, 5)]
    public string description;
}
```

#### Programmatic Creation

```csharp
public class DataGenerator : MonoBehaviour
{
    void CreateAssetAtRuntime()
    {
        // Create instance
        CharacterStats newStats = ScriptableObject.CreateInstance<CharacterStats>();
        newStats.characterName = "Generated Hero";
        newStats.health = 150;

        // In Editor: Save as asset
        #if UNITY_EDITOR
        UnityEditor.AssetDatabase.CreateAsset(newStats, "Assets/Data/GeneratedHero.asset");
        UnityEditor.AssetDatabase.SaveAssets();
        #endif
    }

    void CreateRuntimeOnlyInstance()
    {
        // Runtime-only instance (not saved)
        CharacterStats tempStats = ScriptableObject.CreateInstance<CharacterStats>();
        tempStats.characterName = "Temp Character";

        // Use it...

        // Clean up when done
        Destroy(tempStats);
    }
}
```

### Data Containers

#### Basic Data Container

```csharp
[CreateAssetMenu(menuName = "Inventory/Item")]
public class ItemData : ScriptableObject
{
    [Header("Basic Info")]
    public string itemName;
    public string itemID;
    public Sprite icon;
    [TextArea] public string description;

    [Header("Properties")]
    public ItemType type;
    public ItemRarity rarity;
    public int maxStackSize = 99;
    public bool isConsumable;

    [Header("Value")]
    public int buyPrice;
    public int sellPrice;

    public enum ItemType { Weapon, Armor, Consumable, Material, Quest }
    public enum ItemRarity { Common, Uncommon, Rare, Epic, Legendary }
}

// Usage
public class InventorySlot : MonoBehaviour
{
    [SerializeField] private ItemData item;
    [SerializeField] private int quantity;

    public void DisplayItem()
    {
        Debug.Log($"{item.itemName} x{quantity}");
        Debug.Log($"Worth: {item.sellPrice * quantity} gold");
    }
}
```

#### Nested Data with Inheritance

```csharp
// Base class
public abstract class AbilityData : ScriptableObject
{
    public string abilityName;
    public Sprite icon;
    public float cooldown;
    public int manaCost;

    public abstract void Execute(Character caster, Character target);
}

// Derived classes
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

### Event System with ScriptableObjects

```csharp
// Game Event - acts as a channel
[CreateAssetMenu(menuName = "Events/Game Event")]
public class GameEvent : ScriptableObject
{
    private readonly List<GameEventListener> listeners = new List<GameEventListener>();

    public void Raise()
    {
        // Iterate backwards in case listeners remove themselves
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

// Listener component
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

// Generic Event with data
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

### Variable Systems

```csharp
// Float Variable
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

// Reference that can use variable or constant
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

// Custom property drawer for FloatReference
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

// Usage
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

### Runtime Sets

```csharp
// Runtime Set - tracks active instances
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

// Concrete implementation for enemies
[CreateAssetMenu(menuName = "Runtime/Enemy Set")]
public class EnemyRuntimeSet : RuntimeSet<Enemy> { }

// Enemy automatically registers itself
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

// Game systems can query the set
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

## Code Examples

### Complete Item System

```csharp
using UnityEngine;
using System.Collections.Generic;

// Item Database
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
    [ContextMenu("Populate from folder")]
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

// Equipment Data extends ItemData
[CreateAssetMenu(menuName = "Inventory/Equipment")]
public class EquipmentData : ItemData
{
    [Header("Equipment")]
    public EquipmentSlot slot;
    public int strengthBonus;
    public int agilityBonus;
    public int intelligenceBonus;
    public int armorBonus;

    [Header("Requirements")]
    public int requiredLevel;
    public CharacterClass requiredClass;

    public enum EquipmentSlot { Head, Chest, Legs, Feet, MainHand, OffHand, Accessory }
    public enum CharacterClass { Any, Warrior, Mage, Rogue }
}

// Consumable Data
[CreateAssetMenu(menuName = "Inventory/Consumable")]
public class ConsumableData : ItemData
{
    [Header("Effects")]
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
            // ... other effects
        }
    }
}

// Inventory System
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
        // Try to stack
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

        // Add new stack
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

    // Save/Load
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

### State Machine with ScriptableObjects

```csharp
using UnityEngine;

// Base State
public abstract class State : ScriptableObject
{
    public abstract void OnEnter(StateMachine stateMachine);
    public abstract void OnUpdate(StateMachine stateMachine);
    public abstract void OnExit(StateMachine stateMachine);
}

// State Machine
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

// Concrete States
[CreateAssetMenu(menuName = "AI/States/Idle State")]
public class IdleState : State
{
    public float idleDuration = 2f;
    public State patrolState;

    private float timer;

    public override void OnEnter(StateMachine stateMachine)
    {
        timer = 0f;
        Debug.Log("Entering Idle State");
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
        Debug.Log("Exiting Idle State");
    }
}

[CreateAssetMenu(menuName = "AI/States/Patrol State")]
public class PatrolState : State
{
    public float patrolSpeed = 3f;
    public float waypointReachDistance = 0.5f;
    public State idleState;
    public State chaseState;

    public override void OnEnter(StateMachine stateMachine)
    {
        Debug.Log("Entering Patrol State");
    }

    public override void OnUpdate(StateMachine stateMachine)
    {
        var enemy = stateMachine.GetComponent<Enemy>();

        // Check for player
        if (enemy.CanSeePlayer())
        {
            stateMachine.TransitionTo(chaseState);
            return;
        }

        // Move to waypoint
        Vector3 target = enemy.GetCurrentWaypoint();
        Vector3 direction = (target - stateMachine.transform.position).normalized;
        stateMachine.transform.Translate(direction * patrolSpeed * Time.deltaTime);

        // Check if reached waypoint
        if (Vector3.Distance(stateMachine.transform.position, target) < waypointReachDistance)
        {
            enemy.NextWaypoint();
            stateMachine.TransitionTo(idleState);
        }
    }

    public override void OnExit(StateMachine stateMachine)
    {
        Debug.Log("Exiting Patrol State");
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
        Debug.Log("Entering Chase State");
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

        // Lost player
        if (distance > loseDistance || !enemy.CanSeePlayer())
        {
            stateMachine.TransitionTo(patrolState);
            return;
        }

        // In attack range
        if (distance < attackRange)
        {
            stateMachine.TransitionTo(attackState);
            return;
        }

        // Chase
        Vector3 direction = (player.position - stateMachine.transform.position).normalized;
        stateMachine.transform.Translate(direction * chaseSpeed * Time.deltaTime);
    }

    public override void OnExit(StateMachine stateMachine)
    {
        Debug.Log("Exiting Chase State");
    }
}
```

### Audio System with ScriptableObjects

```csharp
using UnityEngine;
using UnityEngine.Audio;

// Audio Event
[CreateAssetMenu(menuName = "Audio/Audio Event")]
public class AudioEvent : ScriptableObject
{
    [Header("Clips")]
    public AudioClip[] clips;

    [Header("Volume")]
    [Range(0f, 1f)] public float volumeMin = 1f;
    [Range(0f, 1f)] public float volumeMax = 1f;

    [Header("Pitch")]
    [Range(0.1f, 3f)] public float pitchMin = 1f;
    [Range(0.1f, 3f)] public float pitchMax = 1f;

    [Header("Spatial")]
    [Range(0f, 1f)] public float spatialBlend = 0f;
    public float minDistance = 1f;
    public float maxDistance = 100f;

    [Header("Mixer")]
    public AudioMixerGroup mixerGroup;

    public void Play(AudioSource source)
    {
        if (clips.Length == 0) return;

        source.clip = clips[Random.Range(0, clips.Length)];
        source.volume = Random.Range(volumeMin, volumeMax);
        source.pitch = Random.Range(pitchMin, pitchMax);
        source.spatialBlend = spatialBlend;
        source.minDistance = minDistance;
        source.maxDistance = maxDistance;
        source.outputAudioMixerGroup = mixerGroup;
        source.Play();
    }

    public void PlayAtPoint(Vector3 position)
    {
        if (clips.Length == 0) return;

        GameObject tempGO = new GameObject("TempAudio");
        tempGO.transform.position = position;

        AudioSource source = tempGO.AddComponent<AudioSource>();
        Play(source);

        Destroy(tempGO, source.clip.length / source.pitch);
    }
}

// Audio Manager
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [SerializeField] private AudioSource musicSource;
    [SerializeField] private AudioSource sfxSource;
    [SerializeField] private int sfxPoolSize = 10;

    private List<AudioSource> sfxPool = new List<AudioSource>();

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeSfxPool();
        }
        else
        {
            Destroy(gameObject);
        }
    }

    private void InitializeSfxPool()
    {
        for (int i = 0; i < sfxPoolSize; i++)
        {
            GameObject sfxGO = new GameObject($"SFX_{i}");
            sfxGO.transform.SetParent(transform);
            AudioSource source = sfxGO.AddComponent<AudioSource>();
            source.playOnAwake = false;
            sfxPool.Add(source);
        }
    }

    public void PlaySFX(AudioEvent audioEvent)
    {
        AudioSource source = GetAvailableSource();
        if (source != null)
        {
            audioEvent.Play(source);
        }
    }

    public void PlaySFXAtPoint(AudioEvent audioEvent, Vector3 position)
    {
        audioEvent.PlayAtPoint(position);
    }

    private AudioSource GetAvailableSource()
    {
        foreach (var source in sfxPool)
        {
            if (!source.isPlaying)
            {
                return source;
            }
        }
        return null;
    }
}

// Usage
public class PlayerWeapon : MonoBehaviour
{
    [SerializeField] private AudioEvent fireSound;
    [SerializeField] private AudioEvent reloadSound;
    [SerializeField] private AudioEvent emptySound;

    public void Fire()
    {
        AudioManager.Instance.PlaySFX(fireSound);
    }

    public void Reload()
    {
        AudioManager.Instance.PlaySFX(reloadSound);
    }
}
```

## Best Practices

### 1. Organize with Folders

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

### 2. Use Interfaces for Flexibility

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

// ScriptableObject that defines behavior
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

    public string GetInteractionPrompt() => "Open Chest";
}
```

### 3. Reset Runtime Data Properly

```csharp
[CreateAssetMenu]
public class RuntimeGameData : ScriptableObject
{
    [Header("Persistent (saved)")]
    public int highScore;

    [Header("Runtime (reset each session)")]
    [NonSerialized] public int currentScore;
    [NonSerialized] public int currentLevel;
    [NonSerialized] public List<string> collectedItems = new List<string>();

    private void OnEnable()
    {
        // Reset runtime data when asset loads
        ResetRuntimeData();
    }

    public void ResetRuntimeData()
    {
        currentScore = 0;
        currentLevel = 1;
        collectedItems = new List<string>();
    }

    #if UNITY_EDITOR
    // Also reset when exiting play mode
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

### 4. Validate Data in Editor

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
        // Validate name
        if (string.IsNullOrEmpty(enemyName))
        {
            Debug.LogWarning($"Enemy config {name} has no name set!", this);
        }

        // Validate prefab
        if (prefab == null)
        {
            Debug.LogError($"Enemy config {name} has no prefab!", this);
        }

        // Validate drop table
        if (dropTable != null)
        {
            foreach (var item in dropTable)
            {
                if (item == null)
                {
                    Debug.LogWarning($"Enemy config {name} has null item in drop table!", this);
                }
            }
        }

        // Ensure name matches asset name
        #if UNITY_EDITOR
        if (!string.IsNullOrEmpty(enemyName) && name != enemyName)
        {
            string path = UnityEditor.AssetDatabase.GetAssetPath(this);
            if (!string.IsNullOrEmpty(path))
            {
                UnityEditor.AssetDatabase.RenameAsset(path, enemyName);
            }
        }
        #endif
    }
}
```

### 5. Use Custom Editors for Complex Data

```csharp
#if UNITY_EDITOR
[CustomEditor(typeof(DialogueData))]
public class DialogueDataEditor : Editor
{
    private SerializedProperty dialogueNodes;
    private ReorderableList nodeList;

    private void OnEnable()
    {
        dialogueNodes = serializedObject.FindProperty("nodes");
        nodeList = new ReorderableList(serializedObject, dialogueNodes)
        {
            drawHeaderCallback = rect => EditorGUI.LabelField(rect, "Dialogue Nodes"),
            drawElementCallback = DrawNode,
            elementHeightCallback = GetNodeHeight
        };
    }

    public override void OnInspectorGUI()
    {
        serializedObject.Update();

        EditorGUILayout.LabelField("Dialogue Editor", EditorStyles.boldLabel);
        EditorGUILayout.Space();

        nodeList.DoLayoutList();

        if (GUILayout.Button("Preview Dialogue"))
        {
            PreviewDialogue();
        }

        serializedObject.ApplyModifiedProperties();
    }

    private void DrawNode(Rect rect, int index, bool isActive, bool isFocused)
    {
        var element = dialogueNodes.GetArrayElementAtIndex(index);
        EditorGUI.PropertyField(rect, element, true);
    }

    private float GetNodeHeight(int index)
    {
        var element = dialogueNodes.GetArrayElementAtIndex(index);
        return EditorGUI.GetPropertyHeight(element, true) + 4;
    }

    private void PreviewDialogue()
    {
        // Open preview window
    }
}
#endif
```

## Common Pitfalls

### 1. Modifying ScriptableObject Data at Runtime

```csharp
// PROBLEM: Changes persist in Editor after play mode ends!
[CreateAssetMenu]
public class PlayerStats : ScriptableObject
{
    public int currentHealth = 100; // This change persists!

    public void TakeDamage(int damage)
    {
        currentHealth -= damage; // BAD: Modifies the asset
    }
}

// SOLUTION 1: Use NonSerialized for runtime data
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
        currentHealth -= damage; // OK: Not serialized
    }
}

// SOLUTION 2: Create runtime copies
public class PlayerWithCopy : MonoBehaviour
{
    [SerializeField] private PlayerStats baseStats;
    private PlayerStats runtimeStats;

    void Start()
    {
        // Create runtime copy
        runtimeStats = Instantiate(baseStats);
    }

    void TakeDamage(int damage)
    {
        runtimeStats.TakeDamage(damage); // Modifies copy only
    }

    void OnDestroy()
    {
        // Clean up copy
        if (runtimeStats != null)
        {
            Destroy(runtimeStats);
        }
    }
}
```

### 2. Null References After Scene Load

```csharp
// PROBLEM: References can become null after scene reload
public class GameManager : MonoBehaviour
{
    [SerializeField] private PlayerRuntimeSet playerSet;

    void OnLevelLoaded()
    {
        // playerSet.Items might be stale if players were destroyed
        foreach (var player in playerSet.Items) // NullReferenceException!
        {
            player.Reset();
        }
    }
}

// SOLUTION: Validate references and handle cleanup
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

    // Called on scene change
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

### 3. Circular References

```csharp
// PROBLEM: Circular references cause serialization issues
[CreateAssetMenu]
public class QuestData : ScriptableObject
{
    public QuestData prerequisiteQuest; // Could create circle
    public QuestData[] unlockQuests;    // Could reference back
}

// SOLUTION: Use IDs or validate in editor
[CreateAssetMenu]
public class QuestDataSafe : ScriptableObject
{
    public string questID;
    public string prerequisiteQuestID; // Reference by ID

    #if UNITY_EDITOR
    [SerializeField] private QuestDataSafe prerequisiteQuest; // Editor only

    private void OnValidate()
    {
        if (prerequisiteQuest != null)
        {
            // Check for circular reference
            if (HasCircularReference(this, prerequisiteQuest))
            {
                Debug.LogError($"Circular reference detected in {name}!", this);
                prerequisiteQuest = null;
            }
            else
            {
                prerequisiteQuestID = prerequisiteQuest.questID;
            }
        }
    }

    private bool HasCircularReference(QuestDataSafe start, QuestDataSafe check)
    {
        if (check == null) return false;
        if (check == start) return true;
        return HasCircularReference(start, check.prerequisiteQuest);
    }
    #endif
}
```

### 4. Dictionary Serialization

```csharp
// PROBLEM: Dictionary is not serialized!
[CreateAssetMenu]
public class LocalizationData : ScriptableObject
{
    // This will NOT be saved!
    public Dictionary<string, string> translations = new Dictionary<string, string>();
}

// SOLUTION: Use serializable wrapper
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

## Performance Considerations

### Memory Efficiency

```csharp
// Comparison: 1000 enemies with stats

// Without ScriptableObjects: ~100KB duplicated data
// Each enemy has its own copy of stats in memory

// With ScriptableObjects: ~100 bytes reference + ~100 bytes shared data
// All enemies share one stats asset
```

### Loading Patterns

```csharp
public class AssetLoader : MonoBehaviour
{
    // Direct reference: Loaded immediately
    [SerializeField] private ItemData directReference;

    // Addressables: Loaded on demand
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

### Lookup Optimization

```csharp
[CreateAssetMenu]
public class OptimizedItemDatabase : ScriptableObject
{
    [SerializeField] private ItemData[] items;

    // Lazy-loaded lookup table
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

## Real-World Scenarios

### Dialogue System

```csharp
[CreateAssetMenu(menuName = "Dialogue/Conversation")]
public class ConversationData : ScriptableObject
{
    public string conversationID;
    public DialogueNode[] nodes;

    [Serializable]
    public class DialogueNode
    {
        public string nodeID;
        public string speakerName;
        [TextArea(3, 5)] public string text;
        public Sprite speakerPortrait;
        public AudioClip voiceLine;
        public DialogueChoice[] choices;
        public string nextNodeID; // If no choices
        public DialogueCondition[] conditions;
    }

    [Serializable]
    public class DialogueChoice
    {
        public string choiceText;
        public string targetNodeID;
        public DialogueCondition[] conditions;
        public DialogueEffect[] effects;
    }

    [Serializable]
    public class DialogueCondition
    {
        public ConditionType type;
        public string parameter;
        public int value;
    }

    [Serializable]
    public class DialogueEffect
    {
        public EffectType type;
        public string parameter;
        public int value;
    }

    public enum ConditionType { HasItem, QuestState, Reputation, HasGold }
    public enum EffectType { GiveItem, SetQuestState, ModifyReputation, GiveGold }
}
```

### Skill Tree System

```csharp
[CreateAssetMenu(menuName = "Skills/Skill Tree")]
public class SkillTreeData : ScriptableObject
{
    public string treeName;
    public Sprite treeIcon;
    public SkillNodeData[] skills;
}

[CreateAssetMenu(menuName = "Skills/Skill Node")]
public class SkillNodeData : ScriptableObject
{
    [Header("Basic Info")]
    public string skillName;
    public string skillID;
    public Sprite icon;
    [TextArea] public string description;

    [Header("Requirements")]
    public SkillNodeData[] prerequisites;
    public int pointCost = 1;
    public int requiredLevel = 1;

    [Header("Effects")]
    public SkillEffect[] effects;

    [Header("Visual")]
    public Vector2 treePosition; // Position in skill tree UI

    [Serializable]
    public class SkillEffect
    {
        public EffectType type;
        public float value;
        public float valuePerRank;
        public int maxRanks = 1;
    }

    public enum EffectType
    {
        IncreaseDamage,
        IncreaseHealth,
        ReduceCooldown,
        AddAbility,
        UnlockPassive
    }

    public bool CanUnlock(Character character, SkillManager skillManager)
    {
        // Check level
        if (character.Level < requiredLevel)
            return false;

        // Check skill points
        if (skillManager.AvailablePoints < pointCost)
            return false;

        // Check prerequisites
        foreach (var prereq in prerequisites)
        {
            if (!skillManager.HasSkill(prereq.skillID))
                return false;
        }

        return true;
    }
}
```

## Interview Key Points

### Core Questions

**Q1: What is a ScriptableObject and when should you use it?**

A ScriptableObject is a data container that exists as an asset in your project, independent of scenes. Use them for:
- Shared configuration data (enemy stats, item definitions)
- Event systems (decoupled communication)
- Runtime sets (tracking active instances)
- Pluggable systems (swappable behaviors)

**Q2: How do ScriptableObjects improve memory usage?**

Instead of each prefab instance having its own copy of data (which consumes memory), all instances reference the same ScriptableObject asset. For 1000 enemies with 100 bytes of stats, this saves ~99.9KB of memory.

**Q3: What happens to ScriptableObject data modified at runtime?**

In the Editor, changes persist after play mode ends (dangerous!). In builds, changes are lost when the application closes. Solution: Use `[NonSerialized]` for runtime data or create runtime copies with `Instantiate()`.

### Practical Questions

**Q4: How do you create events using ScriptableObjects?**

Create a ScriptableObject that maintains a list of listeners. Objects register/unregister in OnEnable/OnDisable. When the event is raised, it notifies all listeners. This decouples publishers from subscribers.

**Q5: How do you handle saving/loading with ScriptableObjects?**

ScriptableObjects define the schema (what data exists), but runtime values should be saved separately. Use IDs to reference ScriptableObjects in save files, then rebuild runtime state on load.

**Q6: What are the limitations of ScriptableObjects?**

- Cannot serialize Dictionary (need workarounds)
- Runtime modifications persist in Editor
- No Update/FixedUpdate (no per-frame logic)
- Cannot reference scene objects directly

### Advanced Questions

**Q7: Explain the ScriptableObject lifecycle.**

1. OnEnable: Called when asset loads (Editor: on first reference, Build: at startup if referenced)
2. OnValidate: Editor only, called when values change
3. OnDisable: Called before unload
4. OnDestroy: Called when destroyed

**Q8: How would you implement a pluggable AI system using ScriptableObjects?**

Create abstract ScriptableObject base class for behaviors/states. Concrete implementations define specific behaviors. AI components reference these assets and can swap behaviors at runtime. This allows designers to create new AI variations without code changes.

## Further Reading

### Official Documentation

- [Unity Manual: ScriptableObject](https://docs.unity3d.com/Manual/class-ScriptableObject.html)
- [Unity Scripting API: ScriptableObject](https://docs.unity3d.com/ScriptReference/ScriptableObject.html)
- [Unity Manual: Custom Editors](https://docs.unity3d.com/Manual/editor-CustomEditors.html)

### Advanced Topics

- **Addressables**: Async loading of ScriptableObject assets
- **SerializeReference**: Polymorphic serialization
- **Odin Inspector**: Enhanced editor for ScriptableObjects
- **UniRx**: Reactive programming with ScriptableObjects

### GDC Talks

- "Overthrowing the MonoBehaviour Tyranny" - Ryan Hipple, Unite 2017
- "Game Architecture with ScriptableObjects" - Unity Technologies

### Books and Articles

- "Game Programming Patterns" by Robert Nystrom
- Unity Blog: ScriptableObject Best Practices

---

ScriptableObjects are a fundamental tool for creating scalable, maintainable Unity projects. By separating data from behavior, enabling designer-friendly workflows, and providing memory-efficient shared data, they solve many common game development challenges. Master these patterns and you'll write cleaner, more flexible code that's easier to iterate on and test.
