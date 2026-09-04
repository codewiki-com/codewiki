---
title: Godot Signals Mechanism Deep Dive
description: "Master Godot's signal system: custom signals, connections, best practices, and the observer pattern in game development"
track: gamedev
section: godot
difficulty: intermediate
tags:
  - godot
  - signals
  - observer pattern
  - game development
  - GDScript
status: imported
origin: old/src/content/docs/gamedev/godot-signals.en.md
divergence: 0.211
issues: []
legacy:
  category: GameDev
  subcategory: Godot
  order: 50
  lastUpdated: 2026-01-21
---

Signals are at the heart of Godot's architecture, enabling loose coupling between nodes and making your code more modular, maintainable, and scalable. This comprehensive guide will take you from signal basics to advanced patterns used in professional game development.

## Concept Overview

### What Are Signals?

Signals in Godot are an implementation of the Observer pattern, allowing objects to emit notifications when something interesting happens without needing to know who (if anyone) is listening. Think of signals like radio broadcasts - the broadcaster sends out a message, and anyone tuned to that frequency receives it.

```
+------------------+        Signal Emission         +------------------+
|                  |  --------------------------->  |                  |
|   Button Node    |   "pressed" signal emitted     |   Player Node    |
|   (Emitter)      |                                |   (Receiver)     |
|                  |  <---------------------------  |                  |
+------------------+     Connection established     +------------------+

The Button doesn't know about Player.
The Player simply responds to the signal.
```

### Why Use Signals?

Signals solve several critical problems in game development:

1. **Decoupling**: Nodes don't need direct references to each other
2. **Modularity**: Components can be developed and tested independently
3. **Flexibility**: Easy to add or remove listeners without modifying emitters
4. **Maintainability**: Changes to one node don't cascade through the codebase
5. **Reusability**: Nodes become more generic and reusable across projects

### The Observer Pattern in Godot

```
+=====================================================================+
|                    OBSERVER PATTERN IN GODOT                         |
+=====================================================================+
|                                                                      |
|   Subject (Emitter)                    Observers (Receivers)         |
|   +------------------+                 +------------------+          |
|   |   HealthSystem   |----signal----->|   HealthBar UI   |          |
|   |                  |----signal----->|   SoundManager   |          |
|   |  signal damaged  |----signal----->|   ScreenShake    |          |
|   |  signal healed   |----signal----->|   Achievement    |          |
|   +------------------+                 +------------------+          |
|                                                                      |
|   The HealthSystem emits signals without knowing its observers.      |
|   Observers can be added or removed dynamically.                     |
|                                                                      |
+=====================================================================+
```

## Core Principles

### Signal Architecture

Godot's signal system is built into the core `Object` class, meaning every Godot object can emit and receive signals. The system consists of:

1. **Signal Declaration**: Defining what signals an object can emit
2. **Signal Emission**: Broadcasting the signal with optional parameters
3. **Signal Connection**: Linking signals to callback functions
4. **Signal Handling**: Processing the received signal

### Built-in Signals

Godot nodes come with many built-in signals:

```gdscript
# Common built-in signals

# Node lifecycle
signal ready
signal tree_entered
signal tree_exited

# Input events
signal gui_input(event)
signal mouse_entered
signal mouse_exited

# Animation
signal animation_finished(anim_name)
signal frame_changed

# Physics
signal body_entered(body)
signal body_exited(body)
signal area_entered(area)
signal area_exited(area)

# UI elements
signal pressed
signal toggled(button_pressed)
signal text_changed(new_text)
signal value_changed(value)
```

### Connection Methods

There are two primary ways to connect signals in Godot 4.x:

```gdscript
# Method 1: Code-based connection (preferred for dynamic connections)
button.pressed.connect(_on_button_pressed)

# Method 2: Editor-based connection (good for static relationships)
# Done through the Node dock -> Signals tab -> Connect dialog
```

## Key Concepts

### Declaring Custom Signals

```gdscript
# Basic signal declaration
signal health_changed
signal player_died

# Signal with parameters
signal damage_taken(amount: int, damage_type: String)
signal item_collected(item: Item, quantity: int)

# Signal with default values (Godot 4.x)
signal level_completed(score: int, time_bonus: float)
```

### Emitting Signals

```gdscript
extends CharacterBody2D

signal health_changed(old_value: int, new_value: int)
signal died

var health: int = 100:
    set(value):
        var old_health = health
        health = clamp(value, 0, max_health)

        # Emit signal when health changes
        health_changed.emit(old_health, health)

        if health <= 0:
            died.emit()

var max_health: int = 100

func take_damage(amount: int) -> void:
    health -= amount

func heal(amount: int) -> void:
    health += amount
```

### Connecting Signals

```gdscript
# In the receiver node
extends CanvasLayer

@onready var player = $"../Player"
@onready var health_bar = $HealthBar

func _ready() -> void:
    # Connect to player signals
    player.health_changed.connect(_on_player_health_changed)
    player.died.connect(_on_player_died)

func _on_player_health_changed(old_value: int, new_value: int) -> void:
    health_bar.value = new_value

    # Show damage/heal effect
    if new_value < old_value:
        _flash_red()
    else:
        _flash_green()

func _on_player_died() -> void:
    $GameOverScreen.show()
```

### Signal Connection Flags

```gdscript
# Available connection flags in Godot 4.x

# CONNECT_DEFERRED: Call the method on the next idle frame
signal_emitter.my_signal.connect(callback, CONNECT_DEFERRED)

# CONNECT_ONE_SHOT: Automatically disconnect after first call
signal_emitter.my_signal.connect(callback, CONNECT_ONE_SHOT)

# CONNECT_REFERENCE_COUNTED: Reference count the connection
signal_emitter.my_signal.connect(callback, CONNECT_REFERENCE_COUNTED)

# Combining flags
signal_emitter.my_signal.connect(callback, CONNECT_DEFERRED | CONNECT_ONE_SHOT)
```

### Disconnecting Signals

```gdscript
# Disconnect a specific callback
player.health_changed.disconnect(_on_player_health_changed)

# Check if connected before disconnecting
if player.health_changed.is_connected(_on_player_health_changed):
    player.health_changed.disconnect(_on_player_health_changed)

# Disconnect all connections (useful in _exit_tree)
func _exit_tree() -> void:
    if player and player.health_changed.is_connected(_on_player_health_changed):
        player.health_changed.disconnect(_on_player_health_changed)
```

## Code Examples

### Complete Health System Example

```gdscript
# health_component.gd
class_name HealthComponent
extends Node

signal health_changed(current: int, maximum: int)
signal damage_taken(amount: int, source: Node)
signal healed(amount: int, source: Node)
signal died(killer: Node)
signal revived

@export var max_health: int = 100
@export var invincibility_time: float = 0.0

var current_health: int
var is_invincible: bool = false
var last_damage_source: Node = null

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int, source: Node = null) -> void:
    if is_invincible or current_health <= 0:
        return

    var actual_damage = min(amount, current_health)
    current_health -= actual_damage
    last_damage_source = source

    damage_taken.emit(actual_damage, source)
    health_changed.emit(current_health, max_health)

    if current_health <= 0:
        died.emit(source)
    elif invincibility_time > 0:
        _start_invincibility()

func heal(amount: int, source: Node = null) -> void:
    if current_health <= 0:
        return  # Can't heal when dead

    var actual_heal = min(amount, max_health - current_health)
    if actual_heal > 0:
        current_health += actual_heal
        healed.emit(actual_heal, source)
        health_changed.emit(current_health, max_health)

func revive(health_amount: int = -1) -> void:
    if current_health > 0:
        return  # Already alive

    if health_amount < 0:
        current_health = max_health
    else:
        current_health = min(health_amount, max_health)

    revived.emit()
    health_changed.emit(current_health, max_health)

func _start_invincibility() -> void:
    is_invincible = true
    await get_tree().create_timer(invincibility_time).timeout
    is_invincible = false

func get_health_percentage() -> float:
    return float(current_health) / float(max_health)

func is_alive() -> bool:
    return current_health > 0
```

```gdscript
# health_bar_ui.gd
extends ProgressBar

@export var health_component_path: NodePath
@onready var health_component: HealthComponent = get_node(health_component_path)

@export var animate_changes: bool = true
@export var animation_duration: float = 0.3

var tween: Tween

func _ready() -> void:
    if health_component:
        health_component.health_changed.connect(_on_health_changed)
        # Initialize with current values
        _on_health_changed(health_component.current_health, health_component.max_health)

func _on_health_changed(current: int, maximum: int) -> void:
    max_value = maximum

    if animate_changes:
        if tween:
            tween.kill()
        tween = create_tween()
        tween.tween_property(self, "value", current, animation_duration)\
            .set_ease(Tween.EASE_OUT)\
            .set_trans(Tween.TRANS_CUBIC)
    else:
        value = current
```

### Event Bus Pattern

```gdscript
# event_bus.gd (Autoload/Singleton)
extends Node

# Global game events
signal game_started
signal game_paused(is_paused: bool)
signal game_over(final_score: int)

# Player events
signal player_spawned(player: Node)
signal player_died(player: Node)
signal player_score_changed(new_score: int)

# Combat events
signal enemy_spawned(enemy: Node)
signal enemy_killed(enemy: Node, killer: Node)
signal damage_dealt(target: Node, amount: int, source: Node)

# UI events
signal show_dialog(text: String, speaker: String)
signal hide_dialog
signal show_notification(message: String, duration: float)

# Achievement events
signal achievement_unlocked(achievement_id: String)
signal progress_updated(achievement_id: String, current: int, target: int)

# Utility function to safely emit signals with error handling
func safe_emit(signal_name: String, args: Array = []) -> void:
    if has_signal(signal_name):
        callv("emit_signal", [signal_name] + args)
    else:
        push_warning("EventBus: Unknown signal '%s'" % signal_name)
```

```gdscript
# Using the Event Bus
# enemy.gd
extends CharacterBody2D

func die(killer: Node) -> void:
    EventBus.enemy_killed.emit(self, killer)
    queue_free()

# score_manager.gd (Another Autoload)
extends Node

var score: int = 0

func _ready() -> void:
    EventBus.enemy_killed.connect(_on_enemy_killed)

func _on_enemy_killed(enemy: Node, killer: Node) -> void:
    var points = enemy.get("point_value") if enemy.get("point_value") else 100
    score += points
    EventBus.player_score_changed.emit(score)

# achievement_manager.gd
extends Node

var enemies_killed: int = 0

func _ready() -> void:
    EventBus.enemy_killed.connect(_on_enemy_killed)

func _on_enemy_killed(_enemy: Node, _killer: Node) -> void:
    enemies_killed += 1
    EventBus.progress_updated.emit("enemy_slayer", enemies_killed, 100)

    if enemies_killed >= 100:
        EventBus.achievement_unlocked.emit("enemy_slayer")
```

### Signal-Based State Machine

```gdscript
# state_machine.gd
class_name StateMachine
extends Node

signal state_changed(old_state: State, new_state: State)
signal state_entered(state: State)
signal state_exited(state: State)

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    # Register all child states
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self
            child.transitioned.connect(_on_state_transitioned)

    # Start with initial state
    if initial_state:
        current_state = initial_state
        current_state.enter()
        state_entered.emit(current_state)

func _process(delta: float) -> void:
    if current_state:
        current_state.update(delta)

func _physics_process(delta: float) -> void:
    if current_state:
        current_state.physics_update(delta)

func _unhandled_input(event: InputEvent) -> void:
    if current_state:
        current_state.handle_input(event)

func _on_state_transitioned(new_state_name: String) -> void:
    var new_state = states.get(new_state_name.to_lower())
    if not new_state:
        push_error("State '%s' not found" % new_state_name)
        return

    if current_state:
        state_exited.emit(current_state)
        current_state.exit()

    var old_state = current_state
    current_state = new_state
    current_state.enter()

    state_changed.emit(old_state, new_state)
    state_entered.emit(new_state)

func get_state(state_name: String) -> State:
    return states.get(state_name.to_lower())
```

```gdscript
# state.gd
class_name State
extends Node

signal transitioned(new_state_name: String)

var state_machine: StateMachine

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(_delta: float) -> void:
    pass

func physics_update(_delta: float) -> void:
    pass

func handle_input(_event: InputEvent) -> void:
    pass
```

```gdscript
# player_idle_state.gd
extends State

@export var move_state: State
@export var jump_state: State

func enter() -> void:
    # Play idle animation
    owner.animation_player.play("idle")

func update(_delta: float) -> void:
    # Check for state transitions
    if Input.is_action_pressed("move_left") or Input.is_action_pressed("move_right"):
        transitioned.emit("move")
    elif Input.is_action_just_pressed("jump") and owner.is_on_floor():
        transitioned.emit("jump")
```

### Reactive Property System

```gdscript
# reactive_property.gd
class_name ReactiveProperty
extends RefCounted

signal value_changed(old_value, new_value)

var _value

func _init(initial_value = null) -> void:
    _value = initial_value

func get_value():
    return _value

func set_value(new_value) -> void:
    if _value != new_value:
        var old_value = _value
        _value = new_value
        value_changed.emit(old_value, new_value)

# Usage example
# player_stats.gd
extends Node

var health := ReactiveProperty.new(100)
var mana := ReactiveProperty.new(50)
var level := ReactiveProperty.new(1)
var experience := ReactiveProperty.new(0)

func _ready() -> void:
    level.value_changed.connect(_on_level_changed)
    experience.value_changed.connect(_on_experience_changed)

func _on_level_changed(old_level: int, new_level: int) -> void:
    print("Level up! %d -> %d" % [old_level, new_level])
    # Increase max health/mana on level up
    health.set_value(health.get_value() + 10)
    mana.set_value(mana.get_value() + 5)

func _on_experience_changed(_old_exp: int, new_exp: int) -> void:
    var exp_needed = level.get_value() * 100
    if new_exp >= exp_needed:
        experience.set_value(new_exp - exp_needed)
        level.set_value(level.get_value() + 1)

func add_experience(amount: int) -> void:
    experience.set_value(experience.get_value() + amount)
```

### Async Signal Waiting

```gdscript
# dialog_system.gd
extends CanvasLayer

signal dialog_finished
signal choice_made(choice_index: int)

@onready var dialog_label = $DialogBox/Label
@onready var choice_container = $DialogBox/ChoiceContainer

func show_dialog(text: String) -> void:
    dialog_label.text = text
    show()

    # Wait for player input to continue
    await get_tree().create_timer(0.1).timeout  # Brief delay

    # Wait for any key press
    while true:
        var event = await self.gui_input
        if event is InputEventKey and event.pressed:
            break
        if event is InputEventMouseButton and event.pressed:
            break

    hide()
    dialog_finished.emit()

func show_choices(prompt: String, choices: Array[String]) -> int:
    dialog_label.text = prompt

    # Create choice buttons
    for i in range(choices.size()):
        var button = Button.new()
        button.text = choices[i]
        button.pressed.connect(_on_choice_pressed.bind(i))
        choice_container.add_child(button)

    show()

    # Wait for player choice
    var selected_choice = await choice_made

    # Cleanup
    for child in choice_container.get_children():
        child.queue_free()

    hide()
    return selected_choice

func _on_choice_pressed(index: int) -> void:
    choice_made.emit(index)

# Using the dialog system
# npc.gd
extends CharacterBody2D

@onready var dialog_system = $"/root/Main/DialogSystem"

func interact() -> void:
    await dialog_system.show_dialog("Hello, traveler!")
    await dialog_system.show_dialog("Would you like to trade?")

    var choice = await dialog_system.show_choices(
        "What would you like to do?",
        ["Buy items", "Sell items", "Leave"]
    )

    match choice:
        0:
            open_buy_menu()
        1:
            open_sell_menu()
        2:
            await dialog_system.show_dialog("Safe travels!")
```

## Best Practices

### 1. Use Descriptive Signal Names

```gdscript
# Bad - vague names
signal done
signal changed
signal event

# Good - descriptive names that indicate what happened
signal quest_completed(quest: Quest)
signal inventory_item_added(item: Item, slot: int)
signal player_entered_danger_zone(zone: Area2D)
```

### 2. Include Relevant Data in Signals

```gdscript
# Bad - requires receiver to query for information
signal damage_taken  # Receiver has to ask: how much? from whom?

# Good - includes all relevant data
signal damage_taken(amount: int, damage_type: String, source: Node, is_critical: bool)
```

### 3. Document Your Signals

```gdscript
## Emitted when the player takes damage.
## @param amount: The amount of damage taken after defense calculations.
## @param source: The node that caused the damage (can be null for environmental damage).
signal damage_taken(amount: int, source: Node)

## Emitted when the player's health reaches zero.
## @param killer: The node that dealt the killing blow.
signal player_died(killer: Node)
```

### 4. Use Typed Parameters (Godot 4.x)

```gdscript
# Good - typed parameters provide clarity and IDE support
signal item_equipped(item: Item, slot: EquipmentSlot)
signal quest_progress(quest_id: String, current: int, target: int)
```

### 5. Prefer Signals Over Direct Method Calls

```gdscript
# Bad - tight coupling
func take_damage(amount: int) -> void:
    health -= amount
    $UI/HealthBar.update_health(health)  # Direct reference
    $AudioManager.play_hurt_sound()       # Another direct reference
    $ScreenShaker.shake(0.2)              # Yet another

# Good - loose coupling with signals
signal damage_taken(current_health: int, damage: int)

func take_damage(amount: int) -> void:
    health -= amount
    damage_taken.emit(health, amount)
    # UI, audio, and screen effects connect to this signal independently
```

### 6. Clean Up Connections

```gdscript
extends Node

var _connected_emitter: Node

func connect_to_emitter(emitter: Node) -> void:
    if _connected_emitter:
        _disconnect_from_emitter()

    _connected_emitter = emitter
    _connected_emitter.some_signal.connect(_on_some_signal)

func _disconnect_from_emitter() -> void:
    if _connected_emitter and _connected_emitter.some_signal.is_connected(_on_some_signal):
        _connected_emitter.some_signal.disconnect(_on_some_signal)
    _connected_emitter = null

func _exit_tree() -> void:
    _disconnect_from_emitter()
```

### 7. Use CallableQueue for Thread Safety

```gdscript
# When emitting signals from threads, use call_deferred
func _thread_function() -> void:
    # Don't emit directly from threads
    # signal_name.emit()  # BAD - can cause crashes

    # Instead, defer to main thread
    call_deferred("emit_signal", "signal_name", arg1, arg2)
```

## Common Pitfalls

### Pitfall 1: Connecting to Freed Nodes

```gdscript
# BAD - can cause errors if enemy is freed
func _ready() -> void:
    var enemy = $Enemy
    enemy.died.connect(_on_enemy_died)

func _on_enemy_died() -> void:
    # Error if enemy is already freed!
    print("Enemy position:", enemy.position)

# GOOD - check if reference is valid or use one-shot
func _ready() -> void:
    var enemy = $Enemy
    enemy.died.connect(_on_enemy_died.bind(enemy), CONNECT_ONE_SHOT)

func _on_enemy_died(enemy_ref: Node) -> void:
    # Use the bound reference, or check validity
    if is_instance_valid(enemy_ref):
        print("Enemy was at:", enemy_ref.position)
```

### Pitfall 2: Signal Loops

```gdscript
# BAD - can cause infinite loops
# NodeA
signal value_changed(new_value)
var value: int:
    set(v):
        value = v
        value_changed.emit(value)

# NodeB subscribes and modifies NodeA's value
func _on_node_a_value_changed(new_value: int) -> void:
    node_a.value = new_value + 1  # This triggers another signal!

# GOOD - prevent recursion
var _updating: bool = false
var value: int:
    set(v):
        if _updating:
            return
        _updating = true
        value = v
        value_changed.emit(value)
        _updating = false
```

### Pitfall 3: Memory Leaks from Unmanaged Connections

```gdscript
# BAD - dynamically created nodes that aren't cleaned up
func spawn_enemy() -> void:
    var enemy = enemy_scene.instantiate()
    enemy.died.connect(_on_enemy_died)  # Connection keeps reference
    add_child(enemy)

# If enemy is freed but connection isn't, memory leak occurs

# GOOD - use one-shot or explicit cleanup
func spawn_enemy() -> void:
    var enemy = enemy_scene.instantiate()
    enemy.died.connect(_on_enemy_died, CONNECT_ONE_SHOT)
    # OR
    enemy.tree_exiting.connect(func():
        if enemy.died.is_connected(_on_enemy_died):
            enemy.died.disconnect(_on_enemy_died)
    )
    add_child(enemy)
```

### Pitfall 4: Emitting Before Connections Are Made

```gdscript
# BAD - signal emitted in _ready before parent can connect
# child_node.gd
func _ready() -> void:
    initialized.emit()  # Parent might not be connected yet!

# GOOD - defer the emission or use call_deferred
func _ready() -> void:
    call_deferred("_emit_initialized")

func _emit_initialized() -> void:
    initialized.emit()

# OR - let parent explicitly trigger initialization
func initialize() -> void:
    # Do initialization
    initialized.emit()
```

### Pitfall 5: Over-using Global Signals

```gdscript
# BAD - everything goes through EventBus
EventBus.button_hovered.emit()  # UI detail shouldn't be global
EventBus.animation_frame_changed.emit()  # Too granular

# GOOD - use global signals only for game-wide events
EventBus.game_paused.emit()  # Appropriate
EventBus.player_died.emit()  # Appropriate

# Local signals for local concerns
button.mouse_entered.connect(_on_button_hover)
animation_player.frame_changed.connect(_on_frame_changed)
```

## Performance Considerations

### Signal Emission Cost

```gdscript
# Signals have overhead compared to direct calls
# For performance-critical code (called thousands of times per frame),
# consider direct method calls

# Benchmark results (approximate):
# - Direct method call: ~0.001ms
# - Signal emission (1 connection): ~0.005ms
# - Signal emission (10 connections): ~0.02ms

# For most game logic, this overhead is negligible
# Only optimize if profiling shows signals as a bottleneck
```

### Connection Count Scaling

```gdscript
# Keep connection counts reasonable
# Hundreds of connections to one signal can cause performance issues

# BAD - every bullet connects to game over
func spawn_bullet() -> void:
    var bullet = bullet_scene.instantiate()
    EventBus.game_over.connect(bullet._on_game_over)  # Thousands of connections!

# GOOD - use groups or parent management
func spawn_bullet() -> void:
    var bullet = bullet_scene.instantiate()
    bullet.add_to_group("bullets")
    add_child(bullet)

# In game manager
func _on_game_over() -> void:
    get_tree().call_group("bullets", "handle_game_over")
```

### Memory Considerations

```gdscript
# Signals hold references to connected callables
# This can prevent garbage collection

# Use weakref for observer patterns with dynamic objects
class_name WeakSignalConnection
extends RefCounted

var _weak_target: WeakRef
var _method: String
var _signal_source: Object
var _signal_name: String

func _init(target: Object, method: String, source: Object, signal_name: String) -> void:
    _weak_target = weakref(target)
    _method = method
    _signal_source = source
    _signal_name = signal_name
    source.connect(signal_name, _on_signal_received)

func _on_signal_received(args: Array = []) -> void:
    var target = _weak_target.get_ref()
    if target:
        target.callv(_method, args)
    else:
        # Target was freed, disconnect
        if _signal_source.is_connected(_signal_name, _on_signal_received):
            _signal_source.disconnect(_signal_name, _on_signal_received)
```

## Real-World Scenarios

### Scenario 1: Inventory System

```gdscript
# inventory.gd
class_name Inventory
extends Node

signal item_added(item: Item, slot: int)
signal item_removed(item: Item, slot: int)
signal item_moved(item: Item, from_slot: int, to_slot: int)
signal inventory_full
signal inventory_changed

@export var max_slots: int = 20

var slots: Array[Item] = []

func _ready() -> void:
    slots.resize(max_slots)

func add_item(item: Item) -> bool:
    # Try to stack with existing items first
    if item.stackable:
        for i in range(slots.size()):
            if slots[i] and slots[i].id == item.id:
                if slots[i].quantity < slots[i].max_stack:
                    slots[i].quantity += item.quantity
                    item_added.emit(item, i)
                    inventory_changed.emit()
                    return true

    # Find empty slot
    for i in range(slots.size()):
        if slots[i] == null:
            slots[i] = item
            item_added.emit(item, i)
            inventory_changed.emit()
            return true

    inventory_full.emit()
    return false

func remove_item(slot: int) -> Item:
    if slot < 0 or slot >= slots.size():
        return null

    var item = slots[slot]
    if item:
        slots[slot] = null
        item_removed.emit(item, slot)
        inventory_changed.emit()

    return item

func move_item(from_slot: int, to_slot: int) -> bool:
    if from_slot < 0 or from_slot >= slots.size():
        return false
    if to_slot < 0 or to_slot >= slots.size():
        return false

    var item = slots[from_slot]
    if not item:
        return false

    # Swap items
    slots[from_slot] = slots[to_slot]
    slots[to_slot] = item

    item_moved.emit(item, from_slot, to_slot)
    inventory_changed.emit()
    return true

# inventory_ui.gd
extends Control

@export var inventory_path: NodePath
@onready var inventory: Inventory = get_node(inventory_path)

@onready var slot_container = $SlotContainer

func _ready() -> void:
    inventory.item_added.connect(_on_item_added)
    inventory.item_removed.connect(_on_item_removed)
    inventory.inventory_full.connect(_on_inventory_full)

    _refresh_all_slots()

func _on_item_added(item: Item, slot: int) -> void:
    _refresh_slot(slot)
    _play_pickup_animation(slot)

func _on_item_removed(item: Item, slot: int) -> void:
    _refresh_slot(slot)

func _on_inventory_full() -> void:
    $FullNotification.show()
    $FullNotification/AnimationPlayer.play("shake")

func _refresh_slot(slot: int) -> void:
    var slot_ui = slot_container.get_child(slot)
    slot_ui.set_item(inventory.slots[slot])

func _refresh_all_slots() -> void:
    for i in range(inventory.slots.size()):
        _refresh_slot(i)
```

### Scenario 2: Quest System

```gdscript
# quest_manager.gd
class_name QuestManager
extends Node

signal quest_started(quest: Quest)
signal quest_updated(quest: Quest)
signal quest_completed(quest: Quest)
signal quest_failed(quest: Quest)
signal objective_completed(quest: Quest, objective: QuestObjective)

var active_quests: Array[Quest] = []
var completed_quests: Array[String] = []

func _ready() -> void:
    # Connect to game events that might update quests
    EventBus.enemy_killed.connect(_check_kill_objectives)
    EventBus.item_collected.connect(_check_collect_objectives)
    EventBus.area_entered.connect(_check_location_objectives)

func start_quest(quest: Quest) -> bool:
    if quest.id in completed_quests:
        return false  # Already completed

    for q in active_quests:
        if q.id == quest.id:
            return false  # Already active

    active_quests.append(quest)
    quest.status = Quest.Status.ACTIVE
    quest_started.emit(quest)
    return true

func _check_kill_objectives(enemy: Node, _killer: Node) -> void:
    var enemy_type = enemy.get("enemy_type")
    if not enemy_type:
        return

    for quest in active_quests:
        for objective in quest.objectives:
            if objective is KillObjective and objective.target_type == enemy_type:
                objective.current_count += 1
                quest_updated.emit(quest)

                if objective.is_complete():
                    objective_completed.emit(quest, objective)

                if quest.is_complete():
                    _complete_quest(quest)

func _check_collect_objectives(item: Item) -> void:
    for quest in active_quests:
        for objective in quest.objectives:
            if objective is CollectObjective and objective.item_id == item.id:
                objective.current_count += 1
                quest_updated.emit(quest)

                if objective.is_complete():
                    objective_completed.emit(quest, objective)

                if quest.is_complete():
                    _complete_quest(quest)

func _check_location_objectives(area: Area2D) -> void:
    var location_id = area.get("location_id")
    if not location_id:
        return

    for quest in active_quests:
        for objective in quest.objectives:
            if objective is LocationObjective and objective.target_location == location_id:
                objective.reached = true
                quest_updated.emit(quest)
                objective_completed.emit(quest, objective)

                if quest.is_complete():
                    _complete_quest(quest)

func _complete_quest(quest: Quest) -> void:
    quest.status = Quest.Status.COMPLETED
    active_quests.erase(quest)
    completed_quests.append(quest.id)
    quest_completed.emit(quest)

    # Grant rewards
    for reward in quest.rewards:
        reward.grant()
```

### Scenario 3: Audio Manager with Signals

```gdscript
# audio_manager.gd
extends Node

signal music_changed(track_name: String)
signal sfx_played(sfx_name: String)
signal volume_changed(bus_name: String, volume: float)

@export var music_fade_duration: float = 1.0

var current_music: String = ""
var music_player: AudioStreamPlayer

func _ready() -> void:
    music_player = AudioStreamPlayer.new()
    music_player.bus = "Music"
    add_child(music_player)

    # Connect to game events
    EventBus.player_died.connect(_on_player_died)
    EventBus.boss_encountered.connect(_on_boss_encountered)
    EventBus.area_entered.connect(_on_area_entered)

func play_music(track_name: String, fade: bool = true) -> void:
    if current_music == track_name:
        return

    var track = load("res://audio/music/%s.ogg" % track_name)
    if not track:
        push_error("Music track not found: %s" % track_name)
        return

    if fade and music_player.playing:
        await _fade_out_music()

    music_player.stream = track
    music_player.play()
    current_music = track_name

    if fade:
        await _fade_in_music()

    music_changed.emit(track_name)

func play_sfx(sfx_name: String, position: Vector2 = Vector2.ZERO) -> void:
    var sfx = load("res://audio/sfx/%s.wav" % sfx_name)
    if not sfx:
        push_error("SFX not found: %s" % sfx_name)
        return

    var player: AudioStreamPlayer2D
    if position != Vector2.ZERO:
        player = AudioStreamPlayer2D.new()
        player.position = position
    else:
        player = AudioStreamPlayer.new()

    player.stream = sfx
    player.bus = "SFX"
    add_child(player)
    player.play()
    player.finished.connect(player.queue_free)

    sfx_played.emit(sfx_name)

func _fade_out_music() -> void:
    var tween = create_tween()
    tween.tween_property(music_player, "volume_db", -40.0, music_fade_duration)
    await tween.finished

func _fade_in_music() -> void:
    music_player.volume_db = -40.0
    var tween = create_tween()
    tween.tween_property(music_player, "volume_db", 0.0, music_fade_duration)
    await tween.finished

func _on_player_died(_player: Node) -> void:
    play_sfx("player_death")
    play_music("game_over")

func _on_boss_encountered(boss: Node) -> void:
    var boss_music = boss.get("boss_music") if boss.get("boss_music") else "boss_battle"
    play_music(boss_music)

func _on_area_entered(area: Area2D) -> void:
    var area_music = area.get("area_music")
    if area_music:
        play_music(area_music)
```

## Interview Focus Points

### Common Interview Questions

**Q1: What are signals in Godot and why are they important?**

Signals are Godot's implementation of the Observer pattern. They allow nodes to emit notifications without knowing who receives them. This promotes loose coupling, making code more modular, testable, and maintainable. Signals are fundamental to Godot's architecture and are used extensively in both the engine and game code.

**Q2: How do you create and emit a custom signal in Godot 4.x?**

```gdscript
# Declaration
signal my_event(data: Dictionary)

# Emission
my_event.emit({"score": 100, "player": "Player1"})
```

**Q3: What's the difference between `connect()` flags like CONNECT_DEFERRED and CONNECT_ONE_SHOT?**

- `CONNECT_DEFERRED`: The callback is called on the next idle frame, useful when you need to ensure the current frame's processing is complete
- `CONNECT_ONE_SHOT`: The connection is automatically removed after the first signal emission, useful for one-time events

**Q4: How do you safely disconnect signals to prevent memory leaks?**

```gdscript
func _exit_tree() -> void:
    if emitter and emitter.my_signal.is_connected(_my_callback):
        emitter.my_signal.disconnect(_my_callback)
```

Always check if connected before disconnecting, and clean up in `_exit_tree()` or when the connection is no longer needed.

**Q5: What is the Event Bus pattern and when should you use it?**

An Event Bus is a singleton (autoload) that holds global signals for game-wide events. Use it for events that need to be heard by many unrelated systems (game_over, achievement_unlocked). Don't use it for local communication between tightly related nodes.

**Q6: How do you wait for a signal asynchronously?**

```gdscript
await some_node.my_signal
# or with timeout
await get_tree().create_timer(5.0).timeout
```

### Quick Reference

```
+=====================================================================+
|                    GODOT SIGNALS QUICK REFERENCE                     |
+=====================================================================+
|                                                                      |
|  Declaring Signals:                                                  |
|  ------------------                                                  |
|  signal simple_signal                                                |
|  signal typed_signal(value: int, name: String)                       |
|                                                                      |
|  Emitting Signals:                                                   |
|  -----------------                                                   |
|  simple_signal.emit()                                                |
|  typed_signal.emit(42, "test")                                       |
|                                                                      |
|  Connecting Signals:                                                 |
|  -------------------                                                 |
|  emitter.signal.connect(callback)                                    |
|  emitter.signal.connect(callback, CONNECT_ONE_SHOT)                  |
|  emitter.signal.connect(callback.bind(extra_arg))                    |
|                                                                      |
|  Disconnecting:                                                      |
|  --------------                                                      |
|  emitter.signal.disconnect(callback)                                 |
|  if emitter.signal.is_connected(callback):                           |
|      emitter.signal.disconnect(callback)                             |
|                                                                      |
|  Async/Await:                                                        |
|  ------------                                                        |
|  var result = await emitter.signal                                   |
|  await get_tree().create_timer(1.0).timeout                          |
|                                                                      |
|  Connection Flags:                                                   |
|  -----------------                                                   |
|  CONNECT_DEFERRED    - Call on next idle frame                       |
|  CONNECT_ONE_SHOT    - Auto-disconnect after first call              |
|  CONNECT_REFERENCE_COUNTED - Reference count the connection          |
|                                                                      |
+=====================================================================+
```

## Further Reading

### Official Documentation

- [Godot 4.x Signals Documentation](https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html)
- [GDScript Reference - Signals](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html#signals)
- [Using Signals Best Practices](https://docs.godotengine.org/en/stable/tutorials/best_practices/scene_organization.html)

### Design Patterns

- Observer Pattern - Gang of Four Design Patterns
- Event-Driven Architecture
- Publish-Subscribe Pattern

### Related Topics

- Godot Groups (alternative to signals for one-to-many communication)
- Godot Coroutines and Async/Await
- Resource-based event systems
- State machines with signals
- Dependency injection in Godot

### Community Resources

- [GDQuest - Godot Signals Tutorial](https://www.gdquest.com/)
- [Godot Recipes - Signal Patterns](https://kidscancode.org/godot_recipes/)
- [Godot Forums - Best Practices Discussion](https://godotforums.org/)
