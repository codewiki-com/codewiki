---
title: Godot 信号机制详解
description: 深入掌握 Godot 信号系统：自定义信号、连接方式、最佳实践，以及观察者模式在游戏开发中的应用
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
origin: old/src/content/docs/gamedev/godot-signals.zh.md
divergence: 0.211
issues: []
legacy:
  category: GameDev
  subcategory: Godot
  order: 50
  lastUpdated: 2026-01-21
---

信号是 Godot 架构的核心，它实现了节点之间的松耦合，使你的代码更加模块化、易维护且可扩展。本指南将带你从信号基础到专业游戏开发中使用的高级模式。

## 概念解释

### 什么是信号？

Godot 中的信号是观察者模式的实现，允许对象在发生有趣的事情时发出通知，而无需知道谁（如果有的话）在监听。可以把信号想象成无线电广播——广播者发出消息，任何调到该频率的人都会收到。

```
+------------------+          信号发射           +------------------+
|                  |  --------------------------->  |                  |
|    按钮节点       |    发射 "pressed" 信号      |    玩家节点       |
|    (发射者)       |                                |    (接收者)       |
|                  |  <---------------------------  |                  |
+------------------+         建立连接             +------------------+

按钮不知道玩家的存在。
玩家只是响应信号。
```

### 为什么使用信号？

信号解决了游戏开发中的几个关键问题：

1. **解耦**：节点之间不需要直接引用
2. **模块化**：组件可以独立开发和测试
3. **灵活性**：添加或移除监听器无需修改发射者
4. **可维护性**：对一个节点的修改不会在整个代码库中级联传播
5. **可复用性**：节点变得更加通用，可在多个项目中复用

### Godot 中的观察者模式

```
+=====================================================================+
|                    GODOT 中的观察者模式                               |
+=====================================================================+
|                                                                      |
|   主题 (发射者)                          观察者 (接收者)              |
|   +------------------+                 +------------------+          |
|   |    血量系统       |----signal----->|    血条 UI       |          |
|   |                  |----signal----->|    音效管理器     |          |
|   |  signal damaged  |----signal----->|    屏幕震动       |          |
|   |  signal healed   |----signal----->|    成就系统       |          |
|   +------------------+                 +------------------+          |
|                                                                      |
|   血量系统发射信号时不知道它的观察者是谁。                             |
|   观察者可以动态添加或移除。                                          |
|                                                                      |
+=====================================================================+
```

## 核心原理

### 信号架构

Godot 的信号系统内置于核心 `Object` 类中，这意味着每个 Godot 对象都可以发射和接收信号。该系统由以下部分组成：

1. **信号声明**：定义对象可以发射的信号
2. **信号发射**：广播带有可选参数的信号
3. **信号连接**：将信号链接到回调函数
4. **信号处理**：处理接收到的信号

### 内置信号

Godot 节点自带许多内置信号：

```gdscript
# 常见内置信号

# 节点生命周期
signal ready
signal tree_entered
signal tree_exited

# 输入事件
signal gui_input(event)
signal mouse_entered
signal mouse_exited

# 动画
signal animation_finished(anim_name)
signal frame_changed

# 物理
signal body_entered(body)
signal body_exited(body)
signal area_entered(area)
signal area_exited(area)

# UI 元素
signal pressed
signal toggled(button_pressed)
signal text_changed(new_text)
signal value_changed(value)
```

### 连接方法

在 Godot 4.x 中有两种主要的信号连接方式：

```gdscript
# 方法 1：代码连接（推荐用于动态连接）
button.pressed.connect(_on_button_pressed)

# 方法 2：编辑器连接（适合静态关系）
# 通过节点面板 -> 信号标签 -> 连接对话框完成
```

## 核心要点

### 声明自定义信号

```gdscript
# 基本信号声明
signal health_changed
signal player_died

# 带参数的信号
signal damage_taken(amount: int, damage_type: String)
signal item_collected(item: Item, quantity: int)

# 带默认值的信号（Godot 4.x）
signal level_completed(score: int, time_bonus: float)
```

### 发射信号

```gdscript
extends CharacterBody2D

signal health_changed(old_value: int, new_value: int)
signal died

var health: int = 100:
    set(value):
        var old_health = health
        health = clamp(value, 0, max_health)

        # 血量变化时发射信号
        health_changed.emit(old_health, health)

        if health <= 0:
            died.emit()

var max_health: int = 100

func take_damage(amount: int) -> void:
    health -= amount

func heal(amount: int) -> void:
    health += amount
```

### 连接信号

```gdscript
# 在接收者节点中
extends CanvasLayer

@onready var player = $"../Player"
@onready var health_bar = $HealthBar

func _ready() -> void:
    # 连接到玩家信号
    player.health_changed.connect(_on_player_health_changed)
    player.died.connect(_on_player_died)

func _on_player_health_changed(old_value: int, new_value: int) -> void:
    health_bar.value = new_value

    # 显示伤害/治疗效果
    if new_value < old_value:
        _flash_red()
    else:
        _flash_green()

func _on_player_died() -> void:
    $GameOverScreen.show()
```

### 信号连接标志

```gdscript
# Godot 4.x 中可用的连接标志

# CONNECT_DEFERRED：在下一个空闲帧调用方法
signal_emitter.my_signal.connect(callback, CONNECT_DEFERRED)

# CONNECT_ONE_SHOT：首次调用后自动断开连接
signal_emitter.my_signal.connect(callback, CONNECT_ONE_SHOT)

# CONNECT_REFERENCE_COUNTED：引用计数连接
signal_emitter.my_signal.connect(callback, CONNECT_REFERENCE_COUNTED)

# 组合标志
signal_emitter.my_signal.connect(callback, CONNECT_DEFERRED | CONNECT_ONE_SHOT)
```

### 断开信号连接

```gdscript
# 断开特定回调
player.health_changed.disconnect(_on_player_health_changed)

# 断开前检查是否已连接
if player.health_changed.is_connected(_on_player_health_changed):
    player.health_changed.disconnect(_on_player_health_changed)

# 断开所有连接（在 _exit_tree 中有用）
func _exit_tree() -> void:
    if player and player.health_changed.is_connected(_on_player_health_changed):
        player.health_changed.disconnect(_on_player_health_changed)
```

## 代码示例

### 完整的血量系统示例

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
        return  # 死亡时无法治疗

    var actual_heal = min(amount, max_health - current_health)
    if actual_heal > 0:
        current_health += actual_heal
        healed.emit(actual_heal, source)
        health_changed.emit(current_health, max_health)

func revive(health_amount: int = -1) -> void:
    if current_health > 0:
        return  # 已经存活

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
        # 用当前值初始化
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

### 事件总线模式

```gdscript
# event_bus.gd（自动加载/单例）
extends Node

# 全局游戏事件
signal game_started
signal game_paused(is_paused: bool)
signal game_over(final_score: int)

# 玩家事件
signal player_spawned(player: Node)
signal player_died(player: Node)
signal player_score_changed(new_score: int)

# 战斗事件
signal enemy_spawned(enemy: Node)
signal enemy_killed(enemy: Node, killer: Node)
signal damage_dealt(target: Node, amount: int, source: Node)

# UI 事件
signal show_dialog(text: String, speaker: String)
signal hide_dialog
signal show_notification(message: String, duration: float)

# 成就事件
signal achievement_unlocked(achievement_id: String)
signal progress_updated(achievement_id: String, current: int, target: int)

# 安全发射信号的实用函数，带错误处理
func safe_emit(signal_name: String, args: Array = []) -> void:
    if has_signal(signal_name):
        callv("emit_signal", [signal_name] + args)
    else:
        push_warning("EventBus: 未知信号 '%s'" % signal_name)
```

```gdscript
# 使用事件总线
# enemy.gd
extends CharacterBody2D

func die(killer: Node) -> void:
    EventBus.enemy_killed.emit(self, killer)
    queue_free()

# score_manager.gd（另一个自动加载）
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

### 基于信号的状态机

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
    # 注册所有子状态
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self
            child.transitioned.connect(_on_state_transitioned)

    # 从初始状态开始
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
        push_error("状态 '%s' 未找到" % new_state_name)
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
    # 播放待机动画
    owner.animation_player.play("idle")

func update(_delta: float) -> void:
    # 检查状态转换
    if Input.is_action_pressed("move_left") or Input.is_action_pressed("move_right"):
        transitioned.emit("move")
    elif Input.is_action_just_pressed("jump") and owner.is_on_floor():
        transitioned.emit("jump")
```

### 响应式属性系统

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

# 使用示例
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
    print("升级！ %d -> %d" % [old_level, new_level])
    # 升级时增加最大血量/魔法值
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

### 异步信号等待

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

    # 等待玩家输入继续
    await get_tree().create_timer(0.1).timeout  # 短暂延迟

    # 等待任意按键
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

    # 创建选项按钮
    for i in range(choices.size()):
        var button = Button.new()
        button.text = choices[i]
        button.pressed.connect(_on_choice_pressed.bind(i))
        choice_container.add_child(button)

    show()

    # 等待玩家选择
    var selected_choice = await choice_made

    # 清理
    for child in choice_container.get_children():
        child.queue_free()

    hide()
    return selected_choice

func _on_choice_pressed(index: int) -> void:
    choice_made.emit(index)

# 使用对话系统
# npc.gd
extends CharacterBody2D

@onready var dialog_system = $"/root/Main/DialogSystem"

func interact() -> void:
    await dialog_system.show_dialog("你好，旅行者！")
    await dialog_system.show_dialog("想要交易吗？")

    var choice = await dialog_system.show_choices(
        "你想做什么？",
        ["购买物品", "出售物品", "离开"]
    )

    match choice:
        0:
            open_buy_menu()
        1:
            open_sell_menu()
        2:
            await dialog_system.show_dialog("一路平安！")
```

## 最佳实践

### 1. 使用描述性的信号名称

```gdscript
# 不好 - 名称模糊
signal done
signal changed
signal event

# 好 - 描述性名称，表明发生了什么
signal quest_completed(quest: Quest)
signal inventory_item_added(item: Item, slot: int)
signal player_entered_danger_zone(zone: Area2D)
```

### 2. 在信号中包含相关数据

```gdscript
# 不好 - 需要接收者查询信息
signal damage_taken  # 接收者需要问：多少？来自谁？

# 好 - 包含所有相关数据
signal damage_taken(amount: int, damage_type: String, source: Node, is_critical: bool)
```

### 3. 为信号编写文档

```gdscript
## 当玩家受到伤害时发射。
## @param amount: 防御计算后实际受到的伤害量。
## @param source: 造成伤害的节点（环境伤害时可为 null）。
signal damage_taken(amount: int, source: Node)

## 当玩家血量归零时发射。
## @param killer: 造成致命一击的节点。
signal player_died(killer: Node)
```

### 4. 使用类型化参数（Godot 4.x）

```gdscript
# 好 - 类型化参数提供清晰度和 IDE 支持
signal item_equipped(item: Item, slot: EquipmentSlot)
signal quest_progress(quest_id: String, current: int, target: int)
```

### 5. 优先使用信号而非直接方法调用

```gdscript
# 不好 - 紧耦合
func take_damage(amount: int) -> void:
    health -= amount
    $UI/HealthBar.update_health(health)  # 直接引用
    $AudioManager.play_hurt_sound()       # 另一个直接引用
    $ScreenShaker.shake(0.2)              # 又一个

# 好 - 通过信号松耦合
signal damage_taken(current_health: int, damage: int)

func take_damage(amount: int) -> void:
    health -= amount
    damage_taken.emit(health, amount)
    # UI、音频和屏幕效果独立连接到此信号
```

### 6. 清理连接

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

### 7. 使用 call_deferred 保证线程安全

```gdscript
# 从线程发射信号时，使用 call_deferred
func _thread_function() -> void:
    # 不要直接从线程发射
    # signal_name.emit()  # 不好 - 可能导致崩溃

    # 而是延迟到主线程
    call_deferred("emit_signal", "signal_name", arg1, arg2)
```

## 常见陷阱

### 陷阱 1：连接到已释放的节点

```gdscript
# 不好 - 如果 enemy 被释放会导致错误
func _ready() -> void:
    var enemy = $Enemy
    enemy.died.connect(_on_enemy_died)

func _on_enemy_died() -> void:
    # 如果 enemy 已经被释放会出错！
    print("敌人位置:", enemy.position)

# 好 - 检查引用是否有效或使用一次性连接
func _ready() -> void:
    var enemy = $Enemy
    enemy.died.connect(_on_enemy_died.bind(enemy), CONNECT_ONE_SHOT)

func _on_enemy_died(enemy_ref: Node) -> void:
    # 使用绑定的引用，或检查有效性
    if is_instance_valid(enemy_ref):
        print("敌人位置:", enemy_ref.position)
```

### 陷阱 2：信号循环

```gdscript
# 不好 - 可能导致无限循环
# NodeA
signal value_changed(new_value)
var value: int:
    set(v):
        value = v
        value_changed.emit(value)

# NodeB 订阅并修改 NodeA 的值
func _on_node_a_value_changed(new_value: int) -> void:
    node_a.value = new_value + 1  # 这会触发另一个信号！

# 好 - 防止递归
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

### 陷阱 3：未管理连接导致的内存泄漏

```gdscript
# 不好 - 动态创建的节点没有清理
func spawn_enemy() -> void:
    var enemy = enemy_scene.instantiate()
    enemy.died.connect(_on_enemy_died)  # 连接持有引用
    add_child(enemy)

# 如果 enemy 被释放但连接没有断开，会发生内存泄漏

# 好 - 使用一次性连接或显式清理
func spawn_enemy() -> void:
    var enemy = enemy_scene.instantiate()
    enemy.died.connect(_on_enemy_died, CONNECT_ONE_SHOT)
    # 或者
    enemy.tree_exiting.connect(func():
        if enemy.died.is_connected(_on_enemy_died):
            enemy.died.disconnect(_on_enemy_died)
    )
    add_child(enemy)
```

### 陷阱 4：在连接建立前发射信号

```gdscript
# 不好 - 在 _ready 中发射信号，父节点可能还没连接
# child_node.gd
func _ready() -> void:
    initialized.emit()  # 父节点可能还没连接！

# 好 - 延迟发射或使用 call_deferred
func _ready() -> void:
    call_deferred("_emit_initialized")

func _emit_initialized() -> void:
    initialized.emit()

# 或者 - 让父节点显式触发初始化
func initialize() -> void:
    # 执行初始化
    initialized.emit()
```

### 陷阱 5：过度使用全局信号

```gdscript
# 不好 - 所有东西都通过 EventBus
EventBus.button_hovered.emit()  # UI 细节不应该是全局的
EventBus.animation_frame_changed.emit()  # 太细粒度了

# 好 - 只对全局游戏事件使用全局信号
EventBus.game_paused.emit()  # 合适
EventBus.player_died.emit()  # 合适

# 本地信号处理本地关注点
button.mouse_entered.connect(_on_button_hover)
animation_player.frame_changed.connect(_on_frame_changed)
```

## 性能考量

### 信号发射开销

```gdscript
# 与直接调用相比，信号有开销
# 对于性能关键的代码（每帧调用数千次），
# 考虑使用直接方法调用

# 基准测试结果（近似值）：
# - 直接方法调用：~0.001ms
# - 信号发射（1 个连接）：~0.005ms
# - 信号发射（10 个连接）：~0.02ms

# 对于大多数游戏逻辑，这个开销可以忽略不计
# 只有当性能分析显示信号是瓶颈时才优化
```

### 连接数量扩展

```gdscript
# 保持连接数量合理
# 一个信号有数百个连接可能导致性能问题

# 不好 - 每颗子弹都连接到游戏结束
func spawn_bullet() -> void:
    var bullet = bullet_scene.instantiate()
    EventBus.game_over.connect(bullet._on_game_over)  # 数千个连接！

# 好 - 使用分组或父级管理
func spawn_bullet() -> void:
    var bullet = bullet_scene.instantiate()
    bullet.add_to_group("bullets")
    add_child(bullet)

# 在游戏管理器中
func _on_game_over() -> void:
    get_tree().call_group("bullets", "handle_game_over")
```

### 内存考虑

```gdscript
# 信号持有对已连接 callable 的引用
# 这可能阻止垃圾回收

# 对于动态对象的观察者模式使用 weakref
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
        # 目标已释放，断开连接
        if _signal_source.is_connected(_signal_name, _on_signal_received):
            _signal_source.disconnect(_signal_name, _on_signal_received)
```

## 实战场景

### 场景 1：背包系统

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
    # 首先尝试与现有物品堆叠
    if item.stackable:
        for i in range(slots.size()):
            if slots[i] and slots[i].id == item.id:
                if slots[i].quantity < slots[i].max_stack:
                    slots[i].quantity += item.quantity
                    item_added.emit(item, i)
                    inventory_changed.emit()
                    return true

    # 找到空槽位
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

    # 交换物品
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

### 场景 2：任务系统

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
    # 连接到可能更新任务的游戏事件
    EventBus.enemy_killed.connect(_check_kill_objectives)
    EventBus.item_collected.connect(_check_collect_objectives)
    EventBus.area_entered.connect(_check_location_objectives)

func start_quest(quest: Quest) -> bool:
    if quest.id in completed_quests:
        return false  # 已完成

    for q in active_quests:
        if q.id == quest.id:
            return false  # 已激活

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

    # 发放奖励
    for reward in quest.rewards:
        reward.grant()
```

### 场景 3：带信号的音频管理器

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

    # 连接到游戏事件
    EventBus.player_died.connect(_on_player_died)
    EventBus.boss_encountered.connect(_on_boss_encountered)
    EventBus.area_entered.connect(_on_area_entered)

func play_music(track_name: String, fade: bool = true) -> void:
    if current_music == track_name:
        return

    var track = load("res://audio/music/%s.ogg" % track_name)
    if not track:
        push_error("音乐轨道未找到: %s" % track_name)
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
        push_error("音效未找到: %s" % sfx_name)
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

## 面试要点

### 常见面试问题

**Q1：什么是 Godot 中的信号，为什么它们很重要？**

信号是 Godot 对观察者模式的实现。它们允许节点发出通知而不需要知道谁接收它们。这促进了松耦合，使代码更加模块化、可测试和可维护。信号是 Godot 架构的基础，在引擎和游戏代码中被广泛使用。

**Q2：如何在 Godot 4.x 中创建和发射自定义信号？**

```gdscript
# 声明
signal my_event(data: Dictionary)

# 发射
my_event.emit({"score": 100, "player": "Player1"})
```

**Q3：CONNECT_DEFERRED 和 CONNECT_ONE_SHOT 等 `connect()` 标志有什么区别？**

- `CONNECT_DEFERRED`：回调在下一个空闲帧被调用，当你需要确保当前帧的处理完成时很有用
- `CONNECT_ONE_SHOT`：连接在第一次信号发射后自动移除，对一次性事件很有用

**Q4：如何安全地断开信号以防止内存泄漏？**

```gdscript
func _exit_tree() -> void:
    if emitter and emitter.my_signal.is_connected(_my_callback):
        emitter.my_signal.disconnect(_my_callback)
```

断开前始终检查是否已连接，并在 `_exit_tree()` 或不再需要连接时进行清理。

**Q5：什么是事件总线模式，何时应该使用它？**

事件总线是一个持有全局信号的单例（自动加载），用于全局游戏事件。用于需要被许多不相关系统监听的事件（game_over、achievement_unlocked）。不要用于紧密相关节点之间的本地通信。

**Q6：如何异步等待信号？**

```gdscript
await some_node.my_signal
# 或带超时
await get_tree().create_timer(5.0).timeout
```

### 快速参考

```
+=====================================================================+
|                    GODOT 信号快速参考                                 |
+=====================================================================+
|                                                                      |
|  声明信号:                                                            |
|  ------------------                                                  |
|  signal simple_signal                                                |
|  signal typed_signal(value: int, name: String)                       |
|                                                                      |
|  发射信号:                                                            |
|  -----------------                                                   |
|  simple_signal.emit()                                                |
|  typed_signal.emit(42, "test")                                       |
|                                                                      |
|  连接信号:                                                            |
|  -------------------                                                 |
|  emitter.signal.connect(callback)                                    |
|  emitter.signal.connect(callback, CONNECT_ONE_SHOT)                  |
|  emitter.signal.connect(callback.bind(extra_arg))                    |
|                                                                      |
|  断开连接:                                                            |
|  --------------                                                      |
|  emitter.signal.disconnect(callback)                                 |
|  if emitter.signal.is_connected(callback):                           |
|      emitter.signal.disconnect(callback)                             |
|                                                                      |
|  异步/等待:                                                           |
|  ------------                                                        |
|  var result = await emitter.signal                                   |
|  await get_tree().create_timer(1.0).timeout                          |
|                                                                      |
|  连接标志:                                                            |
|  -----------------                                                   |
|  CONNECT_DEFERRED    - 在下一个空闲帧调用                              |
|  CONNECT_ONE_SHOT    - 首次调用后自动断开                              |
|  CONNECT_REFERENCE_COUNTED - 引用计数连接                             |
|                                                                      |
+=====================================================================+
```

## 延伸阅读

### 官方文档

- [Godot 4.x 信号文档](https://docs.godotengine.org/en/stable/getting_started/step_by_step/signals.html)
- [GDScript 参考 - 信号](https://docs.godotengine.org/en/stable/tutorials/scripting/gdscript/gdscript_basics.html#signals)
- [使用信号的最佳实践](https://docs.godotengine.org/en/stable/tutorials/best_practices/scene_organization.html)

### 设计模式

- 观察者模式 - 四人帮设计模式
- 事件驱动架构
- 发布-订阅模式

### 相关主题

- Godot 分组（信号的一对多通信替代方案）
- Godot 协程和 Async/Await
- 基于资源的事件系统
- 带信号的状态机
- Godot 中的依赖注入

### 社区资源

- [GDQuest - Godot 信号教程](https://www.gdquest.com/)
- [Godot Recipes - 信号模式](https://kidscancode.org/godot_recipes/)
- [Godot 论坛 - 最佳实践讨论](https://godotforums.org/)
