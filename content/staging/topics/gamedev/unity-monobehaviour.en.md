---
title: Unity MonoBehaviour Lifecycle Deep Dive
description: Complete guide to Unity MonoBehaviour lifecycle methods, execution order, and best practices
track: gamedev
section: unity
difficulty: intermediate
tags:
  - unity
  - monobehaviour
  - lifecycle
  - game development
status: imported
origin: old/src/content/docs/gamedev/unity-monobehaviour.en.md
divergence: 0.198
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 10
  lastUpdated: 2026-01-07
---

Understanding the MonoBehaviour lifecycle is fundamental to becoming a proficient Unity developer. Every script that interacts with GameObjects inherits from MonoBehaviour, and knowing when each lifecycle method executes can mean the difference between a smooth-running game and one plagued by bugs and performance issues.

## Concept Overview

### What is MonoBehaviour?

MonoBehaviour is the base class from which every Unity script derives. It provides the interface that allows your C# scripts to hook into Unity's game loop and respond to events throughout a GameObject's existence. When you create a new C# script in Unity, it automatically inherits from MonoBehaviour.

```
+---------------------------------------------------------------------+
|                        Unity Engine                                  |
|                                                                      |
|    +------------------+                                              |
|    |   Scene          |                                              |
|    |                  |                                              |
|    |  +--------------------------------------+                       |
|    |  |       GameObject                     |                       |
|    |  |                                      |                       |
|    |  |  +--------------------------------+  |                       |
|    |  |  |  MonoBehaviour Script          |  |                       |
|    |  |  |  --------------------------    |  |                       |
|    |  |  |  Awake()                       |<-+--- Engine calls       |
|    |  |  |  Start()                       |      automatically       |
|    |  |  |  Update()                      |                          |
|    |  |  |  OnDestroy()                   |                          |
|    |  |  +--------------------------------+  |                       |
|    |  +--------------------------------------+                       |
|    +------------------+                                              |
|                                                                      |
+---------------------------------------------------------------------+
```

### Historical Context

MonoBehaviour has been part of Unity since its earliest versions (Unity 1.0, released in 2005). It was designed to provide a simple, event-driven programming model accessible to developers of all skill levels. The name "MonoBehaviour" combines "Mono" (Unity's original .NET runtime based on the Mono framework) and "Behaviour" (the component pattern for adding functionality to GameObjects).

While Unity has introduced newer paradigms like DOTS (Data-Oriented Technology Stack) and ECS (Entity Component System), MonoBehaviour remains the primary scripting model and is unlikely to be deprecated.

### What Problems Does It Solve?

The lifecycle system addresses several critical challenges in game development:

1. **Initialization Ordering**: Games need predictable setup sequences where dependencies are initialized before dependent objects
2. **Frame-by-Frame Updates**: Games require code that runs every frame for movement, AI, and game logic
3. **Physics Synchronization**: Physics calculations need to run at fixed intervals, separate from rendering
4. **Resource Management**: Objects need opportunities to clean up resources when destroyed or disabled
5. **Event Coordination**: Multiple scripts on different objects need to execute in a predictable order

## Core Architecture

### Unity's Game Loop

Unity's engine runs a main loop that processes each frame. Within this loop, MonoBehaviour methods are called in a specific, deterministic order:

```
+=====================================================================+
|                     UNITY FRAME EXECUTION                            |
+=====================================================================+
|                                                                      |
|  +---------------------------------------------------------------+  |
|  |              INITIALIZATION PHASE                              |  |
|  |  +---------+    +----------+    +---------+                   |  |
|  |  |  Awake  |--->| OnEnable |--->|  Start  |                   |  |
|  |  +---------+    +----------+    +---------+                   |  |
|  |       ^              ^               ^                         |  |
|  |       |              |               |                         |  |
|  |    (Once)    (Each Enable)     (Once, First Frame)            |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              PHYSICS PHASE (Fixed Timestep)                    |  |
|  |  +-------------+    +------------------------+                 |  |
|  |  | FixedUpdate |--->| Internal Physics Update |                |  |
|  |  +-------------+    +------------------------+                 |  |
|  |        ^                                                       |  |
|  |        |                                                       |  |
|  |   (0 to N times per frame, based on Time.fixedDeltaTime)      |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              GAME LOGIC PHASE                                  |  |
|  |  +--------+    +------------+    +------------+                |  |
|  |  | Update |--->| LateUpdate |--->| Animations |                |  |
|  |  +--------+    +------------+    +------------+                |  |
|  |       ^                                                        |  |
|  |       |                                                        |  |
|  |   (Once per frame)                                             |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              RENDERING PHASE                                   |  |
|  |  +------------------+    +---------------------+               |  |
|  |  | OnPreRender/Cull |--->| OnRenderObject/Image |               |  |
|  |  +------------------+    +---------------------+               |  |
|  +---------------------------------------------------------------+  |
|                              |                                       |
|                              v                                       |
|  +---------------------------------------------------------------+  |
|  |              DECOMMISSIONING PHASE                             |  |
|  |  +-----------+    +-------------+                              |  |
|  |  | OnDisable |--->|  OnDestroy  |                              |  |
|  |  +-----------+    +-------------+                              |  |
|  |       ^                  ^                                     |  |
|  |       |                  |                                     |  |
|  |  (Each Disable)     (Once, on destruction)                    |  |
|  +---------------------------------------------------------------+  |
|                                                                      |
+=====================================================================+
```

### Message-Based Invocation

Unity uses reflection and caching to invoke lifecycle methods. When a MonoBehaviour is added to a GameObject, Unity scans the class for known method signatures. These are then called via Unity's native C++ engine, not through C# virtual method dispatch. This is why lifecycle methods don't need to be marked as `override`.

### Internal Execution Mechanism

Unity uses C++ for its core engine and calls C# MonoBehaviour methods through the Scripting Runtime:

1. **Deserialization**: GameObjects and components are recreated from serialized data
2. **Method Binding**: Unity's native code registers pointers to MonoBehaviour lifecycle methods
3. **Execution Queue**: Methods are added to execution lists based on their type
4. **Invocation**: The engine iterates through lists and calls methods in order

## Key Concepts

### Initialization Methods

#### Awake()

Called **once** when the script instance is loaded. Key characteristics:

- Called even if the script is disabled
- Called before any Start() methods
- Called when: scene loads, `Instantiate()` is called, or `AddComponent<T>()` is used
- Use for: initializing references between scripts, setting up that doesn't depend on other objects

#### OnEnable()

Called each time the object becomes enabled and active:

- Called after Awake() on first enable
- Called every time the component is re-enabled
- Use for: subscribing to events, object pool reactivation, registering with managers

#### Start()

Called **once** before the first frame update:

- Only called if the script is enabled
- Called after all Awake() methods have completed
- Use for: initialization that depends on other objects being ready

### Update Methods

| Method | Timing | Use Case | Delta Time |
|--------|--------|----------|------------|
| `FixedUpdate()` | Fixed interval (default 0.02s) | Physics, consistent simulation | `Time.fixedDeltaTime` |
| `Update()` | Every frame | Input, most game logic | `Time.deltaTime` |
| `LateUpdate()` | After all Update() | Camera follow, post-processing | `Time.deltaTime` |

#### FixedUpdate()

- Called at fixed time intervals (default: 0.02 seconds / 50 times per second)
- Independent of frame rate
- Can be called 0, 1, or multiple times per frame
- Use for: physics calculations, rigidbody manipulation

#### Update()

- Called once per frame
- Frame rate dependent (varies with performance)
- Use for: input handling, non-physics game logic, visual updates

#### LateUpdate()

- Called once per frame, after all Update() methods
- Use for: camera follow logic, anything that needs to happen after all objects have updated

### Decommissioning Methods

#### OnDisable()

- Called when the object becomes disabled or inactive
- Called before OnDestroy()
- Use for: unsubscribing from events, cleanup that needs to happen on disable

#### OnDestroy()

- Called when the object is destroyed
- Called when the scene or game ends
- Use for: final cleanup, releasing resources

### Complete Method Execution Order

```
FIRST SCENE LOAD
-----------------
Awake
OnEnable
Start

EACH FRAME
-----------------
FixedUpdate (0 to N times)
  +---> OnTriggerXXX
  +---> OnCollisionXXX
Update
  +---> Coroutine yield null
LateUpdate

WHEN DISABLED
-----------------
OnDisable

WHEN RE-ENABLED
-----------------
OnEnable

WHEN DESTROYED
-----------------
OnDisable
OnDestroy

APPLICATION QUIT
-----------------
OnApplicationQuit
OnDisable
OnDestroy
```

## Code Examples

### Basic Lifecycle Demonstration

```csharp
using UnityEngine;

/// <summary>
/// Demonstrates the complete MonoBehaviour lifecycle with logging.
/// Attach to any GameObject to observe the execution order.
/// </summary>
public class LifecycleDemo : MonoBehaviour
{
    [Header("Configuration")]
    [SerializeField] private bool logUpdates = false;

    private int frameCount = 0;
    private int fixedUpdateCount = 0;

    // ====== INITIALIZATION PHASE ======

    void Awake()
    {
        // Called when script instance is loaded (even if disabled)
        Debug.Log($"[{Time.frameCount}] Awake() - Script instance loaded");
        Debug.Log($"  - enabled: {enabled}");
        Debug.Log($"  - gameObject.activeInHierarchy: {gameObject.activeInHierarchy}");
    }

    void OnEnable()
    {
        // Called each time script is enabled
        Debug.Log($"[{Time.frameCount}] OnEnable() - Script enabled");

        // Good for: Subscribing to events
        GameEvents.OnGamePaused += HandleGamePaused;
    }

    void Start()
    {
        // Called once before first Update (only if enabled)
        Debug.Log($"[{Time.frameCount}] Start() - First frame initialization");

        // Safe to access other scripts here - their Awake() is complete
    }

    // ====== GAME LOOP PHASE ======

    void FixedUpdate()
    {
        // Called at fixed intervals (default 50Hz)
        fixedUpdateCount++;
        if (logUpdates)
            Debug.Log($"[Frame {Time.frameCount}] FixedUpdate #{fixedUpdateCount}");
    }

    void Update()
    {
        // Called once per frame
        frameCount++;
        if (logUpdates)
            Debug.Log($"[Frame {Time.frameCount}] Update #{frameCount}, Delta: {Time.deltaTime}");
    }

    void LateUpdate()
    {
        // Called after all Update() calls complete
        if (logUpdates)
            Debug.Log($"[Frame {Time.frameCount}] LateUpdate");
    }

    // ====== PHYSICS CALLBACKS ======

    void OnCollisionEnter(Collision collision)
    {
        Debug.Log($"[{Time.frameCount}] OnCollisionEnter with {collision.gameObject.name}");

        // Access collision details
        ContactPoint contact = collision.contacts[0];
        Vector3 impactPoint = contact.point;
        float impactForce = collision.relativeVelocity.magnitude;
    }

    void OnTriggerEnter(Collider other)
    {
        Debug.Log($"[{Time.frameCount}] OnTriggerEnter with {other.gameObject.name}");
    }

    // ====== CLEANUP PHASE ======

    void OnDisable()
    {
        // Called when script is disabled
        Debug.Log($"[{Time.frameCount}] OnDisable() - Script disabled");

        // Always unsubscribe from events
        GameEvents.OnGamePaused -= HandleGamePaused;
    }

    void OnDestroy()
    {
        // Called when script/object is destroyed
        Debug.Log($"[{Time.frameCount}] OnDestroy() - Script destroyed");
        Debug.Log($"  - Total frames: {frameCount}");
        Debug.Log($"  - Total fixed updates: {fixedUpdateCount}");
    }

    // ====== APPLICATION CALLBACKS ======

    void OnApplicationFocus(bool hasFocus)
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationFocus({hasFocus})");
    }

    void OnApplicationPause(bool pauseStatus)
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationPause({pauseStatus})");
    }

    void OnApplicationQuit()
    {
        Debug.Log($"[{Time.frameCount}] OnApplicationQuit()");
    }

    private void HandleGamePaused(bool isPaused) { }
}
```

### Script Execution Order Control

```csharp
using UnityEngine;

// Method 1: Using DefaultExecutionOrder attribute
// Negative values execute earlier, positive values execute later
[DefaultExecutionOrder(-100)]
public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    private void Awake()
    {
        // This Awake runs before scripts with higher execution order
        Instance = this;
        Debug.Log("GameManager initialized first!");
    }
}

[DefaultExecutionOrder(100)]
public class PlayerController : MonoBehaviour
{
    private void Awake()
    {
        // This runs after GameManager.Awake
        // GameManager.Instance is guaranteed to be available
        Debug.Log($"Player can access GameManager: {GameManager.Instance != null}");
    }
}
```

### Coroutines and Lifecycle Integration

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineLifecycle : MonoBehaviour
{
    private Coroutine runningCoroutine;

    // Cache WaitFor objects to avoid GC allocation
    private readonly WaitForSeconds waitOneSecond = new WaitForSeconds(1f);
    private readonly WaitForFixedUpdate waitFixed = new WaitForFixedUpdate();
    private readonly WaitForEndOfFrame waitEndOfFrame = new WaitForEndOfFrame();

    private void OnEnable()
    {
        // Start coroutine when enabled
        runningCoroutine = StartCoroutine(ContinuousProcess());
    }

    private void OnDisable()
    {
        // Stop coroutine when disabled to prevent errors
        if (runningCoroutine != null)
        {
            StopCoroutine(runningCoroutine);
            runningCoroutine = null;
        }
    }

    private IEnumerator ContinuousProcess()
    {
        while (true)
        {
            Debug.Log("Coroutine running...");

            // yield return null executes after Update, before LateUpdate
            yield return null;

            // WaitForFixedUpdate executes after FixedUpdate
            yield return waitFixed;

            // WaitForEndOfFrame executes after rendering
            yield return waitEndOfFrame;

            // Wait for specified seconds (cached to avoid GC)
            yield return waitOneSecond;
        }
    }

    /*
     * Coroutine execution order within a frame:
     *
     * FixedUpdate
     * yield WaitForFixedUpdate
     * Update
     * yield null / yield WaitForSeconds (when time elapsed)
     * LateUpdate
     * Rendering
     * yield WaitForEndOfFrame
     */
}
```

### Physics Movement Pattern

```csharp
using UnityEngine;

public class CharacterPhysics : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    private Rigidbody rb;
    private Vector3 moveInput;
    private bool shouldJump;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        // Read input in Update for responsiveness
        moveInput = new Vector3(
            Input.GetAxisRaw("Horizontal"),
            0f,
            Input.GetAxisRaw("Vertical")
        );

        if (Input.GetButtonDown("Jump"))
            shouldJump = true;
    }

    void FixedUpdate()
    {
        // Apply physics in FixedUpdate for consistency
        Vector3 velocity = moveInput.normalized * moveSpeed;
        velocity.y = rb.linearVelocity.y; // Preserve vertical velocity
        rb.linearVelocity = velocity;

        if (shouldJump)
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
            shouldJump = false;
        }
    }
}
```

### Camera Follow with LateUpdate

```csharp
using UnityEngine;

public class SmoothCameraFollow : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private Vector3 offset = new Vector3(0, 5, -10);
    [SerializeField] private float smoothSpeed = 5f;

    private Vector3 velocity;

    private void Start()
    {
        // Find target if not assigned
        if (target == null)
        {
            var player = GameObject.FindWithTag("Player");
            if (player != null)
                target = player.transform;
        }
    }

    private void LateUpdate()
    {
        // LateUpdate ensures all character movement is complete
        if (target == null) return;

        Vector3 desiredPosition = target.position + offset;
        Vector3 smoothedPosition = Vector3.SmoothDamp(
            transform.position,
            desiredPosition,
            ref velocity,
            1f / smoothSpeed
        );

        transform.position = smoothedPosition;
        transform.LookAt(target);
    }
}
```

## Best Practices

### Use Awake() for Self-Initialization, Start() for Dependencies

```csharp
public class BestPracticeExample : MonoBehaviour
{
    private Rigidbody rb;
    private GameManager gameManager;

    private void Awake()
    {
        // Get your own components - these are always safe
        rb = GetComponent<Rigidbody>();
    }

    private void Start()
    {
        // Access other objects/singletons - they're initialized by now
        gameManager = GameManager.Instance;
    }
}
```

### Always Pair OnEnable/OnDisable for Event Subscriptions

```csharp
public class EventSubscriber : MonoBehaviour
{
    private void OnEnable()
    {
        PlayerHealth.OnPlayerDeath += HandlePlayerDeath;
        GameEvents.OnLevelComplete += HandleLevelComplete;
    }

    private void OnDisable()
    {
        // ALWAYS unsubscribe to prevent memory leaks and null reference errors
        PlayerHealth.OnPlayerDeath -= HandlePlayerDeath;
        GameEvents.OnLevelComplete -= HandleLevelComplete;
    }

    private void HandlePlayerDeath() { }
    private void HandleLevelComplete() { }
}
```

### Cache Component References

```csharp
public class CachedComponents : MonoBehaviour
{
    // Cache in Awake, not every frame
    private Transform cachedTransform;
    private Renderer cachedRenderer;

    private void Awake()
    {
        cachedTransform = transform;  // transform is actually a property call
        cachedRenderer = GetComponent<Renderer>();
    }

    private void Update()
    {
        // Use cached references - much faster than GetComponent every frame
        cachedTransform.position += Vector3.forward * Time.deltaTime;
    }
}
```

### Use Explicit Execution Order for Critical Systems

```csharp
// In Project Settings > Script Execution Order, or use attribute:
[DefaultExecutionOrder(-1000)]
public class Bootstrap : MonoBehaviour
{
    private void Awake()
    {
        // Initialize core systems first
        DontDestroyOnLoad(gameObject);
    }
}
```

### Validate Components in Awake

```csharp
[RequireComponent(typeof(Rigidbody))]
public class ValidatedComponent : MonoBehaviour
{
    private Rigidbody rb;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();

        // Validate with clear error messages
        if (rb == null)
        {
            Debug.LogError($"[{name}] Missing Rigidbody component!", this);
            enabled = false;
            return;
        }
    }
}
```

## Common Pitfalls

### Pitfall 1: Accessing Uninitialized References in Awake()

```csharp
// WRONG - Other objects may not be initialized yet
public class PitfallExample : MonoBehaviour
{
    private void Awake()
    {
        // This might fail if GameManager's Awake hasn't run yet
        var manager = GameManager.Instance; // Could be null!
    }
}

// CORRECT - Use Start() for cross-object references
public class CorrectExample : MonoBehaviour
{
    private void Start()
    {
        var manager = GameManager.Instance; // Safe - all Awake() calls done
    }
}
```

### Pitfall 2: Not Handling Disabled State

```csharp
// WRONG - Start() won't be called if instantiated while disabled
public class DisabledPitfall : MonoBehaviour
{
    private bool isInitialized = false;

    private void Start()
    {
        isInitialized = true;  // Never called if disabled!
    }
}

// CORRECT - Use Awake() for critical initialization
public class DisabledCorrect : MonoBehaviour
{
    private bool isInitialized = false;

    private void Awake()
    {
        isInitialized = true;  // Always called, even if disabled
    }
}
```

### Pitfall 3: Using Update() for Physics

```csharp
// WRONG - Physics in Update causes jittery movement
public class PhysicsPitfall : MonoBehaviour
{
    private Rigidbody rb;

    private void Update()
    {
        rb.AddForce(Vector3.forward * 10f);  // Inconsistent!
    }
}

// CORRECT - Use FixedUpdate for physics
public class PhysicsCorrect : MonoBehaviour
{
    private Rigidbody rb;

    private void FixedUpdate()
    {
        rb.AddForce(Vector3.forward * 10f);  // Smooth and consistent
    }
}
```

### Pitfall 4: Forgetting to Stop Coroutines

```csharp
// WRONG - Coroutine continues after disable, causes errors
public class CoroutinePitfall : MonoBehaviour
{
    private void Start()
    {
        StartCoroutine(DoSomething());
    }

    private IEnumerator DoSomething()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            transform.position += Vector3.up;  // Error if object destroyed!
        }
    }
}

// CORRECT - Track and stop coroutines
public class CoroutineCorrect : MonoBehaviour
{
    private Coroutine activeCoroutine;

    private void OnEnable()
    {
        activeCoroutine = StartCoroutine(DoSomething());
    }

    private void OnDisable()
    {
        if (activeCoroutine != null)
            StopCoroutine(activeCoroutine);
    }

    private IEnumerator DoSomething()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            transform.position += Vector3.up;
        }
    }
}
```

### Pitfall 5: Event Subscription Memory Leaks

```csharp
// WRONG - Subscribing but never unsubscribing
public class EventLeakPitfall : MonoBehaviour
{
    void Start()
    {
        GameManager.OnScoreChanged += HandleScore;  // LEAK!
    }
    // Object destroyed but event still holds reference

    private void HandleScore(int score) { }
}

// CORRECT - Always unsubscribe
public class EventLeakFixed : MonoBehaviour
{
    void OnEnable()
    {
        GameManager.OnScoreChanged += HandleScore;
    }

    void OnDisable()
    {
        GameManager.OnScoreChanged -= HandleScore;
    }

    private void HandleScore(int score) { }
}
```

## Performance Considerations

### Empty Lifecycle Methods Have Overhead

Unity checks for and calls lifecycle methods via reflection. Empty methods still have invocation overhead.

```csharp
// AVOID - Empty Update still has overhead
public class EmptyUpdate : MonoBehaviour
{
    private void Update() { }  // Remove this!
}
```

### Consider Disabling Update When Not Needed

```csharp
public class ConditionalUpdate : MonoBehaviour
{
    private bool needsUpdate = false;

    public void StartProcessing()
    {
        needsUpdate = true;
        enabled = true;
    }

    public void StopProcessing()
    {
        needsUpdate = false;
        enabled = false;  // Disables Update calls entirely
    }

    private void Update()
    {
        if (!needsUpdate) return;
        // Process...
    }
}
```

### Use Update Manager Pattern for Many Objects

```csharp
// Instead of 1000 objects with Update(), use one manager
public class UpdateManager : MonoBehaviour
{
    private static readonly List<IUpdatable> updatables = new List<IUpdatable>();

    public static void Register(IUpdatable updatable) => updatables.Add(updatable);
    public static void Unregister(IUpdatable updatable) => updatables.Remove(updatable);

    private void Update()
    {
        // Single Update call, iterates through all registered objects
        for (int i = 0; i < updatables.Count; i++)
        {
            updatables[i].OnUpdate();
        }
    }
}

public interface IUpdatable
{
    void OnUpdate();
}

public class ManagedObject : MonoBehaviour, IUpdatable
{
    private void OnEnable() => UpdateManager.Register(this);
    private void OnDisable() => UpdateManager.Unregister(this);

    public void OnUpdate()
    {
        // Called by manager, not Unity - reduces overhead
    }
}
```

### Cache WaitFor Objects in Coroutines

```csharp
public class OptimizedCoroutines : MonoBehaviour
{
    // Cache to avoid GC allocation every iteration
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);

    private IEnumerator GoodCoroutine()
    {
        while (true)
        {
            yield return wait1s;  // Reuse cached instance
            DoWork();
        }
    }

    private IEnumerator BadCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);  // Creates garbage every iteration!
            DoWork();
        }
    }

    private void DoWork() { }
}
```

### Use Non-Allocating Physics Methods

```csharp
public class OptimizedPhysics : MonoBehaviour
{
    // Reuse array to avoid allocation
    private readonly Collider[] overlapResults = new Collider[16];

    private void Update()
    {
        // BAD: Allocates new array every frame
        // var colliders = Physics.OverlapSphere(transform.position, 5f);

        // GOOD: Reuse pre-allocated array
        int count = Physics.OverlapSphereNonAlloc(
            transform.position,
            5f,
            overlapResults
        );

        for (int i = 0; i < count; i++)
        {
            ProcessCollider(overlapResults[i]);
        }
    }

    private void ProcessCollider(Collider col) { }
}
```

## Real-World Scenarios

### Scenario 1: Object Pooling with Lifecycle

```csharp
using UnityEngine;
using UnityEngine.Pool;

public class PooledProjectile : MonoBehaviour
{
    private IObjectPool<PooledProjectile> pool;
    private Rigidbody rb;
    private float lifetime = 5f;
    private float spawnTime;

    private void Awake()
    {
        // Cache components once - Awake only called on first instantiation
        rb = GetComponent<Rigidbody>();
    }

    private void OnEnable()
    {
        // Reset state when pulled from pool
        spawnTime = Time.time;
        rb.linearVelocity = Vector3.zero;
        rb.angularVelocity = Vector3.zero;
    }

    private void Update()
    {
        // Return to pool after lifetime expires
        if (Time.time - spawnTime >= lifetime)
        {
            ReturnToPool();
        }
    }

    private void OnDisable()
    {
        // Clean up when returned to pool
        StopAllCoroutines();
    }

    public void SetPool(IObjectPool<PooledProjectile> pool)
    {
        this.pool = pool;
    }

    public void Launch(Vector3 direction, float force)
    {
        rb.AddForce(direction * force, ForceMode.Impulse);
    }

    private void ReturnToPool()
    {
        pool.Release(this);
    }

    private void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Enemy"))
        {
            other.GetComponent<IDamageable>()?.TakeDamage(10f);
            ReturnToPool();
        }
    }
}
```

### Scenario 2: Player Health System

```csharp
using UnityEngine;
using System;

public class PlayerHealth : MonoBehaviour
{
    public static event Action<float> OnHealthChanged;
    public static event Action OnPlayerDeath;

    [SerializeField] private float maxHealth = 100f;
    private float currentHealth;
    private bool isDead = false;

    private void Awake()
    {
        // Initialize to max health
        currentHealth = maxHealth;
    }

    private void OnEnable()
    {
        // Subscribe to damage events
        DamageReceiver.OnDamageReceived += TakeDamage;
    }

    private void OnDisable()
    {
        // Always unsubscribe
        DamageReceiver.OnDamageReceived -= TakeDamage;
    }

    private void TakeDamage(float amount)
    {
        if (isDead) return;

        currentHealth = Mathf.Max(0, currentHealth - amount);
        OnHealthChanged?.Invoke(currentHealth / maxHealth);

        if (currentHealth <= 0)
        {
            isDead = true;
            OnPlayerDeath?.Invoke();
        }
    }

    public void Heal(float amount)
    {
        if (isDead) return;

        currentHealth = Mathf.Min(maxHealth, currentHealth + amount);
        OnHealthChanged?.Invoke(currentHealth / maxHealth);
    }
}
```

### Scenario 3: Scene Transition with Lifecycle

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

public class SceneTransitionManager : MonoBehaviour
{
    public static SceneTransitionManager Instance { get; private set; }

    [SerializeField] private CanvasGroup fadeCanvas;
    [SerializeField] private float fadeDuration = 0.5f;

    private bool isTransitioning;

    void Awake()
    {
        // Singleton pattern with DontDestroyOnLoad
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    void OnEnable()
    {
        // Subscribe to scene events
        SceneManager.sceneLoaded += OnSceneLoaded;
        SceneManager.sceneUnloaded += OnSceneUnloaded;
    }

    void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
        SceneManager.sceneUnloaded -= OnSceneUnloaded;
    }

    void OnDestroy()
    {
        // Clean up static reference
        if (Instance == this)
        {
            Instance = null;
        }
    }

    public void LoadScene(string sceneName)
    {
        if (!isTransitioning)
        {
            StartCoroutine(TransitionToScene(sceneName));
        }
    }

    private IEnumerator TransitionToScene(string sceneName)
    {
        isTransitioning = true;

        // Fade out
        yield return FadeCanvas(1f);

        // Load new scene (triggers Awake/OnEnable/Start on new objects)
        yield return SceneManager.LoadSceneAsync(sceneName);

        // Fade in
        yield return FadeCanvas(0f);

        isTransitioning = false;
    }

    private IEnumerator FadeCanvas(float targetAlpha)
    {
        float startAlpha = fadeCanvas.alpha;
        float elapsed = 0f;

        while (elapsed < fadeDuration)
        {
            elapsed += Time.unscaledDeltaTime;
            fadeCanvas.alpha = Mathf.Lerp(startAlpha, targetAlpha, elapsed / fadeDuration);
            yield return null;
        }

        fadeCanvas.alpha = targetAlpha;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        Debug.Log($"Scene loaded: {scene.name}");
    }

    private void OnSceneUnloaded(Scene scene)
    {
        Debug.Log($"Scene unloaded: {scene.name}");
    }
}
```

## Interview Focus Points

### Common Interview Questions

**1. What is the difference between Awake() and Start()?**

`Awake()` is called when the script instance is loaded, even if the script is disabled. It runs before any `Start()` method. Use it for self-initialization (caching components on the same GameObject).

`Start()` is called before the first frame update, but only if the script is enabled. It runs after all `Awake()` methods complete. Use it for initialization that depends on other scripts.

**2. When would you use FixedUpdate() vs Update()?**

`FixedUpdate()` runs at fixed time intervals (default 50Hz) and should be used for physics calculations and Rigidbody manipulation. `Update()` runs once per frame and should be used for input handling and non-physics game logic.

**3. Why is LateUpdate() important for cameras?**

`LateUpdate()` runs after all `Update()` calls are complete. This ensures the camera follows the player's final position for the frame, preventing jittery movement that would occur if the camera moved before the player.

**4. How do you control script execution order?**

Use the `[DefaultExecutionOrder(n)]` attribute or Edit > Project Settings > Script Execution Order. Lower numbers execute first.

**5. What happens to coroutines when a GameObject is disabled?**

Coroutines are stopped immediately when `OnDisable()` is called. They do not resume automatically when re-enabled. You must explicitly restart them in `OnEnable()`.

**6. How do you prevent memory leaks with events in MonoBehaviour?**

Always unsubscribe from events in `OnDisable()` or `OnDestroy()`. If a destroyed MonoBehaviour remains subscribed, the event holds a reference preventing garbage collection.

**7. What is the execution order across multiple scripts?**

For multiple scripts:
1. All `Awake()` methods (order based on Script Execution Order)
2. All `OnEnable()` methods
3. All `Start()` methods
4. All `FixedUpdate()` methods (per physics step)
5. All `Update()` methods
6. All `LateUpdate()` methods

### Quick Reference Summary

```
+=====================================================================+
|                     LIFECYCLE QUICK REFERENCE                        |
+=====================================================================+
|                                                                      |
|  Method          Called When                Best For                 |
|  ------------------------------------------------------------------ |
|  Awake()         Script loads               Component caching        |
|  OnEnable()      Script enabled             Event subscription       |
|  Start()         Before first Update        Cross-script init        |
|  FixedUpdate()   Fixed timestep             Physics, determinism     |
|  Update()        Every frame                Input, game logic        |
|  LateUpdate()    After all Updates          Camera, cleanup          |
|  OnDisable()     Script disabled            Event unsubscription     |
|  OnDestroy()     Script destroyed           Resource cleanup         |
|                                                                      |
|  Key Rules:                                                          |
|  ---------                                                           |
|  * Awake runs even if script is disabled                            |
|  * All Awake -> All OnEnable -> All Start                           |
|  * FixedUpdate may run 0, 1, or multiple times per frame            |
|  * Always unsubscribe from events in OnDisable                      |
|  * Physics in FixedUpdate, input in Update, camera in LateUpdate    |
|                                                                      |
+=====================================================================+
```

## Further Reading

### Official Documentation

- [Unity Manual - Order of Execution](https://docs.unity3d.com/Manual/ExecutionOrder.html)
- [Unity Scripting API - MonoBehaviour](https://docs.unity3d.com/ScriptReference/MonoBehaviour.html)
- [Unity Manual - Coroutines](https://docs.unity3d.com/Manual/Coroutines.html)
- [Unity Manual - Time and Frame Rate Management](https://docs.unity3d.com/Manual/TimeFrameManagement.html)

### Advanced Topics

- **Unity DOTS/ECS**: Data-oriented alternative to MonoBehaviour for high-performance scenarios
- **Addressables**: Asynchronous asset loading that integrates with lifecycle
- **Zenject/VContainer**: Dependency injection frameworks that manage initialization order
- **UniTask**: Modern async/await patterns as an alternative to coroutines
- **Unity Jobs System**: Multi-threaded processing with consideration for main thread lifecycle

### Related Patterns

- Singleton pattern in Unity
- Service locator pattern
- Object pooling with lifecycle management
- State machine implementations using lifecycle methods
- Command pattern for input handling in Update

### Recommended Books

- "Unity in Action" by Joe Hocking
- "Learning C# by Developing Games with Unity" by Harrison Ferrone
- "Game Programming Patterns" by Robert Nystrom
