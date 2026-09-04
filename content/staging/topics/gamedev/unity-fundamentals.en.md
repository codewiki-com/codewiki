---
title: Unity Game Development Fundamentals
description: "Master Unity engine core concepts: GameObjects, Components, lifecycle, and asset management"
track: gamedev
section: unity
difficulty: beginner
tags:
  - Unity
  - game engine
  - C#
  - beginner
status: imported
origin: old/src/content/docs/gamedev/unity-fundamentals.en.md
divergence: 0.174
issues: []
legacy:
  category: GameDev
  subcategory: Unity
  order: 5
  lastUpdated: 2026-01-07
---

Unity is one of the most widely used game engines in the world, powering games across mobile, PC, console, and VR/AR platforms. We cover the essential concepts every Unity developer needs to master: the Unity Editor, GameObject/Component architecture, MonoBehaviour lifecycle, Prefabs, scene management, asset loading, and Coroutines.

## The Unity Editor

### Editor Layout Overview

The Unity Editor consists of several key windows that work together to help you build games:

```
+------------------+------------------------+------------------+
|                  |                        |                  |
|    Hierarchy     |      Scene View        |    Inspector     |
|    (Objects)     |   (Visual Editor)      |   (Properties)   |
|                  |                        |                  |
+------------------+------------------------+------------------+
|                                                              |
|                       Project Window                         |
|                    (Assets & Resources)                      |
|                                                              |
+--------------------------------------------------------------+
|                       Console Window                         |
+--------------------------------------------------------------+
```

**Key Windows:**

- **Scene View**: Visual editor where you arrange and manipulate GameObjects in 3D/2D space
- **Game View**: Preview of what players will see when the game runs
- **Hierarchy**: Tree structure showing all GameObjects in the current scene
- **Inspector**: Displays and edits properties of selected objects
- **Project**: File browser for all assets in your project
- **Console**: Shows debug messages, warnings, and errors

### Project Structure

A typical Unity project follows this directory structure:

```
MyUnityProject/
├── Assets/                    # Your game content
│   ├── Scripts/              # C# scripts
│   ├── Prefabs/              # Reusable GameObject templates
│   ├── Scenes/               # Scene files (.unity)
│   ├── Materials/            # Material assets
│   ├── Textures/             # Image files
│   ├── Models/               # 3D models
│   ├── Audio/                # Sound files
│   ├── Animations/           # Animation clips and controllers
│   └── Resources/            # Runtime-loadable assets
├── Packages/                  # Package Manager packages
├── ProjectSettings/           # Project configuration
└── Library/                   # Generated files (auto-created)
```

### Essential Editor Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| Play/Stop | Ctrl+P | Cmd+P |
| Pause | Ctrl+Shift+P | Cmd+Shift+P |
| Duplicate | Ctrl+D | Cmd+D |
| Delete | Delete | Cmd+Backspace |
| Focus on selected | F | F |
| Frame all | Shift+F | Shift+F |

## GameObject and Component Model

### Understanding GameObjects

Everything in a Unity scene is a GameObject. GameObjects are containers that hold Components which define their behavior and appearance. An empty GameObject is just a transform (position, rotation, scale) in the scene.

```csharp
using UnityEngine;

public class GameObjectExample : MonoBehaviour
{
    void Start()
    {
        // Create an empty GameObject
        GameObject emptyObject = new GameObject("Empty Object");

        // Create a GameObject with components
        GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
        cube.name = "My Cube";
        cube.transform.position = new Vector3(0, 1, 0);

        // Access the current GameObject
        Debug.Log($"This script is attached to: {gameObject.name}");

        // Find GameObjects in the scene
        GameObject player = GameObject.Find("Player");
        GameObject[] enemies = GameObject.FindGameObjectsWithTag("Enemy");

        // Check if GameObject is active
        if (gameObject.activeSelf)
        {
            Debug.Log("This GameObject is active");
        }

        // Enable/disable GameObjects
        cube.SetActive(false);  // Deactivates the cube
    }
}
```

### The Component Architecture

Components add functionality to GameObjects. Unity follows a composition over inheritance pattern, where you build complex behaviors by combining simple components.

```csharp
using UnityEngine;

public class ComponentExample : MonoBehaviour
{
    void Start()
    {
        // Get components attached to this GameObject
        Transform myTransform = GetComponent<Transform>();
        Rigidbody rb = GetComponent<Rigidbody>();

        // Check if component exists before using
        if (rb != null)
        {
            rb.AddForce(Vector3.up * 10f, ForceMode.Impulse);
        }

        // Try to get component safely (returns null if not found)
        if (TryGetComponent<Collider>(out Collider col))
        {
            col.enabled = true;
        }

        // Get component in children/parent
        AudioSource childAudio = GetComponentInChildren<AudioSource>();
        Canvas parentCanvas = GetComponentInParent<Canvas>();

        // Get all components of a type
        Renderer[] allRenderers = GetComponentsInChildren<Renderer>();

        // Add components at runtime
        BoxCollider newCollider = gameObject.AddComponent<BoxCollider>();

        // Remove components at runtime
        Destroy(newCollider);
    }
}
```

### Common Built-in Components

| Component | Purpose |
|-----------|---------|
| Transform | Position, rotation, scale (every GameObject has one) |
| Rigidbody / Rigidbody2D | Physics simulation |
| Collider / Collider2D | Collision detection |
| MeshRenderer | Renders 3D meshes |
| SpriteRenderer | Renders 2D sprites |
| Camera | Renders the scene to screen |
| AudioSource | Plays audio clips |
| Light | Illuminates the scene |
| Animator | Controls animations |

## MonoBehaviour Lifecycle

### Lifecycle Method Overview

MonoBehaviour is the base class for all Unity scripts. It provides lifecycle methods that are called automatically by the engine at specific times.

```
            Initialization
                  │
    ┌─────────────┼─────────────┐
    ▼             ▼             ▼
  Awake()  OnEnable()     Reset() (Editor only)
    │             │
    └──────┬──────┘
           ▼
        Start()
           │
    ┌──────┴──────┐
    │  Game Loop  │◄─────────────────────┐
    │             │                      │
    ▼             ▼                      │
FixedUpdate()  Update()                  │
(Physics)     (Every frame)              │
              │                          │
              ▼                          │
        LateUpdate()                     │
        (After Update)                   │
              │                          │
              └──────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
      OnDisable()            OnApplicationQuit()
            │
            ▼
      OnDestroy()
```

### Initialization Methods

```csharp
using UnityEngine;

public class LifecycleExample : MonoBehaviour
{
    private Rigidbody rb;
    private GameManager gameManager;

    // Called when the script instance is loaded
    // Always called before Start, even if script is disabled
    // Use for internal initialization
    void Awake()
    {
        Debug.Log("Awake: Setting up internal references");
        rb = GetComponent<Rigidbody>();

        // Don't access other GameObjects here - they might not exist yet
    }

    // Called when the object becomes enabled and active
    void OnEnable()
    {
        Debug.Log("OnEnable: Subscribing to events");
        GameEvents.OnPlayerDeath += HandlePlayerDeath;
    }

    // Called before the first frame update, only if script is enabled
    // Use for external initialization (references to other objects)
    void Start()
    {
        Debug.Log("Start: Setting up external references");
        gameManager = FindObjectOfType<GameManager>();

        // Safe to access other GameObjects here
        if (gameManager != null)
        {
            gameManager.RegisterPlayer(this);
        }
    }

    void HandlePlayerDeath()
    {
        Debug.Log("Player died!");
    }
}
```

### Update Methods

```csharp
using UnityEngine;

public class UpdateMethodsExample : MonoBehaviour
{
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private float jumpForce = 10f;

    private Rigidbody rb;
    private Vector3 movement;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    // Called every frame - use for input and non-physics logic
    // Frame rate dependent
    void Update()
    {
        // Input handling
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");
        movement = new Vector3(horizontal, 0, vertical);

        // Jump input
        if (Input.GetKeyDown(KeyCode.Space))
        {
            Jump();
        }

        // Time.deltaTime makes movement frame-rate independent
        transform.Rotate(Vector3.up * 45f * Time.deltaTime);
    }

    // Called at fixed intervals (default 0.02 seconds)
    // Use for physics calculations
    void FixedUpdate()
    {
        // Physics-based movement
        Vector3 velocity = movement * moveSpeed;
        velocity.y = rb.velocity.y;  // Preserve vertical velocity
        rb.velocity = velocity;
    }

    // Called after all Update methods have been called
    // Use for camera follow, animation updates, etc.
    void LateUpdate()
    {
        // Example: Camera follow (camera script)
        // transform.position = target.position + offset;
    }

    void Jump()
    {
        rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
    }
}
```

### Destruction and Cleanup Methods

```csharp
using UnityEngine;

public class CleanupExample : MonoBehaviour
{
    void OnDisable()
    {
        Debug.Log("OnDisable: Unsubscribing from events");
        GameEvents.OnPlayerDeath -= HandlePlayerDeath;
    }

    void OnDestroy()
    {
        Debug.Log("OnDestroy: Final cleanup");
        // Clean up any resources
        // Note: OnDestroy is also called when scene changes or app quits
    }

    void OnApplicationQuit()
    {
        Debug.Log("Application is quitting");
        // Save game state, close connections, etc.
    }

    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            Debug.Log("Game paused (mobile background)");
            // Save state for potential termination
        }
        else
        {
            Debug.Log("Game resumed");
        }
    }

    void HandlePlayerDeath()
    {
        // Handle event
    }
}
```

### Physics Callbacks

```csharp
using UnityEngine;

public class PhysicsCallbacksExample : MonoBehaviour
{
    // 3D Collision callbacks (requires Collider component)
    void OnCollisionEnter(Collision collision)
    {
        Debug.Log($"Collision started with: {collision.gameObject.name}");

        // Get collision point
        ContactPoint contact = collision.contacts[0];
        Debug.Log($"Impact point: {contact.point}");
        Debug.Log($"Impact force: {collision.relativeVelocity.magnitude}");
    }

    void OnCollisionStay(Collision collision)
    {
        // Called every frame while collision persists
    }

    void OnCollisionExit(Collision collision)
    {
        Debug.Log($"Collision ended with: {collision.gameObject.name}");
    }

    // 3D Trigger callbacks (requires Collider with isTrigger = true)
    void OnTriggerEnter(Collider other)
    {
        if (other.CompareTag("Collectible"))
        {
            Debug.Log("Collected item!");
            Destroy(other.gameObject);
        }
    }

    void OnTriggerStay(Collider other)
    {
        // Called every frame while inside trigger
    }

    void OnTriggerExit(Collider other)
    {
        Debug.Log($"Exited trigger: {other.gameObject.name}");
    }

    // 2D equivalents
    void OnCollisionEnter2D(Collision2D collision) { }
    void OnTriggerEnter2D(Collider2D other) { }
}
```

## Prefabs: Reusable Game Objects

### Understanding Prefabs

Prefabs are reusable GameObject templates. They allow you to create, configure, and store a GameObject with all its components and properties as an asset that can be instantiated multiple times.

```csharp
using UnityEngine;

public class PrefabExample : MonoBehaviour
{
    [Header("Prefab References")]
    [SerializeField] private GameObject enemyPrefab;
    [SerializeField] private GameObject bulletPrefab;
    [SerializeField] private Transform spawnPoint;

    [Header("Spawn Settings")]
    [SerializeField] private int enemyCount = 5;
    [SerializeField] private float spawnRadius = 10f;

    void Start()
    {
        SpawnEnemies();
    }

    void SpawnEnemies()
    {
        for (int i = 0; i < enemyCount; i++)
        {
            // Random position within spawn radius
            Vector3 randomPos = Random.insideUnitSphere * spawnRadius;
            randomPos.y = 0;  // Keep on ground level

            // Instantiate the prefab
            GameObject enemy = Instantiate(
                enemyPrefab,
                spawnPoint.position + randomPos,
                Quaternion.identity
            );

            // Optional: Set parent for organization
            enemy.transform.SetParent(transform);

            // Optional: Configure the spawned instance
            enemy.name = $"Enemy_{i}";
        }
    }

    public void Fire()
    {
        // Instantiate with specific rotation
        GameObject bullet = Instantiate(
            bulletPrefab,
            spawnPoint.position,
            spawnPoint.rotation
        );

        // Configure bullet
        Rigidbody bulletRb = bullet.GetComponent<Rigidbody>();
        if (bulletRb != null)
        {
            bulletRb.velocity = spawnPoint.forward * 20f;
        }

        // Destroy bullet after 3 seconds
        Destroy(bullet, 3f);
    }
}
```

### Prefab Variants

Prefab Variants allow you to create variations of a base prefab while maintaining a parent-child relationship:

```csharp
using UnityEngine;

// Base enemy behavior
public class BaseEnemy : MonoBehaviour
{
    [SerializeField] protected float health = 100f;
    [SerializeField] protected float moveSpeed = 3f;
    [SerializeField] protected int damage = 10;

    public virtual void TakeDamage(float amount)
    {
        health -= amount;
        if (health <= 0)
        {
            Die();
        }
    }

    protected virtual void Die()
    {
        Destroy(gameObject);
    }
}

// Variant: Fast enemy with less health
public class FastEnemy : BaseEnemy
{
    void Awake()
    {
        // Override base values for variant
        health = 50f;
        moveSpeed = 6f;
    }

    protected override void Die()
    {
        // Custom death behavior
        SpawnDeathEffect();
        base.Die();
    }

    void SpawnDeathEffect()
    {
        // Spawn particle effect, etc.
    }
}
```

### Object Pooling with Prefabs

For frequently spawned/destroyed objects (bullets, particles), use object pooling for better performance:

```csharp
using UnityEngine;
using System.Collections.Generic;

public class ObjectPool : MonoBehaviour
{
    [System.Serializable]
    public class Pool
    {
        public string tag;
        public GameObject prefab;
        public int size;
    }

    public static ObjectPool Instance;

    [SerializeField] private List<Pool> pools;
    private Dictionary<string, Queue<GameObject>> poolDictionary;

    void Awake()
    {
        Instance = this;
        InitializePools();
    }

    void InitializePools()
    {
        poolDictionary = new Dictionary<string, Queue<GameObject>>();

        foreach (Pool pool in pools)
        {
            Queue<GameObject> objectPool = new Queue<GameObject>();

            for (int i = 0; i < pool.size; i++)
            {
                GameObject obj = Instantiate(pool.prefab);
                obj.SetActive(false);
                obj.transform.SetParent(transform);
                objectPool.Enqueue(obj);
            }

            poolDictionary.Add(pool.tag, objectPool);
        }
    }

    public GameObject SpawnFromPool(string tag, Vector3 position, Quaternion rotation)
    {
        if (!poolDictionary.ContainsKey(tag))
        {
            Debug.LogWarning($"Pool with tag {tag} doesn't exist.");
            return null;
        }

        GameObject objectToSpawn = poolDictionary[tag].Dequeue();

        objectToSpawn.SetActive(true);
        objectToSpawn.transform.position = position;
        objectToSpawn.transform.rotation = rotation;

        // Notify the object it's being spawned
        IPooledObject pooledObj = objectToSpawn.GetComponent<IPooledObject>();
        pooledObj?.OnObjectSpawn();

        poolDictionary[tag].Enqueue(objectToSpawn);

        return objectToSpawn;
    }
}

public interface IPooledObject
{
    void OnObjectSpawn();
}

// Example usage
public class Bullet : MonoBehaviour, IPooledObject
{
    [SerializeField] private float lifetime = 2f;

    public void OnObjectSpawn()
    {
        // Reset state when spawned from pool
        CancelInvoke();
        Invoke(nameof(Deactivate), lifetime);
    }

    void Deactivate()
    {
        gameObject.SetActive(false);
    }
}
```

## Scene Management

### Loading Scenes

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;

public class SceneController : MonoBehaviour
{
    // Load scene by name
    public void LoadLevel(string sceneName)
    {
        SceneManager.LoadScene(sceneName);
    }

    // Load scene by build index
    public void LoadLevel(int buildIndex)
    {
        SceneManager.LoadScene(buildIndex);
    }

    // Reload current scene
    public void ReloadScene()
    {
        Scene currentScene = SceneManager.GetActiveScene();
        SceneManager.LoadScene(currentScene.name);
    }

    // Load next scene
    public void LoadNextLevel()
    {
        int currentIndex = SceneManager.GetActiveScene().buildIndex;
        int nextIndex = currentIndex + 1;

        // Check if next scene exists
        if (nextIndex < SceneManager.sceneCountInBuildSettings)
        {
            SceneManager.LoadScene(nextIndex);
        }
        else
        {
            Debug.Log("No more levels!");
            SceneManager.LoadScene(0);  // Return to first scene
        }
    }

    public void QuitGame()
    {
        #if UNITY_EDITOR
            UnityEditor.EditorApplication.isPlaying = false;
        #else
            Application.Quit();
        #endif
    }
}
```

### Async Scene Loading

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using System.Collections;

public class AsyncSceneLoader : MonoBehaviour
{
    [SerializeField] private GameObject loadingScreen;
    [SerializeField] private Slider progressBar;
    [SerializeField] private Text progressText;

    public void LoadSceneAsync(string sceneName)
    {
        StartCoroutine(LoadSceneCoroutine(sceneName));
    }

    IEnumerator LoadSceneCoroutine(string sceneName)
    {
        loadingScreen.SetActive(true);

        // Start loading the scene asynchronously
        AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName);

        // Don't let the scene activate until we're ready
        operation.allowSceneActivation = false;

        while (!operation.isDone)
        {
            // Progress goes from 0 to 0.9 during loading
            // 0.9 to 1.0 is activation
            float progress = Mathf.Clamp01(operation.progress / 0.9f);

            progressBar.value = progress;
            progressText.text = $"Loading... {progress * 100:F0}%";

            // When loading is complete (0.9), activate the scene
            if (operation.progress >= 0.9f)
            {
                progressText.text = "Press any key to continue...";

                if (Input.anyKeyDown)
                {
                    operation.allowSceneActivation = true;
                }
            }

            yield return null;
        }
    }
}
```

### Additive Scene Loading

```csharp
using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

public class AdditiveSceneManager : MonoBehaviour
{
    [SerializeField] private string mainMenuScene = "MainMenu";
    [SerializeField] private string gameUIScene = "GameUI";

    void Start()
    {
        // Load UI scene additively (keeps current scene)
        SceneManager.LoadScene(gameUIScene, LoadSceneMode.Additive);
    }

    public IEnumerator LoadLevelAdditive(string levelName)
    {
        // Load the level scene additively
        AsyncOperation loadOp = SceneManager.LoadSceneAsync(levelName, LoadSceneMode.Additive);

        while (!loadOp.isDone)
        {
            yield return null;
        }

        // Set the new scene as active (for lighting, etc.)
        Scene newScene = SceneManager.GetSceneByName(levelName);
        SceneManager.SetActiveScene(newScene);
    }

    public IEnumerator UnloadScene(string sceneName)
    {
        AsyncOperation unloadOp = SceneManager.UnloadSceneAsync(sceneName);

        while (!unloadOp.isDone)
        {
            yield return null;
        }

        // Clean up memory
        Resources.UnloadUnusedAssets();
    }
}
```

### Persisting Objects Across Scenes

```csharp
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public int PlayerScore { get; set; }
    public int CurrentLevel { get; set; }

    void Awake()
    {
        // Singleton pattern with scene persistence
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
}

// Alternative: Using a scriptable object for game data
[CreateAssetMenu(fileName = "GameData", menuName = "Game/GameData")]
public class GameData : ScriptableObject
{
    public int highScore;
    public int totalCoins;
    public bool[] levelsUnlocked;

    public void ResetData()
    {
        highScore = 0;
        totalCoins = 0;
        levelsUnlocked = new bool[10];
        levelsUnlocked[0] = true;  // First level unlocked by default
    }
}
```

## Asset Loading

### Resources Folder

The Resources folder is a special folder that allows runtime loading of assets. However, use it sparingly as all assets in Resources are included in the build.

```csharp
using UnityEngine;

public class ResourcesExample : MonoBehaviour
{
    void Start()
    {
        // Load a single asset
        // File path: Assets/Resources/Prefabs/Enemy.prefab
        GameObject enemyPrefab = Resources.Load<GameObject>("Prefabs/Enemy");

        if (enemyPrefab != null)
        {
            Instantiate(enemyPrefab, Vector3.zero, Quaternion.identity);
        }

        // Load all assets of a type from a folder
        GameObject[] allEnemies = Resources.LoadAll<GameObject>("Prefabs/Enemies");
        Debug.Log($"Loaded {allEnemies.Length} enemy prefabs");

        // Load texture
        Texture2D texture = Resources.Load<Texture2D>("Textures/PlayerIcon");

        // Load audio clip
        AudioClip clip = Resources.Load<AudioClip>("Audio/BackgroundMusic");

        // Load text file
        TextAsset textFile = Resources.Load<TextAsset>("Data/config");
        if (textFile != null)
        {
            Debug.Log(textFile.text);
        }

        // Load material
        Material material = Resources.Load<Material>("Materials/GlowMaterial");
    }

    // Async loading for large assets
    IEnumerator LoadAssetAsync()
    {
        ResourceRequest request = Resources.LoadAsync<GameObject>("Prefabs/LargeAsset");

        while (!request.isDone)
        {
            Debug.Log($"Loading: {request.progress * 100}%");
            yield return null;
        }

        GameObject loadedAsset = request.asset as GameObject;
        Instantiate(loadedAsset);
    }

    void OnDestroy()
    {
        // Unload unused assets to free memory
        Resources.UnloadUnusedAssets();
    }
}
```

### Addressables System

Addressables is Unity's recommended approach for asset management in production games. It provides efficient memory management, async loading, and supports content delivery networks (CDN) for downloading assets.

```csharp
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;
using System.Collections;
using System.Collections.Generic;

public class AddressablesExample : MonoBehaviour
{
    [SerializeField] private AssetReference enemyPrefabReference;
    [SerializeField] private AssetLabelReference enemyLabelReference;

    private List<AsyncOperationHandle<GameObject>> loadedHandles = new List<AsyncOperationHandle<GameObject>>();

    void Start()
    {
        // Load using AssetReference
        LoadPrefabAsync();

        // Load by address string
        StartCoroutine(LoadByAddressCoroutine("Prefabs/Player"));

        // Load multiple assets by label
        LoadByLabel();
    }

    async void LoadPrefabAsync()
    {
        // Using async/await pattern
        AsyncOperationHandle<GameObject> handle = enemyPrefabReference.LoadAssetAsync<GameObject>();
        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            GameObject enemy = Instantiate(handle.Result);
            loadedHandles.Add(handle);
        }
        else
        {
            Debug.LogError("Failed to load asset");
        }
    }

    IEnumerator LoadByAddressCoroutine(string address)
    {
        AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>(address);
        yield return handle;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result, Vector3.zero, Quaternion.identity);
            loadedHandles.Add(handle);
        }
    }

    void LoadByLabel()
    {
        // Load all assets with a specific label
        Addressables.LoadAssetsAsync<GameObject>(
            enemyLabelReference,
            (loadedPrefab) =>
            {
                // Called for each loaded asset
                Debug.Log($"Loaded: {loadedPrefab.name}");
            }
        );
    }

    // Instantiate directly (loads and instantiates in one call)
    public void SpawnEnemy(Vector3 position)
    {
        Addressables.InstantiateAsync(enemyPrefabReference, position, Quaternion.identity);
    }

    void OnDestroy()
    {
        // Release loaded assets to free memory
        foreach (var handle in loadedHandles)
        {
            Addressables.Release(handle);
        }
        loadedHandles.Clear();

        // Release AssetReference
        enemyPrefabReference.ReleaseAsset();
    }
}
```

### Asset Bundles (Legacy)

While Addressables is preferred, understanding Asset Bundles is useful for maintaining older projects:

```csharp
using UnityEngine;
using System.Collections;
using System.IO;

public class AssetBundleExample : MonoBehaviour
{
    private AssetBundle loadedBundle;

    IEnumerator LoadBundleFromFile()
    {
        string bundlePath = Path.Combine(Application.streamingAssetsPath, "mybundle");

        AssetBundleCreateRequest bundleRequest = AssetBundle.LoadFromFileAsync(bundlePath);
        yield return bundleRequest;

        loadedBundle = bundleRequest.assetBundle;

        if (loadedBundle != null)
        {
            // Load asset from bundle
            AssetBundleRequest assetRequest = loadedBundle.LoadAssetAsync<GameObject>("MyPrefab");
            yield return assetRequest;

            GameObject prefab = assetRequest.asset as GameObject;
            Instantiate(prefab);
        }
    }

    IEnumerator LoadBundleFromWeb()
    {
        string bundleUrl = "https://example.com/bundles/mybundle";

        using (UnityEngine.Networking.UnityWebRequest request =
            UnityEngine.Networking.UnityWebRequestAssetBundle.GetAssetBundle(bundleUrl))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityEngine.Networking.UnityWebRequest.Result.Success)
            {
                loadedBundle = UnityEngine.Networking.DownloadHandlerAssetBundle.GetContent(request);
                // Use the bundle...
            }
        }
    }

    void OnDestroy()
    {
        if (loadedBundle != null)
        {
            loadedBundle.Unload(true);
        }
    }
}
```

## Coroutines

### Understanding Coroutines

Coroutines allow you to spread execution across multiple frames without blocking. They are essential for animations, timed events, and async operations.

```csharp
using UnityEngine;
using System.Collections;

public class CoroutineBasics : MonoBehaviour
{
    void Start()
    {
        // Start a coroutine
        StartCoroutine(SimpleCoroutine());

        // Start coroutine and store reference
        Coroutine myCoroutine = StartCoroutine(CountdownCoroutine(5));

        // Start coroutine by name (allows stopping by name)
        StartCoroutine("NamedCoroutine");
    }

    IEnumerator SimpleCoroutine()
    {
        Debug.Log("Coroutine started");

        // Wait for one frame
        yield return null;

        Debug.Log("One frame passed");

        // Wait for specified seconds (affected by Time.timeScale)
        yield return new WaitForSeconds(2f);

        Debug.Log("2 seconds passed");

        // Wait for real time (not affected by Time.timeScale)
        yield return new WaitForSecondsRealtime(1f);

        Debug.Log("1 real second passed");

        // Wait until end of frame
        yield return new WaitForEndOfFrame();

        // Wait until next fixed update
        yield return new WaitForFixedUpdate();

        Debug.Log("Coroutine ended");
    }

    IEnumerator CountdownCoroutine(int seconds)
    {
        for (int i = seconds; i > 0; i--)
        {
            Debug.Log($"Countdown: {i}");
            yield return new WaitForSeconds(1f);
        }
        Debug.Log("Countdown complete!");
    }

    IEnumerator NamedCoroutine()
    {
        yield return new WaitForSeconds(1f);
        Debug.Log("Named coroutine executed");
    }

    void StopAllMyCoroutines()
    {
        // Stop specific coroutine by name
        StopCoroutine("NamedCoroutine");

        // Stop all coroutines on this MonoBehaviour
        StopAllCoroutines();
    }
}
```

### WaitUntil and WaitWhile

```csharp
using UnityEngine;
using System.Collections;

public class ConditionalWaiting : MonoBehaviour
{
    private bool isReady = false;
    private int loadProgress = 0;

    void Start()
    {
        StartCoroutine(WaitForCondition());
        StartCoroutine(SimulateLoading());
    }

    IEnumerator WaitForCondition()
    {
        Debug.Log("Waiting for ready state...");

        // Wait until condition is true
        yield return new WaitUntil(() => isReady);

        Debug.Log("Ready! Proceeding...");

        // Wait while condition is true
        yield return new WaitWhile(() => loadProgress < 100);

        Debug.Log("Loading complete!");
    }

    IEnumerator SimulateLoading()
    {
        yield return new WaitForSeconds(2f);
        isReady = true;

        while (loadProgress < 100)
        {
            loadProgress += 10;
            yield return new WaitForSeconds(0.2f);
        }
    }
}
```

### Practical Coroutine Examples

```csharp
using UnityEngine;
using System.Collections;

public class PracticalCoroutines : MonoBehaviour
{
    [SerializeField] private Transform target;
    [SerializeField] private float moveSpeed = 5f;
    [SerializeField] private AnimationCurve fadeCurve;

    private SpriteRenderer spriteRenderer;
    private CanvasGroup canvasGroup;

    void Awake()
    {
        spriteRenderer = GetComponent<SpriteRenderer>();
        canvasGroup = GetComponent<CanvasGroup>();
    }

    // Smooth movement to target
    public void MoveToTarget()
    {
        StartCoroutine(MoveToPosition(target.position, moveSpeed));
    }

    IEnumerator MoveToPosition(Vector3 targetPosition, float speed)
    {
        while (Vector3.Distance(transform.position, targetPosition) > 0.01f)
        {
            transform.position = Vector3.MoveTowards(
                transform.position,
                targetPosition,
                speed * Time.deltaTime
            );
            yield return null;
        }

        transform.position = targetPosition;
    }

    // Lerp-based smooth movement
    IEnumerator SmoothMove(Vector3 targetPosition, float duration)
    {
        Vector3 startPosition = transform.position;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float t = elapsed / duration;
            // Use smoothstep for easing
            t = t * t * (3f - 2f * t);

            transform.position = Vector3.Lerp(startPosition, targetPosition, t);
            elapsed += Time.deltaTime;
            yield return null;
        }

        transform.position = targetPosition;
    }

    // Fade effect
    public void FadeOut(float duration)
    {
        StartCoroutine(FadeCoroutine(1f, 0f, duration));
    }

    public void FadeIn(float duration)
    {
        StartCoroutine(FadeCoroutine(0f, 1f, duration));
    }

    IEnumerator FadeCoroutine(float startAlpha, float endAlpha, float duration)
    {
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float t = elapsed / duration;
            float alpha = Mathf.Lerp(startAlpha, endAlpha, fadeCurve.Evaluate(t));

            if (spriteRenderer != null)
            {
                Color color = spriteRenderer.color;
                color.a = alpha;
                spriteRenderer.color = color;
            }

            if (canvasGroup != null)
            {
                canvasGroup.alpha = alpha;
            }

            elapsed += Time.deltaTime;
            yield return null;
        }

        // Ensure we reach exact end value
        if (spriteRenderer != null)
        {
            Color color = spriteRenderer.color;
            color.a = endAlpha;
            spriteRenderer.color = color;
        }

        if (canvasGroup != null)
        {
            canvasGroup.alpha = endAlpha;
        }
    }

    // Shake effect
    public void Shake(float duration, float magnitude)
    {
        StartCoroutine(ShakeCoroutine(duration, magnitude));
    }

    IEnumerator ShakeCoroutine(float duration, float magnitude)
    {
        Vector3 originalPosition = transform.localPosition;
        float elapsed = 0f;

        while (elapsed < duration)
        {
            float x = Random.Range(-1f, 1f) * magnitude;
            float y = Random.Range(-1f, 1f) * magnitude;

            transform.localPosition = originalPosition + new Vector3(x, y, 0);

            elapsed += Time.deltaTime;
            yield return null;
        }

        transform.localPosition = originalPosition;
    }

    // Typewriter text effect
    IEnumerator TypewriterEffect(UnityEngine.UI.Text textComponent, string fullText, float delay)
    {
        textComponent.text = "";

        foreach (char c in fullText)
        {
            textComponent.text += c;
            yield return new WaitForSeconds(delay);
        }
    }

    // Chaining coroutines
    IEnumerator SequenceCoroutine()
    {
        Debug.Log("Step 1: Moving to position");
        yield return StartCoroutine(MoveToPosition(new Vector3(5, 0, 0), 3f));

        Debug.Log("Step 2: Waiting");
        yield return new WaitForSeconds(1f);

        Debug.Log("Step 3: Fading out");
        yield return StartCoroutine(FadeCoroutine(1f, 0f, 1f));

        Debug.Log("Sequence complete!");
    }
}
```

### Coroutine with Return Values (Using Callbacks)

```csharp
using UnityEngine;
using System;
using System.Collections;

public class CoroutineWithResults : MonoBehaviour
{
    // Using callbacks for return values
    public void LoadData(Action<string> onComplete)
    {
        StartCoroutine(LoadDataCoroutine(onComplete));
    }

    IEnumerator LoadDataCoroutine(Action<string> onComplete)
    {
        // Simulate loading
        yield return new WaitForSeconds(2f);

        string data = "Loaded data!";
        onComplete?.Invoke(data);
    }

    // Using a result wrapper class
    public class CoroutineResult<T>
    {
        public T Result { get; set; }
        public bool IsComplete { get; set; }
        public Exception Error { get; set; }
    }

    public CoroutineResult<int> CalculateAsync()
    {
        var result = new CoroutineResult<int>();
        StartCoroutine(CalculateCoroutine(result));
        return result;
    }

    IEnumerator CalculateCoroutine(CoroutineResult<int> result)
    {
        yield return new WaitForSeconds(1f);

        try
        {
            result.Result = 42;
            result.IsComplete = true;
        }
        catch (Exception e)
        {
            result.Error = e;
            result.IsComplete = true;
        }
    }

    // Usage example
    void Start()
    {
        // Callback approach
        LoadData((data) =>
        {
            Debug.Log($"Received: {data}");
        });

        // Result wrapper approach
        StartCoroutine(UseCalculateResult());
    }

    IEnumerator UseCalculateResult()
    {
        var result = CalculateAsync();

        yield return new WaitUntil(() => result.IsComplete);

        if (result.Error == null)
        {
            Debug.Log($"Result: {result.Result}");
        }
        else
        {
            Debug.LogError($"Error: {result.Error.Message}");
        }
    }
}
```

## Best Practices and Common Patterns

### Singleton Pattern

```csharp
using UnityEngine;

// Simple singleton
public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void PlaySound(AudioClip clip)
    {
        // Play sound implementation
    }
}

// Generic singleton base class
public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
{
    private static T _instance;
    private static readonly object _lock = new object();

    public static T Instance
    {
        get
        {
            lock (_lock)
            {
                if (_instance == null)
                {
                    _instance = FindObjectOfType<T>();

                    if (_instance == null)
                    {
                        GameObject singletonObject = new GameObject(typeof(T).Name);
                        _instance = singletonObject.AddComponent<T>();
                    }
                }
                return _instance;
            }
        }
    }

    protected virtual void Awake()
    {
        if (_instance == null)
        {
            _instance = this as T;
            DontDestroyOnLoad(gameObject);
        }
        else if (_instance != this)
        {
            Destroy(gameObject);
        }
    }
}

// Usage
public class GameManager : Singleton<GameManager>
{
    public int Score { get; set; }
}
```

### Event System

```csharp
using UnityEngine;
using System;

// Static event system
public static class GameEvents
{
    public static event Action OnGameStart;
    public static event Action OnGamePause;
    public static event Action OnGameResume;
    public static event Action<int> OnScoreChanged;
    public static event Action<GameObject> OnEnemyKilled;

    public static void TriggerGameStart() => OnGameStart?.Invoke();
    public static void TriggerGamePause() => OnGamePause?.Invoke();
    public static void TriggerGameResume() => OnGameResume?.Invoke();
    public static void TriggerScoreChanged(int newScore) => OnScoreChanged?.Invoke(newScore);
    public static void TriggerEnemyKilled(GameObject enemy) => OnEnemyKilled?.Invoke(enemy);
}

// Subscriber example
public class ScoreDisplay : MonoBehaviour
{
    void OnEnable()
    {
        GameEvents.OnScoreChanged += UpdateScoreDisplay;
    }

    void OnDisable()
    {
        GameEvents.OnScoreChanged -= UpdateScoreDisplay;
    }

    void UpdateScoreDisplay(int newScore)
    {
        Debug.Log($"Score: {newScore}");
    }
}

// Publisher example
public class Player : MonoBehaviour
{
    private int score = 0;

    public void AddScore(int points)
    {
        score += points;
        GameEvents.TriggerScoreChanged(score);
    }
}
```

### SerializeField and Inspector Tips

```csharp
using UnityEngine;

public class InspectorExample : MonoBehaviour
{
    // Exposed in inspector
    [SerializeField] private float speed = 5f;

    // Grouped with header
    [Header("Movement Settings")]
    [SerializeField] private float walkSpeed = 3f;
    [SerializeField] private float runSpeed = 7f;

    // With tooltip
    [Tooltip("Maximum health points")]
    [SerializeField] private int maxHealth = 100;

    // Range slider
    [Range(0f, 1f)]
    [SerializeField] private float volume = 0.5f;

    // Text area for multi-line strings
    [TextArea(3, 10)]
    [SerializeField] private string description;

    // Required reference
    [SerializeField] private Transform target;

    // Hidden in inspector but still serialized
    [HideInInspector]
    public int hiddenValue;

    // Space between fields
    [Space(20)]
    [SerializeField] private bool isActive;

    // Color field
    [SerializeField] private Color teamColor = Color.blue;

    // Gradient
    [SerializeField] private Gradient colorGradient;

    // Animation curve
    [SerializeField] private AnimationCurve movementCurve;

    // Validation
    void OnValidate()
    {
        // Called when values change in inspector
        if (maxHealth < 1) maxHealth = 1;
        if (walkSpeed > runSpeed) walkSpeed = runSpeed;
    }
}
```

## Interview Key Points

### Core Concept Questions

**1. What is the difference between Awake() and Start()?**

- `Awake()` is called when the script instance is loaded, even if the script is disabled. Use it for internal initialization.
- `Start()` is called before the first frame update, only if the script is enabled. Use it for external references to other GameObjects.
- `Awake()` of all objects is called before any `Start()`.

**2. What is the difference between Update(), FixedUpdate(), and LateUpdate()?**

- `Update()`: Called every frame, frame-rate dependent. Use for input and general logic.
- `FixedUpdate()`: Called at fixed intervals (default 0.02s). Use for physics calculations.
- `LateUpdate()`: Called after all Update() functions. Use for camera follow, post-processing.

**3. How do Prefabs work and why are they useful?**

- Prefabs are reusable GameObject templates stored as assets.
- Changes to the prefab asset automatically update all instances.
- They support variants for creating variations while maintaining inheritance.
- Essential for spawning objects at runtime and maintaining consistency.

**4. What is the difference between Resources.Load and Addressables?**

- `Resources.Load`: Simple but all Resources assets are included in build regardless of use.
- `Addressables`: More complex but provides lazy loading, memory management, remote asset delivery, and better build size control.

**5. When should you use Coroutines vs Update()?**

- Use Coroutines for: timed sequences, waiting for conditions, async-like patterns, one-off processes.
- Use Update() for: continuous behavior, frame-by-frame logic, input handling.

### Performance Tips

1. **Cache component references** in Awake()/Start() instead of calling GetComponent() every frame
2. **Use object pooling** for frequently spawned/destroyed objects
3. **Avoid Find methods** in Update(); cache references instead
4. **Use Addressables** for large projects to manage memory and build size
5. **Profile with Unity Profiler** to identify bottlenecks

## Further Reading

### Official Resources

- [Unity Manual](https://docs.unity3d.com/Manual/)
- [Unity Scripting API](https://docs.unity3d.com/ScriptReference/)
- [Unity Learn](https://learn.unity.com/)

### Advanced Topics

- **Unity ECS (Entity Component System)**: Data-oriented design for high-performance games
- **Scriptable Objects**: Data containers for game configuration and events
- **Shader Programming**: Custom visual effects with ShaderLab and HLSL
- **Unity Networking**: Multiplayer game development with Netcode

### Recommended Packages

- **Cinemachine**: Professional camera system
- **TextMeshPro**: Advanced text rendering
- **Input System**: Modern, flexible input handling
- **Universal Render Pipeline (URP)**: Optimized graphics for multiple platforms

---

> We covered the fundamental concepts of Unity game development. Understanding GameObjects, Components, MonoBehaviour lifecycle, Prefabs, scene management, asset loading, and Coroutines provides a solid foundation for building games of any complexity. Practice with small projects and gradually tackle more advanced topics as you become comfortable with these core concepts.
