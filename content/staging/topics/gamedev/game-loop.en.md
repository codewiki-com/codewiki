---
title: Game Loop and Frame Rate Control
description: Deep dive into game loop architecture, fixed vs variable timestep, and frame rate management
track: gamedev
section: gameplay-systems
difficulty: intermediate
tags:
  - game loop
  - frame rate
  - timestep
  - performance
status: imported
origin: old/src/content/docs/gamedev/game-loop.en.md
divergence: 0.189
issues: []
legacy:
  category: GameDev
  subcategory: Fundamentals
  order: 1
  lastUpdated: 2026-01-07
---

## Concept Overview

### What is a Game Loop?

The game loop is the heartbeat of every video game. It is a continuous cycle that keeps the game running, repeatedly performing three fundamental operations: **processing input**, **updating game state**, and **rendering**. Unlike traditional applications that wait for user input, games must constantly update and redraw themselves to create the illusion of motion and interactivity.

```
┌─────────────────────────────────────────────────────────┐
│                      GAME LOOP                          │
│                                                         │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│    │  Input   │───►│  Update  │───►│  Render  │        │
│    │ Process  │    │  State   │    │  Frame   │        │
│    └──────────┘    └──────────┘    └──────────┘        │
│         ▲                                    │          │
│         └────────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

At its core, a game loop answers three questions every frame:
1. **What did the player do?** (Input)
2. **What changed in the game world?** (Update)
3. **What should the player see?** (Render)

### Why Game Loops Matter

The game loop directly impacts:

- **Responsiveness**: How quickly the game reacts to player input
- **Smoothness**: How fluid animations and movements appear
- **Consistency**: Whether the game behaves the same across different hardware
- **Fairness**: In multiplayer games, whether all players experience the same game speed

A poorly implemented game loop can cause stuttering, input lag, physics bugs, or make your game unplayable on slower machines.

---

## Core Architecture

### The Simplest Game Loop

The most basic game loop looks deceptively simple:

```cpp
// C++ - Naive game loop (DO NOT USE IN PRODUCTION)
while (gameIsRunning) {
    processInput();
    update();
    render();
}
```

```csharp
// C# - Naive game loop (DO NOT USE IN PRODUCTION)
while (gameIsRunning)
{
    ProcessInput();
    Update();
    Render();
}
```

**The Problem**: This loop runs as fast as the CPU allows. On a fast computer, it might run thousands of times per second. On a slow computer, it might barely manage 20 iterations. This creates two major issues:

1. **Variable game speed**: Characters move faster on faster computers
2. **Resource waste**: Running at 3000 FPS provides no visual benefit but consumes power

### Understanding Frame Rate

Frame rate (measured in FPS - Frames Per Second) indicates how many complete cycles the game loop executes per second. Common targets include:

| Frame Rate | Frame Time | Use Case |
|------------|------------|----------|
| 30 FPS | 33.33 ms | Cinematic games, older consoles |
| 60 FPS | 16.67 ms | Standard gaming target |
| 120 FPS | 8.33 ms | Competitive gaming, VR |
| 144+ FPS | <6.94 ms | High-refresh-rate monitors |

The **frame time** (time between frames) is the inverse of frame rate:

```
Frame Time = 1000ms / FPS
```

---

## Timestep Approaches

The way a game loop handles time is called the **timestep** strategy. There are two fundamental approaches: variable timestep and fixed timestep.

### Variable Timestep (Delta Time)

Variable timestep measures the actual time elapsed since the last frame and uses that to scale all game logic.

```cpp
// C++ - Variable timestep implementation
#include <chrono>

using Clock = std::chrono::high_resolution_clock;
using Duration = std::chrono::duration<double>;

void runGame() {
    auto previousTime = Clock::now();

    while (gameIsRunning) {
        auto currentTime = Clock::now();
        Duration elapsed = currentTime - previousTime;
        double deltaTime = elapsed.count(); // Time in seconds
        previousTime = currentTime;

        processInput();
        update(deltaTime);
        render();
    }
}

void update(double deltaTime) {
    // Movement is scaled by deltaTime for frame-rate independence
    player.position.x += player.velocity.x * deltaTime;
    player.position.y += player.velocity.y * deltaTime;

    // Example: Move 100 units per second
    // At 60 FPS: 100 * 0.0167 = 1.67 units per frame
    // At 30 FPS: 100 * 0.0333 = 3.33 units per frame
    // Result: Same distance over same real time
}
```

```csharp
// C# - Variable timestep implementation
using System;
using System.Diagnostics;

public class GameLoop
{
    private Stopwatch stopwatch = new Stopwatch();
    private bool gameIsRunning = true;

    public void Run()
    {
        stopwatch.Start();
        double previousTime = stopwatch.Elapsed.TotalSeconds;

        while (gameIsRunning)
        {
            double currentTime = stopwatch.Elapsed.TotalSeconds;
            double deltaTime = currentTime - previousTime;
            previousTime = currentTime;

            ProcessInput();
            Update(deltaTime);
            Render();
        }
    }

    private void Update(double deltaTime)
    {
        // Frame-rate independent movement
        player.Position.X += player.Velocity.X * (float)deltaTime;
        player.Position.Y += player.Velocity.Y * (float)deltaTime;
    }
}
```

**Advantages of Variable Timestep**:
- Simple to implement
- Renders as many frames as possible
- Smooth visuals on high-refresh monitors

**Disadvantages**:
- Physics simulations can become unstable with large delta times
- Non-deterministic: replays and netcode become difficult
- Floating-point accumulation errors over time

### The Spiral of Death

A critical problem with variable timestep occurs when updates take longer than real time:

```
Frame 1: Update takes 20ms, deltaTime = 20ms
Frame 2: More work to simulate, update takes 25ms, deltaTime = 25ms
Frame 3: Even more work, update takes 35ms, deltaTime = 35ms
... Game becomes unplayable
```

This "spiral of death" happens when the game cannot keep up with real time, causing delta time to grow, which causes more work, which causes larger delta time...

**Solution**: Cap the maximum delta time:

```cpp
// C++ - Capped delta time
double deltaTime = elapsed.count();
const double MAX_DELTA = 0.25; // Cap at 250ms (4 FPS minimum)
if (deltaTime > MAX_DELTA) {
    deltaTime = MAX_DELTA;
}
```

### Fixed Timestep

Fixed timestep runs game logic at a constant rate, regardless of rendering speed. This is the preferred approach for physics simulations and deterministic gameplay.

```cpp
// C++ - Fixed timestep implementation
#include <chrono>

using Clock = std::chrono::high_resolution_clock;
using Duration = std::chrono::duration<double>;

const double FIXED_TIMESTEP = 1.0 / 60.0; // 60 updates per second

void runGame() {
    auto previousTime = Clock::now();
    double accumulator = 0.0;

    while (gameIsRunning) {
        auto currentTime = Clock::now();
        Duration elapsed = currentTime - previousTime;
        double frameTime = elapsed.count();
        previousTime = currentTime;

        // Cap frame time to prevent spiral of death
        if (frameTime > 0.25) {
            frameTime = 0.25;
        }

        accumulator += frameTime;

        processInput();

        // Run fixed updates until we've caught up
        while (accumulator >= FIXED_TIMESTEP) {
            fixedUpdate(FIXED_TIMESTEP);
            accumulator -= FIXED_TIMESTEP;
        }

        render();
    }
}

void fixedUpdate(double dt) {
    // Physics and game logic with constant timestep
    // dt is always FIXED_TIMESTEP (e.g., 1/60 second)
    updatePhysics(dt);
    checkCollisions();
    updateGameLogic(dt);
}
```

```csharp
// C# - Fixed timestep implementation
public class FixedTimestepLoop
{
    private const double FixedTimestep = 1.0 / 60.0; // 60 Hz
    private Stopwatch stopwatch = new Stopwatch();
    private bool gameIsRunning = true;

    public void Run()
    {
        stopwatch.Start();
        double previousTime = stopwatch.Elapsed.TotalSeconds;
        double accumulator = 0.0;

        while (gameIsRunning)
        {
            double currentTime = stopwatch.Elapsed.TotalSeconds;
            double frameTime = currentTime - previousTime;
            previousTime = currentTime;

            // Prevent spiral of death
            if (frameTime > 0.25)
                frameTime = 0.25;

            accumulator += frameTime;

            ProcessInput();

            while (accumulator >= FixedTimestep)
            {
                FixedUpdate(FixedTimestep);
                accumulator -= FixedTimestep;
            }

            Render();
        }
    }

    private void FixedUpdate(double dt)
    {
        // Deterministic physics and game logic
        UpdatePhysics(dt);
        CheckCollisions();
        UpdateGameLogic(dt);
    }
}
```

**How Fixed Timestep Works**:

```
Time accumulated: 0ms
Frame renders, elapsed: 16ms
Accumulator: 16ms (< 16.67ms, no update)

Frame renders, elapsed: 17ms
Accumulator: 33ms (>= 16.67ms)
  - Run fixedUpdate(), accumulator: 16.33ms
  - Run fixedUpdate(), accumulator: -0.34ms... wait, still >= 0

Actually: 33ms >= 16.67ms, run update, 33-16.67 = 16.33ms
         16.33ms < 16.67ms, stop

Frame renders, elapsed: 15ms
Accumulator: 31.33ms (>= 16.67ms)
  - Run fixedUpdate(), accumulator: 14.66ms
```

**Advantages of Fixed Timestep**:
- Deterministic: same inputs produce same outputs
- Stable physics simulations
- Essential for replays and networked games
- Predictable CPU usage for game logic

**Disadvantages**:
- Visual stutter if rendering and update rates don't align
- More complex to implement
- Requires interpolation for smooth visuals

---

## Interpolation and Extrapolation

Fixed timestep introduces a synchronization problem: the game state might be "between" frames when we render. This causes visual stuttering.

### The Problem Visualized

```
Update rate: 60 Hz (every 16.67ms)
Render rate: 144 Hz (every 6.94ms)

Time:    0ms    7ms    14ms   16.67ms  21ms   28ms
Updates: [U1]                 [U2]            [U3]
Renders: [R1]   [R2]   [R3]   [R4]     [R5]   [R6]

Renders R2 and R3 show the same state as R1!
This causes visible stuttering on high-refresh displays.
```

### Solution: Interpolation

Interpolation blends between the previous and current game states based on how far into the current timestep we are:

```cpp
// C++ - Fixed timestep with interpolation
struct GameState {
    Vector2 position;
    float rotation;
    // ... other interpolatable properties
};

GameState previousState;
GameState currentState;

void runGame() {
    auto previousTime = Clock::now();
    double accumulator = 0.0;

    while (gameIsRunning) {
        auto currentTime = Clock::now();
        double frameTime = (currentTime - previousTime).count();
        previousTime = currentTime;

        if (frameTime > 0.25) frameTime = 0.25;
        accumulator += frameTime;

        processInput();

        while (accumulator >= FIXED_TIMESTEP) {
            previousState = currentState;
            fixedUpdate(FIXED_TIMESTEP, currentState);
            accumulator -= FIXED_TIMESTEP;
        }

        // Calculate interpolation factor (0.0 to 1.0)
        double alpha = accumulator / FIXED_TIMESTEP;

        // Interpolate for rendering
        GameState renderState = interpolate(previousState, currentState, alpha);
        render(renderState);
    }
}

GameState interpolate(const GameState& prev, const GameState& curr, double alpha) {
    GameState result;
    result.position.x = prev.position.x + (curr.position.x - prev.position.x) * alpha;
    result.position.y = prev.position.y + (curr.position.y - prev.position.y) * alpha;
    result.rotation = lerpAngle(prev.rotation, curr.rotation, alpha);
    return result;
}
```

```csharp
// C# - Fixed timestep with interpolation
public struct GameState
{
    public Vector2 Position;
    public float Rotation;
}

public class InterpolatedGameLoop
{
    private const double FixedTimestep = 1.0 / 60.0;
    private GameState previousState;
    private GameState currentState;

    public void Run()
    {
        double previousTime = GetTime();
        double accumulator = 0.0;

        while (gameIsRunning)
        {
            double currentTime = GetTime();
            double frameTime = Math.Min(currentTime - previousTime, 0.25);
            previousTime = currentTime;

            accumulator += frameTime;

            ProcessInput();

            while (accumulator >= FixedTimestep)
            {
                previousState = currentState;
                FixedUpdate(FixedTimestep, ref currentState);
                accumulator -= FixedTimestep;
            }

            // Interpolation factor
            double alpha = accumulator / FixedTimestep;

            GameState renderState = Interpolate(previousState, currentState, alpha);
            Render(renderState);
        }
    }

    private GameState Interpolate(GameState prev, GameState curr, double alpha)
    {
        return new GameState
        {
            Position = Vector2.Lerp(prev.Position, curr.Position, (float)alpha),
            Rotation = LerpAngle(prev.Rotation, curr.Rotation, (float)alpha)
        };
    }

    private float LerpAngle(float a, float b, float t)
    {
        float diff = ((b - a) + 180) % 360 - 180;
        return a + diff * t;
    }
}
```

### What Can Be Interpolated?

| Property | Interpolation Method |
|----------|---------------------|
| Position | Linear interpolation (lerp) |
| Rotation | Spherical interpolation (slerp) or angle lerp |
| Scale | Linear interpolation |
| Color | Linear interpolation per channel |
| Camera | Smooth interpolation with damping |

### What Should NOT Be Interpolated?

- **Discrete state changes**: alive/dead, game phase changes
- **Animation frames**: handled by animation system
- **Particle effects**: typically run in render time
- **UI elements**: usually updated every frame

---

## Physics and Render Separation

Modern game engines separate the update loop into distinct phases for better organization and performance:

```
┌─────────────────────────────────────────────────────────────┐
│                    ADVANCED GAME LOOP                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FIXED UPDATE (60 Hz)                    │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │ Physics │─►│Collision│─►│  Game   │─►│   AI   │  │   │
│  │  │ Step    │  │Detection│  │  Logic  │  │ Update │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              VARIABLE UPDATE (Every Frame)           │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │  Input  │─►│Animation│─►│ Particle│─►│  Audio │  │   │
│  │  │ Process │  │ Update  │  │ Systems │  │ Update │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    RENDER PHASE                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │  Cull   │─►│  Sort   │─►│  Draw   │─►│  Post  │  │   │
│  │  │ Objects │  │  Render │  │  Calls  │  │Process │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Example

```cpp
// C++ - Separated update phases
class GameEngine {
private:
    static constexpr double PHYSICS_TIMESTEP = 1.0 / 60.0;  // 60 Hz physics
    double accumulator = 0.0;

public:
    void frame(double deltaTime) {
        // Input is processed every frame for responsiveness
        inputSystem.process();

        // Accumulate time for physics
        accumulator += deltaTime;

        // Fixed timestep for physics and game logic
        while (accumulator >= PHYSICS_TIMESTEP) {
            fixedUpdate(PHYSICS_TIMESTEP);
            accumulator -= PHYSICS_TIMESTEP;
        }

        // Variable update for visuals
        double alpha = accumulator / PHYSICS_TIMESTEP;
        variableUpdate(deltaTime, alpha);

        // Render
        render(alpha);
    }

private:
    void fixedUpdate(double dt) {
        // Order matters!
        physicsSystem.step(dt);
        collisionSystem.detect();
        collisionSystem.resolve();
        gameLogicSystem.update(dt);
        aiSystem.update(dt);
        networkSystem.tick(dt);  // For multiplayer
    }

    void variableUpdate(double dt, double alpha) {
        animationSystem.update(dt);
        particleSystem.update(dt);
        audioSystem.update(dt);
        cameraSystem.update(dt, alpha);
        uiSystem.update(dt);
    }

    void render(double alpha) {
        renderer.beginFrame();

        // Interpolate transforms for smooth rendering
        for (auto& entity : renderableEntities) {
            Transform interpolated = interpolate(
                entity.previousTransform,
                entity.currentTransform,
                alpha
            );
            renderer.submit(entity.mesh, interpolated);
        }

        renderer.endFrame();
    }
};
```

```csharp
// C# - Separated update phases (Unity-style)
public class GameManager : MonoBehaviour
{
    // Unity calls these automatically:
    // FixedUpdate() - Fixed timestep (default 50 Hz)
    // Update() - Every frame
    // LateUpdate() - After all Update() calls

    void FixedUpdate()
    {
        // Physics happens here automatically
        // Add deterministic game logic
        ProcessGameLogic();
        ProcessAI();
    }

    void Update()
    {
        // Input processing
        ProcessInput();

        // Frame-rate dependent updates
        UpdateAnimations();
        UpdateParticles();
        UpdateUI();
    }

    void LateUpdate()
    {
        // Camera follows player after all movement
        UpdateCamera();
    }
}
```

---

## Frame Rate Management

### VSync (Vertical Synchronization)

VSync synchronizes frame rendering with the monitor's refresh rate to prevent screen tearing.

```cpp
// C++ - Conceptual VSync implementation
class Display {
public:
    void presentFrame(bool vsyncEnabled) {
        if (vsyncEnabled) {
            // Wait for vertical blank interval
            waitForVBlank();
        }
        swapBuffers();
    }

private:
    void waitForVBlank() {
        // GPU driver handles this
        // Blocks until monitor is ready for new frame
    }
};
```

**VSync Trade-offs**:

| VSync On | VSync Off |
|----------|-----------|
| No screen tearing | Possible screen tearing |
| Potential input lag (up to 1 frame) | Minimal input lag |
| Consistent frame pacing | Variable frame pacing |
| Capped at monitor refresh rate | Unlimited FPS |

### Adaptive Sync Technologies

Modern monitors support adaptive sync (G-Sync, FreeSync) which varies the monitor's refresh rate to match the game's frame rate:

```cpp
// The game loop doesn't change much with adaptive sync
// The driver handles synchronization automatically
void runGame() {
    while (gameIsRunning) {
        processInput();
        update(deltaTime);
        render();

        // With adaptive sync, this presents immediately
        // and the monitor adapts to our frame rate
        display.present();
    }
}
```

### Frame Rate Limiting

Sometimes you want to cap frame rate below the monitor's refresh rate:

```cpp
// C++ - Frame rate limiter
#include <chrono>
#include <thread>

class FrameRateLimiter {
private:
    double targetFrameTime;
    std::chrono::high_resolution_clock::time_point frameStart;

public:
    explicit FrameRateLimiter(int targetFPS)
        : targetFrameTime(1.0 / targetFPS) {}

    void beginFrame() {
        frameStart = std::chrono::high_resolution_clock::now();
    }

    void endFrame() {
        auto frameEnd = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> elapsed = frameEnd - frameStart;

        double sleepTime = targetFrameTime - elapsed.count();
        if (sleepTime > 0) {
            // Sleep for most of the remaining time
            // Leave some margin for OS scheduling variance
            auto sleepDuration = std::chrono::duration<double>(sleepTime * 0.9);
            std::this_thread::sleep_for(
                std::chrono::duration_cast<std::chrono::microseconds>(sleepDuration)
            );

            // Busy-wait for precise timing
            while (true) {
                auto now = std::chrono::high_resolution_clock::now();
                std::chrono::duration<double> totalElapsed = now - frameStart;
                if (totalElapsed.count() >= targetFrameTime) break;
            }
        }
    }
};

// Usage
FrameRateLimiter limiter(60); // Target 60 FPS

while (gameIsRunning) {
    limiter.beginFrame();

    processInput();
    update(deltaTime);
    render();

    limiter.endFrame();
}
```

```csharp
// C# - Frame rate limiter
public class FrameRateLimiter
{
    private readonly double targetFrameTime;
    private readonly Stopwatch stopwatch = new Stopwatch();

    public FrameRateLimiter(int targetFPS)
    {
        targetFrameTime = 1.0 / targetFPS;
    }

    public void BeginFrame()
    {
        stopwatch.Restart();
    }

    public void EndFrame()
    {
        double elapsed = stopwatch.Elapsed.TotalSeconds;
        double sleepTime = targetFrameTime - elapsed;

        if (sleepTime > 0)
        {
            // Sleep for most of the time
            int sleepMs = (int)(sleepTime * 900); // 90% as milliseconds
            if (sleepMs > 0)
            {
                Thread.Sleep(sleepMs);
            }

            // Spin-wait for precision
            while (stopwatch.Elapsed.TotalSeconds < targetFrameTime)
            {
                Thread.SpinWait(10);
            }
        }
    }
}
```

### Why Limit Frame Rate?

1. **Power efficiency**: Laptops and mobile devices benefit greatly
2. **Temperature management**: Prevents unnecessary heat generation
3. **Consistent frame pacing**: Sometimes better than variable high FPS
4. **Fairness**: Competitive games may cap FPS for fairness

---

## Profiling and Performance

### Measuring Frame Time

```cpp
// C++ - Simple frame time profiler
#include <chrono>
#include <array>
#include <numeric>
#include <algorithm>
#include <iostream>

class FrameTimeProfiler {
private:
    static constexpr size_t SAMPLE_COUNT = 120;
    std::array<double, SAMPLE_COUNT> samples;
    size_t sampleIndex = 0;
    bool bufferFilled = false;

    std::chrono::high_resolution_clock::time_point lastFrameTime;

public:
    void beginFrame() {
        auto now = std::chrono::high_resolution_clock::now();
        if (lastFrameTime.time_since_epoch().count() > 0) {
            std::chrono::duration<double, std::milli> elapsed = now - lastFrameTime;
            samples[sampleIndex] = elapsed.count();
            sampleIndex = (sampleIndex + 1) % SAMPLE_COUNT;
            if (sampleIndex == 0) bufferFilled = true;
        }
        lastFrameTime = now;
    }

    double getAverageFrameTime() const {
        size_t count = bufferFilled ? SAMPLE_COUNT : sampleIndex;
        if (count == 0) return 0;
        return std::accumulate(samples.begin(), samples.begin() + count, 0.0) / count;
    }

    double getAverageFPS() const {
        double avg = getAverageFrameTime();
        return avg > 0 ? 1000.0 / avg : 0;
    }

    double get99thPercentile() const {
        size_t count = bufferFilled ? SAMPLE_COUNT : sampleIndex;
        if (count == 0) return 0;

        std::array<double, SAMPLE_COUNT> sorted;
        std::copy(samples.begin(), samples.begin() + count, sorted.begin());
        std::sort(sorted.begin(), sorted.begin() + count);

        size_t index = static_cast<size_t>(count * 0.99);
        return sorted[index];
    }

    void printStats() const {
        std::cout << "Average Frame Time: " << getAverageFrameTime() << " ms\n";
        std::cout << "Average FPS: " << getAverageFPS() << "\n";
        std::cout << "99th Percentile: " << get99thPercentile() << " ms\n";
    }
};
```

```csharp
// C# - Frame time profiler
public class FrameTimeProfiler
{
    private const int SampleCount = 120;
    private readonly double[] samples = new double[SampleCount];
    private int sampleIndex = 0;
    private bool bufferFilled = false;

    private readonly Stopwatch stopwatch = new Stopwatch();

    public void BeginFrame()
    {
        if (stopwatch.IsRunning)
        {
            samples[sampleIndex] = stopwatch.Elapsed.TotalMilliseconds;
            sampleIndex = (sampleIndex + 1) % SampleCount;
            if (sampleIndex == 0) bufferFilled = true;
        }
        stopwatch.Restart();
    }

    public double GetAverageFrameTime()
    {
        int count = bufferFilled ? SampleCount : sampleIndex;
        if (count == 0) return 0;
        return samples.Take(count).Average();
    }

    public double GetAverageFPS()
    {
        double avg = GetAverageFrameTime();
        return avg > 0 ? 1000.0 / avg : 0;
    }

    public double Get99thPercentile()
    {
        int count = bufferFilled ? SampleCount : sampleIndex;
        if (count == 0) return 0;

        var sorted = samples.Take(count).OrderBy(x => x).ToArray();
        int index = (int)(count * 0.99);
        return sorted[Math.Min(index, sorted.Length - 1)];
    }

    public void PrintStats()
    {
        Console.WriteLine($"Average Frame Time: {GetAverageFrameTime():F2} ms");
        Console.WriteLine($"Average FPS: {GetAverageFPS():F1}");
        Console.WriteLine($"99th Percentile: {Get99thPercentile():F2} ms");
    }
}
```

### What to Measure

| Metric | What It Tells You |
|--------|------------------|
| Average FPS | General performance |
| 1% Low FPS | Worst-case stutters |
| 99th Percentile Frame Time | Consistency of frame pacing |
| Frame Time Variance | Smoothness of gameplay |
| Update Time vs Render Time | Where the bottleneck is |

### Identifying Bottlenecks

```cpp
// C++ - Scoped timer for profiling sections
class ScopedTimer {
private:
    const char* name;
    std::chrono::high_resolution_clock::time_point start;
    double* output;

public:
    ScopedTimer(const char* name, double* output = nullptr)
        : name(name), output(output) {
        start = std::chrono::high_resolution_clock::now();
    }

    ~ScopedTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double, std::milli> elapsed = end - start;
        if (output) {
            *output = elapsed.count();
        } else {
            std::cout << name << ": " << elapsed.count() << " ms\n";
        }
    }
};

// Usage
void frame() {
    double inputTime, updateTime, renderTime;

    {
        ScopedTimer timer("Input", &inputTime);
        processInput();
    }

    {
        ScopedTimer timer("Update", &updateTime);
        update(deltaTime);
    }

    {
        ScopedTimer timer("Render", &renderTime);
        render();
    }

    // Log if frame is slow
    double totalTime = inputTime + updateTime + renderTime;
    if (totalTime > 16.67) {
        std::cout << "Slow frame! Total: " << totalTime << " ms\n";
        std::cout << "  Input: " << inputTime << " ms\n";
        std::cout << "  Update: " << updateTime << " ms\n";
        std::cout << "  Render: " << renderTime << " ms\n";
    }
}
```

---

## Common Patterns and Best Practices

### Pattern 1: Semi-Fixed Timestep

A practical compromise between fixed and variable timestep:

```cpp
// C++ - Semi-fixed timestep
const double FIXED_DT = 1.0 / 60.0;
const int MAX_STEPS = 5;

void frame(double deltaTime) {
    // Cap delta time
    deltaTime = std::min(deltaTime, FIXED_DT * MAX_STEPS);

    // Update in fixed steps
    while (deltaTime >= FIXED_DT) {
        fixedUpdate(FIXED_DT);
        deltaTime -= FIXED_DT;
    }

    // Handle remainder with variable step
    if (deltaTime > 0) {
        fixedUpdate(deltaTime);
    }

    render();
}
```

### Pattern 2: Decoupled Rendering

Run rendering in a separate thread (advanced):

```cpp
// C++ - Conceptual decoupled rendering
class DecoupledEngine {
private:
    std::atomic<bool> running{true};
    std::mutex stateMutex;
    GameState gameState;
    GameState renderState;

public:
    void updateThread() {
        auto lastTime = Clock::now();
        double accumulator = 0;

        while (running) {
            auto now = Clock::now();
            double delta = (now - lastTime).count();
            lastTime = now;

            accumulator += delta;

            while (accumulator >= FIXED_DT) {
                fixedUpdate(FIXED_DT);
                accumulator -= FIXED_DT;

                // Copy state for rendering
                {
                    std::lock_guard<std::mutex> lock(stateMutex);
                    renderState = gameState;
                }
            }
        }
    }

    void renderThread() {
        while (running) {
            GameState stateToRender;
            {
                std::lock_guard<std::mutex> lock(stateMutex);
                stateToRender = renderState;
            }

            render(stateToRender);
            display.present(true); // VSync
        }
    }
};
```

### Pattern 3: Time Scaling

Support for slow-motion and pause:

```cpp
// C++ - Time scaling
class TimeManager {
private:
    double timeScale = 1.0;
    bool paused = false;

public:
    void setTimeScale(double scale) { timeScale = scale; }
    void setPaused(bool p) { paused = p; }

    double getScaledDeltaTime(double rawDelta) const {
        if (paused) return 0.0;
        return rawDelta * timeScale;
    }
};

// Usage
TimeManager timeManager;

void frame(double rawDelta) {
    // Unscaled time for UI, menus, etc.
    uiSystem.update(rawDelta);

    // Scaled time for gameplay
    double scaledDelta = timeManager.getScaledDeltaTime(rawDelta);
    gameWorld.update(scaledDelta);
}
```

### Best Practices Summary

1. **Use fixed timestep for physics and game logic**
   - Deterministic behavior
   - Stable simulations
   - Essential for multiplayer

2. **Implement interpolation for smooth rendering**
   - Prevents visual stuttering
   - Decouples update rate from display rate

3. **Cap your delta time**
   - Prevents spiral of death
   - Typical cap: 250ms (4 FPS)

4. **Profile regularly**
   - Measure frame time distribution
   - Identify bottlenecks early

5. **Consider your target platform**
   - Mobile: Prioritize battery life, cap FPS
   - Console: Target stable frame rate (30/60)
   - PC: Support variable refresh rates

6. **Separate concerns**
   - Input: Every frame, minimal lag
   - Physics: Fixed timestep
   - Rendering: As fast as possible with interpolation

---

## Common Pitfalls

### Pitfall 1: Integer Overflow in Time

```cpp
// BAD: 32-bit milliseconds overflow after ~49 days
uint32_t startTime = getMilliseconds();
uint32_t currentTime = getMilliseconds();
uint32_t delta = currentTime - startTime; // Overflow!

// GOOD: Use 64-bit or floating point
double startTime = getTimeInSeconds();
double currentTime = getTimeInSeconds();
double delta = currentTime - startTime;
```

### Pitfall 2: Floating Point Accumulation

```cpp
// BAD: Accumulating small values loses precision
float totalTime = 0.0f;
for (int i = 0; i < 1000000; i++) {
    totalTime += 0.016f; // Precision loss over time
}

// GOOD: Use double precision for time
double totalTime = 0.0;
for (int i = 0; i < 1000000; i++) {
    totalTime += 0.016;
}

// OR track time since known point
double sessionStartTime = getCurrentTime();
double timeSinceStart = getCurrentTime() - sessionStartTime;
```

### Pitfall 3: Sleep Precision

```cpp
// BAD: sleep_for is not precise
std::this_thread::sleep_for(std::chrono::milliseconds(16)); // Could sleep 20ms+

// GOOD: Sleep less, then spin-wait
auto targetTime = std::chrono::high_resolution_clock::now() +
                  std::chrono::milliseconds(16);
std::this_thread::sleep_for(std::chrono::milliseconds(14)); // Sleep most of it
while (std::chrono::high_resolution_clock::now() < targetTime) {
    // Spin-wait for precision
}
```

### Pitfall 4: Frame Time Spikes at Startup

```cpp
// BAD: First frame has huge delta
double lastTime = 0; // Initialized to 0
double currentTime = getTime(); // Returns 12345.678
double delta = currentTime - lastTime; // 12345.678 seconds!

// GOOD: Initialize properly
double lastTime = getTime();
// ... wait until ready ...
while (gameRunning) {
    double currentTime = getTime();
    double delta = currentTime - lastTime;
    lastTime = currentTime;

    // Clamp for safety anyway
    delta = std::min(delta, 0.25);
}
```

---

## Engine-Specific Implementations

### Unity

Unity handles the game loop internally but exposes it through callbacks:

```csharp
public class UnityGameLoopExample : MonoBehaviour
{
    // Called once per physics step (default 50 Hz)
    // Time.fixedDeltaTime is constant
    void FixedUpdate()
    {
        // Physics and deterministic game logic here
        float dt = Time.fixedDeltaTime; // Always 0.02 by default
        rb.AddForce(Vector3.up * jumpForce);
    }

    // Called every frame
    // Time.deltaTime varies
    void Update()
    {
        // Input and frame-rate dependent logic
        float dt = Time.deltaTime; // Variable

        // Input
        if (Input.GetKeyDown(KeyCode.Space))
        {
            Jump();
        }

        // Smooth camera movement
        transform.position = Vector3.Lerp(
            transform.position,
            target.position,
            smoothSpeed * dt
        );
    }

    // Called after all Update() calls
    void LateUpdate()
    {
        // Camera follow, UI updates
        UpdateCamera();
    }
}
```

### Unreal Engine

Unreal uses a similar callback system with Tick functions:

```cpp
// Unreal Engine C++
void AMyActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    // DeltaTime is variable by default
    // For frame-rate independent movement:
    FVector Movement = Velocity * DeltaTime;
    SetActorLocation(GetActorLocation() + Movement);
}

// For physics, use the physics system which runs at fixed timestep
// Or implement custom fixed update:
void AMyGameMode::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    static float Accumulator = 0.0f;
    const float FixedDT = 1.0f / 60.0f;

    Accumulator += DeltaTime;
    while (Accumulator >= FixedDT)
    {
        FixedTick(FixedDT);
        Accumulator -= FixedDT;
    }
}
```

---

## Interview Focus Points

### Common Interview Questions

1. **What is a game loop and why is it necessary?**

   The game loop is a continuous cycle that processes input, updates game state, and renders frames. Unlike event-driven applications, games must constantly update to create real-time interactivity and animation.

2. **Explain the difference between fixed and variable timestep.**

   Variable timestep measures actual elapsed time between frames; fixed timestep updates logic at a constant rate regardless of frame rate. Fixed is better for physics/determinism; variable is simpler but less stable.

3. **What is delta time and why is it important?**

   Delta time is the elapsed time since the last frame. It is used to scale movement and animations to be frame-rate independent, ensuring the game runs at the same speed regardless of performance.

4. **How do you handle the "spiral of death"?**

   Cap the maximum delta time (typically 250ms). If the game cannot keep up with real time, allow it to slow down gracefully rather than accumulating infinite work.

5. **Why use interpolation with fixed timestep?**

   Fixed timestep may update slower than the display refreshes. Interpolation smoothly blends between states to prevent visual stuttering when rendering between physics updates.

6. **What are the trade-offs of VSync?**

   VSync prevents screen tearing but can introduce up to one frame of input latency and caps frame rate at the monitor's refresh rate. Adaptive sync technologies address these limitations.

7. **How would you implement slow-motion in a game?**

   Scale the delta time passed to game logic while keeping input and UI updates at real time. This preserves responsiveness while slowing gameplay.

### Key Concepts to Remember

- Fixed timestep is preferred for physics simulations and networked games
- Always cap delta time to prevent runaway simulations
- Interpolation enables smooth rendering at any refresh rate
- Profile frame time distribution, not just average FPS
- Separate concerns: input processing, physics, rendering
- Consider platform constraints (mobile battery, console frame rate targets)

---

## Further Reading

### Books

- "Game Programming Patterns" by Robert Nystrom (Chapter: Game Loop)
- "Real-Time Rendering" by Akenine-Moller, Haines, Hoffman
- "Game Engine Architecture" by Jason Gregory

### Articles

- [Fix Your Timestep!](https://gafferongames.com/post/fix_your_timestep/) - Glenn Fiedler
- [Game Loop - Game Programming Patterns](https://gameprogrammingpatterns.com/game-loop.html)
- [Gaffer On Games: Game Physics](https://gafferongames.com/categories/game-physics/)

### Related Topics

- Entity Component Systems (ECS)
- Multi-threaded game engines
- Deterministic lockstep for networking
- Frame pacing and input latency
- GPU synchronization and triple buffering

---

## Summary

The game loop is fundamental to game development, and understanding timestep management is crucial for creating smooth, consistent gameplay. Key takeaways:

1. **Use fixed timestep for deterministic behavior** - Essential for physics, multiplayer, and replays

2. **Implement interpolation for smooth visuals** - Decouples rendering from game logic updates

3. **Cap delta time** - Prevents simulation instability and the spiral of death

4. **Profile and measure** - Frame time variance matters as much as average FPS

5. **Separate concerns** - Input, physics, and rendering have different timing requirements

6. **Consider your platform** - Mobile, console, and PC have different constraints and expectations

A well-implemented game loop forms the foundation upon which all other game systems are built. Invest time in getting it right, and the rest of your game will benefit from stable, predictable behavior.
