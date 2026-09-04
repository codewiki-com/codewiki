---
title: Unity Coroutines In-Depth Guide
description: Master Unity coroutines - understand IEnumerator, yield statements, timing control, and async patterns for game development
track: gamedev
section: unity
difficulty: intermediate
tags:
  - Unity
  - Coroutines
  - C#
  - Game Development
  - Async
  - IEnumerator
status: imported
origin: old/src/content/docs/gamedev/unity-coroutines.en.md
divergence: 0.2
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: GameDev
  subcategory: ""
  order: 2
  lastUpdated: 2026-01-21
---

Coroutines are one of Unity's most powerful features for managing time-based operations, sequences, and asynchronous-like behavior without the complexity of multithreading. This comprehensive guide covers everything from basic yield statements to advanced patterns, helping you master this essential Unity technique.

## Concept Explanation

### What Are Coroutines?

A **coroutine** is a function that can pause execution and return control to Unity, then continue from where it left off on the following frame or after a specified condition is met. Unlike regular methods that execute from start to finish in a single frame, coroutines can span multiple frames while maintaining their local state.

```csharp
// Regular method - executes entirely in one frame
void RegularMethod()
{
    Debug.Log("Start");
    // Cannot pause here
    Debug.Log("End"); // Same frame as Start
}

// Coroutine - can span multiple frames
IEnumerator CoroutineMethod()
{
    Debug.Log("Start");
    yield return null; // Pause until next frame
    Debug.Log("End"); // Different frame than Start
}
```

The key insight is that coroutines provide **cooperative multitasking** on a single thread. They don't run in parallel - they take turns executing on the main thread, giving up control at yield points.

### History and Evolution

| Era | Technology | Unity Context |
|-----|------------|---------------|
| 1960s | Coroutines concept (Simula) | Foundational CS concept |
| 2000s | C# Iterators (yield return) | Language feature Unity leverages |
| 2005 | Unity 1.0 | Basic coroutine support |
| 2017 | Unity 2017 | Improved coroutine debugging |
| 2018 | C# async/await in Unity | Alternative async pattern |
| 2022 | Awaitable (Unity 2023) | Native async/await support |

### What Problems Do Coroutines Solve?

1. **Time-based sequences**: Animations, cutscenes, tutorials that unfold over time
2. **Avoiding callback hell**: Sequential async operations without nested callbacks
3. **Frame-rate independent delays**: WaitForSeconds instead of frame counting
4. **Resource loading**: Asynchronous asset loading without freezing the game
5. **State machines**: Simple state management for AI, gameplay sequences
6. **Polling patterns**: Waiting for conditions without blocking Update

### Coroutines vs Alternatives

```
┌──────────────────┬─────────────────────────────────────────────────────────┐
│ Approach         │ Use Case                                                │
├──────────────────┼─────────────────────────────────────────────────────────┤
│ Update + Timer   │ Simple delays, but pollutes Update with state tracking │
│ Invoke/InvokeRep │ Simple delays, but limited control and no state        │
│ Coroutines       │ Complex sequences, maintained state, yield-based flow  │
│ async/await      │ Modern C# pattern, better for true async (I/O, web)   │
│ UniTask          │ Zero-allocation async, better performance              │
│ DOTween          │ Tweening animations, specialized for value changes    │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

## Core Principles

### How Coroutines Work Internally

Unity's coroutine system is built on C#'s iterator pattern:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COROUTINE EXECUTION MODEL                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  StartCoroutine(MyCoroutine())                                      │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────┐                                               │
│  │ Create IEnumerator│  ◄── C# compiler transforms method           │
│  │ State Machine     │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐                                               │
│  │ Add to Unity's   │  ◄── Coroutine scheduler                      │
│  │ Coroutine List   │                                               │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────────────────────────────────────┐               │
│  │              EACH FRAME LOOP                      │               │
│  │  ┌────────────────────────────────────────────┐  │               │
│  │  │ For each active coroutine:                 │  │               │
│  │  │   1. Check if yield condition is met       │  │               │
│  │  │   2. If met, call MoveNext()               │  │               │
│  │  │   3. If MoveNext returns false, remove     │  │               │
│  │  │   4. If returns true, check new yield      │  │               │
│  │  └────────────────────────────────────────────┘  │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### The IEnumerator State Machine

When you write a coroutine, the C# compiler transforms it into a state machine:

```csharp
// What you write:
IEnumerator SimpleCoroutine()
{
    Debug.Log("State 0");
    yield return null;
    Debug.Log("State 1");
    yield return null;
    Debug.Log("State 2");
}

// Conceptually what the compiler generates:
class SimpleCoroutine_StateMachine : IEnumerator
{
    private int state = 0;

    public object Current { get; private set; }

    public bool MoveNext()
    {
        switch (state)
        {
            case 0:
                Debug.Log("State 0");
                Current = null;
                state = 1;
                return true;
            case 1:
                Debug.Log("State 1");
                Current = null;
                state = 2;
                return true;
            case 2:
                Debug.Log("State 2");
                state = -1;
                return false; // Coroutine complete
            default:
                return false;
        }
    }

    public void Reset() { }
}
```

### Yield Execution Timing

Understanding when each yield type resumes is crucial:

```
Frame N:
├── FixedUpdate (0 to many times)
│   └── yield WaitForFixedUpdate resumes here
├── Update
│   └── yield null resumes here (after Update, before LateUpdate)
│   └── yield WaitForSeconds resumes here (when time elapsed)
│   └── yield WWW/UnityWebRequest resumes here (when complete)
├── LateUpdate
├── Rendering
│   └── yield WaitForEndOfFrame resumes here
└── End of Frame

Frame N+1:
├── ... (cycle repeats)
```

## Core Concepts

### Basic Yield Types

#### yield return null

```csharp
IEnumerator WaitOneFrame()
{
    Debug.Log($"Frame {Time.frameCount}: Before yield");
    yield return null; // Wait until next frame
    Debug.Log($"Frame {Time.frameCount}: After yield");
}
```

#### yield return WaitForSeconds

```csharp
IEnumerator WaitForTime()
{
    Debug.Log("Starting wait...");

    // Affected by Time.timeScale
    yield return new WaitForSeconds(2f);

    Debug.Log("2 seconds passed (game time)");
}

IEnumerator WaitRealTime()
{
    Debug.Log("Starting wait...");

    // NOT affected by Time.timeScale (good for pause menus)
    yield return new WaitForSecondsRealtime(2f);

    Debug.Log("2 seconds passed (real time)");
}
```

#### yield return WaitForFixedUpdate

```csharp
IEnumerator PhysicsSync()
{
    // Wait until after FixedUpdate
    yield return new WaitForFixedUpdate();

    // Safe to read physics state here
    Debug.Log($"Velocity: {rb.velocity}");
}
```

#### yield return WaitForEndOfFrame

```csharp
IEnumerator CaptureScreenshot()
{
    // Wait until after rendering is complete
    yield return new WaitForEndOfFrame();

    // Now safe to capture screen
    Texture2D screenshot = new Texture2D(Screen.width, Screen.height);
    screenshot.ReadPixels(new Rect(0, 0, Screen.width, Screen.height), 0, 0);
    screenshot.Apply();
}
```

#### yield return WaitUntil / WaitWhile

```csharp
IEnumerator WaitForCondition()
{
    Debug.Log("Waiting for player to be grounded...");

    // Wait until condition becomes true
    yield return new WaitUntil(() => player.IsGrounded);

    Debug.Log("Player is now grounded!");
}

IEnumerator WaitWhileCondition()
{
    Debug.Log("Waiting for animation to finish...");

    // Wait while condition is true
    yield return new WaitWhile(() => animator.IsPlaying());

    Debug.Log("Animation finished!");
}
```

#### yield return Another Coroutine

```csharp
IEnumerator ParentCoroutine()
{
    Debug.Log("Parent: Starting");

    // Wait for child coroutine to complete
    yield return StartCoroutine(ChildCoroutine());

    Debug.Log("Parent: Child finished, continuing");
}

IEnumerator ChildCoroutine()
{
    Debug.Log("Child: Starting");
    yield return new WaitForSeconds(1f);
    Debug.Log("Child: Finishing");
}
```

#### yield return AsyncOperation

```csharp
IEnumerator LoadSceneAsync()
{
    AsyncOperation asyncLoad = SceneManager.LoadSceneAsync("GameScene");
    asyncLoad.allowSceneActivation = false;

    while (asyncLoad.progress < 0.9f)
    {
        Debug.Log($"Loading: {asyncLoad.progress * 100}%");
        yield return null;
    }

    Debug.Log("Scene ready, activating...");
    asyncLoad.allowSceneActivation = true;

    yield return asyncLoad; // Wait for activation

    Debug.Log("Scene loaded!");
}
```

### Starting and Stopping Coroutines

```csharp
public class CoroutineControl : MonoBehaviour
{
    private Coroutine myCoroutine;

    void Start()
    {
        // Method 1: Start by method call
        StartCoroutine(MyRoutine());

        // Method 2: Start by string name (slower, avoid)
        StartCoroutine("MyRoutine");

        // Method 3: Store reference for later control
        myCoroutine = StartCoroutine(MyRoutine());
    }

    void StopMyCoroutine()
    {
        // Method 1: Stop by reference (preferred)
        if (myCoroutine != null)
        {
            StopCoroutine(myCoroutine);
            myCoroutine = null;
        }

        // Method 2: Stop by string name
        StopCoroutine("MyRoutine");

        // Method 3: Stop all coroutines on this MonoBehaviour
        StopAllCoroutines();
    }

    IEnumerator MyRoutine()
    {
        while (true)
        {
            Debug.Log("Running...");
            yield return new WaitForSeconds(1f);
        }
    }
}
```

### Custom Yield Instructions

```csharp
// Custom yield instruction
public class WaitForKeyPress : CustomYieldInstruction
{
    private KeyCode keyCode;

    public WaitForKeyPress(KeyCode key)
    {
        keyCode = key;
    }

    // Return false when ready to continue
    public override bool keepWaiting => !Input.GetKeyDown(keyCode);
}

// Usage
IEnumerator WaitForInput()
{
    Debug.Log("Press Space to continue...");
    yield return new WaitForKeyPress(KeyCode.Space);
    Debug.Log("Space pressed!");
}

// More complex custom yield
public class WaitForAnimation : CustomYieldInstruction
{
    private Animator animator;
    private string stateName;
    private int layer;

    public WaitForAnimation(Animator anim, string state, int animLayer = 0)
    {
        animator = anim;
        stateName = state;
        layer = animLayer;
    }

    public override bool keepWaiting
    {
        get
        {
            var stateInfo = animator.GetCurrentAnimatorStateInfo(layer);
            return stateInfo.IsName(stateName) && stateInfo.normalizedTime < 1f;
        }
    }
}
```

## Code Examples

### Comprehensive Coroutine Patterns

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class CoroutinePatterns : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private Transform target;
    [SerializeField] private float moveSpeed = 5f;

    // Cache yield instructions to avoid GC
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);
    private readonly WaitForFixedUpdate waitFixed = new WaitForFixedUpdate();
    private readonly WaitForEndOfFrame waitEndFrame = new WaitForEndOfFrame();

    private Coroutine currentMovement;

    #region Basic Patterns

    /// <summary>
    /// Simple delay pattern
    /// </summary>
    IEnumerator DelayedAction(float delay, System.Action action)
    {
        yield return new WaitForSeconds(delay);
        action?.Invoke();
    }

    /// <summary>
    /// Repeating action pattern
    /// </summary>
    IEnumerator RepeatAction(float interval, System.Action action)
    {
        var wait = new WaitForSeconds(interval);
        while (true)
        {
            action?.Invoke();
            yield return wait;
        }
    }

    /// <summary>
    /// Countdown pattern
    /// </summary>
    IEnumerator Countdown(int seconds, System.Action<int> onTick, System.Action onComplete)
    {
        for (int i = seconds; i > 0; i--)
        {
            onTick?.Invoke(i);
            yield return wait1s;
        }
        onComplete?.Invoke();
    }

    #endregion

    #region Movement Patterns

    /// <summary>
    /// Move to position over time
    /// </summary>
    IEnumerator MoveToPosition(Vector3 targetPos, float duration)
    {
        Vector3 startPos = transform.position;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / duration;

            // Apply easing (smooth start and end)
            t = t * t * (3f - 2f * t); // Smoothstep

            transform.position = Vector3.Lerp(startPos, targetPos, t);
            yield return null;
        }

        transform.position = targetPos;
    }

    /// <summary>
    /// Follow target continuously
    /// </summary>
    IEnumerator FollowTarget(Transform followTarget, float stopDistance)
    {
        while (followTarget != null)
        {
            float distance = Vector3.Distance(transform.position, followTarget.position);

            if (distance > stopDistance)
            {
                Vector3 direction = (followTarget.position - transform.position).normalized;
                transform.position += direction * moveSpeed * Time.deltaTime;
            }

            yield return null;
        }
    }

    /// <summary>
    /// Patrol between waypoints
    /// </summary>
    IEnumerator Patrol(Transform[] waypoints, float waitTime)
    {
        int currentIndex = 0;
        var wait = new WaitForSeconds(waitTime);

        while (true)
        {
            // Move to current waypoint
            yield return MoveToPosition(waypoints[currentIndex].position, 1f);

            // Wait at waypoint
            yield return wait;

            // Move to next waypoint
            currentIndex = (currentIndex + 1) % waypoints.Length;
        }
    }

    #endregion

    #region Visual Effect Patterns

    /// <summary>
    /// Fade object alpha
    /// </summary>
    IEnumerator FadeAlpha(SpriteRenderer renderer, float targetAlpha, float duration)
    {
        Color startColor = renderer.color;
        Color targetColor = new Color(startColor.r, startColor.g, startColor.b, targetAlpha);
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            renderer.color = Color.Lerp(startColor, targetColor, elapsed / duration);
            yield return null;
        }

        renderer.color = targetColor;
    }

    /// <summary>
    /// Flash effect (damage feedback)
    /// </summary>
    IEnumerator FlashEffect(SpriteRenderer renderer, Color flashColor, int flashCount, float flashDuration)
    {
        Color originalColor = renderer.color;
        var halfWait = new WaitForSeconds(flashDuration / 2f);

        for (int i = 0; i < flashCount; i++)
        {
            renderer.color = flashColor;
            yield return halfWait;
            renderer.color = originalColor;
            yield return halfWait;
        }
    }

    /// <summary>
    /// Scale pulse effect
    /// </summary>
    IEnumerator PulseScale(float targetScale, float duration)
    {
        Vector3 originalScale = transform.localScale;
        Vector3 targetScaleVec = originalScale * targetScale;
        float halfDuration = duration / 2f;
        float elapsed = 0f;

        // Scale up
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            transform.localScale = Vector3.Lerp(originalScale, targetScaleVec, elapsed / halfDuration);
            yield return null;
        }

        // Scale down
        elapsed = 0f;
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            transform.localScale = Vector3.Lerp(targetScaleVec, originalScale, elapsed / halfDuration);
            yield return null;
        }

        transform.localScale = originalScale;
    }

    #endregion

    #region Sequence Patterns

    /// <summary>
    /// Execute actions in sequence
    /// </summary>
    IEnumerator ExecuteSequence(params System.Func<IEnumerator>[] actions)
    {
        foreach (var action in actions)
        {
            yield return StartCoroutine(action());
        }
    }

    /// <summary>
    /// Dialog sequence
    /// </summary>
    IEnumerator DialogSequence(string[] lines, float charDelay, System.Action<string> onDisplayText)
    {
        foreach (string line in lines)
        {
            string displayed = "";

            foreach (char c in line)
            {
                displayed += c;
                onDisplayText?.Invoke(displayed);
                yield return new WaitForSeconds(charDelay);
            }

            // Wait for input to continue
            yield return new WaitUntil(() => Input.GetKeyDown(KeyCode.Space));
        }
    }

    /// <summary>
    /// Cutscene sequence
    /// </summary>
    IEnumerator PlayCutscene()
    {
        // Disable player control
        PlayerController.Instance?.SetControlEnabled(false);

        // Camera pan
        yield return StartCoroutine(CameraPan(targetPosition, 2f));

        // Show dialog
        yield return StartCoroutine(ShowDialog("Welcome to the game!"));

        // Wait for dramatic effect
        yield return new WaitForSeconds(1f);

        // Spawn enemy
        yield return StartCoroutine(SpawnWithEffect(enemyPrefab, spawnPoint));

        // Camera shake
        yield return StartCoroutine(CameraShake(0.5f, 0.3f));

        // Re-enable player control
        PlayerController.Instance?.SetControlEnabled(true);
    }

    // Helper coroutines for cutscene
    IEnumerator CameraPan(Vector3 target, float duration) { yield return null; }
    IEnumerator ShowDialog(string text) { yield return null; }
    IEnumerator SpawnWithEffect(GameObject prefab, Transform point) { yield return null; }
    IEnumerator CameraShake(float duration, float magnitude) { yield return null; }

    private Vector3 targetPosition;
    private GameObject enemyPrefab;
    private Transform spawnPoint;

    #endregion

    #region Resource Loading Patterns

    /// <summary>
    /// Load multiple assets with progress
    /// </summary>
    IEnumerator LoadAssets(string[] assetPaths, System.Action<float> onProgress, System.Action onComplete)
    {
        List<ResourceRequest> requests = new List<ResourceRequest>();

        // Start all loads
        foreach (string path in assetPaths)
        {
            requests.Add(Resources.LoadAsync(path));
        }

        // Wait for all to complete
        int completed = 0;
        while (completed < requests.Count)
        {
            completed = 0;
            float totalProgress = 0f;

            foreach (var request in requests)
            {
                totalProgress += request.progress;
                if (request.isDone) completed++;
            }

            onProgress?.Invoke(totalProgress / requests.Count);
            yield return null;
        }

        onComplete?.Invoke();
    }

    /// <summary>
    /// Scene loading with progress
    /// </summary>
    IEnumerator LoadSceneWithProgress(string sceneName, System.Action<float> onProgress)
    {
        AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName);
        operation.allowSceneActivation = false;

        while (operation.progress < 0.9f)
        {
            onProgress?.Invoke(operation.progress / 0.9f);
            yield return null;
        }

        onProgress?.Invoke(1f);

        // Wait a moment at 100%
        yield return new WaitForSeconds(0.5f);

        operation.allowSceneActivation = true;
    }

    #endregion

    #region Error Handling Patterns

    /// <summary>
    /// Coroutine with timeout
    /// </summary>
    IEnumerator WithTimeout(IEnumerator coroutine, float timeout, System.Action onTimeout)
    {
        float elapsed = 0f;

        while (elapsed < timeout)
        {
            if (!coroutine.MoveNext())
            {
                yield break; // Coroutine completed normally
            }

            yield return coroutine.Current;
            elapsed += Time.deltaTime;
        }

        onTimeout?.Invoke();
    }

    /// <summary>
    /// Retry pattern
    /// </summary>
    IEnumerator RetryOperation(System.Func<IEnumerator> operation, int maxRetries, float retryDelay)
    {
        int attempts = 0;
        bool success = false;

        while (attempts < maxRetries && !success)
        {
            attempts++;

            var routine = operation();
            bool hasError = false;

            while (routine.MoveNext())
            {
                // Check for error in current
                if (routine.Current is System.Exception)
                {
                    hasError = true;
                    break;
                }
                yield return routine.Current;
            }

            if (!hasError)
            {
                success = true;
            }
            else if (attempts < maxRetries)
            {
                Debug.Log($"Attempt {attempts} failed, retrying...");
                yield return new WaitForSeconds(retryDelay);
            }
        }

        if (!success)
        {
            Debug.LogError("All retry attempts failed");
        }
    }

    #endregion
}
```

### Coroutine Manager Utility

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

/// <summary>
/// Centralized coroutine management with named coroutines and groups
/// </summary>
public class CoroutineManager : MonoBehaviour
{
    private static CoroutineManager instance;
    public static CoroutineManager Instance
    {
        get
        {
            if (instance == null)
            {
                var go = new GameObject("CoroutineManager");
                instance = go.AddComponent<CoroutineManager>();
                DontDestroyOnLoad(go);
            }
            return instance;
        }
    }

    private Dictionary<string, Coroutine> namedCoroutines = new Dictionary<string, Coroutine>();
    private Dictionary<string, List<Coroutine>> coroutineGroups = new Dictionary<string, List<Coroutine>>();

    /// <summary>
    /// Start a named coroutine (automatically stops previous if exists)
    /// </summary>
    public Coroutine StartNamed(string name, IEnumerator routine)
    {
        StopNamed(name);
        var coroutine = StartCoroutine(TrackCoroutine(name, routine));
        namedCoroutines[name] = coroutine;
        return coroutine;
    }

    /// <summary>
    /// Stop a named coroutine
    /// </summary>
    public void StopNamed(string name)
    {
        if (namedCoroutines.TryGetValue(name, out var coroutine))
        {
            if (coroutine != null)
            {
                StopCoroutine(coroutine);
            }
            namedCoroutines.Remove(name);
        }
    }

    /// <summary>
    /// Start coroutine in a group
    /// </summary>
    public Coroutine StartInGroup(string groupName, IEnumerator routine)
    {
        if (!coroutineGroups.ContainsKey(groupName))
        {
            coroutineGroups[groupName] = new List<Coroutine>();
        }

        var coroutine = StartCoroutine(routine);
        coroutineGroups[groupName].Add(coroutine);
        return coroutine;
    }

    /// <summary>
    /// Stop all coroutines in a group
    /// </summary>
    public void StopGroup(string groupName)
    {
        if (coroutineGroups.TryGetValue(groupName, out var coroutines))
        {
            foreach (var coroutine in coroutines)
            {
                if (coroutine != null)
                {
                    StopCoroutine(coroutine);
                }
            }
            coroutines.Clear();
        }
    }

    /// <summary>
    /// Run coroutine that persists across scene loads
    /// </summary>
    public Coroutine StartPersistent(IEnumerator routine)
    {
        return StartCoroutine(routine);
    }

    /// <summary>
    /// Delay execution
    /// </summary>
    public Coroutine Delay(float seconds, System.Action action)
    {
        return StartCoroutine(DelayRoutine(seconds, action));
    }

    /// <summary>
    /// Delay execution (real time)
    /// </summary>
    public Coroutine DelayRealtime(float seconds, System.Action action)
    {
        return StartCoroutine(DelayRealtimeRoutine(seconds, action));
    }

    /// <summary>
    /// Execute next frame
    /// </summary>
    public Coroutine NextFrame(System.Action action)
    {
        return StartCoroutine(NextFrameRoutine(action));
    }

    /// <summary>
    /// Execute at end of frame
    /// </summary>
    public Coroutine EndOfFrame(System.Action action)
    {
        return StartCoroutine(EndOfFrameRoutine(action));
    }

    private IEnumerator TrackCoroutine(string name, IEnumerator routine)
    {
        yield return routine;
        namedCoroutines.Remove(name);
    }

    private IEnumerator DelayRoutine(float seconds, System.Action action)
    {
        yield return new WaitForSeconds(seconds);
        action?.Invoke();
    }

    private IEnumerator DelayRealtimeRoutine(float seconds, System.Action action)
    {
        yield return new WaitForSecondsRealtime(seconds);
        action?.Invoke();
    }

    private IEnumerator NextFrameRoutine(System.Action action)
    {
        yield return null;
        action?.Invoke();
    }

    private IEnumerator EndOfFrameRoutine(System.Action action)
    {
        yield return new WaitForEndOfFrame();
        action?.Invoke();
    }
}

// Usage examples
public class CoroutineManagerUsage : MonoBehaviour
{
    void Start()
    {
        // Delayed action
        CoroutineManager.Instance.Delay(2f, () => Debug.Log("2 seconds passed"));

        // Named coroutine (auto-replaces if called again)
        CoroutineManager.Instance.StartNamed("PlayerMovement", MovePlayer());

        // Group coroutines (stop all at once)
        CoroutineManager.Instance.StartInGroup("Enemies", EnemyBehavior());
        CoroutineManager.Instance.StartInGroup("Enemies", EnemyBehavior());
        // Later: CoroutineManager.Instance.StopGroup("Enemies");
    }

    IEnumerator MovePlayer() { yield return null; }
    IEnumerator EnemyBehavior() { yield return null; }
}
```

### State Machine with Coroutines

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineStateMachine : MonoBehaviour
{
    public enum AIState { Idle, Patrol, Chase, Attack, Flee }

    [SerializeField] private AIState currentState = AIState.Idle;
    [SerializeField] private float detectionRange = 10f;
    [SerializeField] private float attackRange = 2f;

    private Transform player;
    private Coroutine currentStateCoroutine;

    void Start()
    {
        player = GameObject.FindWithTag("Player")?.transform;
        TransitionToState(AIState.Idle);
    }

    public void TransitionToState(AIState newState)
    {
        // Stop current state coroutine
        if (currentStateCoroutine != null)
        {
            StopCoroutine(currentStateCoroutine);
        }

        // Exit current state
        ExitState(currentState);

        // Enter new state
        currentState = newState;
        EnterState(newState);

        // Start new state coroutine
        currentStateCoroutine = StartCoroutine(GetStateCoroutine(newState));
    }

    private void EnterState(AIState state)
    {
        Debug.Log($"Entering state: {state}");

        switch (state)
        {
            case AIState.Idle:
                // Play idle animation
                break;
            case AIState.Patrol:
                // Play walk animation
                break;
            case AIState.Chase:
                // Play run animation, alert sound
                break;
            case AIState.Attack:
                // Play attack animation
                break;
            case AIState.Flee:
                // Play run animation, flee sound
                break;
        }
    }

    private void ExitState(AIState state)
    {
        Debug.Log($"Exiting state: {state}");
        // Cleanup for each state
    }

    private IEnumerator GetStateCoroutine(AIState state)
    {
        switch (state)
        {
            case AIState.Idle: return IdleState();
            case AIState.Patrol: return PatrolState();
            case AIState.Chase: return ChaseState();
            case AIState.Attack: return AttackState();
            case AIState.Flee: return FleeState();
            default: return IdleState();
        }
    }

    private IEnumerator IdleState()
    {
        float idleTime = Random.Range(2f, 5f);
        float elapsed = 0f;

        while (elapsed < idleTime)
        {
            // Check for player detection
            if (IsPlayerInRange(detectionRange))
            {
                TransitionToState(AIState.Chase);
                yield break;
            }

            elapsed += Time.deltaTime;
            yield return null;
        }

        // After idle, start patrolling
        TransitionToState(AIState.Patrol);
    }

    private IEnumerator PatrolState()
    {
        Vector3[] waypoints = GetPatrolWaypoints();
        int currentWaypoint = 0;

        while (true)
        {
            // Check for player detection
            if (IsPlayerInRange(detectionRange))
            {
                TransitionToState(AIState.Chase);
                yield break;
            }

            // Move toward waypoint
            Vector3 target = waypoints[currentWaypoint];
            while (Vector3.Distance(transform.position, target) > 0.5f)
            {
                // Check for player during movement
                if (IsPlayerInRange(detectionRange))
                {
                    TransitionToState(AIState.Chase);
                    yield break;
                }

                MoveToward(target);
                yield return null;
            }

            // Wait at waypoint
            yield return new WaitForSeconds(1f);

            // Next waypoint
            currentWaypoint = (currentWaypoint + 1) % waypoints.Length;
        }
    }

    private IEnumerator ChaseState()
    {
        while (true)
        {
            if (player == null)
            {
                TransitionToState(AIState.Idle);
                yield break;
            }

            float distance = Vector3.Distance(transform.position, player.position);

            // Lost player
            if (distance > detectionRange * 1.5f)
            {
                TransitionToState(AIState.Patrol);
                yield break;
            }

            // In attack range
            if (distance < attackRange)
            {
                TransitionToState(AIState.Attack);
                yield break;
            }

            // Chase player
            MoveToward(player.position);
            yield return null;
        }
    }

    private IEnumerator AttackState()
    {
        // Perform attack
        Debug.Log("Attacking!");
        yield return new WaitForSeconds(1f); // Attack animation time

        // Check if should continue attacking or chase
        float distance = Vector3.Distance(transform.position, player.position);

        if (distance > attackRange)
        {
            TransitionToState(AIState.Chase);
        }
        else
        {
            // Attack again
            TransitionToState(AIState.Attack);
        }
    }

    private IEnumerator FleeState()
    {
        float fleeTime = 3f;
        float elapsed = 0f;

        while (elapsed < fleeTime)
        {
            if (player != null)
            {
                // Move away from player
                Vector3 fleeDirection = (transform.position - player.position).normalized;
                transform.position += fleeDirection * 5f * Time.deltaTime;
            }

            elapsed += Time.deltaTime;
            yield return null;
        }

        TransitionToState(AIState.Idle);
    }

    private bool IsPlayerInRange(float range)
    {
        if (player == null) return false;
        return Vector3.Distance(transform.position, player.position) < range;
    }

    private void MoveToward(Vector3 target)
    {
        Vector3 direction = (target - transform.position).normalized;
        transform.position += direction * 3f * Time.deltaTime;
    }

    private Vector3[] GetPatrolWaypoints()
    {
        return new Vector3[]
        {
            transform.position + Vector3.right * 5f,
            transform.position + Vector3.forward * 5f,
            transform.position - Vector3.right * 5f,
            transform.position - Vector3.forward * 5f
        };
    }
}
```

## Best Practices

### 1. Cache Yield Instructions

```csharp
public class CachedYields : MonoBehaviour
{
    // DO: Cache commonly used yields
    private static readonly WaitForEndOfFrame WaitEndFrame = new WaitForEndOfFrame();
    private static readonly WaitForFixedUpdate WaitFixed = new WaitForFixedUpdate();
    private readonly WaitForSeconds wait1s = new WaitForSeconds(1f);
    private readonly WaitForSeconds wait05s = new WaitForSeconds(0.5f);

    // For dynamic waits, consider a dictionary cache
    private Dictionary<float, WaitForSeconds> waitCache = new Dictionary<float, WaitForSeconds>();

    private WaitForSeconds GetWait(float seconds)
    {
        if (!waitCache.TryGetValue(seconds, out var wait))
        {
            wait = new WaitForSeconds(seconds);
            waitCache[seconds] = wait;
        }
        return wait;
    }

    IEnumerator GoodCoroutine()
    {
        while (true)
        {
            yield return wait1s; // No GC allocation
        }
    }

    // DON'T: Create new yields every iteration
    IEnumerator BadCoroutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f); // GC allocation every second!
        }
    }
}
```

### 2. Always Handle Coroutine Lifecycle

```csharp
public class CoroutineLifecycleManagement : MonoBehaviour
{
    private Coroutine activeCoroutine;
    private bool isRunning = false;

    void OnEnable()
    {
        // Start coroutine when enabled
        StartMyCoroutine();
    }

    void OnDisable()
    {
        // Always stop coroutines when disabled
        StopMyCoroutine();
    }

    void OnDestroy()
    {
        // Cleanup on destroy (OnDisable is called first, but be safe)
        StopMyCoroutine();
    }

    public void StartMyCoroutine()
    {
        if (!isRunning)
        {
            activeCoroutine = StartCoroutine(MyRoutine());
            isRunning = true;
        }
    }

    public void StopMyCoroutine()
    {
        if (activeCoroutine != null)
        {
            StopCoroutine(activeCoroutine);
            activeCoroutine = null;
        }
        isRunning = false;
    }

    IEnumerator MyRoutine()
    {
        while (true)
        {
            // Work
            yield return null;
        }
    }
}
```

### 3. Use Coroutine References Over String Names

```csharp
public class CoroutineReferences : MonoBehaviour
{
    // DO: Use references
    private Coroutine myRoutine;

    void Start()
    {
        myRoutine = StartCoroutine(MyRoutine());
    }

    void Stop()
    {
        if (myRoutine != null)
        {
            StopCoroutine(myRoutine);
            myRoutine = null;
        }
    }

    // DON'T: Use string names (slower, error-prone)
    void BadStart()
    {
        StartCoroutine("MyRoutine"); // Uses reflection
    }

    void BadStop()
    {
        StopCoroutine("MyRoutine"); // Typos won't be caught at compile time
    }

    IEnumerator MyRoutine()
    {
        yield return null;
    }
}
```

### 4. Keep Coroutines Simple and Focused

```csharp
public class FocusedCoroutines : MonoBehaviour
{
    // DO: Single-purpose coroutines
    IEnumerator FadeOut(CanvasGroup group, float duration)
    {
        float startAlpha = group.alpha;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            group.alpha = Mathf.Lerp(startAlpha, 0f, elapsed / duration);
            yield return null;
        }

        group.alpha = 0f;
    }

    IEnumerator DisableAfterDelay(GameObject obj, float delay)
    {
        yield return new WaitForSeconds(delay);
        obj.SetActive(false);
    }

    // Compose simple coroutines for complex behavior
    IEnumerator FadeAndDisable(CanvasGroup group, GameObject obj, float fadeDuration)
    {
        yield return FadeOut(group, fadeDuration);
        yield return DisableAfterDelay(obj, 0f);
    }

    // DON'T: Monster coroutines doing everything
    IEnumerator DoEverything()
    {
        // Hundreds of lines of mixed concerns...
    }
}
```

### 5. Make Coroutines Stoppable and Resumable

```csharp
public class ControllableCoroutine : MonoBehaviour
{
    private bool isPaused = false;
    private bool shouldStop = false;

    public void Pause() => isPaused = true;
    public void Resume() => isPaused = false;
    public void Stop() => shouldStop = true;

    IEnumerator ControllableRoutine()
    {
        shouldStop = false;

        while (!shouldStop)
        {
            // Handle pause
            while (isPaused && !shouldStop)
            {
                yield return null;
            }

            if (shouldStop) break;

            // Do work
            Debug.Log("Working...");
            yield return new WaitForSeconds(0.5f);
        }

        Debug.Log("Coroutine stopped cleanly");
    }
}
```

## Common Pitfalls

### 1. Coroutines Stop When GameObject/Component is Disabled

```csharp
public class DisablePitfall : MonoBehaviour
{
    void Start()
    {
        StartCoroutine(LongRunningTask());
    }

    IEnumerator LongRunningTask()
    {
        Debug.Log("Starting task...");
        yield return new WaitForSeconds(10f);
        Debug.Log("Task complete!"); // Never called if object disabled!
    }

    // SOLUTION: Use a persistent manager
    void StartPersistentTask()
    {
        CoroutineManager.Instance.StartPersistent(LongRunningTask());
    }
}
```

### 2. WaitForSeconds Affected by TimeScale

```csharp
public class TimeScalePitfall : MonoBehaviour
{
    IEnumerator PauseMenuTimer()
    {
        // PROBLEM: When game is paused (timeScale = 0), this never completes
        yield return new WaitForSeconds(5f);
        Debug.Log("Timer complete");
    }

    IEnumerator CorrectPauseMenuTimer()
    {
        // SOLUTION: Use WaitForSecondsRealtime
        yield return new WaitForSecondsRealtime(5f);
        Debug.Log("Timer complete (even when paused)");
    }
}
```

### 3. Accessing Destroyed Objects

```csharp
public class DestroyedObjectPitfall : MonoBehaviour
{
    [SerializeField] private GameObject target;

    void Start()
    {
        StartCoroutine(TrackTarget());
        Destroy(target, 2f); // Target destroyed after 2 seconds
    }

    IEnumerator TrackTarget()
    {
        while (true)
        {
            // PROBLEM: NullReferenceException after target is destroyed
            Debug.Log(target.transform.position);
            yield return null;
        }
    }

    IEnumerator SafeTrackTarget()
    {
        while (target != null) // SOLUTION: Null check
        {
            Debug.Log(target.transform.position);
            yield return null;
        }
        Debug.Log("Target was destroyed");
    }
}
```

### 4. Not Storing Coroutine References

```csharp
public class ReferencesPitfall : MonoBehaviour
{
    void Start()
    {
        // PROBLEM: No way to stop this coroutine!
        StartCoroutine(EndlessTask());
    }

    IEnumerator EndlessTask()
    {
        while (true)
        {
            Debug.Log("Running...");
            yield return new WaitForSeconds(1f);
        }
    }

    // SOLUTION
    private Coroutine endlessCoroutine;

    void StartProperly()
    {
        endlessCoroutine = StartCoroutine(EndlessTask());
    }

    void StopProperly()
    {
        if (endlessCoroutine != null)
        {
            StopCoroutine(endlessCoroutine);
            endlessCoroutine = null;
        }
    }
}
```

### 5. Starting Same Coroutine Multiple Times

```csharp
public class DuplicateCoroutinePitfall : MonoBehaviour
{
    private bool isMoving = false;

    public void MoveToTarget()
    {
        // PROBLEM: Calling this rapidly starts multiple coroutines!
        StartCoroutine(MoveTo(target));
    }

    // SOLUTION 1: Guard flag
    public void MoveToTargetSafe()
    {
        if (!isMoving)
        {
            StartCoroutine(MoveToGuarded(target));
        }
    }

    IEnumerator MoveToGuarded(Vector3 target)
    {
        isMoving = true;
        // ... movement code
        yield return null;
        isMoving = false;
    }

    // SOLUTION 2: Stop previous before starting new
    private Coroutine moveCoroutine;

    public void MoveToTargetReplace()
    {
        if (moveCoroutine != null)
        {
            StopCoroutine(moveCoroutine);
        }
        moveCoroutine = StartCoroutine(MoveTo(target));
    }

    private Vector3 target;
    IEnumerator MoveTo(Vector3 t) { yield return null; }
}
```

### 6. Infinite Loops Without Yield

```csharp
public class InfiniteLoopPitfall : MonoBehaviour
{
    IEnumerator BrokenCoroutine()
    {
        // PROBLEM: No yield in loop = Unity freezes!
        while (true)
        {
            Debug.Log("Working...");
            // Missing yield!
        }
    }

    IEnumerator CorrectCoroutine()
    {
        while (true)
        {
            Debug.Log("Working...");
            yield return null; // Always yield in infinite loops!
        }
    }
}
```

## Performance Considerations

### Memory Allocations

```csharp
public class CoroutinePerformance : MonoBehaviour
{
    // Each StartCoroutine allocates:
    // - ~40 bytes for Coroutine object
    // - State machine object (varies by local variables)

    // BAD: Allocates every frame
    void Update()
    {
        StartCoroutine(QuickTask()); // Don't do this!
    }

    IEnumerator QuickTask()
    {
        // One-frame task
        yield return null;
    }

    // GOOD: Reuse long-running coroutines
    private Coroutine continuousTask;

    void Start()
    {
        continuousTask = StartCoroutine(ContinuousTask());
    }

    IEnumerator ContinuousTask()
    {
        while (true)
        {
            // Do work every frame without allocation
            yield return null;
        }
    }
}
```

### Coroutine Count Limits

```csharp
public class CoroutineLimits : MonoBehaviour
{
    // Unity can handle thousands of coroutines, but there's overhead
    // Consider alternatives for very high counts

    // BAD: 10,000 individual coroutines
    void SpawnManyBad()
    {
        for (int i = 0; i < 10000; i++)
        {
            StartCoroutine(IndividualTask(i));
        }
    }

    IEnumerator IndividualTask(int id)
    {
        yield return new WaitForSeconds(Random.Range(1f, 5f));
        Debug.Log($"Task {id} complete");
    }

    // GOOD: Single coroutine managing many items
    void SpawnManyGood()
    {
        StartCoroutine(BatchTask(10000));
    }

    IEnumerator BatchTask(int count)
    {
        var items = new List<(int id, float delay)>();

        for (int i = 0; i < count; i++)
        {
            items.Add((i, Time.time + Random.Range(1f, 5f)));
        }

        items.Sort((a, b) => a.delay.CompareTo(b.delay));

        foreach (var item in items)
        {
            float waitTime = item.delay - Time.time;
            if (waitTime > 0)
            {
                yield return new WaitForSeconds(waitTime);
            }
            Debug.Log($"Task {item.id} complete");
        }
    }
}
```

### When to Use Alternatives

```csharp
public class CoroutineAlternatives : MonoBehaviour
{
    // For simple delays: Consider Invoke
    void SimpleDelay()
    {
        Invoke(nameof(DelayedMethod), 2f);
    }

    void DelayedMethod() { }

    // For value animations: Consider DOTween/LeanTween
    // transform.DOMove(target, 1f); // One line vs coroutine

    // For high-performance async: Consider UniTask
    // async UniTaskVoid LoadAsync()
    // {
    //     await UniTask.Delay(1000);
    //     var result = await SomeAsyncOperation();
    // }

    // For many simple timers: Consider a timer manager
    void UseTimerManager()
    {
        TimerManager.Instance.CreateTimer(2f, () => Debug.Log("Done"));
    }
}
```

## Real-World Scenarios

### Tutorial Sequence

```csharp
using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class TutorialSequence : MonoBehaviour
{
    [SerializeField] private CanvasGroup tutorialPanel;
    [SerializeField] private Text instructionText;
    [SerializeField] private GameObject highlightArrow;
    [SerializeField] private Transform[] highlightTargets;

    private bool waitingForInput = false;

    void Start()
    {
        StartCoroutine(RunTutorial());
    }

    IEnumerator RunTutorial()
    {
        // Fade in tutorial panel
        yield return FadeCanvasGroup(tutorialPanel, 0f, 1f, 0.5f);

        // Step 1: Movement
        yield return ShowTutorialStep(
            "Use WASD keys to move your character.",
            highlightTargets[0],
            () => Input.GetAxis("Horizontal") != 0 || Input.GetAxis("Vertical") != 0
        );

        // Brief pause between steps
        yield return new WaitForSeconds(0.5f);

        // Step 2: Jump
        yield return ShowTutorialStep(
            "Press SPACE to jump.",
            highlightTargets[1],
            () => Input.GetKeyDown(KeyCode.Space)
        );

        yield return new WaitForSeconds(0.5f);

        // Step 3: Attack
        yield return ShowTutorialStep(
            "Click LEFT MOUSE BUTTON to attack.",
            highlightTargets[2],
            () => Input.GetMouseButtonDown(0)
        );

        // Tutorial complete
        instructionText.text = "Tutorial Complete! Good luck!";
        highlightArrow.SetActive(false);

        yield return new WaitForSeconds(2f);

        // Fade out
        yield return FadeCanvasGroup(tutorialPanel, 1f, 0f, 0.5f);
        tutorialPanel.gameObject.SetActive(false);
    }

    IEnumerator ShowTutorialStep(string instruction, Transform highlight, System.Func<bool> completionCondition)
    {
        // Show instruction
        instructionText.text = instruction;

        // Position highlight arrow
        if (highlight != null)
        {
            highlightArrow.SetActive(true);
            highlightArrow.transform.position = highlight.position + Vector3.up * 2f;
        }

        // Wait for player to complete action
        yield return new WaitUntil(completionCondition);

        // Success feedback
        instructionText.text = "Great!";
        yield return new WaitForSeconds(0.5f);
    }

    IEnumerator FadeCanvasGroup(CanvasGroup group, float from, float to, float duration)
    {
        float elapsed = 0f;
        group.alpha = from;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            group.alpha = Mathf.Lerp(from, to, elapsed / duration);
            yield return null;
        }

        group.alpha = to;
    }
}
```

### Spawn Wave System

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class WaveSpawner : MonoBehaviour
{
    [System.Serializable]
    public class Wave
    {
        public string waveName;
        public EnemySpawn[] enemies;
        public float delayBeforeWave = 3f;
    }

    [System.Serializable]
    public class EnemySpawn
    {
        public GameObject prefab;
        public int count;
        public float spawnInterval = 0.5f;
        public Transform[] spawnPoints;
    }

    [SerializeField] private Wave[] waves;
    [SerializeField] private float delayBetweenWaves = 5f;

    public event System.Action<int, string> OnWaveStarted;
    public event System.Action<int> OnWaveCompleted;
    public event System.Action OnAllWavesCompleted;

    private List<GameObject> activeEnemies = new List<GameObject>();
    private int currentWaveIndex = 0;
    private Coroutine waveCoroutine;

    public void StartWaves()
    {
        if (waveCoroutine != null) StopCoroutine(waveCoroutine);
        waveCoroutine = StartCoroutine(WaveSequence());
    }

    public void StopWaves()
    {
        if (waveCoroutine != null)
        {
            StopCoroutine(waveCoroutine);
            waveCoroutine = null;
        }
    }

    IEnumerator WaveSequence()
    {
        for (currentWaveIndex = 0; currentWaveIndex < waves.Length; currentWaveIndex++)
        {
            Wave wave = waves[currentWaveIndex];

            // Pre-wave delay
            yield return new WaitForSeconds(wave.delayBeforeWave);

            // Announce wave
            OnWaveStarted?.Invoke(currentWaveIndex + 1, wave.waveName);

            // Spawn all enemies in this wave
            yield return SpawnWave(wave);

            // Wait for all enemies to be defeated
            yield return new WaitUntil(() => activeEnemies.Count == 0);

            // Wave complete
            OnWaveCompleted?.Invoke(currentWaveIndex + 1);

            // Delay before next wave (except after last)
            if (currentWaveIndex < waves.Length - 1)
            {
                yield return new WaitForSeconds(delayBetweenWaves);
            }
        }

        OnAllWavesCompleted?.Invoke();
    }

    IEnumerator SpawnWave(Wave wave)
    {
        foreach (EnemySpawn spawn in wave.enemies)
        {
            yield return SpawnEnemyGroup(spawn);
        }
    }

    IEnumerator SpawnEnemyGroup(EnemySpawn spawn)
    {
        var wait = new WaitForSeconds(spawn.spawnInterval);

        for (int i = 0; i < spawn.count; i++)
        {
            // Select random spawn point
            Transform spawnPoint = spawn.spawnPoints[Random.Range(0, spawn.spawnPoints.Length)];

            // Spawn enemy
            GameObject enemy = Instantiate(spawn.prefab, spawnPoint.position, spawnPoint.rotation);
            activeEnemies.Add(enemy);

            // Subscribe to death event
            var health = enemy.GetComponent<Health>();
            if (health != null)
            {
                health.OnDeath += () => OnEnemyDeath(enemy);
            }

            yield return wait;
        }
    }

    private void OnEnemyDeath(GameObject enemy)
    {
        activeEnemies.Remove(enemy);
    }
}
```

### Loading Screen with Progress

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Collections;
using System.Collections.Generic;

public class LoadingScreenManager : MonoBehaviour
{
    [SerializeField] private GameObject loadingScreen;
    [SerializeField] private Slider progressBar;
    [SerializeField] private Text progressText;
    [SerializeField] private Text tipText;
    [SerializeField] private string[] loadingTips;

    private static LoadingScreenManager instance;

    void Awake()
    {
        if (instance == null)
        {
            instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public static void LoadScene(string sceneName, string[] additionalAssets = null)
    {
        instance.StartCoroutine(instance.LoadSceneRoutine(sceneName, additionalAssets));
    }

    IEnumerator LoadSceneRoutine(string sceneName, string[] additionalAssets)
    {
        // Show loading screen
        loadingScreen.SetActive(true);
        progressBar.value = 0f;
        progressText.text = "Loading...";

        // Start tip rotation
        Coroutine tipCoroutine = StartCoroutine(RotateTips());

        // Track total progress
        float sceneWeight = 0.7f;
        float assetsWeight = 0.3f;

        // Load scene async
        AsyncOperation sceneLoad = SceneManager.LoadSceneAsync(sceneName);
        sceneLoad.allowSceneActivation = false;

        while (sceneLoad.progress < 0.9f)
        {
            float sceneProgress = sceneLoad.progress / 0.9f;
            UpdateProgress(sceneProgress * sceneWeight, "Loading scene...");
            yield return null;
        }

        UpdateProgress(sceneWeight, "Scene loaded...");

        // Load additional assets if any
        if (additionalAssets != null && additionalAssets.Length > 0)
        {
            List<ResourceRequest> assetLoads = new List<ResourceRequest>();

            foreach (string asset in additionalAssets)
            {
                assetLoads.Add(Resources.LoadAsync(asset));
            }

            bool allDone = false;
            while (!allDone)
            {
                allDone = true;
                float totalAssetProgress = 0f;

                foreach (var load in assetLoads)
                {
                    totalAssetProgress += load.progress;
                    if (!load.isDone) allDone = false;
                }

                float assetProgress = totalAssetProgress / assetLoads.Count;
                UpdateProgress(sceneWeight + assetProgress * assetsWeight, "Loading assets...");
                yield return null;
            }
        }

        UpdateProgress(1f, "Finalizing...");

        // Minimum loading time for UX
        yield return new WaitForSeconds(0.5f);

        // Stop tips
        StopCoroutine(tipCoroutine);

        // Activate scene
        sceneLoad.allowSceneActivation = true;

        // Wait for scene activation
        yield return new WaitUntil(() => sceneLoad.isDone);

        // Hide loading screen
        loadingScreen.SetActive(false);
    }

    void UpdateProgress(float progress, string status)
    {
        progressBar.value = progress;
        progressText.text = $"{status} ({Mathf.RoundToInt(progress * 100)}%)";
    }

    IEnumerator RotateTips()
    {
        while (true)
        {
            tipText.text = loadingTips[Random.Range(0, loadingTips.Length)];
            yield return new WaitForSeconds(3f);
        }
    }
}
```

## Interview Key Points

### Core Questions

**Q1: What is a coroutine and how does it differ from a regular method?**

A coroutine is a method that can pause execution and return control to Unity, then resume where it left off. Unlike regular methods that complete in one frame, coroutines can span multiple frames while maintaining local state. They use `IEnumerator` return type and `yield` statements to control execution flow.

**Q2: Explain the different yield types and when to use each.**

- `yield return null`: Wait one frame, resume after Update
- `yield return new WaitForSeconds(n)`: Wait n seconds (affected by timeScale)
- `yield return new WaitForSecondsRealtime(n)`: Wait n real seconds (ignores timeScale)
- `yield return new WaitForFixedUpdate()`: Wait until after FixedUpdate
- `yield return new WaitForEndOfFrame()`: Wait until after rendering
- `yield return new WaitUntil(condition)`: Wait until condition is true
- `yield return StartCoroutine(other)`: Wait for another coroutine to complete

**Q3: What happens when you disable a GameObject with running coroutines?**

All coroutines on MonoBehaviours attached to that GameObject (and its children) are stopped immediately. They don't automatically resume when re-enabled - you must manually restart them.

### Practical Questions

**Q4: How do you properly stop a coroutine?**

```csharp
// Store reference
private Coroutine myCoroutine;

void Start()
{
    myCoroutine = StartCoroutine(MyRoutine());
}

void Stop()
{
    if (myCoroutine != null)
    {
        StopCoroutine(myCoroutine);
        myCoroutine = null;
    }
}
```

Using references is preferred over string names because it's faster and catches errors at compile time.

**Q5: How do you optimize coroutines to avoid garbage collection?**

1. Cache `WaitForSeconds` and other yield instructions instead of creating new ones
2. Don't start coroutines every frame
3. Reuse long-running coroutines instead of frequently starting/stopping
4. Consider alternatives like UniTask for zero-allocation async

**Q6: How would you implement a pausable coroutine?**

```csharp
private bool isPaused = false;

IEnumerator PausableRoutine()
{
    while (true)
    {
        while (isPaused)
        {
            yield return null;
        }
        // Do work
        yield return new WaitForSeconds(1f);
    }
}
```

### Advanced Questions

**Q7: When should you use coroutines vs async/await?**

- **Coroutines**: Frame-based timing, Unity lifecycle integration, MonoBehaviour-dependent operations
- **async/await**: True asynchronous operations (file I/O, web requests), cleaner error handling, can be used outside MonoBehaviour

**Q8: How does Unity's coroutine scheduler work internally?**

Unity maintains a list of active coroutines. Each frame, it iterates through this list, checks if each coroutine's yield condition is met, and calls `MoveNext()` on the IEnumerator if so. If `MoveNext()` returns false, the coroutine is removed from the list.

## Further Reading

### Official Documentation

- [Unity Manual: Coroutines](https://docs.unity3d.com/Manual/Coroutines.html)
- [Unity Scripting API: MonoBehaviour.StartCoroutine](https://docs.unity3d.com/ScriptReference/MonoBehaviour.StartCoroutine.html)
- [Unity Scripting API: YieldInstruction](https://docs.unity3d.com/ScriptReference/YieldInstruction.html)
- [Unity Scripting API: CustomYieldInstruction](https://docs.unity3d.com/ScriptReference/CustomYieldInstruction.html)

### Advanced Topics

- **UniTask**: High-performance async/await alternative with zero allocation
- **Unity's Awaitable**: Native async/await support in Unity 2023+
- **DOTween/LeanTween**: Specialized tweening libraries for animations
- **Reactive Extensions**: Observable-based async patterns

### Books and Tutorials

- "Unity in Action" by Joe Hocking - Chapter on Coroutines
- Unity Learn: Intermediate Scripting
- Brackeys YouTube: Coroutines tutorial series

### Related Concepts

- C# Iterator Pattern and IEnumerator
- Unity Execution Order
- Unity Time Management
- State Machine Patterns

---

Coroutines are a powerful tool for managing time-based operations in Unity. By understanding how they work internally, following best practices for lifecycle management and garbage collection, and knowing when to use alternatives, you can create clean, efficient, and maintainable code for complex game sequences, animations, and asynchronous operations.
