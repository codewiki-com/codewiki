---
title: Godot Game Development Fundamentals
description: "Master Godot engine core concepts: scene tree, node system, GDScript, and signals"
track: gamedev
section: godot
difficulty: beginner
tags:
  - Godot
  - GDScript
  - game engine
  - open source
status: imported
origin: old/src/content/docs/gamedev/godot-fundamentals.en.md
divergence: 0.263
issues: []
legacy:
  category: GameDev
  subcategory: Godot
  order: 9
  lastUpdated: 2026-01-07
---

## What is Godot?

Godot is a free and open-source game engine that provides a comprehensive suite of tools for developing 2D and 3D games across various platforms. Originally created by Juan Linietsky and Ariel Manzur, Godot has grown into one of the most popular open-source game engines, offering a unique approach to game development through its node-based architecture and scene system.

### Why Choose Godot?

Godot stands out in the game development landscape for several compelling reasons:

- **Completely Free and Open Source**: No royalties, no hidden fees, MIT licensed
- **Lightweight**: The editor is under 100MB and runs on modest hardware
- **All-in-One Solution**: Built-in code editor, animation tools, physics engines, and more
- **Cross-Platform**: Develop on Windows, macOS, Linux; export to desktop, mobile, web, and consoles
- **Dedicated 2D Engine**: True 2D rendering (not projected 3D), optimized for 2D game development
- **Flexible Scripting**: GDScript, C#, C++, and visual scripting options

### Godot vs Other Engines

```
Feature              | Godot          | Unity          | Unreal
---------------------|----------------|----------------|----------------
License              | MIT (Free)     | Proprietary    | Proprietary
2D Support           | Native 2D      | Projected 3D   | Projected 3D
Scripting            | GDScript/C#    | C#             | C++/Blueprints
Editor Size          | ~100MB         | ~10GB          | ~40GB
Learning Curve       | Gentle         | Moderate       | Steep
```

## The Godot Editor

The Godot editor is where you spend most of your development time. Understanding its layout and features is essential for productive game development.

### Main Interface Components

The editor is divided into several key areas:

1. **Viewport**: The central area where you visually edit your scenes
2. **Scene Panel**: Displays the node hierarchy of your current scene
3. **FileSystem Panel**: Shows your project files and folders
4. **Inspector Panel**: Displays and edits properties of selected nodes
5. **Output Panel**: Shows debug output, errors, and warnings
6. **Debugger Panel**: For debugging scripts and profiling performance

### Editor Workflow Tips

```
Keyboard Shortcuts (Default):
- Ctrl+S         : Save scene
- Ctrl+Shift+S   : Save all scenes
- F5             : Run project
- F6             : Run current scene
- Ctrl+A         : Add new node
- Ctrl+D         : Duplicate node
- Ctrl+Z/Y       : Undo/Redo
- Q, W, E, R     : Select, Move, Rotate, Scale tools
```

## Scenes and Nodes: The Core Architecture

Godot's architecture is built around two fundamental concepts: **nodes** and **scenes**. Understanding these is crucial to mastering Godot development.

### Understanding Nodes

A node is the smallest building block in Godot. Every element in your game is a node: characters, sprites, sounds, cameras, UI elements, and more. Each node type has specific functionality:

```
Common Node Types:

Node          - Base class, logic only
Node2D        - Base for 2D game objects
Node3D        - Base for 3D game objects
Sprite2D      - Displays 2D textures
Camera2D      - 2D camera and viewport control
CharacterBody2D - Physics-based character movement
RigidBody2D   - Physics simulation body
Area2D        - Detection and trigger zones
CollisionShape2D - Defines collision boundaries
AudioStreamPlayer - Plays audio
Timer         - Countdown functionality
Control       - Base for UI elements
Label         - Text display
Button        - Clickable button
```

### Node Hierarchy

Nodes are organized in a tree structure where each node can have children. This hierarchy determines:

- **Transform inheritance**: Children inherit parent transforms (position, rotation, scale)
- **Processing order**: Parent nodes process before children
- **Visibility**: Hiding a parent hides all children

```gdscript
# Accessing nodes in the hierarchy
extends Node2D

func _ready():
    # Get parent node
    var parent = get_parent()

    # Get child by name
    var child = get_node("ChildName")
    # Shorthand syntax
    var child_short = $ChildName

    # Get child by path
    var nested = get_node("Child/GrandChild")
    var nested_short = $Child/GrandChild

    # Get all children
    for child in get_children():
        print(child.name)
```

### Understanding Scenes

A scene is a collection of nodes organized in a tree, saved as a reusable file (.tscn). Scenes are the fundamental unit of organization in Godot:

```gdscript
# A typical Player scene structure:
#
# Player (CharacterBody2D)       <- Root node
#   |-- Sprite2D                  <- Visual representation
#   |-- CollisionShape2D          <- Physics collision
#   |-- AnimationPlayer           <- Handles animations
#   |-- Camera2D                  <- Follows the player
#   |-- Hitbox (Area2D)           <- Damage detection
#         |-- CollisionShape2D
```

### Scene Composition

Scenes can contain instances of other scenes, enabling modular design:

```gdscript
extends Node2D

# Preload scene at compile time (faster)
const BulletScene = preload("res://scenes/bullet.tscn")

# Or load dynamically at runtime
var enemy_scene = load("res://scenes/enemy.tscn")

func spawn_bullet():
    # Create instance of the scene
    var bullet = BulletScene.instantiate()

    # Configure the instance
    bullet.position = $Muzzle.global_position
    bullet.rotation = rotation
    bullet.speed = 500

    # Add to the scene tree
    get_parent().add_child(bullet)

func spawn_enemy(spawn_point: Vector2):
    var enemy = enemy_scene.instantiate()
    enemy.position = spawn_point
    add_child(enemy)
```

## The Scene Tree

The SceneTree manages the hierarchy of nodes in a scene and the loading/unloading of scenes. It also provides functionality for organizing nodes into groups and is the default implementation for the game loop.

### Accessing the Scene Tree

```gdscript
extends Node

func _ready():
    # Access the scene tree
    var tree = get_tree()

    # Get the root viewport
    var root = tree.root

    # Get the current scene
    var current = tree.current_scene

    # Pause the game
    tree.paused = true

    # Quit the application
    # tree.quit()
```

### Scene Management

```gdscript
extends Node

# Change to a new scene by file path
func go_to_level(level_path: String):
    get_tree().change_scene_to_file(level_path)

# Change scene using preloaded PackedScene
var next_scene = preload("res://levels/level2.tscn")

func complete_level():
    get_tree().change_scene_to_packed(next_scene)

# Reload the current scene
func restart_level():
    get_tree().reload_current_scene()

# Wait for scene change to complete
func async_scene_change():
    get_tree().change_scene_to_file("res://levels/level2.tscn")
    await get_tree().scene_changed
    print("New scene loaded: ", get_tree().current_scene)
```

### Node Groups

Groups allow you to organize and batch-process nodes:

```gdscript
extends Node

func _ready():
    # Add this node to groups
    add_to_group("enemies")
    add_to_group("damageable")

func damage_all_enemies():
    # Get all nodes in a group
    var enemies = get_tree().get_nodes_in_group("enemies")
    for enemy in enemies:
        enemy.take_damage(10)

func notify_all_enemies():
    # Call method on all nodes in group
    get_tree().call_group("enemies", "alert_player_spotted")

func pause_all_enemies():
    # Set property on all nodes in group
    get_tree().set_group("enemies", "process_mode", Node.PROCESS_MODE_DISABLED)
```

## GDScript Fundamentals

GDScript is Godot's primary scripting language, designed specifically for game development. It features Python-like syntax with static typing support.

### Basic Syntax

```gdscript
extends Node2D

# Constants
const MAX_SPEED = 200.0
const PLAYER_COLORS = ["red", "blue", "green"]

# Exported variables (editable in Inspector)
@export var health: int = 100
@export var speed: float = 150.0
@export var player_name: String = "Player"
@export_range(0, 100) var volume: int = 50

# Private variables (convention: prefix with underscore)
var _velocity: Vector2 = Vector2.ZERO
var _is_alive: bool = true

# Onready variables (initialized when node enters tree)
@onready var sprite: Sprite2D = $Sprite2D
@onready var animation_player: AnimationPlayer = $AnimationPlayer
```

### Data Types

```gdscript
extends Node

func demonstrate_types():
    # Basic types
    var integer: int = 42
    var floating: float = 3.14
    var text: String = "Hello, Godot!"
    var flag: bool = true

    # Vector types (commonly used in games)
    var pos2d: Vector2 = Vector2(100, 200)
    var pos3d: Vector3 = Vector3(1, 2, 3)
    var direction: Vector2 = Vector2.UP  # (0, -1)

    # Collections
    var my_array: Array = [1, 2, 3, "mixed types allowed"]
    var typed_array: Array[int] = [1, 2, 3]
    var dictionary: Dictionary = {
        "name": "Player",
        "score": 100,
        "position": Vector2(0, 0)
    }

    # Color
    var red: Color = Color.RED
    var custom_color: Color = Color(0.5, 0.8, 1.0, 1.0)  # RGBA
    var hex_color: Color = Color("#ff5733")
```

### Functions

```gdscript
extends Node

# Basic function
func greet():
    print("Hello!")

# Function with parameters and return type
func add_numbers(a: int, b: int) -> int:
    return a + b

# Function with default parameters
func spawn_enemy(position: Vector2, health: int = 100, is_boss: bool = false):
    var enemy = Enemy.new()
    enemy.position = position
    enemy.health = health
    enemy.is_boss = is_boss
    return enemy

# Static function (can be called without instance)
static func calculate_damage(base: int, multiplier: float) -> int:
    return int(base * multiplier)

# Lambda functions
var my_lambda = func(x): return x * 2
var result = my_lambda.call(5)  # Returns 10
```

### Control Flow

```gdscript
extends Node

func demonstrate_control_flow():
    var score = 85

    # If statements
    if score >= 90:
        print("Grade: A")
    elif score >= 80:
        print("Grade: B")
    elif score >= 70:
        print("Grade: C")
    else:
        print("Grade: F")

    # Match statement (like switch)
    var state = "idle"
    match state:
        "idle":
            print("Standing still")
        "walking", "running":
            print("Moving")
        "jumping":
            print("In the air")
        _:
            print("Unknown state")

    # Loops
    for i in range(5):
        print(i)  # 0, 1, 2, 3, 4

    for item in ["sword", "shield", "potion"]:
        print(item)

    var count = 0
    while count < 3:
        print(count)
        count += 1
```

### Built-in Virtual Functions

```gdscript
extends CharacterBody2D

# Called when node enters the scene tree
func _ready():
    print("Node is ready!")

# Called every frame (for game logic)
func _process(delta: float):
    # delta is time since last frame in seconds
    rotation += 1.0 * delta  # Rotate 1 radian per second

# Called every physics frame (for physics)
func _physics_process(delta: float):
    velocity = Vector2(100, 0)
    move_and_slide()

# Called for input events
func _input(event: InputEvent):
    if event.is_action_pressed("jump"):
        jump()

# Called for unhandled input
func _unhandled_input(event: InputEvent):
    if event is InputEventKey:
        if event.keycode == KEY_ESCAPE:
            get_tree().quit()

# Called when node exits the scene tree
func _exit_tree():
    print("Goodbye!")
```

## The Signal System

Signals are Godot's version of the observer pattern, allowing nodes to communicate without tight coupling. They are fundamental to Godot's event-driven architecture.

### Defining Custom Signals

```gdscript
extends Node

# Signal with no parameters
signal game_started

# Signal with parameters
signal health_changed(new_health: int, max_health: int)
signal player_died(player_name: String)
signal item_collected(item_name: String, value: int)

# Emitting signals
func start_game():
    emit_signal("game_started")
    # Or use the shorthand:
    game_started.emit()

func take_damage(amount: int):
    health -= amount
    health_changed.emit(health, max_health)

    if health <= 0:
        player_died.emit(player_name)
```

### Connecting Signals

```gdscript
extends Node

@onready var player = $Player
@onready var health_bar = $UI/HealthBar
@onready var game_over_screen = $UI/GameOverScreen

func _ready():
    # Connect using the connect() method
    player.health_changed.connect(_on_player_health_changed)
    player.player_died.connect(_on_player_died)

    # Connect with additional arguments (bind)
    var button = $Button
    button.pressed.connect(_on_button_pressed.bind("extra_data"))

    # One-shot connection (automatically disconnects after first call)
    player.game_started.connect(_on_game_first_started, CONNECT_ONE_SHOT)

func _on_player_health_changed(new_health: int, max_health: int):
    health_bar.value = float(new_health) / max_health * 100

func _on_player_died(player_name: String):
    game_over_screen.show()
    print(player_name + " has died!")

func _on_button_pressed(extra: String):
    print("Button pressed with: " + extra)

func _on_game_first_started():
    print("Game started for the first time!")
```

### Built-in Signals

```gdscript
extends Control

func _ready():
    # Button signals
    $Button.pressed.connect(_on_button_pressed)
    $Button.button_down.connect(_on_button_down)
    $Button.button_up.connect(_on_button_up)

    # Timer signals
    $Timer.timeout.connect(_on_timer_timeout)

    # Area2D signals
    $Area2D.body_entered.connect(_on_body_entered)
    $Area2D.area_entered.connect(_on_area_entered)

    # AnimationPlayer signals
    $AnimationPlayer.animation_finished.connect(_on_animation_finished)

    # Visibility signals
    visibility_changed.connect(_on_visibility_changed)

func _on_button_pressed():
    print("Button clicked!")

func _on_timer_timeout():
    print("Timer finished!")

func _on_body_entered(body: Node2D):
    if body.is_in_group("player"):
        print("Player entered the area!")

func _on_animation_finished(anim_name: StringName):
    if anim_name == "attack":
        print("Attack animation completed")
```

### Signal Best Practices

```gdscript
extends Node

# Use signals for loose coupling
signal quest_completed(quest_id: String)
signal achievement_unlocked(achievement: Dictionary)

# Avoid this - tight coupling:
# var ui_manager = get_node("/root/UIManager")
# ui_manager.show_quest_complete()

# Instead, emit a signal and let interested nodes connect:
func complete_quest(quest_id: String):
    # Do quest completion logic
    quest_completed.emit(quest_id)

# Disconnect signals when no longer needed
func _exit_tree():
    if player.health_changed.is_connected(_on_health_changed):
        player.health_changed.disconnect(_on_health_changed)
```

## Resource Management

Resources in Godot are data containers that can be saved to and loaded from disk. They include textures, sounds, scripts, scenes, and custom data.

### Loading Resources

```gdscript
extends Node

# Preload - loads at parse time (compile time)
# Use when resource is always needed
const PlayerTexture = preload("res://assets/player.png")
const BulletScene = preload("res://scenes/bullet.tscn")

# Load - loads at runtime
# Use for optional or dynamic resources
func load_level(level_number: int):
    var level_path = "res://levels/level_%d.tscn" % level_number
    var level_scene = load(level_path)
    return level_scene.instantiate()

# ResourceLoader for advanced loading
func load_with_progress():
    var path = "res://large_resource.tres"
    ResourceLoader.load_threaded_request(path)

    while true:
        var progress = []
        var status = ResourceLoader.load_threaded_get_status(path, progress)

        if status == ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            print("Loading: %d%%" % (progress[0] * 100))
            await get_tree().process_frame
        elif status == ResourceLoader.THREAD_LOAD_LOADED:
            var resource = ResourceLoader.load_threaded_get(path)
            print("Loaded!")
            return resource
        else:
            print("Error loading resource")
            return null
```

### Custom Resources

```gdscript
# Define a custom resource (save as weapon_data.gd)
extends Resource
class_name WeaponData

@export var name: String = "Sword"
@export var damage: int = 10
@export var attack_speed: float = 1.0
@export var icon: Texture2D
@export var projectile_scene: PackedScene

func get_dps() -> float:
    return damage * attack_speed
```

```gdscript
# Using custom resources
extends CharacterBody2D

@export var weapon: WeaponData

func attack():
    var damage = weapon.damage
    print("Attacking with %s for %d damage!" % [weapon.name, damage])

    if weapon.projectile_scene:
        var projectile = weapon.projectile_scene.instantiate()
        add_child(projectile)
```

### Saving and Loading Game Data

```gdscript
extends Node

const SAVE_PATH = "user://savegame.tres"

# Using Resources for save data
class_name SaveData extends Resource

@export var player_position: Vector2
@export var player_health: int
@export var inventory: Array[String]
@export var completed_levels: Array[int]

# Save game
func save_game():
    var save_data = SaveData.new()
    save_data.player_position = $Player.position
    save_data.player_health = $Player.health
    save_data.inventory = $Player.inventory.duplicate()
    save_data.completed_levels = GameState.completed_levels.duplicate()

    var error = ResourceSaver.save(save_data, SAVE_PATH)
    if error != OK:
        print("Error saving game: ", error)
    else:
        print("Game saved successfully!")

# Load game
func load_game():
    if not FileAccess.file_exists(SAVE_PATH):
        print("No save file found")
        return false

    var save_data = ResourceLoader.load(SAVE_PATH) as SaveData
    if save_data:
        $Player.position = save_data.player_position
        $Player.health = save_data.player_health
        $Player.inventory = save_data.inventory.duplicate()
        GameState.completed_levels = save_data.completed_levels.duplicate()
        return true
    return false
```

## 2D Game Development

Godot has a dedicated 2D engine with pixel-perfect rendering, making it excellent for 2D game development.

### Basic 2D Movement

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

func _physics_process(delta: float):
    # Get input direction
    var input_dir = Input.get_vector("move_left", "move_right", "move_up", "move_down")

    # Apply movement
    if input_dir != Vector2.ZERO:
        # Accelerate towards target velocity
        velocity = velocity.move_toward(input_dir * speed, acceleration * delta)
    else:
        # Apply friction when no input
        velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

    move_and_slide()
```

### Platformer Character

```gdscript
extends CharacterBody2D

@export var speed: float = 300.0
@export var jump_velocity: float = -400.0
@export var gravity_multiplier: float = 1.0

# Get the gravity from project settings
var gravity = ProjectSettings.get_setting("physics/2d/default_gravity")

@onready var animated_sprite = $AnimatedSprite2D
@onready var coyote_timer = $CoyoteTimer
@onready var jump_buffer_timer = $JumpBufferTimer

var was_on_floor: bool = false
var can_coyote_jump: bool = false

func _physics_process(delta: float):
    # Handle gravity
    if not is_on_floor():
        velocity.y += gravity * gravity_multiplier * delta

    # Coyote time (allows jumping shortly after leaving platform)
    if was_on_floor and not is_on_floor() and velocity.y >= 0:
        can_coyote_jump = true
        coyote_timer.start()

    was_on_floor = is_on_floor()

    # Jump buffering (remembers jump input briefly)
    if Input.is_action_just_pressed("jump"):
        jump_buffer_timer.start()

    # Handle jump
    if not jump_buffer_timer.is_stopped():
        if is_on_floor() or can_coyote_jump:
            velocity.y = jump_velocity
            jump_buffer_timer.stop()
            can_coyote_jump = false

    # Variable jump height (release to fall faster)
    if Input.is_action_just_released("jump") and velocity.y < 0:
        velocity.y *= 0.5

    # Horizontal movement
    var direction = Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * speed
        animated_sprite.flip_h = direction < 0
    else:
        velocity.x = move_toward(velocity.x, 0, speed)

    # Update animation
    update_animation()

    move_and_slide()

func update_animation():
    if not is_on_floor():
        if velocity.y < 0:
            animated_sprite.play("jump")
        else:
            animated_sprite.play("fall")
    elif abs(velocity.x) > 10:
        animated_sprite.play("run")
    else:
        animated_sprite.play("idle")

func _on_coyote_timer_timeout():
    can_coyote_jump = false
```

### Collision Detection

```gdscript
extends CharacterBody2D

func _physics_process(delta: float):
    velocity.x = 100
    move_and_slide()

    # Check collisions after move_and_slide
    for i in get_slide_collision_count():
        var collision = get_slide_collision(i)
        var collider = collision.get_collider()

        print("Collided with: ", collider.name)
        print("Collision point: ", collision.get_position())
        print("Collision normal: ", collision.get_normal())

        # React based on what we hit
        if collider.is_in_group("enemies"):
            take_damage(10)
        elif collider.is_in_group("bouncy"):
            velocity = velocity.bounce(collision.get_normal())
```

### Area2D for Triggers

```gdscript
extends Area2D

signal player_entered_zone
signal player_exited_zone

@export var damage_per_second: float = 10.0

var bodies_in_area: Array[Node2D] = []

func _ready():
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _process(delta: float):
    for body in bodies_in_area:
        if body.has_method("take_damage"):
            body.take_damage(damage_per_second * delta)

func _on_body_entered(body: Node2D):
    if body.is_in_group("player"):
        bodies_in_area.append(body)
        player_entered_zone.emit()

func _on_body_exited(body: Node2D):
    if body in bodies_in_area:
        bodies_in_area.erase(body)
        if body.is_in_group("player"):
            player_exited_zone.emit()
```

## 3D Game Development

Godot 4 features a completely rewritten 3D renderer with modern features like global illumination, volumetric fog, and advanced materials.

### Basic 3D Character Controller

```gdscript
extends CharacterBody3D

@export var speed: float = 5.0
@export var jump_velocity: float = 4.5
@export var mouse_sensitivity: float = 0.002

var gravity = ProjectSettings.get_setting("physics/3d/default_gravity")

@onready var camera_pivot = $CameraPivot
@onready var camera = $CameraPivot/Camera3D

func _ready():
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent):
    if event is InputEventMouseMotion:
        # Rotate player horizontally
        rotate_y(-event.relative.x * mouse_sensitivity)
        # Rotate camera vertically (clamped to prevent flipping)
        camera_pivot.rotate_x(-event.relative.y * mouse_sensitivity)
        camera_pivot.rotation.x = clamp(
            camera_pivot.rotation.x,
            deg_to_rad(-90),
            deg_to_rad(90)
        )

    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float):
    # Apply gravity
    if not is_on_floor():
        velocity.y -= gravity * delta

    # Handle jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = jump_velocity

    # Get input direction relative to camera
    var input_dir = Input.get_vector("move_left", "move_right", "move_forward", "move_back")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = move_toward(velocity.x, 0, speed)
        velocity.z = move_toward(velocity.z, 0, speed)

    move_and_slide()
```

### 3D Scene Setup

```
Typical 3D Scene Structure:

World (Node3D)
|-- DirectionalLight3D      (Sun/main light)
|-- WorldEnvironment        (Sky, ambient light, fog)
|-- Player (CharacterBody3D)
|   |-- CollisionShape3D
|   |-- MeshInstance3D      (Player model)
|   |-- CameraPivot (Node3D)
|       |-- Camera3D
|-- Level (Node3D)
|   |-- StaticBody3D        (Ground, walls)
|       |-- MeshInstance3D
|       |-- CollisionShape3D
|-- Enemies (Node3D)
|   |-- Enemy1
|   |-- Enemy2
```

### Raycasting in 3D

```gdscript
extends Camera3D

func _input(event: InputEvent):
    if event.is_action_pressed("shoot"):
        shoot_raycast()

func shoot_raycast():
    var space_state = get_world_3d().direct_space_state

    # Cast ray from camera center
    var screen_center = get_viewport().get_visible_rect().size / 2
    var from = project_ray_origin(screen_center)
    var to = from + project_ray_normal(screen_center) * 1000

    var query = PhysicsRayQueryParameters3D.create(from, to)
    query.exclude = [self]  # Don't hit self
    query.collision_mask = 1  # Only hit certain layers

    var result = space_state.intersect_ray(query)

    if result:
        print("Hit: ", result.collider.name)
        print("Position: ", result.position)
        print("Normal: ", result.normal)

        if result.collider.has_method("take_damage"):
            result.collider.take_damage(50)
```

## Exporting Projects

Godot supports exporting to multiple platforms from a single project.

### Supported Platforms

- **Desktop**: Windows, macOS, Linux
- **Mobile**: Android, iOS
- **Web**: HTML5 (WebAssembly)
- **Console**: Nintendo Switch, PlayStation, Xbox (requires special licenses)

### Export Process

1. **Install Export Templates**: Editor -> Manage Export Templates -> Download and Install
2. **Configure Export Preset**: Project -> Export -> Add preset for target platform
3. **Configure Settings**: Set icons, app name, version, features
4. **Export**: Click "Export Project" or "Export PCK/ZIP"

### Platform-Specific Considerations

```gdscript
extends Node

func _ready():
    configure_for_platform()

func configure_for_platform():
    # Check what platform we're running on
    if OS.has_feature("mobile"):
        # Mobile-specific settings
        setup_touch_controls()
        Engine.max_fps = 60
    elif OS.has_feature("web"):
        # Web-specific settings
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
    elif OS.has_feature("pc"):
        # Desktop-specific settings
        DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)

func setup_touch_controls():
    $TouchControls.visible = true
    $KeyboardHints.visible = false
```

### Web Export Optimization

```
Web Export Tips:

1. Reduce file size:
   - Compress textures (use WebP or compressed formats)
   - Optimize audio (use OGG Vorbis)
   - Remove unused assets

2. Loading improvements:
   - Enable "Threads" for multi-threaded loading
   - Use loading screens for large assets

3. Mobile web considerations:
   - Test touch input thoroughly
   - Consider virtual keyboard issues
   - Monitor performance on lower-end devices

4. PWA support:
   - Enable Progressive Web App option
   - Configure icons and manifest
   - Set up offline page
```

## Best Practices

### Project Organization

```
Recommended Project Structure:

res://
|-- assets/
|   |-- sprites/
|   |-- audio/
|   |-- fonts/
|   |-- models/
|-- scenes/
|   |-- characters/
|   |-- levels/
|   |-- ui/
|   |-- objects/
|-- scripts/
|   |-- autoload/
|   |-- resources/
|   |-- components/
|-- addons/
|-- export/
```

### Autoload (Singletons)

```gdscript
# GameManager.gd - An autoload singleton
extends Node

signal game_paused
signal game_resumed
signal score_changed(new_score: int)

var score: int = 0:
    set(value):
        score = value
        score_changed.emit(score)

var is_paused: bool = false

func pause_game():
    is_paused = true
    get_tree().paused = true
    game_paused.emit()

func resume_game():
    is_paused = false
    get_tree().paused = false
    game_resumed.emit()

func reset_game():
    score = 0
    # Reset other game state
```

### Performance Tips

```gdscript
extends Node

# Use object pooling for frequently spawned objects
var bullet_pool: Array[Node] = []
const POOL_SIZE = 50

func _ready():
    for i in POOL_SIZE:
        var bullet = BulletScene.instantiate()
        bullet.set_process(false)
        bullet.visible = false
        bullet_pool.append(bullet)
        add_child(bullet)

func get_bullet() -> Node:
    for bullet in bullet_pool:
        if not bullet.visible:
            bullet.visible = true
            bullet.set_process(true)
            return bullet
    # Pool exhausted, create new bullet
    var bullet = BulletScene.instantiate()
    bullet_pool.append(bullet)
    add_child(bullet)
    return bullet

func return_bullet(bullet: Node):
    bullet.visible = false
    bullet.set_process(false)

# Avoid calling get_node in _process
# Bad:
func _process_bad(delta):
    get_node("Player").position.x += 1  # Called every frame!

# Good:
@onready var player = $Player
func _process_good(delta):
    player.position.x += 1

# Use call_deferred for operations that might cause issues during physics
func remove_enemy(enemy: Node):
    enemy.queue_free()  # Safe, removes at end of frame
    # NOT: enemy.free()  # Dangerous, immediate removal
```

## Interview Topics

### Core Concepts

**1. Explain the difference between scenes and nodes in Godot.**

Nodes are the smallest building blocks - individual components with specific functionality (Sprite2D, Camera2D, etc.). Scenes are collections of nodes organized in a tree structure and saved as reusable files. Scenes can be instanced multiple times and can contain instances of other scenes.

**2. What are signals and why are they important?**

Signals are Godot's implementation of the observer pattern. They allow nodes to emit events that other nodes can listen to, enabling loose coupling between game components. This makes code more modular, testable, and maintainable.

**3. Explain the difference between _process() and _physics_process().**

`_process(delta)` is called every frame and is used for game logic, animations, and visual updates. The delta value varies based on frame rate. `_physics_process(delta)` is called at a fixed rate (default 60 times per second) and is used for physics calculations to ensure consistent behavior regardless of frame rate.

### Practical Knowledge

**4. How do you handle input in Godot?**

```gdscript
# Multiple approaches:

# Input polling (in _process or _physics_process)
if Input.is_action_pressed("move_right"):
    velocity.x = speed

# Input events (for one-time actions)
func _input(event):
    if event.is_action_pressed("jump"):
        jump()

# Unhandled input (UI-aware)
func _unhandled_input(event):
    if event.is_action_pressed("pause"):
        toggle_pause()
```

**5. What is the scene tree and how is it useful?**

The SceneTree manages the hierarchy of all nodes in the game. It handles the game loop, scene switching, pausing, groups, and provides access to important functionality like timers and tweens. Every node can access the scene tree through `get_tree()`.

## Further Learning

### Official Resources

- [Godot Documentation](https://docs.godotengine.org/)
- [Godot GitHub Repository](https://github.com/godotengine/godot)
- [Godot Asset Library](https://godotengine.org/asset-library/asset)

### Community Resources

- [GDQuest](https://www.gdquest.com/) - High-quality tutorials and courses
- [KidsCanCode](https://kidscancode.org/godot_recipes/) - Godot recipes and tutorials
- [Godot Forums](https://forum.godotengine.org/) - Community discussions
- [Godot Discord](https://discord.gg/4JBkykG) - Real-time community support

### Practice Projects

1. **Pong Clone**: Learn basic 2D movement, collision, and scoring
2. **Platformer**: Master physics, animations, and level design
3. **Top-Down Shooter**: Practice spawning, pooling, and state machines
4. **Puzzle Game**: Explore UI, save/load, and game logic
5. **3D FPS**: Learn 3D movement, raycasting, and shaders

---

> Godot's node-based architecture and scene composition system provide a unique and intuitive approach to game development. The combination of GDScript's simplicity and the engine's powerful features makes it an excellent choice for both beginners and experienced developers. Start with small projects, gradually explore more features, and leverage the active community for support and inspiration.
